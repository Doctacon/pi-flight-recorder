import { createHash } from "node:crypto";

import { buildFlightLearnDiagnosisView, type FlightLearnDiagnosisInput, type FlightLearnDiagnosisView } from "./flight-learn-diagnosis.js";
import { sanitizeStoredText } from "./redact.js";
import type { DeltaDetectorSignal, DeltaEvidenceRef, ExpectationDelta } from "./types.js";

export type LocalDiagnosisPolishFallbackReason =
  | "disabled"
  | "provider-unavailable"
  | "timeout"
  | "provider-error"
  | "malformed-json"
  | "schema-invalid"
  | "unsafe-output"
  | "unsupported-facts"
  | "empty-output";

export type LocalDiagnosisPolishDisplayState = "deterministic" | "validated" | "accepted-narrative" | "draft";
export type LocalDiagnosisNarrativeStatus = "none" | "accepted" | "draft" | "rejected";

export interface LocalDiagnosisCardCopyFields {
  whyThisWasFlagged?: string;
  evidenceSummary?: string;
}

export type LocalDiagnosisPolishedView = FlightLearnDiagnosisView & LocalDiagnosisCardCopyFields;

export interface LocalDiagnosisPolishResult {
  view: LocalDiagnosisPolishedView;
  deterministicView: LocalDiagnosisPolishedView;
  usedLocalModel: boolean;
  displayState: LocalDiagnosisPolishDisplayState;
  narrativeStatus: LocalDiagnosisNarrativeStatus;
  fallbackReason: LocalDiagnosisPolishFallbackReason | null;
  validationIssue: string | null;
}

export interface LocalDiagnosisPolishOptions {
  enabled?: boolean;
  provider?: LocalDiagnosisPolishProvider | null;
  timeoutMs?: number;
  judgeProvider?: LocalNarrativeJudgeProvider | null;
  judgeTimeoutMs?: number;
}

/**
 * Provider boundary for explicitly enabled local/open-source diagnosis polish.
 *
 * The interface intentionally carries a bounded prompt and has no generic URL,
 * API-key, header, or hosted-provider shape. Real adapters must stay local and
 * fail closed; this contract only defines the model-agnostic call/validation
 * harness.
 */
export interface LocalDiagnosisPolishProvider {
  completeLocalDiagnosisPolish: (request: LocalDiagnosisPolishRequest) => Promise<string>;
}

export interface LocalDiagnosisPolishRequest {
  prompt: string;
  factPacket: LocalDiagnosisFactPacket;
  signal: AbortSignal;
}

export type LocalDiagnosisSupportFactId = `F${number}`;

export type LocalDiagnosisSupportFactKind =
  | "deterministic-headline"
  | "deterministic-what-happened"
  | "deterministic-why-it-matters"
  | "expected-behavior"
  | "delta-summary"
  | "delta-expectation"
  | "delta-reality"
  | "delta-impact"
  | "occurrence-count"
  | "signal"
  | "evidence-summary";

export interface LocalDiagnosisSupportFact {
  id: LocalDiagnosisSupportFactId;
  kind: LocalDiagnosisSupportFactKind;
  text: string;
  confidence?: number | null;
}

export interface LocalDiagnosisFactPacket {
  version: 2;
  deterministic: {
    headline: string;
    whatHappened: string;
    whyItMatters: string;
    expectedBehavior: string | null;
    confidence: FlightLearnDiagnosisView["confidence"];
  };
  delta: {
    source: ExpectationDelta["source"];
    status: ExpectationDelta["status"];
    severity: ExpectationDelta["severity"];
    summary: string | null;
    expectation: string | null;
    reality: string | null;
    impact: string | null;
    occurrenceCount: number | null;
  };
  signals: LocalDiagnosisSignalFact[];
  evidence: LocalDiagnosisEvidenceFact[];
  facts: LocalDiagnosisSupportFact[];
  bounds: {
    maxDeltaFieldChars: number;
    maxSignalCount: number;
    maxSignalExplanationChars: number;
    maxEvidenceCount: number;
    maxEvidenceTextChars: number;
    includedSignalCount: number;
    totalSignalCount: number;
    includedEvidenceCount: number;
    totalEvidenceCount: number;
    maxNarrativeSentences: number;
    maxNarrativeChars: number;
    maxFacts: number;
    maxFactChars: number;
  };
}

export interface LocalDiagnosisSignalFact {
  type: DeltaDetectorSignal["type"];
  confidence: number | null;
  explanation: string | null;
}

export interface LocalDiagnosisEvidenceFact {
  sourceType: DeltaEvidenceRef["sourceType"];
  timestamp: string | null;
  noteSummary: string | null;
  snippetSummary: string | null;
}

export type LocalNarrativeJudgeOverallVerdict = "accept" | "reject" | "uncertain";
export type LocalNarrativeJudgeSentenceVerdict =
  | "supported"
  | "supported-cautious-connection"
  | "partially-supported"
  | "unsupported"
  | "unsafe"
  | "action-advice"
  | "not-useful"
  | "uncertain";
export type LocalNarrativeJudgeConfidence = "low" | "medium" | "high";
export type LocalNarrativeJudgeFailClosedReason =
  | "unsupported-facts"
  | "unsafe-output"
  | "action-advice"
  | "low-information"
  | "not-useful"
  | "schema-invalid"
  | "judge-uncertain";

export interface LocalNarrativeJudgeProvider {
  completeLocalNarrativeJudge: (request: LocalNarrativeJudgeRequest) => Promise<string>;
}

export interface LocalNarrativeJudgeCitedFact {
  id: LocalDiagnosisSupportFactId;
  kind: LocalDiagnosisSupportFactKind;
  text: string;
  confidence?: number | null;
}

export interface LocalNarrativeJudgeCandidateSentence {
  index: number;
  text: string;
  factIds: LocalDiagnosisSupportFactId[];
  citedFacts: LocalNarrativeJudgeCitedFact[];
}

export interface LocalNarrativeJudgeCandidate {
  field: "whatHappened";
  text: string;
  sentences: LocalNarrativeJudgeCandidateSentence[];
}

export interface LocalNarrativeJudgeRequest {
  schemaVersion: 1;
  prompt: string;
  policy: {
    field: "whatHappened";
    displayOnly: true;
    maxSentences: number;
    maxNarrativeChars: number;
    rejectOnUncertainty: true;
    acceptedSentenceVerdicts: Array<"supported" | "supported-cautious-connection">;
  };
  deterministic: LocalDiagnosisFactPacket["deterministic"];
  facts: LocalDiagnosisSupportFact[];
  candidate: LocalNarrativeJudgeCandidate;
  signal: AbortSignal;
}

export interface LocalNarrativeJudgeSentenceResponse {
  index: number;
  verdict: LocalNarrativeJudgeSentenceVerdict;
  supportedFactIds: LocalDiagnosisSupportFactId[];
  unsupportedClaims: string[];
  reason: string;
  confidence: LocalNarrativeJudgeConfidence;
}

export interface LocalNarrativeJudgeResponse {
  schemaVersion: 1;
  overallVerdict: LocalNarrativeJudgeOverallVerdict;
  failClosedReason?: LocalNarrativeJudgeFailClosedReason;
  sentences: LocalNarrativeJudgeSentenceResponse[];
}

export interface LocalDiagnosisPolishValidationContext {
  factPacket: LocalDiagnosisFactPacket;
  deterministicView: FlightLearnDiagnosisView;
}

export type LocalDiagnosisPolishValidationResult =
  | { ok: true; value: LocalDiagnosisPolishDisplayFields; narrativeCandidate: LocalNarrativeJudgeCandidate | null }
  | { ok: false; reason: LocalDiagnosisPolishFallbackReason; issue: string };

export interface LocalDiagnosisPolishDisplayFields {
  headline?: string;
  whatHappened?: string;
  whyItMatters?: string;
  expectedBehavior?: string;
  whyThisWasFlagged?: string;
  evidenceSummary?: string;
}

const DEFAULT_TIMEOUT_MS = 750;
const MAX_TIMEOUT_MS = 5_000;
const MAX_DELTA_FIELD_CHARS = 320;
const MAX_SIGNAL_COUNT = 5;
const MAX_SIGNAL_EXPLANATION_CHARS = 220;
const MAX_EVIDENCE_COUNT = 3;
const MAX_EVIDENCE_TEXT_CHARS = 180;
const MAX_EVIDENCE_TIMESTAMP_CHARS = 64;
const MAX_FACT_TEXT_CHARS = 240;
const MAX_FACT_COUNT = 9 + MAX_SIGNAL_COUNT + (MAX_EVIDENCE_COUNT * 2);
const ABSOLUTE_PATH_REDACTION = "[local path omitted]";
const FILE_URI_PREFIX_PATTERN = /\bfile:/gi;
const PARTIAL_REDACTION_PATH_TAIL_PATTERN = /\[local path omitted\]\s+[^\/\s"'`<>]+(?:\s+[^\/\s"'`<>]+)*\/[^"'`\r\n<>]*/gi;
const LOCAL_PATH_REDACTION_OUTPUT_PATTERN = /\[\s*local path omitted\s*\]/i;
const WINDOWS_ABSOLUTE_PATH_PATTERN = /\b[A-Za-z]:\\[^\s"'`<>|]+(?:\\[^\s"'`<>|]+)*/g;
const ISO_UTC_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/;
const RESPONSE_FIELD_LIMITS = {
  headline: 120,
  whatHappened: 520,
  whyItMatters: 300,
  expectedBehavior: 320,
  whyThisWasFlagged: 360,
  evidenceSummary: 360,
} as const;
const WHAT_HAPPENED_MAX_SENTENCES = 4;
const MAX_FACT_IDS_PER_NARRATIVE_SENTENCE = 8;
const MAX_FACT_IDS_PER_DISPLAY_FIELD = 8;

type ResponseFieldName = keyof typeof RESPONSE_FIELD_LIMITS;
type FactCitedDisplayFieldName = "whyThisWasFlagged" | "evidenceSummary";

export type LocalDiagnosisPolishDiagnosticKind = "accepted" | "omitted" | "soft-rejection" | "hard-rejection" | "schema-rejection" | "not-present";
export type LocalDiagnosisPolishDiagnosticValueKind = "array" | "boolean" | "null" | "number" | "object" | "string" | "undefined";
export type LocalDiagnosisPolishDiagnosticRuleId =
  | "response.malformed-json"
  | "response.not-object"
  | "response.extra-top-level-key"
  | "response.schema-version-invalid"
  | "response.empty-output"
  | "field.not-present"
  | "field.invalid-type"
  | "field.unknown-value-omitted"
  | "field.length-limit"
  | "field.unsupported-facts"
  | "expected.missing-support-facts"
  | "expected.negation-mismatch"
  | "expected.unsupported-facts"
  | "fact-field.not-object"
  | "fact-field.extra-key"
  | "fact-field.text-invalid-type"
  | "fact-field.fact-ids-missing"
  | "fact-field.fact-ids-too-many"
  | "fact-field.fact-id-invalid-type"
  | "fact-field.fact-id-duplicate"
  | "fact-field.fact-id-unknown"
  | "fact-field.empty-text-omitted"
  | "fact-field.length-limit"
  | "fact-field.evidence-summary-non-evidence-fact"
  | "fact-field.why-flagged-missing-support-kind"
  | "fact-field.unsupported-facts"
  | "what-happened.not-object"
  | "what-happened.extra-key"
  | "what-happened.sentences-not-array"
  | "what-happened.empty-sentences-omitted"
  | "what-happened.too-many-sentences"
  | "what-happened.sentence-not-object"
  | "what-happened.sentence-extra-key"
  | "what-happened.sentence-text-invalid-type"
  | "what-happened.sentence-fact-ids-missing"
  | "what-happened.sentence-fact-ids-too-many"
  | "what-happened.sentence-fact-id-invalid-type"
  | "what-happened.sentence-fact-id-duplicate"
  | "what-happened.sentence-fact-id-unknown"
  | "what-happened.sentence-empty-omitted"
  | "what-happened.sentence-multiple-sentences"
  | "what-happened.sentence-action-advice"
  | "what-happened.sentence-unsupported-mutation-claim"
  | "what-happened.length-limit"
  | "what-happened.duplicate-display-text-omitted"
  | "unsafe.prompt-or-full-prompt"
  | "unsafe.transcript"
  | "unsafe.secret"
  | "unsafe.raw-path"
  | "unsafe.raw-command"
  | "unsafe.route-or-action-advice"
  | "unsafe.mutation-instruction"
  | "unsafe.generated-evidence-claim"
  | "unsafe.internal-provenance"
  | "unsafe.non-display-content";

export interface LocalDiagnosisPolishDiagnosticTextMetrics {
  rawLength: number;
  normalizedLength: number;
  sha256: string;
}

export interface LocalDiagnosisPolishFieldDiagnostic {
  field: ResponseFieldName;
  present: boolean;
  valueKind: LocalDiagnosisPolishDiagnosticValueKind;
  diagnosticKind: LocalDiagnosisPolishDiagnosticKind;
  outcome: "accepted" | "omitted" | "rejected" | "not-present";
  reason: LocalDiagnosisPolishFallbackReason | null;
  issue: string | null;
  ruleId: LocalDiagnosisPolishDiagnosticRuleId | null;
  textMetrics?: LocalDiagnosisPolishDiagnosticTextMetrics;
  sentenceCount?: number;
  sentenceIndex?: number;
  citedFactCount?: number;
  unknownFactIdCount?: number;
  repeatedFactIdCount?: number;
  unsupportedContentTokenCount?: number;
  unsupportedNumberTokenCount?: number;
}

export interface LocalDiagnosisPolishResponseDiagnostics {
  schemaVersion: 1;
  response: {
    rawLength: number;
    sha256: string;
    parseValid: boolean;
    objectValid: boolean;
    valueKind: LocalDiagnosisPolishDiagnosticValueKind;
    allowedTopLevelKeyPresence: Record<LocalDiagnosisTopLevelResponseField, boolean>;
    extraTopLevelKeyCount: number;
    extraTopLevelKeyHashes: Array<{ length: number; sha256: string }>;
  };
  productEquivalent: {
    ok: boolean;
    reason: LocalDiagnosisPolishFallbackReason | null;
    issue: string | null;
    firstFailureRuleId: LocalDiagnosisPolishDiagnosticRuleId | null;
    firstFailureField: ResponseFieldName | null;
  };
  fields: LocalDiagnosisPolishFieldDiagnostic[];
}
type LocalDiagnosisTopLevelResponseField = ResponseFieldName | "schemaVersion";

const RESPONSE_FIELDS: ResponseFieldName[] = ["headline", "whatHappened", "whyItMatters", "expectedBehavior", "whyThisWasFlagged", "evidenceSummary"];
const TOP_LEVEL_RESPONSE_FIELDS = new Set<LocalDiagnosisTopLevelResponseField>(["schemaVersion", "headline", "whatHappened", "whyItMatters", "expectedBehavior", "whyThisWasFlagged", "evidenceSummary"]);
const FACT_CITED_DISPLAY_FIELDS = new Set<FactCitedDisplayFieldName>(["whyThisWasFlagged", "evidenceSummary"]);
const CORE_RESPONSE_FIELDS = new Set<ResponseFieldName>(["headline", "whatHappened", "whyItMatters", "expectedBehavior"]);
const FACT_CITED_DISPLAY_RESPONSE_FIELDS = new Set(["text", "factIds"]);
const WHY_FLAGGED_SUPPORT_KINDS = new Set<LocalDiagnosisSupportFactKind>(["delta-summary", "delta-reality", "occurrence-count", "signal", "evidence-summary", "deterministic-headline", "deterministic-what-happened"]);
const EXPECTED_BEHAVIOR_SUPPORT_KINDS = new Set<LocalDiagnosisSupportFactKind>(["expected-behavior", "delta-expectation"]);
const EXPECTED_BEHAVIOR_NEGATION_PATTERN = /\b(?:no|not|never|avoid|without|instead\s+of|cannot|can't|do\s+not|don't|shouldn't|won't)\b/i;
const WHAT_HAPPENED_RESPONSE_FIELDS = new Set(["sentences"]);
const WHAT_HAPPENED_SENTENCE_FIELDS = new Set(["text", "factIds"]);
const JUDGE_TOP_LEVEL_RESPONSE_FIELDS = new Set(["schemaVersion", "overallVerdict", "failClosedReason", "sentences"]);
const JUDGE_SENTENCE_RESPONSE_FIELDS = new Set(["index", "verdict", "supportedFactIds", "unsupportedClaims", "reason", "confidence"]);
const JUDGE_OVERALL_VERDICTS = new Set<LocalNarrativeJudgeOverallVerdict>(["accept", "reject", "uncertain"]);
const JUDGE_ACCEPTED_SENTENCE_VERDICTS = new Set<LocalNarrativeJudgeSentenceVerdict>(["supported", "supported-cautious-connection"]);
const JUDGE_SENTENCE_VERDICTS = new Set<LocalNarrativeJudgeSentenceVerdict>(["supported", "supported-cautious-connection", "partially-supported", "unsupported", "unsafe", "action-advice", "not-useful", "uncertain"]);
const JUDGE_CONFIDENCE_VALUES = new Set<LocalNarrativeJudgeConfidence>(["low", "medium", "high"]);
const JUDGE_FAIL_CLOSED_REASONS = new Set<LocalNarrativeJudgeFailClosedReason>(["unsupported-facts", "unsafe-output", "action-advice", "low-information", "not-useful", "schema-invalid", "judge-uncertain"]);
const MAX_JUDGE_REASON_CHARS = 240;
const MAX_JUDGE_UNSUPPORTED_CLAIM_CHARS = 180;

const DELTA_SOURCE_VALUES = new Set<ExpectationDelta["source"]>(["manual", "detector", "reflection", "import"]);
const DELTA_STATUS_VALUES = new Set<ExpectationDelta["status"]>(["candidate", "accepted", "dismissed", "routed", "resolved", "recurring"]);
const DELTA_SEVERITY_VALUES = new Set<ExpectationDelta["severity"]>(["low", "medium", "high", "unknown"]);
const SIGNAL_TYPE_VALUES = new Set<DeltaDetectorSignal["type"]>(["manual-capture", "repeated-tool-failure", "failed-validation", "user-correction", "reversal-retry-loop", "stale-edit-attempt", "repeated-clarification", "reflection-cluster", "other"]);
const EVIDENCE_SOURCE_TYPE_VALUES = new Set<DeltaEvidenceRef["sourceType"]>(["occurrence", "episode", "cluster", "proposal", "rule-candidate", "flight-rule", "session-entry", "manual"]);

const UNKNOWN_VALUES = new Set(["", "unknown", "n/a", "none", "null", "undefined", "same", "unchanged", "not sure", "not known"]);

const SECRET_OUTPUT_PATTERNS: RegExp[] = [
  /\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|token|password|passwd|secret|client[_-]?secret|authorization)\b\s*[:=]/i,
  /\bBearer\s+[A-Za-z0-9._~+/=-]+/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/i,
  /\b[A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|API_KEY|PRIVATE_KEY)[A-Z0-9_]*=/,
  /\[\s*(?:REDACTED(?:[_\s-][A-Z0-9 _-]+)?|stack trace omitted|raw session transcript omitted|prompt text omitted|local path omitted)\s*\]/i,
  /<(?:secret-value-redacted|local-path:redacted|pi-session-file:redacted)>/i,
];

const RAW_PATH_OUTPUT_PATTERNS: RegExp[] = [
  LOCAL_PATH_REDACTION_OUTPUT_PATTERN,
  /\/(?:Users|home)\//i,
  /\/(?:private\/)?var\/folders\//i,
  /\/tmp\//i,
  /<pi-session-file:/i,
  /\.pi\/agent\/sessions/i,
  /\b[A-Za-z]:\\/,
];

const RAW_COMMAND_OUTPUT_PATTERNS: RegExp[] = [
  /\b(?:bash|zsh|sh)\s+(?:-lc|cd)\b/i,
  /\b(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?[\w:-]+\b/i,
  /\b(?:vitest|tsc|eslint|prettier)\b/i,
  /\b(?:git|python3?|node|npx|tsx|vite|deno|make|go|cargo|pytest|uv|pip|brew|duckdb|sqlite3?|psql|mysql|redis-cli|docker|kubectl)\s+[A-Za-z0-9_./:-]+\b/i,
  /\b(?:ls|cat|grep|rg|sed|awk|curl|wget|rm|cp|mv|mkdir|touch|chmod|chown|ssh|scp|rsync|find|xargs|tar|unzip|zip)\s+(?:--?[A-Za-z0-9][\w-]*|[^\s]+)\b/i,
  /(?:^|\s)(?:&&|\|\||>|2>|\$)\s*/,
];

const DISPLAY_ONLY_FORBIDDEN_PATTERNS: RegExp[] = [
  /\b(?:route|routes|routed|routing)\b/i,
  /\b(?:choose|select|press|click)\b/i,
  /(?:^|[.!?]\s+)(?:then\s+|please\s+)*(?:add|edit|modify|change|delete|remove|fix|write|create|update)\s+(?:a\s+|an\s+|the\s+)?(?:test|tests|file|files|code|source|module|dependency|prompt|rule|ticket|artifact|candidate|loom|skill)\b/i,
  /\b(?:you|we|they|the\s+assistant|the\s+user)\s+(?:(?:can|could|should|might|may|would|must|will)|(?:(?:need|needs|has|have)\s+to))\s+(?:then\s+|also\s+|please\s+)*(?:add|edit|modify|change|delete|remove|fix|write|create|update|route|choose|select|press|click|apply|store|save|persist|rerun|re-run|reinstall|review)\b/i,
  /\b(?:you|we|they|the\s+user)\s+(?:(?:can|could|should|might|may|would|must|will)|(?:(?:need|needs|has|have)\s+to))\s+(?:then\s+|also\s+|please\s+)*keep\s+(?:editing|writing|changing|updating|creating|routing|reviewing|rerunning|reinstalling)\b/i,
  /\b(?:create|apply|store|save|persist|write)\s+(?:a\s+)?(?:route|artifact|candidate|rule|ticket|loom|file|prompt|skill|source)/i,
  /\b(?:artifact|candidate|flight\s*rule|loom\s+(?:ticket|spec|research|knowledge|record)|classifier|route\s+ranking)\b/i,
  /\b(?:follow-up|followup)\b/i,
  /\b(?:source files?|docs?|prompts?|skills?)\s+(?:should|must|need|needs|will)\s+(?:be\s+)?(?:changed|updated|created|written|mutated)\b/i,
  /\b(?:fact\s+packet|bounded\s+fact\s+packet|(?:bounded|redacted)\s+packets?|packets?\b|allowed\s+keys?|json\s+(?:object|schema|response)|response\s+schema|deltas?\b|bounds?\b|analysis\s+fields?|headlines?\b|display\s+fields?|schema\s+fields?|field\s+names?|problem\s+(?:field|key|section)|whatHappened\s+(?:field|key))\b/i,
  /\b(?:detector|reflection\s+cluster|cluster_[a-z0-9_-]+|confidence(?:\s+score)?|record\s+ids?|source\s+ids?|session\s+ids?|entry\s+ids?|fact\s+ids?|sourceType|sourceFile|sessionFile|cwd)\b/i,
  /\b(?:generated|created|added|fabricated|invented|synthesized)\s+(?:new\s+|extra\s+)?(?:evidence|refs?|snippets?)\b/i,
  /\b(?:new|extra|fabricated|invented|synthetic)\s+(?:evidence|refs?|snippets?)\b/i,
];

const WHAT_HAPPENED_GENERIC_IMPERATIVE_VERBS = "re-?run|run|validate|check|use(?!\\s+of\\b)|do|perform|execute|retry|inspect|verify|confirm|open|install|reinstall|fix|update|edit|write|create|route|choose|select|press|click|apply|store|save|persist";
const WHAT_HAPPENED_IMPERATIVE_CLAUSE_PATTERN = new RegExp(`^(?:(?:and|then|please|now|next)\\s+)*(?:(?:${WHAT_HAPPENED_GENERIC_IMPERATIVE_VERBS})\\b|review\\s+(?:the|this|that|result|output|evidence|card|issue|failure|pattern)\\b|keep\\s+(?:validating|editing|writing|changing|updating|creating|routing|reviewing|rerunning|reinstalling)\\b)`, "i");
const WHAT_HAPPENED_INTRODUCTORY_ACTION_PATTERN = new RegExp(`^(?:after|before|when|once|if|because|for|during|to)\\b[^.!?;:,]{0,120}\\b(?:(?:and|then|please|now|next)\\s+)*(?:(?:${WHAT_HAPPENED_GENERIC_IMPERATIVE_VERBS})\\b|review\\s+(?:the|this|that|result|output|evidence|card|issue|failure|pattern)\\b|keep\\s+(?:validating|editing|writing|changing|updating|creating|routing|reviewing|rerunning|reinstalling)\\b)`, "i");
const CONCRETE_MUTATION_SUBJECT = "source|code|docs?|documentation|loom|rule|ticket|artifact|candidate|prompt|skill|database|migration|production|data|file|files?|module|dependency|schema|storage|record|records?";
const CONCRETE_MUTATION_VERB = "changed|modified|updated|created|deleted|removed|written|rewritten|wrote|rewrote|edited|mutated|corrupted|broke|broken|deployed|migrated|overwrote|overwritten";
const CONCRETE_MUTATION_CLAIM_PATTERN = new RegExp(
  `\\b(?:${CONCRETE_MUTATION_SUBJECT})\\b.{0,80}\\b(?:${CONCRETE_MUTATION_VERB})\\b|\\b(?:${CONCRETE_MUTATION_VERB})\\b.{0,80}\\b(?:${CONCRETE_MUTATION_SUBJECT})\\b`,
  "i",
);

const FULL_PROMPT_PATTERNS: RegExp[] = [
  /\b(?:system|developer|user)\s+prompt\b/i,
  /\bfull\s+prompt\b/i,
  /BEGIN\s+(?:SYSTEM\s+)?PROMPT/i,
  /\byou are (?:chatgpt|an ai|a helpful assistant)\b/i,
];

const TRANSCRIPT_LINE_PATTERN = /^\s*(?:user|assistant|system|developer|tool|bashExecution)\s*:/gim;
const STACK_TRACE_LINE_PATTERN = /^\s*(?:at\s+\S+\s+\(|at\s+file:|at\s+\/|Caused by:|Traceback \(most recent call last\):|File "[^"]+", line \d+)/i;

const STOP_WORDS = new Set([
  "about", "above", "after", "again", "against", "also", "already", "amid", "among", "and", "any", "are", "around", "because", "been", "before", "being", "below", "between", "both", "but", "can", "cannot", "could", "did", "does", "doing", "done", "during", "each", "for", "from", "had", "has", "have", "having", "into", "its", "itself", "just", "like", "may", "might", "more", "most", "must", "not", "off", "once", "only", "onto", "our", "out", "over", "same", "should", "than", "that", "the", "their", "them", "then", "there", "these", "this", "those", "through", "too", "twice", "under", "until", "was", "were", "when", "where", "whether", "which", "while", "with", "within", "without", "would", "your",
]);

const COMMON_DIAGNOSIS_TOKENS = new Set([
  "assistant", "available", "behavior", "card", "clear", "current", "describes", "evidence", "expected", "explains", "field", "flagged", "follow", "friction", "hard", "human", "issue", "local", "made", "makes", "matter", "matters", "needed", "needs", "observed", "operator", "points", "problem", "progress", "recent", "recorded", "redacted", "repeated", "repeatedly", "result", "results", "review", "session", "sessions", "state", "stored", "summarizes", "summary", "text", "trust", "unclear", "unknown", "workflow",
]);

const UNSUPPORTED_CONCRETE_TOKENS = new Set([
  "actor", "actors", "admin", "api", "auth", "authentication", "cache", "cached", "client", "container", "containers", "corrupt", "corrupted", "customer", "data", "database", "databases", "dependency", "dependencies", "deploy", "deployed", "deployment", "docker", "endpoint", "endpoints", "environment", "environments", "external", "file", "files", "migration", "migrations", "module", "modules", "network", "outage", "permission", "permissions", "production", "rebuild", "rebuilt", "request", "requests", "server", "service", "services", "source", "token", "tokens", "user", "users",
]);
const MAX_UNSUPPORTED_PARAPHRASE_TOKENS = 2;

const SYNONYM_GROUPS: string[][] = [
  ["validation", "validate", "validated", "validating", "check", "checks", "test", "tests", "verification", "verify", "verified"],
  ["build", "typecheck", "compile", "compilation"],
  ["shell", "terminal", "pane", "session", "environment"],
  ["old", "stale", "outdated", "previous"],
  ["rerun", "reran", "retry", "retried", "repeat", "repeated", "recurrence", "recurring"],
  ["path", "file", "module", "import", "dependency"],
  ["package", "extension", "install", "setup"],
  ["assumption", "understanding", "correction", "corrected"],
  ["trust", "reliable", "untrustworthy", "confidence", "rely", "reliability"],
];

function normalizeTimeoutMs(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return DEFAULT_TIMEOUT_MS;
  return Math.max(1, Math.min(MAX_TIMEOUT_MS, Math.floor(value)));
}

function compactFactText(value: string | null | undefined, maxLength: number): string | null {
  if (!value) return null;
  const safeSource = omitUnsafeSourceText(value);
  const normalized = sanitizeFactText(safeSource, maxLength);
  if (UNKNOWN_VALUES.has(normalized.toLowerCase())) return null;
  return normalized.length > 0 ? normalized : null;
}

function sanitizeFactText(value: string, maxLength: number): string {
  const pathRedactedSource = redactAdditionalLocalPaths(value);
  return redactAdditionalLocalPaths(sanitizeStoredText(pathRedactedSource, maxLength)).replace(/\s+/g, " ").trim();
}

function redactAdditionalLocalPaths(value: string): string {
  return redactNonHomeAbsolutePaths(redactFileUriLocalPaths(redactPartialRedactionPathTails(value)))
    .replace(WINDOWS_ABSOLUTE_PATH_PATTERN, ABSOLUTE_PATH_REDACTION);
}

function redactPartialRedactionPathTails(value: string): string {
  return value.replace(PARTIAL_REDACTION_PATH_TAIL_PATTERN, ABSOLUTE_PATH_REDACTION);
}

function redactFileUriLocalPaths(value: string): string {
  let result = "";
  let lastIndex = 0;
  FILE_URI_PREFIX_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = FILE_URI_PREFIX_PATTERN.exec(value)) !== null) {
    const start = match.index;
    const pathStart = fileUriPathStart(value, start + match[0].length);
    if (pathStart === null) continue;
    const end = findPathLikeEnd(value, pathStart);
    if (end <= pathStart) continue;
    result += value.slice(lastIndex, start) + ABSOLUTE_PATH_REDACTION;
    lastIndex = end;
    FILE_URI_PREFIX_PATTERN.lastIndex = end;
  }
  return result + value.slice(lastIndex);
}

function fileUriPathStart(value: string, afterSchemeIndex: number): number | null {
  if (value.startsWith("///", afterSchemeIndex)) return afterSchemeIndex + 2;
  if (value.slice(afterSchemeIndex, afterSchemeIndex + "//localhost/".length).toLowerCase() === "//localhost/") {
    return afterSchemeIndex + "//localhost".length;
  }
  if (value.startsWith("/", afterSchemeIndex)) return afterSchemeIndex;
  return null;
}

function redactNonHomeAbsolutePaths(value: string): string {
  let result = "";
  let lastIndex = 0;
  let index = 0;
  while (index < value.length) {
    if (value.charAt(index) !== "/") {
      index += 1;
      continue;
    }
    const skippedEnd = skippedRedactionRootEnd(value, index);
    if (skippedEnd !== null) {
      index = skippedEnd;
      continue;
    }
    if (!isNonHomeAbsolutePathStart(value, index)) {
      index += 1;
      continue;
    }
    const end = findPathLikeEnd(value, index);
    const candidate = value.slice(index, end);
    if (!isPathLikeLocalCandidate(candidate)) {
      index += 1;
      continue;
    }
    result += value.slice(lastIndex, index) + ABSOLUTE_PATH_REDACTION;
    lastIndex = end;
    index = end;
  }
  return result + value.slice(lastIndex);
}

function skippedRedactionRootEnd(value: string, index: number): number | null {
  const rest = value.slice(index).toLowerCase();
  if (
    rest.startsWith("/users/")
    || rest.startsWith("/home/")
    || rest.startsWith("/private/var/folders/")
    || rest.startsWith("/var/folders/")
    || rest.startsWith("/tmp/")
  ) {
    return findSkippedRedactionRootEnd(value, index);
  }
  return null;
}

function findSkippedRedactionRootEnd(value: string, start: number): number {
  let end = start;
  while (end < value.length) {
    const char = value.charAt(end);
    if (char === "\n" || char === "\r" || char === "\"" || char === "'" || char === "`" || char === "," || char === ";" || char === "!" || char === "?" || char === ")" || char === "]" || char === "}" || /\s/.test(char)) break;
    end += 1;
  }
  return end;
}

function isNonHomeAbsolutePathStart(value: string, index: number): boolean {
  if (value.charAt(index + 1) === "/") return false;
  if (value.charAt(index - 1) === "/") return false;
  return skippedRedactionRootEnd(value, index) === null;
}

function isPathLikeLocalCandidate(candidate: string): boolean {
  const trimmed = candidate.replace(/[),.;!?]+$/g, "");
  const firstSegmentEnd = trimmed.indexOf("/", 1);
  return firstSegmentEnd > 1 && firstSegmentEnd < trimmed.length - 1;
}

function findPathLikeEnd(value: string, start: number): number {
  let end = start;
  let lastSlash = start;
  while (end < value.length) {
    const char = value.charAt(end);
    if (isPathBoundary(char)) break;
    if (/\s/.test(char) && !shouldKeepWhitespaceInPath(value, end, lastSlash)) break;
    if (char === "/") lastSlash = end;
    end += 1;
  }
  return end;
}

function isPathBoundary(char: string): boolean {
  return char === "\n" || char === "\r" || char === "\"" || char === "'" || char === "`" || char === "<" || char === ">" || char === "," || char === ";" || char === "!" || char === "?" || char === ")" || char === "]" || char === "}";
}

function shouldKeepWhitespaceInPath(value: string, spaceIndex: number, lastSlash: number): boolean {
  const segment = value.slice(lastSlash + 1, spaceIndex).trim();
  if (!segment || /\.[A-Za-z0-9]{1,12}(?::\d+(?::\d+)?)?$/.test(segment) || segment.includes("=")) return false;
  const rest = value.slice(spaceIndex + 1);
  if (/^(?:and|or|while|from|with|after|before|near|at|in|on|to|by)\s+\//i.test(rest)) return false;
  const boundaryIndex = rest.search(/[\r\n"'`<>,;!?()[\]{}]/);
  const untilBoundary = boundaryIndex === -1 ? rest : rest.slice(0, boundaryIndex);
  return untilBoundary.includes("/");
}

function compactEvidenceTimestamp(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = sanitizeFactText(omitUnsafeSourceText(value), MAX_EVIDENCE_TIMESTAMP_CHARS);
  if (!normalized || !ISO_UTC_TIMESTAMP_PATTERN.test(normalized)) return null;
  const parsed = Date.parse(normalized);
  return Number.isFinite(parsed) ? normalized : null;
}

function safeEnumValue<T extends string>(value: T, allowed: ReadonlySet<T>, fallback: T): T {
  return allowed.has(value) ? value : fallback;
}

function omitUnsafeSourceText(value: string): string {
  const normalized = value.replace(/\r\n/g, "\n").trim();
  if (!normalized) return "";
  if (looksLikePrompt(normalized)) return "[prompt text omitted]";
  if (looksLikeTranscript(normalized)) return "[raw session transcript omitted]";
  const lines = normalized.split("\n");
  const nonStackLines = lines.filter((line) => !STACK_TRACE_LINE_PATTERN.test(line));
  if (nonStackLines.length === 0 && lines.length > 0) return "[stack trace omitted]";
  if (nonStackLines.length < lines.length) {
    const prefix = nonStackLines.join("\n").trim();
    return prefix ? `${prefix}\n[stack trace omitted]` : "[stack trace omitted]";
  }
  return normalized;
}

function looksLikePrompt(value: string): boolean {
  return FULL_PROMPT_PATTERNS.some((pattern) => pattern.test(value));
}

function looksLikeTranscript(value: string): boolean {
  const lineMatches = value.match(TRANSCRIPT_LINE_PATTERN);
  if ((lineMatches?.length ?? 0) >= 1) return true;
  const inlineMatches = value.match(/\b(?:user|assistant|system|developer|tool|bashExecution)\s*:/gi);
  return (inlineMatches?.length ?? 0) >= 1;
}

function occurrenceCount(delta: ExpectationDelta): number | null {
  const metadataCount = delta.metadata["count"];
  if (typeof metadataCount === "number" && Number.isFinite(metadataCount) && metadataCount > 0) return Math.floor(metadataCount);
  return null;
}

function signalFact(signal: DeltaDetectorSignal): LocalDiagnosisSignalFact {
  return {
    type: safeEnumValue(signal.type, SIGNAL_TYPE_VALUES, "other"),
    confidence: signal.confidence,
    explanation: compactFactText(signal.explanation, MAX_SIGNAL_EXPLANATION_CHARS),
  };
}

function evidenceFact(ref: DeltaEvidenceRef): LocalDiagnosisEvidenceFact {
  return {
    sourceType: safeEnumValue(ref.sourceType, EVIDENCE_SOURCE_TYPE_VALUES, "manual"),
    timestamp: compactEvidenceTimestamp(ref.timestamp),
    noteSummary: compactFactText(ref.note, MAX_EVIDENCE_TEXT_CHARS),
    snippetSummary: compactFactText(ref.snippet, MAX_EVIDENCE_TEXT_CHARS),
  };
}

function addSupportFact(
  facts: LocalDiagnosisSupportFact[],
  id: LocalDiagnosisSupportFactId,
  kind: LocalDiagnosisSupportFactKind,
  value: string | null | undefined,
  confidence?: number | null,
): void {
  const text = compactFactText(value, MAX_FACT_TEXT_CHARS);
  if (!text) return;
  const fact: LocalDiagnosisSupportFact = { id, kind, text };
  if (confidence !== undefined) fact.confidence = confidence;
  facts.push(fact);
}

function buildSupportFacts(
  deterministic: LocalDiagnosisFactPacket["deterministic"],
  delta: LocalDiagnosisFactPacket["delta"],
  signals: LocalDiagnosisSignalFact[],
  evidence: LocalDiagnosisEvidenceFact[],
): LocalDiagnosisSupportFact[] {
  const facts: LocalDiagnosisSupportFact[] = [];
  addSupportFact(facts, "F1", "deterministic-headline", deterministic.headline);
  addSupportFact(facts, "F2", "deterministic-what-happened", deterministic.whatHappened);
  addSupportFact(facts, "F3", "deterministic-why-it-matters", deterministic.whyItMatters);
  addSupportFact(facts, "F4", "expected-behavior", deterministic.expectedBehavior);
  addSupportFact(facts, "F5", "delta-summary", delta.summary);
  addSupportFact(facts, "F6", "delta-expectation", delta.expectation);
  addSupportFact(facts, "F7", "delta-reality", delta.reality);
  addSupportFact(facts, "F8", "delta-impact", delta.impact);
  if (delta.occurrenceCount !== null) {
    addSupportFact(facts, "F9", "occurrence-count", `${delta.occurrenceCount} recorded occurrence${delta.occurrenceCount === 1 ? "" : "s"}.`);
  }
  signals.forEach((signal, index) => {
    addSupportFact(facts, `F${10 + index}` as LocalDiagnosisSupportFactId, "signal", signal.explanation, signal.confidence);
  });
  evidence.forEach((ref, index) => {
    addSupportFact(facts, `F${20 + (index * 2)}` as LocalDiagnosisSupportFactId, "evidence-summary", ref.noteSummary);
    addSupportFact(facts, `F${21 + (index * 2)}` as LocalDiagnosisSupportFactId, "evidence-summary", ref.snippetSummary);
  });
  return facts;
}

export function buildLocalDiagnosisFactPacket(input: FlightLearnDiagnosisInput, deterministicView = buildFlightLearnDiagnosisView(input)): LocalDiagnosisFactPacket {
  const inputSignals = input.signals ?? [];
  const inputEvidence = input.delta.evidenceRefs;
  const deterministic: LocalDiagnosisFactPacket["deterministic"] = {
    headline: compactFactText(deterministicView.headline, RESPONSE_FIELD_LIMITS.headline) ?? "Deterministic headline unavailable after redaction.",
    whatHappened: compactFactText(deterministicView.whatHappened, RESPONSE_FIELD_LIMITS.whatHappened) ?? "Deterministic event summary unavailable after redaction.",
    whyItMatters: compactFactText(deterministicView.whyItMatters, RESPONSE_FIELD_LIMITS.whyItMatters) ?? "Deterministic impact summary unavailable after redaction.",
    expectedBehavior: compactFactText(deterministicView.expectedBehavior, RESPONSE_FIELD_LIMITS.expectedBehavior),
    confidence: deterministicView.confidence,
  };
  const deltaFacts: LocalDiagnosisFactPacket["delta"] = {
    source: safeEnumValue(input.delta.source, DELTA_SOURCE_VALUES, "manual"),
    status: safeEnumValue(input.delta.status, DELTA_STATUS_VALUES, "candidate"),
    severity: safeEnumValue(input.delta.severity, DELTA_SEVERITY_VALUES, "unknown"),
    summary: compactFactText(input.delta.summary, MAX_DELTA_FIELD_CHARS),
    expectation: compactFactText(input.delta.expectation, MAX_DELTA_FIELD_CHARS),
    reality: compactFactText(input.delta.reality, MAX_DELTA_FIELD_CHARS),
    impact: compactFactText(input.delta.impact, MAX_DELTA_FIELD_CHARS),
    occurrenceCount: occurrenceCount(input.delta),
  };
  const signals = inputSignals.slice(0, MAX_SIGNAL_COUNT).map(signalFact);
  const evidence = inputEvidence.slice(0, MAX_EVIDENCE_COUNT).map(evidenceFact);
  const facts = buildSupportFacts(deterministic, deltaFacts, signals, evidence);
  return {
    version: 2,
    deterministic,
    delta: deltaFacts,
    signals,
    evidence,
    facts,
    bounds: {
      maxDeltaFieldChars: MAX_DELTA_FIELD_CHARS,
      maxSignalCount: MAX_SIGNAL_COUNT,
      maxSignalExplanationChars: MAX_SIGNAL_EXPLANATION_CHARS,
      maxEvidenceCount: MAX_EVIDENCE_COUNT,
      maxEvidenceTextChars: MAX_EVIDENCE_TEXT_CHARS,
      includedSignalCount: Math.min(inputSignals.length, MAX_SIGNAL_COUNT),
      totalSignalCount: inputSignals.length,
      includedEvidenceCount: Math.min(inputEvidence.length, MAX_EVIDENCE_COUNT),
      totalEvidenceCount: inputEvidence.length,
      maxNarrativeSentences: WHAT_HAPPENED_MAX_SENTENCES,
      maxNarrativeChars: RESPONSE_FIELD_LIMITS.whatHappened,
      maxFacts: MAX_FACT_COUNT,
      maxFactChars: MAX_FACT_TEXT_CHARS,
    },
  };
}

export function buildLocalDiagnosisPrompt(factPacket: LocalDiagnosisFactPacket): string {
  const factPacketJson = JSON.stringify(factPacket);
  return [
    "You are an optional local-only phrasing helper for a Pi Flight Learn diagnosis card.",
    "Use only the bounded redacted fact packet and its facts[] entries. Do not add facts, routes, actions, artifacts, file paths, secrets, stack traces, commands, or transcript text.",
    "Return only a JSON object with schemaVersion: 2. Allowed keys: schemaVersion, headline, whatHappened, whyItMatters, expectedBehavior, whyThisWasFlagged, evidenceSummary. Omit any display key you cannot improve. No other top-level keys are allowed.",
    "Field jobs: headline/Problem stays concise, conservative, and headline-shaped; whatHappened is the narrative field; whyItMatters explains impact; expectedBehavior is included only when supported by expected-behavior or delta-expectation facts, not inferred from reality, impact, signals, or evidence; whyThisWasFlagged explains why local evidence flagged this issue; evidenceSummary summarizes existing evidence facts only.",
    "You may return one useful core field instead of all fields. Core fields are headline, whatHappened, whyItMatters, and expectedBehavior. Optional flag/evidence fields should be omitted unless you can safely improve them from cited facts.",
    "For whatHappened, do not return a string. If you can improve it, return {\"sentences\":[{\"text\":\"...\",\"factIds\":[\"F1\"]}]}. Each sentence needs 1 or more factIds, and every factId must exactly match an id in facts[].",
    "For whyThisWasFlagged and evidenceSummary, return {\"text\":\"...\",\"factIds\":[\"F1\"]}. evidenceSummary must summarize existing evidence facts only; do not create, imply, invent, or replace evidence refs.",
    "If returning whatHappened, write 1-3 concise sentence objects that explain the observed sequence, recurrence, pattern, or uncertainty and are distinct from the headline. The factIds are deterministic support handles, not proof of entailment; unsupported meaning will be handled by a later local judge path.",
    "Do not include confidence, scores, metadata, notes, rationale, route, action, status, severity, record IDs, detector names, cluster IDs, or any other non-display field.",
    "Do not echo or summarize the fact packet structure. Do not mention internal field names such as JSON, allowed keys, delta, signals, bounds, analysis, or headline fields. You may refer generically to stored evidence when it helps.",
    `Length limits: headline <= ${RESPONSE_FIELD_LIMITS.headline} chars; combined whatHappened text <= ${RESPONSE_FIELD_LIMITS.whatHappened} and <= ${WHAT_HAPPENED_MAX_SENTENCES} sentence objects; whyItMatters <= ${RESPONSE_FIELD_LIMITS.whyItMatters}; expectedBehavior <= ${RESPONSE_FIELD_LIMITS.expectedBehavior}; whyThisWasFlagged <= ${RESPONSE_FIELD_LIMITS.whyThisWasFlagged}; evidenceSummary <= ${RESPONSE_FIELD_LIMITS.evidenceSummary}.`,
    "The JSON is display-only wording for the current card and must not instruct routing, ranking, storage, artifact creation, source edits, Loom records, rules, skills, or prompt changes.",
    "Fact packet JSON:",
    factPacketJson,
  ].join("\n");
}

export async function buildFlightLearnDiagnosisViewWithLocalPolish(
  input: FlightLearnDiagnosisInput,
  options: LocalDiagnosisPolishOptions = {},
): Promise<LocalDiagnosisPolishResult> {
  const deterministicView = buildFlightLearnDiagnosisView(input);
  if (options.enabled !== true) return fallbackResult(deterministicView, deterministicView, "disabled", null);
  if (!options.provider) return fallbackResult(deterministicView, deterministicView, "provider-unavailable", null);

  const factPacket = buildLocalDiagnosisFactPacket(input, deterministicView);
  const prompt = buildLocalDiagnosisPrompt(factPacket);
  const providerFactPacket = cloneFactPacket(factPacket);
  const timeoutMs = normalizeTimeoutMs(options.timeoutMs);
  const controller = new AbortController();

  let providerResponse: ProviderSettledResult;
  try {
    providerResponse = await settleProvider(
      Promise.resolve(options.provider.completeLocalDiagnosisPolish({ prompt, factPacket: providerFactPacket, signal: controller.signal })),
      timeoutMs,
      controller,
    );
  } catch {
    return fallbackResult(deterministicView, deterministicView, "provider-error", "provider failed before returning JSON");
  }

  if (providerResponse.kind === "timeout") return fallbackResult(deterministicView, deterministicView, "timeout", "provider timed out before returning JSON");
  if (providerResponse.kind === "error") return fallbackResult(deterministicView, deterministicView, "provider-error", "provider failed before returning JSON");

  const validation = validateLocalDiagnosisPolishResponse(providerResponse.value, { factPacket, deterministicView });
  if (!validation.ok) return fallbackResult(deterministicView, deterministicView, validation.reason, validation.issue, "rejected");

  if (validation.narrativeCandidate) {
    const draftView = applyDraftPolishedFields(deterministicView, validation.value);
    if (!options.judgeProvider) {
      return draftResult(deterministicView, draftView, "local narrative judge provider was not configured");
    }
    const judgeValidation = await validateNarrativeCandidateWithLocalJudge(validation.narrativeCandidate, factPacket, options);
    if (!judgeValidation.ok) {
      if (judgeValidation.reason === "unsafe-output") {
        return fallbackResult(deterministicView, deterministicView, judgeValidation.reason, judgeValidation.issue, "rejected");
      }
      return draftResult(deterministicView, draftView, judgeValidation.issue);
    }
    return acceptedNarrativeResult(deterministicView, validation.value);
  }

  return validatedPolishResult(deterministicView, validation.value);
}

type ProviderSettledResult =
  | { kind: "value"; value: string }
  | { kind: "error" }
  | { kind: "timeout" };

function cloneFactPacket(factPacket: LocalDiagnosisFactPacket): LocalDiagnosisFactPacket {
  return JSON.parse(JSON.stringify(factPacket)) as LocalDiagnosisFactPacket;
}

function settleProvider(providerPromise: Promise<string>, timeoutMs: number, controller: AbortController): Promise<ProviderSettledResult> {
  return new Promise((resolve) => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      controller.abort();
      resolve({ kind: "timeout" });
    }, timeoutMs);

    providerPromise.then(
      (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        resolve({ kind: "value", value });
      },
      () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        resolve({ kind: "error" });
      },
    );
  });
}

type JudgeValidationResult = { ok: true } | { ok: false; reason: LocalDiagnosisPolishFallbackReason; issue: string };

async function validateNarrativeCandidateWithLocalJudge(
  candidate: LocalNarrativeJudgeCandidate,
  factPacket: LocalDiagnosisFactPacket,
  options: LocalDiagnosisPolishOptions,
): Promise<JudgeValidationResult> {
  const provider = options.judgeProvider;
  if (!provider) return { ok: false, reason: "provider-unavailable", issue: "local narrative judge provider was not configured" };

  const timeoutMs = normalizeTimeoutMs(options.judgeTimeoutMs ?? options.timeoutMs);
  const controller = new AbortController();
  const request = buildLocalNarrativeJudgeRequest(factPacket, candidate, controller.signal);

  let providerResponse: ProviderSettledResult;
  try {
    providerResponse = await settleProvider(
      Promise.resolve(provider.completeLocalNarrativeJudge(request)),
      timeoutMs,
      controller,
    );
  } catch {
    return { ok: false, reason: "provider-error", issue: "local narrative judge failed before returning JSON" };
  }

  if (providerResponse.kind === "timeout") return { ok: false, reason: "timeout", issue: "local narrative judge timed out before returning JSON" };
  if (providerResponse.kind === "error") return { ok: false, reason: "provider-error", issue: "local narrative judge failed before returning JSON" };

  return validateLocalNarrativeJudgeResponse(providerResponse.value, candidate);
}

function fallbackResult(
  deterministicView: LocalDiagnosisPolishedView,
  baseView: LocalDiagnosisPolishedView,
  reason: LocalDiagnosisPolishFallbackReason,
  issue: string | null,
  narrativeStatus: LocalDiagnosisNarrativeStatus = "none",
): LocalDiagnosisPolishResult {
  return {
    view: reason === "disabled" || reason === "provider-unavailable" ? baseView : withFallbackLimit(baseView, reason),
    deterministicView,
    usedLocalModel: false,
    displayState: "deterministic",
    narrativeStatus,
    fallbackReason: reason,
    validationIssue: issue,
  };
}

function draftResult(
  deterministicView: LocalDiagnosisPolishedView,
  view: LocalDiagnosisPolishedView,
  issue: string | null,
): LocalDiagnosisPolishResult {
  return {
    view,
    deterministicView,
    usedLocalModel: true,
    displayState: "draft",
    narrativeStatus: "draft",
    fallbackReason: null,
    validationIssue: issue,
  };
}

function acceptedNarrativeResult(
  deterministicView: LocalDiagnosisPolishedView,
  fields: LocalDiagnosisPolishDisplayFields,
): LocalDiagnosisPolishResult {
  return {
    view: applyAcceptedNarrativeFields(deterministicView, fields),
    deterministicView,
    usedLocalModel: true,
    displayState: "accepted-narrative",
    narrativeStatus: "accepted",
    fallbackReason: null,
    validationIssue: null,
  };
}

function validatedPolishResult(
  deterministicView: LocalDiagnosisPolishedView,
  fields: LocalDiagnosisPolishDisplayFields,
): LocalDiagnosisPolishResult {
  return {
    view: applyValidatedPolishedFields(deterministicView, fields),
    deterministicView,
    usedLocalModel: true,
    displayState: "validated",
    narrativeStatus: "none",
    fallbackReason: null,
    validationIssue: null,
  };
}

function withFallbackLimit(view: LocalDiagnosisPolishedView, reason: LocalDiagnosisPolishFallbackReason): LocalDiagnosisPolishedView {
  const limits = view.limits.filter((limit) => !limit.startsWith("No model call was made"));
  return {
    ...view,
    limits: [
      ...limits,
      `Local model phrasing was requested but rejected (${reason}); deterministic display text is shown.`,
    ],
  };
}

function applyDisplayFields(view: LocalDiagnosisPolishedView, fields: LocalDiagnosisPolishDisplayFields, limit: string): LocalDiagnosisPolishedView {
  const limits = view.limits.filter((existingLimit) => !existingLimit.startsWith("No model call was made"));
  const whyThisWasFlagged = fields.whyThisWasFlagged ?? view.whyThisWasFlagged;
  const evidenceSummary = fields.evidenceSummary ?? view.evidenceSummary;
  return {
    ...view,
    headline: fields.headline ?? view.headline,
    whatHappened: fields.whatHappened ?? view.whatHappened,
    whyItMatters: fields.whyItMatters ?? view.whyItMatters,
    expectedBehavior: fields.expectedBehavior ?? view.expectedBehavior,
    ...(whyThisWasFlagged !== undefined ? { whyThisWasFlagged } : {}),
    ...(evidenceSummary !== undefined ? { evidenceSummary } : {}),
    limits: [
      ...limits,
      limit,
    ],
  };
}

function applyValidatedPolishedFields(view: LocalDiagnosisPolishedView, fields: LocalDiagnosisPolishDisplayFields): LocalDiagnosisPolishedView {
  return applyDisplayFields(
    view,
    fields,
    "Optional local model phrasing was used for display-only wording; stored delta fields, routing, and artifacts were not changed.",
  );
}

function applyAcceptedNarrativeFields(view: LocalDiagnosisPolishedView, fields: LocalDiagnosisPolishDisplayFields): LocalDiagnosisPolishedView {
  return applyDisplayFields(
    view,
    fields,
    "Optional local model narrative was accepted by the local judge for display-only wording; stored delta fields, routing, and artifacts were not changed.",
  );
}

function applyDraftPolishedFields(view: LocalDiagnosisPolishedView, fields: LocalDiagnosisPolishDisplayFields): LocalDiagnosisPolishedView {
  return applyDisplayFields(
    view,
    fields,
    "Local LLM draft was shown as non-authoritative reading help; deterministic facts, storage, routing, and artifacts remain the source of truth.",
  );
}

function cloneSupportFact(fact: LocalDiagnosisSupportFact): LocalDiagnosisSupportFact {
  const cloned: LocalDiagnosisSupportFact = { id: fact.id, kind: fact.kind, text: fact.text };
  if (fact.confidence !== undefined) cloned.confidence = fact.confidence;
  return cloned;
}

function buildLocalNarrativeJudgeRequest(
  factPacket: LocalDiagnosisFactPacket,
  candidate: LocalNarrativeJudgeCandidate,
  signal: AbortSignal,
): LocalNarrativeJudgeRequest {
  const facts = factPacket.facts.map(cloneSupportFact);
  const requestWithoutPromptAndSignal = {
    schemaVersion: 1 as const,
    policy: {
      field: "whatHappened" as const,
      displayOnly: true as const,
      maxSentences: WHAT_HAPPENED_MAX_SENTENCES,
      maxNarrativeChars: RESPONSE_FIELD_LIMITS.whatHappened,
      rejectOnUncertainty: true as const,
      acceptedSentenceVerdicts: ["supported", "supported-cautious-connection"] as Array<"supported" | "supported-cautious-connection">,
    },
    deterministic: { ...factPacket.deterministic },
    facts,
    candidate: {
      field: "whatHappened" as const,
      text: candidate.text,
      sentences: candidate.sentences.map((sentence) => ({
        index: sentence.index,
        text: sentence.text,
        factIds: [...sentence.factIds],
        citedFacts: sentence.citedFacts.map((fact) => ({ ...fact })),
      })),
    },
  };
  const prompt = [
    "You are an optional local-only judge for a Pi Flight Learn whatHappened narrative candidate.",
    "Use only the bounded redacted facts and candidate sentences in this request. Do not add facts, rewrite text, choose routes, classify, rank, store, mutate artifacts, edit source, or mention raw paths/secrets/transcripts.",
    "Return only JSON with schemaVersion 1, overallVerdict, optional failClosedReason, and sentence verdicts. The judge is veto-only: accept only if each sentence is supported by its cited facts or is a cautious connection, useful, non-actionable, and display-only.",
    "Reject or return uncertain when support is unclear, confidence is low, action/follow-up/route/classifier advice appears, or the candidate is not useful. Uncertainty fails closed.",
    "Judge request JSON:",
    JSON.stringify(requestWithoutPromptAndSignal),
  ].join("\n");

  return { ...requestWithoutPromptAndSignal, prompt, signal };
}

export function validateLocalNarrativeJudgeResponse(rawResponse: string, candidate: LocalNarrativeJudgeCandidate): JudgeValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawResponse.trim());
  } catch {
    return { ok: false, reason: "malformed-json", issue: "local narrative judge response was not valid JSON" };
  }

  if (!isPlainObject(parsed)) return { ok: false, reason: "schema-invalid", issue: "local narrative judge response must be a JSON object" };
  const priorityFailClosedReason = parsed["failClosedReason"];
  if (priorityFailClosedReason === "unsafe-output" || priorityFailClosedReason === "action-advice") {
    return judgeFailClosedResult(priorityFailClosedReason);
  }
  const extraKey = Object.keys(parsed).find((key) => !JUDGE_TOP_LEVEL_RESPONSE_FIELDS.has(key));
  if (extraKey) return { ok: false, reason: "schema-invalid", issue: "local narrative judge response included unsupported fields" };
  if (parsed["schemaVersion"] !== 1) return { ok: false, reason: "schema-invalid", issue: "local narrative judge response must use schemaVersion 1" };

  const overallVerdict = parsed["overallVerdict"];
  if (typeof overallVerdict !== "string" || !JUDGE_OVERALL_VERDICTS.has(overallVerdict as LocalNarrativeJudgeOverallVerdict)) {
    return { ok: false, reason: "schema-invalid", issue: "local narrative judge overall verdict was invalid" };
  }

  const failClosedReasonValue = parsed["failClosedReason"];
  let failClosedReason: LocalNarrativeJudgeFailClosedReason | null = null;
  if (failClosedReasonValue !== undefined) {
    if (typeof failClosedReasonValue !== "string" || !JUDGE_FAIL_CLOSED_REASONS.has(failClosedReasonValue as LocalNarrativeJudgeFailClosedReason)) {
      return { ok: false, reason: "schema-invalid", issue: "local narrative judge fail-closed reason was invalid" };
    }
    failClosedReason = failClosedReasonValue as LocalNarrativeJudgeFailClosedReason;
    if (failClosedReason === "unsafe-output" || failClosedReason === "action-advice") return judgeFailClosedResult(failClosedReason);
  }

  const sentenceResponses = parsed["sentences"];
  if (!Array.isArray(sentenceResponses)) return { ok: false, reason: "schema-invalid", issue: "local narrative judge must include sentence verdicts" };
  if (sentenceResponses.length !== candidate.sentences.length) {
    return { ok: false, reason: "schema-invalid", issue: "local narrative judge sentence coverage did not match candidate" };
  }

  const candidateByIndex = new Map(candidate.sentences.map((sentence) => [sentence.index, sentence]));
  const seenIndexes = new Set<number>();
  for (const sentenceResponse of sentenceResponses) {
    const sentenceValidation = validateLocalNarrativeJudgeSentenceResponse(sentenceResponse, candidateByIndex, seenIndexes);
    if (!sentenceValidation.ok) return sentenceValidation;
  }
  if (seenIndexes.size !== candidate.sentences.length) {
    return { ok: false, reason: "schema-invalid", issue: "local narrative judge sentence coverage did not match candidate" };
  }

  if (failClosedReason) return judgeFailClosedResult(failClosedReason);
  if (overallVerdict !== "accept") {
    return {
      ok: false,
      reason: overallVerdict === "uncertain" ? "unsupported-facts" : "unsupported-facts",
      issue: overallVerdict === "uncertain" ? "local narrative judge was uncertain" : "local narrative judge rejected the narrative",
    };
  }
  return { ok: true };
}

function validateLocalNarrativeJudgeSentenceResponse(
  value: unknown,
  candidateByIndex: Map<number, LocalNarrativeJudgeCandidateSentence>,
  seenIndexes: Set<number>,
): JudgeValidationResult {
  if (!isPlainObject(value)) return { ok: false, reason: "schema-invalid", issue: "local narrative judge sentence verdict must be an object" };
  const extraKey = Object.keys(value).find((key) => !JUDGE_SENTENCE_RESPONSE_FIELDS.has(key));
  if (extraKey) return { ok: false, reason: "schema-invalid", issue: "local narrative judge sentence verdict included unsupported fields" };

  const index = value["index"];
  if (!Number.isInteger(index)) return { ok: false, reason: "schema-invalid", issue: "local narrative judge sentence index was invalid" };
  const candidate = candidateByIndex.get(index as number);
  if (!candidate || seenIndexes.has(index as number)) return { ok: false, reason: "schema-invalid", issue: "local narrative judge sentence coverage did not match candidate" };
  seenIndexes.add(index as number);

  const verdict = value["verdict"];
  if (typeof verdict !== "string" || !JUDGE_SENTENCE_VERDICTS.has(verdict as LocalNarrativeJudgeSentenceVerdict)) {
    return { ok: false, reason: "schema-invalid", issue: "local narrative judge sentence verdict was invalid" };
  }
  if (verdict === "unsafe" || verdict === "action-advice") return judgeSentenceVerdictFailure(verdict);

  const confidence = value["confidence"];
  if (typeof confidence !== "string" || !JUDGE_CONFIDENCE_VALUES.has(confidence as LocalNarrativeJudgeConfidence)) {
    return { ok: false, reason: "schema-invalid", issue: "local narrative judge sentence confidence was invalid" };
  }

  const supportedFactIds = value["supportedFactIds"];
  if (!Array.isArray(supportedFactIds)) return { ok: false, reason: "schema-invalid", issue: "local narrative judge supportedFactIds must be an array" };
  if (JUDGE_ACCEPTED_SENTENCE_VERDICTS.has(verdict as LocalNarrativeJudgeSentenceVerdict) && supportedFactIds.length === 0) {
    return { ok: false, reason: "unsupported-facts", issue: "local narrative judge did not identify supported factIds" };
  }
  const citedFactIds = new Set(candidate.factIds);
  for (const factId of supportedFactIds) {
    if (typeof factId !== "string") return { ok: false, reason: "schema-invalid", issue: "local narrative judge supportedFactIds must be strings" };
    if (!citedFactIds.has(factId as LocalDiagnosisSupportFactId)) {
      return { ok: false, reason: "unsupported-facts", issue: "local narrative judge referenced an unsupported factId" };
    }
  }

  const unsupportedClaims = value["unsupportedClaims"];
  if (!Array.isArray(unsupportedClaims)) return { ok: false, reason: "schema-invalid", issue: "local narrative judge unsupportedClaims must be an array" };
  for (const claim of unsupportedClaims) {
    if (typeof claim !== "string" || claim.length > MAX_JUDGE_UNSUPPORTED_CLAIM_CHARS) {
      return { ok: false, reason: "schema-invalid", issue: "local narrative judge unsupported claim was invalid" };
    }
  }

  const reason = value["reason"];
  if (typeof reason !== "string" || reason.trim().length === 0 || reason.length > MAX_JUDGE_REASON_CHARS) {
    return { ok: false, reason: "schema-invalid", issue: "local narrative judge reason was invalid" };
  }

  if (unsupportedClaims.length > 0) return { ok: false, reason: "unsupported-facts", issue: "local narrative judge found unsupported claims" };
  if (confidence === "low") return { ok: false, reason: "unsupported-facts", issue: "local narrative judge confidence was low" };
  if (!JUDGE_ACCEPTED_SENTENCE_VERDICTS.has(verdict as LocalNarrativeJudgeSentenceVerdict)) {
    return judgeSentenceVerdictFailure(verdict as LocalNarrativeJudgeSentenceVerdict);
  }
  return { ok: true };
}

function judgeSentenceVerdictFailure(verdict: LocalNarrativeJudgeSentenceVerdict): JudgeValidationResult {
  if (verdict === "unsafe" || verdict === "action-advice") {
    return { ok: false, reason: "unsafe-output", issue: "local narrative judge found unsafe or action-advice content" };
  }
  if (verdict === "not-useful") return { ok: false, reason: "empty-output", issue: "local narrative judge found the narrative not useful" };
  return { ok: false, reason: "unsupported-facts", issue: "local narrative judge did not support the narrative" };
}

function judgeFailClosedResult(reason: LocalNarrativeJudgeFailClosedReason): JudgeValidationResult {
  switch (reason) {
    case "unsafe-output":
    case "action-advice":
      return { ok: false, reason: "unsafe-output", issue: "local narrative judge found unsafe or action-advice content" };
    case "schema-invalid":
      return { ok: false, reason: "schema-invalid", issue: "local narrative judge rejected the response shape" };
    case "low-information":
    case "not-useful":
      return { ok: false, reason: "empty-output", issue: "local narrative judge found the narrative not useful" };
    case "judge-uncertain":
      return { ok: false, reason: "unsupported-facts", issue: "local narrative judge was uncertain" };
    case "unsupported-facts":
      return { ok: false, reason: "unsupported-facts", issue: "local narrative judge found unsupported facts" };
  }
}

export function diagnoseLocalDiagnosisPolishResponse(rawResponse: string, context: LocalDiagnosisPolishValidationContext): LocalDiagnosisPolishResponseDiagnostics {
  let parsed: unknown;
  let parseValid = true;
  try {
    parsed = JSON.parse(rawResponse.trim());
  } catch {
    parseValid = false;
    parsed = undefined;
  }

  const parsedObject = isPlainObject(parsed) ? parsed : null;
  const objectValid = parsedObject !== null;
  const allowedTopLevelKeyPresence = diagnosticTopLevelKeyPresence(parsedObject);
  const extraTopLevelKeys = parsedObject ? Object.keys(parsedObject).filter((key) => !TOP_LEVEL_RESPONSE_FIELDS.has(key as LocalDiagnosisTopLevelResponseField)) : [];
  const fields = parsedObject
    ? RESPONSE_FIELDS.map((field) => diagnoseResponseField(field, parsedObject[field], Object.prototype.hasOwnProperty.call(parsedObject, field), context))
    : RESPONSE_FIELDS.map((field) => notPresentFieldDiagnostic(field));

  const productValidation = validateLocalDiagnosisPolishResponse(rawResponse, context);
  const firstFailure = diagnosticFirstProductFailure(parseValid, objectValid, parsedObject, fields, productValidation);

  return {
    schemaVersion: 1,
    response: {
      rawLength: rawResponse.length,
      sha256: sha256DiagnosticText(rawResponse),
      parseValid,
      objectValid,
      valueKind: diagnosticValueKind(parsed),
      allowedTopLevelKeyPresence,
      extraTopLevelKeyCount: extraTopLevelKeys.length,
      extraTopLevelKeyHashes: extraTopLevelKeys.map((key) => ({ length: key.length, sha256: sha256DiagnosticText(key) })),
    },
    productEquivalent: {
      ok: productValidation.ok,
      reason: productValidation.ok ? null : productValidation.reason,
      issue: productValidation.ok ? null : productValidation.issue,
      firstFailureRuleId: firstFailure.ruleId,
      firstFailureField: firstFailure.field,
    },
    fields,
  };
}

function diagnosticTopLevelKeyPresence(parsed: Record<string, unknown> | null): Record<LocalDiagnosisTopLevelResponseField, boolean> {
  const entries = [...TOP_LEVEL_RESPONSE_FIELDS].map((key) => [key, parsed !== null && Object.prototype.hasOwnProperty.call(parsed, key)]);
  return Object.fromEntries(entries) as Record<LocalDiagnosisTopLevelResponseField, boolean>;
}

function diagnosticFirstProductFailure(
  parseValid: boolean,
  objectValid: boolean,
  parsed: Record<string, unknown> | null,
  fields: LocalDiagnosisPolishFieldDiagnostic[],
  productValidation: LocalDiagnosisPolishValidationResult,
): { ruleId: LocalDiagnosisPolishDiagnosticRuleId | null; field: ResponseFieldName | null } {
  if (productValidation.ok) return { ruleId: null, field: null };
  if (!parseValid) return { ruleId: "response.malformed-json", field: null };
  if (!objectValid || parsed === null) return { ruleId: "response.not-object", field: null };
  if (Object.keys(parsed).some((key) => !TOP_LEVEL_RESPONSE_FIELDS.has(key as LocalDiagnosisTopLevelResponseField))) {
    return { ruleId: "response.extra-top-level-key", field: null };
  }
  if (parsed["schemaVersion"] !== 2) return { ruleId: "response.schema-version-invalid", field: null };
  const firstUnsafeRejected = fields.find((field) => field.outcome === "rejected" && field.reason === "unsafe-output");
  if (firstUnsafeRejected) return { ruleId: firstUnsafeRejected.ruleId, field: firstUnsafeRejected.field };
  const firstCardLevelRejected = fields.find((field) => isDiagnosticCardLevelFailure(field));
  if (firstCardLevelRejected) return { ruleId: firstCardLevelRejected.ruleId, field: firstCardLevelRejected.field };
  const hasAcceptedCoreField = fields.some((field) => CORE_RESPONSE_FIELDS.has(field.field) && field.outcome === "accepted");
  if (!hasAcceptedCoreField) {
    const firstRejected = fields.find((field) => field.outcome === "rejected");
    if (firstRejected) return { ruleId: firstRejected.ruleId, field: firstRejected.field };
  }
  return { ruleId: "response.empty-output", field: null };
}

function isDiagnosticCardLevelFailure(field: LocalDiagnosisPolishFieldDiagnostic): boolean {
  if (field.outcome !== "rejected") return false;
  if (field.reason === "unsafe-output" || field.reason === "schema-invalid") return true;
  if (isSourceOfTruthRule(field.ruleId)) return true;
  if ((field.field === "headline" || field.field === "whyItMatters") && field.ruleId === "field.unsupported-facts") return true;
  if (field.ruleId === "what-happened.sentence-unsupported-mutation-claim") return true;
  return false;
}

function diagnoseResponseField(
  field: ResponseFieldName,
  value: unknown,
  present: boolean,
  context: LocalDiagnosisPolishValidationContext,
): LocalDiagnosisPolishFieldDiagnostic {
  if (!present) return notPresentFieldDiagnostic(field);
  if (field === "whatHappened") return diagnoseWhatHappenedField(value, context);
  if (field === "whyThisWasFlagged" || field === "evidenceSummary") return diagnoseFactCitedDisplayField(field, value, context);
  return diagnosePlainDisplayField(field, value, context);
}

function notPresentFieldDiagnostic(field: ResponseFieldName): LocalDiagnosisPolishFieldDiagnostic {
  return {
    field,
    present: false,
    valueKind: "undefined",
    diagnosticKind: "not-present",
    outcome: "not-present",
    reason: null,
    issue: null,
    ruleId: "field.not-present",
  };
}

function acceptedFieldDiagnostic(
  field: ResponseFieldName,
  value: unknown,
  text: string | null,
  extras: Partial<LocalDiagnosisPolishFieldDiagnostic> = {},
): LocalDiagnosisPolishFieldDiagnostic {
  return {
    field,
    present: true,
    valueKind: diagnosticValueKind(value),
    diagnosticKind: "accepted",
    outcome: "accepted",
    reason: null,
    issue: null,
    ruleId: null,
    ...(text !== null ? { textMetrics: diagnosticTextMetrics(text) } : {}),
    ...extras,
  };
}

function omittedFieldDiagnostic(
  field: ResponseFieldName,
  value: unknown,
  ruleId: LocalDiagnosisPolishDiagnosticRuleId,
  issue: string,
  text: string | null,
  extras: Partial<LocalDiagnosisPolishFieldDiagnostic> = {},
): LocalDiagnosisPolishFieldDiagnostic {
  return {
    field,
    present: true,
    valueKind: diagnosticValueKind(value),
    diagnosticKind: "omitted",
    outcome: "omitted",
    reason: null,
    issue,
    ruleId,
    ...(text !== null ? { textMetrics: diagnosticTextMetrics(text) } : {}),
    ...extras,
  };
}

function rejectedFieldDiagnostic(
  field: ResponseFieldName,
  value: unknown,
  reason: LocalDiagnosisPolishFallbackReason,
  issue: string,
  ruleId: LocalDiagnosisPolishDiagnosticRuleId,
  text: string | null,
  extras: Partial<LocalDiagnosisPolishFieldDiagnostic> = {},
): LocalDiagnosisPolishFieldDiagnostic {
  return {
    field,
    present: true,
    valueKind: diagnosticValueKind(value),
    diagnosticKind: diagnosticKindForFailure(reason, ruleId),
    outcome: "rejected",
    reason,
    issue,
    ruleId,
    ...(text !== null ? { textMetrics: diagnosticTextMetrics(text) } : {}),
    ...extras,
  };
}

function diagnosticKindForFailure(reason: LocalDiagnosisPolishFallbackReason, ruleId: LocalDiagnosisPolishDiagnosticRuleId): LocalDiagnosisPolishDiagnosticKind {
  if (reason === "unsafe-output" || isSourceOfTruthRule(ruleId)) return "hard-rejection";
  if (reason === "unsupported-facts" || reason === "empty-output") return "soft-rejection";
  return "schema-rejection";
}

function isSourceOfTruthRule(ruleId: LocalDiagnosisPolishDiagnosticRuleId | null): boolean {
  return ruleId === "fact-field.fact-id-unknown"
    || ruleId === "what-happened.sentence-fact-id-unknown"
    || ruleId === "what-happened.sentence-unsupported-mutation-claim";
}

function diagnosePlainDisplayField(
  field: Exclude<ResponseFieldName, FactCitedDisplayFieldName | "whatHappened">,
  value: unknown,
  context: LocalDiagnosisPolishValidationContext,
): LocalDiagnosisPolishFieldDiagnostic {
  if (value === null && field === "expectedBehavior") return omittedFieldDiagnostic(field, value, "field.unknown-value-omitted", "expectedBehavior was null", null);
  if (typeof value !== "string") return rejectedFieldDiagnostic(field, value, "schema-invalid", "display fields must be strings", "field.invalid-type", null);
  const normalized = value.replace(/\s+/g, " ").trim();
  if (UNKNOWN_VALUES.has(normalized.toLowerCase())) return omittedFieldDiagnostic(field, value, "field.unknown-value-omitted", "display field was empty or unknown", value);
  if (normalized.length > RESPONSE_FIELD_LIMITS[field]) return rejectedFieldDiagnostic(field, value, "schema-invalid", "display field exceeded length limit", "field.length-limit", value);
  const unsafeRule = diagnoseUnsafeOutputRule(normalized);
  if (unsafeRule) return rejectedFieldDiagnostic(field, value, "unsafe-output", "display field included unsafe or non-display content", unsafeRule, value);
  if (field === "expectedBehavior") return diagnoseExpectedBehaviorFieldForDiagnostics(value, normalized, context);
  const support = buildSupportSet(context.factPacket);
  const unsupported = unsupportedTokenSummary(normalized, support);
  if (hasUnsupportedConcreteFacts(normalized, support)) {
    return rejectedFieldDiagnostic(field, value, "unsupported-facts", "display field included unsupported concrete facts", "field.unsupported-facts", value, unsupportedDiagnosticCounts(unsupported));
  }
  return acceptedFieldDiagnostic(field, value, value);
}

function diagnoseExpectedBehaviorFieldForDiagnostics(
  value: string,
  normalized: string,
  context: LocalDiagnosisPolishValidationContext,
): LocalDiagnosisPolishFieldDiagnostic {
  const expectedFacts = context.factPacket.facts.filter((fact) => EXPECTED_BEHAVIOR_SUPPORT_KINDS.has(fact.kind));
  if (expectedFacts.length === 0) {
    return rejectedFieldDiagnostic("expectedBehavior", value, "unsupported-facts", "expected behavior was not supported by expected-behavior facts", "expected.missing-support-facts", value);
  }
  if (hasExpectedBehaviorNegationMismatch(normalized, expectedFacts)) {
    return rejectedFieldDiagnostic("expectedBehavior", value, "unsupported-facts", "expected behavior contradicted expected-behavior facts", "expected.negation-mismatch", value);
  }
  const unsupported = unsupportedTokenSummary(normalized, buildSupportSetFromFacts(expectedFacts));
  if (unsupported.total > 0) {
    return rejectedFieldDiagnostic("expectedBehavior", value, "unsupported-facts", "expected behavior included unsupported facts", "expected.unsupported-facts", value, unsupportedDiagnosticCounts(unsupported));
  }
  return acceptedFieldDiagnostic("expectedBehavior", value, value);
}

function diagnoseFactCitedDisplayField(
  field: FactCitedDisplayFieldName,
  value: unknown,
  context: LocalDiagnosisPolishValidationContext,
): LocalDiagnosisPolishFieldDiagnostic {
  if (!isPlainObject(value)) return rejectedFieldDiagnostic(field, value, "schema-invalid", `${field} must be a fact-cited display object`, "fact-field.not-object", null);
  const extraKey = Object.keys(value).find((fieldKey) => !FACT_CITED_DISPLAY_RESPONSE_FIELDS.has(fieldKey));
  if (extraKey) return rejectedFieldDiagnostic(field, value, "schema-invalid", `${field} included unsupported fields`, "fact-field.extra-key", null);

  const text = value["text"];
  if (typeof text !== "string") return rejectedFieldDiagnostic(field, value, "schema-invalid", `${field} text must be a string`, "fact-field.text-invalid-type", null);
  const normalized = text.replace(/\s+/g, " ").trim();

  const factIds = value["factIds"];
  if (!Array.isArray(factIds) || factIds.length === 0) return rejectedFieldDiagnostic(field, value, "schema-invalid", `${field} must cite one or more factIds`, "fact-field.fact-ids-missing", text);
  if (factIds.length > MAX_FACT_IDS_PER_DISPLAY_FIELD) return rejectedFieldDiagnostic(field, value, "schema-invalid", `${field} cited too many factIds`, "fact-field.fact-ids-too-many", text, { citedFactCount: factIds.length });

  const factsById = new Map(context.factPacket.facts.map((fact) => [fact.id, fact]));
  const seenFactIds = new Set<string>();
  const citedFacts: LocalDiagnosisSupportFact[] = [];
  for (const factId of factIds) {
    if (typeof factId !== "string") return rejectedFieldDiagnostic(field, value, "schema-invalid", `${field} factIds must be strings`, "fact-field.fact-id-invalid-type", text, { citedFactCount: factIds.length });
    if (seenFactIds.has(factId)) return rejectedFieldDiagnostic(field, value, "schema-invalid", `${field} repeated a factId`, "fact-field.fact-id-duplicate", text, { repeatedFactIdCount: 1, citedFactCount: factIds.length });
    seenFactIds.add(factId);
    const fact = factsById.get(factId as LocalDiagnosisSupportFactId);
    if (!fact) return rejectedFieldDiagnostic(field, value, "unsupported-facts", `${field} cited an unknown factId`, "fact-field.fact-id-unknown", text, { unknownFactIdCount: 1, citedFactCount: factIds.length });
    citedFacts.push(fact);
  }

  if (!normalized || UNKNOWN_VALUES.has(normalized.toLowerCase())) return omittedFieldDiagnostic(field, value, "fact-field.empty-text-omitted", `${field} text was empty or unknown`, text, { citedFactCount: citedFacts.length });
  if (normalized.length > RESPONSE_FIELD_LIMITS[field]) return rejectedFieldDiagnostic(field, value, "schema-invalid", `${field} exceeded length limit`, "fact-field.length-limit", text, { citedFactCount: citedFacts.length });
  const unsafeRule = diagnoseUnsafeOutputRule(normalized);
  if (unsafeRule) return rejectedFieldDiagnostic(field, value, "unsafe-output", `${field} included unsafe or non-display content`, unsafeRule, text, { citedFactCount: citedFacts.length });
  if (field === "evidenceSummary" && citedFacts.some((fact) => fact.kind !== "evidence-summary")) {
    return rejectedFieldDiagnostic(field, value, "unsupported-facts", "evidenceSummary must cite evidence-summary facts", "fact-field.evidence-summary-non-evidence-fact", text, { citedFactCount: citedFacts.length });
  }
  if (field === "whyThisWasFlagged" && !citedFacts.some((fact) => WHY_FLAGGED_SUPPORT_KINDS.has(fact.kind))) {
    return rejectedFieldDiagnostic(field, value, "unsupported-facts", "whyThisWasFlagged did not cite flagging support facts", "fact-field.why-flagged-missing-support-kind", text, { citedFactCount: citedFacts.length });
  }
  const citedSupport = buildSupportSetFromFacts(citedFacts);
  const unsupported = unsupportedTokenSummary(normalized, citedSupport);
  if (hasUnsupportedConcreteFacts(normalized, citedSupport)) {
    return rejectedFieldDiagnostic(field, value, "unsupported-facts", `${field} included unsupported concrete facts`, "fact-field.unsupported-facts", text, { citedFactCount: citedFacts.length, ...unsupportedDiagnosticCounts(unsupported) });
  }
  return acceptedFieldDiagnostic(field, value, text, { citedFactCount: citedFacts.length });
}

function diagnoseWhatHappenedField(value: unknown, context: LocalDiagnosisPolishValidationContext): LocalDiagnosisPolishFieldDiagnostic {
  const field: ResponseFieldName = "whatHappened";
  if (!isPlainObject(value)) return rejectedFieldDiagnostic(field, value, "schema-invalid", "whatHappened must be a fact-cited sentence object", "what-happened.not-object", null);
  const extraKey = Object.keys(value).find((key) => !WHAT_HAPPENED_RESPONSE_FIELDS.has(key));
  if (extraKey) return rejectedFieldDiagnostic(field, value, "schema-invalid", "whatHappened included unsupported fields", "what-happened.extra-key", null);

  const sentencesValue = value["sentences"];
  if (!Array.isArray(sentencesValue)) return rejectedFieldDiagnostic(field, value, "schema-invalid", "whatHappened must include sentences", "what-happened.sentences-not-array", null);
  if (sentencesValue.length === 0) return omittedFieldDiagnostic(field, value, "what-happened.empty-sentences-omitted", "whatHappened sentences were empty", null, { sentenceCount: 0 });
  if (sentencesValue.length > WHAT_HAPPENED_MAX_SENTENCES) {
    return rejectedFieldDiagnostic(field, value, "schema-invalid", "whatHappened narrative exceeded sentence limit", "what-happened.too-many-sentences", null, { sentenceCount: sentencesValue.length });
  }

  const factsById = new Map(context.factPacket.facts.map((fact) => [fact.id, fact]));
  const knownFactIds = new Set(factsById.keys());
  const support = buildSupportSet(context.factPacket);
  const sentenceTexts: string[] = [];
  let omittedSentenceCount = 0;
  for (const [index, sentence] of sentencesValue.entries()) {
    if (!isPlainObject(sentence)) return rejectedFieldDiagnostic(field, value, "schema-invalid", "whatHappened sentences must be JSON objects", "what-happened.sentence-not-object", null, { sentenceIndex: index, sentenceCount: sentencesValue.length });
    const sentenceExtraKey = Object.keys(sentence).find((key) => !WHAT_HAPPENED_SENTENCE_FIELDS.has(key));
    if (sentenceExtraKey) return rejectedFieldDiagnostic(field, value, "schema-invalid", "whatHappened sentence included unsupported fields", "what-happened.sentence-extra-key", null, { sentenceIndex: index, sentenceCount: sentencesValue.length });

    const text = sentence["text"];
    if (typeof text !== "string") return rejectedFieldDiagnostic(field, value, "schema-invalid", "whatHappened sentence text must be a string", "what-happened.sentence-text-invalid-type", null, { sentenceIndex: index, sentenceCount: sentencesValue.length });
    const normalized = text.replace(/\s+/g, " ").trim();

    const factIds = sentence["factIds"];
    if (!Array.isArray(factIds) || factIds.length === 0) {
      return rejectedFieldDiagnostic(field, value, "schema-invalid", "whatHappened sentence must cite one or more factIds", "what-happened.sentence-fact-ids-missing", text, { sentenceIndex: index, sentenceCount: sentencesValue.length });
    }
    if (factIds.length > MAX_FACT_IDS_PER_NARRATIVE_SENTENCE) {
      return rejectedFieldDiagnostic(field, value, "schema-invalid", "whatHappened sentence cited too many factIds", "what-happened.sentence-fact-ids-too-many", text, { sentenceIndex: index, sentenceCount: sentencesValue.length, citedFactCount: factIds.length });
    }
    const seenFactIds = new Set<string>();
    for (const factId of factIds) {
      if (typeof factId !== "string") return rejectedFieldDiagnostic(field, value, "schema-invalid", "whatHappened factIds must be strings", "what-happened.sentence-fact-id-invalid-type", text, { sentenceIndex: index, sentenceCount: sentencesValue.length, citedFactCount: factIds.length });
      if (seenFactIds.has(factId)) return rejectedFieldDiagnostic(field, value, "schema-invalid", "whatHappened sentence repeated a factId", "what-happened.sentence-fact-id-duplicate", text, { sentenceIndex: index, sentenceCount: sentencesValue.length, repeatedFactIdCount: 1, citedFactCount: factIds.length });
      seenFactIds.add(factId);
      if (!knownFactIds.has(factId as LocalDiagnosisSupportFactId)) {
        return rejectedFieldDiagnostic(field, value, "unsupported-facts", "whatHappened cited an unknown factId", "what-happened.sentence-fact-id-unknown", text, { sentenceIndex: index, sentenceCount: sentencesValue.length, unknownFactIdCount: 1, citedFactCount: factIds.length });
      }
    }

    if (!normalized || UNKNOWN_VALUES.has(normalized.toLowerCase())) {
      omittedSentenceCount += 1;
      continue;
    }
    if (narrativeSentenceCount(normalized) > 1) return rejectedFieldDiagnostic(field, value, "schema-invalid", "whatHappened sentence object contained multiple sentences", "what-happened.sentence-multiple-sentences", text, { sentenceIndex: index, sentenceCount: sentencesValue.length });
    const unsafeRule = diagnoseUnsafeOutputRule(normalized);
    if (unsafeRule) return rejectedFieldDiagnostic(field, value, "unsafe-output", "whatHappened narrative included unsafe or non-display content", unsafeRule, text, { sentenceIndex: index, sentenceCount: sentencesValue.length });
    if (containsWhatHappenedImperativeActionAdvice(normalized)) {
      return rejectedFieldDiagnostic(field, value, "unsafe-output", "whatHappened narrative included unsafe or non-display content", "what-happened.sentence-action-advice", text, { sentenceIndex: index, sentenceCount: sentencesValue.length });
    }
    if (containsUnsupportedConcreteMutationClaim(normalized, support)) {
      const unsupported = unsupportedTokenSummary(normalized, support);
      return rejectedFieldDiagnostic(field, value, "unsupported-facts", "whatHappened narrative included unsupported concrete mutation claims", "what-happened.sentence-unsupported-mutation-claim", text, { sentenceIndex: index, sentenceCount: sentencesValue.length, ...unsupportedDiagnosticCounts(unsupported) });
    }
    sentenceTexts.push(normalized);
  }

  if (sentenceTexts.length === 0) return omittedFieldDiagnostic(field, value, "what-happened.sentence-empty-omitted", "whatHappened sentences were empty or unknown", null, { sentenceCount: omittedSentenceCount });
  const combined = sentenceTexts.join(" ");
  if (combined.length > RESPONSE_FIELD_LIMITS.whatHappened) {
    return rejectedFieldDiagnostic(field, value, "schema-invalid", "whatHappened narrative exceeded length limit", "what-happened.length-limit", combined, { sentenceCount: sentenceTexts.length });
  }
  if (narrativeSentenceCount(combined) > WHAT_HAPPENED_MAX_SENTENCES) {
    return rejectedFieldDiagnostic(field, value, "schema-invalid", "whatHappened narrative exceeded sentence limit", "what-happened.too-many-sentences", combined, { sentenceCount: sentenceTexts.length });
  }
  if (isDuplicateDisplayText(combined, [context.factPacket.deterministic.headline, context.factPacket.deterministic.whatHappened])) {
    return omittedFieldDiagnostic(field, value, "what-happened.duplicate-display-text-omitted", "whatHappened duplicated deterministic display text", combined, { sentenceCount: sentenceTexts.length });
  }
  return acceptedFieldDiagnostic(field, value, combined, { sentenceCount: sentenceTexts.length });
}

function diagnoseUnsafeOutputRule(value: string): LocalDiagnosisPolishDiagnosticRuleId | null {
  if (looksLikePrompt(value)) return "unsafe.prompt-or-full-prompt";
  if (looksLikeTranscript(value)) return "unsafe.transcript";
  if (SECRET_OUTPUT_PATTERNS.some((pattern) => pattern.test(value))) return "unsafe.secret";
  if (containsRawPathLikeOutput(value)) return "unsafe.raw-path";
  if (RAW_COMMAND_OUTPUT_PATTERNS.some((pattern) => pattern.test(value))) return "unsafe.raw-command";
  if (/\b(?:route|routes|routed|routing|choose|select|press|click)\b/i.test(value) || /\b(?:follow-up|followup)\b/i.test(value)) return "unsafe.route-or-action-advice";
  if (/(?:^|[.!?]\s+)(?:then\s+|please\s+)*(?:add|edit|modify|change|delete|remove|fix|write|create|update)\s+(?:a\s+|an\s+|the\s+)?(?:test|tests|file|files|code|source|module|dependency|prompt|rule|ticket|artifact|candidate|loom|skill)\b/i.test(value)) return "unsafe.mutation-instruction";
  if (/\b(?:create|apply|store|save|persist|write)\s+(?:a\s+)?(?:route|artifact|candidate|rule|ticket|loom|file|prompt|skill|source)/i.test(value)) return "unsafe.mutation-instruction";
  if (/\b(?:generated|created|added|fabricated|invented|synthesized)\s+(?:new\s+|extra\s+)?(?:evidence|refs?|snippets?)\b/i.test(value) || /\b(?:new|extra|fabricated|invented|synthetic)\s+(?:evidence|refs?|snippets?)\b/i.test(value)) return "unsafe.generated-evidence-claim";
  if (/\b(?:fact\s+packet|bounded\s+fact\s+packet|(?:bounded|redacted)\s+packets?|packets?\b|allowed\s+keys?|json\s+(?:object|schema|response)|response\s+schema|deltas?\b|bounds?\b|analysis\s+fields?|headlines?\b|display\s+fields?|schema\s+fields?|field\s+names?|problem\s+(?:field|key|section)|whatHappened\s+(?:field|key))\b/i.test(value)) return "unsafe.internal-provenance";
  if (/\b(?:detector|reflection\s+cluster|cluster_[a-z0-9_-]+|confidence(?:\s+score)?|record\s+ids?|source\s+ids?|session\s+ids?|entry\s+ids?|fact\s+ids?|sourceType|sourceFile|sessionFile|cwd)\b/i.test(value)) return "unsafe.internal-provenance";
  if (DISPLAY_ONLY_FORBIDDEN_PATTERNS.some((pattern) => pattern.test(value))) return "unsafe.non-display-content";
  return null;
}

function diagnosticValueKind(value: unknown): LocalDiagnosisPolishDiagnosticValueKind {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  return "object";
}

function diagnosticTextMetrics(value: string): LocalDiagnosisPolishDiagnosticTextMetrics {
  const normalized = value.replace(/\s+/g, " ").trim();
  return { rawLength: value.length, normalizedLength: normalized.length, sha256: sha256DiagnosticText(value) };
}

function sha256DiagnosticText(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function unsupportedTokenSummary(value: string, support: Set<string>): { content: number; number: number; total: number } {
  const unsupportedContent = contentTokens(value).filter((token) => !support.has(token));
  const unsupportedNumbers = numberTokens(value).filter((token) => !support.has(token));
  return { content: unsupportedContent.length, number: unsupportedNumbers.length, total: unsupportedContent.length + unsupportedNumbers.length };
}

function unsupportedDiagnosticCounts(summary: { content: number; number: number }): Pick<LocalDiagnosisPolishFieldDiagnostic, "unsupportedContentTokenCount" | "unsupportedNumberTokenCount"> {
  return {
    unsupportedContentTokenCount: summary.content,
    unsupportedNumberTokenCount: summary.number,
  };
}

export function validateLocalDiagnosisPolishResponse(rawResponse: string, context: LocalDiagnosisPolishValidationContext): LocalDiagnosisPolishValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawResponse.trim());
  } catch {
    return { ok: false, reason: "malformed-json", issue: "provider response was not valid JSON" };
  }

  if (!isPlainObject(parsed)) return { ok: false, reason: "schema-invalid", issue: "provider response must be a JSON object" };

  const keys = Object.keys(parsed);
  const extraKey = keys.find((key) => !TOP_LEVEL_RESPONSE_FIELDS.has(key as LocalDiagnosisTopLevelResponseField));
  if (extraKey) return { ok: false, reason: "schema-invalid", issue: "provider response included non-display fields" };
  if (parsed["schemaVersion"] !== 2) return { ok: false, reason: "schema-invalid", issue: "provider response must use schemaVersion 2" };

  const support = buildSupportSet(context.factPacket);
  const fields: LocalDiagnosisPolishDisplayFields = {};
  let usefulCoreFields = 0;
  let narrativeCandidate: LocalNarrativeJudgeCandidate | null = null;
  let firstFieldLocalFailure: FieldValidationFailure | null = null;
  let firstCardLevelFailure: FieldValidationFailure | null = null;
  let firstUnsafeFailure: FieldValidationFailure | null = null;

  for (const key of RESPONSE_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(parsed, key)) continue;
    const value = parsed[key];
    const normalized = validateResponseField(key, value, context, support);
    if (!normalized.ok) {
      if (normalized.scope === "card-level") {
        if (!firstCardLevelFailure) firstCardLevelFailure = normalized;
        if (normalized.reason === "unsafe-output" && !firstUnsafeFailure) firstUnsafeFailure = normalized;
      } else if (!firstFieldLocalFailure) {
        firstFieldLocalFailure = normalized;
      }
      continue;
    }
    if (normalized.candidate) narrativeCandidate = normalized.candidate;
    if (normalized.value === null) continue;
    fields[key] = normalized.value;
    if (CORE_RESPONSE_FIELDS.has(key)) usefulCoreFields += 1;
  }

  if (firstUnsafeFailure) return firstUnsafeFailure;
  if (firstCardLevelFailure) return firstCardLevelFailure;
  if (usefulCoreFields === 0) {
    return firstFieldLocalFailure ?? { ok: false, reason: "empty-output", issue: "provider response did not include useful core display wording" };
  }
  return { ok: true, value: fields, narrativeCandidate };
}

type FieldValidationFailureScope = "field-local" | "card-level";
type FieldValidationFailure = { ok: false; reason: LocalDiagnosisPolishFallbackReason; issue: string; scope: FieldValidationFailureScope };
type FieldValidationResult = { ok: true; value: string | null; candidate?: LocalNarrativeJudgeCandidate | null } | FieldValidationFailure;

function fieldLocalFailure(reason: LocalDiagnosisPolishFallbackReason, issue: string): FieldValidationFailure {
  return { ok: false, reason, issue, scope: "field-local" };
}

function cardLevelFailure(reason: LocalDiagnosisPolishFallbackReason, issue: string): FieldValidationFailure {
  return { ok: false, reason, issue, scope: "card-level" };
}

function validateResponseField(
  key: ResponseFieldName,
  value: unknown,
  context: LocalDiagnosisPolishValidationContext,
  support: Set<string>,
): FieldValidationResult {
  if (key === "whatHappened") return validateWhatHappenedNarrative(value, context);
  if (FACT_CITED_DISPLAY_FIELDS.has(key as FactCitedDisplayFieldName)) {
    return validateFactCitedDisplayField(key as FactCitedDisplayFieldName, value, context);
  }
  if (value === null && key === "expectedBehavior") return { ok: true, value: null };
  if (typeof value !== "string") return cardLevelFailure("schema-invalid", "display fields must be strings");
  const normalized = value.replace(/\s+/g, " ").trim();
  if (UNKNOWN_VALUES.has(normalized.toLowerCase())) return { ok: true, value: null };
  if (normalized.length > RESPONSE_FIELD_LIMITS[key]) return cardLevelFailure("schema-invalid", "display field exceeded length limit");
  if (containsUnsafeOutput(normalized)) return cardLevelFailure("unsafe-output", "display field included unsafe or non-display content");
  if (key === "expectedBehavior") return validateExpectedBehaviorField(normalized, context);
  if (hasUnsupportedConcreteFacts(normalized, support)) return cardLevelFailure("unsupported-facts", "display field included unsupported concrete facts");
  return { ok: true, value: normalized };
}

function validateExpectedBehaviorField(
  normalized: string,
  context: LocalDiagnosisPolishValidationContext,
): FieldValidationResult {
  const expectedFacts = context.factPacket.facts.filter((fact) => EXPECTED_BEHAVIOR_SUPPORT_KINDS.has(fact.kind));
  if (expectedFacts.length === 0) {
    return fieldLocalFailure("unsupported-facts", "expected behavior was not supported by expected-behavior facts");
  }
  if (hasExpectedBehaviorNegationMismatch(normalized, expectedFacts)) {
    return fieldLocalFailure("unsupported-facts", "expected behavior contradicted expected-behavior facts");
  }
  if (hasUnsupportedFacts(normalized, buildSupportSetFromFacts(expectedFacts))) {
    return fieldLocalFailure("unsupported-facts", "expected behavior included unsupported facts");
  }
  return { ok: true, value: normalized };
}

function hasExpectedBehaviorNegationMismatch(value: string, expectedFacts: LocalDiagnosisSupportFact[]): boolean {
  const outputHasNegation = EXPECTED_BEHAVIOR_NEGATION_PATTERN.test(value);
  const factsHaveNegation = expectedFacts.some((fact) => EXPECTED_BEHAVIOR_NEGATION_PATTERN.test(fact.text));
  return outputHasNegation !== factsHaveNegation;
}

function validateFactCitedDisplayField(
  key: FactCitedDisplayFieldName,
  value: unknown,
  context: LocalDiagnosisPolishValidationContext,
): FieldValidationResult {
  if (!isPlainObject(value)) return cardLevelFailure("schema-invalid", `${key} must be a fact-cited display object`);
  const extraKey = Object.keys(value).find((fieldKey) => !FACT_CITED_DISPLAY_RESPONSE_FIELDS.has(fieldKey));
  if (extraKey) return cardLevelFailure("schema-invalid", `${key} included unsupported fields`);

  const text = value["text"];
  if (typeof text !== "string") return cardLevelFailure("schema-invalid", `${key} text must be a string`);
  const normalized = text.replace(/\s+/g, " ").trim();

  const factIds = value["factIds"];
  if (!Array.isArray(factIds) || factIds.length === 0) return cardLevelFailure("schema-invalid", `${key} must cite one or more factIds`);
  if (factIds.length > MAX_FACT_IDS_PER_DISPLAY_FIELD) return cardLevelFailure("schema-invalid", `${key} cited too many factIds`);

  const factsById = new Map(context.factPacket.facts.map((fact) => [fact.id, fact]));
  const seenFactIds = new Set<string>();
  const citedFacts: LocalDiagnosisSupportFact[] = [];
  for (const factId of factIds) {
    if (typeof factId !== "string") return cardLevelFailure("schema-invalid", `${key} factIds must be strings`);
    if (seenFactIds.has(factId)) return cardLevelFailure("schema-invalid", `${key} repeated a factId`);
    seenFactIds.add(factId);
    const fact = factsById.get(factId as LocalDiagnosisSupportFactId);
    if (!fact) return cardLevelFailure("unsupported-facts", `${key} cited an unknown factId`);
    citedFacts.push(fact);
  }

  if (!normalized || UNKNOWN_VALUES.has(normalized.toLowerCase())) return { ok: true, value: null };
  if (normalized.length > RESPONSE_FIELD_LIMITS[key]) return cardLevelFailure("schema-invalid", `${key} exceeded length limit`);
  if (containsUnsafeOutput(normalized)) return cardLevelFailure("unsafe-output", `${key} included unsafe or non-display content`);
  if (key === "evidenceSummary" && citedFacts.some((fact) => fact.kind !== "evidence-summary")) {
    return fieldLocalFailure("unsupported-facts", "evidenceSummary must cite evidence-summary facts");
  }
  if (key === "whyThisWasFlagged" && !citedFacts.some((fact) => WHY_FLAGGED_SUPPORT_KINDS.has(fact.kind))) {
    return fieldLocalFailure("unsupported-facts", "whyThisWasFlagged did not cite flagging support facts");
  }
  if (hasUnsupportedConcreteFacts(normalized, buildSupportSetFromFacts(citedFacts))) return fieldLocalFailure("unsupported-facts", `${key} included unsupported concrete facts`);
  return { ok: true, value: normalized };
}

function validateWhatHappenedNarrative(
  value: unknown,
  context: LocalDiagnosisPolishValidationContext,
): FieldValidationResult {
  if (!isPlainObject(value)) {
    return cardLevelFailure("schema-invalid", "whatHappened must be a fact-cited sentence object");
  }
  const extraKey = Object.keys(value).find((key) => !WHAT_HAPPENED_RESPONSE_FIELDS.has(key));
  if (extraKey) return cardLevelFailure("schema-invalid", "whatHappened included unsupported fields");

  const sentencesValue = value["sentences"];
  if (!Array.isArray(sentencesValue)) return cardLevelFailure("schema-invalid", "whatHappened must include sentences");
  if (sentencesValue.length === 0) return { ok: true, value: null };
  if (sentencesValue.length > WHAT_HAPPENED_MAX_SENTENCES) {
    return cardLevelFailure("schema-invalid", "whatHappened narrative exceeded sentence limit");
  }

  const factsById = new Map(context.factPacket.facts.map((fact) => [fact.id, fact]));
  const knownFactIds = new Set(factsById.keys());
  const support = buildSupportSet(context.factPacket);
  const sentenceTexts: string[] = [];
  const candidateSentences: LocalNarrativeJudgeCandidateSentence[] = [];
  for (const sentence of sentencesValue) {
    if (!isPlainObject(sentence)) return cardLevelFailure("schema-invalid", "whatHappened sentences must be JSON objects");
    const sentenceExtraKey = Object.keys(sentence).find((key) => !WHAT_HAPPENED_SENTENCE_FIELDS.has(key));
    if (sentenceExtraKey) return cardLevelFailure("schema-invalid", "whatHappened sentence included unsupported fields");

    const text = sentence["text"];
    if (typeof text !== "string") return cardLevelFailure("schema-invalid", "whatHappened sentence text must be a string");
    const normalized = text.replace(/\s+/g, " ").trim();

    const factIds = sentence["factIds"];
    if (!Array.isArray(factIds) || factIds.length === 0) {
      return cardLevelFailure("schema-invalid", "whatHappened sentence must cite one or more factIds");
    }
    if (factIds.length > MAX_FACT_IDS_PER_NARRATIVE_SENTENCE) {
      return cardLevelFailure("schema-invalid", "whatHappened sentence cited too many factIds");
    }
    const seenFactIds = new Set<string>();
    const normalizedFactIds: LocalDiagnosisSupportFactId[] = [];
    for (const factId of factIds) {
      if (typeof factId !== "string") return cardLevelFailure("schema-invalid", "whatHappened factIds must be strings");
      if (seenFactIds.has(factId)) return cardLevelFailure("schema-invalid", "whatHappened sentence repeated a factId");
      seenFactIds.add(factId);
      if (!knownFactIds.has(factId as LocalDiagnosisSupportFactId)) {
        return cardLevelFailure("unsupported-facts", "whatHappened cited an unknown factId");
      }
      normalizedFactIds.push(factId as LocalDiagnosisSupportFactId);
    }

    if (!normalized || UNKNOWN_VALUES.has(normalized.toLowerCase())) continue;
    if (narrativeSentenceCount(normalized) > 1) return cardLevelFailure("schema-invalid", "whatHappened sentence object contained multiple sentences");
    if (containsUnsafeOutput(normalized) || containsWhatHappenedImperativeActionAdvice(normalized)) {
      return cardLevelFailure("unsafe-output", "whatHappened narrative included unsafe or non-display content");
    }
    if (containsUnsupportedConcreteMutationClaim(normalized, support)) {
      return cardLevelFailure("unsupported-facts", "whatHappened narrative included unsupported concrete mutation claims");
    }
    sentenceTexts.push(normalized);
    candidateSentences.push({
      index: candidateSentences.length,
      text: normalized,
      factIds: normalizedFactIds,
      citedFacts: normalizedFactIds.map((factId) => {
        const fact = factsById.get(factId);
        if (!fact) throw new Error("validated fact ID was missing from fact map");
        return cloneSupportFact(fact);
      }),
    });
  }

  if (sentenceTexts.length === 0) return { ok: true, value: null };
  const combined = sentenceTexts.join(" ");
  if (combined.length > RESPONSE_FIELD_LIMITS.whatHappened) {
    return cardLevelFailure("schema-invalid", "whatHappened narrative exceeded length limit");
  }
  if (narrativeSentenceCount(combined) > WHAT_HAPPENED_MAX_SENTENCES) {
    return cardLevelFailure("schema-invalid", "whatHappened narrative exceeded sentence limit");
  }
  if (isDuplicateDisplayText(combined, [context.factPacket.deterministic.headline, context.factPacket.deterministic.whatHappened])) {
    return { ok: true, value: null };
  }
  return { ok: true, value: combined, candidate: { field: "whatHappened", text: combined, sentences: candidateSentences } };
}

function containsWhatHappenedImperativeActionAdvice(value: string): boolean {
  return value
    .split(/[.!?;:]+|,/)
    .map((clause) => clause.trim())
    .filter(Boolean)
    .some((clause) => WHAT_HAPPENED_IMPERATIVE_CLAUSE_PATTERN.test(clause) || WHAT_HAPPENED_INTRODUCTORY_ACTION_PATTERN.test(clause));
}

function containsUnsupportedConcreteMutationClaim(value: string, support: Set<string>): boolean {
  return CONCRETE_MUTATION_CLAIM_PATTERN.test(value) && hasUnsupportedFacts(value, support);
}

function narrativeSentenceCount(value: string): number {
  const matches = value.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g) ?? [];
  return matches.map((sentence) => sentence.trim()).filter(Boolean).length;
}

function isDuplicateDisplayText(value: string, existingValues: Array<string | null | undefined>): boolean {
  const normalized = comparableDisplayText(value);
  if (!normalized) return false;
  return existingValues.some((existing) => comparableDisplayText(existing ?? "") === normalized);
}

function comparableDisplayText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function containsUnsafeOutput(value: string): boolean {
  return looksLikePrompt(value)
    || looksLikeTranscript(value)
    || SECRET_OUTPUT_PATTERNS.some((pattern) => pattern.test(value))
    || containsRawPathLikeOutput(value)
    || RAW_COMMAND_OUTPUT_PATTERNS.some((pattern) => pattern.test(value))
    || DISPLAY_ONLY_FORBIDDEN_PATTERNS.some((pattern) => pattern.test(value));
}

function containsRawPathLikeOutput(value: string): boolean {
  return RAW_PATH_OUTPUT_PATTERNS.some((pattern) => pattern.test(value)) || redactAdditionalLocalPaths(value) !== value;
}

function factStrings(packet: LocalDiagnosisFactPacket): string[] {
  return [
    packet.deterministic.headline,
    packet.deterministic.whatHappened,
    packet.deterministic.whyItMatters,
    packet.deterministic.expectedBehavior,
    packet.delta.summary,
    packet.delta.expectation,
    packet.delta.reality,
    packet.delta.impact,
    ...packet.signals.map((signal) => signal.explanation),
    ...packet.evidence.flatMap((evidence) => [evidence.noteSummary, evidence.snippetSummary]),
  ].filter((value): value is string => Boolean(value));
}

function buildSupportSet(packet: LocalDiagnosisFactPacket): Set<string> {
  const support = buildSupportSetFromTexts(factStrings(packet));
  const count = packet.delta.occurrenceCount;
  if (count !== null) support.add(String(count));
  return support;
}

function buildSupportSetFromFacts(facts: LocalDiagnosisSupportFact[]): Set<string> {
  return buildSupportSetFromTexts(facts.map((fact) => fact.text));
}

function buildSupportSetFromTexts(texts: Array<string | null | undefined>): Set<string> {
  const support = new Set<string>(COMMON_DIAGNOSIS_TOKENS);
  for (const text of texts) {
    if (!text) continue;
    for (const token of contentTokens(text)) support.add(token);
    for (const numberToken of numberTokens(text)) support.add(numberToken);
  }
  for (const group of SYNONYM_GROUPS) {
    if (group.some((token) => support.has(token))) {
      for (const token of group) support.add(token);
    }
  }
  return support;
}

function hasUnsupportedFacts(value: string, support: Set<string>): boolean {
  for (const numberToken of numberTokens(value)) {
    if (!support.has(numberToken)) return true;
  }
  for (const token of contentTokens(value)) {
    if (!support.has(token)) return true;
  }
  return false;
}

function hasUnsupportedConcreteFacts(value: string, support: Set<string>): boolean {
  if (containsUnsupportedConcreteMutationClaim(value, support)) return true;
  for (const numberToken of numberTokens(value)) {
    if (!support.has(numberToken)) return true;
  }
  const unsupportedTokens = contentTokens(value).filter((token) => !support.has(token));
  if (unsupportedTokens.some((token) => UNSUPPORTED_CONCRETE_TOKENS.has(token))) return true;
  return unsupportedTokens.length > MAX_UNSUPPORTED_PARAPHRASE_TOKENS;
}

function contentTokens(value: string): string[] {
  const matches = value.toLowerCase().match(/[a-z][a-z0-9'-]{3,}/g) ?? [];
  const tokens: string[] = [];
  for (const match of matches) {
    const token = normalizeToken(match);
    if (!STOP_WORDS.has(token)) tokens.push(token);
  }
  return tokens;
}

function normalizeToken(token: string): string {
  return token.replace(/'s$/, "").replace(/[^a-z0-9-]/g, "");
}

function numberTokens(value: string): string[] {
  return value.match(/\b\d+\b/g) ?? [];
}
