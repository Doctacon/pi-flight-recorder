import { compactSnippet, sanitizeStoredText } from "./redact.js";
import type { DeltaDetectorSignal, DeltaDetectorSignalType, ExpectationDelta } from "./types.js";

export type FlightLearnDiagnosisConfidence = "high" | "medium" | "low";

type DiagnosisDomain =
  | "validation"
  | "build"
  | "stale-edit"
  | "user-correction"
  | "package-install"
  | "path-module"
  | "reversal-retry"
  | "repeated-failure"
  | "manual"
  | "unknown";

export interface FlightLearnDiagnosisView {
  headline: string;
  whatHappened: string;
  whyItMatters: string;
  expectedBehavior: string | null;
  rawClue: string | null;
  confidence: FlightLearnDiagnosisConfidence;
  limits: string[];
}

export interface FlightLearnDiagnosisInput {
  delta: ExpectationDelta;
  signals?: DeltaDetectorSignal[];
}

const UNKNOWN_VALUES = new Set(["", "unknown", "n/a", "none", "null", "undefined"]);

const RAW_OR_INTERNAL_PATTERNS: RegExp[] = [
  /\b(?:bash|zsh|sh)\s+(?:cd|-lc)\b/i,
  /\b(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?[\w:-]+\b/i,
  /\b(?:vitest|tsc|eslint|prettier)\b/i,
  /\b(?:oldText|apply_patch|exact[- ]text)\b/i,
  /(?:^|\s)(?:&&|\|\||>|2>|\$)\s*/,
  /\/(?:Users|home)\//i,
  /<pi-session-file:/i,
  /\b(?:cluster|delta|sig)_[a-z0-9][a-z0-9_-]{5,}\b/i,
  /^observed\s+\d+\s+related failure occurrence/i,
  /^repeated local friction across tools\/cwds/i,
  /^repeated failure pattern:/i,
  /^user correction:/i,
  /\breflection cluster\b/i,
  /\bdetector(?: signal)?\b/i,
];

function clean(value: string | null | undefined, maxLength = 300): string | null {
  const sanitized = sanitizeStoredText(value ?? "", maxLength).replace(/\s+/g, " ").trim();
  if (UNKNOWN_VALUES.has(sanitized.toLowerCase())) return null;
  return sanitized;
}

function stripDeltaPrefix(value: string): string {
  return value
    .replace(/^repeated failure pattern:\s*/i, "")
    .replace(/^expectation delta:\s*/i, "")
    .replace(/^repeated local friction:\s*/i, "")
    .trim();
}

function hasRawOrInternalText(value: string): boolean {
  return RAW_OR_INTERNAL_PATTERNS.some((pattern) => pattern.test(value));
}

function usefulHumanText(value: string | null | undefined, maxLength = 300): string | null {
  const text = clean(value, maxLength);
  if (!text) return null;
  const stripped = stripDeltaPrefix(text);
  if (!stripped || UNKNOWN_VALUES.has(stripped.toLowerCase())) return null;
  if (hasRawOrInternalText(text) || hasRawOrInternalText(stripped)) return null;
  if (!/[a-z]/i.test(stripped) || stripped.length < 12) return null;
  return stripped;
}

function signalTypeSet(signals: DeltaDetectorSignal[]): Set<DeltaDetectorSignalType> {
  return new Set(signals.map((signal) => signal.type));
}

function combinedText(delta: ExpectationDelta, signals: DeltaDetectorSignal[]): string {
  const evidenceText = delta.evidenceRefs.flatMap((ref) => [ref.snippet, ref.note]).filter((value): value is string => Boolean(value));
  const signalText = signals.flatMap((signal) => [signal.type, signal.explanation]);
  return [delta.summary, delta.expectation, delta.reality, delta.impact, ...evidenceText, ...signalText]
    .filter((value): value is string => Boolean(value))
    .join("\n");
}

function deriveDomain(delta: ExpectationDelta, signals: DeltaDetectorSignal[]): DiagnosisDomain {
  const types = signalTypeSet(signals);
  const text = combinedText(delta, signals).toLowerCase();

  if (types.has("user-correction") || /\bno,? actually\b|\buser correction\b|\byou misunderstood\b|\bwrong assumption\b/.test(text)) return "user-correction";
  if (types.has("stale-edit-attempt") || /\boldtext\b|\bexact[- ]text\b|\bstale edit\b|\bedit(?:ed)?\b.*\b(?:not found|mismatch|no longer matched)\b/.test(text)) return "stale-edit";
  if (types.has("reversal-retry-loop") || /\bretr(?:y|ied|ies)\b|\breversal\b|\bloop\b|\bbacktracked\b/.test(text)) return "reversal-retry";
  if (/\bnpm\s+run\s+build\b|\bbuild\b|\btsc\b|\btypecheck\b/.test(text)) return "build";
  if (types.has("failed-validation") || /\bnpm\s+(?:run\s+)?test\b|\bvitest\b|\bvalidation\b|\btest(?:s|ing)?\b|\blint\b|\bcheck\b/.test(text)) return "validation";
  if (/\bpi install\b|\bpackage install\b|\bextension load\b|\binstall(?:ed|ation)?\b/.test(text)) return "package-install";
  if (/\bcannot find module\b|\bmodule not found\b|\bfile not found\b|\benoent\b|\bpath mismatch\b|\bmissing file\b/.test(text)) return "path-module";
  if (types.has("manual-capture")) return "manual";
  if (types.has("reflection-cluster") || types.has("repeated-tool-failure") || /\brepeated failure\b|\brelated failure occurrence/.test(text)) return "repeated-failure";
  return "unknown";
}

function countFromMetadata(delta: ExpectationDelta): number | null {
  const count = delta.metadata["count"];
  return typeof count === "number" && Number.isFinite(count) && count > 0 ? Math.floor(count) : null;
}

function countFromText(delta: ExpectationDelta, signals: DeltaDetectorSignal[]): number | null {
  const text = combinedText(delta, signals);
  const observed = /observed\s+(\d+)\s+related failure occurrence/i.exec(text);
  if (observed?.[1]) return Number.parseInt(observed[1], 10);
  const related = /has\s+(\d+)\s+related occurrence/i.exec(text);
  if (related?.[1]) return Number.parseInt(related[1], 10);
  return null;
}

function occurrenceCount(delta: ExpectationDelta, signals: DeltaDetectorSignal[]): number | null {
  return countFromMetadata(delta) ?? countFromText(delta, signals);
}

function countPhrase(count: number | null): string {
  if (count === 1) return "once in recent sessions";
  if (count === 2) return "twice in recent sessions";
  if (count && count > 2) return `${count} times in recent sessions`;
  return "in recent sessions";
}

function domainHeadline(domain: DiagnosisDomain): string {
  switch (domain) {
    case "validation":
      return "A validation command failed repeatedly in this project.";
    case "build":
      return "A build check failed repeatedly in this project.";
    case "stale-edit":
      return "A file edit failed because the target text no longer matched.";
    case "user-correction":
      return "The user had to correct an assistant assumption.";
    case "package-install":
      return "A package or extension install step failed repeatedly.";
    case "path-module":
      return "A path, file, or module lookup failed repeatedly.";
    case "reversal-retry":
      return "The assistant retried or reversed course repeatedly on the same issue.";
    case "manual":
      return "A manually captured expectation gap is ready for review.";
    case "repeated-failure":
      return "A repeated workflow problem showed up across recent sessions.";
    case "unknown":
      return "A repeated issue was detected, but the plain-English cause is unclear.";
  }
}

function domainWhatHappened(domain: DiagnosisDomain, count: number | null): string {
  const seen = countPhrase(count);
  switch (domain) {
    case "validation":
      return `Pi saw the same validation-failure pattern ${seen}.`;
    case "build":
      return `Pi saw the same build-check failure pattern ${seen}.`;
    case "stale-edit":
      return `Pi saw repeated edit attempts where the target text no longer matched the file.`;
    case "user-correction":
      return "The user corrected the assistant's understanding during the session.";
    case "package-install":
      return `Pi saw repeated friction around package or extension setup ${count ? seen : "in local evidence"}.`;
    case "path-module":
      return `Pi saw repeated evidence that a path, file, or module could not be resolved.`;
    case "reversal-retry":
      return "Pi saw the assistant retry or reverse course around the same problem instead of converging.";
    case "manual":
      return "A manual learning note recorded an expectation gap for review.";
    case "repeated-failure":
      return `Pi saw a repeated failure pattern ${seen}.`;
    case "unknown":
      return "Local evidence recorded an expectation gap that needs human review.";
  }
}

function domainWhyItMatters(domain: DiagnosisDomain): string {
  switch (domain) {
    case "validation":
    case "build":
      return "Repeated validation friction makes it harder to trust whether the latest code actually passed.";
    case "stale-edit":
      return "Repeated stale edits waste review time and can push changes into the wrong place.";
    case "user-correction":
      return "When the user has to correct the assistant, progress slows and the same assumption may recur.";
    case "package-install":
      return "Install or extension setup friction can make release validation harder to trust.";
    case "path-module":
      return "Path or dependency confusion can make checks fail for reasons unrelated to the intended change.";
    case "reversal-retry":
      return "Repeated retries make the session noisy and can hide the actual expectation gap.";
    case "manual":
      return "Reviewing the note keeps a local expectation gap from being lost.";
    case "repeated-failure":
    case "unknown":
      return "Keeping the evidence visible helps decide whether this needs a follow-up or more observation.";
  }
}

function rawCandidateTexts(delta: ExpectationDelta, signals: DeltaDetectorSignal[]): string[] {
  const evidenceValues = delta.evidenceRefs.flatMap((ref) => [ref.snippet, ref.note]);
  const signalValues = signals.map((signal) => signal.explanation);
  return [delta.summary, delta.reality, delta.impact, delta.expectation, ...evidenceValues, ...signalValues]
    .filter((value): value is string => Boolean(value))
    .map((value) => sanitizeStoredText(value, 260).replace(/\s+/g, " ").trim())
    .filter((value) => value.length > 0);
}

function usefulRawClueText(value: string): boolean {
  if (!hasRawOrInternalText(value)) return false;
  if (/^(?:delta|cluster|sig)_[a-z0-9][a-z0-9_-]{5,}$/i.test(value)) return false;
  if (/^[a-z-]+ detector signal$/i.test(value)) return false;
  return true;
}

function rawClue(delta: ExpectationDelta, signals: DeltaDetectorSignal[]): string | null {
  const candidates = rawCandidateTexts(delta, signals);
  const raw = candidates.find((candidate) => usefulRawClueText(candidate));
  return raw ? compactSnippet(raw, 220) : null;
}

function confidenceFor(domain: DiagnosisDomain, usedHumanFields: boolean, signals: DeltaDetectorSignal[]): FlightLearnDiagnosisConfidence {
  if (usedHumanFields) return "high";
  if (domain === "unknown") return "low";
  const bestSignalConfidence = Math.max(...signals.map((signal) => signal.confidence ?? 0), 0);
  return bestSignalConfidence >= 0.72 ? "high" : "medium";
}

function limitsFor(raw: string | null, confidence: FlightLearnDiagnosisConfidence): string[] {
  const limits = [
    "Display-only diagnosis; stored delta fields were not changed.",
    "No model call was made; this was generated locally from stored delta fields, detector signals, and evidence snippets.",
  ];
  if (raw) limits.push("Raw command, path, detector, or provenance details should stay secondary to this diagnosis.");
  if (confidence === "low") limits.push("Plain-English cause could not be confidently derived; inspect evidence before routing.");
  return limits;
}

interface HumanDisplayFields {
  headline: string | null;
  whatHappened: string | null;
  whyItMatters: string | null;
  expectedBehavior: string | null;
}

function useHumanFields(delta: ExpectationDelta): HumanDisplayFields {
  return {
    headline: usefulHumanText(delta.summary, 240),
    whatHappened: usefulHumanText(delta.reality, 320),
    whyItMatters: usefulHumanText(delta.impact, 260),
    expectedBehavior: usefulHumanText(delta.expectation, 320),
  };
}

function hasUsefulHumanField(fields: HumanDisplayFields): boolean {
  return Boolean(fields.headline || fields.whatHappened || fields.whyItMatters || fields.expectedBehavior);
}

export function buildFlightLearnDiagnosisView(input: FlightLearnDiagnosisInput): FlightLearnDiagnosisView {
  const signals = input.signals ?? [];
  const domain = deriveDomain(input.delta, signals);
  const human = useHumanFields(input.delta);
  const count = occurrenceCount(input.delta, signals);
  const raw = rawClue(input.delta, signals);

  const headline = human.headline ?? domainHeadline(domain);
  const whatHappened = human.whatHappened ?? domainWhatHappened(domain, count);
  const whyItMatters = human.whyItMatters ?? domainWhyItMatters(domain);
  const confidence = confidenceFor(domain, hasUsefulHumanField(human), signals);

  return {
    headline,
    whatHappened,
    whyItMatters,
    expectedBehavior: human.expectedBehavior,
    rawClue: raw,
    confidence,
    limits: limitsFor(raw, confidence),
  };
}
