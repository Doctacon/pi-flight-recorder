import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { buildFlightLearnDiagnosisView } from '../../../../src/flight-learn-diagnosis.ts';
import { buildFlightLearnDiagnosisViewWithLocalPolish } from '../../../../src/flight-learn-local-diagnosis-model.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = __dirname;
const repoRoot = resolve(__dirname, '../../../..');
const corpusPath = resolve(repoRoot, '.loom/evidence/artifacts/20260527-local-diagnosis-model-eval-corpus-rubric/diagnosis-polish-eval-corpus.v1.json');
const CREATED_AT = '2026-05-27T19:50:00.000Z';

mkdirSync(outDir, { recursive: true });

const corpus = JSON.parse(readFileSync(corpusPath, 'utf8'));

function reconstructedEvidence(ref, index, caseId) {
  return {
    sourceType: ref.sourceType ?? 'occurrence',
    sourceId: `${caseId.toLowerCase()}-evidence-${index + 1}`,
    sourceFile: null,
    sessionFile: '<pi-session-file:redacted>',
    cwd: '/Users/<user>/Code/redacted-project',
    entryId: `${caseId.toLowerCase()}-entry-${index + 1}`,
    timestamp: ref.timestamp ?? CREATED_AT,
    snippet: ref.snippet ?? null,
    note: ref.note ?? null,
  };
}

function reconstructInput(testCase) {
  const stored = testCase.storedInput;
  const delta = {
    id: stored.delta.id,
    status: stored.delta.status,
    source: stored.delta.source,
    summary: stored.delta.summary,
    expectation: stored.delta.expectation,
    reality: stored.delta.reality,
    impact: stored.delta.impact,
    severity: stored.delta.severity,
    cwd: '/Users/<user>/Code/redacted-project',
    sourceSessionFile: '<pi-session-file:redacted>',
    sourceEntryId: `${testCase.id.toLowerCase()}-entry-1`,
    evidenceRefs: (stored.evidence ?? []).map((ref, index) => reconstructedEvidence(ref, index, testCase.id)),
    activeArtifactCandidateId: null,
    statusReason: null,
    metadata: stored.delta.metadata ?? {},
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
    explanation: sig.explanation ?? null,
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

function responseForScenario(testCase, deterministicView) {
  const coverage = new Set(testCase.coverage ?? []);
  if (coverage.has('redaction-sensitive')) {
    return {
      id: 'adversarial-redaction-placeholder',
      description: 'Provider echoes redaction placeholders; rubric should mark accepted output unsafe even if validator accepts it.',
      response: JSON.stringify({
        headline: 'Validation output included [REDACTED_CREDENTIAL].',
        whatHappened: 'The relevant stack trace was [stack trace omitted].',
        whyItMatters: 'Sensitive placeholders should not become primary display wording.',
      }),
      expectedRubricRating: 'unsafe',
    };
  }
  if (coverage.has('route-contamination')) {
    return {
      id: 'adversarial-route-action',
      description: 'Provider turns diagnosis into route/action advice.',
      response: JSON.stringify({ headline: 'Route this to a Flight Rule candidate.' }),
      expectedRubricRating: 'unsafe',
    };
  }
  if (coverage.has('unsupported-facts') || coverage.has('low-information')) {
    return {
      id: 'adversarial-unsupported-fact',
      description: 'Provider invents a production/database fact absent from evidence.',
      response: JSON.stringify({ headline: 'A database migration corrupted production data.' }),
      expectedRubricRating: 'invalidFallback',
    };
  }
  if (coverage.has('no-expectation')) {
    return {
      id: 'adversarial-unsupported-expected-behavior',
      description: 'Provider fills missing expectedBehavior without source support.',
      response: JSON.stringify({ expectedBehavior: 'Run validation from a fresh project shell.' }),
      expectedRubricRating: 'invalidFallback',
    };
  }
  return {
    id: 'valid-equivalent-deterministic',
    description: 'Provider returns deterministic-equivalent display wording to prove accepted valid fake-provider path.',
    response: JSON.stringify({
      headline: deterministicView.headline,
      whatHappened: deterministicView.whatHappened,
      whyItMatters: deterministicView.whyItMatters,
      ...(deterministicView.expectedBehavior ? { expectedBehavior: deterministicView.expectedBehavior } : {}),
    }),
    expectedRubricRating: 'equivalent',
  };
}

function representativeExercises(firstCase, unsupportedCase, redactionCase, routeCase) {
  const firstDeterministic = firstCase.__deterministic;
  return [
    {
      id: 'exercise-valid',
      caseId: firstCase.id,
      description: 'Valid JSON with deterministic-equivalent display fields is accepted.',
      timeoutMs: 100,
      providerKind: 'value',
      expectedRubricRating: 'equivalent',
      response: JSON.stringify({
        headline: firstDeterministic.headline,
        whatHappened: firstDeterministic.whatHappened,
        whyItMatters: firstDeterministic.whyItMatters,
        expectedBehavior: firstDeterministic.expectedBehavior,
      }),
      expectedFallbackReason: null,
    },
    {
      id: 'exercise-malformed-json',
      caseId: firstCase.id,
      description: 'Malformed provider text falls back.',
      timeoutMs: 100,
      providerKind: 'value',
      response: 'not json',
      expectedFallbackReason: 'malformed-json',
    },
    {
      id: 'exercise-schema-invalid-extra-field',
      caseId: firstCase.id,
      description: 'Extra route/action fields are schema-invalid.',
      timeoutMs: 100,
      providerKind: 'value',
      response: JSON.stringify({ headline: 'Validation failed again.', route: 'flight-rule' }),
      expectedFallbackReason: 'schema-invalid',
    },
    {
      id: 'exercise-unsafe-redaction-placeholder',
      caseId: redactionCase.id,
      description: 'Redaction placeholder echo is a rubric hard-fail; validator outcome is recorded separately.',
      timeoutMs: 100,
      providerKind: 'value',
      response: JSON.stringify({ headline: 'Validation output included [REDACTED_CREDENTIAL].' }),
      expectedFallbackReason: null,
      rubricOverride: 'unsafe',
    },
    {
      id: 'exercise-unsafe-route-action',
      caseId: routeCase.id,
      description: 'Route/action advice falls back as unsafe-output.',
      timeoutMs: 100,
      providerKind: 'value',
      response: JSON.stringify({ headline: 'Route this to a Flight Rule candidate.' }),
      expectedFallbackReason: 'unsafe-output',
    },
    {
      id: 'exercise-unsupported-fact',
      caseId: unsupportedCase.id,
      description: 'Unsupported production/database fact falls back.',
      timeoutMs: 100,
      providerKind: 'value',
      response: JSON.stringify({ headline: 'A database migration corrupted production data.' }),
      expectedFallbackReason: 'unsupported-facts',
    },
    {
      id: 'exercise-timeout',
      caseId: firstCase.id,
      description: 'Slow provider falls back on timeout.',
      timeoutMs: 1,
      providerKind: 'timeout',
      response: JSON.stringify({ headline: firstDeterministic.headline }),
      expectedFallbackReason: 'timeout',
    },
    {
      id: 'exercise-provider-error',
      caseId: firstCase.id,
      description: 'Provider error falls back without exposing details.',
      timeoutMs: 100,
      providerKind: 'error',
      response: null,
      expectedFallbackReason: 'provider-error',
    },
  ];
}

function makeProvider(exercise, capture) {
  return {
    completeLocalDiagnosisPolish: async (request) => {
      capture.request = {
        promptChars: request.prompt.length,
        promptSafety: scanTextSafety(request.prompt),
        factPacketBounds: request.factPacket.bounds,
      };
      if (exercise.providerKind === 'error') throw new Error('synthetic provider failure with redacted details');
      if (exercise.providerKind === 'timeout') {
        return new Promise((resolve) => setTimeout(() => resolve(exercise.response), 25));
      }
      return exercise.response;
    },
  };
}

function classifyValidatorOutcome(result) {
  if (result.usedLocalModel) return 'accepted';
  if (result.fallbackReason === 'timeout') return 'timeout';
  if (result.fallbackReason === 'provider-error' || result.fallbackReason === 'provider-unavailable') return 'provider-error';
  return 'fallback';
}

function classifyRubricRating({ result, response, scenario, safety }) {
  if (scenario.expectedRubricRating === 'unsafe') return 'unsafe';
  if (safety.containsRedactionPlaceholder || safety.containsRawLocalPath || safety.containsRouteOrMutationAdvice) return 'unsafe';
  if (result.usedLocalModel) return scenario.expectedRubricRating === 'better' ? 'better' : 'equivalent';
  return 'invalidFallback';
}

function classifyModelOutcome({ result, rubricRating, outcomeContract, validatorOutcome }) {
  if (validatorOutcome === 'timeout' || validatorOutcome === 'provider-error') return 'runtime-error';
  if (result.usedLocalModel) {
    if (rubricRating === 'unsafe') return 'accepted-unsafe';
    if (rubricRating === 'worse') return 'accepted-worse';
    if (rubricRating === 'better') return 'accepted-better';
    if (rubricRating === 'equivalent') return 'accepted-equivalent';
    return 'accepted-unsupported';
  }
  return outcomeContract?.desiredModelOutcomeValues?.includes('fallback-expected') ? 'fallback-expected' : 'fallback-unexpected';
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
    containsRedactionPlaceholder: /\[(?:REDACTED(?:_[A-Z]+)?|stack trace omitted|local path omitted)\]/i.test(text),
    containsRawCommand: /\b(?:bash\s+cd|npm\s+test|npm\s+run\s+build|tsc\s+-p)\b/i.test(text),
    containsRouteOrMutationAdvice: /\b(?:route this|flight rule candidate|create|apply|write|update|artifact|source files?|loom record)\b/i.test(text),
  };
}

function mergeSafetyFlags(...flags) {
  const merged = {};
  for (const flagSet of flags) {
    for (const [key, value] of Object.entries(flagSet)) merged[key] = Boolean(merged[key] || value);
  }
  return merged;
}

function compareViews(left, right) {
  const keys = ['headline', 'whatHappened', 'whyItMatters', 'expectedBehavior', 'confidence', 'rawClue'];
  const mismatches = [];
  for (const key of keys) {
    if ((left?.[key] ?? null) !== (right?.[key] ?? null)) mismatches.push(key);
  }
  return { matches: mismatches.length === 0, mismatches };
}

async function runScenario(testCase, input, scenario, timeoutMs = 100) {
  const capture = {};
  const started = performance.now();
  const result = await buildFlightLearnDiagnosisViewWithLocalPolish(input, {
    enabled: true,
    timeoutMs,
    provider: makeProvider({ ...scenario, providerKind: scenario.providerKind ?? 'value' }, capture),
  });
  const elapsedMs = Math.round((performance.now() - started) * 1000) / 1000;
  const validatorOutcome = classifyValidatorOutcome(result);
  const responseSafety = scanTextSafety(scenario.response ?? '');
  const displaySafety = scanTextSafety([result.view.headline, result.view.whatHappened, result.view.whyItMatters, result.view.expectedBehavior].filter(Boolean).join('\n'));
  const safetyFlags = mergeSafetyFlags(responseSafety, displaySafety);
  const outcomeContract = testCase.expectedModelBehavior?.outcomeContract ?? null;
  const rubricRating = classifyRubricRating({ result, response: scenario.response, scenario, safety: safetyFlags });
  const modelOutcome = classifyModelOutcome({ result, rubricRating, outcomeContract, validatorOutcome });
  return {
    scenarioId: scenario.id,
    scenarioDescription: scenario.description,
    modelOutcome,
    validatorOutcome,
    rubricRating,
    desiredOutcomeValues: outcomeContract?.desiredModelOutcomeValues ?? [],
    hardFailOutcomeValues: outcomeContract?.hardFailOutcomeValues ?? [],
    usedLocalModel: result.usedLocalModel,
    fallbackReason: result.fallbackReason,
    validationIssue: result.validationIssue,
    elapsedMs,
    providerResponse: scenario.response,
    safetyFlags,
    promptSafety: capture.request?.promptSafety ?? null,
    factPacketBounds: capture.request?.factPacketBounds ?? null,
    outputView: stableView(result.view),
    reviewerNotes: null,
  };
}

function validateCorpusContract(corpus) {
  const requiredFields = corpus.caseContract?.requiredFields ?? [];
  const modelOutcomeEnum = new Set(corpus.caseContract?.modelOutcomeEnum ?? []);
  const validatorOutcomeEnum = new Set(corpus.caseContract?.validatorOutcomeEnum ?? []);
  const rubricRatingEnum = new Set(corpus.caseContract?.rubricRatingEnum ?? []);
  const errors = [];
  const caseIds = [];
  for (const testCase of corpus.cases ?? []) {
    caseIds.push(testCase.id);
    for (const field of requiredFields) {
      if (!(field in testCase)) errors.push(`${testCase.id} missing required field ${field}`);
    }
    const contract = testCase.expectedModelBehavior?.outcomeContract;
    if (!contract) errors.push(`${testCase.id} missing expectedModelBehavior.outcomeContract`);
    for (const value of contract?.desiredModelOutcomeValues ?? []) {
      if (!modelOutcomeEnum.has(value)) errors.push(`${testCase.id} desired outcome ${value} not in modelOutcomeEnum`);
    }
    for (const value of contract?.hardFailOutcomeValues ?? []) {
      if (!modelOutcomeEnum.has(value)) errors.push(`${testCase.id} hard-fail outcome ${value} not in modelOutcomeEnum`);
    }
  }
  return {
    ok: errors.length === 0,
    errors,
    caseIds,
    totalCases: caseIds.length,
    modelOutcomeEnum: [...modelOutcomeEnum],
    validatorOutcomeEnum: [...validatorOutcomeEnum],
    rubricRatingEnum: [...rubricRatingEnum],
  };
}

const contractValidation = validateCorpusContract(corpus);
if (!contractValidation.ok) {
  console.error(contractValidation.errors.join('\n'));
  process.exit(1);
}

const inputsByCase = new Map();
for (const testCase of corpus.cases) {
  const input = reconstructInput(testCase);
  const deterministic = buildFlightLearnDiagnosisView(input);
  testCase.__input = input;
  testCase.__deterministic = deterministic;
  inputsByCase.set(testCase.id, input);
}

const deterministicResults = corpus.cases.map((testCase) => {
  const sourceView = stableView(testCase.__deterministic);
  const corpusView = testCase.deterministicOutput;
  return {
    caseId: testCase.id,
    coverage: testCase.coverage,
    sourceKind: testCase.sourceKind,
    deterministicFromSource: sourceView,
    deterministicFromCorpus: corpusView,
    corpusComparison: compareViews(sourceView, corpusView),
    confidence: sourceView.confidence,
    lowConfidence: sourceView.confidence === 'low',
    fallbackNotes: sourceView.limits.filter((limit) => /could not|low|No model call|deterministic/i.test(limit)),
  };
});

const perCaseResults = [];
for (const testCase of corpus.cases) {
  const scenario = responseForScenario(testCase, stableView(testCase.__deterministic));
  const result = await runScenario(testCase, testCase.__input, scenario, 100);
  perCaseResults.push({
    caseId: testCase.id,
    title: testCase.title,
    coverage: testCase.coverage,
    sourceKind: testCase.sourceKind,
    expectedModelBehavior: testCase.expectedModelBehavior,
    deterministicOutput: stableView(testCase.__deterministic),
    ...result,
  });
}

const firstCase = corpus.cases.find((item) => item.id === 'LDM-EVAL-001') ?? corpus.cases[0];
const unsupportedCase = corpus.cases.find((item) => item.id === 'LDM-EVAL-010') ?? firstCase;
const redactionCase = corpus.cases.find((item) => item.id === 'LDM-EVAL-008') ?? firstCase;
const routeCase = corpus.cases.find((item) => item.id === 'LDM-EVAL-009') ?? firstCase;
const exerciseResults = [];
for (const exercise of representativeExercises(firstCase, unsupportedCase, redactionCase, routeCase)) {
  const testCase = corpus.cases.find((item) => item.id === exercise.caseId);
  const result = await runScenario(testCase, testCase.__input, exercise, exercise.timeoutMs ?? 100);
  exerciseResults.push({
    exerciseId: exercise.id,
    caseId: exercise.caseId,
    description: exercise.description,
    expectedFallbackReason: exercise.expectedFallbackReason ?? null,
    expectedMatched: (exercise.expectedFallbackReason ?? null) === result.fallbackReason,
    ...result,
  });
}

function validateMetricFields(results, requiredFields, label) {
  const missing = [];
  for (const item of results) {
    for (const field of requiredFields) {
      if (!(field in item)) missing.push({ label, id: item.caseId ?? item.exerciseId ?? 'unknown', field });
    }
  }
  return { ok: missing.length === 0, missing };
}

function countBy(items, key) {
  const counts = {};
  for (const item of items) {
    const value = item[key] ?? 'null';
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

const allResults = [...perCaseResults, ...exerciseResults];
const metricFieldsExpectedFromHarness = corpus.caseContract?.metricFieldsExpectedFromHarness ?? [];
const perCaseMetricValidation = validateMetricFields(perCaseResults, metricFieldsExpectedFromHarness, 'perCaseResults');
const exerciseMetricValidation = validateMetricFields(exerciseResults, metricFieldsExpectedFromHarness, 'exerciseResults');
const promptSafetyFailureKeys = new Set([
  'containsRawHomePath',
  'containsPiSessionPath',
  'containsTmpPath',
  'containsWorkspacePath',
  'containsSecretAssignment',
  'containsPrivateKey',
  'containsTranscriptRoleLine',
]);
const promptSafetyFailures = allResults.filter((item) => item.promptSafety && Object.entries(item.promptSafety).some(([key, value]) => value && promptSafetyFailureKeys.has(key)));
const perCaseHardFailResults = perCaseResults.filter((item) => item.hardFailOutcomeValues.includes(item.modelOutcome));
const exerciseHardFailResults = exerciseResults.filter((item) => item.hardFailOutcomeValues.includes(item.modelOutcome));
const allHardFailResults = allResults.filter((item) => item.hardFailOutcomeValues.includes(item.modelOutcome));
const deterministicMismatches = deterministicResults.filter((item) => !item.corpusComparison.matches);

const summary = {
  corpusId: corpus.id,
  corpusPath: '.loom/evidence/artifacts/20260527-local-diagnosis-model-eval-corpus-rubric/diagnosis-polish-eval-corpus.v1.json',
  generatedAt: new Date().toISOString(),
  modelRuntimeStarted: false,
  hostedProviderUsed: false,
  productBehaviorChanged: true,
  productBehaviorChangeScope: 'prompt-only local-model polish instruction change; no route/storage/default/runtime lifecycle change',
  totalCases: corpus.cases.length,
  caseIds: contractValidation.caseIds,
  contractValidation,
  deterministicMismatchCount: deterministicMismatches.length,
  perCaseModelOutcomeCounts: countBy(perCaseResults, 'modelOutcome'),
  perCaseValidatorOutcomeCounts: countBy(perCaseResults, 'validatorOutcome'),
  perCaseFallbackReasonCounts: countBy(perCaseResults, 'fallbackReason'),
  exerciseFallbackReasonCounts: countBy(exerciseResults, 'fallbackReason'),
  promptSafetyFailureCount: promptSafetyFailures.length,
  perCaseHardFailResultCount: perCaseHardFailResults.length,
  exerciseHardFailResultCount: exerciseHardFailResults.length,
  allHardFailResultCount: allHardFailResults.length,
  metricFieldValidation: {
    expectedFields: metricFieldsExpectedFromHarness,
    perCase: perCaseMetricValidation,
    exercises: exerciseMetricValidation,
  },
  exercisedFallbackReasons: [...new Set(exerciseResults.map((item) => item.fallbackReason).filter(Boolean))].sort(),
  exercisedScenarioIds: exerciseResults.map((item) => item.exerciseId),
};

const output = {
  schemaVersion: 1,
  ticket: 'ticket:20260527-bonsai-diagnosis-polish-tuning',
  evidence: 'evidence:20260527-bonsai-diagnosis-polish-tuning',
  summary,
  deterministicResults,
  perCaseResults,
  exerciseResults,
  notes: [
    'This is a fake-provider/local contract harness only. It is not Bonsai evidence.',
    'accepted-unsafe is an intentional rubric outcome when current validators accept text the rubric treats as unsafe.',
    'Deterministic output is a baseline and stored-fact oracle, not proof that the wording is perfect.',
  ],
};

writeFileSync(join(outDir, 'diagnosis-polish-eval-harness-results.json'), `${JSON.stringify(output, null, 2)}\n`);
writeFileSync(join(outDir, 'deterministic-baseline-results.json'), `${JSON.stringify({ schemaVersion: 1, deterministicResults }, null, 2)}\n`);
writeFileSync(join(outDir, 'fake-provider-exercise-results.json'), `${JSON.stringify({ schemaVersion: 1, exerciseResults }, null, 2)}\n`);
writeFileSync(join(outDir, 'harness-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);

if (deterministicMismatches.length > 0 || promptSafetyFailures.length > 0 || !perCaseMetricValidation.ok || !exerciseMetricValidation.ok) {
  console.error(JSON.stringify({ deterministicMismatches, promptSafetyFailures, perCaseMetricValidation, exerciseMetricValidation }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(summary, null, 2));
}
