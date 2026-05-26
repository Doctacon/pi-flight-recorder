import { createFlightLearnDeltaInboxComponent } from '../../../../dist/flight-learn-inbox.js';

const now = '2026-05-25T12:00:00.000Z';
const delta = {
  id: 'delta_caa338683303e0cf',
  status: 'candidate',
  source: 'detector',
  summary: 'Repeated failure pattern: exact-text edit mismatches',
  expectation: null,
  reality: 'Observed 2 related failure occurrences in reflection cluster cluster_42b74f85f61a42a8.',
  impact: 'Repeated local friction across tools/cwds: edit.',
  severity: 'medium',
  cwd: '/repo',
  sourceSessionFile: null,
  sourceEntryId: null,
  evidenceRefs: [
    { sourceType: 'occurrence', sourceId: 'occ_afc4b65f47f76b78', sourceFile: null, sessionFile: null, cwd: '/Users/<user>/Code/personal/geo-trail-map', entryId: null, timestamp: now, snippet: null, note: null },
    { sourceType: 'occurrence', sourceId: 'occ_4bc412ca95e98183', sourceFile: null, sessionFile: null, cwd: '/Users/<user>/Code/personal/geo-trail-map', entryId: null, timestamp: now, snippet: null, note: null },
  ],
  activeArtifactCandidateId: null,
  statusReason: null,
  metadata: {},
  createdAt: now,
  updatedAt: now,
  acceptedAt: null,
  routedAt: null,
  dismissedAt: null,
  resolvedAt: null,
  recurringAt: null,
};
const input = {
  items: [
    { delta: { ...delta, id: 'delta_one', summary: 'Repeated failure pattern: stale edit block' }, signals: [] },
    { delta: { ...delta, id: 'delta_two', summary: 'Repeated failure pattern: validation retry loop' }, signals: [] },
    { delta, signals: [{ id: 'sig', deltaId: delta.id, type: 'reflection-cluster', explanation: 'Reflection cluster grouped exact-text edit mismatch failures.', confidence: 0.55, evidenceRefs: [], metadata: {}, createdAt: now }] },
  ],
  routeChoices: [
    { value: 'code-legibility', label: 'Code legibility', description: 'Create a refactor/readability route when code shape causes repeated confusion' },
    { value: 'test-check', label: 'Test/check', description: 'Route to a missing or weak validation check' },
    { value: 'loom-ticket', label: 'Loom ticket', description: 'Route to bounded implementation or cleanup work' },
    { value: 'flight-rule', label: 'Flight Rule', description: 'Route to reusable assistant guidance, still requiring approval later' },
    { value: 'observe', label: 'Observe/no artifact', description: 'Keep evidence and watch recurrence without creating an artifact' },
  ],
};
const component = createFlightLearnDeltaInboxComponent({ input, done: () => undefined });
component.handleInput('\x1b[B');
component.handleInput('\x1b[B');
component.handleInput('3');
console.log(component.render(104).join('\n'));
