import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFlightLearnDeltaInboxComponent } from '../../../../src/flight-learn-inbox.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const results = JSON.parse(readFileSync(resolve(__dirname, 'real-bonsai-4b-narrative-results.json'), 'utf8'));
const first = results.results[0];
const now = '2026-05-28T12:00:00.000Z';
const delta = {
  id: first.id,
  status: 'candidate',
  source: 'detector',
  summary: first.deterministic.headline,
  expectation: first.output.expectedBehavior,
  reality: first.deterministic.whatHappened,
  impact: first.output.whyItMatters,
  severity: 'medium',
  cwd: null,
  sourceSessionFile: null,
  sourceEntryId: null,
  evidenceRefs: [{ sourceType: 'manual', sourceId: 'synthetic-real-4b-validation', sourceFile: null, sessionFile: null, cwd: null, entryId: null, timestamp: now, snippet: 'Synthetic redacted validation case.', note: 'No raw private session content.' }],
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
const localDiagnosisPolish = {
  view: {
    headline: first.output.headline,
    whatHappened: first.output.whatHappened,
    whyItMatters: first.output.whyItMatters,
    expectedBehavior: first.output.expectedBehavior,
    rawClue: null,
    confidence: 'medium',
    limits: first.output.limits,
  },
  deterministicView: {
    headline: first.deterministic.headline,
    whatHappened: first.deterministic.whatHappened,
    whyItMatters: first.output.whyItMatters,
    expectedBehavior: first.output.expectedBehavior,
    rawClue: null,
    confidence: 'medium',
    limits: [],
  },
  usedLocalModel: first.usedLocalModel,
  fallbackReason: first.fallbackReason,
  validationIssue: first.validationIssue,
};
const input = { items: [{ delta, signals: [], localDiagnosisPolish }], routeChoices: [{ value: 'observe', label: 'Observe/no artifact', description: 'Keep evidence and watch recurrence without creating an artifact.' }] };
const component = createFlightLearnDeltaInboxComponent({ input, done: () => undefined, layout: 'focused-card' });
const lines = component.render(88).map((line) => line.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, ''));
const output = ['# Real Bonsai 4B validation focused-card fallback render', ...lines, '', '# Line length check', JSON.stringify({ maxLineLength: Math.max(...lines.map((line) => line.length)), lineCount: lines.length }, null, 2)].join('\n');
writeFileSync(resolve(__dirname, 'real-4b-fallback-render.txt'), `${output}\n`);
console.log(output);
