import { FlightRecorderStore, defaultDatabasePath } from '../../../../dist/storage.js';

const dataDir = process.argv[2];
if (!dataDir) throw new Error('usage: seed-focused-card-fixture.mjs <data-dir>');
const now = '2026-05-27T14:00:00.000Z';
const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
try {
  const delta = store.createExpectationDelta({
    id: 'delta_realpi_focus_card',
    source: 'detector',
    summary: 'Repeated failure pattern: bash cd /Users/<user>/Code/personal/pi-flight-recorder && npm run build from stale panes',
    expectation: null,
    reality: 'Observed 2 related failure occurrences where validation commands ran from a stale shell context after package reinstall.',
    impact: 'Repeated local friction across tools and cwd setup makes release validation slower and harder to trust.',
    severity: 'medium',
    cwd: '/Users/<user>/Code/personal/pi-flight-recorder',
    evidenceRefs: [
      { sourceType: 'occurrence', sourceId: 'occ_realpi_focus_1', sourceFile: null, sessionFile: null, cwd: '/Users/<user>/Code/personal/pi-flight-recorder', entryId: null, timestamp: now, snippet: 'bash cd /Users/<user>/Code/personal/pi-flight-recorder && npm run build failed from a stale pane', note: null },
      { sourceType: 'occurrence', sourceId: 'occ_realpi_focus_2', sourceFile: null, sessionFile: null, cwd: '/Users/<user>/Code/personal/pi-flight-recorder', entryId: null, timestamp: now, snippet: 'npm run build reran after reinstall from a stale terminal context', note: null },
      { sourceType: 'manual', sourceId: null, sourceFile: null, sessionFile: null, cwd: '/Users/<user>/Code/personal/pi-flight-recorder', entryId: null, timestamp: now, snippet: 'Operator wanted a focused-card UI proof instead of another split-pane tweak.', note: 'manual fixture' },
    ],
    metadata: { fixture: 'focused-card-real-pi-validation' },
    now,
  });
  store.recordDeltaDetectorSignal({
    id: 'sig_realpi_focus_card',
    deltaId: delta.id,
    type: 'reflection-cluster',
    explanation: 'Reflection cluster grouped cwd/setup validation failures from multiple sessions.',
    confidence: 0.55,
    evidenceRefs: delta.evidenceRefs,
    metadata: { fixture: 'focused-card-real-pi-validation' },
    now,
  });
  const other = store.createExpectationDelta({
    id: 'delta_realpi_secondary',
    source: 'detector',
    summary: 'Repeated failure pattern: exact-text edit mismatches',
    expectation: 'Use current file contents before exact replacement.',
    reality: 'Observed repeated stale oldText replacement attempts.',
    impact: 'Small edits required multiple retries.',
    severity: 'medium',
    cwd: '/Users/<user>/Code/personal/pi-flight-recorder',
    evidenceRefs: [
      { sourceType: 'manual', sourceId: null, sourceFile: null, sessionFile: null, cwd: '/Users/<user>/Code/personal/pi-flight-recorder', entryId: null, timestamp: now, snippet: 'stale oldText replacement mismatch', note: 'manual fixture' },
    ],
    metadata: { fixture: 'focused-card-real-pi-validation' },
    now: '2026-05-27T13:59:00.000Z',
  });
  store.recordDeltaDetectorSignal({
    id: 'sig_realpi_secondary',
    deltaId: other.id,
    type: 'user-correction',
    explanation: 'User corrected repeated exact-text edit mismatch handling.',
    confidence: 0.62,
    evidenceRefs: other.evidenceRefs,
    metadata: { fixture: 'focused-card-real-pi-validation' },
    now: '2026-05-27T13:59:00.000Z',
  });
  console.log(JSON.stringify({ dataDir, databasePath: defaultDatabasePath(dataDir), deltaIds: [delta.id, other.id], counts: { deltas: store.count('expectation_deltas'), signals: store.count('delta_detector_signals') } }, null, 2));
} finally {
  store.close();
}
