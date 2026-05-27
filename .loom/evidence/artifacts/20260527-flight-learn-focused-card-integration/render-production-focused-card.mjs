import { askFlightLearnDeltaInbox } from '../../../../dist/flight-learn-inbox.js';

const now = '2026-05-27T13:00:00.000Z';
const delta = {
  id: 'delta_prod_focus',
  status: 'candidate',
  source: 'detector',
  summary: 'Repeated failure pattern: bash cd /Users/<user>/Code/personal/pi-flight-recorder && npm run build from stale panes',
  expectation: null,
  reality: 'Observed 2 related failure occurrences where validation commands ran from a stale shell context after package reinstall.',
  impact: 'Repeated local friction across tools and cwd setup makes release validation slower and harder to trust.',
  severity: 'medium',
  cwd: '/Users/<user>/Code/personal/pi-flight-recorder',
  sourceSessionFile: null,
  sourceEntryId: null,
  evidenceRefs: [
    { sourceType: 'occurrence', sourceId: 'occ_prod_focus_1', sourceFile: null, sessionFile: null, cwd: '/Users/<user>/Code/personal/pi-flight-recorder', entryId: null, timestamp: now, snippet: 'bash cd /Users/<user>/Code/personal/pi-flight-recorder && npm run build failed from a stale pane', note: null },
    { sourceType: 'occurrence', sourceId: 'occ_prod_focus_2', sourceFile: null, sessionFile: null, cwd: '/Users/<user>/Code/personal/pi-flight-recorder', entryId: null, timestamp: now, snippet: null, note: null },
    { sourceType: 'occurrence', sourceId: 'occ_prod_focus_3', sourceFile: null, sessionFile: null, cwd: '/Users/<user>/Code/personal/pi-flight-recorder', entryId: null, timestamp: now, snippet: null, note: null },
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
    { delta: { ...delta, id: 'delta_prod_one', summary: 'Repeated failure pattern: edit Found 2 occurrences of old text' }, signals: [] },
    { delta, signals: [{ id: 'sig_prod_focus', deltaId: delta.id, type: 'reflection-cluster', explanation: 'Reflection cluster grouped cwd/setup validation failures from multiple sessions.', confidence: 0.55, evidenceRefs: [], metadata: {}, createdAt: now }] },
  ],
  routeChoices: [
    { value: 'code-legibility', label: 'Code legibility', description: 'Use when confusing source or project shape causes repeated mistakes.' },
    { value: 'test-check', label: 'Test/check', description: 'Use when a missing or weak validation check would have caught this.' },
    { value: 'loom-ticket', label: 'Loom ticket', description: 'Use when this needs bounded implementation or cleanup work.' },
    { value: 'flight-rule', label: 'Flight Rule', description: 'Use when Pi needs a reusable behavior reminder, still requiring approval later.' },
    { value: 'observe', label: 'Observe/no artifact', description: 'Keep evidence and watch recurrence without creating an artifact.' },
  ],
};

const renders = [];
const result = await askFlightLearnDeltaInbox({
  ui: {
    custom: async (factory) => {
      const component = factory({ requestRender: () => undefined }, {}, {}, (value) => value);
      component.handleInput?.('\x1b[B');
      renders.push(component.render(100).join('\n'));
      component.handleInput?.('v');
      renders.push(component.render(100).join('\n'));
      return { kind: 'cancelled' };
    },
  },
}, input);

console.log('# Production askFlightLearnDeltaInbox collapsed render');
console.log(renders[0]);
console.log('\n# Production askFlightLearnDeltaInbox expanded render');
console.log(renders[1]);
console.log('\n# Result');
console.log(JSON.stringify(result));
