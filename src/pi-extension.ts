import { contentToText } from "./session-parser.js";
import { normalizeFailureSignature } from "./signatures.js";
import { DEFAULT_SETTINGS, readSettings, updateSettings, type FlightRecorderSettings } from "./settings.js";
import type { LiveMode, LiveSuggestionDecision, LiveSuggestionEngine } from "./live-suggestions.js";
import type { QueryOptions } from "./query.js";
import type { SyncOptions } from "./sync.js";
import { defaultDatabasePath, FlightRecorderStore, getDefaultDataDir } from "./storage.js";
import type { FeedbackAction, FeedbackTargetType, NewFailureOccurrence, SuggestionOutcome } from "./types.js";
import type { SessionWatchService } from "./watch-service.js";

interface PiLike {
  registerCommand?: (name: string, command: { description: string; handler: (args: string, ctx: PiCommandContext) => Promise<void> }) => void;
  registerTool?: (tool: unknown) => void;
  on?: (eventName: string, handler: (event: unknown, ctx: PiCommandContext) => Promise<void> | void) => void;
}

interface PiCommandContext {
  cwd?: string;
  ui?: {
    notify?: (message: string, level?: "info" | "error" | "success" | "warning") => void;
  };
  sessionManager?: {
    getCwd?: () => string;
    getSessionFile?: () => string | null;
  };
  model?: {
    complete?: (prompt: string) => Promise<string>;
  };
}

interface LiveExtensionState {
  mode: LiveMode;
  dataDir?: string;
  sourceDirs: string[];
  minConfidence?: number;
  cooldownMs?: number;
  maxSuggestionsPerWindow?: number;
  watcher: SessionWatchService | null;
  engine: LiveSuggestionEngine | null;
  bootstrapped: boolean;
  bootstrapInFlight: Promise<void> | null;
  autoStart: boolean;
  modelReflection: boolean;
  reflectionOnSessionEnd: boolean;
  dailyDigest: boolean;
  lastBootstrapAt: string | null;
  lastBootstrapError: string | null;
  lastOccurrenceId: string | null;
  lastSuppressionReason: string | null;
}

function splitArgs(input: string): string[] {
  const result: string[] = [];
  const pattern = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(input)) !== null) {
    result.push(match[1] ?? match[2] ?? match[3] ?? "");
  }
  return result;
}

function readOption(args: string[], name: string): string | null {
  const index = args.indexOf(name);
  if (index === -1) return null;
  return args[index + 1] ?? null;
}

function readRepeatedOption(args: string[], name: string): string[] {
  const values: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index + 1];
    if (args[index] === name && value) values.push(value);
  }
  return values;
}

function parseLimit(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function parseNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function parseMode(value: string | null): LiveMode | null {
  if (value === "off" || value === "index-only" || value === "suggest-on-failure") return value;
  return null;
}

function parseFeedbackAction(value: string | null): FeedbackAction | null {
  const allowed = new Set<FeedbackAction>(["useful", "wrong-match", "already-solved", "not-useful", "snooze", "silence-pattern", "promote-later", "make-rule", "dismiss"]);
  return value && allowed.has(value as FeedbackAction) ? value as FeedbackAction : null;
}

function notify(ctx: PiCommandContext, message: string, level: "info" | "error" | "success" | "warning" = "info"): void {
  ctx.ui?.notify?.(message, level);
}

function currentCwd(ctx: PiCommandContext): string | undefined {
  return ctx.cwd ?? ctx.sessionManager?.getCwd?.();
}

function resolveCwd(value: string | null, ctx: PiCommandContext): string | undefined {
  if (!value) return undefined;
  if (value === "current") return currentCwd(ctx);
  return value;
}

function optionlessText(args: string[], optionNames: string[]): string {
  return args.filter((arg, index) => {
    const previous = args[index - 1];
    return !optionNames.includes(arg) && !optionNames.includes(previous ?? "");
  }).join(" ").trim();
}

function stateDataDir(state: LiveExtensionState): string {
  return state.dataDir ?? getDefaultDataDir();
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
  if (watchStatus.state === "errored" || watchStatus.state === "watched-by-another-process") {
    state.lastBootstrapError = watchStatus.lastError ?? watchStatus.state;
    notify(ctx, `Flight recorder autostart degraded: ${state.lastBootstrapError}`, "warning");
  }
}

async function ensureBootstrapped(ctx: PiCommandContext, state: LiveExtensionState, reason: string): Promise<void> {
  if (state.bootstrapInFlight) return state.bootstrapInFlight;
  if (state.bootstrapped && reason !== "command") return;
  const dataDir = stateDataDir(state);
  state.bootstrapInFlight = (async () => {
    try {
      const settings = await readSettings(dataDir);
      applySettings(state, settings, dataDir);
      state.lastBootstrapAt = new Date().toISOString();
      state.lastBootstrapError = null;
      state.bootstrapped = true;
      await startWatcherIfNeeded(ctx, state);
    } catch (error) {
      state.lastBootstrapError = error instanceof Error ? error.message : String(error);
      state.bootstrapped = true;
    } finally {
      state.bootstrapInFlight = null;
    }
  })();
  return state.bootstrapInFlight;
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
    if (decision.kind === "suggestion") notify(params.ctx, formatLiveSuggestion(decision), "warning");
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
    notify(ctx, "Usage: /seen-this-before [--data-dir DIR] [--cwd current|PATH] [--limit N] <error text>", "error");
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
  await ensureBootstrapped(ctx, state, "command");
  const args = splitArgs(argsText);
  const subcommand = args[0] ?? "status";
  const requestedMode = parseMode(subcommand);
  const dataDir = readOption(args, "--data-dir");
  const minConfidence = parseNumber(readOption(args, "--min-confidence"));
  const cooldownMs = parseNumber(readOption(args, "--cooldown-ms"));
  const maxSuggestions = parseLimit(readOption(args, "--max-suggestions"));

  if (dataDir) state.dataDir = dataDir;
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
    } else {
      await startWatcherIfNeeded(ctx, state);
    }
  } else if (subcommand !== "status") {
    notify(ctx, "Usage: /flight-mode status|pause|resume|disable|off|index-only|suggest-on-failure [--data-dir DIR] [--min-confidence N] [--cooldown-ms N]", "error");
    return;
  }

  await persistSettingsFromState(state);
  const engine = await getLiveEngine(state);
  notify(ctx, `Flight recorder mode: ${state.mode}; autoStart=${state.autoStart}; data dir: ${stateDataDir(state)}; suggestions emitted=${engine.status().emittedInWindow}.`, "info");
}

async function handleFlightWatch(argsText: string, ctx: PiCommandContext, state: LiveExtensionState): Promise<void> {
  await ensureBootstrapped(ctx, state, "command");
  const args = splitArgs(argsText);
  const [subcommand = "status"] = args;
  const dataDir = readOption(args, "--data-dir");
  const sourceDirs = readRepeatedOption(args, "--source");
  const requestedMode = parseMode(readOption(args, "--mode"));
  const debounceMs = parseNumber(readOption(args, "--debounce-ms"));
  if (dataDir) state.dataDir = dataDir;
  if (sourceDirs.length > 0) state.sourceDirs = sourceDirs;
  if (requestedMode) state.mode = requestedMode;

  if (subcommand === "status") {
    await handleFlightStatus(argsText, ctx, state);
    return;
  }

  if (subcommand === "stop") {
    await state.watcher?.stop();
    state.watcher = null;
    notify(ctx, "Flight recorder watcher stopped.", "success");
    return;
  }

  if (subcommand !== "start") {
    notify(ctx, "Usage: /flight-watch start|stop|status [--source DIR ...] [--data-dir DIR] [--mode off|index-only|suggest-on-failure]", "error");
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
  notify(ctx, `Flight recorder watcher ${status.state}; mode ${state.mode}; watched files ${status.watchedPaths.length}.`, status.state === "active" ? "success" : "warning");
}

async function handleFlightStatus(_argsText: string, ctx: PiCommandContext, state: LiveExtensionState): Promise<void> {
  await ensureBootstrapped(ctx, state, "command");
  const dataDir = stateDataDir(state);
  const watchStatus = state.watcher?.status();
  const engine = await getLiveEngine(state);
  const engineStatus = engine.status();
  const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
  try {
    const recentFeedback = store.getFeedbackActions({ limit: 3 });
    const lines = [
      `Flight recorder: ${state.mode} (${state.autoStart ? "autostart on" : "autostart off"})`,
      `Data dir: ${dataDir}`,
      `Capture/index: ${watchStatus ? `${watchStatus.state}; watched ${watchStatus.watchedPaths.length}; last sync ${watchStatus.lastSyncAt ?? "never"}` : "not watching"}`,
      `Failures captured: ${store.count("failure_occurrences")}; last occurrence: ${state.lastOccurrenceId ?? "none"}`,
      `Suggestions: minConfidence=${engineStatus.minConfidence.toFixed(2)}, emittedInWindow=${engineStatus.emittedInWindow}, last=${engineStatus.lastSuggestion?.episodeId ?? "none"}, last suppression=${state.lastSuppressionReason ?? "none"}`,
      `Reflection: session-end=${state.reflectionOnSessionEnd}, daily=${state.dailyDigest}, model=${state.modelReflection ? "enabled" : "disabled"}`,
      `User-bash capture: disabled (Pi user_bash is pre-execution; command semantics are not wrapped).`,
      `Errors: ${state.lastBootstrapError ?? watchStatus?.lastError ?? "none"}`,
      `Recent feedback: ${recentFeedback.map((item) => `${item.action}:${item.targetType}/${item.targetId}`).join(", ") || "none"}`,
      "Privacy: local SQLite only by default; no model calls unless `/flight-reflect --model` or model reflection is enabled.",
    ];
    notify(ctx, lines.join("\n"), state.lastBootstrapError ? "warning" : "info");
  } finally {
    store.close();
  }
}

function feedbackTarget(args: string[], store: FlightRecorderStore): { targetType: FeedbackTargetType; targetId: string; signature: string | null } | null {
  const occurrenceId = readOption(args, "--occurrence");
  if (occurrenceId) {
    const occurrence = store.getFailureOccurrence(occurrenceId);
    return { targetType: "occurrence", targetId: occurrenceId, signature: occurrence?.signature ?? null };
  }
  const episodeId = readOption(args, "--episode");
  if (episodeId) return { targetType: "episode", targetId: episodeId, signature: null };
  const clusterId = readOption(args, "--cluster");
  if (clusterId) {
    const cluster = store.getFailureCluster(clusterId);
    return { targetType: "cluster", targetId: clusterId, signature: cluster?.representativeSignature ?? null };
  }
  const proposalId = readOption(args, "--proposal");
  if (proposalId) {
    const proposal = store.getReflectionProposal(proposalId);
    const cluster = proposal ? store.getFailureCluster(proposal.clusterId) : null;
    return { targetType: "proposal", targetId: proposalId, signature: cluster?.representativeSignature ?? null };
  }
  const signatureText = readOption(args, "--signature");
  if (signatureText) return { targetType: "signature", targetId: normalizeFailureSignature({ query: signatureText, signature: signatureText }), signature: normalizeFailureSignature({ query: signatureText, signature: signatureText }) };
  return null;
}

async function handleFlightFeedback(argsText: string, ctx: PiCommandContext, state: LiveExtensionState): Promise<void> {
  await ensureBootstrapped(ctx, state, "command");
  const args = splitArgs(argsText);
  const dataDir = readOption(args, "--data-dir");
  if (dataDir) state.dataDir = dataDir;
  const action = parseFeedbackAction(readOption(args, "--action") ?? args[0] ?? null);
  const note = readOption(args, "--note");
  const durationMs = parseNumber(readOption(args, "--duration-ms"));
  if (!action) {
    notify(ctx, "Usage: /flight-feedback --action useful|wrong-match|snooze|silence-pattern|promote-later|make-rule [--occurrence ID|--cluster ID|--proposal ID|--episode ID|--signature TEXT]", "error");
    return;
  }
  const store = new FlightRecorderStore(defaultDatabasePath(stateDataDir(state)));
  try {
    const target = feedbackTarget(args, store);
    if (!target) {
      notify(ctx, "Flight feedback requires one target: --occurrence, --cluster, --proposal, --episode, or --signature.", "error");
      return;
    }
    const expiresAt = action === "snooze" ? new Date(Date.now() + (durationMs ?? 24 * 60 * 60 * 1000)).toISOString() : null;
    const record = store.recordFeedbackAction({ targetType: target.targetType, targetId: target.targetId, action, signature: target.signature, note, expiresAt });
    if (target.targetType === "cluster") {
      if (action === "snooze") store.updateClusterStatus(target.targetId, "snoozed");
      if (action === "silence-pattern") store.updateClusterStatus(target.targetId, "silenced");
      if (action === "dismiss") store.updateClusterStatus(target.targetId, "dismissed");
      if (action === "promote-later") store.updateClusterStatus(target.targetId, "promoted-later");
      if (action === "make-rule") store.updateClusterStatus(target.targetId, "make-rule");
    }
    notify(ctx, `Recorded flight feedback #${record.id}: ${record.action} for ${record.targetType}/${record.targetId}.`, "success");
  } finally {
    store.close();
  }
}

async function handleFlightReflect(argsText: string, ctx: PiCommandContext, state: LiveExtensionState): Promise<void> {
  await ensureBootstrapped(ctx, state, "command");
  const args = splitArgs(argsText);
  const dataDir = readOption(args, "--data-dir");
  if (dataDir) state.dataDir = dataDir;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}

function nestedExitCode(value: unknown): number | null {
  if (!isRecord(value)) return null;
  const direct = value.exitCode;
  if (typeof direct === "number") return direct;
  for (const nested of Object.values(value)) {
    if (isRecord(nested)) {
      const found = nestedExitCode(nested);
      if (found !== null) return found;
    }
  }
  return null;
}

function toolResultFailed(event: unknown): boolean {
  if (!isRecord(event)) return false;
  if (event.isError === true) return true;
  const exitCode = nestedExitCode(event.details);
  return exitCode !== null && exitCode !== 0;
}

function toolResultQuery(event: unknown): string {
  if (!isRecord(event)) return "";
  const input = isRecord(event.input) ? event.input : {};
  const command = typeof input.command === "string" ? input.command : "";
  const content = contentToText(event.content);
  const details = event.details ? contentToText(event.details) : "";
  const toolName = typeof event.toolName === "string" ? event.toolName : "";
  return [toolName, command, content, details].filter(Boolean).join("\n");
}

function stringField(value: Record<string, unknown>, name: string): string | null {
  const field = value[name];
  return typeof field === "string" ? field : null;
}

function eventMetadata(event: unknown): { toolName: string | null; command: string | null; entryId: string | null; timestamp: string | null } {
  if (!isRecord(event)) return { toolName: null, command: null, entryId: null, timestamp: null };
  const input = isRecord(event.input) ? event.input : {};
  return {
    toolName: stringField(event, "toolName"),
    command: stringField(input, "command"),
    entryId: stringField(event, "id") ?? stringField(event, "toolCallId") ?? stringField(event, "entryId"),
    timestamp: stringField(event, "timestamp"),
  };
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

export default function piFlightRecorderExtension(pi: PiLike): void {
  const state: LiveExtensionState = {
    mode: DEFAULT_SETTINGS.mode,
    sourceDirs: [],
    watcher: null,
    engine: null,
    bootstrapped: false,
    bootstrapInFlight: null,
    autoStart: DEFAULT_SETTINGS.autoStart,
    modelReflection: DEFAULT_SETTINGS.modelReflection,
    reflectionOnSessionEnd: DEFAULT_SETTINGS.reflectionOnSessionEnd,
    dailyDigest: DEFAULT_SETTINGS.dailyDigest,
    lastBootstrapAt: null,
    lastBootstrapError: null,
    lastOccurrenceId: null,
    lastSuppressionReason: null,
  };

  pi.registerCommand?.("flight-sync", {
    description: "Debug/manual: index local Pi sessions into pi-flight-recorder failure memory",
    handler: handleFlightSync,
  });

  pi.registerCommand?.("seen-this-before", {
    description: "Search prior Pi session failures for this error or command output",
    handler: handleSeenThisBefore,
  });

  pi.registerCommand?.("flight-mode", {
    description: "Inspect or set pi-flight-recorder mode: status, pause, resume, disable, off, index-only, or suggest-on-failure",
    handler: (args, ctx) => handleFlightMode(args, ctx, state),
  });

  pi.registerCommand?.("flight-watch", {
    description: "Debug/manual: start, stop, or inspect pi-flight-recorder live session watching",
    handler: (args, ctx) => handleFlightWatch(args, ctx, state),
  });

  pi.registerCommand?.("flight-status", {
    description: "Show pi-flight-recorder capture, suggestion, feedback, reflection, and privacy status",
    handler: (args, ctx) => handleFlightStatus(args, ctx, state),
  });

  pi.registerCommand?.("flight-feedback", {
    description: "Record feedback for a flight-recorder suggestion, occurrence, cluster, proposal, episode, or signature",
    handler: (args, ctx) => handleFlightFeedback(args, ctx, state),
  });

  pi.registerCommand?.("flight-reflect", {
    description: "Reflect on repeated local failure patterns without a model call unless --model is requested",
    handler: (args, ctx) => handleFlightReflect(args, ctx, state),
  });

  pi.on?.("session_start", (_event, ctx) => {
    scheduleBootstrap(ctx, state, "session_start");
  });
  pi.on?.("tool_result", (event, ctx) => handleToolResult(event, ctx, state));
  pi.on?.("user_bash", (event, ctx) => handleUserBash(event, ctx, state));
  pi.on?.("session_shutdown", (event, ctx) => handleSessionShutdown(event, ctx, state));

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
