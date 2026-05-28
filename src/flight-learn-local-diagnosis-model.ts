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

export interface LocalDiagnosisPolishResult {
  view: FlightLearnDiagnosisView;
  deterministicView: FlightLearnDiagnosisView;
  usedLocalModel: boolean;
  fallbackReason: LocalDiagnosisPolishFallbackReason | null;
  validationIssue: string | null;
}

export interface LocalDiagnosisPolishOptions {
  enabled?: boolean;
  provider?: LocalDiagnosisPolishProvider | null;
  timeoutMs?: number;
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

export interface LocalDiagnosisFactPacket {
  version: 1;
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

export interface LocalDiagnosisPolishValidationContext {
  factPacket: LocalDiagnosisFactPacket;
  deterministicView: FlightLearnDiagnosisView;
}

export type LocalDiagnosisPolishValidationResult =
  | { ok: true; value: LocalDiagnosisPolishDisplayFields }
  | { ok: false; reason: LocalDiagnosisPolishFallbackReason; issue: string };

export interface LocalDiagnosisPolishDisplayFields {
  headline?: string;
  whatHappened?: string;
  whyItMatters?: string;
  expectedBehavior?: string;
}

const DEFAULT_TIMEOUT_MS = 750;
const MAX_TIMEOUT_MS = 5_000;
const MAX_DELTA_FIELD_CHARS = 320;
const MAX_SIGNAL_COUNT = 5;
const MAX_SIGNAL_EXPLANATION_CHARS = 220;
const MAX_EVIDENCE_COUNT = 3;
const MAX_EVIDENCE_TEXT_CHARS = 180;
const MAX_EVIDENCE_TIMESTAMP_CHARS = 64;
const ABSOLUTE_PATH_REDACTION = "[local path omitted]";
const FILE_URI_PREFIX_PATTERN = /\bfile:/gi;
const PARTIAL_REDACTION_PATH_TAIL_PATTERN = /\[local path omitted\]\s+[^\/\s"'`<>]+(?:\s+[^\/\s"'`<>]+)*\/[^"'`\r\n<>]*/gi;
const LOCAL_PATH_REDACTION_OUTPUT_PATTERN = /\[\s*local path omitted\s*\]/i;
const WINDOWS_ABSOLUTE_PATH_PATTERN = /\b[A-Za-z]:\\[^\s"'`<>|]+(?:\\[^\s"'`<>|]+)*/g;
const ISO_UTC_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/;
const RESPONSE_FIELD_LIMITS = {
  headline: 120,
  whatHappened: 360,
  whyItMatters: 300,
  expectedBehavior: 320,
} as const;

type ResponseFieldName = keyof typeof RESPONSE_FIELD_LIMITS;

const RESPONSE_FIELDS = new Set<ResponseFieldName>(["headline", "whatHappened", "whyItMatters", "expectedBehavior"]);

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
  /\[REDACTED(?: [A-Z ]+)?\]/i,
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
  /(?:^|\s)(?:&&|\|\||>|2>|\$)\s*/,
];

const DISPLAY_ONLY_FORBIDDEN_PATTERNS: RegExp[] = [
  /\broute\s+(?:this|it|the|to)\b/i,
  /\b(?:choose|select|press|click)\b/i,
  /(?:^|[.!?]\s+)(?:then\s+|please\s+)*(?:add|edit|modify|change|delete|remove|fix|write|create|update)\s+(?:a\s+|an\s+|the\s+)?(?:test|tests|file|files|code|source|module|dependency|prompt|rule|ticket|artifact|candidate|loom|skill)\b/i,
  /\b(?:you|we|they|the\s+assistant|the\s+user)\s+(?:(?:can|could|should|might|may|would|must|will)|(?:(?:need|needs|has|have)\s+to))\s+(?:then\s+|also\s+|please\s+)*[a-z][a-z-]*\b/i,
  /\b(?:create|apply|store|save|persist|write)\s+(?:a\s+)?(?:route|artifact|candidate|rule|ticket|loom|file|prompt|skill|source)/i,
  /\b(?:artifact|candidate|flight\s*rule|loom\s+(?:ticket|spec|research|knowledge|record)|classifier|route\s+ranking)\b/i,
  /\b(?:source files?|docs?|prompts?|skills?)\s+(?:should|must|need|needs|will)\s+(?:be\s+)?(?:changed|updated|created|written|mutated)\b/i,
];

const FULL_PROMPT_PATTERNS: RegExp[] = [
  /\b(?:system|developer|user)\s+prompt\b/i,
  /\bfull\s+prompt\b/i,
  /BEGIN\s+(?:SYSTEM\s+)?PROMPT/i,
  /\byou are (?:chatgpt|an ai|a helpful assistant)\b/i,
];

const TRANSCRIPT_LINE_PATTERN = /^\s*(?:user|assistant|system|developer|tool|bashExecution)\s*:/gim;
const STACK_TRACE_LINE_PATTERN = /^\s*(?:at\s+\S+\s+\(|at\s+file:|at\s+\/|Caused by:|Traceback \(most recent call last\):|File "[^"]+", line \d+)/i;

const STOP_WORDS = new Set([
  "about", "above", "after", "again", "against", "also", "amid", "among", "and", "any", "are", "around", "because", "been", "before", "being", "below", "between", "both", "but", "can", "cannot", "could", "did", "does", "doing", "done", "during", "each", "for", "from", "had", "has", "have", "having", "into", "its", "itself", "just", "may", "might", "more", "most", "must", "not", "off", "once", "only", "onto", "our", "out", "over", "same", "should", "than", "that", "the", "their", "them", "then", "there", "these", "this", "those", "through", "too", "twice", "under", "until", "was", "were", "when", "where", "whether", "while", "with", "within", "without", "would", "your",
]);

const COMMON_DIAGNOSIS_TOKENS = new Set([
  "assistant", "behavior", "clear", "current", "follow", "friction", "hard", "issue", "local", "made", "makes", "matter", "matters", "needed", "needs", "observed", "problem", "progress", "recent", "recorded", "repeated", "repeatedly", "result", "results", "review", "session", "sessions", "state", "text", "trust", "unclear", "unknown", "workflow",
]);

const SYNONYM_GROUPS: string[][] = [
  ["validation", "check", "checks", "test", "tests"],
  ["build", "typecheck", "compile", "compilation"],
  ["shell", "terminal", "pane", "session"],
  ["old", "stale"],
  ["rerun", "reran", "retry", "retried"],
  ["path", "file", "module", "import", "dependency"],
  ["package", "extension", "install", "setup"],
  ["assumption", "understanding", "correction", "corrected"],
  ["trust", "reliable", "untrustworthy", "confidence"],
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
  const matches = value.match(TRANSCRIPT_LINE_PATTERN);
  return (matches?.length ?? 0) >= 2;
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

export function buildLocalDiagnosisFactPacket(input: FlightLearnDiagnosisInput, deterministicView = buildFlightLearnDiagnosisView(input)): LocalDiagnosisFactPacket {
  const signals = input.signals ?? [];
  const evidence = input.delta.evidenceRefs;
  return {
    version: 1,
    deterministic: {
      headline: compactFactText(deterministicView.headline, RESPONSE_FIELD_LIMITS.headline) ?? "Deterministic headline unavailable after redaction.",
      whatHappened: compactFactText(deterministicView.whatHappened, RESPONSE_FIELD_LIMITS.whatHappened) ?? "Deterministic event summary unavailable after redaction.",
      whyItMatters: compactFactText(deterministicView.whyItMatters, RESPONSE_FIELD_LIMITS.whyItMatters) ?? "Deterministic impact summary unavailable after redaction.",
      expectedBehavior: compactFactText(deterministicView.expectedBehavior, RESPONSE_FIELD_LIMITS.expectedBehavior),
      confidence: deterministicView.confidence,
    },
    delta: {
      source: safeEnumValue(input.delta.source, DELTA_SOURCE_VALUES, "manual"),
      status: safeEnumValue(input.delta.status, DELTA_STATUS_VALUES, "candidate"),
      severity: safeEnumValue(input.delta.severity, DELTA_SEVERITY_VALUES, "unknown"),
      summary: compactFactText(input.delta.summary, MAX_DELTA_FIELD_CHARS),
      expectation: compactFactText(input.delta.expectation, MAX_DELTA_FIELD_CHARS),
      reality: compactFactText(input.delta.reality, MAX_DELTA_FIELD_CHARS),
      impact: compactFactText(input.delta.impact, MAX_DELTA_FIELD_CHARS),
      occurrenceCount: occurrenceCount(input.delta),
    },
    signals: signals.slice(0, MAX_SIGNAL_COUNT).map(signalFact),
    evidence: evidence.slice(0, MAX_EVIDENCE_COUNT).map(evidenceFact),
    bounds: {
      maxDeltaFieldChars: MAX_DELTA_FIELD_CHARS,
      maxSignalCount: MAX_SIGNAL_COUNT,
      maxSignalExplanationChars: MAX_SIGNAL_EXPLANATION_CHARS,
      maxEvidenceCount: MAX_EVIDENCE_COUNT,
      maxEvidenceTextChars: MAX_EVIDENCE_TEXT_CHARS,
      includedSignalCount: Math.min(signals.length, MAX_SIGNAL_COUNT),
      totalSignalCount: signals.length,
      includedEvidenceCount: Math.min(evidence.length, MAX_EVIDENCE_COUNT),
      totalEvidenceCount: evidence.length,
    },
  };
}

export function buildLocalDiagnosisPrompt(factPacket: LocalDiagnosisFactPacket): string {
  const factPacketJson = JSON.stringify(factPacket);
  return [
    "You are an optional local-only phrasing helper for a Pi Flight Learn diagnosis card.",
    "Use only the bounded redacted fact packet. Do not add facts, routes, actions, artifacts, file paths, secrets, stack traces, commands, or transcript text.",
    "Return only a JSON object. Allowed keys: headline, whatHappened, whyItMatters, expectedBehavior. Omit any key you cannot improve. No other keys are allowed.",
    "Do not include confidence, scores, metadata, notes, rationale, route, action, status, severity, or any other non-display field.",
    "Do not echo or summarize the fact packet structure. Do not include nested objects, arrays, delta, signals, evidence, bounds, or analysis fields.",
    `Length limits: headline <= ${RESPONSE_FIELD_LIMITS.headline} chars; whatHappened <= ${RESPONSE_FIELD_LIMITS.whatHappened}; whyItMatters <= ${RESPONSE_FIELD_LIMITS.whyItMatters}; expectedBehavior <= ${RESPONSE_FIELD_LIMITS.expectedBehavior}.`,
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
  if (!validation.ok) return fallbackResult(deterministicView, deterministicView, validation.reason, validation.issue);

  return {
    view: applyPolishedFields(deterministicView, validation.value),
    deterministicView,
    usedLocalModel: true,
    fallbackReason: null,
    validationIssue: null,
  };
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

function fallbackResult(
  deterministicView: FlightLearnDiagnosisView,
  baseView: FlightLearnDiagnosisView,
  reason: LocalDiagnosisPolishFallbackReason,
  issue: string | null,
): LocalDiagnosisPolishResult {
  return {
    view: reason === "disabled" || reason === "provider-unavailable" ? baseView : withFallbackLimit(baseView, reason),
    deterministicView,
    usedLocalModel: false,
    fallbackReason: reason,
    validationIssue: issue,
  };
}

function withFallbackLimit(view: FlightLearnDiagnosisView, reason: LocalDiagnosisPolishFallbackReason): FlightLearnDiagnosisView {
  const limits = view.limits.filter((limit) => !limit.startsWith("No model call was made"));
  return {
    ...view,
    limits: [
      ...limits,
      `Local model phrasing was requested but rejected (${reason}); deterministic display text is shown.`,
    ],
  };
}

function applyPolishedFields(view: FlightLearnDiagnosisView, fields: LocalDiagnosisPolishDisplayFields): FlightLearnDiagnosisView {
  const limits = view.limits.filter((limit) => !limit.startsWith("No model call was made"));
  return {
    ...view,
    headline: fields.headline ?? view.headline,
    whatHappened: fields.whatHappened ?? view.whatHappened,
    whyItMatters: fields.whyItMatters ?? view.whyItMatters,
    expectedBehavior: fields.expectedBehavior ?? view.expectedBehavior,
    limits: [
      ...limits,
      "Optional local model phrasing was used for display-only wording; stored delta fields, routing, and artifacts were not changed.",
    ],
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
  const extraKey = keys.find((key) => !RESPONSE_FIELDS.has(key as ResponseFieldName));
  if (extraKey) return { ok: false, reason: "schema-invalid", issue: "provider response included non-display fields" };

  const support = buildSupportSet(context.factPacket);
  const fields: LocalDiagnosisPolishDisplayFields = {};
  let usefulFields = 0;

  for (const key of RESPONSE_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(parsed, key)) continue;
    const value = parsed[key];
    const normalized = validateResponseField(key, value, context, support);
    if (!normalized.ok) return normalized;
    if (normalized.value === null) continue;
    fields[key] = normalized.value;
    usefulFields += 1;
  }

  if (usefulFields === 0) return { ok: false, reason: "empty-output", issue: "provider response did not include useful display wording" };
  return { ok: true, value: fields };
}

type FieldValidationResult = { ok: true; value: string | null } | { ok: false; reason: LocalDiagnosisPolishFallbackReason; issue: string };

function validateResponseField(
  key: ResponseFieldName,
  value: unknown,
  context: LocalDiagnosisPolishValidationContext,
  support: Set<string>,
): FieldValidationResult {
  if (value === null && key === "expectedBehavior") return { ok: true, value: null };
  if (typeof value !== "string") return { ok: false, reason: "schema-invalid", issue: "display fields must be strings" };
  const normalized = value.replace(/\s+/g, " ").trim();
  if (UNKNOWN_VALUES.has(normalized.toLowerCase())) return { ok: true, value: null };
  if (normalized.length > RESPONSE_FIELD_LIMITS[key]) return { ok: false, reason: "schema-invalid", issue: "display field exceeded length limit" };
  if (containsUnsafeOutput(normalized)) return { ok: false, reason: "unsafe-output", issue: "display field included unsafe or non-display content" };
  if (key === "expectedBehavior" && !context.factPacket.delta.expectation && !context.deterministicView.expectedBehavior) {
    return { ok: false, reason: "unsupported-facts", issue: "expected behavior was not supported by the fact packet" };
  }
  if (hasUnsupportedFacts(normalized, support)) return { ok: false, reason: "unsupported-facts", issue: "display field included unsupported facts" };
  return { ok: true, value: normalized };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function containsUnsafeOutput(value: string): boolean {
  return SECRET_OUTPUT_PATTERNS.some((pattern) => pattern.test(value))
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
  const support = new Set<string>(COMMON_DIAGNOSIS_TOKENS);
  for (const text of factStrings(packet)) {
    for (const token of contentTokens(text)) support.add(token);
    for (const numberToken of numberTokens(text)) support.add(numberToken);
  }
  for (const group of SYNONYM_GROUPS) {
    if (group.some((token) => support.has(token))) {
      for (const token of group) support.add(token);
    }
  }
  const count = packet.delta.occurrenceCount;
  if (count !== null) support.add(String(count));
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
