import { FlightRecorderStore, defaultDatabasePath } from '../../../../dist/storage.js';

const dataDir = process.argv[2];
const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
try {
  const secondaryEvidence = [
    { sourceType: 'manual', sourceId: null, sourceFile: null, sessionFile: null, cwd: '/repo', entryId: null, timestamp: '2026-05-27T18:50:00.000Z', snippet: 'Manual secondary item keeps queue navigation representative.', note: 'Secondary fixture' },
  ];
  const secondaryDelta = store.createExpectationDelta({
    id: 'delta_real_bonsai_secondary',
    source: 'manual',
    summary: 'Assistant repeatedly confused the storage mapper ownership boundary.',
    expectation: 'Check the mapper before editing storage.',
    reality: 'The assistant edited storage when mapper code owned the behavior.',
    impact: 'Review churn increased before implementation could continue.',
    severity: 'medium',
    cwd: '/repo',
    evidenceRefs: secondaryEvidence,
    now: '2026-05-27T18:50:00.000Z',
  });
  store.recordDeltaDetectorSignal({ id: 'sig_real_bonsai_secondary', deltaId: secondaryDelta.id, type: 'manual-capture', explanation: 'Manual fixture for secondary queue navigation.', confidence: null, evidenceRefs: secondaryEvidence, metadata: {}, now: '2026-05-27T18:50:00.000Z' });

  const evidenceRefs = [
    { sourceType: 'occurrence', sourceId: 'occ_real_bonsai_1', sourceFile: null, sessionFile: 'session.jsonl', cwd: '/Users/alice/Code/personal/pi-flight-recorder', entryId: 'entry-real-bonsai-1', timestamp: '2026-05-27T18:55:00.000Z', snippet: 'bash cd /Users/alice/Code/personal/pi-flight-recorder && npm test failed twice from a stale shell', note: 'Synthetic real Bonsai validation fixture' },
  ];
  const delta = store.createExpectationDelta({
    id: 'delta_real_bonsai_valid_model',
    source: 'detector',
    summary: 'Repeated failure pattern: bash cd /Users/alice/Code/personal/pi-flight-recorder && npm test',
    expectation: 'Validation should run from a fresh project shell after changes.',
    reality: 'Observed 2 related failure occurrences in reflection cluster cluster_real_bonsai_valid.',
    impact: 'Repeated validation friction makes the result hard to trust.',
    severity: 'medium',
    cwd: '/Users/alice/Code/personal/pi-flight-recorder',
    evidenceRefs,
    metadata: { count: 2, clusterId: 'cluster_real_bonsai_valid' },
    now: '2026-05-27T18:55:00.000Z',
  });
  store.recordDeltaDetectorSignal({ id: 'sig_real_bonsai_valid_model', deltaId: delta.id, type: 'failed-validation', explanation: 'Validation failed twice from the same stale shell pattern.', confidence: 0.74, evidenceRefs, metadata: {}, now: '2026-05-27T18:55:00.000Z' });

  const deltas = store.listExpectationDeltas({ limit: 10 }).map((item) => ({ id: item.id, status: item.status, summary: item.summary, expectation: item.expectation, evidenceRefs: item.evidenceRefs.length, updatedAt: item.updatedAt }));
  const signals = [delta.id, secondaryDelta.id].flatMap((id) => store.listDeltaDetectorSignals(id, 5).map((signal) => ({ id: signal.id, deltaId: signal.deltaId, type: signal.type, confidence: signal.confidence })));
  console.log(JSON.stringify({ dataDir, databasePath: defaultDatabasePath(dataDir), deltas, signals }, null, 2));
} finally {
  store.close();
}
