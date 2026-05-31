import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildFlightLearnDiagnosisView,
} from '../../../../src/flight-learn-diagnosis.ts';
import {
  buildLocalDiagnosisFactPacket,
  buildLocalDiagnosisPrompt,
  validateLocalDiagnosisPolishResponse,
  validateLocalNarrativeJudgeResponse,
} from '../../../../src/flight-learn-local-diagnosis-model.ts';
import {
  createLlamaCppLocalDiagnosisPolishProvider,
  createLlamaCppLocalNarrativeJudgeProvider,
} from '../../../../src/flight-learn-llama-cpp-adapter.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const artifactDir = __dirname;
const corpusPath = resolve(__dirname, '../20260528-flight-learn-narrative-rubric-corpus/narrative-what-happened-eval-corpus.v1.json');
const baselineSummaryPath = resolve(__dirname, '../20260528-bonsai-4b-narrative-validation/real-bonsai-4b-narrative-summary.json');
const baseUrl = process.argv[2] ?? 'http://127.0.0.1:18119';
const corpus = JSON.parse(readFileSync(corpusPath, 'utf8'));
const priorBaseline = JSON.parse(readFileSync(baselineSummaryPath, 'utf8'));
const runStartedAt = new Date().toISOString();
const MODEL_NAME = 'Bonsai-4B-Q1_0.gguf';
const GENERATOR_TIMEOUT_MS = 5000;
const JUDGE_TIMEOUT_MS = 5000;
const GENERATOR_MAX_OUTPUT_TOKENS = 256;
const JUDGE_MAX_OUTPUT_TOKENS = 512;
const REPO_PLACEHOLDER = '<repo>';

function redactText(value) {
  if (typeof value !== 'string') return value;
  const homeUsersPattern = new RegExp('/' + 'Users/[^\\s"\'`<>]+', 'g');
  const piSessionsPattern = new RegExp('\\.pi/' + 'agent/' + 'sessions', 'g');
  const secretAssignmentPattern = /\b(?:API[_-]?KEY|PASSWORD|SECRET)\s*[:=]\s*[^\s"'`]+/gi;
  return value
    .replaceAll(process.cwd(), REPO_PLACEHOLDER)
    .replace(homeUsersPattern, '~')
    .replace(piSessionsPattern, '<pi-sessions>')
    .replace(secretAssignmentPattern, (match) => match.replace(/[:=].*$/, '=<redacted>'));
}

function preview(value, max = 700) {
  if (typeof value !== 'string') return null;
  const redacted = redactText(value).replace(/\s+/g, ' ').trim();
  return redacted.length <= max ? redacted : `${redacted.slice(0, max)}…`;
}

function deltaFromCase(testCase) {
  const input = testCase.storedInput;
  const delta = input.delta;
  const evidenceRefs = (input.evidence ?? input.evidenceRefs ?? []).map((ref, index) => ({
    sourceType: ref.sourceType ?? 'manual',
    sourceId: ref.sourceId ?? `synthetic-${testCase.id}-${index}`,
    sourceFile: null,
    sessionFile: null,
    cwd: null,
    entryId: ref.entryId ?? `entry-${testCase.id}-${index}`,
    timestamp: ref.timestamp ?? null,
    snippet: ref.snippetSummary ?? ref.snippet ?? ref.noteSummary ?? ref.note ?? null,
    note: ref.noteSummary ?? ref.note ?? null,
  }));
  return {
    id: delta.id ?? testCase.id,
    status: delta.status ?? 'candidate',
    source: delta.source ?? 'detector',
    summary: delta.summary ?? testCase.title,
    expectation: delta.expectation ?? null,
    reality: delta.reality ?? null,
    impact: delta.impact ?? null,
    severity: delta.severity ?? 'medium',
    cwd: null,
    sourceSessionFile: null,
    sourceEntryId: null,
    evidenceRefs,
    activeArtifactCandidateId: null,
    statusReason: null,
    metadata: delta.occurrenceCount ? { count: delta.occurrenceCount } : {},
    createdAt: runStartedAt,
    updatedAt: runStartedAt,
    acceptedAt: null,
    routedAt: null,
    dismissedAt: null,
    resolvedAt: null,
    recurringAt: null,
  };
}

function signalsFromCase(testCase, deltaId) {
  const signals = testCase.storedInput.signals ?? [];
  return signals.map((signal, index) => ({
    id: `signal-${testCase.id}-${index}`,
    deltaId,
    type: signal.type ?? 'other',
    explanation: signal.explanation ?? signal.summary ?? 'Synthetic redacted signal.',
    confidence: typeof signal.confidence === 'number' ? signal.confidence : null,
    evidenceRefs: [],
    metadata: {},
    createdAt: runStartedAt,
  }));
}

function expectedFallback(testCase) {
  const desired = testCase.expectedNarrativeBehavior?.outcomeContract?.desiredRubricOutcomeValues ?? [];
  const primary = testCase.primaryExpectedRubricOutcome;
  return primary === 'fallback-expected' || desired.includes('fallback-expected') || (testCase.coverage ?? []).includes('fallback-expected');
}

function promptVariantBaseline(factPacket) {
  return buildLocalDiagnosisPrompt(factPacket);
}

function compactFactsForPrompt(factPacket) {
  return {
    schemaVersion: 2,
    deterministic: factPacket.deterministic,
    facts: factPacket.facts.map((fact) => ({ id: fact.id, kind: fact.kind, text: fact.text })),
    bounds: {
      maxNarrativeSentences: factPacket.bounds.maxNarrativeSentences,
      maxNarrativeChars: factPacket.bounds.maxNarrativeChars,
    },
  };
}

function promptVariantExactExample(factPacket) {
  const example = {
    schemaVersion: 2,
    whatHappened: {
      sentences: [
        { text: 'A supported narrative sentence using only cited facts.', factIds: ['F1'] },
        { text: 'A second supported sentence may connect recurrence or sequence.', factIds: ['F2', 'F3'] },
      ],
    },
  };
  return [
    'You write one display-only whatHappened narrative for a Pi Flight Learn card.',
    'Return exactly one JSON object. No markdown. No prose before or after JSON. No second JSON object.',
    'The top-level object must have schemaVersion: 2 and whatHappened. Do not put sentences at top level.',
    'Required output shape example with placeholder text:',
    JSON.stringify(example),
    'Now produce the same shape for the provided facts. Replace placeholder text and factIds with supported facts from facts[].',
    'Use 2 to 4 concise sentence objects. Each sentence object must have only text and factIds. Every factId must exactly match facts[].id.',
    'Use only the facts. Do not add raw commands, raw paths, secrets, stack traces, transcript text, route advice, artifact instructions, classifier labels, or mutation instructions.',
    'If unsure, cite the deterministic facts and describe uncertainty rather than inventing a cause.',
    'Fact packet:',
    JSON.stringify(compactFactsForPrompt(factPacket)),
  ].join('\n');
}

function promptVariantMinimalWhatHappenedOnly(factPacket) {
  return [
    'Return JSON only.',
    'Required schema: {"schemaVersion":2,"whatHappened":{"sentences":[{"text":"...","factIds":["F1"]}]}}',
    'Rules: one JSON object only; no top-level sentences; no extra keys; schemaVersion must be the number 2.',
    'Write exactly 2 short sentence objects unless the facts only support 1. Each sentence must cite factIds from facts[].',
    'The text must be display-only and grounded. No advice, routes, artifacts, source edits, raw commands, raw paths, secrets, stack traces, prompts, or transcripts.',
    'Facts JSON:',
    JSON.stringify(compactFactsForPrompt(factPacket)),
  ].join('\n');
}

const variants = [
  {
    id: 'baseline-current',
    description: 'Current source buildLocalDiagnosisPrompt output; baseline for comparability.',
    buildPrompt: promptVariantBaseline,
  },
  {
    id: 'exact-example-single-json',
    description: 'Compact prompt with one exact JSON exemplar, explicit nesting, and single-object instruction.',
    buildPrompt: promptVariantExactExample,
  },
  {
    id: 'minimal-what-happened-only',
    description: 'Minimal whatHappened-only prompt to reduce optional fields and instruction load.',
    buildPrompt: promptVariantMinimalWhatHappenedOnly,
  },
];

const polishProvider = createLlamaCppLocalDiagnosisPolishProvider({
  enabled: true,
  kind: 'llama-cpp-server',
  baseUrl,
  timeoutMs: GENERATOR_TIMEOUT_MS,
  maxOutputTokens: GENERATOR_MAX_OUTPUT_TOKENS,
});
const judgeProvider = createLlamaCppLocalNarrativeJudgeProvider({
  enabled: true,
  kind: 'llama-cpp-server',
  baseUrl,
  timeoutMs: JUDGE_TIMEOUT_MS,
  maxOutputTokens: JUDGE_MAX_OUTPUT_TOKENS,
});
if (!polishProvider || !judgeProvider) throw new Error('local llama.cpp providers were not configured');

function withTimeout(promiseFactory, timeoutMs, controller) {
  return new Promise((resolve) => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      controller.abort();
      resolve({ kind: 'timeout' });
    }, timeoutMs);
    promiseFactory().then(
      (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        resolve({ kind: 'value', value });
      },
      (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        resolve({ kind: 'error', error: error instanceof Error ? error.name : String(error) });
      },
    );
  });
}

function parseJson(raw) {
  try {
    return { ok: true, value: JSON.parse(raw.trim()) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const allowedTopLevel = new Set(['schemaVersion', 'headline', 'whatHappened', 'whyItMatters', 'expectedBehavior']);
function checkSchemaShape(parsed) {
  if (!isPlainObject(parsed)) return { ok: false, issue: 'not-object' };
  const extra = Object.keys(parsed).find((key) => !allowedTopLevel.has(key));
  if (extra) return { ok: false, issue: `extra-top-level:${extra}` };
  if (parsed.schemaVersion !== 2) return { ok: false, issue: 'missing-schemaVersion-2' };
  if (!Object.prototype.hasOwnProperty.call(parsed, 'whatHappened')) return { ok: false, issue: 'missing-whatHappened' };
  const whatHappened = parsed.whatHappened;
  if (!isPlainObject(whatHappened)) return { ok: false, issue: 'whatHappened-not-object' };
  const extraWhat = Object.keys(whatHappened).find((key) => key !== 'sentences');
  if (extraWhat) return { ok: false, issue: `extra-whatHappened:${extraWhat}` };
  if (!Array.isArray(whatHappened.sentences)) return { ok: false, issue: 'sentences-not-array' };
  if (whatHappened.sentences.length === 0) return { ok: false, issue: 'sentences-empty' };
  for (const sentence of whatHappened.sentences) {
    if (!isPlainObject(sentence)) return { ok: false, issue: 'sentence-not-object' };
    const extraSentence = Object.keys(sentence).find((key) => key !== 'text' && key !== 'factIds');
    if (extraSentence) return { ok: false, issue: `extra-sentence:${extraSentence}` };
    if (typeof sentence.text !== 'string' || sentence.text.trim().length === 0) return { ok: false, issue: 'sentence-text-invalid' };
    if (!Array.isArray(sentence.factIds) || sentence.factIds.length === 0) return { ok: false, issue: 'sentence-factIds-invalid' };
    if (sentence.factIds.some((factId) => typeof factId !== 'string')) return { ok: false, issue: 'sentence-factId-non-string' };
  }
  return { ok: true, issue: null };
}

function buildJudgeRequest(factPacket, candidate, signal) {
  const facts = factPacket.facts.map((fact) => ({ ...fact }));
  const requestWithoutPromptAndSignal = {
    schemaVersion: 1,
    policy: {
      field: 'whatHappened',
      displayOnly: true,
      maxSentences: factPacket.bounds.maxNarrativeSentences,
      maxNarrativeChars: factPacket.bounds.maxNarrativeChars,
      rejectOnUncertainty: true,
      acceptedSentenceVerdicts: ['supported', 'supported-cautious-connection'],
    },
    deterministic: { ...factPacket.deterministic },
    facts,
    candidate: {
      field: 'whatHappened',
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
    'You are an optional local-only judge for a Pi Flight Learn whatHappened narrative candidate.',
    'Use only the bounded redacted facts and candidate sentences in this request. Do not add facts, rewrite text, choose routes, classify, rank, store, mutate artifacts, edit source, or mention raw paths/secrets/transcripts.',
    'Return only JSON with schemaVersion 1, overallVerdict, optional failClosedReason, and sentence verdicts. The judge is veto-only: accept only if each sentence is supported by its cited facts or is a cautious connection, useful, non-actionable, and display-only.',
    'Reject or return uncertain when support is unclear, confidence is low, action/follow-up/route/classifier advice appears, or the candidate is not useful. Uncertainty fails closed.',
    'Judge request JSON:',
    JSON.stringify(requestWithoutPromptAndSignal),
  ].join('\n');
  return { ...requestWithoutPromptAndSignal, prompt, signal };
}

function acceptedNarrativeUnsafe(text) {
  const patterns = [
    new RegExp('/' + 'Users/'),
    new RegExp('\\.pi/' + 'agent/' + 'sessions'),
    /\b(?:API[_-]?KEY|PASSWORD|SECRET)\s*[:=]/i,
    /\b(?:run|execute|create|edit|modify|route|choose|classify|rank|apply)\b/i,
    /\b(?:source file|Loom record|Flight Rule|artifact candidate|prompt template)\b/i,
    /```|<\|im_|BEGIN\s+(?:SYSTEM\s+)?PROMPT/i,
  ];
  return patterns.some((pattern) => pattern.test(text));
}

function summarizeLatencies(values) {
  const finite = values.filter((value) => Number.isFinite(value));
  if (finite.length === 0) return { min: null, max: null, avg: null };
  return {
    min: Math.min(...finite),
    max: Math.max(...finite),
    avg: Math.round(finite.reduce((sum, value) => sum + value, 0) / finite.length),
  };
}

function increment(map, key) {
  map[key] = (map[key] ?? 0) + 1;
}

async function evaluateCase(variant, testCase) {
  const delta = deltaFromCase(testCase);
  const signals = signalsFromCase(testCase, delta.id);
  const deterministicView = buildFlightLearnDiagnosisView({ delta, signals });
  const factPacket = buildLocalDiagnosisFactPacket({ delta, signals }, deterministicView);
  const prompt = variant.buildPrompt(factPacket);
  const promptStats = { chars: prompt.length, facts: factPacket.facts.length };
  const started = Date.now();
  const controller = new AbortController();
  const providerResult = await withTimeout(
    () => polishProvider.completeLocalDiagnosisPolish({ prompt, factPacket, signal: controller.signal }),
    GENERATOR_TIMEOUT_MS,
    controller,
  );
  const elapsedMs = Date.now() - started;
  const baseResult = {
    id: testCase.id,
    title: testCase.title,
    primaryExpectedRubricOutcome: testCase.primaryExpectedRubricOutcome,
    expectedFallback: expectedFallback(testCase),
    elapsedMs,
    promptStats,
    parseValid: false,
    schemaValid: false,
    verifierPass: false,
    narrativeCandidate: false,
    judgePass: false,
    accepted: false,
    unsafeAccepted: false,
    fallbackReason: null,
    validationIssue: null,
    schemaIssue: null,
    judgeIssue: null,
    rawPreview: null,
    judgeRawPreview: null,
    acceptedWhatHappened: null,
    deterministicWhatHappened: deterministicView.whatHappened,
  };

  if (providerResult.kind === 'timeout') return { ...baseResult, fallbackReason: 'timeout', validationIssue: 'generator timed out before returning JSON' };
  if (providerResult.kind === 'error') return { ...baseResult, fallbackReason: 'provider-error', validationIssue: providerResult.error ?? 'generator provider error' };

  const raw = providerResult.value;
  const parsed = parseJson(raw);
  const schema = parsed.ok ? checkSchemaShape(parsed.value) : { ok: false, issue: 'not-json' };
  const validation = validateLocalDiagnosisPolishResponse(raw, { factPacket, deterministicView });
  const result = {
    ...baseResult,
    parseValid: parsed.ok,
    schemaValid: schema.ok,
    schemaIssue: schema.issue,
    verifierPass: validation.ok,
    narrativeCandidate: Boolean(validation.ok && validation.narrativeCandidate),
    rawPreview: preview(raw),
  };
  if (!parsed.ok) return { ...result, fallbackReason: 'malformed-json', validationIssue: parsed.error };
  if (!schema.ok) return { ...result, fallbackReason: 'schema-invalid', validationIssue: schema.issue };
  if (!validation.ok) return { ...result, fallbackReason: validation.reason, validationIssue: validation.issue };
  if (!validation.narrativeCandidate) return { ...result, fallbackReason: 'empty-output', validationIssue: 'verifier returned no whatHappened narrative candidate' };

  const judgeController = new AbortController();
  const judgeStarted = Date.now();
  const judgeRequest = buildJudgeRequest(factPacket, validation.narrativeCandidate, judgeController.signal);
  const judgeProviderResult = await withTimeout(
    () => judgeProvider.completeLocalNarrativeJudge(judgeRequest),
    JUDGE_TIMEOUT_MS,
    judgeController,
  );
  const judgeElapsedMs = Date.now() - judgeStarted;
  if (judgeProviderResult.kind === 'timeout') {
    return { ...result, judgeElapsedMs, fallbackReason: 'timeout', judgeIssue: 'local narrative judge timed out before returning JSON' };
  }
  if (judgeProviderResult.kind === 'error') {
    return { ...result, judgeElapsedMs, fallbackReason: 'provider-error', judgeIssue: judgeProviderResult.error ?? 'judge provider error' };
  }
  const judgeValidation = validateLocalNarrativeJudgeResponse(judgeProviderResult.value, validation.narrativeCandidate);
  const accepted = judgeValidation.ok;
  const acceptedWhatHappened = accepted ? validation.narrativeCandidate.text : null;
  const unsafeAccepted = accepted && acceptedNarrativeUnsafe(acceptedWhatHappened);
  return {
    ...result,
    judgeElapsedMs,
    judgePass: judgeValidation.ok,
    accepted,
    unsafeAccepted,
    fallbackReason: judgeValidation.ok ? null : judgeValidation.reason,
    judgeIssue: judgeValidation.ok ? null : judgeValidation.issue,
    judgeRawPreview: preview(judgeProviderResult.value),
    acceptedWhatHappened,
  };
}

const variantResults = [];
let stoppedEarly = null;
for (const variant of variants) {
  const results = [];
  for (const testCase of corpus.cases) {
    const result = await evaluateCase(variant, testCase);
    results.push(result);
    if (result.unsafeAccepted) {
      stoppedEarly = { variant: variant.id, caseId: result.id, reason: 'unsafe accepted narrative', acceptedWhatHappened: result.acceptedWhatHappened };
      break;
    }
  }
  const fallbackReasons = {};
  const schemaIssues = {};
  const validationIssues = {};
  for (const result of results) {
    if (result.fallbackReason) increment(fallbackReasons, result.fallbackReason);
    if (result.schemaIssue) increment(schemaIssues, result.schemaIssue);
    if (result.validationIssue) increment(validationIssues, result.validationIssue);
  }
  variantResults.push({
    id: variant.id,
    description: variant.description,
    totalCases: results.length,
    parseValidCount: results.filter((result) => result.parseValid).length,
    schemaValidCount: results.filter((result) => result.schemaValid).length,
    verifierPassCount: results.filter((result) => result.verifierPass).length,
    narrativeCandidateCount: results.filter((result) => result.narrativeCandidate).length,
    judgePassCount: results.filter((result) => result.judgePass).length,
    acceptedCount: results.filter((result) => result.accepted).length,
    fallbackCount: results.filter((result) => !result.accepted).length,
    timeoutCount: results.filter((result) => result.fallbackReason === 'timeout').length,
    unsafeAcceptCount: results.filter((result) => result.unsafeAccepted).length,
    fallbackReasons,
    schemaIssues,
    validationIssues,
    latencyMs: summarizeLatencies(results.map((result) => result.elapsedMs)),
    judgeLatencyMs: summarizeLatencies(results.map((result) => result.judgeElapsedMs).filter((value) => value !== undefined)),
    results,
  });
  if (stoppedEarly) break;
}

const summary = {
  generatedAt: new Date().toISOString(),
  runStartedAt,
  baseUrl,
  model: MODEL_NAME,
  hostedProviderUsed: false,
  corpus: {
    path: '.loom/evidence/artifacts/20260528-flight-learn-narrative-rubric-corpus/narrative-what-happened-eval-corpus.v1.json',
    id: corpus.id,
    totalCases: corpus.cases.length,
  },
  priorBaseline: {
    totalCases: priorBaseline.totalCases,
    acceptedCount: priorBaseline.acceptedCount,
    fallbackCount: priorBaseline.fallbackCount,
    fallbackReasons: priorBaseline.fallbackReasons,
  },
  contract: {
    schemaVersion: 2,
    whatHappenedShape: 'whatHappened.sentences[].text + factIds',
    deterministicVerifier: 'validateLocalDiagnosisPolishResponse',
    localJudge: 'validateLocalNarrativeJudgeResponse over loopback Bonsai 4B self-judge',
    failClosed: true,
  },
  variants: variantResults.map(({ results, ...variant }) => variant),
  stoppedEarly,
  unsafeAcceptCount: variantResults.reduce((sum, variant) => sum + variant.results.filter((result) => result.unsafeAccepted).length, 0),
};

const sampleResults = [];
for (const variant of variantResults) {
  for (const result of variant.results.slice(0, 4)) {
    sampleResults.push({
      variant: variant.id,
      id: result.id,
      parseValid: result.parseValid,
      schemaValid: result.schemaValid,
      verifierPass: result.verifierPass,
      judgePass: result.judgePass,
      accepted: result.accepted,
      fallbackReason: result.fallbackReason,
      schemaIssue: result.schemaIssue,
      validationIssue: result.validationIssue,
      judgeIssue: result.judgeIssue,
      rawPreview: result.rawPreview,
      judgeRawPreview: result.judgeRawPreview,
      acceptedWhatHappened: result.acceptedWhatHappened,
    });
  }
}

writeFileSync(resolve(artifactDir, 'schema-prompt-tuning-results.json'), `${JSON.stringify({ summary, variants: variantResults }, null, 2)}\n`);
writeFileSync(resolve(artifactDir, 'schema-prompt-tuning-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
writeFileSync(resolve(artifactDir, 'sanitized-raw-samples.json'), `${JSON.stringify({ generatedAt: summary.generatedAt, samples: sampleResults }, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
if (stoppedEarly) process.exitCode = 2;
