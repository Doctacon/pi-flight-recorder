export type EventKind =
  | "user"
  | "assistant"
  | "bash"
  | "toolResult"
  | "compaction"
  | "branchSummary"
  | "custom"
  | "metadata"
  | "unknown";

export interface SourceRef {
  sourceFile: string;
  lineNumber: number;
  sessionId: string | null;
  cwd: string | null;
  entryId: string | null;
  parentId: string | null;
  timestamp: string | null;
  entryType: string;
  role: string | null;
  ancestry: string[];
}

export interface SessionHeader {
  type: "session";
  version: number | null;
  id: string | null;
  timestamp: string | null;
  cwd: string | null;
  parentSession: string | null;
}

export interface ParseWarning {
  sourceFile: string;
  lineNumber: number;
  message: string;
}

export interface SessionEvent {
  kind: EventKind;
  source: SourceRef;
  text: string;
  command: string | null;
  output: string | null;
  exitCode: number | null;
  cancelled: boolean;
  truncated: boolean;
  toolName: string | null;
  isError: boolean;
  raw: unknown;
}

export interface ParsedSession {
  sourceFile: string;
  header: SessionHeader | null;
  events: SessionEvent[];
  warnings: ParseWarning[];
}

export type EpisodeStatus = "resolved" | "unresolved";

export interface EpisodeAttempt {
  summary: string;
  sourceRef: SourceRef;
}

export interface EpisodeResolution {
  summary: string;
  sourceRef: SourceRef;
}

export interface FailureEpisode {
  id: string;
  sourceFile: string;
  signature: string;
  problemSummary: string;
  status: EpisodeStatus;
  confidence: number;
  cwd: string | null;
  sessionId: string | null;
  sourceRefs: SourceRef[];
  observed: string;
  attempts: EpisodeAttempt[];
  resolution: EpisodeResolution | null;
  files: string[];
  limits: string[];
  searchText: string;
}

export interface SessionDiscoveryOptions {
  sourceDirs: string[];
  includeArchives?: boolean;
}

export type LiveFailureSource = "tool_result" | "user_bash" | "watcher" | "manual" | "episode";

export type SuggestionOutcomeKind = "not-evaluated" | "suggested" | "suppressed";

export interface SuggestionOutcome {
  kind: SuggestionOutcomeKind;
  reason: string | null;
  episodeId: string | null;
  confidence: number | null;
  at: string;
}

export interface LiveFailureOccurrence {
  id: string;
  dedupeKey: string;
  source: LiveFailureSource;
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
  suggestion: SuggestionOutcome | null;
  data: Record<string, unknown>;
}

export interface NewFailureOccurrence {
  source: LiveFailureSource;
  query: string;
  toolName?: string | null;
  command?: string | null;
  cwd?: string | null;
  sessionFile?: string | null;
  entryId?: string | null;
  timestamp?: string | null;
  signature?: string | null;
  dedupeKey?: string | null;
  data?: Record<string, unknown>;
  now?: string;
}

export type FeedbackAction =
  | "useful"
  | "wrong-match"
  | "already-solved"
  | "not-useful"
  | "snooze"
  | "silence-pattern"
  | "promote-later"
  | "make-rule"
  | "dismiss";

export type FeedbackTargetType = "episode" | "occurrence" | "cluster" | "proposal" | "signature";

export interface FeedbackActionRecord {
  id: number;
  targetType: FeedbackTargetType;
  targetId: string;
  action: FeedbackAction;
  signature: string | null;
  note: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export type FailureClusterStatus = "active" | "snoozed" | "silenced" | "dismissed" | "promoted-later" | "make-rule";

export interface FailureCluster {
  id: string;
  clusterKey: string;
  title: string;
  representativeSignature: string;
  status: FailureClusterStatus;
  count: number;
  occurrenceIds: string[];
  cwdSummary: string[];
  tools: string[];
  firstSeenAt: string;
  lastSeenAt: string;
  lastReflectedAt: string | null;
  score: number;
}

export interface ClusterEvidenceRef {
  occurrenceId: string;
  source: LiveFailureSource;
  cwd: string | null;
  sessionFile: string | null;
  entryId: string | null;
  snippet: string;
  seenAt: string;
}

export type ReflectionMode = "local" | "model-assisted";

export interface ReflectionProposal {
  id: string;
  clusterId: string;
  generatedAt: string;
  mode: ReflectionMode;
  title: string;
  summary: string;
  affected: string[];
  likelyFix: string;
  confidence: number;
  evidence: ClusterEvidenceRef[];
  limits: string[];
  actions: FeedbackAction[];
}

export type FlightRuleScope = "global" | "project";
export type RuleCandidateStatus = "draft" | "approved" | "rejected";
export type FlightRuleStatus = "active" | "disabled";

export interface FlightRuleCandidate {
  id: string;
  sourceType: "proposal";
  sourceId: string;
  clusterId: string | null;
  status: RuleCandidateStatus;
  draftText: string;
  proposedScope: FlightRuleScope;
  projectRoot: string | null;
  projectRootDisplay: string | null;
  evidenceJson: ClusterEvidenceRef[];
  evidenceCount: number;
  ruleId: string | null;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
}

export interface FlightRule {
  id: string;
  candidateId: string;
  sourceProposalId: string;
  clusterId: string | null;
  scope: FlightRuleScope;
  projectRoot: string | null;
  projectRootDisplay: string | null;
  text: string;
  status: FlightRuleStatus;
  createdAt: string;
  updatedAt: string;
  disabledAt: string | null;
  lastInjectedAt: string | null;
  injectionCount: number;
}
