import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildFlightLearnDiagnosisViewWithLocalPolish,
} from '../../../../src/flight-learn-local-diagnosis-model.ts';
import { createLlamaCppLocalDiagnosisPolishOptions } from '../../../../src/flight-learn-llama-cpp-adapter.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const corpusPath = resolve(__dirname, '../20260528-flight-learn-narrative-rubric-corpus/narrative-what-happened-eval-corpus.v1.json');
const baseUrl = process.argv[2] ?? 'http://127.0.0.1:18118';
const corpus = JSON.parse(readFileSync(corpusPath, 'utf8'));
const now = new Date().toISOString();

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
    createdAt: now,
    updatedAt: now,
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
    createdAt: now,
  }));
}

function expectedFallback(testCase) {
  const desired = testCase.expectedNarrativeBehavior?.outcomeContract?.desiredRubricOutcomeValues ?? [];
  const primary = testCase.primaryExpectedRubricOutcome;
  return primary === 'fallback-expected' || desired.includes('fallback-expected') || (testCase.coverage ?? []).includes('fallback-expected');
}

function classify(testCase, result) {
  if (!result.usedLocalModel) return expectedFallback(testCase) ? 'fallback-expected' : 'fallback-unexpected';
  if (result.view.whatHappened === result.deterministicView.whatHappened) return 'accepted-equivalent';
  return 'accepted-needs-human-review';
}

const options = createLlamaCppLocalDiagnosisPolishOptions({
  enabled: true,
  kind: 'llama-cpp-server',
  baseUrl,
  timeoutMs: 5000,
  maxOutputTokens: 256,
  judge: {
    enabled: true,
    kind: 'llama-cpp-server',
    baseUrl,
    timeoutMs: 5000,
    maxOutputTokens: 512,
  },
});

const results = [];
for (const testCase of corpus.cases) {
  const delta = deltaFromCase(testCase);
  const signals = signalsFromCase(testCase, delta.id);
  const started = Date.now();
  let result;
  try {
    result = await buildFlightLearnDiagnosisViewWithLocalPolish({ delta, signals }, options);
  } catch (error) {
    results.push({
      id: testCase.id,
      title: testCase.title,
      primaryExpectedRubricOutcome: testCase.primaryExpectedRubricOutcome,
      coverage: testCase.coverage,
      runtimeError: error instanceof Error ? error.name : String(error),
      elapsedMs: Date.now() - started,
      rubricOutcome: 'runtime-error',
    });
    continue;
  }
  const elapsedMs = Date.now() - started;
  results.push({
    id: testCase.id,
    title: testCase.title,
    primaryExpectedRubricOutcome: testCase.primaryExpectedRubricOutcome,
    coverage: testCase.coverage,
    usedLocalModel: result.usedLocalModel,
    fallbackReason: result.fallbackReason,
    validationIssue: result.validationIssue,
    elapsedMs,
    deterministic: {
      headline: result.deterministicView.headline,
      whatHappened: result.deterministicView.whatHappened,
    },
    output: {
      headline: result.view.headline,
      whatHappened: result.view.whatHappened,
      whyItMatters: result.view.whyItMatters,
      expectedBehavior: result.view.expectedBehavior,
      limits: result.view.limits,
    },
    rubricOutcome: classify(testCase, result),
    reviewerNote: result.usedLocalModel
      ? 'Accepted by deterministic verifier plus Bonsai 4B-as-local-judge; requires human review for actual quality and self-judge bias.'
      : 'Fell back to deterministic wording before accepted display.',
  });
}

const summary = {
  generatedAt: now,
  baseUrl: 'http://127.0.0.1:18118',
  modelRuntimeStartedByHarness: false,
  hostedProviderUsed: false,
  model: 'Bonsai-4B-Q1_0.gguf',
  judgeMode: 'same Bonsai 4B model via explicit local judge adapter; experimental self-judge risk',
  totalCases: results.length,
  acceptedCount: results.filter((r) => r.usedLocalModel).length,
  fallbackCount: results.filter((r) => r.usedLocalModel === false).length,
  runtimeErrorCount: results.filter((r) => r.rubricOutcome === 'runtime-error').length,
  fallbackReasons: results.reduce((acc, result) => {
    const key = result.fallbackReason ?? (result.usedLocalModel ? 'accepted' : result.rubricOutcome);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {}),
  rubricOutcomes: results.reduce((acc, result) => {
    acc[result.rubricOutcome] = (acc[result.rubricOutcome] ?? 0) + 1;
    return acc;
  }, {}),
  latencyMs: {
    min: Math.min(...results.map((r) => r.elapsedMs).filter(Number.isFinite)),
    max: Math.max(...results.map((r) => r.elapsedMs).filter(Number.isFinite)),
    avg: Math.round(results.reduce((sum, r) => sum + (Number.isFinite(r.elapsedMs) ? r.elapsedMs : 0), 0) / Math.max(1, results.length)),
  },
};

writeFileSync(resolve(__dirname, 'real-bonsai-4b-narrative-results.json'), `${JSON.stringify({ summary, results }, null, 2)}\n`);
writeFileSync(resolve(__dirname, 'real-bonsai-4b-narrative-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
