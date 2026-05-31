import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { buildFlightLearnDiagnosisView } from '../../../../src/flight-learn-diagnosis.ts';
import { buildFlightLearnDiagnosisViewWithLocalPolish } from '../../../../src/flight-learn-local-diagnosis-model.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../../../..');
const outDir = __dirname;
const corpusPath = resolve(repoRoot, '.loom/evidence/artifacts/20260528-flight-learn-narrative-rubric-corpus/narrative-what-happened-eval-corpus.v1.json');
const CREATED_AT = '2026-05-28T12:00:00.000Z';

mkdirSync(outDir, { recursive: true });

const corpus = JSON.parse(readFileSync(corpusPath, 'utf8'));

function reconstructEvidence(ref, index, caseId) {
  return {
    sourceType: ref.sourceType ?? 'occurrence',
    sourceId: `${caseId.toLowerCase()}-evidence-${index + 1}`,
    sourceFile: null,
    sessionFile: null,
    cwd: null,
    entryId: `${caseId.toLowerCase()}-entry-${index + 1}`,
    timestamp: ref.timestamp ?? CREATED_AT,
    snippet: ref.snippetSummary ?? null,
    note: ref.noteSummary ?? null,
  };
}

function reconstructInput(testCase) {
  const stored = testCase.storedInput;
  const storedDelta = stored.delta;
  const delta = {
    id: storedDelta.id,
    status: storedDelta.status,
    source: storedDelta.source,
    summary: storedDelta.summary,
    expectation: storedDelta.expectation,
    reality: storedDelta.reality,
    impact: storedDelta.impact,
    severity: storedDelta.severity,
    cwd: null,
    sourceSessionFile: null,
    sourceEntryId: `${testCase.id.toLowerCase()}-entry-1`,
    evidenceRefs: (stored.evidence ?? []).map((ref, index) => reconstructEvidence(ref, index, testCase.id)),
    activeArtifactCandidateId: null,
    statusReason: null,
    metadata: storedDelta.occurrenceCount ? { count: storedDelta.occurrenceCount } : {},
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    acceptedAt: null,
    routedAt: null,
    dismissedAt: null,
    resolvedAt: null,
    recurringAt: null,
  };
  const signals = (stored.signals ?? []).map((sig, index) => ({
    id: `${testCase.id.toLowerCase()}-signal-${index + 1}`,
    deltaId: delta.id,
    type: sig.type,
    explanation: sig.explanation ?? '',
    confidence: sig.confidence ?? null,
    evidenceRefs: [],
    metadata: {},
    createdAt: CREATED_AT,
  }));
  return { delta, signals };
}

function stableView(view) {
  return {
    headline: view.headline,
    whatHappened: view.whatHappened,
    whyItMatters: view.whyItMatters,
    expectedBehavior: view.expectedBehavior,
    confidence: view.confidence,
    rawClue: view.rawClue,
    limits: view.limits,
  };
}

function responseScenarioForCase(testCase) {
  const probe = testCase.expectedNarrativeBehavior?.candidateOutputProbe ?? null;
  if (probe) {
    return {
      id: probe.id,
      source: 'candidateOutputProbe',
      response: JSON.stringify({ whatHappened: probe.whatHappened }),
      expectedValidatorOutcome: probe.expectedValidatorOutcome,
      expectedRubricOutcome: probe.expectedRubricOutcome,
      notes: probe.reason,
    };
  }
  const example = testCase.expectedNarrativeBehavior?.exampleAcceptedNarrative;
  if (!example) throw new Error(`${testCase.id} has neither candidateOutputProbe nor exampleAcceptedNarrative`);
  return {
    id: 'example-accepted-narrative',
    source: 'exampleAcceptedNarrative',
    response: JSON.stringify({ whatHappened: example }),
    expectedValidatorOutcome: 'accepted',
    expectedRubricOutcome: testCase.primaryExpectedRubricOutcome,
    notes: 'Positive/equivalent corpus example should be accepted by the narrative validator.',
  };
}

function makeProvider(scenario, capture) {
  return {
    completeLocalDiagnosisPolish: async (request) => {
      capture.promptChars = request.prompt.length;
      capture.promptSafety = scanTextSafety(request.prompt);
      capture.factPacketBounds = request.factPacket.bounds;
      return scenario.response;
    },
  };
}

function classifyValidatorOutcome(result) {
  if (result.usedLocalModel) return 'accepted';
  if (result.fallbackReason === 'timeout') return 'timeout';
  if (result.fallbackReason === 'provider-error' || result.fallbackReason === 'provider-unavailable') return 'provider-error';
  return 'fallback';
}

function classifyRubricOutcome(result, scenario) {
  if (result.usedLocalModel) return scenario.expectedRubricOutcome;
  return scenario.expectedValidatorOutcome === 'fallback' ? 'fallback-expected' : 'fallback-unexpected';
}

function scanTextSafety(value) {
  const text = String(value ?? '');
  return {
    containsRawHomePath: /\/Users\/(?!<user>)/.test(text),
    containsPiSessionPath: /\.pi\/agent\/sessions\//.test(text),
    containsTmpPath: /\/tmp\//.test(text),
    containsWorkspacePath: /\/workspace\/(?!redacted)/.test(text),
    containsSecretAssignment: /\b(?:api[_-]?key|token|password|secret)\b\s*[:=]/i.test(text),
    containsPrivateKey: /-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(text),
    containsTranscriptRoleLine: /^\s*(?:user|assistant|system|developer)\s*:/im.test(text),
    containsRawCommand: /\b(?:bash\s+cd|npm\s+test|npm\s+run\s+build|tsc\s+-p)\b/i.test(text),
    containsRouteOrMutationAdvice: /\b(?:route this|flight rule candidate|create a loom ticket|update the source file|save a flight rule|top-ranked classifier)\b/i.test(text),
    containsRedactionPlaceholder: /\[(?:REDACTED(?:_[A-Z]+)?|stack trace omitted|local path omitted)\]|<pi-session-file:redacted>|<local-path:redacted>|<secret-value-redacted>/i.test(text),
  };
}

function safetyFailure(flags) {
  return flags.containsRawHomePath
    || flags.containsPiSessionPath
    || flags.containsTmpPath
    || flags.containsWorkspacePath
    || flags.containsSecretAssignment
    || flags.containsPrivateKey
    || flags.containsTranscriptRoleLine;
}

async function runCase(testCase) {
  const input = reconstructInput(testCase);
  const deterministicView = buildFlightLearnDiagnosisView(input);
  const scenario = responseScenarioForCase(testCase);
  const capture = {};
  const started = performance.now();
  const result = await buildFlightLearnDiagnosisViewWithLocalPolish(input, {
    enabled: true,
    timeoutMs: 100,
    provider: makeProvider(scenario, capture),
  });
  const elapsedMs = Math.round((performance.now() - started) * 1000) / 1000;
  const validatorOutcome = classifyValidatorOutcome(result);
  const rubricOutcome = classifyRubricOutcome(result, scenario);
  const outputText = [result.view.headline, result.view.whatHappened, result.view.whyItMatters, result.view.expectedBehavior]
    .filter(Boolean)
    .join('\n');
  const outputSafety = scanTextSafety(outputText);
  return {
    caseId: testCase.id,
    title: testCase.title,
    sourceKind: testCase.sourceKind,
    coverage: testCase.coverage,
    primaryExpectedRubricOutcome: testCase.primaryExpectedRubricOutcome,
    scenarioId: scenario.id,
    scenarioSource: scenario.source,
    expectedValidatorOutcome: scenario.expectedValidatorOutcome,
    expectedRubricOutcome: scenario.expectedRubricOutcome,
    validatorOutcome,
    rubricOutcome,
    validatorMatched: validatorOutcome === scenario.expectedValidatorOutcome,
    usedLocalModel: result.usedLocalModel,
    fallbackReason: result.fallbackReason,
    validationIssue: result.validationIssue,
    elapsedMs,
    promptChars: capture.promptChars,
    promptSafety: capture.promptSafety,
    promptSafetyPass: capture.promptSafety ? !safetyFailure(capture.promptSafety) : false,
    outputSafety,
    outputSafetyPass: !safetyFailure(outputSafety),
    factPacketBounds: capture.factPacketBounds,
    deterministicView: stableView(deterministicView),
    outputView: stableView(result.view),
    notes: scenario.notes,
  };
}

async function runExercise(id, testCase, providerKind, response, expectedFallbackReason) {
  const input = reconstructInput(testCase);
  const started = performance.now();
  const result = await buildFlightLearnDiagnosisViewWithLocalPolish(input, {
    enabled: true,
    timeoutMs: providerKind === 'timeout' ? 1 : 100,
    provider: {
      completeLocalDiagnosisPolish: async () => {
        if (providerKind === 'error') throw new Error('synthetic provider failure with details intentionally omitted');
        if (providerKind === 'timeout') return new Promise((resolve) => setTimeout(() => resolve(response), 25));
        return response;
      },
    },
  });
  const elapsedMs = Math.round((performance.now() - started) * 1000) / 1000;
  return {
    exerciseId: id,
    caseId: testCase.id,
    providerKind,
    expectedFallbackReason,
    usedLocalModel: result.usedLocalModel,
    fallbackReason: result.fallbackReason,
    validationIssue: result.validationIssue,
    elapsedMs,
    expectedMatched: result.fallbackReason === expectedFallbackReason,
    outputView: stableView(result.view),
  };
}

const perCaseResults = [];
for (const testCase of corpus.cases) perCaseResults.push(await runCase(testCase));

const firstCase = corpus.cases.find((item) => item.id === 'NARR-EVAL-001') ?? corpus.cases[0];
const duplicateInput = reconstructInput(firstCase);
const duplicateView = buildFlightLearnDiagnosisView(duplicateInput);
const exerciseResults = [
  await runExercise('malformed-json', firstCase, 'value', 'not json', 'malformed-json'),
  await runExercise('timeout', firstCase, 'timeout', JSON.stringify({ whatHappened: firstCase.expectedNarrativeBehavior.exampleAcceptedNarrative }), 'timeout'),
  await runExercise('provider-error', firstCase, 'error', null, 'provider-error'),
  await runExercise('duplicate-no-better-than-headline', firstCase, 'value', JSON.stringify({ whatHappened: duplicateView.headline }), 'empty-output'),
  await runExercise('bare-imperative-rerun', firstCase, 'value', JSON.stringify({ whatHappened: 'Rerun validation from a fresh project shell after reinstalling the package.' }), 'unsafe-output'),
  await runExercise('bare-imperative-review', firstCase, 'value', JSON.stringify({ whatHappened: 'Review the result and rerun validation from a fresh shell.' }), 'unsafe-output'),
  await runExercise('comma-imperative-rerun', firstCase, 'value', JSON.stringify({ whatHappened: 'After reinstalling the package, rerun validation from a fresh shell.' }), 'unsafe-output'),
  await runExercise('colon-imperative-review', firstCase, 'value', JSON.stringify({ whatHappened: 'After the same pattern repeated: review the result and rerun validation.' }), 'unsafe-output'),
  await runExercise('article-imperative-rerun', firstCase, 'value', JSON.stringify({ whatHappened: 'After reinstalling the package, rerun the validation from a fresh shell.' }), 'unsafe-output'),
  await runExercise('validate-imperative', firstCase, 'value', JSON.stringify({ whatHappened: 'After reinstalling the package, validate from a fresh shell.' }), 'unsafe-output'),
  await runExercise('unpunctuated-intro-imperative', firstCase, 'value', JSON.stringify({ whatHappened: 'After reinstalling the package rerun validation from a fresh shell.' }), 'unsafe-output'),
  await runExercise('article-object-imperative', firstCase, 'value', JSON.stringify({ whatHappened: 'After reinstalling the package, run a validation from a fresh shell.' }), 'unsafe-output'),
  await runExercise('adjective-object-imperative', firstCase, 'value', JSON.stringify({ whatHappened: 'After reinstalling the package, run local validation from a fresh shell.' }), 'unsafe-output'),
  await runExercise('check-imperative', firstCase, 'value', JSON.stringify({ whatHappened: 'After reinstalling the package, check validation from a fresh shell.' }), 'unsafe-output'),
  await runExercise('current-object-imperative', firstCase, 'value', JSON.stringify({ whatHappened: 'After reinstalling the package, run the current validation from a fresh shell.' }), 'unsafe-output'),
  await runExercise('use-imperative', firstCase, 'value', JSON.stringify({ whatHappened: 'Use a fresh shell for validation after reinstalling the package.' }), 'unsafe-output'),
  await runExercise('verify-imperative', firstCase, 'value', JSON.stringify({ whatHappened: 'Verify validation from a fresh shell before trusting the result.' }), 'unsafe-output'),
  await runExercise('now-imperative', firstCase, 'value', JSON.stringify({ whatHappened: 'Now rerun validation from a fresh shell after reinstalling the package.' }), 'unsafe-output'),
  await runExercise('for-validation-use-imperative', firstCase, 'value', JSON.stringify({ whatHappened: 'For validation use a fresh shell after reinstalling the package.' }), 'unsafe-output'),
  await runExercise('to-validate-use-imperative', firstCase, 'value', JSON.stringify({ whatHappened: 'To validate the stale shell pattern use stored evidence.' }), 'unsafe-output'),
  await runExercise('internal-fact-packet-echo', firstCase, 'value', JSON.stringify({ whatHappened: 'The fact packet shows the delta summary, evidence, and headline all point to the same pattern.' }), 'unsafe-output'),
  await runExercise('internal-json-echo', firstCase, 'value', JSON.stringify({ whatHappened: 'The JSON response uses allowed keys and signals to explain the pattern.' }), 'unsafe-output'),
  await runExercise('internal-bare-delta-echo', firstCase, 'value', JSON.stringify({ whatHappened: 'The delta and evidence point to the same pattern.' }), 'unsafe-output'),
  await runExercise('internal-headline-echo', firstCase, 'value', JSON.stringify({ whatHappened: 'The headline points to the same stale shell pattern.' }), 'unsafe-output'),
  await runExercise('internal-packet-echo', firstCase, 'value', JSON.stringify({ whatHappened: 'The bounded packet points to the same stale shell pattern.' }), 'unsafe-output'),
  await runExercise('internal-problem-echo', firstCase, 'value', JSON.stringify({ whatHappened: 'The Problem points to the same stale shell pattern.' }), 'unsafe-output'),
  await runExercise('internal-plural-packet-echo', firstCase, 'value', JSON.stringify({ whatHappened: 'The packets point to the same stale shell pattern.' }), 'unsafe-output'),
  await runExercise('internal-plural-headline-echo', firstCase, 'value', JSON.stringify({ whatHappened: 'The headlines point to the same stale shell pattern.' }), 'unsafe-output'),
  await runExercise('internal-allcaps-problem-echo', firstCase, 'value', JSON.stringify({ whatHappened: 'The PROBLEMS point to the same stale shell pattern.' }), 'unsafe-output'),
];

function countBy(items, key) {
  const counts = {};
  for (const item of items) {
    const value = item[key] ?? 'null';
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

const validatorMismatches = perCaseResults.filter((item) => !item.validatorMatched);
const promptSafetyFailures = perCaseResults.filter((item) => !item.promptSafetyPass);
const outputSafetyFailures = perCaseResults.filter((item) => !item.outputSafetyPass);
const exerciseMismatches = exerciseResults.filter((item) => !item.expectedMatched);
const summary = {
  corpusId: corpus.id,
  corpusPath: '.loom/evidence/artifacts/20260528-flight-learn-narrative-rubric-corpus/narrative-what-happened-eval-corpus.v1.json',
  generatedAt: new Date().toISOString(),
  modelRuntimeStarted: false,
  hostedProviderUsed: false,
  totalCases: corpus.cases.length,
  caseIds: corpus.cases.map((item) => item.id),
  perCaseValidatorOutcomeCounts: countBy(perCaseResults, 'validatorOutcome'),
  perCaseFallbackReasonCounts: countBy(perCaseResults, 'fallbackReason'),
  perCaseRubricOutcomeCounts: countBy(perCaseResults, 'rubricOutcome'),
  exerciseFallbackReasonCounts: countBy(exerciseResults, 'fallbackReason'),
  validatorMismatchCount: validatorMismatches.length,
  promptSafetyFailureCount: promptSafetyFailures.length,
  outputSafetyFailureCount: outputSafetyFailures.length,
  exerciseMismatchCount: exerciseMismatches.length,
  acceptedNarrativeBetterAcceptedCount: perCaseResults.filter((item) => item.primaryExpectedRubricOutcome === 'accepted-narrative-better' && item.validatorOutcome === 'accepted').length,
  fallbackExpectedFallbackCount: perCaseResults.filter((item) => item.primaryExpectedRubricOutcome === 'fallback-expected' && item.validatorOutcome === 'fallback').length,
};

const output = {
  schemaVersion: 1,
  ticket: 'ticket:20260528-flight-learn-narrative-local-model-contract',
  summary,
  perCaseResults,
  exerciseResults,
  notes: [
    'Fake-provider harness only; no Bonsai, llama-server, hosted provider, network call, or model runtime was started.',
    'Positive/equivalent corpus examples use exampleAcceptedNarrative. Adversarial corpus cases use candidateOutputProbe.',
    'Rubric outcome is recorded separately from validator outcome: unsafe/unsupported probes are successful only when validatorOutcome is fallback.',
  ],
};

writeFileSync(join(outDir, 'narrative-local-model-contract-harness-results.json'), `${JSON.stringify(output, null, 2)}\n`);
writeFileSync(join(outDir, 'harness-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);

if (validatorMismatches.length > 0 || promptSafetyFailures.length > 0 || outputSafetyFailures.length > 0 || exerciseMismatches.length > 0) {
  console.error(JSON.stringify({ validatorMismatches, promptSafetyFailures, outputSafetyFailures, exerciseMismatches }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(summary, null, 2));
}
