#!/usr/bin/env node
import { getVersion } from "./version.js";
import type { QueryOptions } from "./query.js";
import type { SyncOptions } from "./sync.js";
import type { LiveMode, LiveSuggestionStatus } from "./live-suggestions.js";
import type { SessionWatchStatus } from "./watch-service.js";
import type { ArtifactCandidateOutcome, ExpectationDeltaSeverity, ExpectationDeltaStatus, FeedbackAction } from "./types.js";

export interface CliIO {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}

const defaultIO: CliIO = {
  stdout: (text) => console.log(text),
  stderr: (text) => console.error(text),
};

export function helpText(): string {
  return `pi-flight-recorder ${getVersion()}

Usage:
  # Normal UX is the Pi extension: install it, then use /flight-status and work normally.
  # This CLI is a debug/manual/recovery harness.
  pi-flight-recorder status [--data-dir DIR] [--json]
  pi-flight-recorder sync [--source DIR ...] [--data-dir DIR] [--limit N] [--force] [--json]
  pi-flight-recorder query [--data-dir DIR] [--cwd CWD] [--limit N] [--json] <error text>
  pi-flight-recorder seen-this-before [--data-dir DIR] [--cwd CWD] [--limit N] [--json] <error text>
  pi-flight-recorder watch start --foreground [--source DIR ...] [--data-dir DIR] [--mode off|index-only|suggest-on-failure] [--debounce-ms N] [--min-confidence N] [--cooldown-ms N]
  pi-flight-recorder watch status [--data-dir DIR] [--json]
  pi-flight-recorder watch stop [--data-dir DIR]
  pi-flight-recorder reflect [--data-dir DIR] [--min-count N] [--limit N] [--json]
  pi-flight-recorder delta capture --data-dir DIR --summary TEXT [--expectation TEXT] [--reality TEXT] [--impact TEXT] [--severity low|medium|high|unknown] [--cwd CWD] [--session-file FILE] [--entry ID] [--evidence TEXT] [--json]
  pi-flight-recorder delta list [--data-dir DIR] [--status candidate|accepted|dismissed|routed|resolved|recurring] [--limit N] [--json]
  pi-flight-recorder delta summary [--data-dir DIR] [--limit N] [--json]
  pi-flight-recorder delta outcome --data-dir DIR --candidate ID --outcome pending|helped|no-change|worse|superseded|needs-reroute [--note TEXT] [--applied-ref REF] [--json]
  pi-flight-recorder delta recur --data-dir DIR --delta ID --candidate ID --reason TEXT [--similarity N] [--json]
  pi-flight-recorder feedback --data-dir DIR --action useful|wrong-match|already-solved|not-useful|snooze|silence-pattern|promote-later|make-rule [--occurrence ID|--cluster ID|--proposal ID|--episode ID|--signature TEXT] [--duration-ms N] [--note TEXT]
  pi-flight-recorder --version
  pi-flight-recorder --help

Defaults:
  Sessions: ~/.pi/agent/sessions and ~/.pi/agent/sessions-archive
  Index:    ~/.pi/flight-recorder/flight-recorder.db

Everything is local. No embeddings or network access are required. Model-assisted reflection is off unless explicitly invoked from Pi.`;
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

function withoutOptions(args: string[], optionsWithValues: string[], flags: string[]): string[] {
  const result: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg) continue;
    if (optionsWithValues.includes(arg)) {
      index += 1;
      continue;
    }
    if (flags.includes(arg)) continue;
    result.push(arg);
  }
  return result;
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

function parseSeverity(value: string | null): ExpectationDeltaSeverity | null {
  if (value === "low" || value === "medium" || value === "high" || value === "unknown") return value;
  return null;
}

function parseDeltaStatus(value: string | null): ExpectationDeltaStatus | null {
  if (value === "candidate" || value === "accepted" || value === "dismissed" || value === "routed" || value === "resolved" || value === "recurring") return value;
  return null;
}

function parseArtifactOutcome(value: string | null): ArtifactCandidateOutcome | null {
  if (value === "pending" || value === "helped" || value === "no-change" || value === "worse" || value === "superseded" || value === "needs-reroute") return value;
  return null;
}

async function runSync(args: string[], io: CliIO): Promise<number> {
  const dataDir = readOption(args, "--data-dir");
  const sourceDirs = readRepeatedOption(args, "--source");
  const limit = parseLimit(readOption(args, "--limit"));
  const force = args.includes("--force");
  const asJson = args.includes("--json");
  const options: SyncOptions = { sourceDirs, force };
  if (dataDir) options.dataDir = dataDir;
  if (limit !== undefined) options.limit = limit;
  const { syncSessions } = await import("./sync.js");
  const result = await syncSessions(options);
  if (asJson) io.stdout(JSON.stringify(result, null, 2));
  else {
    io.stdout([
      "Sync complete.",
      `Data dir: ${result.dataDir}`,
      `Database: ${result.dbPath}`,
      `Discovered: ${result.discovered}`,
      `Indexed: ${result.indexed}`,
      `Skipped unchanged: ${result.skipped}`,
      `Episodes extracted: ${result.episodes}`,
      `Parse warnings: ${result.warnings}`,
    ].join("\n"));
  }
  return 0;
}

async function runQuery(command: string, args: string[], io: CliIO): Promise<number> {
  const dataDir = readOption(args, "--data-dir");
  const cwd = readOption(args, "--cwd");
  const limit = parseLimit(readOption(args, "--limit"));
  const asJson = args.includes("--json");
  const queryParts = withoutOptions(args, ["--data-dir", "--cwd", "--limit"], ["--json"]);
  const query = queryParts.join(" ").trim();
  if (!query) {
    io.stderr(`${command} requires error text, command output, or a failure description.`);
    return 2;
  }

  const options: QueryOptions = {};
  if (dataDir) options.dataDir = dataDir;
  if (cwd) options.cwd = cwd;
  if (limit !== undefined) options.limit = limit;
  const { formatSeenBefore, queryFailureMemory } = await import("./query.js");
  const result = queryFailureMemory(query, options);
  io.stdout(asJson ? JSON.stringify(result, null, 2) : formatSeenBefore(result));
  return 0;
}

async function runFeedback(args: string[], io: CliIO): Promise<number> {
  const { defaultDatabasePath, FlightRecorderStore, getDefaultDataDir } = await import("./storage.js");
  const { normalizeFailureSignature } = await import("./signatures.js");
  const dataDir = readOption(args, "--data-dir") ?? getDefaultDataDir();
  const episodeId = readOption(args, "--episode");
  const occurrenceId = readOption(args, "--occurrence");
  const clusterId = readOption(args, "--cluster");
  const proposalId = readOption(args, "--proposal");
  const signatureText = readOption(args, "--signature");
  const rating = readOption(args, "--rating");
  const action = readOption(args, "--action") ?? rating;
  const note = readOption(args, "--note");
  const durationMs = parseNumber(readOption(args, "--duration-ms"));
  if (!action) {
    io.stderr("feedback requires --action VALUE (or legacy --rating VALUE).");
    return 2;
  }
  const allowed = new Set(["useful", "wrong-match", "already-solved", "not-useful", "snooze", "silence-pattern", "promote-later", "make-rule", "dismiss"]);
  if (!allowed.has(action)) {
    io.stderr("feedback action must be one of: useful, wrong-match, already-solved, not-useful, snooze, silence-pattern, promote-later, make-rule, dismiss.");
    return 2;
  }
  const targets = [episodeId, occurrenceId, clusterId, proposalId, signatureText].filter(Boolean);
  if (targets.length !== 1) {
    io.stderr("feedback requires exactly one target: --episode, --occurrence, --cluster, --proposal, or --signature.");
    return 2;
  }
  const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
  try {
    let targetType: "episode" | "occurrence" | "cluster" | "proposal" | "signature";
    let targetId: string;
    let signature: string | null = null;
    let targetClusterId: string | null = null;
    if (occurrenceId) {
      const occurrence = store.getFailureOccurrence(occurrenceId);
      if (!occurrence) {
        io.stderr(`No failure occurrence found for ${occurrenceId}.`);
        return 2;
      }
      targetType = "occurrence";
      targetId = occurrenceId;
      signature = occurrence.signature;
    } else if (clusterId) {
      const cluster = store.getFailureCluster(clusterId);
      if (!cluster) {
        io.stderr(`No failure cluster found for ${clusterId}.`);
        return 2;
      }
      targetType = "cluster";
      targetId = clusterId;
      targetClusterId = clusterId;
      signature = cluster.representativeSignature;
    } else if (proposalId) {
      const proposal = store.getReflectionProposal(proposalId);
      if (!proposal) {
        io.stderr(`No reflection proposal found for ${proposalId}.`);
        return 2;
      }
      const cluster = store.getFailureCluster(proposal.clusterId);
      if (!cluster) {
        io.stderr(`Reflection proposal ${proposalId} points at missing cluster ${proposal.clusterId}.`);
        return 2;
      }
      targetType = "proposal";
      targetId = proposalId;
      targetClusterId = cluster.id;
      signature = cluster.representativeSignature;
    } else if (signatureText) {
      targetType = "signature";
      signature = normalizeFailureSignature({ query: signatureText, signature: signatureText });
      targetId = signature;
    } else {
      if (!episodeId || !store.getEpisode(episodeId)) {
        io.stderr(`No failure episode found for ${episodeId ?? ""}.`);
        return 2;
      }
      targetType = "episode";
      targetId = episodeId;
    }

    const expiresAt = action === "snooze" ? new Date(Date.now() + (durationMs ?? 24 * 60 * 60 * 1000)).toISOString() : null;
    if (targetType === "episode" && rating && action !== "snooze" && action !== "silence-pattern") store.recordFeedback(targetId, action, note);
    else store.recordFeedbackAction({ targetType, targetId, action: action as FeedbackAction, signature, note, expiresAt });

    const clusterStatus = action === "silence-pattern" ? "silenced" : action === "dismiss" ? "dismissed" : action === "promote-later" ? "promoted-later" : action === "make-rule" ? "make-rule" : null;
    if (clusterStatus && targetClusterId) store.updateClusterStatus(targetClusterId, clusterStatus);
    else if (clusterStatus && signature) store.updateClustersForSignature(signature, clusterStatus);
  } finally {
    store.close();
  }
  io.stdout(`Recorded feedback: ${action}`);
  return 0;
}

async function runDelta(args: string[], io: CliIO): Promise<number> {
  const [subcommand, ...rest] = args;
  const dataDir = readOption(rest, "--data-dir") ?? undefined;
  const asJson = rest.includes("--json");

  if (subcommand === "capture") {
    const summary = readOption(rest, "--summary");
    if (!summary) {
      io.stderr("delta capture requires --summary TEXT.");
      return 2;
    }
    const severityOption = readOption(rest, "--severity");
    const severity = severityOption ? parseSeverity(severityOption) : undefined;
    if (severityOption && !severity) {
      io.stderr("--severity must be one of: low, medium, high, unknown.");
      return 2;
    }
    const { captureManualDelta } = await import("./delta-capture.js");
    const captureInput: Parameters<typeof captureManualDelta>[0] = { summary };
    if (dataDir !== undefined) captureInput.dataDir = dataDir;
    if (readOption(rest, "--expectation") !== null) captureInput.expectation = readOption(rest, "--expectation");
    if (readOption(rest, "--reality") !== null) captureInput.reality = readOption(rest, "--reality");
    if (readOption(rest, "--impact") !== null) captureInput.impact = readOption(rest, "--impact");
    if (severity !== undefined && severity !== null) captureInput.severity = severity;
    if (readOption(rest, "--cwd") !== null) captureInput.cwd = readOption(rest, "--cwd");
    if (readOption(rest, "--session-file") !== null) captureInput.sessionFile = readOption(rest, "--session-file");
    if (readOption(rest, "--entry") !== null) captureInput.entryId = readOption(rest, "--entry");
    if (readOption(rest, "--evidence") !== null) captureInput.evidenceText = readOption(rest, "--evidence");
    const result = captureManualDelta(captureInput);
    if (asJson) io.stdout(JSON.stringify(result, null, 2));
    else io.stdout(`Recorded delta candidate: ${result.delta.id}\nSignal: ${result.signals[0]?.type ?? "none"}\nStatus: ${result.delta.status}`);
    return 0;
  }

  if (subcommand === "list") {
    const statusOption = readOption(rest, "--status");
    let status: ExpectationDeltaStatus | undefined;
    if (statusOption) {
      const parsedStatus = parseDeltaStatus(statusOption);
      if (!parsedStatus) {
        io.stderr("--status must be one of: candidate, accepted, dismissed, routed, resolved, recurring.");
        return 2;
      }
      status = parsedStatus;
    }
    const limit = parseLimit(readOption(rest, "--limit"));
    const { defaultDatabasePath, FlightRecorderStore, getDefaultDataDir } = await import("./storage.js");
    const store = new FlightRecorderStore(defaultDatabasePath(dataDir ?? getDefaultDataDir()));
    try {
      const options: Parameters<typeof store.listExpectationDeltas>[0] = {};
      if (status !== undefined) options.status = status;
      if (limit !== undefined) options.limit = limit;
      const deltas = store.listExpectationDeltas(options);
      if (asJson) io.stdout(JSON.stringify({ deltas }, null, 2));
      else io.stdout(deltas.length === 0 ? "No delta candidates found." : deltas.map((delta) => `${delta.id} [${delta.status}] ${delta.summary}`).join("\n"));
    } finally {
      store.close();
    }
    return 0;
  }

  if (subcommand === "summary") {
    const limit = parseLimit(readOption(rest, "--limit"));
    const { defaultDatabasePath, FlightRecorderStore, getDefaultDataDir } = await import("./storage.js");
    const { formatDeltaOutcomeSummary, summarizeDeltaOutcomes } = await import("./delta-outcomes.js");
    const store = new FlightRecorderStore(defaultDatabasePath(dataDir ?? getDefaultDataDir()));
    try {
      const summary = summarizeDeltaOutcomes(store, limit !== undefined ? { limit } : {});
      if (asJson) io.stdout(JSON.stringify(summary, null, 2));
      else io.stdout(formatDeltaOutcomeSummary(summary));
    } finally {
      store.close();
    }
    return 0;
  }

  if (subcommand === "outcome") {
    const candidateId = readOption(rest, "--candidate");
    const outcome = parseArtifactOutcome(readOption(rest, "--outcome"));
    if (!candidateId || !outcome) {
      io.stderr("delta outcome requires --candidate ID and --outcome pending|helped|no-change|worse|superseded|needs-reroute.");
      return 2;
    }
    const { defaultDatabasePath, FlightRecorderStore, getDefaultDataDir } = await import("./storage.js");
    const { recordArtifactCandidateOutcomeWithStore } = await import("./delta-outcomes.js");
    const store = new FlightRecorderStore(defaultDatabasePath(dataDir ?? getDefaultDataDir()));
    try {
      const outcomeInput: Parameters<typeof recordArtifactCandidateOutcomeWithStore>[1] = {
        candidateId,
        outcome,
        outcomeSummary: readOption(rest, "--note"),
      };
      const appliedRef = readOption(rest, "--applied-ref");
      if (appliedRef !== null) outcomeInput.appliedArtifactRef = appliedRef;
      const result = recordArtifactCandidateOutcomeWithStore(store, outcomeInput);
      if (!result) {
        io.stderr(`No artifact candidate found for ${candidateId}.`);
        return 1;
      }
      if (asJson) io.stdout(JSON.stringify(result, null, 2));
      else io.stdout(`Recorded outcome for ${result.candidate.id}: ${result.candidate.outcome} [${result.candidate.status}].`);
    } finally {
      store.close();
    }
    return 0;
  }

  if (subcommand === "recur") {
    const deltaId = readOption(rest, "--delta");
    const candidateId = readOption(rest, "--candidate");
    const reason = readOption(rest, "--reason");
    if (!deltaId || !candidateId || !reason) {
      io.stderr("delta recur requires --delta ID --candidate ID --reason TEXT.");
      return 2;
    }
    const { defaultDatabasePath, FlightRecorderStore, getDefaultDataDir } = await import("./storage.js");
    const { recordDeltaRecurrenceWithStore } = await import("./delta-outcomes.js");
    const store = new FlightRecorderStore(defaultDatabasePath(dataDir ?? getDefaultDataDir()));
    try {
      const recurrenceInput: Parameters<typeof recordDeltaRecurrenceWithStore>[1] = {
        deltaId,
        priorArtifactCandidateId: candidateId,
        reason,
      };
      const similarity = parseNumber(readOption(rest, "--similarity"));
      if (similarity !== undefined) recurrenceInput.similarity = similarity;
      const result = recordDeltaRecurrenceWithStore(store, recurrenceInput);
      if (!result) {
        io.stderr(`No matching delta/candidate found for delta=${deltaId} candidate=${candidateId}.`);
        return 1;
      }
      if (asJson) io.stdout(JSON.stringify(result, null, 2));
      else io.stdout(`Linked recurrence ${result.link.id}: delta ${result.recurringDelta.id} -> candidate ${result.priorArtifactCandidate.id}.`);
    } finally {
      store.close();
    }
    return 0;
  }

  io.stderr("delta requires subcommand: capture, list, summary, outcome, or recur.");
  return 2;
}

async function runStatus(args: string[], io: CliIO): Promise<number> {
  const dataDir = readOption(args, "--data-dir") ?? undefined;
  const asJson = args.includes("--json");
  const { defaultDatabasePath, FlightRecorderStore, getDefaultDataDir } = await import("./storage.js");
  const { summarizeDeltaOutcomes } = await import("./delta-outcomes.js");
  const { readSettings } = await import("./settings.js");
  const { readPersistedWatchStatus } = await import("./watch-service.js");
  const resolvedDataDir = dataDir ?? getDefaultDataDir();
  const settings = await readSettings(resolvedDataDir);
  const watchStatus = await readPersistedWatchStatus(resolvedDataDir);
  const store = new FlightRecorderStore(defaultDatabasePath(resolvedDataDir));
  try {
    const deltaOutcomes = summarizeDeltaOutcomes(store, { limit: 20 });
    const status = {
      dataDir: resolvedDataDir,
      settings,
      watcher: watchStatus ?? { state: "stopped" },
      counts: {
        sourceFiles: store.count("source_files"),
        episodes: store.count("episodes"),
        occurrences: store.count("failure_occurrences"),
        clusters: store.count("failure_clusters"),
        proposals: store.count("reflection_proposals"),
        deltas: store.count("expectation_deltas"),
        artifactCandidates: store.count("artifact_candidates"),
        feedbackActions: store.count("feedback_actions"),
      },
      deltaOutcomes: {
        counts: deltaOutcomes.counts,
        limits: deltaOutcomes.limits,
      },
      privacy: {
        localOnlyByDefault: true,
        modelReflectionEnabled: settings.modelReflection,
      },
    };
    if (asJson) io.stdout(JSON.stringify(status, null, 2));
    else {
      io.stdout([
        "Flight recorder status (debug CLI).",
        `Data dir: ${resolvedDataDir}`,
        `Mode: ${settings.mode}; autostart=${settings.autoStart}; modelReflection=${settings.modelReflection}`,
        `Watcher: ${watchStatus?.state ?? "stopped"}; last sync ${watchStatus?.lastSyncAt ?? "never"}`,
        `Counts: episodes=${status.counts.episodes}, occurrences=${status.counts.occurrences}, clusters=${status.counts.clusters}, proposals=${status.counts.proposals}, deltas=${status.counts.deltas}, artifacts=${status.counts.artifactCandidates}, feedback=${status.counts.feedbackActions}`,
        `Delta outcomes: unresolved=${deltaOutcomes.counts.unresolved}, insufficient evidence=${deltaOutcomes.counts["insufficient-evidence"]}, no recurrence observed=${deltaOutcomes.counts["no-recurrence-observed"]}, recurring after applied=${deltaOutcomes.counts["recurring-after-applied"]}`,
        "Normal UX: use the Pi extension commands /flight-status and /flight-reflect.",
      ].join("\n"));
    }
  } finally {
    store.close();
  }
  return 0;
}

async function runReflect(args: string[], io: CliIO): Promise<number> {
  const dataDir = readOption(args, "--data-dir") ?? undefined;
  const minCount = parseLimit(readOption(args, "--min-count"));
  const limit = parseLimit(readOption(args, "--limit"));
  const asJson = args.includes("--json");
  const { formatReflectionDigest, runReflection } = await import("./reflection.js");
  const options: Parameters<typeof runReflection>[0] = { trigger: "manual" };
  if (dataDir) options.dataDir = dataDir;
  if (minCount !== undefined) options.minCount = minCount;
  if (limit !== undefined) options.limit = limit;
  const result = await runReflection(options);
  io.stdout(asJson ? JSON.stringify(result, null, 2) : formatReflectionDigest(result));
  return 0;
}

function formatSuggestionStatus(status: LiveSuggestionStatus | null): string[] {
  if (!status) return ["Last suggestion: none"];
  const lines = [`Suggestion mode: ${status.mode}`];
  if (status.lastSuggestion) {
    lines.push(`Last suggestion: ${status.lastSuggestion.episodeId} (${status.lastSuggestion.confidence.toFixed(2)})`);
  } else {
    lines.push("Last suggestion: none");
  }
  lines.push(`Suppressed: ${Object.entries(status.suppressionCounts).map(([reason, count]) => `${reason}=${count}`).join(", ")}`);
  return lines;
}

function formatWatchStatus(status: SessionWatchStatus | null, suggestionStatus: LiveSuggestionStatus | null = null): string {
  if (!status) return "Flight recorder live mode: stopped\nWatcher: stopped\nNo persisted watcher status found.";
  const sharedNote = status.state === "watched-by-another-process" ? " (shared; another Pi session/process owns the indexing lock)" : "";
  const lines = [
    `Flight recorder live mode: ${status.mode}`,
    `Watcher: ${status.state}${sharedNote}`,
    `Sources: ${status.sourceDirs.join(", ") || "none"}`,
    `Watched files: ${status.watchedPaths.length}`,
    `Last sync: ${status.lastSyncAt ?? "never"}`,
    `Last failure: ${status.lastFailure ? `${status.lastFailure.newEpisodeIds.join(", ")} from ${status.lastFailure.sourceFile}` : "none"}`,
    ...formatSuggestionStatus(suggestionStatus),
    `Warnings: ${status.warningCount}`,
    `Errors: ${status.errorCount}${status.lastError ? ` (${status.lastError})` : ""}`,
  ];
  return lines.join("\n");
}

async function runWatch(args: string[], io: CliIO): Promise<number> {
  const [subcommand, ...rest] = args;
  const dataDir = readOption(rest, "--data-dir") ?? undefined;
  const asJson = rest.includes("--json");

  if (subcommand === "status") {
    const { readPersistedWatchStatus } = await import("./watch-service.js");
    const status = await readPersistedWatchStatus(dataDir);
    io.stdout(asJson ? JSON.stringify(status ?? { state: "stopped" }, null, 2) : formatWatchStatus(status));
    return 0;
  }

  if (subcommand === "stop") {
    const { requestWatchStop } = await import("./watch-service.js");
    const stopPath = await requestWatchStop(dataDir);
    io.stdout(`Flight recorder watch stop requested: ${stopPath}`);
    return 0;
  }

  if (subcommand !== "start") {
    io.stderr("watch requires subcommand: start, status, or stop.");
    return 2;
  }

  if (!rest.includes("--foreground")) {
    io.stderr("watch start currently requires --foreground. OS daemon installation is intentionally out of scope for this slice.");
    return 2;
  }

  const sourceDirs = readRepeatedOption(rest, "--source");
  const mode = parseMode(readOption(rest, "--mode"));
  if (readOption(rest, "--mode") && !mode) {
    io.stderr("--mode must be one of: off, index-only, suggest-on-failure.");
    return 2;
  }
  const debounceMs = parseNumber(readOption(rest, "--debounce-ms"));
  const minConfidence = parseNumber(readOption(rest, "--min-confidence"));
  const cooldownMs = parseNumber(readOption(rest, "--cooldown-ms"));
  const maxSuggestions = parseLimit(readOption(rest, "--max-suggestions"));
  const pollIntervalMs = parseNumber(readOption(rest, "--poll-interval-ms"));

  const { LiveSuggestionEngine, formatLiveSuggestion } = await import("./live-suggestions.js");
  const { defaultDatabasePath, FlightRecorderStore } = await import("./storage.js");
  const { SessionWatchService } = await import("./watch-service.js");
  const engineOptions: ConstructorParameters<typeof LiveSuggestionEngine>[0] = { mode: mode ?? "index-only" };
  if (dataDir) engineOptions.dataDir = dataDir;
  if (minConfidence !== undefined) engineOptions.minConfidence = minConfidence;
  if (cooldownMs !== undefined) engineOptions.cooldownMs = cooldownMs;
  if (maxSuggestions !== undefined) engineOptions.maxSuggestionsPerWindow = maxSuggestions;
  const engine = new LiveSuggestionEngine(engineOptions);
  const watchOptions: ConstructorParameters<typeof SessionWatchService>[0] = {
    sourceDirs,
    mode: mode ?? "index-only",
    onFileSynced: (event) => {
      if (event.result.newEpisodeIds.length === 0) return;
      const store = new FlightRecorderStore(defaultDatabasePath(event.result.dataDir));
      try {
        for (const episode of store.getEpisodes(event.result.newEpisodeIds)) {
          const decision = engine.evaluate(episode);
          if (decision.kind === "suggestion") io.stdout(formatLiveSuggestion(decision));
        }
      } finally {
        store.close();
      }
    },
  };
  if (dataDir) watchOptions.dataDir = dataDir;
  if (debounceMs !== undefined) watchOptions.debounceMs = debounceMs;
  if (pollIntervalMs !== undefined) watchOptions.pollIntervalMs = pollIntervalMs;

  const service = new SessionWatchService(watchOptions);
  const stop = (): void => {
    void service.stop();
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  try {
    const status = await service.start();
    io.stdout(formatWatchStatus(status, engine.status()));
    if (status.state !== "active") return status.state === "watched-by-another-process" ? 0 : 1;
    await service.waitUntilStopped();
    io.stdout("Flight recorder watch stopped.");
    return 0;
  } finally {
    process.off("SIGINT", stop);
    process.off("SIGTERM", stop);
  }
}

export async function main(argv = process.argv.slice(2), io = defaultIO): Promise<number> {
  if (argv.includes("--version") || argv.includes("-v")) {
    io.stdout(getVersion());
    return 0;
  }
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    io.stdout(helpText());
    return 0;
  }

  const [command, ...args] = argv;
  switch (command) {
    case "status":
      return runStatus(args, io);
    case "sync":
      return runSync(args, io);
    case "query":
    case "seen-this-before":
      return runQuery(command, args, io);
    case "watch":
      return runWatch(args, io);
    case "reflect":
      return runReflect(args, io);
    case "delta":
      return runDelta(args, io);
    case "feedback":
      return runFeedback(args, io);
    default:
      io.stderr(`Unknown command: ${command ?? ""}\n\n${helpText()}`);
      return 2;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().then((code) => {
    process.exitCode = code;
  }).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
