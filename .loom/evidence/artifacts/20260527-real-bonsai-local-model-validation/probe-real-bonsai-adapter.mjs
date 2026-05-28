import { buildFlightLearnDiagnosisViewWithLocalPolish } from '../../../../src/flight-learn-local-diagnosis-model.ts';
import { createLlamaCppLocalDiagnosisPolishOptions } from '../../../../src/flight-learn-llama-cpp-adapter.ts';

const baseUrl = process.argv[2];
const timeoutMs = Number(process.argv[3] ?? '5000');
if (!baseUrl) throw new Error('usage: node --import tsx probe-real-bonsai-adapter.mjs <baseUrl> [timeoutMs]');
const evidenceRefs = [
  {
    sourceType: 'occurrence',
    sourceId: 'occ-real-bonsai-1',
    sourceFile: null,
    sessionFile: 'session.jsonl',
    cwd: '/Users/alice/Code/personal/pi-flight-recorder',
    entryId: 'entry-real-bonsai-1',
    timestamp: '2026-05-27T18:30:00.000Z',
    snippet: 'bash cd /Users/alice/Code/personal/pi-flight-recorder && npm test failed twice from a stale shell',
    note: 'Synthetic real Bonsai validation fixture',
  },
];
const delta = {
  id: 'delta-real-bonsai-probe',
  status: 'candidate',
  source: 'detector',
  summary: 'Repeated failure pattern: bash cd /Users/alice/Code/personal/pi-flight-recorder && npm test',
  expectation: 'Validation should run from a fresh project shell after changes.',
  reality: 'Observed 2 related failure occurrences in reflection cluster cluster_real_bonsai_probe.',
  impact: 'Repeated validation friction makes the result hard to trust.',
  severity: 'medium',
  cwd: '/Users/alice/Code/personal/pi-flight-recorder',
  sourceSessionFile: 'session.jsonl',
  sourceEntryId: 'entry-real-bonsai-1',
  evidenceRefs,
  activeArtifactCandidateId: null,
  statusReason: null,
  metadata: { count: 2 },
  createdAt: '2026-05-27T18:30:00.000Z',
  updatedAt: '2026-05-27T18:30:00.000Z',
  acceptedAt: null,
  routedAt: null,
  dismissedAt: null,
  resolvedAt: null,
  recurringAt: null,
};
const signals = [
  {
    id: 'sig-real-bonsai-probe',
    deltaId: delta.id,
    type: 'failed-validation',
    explanation: 'Validation failed twice from the same stale shell pattern.',
    confidence: 0.74,
    evidenceRefs,
    metadata: {},
    createdAt: '2026-05-27T18:30:00.000Z',
  },
];

const started = Date.now();
const result = await buildFlightLearnDiagnosisViewWithLocalPolish(
  { delta, signals },
  createLlamaCppLocalDiagnosisPolishOptions({
    enabled: true,
    kind: 'llama-cpp-server',
    baseUrl,
    timeoutMs,
    maxOutputTokens: 192,
    model: 'Bonsai-1.7B-Q1_0',
  }),
);
console.log(JSON.stringify({ elapsedMs: Date.now() - started, result }, null, 2));
