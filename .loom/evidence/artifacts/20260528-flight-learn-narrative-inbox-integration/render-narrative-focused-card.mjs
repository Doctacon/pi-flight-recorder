import { createFlightLearnDeltaInboxComponent } from '../../../../src/flight-learn-inbox.ts';

const now = '2026-05-28T12:00:00.000Z';
const delta = {
  id: 'delta-narrative-render',
  status: 'candidate',
  source: 'detector',
  summary: 'Repeated validation failure pattern from a stale shell.',
  expectation: 'Validation should run from a fresh project shell after package changes.',
  reality: 'The validation check was repeated from an old shell after the package changed.',
  impact: 'That makes the validation result hard to trust.',
  severity: 'medium',
  cwd: null,
  sourceSessionFile: null,
  sourceEntryId: 'entry-narrative-render',
  evidenceRefs: [
    {
      sourceType: 'manual',
      sourceId: 'evidence-narrative-render',
      sourceFile: null,
      sessionFile: null,
      cwd: null,
      entryId: 'entry-narrative-render-evidence',
      timestamp: now,
      snippet: 'Validation failed twice from the same stale shell pattern.',
      note: 'Synthetic redacted validation evidence.',
    },
  ],
  activeArtifactCandidateId: null,
  statusReason: null,
  metadata: { count: 2 },
  createdAt: now,
  updatedAt: now,
  acceptedAt: null,
  routedAt: null,
  dismissedAt: null,
  resolvedAt: null,
  recurringAt: null,
};

const localDiagnosisPolish = {
  view: {
    headline: 'Validation kept running from a stale shell.',
    whatHappened: 'The accepted local narrative ties together repeated validation failures from redacted facts. It explains that the same check was rerun after the package changed, so the card is about validation trust rather than a separate code failure.',
    whyItMatters: 'A fuller narrative helps the reviewer understand why this deserves attention without changing the review choices.',
    expectedBehavior: 'Validation should run from a fresh project shell after package changes.',
    rawClue: 'Repeated validation failure pattern from a stale shell.',
    confidence: 'medium',
    limits: ['Optional local model phrasing was used for display-only wording; stored delta fields, routing, and artifacts were not changed.'],
  },
  deterministicView: {
    headline: 'Deterministic problem.',
    whatHappened: 'Deterministic what happened.',
    whyItMatters: 'Deterministic why it matters.',
    expectedBehavior: null,
    rawClue: 'Repeated validation failure pattern from a stale shell.',
    confidence: 'medium',
    limits: [],
  },
  usedLocalModel: true,
  fallbackReason: null,
  validationIssue: null,
};

const input = {
  items: [
    {
      delta,
      signals: [
        {
          id: 'signal-narrative-render',
          deltaId: delta.id,
          type: 'failed-validation',
          explanation: 'Validation failed twice from the same stale shell pattern.',
          confidence: 0.74,
          evidenceRefs: [],
          metadata: {},
          createdAt: now,
        },
      ],
      localDiagnosisPolish,
    },
  ],
  routeChoices: [
    { value: 'test-check', label: 'Test/check', description: 'Route to a missing or weak validation check.' },
    { value: 'loom-ticket', label: 'Loom ticket', description: 'Route to bounded implementation or cleanup work.' },
    { value: 'observe', label: 'Observe/no artifact', description: 'Keep evidence and watch recurrence without creating an artifact.' },
  ],
};

const component = createFlightLearnDeltaInboxComponent({ input, done: () => undefined, layout: 'focused-card' });
const lines = component.render(88);
console.log('# Focused-card accepted narrative render (width 88)');
console.log(lines.join('\n'));
console.log('\n# Line length check');
console.log(JSON.stringify({ maxLineLength: Math.max(...lines.map((line) => line.length)), lineCount: lines.length }, null, 2));
