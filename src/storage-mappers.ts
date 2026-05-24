import { createHash } from "node:crypto";
import path from "node:path";
import { redactLocalPaths, sanitizeStoredText } from "./redact.js";
import type {
  ArtifactCandidate,
  ArtifactCandidateOutcome,
  ArtifactCandidateStatus,
  ArtifactCandidateType,
  ClusterEvidenceRef,
  DeltaDetectorSignal,
  DeltaDetectorSignalType,
  DeltaEvidenceRef,
  DeltaEvidenceSourceType,
  DeltaRecurrenceLink,
  ExpectationDelta,
  ExpectationDeltaSeverity,
  ExpectationDeltaSource,
  ExpectationDeltaStatus,
  FailureCluster,
  FailureClusterStatus,
  FailureEpisode,
  FeedbackAction,
  FeedbackActionRecord,
  FeedbackTargetType,
  FlightRule,
  FlightRuleCandidate,
  FlightRuleScope,
  LiveFailureOccurrence,
  ReflectionProposal,
  SourceRef,
  SuggestionOutcome,
} from "./types.js";

export interface EpisodeRow {
  id: string;
  sourceFile: string;
  signature: string;
  problemSummary: string;
  status: string;
  confidence: number;
  cwd: string | null;
  sessionId: string | null;
  sourceRefsJson: string;
  observed: string;
  attemptsJson: string;
  resolutionJson: string | null;
  filesJson: string;
  limitsJson: string;
  searchText: string;
}

export interface OccurrenceRow {
  id: string;
  dedupeKey: string;
  source: string;
  toolName: string | null;
  command: string | null;
  cwd: string | null;
  sessionFile: string | null;
  entryId: string | null;
  timestamp: string | null;
  signature: string;
  queryPreview: string;
  snippet: string;
  repeatCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  suggestionJson: string | null;
  dataJson: string;
}

export interface FeedbackActionRow {
  id: number;
  targetType: string;
  targetId: string;
  action: string;
  signature: string | null;
  note: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface FailureClusterRow {
  id: string;
  clusterKey: string;
  title: string;
  representativeSignature: string;
  status: string;
  count: number;
  occurrenceIdsJson: string;
  cwdSummaryJson: string;
  toolsJson: string;
  firstSeenAt: string;
  lastSeenAt: string;
  lastReflectedAt: string | null;
  score: number;
}

export interface ReflectionProposalRow {
  id: string;
  clusterId: string;
  generatedAt: string;
  mode: string;
  title: string;
  summary: string;
  affectedJson: string;
  likelyFix: string;
  confidence: number;
  evidenceJson: string;
  limitsJson: string;
  actionsJson: string;
}

export interface RuleCandidateRow {
  id: string;
  sourceType: string;
  sourceId: string;
  clusterId: string | null;
  status: string;
  draftText: string;
  proposedScope: string;
  projectRoot: string | null;
  projectRootDisplay: string | null;
  evidenceJson: string;
  evidenceCount: number;
  ruleId: string | null;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
}

export interface FlightRuleRow {
  id: string;
  candidateId: string;
  sourceProposalId: string;
  clusterId: string | null;
  scope: string;
  projectRoot: string | null;
  projectRootDisplay: string | null;
  text: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  disabledAt: string | null;
  lastInjectedAt: string | null;
  injectionCount: number;
}

export interface ExpectationDeltaRow {
  id: string;
  status: string;
  source: string;
  summary: string;
  expectation: string | null;
  reality: string | null;
  impact: string | null;
  severity: string;
  cwd: string | null;
  sourceSessionFile: string | null;
  sourceEntryId: string | null;
  evidenceJson: string;
  activeArtifactCandidateId: string | null;
  statusReason: string | null;
  metadataJson: string;
  createdAt: string;
  updatedAt: string;
  acceptedAt: string | null;
  routedAt: string | null;
  dismissedAt: string | null;
  resolvedAt: string | null;
  recurringAt: string | null;
}

export interface DeltaDetectorSignalRow {
  id: string;
  deltaId: string;
  type: string;
  explanation: string;
  confidence: number | null;
  evidenceJson: string;
  metadataJson: string;
  createdAt: string;
}

export interface ArtifactCandidateRow {
  id: string;
  deltaId: string;
  artifactType: string;
  status: string;
  title: string;
  rationale: string;
  proposedDraft: string | null;
  nextStep: string | null;
  confidence: number | null;
  limitsJson: string;
  evidenceJson: string;
  applied: number;
  appliedArtifactRef: string | null;
  outcome: string;
  outcomeSummary: string | null;
  supersedesCandidateId: string | null;
  metadataJson: string;
  createdAt: string;
  updatedAt: string;
  acceptedAt: string | null;
  dismissedAt: string | null;
  appliedAt: string | null;
  resolvedAt: string | null;
  recurringAt: string | null;
}

export interface DeltaRecurrenceLinkRow {
  id: string;
  deltaId: string;
  priorArtifactCandidateId: string;
  reason: string;
  similarity: number | null;
  evidenceJson: string;
  createdAt: string;
}

export function json(value: unknown): string {
  return JSON.stringify(value);
}

export function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function sanitizeJsonValue(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[truncated]";
  if (typeof value === "string") return sanitizeStoredText(value, 500);
  if (typeof value === "number" || typeof value === "boolean" || value === null) return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => sanitizeJsonValue(item, depth + 1));
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).slice(0, 40);
    return Object.fromEntries(entries.map(([key, item]) => [sanitizeStoredText(key, 80), sanitizeJsonValue(item, depth + 1)]));
  }
  return null;
}

export function sanitizeMetadata(metadata: Record<string, unknown> | undefined): Record<string, unknown> {
  return sanitizeJsonValue(metadata ?? {}) as Record<string, unknown>;
}

export function hash(value: string, length = 16): string {
  return createHash("sha256").update(value).digest("hex").slice(0, length);
}

function sanitizeSourceRef(ref: SourceRef): SourceRef {
  return {
    ...ref,
    sourceFile: redactLocalPaths(ref.sourceFile),
    cwd: ref.cwd ? redactLocalPaths(ref.cwd) : ref.cwd,
  };
}

export function sanitizeEpisodeForStorage(episode: FailureEpisode): FailureEpisode {
  return {
    ...episode,
    signature: sanitizeStoredText(episode.signature, 500),
    problemSummary: sanitizeStoredText(episode.problemSummary, 300),
    cwd: episode.cwd ? redactLocalPaths(episode.cwd) : episode.cwd,
    sourceRefs: episode.sourceRefs.map(sanitizeSourceRef),
    observed: sanitizeStoredText(episode.observed, 1_200),
    attempts: episode.attempts.map((attempt) => ({ ...attempt, summary: sanitizeStoredText(attempt.summary, 300), sourceRef: sanitizeSourceRef(attempt.sourceRef) })),
    resolution: episode.resolution ? { ...episode.resolution, summary: sanitizeStoredText(episode.resolution.summary, 300), sourceRef: sanitizeSourceRef(episode.resolution.sourceRef) } : null,
    files: episode.files.map(redactLocalPaths),
    limits: episode.limits.map((limit) => sanitizeStoredText(limit, 300)),
    searchText: sanitizeStoredText(episode.searchText, 2_000),
  };
}

export function rowToEpisode(row: EpisodeRow): FailureEpisode {
  return {
    id: row.id,
    sourceFile: row.sourceFile,
    signature: row.signature,
    problemSummary: row.problemSummary,
    status: row.status === "resolved" ? "resolved" : "unresolved",
    confidence: row.confidence,
    cwd: row.cwd,
    sessionId: row.sessionId,
    sourceRefs: parseJson<SourceRef[]>(row.sourceRefsJson, []),
    observed: row.observed,
    attempts: parseJson(row.attemptsJson, []),
    resolution: row.resolutionJson ? parseJson(row.resolutionJson, null) : null,
    files: parseJson<string[]>(row.filesJson, []),
    limits: parseJson<string[]>(row.limitsJson, []),
    searchText: row.searchText,
  };
}

export function rowToOccurrence(row: OccurrenceRow): LiveFailureOccurrence {
  return {
    id: row.id,
    dedupeKey: row.dedupeKey,
    source: row.source as LiveFailureOccurrence["source"],
    toolName: row.toolName,
    command: row.command,
    cwd: row.cwd,
    sessionFile: row.sessionFile,
    entryId: row.entryId,
    timestamp: row.timestamp,
    signature: row.signature,
    queryPreview: row.queryPreview,
    snippet: row.snippet,
    repeatCount: row.repeatCount,
    firstSeenAt: row.firstSeenAt,
    lastSeenAt: row.lastSeenAt,
    suggestion: row.suggestionJson ? parseJson<SuggestionOutcome | null>(row.suggestionJson, null) : null,
    data: parseJson<Record<string, unknown>>(row.dataJson, {}),
  };
}

export function rowToFeedback(row: FeedbackActionRow): FeedbackActionRecord {
  return {
    id: row.id,
    targetType: row.targetType as FeedbackTargetType,
    targetId: row.targetId,
    action: row.action as FeedbackAction,
    signature: row.signature,
    note: row.note,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
  };
}

export function rowToCluster(row: FailureClusterRow): FailureCluster {
  return {
    id: row.id,
    clusterKey: row.clusterKey,
    title: row.title,
    representativeSignature: row.representativeSignature,
    status: row.status as FailureClusterStatus,
    count: row.count,
    occurrenceIds: parseJson<string[]>(row.occurrenceIdsJson, []),
    cwdSummary: parseJson<string[]>(row.cwdSummaryJson, []),
    tools: parseJson<string[]>(row.toolsJson, []),
    firstSeenAt: row.firstSeenAt,
    lastSeenAt: row.lastSeenAt,
    lastReflectedAt: row.lastReflectedAt,
    score: row.score,
  };
}

export function rowToProposal(row: ReflectionProposalRow): ReflectionProposal {
  return {
    id: row.id,
    clusterId: row.clusterId,
    generatedAt: row.generatedAt,
    mode: row.mode === "model-assisted" ? "model-assisted" : "local",
    title: row.title,
    summary: row.summary,
    affected: parseJson<string[]>(row.affectedJson, []),
    likelyFix: row.likelyFix,
    confidence: row.confidence,
    evidence: parseJson<ClusterEvidenceRef[]>(row.evidenceJson, []),
    limits: parseJson<string[]>(row.limitsJson, []),
    actions: parseJson<FeedbackAction[]>(row.actionsJson, []),
  };
}

function ruleScope(value: string): FlightRuleScope {
  return value === "project" ? "project" : "global";
}

export function rowToRuleCandidate(row: RuleCandidateRow): FlightRuleCandidate {
  return {
    id: row.id,
    sourceType: "proposal",
    sourceId: row.sourceId,
    clusterId: row.clusterId,
    status: row.status === "approved" ? "approved" : row.status === "rejected" ? "rejected" : "draft",
    draftText: row.draftText,
    proposedScope: ruleScope(row.proposedScope),
    projectRoot: row.projectRoot,
    projectRootDisplay: row.projectRootDisplay,
    evidenceJson: parseJson<ClusterEvidenceRef[]>(row.evidenceJson, []),
    evidenceCount: row.evidenceCount,
    ruleId: row.ruleId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    approvedAt: row.approvedAt,
    rejectedAt: row.rejectedAt,
  };
}

export function rowToFlightRule(row: FlightRuleRow): FlightRule {
  return {
    id: row.id,
    candidateId: row.candidateId,
    sourceProposalId: row.sourceProposalId,
    clusterId: row.clusterId,
    scope: ruleScope(row.scope),
    projectRoot: row.projectRoot,
    projectRootDisplay: row.projectRootDisplay,
    text: row.text,
    status: row.status === "disabled" ? "disabled" : "active",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    disabledAt: row.disabledAt,
    lastInjectedAt: row.lastInjectedAt,
    injectionCount: row.injectionCount,
  };
}

function deltaStatus(value: string): ExpectationDeltaStatus {
  if (value === "accepted" || value === "dismissed" || value === "routed" || value === "resolved" || value === "recurring") return value;
  return "candidate";
}

function deltaSource(value: string): ExpectationDeltaSource {
  if (value === "manual" || value === "detector" || value === "reflection" || value === "import") return value;
  return "manual";
}

function deltaSeverity(value: string): ExpectationDeltaSeverity {
  if (value === "low" || value === "medium" || value === "high") return value;
  return "unknown";
}

function detectorSignalType(value: string): DeltaDetectorSignalType {
  if (
    value === "manual-capture" ||
    value === "repeated-tool-failure" ||
    value === "failed-validation" ||
    value === "user-correction" ||
    value === "reversal-retry-loop" ||
    value === "stale-edit-attempt" ||
    value === "repeated-clarification" ||
    value === "reflection-cluster"
  ) {
    return value;
  }
  return "other";
}

function artifactType(value: string): ArtifactCandidateType {
  if (
    value === "flight-rule" ||
    value === "loom-ticket" ||
    value === "loom-spec" ||
    value === "loom-research" ||
    value === "loom-knowledge" ||
    value === "test-check" ||
    value === "prompt-context" ||
    value === "skill-or-template" ||
    value === "code-legibility" ||
    value === "observe"
  ) {
    return value;
  }
  return "observe";
}

function artifactStatus(value: string): ArtifactCandidateStatus {
  if (
    value === "pending-review" ||
    value === "accepted" ||
    value === "routed" ||
    value === "dismissed" ||
    value === "applied" ||
    value === "resolved" ||
    value === "recurring"
  ) {
    return value;
  }
  return "candidate";
}

function artifactOutcome(value: string): ArtifactCandidateOutcome {
  if (value === "pending" || value === "helped" || value === "no-change" || value === "worse" || value === "superseded" || value === "needs-reroute") return value;
  return "unknown";
}

function evidenceSourceType(value: string): DeltaEvidenceSourceType {
  if (
    value === "occurrence" ||
    value === "episode" ||
    value === "cluster" ||
    value === "proposal" ||
    value === "rule-candidate" ||
    value === "flight-rule" ||
    value === "session-entry"
  ) {
    return value;
  }
  return "manual";
}

export function sanitizeDeltaEvidenceRefs(evidence: DeltaEvidenceRef[] | undefined): DeltaEvidenceRef[] {
  return (evidence ?? []).slice(0, 20).map((item) => ({
    sourceType: evidenceSourceType(item.sourceType),
    sourceId: item.sourceId ? sanitizeStoredText(item.sourceId, 160) : null,
    sourceFile: item.sourceFile ? redactLocalPaths(item.sourceFile) : null,
    sessionFile: item.sessionFile ? redactLocalPaths(item.sessionFile) : null,
    cwd: item.cwd ? redactLocalPaths(item.cwd) : null,
    entryId: item.entryId ? sanitizeStoredText(item.entryId, 160) : null,
    timestamp: item.timestamp ? sanitizeStoredText(item.timestamp, 80) : null,
    snippet: item.snippet ? sanitizeStoredText(item.snippet, 700) : null,
    note: item.note ? sanitizeStoredText(item.note, 300) : null,
  }));
}

export function rowToExpectationDelta(row: ExpectationDeltaRow): ExpectationDelta {
  return {
    id: row.id,
    status: deltaStatus(row.status),
    source: deltaSource(row.source),
    summary: row.summary,
    expectation: row.expectation,
    reality: row.reality,
    impact: row.impact,
    severity: deltaSeverity(row.severity),
    cwd: row.cwd,
    sourceSessionFile: row.sourceSessionFile,
    sourceEntryId: row.sourceEntryId,
    evidenceRefs: parseJson<DeltaEvidenceRef[]>(row.evidenceJson, []).map((item) => ({ ...item, sourceType: evidenceSourceType(item.sourceType) })),
    activeArtifactCandidateId: row.activeArtifactCandidateId,
    statusReason: row.statusReason,
    metadata: parseJson<Record<string, unknown>>(row.metadataJson, {}),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    acceptedAt: row.acceptedAt,
    routedAt: row.routedAt,
    dismissedAt: row.dismissedAt,
    resolvedAt: row.resolvedAt,
    recurringAt: row.recurringAt,
  };
}

export function rowToDeltaDetectorSignal(row: DeltaDetectorSignalRow): DeltaDetectorSignal {
  return {
    id: row.id,
    deltaId: row.deltaId,
    type: detectorSignalType(row.type),
    explanation: row.explanation,
    confidence: row.confidence,
    evidenceRefs: parseJson<DeltaEvidenceRef[]>(row.evidenceJson, []).map((item) => ({ ...item, sourceType: evidenceSourceType(item.sourceType) })),
    metadata: parseJson<Record<string, unknown>>(row.metadataJson, {}),
    createdAt: row.createdAt,
  };
}

export function rowToArtifactCandidate(row: ArtifactCandidateRow): ArtifactCandidate {
  return {
    id: row.id,
    deltaId: row.deltaId,
    artifactType: artifactType(row.artifactType),
    status: artifactStatus(row.status),
    title: row.title,
    rationale: row.rationale,
    proposedDraft: row.proposedDraft,
    nextStep: row.nextStep,
    confidence: row.confidence,
    limits: parseJson<string[]>(row.limitsJson, []),
    evidenceRefs: parseJson<DeltaEvidenceRef[]>(row.evidenceJson, []).map((item) => ({ ...item, sourceType: evidenceSourceType(item.sourceType) })),
    applied: row.applied === 1,
    appliedArtifactRef: row.appliedArtifactRef,
    outcome: artifactOutcome(row.outcome),
    outcomeSummary: row.outcomeSummary,
    supersedesCandidateId: row.supersedesCandidateId,
    metadata: parseJson<Record<string, unknown>>(row.metadataJson, {}),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    acceptedAt: row.acceptedAt,
    dismissedAt: row.dismissedAt,
    appliedAt: row.appliedAt,
    resolvedAt: row.resolvedAt,
    recurringAt: row.recurringAt,
  };
}

export function rowToDeltaRecurrenceLink(row: DeltaRecurrenceLinkRow): DeltaRecurrenceLink {
  return {
    id: row.id,
    deltaId: row.deltaId,
    priorArtifactCandidateId: row.priorArtifactCandidateId,
    reason: row.reason,
    similarity: row.similarity,
    evidenceRefs: parseJson<DeltaEvidenceRef[]>(row.evidenceJson, []).map((item) => ({ ...item, sourceType: evidenceSourceType(item.sourceType) })),
    createdAt: row.createdAt,
  };
}

export function sanitizeEvidenceRefs(evidence: ClusterEvidenceRef[]): ClusterEvidenceRef[] {
  return evidence.slice(0, 10).map((item) => ({
    ...item,
    cwd: item.cwd ? redactLocalPaths(item.cwd) : item.cwd,
    sessionFile: item.sessionFile ? redactLocalPaths(item.sessionFile) : item.sessionFile,
    snippet: sanitizeStoredText(item.snippet, 500),
  }));
}

export function cwdIsInsideProject(cwd: string, projectRoot: string): boolean {
  const relative = path.relative(path.resolve(projectRoot), path.resolve(cwd));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}
