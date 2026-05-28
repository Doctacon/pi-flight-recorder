import { FlightRecorderStore, defaultDatabasePath } from '../../../../dist/storage.js';

const dataDir = process.argv[2];
const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
try {
  const secondaryEvidence = [
    { sourceType: 'manual', sourceId: null, sourceFile: null, sessionFile: null, cwd: '/repo', entryId: null, timestamp: '2026-05-27T01:00:00.000Z', snippet: 'Manual secondary item keeps queue navigation representative.', note: 'Secondary fixture' },
  ];
  const secondaryDelta = store.createExpectationDelta({
    id: 'delta_realpi_plain_english_secondary',
    source: 'manual',
    summary: 'Assistant repeatedly confused the storage mapper ownership boundary.',
    expectation: 'Check the mapper before editing storage.',
    reality: 'The assistant edited storage when mapper code owned the behavior.',
    impact: 'Review churn increased before implementation could continue.',
    severity: 'medium',
    cwd: '/repo',
    evidenceRefs: secondaryEvidence,
    now: '2026-05-27T01:00:00.000Z',
  });
  store.recordDeltaDetectorSignal({ id: 'sig_realpi_plain_english_secondary', deltaId: secondaryDelta.id, type: 'manual-capture', explanation: 'Manual fixture for secondary queue navigation.', confidence: null, evidenceRefs: secondaryEvidence, metadata: {}, now: '2026-05-27T01:00:00.000Z' });

  const rawEvidence = [
    { sourceType: 'occurrence', sourceId: 'occ_diagnosis_realpi_1', sourceFile: null, sessionFile: 'session.jsonl', cwd: '/Users/alice/Code/personal/pi-flight-recorder', entryId: 'entry-diagnosis-1', timestamp: '2026-05-27T01:10:00.000Z', snippet: 'bash cd /Users/alice/Code/personal/pi-flight-recorder && npm test > pi-flight-recorder.log failed from a stale pane', note: 'Reflection cluster cluster_73111b7e16551a58' },
    { sourceType: 'manual', sourceId: null, sourceFile: null, sessionFile: null, cwd: '/Users/alice/Code/personal/pi-flight-recorder', entryId: null, timestamp: '2026-05-27T01:12:00.000Z', snippet: 'Operator wanted the primary card to explain this in plain English rather than showing the command as the issue.', note: 'Plain-English diagnosis validation fixture' },
  ];
  const rawDelta = store.createExpectationDelta({
    id: 'delta_realpi_plain_english_raw',
    source: 'detector',
    summary: 'Repeated failure pattern: bash cd /Users/alice/Code/personal/pi-flight-recorder && npm test > pi-flight-recorder.log',
    expectation: null,
    reality: 'Observed 2 related failure occurrences in reflection cluster cluster_73111b7e16551a58.',
    impact: 'Repeated local friction across tools/cwds: bash.',
    severity: 'medium',
    cwd: '/Users/alice/Code/personal/pi-flight-recorder',
    evidenceRefs: rawEvidence,
    metadata: { count: 2, clusterId: 'cluster_73111b7e16551a58' },
    now: '2026-05-27T01:15:00.000Z',
  });
  store.recordDeltaDetectorSignal({ id: 'sig_realpi_plain_english_raw', deltaId: rawDelta.id, type: 'reflection-cluster', explanation: 'Reflection cluster cluster_73111b7e16551a58 has 2 related occurrence(s), meeting the conservative threshold 2.', confidence: 0.55, evidenceRefs: rawEvidence, metadata: { clusterId: 'cluster_73111b7e16551a58', threshold: 2 }, now: '2026-05-27T01:15:00.000Z' });

  const deltas = store.listExpectationDeltas({ limit: 10 }).map((delta) => ({ id: delta.id, status: delta.status, summary: delta.summary, evidenceRefs: delta.evidenceRefs.length, updatedAt: delta.updatedAt }));
  const signals = [rawDelta.id, secondaryDelta.id].flatMap((id) => store.listDeltaDetectorSignals(id, 5).map((signal) => ({ id: signal.id, deltaId: signal.deltaId, type: signal.type, confidence: signal.confidence })));
  console.log(JSON.stringify({ dataDir, databasePath: defaultDatabasePath(dataDir), deltas, signals }, null, 2));
} finally {
  store.close();
}
