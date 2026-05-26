import { createFlightLearnDeltaInboxComponent } from '../../../../dist/flight-learn-inbox.js';

const now = '2026-05-25T01:00:00.000Z';
const delta = (id, summary) => ({
  id,
  status: 'candidate',
  source: 'detector',
  summary,
  expectation: 'The assistant should identify the storage/mapper seam before editing.',
  reality: 'The assistant edited repository storage and missed mapper sanitization twice.',
  impact: 'Repeated review churn before any useful implementation.',
  severity: 'medium',
  cwd: '/repo',
  sourceSessionFile: 'session.jsonl',
  sourceEntryId: 'entry-1',
  evidenceRefs: [
    { sourceType: 'session-entry', sourceId: 'entry-1', sourceFile: 'session.jsonl', sessionFile: 'session.jsonl', cwd: '/repo', entryId: 'entry-1', timestamp: now, snippet: 'No, actually the mapper owns this behavior and storage should not change.', note: 'User correction' },
    { sourceType: 'manual', sourceId: null, sourceFile: null, sessionFile: null, cwd: '/repo', entryId: null, timestamp: null, snippet: 'The same seam confusion happened again in a later edit.', note: 'Manual note' },
    { sourceType: 'session-entry', sourceId: 'entry-2', sourceFile: 'session.jsonl', sessionFile: 'session.jsonl', cwd: '/repo', entryId: 'entry-2', timestamp: now, snippet: 'The assistant retried the stale storage route.', note: 'Retry' },
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
});

const input = {
  items: [
    { delta: delta('delta-one', 'Assistant repeatedly treats storage as mapper owner with a very long summary that must be clipped safely'), signals: [{ id: 'sig-one', deltaId: 'delta-one', type: 'user-correction', explanation: 'User correction language matched a conservative expectation-delta phrase.', confidence: 0.68, evidenceRefs: [], metadata: {}, createdAt: now }] },
    { delta: delta('delta-two', 'Validation seam missed after edits'), signals: [{ id: 'sig-two', deltaId: 'delta-two', type: 'failed-validation', explanation: 'Validation failed again after assistant edits.', confidence: 0.72, evidenceRefs: [], metadata: {}, createdAt: now }] },
  ],
  routeChoices: [
    { value: 'code-legibility', label: 'Code legibility', description: 'Create a refactor/readability route when code shape causes repeated confusion' },
    { value: 'test-check', label: 'Test/check', description: 'Route to a missing or weak validation check' },
    { value: 'loom-ticket', label: 'Loom ticket', description: 'Route to bounded implementation or cleanup work' },
    { value: 'flight-rule', label: 'Flight Rule', description: 'Route to reusable assistant guidance, still requiring approval later' },
    { value: 'loom-spec', label: 'Loom spec', description: 'Route to intended-behavior clarification' },
    { value: 'loom-research', label: 'Loom research', description: 'Route to investigation before implementation' },
    { value: 'loom-knowledge', label: 'Loom knowledge', description: 'Route to reusable project understanding' },
    { value: 'prompt-context', label: 'Prompt/context', description: 'Route to project prompt or context documentation' },
    { value: 'skill-or-template', label: 'Skill/template', description: 'Route to a reusable workflow or prompt template' },
    { value: 'observe', label: 'Observe/no artifact', description: 'Keep evidence and watch recurrence without creating an artifact' },
    { value: 'dismiss', label: 'Dismiss', description: 'Close this delta without routing' },
    { value: 'cancel', label: 'Cancel', description: 'Leave unchanged' },
  ],
};

for (const width of [56, 104]) {
  const component = createFlightLearnDeltaInboxComponent({ input, done: () => undefined });
  console.log(`===== width ${width} =====`);
  console.log(component.render(width).join('\n'));
  console.log('');
}
