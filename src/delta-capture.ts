import { createHash } from "node:crypto";
import { compactSnippet, sanitizeStoredText } from "./redact.js";
import { defaultDatabasePath, FlightRecorderStore, getDefaultDataDir } from "./storage.js";
import type {
  DeltaDetectorSignal,
  DeltaEvidenceRef,
  DeltaDetectorSignalType,
  ExpectationDelta,
  ExpectationDeltaSeverity,
  FailureCluster,
  NewExpectationDelta,
  ParsedSession,
  SessionEvent,
} from "./types.js";

export interface DeltaCaptureResult {
  delta: ExpectationDelta;
  signals: DeltaDetectorSignal[];
  created: boolean;
}

export interface ManualDeltaCaptureInput {
  summary: string;
  expectation?: string | null;
  reality?: string | null;
  impact?: string | null;
  severity?: ExpectationDeltaSeverity;
  cwd?: string | null;
  sessionFile?: string | null;
  entryId?: string | null;
  timestamp?: string | null;
  evidenceText?: string | null;
  evidenceNote?: string | null;
  evidenceRefs?: DeltaEvidenceRef[];
  metadata?: Record<string, unknown>;
  now?: string;
}

export interface DeltaClusterSuggestionOptions {
  minCount?: number;
  limit?: number;
  now?: string;
}

export interface UserCorrectionSuggestionOptions {
  limit?: number;
  now?: string;
}

export interface CaptureDeltasOptions extends DeltaClusterSuggestionOptions, UserCorrectionSuggestionOptions {
  dataDir?: string;
}

function hash(value: string, length = 16): string {
  return createHash("sha256").update(value).digest("hex").slice(0, length);
}

function manualEvidence(input: ManualDeltaCaptureInput): DeltaEvidenceRef[] {
  if (input.evidenceRefs && input.evidenceRefs.length > 0) return input.evidenceRefs;
  if (!input.evidenceText && !input.evidenceNote && !input.sessionFile && !input.entryId && !input.cwd) return [];
  return [
    {
      sourceType: "manual",
      sourceId: null,
      sourceFile: null,
      sessionFile: input.sessionFile ?? null,
      cwd: input.cwd ?? null,
      entryId: input.entryId ?? null,
      timestamp: input.timestamp ?? null,
      snippet: input.evidenceText ?? null,
      note: input.evidenceNote ?? "Manual delta capture",
    },
  ];
}

function clusterEvidence(store: FlightRecorderStore, cluster: FailureCluster): DeltaEvidenceRef[] {
  return store.getClusterEvidence(cluster.id, 5).map((item) => ({
    sourceType: "occurrence",
    sourceId: item.occurrenceId,
    sourceFile: null,
    sessionFile: item.sessionFile,
    cwd: item.cwd,
    entryId: item.entryId,
    timestamp: item.seenAt,
    snippet: item.snippet,
    note: `Reflection cluster ${cluster.id}`,
  }));
}

function sessionEntryEvidence(event: SessionEvent): DeltaEvidenceRef[] {
  return [
    {
      sourceType: "session-entry",
      sourceId: event.source.entryId,
      sourceFile: event.source.sourceFile,
      sessionFile: event.source.sourceFile,
      cwd: event.source.cwd,
      entryId: event.source.entryId,
      timestamp: event.source.timestamp,
      snippet: event.text,
      note: "User correction language",
    },
  ];
}

function getOrCreateDelta(store: FlightRecorderStore, id: string, input: NewExpectationDelta): { delta: ExpectationDelta; created: boolean } {
  const existing = store.getExpectationDelta(id);
  if (existing) return { delta: existing, created: false };
  return { delta: store.createExpectationDelta({ ...input, id }), created: true };
}

interface SignalOnceInput {
  id: string;
  deltaId: string;
  type: DeltaDetectorSignalType;
  explanation: string;
  confidence?: number | null;
  evidenceRefs?: DeltaEvidenceRef[];
  metadata?: Record<string, unknown>;
  now?: string;
}

function recordSignalOnce(store: FlightRecorderStore, input: SignalOnceInput): DeltaDetectorSignal {
  const existing = store.getDeltaDetectorSignal(input.id);
  if (existing) return existing;
  return store.recordDeltaDetectorSignal(input);
}

export function captureManualDeltaWithStore(store: FlightRecorderStore, input: ManualDeltaCaptureInput): DeltaCaptureResult {
  const evidenceRefs = manualEvidence(input);
  const deltaInput: NewExpectationDelta = {
    source: "manual",
    summary: input.summary,
    expectation: input.expectation ?? null,
    reality: input.reality ?? null,
    impact: input.impact ?? null,
    severity: input.severity ?? "unknown",
    cwd: input.cwd ?? null,
    sourceSessionFile: input.sessionFile ?? null,
    sourceEntryId: input.entryId ?? null,
    evidenceRefs,
    metadata: { ...(input.metadata ?? {}), captureKind: "manual" },
  };
  if (input.now !== undefined) deltaInput.now = input.now;
  const delta = store.createExpectationDelta(deltaInput);
  const signalInput: SignalOnceInput = {
    id: `delta_sig_${hash(`manual-capture\u0000${delta.id}`)}`,
    deltaId: delta.id,
    type: "manual-capture",
    explanation: "Explicit manual delta capture; user supplied the expectation/reality/evidence text for later review.",
    confidence: null,
    evidenceRefs,
    metadata: { captureKind: "manual" },
  };
  if (input.now !== undefined) signalInput.now = input.now;
  const signal = recordSignalOnce(store, signalInput);
  return { delta, signals: [signal], created: true };
}

export function captureManualDelta(input: ManualDeltaCaptureInput & { dataDir?: string }): DeltaCaptureResult {
  const dataDir = input.dataDir ?? getDefaultDataDir();
  const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
  try {
    return captureManualDeltaWithStore(store, input);
  } finally {
    store.close();
  }
}

export function suggestDeltasFromReflectionClustersWithStore(store: FlightRecorderStore, options: DeltaClusterSuggestionOptions = {}): DeltaCaptureResult[] {
  const minCount = options.minCount ?? 2;
  const clusters = store.listFailureClusters({ status: "active", minCount, limit: options.limit ?? 20 });
  const results: DeltaCaptureResult[] = [];
  for (const cluster of clusters) {
    const evidenceRefs = clusterEvidence(store, cluster);
    if (evidenceRefs.length === 0) continue;
    const detectorKey = `reflection-cluster:${cluster.id}`;
    const id = `delta_${hash(detectorKey)}`;
    const reality = `Observed ${cluster.count} related failure occurrence${cluster.count === 1 ? "" : "s"} in reflection cluster ${cluster.id}.`;
    const deltaInput: NewExpectationDelta = {
      source: "detector",
      summary: `Repeated failure pattern: ${cluster.title}`,
      expectation: null,
      reality,
      impact: `Repeated local friction across tools/cwds: ${cluster.tools.join(", ") || "unknown tool"}.`,
      severity: cluster.count >= 5 ? "high" : "medium",
      cwd: cluster.cwdSummary[0] ?? null,
      evidenceRefs,
      metadata: { detectorKey, clusterId: cluster.id, clusterKey: cluster.clusterKey, representativeSignature: cluster.representativeSignature, count: cluster.count },
    };
    if (options.now !== undefined) deltaInput.now = options.now;
    const { delta, created } = getOrCreateDelta(store, id, deltaInput);
    const signalInput: SignalOnceInput = {
      id: `delta_sig_${hash(`${detectorKey}\u0000${delta.id}`)}`,
      deltaId: delta.id,
      type: "reflection-cluster",
      explanation: `Reflection cluster ${cluster.id} has ${cluster.count} related occurrence(s), meeting the conservative threshold ${minCount}.`,
      confidence: Math.min(0.85, 0.45 + cluster.count * 0.05),
      evidenceRefs,
      metadata: { detectorKey, clusterId: cluster.id, threshold: minCount },
    };
    if (options.now !== undefined) signalInput.now = options.now;
    const signal = recordSignalOnce(store, signalInput);
    results.push({ delta, signals: [signal], created });
  }
  return results;
}

const USER_CORRECTION_PATTERNS: RegExp[] = [
  /\bno,?\s+(actually|that'?s not|that is not|you misunderstood|you missed)\b/i,
  /\b(that'?s|that is)\s+not\s+(right|correct|what i meant|how it works)\b/i,
  /\byou\s+(misunderstood|missed|assumed incorrectly|got it wrong)\b/i,
  /\b(the\s+)?(api|command|tool|file|interface|schema)\s+(works|is|behaves)\s+differently\b/i,
  /\bwrong\s+(assumption|api|path|file|module|command|interface)\b/i,
];

function isUserCorrection(text: string): boolean {
  const normalized = text.trim();
  if (normalized.length < 12) return false;
  return USER_CORRECTION_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function suggestDeltasFromUserCorrectionsWithStore(store: FlightRecorderStore, parsed: ParsedSession, options: UserCorrectionSuggestionOptions = {}): DeltaCaptureResult[] {
  const results: DeltaCaptureResult[] = [];
  const limit = Math.max(1, Math.min(options.limit ?? 20, 200));
  for (const event of parsed.events) {
    if (results.length >= limit) break;
    if (event.kind !== "user" || !isUserCorrection(event.text)) continue;
    const evidenceRefs = sessionEntryEvidence(event);
    const entryAnchor = event.source.entryId ?? `${event.source.sourceFile}:${event.source.lineNumber}`;
    const detectorKey = `user-correction:${entryAnchor}:${hash(sanitizeStoredText(event.text, 500), 10)}`;
    const id = `delta_${hash(detectorKey)}`;
    const snippet = compactSnippet(event.text.replace(/\s+/g, " "), 220);
    const deltaInput: NewExpectationDelta = {
      source: "detector",
      summary: `User correction: ${snippet}`,
      expectation: "User indicated the assistant's prior assumption or response needed correction.",
      reality: snippet,
      impact: "User had to correct the assistant during the session.",
      severity: "medium",
      cwd: event.source.cwd,
      sourceSessionFile: event.source.sourceFile,
      sourceEntryId: event.source.entryId,
      evidenceRefs,
      metadata: { detectorKey, signal: "user-correction", lineNumber: event.source.lineNumber },
    };
    if (options.now !== undefined) deltaInput.now = options.now;
    const { delta, created } = getOrCreateDelta(store, id, deltaInput);
    const signalInput: SignalOnceInput = {
      id: `delta_sig_${hash(`${detectorKey}\u0000${delta.id}`)}`,
      deltaId: delta.id,
      type: "user-correction",
      explanation: "User correction language matched a conservative phrase such as 'no, actually' or 'that's not correct'.",
      confidence: 0.68,
      evidenceRefs,
      metadata: { detectorKey, sourceFile: event.source.sourceFile, lineNumber: event.source.lineNumber },
    };
    if (options.now !== undefined) signalInput.now = options.now;
    const signal = recordSignalOnce(store, signalInput);
    results.push({ delta, signals: [signal], created });
  }
  return results;
}

export function suggestDeltasFromParsedSessionsWithStore(store: FlightRecorderStore, parsedSessions: ParsedSession[], options: UserCorrectionSuggestionOptions = {}): DeltaCaptureResult[] {
  return parsedSessions.flatMap((parsed) => suggestDeltasFromUserCorrectionsWithStore(store, parsed, options));
}

export function suggestDeltasFromExistingSignals(options: CaptureDeltasOptions = {}): DeltaCaptureResult[] {
  const dataDir = options.dataDir ?? getDefaultDataDir();
  const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
  try {
    return suggestDeltasFromReflectionClustersWithStore(store, options);
  } finally {
    store.close();
  }
}
