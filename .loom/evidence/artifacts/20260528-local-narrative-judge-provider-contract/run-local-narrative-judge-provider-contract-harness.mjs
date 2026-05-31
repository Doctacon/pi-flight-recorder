import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildFlightLearnDiagnosisViewWithLocalPolish,
  buildLocalDiagnosisFactPacket,
} from '../../../../src/flight-learn-local-diagnosis-model.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
mkdirSync(__dirname, { recursive: true });

const CREATED_AT = '2026-05-28T12:00:00.000Z';

function input() {
  const delta = {
    id: 'judge-contract-harness-delta',
    status: 'candidate',
    source: 'detector',
    summary: 'Repeated validation failure pattern from a stale shell.',
    expectation: 'Validation should run from a fresh project shell after package changes.',
    reality: 'The validation check was repeated from an old shell after the package changed.',
    impact: 'That makes the validation result hard to trust.',
    severity: 'medium',
    cwd: null,
    sourceSessionFile: null,
    sourceEntryId: 'judge-contract-entry',
    evidenceRefs: [
      {
        sourceType: 'manual',
        sourceId: 'judge-contract-evidence',
        sourceFile: null,
        sessionFile: null,
        cwd: null,
        entryId: 'judge-contract-evidence-entry',
        timestamp: CREATED_AT,
        snippet: 'Validation failed twice from the same stale shell pattern.',
        note: 'Synthetic redacted validation evidence.',
      },
    ],
    activeArtifactCandidateId: null,
    statusReason: null,
    metadata: { count: 2 },
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    acceptedAt: null,
    routedAt: null,
    dismissedAt: null,
    resolvedAt: null,
    recurringAt: null,
  };
  const signals = [
    {
      id: 'judge-contract-signal',
      deltaId: delta.id,
      type: 'failed-validation',
      explanation: 'Validation failed twice from the same stale shell pattern.',
      confidence: 0.74,
      evidenceRefs: [],
      metadata: {},
      createdAt: CREATED_AT,
    },
  ];
  return { delta, signals };
}

function response(fields) {
  return JSON.stringify({ schemaVersion: 2, ...fields });
}

function cited(sentences, factIds = ['F7', 'F9', 'F10']) {
  return {
    sentences: (Array.isArray(sentences) ? sentences : [sentences]).map((text) => ({ text, factIds })),
  };
}

function acceptJudge(request) {
  return JSON.stringify({
    schemaVersion: 1,
    overallVerdict: 'accept',
    sentences: request.candidate.sentences.map((sentence) => ({
      index: sentence.index,
      verdict: 'supported',
      supportedFactIds: sentence.factIds,
      unsupportedClaims: [],
      reason: 'Supported by cited redacted facts.',
      confidence: 'high',
    })),
  });
}

function rejectJudge(request) {
  return JSON.stringify({
    schemaVersion: 1,
    overallVerdict: 'reject',
    failClosedReason: 'unsupported-facts',
    sentences: request.candidate.sentences.map((sentence) => ({
      index: sentence.index,
      verdict: 'unsupported',
      supportedFactIds: [],
      unsupportedClaims: ['unsupported bridge'],
      reason: 'Unsupported bridge from cited facts.',
      confidence: 'high',
    })),
  });
}

function uncertainJudge(request) {
  return JSON.stringify({
    schemaVersion: 1,
    overallVerdict: 'uncertain',
    failClosedReason: 'judge-uncertain',
    sentences: request.candidate.sentences.map((sentence) => ({
      index: sentence.index,
      verdict: 'uncertain',
      supportedFactIds: sentence.factIds,
      unsupportedClaims: [],
      reason: 'The local judge is uncertain.',
      confidence: 'medium',
    })),
  });
}

function lowConfidenceJudge(request) {
  return JSON.stringify({
    schemaVersion: 1,
    overallVerdict: 'accept',
    sentences: request.candidate.sentences.map((sentence) => ({
      index: sentence.index,
      verdict: 'supported',
      supportedFactIds: sentence.factIds,
      unsupportedClaims: [],
      reason: 'Supported but low confidence.',
      confidence: 'low',
    })),
  });
}

function emptySupportJudge(request) {
  return JSON.stringify({
    schemaVersion: 1,
    overallVerdict: 'accept',
    sentences: request.candidate.sentences.map((sentence) => ({
      index: sentence.index,
      verdict: 'supported',
      supportedFactIds: [],
      unsupportedClaims: [],
      reason: 'Supported verdict without identifying facts.',
      confidence: 'high',
    })),
  });
}

function unsafeJudge(request) {
  return JSON.stringify({
    schemaVersion: 1,
    overallVerdict: 'accept',
    sentences: request.candidate.sentences.map((sentence) => ({
      index: sentence.index,
      verdict: 'action-advice',
      supportedFactIds: sentence.factIds,
      unsupportedClaims: [],
      reason: 'The sentence reads like action advice.',
      confidence: 'high',
    })),
  });
}

async function runExercise(id, generatorBody, judgeMode, expected) {
  let judgeCalls = 0;
  const provider = {
    completeLocalDiagnosisPolish: async () => generatorBody,
  };
  const options = {
    enabled: true,
    provider,
    timeoutMs: 100,
  };
  if (judgeMode !== 'none') {
    options.judgeTimeoutMs = judgeMode === 'timeout' ? 1 : 100;
    options.judgeProvider = {
      completeLocalNarrativeJudge: async (request) => {
        judgeCalls += 1;
        if (judgeMode === 'provider-error') throw new Error('synthetic judge failure');
        if (judgeMode === 'timeout') return new Promise((resolve) => setTimeout(() => resolve(acceptJudge(request)), 50));
        if (judgeMode === 'accept') return acceptJudge(request);
        if (judgeMode === 'reject') return rejectJudge(request);
        if (judgeMode === 'uncertain') return uncertainJudge(request);
        if (judgeMode === 'low-confidence') return lowConfidenceJudge(request);
        if (judgeMode === 'empty-support') return emptySupportJudge(request);
        if (judgeMode === 'unsafe') return unsafeJudge(request);
        if (judgeMode === 'malformed') return 'not json';
        if (judgeMode === 'extra-field') {
          const parsed = JSON.parse(acceptJudge(request));
          parsed.rewrite = 'not allowed';
          return JSON.stringify(parsed);
        }
        if (judgeMode === 'missing-coverage') return JSON.stringify({ schemaVersion: 1, overallVerdict: 'accept', sentences: [] });
        throw new Error(`unknown judge mode ${judgeMode}`);
      },
    };
  }
  const result = await buildFlightLearnDiagnosisViewWithLocalPolish(input(), options);
  const actual = result.usedLocalModel ? 'accepted' : result.fallbackReason;
  return {
    id,
    expected,
    actual,
    pass: actual === expected,
    judgeMode,
    judgeCalls,
    usedLocalModel: result.usedLocalModel,
    fallbackReason: result.fallbackReason,
    validationIssue: result.validationIssue,
    outputWhatHappened: result.view.whatHappened,
  };
}

const packet = buildLocalDiagnosisFactPacket(input());
const narrativeBody = response({
  whatHappened: cited([
    'The validation check repeated from an old shell after the package changed.',
    'The repeated pattern makes the card about validation trust rather than an isolated check.',
  ], ['F7', 'F8', 'F9', 'F10']),
});
const headlineOnlyBody = response({ headline: 'Repeated validation failure pattern from a stale shell.' });
const unknownFactBody = response({ whatHappened: cited('The validation check repeated from an old shell.', ['F999']) });

const exercises = [
  await runExercise('accepted-after-judge-accept', narrativeBody, 'accept', 'accepted'),
  await runExercise('no-judge-provider-fails-closed-for-narrative', narrativeBody, 'none', 'provider-unavailable'),
  await runExercise('no-narrative-does-not-require-judge', headlineOnlyBody, 'none', 'accepted'),
  await runExercise('deterministic-verifier-failure-skips-judge', unknownFactBody, 'accept', 'unsupported-facts'),
  await runExercise('judge-reject-fallback', narrativeBody, 'reject', 'unsupported-facts'),
  await runExercise('judge-uncertain-fallback', narrativeBody, 'uncertain', 'unsupported-facts'),
  await runExercise('judge-low-confidence-fallback', narrativeBody, 'low-confidence', 'unsupported-facts'),
  await runExercise('judge-empty-supported-fact-ids-fallback', narrativeBody, 'empty-support', 'unsupported-facts'),
  await runExercise('judge-action-advice-fallback', narrativeBody, 'unsafe', 'unsafe-output'),
  await runExercise('judge-malformed-json-fallback', narrativeBody, 'malformed', 'malformed-json'),
  await runExercise('judge-extra-field-fallback', narrativeBody, 'extra-field', 'schema-invalid'),
  await runExercise('judge-missing-coverage-fallback', narrativeBody, 'missing-coverage', 'schema-invalid'),
  await runExercise('judge-provider-error-fallback', narrativeBody, 'provider-error', 'provider-error'),
  await runExercise('judge-timeout-fallback', narrativeBody, 'timeout', 'timeout'),
];

const summary = {
  generatedAt: new Date().toISOString(),
  modelRuntimeStarted: false,
  hostedProviderUsed: false,
  productSourceMutatedByHarness: false,
  factPacketVersion: packet.version,
  factCount: packet.facts.length,
  totalExercises: exercises.length,
  passCount: exercises.filter((exercise) => exercise.pass).length,
  failCount: exercises.filter((exercise) => !exercise.pass).length,
  outcomes: exercises.reduce((acc, exercise) => {
    acc[exercise.actual] = (acc[exercise.actual] ?? 0) + 1;
    return acc;
  }, {}),
  judgeCallCounts: Object.fromEntries(exercises.map((exercise) => [exercise.id, exercise.judgeCalls])),
  exercises,
};

writeFileSync(resolve(__dirname, 'local-narrative-judge-provider-contract-results.json'), `${JSON.stringify(summary, null, 2)}\n`);
writeFileSync(resolve(__dirname, 'harness-summary.json'), `${JSON.stringify({
  generatedAt: summary.generatedAt,
  modelRuntimeStarted: summary.modelRuntimeStarted,
  hostedProviderUsed: summary.hostedProviderUsed,
  productSourceMutatedByHarness: summary.productSourceMutatedByHarness,
  factPacketVersion: summary.factPacketVersion,
  factCount: summary.factCount,
  totalExercises: summary.totalExercises,
  passCount: summary.passCount,
  failCount: summary.failCount,
  outcomes: summary.outcomes,
  judgeCallCounts: summary.judgeCallCounts,
}, null, 2)}\n`);

console.log(JSON.stringify(summary, null, 2));
if (summary.failCount > 0) process.exitCode = 1;
