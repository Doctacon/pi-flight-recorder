import { compactSnippet, redactSecrets } from "./redact.js";
import { normalizeFailureSignature, signatureTokenCount } from "./signatures.js";
import { defaultDatabasePath, FlightRecorderStore, getDefaultDataDir, type EpisodeSearchResult } from "./storage.js";
import type { FailureEpisode, SourceRef } from "./types.js";

export type LiveMode = "off" | "index-only" | "suggest-on-failure";

export type SuppressionReason = "mode-off" | "index-only" | "silenced" | "no-match" | "unresolved-match" | "broad-match" | "low-confidence" | "cooldown" | "max-suggestions";

export interface LiveFailureInput {
  query: string;
  cwd?: string | null;
  episodeId?: string;
  sourceRef?: SourceRef;
  signature?: string;
  source?: "episode" | "tool_result" | "user_bash" | "watcher" | "manual";
}

export interface LiveSuggestionEngineOptions {
  dataDir?: string;
  mode?: LiveMode;
  minConfidence?: number;
  cooldownMs?: number;
  maxSuggestionsPerWindow?: number;
  windowMs?: number;
  limit?: number;
  now?: () => number;
}

export interface LiveFailureStatus {
  at: string;
  signature: string;
  cwd: string | null;
  source: NonNullable<LiveFailureInput["source"]>;
  queryPreview: string;
}

export interface LiveSuggestion {
  episode: FailureEpisode;
  confidence: number;
  crossProject: boolean;
  priorFix: string | null;
  evidence: SourceRef[];
  limits: string[];
}

export interface LiveSuggestionStatus {
  mode: LiveMode;
  dataDir: string;
  minConfidence: number;
  cooldownMs: number;
  maxSuggestionsPerWindow: number;
  windowMs: number;
  lastFailure: LiveFailureStatus | null;
  lastSuggestion: {
    at: string;
    episodeId: string;
    confidence: number;
    crossProject: boolean;
  } | null;
  suppressionCounts: Record<SuppressionReason, number>;
  emittedInWindow: number;
  cooldownSignatures: number;
}

export type LiveSuggestionDecision =
  | {
      kind: "suggestion";
      suggestion: LiveSuggestion;
      status: LiveSuggestionStatus;
    }
  | {
      kind: "suppressed";
      reason: SuppressionReason;
      message: string;
      bestCandidate?: LiveSuggestion;
      status: LiveSuggestionStatus;
    };

const DEFAULT_MIN_CONFIDENCE = 0.7;
const DEFAULT_COOLDOWN_MS = 5 * 60 * 1000;
const DEFAULT_WINDOW_MS = 60 * 1000;
const DEFAULT_MAX_SUGGESTIONS_PER_WINDOW = 3;
const DEFAULT_LIMIT = 5;

function emptySuppressionCounts(): Record<SuppressionReason, number> {
  return {
    "mode-off": 0,
    "index-only": 0,
    silenced: 0,
    "no-match": 0,
    "unresolved-match": 0,
    "broad-match": 0,
    "low-confidence": 0,
    cooldown: 0,
    "max-suggestions": 0,
  };
}

function isFailureEpisode(input: LiveFailureInput | FailureEpisode): input is FailureEpisode {
  return "sourceRefs" in input && "searchText" in input && "problemSummary" in input;
}

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(0.99, value));
}

function sourceRefLabel(ref: SourceRef): string {
  const session = ref.sessionId ? `session ${ref.sessionId}` : "unknown session";
  const entry = ref.entryId ? `entry ${ref.entryId}` : `line ${ref.lineNumber}`;
  const cwd = ref.cwd ? `cwd ${ref.cwd}` : "cwd unknown";
  return `${session}, ${entry}, ${cwd}, ${ref.sourceFile}`;
}

interface MaterializedLiveFailure {
  query: string;
  source: NonNullable<LiveFailureInput["source"]>;
  cwd?: string | null;
  episodeId?: string;
  sourceRef?: SourceRef;
  signature?: string;
}

function materializeInput(input: LiveFailureInput | FailureEpisode): MaterializedLiveFailure {
  if (!isFailureEpisode(input)) {
    return { ...input, query: input.query, source: input.source ?? "manual" };
  }

  const query = [input.problemSummary, input.observed, input.searchText].filter(Boolean).join("\n");
  const result: MaterializedLiveFailure = {
    query,
    cwd: input.cwd,
    episodeId: input.id,
    signature: input.signature,
    source: "episode",
  };
  const sourceRef = input.sourceRefs[0];
  if (sourceRef) result.sourceRef = sourceRef;
  return result;
}

function suggestionConfidence(result: EpisodeSearchResult, cwd: string | null): number {
  const episode = result.episode;
  const sameCwd = Boolean(cwd && episode.cwd && episode.cwd === cwd);
  const crossProject = Boolean(cwd && episode.cwd && episode.cwd !== cwd);
  const cwdAdjustment = sameCwd ? 0.04 : crossProject ? -0.08 : 0;
  return clampConfidence(episode.confidence + cwdAdjustment);
}

function suggestionFromResult(result: EpisodeSearchResult, cwd: string | null): LiveSuggestion {
  const episode = result.episode;
  const crossProject = Boolean(cwd && episode.cwd && episode.cwd !== cwd);
  const limits = [...episode.limits];
  if (crossProject) limits.unshift(`Prior match is from a different cwd (${episode.cwd}); inspect before applying in ${cwd}.`);
  if (cwd && !episode.cwd) limits.unshift("Prior match has no cwd metadata; project relevance is unknown.");
  return {
    episode,
    confidence: suggestionConfidence(result, cwd),
    crossProject,
    priorFix: episode.resolution?.summary ?? null,
    evidence: episode.sourceRefs.slice(0, 4),
    limits,
  };
}

function sortCandidates(a: LiveSuggestion, b: LiveSuggestion): number {
  if (a.crossProject !== b.crossProject) return a.crossProject ? 1 : -1;
  if (a.confidence !== b.confidence) return b.confidence - a.confidence;
  return a.episode.id.localeCompare(b.episode.id);
}

export class LiveSuggestionEngine {
  private dataDir: string;
  private mode: LiveMode;
  private minConfidence: number;
  private cooldownMs: number;
  private maxSuggestionsPerWindow: number;
  private windowMs: number;
  private limit: number;
  private readonly now: () => number;
  private readonly cooldowns = new Map<string, number>();
  private emittedAt: number[] = [];
  private suppressionCounts = emptySuppressionCounts();
  private lastFailure: LiveFailureStatus | null = null;
  private lastSuggestion: LiveSuggestionStatus["lastSuggestion"] = null;

  constructor(options: LiveSuggestionEngineOptions = {}) {
    this.dataDir = options.dataDir ?? getDefaultDataDir();
    this.mode = options.mode ?? "off";
    this.minConfidence = options.minConfidence ?? DEFAULT_MIN_CONFIDENCE;
    this.cooldownMs = options.cooldownMs ?? DEFAULT_COOLDOWN_MS;
    this.maxSuggestionsPerWindow = options.maxSuggestionsPerWindow ?? DEFAULT_MAX_SUGGESTIONS_PER_WINDOW;
    this.windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
    this.limit = options.limit ?? DEFAULT_LIMIT;
    this.now = options.now ?? Date.now;
  }

  updateConfig(options: Omit<LiveSuggestionEngineOptions, "now">): void {
    if (options.dataDir) this.dataDir = options.dataDir;
    if (options.mode) this.mode = options.mode;
    if (options.minConfidence !== undefined) this.minConfidence = options.minConfidence;
    if (options.cooldownMs !== undefined) this.cooldownMs = options.cooldownMs;
    if (options.maxSuggestionsPerWindow !== undefined) this.maxSuggestionsPerWindow = options.maxSuggestionsPerWindow;
    if (options.windowMs !== undefined) this.windowMs = options.windowMs;
    if (options.limit !== undefined) this.limit = options.limit;
  }

  setMode(mode: LiveMode): void {
    this.mode = mode;
  }

  getMode(): LiveMode {
    return this.mode;
  }

  evaluate(input: LiveFailureInput | FailureEpisode): LiveSuggestionDecision {
    const materialized = materializeInput(input);
    const query = redactSecrets(materialized.query).trim();
    const cwd = materialized.cwd ?? materialized.sourceRef?.cwd ?? null;
    const nowMs = this.now();
    const signatureInput: { query: string; signature?: string | null; fallbackId?: string | null } = { query };
    if (materialized.signature !== undefined) signatureInput.signature = materialized.signature;
    if (materialized.episodeId !== undefined) signatureInput.fallbackId = materialized.episodeId;
    const signature = normalizeFailureSignature(signatureInput, 240);
    this.lastFailure = {
      at: new Date(nowMs).toISOString(),
      signature,
      cwd,
      source: materialized.source,
      queryPreview: compactSnippet(query.replace(/\s+/g, " "), 180),
    };

    if (this.mode === "off") return this.suppress("mode-off", "Live suggestions are off.");
    if (this.mode === "index-only") return this.suppress("index-only", "Live mode is indexing only; suggestion suppressed.");

    const activeSuppression = this.findActiveSignatureSuppression(signature, nowMs);
    if (activeSuppression) {
      return this.suppress("silenced", `Suggestion suppressed by ${activeSuppression.action} feedback for this pattern.`);
    }

    this.pruneWindow(nowMs);
    if (this.emittedAt.length >= this.maxSuggestionsPerWindow) {
      return this.suppress("max-suggestions", "Suggestion suppressed because the per-window maximum was reached.");
    }

    const lastSuggestedAt = this.cooldowns.get(signature);
    if (lastSuggestedAt !== undefined && nowMs - lastSuggestedAt < this.cooldownMs) {
      return this.suppress("cooldown", "Suggestion suppressed because this failure signature is still cooling down.");
    }

    const candidates = this.findCandidates(query, cwd, materialized.episodeId);
    const best = candidates[0];
    if (!best) return this.suppress("no-match", "No prior failure-memory match found.");
    if (best.episode.status !== "resolved" || !best.priorFix) {
      return this.suppress("unresolved-match", "Best match has no observed prior resolution; keeping it for reflection instead.", best);
    }
    if (best.confidence < this.minConfidence) {
      return this.suppress("low-confidence", `Best match confidence ${best.confidence.toFixed(2)} is below ${this.minConfidence.toFixed(2)}.`, best);
    }
    if (signatureTokenCount(signature) < 4 && best.episode.signature !== signature) {
      return this.suppress("broad-match", "Best match is based on too few specific tokens for a live nudge.", best);
    }

    this.cooldowns.set(signature, nowMs);
    this.emittedAt.push(nowMs);
    this.lastSuggestion = {
      at: new Date(nowMs).toISOString(),
      episodeId: best.episode.id,
      confidence: best.confidence,
      crossProject: best.crossProject,
    };
    return { kind: "suggestion", suggestion: best, status: this.status() };
  }

  status(): LiveSuggestionStatus {
    this.pruneWindow(this.now());
    return {
      mode: this.mode,
      dataDir: this.dataDir,
      minConfidence: this.minConfidence,
      cooldownMs: this.cooldownMs,
      maxSuggestionsPerWindow: this.maxSuggestionsPerWindow,
      windowMs: this.windowMs,
      lastFailure: this.lastFailure,
      lastSuggestion: this.lastSuggestion,
      suppressionCounts: { ...this.suppressionCounts },
      emittedInWindow: this.emittedAt.length,
      cooldownSignatures: this.cooldowns.size,
    };
  }

  private findActiveSignatureSuppression(signature: string, nowMs: number): { action: "snooze" | "silence-pattern" } | null {
    const store = new FlightRecorderStore(defaultDatabasePath(this.dataDir));
    try {
      const record = store.hasActiveSignatureSuppression(signature, new Date(nowMs).toISOString());
      if (!record || (record.action !== "snooze" && record.action !== "silence-pattern")) return null;
      return { action: record.action };
    } finally {
      store.close();
    }
  }

  private findCandidates(query: string, cwd: string | null, excludeEpisodeId: string | undefined): LiveSuggestion[] {
    if (!query) return [];
    const excludeEpisodeIds = excludeEpisodeId ? [excludeEpisodeId] : [];
    const store = new FlightRecorderStore(defaultDatabasePath(this.dataDir));
    try {
      const candidates: LiveSuggestion[] = [];
      const seen = new Set<string>();
      if (cwd) {
        for (const result of store.searchEpisodes(query, { cwd, limit: this.limit, excludeEpisodeIds })) {
          seen.add(result.episode.id);
          candidates.push(suggestionFromResult(result, cwd));
        }
      }
      for (const result of store.searchEpisodes(query, { limit: this.limit, excludeEpisodeIds })) {
        if (seen.has(result.episode.id)) continue;
        candidates.push(suggestionFromResult(result, cwd));
      }
      return candidates.sort(sortCandidates).slice(0, this.limit);
    } finally {
      store.close();
    }
  }

  private suppress(reason: SuppressionReason, message: string, bestCandidate?: LiveSuggestion): LiveSuggestionDecision {
    this.suppressionCounts[reason] += 1;
    const base = { kind: "suppressed" as const, reason, message, status: this.status() };
    return bestCandidate ? { ...base, bestCandidate } : base;
  }

  private pruneWindow(nowMs: number): void {
    const earliest = nowMs - this.windowMs;
    this.emittedAt = this.emittedAt.filter((timestamp) => timestamp >= earliest);
  }
}

export function formatLiveSuggestion(decision: LiveSuggestionDecision): string {
  if (decision.kind === "suppressed") return `Flight recorder: ${decision.message}`;
  const { suggestion } = decision;
  const lines: string[] = [];
  lines.push(`⚠ Seen before: likely match (${suggestion.confidence.toFixed(2)})`);
  lines.push(`Failure: ${suggestion.episode.problemSummary}`);
  lines.push(`Prior fix: ${suggestion.priorFix ?? "none detected"}`);
  lines.push("Evidence:");
  for (const ref of suggestion.evidence) lines.push(`- ${sourceRefLabel(ref)}`);
  if (suggestion.limits.length > 0) {
    lines.push("Limits:");
    for (const limit of suggestion.limits.slice(0, 3)) lines.push(`- ${limit}`);
  }
  return lines.join("\n");
}
