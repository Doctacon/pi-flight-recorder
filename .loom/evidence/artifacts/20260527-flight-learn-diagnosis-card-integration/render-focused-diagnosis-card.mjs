import { createFlightLearnDeltaInboxComponent } from '../../../../dist/flight-learn-inbox.js';

const delta = {
  id: 'delta-render-raw',
  status: 'candidate',
  source: 'detector',
  summary: 'Repeated failure pattern: bash cd /Users/alice/Code/personal/pi-flight-recorder && npm test > pi-flight-recorder.log',
  expectation: null,
  reality: 'Observed 2 related failure occurrences in reflection cluster cluster_73111b7e16551a58.',
  impact: 'Repeated local friction across tools/cwds: bash.',
  severity: 'medium',
  cwd: '/Users/alice/Code/personal/pi-flight-recorder',
  sourceSessionFile: 'session.jsonl',
  sourceEntryId: 'entry-1',
  evidenceRefs: [
    {
      sourceType: 'occurrence',
      sourceId: 'occ-1',
      sourceFile: null,
      sessionFile: 'session.jsonl',
      cwd: '/Users/alice/Code/personal/pi-flight-recorder',
      entryId: 'entry-1',
      timestamp: '2026-05-27T01:00:00.000Z',
      snippet: 'bash cd /Users/alice/Code/personal/pi-flight-recorder && npm test > pi-flight-recorder.log failed from a stale pane',
      note: 'Reflection cluster cluster_73111b7e16551a58',
    },
  ],
  activeArtifactCandidateId: null,
  statusReason: null,
  metadata: { count: 2, clusterId: 'cluster_73111b7e16551a58' },
  createdAt: '2026-05-27T01:00:00.000Z',
  updatedAt: '2026-05-27T01:00:00.000Z',
  acceptedAt: null,
  routedAt: null,
  dismissedAt: null,
  resolvedAt: null,
  recurringAt: null,
};

const input = {
  items: [
    {
      delta,
      signals: [
        {
          id: 'sig-delta-render-raw',
          deltaId: delta.id,
          type: 'reflection-cluster',
          explanation: 'Reflection cluster cluster_73111b7e16551a58 has 2 related occurrence(s), meeting the conservative threshold 2.',
          confidence: 0.55,
          evidenceRefs: delta.evidenceRefs,
          metadata: {},
          createdAt: '2026-05-27T01:00:00.000Z',
        },
      ],
    },
  ],
  routeChoices: [
    { value: 'code-legibility', label: 'Code legibility', description: 'Create a refactor/readability route when code shape causes repeated confusion' },
    { value: 'test-check', label: 'Test/check', description: 'Route to a missing or weak validation check' },
    { value: 'loom-ticket', label: 'Loom ticket', description: 'Route to bounded implementation or cleanup work' },
    { value: 'flight-rule', label: 'Flight Rule', description: 'Route to reusable assistant guidance, still requiring approval later' },
    { value: 'loom-spec', label: 'Loom spec', description: 'Route to intended-behavior clarification' },
    { value: 'observe', label: 'Observe/no artifact', description: 'Keep evidence and watch recurrence without creating an artifact' },
  ],
};

const component = createFlightLearnDeltaInboxComponent({ input, layout: 'focused-card', done: () => undefined });
console.log(component.render(132).join('\n'));
console.log('\n--- expanded evidence ---\n');
component.handleInput('v');
console.log(component.render(132).join('\n'));
