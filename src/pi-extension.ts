import { writeFile } from "node:fs/promises";
import { buildArtifactCandidateDraft } from "./artifact-drafts.js";
import { formatDeltaOutcomeSummary, recordArtifactCandidateOutcomeWithStore, recordDeltaRecurrenceWithStore, summarizeDeltaOutcomes } from "./delta-outcomes.js";
import { askFlightLearnDeltaInbox, type FlightLearnDeltaInboxItem, type FlightLearnDeltaInboxResult } from "./flight-learn-inbox.js";
import { formatFlightRule, formatRuleCandidate, formatRuleInjectionBlock, formatRulesMarkdown } from "./flight-rules.js";
import { askReviewChoice, askReviewEditor, fallbackMessage, type ReviewChoice } from "./interactive-review.js";
import { compactSnippet } from "./redact.js";
import { normalizeFailureSignature } from "./signatures.js";
import { DEFAULT_SETTINGS, readSettings, updateSettings, type FlightRecorderSettings } from "./settings.js";
import type { LiveMode, LiveSuggestionDecision, LiveSuggestionEngine } from "./live-suggestions.js";
import { currentCwd, formatCaptureStatus, notify, optionlessText, parseFeedbackAction, parseLimit, parseMode, parseNumber, readOption, readRepeatedOption, resolveCwd, showLiveSuggestion, splitArgs } from "./pi-extension-command-utils.js";
import { eventMetadata, isRecord, toolResultFailed, toolResultQuery } from "./pi-extension-event-utils.js";
import type { LiveExtensionState, PiCommandContext, PiLike } from "./pi-extension-types.js";
import type { QueryOptions } from "./query.js";
import type { SyncOptions } from "./sync.js";
import { defaultDatabasePath, FlightRecorderStore, getDefaultDataDir } from "./storage.js";
import type { ArtifactCandidate, ArtifactCandidateOutcome, ArtifactCandidateType, DeltaDetectorSignal, ExpectationDelta, FeedbackAction, FeedbackTargetType, FlightRuleScope, NewFailureOccurrence, ReflectionProposal, SuggestionOutcome } from "./types.js";

const LEGACY_COMMAND_ALIASES_ENV = "PI_FLIGHT_RECORDER_LEGACY_COMMANDS";
const LEGACY_COMMAND_ALIASES_FLAG = "flight-recorder-legacy-commands";

function truthyOptIn(value: boolean | string | undefined): boolean {
  if (value === true) return true;
  if (typeof value !== "string") return false;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function legacyCommandAliasesEnabled(pi: PiLike): boolean {
  return truthyOptIn(process.env[LEGACY_COMMAND_ALIASES_ENV]) || truthyOptIn(pi.getFlag?.(LEGACY_COMMAND_ALIASES_FLAG));
}

function restAfterSubcommand(argsText: string, subcommand: string): string {
  return argsText.trimStart().slice(subcommand.length).trimStart();
}

function stateDataDir(state: LiveExtensionState): string {
  return state.dataDir ?? getDefaultDataDir();
}

async function switchDataDir(state: LiveExtensionState, dataDir: string | null): Promise<void> {
  if (!dataDir || dataDir === state.dataDir) return;
  await state.watcher?.stop();
  state.watcher = null;
  state.engine = null;
  state.bootstrapInFlight = null;
  state.bootstrapGeneration += 1;
  state.dataDir = dataDir;
  state.bootstrapped = false;
  state.lastOccurrenceId = null;
  state.lastSuppressionReason = null;
}

function applySettings(state: LiveExtensionState, settings: FlightRecorderSettings, dataDir: string): void {
  state.dataDir = dataDir;
  state.mode = settings.mode;
  state.sourceDirs = settings.sourceDirs;
  state.minConfidence = settings.minConfidence;
  state.cooldownMs = settings.cooldownMs;
  state.maxSuggestionsPerWindow = settings.maxSuggestionsPerWindow;
  state.autoStart = settings.autoStart;
  state.modelReflection = settings.modelReflection;
  state.reflectionOnSessionEnd = settings.reflectionOnSessionEnd;
  state.dailyDigest = settings.dailyDigest;
}

function liveEngineOptions(state: LiveExtensionState): { mode: LiveMode; dataDir: string; minConfidence?: number; cooldownMs?: number; maxSuggestionsPerWindow?: number } {
  const options: { mode: LiveMode; dataDir: string; minConfidence?: number; cooldownMs?: number; maxSuggestionsPerWindow?: number } = { mode: state.mode, dataDir: stateDataDir(state) };
  if (state.minConfidence !== undefined) options.minConfidence = state.minConfidence;
  if (state.cooldownMs !== undefined) options.cooldownMs = state.cooldownMs;
  if (state.maxSuggestionsPerWindow !== undefined) options.maxSuggestionsPerWindow = state.maxSuggestionsPerWindow;
  return options;
}

async function getLiveEngine(state: LiveExtensionState): Promise<LiveSuggestionEngine> {
  const { LiveSuggestionEngine: LiveSuggestionEngineImpl } = await import("./live-suggestions.js");
  const options = liveEngineOptions(state);
  if (!state.engine) state.engine = new LiveSuggestionEngineImpl(options);
  else state.engine.updateConfig(options);
  return state.engine;
}

async function persistSettingsFromState(state: LiveExtensionState): Promise<FlightRecorderSettings> {
  const patch: Partial<FlightRecorderSettings> = {
    mode: state.mode,
    sourceDirs: state.sourceDirs,
    autoStart: state.autoStart,
    modelReflection: state.modelReflection,
    reflectionOnSessionEnd: state.reflectionOnSessionEnd,
    dailyDigest: state.dailyDigest,
  };
  if (state.minConfidence !== undefined) patch.minConfidence = state.minConfidence;
  if (state.cooldownMs !== undefined) patch.cooldownMs = state.cooldownMs;
  if (state.maxSuggestionsPerWindow !== undefined) patch.maxSuggestionsPerWindow = state.maxSuggestionsPerWindow;
  return updateSettings(stateDataDir(state), patch);
}

async function startWatcherIfNeeded(ctx: PiCommandContext, state: LiveExtensionState): Promise<void> {
  if (!state.autoStart || state.mode === "off") return;
  const status = state.watcher?.status();
  if (status && (status.state === "active" || status.state === "catching-up" || status.state === "watched-by-another-process")) return;
  const { SessionWatchService } = await import("./watch-service.js");
  state.watcher = new SessionWatchService({
    dataDir: stateDataDir(state),
    sourceDirs: state.sourceDirs,
    mode: "index-only",
    onStatus: (watchStatus) => {
      if (watchStatus.state === "errored" && watchStatus.lastError) state.lastBootstrapError = watchStatus.lastError;
    },
  });
  const watchStatus = await state.watcher.start();
  if (watchStatus.state === "watched-by-another-process") {
    state.lastBootstrapError = watchStatus.lastError;
    if (watchStatus.lastError) notify(ctx, `Flight recorder autostart degraded: ${watchStatus.lastError}`, "warning");
    return;
  }
  if (watchStatus.state === "errored") {
    state.lastBootstrapError = watchStatus.lastError ?? watchStatus.state;
    notify(ctx, `Flight recorder autostart degraded: ${state.lastBootstrapError}`, "warning");
  }
}

async function ensureBootstrapped(ctx: PiCommandContext, state: LiveExtensionState, reason: string, startWatcher = true): Promise<void> {
  if (state.bootstrapInFlight) return state.bootstrapInFlight;
  if (state.bootstrapped && reason !== "command") return;
  const dataDir = stateDataDir(state);
  const generation = state.bootstrapGeneration;
  let bootstrapPromise: Promise<void> | null = null;
  bootstrapPromise = (async () => {
    try {
      const settings = await readSettings(dataDir);
      if (generation !== state.bootstrapGeneration) return;
      applySettings(state, settings, dataDir);
      state.lastBootstrapAt = new Date().toISOString();
      state.lastBootstrapError = null;
      state.bootstrapped = true;
      if (startWatcher) await startWatcherIfNeeded(ctx, state);
    } catch (error) {
      if (generation !== state.bootstrapGeneration) return;
      state.lastBootstrapError = error instanceof Error ? error.message : String(error);
      state.bootstrapped = true;
    } finally {
      if (bootstrapPromise && state.bootstrapInFlight === bootstrapPromise) state.bootstrapInFlight = null;
    }
  })();
  state.bootstrapInFlight = bootstrapPromise;
  return bootstrapPromise;
}

function scheduleBootstrap(ctx: PiCommandContext, state: LiveExtensionState, reason: string): void {
  setTimeout(() => {
    void ensureBootstrapped(ctx, state, reason);
  }, 0);
}

async function scheduleCurrentSessionSync(ctx: PiCommandContext, state: LiveExtensionState): Promise<void> {
  const sessionFile = ctx.sessionManager?.getSessionFile?.();
  if (!sessionFile) return;
  const dataDir = stateDataDir(state);
  setTimeout(() => {
    void import("./sync.js").then(({ syncSessionFile }) => syncSessionFile(sessionFile, { dataDir })).catch((error: unknown) => {
      state.lastBootstrapError = error instanceof Error ? error.message : String(error);
    });
  }, 500);
}

function decisionOutcome(decision: LiveSuggestionDecision): SuggestionOutcome {
  const at = new Date().toISOString();
  if (decision.kind === "suggestion") {
    return {
      kind: "suggested",
      reason: null,
      episodeId: decision.suggestion.episode.id,
      confidence: decision.suggestion.confidence,
      at,
    };
  }
  return {
    kind: "suppressed",
    reason: decision.reason,
    episodeId: decision.bestCandidate?.episode.id ?? null,
    confidence: decision.bestCandidate?.confidence ?? null,
    at,
  };
}

function notEvaluatedOutcome(reason: string): SuggestionOutcome {
  return { kind: "not-evaluated", reason, episodeId: null, confidence: null, at: new Date().toISOString() };
}

async function recordLiveFailure(params: {
  query: string;
  cwd: string | undefined;
  ctx: PiCommandContext;
  state: LiveExtensionState;
  source: "tool_result" | "user_bash";
  toolName: string | null;
  command: string | null;
  entryId: string | null;
  timestamp: string | null;
}): Promise<void> {
  const dataDir = stateDataDir(params.state);
  const sessionFile = params.ctx.sessionManager?.getSessionFile?.() ?? null;
  const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
  try {
    const occurrenceInput: NewFailureOccurrence = {
      source: params.source,
      query: params.query,
      toolName: params.toolName,
      command: params.command,
      cwd: params.cwd ?? null,
      sessionFile,
      entryId: params.entryId,
      timestamp: params.timestamp,
      data: { capture: params.source === "user_bash" ? "disabled-pre-exec-hook" : "live-tool-result" },
    };
    const occurrence = store.recordFailureOccurrence(occurrenceInput);
    params.state.lastOccurrenceId = occurrence.id;

    if (params.state.mode !== "suggest-on-failure") {
      const outcome = notEvaluatedOutcome(params.state.mode === "index-only" ? "index-only" : "mode-off");
      store.updateOccurrenceSuggestion(occurrence.id, outcome);
      params.state.lastSuppressionReason = outcome.reason;
      return;
    }

    const { formatLiveSuggestion } = await import("./live-suggestions.js");
    const engine = await getLiveEngine(params.state);
    const evaluationInput: { query: string; cwd?: string | null; source: "tool_result" | "user_bash"; signature: string } = {
      query: params.query,
      source: params.source,
      signature: occurrence.signature,
    };
    if (params.cwd !== undefined) evaluationInput.cwd = params.cwd;
    const decision = engine.evaluate(evaluationInput);
    const outcome = decisionOutcome(decision);
    store.updateOccurrenceSuggestion(occurrence.id, outcome);
    params.state.lastSuppressionReason = outcome.kind === "suppressed" ? outcome.reason : null;
    if (decision.kind === "suggestion") showLiveSuggestion(params.ctx, formatLiveSuggestion(decision));
  } finally {
    store.close();
  }
}

async function handleFlightSync(argsText: string, ctx: PiCommandContext): Promise<void> {
  const args = splitArgs(argsText);
  const dataDir = readOption(args, "--data-dir");
  const sourceDirs = readRepeatedOption(args, "--source");
  const limit = parseLimit(readOption(args, "--limit"));
  const force = args.includes("--force");
  const options: SyncOptions = { sourceDirs, force };
  if (dataDir) options.dataDir = dataDir;
  if (limit !== undefined) options.limit = limit;

  try {
    const { syncSessions } = await import("./sync.js");
    const result = await syncSessions(options);
    notify(
      ctx,
      `Flight recorder sync complete: indexed ${result.indexed}, skipped ${result.skipped}, episodes ${result.episodes}, warnings ${result.warnings}.`,
      "success",
    );
  } catch (error) {
    notify(ctx, `Flight recorder sync failed: ${error instanceof Error ? error.message : String(error)}`, "error");
  }
}

async function handleSeenThisBefore(argsText: string, ctx: PiCommandContext): Promise<void> {
  const args = splitArgs(argsText);
  const dataDir = readOption(args, "--data-dir") ?? undefined;
  const cwd = resolveCwd(readOption(args, "--cwd"), ctx);
  const limit = parseLimit(readOption(args, "--limit"));
  const query = optionlessText(args, ["--data-dir", "--cwd", "--limit"]);

  if (!query) {
    notify(ctx, "Usage: /flight-learn seen [--data-dir DIR] [--cwd current|PATH] [--limit N] <error text>", "error");
    return;
  }

  try {
    const options: QueryOptions = {};
    if (dataDir) options.dataDir = dataDir;
    if (cwd) options.cwd = cwd;
    if (limit !== undefined) options.limit = limit;
    const { formatSeenBefore, queryFailureMemory } = await import("./query.js");
    const result = queryFailureMemory(query, options);
    notify(ctx, formatSeenBefore(result), result.results.length > 0 ? "info" : "warning");
  } catch (error) {
    notify(ctx, `Flight recorder query failed: ${error instanceof Error ? error.message : String(error)}`, "error");
  }
}

async function handleFlightMode(argsText: string, ctx: PiCommandContext, state: LiveExtensionState): Promise<void> {
  const args = splitArgs(argsText);
  const dataDir = readOption(args, "--data-dir");
  await switchDataDir(state, dataDir);
  await ensureBootstrapped(ctx, state, "command", false);
  const subcommand = args[0] ?? "status";
  const requestedMode = parseMode(subcommand);
  const minConfidence = parseNumber(readOption(args, "--min-confidence"));
  const cooldownMs = parseNumber(readOption(args, "--cooldown-ms"));
  const maxSuggestions = parseLimit(readOption(args, "--max-suggestions"));

  if (minConfidence !== undefined) state.minConfidence = minConfidence;
  if (cooldownMs !== undefined) state.cooldownMs = cooldownMs;
  if (maxSuggestions !== undefined) state.maxSuggestionsPerWindow = maxSuggestions;

  if (subcommand === "pause") {
    state.mode = "off";
    state.autoStart = true;
  } else if (subcommand === "disable") {
    state.mode = "off";
    state.autoStart = false;
    await state.watcher?.stop();
    state.watcher = null;
  } else if (subcommand === "resume") {
    state.mode = DEFAULT_SETTINGS.mode;
    state.autoStart = true;
    await startWatcherIfNeeded(ctx, state);
  } else if (requestedMode) {
    state.mode = requestedMode;
    state.autoStart = requestedMode !== "off";
    if (requestedMode === "off") {
      await state.watcher?.stop();
      state.watcher = null;
    }
  } else if (subcommand !== "status") {
    notify(ctx, "Usage: /flight-status mode status|pause|resume|disable|off|index-only|suggest-on-failure [--data-dir DIR] [--min-confidence N] [--cooldown-ms N]", "error");
    return;
  }

  await persistSettingsFromState(state);
  const engine = await getLiveEngine(state);
  notify(ctx, `Flight recorder mode: ${state.mode}; autoStart=${state.autoStart}; data dir: ${stateDataDir(state)}; suggestions emitted=${engine.status().emittedInWindow}.`, "info");
}

function flightStatusHelp(): string {
  return [
    "Flight Status commands:",
    "- /flight-status [status]                Show capture/index/suggestion/rule/delta status",
    "- /flight-status mode status|pause|resume|disable|off|index-only|suggest-on-failure",
    "- /flight-status sync --source DIR ...    Manually index local Pi sessions",
    "- /flight-status watch status|stop|start  Inspect or control the local watcher",
    "- /flight-status rules status|pending|show|export",
    "Normal action/review command: /flight-learn",
  ].join("\n");
}

function flightLearnHelp(): string {
  return [
    "Flight Learn commands:",
    "- /flight-learn                           Guided learning inbox",
    "- /flight-learn seen <error text>          Search prior local fixes",
    "- /flight-learn reflect [--model]          Reflect on repeated local failures",
    "- /flight-learn review                     Guided reflection/rule review",
    "- /flight-learn delta-review               Guided expectation-delta routing",
    "- /flight-learn deltas ...                 Advanced delta list/show/route/outcome/recur/reject",
    "- /flight-learn feedback ...               Record suggestion/reflection feedback",
    "- /flight-learn rules ...                  Manage Flight Rule candidates and active rules",
    "Inspection/control command: /flight-status",
  ].join("\n");
}

async function handleFlightWatch(argsText: string, ctx: PiCommandContext, state: LiveExtensionState): Promise<void> {
  const args = splitArgs(argsText);
  const dataDir = readOption(args, "--data-dir");
  await switchDataDir(state, dataDir);
  await ensureBootstrapped(ctx, state, "command", false);
  const [subcommand = "status"] = args;
  const sourceDirs = readRepeatedOption(args, "--source");
  const requestedMode = parseMode(readOption(args, "--mode"));
  const debounceMs = parseNumber(readOption(args, "--debounce-ms"));
  if (sourceDirs.length > 0) state.sourceDirs = sourceDirs;
  if (requestedMode) state.mode = requestedMode;

  if (subcommand === "status") {
    await handleFlightStatus(restAfterSubcommand(argsText, subcommand), ctx, state);
    return;
  }

  if (subcommand === "stop") {
    await state.watcher?.stop();
    state.watcher = null;
    notify(ctx, "Flight recorder watcher stopped.", "success");
    return;
  }

  if (subcommand !== "start") {
    notify(ctx, "Usage: /flight-status watch start|stop|status [--source DIR ...] [--data-dir DIR] [--mode off|index-only|suggest-on-failure]", "error");
    return;
  }

  const { SessionWatchService } = await import("./watch-service.js");
  await state.watcher?.stop();
  const options: ConstructorParameters<typeof SessionWatchService>[0] = {
    sourceDirs: state.sourceDirs,
    mode: state.mode === "off" ? "index-only" : state.mode,
  };
  options.dataDir = stateDataDir(state);
  if (debounceMs !== undefined) options.debounceMs = debounceMs;
  state.watcher = new SessionWatchService(options);
  const status = await state.watcher.start();
  const level = status.state === "active" ? "success" : status.state === "watched-by-another-process" ? "info" : "warning";
  const sharedNote = status.state === "watched-by-another-process" ? " (shared with another Pi session)" : "";
  notify(ctx, `Flight recorder watcher ${status.state}${sharedNote}; mode ${state.mode}; watched files ${status.watchedPaths.length}.`, level);
}

async function handleFlightStatus(argsText: string, ctx: PiCommandContext, state: LiveExtensionState): Promise<void> {
  const args = splitArgs(argsText);
  const subcommand = args[0];
  if (subcommand && !subcommand.startsWith("--")) {
    const rest = restAfterSubcommand(argsText, subcommand);
    if (subcommand === "help") {
      notify(ctx, flightStatusHelp(), "info");
      return;
    }
    if (subcommand === "status") {
      await handleFlightStatus(rest, ctx, state);
      return;
    }
    if (subcommand === "sync") {
      await handleFlightSync(rest, ctx);
      return;
    }
    if (subcommand === "mode") {
      await handleFlightMode(rest || "status", ctx, state);
      return;
    }
    if (subcommand === "watch") {
      await handleFlightWatch(rest || "status", ctx, state);
      return;
    }
    if (subcommand === "rules") {
      await handleFlightRules(rest || "status", ctx, state);
      return;
    }
    notify(ctx, flightStatusHelp(), "error");
    return;
  }
  const dataDirArg = readOption(args, "--data-dir");
  await switchDataDir(state, dataDirArg);
  await ensureBootstrapped(ctx, state, "command", false);
  const dataDir = stateDataDir(state);
  const watchStatus = state.watcher?.status();
  const engine = await getLiveEngine(state);
  const engineStatus = engine.status();
  const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
  try {
    const recentFeedback = store.getFeedbackActions({ limit: 3 });
    const activeRuleCount = store.listFlightRules({ status: "active", limit: 100 }).length;
    const pendingRuleCount = store.listRuleCandidates({ status: "draft", limit: 100 }).length;
    const pendingDeltaCount = store.listExpectationDeltas({ status: "candidate", limit: 1_000 }).length;
    const deltaOutcomes = summarizeDeltaOutcomes(store, { limit: 20 });
    const lines = [
      `Flight recorder: ${state.mode} (${state.autoStart ? "autostart on" : "autostart off"})`,
      `Data dir: ${dataDir}`,
      `Capture/index: ${formatCaptureStatus(watchStatus)}`,
      `Failures captured: ${store.count("failure_occurrences")}; last occurrence: ${state.lastOccurrenceId ?? "none"}`,
      `Suggestions: minConfidence=${engineStatus.minConfidence.toFixed(2)}, emittedInWindow=${engineStatus.emittedInWindow}, last=${engineStatus.lastSuggestion?.episodeId ?? "none"}, last suppression=${state.lastSuppressionReason ?? "none"}`,
      `Reflection: session-end=${state.reflectionOnSessionEnd}, daily=${state.dailyDigest}, model=${state.modelReflection ? "enabled" : "disabled"}`,
      `Flight Rules: active=${activeRuleCount}, pending=${pendingRuleCount}, last injected=${state.lastInjectedRuleIds.join(", ") || "none"}`,
      `Deltas: pending=${pendingDeltaCount}, artifact candidates=${store.count("artifact_candidates")}`,
      `Delta outcomes: unresolved=${deltaOutcomes.counts.unresolved}, insufficient evidence=${deltaOutcomes.counts["insufficient-evidence"]}, no recurrence observed=${deltaOutcomes.counts["no-recurrence-observed"]}, recurring after applied=${deltaOutcomes.counts["recurring-after-applied"]}`,
      `Learning loop: run /flight-learn to review the next delta or outcome item.`,
      `User-bash capture: disabled (Pi user_bash is pre-execution; command semantics are not wrapped).`,
      `Errors: ${state.lastBootstrapError ?? (watchStatus?.state === "watched-by-another-process" ? null : watchStatus?.lastError) ?? "none"}`,
      `Recent feedback: ${recentFeedback.map((item) => `${item.action}:${item.targetType}/${item.targetId}`).join(", ") || "none"}`,
      "Privacy: local SQLite only by default; no model calls unless `/flight-learn reflect --model` or model reflection is enabled.",
    ];
    notify(ctx, lines.join("\n"), state.lastBootstrapError ? "warning" : "info");
  } finally {
    store.close();
  }
}

type FeedbackTargetResult = { targetType: FeedbackTargetType; targetId: string; signature: string | null; clusterId?: string } | { error: string } | null;

function feedbackTargetCount(args: string[]): number {
  return ["--occurrence", "--episode", "--cluster", "--proposal", "--signature"].filter((name) => readOption(args, name)).length;
}

function feedbackTarget(args: string[], store: FlightRecorderStore): FeedbackTargetResult {
  const occurrenceId = readOption(args, "--occurrence");
  if (occurrenceId) {
    const occurrence = store.getFailureOccurrence(occurrenceId);
    if (!occurrence) return { error: `No failure occurrence found for ${occurrenceId}.` };
    return { targetType: "occurrence", targetId: occurrenceId, signature: occurrence.signature };
  }
  const episodeId = readOption(args, "--episode");
  if (episodeId) {
    if (!store.getEpisode(episodeId)) return { error: `No failure episode found for ${episodeId}.` };
    return { targetType: "episode", targetId: episodeId, signature: null };
  }
  const clusterId = readOption(args, "--cluster");
  if (clusterId) {
    const cluster = store.getFailureCluster(clusterId);
    if (!cluster) return { error: `No failure cluster found for ${clusterId}.` };
    return { targetType: "cluster", targetId: clusterId, signature: cluster.representativeSignature, clusterId };
  }
  const proposalId = readOption(args, "--proposal");
  if (proposalId) {
    const proposal = store.getReflectionProposal(proposalId);
    if (!proposal) return { error: `No reflection proposal found for ${proposalId}.` };
    const cluster = store.getFailureCluster(proposal.clusterId);
    if (!cluster) return { error: `Reflection proposal ${proposalId} points at missing cluster ${proposal.clusterId}.` };
    return { targetType: "proposal", targetId: proposalId, signature: cluster.representativeSignature, clusterId: cluster.id };
  }
  const signatureText = readOption(args, "--signature");
  if (signatureText) {
    const signature = normalizeFailureSignature({ query: signatureText, signature: signatureText });
    return { targetType: "signature", targetId: signature, signature };
  }
  return null;
}

function clusterStatusForFeedback(action: FeedbackAction): "silenced" | "dismissed" | "promoted-later" | "make-rule" | null {
  if (action === "silence-pattern") return "silenced";
  if (action === "dismiss") return "dismissed";
  if (action === "promote-later") return "promoted-later";
  if (action === "make-rule") return "make-rule";
  return null;
}

function scopeFromText(value: string | null): FlightRuleScope | null {
  if (value === "global" || value === "project") return value;
  return null;
}

function proposalProjectRoot(proposal: ReflectionProposal, ctx: PiCommandContext): string | null {
  return currentCwd(ctx) ?? proposal.evidence.find((item) => item.cwd)?.cwd ?? null;
}

function actionChoices(includeMakeRule = true): Array<ReviewChoice<FeedbackAction>> {
  const choices: Array<ReviewChoice<FeedbackAction>> = [
    { value: "useful", label: "Useful", description: "Mark this proposal as helpful signal" },
    { value: "wrong-match", label: "Wrong match", description: "Record that this proposal grouped the wrong things" },
    { value: "snooze", label: "Snooze", description: "Hide this pattern temporarily" },
    { value: "silence-pattern", label: "Silence", description: "Hide this pattern until changed manually" },
    { value: "promote-later", label: "Promote later", description: "Store intent without activating a rule" },
  ];
  if (includeMakeRule) choices.splice(1, 0, { value: "make-rule", label: "Make Rule", description: "Draft and approve reusable guidance" });
  return choices;
}

function proposalReviewTitle(proposal: ReflectionProposal): string {
  return [
    "Action for Flight Recorder proposal",
    proposal.title,
    proposal.summary,
    `Likely fix/next step: ${compactSnippet(proposal.likelyFix.replace(/\s+/g, " "), 220)}`,
    `Confidence: ${proposal.confidence.toFixed(2)} (${proposal.mode}); Proposal: ${proposal.id}`,
  ].join("\n");
}

function proposalChoiceLabel(proposal: ReflectionProposal, index: number): string {
  const title = proposal.title.replace(/^Pattern:\s*/i, "");
  const fix = compactSnippet(proposal.likelyFix.replace(/\s+/g, " "), 90).replace(/\n/g, " ");
  return `${index + 1}. ${title} (${proposal.confidence.toFixed(2)}) — ${fix} [${proposal.id}]`;
}

function recordProposalFeedback(store: FlightRecorderStore, proposal: ReflectionProposal, action: FeedbackAction, durationMs?: number): void {
  const cluster = store.getFailureCluster(proposal.clusterId);
  const signature = cluster?.representativeSignature ?? null;
  const expiresAt = action === "snooze" ? new Date(Date.now() + (durationMs ?? 24 * 60 * 60 * 1000)).toISOString() : null;
  store.recordFeedbackAction({ targetType: "proposal", targetId: proposal.id, action, signature, expiresAt });
  const clusterStatus = clusterStatusForFeedback(action);
  if (clusterStatus && cluster) store.updateClusterStatus(cluster.id, clusterStatus);
}

async function draftCandidateForProposal(store: FlightRecorderStore, proposal: ReflectionProposal, ctx: PiCommandContext) {
  const { draftRuleFromProposal } = await import("./flight-rules.js");
  const draft = draftRuleFromProposal(proposal);
  const projectRoot = draft.proposedScope === "project" ? draft.projectRoot ?? proposalProjectRoot(proposal, ctx) : null;
  return store.createRuleCandidate({
    sourceType: "proposal",
    sourceId: proposal.id,
    clusterId: proposal.clusterId,
    draftText: draft.text,
    proposedScope: draft.proposedScope,
    projectRoot,
    evidence: proposal.evidence,
  });
}

async function handleMakeRuleProposal(store: FlightRecorderStore, proposal: ReflectionProposal, ctx: PiCommandContext, interactive: boolean, recordFeedback = false): Promise<void> {
  if (!interactive) {
    const candidate = await draftCandidateForProposal(store, proposal, ctx);
    notify(ctx, [`Flight rule candidate created: ${candidate.id}`, `Draft: ${candidate.draftText}`, `Next: /flight-learn rules approve --candidate ${candidate.id} --scope ${candidate.proposedScope}`].join("\n"), "success");
    return;
  }

  const { draftRuleFromProposal } = await import("./flight-rules.js");
  const draft = draftRuleFromProposal(proposal);
  const edit = await askReviewEditor(ctx, "Review Flight Rule draft", draft.text);
  if (edit.kind === "cancelled") {
    notify(ctx, fallbackMessage(edit.reason, `No rule candidate was created. Use /flight-learn feedback --action make-rule --proposal ${proposal.id} as a fallback.`), edit.reason === "no-ui" ? "warning" : "info");
    return;
  }
  const scope = await askReviewChoice(ctx, "Approve this Flight Rule?", [
    { value: "global", label: "Approve global", description: "Use across codebases" },
    { value: "project", label: "Approve project", description: "Use only in this project/cwd" },
    { value: "draft", label: "Save draft", description: "Keep candidate pending" },
    { value: "cancel", label: "Cancel", description: "Do not create a candidate" },
  ] as Array<ReviewChoice<"global" | "project" | "draft" | "cancel">>);
  if (scope.kind === "cancelled" || scope.value === "cancel") {
    notify(ctx, "Interactive rule creation cancelled; no rule candidate was created.", "info");
    return;
  }
  const proposedScope = scope.value === "draft" ? draft.proposedScope : scope.value;
  const projectRoot = proposedScope === "project" ? proposalProjectRoot(proposal, ctx) : null;
  let candidate = store.createRuleCandidate({
    sourceType: "proposal",
    sourceId: proposal.id,
    clusterId: proposal.clusterId,
    draftText: edit.text,
    proposedScope,
    projectRoot,
    evidence: proposal.evidence,
  });
  if (recordFeedback) recordProposalFeedback(store, proposal, "make-rule");
  if (scope.value === "draft") {
    notify(ctx, `Flight rule candidate saved as draft: ${candidate.id}.`, "success");
    return;
  }
  candidate = store.updateRuleCandidateDraft(candidate.id, edit.text, scope.value, projectRoot) ?? candidate;
  const rule = store.approveRuleCandidate(candidate.id, { scope: scope.value, text: candidate.draftText, projectRoot });
  if (!rule) {
    notify(ctx, `Could not approve rule candidate ${candidate.id}.`, "error");
    return;
  }
  notify(ctx, `Approved Flight Rule ${rule.id} (${rule.scope}). It will be considered for future turns.`, "success");
}

type DeltaRouteChoice = ArtifactCandidateType | "dismiss" | "cancel";

const ARTIFACT_ROUTE_CHOICES: Array<ReviewChoice<DeltaRouteChoice>> = [
  { value: "code-legibility", label: "Code legibility", description: "Create a refactor/readability route when code shape causes repeated confusion" },
  { value: "test-check", label: "Test/check", description: "Route to a missing or weak validation check" },
  { value: "loom-ticket", label: "Loom ticket", description: "Route to bounded implementation or cleanup work" },
  { value: "flight-rule", label: "Flight Rule", description: "Route to reusable assistant guidance, still requiring rule approval later" },
  { value: "loom-spec", label: "Loom spec", description: "Route to intended-behavior clarification" },
  { value: "loom-research", label: "Loom research", description: "Route to investigation before implementation" },
  { value: "loom-knowledge", label: "Loom knowledge", description: "Route to reusable project understanding" },
  { value: "prompt-context", label: "Prompt/context", description: "Route to project prompt or context documentation" },
  { value: "skill-or-template", label: "Skill/template", description: "Route to a reusable workflow or prompt template" },
  { value: "observe", label: "Observe/no artifact", description: "Keep evidence and watch recurrence without creating an artifact" },
  { value: "dismiss", label: "Dismiss", description: "Not a useful delta; keep evidence but close this candidate" },
  { value: "cancel", label: "Cancel", description: "Leave this delta unchanged" },
];

function artifactTypeFromText(value: string | null): ArtifactCandidateType | null {
  switch ((value ?? "").toLowerCase()) {
    case "flight-rule":
    case "rule":
      return "flight-rule";
    case "loom-ticket":
    case "ticket":
      return "loom-ticket";
    case "loom-spec":
    case "spec":
      return "loom-spec";
    case "loom-research":
    case "research":
      return "loom-research";
    case "loom-knowledge":
    case "knowledge":
      return "loom-knowledge";
    case "test-check":
    case "test":
    case "check":
      return "test-check";
    case "prompt-context":
    case "prompt":
    case "context":
      return "prompt-context";
    case "skill-or-template":
    case "skill":
    case "template":
      return "skill-or-template";
    case "code-legibility":
    case "code":
    case "refactor":
      return "code-legibility";
    case "observe":
    case "no-artifact":
    case "none":
      return "observe";
    default:
      return null;
  }
}

function artifactRouteLabel(type: ArtifactCandidateType): string {
  return ARTIFACT_ROUTE_CHOICES.find((choice) => choice.value === type)?.label ?? type;
}

function artifactOutcomeFromText(value: string | null): ArtifactCandidateOutcome | null {
  switch ((value ?? "").toLowerCase()) {
    case "pending":
    case "helped":
    case "no-change":
    case "worse":
    case "superseded":
    case "needs-reroute":
      return value as ArtifactCandidateOutcome;
    default:
      return null;
  }
}

function formatDeltaEvidence(delta: ExpectationDelta): string[] {
  if (delta.evidenceRefs.length === 0) return ["- no evidence refs recorded"];
  return delta.evidenceRefs.slice(0, 4).map((ref) => {
    const source = [ref.sourceType, ref.sourceId ?? ref.entryId].filter(Boolean).join("/") || ref.sourceType;
    const where = [ref.cwd, ref.sessionFile].filter(Boolean).join("; ") || "local source unknown";
    const snippet = ref.snippet ? ` :: ${compactSnippet(ref.snippet.replace(/\s+/g, " "), 160)}` : "";
    return `- ${source} (${where})${snippet}`;
  });
}

function formatDeltaSignals(signals: DeltaDetectorSignal[]): string[] {
  if (signals.length === 0) return ["- no detector signal recorded"];
  return signals.slice(0, 4).map((signal) => `- ${signal.type}${signal.confidence !== null ? ` (${signal.confidence.toFixed(2)})` : ""}: ${compactSnippet(signal.explanation.replace(/\s+/g, " "), 180)}`);
}

function deltaChoiceLabel(delta: ExpectationDelta, index: number): string {
  return `${index + 1}. ${delta.summary} [${delta.id}; ${delta.status}]`;
}

function deltaReviewText(delta: ExpectationDelta, signals: DeltaDetectorSignal[]): string {
  return [
    `Summary: ${delta.summary}`,
    "",
    "Expectation:",
    delta.expectation ?? "unknown",
    "",
    "Reality:",
    delta.reality ?? "unknown",
    "",
    "Impact:",
    delta.impact ?? "unknown",
    "",
    "Signals:",
    ...formatDeltaSignals(signals),
    "",
    "Evidence:",
    ...formatDeltaEvidence(delta),
  ].join("\n");
}

function sectionFromDraft(text: string, header: "Expectation" | "Reality" | "Impact"): string | null {
  const match = new RegExp(`^${header}:\\n([\\s\\S]*?)(?=\\n\\n(?:Expectation|Reality|Impact|Signals|Evidence):|$)`, "m").exec(text);
  const value = match?.[1]?.trim();
  return value && value !== "unknown" ? value : null;
}

function deltaFallbackUsage(deltaId?: string): string {
  const target = deltaId ? ` --delta ${deltaId}` : " --delta <id>";
  return `Use /flight-learn deltas list, /flight-learn deltas show${target}, /flight-learn deltas route${target} --type code-legibility --rationale "...", or /flight-learn deltas dismiss${target} --reason "...".`;
}

function deltaRouteTitle(delta: ExpectationDelta, signals: DeltaDetectorSignal[]): string {
  return [
    "Route expectation delta",
    `Delta: ${delta.summary}`,
    `Expectation: ${compactSnippet((delta.expectation ?? "unknown").replace(/\s+/g, " "), 180)}`,
    `Reality: ${compactSnippet((delta.reality ?? "unknown").replace(/\s+/g, " "), 180)}`,
    "Signals:",
    ...formatDeltaSignals(signals),
    "Evidence:",
    ...formatDeltaEvidence(delta).slice(0, 3),
  ].join("\n");
}

function acceptDeltaRefinement(store: FlightRecorderStore, delta: ExpectationDelta, reviewText: string): ExpectationDelta {
  const update: Parameters<typeof store.acceptExpectationDelta>[1] = {};
  const expectation = sectionFromDraft(reviewText, "Expectation");
  const reality = sectionFromDraft(reviewText, "Reality");
  const impact = sectionFromDraft(reviewText, "Impact");
  if (expectation !== null) update.expectation = expectation;
  if (reality !== null) update.reality = reality;
  if (impact !== null) update.impact = impact;
  return store.acceptExpectationDelta(delta.id, update) ?? delta;
}

function storeDeltaRoute(store: FlightRecorderStore, delta: ExpectationDelta, artifactType: ArtifactCandidateType, rationale: string, reviewText: string): ArtifactCandidate {
  const refined = acceptDeltaRefinement(store, delta, reviewText);
  const draft = buildArtifactCandidateDraft({ delta: refined, artifactType, rationale });
  const title = `${artifactRouteLabel(artifactType)}: ${refined.summary}`;
  const candidate = store.createArtifactCandidate({
    deltaId: refined.id,
    artifactType,
    title,
    rationale,
    proposedDraft: draft.proposedDraft,
    nextStep: draft.nextStep,
    confidence: draft.confidence,
    limits: draft.limits,
    evidenceRefs: refined.evidenceRefs,
  });
  return store.acceptArtifactCandidate(candidate.id) ?? candidate;
}

function deltaInboxItems(store: FlightRecorderStore, deltas: ExpectationDelta[]): FlightLearnDeltaInboxItem[] {
  return deltas.map((delta) => ({ delta, signals: store.listDeltaDetectorSignals(delta.id, 5) }));
}

type DeltaInboxRouteResult = Extract<FlightLearnDeltaInboxResult, { kind: "routed" | "route-selected" }>;

function reviewTextFromInboxResult(delta: ExpectationDelta, signals: DeltaDetectorSignal[], result: DeltaInboxRouteResult): string {
  return deltaReviewText({ ...delta, expectation: result.expectation, reality: result.reality, impact: result.impact }, signals);
}

function followupReasonPrefill(artifactType: ArtifactCandidateType): string {
  return artifactType === "observe"
    ? "I chose Observe because this may not need a durable follow-up yet; keep the evidence and watch whether it recurs."
    : `I chose ${artifactRouteLabel(artifactType)} because ...`;
}

function applyDeltaInboxResult(store: FlightRecorderStore, result: Exclude<FlightLearnDeltaInboxResult, { kind: "unavailable" | "route-selected" }>, ctx: PiCommandContext): void {
  if (result.kind === "cancelled") {
    notify(ctx, "Flight Learn inbox cancelled; no changes were applied.", "info");
    return;
  }
  if (result.kind === "skipped") {
    notify(ctx, `Skipped expectation delta ${result.deltaId}; no changes were recorded.`, "info");
    return;
  }
  if (result.kind === "dismissed") {
    const dismissed = store.dismissExpectationDelta(result.deltaId, result.reason);
    notify(ctx, dismissed ? `Dismissed expectation delta ${dismissed.id}; evidence provenance remains stored locally.` : `No expectation delta found for ${result.deltaId}.`, dismissed ? "success" : "error");
    return;
  }
  const delta = store.getExpectationDelta(result.deltaId);
  if (!delta) {
    notify(ctx, `No expectation delta found for ${result.deltaId}.`, "error");
    return;
  }
  const signals = store.listDeltaDetectorSignals(delta.id, 5);
  const candidate = storeDeltaRoute(store, delta, result.artifactType, result.rationale, reviewTextFromInboxResult(delta, signals, result));
  notify(ctx, [`Routed expectation delta ${delta.id} to ${artifactRouteLabel(candidate.artifactType)}.`, `Artifact candidate: ${candidate.id} [${candidate.status}; applied=${candidate.applied}]`, `Next step: ${candidate.nextStep ?? "review candidate draft"}`, "Draft/handoff text was stored locally. No artifact was created or applied."].join("\n"), "success");
}

async function maybeHandleDeltaInbox(store: FlightRecorderStore, deltas: ExpectationDelta[], ctx: PiCommandContext): Promise<boolean> {
  const result = await askFlightLearnDeltaInbox(ctx, { items: deltaInboxItems(store, deltas), routeChoices: ARTIFACT_ROUTE_CHOICES });
  if (result.kind === "unavailable") return false;
  if (result.kind === "route-selected") {
    const rationale = await askReviewEditor(ctx, "Why this follow-up?", followupReasonPrefill(result.artifactType));
    if (rationale.kind === "cancelled") {
      notify(ctx, fallbackMessage(rationale.reason, `/flight-learn deltas route --delta ${result.deltaId} --type ${result.artifactType} --rationale "..."`), rationale.reason === "no-ui" ? "warning" : "info");
      return true;
    }
    applyDeltaInboxResult(store, { ...result, kind: "routed", rationale: rationale.text }, ctx);
    return true;
  }
  applyDeltaInboxResult(store, result, ctx);
  return true;
}

async function prepareLearningDeltaCandidates(args: string[], state: LiveExtensionState): Promise<{ created: number; total: number }> {
  const minCount = parseLimit(readOption(args, "--min-count"));
  const limit = parseLimit(readOption(args, "--limit"));
  const { runReflection } = await import("./reflection.js");
  await runReflection({ dataDir: stateDataDir(state), trigger: "manual", ...(minCount !== undefined ? { minCount } : {}), ...(limit !== undefined ? { limit } : {}) });
  const { suggestDeltasFromExistingSignals } = await import("./delta-capture.js");
  const results = suggestDeltasFromExistingSignals({ dataDir: stateDataDir(state), ...(minCount !== undefined ? { minCount } : {}), ...(limit !== undefined ? { limit } : {}) });
  return { created: results.filter((result) => result.created).length, total: results.length };
}

async function handleFlightDeltaReview(argsText: string, ctx: PiCommandContext, state: LiveExtensionState): Promise<void> {
  const args = splitArgs(argsText);
  const dataDir = readOption(args, "--data-dir");
  await switchDataDir(state, dataDir);
  await ensureBootstrapped(ctx, state, "command", false);
  const explicitDeltaId = readOption(args, "--delta");
  const limit = parseLimit(readOption(args, "--limit")) ?? 8;
  const store = new FlightRecorderStore(defaultDatabasePath(stateDataDir(state)));
  try {
    const deltas = explicitDeltaId ? [store.getExpectationDelta(explicitDeltaId)].filter((delta): delta is ExpectationDelta => Boolean(delta)) : store.listExpectationDeltas({ status: "candidate", limit });
    if (deltas.length === 0) {
      notify(ctx, explicitDeltaId ? `No expectation delta found for ${explicitDeltaId}.` : "No pending expectation delta candidates are ready for review.", "warning");
      return;
    }
    if (await maybeHandleDeltaInbox(store, deltas, ctx)) return;
    let delta = deltas[0]!;
    if (!explicitDeltaId || deltas.length > 1) {
      const choice = await askReviewChoice(ctx, "Choose an expectation delta", deltas.map((item, index) => ({ value: item.id, label: deltaChoiceLabel(item, index) })));
      if (choice.kind === "cancelled") {
        notify(ctx, fallbackMessage(choice.reason, deltaFallbackUsage()), choice.reason === "no-ui" ? "warning" : "info");
        return;
      }
      delta = deltas.find((item) => item.id === choice.value) ?? delta;
    }
    const signals = store.listDeltaDetectorSignals(delta.id, 5);
    const review = await askReviewEditor(ctx, "Review expectation delta", deltaReviewText(delta, signals));
    if (review.kind === "cancelled") {
      notify(ctx, fallbackMessage(review.reason, deltaFallbackUsage(delta.id)), review.reason === "no-ui" ? "warning" : "info");
      return;
    }
    const route = await askReviewChoice(ctx, deltaRouteTitle(delta, signals), ARTIFACT_ROUTE_CHOICES);
    if (route.kind === "cancelled" || route.value === "cancel") {
      notify(ctx, route.kind === "cancelled" ? fallbackMessage(route.reason, deltaFallbackUsage(delta.id)) : "Delta review cancelled; no changes were applied.", route.kind === "cancelled" && route.reason === "no-ui" ? "warning" : "info");
      return;
    }
    if (route.value === "dismiss") {
      const dismissed = store.dismissExpectationDelta(delta.id, "Dismissed during manual delta review");
      notify(ctx, dismissed ? `Dismissed expectation delta ${dismissed.id}; evidence provenance remains stored locally.` : `No expectation delta found for ${delta.id}.`, dismissed ? "success" : "error");
      return;
    }
    const rationale = await askReviewEditor(ctx, "Why this follow-up?", followupReasonPrefill(route.value));
    if (rationale.kind === "cancelled") {
      notify(ctx, fallbackMessage(rationale.reason, `/flight-learn deltas route --delta ${delta.id} --type ${route.value} --rationale "..."`), rationale.reason === "no-ui" ? "warning" : "info");
      return;
    }
    const candidate = storeDeltaRoute(store, delta, route.value, rationale.text, review.text);
    notify(ctx, [`Routed expectation delta ${delta.id} to ${artifactRouteLabel(candidate.artifactType)}.`, `Artifact candidate: ${candidate.id} [${candidate.status}; applied=${candidate.applied}]`, `Next step: ${candidate.nextStep ?? "review candidate draft"}`, "Draft/handoff text was stored locally. No artifact was created or applied."].join("\n"), "success");
  } finally {
    store.close();
  }
}

function formatArtifactCandidateDetail(candidate: ArtifactCandidate | null, recurrenceCount = 0): string[] {
  if (!candidate) return ["Artifact candidate: none"];
  return [
    `Artifact candidate: ${candidate.id} [${candidate.artifactType}; ${candidate.status}; applied=${candidate.applied}]`,
    `Outcome: ${candidate.outcome}${candidate.outcomeSummary ? ` — ${candidate.outcomeSummary}` : ""}`,
    `Applied artifact: ${candidate.appliedArtifactRef ?? "none"}; applied at: ${candidate.appliedAt ?? "not recorded"}`,
    `Linked recurrences: ${recurrenceCount}`,
    `Why this follow-up: ${candidate.rationale}`,
    `Next step: ${candidate.nextStep ?? "unknown"}`,
    "Draft:",
    candidate.proposedDraft ?? "No draft stored.",
    "Limits:",
    ...(candidate.limits.length > 0 ? candidate.limits.map((limit) => `- ${limit}`) : ["- none recorded"]),
  ];
}

function formatArtifactCandidateWithRecurrence(store: FlightRecorderStore, candidate: ArtifactCandidate | null): string[] {
  const recurrenceCount = candidate ? store.listDeltaRecurrenceLinks({ priorArtifactCandidateId: candidate.id, limit: 1_000 }).length : 0;
  return formatArtifactCandidateDetail(candidate, recurrenceCount);
}

function listLearningFollowupCandidates(store: FlightRecorderStore, limit = 10): ArtifactCandidate[] {
  const candidates = [...store.listArtifactCandidates({ status: "accepted", limit: 1_000 }), ...store.listArtifactCandidates({ status: "applied", limit: 1_000 })];
  const seen = new Set<string>();
  return candidates
    .filter((candidate) => {
      if (seen.has(candidate.id)) return false;
      seen.add(candidate.id);
      return candidate.outcome === "unknown" || candidate.outcome === "pending";
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit);
}

function learningFollowupChoiceLabel(store: FlightRecorderStore, candidate: ArtifactCandidate, index: number): string {
  const delta = store.getExpectationDelta(candidate.deltaId);
  const summary = compactSnippet((delta?.summary ?? candidate.title).replace(/\s+/g, " "), 80);
  return `${index + 1}. ${artifactRouteLabel(candidate.artifactType)} — ${summary} [${candidate.id}; ${candidate.status}; outcome=${candidate.outcome}]`;
}

type LearningFollowupChoice = "mark-applied" | "helped" | "needs-reroute" | "no-change" | "reject" | "skip";

const LEARNING_FOLLOWUP_CHOICES: Array<ReviewChoice<LearningFollowupChoice>> = [
  { value: "mark-applied", label: "Marked applied", description: "I applied or used this candidate elsewhere; ask later whether it helped" },
  { value: "helped", label: "Helped", description: "Record that this human-applied route helped; if needed, mark it applied in the ledger only" },
  { value: "needs-reroute", label: "Needs reroute", description: "A similar delta recurred or the route is the wrong intervention" },
  { value: "no-change", label: "No change", description: "Tried it, but there was no observed improvement" },
  { value: "reject", label: "Reject", description: "Reject this candidate but keep its evidence/rationale history" },
  { value: "skip", label: "Skip", description: "Leave this candidate unchanged for later" },
];

function learningOutcomePrefill(choice: Exclude<LearningFollowupChoice, "mark-applied" | "reject" | "skip">): string {
  if (choice === "helped") return "What evidence suggests this helped? Keep this cautious, e.g. 'no recurrence observed in later similar work'.";
  if (choice === "needs-reroute") return "What recurred or why does this need a different route?";
  return "What was tried, and what did not change?";
}

function learningNoItemsMessage(store: FlightRecorderStore, prepared: { created: number; total: number }): string {
  const summary = formatDeltaOutcomeSummary(summarizeDeltaOutcomes(store, { limit: 5 }));
  return [
    "Flight Learn: nothing needs review right now.",
    prepared.total > 0 ? `Prepared ${prepared.total} local delta candidate(s), but none are pending review.` : "No repeated local pattern has enough evidence for a delta candidate yet.",
    "Keep working normally; Flight Recorder will capture failures and repeated friction locally.",
    "Normal commands to remember: /flight-learn to review the next item, /flight-status to check state.",
    "",
    summary,
  ].join("\n");
}

async function handleLearningFollowup(store: FlightRecorderStore, candidates: ArtifactCandidate[], ctx: PiCommandContext): Promise<void> {
  const choice = await askReviewChoice(ctx, "Choose an artifact candidate to follow up", candidates.map((candidate, index) => ({
    value: candidate.id,
    label: learningFollowupChoiceLabel(store, candidate, index),
  })));
  if (choice.kind === "cancelled") {
    notify(ctx, fallbackMessage(choice.reason, "Run /flight-learn in interactive Pi, use /flight-learn deltas apply|outcome|reject, or use the CLI delta debug commands."), choice.reason === "no-ui" ? "warning" : "info");
    return;
  }
  const candidate = candidates.find((item) => item.id === choice.value);
  if (!candidate) {
    notify(ctx, `Artifact candidate not found: ${choice.value}`, "error");
    return;
  }
  const action = await askReviewChoice(ctx, [
    "Follow up artifact candidate",
    ...formatArtifactCandidateWithRecurrence(store, candidate),
  ].join("\n"), LEARNING_FOLLOWUP_CHOICES);
  if (action.kind === "cancelled" || action.value === "skip") {
    notify(ctx, action.kind === "cancelled" ? fallbackMessage(action.reason, "Run /flight-learn later to continue.") : `Skipped ${candidate.id}; no changes recorded.`, action.kind === "cancelled" && action.reason === "no-ui" ? "warning" : "info");
    return;
  }
  if (action.value === "mark-applied") {
    const appliedRef = await askReviewEditor(ctx, "Applied artifact reference", candidate.appliedArtifactRef ?? "");
    if (appliedRef.kind === "cancelled") {
      notify(ctx, fallbackMessage(appliedRef.reason, `/flight-learn deltas apply --candidate ${candidate.id}`), appliedRef.reason === "no-ui" ? "warning" : "info");
      return;
    }
    const updated = store.markArtifactCandidateApplied(candidate.id, { appliedArtifactRef: appliedRef.text.trim() || null });
    notify(ctx, updated ? `Marked ${candidate.id} applied in the local ledger. Run /flight-learn later to record whether it helped.` : `No artifact candidate found for ${candidate.id}.`, updated ? "success" : "error");
    return;
  }
  if (action.value === "reject") {
    const reason = await askReviewEditor(ctx, "Reject reason", "Why is this not the right artifact route?");
    if (reason.kind === "cancelled") {
      notify(ctx, fallbackMessage(reason.reason, `/flight-learn deltas reject --candidate ${candidate.id} --reason "..."`), reason.reason === "no-ui" ? "warning" : "info");
      return;
    }
    const rejected = store.rejectArtifactCandidate(candidate.id, reason.text.trim() || "Rejected through /flight-learn");
    notify(ctx, rejected ? `Rejected ${candidate.id}; evidence and rationale remain stored locally.` : `No artifact candidate found for ${candidate.id}.`, rejected ? "success" : "error");
    return;
  }
  const note = await askReviewEditor(ctx, "Outcome note", learningOutcomePrefill(action.value));
  if (note.kind === "cancelled") {
    notify(ctx, fallbackMessage(note.reason, `/flight-learn deltas outcome --candidate ${candidate.id} --outcome ${action.value}`), note.reason === "no-ui" ? "warning" : "info");
    return;
  }
  const result = recordArtifactCandidateOutcomeWithStore(store, {
    candidateId: candidate.id,
    outcome: action.value,
    outcomeSummary: note.text.trim() || null,
    ...(!candidate.applied ? { appliedArtifactRef: candidate.appliedArtifactRef } : {}),
  });
  notify(ctx, result ? `Recorded outcome for ${result.candidate.id}: ${result.candidate.outcome} [${result.candidate.status}].` : `No artifact candidate found for ${candidate.id}.`, result ? "success" : "error");
}

function formatDeltaDetail(store: FlightRecorderStore, delta: ExpectationDelta): string {
  const signals = store.listDeltaDetectorSignals(delta.id, 5);
  const activeCandidate = delta.activeArtifactCandidateId ? store.getArtifactCandidate(delta.activeArtifactCandidateId) : null;
  return [
    `${delta.id} [${delta.status}]`,
    delta.summary,
    `Expectation: ${delta.expectation ?? "unknown"}`,
    `Reality: ${delta.reality ?? "unknown"}`,
    `Impact: ${delta.impact ?? "unknown"}`,
    `Active route: ${delta.activeArtifactCandidateId ?? "none"}`,
    ...formatArtifactCandidateWithRecurrence(store, activeCandidate),
    "Signals:",
    ...formatDeltaSignals(signals),
    "Evidence:",
    ...formatDeltaEvidence(delta),
  ].join("\n");
}

async function handleFlightLearn(argsText: string, ctx: PiCommandContext, state: LiveExtensionState): Promise<void> {
  const args = splitArgs(argsText);
  const subcommand = args[0];
  if (subcommand && !subcommand.startsWith("--")) {
    const rest = restAfterSubcommand(argsText, subcommand);
    if (subcommand === "help") {
      notify(ctx, flightLearnHelp(), "info");
      return;
    }
    if (subcommand === "seen" || subcommand === "query" || subcommand === "seen-this-before") {
      await handleSeenThisBefore(rest, ctx);
      return;
    }
    if (subcommand === "feedback") {
      await handleFlightFeedback(rest, ctx, state);
      return;
    }
    if (subcommand === "reflect") {
      await handleFlightReflect(rest, ctx, state);
      return;
    }
    if (subcommand === "review") {
      await handleFlightReview(rest, ctx, state);
      return;
    }
    if (subcommand === "delta-review") {
      await handleFlightDeltaReview(rest, ctx, state);
      return;
    }
    if (subcommand === "deltas") {
      await handleFlightDeltas(rest, ctx, state);
      return;
    }
    if (subcommand === "rules") {
      await handleFlightRules(rest, ctx, state);
      return;
    }
    notify(ctx, flightLearnHelp(), "error");
    return;
  }
  const dataDir = readOption(args, "--data-dir");
  await switchDataDir(state, dataDir);
  await ensureBootstrapped(ctx, state, "command", false);
  const prepared = await prepareLearningDeltaCandidates(args, state);
  let reviewDelta = false;
  const store = new FlightRecorderStore(defaultDatabasePath(stateDataDir(state)));
  try {
    const pendingDeltas = store.listExpectationDeltas({ status: "candidate", limit: 1 });
    if (pendingDeltas.length > 0) {
      notify(ctx, prepared.created > 0 ? `Flight Learn prepared ${prepared.created} new local delta candidate(s). Reviewing the next delta now.` : "Flight Learn: reviewing the next pending delta.", "info");
      reviewDelta = true;
    } else {
      const followups = listLearningFollowupCandidates(store, parseLimit(readOption(args, "--limit")) ?? 8);
      if (followups.length > 0) {
        await handleLearningFollowup(store, followups, ctx);
        return;
      }
      notify(ctx, learningNoItemsMessage(store, prepared), "info");
    }
  } finally {
    store.close();
  }
  if (reviewDelta) await handleFlightDeltaReview(argsText, ctx, state);
}

async function handleFlightDeltas(argsText: string, ctx: PiCommandContext, state: LiveExtensionState): Promise<void> {
  const args = splitArgs(argsText);
  const dataDir = readOption(args, "--data-dir");
  await switchDataDir(state, dataDir);
  await ensureBootstrapped(ctx, state, "command", false);
  const subcommand = args[0] ?? "list";
  const store = new FlightRecorderStore(defaultDatabasePath(stateDataDir(state)));
  try {
    if (subcommand === "list") {
      const status = readOption(args, "--status") as ExpectationDelta["status"] | null;
      const limit = parseLimit(readOption(args, "--limit")) ?? 10;
      const deltas = store.listExpectationDeltas({ ...(status ? { status } : { status: "candidate" }), limit });
      notify(ctx, deltas.length === 0 ? "No expectation deltas found." : ["Expectation deltas:", ...deltas.map((delta, index) => `- ${deltaChoiceLabel(delta, index)}`)].join("\n"), "info");
      return;
    }
    if (subcommand === "show") {
      const id = readOption(args, "--delta") ?? args[1];
      if (!id) {
        notify(ctx, "Usage: /flight-learn deltas show --delta delta_...", "error");
        return;
      }
      const delta = store.getExpectationDelta(id);
      notify(ctx, delta ? formatDeltaDetail(store, delta) : `No expectation delta found for ${id}.`, delta ? "info" : "error");
      return;
    }
    if (subcommand === "summary") {
      const limit = parseLimit(readOption(args, "--limit")) ?? 20;
      notify(ctx, formatDeltaOutcomeSummary(summarizeDeltaOutcomes(store, { limit })), "info");
      return;
    }
    if (subcommand === "apply") {
      const candidateId = readOption(args, "--candidate") ?? args[1];
      if (!candidateId) {
        notify(ctx, "Usage: /flight-learn deltas apply --candidate artifact_cand_... [--ref artifact-ref]", "error");
        return;
      }
      const candidate = store.markArtifactCandidateApplied(candidateId, { appliedArtifactRef: readOption(args, "--ref") });
      notify(ctx, candidate ? `Marked artifact candidate ${candidate.id} applied; outcome still requires recurrence evidence.` : `No artifact candidate found for ${candidateId}.`, candidate ? "success" : "error");
      return;
    }
    if (subcommand === "outcome") {
      const candidateId = readOption(args, "--candidate") ?? args[1];
      const outcome = artifactOutcomeFromText(readOption(args, "--outcome"));
      if (!candidateId || !outcome) {
        notify(ctx, "Usage: /flight-learn deltas outcome --candidate artifact_cand_... --outcome pending|helped|no-change|worse|superseded|needs-reroute [--note \"...\"] [--applied-ref ref]", "error");
        return;
      }
      const outcomeInput: Parameters<typeof recordArtifactCandidateOutcomeWithStore>[1] = { candidateId, outcome, outcomeSummary: readOption(args, "--note") };
      const appliedRef = readOption(args, "--applied-ref");
      if (appliedRef !== null) outcomeInput.appliedArtifactRef = appliedRef;
      const result = recordArtifactCandidateOutcomeWithStore(store, outcomeInput);
      notify(ctx, result ? `Recorded outcome for ${result.candidate.id}: ${result.candidate.outcome} [${result.candidate.status}]. Evidence/rationale history remains stored.` : `No artifact candidate found for ${candidateId}.`, result ? "success" : "error");
      return;
    }
    if (subcommand === "recur") {
      const deltaId = readOption(args, "--delta");
      const candidateId = readOption(args, "--candidate");
      const reason = readOption(args, "--reason");
      if (!deltaId || !candidateId || !reason) {
        notify(ctx, "Usage: /flight-learn deltas recur --delta delta_... --candidate artifact_cand_... --reason \"similar evidence\" [--similarity 0.8]", "error");
        return;
      }
      const recurrenceInput: Parameters<typeof recordDeltaRecurrenceWithStore>[1] = { deltaId, priorArtifactCandidateId: candidateId, reason };
      const similarity = parseNumber(readOption(args, "--similarity"));
      if (similarity !== undefined) recurrenceInput.similarity = similarity;
      const result = recordDeltaRecurrenceWithStore(store, recurrenceInput);
      notify(ctx, result ? `Linked recurrence ${result.link.id}; this is evidence of recurrence after application only if timestamps support it.` : `No matching delta/candidate found for delta=${deltaId} candidate=${candidateId}.`, result ? "success" : "error");
      return;
    }
    if (subcommand === "reject") {
      const candidateId = readOption(args, "--candidate") ?? args[1];
      const reason = readOption(args, "--reason") ?? "Rejected through fallback command";
      if (!candidateId) {
        notify(ctx, "Usage: /flight-learn deltas reject --candidate artifact_cand_... --reason \"...\"", "error");
        return;
      }
      const candidate = store.rejectArtifactCandidate(candidateId, reason);
      notify(ctx, candidate ? `Rejected artifact candidate ${candidate.id}; original route/evidence/rationale remain stored.` : `No artifact candidate found for ${candidateId}.`, candidate ? "success" : "error");
      return;
    }
    if (subcommand === "dismiss") {
      const id = readOption(args, "--delta") ?? args[1];
      const reason = readOption(args, "--reason") ?? "Dismissed through fallback command";
      if (!id) {
        notify(ctx, "Usage: /flight-learn deltas dismiss --delta delta_... --reason \"...\"", "error");
        return;
      }
      const delta = store.dismissExpectationDelta(id, reason);
      notify(ctx, delta ? `Dismissed expectation delta ${delta.id}; evidence remains stored locally.` : `No expectation delta found for ${id}.`, delta ? "success" : "error");
      return;
    }
    if (subcommand === "route") {
      const id = readOption(args, "--delta") ?? args[1];
      const artifactType = artifactTypeFromText(readOption(args, "--type"));
      const rationale = readOption(args, "--rationale");
      if (!id || !artifactType || !rationale) {
        notify(ctx, "Usage: /flight-learn deltas route --delta delta_... --type code-legibility|test-check|loom-ticket|flight-rule|loom-spec|loom-research|loom-knowledge|prompt-context|skill-or-template|observe --rationale \"...\"", "error");
        return;
      }
      const delta = store.getExpectationDelta(id);
      if (!delta) {
        notify(ctx, `No expectation delta found for ${id}.`, "error");
        return;
      }
      const reviewText = deltaReviewText({
        ...delta,
        expectation: readOption(args, "--expectation") ?? delta.expectation,
        reality: readOption(args, "--reality") ?? delta.reality,
        impact: readOption(args, "--impact") ?? delta.impact,
      }, store.listDeltaDetectorSignals(delta.id, 5));
      const candidate = storeDeltaRoute(store, delta, artifactType, rationale, reviewText);
      notify(ctx, [`Routed expectation delta ${delta.id} to ${artifactRouteLabel(candidate.artifactType)}.`, `Artifact candidate: ${candidate.id} [${candidate.status}; applied=${candidate.applied}]`, `Next step: ${candidate.nextStep ?? "review candidate draft"}`, "Draft/handoff text was stored locally. No artifact was created or applied."].join("\n"), "success");
      return;
    }
    notify(ctx, "Usage: /flight-learn deltas list|show|summary|route|apply|outcome|recur|reject|dismiss or /flight-learn delta-review for guided review.", "error");
  } finally {
    store.close();
  }
}

async function handleFlightFeedback(argsText: string, ctx: PiCommandContext, state: LiveExtensionState): Promise<void> {
  const args = splitArgs(argsText);
  const dataDir = readOption(args, "--data-dir");
  await switchDataDir(state, dataDir);
  await ensureBootstrapped(ctx, state, "command", false);
  const action = parseFeedbackAction(readOption(args, "--action") ?? args[0] ?? null);
  const note = readOption(args, "--note");
  const durationMs = parseNumber(readOption(args, "--duration-ms"));
  if (!action) {
    notify(ctx, "Usage: /flight-learn feedback --action useful|wrong-match|snooze|silence-pattern|promote-later|make-rule [--occurrence ID|--cluster ID|--proposal ID|--episode ID|--signature TEXT]", "error");
    return;
  }
  const store = new FlightRecorderStore(defaultDatabasePath(stateDataDir(state)));
  try {
    const targetCount = feedbackTargetCount(args);
    if (targetCount !== 1) {
      notify(ctx, "Flight feedback requires exactly one target: --occurrence, --cluster, --proposal, --episode, or --signature.", "error");
      return;
    }
    const target = feedbackTarget(args, store);
    if (!target) {
      notify(ctx, "Flight feedback requires one target: --occurrence, --cluster, --proposal, --episode, or --signature.", "error");
      return;
    }
    if ("error" in target) {
      notify(ctx, target.error, "error");
      return;
    }
    const expiresAt = action === "snooze" ? new Date(Date.now() + (durationMs ?? 24 * 60 * 60 * 1000)).toISOString() : null;
    const record = store.recordFeedbackAction({ targetType: target.targetType, targetId: target.targetId, action, signature: target.signature, note, expiresAt });
    const clusterStatus = clusterStatusForFeedback(action);
    if (clusterStatus && target.clusterId) store.updateClusterStatus(target.clusterId, clusterStatus);
    else if (clusterStatus && target.signature) store.updateClustersForSignature(target.signature, clusterStatus);
    if (action === "make-rule" && (target.targetType === "proposal" || target.targetType === "cluster")) {
      let proposal = target.targetType === "proposal" ? store.getReflectionProposal(target.targetId) : target.clusterId ? store.listReflectionProposals({ clusterId: target.clusterId, limit: 1 })[0] ?? null : null;
      if (!proposal && target.clusterId) {
        const cluster = store.getFailureCluster(target.clusterId);
        if (cluster) {
          const { generateReflectionProposal } = await import("./reflection.js");
          proposal = store.recordReflectionProposal(await generateReflectionProposal(store, cluster, { mode: "local" }));
        }
      }
      if (proposal) {
        await handleMakeRuleProposal(store, proposal, ctx, false);
        return;
      }
    }
    notify(ctx, `Recorded flight feedback #${record.id}: ${record.action} for ${record.targetType}/${record.targetId}.`, "success");
  } finally {
    store.close();
  }
}

async function loadReflectionProposals(args: string[], ctx: PiCommandContext, state: LiveExtensionState): Promise<ReflectionProposal[]> {
  const minCount = parseLimit(readOption(args, "--min-count"));
  const limit = parseLimit(readOption(args, "--limit"));
  const modelRequested = args.includes("--model");
  const { runReflection } = await import("./reflection.js");
  const options: Parameters<typeof runReflection>[0] = { dataDir: stateDataDir(state), trigger: "manual" };
  if (minCount !== undefined) options.minCount = minCount;
  if (limit !== undefined) options.limit = limit;
  if (modelRequested || state.modelReflection) options.useModel = true;
  if ((modelRequested || state.modelReflection) && ctx.model?.complete) options.modelProvider = { complete: ctx.model.complete };
  const result = await runReflection(options);
  if (result.proposals.length > 0) return result.proposals;
  const store = new FlightRecorderStore(defaultDatabasePath(stateDataDir(state)));
  try {
    return store.listReflectionProposals({ limit: limit ?? 10 });
  } finally {
    store.close();
  }
}

async function handleFlightReview(argsText: string, ctx: PiCommandContext, state: LiveExtensionState): Promise<void> {
  const args = splitArgs(argsText);
  const dataDir = readOption(args, "--data-dir");
  await switchDataDir(state, dataDir);
  await ensureBootstrapped(ctx, state, "command", false);
  const proposals = await loadReflectionProposals(args, ctx, state);
  if (proposals.length === 0) {
    notify(ctx, "Flight review: no reflection proposals are ready yet.", "warning");
    return;
  }
  const proposalChoice = await askReviewChoice(ctx, "Choose a Flight Recorder proposal", proposals.slice(0, 8).map((proposal, index) => ({
    value: proposal.id,
    label: proposalChoiceLabel(proposal, index),
  })));
  if (proposalChoice.kind === "cancelled") {
    notify(ctx, fallbackMessage(proposalChoice.reason, "Use /flight-learn feedback --action <action> --proposal <id> as a fallback."), proposalChoice.reason === "no-ui" ? "warning" : "info");
    return;
  }
  const proposal = proposals.find((item) => item.id === proposalChoice.value);
  if (!proposal) {
    notify(ctx, `Proposal not found: ${proposalChoice.value}`, "error");
    return;
  }
  const actionChoice = await askReviewChoice(ctx, proposalReviewTitle(proposal), actionChoices(true));
  if (actionChoice.kind === "cancelled") {
    notify(ctx, fallbackMessage(actionChoice.reason, `Use /flight-learn feedback --action <action> --proposal ${proposal.id} as a fallback.`), actionChoice.reason === "no-ui" ? "warning" : "info");
    return;
  }

  const store = new FlightRecorderStore(defaultDatabasePath(stateDataDir(state)));
  try {
    if (actionChoice.value === "make-rule") {
      await handleMakeRuleProposal(store, proposal, ctx, true, true);
      return;
    }
    recordProposalFeedback(store, proposal, actionChoice.value);
    notify(ctx, `Recorded ${actionChoice.value} for ${proposal.id}.`, "success");
  } finally {
    store.close();
  }
}

async function handleFlightReflect(argsText: string, ctx: PiCommandContext, state: LiveExtensionState): Promise<void> {
  const args = splitArgs(argsText);
  const dataDir = readOption(args, "--data-dir");
  await switchDataDir(state, dataDir);
  await ensureBootstrapped(ctx, state, "command", false);
  if (args.includes("--interactive")) {
    await handleFlightReview(argsText, ctx, state);
    return;
  }
  const minCount = parseLimit(readOption(args, "--min-count"));
  const limit = parseLimit(readOption(args, "--limit"));
  const modelRequested = args.includes("--model");
  const { formatReflectionDigest, runReflection } = await import("./reflection.js");
  const options: Parameters<typeof runReflection>[0] = { dataDir: stateDataDir(state), trigger: "manual" };
  if (minCount !== undefined) options.minCount = minCount;
  if (limit !== undefined) options.limit = limit;
  if (modelRequested || state.modelReflection) options.useModel = true;
  if ((modelRequested || state.modelReflection) && ctx.model?.complete) options.modelProvider = { complete: ctx.model.complete };
  const result = await runReflection(options);
  notify(ctx, formatReflectionDigest(result), result.proposals.length > 0 ? "info" : "warning");
}

function formatCandidateList(store: FlightRecorderStore): string {
  const candidates = store.listRuleCandidates({ status: "draft", limit: 10 });
  if (candidates.length === 0) return "Flight Rules: no pending candidates.";
  return ["Flight Rules pending:", ...candidates.map((candidate) => `- ${candidate.id} (${candidate.proposedScope}): ${candidate.draftText}`)].join("\n");
}

function formatRuleStatus(store: FlightRecorderStore): string {
  const rules = store.listFlightRules({ limit: 20 });
  const candidates = store.listRuleCandidates({ status: "draft", limit: 20 });
  if (rules.length === 0 && candidates.length === 0) return "Flight Rules: no active rules or pending candidates.";
  const lines = ["Flight Rules status:"];
  if (rules.length > 0) {
    lines.push("Active/disabled rules:");
    for (const rule of rules) lines.push(`- ${rule.id} [${rule.status}; ${rule.scope}; injected ${rule.injectionCount}]: ${rule.text}`);
  }
  if (candidates.length > 0) {
    lines.push("Pending candidates:");
    for (const candidate of candidates) lines.push(`- ${candidate.id} [${candidate.proposedScope}]: ${candidate.draftText}`);
  }
  return lines.join("\n");
}

async function handleFlightRules(argsText: string, ctx: PiCommandContext, state: LiveExtensionState): Promise<void> {
  const args = splitArgs(argsText);
  const dataDir = readOption(args, "--data-dir");
  await switchDataDir(state, dataDir);
  await ensureBootstrapped(ctx, state, "command", false);
  const subcommand = args[0] ?? "status";
  const store = new FlightRecorderStore(defaultDatabasePath(stateDataDir(state)));
  try {
    if (subcommand === "pending") {
      notify(ctx, formatCandidateList(store), "info");
      return;
    }
    if (subcommand === "status") {
      notify(ctx, formatRuleStatus(store), "info");
      return;
    }
    if (subcommand === "show") {
      const id = args[1] ?? readOption(args, "--candidate") ?? readOption(args, "--rule");
      if (!id) {
        notify(ctx, "Usage: /flight-learn rules show <candidate-or-rule-id>", "error");
        return;
      }
      const candidate = store.getRuleCandidate(id);
      const rule = store.getFlightRule(id);
      if (!candidate && !rule) {
        notify(ctx, `No Flight Rule candidate or rule found for ${id}.`, "error");
        return;
      }
      notify(ctx, candidate ? formatRuleCandidate(candidate) : formatFlightRule(rule!), "info");
      return;
    }
    if (subcommand === "approve") {
      const candidateId = readOption(args, "--candidate") ?? args[1];
      const scope = scopeFromText(readOption(args, "--scope")) ?? "global";
      if (!candidateId) {
        notify(ctx, "Usage: /flight-learn rules approve --candidate rule_cand_... --scope global|project", "error");
        return;
      }
      const candidate = store.getRuleCandidate(candidateId);
      if (!candidate) {
        notify(ctx, `No rule candidate found for ${candidateId}.`, "error");
        return;
      }
      const rule = store.approveRuleCandidate(candidate.id, { scope, projectRoot: scope === "project" ? currentCwd(ctx) ?? candidate.projectRoot : null });
      if (!rule) notify(ctx, `Could not approve ${candidate.id}.`, "error");
      else notify(ctx, `Approved Flight Rule ${rule.id} (${rule.scope}).`, "success");
      return;
    }
    if (subcommand === "reject") {
      const candidateId = readOption(args, "--candidate") ?? args[1];
      if (!candidateId) {
        notify(ctx, "Usage: /flight-learn rules reject --candidate rule_cand_...", "error");
        return;
      }
      const candidate = store.rejectRuleCandidate(candidateId);
      if (!candidate) notify(ctx, `No rule candidate found for ${candidateId}.`, "error");
      else notify(ctx, `Rejected rule candidate ${candidate.id}.`, "success");
      return;
    }
    if (subcommand === "disable") {
      const ruleId = readOption(args, "--rule") ?? args[1];
      if (!ruleId) {
        notify(ctx, "Usage: /flight-learn rules disable --rule rule_...", "error");
        return;
      }
      const rule = store.disableFlightRule(ruleId);
      if (!rule) notify(ctx, `No Flight Rule found for ${ruleId}.`, "error");
      else notify(ctx, `Disabled Flight Rule ${rule.id}.`, "success");
      return;
    }
    if (subcommand === "export") {
      const scope = scopeFromText(readOption(args, "--scope"));
      const rules = store.listFlightRules({ status: "active", ...(scope ? { scope } : {}), limit: 100 });
      const markdown = formatRulesMarkdown(rules);
      const output = readOption(args, "--output");
      if (output) {
        await writeFile(output, `${markdown}\n`);
        notify(ctx, `Exported ${rules.length} Flight Rule${rules.length === 1 ? "" : "s"} to ${output}.`, "success");
      } else {
        notify(ctx, markdown, "info");
      }
      return;
    }
    notify(ctx, "Usage: /flight-learn rules pending|status|show|approve|reject|disable|export", "error");
  } finally {
    store.close();
  }
}

async function handleToolResult(event: unknown, ctx: PiCommandContext, state: LiveExtensionState): Promise<void> {
  await ensureBootstrapped(ctx, state, "tool_result");
  if (state.mode === "off" || !toolResultFailed(event)) return;
  const query = toolResultQuery(event);
  if (query) {
    const meta = eventMetadata(event);
    await recordLiveFailure({ query, cwd: currentCwd(ctx), ctx, state, source: "tool_result", ...meta });
  }
  await scheduleCurrentSessionSync(ctx, state);
}

async function handleUserBash(_event: unknown, _ctx: PiCommandContext, _state: LiveExtensionState): Promise<void> {
  // Pi's user_bash event fires before execution. We keep this seam visible but
  // deliberately do not wrap shell execution, because result capture must not
  // mutate command semantics.
}

async function handleSessionShutdown(event: unknown, ctx: PiCommandContext, state: LiveExtensionState): Promise<void> {
  await state.watcher?.stop();
  state.watcher = null;
  if (!state.reflectionOnSessionEnd || state.mode === "off") return;
  const { formatReflectionDigest, runReflection } = await import("./reflection.js");
  const result = await runReflection({ dataDir: stateDataDir(state), trigger: "session-end", minCount: 3, limit: 3 });
  if (result.proposals.length > 0) notify(ctx, formatReflectionDigest(result), "info");
  void event;
}

async function handleBeforeAgentStart(event: unknown, ctx: PiCommandContext, state: LiveExtensionState): Promise<unknown> {
  await ensureBootstrapped(ctx, state, "before_agent_start", false);
  const cwd = currentCwd(ctx) ?? (isRecord(event) && isRecord(event.systemPromptOptions) && typeof event.systemPromptOptions.cwd === "string" ? event.systemPromptOptions.cwd : null);
  const store = new FlightRecorderStore(defaultDatabasePath(stateDataDir(state)));
  try {
    const rules = store.listActiveFlightRulesForCwd(cwd, 5);
    const block = formatRuleInjectionBlock(rules, { maxRules: 5 });
    state.lastInjectedRuleIds = rules.map((rule) => rule.id);
    if (!block) return undefined;
    store.markFlightRulesInjected(state.lastInjectedRuleIds);
    if (isRecord(event) && typeof event.systemPrompt === "string") {
      return { systemPrompt: `${event.systemPrompt}\n\n${block}` };
    }
    return { message: { customType: "pi-flight-recorder-rules", content: block, display: true } };
  } finally {
    store.close();
  }
}

export default function piFlightRecorderExtension(pi: PiLike): void {
  const state: LiveExtensionState = {
    mode: DEFAULT_SETTINGS.mode,
    sourceDirs: [],
    watcher: null,
    engine: null,
    bootstrapped: false,
    bootstrapInFlight: null,
    bootstrapGeneration: 0,
    autoStart: DEFAULT_SETTINGS.autoStart,
    modelReflection: DEFAULT_SETTINGS.modelReflection,
    reflectionOnSessionEnd: DEFAULT_SETTINGS.reflectionOnSessionEnd,
    dailyDigest: DEFAULT_SETTINGS.dailyDigest,
    lastBootstrapAt: null,
    lastBootstrapError: null,
    lastOccurrenceId: null,
    lastSuppressionReason: null,
    lastInjectedRuleIds: [],
  };

  pi.registerFlag?.(LEGACY_COMMAND_ALIASES_FLAG, {
    description: `Developer/debug opt-in: register legacy pi-flight-recorder slash command aliases. Environment alternative: ${LEGACY_COMMAND_ALIASES_ENV}=1`,
    type: "boolean",
    default: false,
  });

  pi.registerCommand?.("flight-status", {
    description: "Show pi-flight-recorder status; subcommands: help, sync, mode, watch, rules",
    handler: (args, ctx) => handleFlightStatus(args, ctx, state),
  });

  pi.registerCommand?.("flight-learn", {
    description: "Guided learning inbox; subcommands: help, seen, reflect, review, delta-review, deltas, feedback, rules",
    handler: (args, ctx) => handleFlightLearn(args, ctx, state),
  });

  if (legacyCommandAliasesEnabled(pi)) {
    pi.registerCommand?.("flight-sync", {
      description: "Legacy/debug alias for /flight-status sync",
      handler: handleFlightSync,
    });

    pi.registerCommand?.("seen-this-before", {
      description: "Legacy/debug alias for /flight-learn seen",
      handler: handleSeenThisBefore,
    });

    pi.registerCommand?.("flight-mode", {
      description: "Legacy/debug alias for /flight-status mode",
      handler: (args, ctx) => handleFlightMode(args, ctx, state),
    });

    pi.registerCommand?.("flight-watch", {
      description: "Legacy/debug alias for /flight-status watch",
      handler: (args, ctx) => handleFlightWatch(args, ctx, state),
    });

    pi.registerCommand?.("flight-feedback", {
      description: "Legacy/debug alias for /flight-learn feedback",
      handler: (args, ctx) => handleFlightFeedback(args, ctx, state),
    });

    pi.registerCommand?.("flight-reflect", {
      description: "Legacy/debug alias for /flight-learn reflect",
      handler: (args, ctx) => handleFlightReflect(args, ctx, state),
    });

    pi.registerCommand?.("flight-review", {
      description: "Legacy/debug alias for /flight-learn review",
      handler: (args, ctx) => handleFlightReview(args, ctx, state),
    });

    pi.registerCommand?.("flight-delta-review", {
      description: "Legacy/debug alias for /flight-learn delta-review",
      handler: (args, ctx) => handleFlightDeltaReview(args, ctx, state),
    });

    pi.registerCommand?.("flight-deltas", {
      description: "Legacy/debug alias for /flight-learn deltas",
      handler: (args, ctx) => handleFlightDeltas(args, ctx, state),
    });

    pi.registerCommand?.("flight-rules", {
      description: "Legacy/debug alias for /flight-learn rules",
      handler: (args, ctx) => handleFlightRules(args, ctx, state),
    });
  }

  pi.on?.("session_start", (_event, ctx) => {
    scheduleBootstrap(ctx, state, "session_start");
  });
  pi.on?.("tool_result", (event, ctx) => handleToolResult(event, ctx, state));
  pi.on?.("user_bash", (event, ctx) => handleUserBash(event, ctx, state));
  pi.on?.("session_shutdown", (event, ctx) => handleSessionShutdown(event, ctx, state));
  pi.on?.("before_agent_start", (event, ctx) => handleBeforeAgentStart(event, ctx, state));

  pi.registerTool?.({
    name: "flight_seen_this_before",
    label: "Seen This Before",
    description: "Search local pi-flight-recorder failure memory for prior matching failures and fixes.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Error text, command output, stack trace, or failure description." },
        dataDir: { type: "string", description: "Optional pi-flight-recorder data directory." },
        cwd: { type: "string", description: "Optional cwd filter." },
        limit: { type: "number", description: "Maximum number of results." },
      },
      required: ["query"],
    },
    async execute(_toolCallId: string, params: { query: string; dataDir?: string; cwd?: string; limit?: number }) {
      const options: QueryOptions = {};
      if (params.dataDir) options.dataDir = params.dataDir;
      if (params.cwd) options.cwd = params.cwd;
      if (params.limit !== undefined) options.limit = params.limit;
      const { formatSeenBefore, queryFailureMemory } = await import("./query.js");
      const result = queryFailureMemory(params.query, options);
      return {
        content: [{ type: "text", text: formatSeenBefore(result) }],
        details: { resultCount: result.results.length },
      };
    },
  });
}
