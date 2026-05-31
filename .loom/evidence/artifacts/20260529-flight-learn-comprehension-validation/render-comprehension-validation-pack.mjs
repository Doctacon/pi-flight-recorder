import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync, mkdirSync } from 'node:fs';
import { createFlightLearnDeltaInboxComponent } from '../../../../src/flight-learn-inbox.ts';

const artifactDir = dirname(fileURLToPath(import.meta.url));
mkdirSync(artifactDir, { recursive: true });

function routeChoices() {
  return [
    { value: 'code-legibility', label: 'Code legibility', description: 'Use when confusing source shape caused repeated mistakes' },
    { value: 'test-check', label: 'Test/check', description: 'Use when a missing or weak validation check would have caught this' },
    { value: 'flight-rule', label: 'Flight Rule', description: 'Use when Pi needs reusable guidance, still requiring approval later' },
    { value: 'ticket', label: 'Ticket', description: 'Use when the issue needs a bounded follow-up work item' },
    { value: 'observe', label: 'Observe/no artifact', description: 'Keep evidence and watch recurrence without creating an artifact' },
    { value: 'dismiss', label: 'Dismiss', description: 'Close this delta without routing' },
    { value: 'cancel', label: 'Cancel', description: 'Leave unchanged' },
  ];
}

function evidence(id, snippet, note) {
  return {
    sourceType: 'manual',
    sourceId: `evidence-${id}`,
    sourceFile: null,
    sessionFile: null,
    cwd: null,
    entryId: `entry-${id}`,
    timestamp: '2026-05-29T00:00:00.000Z',
    snippet,
    note,
  };
}

function signal(id, deltaId, type, explanation, confidence = 0.72) {
  return {
    id: `sig-${id}`,
    deltaId,
    type,
    explanation,
    confidence,
    evidenceRefs: [],
    metadata: {},
    createdAt: '2026-05-29T00:00:00.000Z',
  };
}

function delta({ id, summary, expectation, reality, impact, severity = 'medium', evidenceRefs }) {
  return {
    id,
    status: 'candidate',
    source: 'detector',
    summary,
    expectation,
    reality,
    impact,
    severity,
    cwd: null,
    sourceSessionFile: null,
    sourceEntryId: `entry-${id}`,
    evidenceRefs,
    activeArtifactCandidateId: null,
    statusReason: null,
    metadata: { synthetic: true },
    createdAt: '2026-05-29T00:00:00.000Z',
    updatedAt: '2026-05-29T00:00:00.000Z',
    acceptedAt: null,
    routedAt: null,
    dismissedAt: null,
    resolvedAt: null,
    recurringAt: null,
  };
}

function localPolish({ state, deterministicView, draftView, fallbackReason = null, validationIssue = null }) {
  if (state === 'draft') {
    return {
      view: draftView,
      deterministicView,
      usedLocalModel: true,
      displayState: 'draft',
      narrativeStatus: 'draft',
      fallbackReason: null,
      validationIssue: validationIssue ?? 'local narrative judge did not promote this draft',
    };
  }
  return {
    view: {
      ...deterministicView,
      limits: [`Local model phrasing was requested but rejected (${fallbackReason ?? 'provider-unavailable'}); deterministic display text is shown.`],
    },
    deterministicView,
    usedLocalModel: false,
    displayState: 'deterministic',
    narrativeStatus: state === 'fallback' ? 'rejected' : 'none',
    fallbackReason: fallbackReason ?? 'provider-unavailable',
    validationIssue,
  };
}

function renderCase(card, width) {
  const component = createFlightLearnDeltaInboxComponent({
    input: {
      items: [{ delta: card.delta, signals: card.signals, localDiagnosisPolish: card.localDiagnosisPolish }],
      routeChoices: routeChoices(),
    },
    done: () => undefined,
    layout: 'focused-card',
  });
  return component.render(width).join('\n');
}

const cases = [
  {
    id: 'card-01-draft-repeated-workflow',
    title: 'Draft: repeated workflow recurrence',
    state: 'draft',
    coverage: ['draft', 'repeated-workflow'],
    suggestedReviewFocus: 'Can the draft explain the repeated workflow without becoming route advice?',
    deterministicView: {
      headline: 'The same review workflow repeated without a clear outcome.',
      whatHappened: 'Pi saw the same local review pattern twice in recent evidence.',
      whyItMatters: 'Repeated review churn can hide whether the underlying issue was resolved.',
      expectedBehavior: 'The workflow should leave an explicit review outcome in the local record.',
      rawClue: 'Redacted repeated review workflow clue',
      confidence: 'medium',
      limits: [],
    },
    draftView: {
      headline: 'A draft says the same review loop repeated without closure.',
      whatHappened: 'The draft ties two similar review passes together and explains that the card is about repeated workflow churn, not a separate implementation failure.',
      whyItMatters: 'This helps the reviewer understand why the repeated loop matters before rereading raw evidence first.',
      expectedBehavior: 'The workflow should leave an explicit review outcome in the local record.',
      rawClue: 'Redacted repeated review workflow clue',
      confidence: 'medium',
      limits: ['Local LLM draft was shown as non-authoritative reading help; deterministic facts remain the source of truth.'],
    },
    delta: null,
    signals: null,
  },
  {
    id: 'card-02-fallback-repeated-workflow',
    title: 'Fallback: repeated workflow recurrence',
    state: 'fallback',
    coverage: ['fallback', 'repeated-workflow'],
    fallbackReason: 'timeout',
    validationIssue: 'provider timed out before returning JSON',
    suggestedReviewFocus: 'Can fallback still support route/observe/dismiss/skip?',
    deterministicView: {
      headline: 'The same review workflow repeated without a clear outcome.',
      whatHappened: 'Pi saw the same local review pattern twice in recent evidence.',
      whyItMatters: 'Repeated review churn can hide whether the underlying issue was resolved.',
      expectedBehavior: 'The workflow should leave an explicit review outcome in the local record.',
      rawClue: 'Redacted repeated review workflow clue',
      confidence: 'medium',
      limits: [],
    },
    delta: null,
    signals: null,
  },
  {
    id: 'card-03-draft-validation-build',
    title: 'Draft: validation/build trust issue',
    state: 'draft',
    coverage: ['draft', 'validation-build'],
    suggestedReviewFocus: 'Can the card communicate validation trust clearly enough?',
    deterministicView: {
      headline: 'A local build check failed during validation.',
      whatHappened: 'A build check failed in a nearby validation loop.',
      whyItMatters: 'A release package is hard to trust without a clean build signal.',
      expectedBehavior: 'Build validation should pass before release packaging.',
      rawClue: 'Redacted build validation clue',
      confidence: 'medium',
      limits: [],
    },
    draftView: {
      headline: 'A draft says the build check made validation trust unclear.',
      whatHappened: 'The draft connects the failed build check to the surrounding validation loop, so the card reads as a build-trust problem rather than a claim about production behavior.',
      whyItMatters: 'That context helps the reviewer decide whether the evidence points to validation coverage or a broader follow-up.',
      expectedBehavior: 'Build validation should pass before release packaging.',
      rawClue: 'Redacted build validation clue',
      confidence: 'medium',
      limits: ['Local LLM draft was shown as non-authoritative reading help; deterministic facts remain the source of truth.'],
    },
    delta: null,
    signals: null,
  },
  {
    id: 'card-04-fallback-validation-build',
    title: 'Fallback: validation/build trust issue',
    state: 'fallback',
    coverage: ['fallback', 'validation-build'],
    fallbackReason: 'unsupported-facts',
    validationIssue: 'display field included unsupported facts',
    suggestedReviewFocus: 'Can deterministic fallback explain enough about the build check?',
    deterministicView: {
      headline: 'A local build check failed during validation.',
      whatHappened: 'A build check failed in a nearby validation loop.',
      whyItMatters: 'A release package is hard to trust without a clean build signal.',
      expectedBehavior: 'Build validation should pass before release packaging.',
      rawClue: 'Redacted build validation clue',
      confidence: 'medium',
      limits: [],
    },
    delta: null,
    signals: null,
  },
  {
    id: 'card-05-draft-stale-edit',
    title: 'Draft: stale exact-text edit',
    state: 'draft',
    coverage: ['draft', 'stale-edit'],
    suggestedReviewFocus: 'Can the draft explain stale edit sequence without raw path noise?',
    deterministicView: {
      headline: 'An exact-text edit failed because the target text changed.',
      whatHappened: 'The edit failed because the expected target text no longer matched current content.',
      whyItMatters: 'A stale edit can waste review time and obscure whether the intended change was applied.',
      expectedBehavior: 'Check current content before applying exact-text replacements.',
      rawClue: 'Redacted stale edit clue',
      confidence: 'high',
      limits: [],
    },
    draftView: {
      headline: 'A draft says the edit was based on stale text.',
      whatHappened: 'The draft explains that the requested replacement no longer matched the current content, so the card is about stale context rather than a missing tool.',
      whyItMatters: 'This gives the reviewer sequence context while keeping raw file details behind evidence.',
      expectedBehavior: 'Check current content before applying exact-text replacements.',
      rawClue: 'Redacted stale edit clue',
      confidence: 'high',
      limits: ['Local LLM draft was shown as non-authoritative reading help; deterministic facts remain the source of truth.'],
    },
    delta: null,
    signals: null,
  },
  {
    id: 'card-06-fallback-stale-edit',
    title: 'Fallback: stale exact-text edit',
    state: 'fallback',
    coverage: ['fallback', 'stale-edit'],
    fallbackReason: 'empty-output',
    validationIssue: 'local model returned no usable explanation',
    suggestedReviewFocus: 'Can fallback still expose the stale-edit diagnosis and actions?',
    deterministicView: {
      headline: 'An exact-text edit failed because the target text changed.',
      whatHappened: 'The edit failed because the expected target text no longer matched current content.',
      whyItMatters: 'A stale edit can waste review time and obscure whether the intended change was applied.',
      expectedBehavior: 'Check current content before applying exact-text replacements.',
      rawClue: 'Redacted stale edit clue',
      confidence: 'high',
      limits: [],
    },
    delta: null,
    signals: null,
  },
  {
    id: 'card-07-draft-low-information',
    title: 'Draft: low-information candidate',
    state: 'draft',
    coverage: ['draft', 'low-information'],
    suggestedReviewFocus: 'Does the draft make sparse evidence honest rather than overconfident?',
    deterministicView: {
      headline: 'A sparse local signal needs review before routing.',
      whatHappened: 'The stored evidence records a single unclear mismatch with limited context.',
      whyItMatters: 'Low-information cards can create noisy labels if they are routed too confidently.',
      expectedBehavior: 'The card should keep evidence inspectable and avoid implying more certainty than exists.',
      rawClue: 'Redacted sparse evidence clue',
      confidence: 'low',
      limits: ['Evidence is sparse; route only if the issue is clear after inspection.'],
    },
    draftView: {
      headline: 'A draft says this card is low-evidence and needs careful reading.',
      whatHappened: 'The draft summarizes that the stored facts show a sparse mismatch, so the card is flagging uncertainty rather than a specific implementation failure.',
      whyItMatters: 'That framing can prevent a confident label from being attached to weak evidence.',
      expectedBehavior: 'The card should keep evidence inspectable and avoid implying more certainty than exists.',
      rawClue: 'Redacted sparse evidence clue',
      confidence: 'low',
      limits: ['Local LLM draft was shown as non-authoritative reading help; deterministic facts remain the source of truth.'],
    },
    delta: null,
    signals: null,
  },
  {
    id: 'card-08-fallback-safety-adversarial',
    title: 'Fallback: safety/adversarial model output rejected',
    state: 'fallback',
    coverage: ['fallback', 'safety-adversarial'],
    fallbackReason: 'unsafe-output',
    validationIssue: 'local draft contained forbidden action advice',
    suggestedReviewFocus: 'Does fallback disclose rejection and remain usable without unsafe model text?',
    deterministicView: {
      headline: 'A local model draft was rejected for unsafe wording.',
      whatHappened: 'The deterministic card hides unsafe model wording and keeps only the safe stored facts visible.',
      whyItMatters: 'Unsafe or authority-confusing text must not steer routing or create source changes.',
      expectedBehavior: 'Rejected model text should fall back to safe deterministic wording.',
      rawClue: 'Redacted unsafe draft rejection clue',
      confidence: 'medium',
      limits: ['Unsafe model wording was rejected before display.'],
    },
    delta: null,
    signals: null,
  },
];

const snippets = {
  'card-01-draft-repeated-workflow': 'Redacted note: two similar review passes repeated without a clear route or outcome.',
  'card-02-fallback-repeated-workflow': 'Redacted note: two similar review passes repeated without a clear route or outcome.',
  'card-03-draft-validation-build': 'Redacted note: a local build check failed during release validation.',
  'card-04-fallback-validation-build': 'Redacted note: a local build check failed during release validation.',
  'card-05-draft-stale-edit': 'Redacted note: an exact-text replacement failed after nearby content changed.',
  'card-06-fallback-stale-edit': 'Redacted note: an exact-text replacement failed after nearby content changed.',
  'card-07-draft-low-information': 'Redacted note: sparse evidence recorded one unclear mismatch.',
  'card-08-fallback-safety-adversarial': 'Redacted note: unsafe model wording was rejected before display.',
};

for (const card of cases) {
  const deterministic = card.deterministicView;
  const id = card.id;
  card.delta = delta({
    id: `delta-${id}`,
    summary: deterministic.headline,
    expectation: deterministic.expectedBehavior,
    reality: deterministic.whatHappened,
    impact: deterministic.whyItMatters,
    severity: deterministic.confidence === 'low' ? 'low' : 'medium',
    evidenceRefs: [evidence(id, snippets[id], `Redacted ${card.title} evidence`)],
  });
  card.signals = [signal(id, `delta-${id}`, card.coverage.includes('validation-build') ? 'failed-validation' : 'reflection-cluster', snippets[id], deterministic.confidence === 'low' ? 0.41 : 0.74)];
  card.localDiagnosisPolish = localPolish({
    state: card.state,
    deterministicView: card.deterministicView,
    draftView: card.draftView,
    fallbackReason: card.fallbackReason,
    validationIssue: card.validationIssue,
  });
}

const renderIndex = {
  generatedAt: new Date().toISOString(),
  note: 'Synthetic/redacted render pack. No raw private sessions, prompts, paths, or transcripts were used.',
  acceptedNarrativeIncluded: false,
  acceptedNarrativeReason: 'No accepted real/runtime narrative evidence is available; accepted-narrative integration remains blocked.',
  widths: [92, 72],
  cases: [],
};
const lineWidths = [];

for (const card of cases) {
  const files = {};
  for (const width of renderIndex.widths) {
    const rendered = renderCase(card, width);
    const fileName = `${card.id}-${width}.txt`;
    writeFileSync(resolve(artifactDir, fileName), `${rendered}\n`);
    files[`width${width}`] = fileName;
    const lines = rendered.split('\n');
    lineWidths.push({ cardId: card.id, width, maxLineLength: Math.max(...lines.map((line) => line.length)), overLimit: lines.filter((line) => line.length > width).map((line) => ({ length: line.length, line })) });
  }
  renderIndex.cases.push({
    cardId: card.id,
    title: card.title,
    state: card.state,
    coverage: card.coverage,
    suggestedReviewFocus: card.suggestedReviewFocus,
    renderArtifacts: files,
  });
}

const operatorReviewPacket = {
  generatedAt: new Date().toISOString(),
  status: 'operator-review-pending',
  instructions: [
    'Have the operator review each render artifact without consulting raw private sessions first.',
    'For each card, fill the operatorNotes fields. Do not count worker-precheck notes as operator comprehension evidence.',
    'Proceed to corpus/outcome seed only if at least 80% of cards are clear or mostly clear and no safety/privacy blocker is recorded.',
  ],
  threshold: { minimumClearOrMostlyClearPercent: 80, safetyPrivacyBlockersAllowed: 0 },
  entries: renderIndex.cases.map((card) => ({
    cardId: card.cardId,
    title: card.title,
    state: card.state,
    coverage: card.coverage,
    renderArtifacts: card.renderArtifacts,
    operatorReviewStatus: 'pending',
    operatorPrompts: {
      whatHappened: 'What happened?',
      whyItMatters: 'Why does it matter?',
      routeDecision: 'Route or observe/no-artifact decision?',
      confidence: 'Confidence: clear / mostly clear / unclear',
      blockers: 'Any blocker, misleading wording, or missing evidence?',
    },
    operatorNotes: {
      whatHappened: null,
      whyItMatters: null,
      routeDecision: null,
      confidence: null,
      blockersMisleadingWordingMissingEvidence: null,
    },
  })),
};

const workerPrecheck = {
  generatedAt: new Date().toISOString(),
  notOperatorComprehensionEvidence: true,
  status: 'review-pack-ready-for-operator',
  observations: [
    'All rendered cards expose route/observe/dismiss/skip affordances and redacted evidence access.',
    'Draft cards are visibly labeled as non-authoritative local LLM drafts and include deterministic source facts.',
    'Fallback cards are less rich but disclose local model rejection/unavailability and remain non-dead-ending.',
    'The low-information case is intentionally sparse and should receive close operator scrutiny before any corpus collection decision.',
  ],
  perCard: renderIndex.cases.map((card) => ({
    cardId: card.cardId,
    state: card.state,
    workerPrecheck: card.coverage.includes('low-information') ? 'review-carefully-sparse-evidence' : 'ready-for-operator-review',
    notOperatorEvidence: true,
  })),
  gateRecommendation: 'operator-review-pending',
  canProceedToDogfoodCorpus: false,
};

writeFileSync(resolve(artifactDir, '00-render-index.json'), `${JSON.stringify(renderIndex, null, 2)}\n`);
writeFileSync(resolve(artifactDir, '17-operator-review-packet.json'), `${JSON.stringify(operatorReviewPacket, null, 2)}\n`);
writeFileSync(resolve(artifactDir, '18-worker-precheck.json'), `${JSON.stringify(workerPrecheck, null, 2)}\n`);
writeFileSync(resolve(artifactDir, '19-render-line-widths.json'), `${JSON.stringify({ generatedAt: new Date().toISOString(), pass: lineWidths.every((entry) => entry.overLimit.length === 0), widths: lineWidths }, null, 2)}\n`);
console.log(JSON.stringify({ renderedCards: cases.length, widths: renderIndex.widths, acceptedNarrativeIncluded: false, operatorReviewStatus: 'pending' }, null, 2));
