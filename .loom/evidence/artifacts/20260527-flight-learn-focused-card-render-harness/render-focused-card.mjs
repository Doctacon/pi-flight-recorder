import { createFlightLearnDeltaInboxComponent } from '../../../../dist/flight-learn-inbox.js';

const now = '2026-05-27T12:00:00.000Z';

function delta(id, summary, reality, impact, evidenceCount = 2) {
  return {
    id,
    status: 'candidate',
    source: 'detector',
    summary,
    expectation: null,
    reality,
    impact,
    severity: 'medium',
    cwd: '/Users/<user>/Code/personal/pi-flight-recorder',
    sourceSessionFile: null,
    sourceEntryId: null,
    evidenceRefs: Array.from({ length: evidenceCount }, (_, index) => ({
      sourceType: 'occurrence',
      sourceId: `occ_${id}_${index + 1}`,
      sourceFile: null,
      sessionFile: null,
      cwd: '/Users/<user>/Code/personal/pi-flight-recorder',
      entryId: null,
      timestamp: now,
      snippet: index === 0 ? `${summary} happened while validating the focused-card review flow.` : null,
      note: null,
    })),
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
}

const selected = delta(
  'delta_bash_cwd_loop',
  'Repeated failure pattern: bash cd /Users/<user>/Code/personal/pi-flight-recorder && npm run build from stale panes',
  'Observed 2 related failure occurrences where validation commands ran from a stale shell context after package reinstall.',
  'Repeated local friction across tools and cwd setup makes release validation slower and harder to trust.',
  3,
);

const input = {
  items: [
    { delta: delta('delta_edit_found', 'Repeated failure pattern: edit Found 2 occurrences of old text', 'Observed edit mismatch retries.', 'Exact-text edits stayed brittle.', 2), signals: [] },
    { delta: delta('delta_bash_home', 'Repeated failure pattern: bash cd /Users/<user>/Code from the wrong repository', 'Observed commands launched from the parent directory.', 'Validation output became ambiguous.', 2), signals: [] },
    { delta: delta('delta_exact_text', 'Repeated failure pattern: exact-text edit mismatches', 'Observed repeated edit replacement misses.', 'Small source changes required multiple attempts.', 2), signals: [] },
    { delta: delta('delta_bash_personal', 'Repeated failure pattern: bash cd /Users/<user>/Code/personal without package context', 'Observed package commands run before entering the repo.', 'Build checks failed before exercising the intended code.', 2), signals: [] },
    { delta: selected, signals: [{ id: 'sig_selected', deltaId: selected.id, type: 'reflection-cluster', explanation: 'Reflection cluster grouped cwd/setup validation failures from multiple sessions.', confidence: 0.55, evidenceRefs: [], metadata: {}, createdAt: now }] },
    { delta: delta('delta_read_offset', 'Repeated failure pattern: read Offset 320 is beyond end of file', 'Observed file read offsets beyond the available content.', 'Agents waste time paging through absent lines.', 3), signals: [] },
  ],
  routeChoices: [
    { value: 'code-legibility', label: 'Code legibility', description: 'Use when confusing source or project shape causes repeated mistakes.' },
    { value: 'test-check', label: 'Test/check', description: 'Use when a missing or weak validation check would have caught this.' },
    { value: 'loom-ticket', label: 'Loom ticket', description: 'Use when this needs bounded implementation or cleanup work.' },
    { value: 'flight-rule', label: 'Flight Rule', description: 'Use when Pi needs a reusable behavior reminder, still requiring approval later.' },
    { value: 'loom-spec', label: 'Loom spec', description: 'Use when intended behavior needs clarification before implementation.' },
    { value: 'loom-research', label: 'Loom research', description: 'Use when investigation should happen before execution.' },
    { value: 'loom-knowledge', label: 'Loom knowledge', description: 'Use when reusable project understanding should be remembered.' },
    { value: 'prompt-context', label: 'Prompt/context', description: 'Use when prompt or project context should be clarified.' },
    { value: 'skill-or-template', label: 'Skill/template', description: 'Use when a reusable workflow/template would prevent recurrence.' },
    { value: 'observe', label: 'Observe/no artifact', description: 'Keep evidence and watch recurrence without creating an artifact.' },
  ],
};

const component = createFlightLearnDeltaInboxComponent({ input, done: () => undefined, layout: 'focused-card' });
for (let i = 0; i < 4; i += 1) component.handleInput('\x1b[B');
console.log('# Collapsed evidence');
console.log(component.render(100).join('\n'));
console.log('\n# Expanded evidence');
component.handleInput('v');
console.log(component.render(100).join('\n'));
