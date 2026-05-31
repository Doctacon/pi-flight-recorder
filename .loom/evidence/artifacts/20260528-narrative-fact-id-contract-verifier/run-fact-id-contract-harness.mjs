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
    id: 'fact-id-contract-harness-delta',
    status: 'candidate',
    source: 'detector',
    summary: 'Repeated validation failure pattern from a stale shell.',
    expectation: 'Validation should run from a fresh project shell after package changes.',
    reality: 'The validation check was repeated from an old shell after the package changed.',
    impact: 'That makes the validation result hard to trust.',
    severity: 'medium',
    cwd: null,
    sourceSessionFile: null,
    sourceEntryId: 'fact-id-contract-entry',
    evidenceRefs: [
      {
        sourceType: 'manual',
        sourceId: 'fact-id-contract-evidence',
        sourceFile: null,
        sessionFile: null,
        cwd: null,
        entryId: 'fact-id-contract-evidence-entry',
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
      id: 'fact-id-contract-signal',
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

async function runExercise(id, mode, body, expected) {
  const provider = {
    completeLocalDiagnosisPolish: async () => {
      if (mode === 'provider-error') throw new Error('synthetic provider failure');
      if (mode === 'timeout') return new Promise((resolve) => setTimeout(() => resolve(body), 50));
      return body;
    },
  };
  const result = await buildFlightLearnDiagnosisViewWithLocalPolish(input(), { enabled: true, provider, timeoutMs: mode === 'timeout' ? 1 : 100 });
  const actual = result.usedLocalModel ? 'accepted' : result.fallbackReason;
  return {
    id,
    expected,
    actual,
    pass: actual === expected,
    usedLocalModel: result.usedLocalModel,
    fallbackReason: result.fallbackReason,
    validationIssue: result.validationIssue,
    outputWhatHappened: result.view.whatHappened,
  };
}

const packet = buildLocalDiagnosisFactPacket(input());
const factIds = packet.facts.map((fact) => fact.id);
const exercises = [
  await runExercise(
    'accepted-fact-id-narrative',
    'value',
    response({
      whatHappened: cited([
        'The validation check repeated from an old shell after the package changed.',
        'The repeated pattern makes the card about validation trust rather than an isolated check.',
      ], ['F7', 'F8', 'F9', 'F10']),
    }),
    'accepted',
  ),
  await runExercise('string-what-happened-rejected', 'value', response({ whatHappened: 'The validation check repeated from an old shell.' }), 'schema-invalid'),
  await runExercise('missing-fact-ids-rejected', 'value', response({ whatHappened: { sentences: [{ text: 'The validation check repeated from an old shell.', factIds: [] }] } }), 'schema-invalid'),
  await runExercise('unknown-fact-id-rejected', 'value', response({ whatHappened: cited('The validation check repeated from an old shell.', ['F999']) }), 'unsupported-facts'),
  await runExercise('hard-unsafe-raw-command-rejected', 'value', response({ whatHappened: cited('The validation check used npm test from the stale shell.', ['F10']) }), 'unsafe-output'),
  await runExercise('hard-unsafe-common-command-rejected', 'value', response({ whatHappened: cited('The validation check used git status from the stale shell.', ['F10']) }), 'unsafe-output'),
  await runExercise('hard-unsafe-shell-command-rejected', 'value', response({ whatHappened: cited('The validation check used ls -la from the stale shell.', ['F10']) }), 'unsafe-output'),
  await runExercise('hard-unsafe-network-command-rejected', 'value', response({ whatHappened: cited('The validation check used curl https://example.invalid from the stale shell.', ['F10']) }), 'unsafe-output'),
  await runExercise('hard-unsafe-project-command-rejected', 'value', response({ whatHappened: cited('The validation check used tsx src/cli.ts from the stale shell.', ['F10']) }), 'unsafe-output'),
  await runExercise('display-only-route-advice-rejected', 'value', response({ whatHappened: cited('Route this to a Flight Rule after the validation pattern repeats.', ['F10']) }), 'unsafe-output'),
  await runExercise('display-only-passive-route-advice-rejected', 'value', response({ whatHappened: cited('This should be routed to validation follow-up.', ['F10']) }), 'unsafe-output'),
  await runExercise('display-only-followup-advice-rejected', 'value', response({ whatHappened: cited('This belongs with validation follow-up.', ['F10']) }), 'unsafe-output'),
  await runExercise('duplicate-deterministic-rejected-as-empty', 'value', response({ whatHappened: cited(packet.deterministic.whatHappened, ['F2']) }), 'empty-output'),
  await runExercise('duplicate-fact-id-rejected', 'value', response({ whatHappened: cited('The validation check repeated from an old shell.', ['F7', 'F7']) }), 'schema-invalid'),
  await runExercise('sentence-role-extra-key-rejected', 'value', response({ whatHappened: { sentences: [{ text: 'The validation check repeated from an old shell.', factIds: ['F7'], role: 'sequence' }] } }), 'schema-invalid'),
  await runExercise('malformed-json-rejected', 'value', 'not json', 'malformed-json'),
  await runExercise('provider-error-fallback', 'provider-error', '{}', 'provider-error'),
  await runExercise('timeout-fallback', 'timeout', response({ whatHappened: cited('The validation check repeated from an old shell.', ['F10']) }), 'timeout'),
];

const summary = {
  generatedAt: new Date().toISOString(),
  modelRuntimeStarted: false,
  hostedProviderUsed: false,
  productSourceMutatedByHarness: false,
  factPacketVersion: packet.version,
  factIds,
  factCount: packet.facts.length,
  totalExercises: exercises.length,
  passCount: exercises.filter((exercise) => exercise.pass).length,
  failCount: exercises.filter((exercise) => !exercise.pass).length,
  outcomes: exercises.reduce((acc, exercise) => {
    acc[exercise.actual] = (acc[exercise.actual] ?? 0) + 1;
    return acc;
  }, {}),
  exercises,
};

writeFileSync(resolve(__dirname, 'fact-id-contract-harness-results.json'), `${JSON.stringify(summary, null, 2)}\n`);
writeFileSync(resolve(__dirname, 'harness-summary.json'), `${JSON.stringify({
  generatedAt: summary.generatedAt,
  modelRuntimeStarted: summary.modelRuntimeStarted,
  hostedProviderUsed: summary.hostedProviderUsed,
  factPacketVersion: summary.factPacketVersion,
  factCount: summary.factCount,
  totalExercises: summary.totalExercises,
  passCount: summary.passCount,
  failCount: summary.failCount,
  outcomes: summary.outcomes,
}, null, 2)}\n`);

console.log(JSON.stringify(summary, null, 2));
if (summary.failCount > 0) process.exitCode = 1;
