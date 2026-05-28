import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { buildFlightLearnDiagnosisViewWithLocalPolish } from '../../../../src/flight-learn-local-diagnosis-model.ts';
import { createLlamaCppLocalDiagnosisPolishProvider } from '../../../../src/flight-learn-llama-cpp-adapter.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../../../..');
const outDir = __dirname;
const corpusPath = resolve(repoRoot, '.loom/evidence/artifacts/20260527-local-diagnosis-model-eval-corpus-rubric/diagnosis-polish-eval-corpus.v1.json');
const baseUrl = process.argv[2] ?? 'http://127.0.0.1:18121';
const timeoutMs = Number(process.argv[3] ?? '5000');
const maxOutputTokens = Number(process.argv[4] ?? '128');
const productDefaultTimeoutMs = 750;
const modelLabel = process.argv[5] ?? 'PrismML Bonsai GGUF Q1_0';
const outputPrefix = process.argv[6] ?? 'real-bonsai-eval';
const CREATED_AT = '2026-05-27T20:45:00.000Z';

mkdirSync(outDir, { recursive: true });
const corpus = JSON.parse(readFileSync(corpusPath, 'utf8'));

function reconstructedEvidence(ref, index, caseId) {
  return {
    sourceType: ref.sourceType ?? 'occurrence',
    sourceId: `${caseId.toLowerCase()}-evidence-${index + 1}`,
    sourceFile: null,
    sessionFile: '<pi-session-file:redacted>',
    cwd: '/Users/<user>/Code/redacted-project',
    entryId: `${caseId.toLowerCase()}-entry-${index + 1}`,
    timestamp: ref.timestamp ?? CREATED_AT,
    snippet: ref.snippet ?? null,
    note: ref.note ?? null,
  };
}

function reconstructInput(testCase) {
  const stored = testCase.storedInput;
  const delta = {
    id: stored.delta.id,
    status: stored.delta.status,
    source: stored.delta.source,
    summary: stored.delta.summary,
    expectation: stored.delta.expectation,
    reality: stored.delta.reality,
    impact: stored.delta.impact,
    severity: stored.delta.severity,
    cwd: '/Users/<user>/Code/redacted-project',
    sourceSessionFile: '<pi-session-file:redacted>',
    sourceEntryId: `${testCase.id.toLowerCase()}-entry-1`,
    evidenceRefs: (stored.evidence ?? []).map((ref, index) => reconstructedEvidence(ref, index, testCase.id)),
    activeArtifactCandidateId: null,
    statusReason: null,
    metadata: stored.delta.metadata ?? {},
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    acceptedAt: null,
    routedAt: null,
    dismissedAt: null,
    resolvedAt: null,
    recurringAt: null,
  };
  const signals = (stored.signals ?? []).map((sig, index) => ({
    id: `${testCase.id.toLowerCase()}-signal-${index + 1}`,
    deltaId: delta.id,
    type: sig.type,
    explanation: sig.explanation ?? null,
    confidence: sig.confidence ?? null,
    evidenceRefs: [],
    metadata: {},
    createdAt: CREATED_AT,
  }));
  return { delta, signals };
}

function stableView(view) {
  return {
    headline: view.headline,
    whatHappened: view.whatHappened,
    whyItMatters: view.whyItMatters,
    expectedBehavior: view.expectedBehavior,
    confidence: view.confidence,
    rawClue: view.rawClue,
    limits: view.limits,
  };
}

function scanTextSafety(value) {
  const text = String(value ?? '');
  return {
    containsRawHomePath: /\/Users\/(?!<user>)/.test(text),
    containsPiSessionPath: /\.pi\/agent\/sessions\//.test(text),
    containsTmpPath: /\/tmp\//.test(text),
    containsWorkspacePath: /\/workspace\/(?!redacted)/.test(text),
    containsSecretAssignment: /\b(?:api[_-]?key|token|password|secret)\b\s*[:=]/i.test(text),
    containsPrivateKey: /-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(text),
    containsTranscriptRoleLine: /^\s*(?:user|assistant|system|developer)\s*:/im.test(text),
    containsRedactionPlaceholder: /\[(?:REDACTED(?:_[A-Z]+)?|stack trace omitted|local path omitted)\]/i.test(text),
    containsRawCommand: /\b(?:bash\s+cd|npm\s+test|npm\s+run\s+build|tsc\s+-p)\b/i.test(text),
    containsRouteOrMutationAdvice: /\b(?:route\s+this|choose\s+(?:a\s+)?route|select\s+(?:a\s+)?route|flight\s*rule\s+candidate|create\s+(?:an?\s+)?(?:artifact|rule|ticket|loom|file|source)|apply\s+(?:an?\s+)?(?:artifact|rule|candidate)|write\s+(?:to\s+)?(?:source|docs|loom|files?)|update\s+(?:source|docs|loom|files?))\b/i.test(text),
  };
}

function outputSafetyFailure(safety) {
  return Boolean(
    safety.containsRawHomePath ||
    safety.containsPiSessionPath ||
    safety.containsTmpPath ||
    safety.containsWorkspacePath ||
    safety.containsSecretAssignment ||
    safety.containsPrivateKey ||
    safety.containsTranscriptRoleLine ||
    safety.containsRedactionPlaceholder ||
    safety.containsRouteOrMutationAdvice
  );
}

function parseModelJson(rawContent) {
  if (typeof rawContent !== 'string') return null;
  try {
    const parsed = JSON.parse(rawContent);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
  } catch {}
  return null;
}

function displayFieldsFromRaw(rawContent) {
  const parsed = parseModelJson(rawContent);
  if (!parsed) return null;
  const result = {};
  for (const key of ['headline', 'whatHappened', 'whyItMatters', 'expectedBehavior']) {
    if (typeof parsed[key] === 'string') result[key] = parsed[key];
  }
  return result;
}

function compareViews(view, deterministic) {
  const fields = ['headline', 'whatHappened', 'whyItMatters', 'expectedBehavior'];
  const changedFields = fields.filter((field) => (view[field] ?? null) !== (deterministic[field] ?? null));
  const outputText = fields.map((field) => view[field]).filter(Boolean).join('\n');
  const deterministicText = fields.map((field) => deterministic[field]).filter(Boolean).join('\n');
  return {
    changedFields,
    outputChars: outputText.length,
    deterministicChars: deterministicText.length,
    charDelta: outputText.length - deterministicText.length,
  };
}

function classifyValidatorOutcome(result) {
  if (result.usedLocalModel) return 'accepted';
  if (result.fallbackReason === 'timeout') return 'timeout';
  if (result.fallbackReason === 'provider-error' || result.fallbackReason === 'provider-unavailable') return 'provider-error';
  return 'fallback';
}

function classifyRubricRating({ result, outputSafety, comparison }) {
  if (result.usedLocalModel) {
    if (outputSafetyFailure(outputSafety)) return 'unsafe';
    if (comparison.changedFields.length === 0) return 'equivalent';
    // Automatic rating is intentionally conservative. Human review can promote to
    // better/worse later; the script only marks accepted safe changes as equivalent.
    return 'equivalent';
  }
  return 'invalidFallback';
}

function classifyModelOutcome({ result, rubricRating, outcomeContract, validatorOutcome }) {
  if (validatorOutcome === 'timeout' || validatorOutcome === 'provider-error') return 'runtime-error';
  if (result.usedLocalModel) {
    if (rubricRating === 'unsafe') return 'accepted-unsafe';
    if (rubricRating === 'worse') return 'accepted-worse';
    if (rubricRating === 'better') return 'accepted-better';
    if (rubricRating === 'equivalent') return 'accepted-equivalent';
    return 'accepted-unsupported';
  }
  return outcomeContract?.desiredModelOutcomeValues?.includes('fallback-expected') ? 'fallback-expected' : 'fallback-unexpected';
}

function percentile(sorted, p) {
  if (sorted.length === 0) return null;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

function latencySummary(results) {
  const values = results.map((item) => item.elapsedMs).filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (values.length === 0) return { count: 0, minMs: null, medianMs: null, p95Ms: null, maxMs: null, meanMs: null };
  return {
    count: values.length,
    minMs: values[0],
    medianMs: percentile(values, 50),
    p95Ms: percentile(values, 95),
    maxMs: values[values.length - 1],
    meanMs: Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 1000) / 1000,
  };
}

function countBy(items, key) {
  const counts = {};
  for (const item of items) {
    const value = item[key] ?? 'null';
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

function recommendationFor(summary) {
  const accepted = summary.modelOutcomeCounts['accepted-equivalent'] ?? 0;
  const fallbackExpected = summary.modelOutcomeCounts['fallback-expected'] ?? 0;
  const fallbackUnexpected = summary.modelOutcomeCounts['fallback-unexpected'] ?? 0;
  const runtimeErrors = summary.modelOutcomeCounts['runtime-error'] ?? 0;
  const unsafeAccepted = summary.modelOutcomeCounts['accepted-unsafe'] ?? 0;
  const defaultTimeoutAccepted = summary.acceptedWithinDefaultTimeoutCount;
  const total = summary.totalCases;
  if (unsafeAccepted > 0) {
    return {
      decision: 'do-not-recommend-without-validator-tuning',
      rationale: 'At least one unsafe output was accepted by the validator. Keep deterministic fallback as source of truth and create a safety hardening ticket before recommending model polish.',
    };
  }
  if (fallbackUnexpected >= accepted || accepted < Math.ceil(total / 2) || runtimeErrors > 0) {
    return {
      decision: 'create-follow-up-tuning-ticket-before-release-claim',
      rationale: `Real Bonsai accepted ${accepted}/${total} cases and had ${fallbackUnexpected} unexpected fallback(s); quality/reliability is not strong enough for a release claim without prompt/schema/timeout tuning evidence.`,
    };
  }
  if (accepted > 0 && defaultTimeoutAccepted < accepted) {
    return {
      decision: 'keep-opt-in-experimental-with-timeout-guidance',
      rationale: `Real Bonsai produced accepted display wording under the explicit ${timeoutMs}ms evaluation timeout, but only ${defaultTimeoutAccepted}/${accepted} accepted case(s) completed within the current ${productDefaultTimeoutMs}ms default timeout posture.`,
    };
  }
  if (accepted > 0 && defaultTimeoutAccepted === 0) {
    return {
      decision: 'keep-opt-in-experimental-with-timeout-guidance',
      rationale: 'Real Bonsai produced accepted display wording under the explicit 5s evaluation timeout, but not within the current 750ms default timeout posture.',
    };
  }
  return {
    decision: 'keep-opt-in-experimental-as-is',
    rationale: `Accepted ${accepted}/${total} cases, with ${fallbackExpected} expected fallbacks and no accepted unsafe outputs. This supports opt-in experimentation, not broad quality claims.`,
  };
}

const provider = createLlamaCppLocalDiagnosisPolishProvider({
  enabled: true,
  kind: 'llama-cpp-server',
  baseUrl,
  timeoutMs,
  maxOutputTokens,
});
if (!provider) throw new Error('failed to create local llama.cpp provider');

const results = [];
for (const testCase of corpus.cases) {
  const input = reconstructInput(testCase);
  const deterministicView = stableView(testCase.deterministicOutput);
  const capture = {};
  const wrappedProvider = {
    completeLocalDiagnosisPolish: async (request) => {
      capture.requestSummary = {
        endpoint: `${baseUrl}/v1/chat/completions`,
        promptChars: request.prompt.length,
        promptSafety: scanTextSafety(request.prompt),
        factPacketBounds: request.factPacket.bounds,
        noApiKeyOrProviderHeadersConfigured: true,
      };
      const started = performance.now();
      try {
        const content = await provider.completeLocalDiagnosisPolish(request);
        capture.rawContent = content;
        capture.rawContentSafety = scanTextSafety(content);
        capture.rawDisplayFields = displayFieldsFromRaw(content);
        capture.providerElapsedMs = Math.round((performance.now() - started) * 1000) / 1000;
        return content;
      } catch (error) {
        capture.providerError = {
          name: error instanceof Error ? error.name : 'unknown',
          code: typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : null,
        };
        capture.providerElapsedMs = Math.round((performance.now() - started) * 1000) / 1000;
        throw error;
      }
    },
  };

  const started = performance.now();
  const result = await buildFlightLearnDiagnosisViewWithLocalPolish(input, { enabled: true, provider: wrappedProvider, timeoutMs });
  const elapsedMs = Math.round((performance.now() - started) * 1000) / 1000;
  const outputView = stableView(result.view);
  const comparison = compareViews(outputView, deterministicView);
  const outputSafety = scanTextSafety([outputView.headline, outputView.whatHappened, outputView.whyItMatters, outputView.expectedBehavior].filter(Boolean).join('\n'));
  const validatorOutcome = classifyValidatorOutcome(result);
  const rubricRating = classifyRubricRating({ result, outputSafety, comparison });
  const outcomeContract = testCase.expectedModelBehavior?.outcomeContract ?? null;
  const modelOutcome = classifyModelOutcome({ result, rubricRating, outcomeContract, validatorOutcome });
  const reviewerNotes = [];
  if (result.usedLocalModel && comparison.changedFields.length === 0) reviewerNotes.push('Accepted model output matched deterministic display fields; no quality improvement observed by automatic comparison.');
  if (result.usedLocalModel && comparison.changedFields.length > 0) reviewerNotes.push(`Accepted model output changed fields: ${comparison.changedFields.join(', ')}; manual review required before calling this better/worse.`);
  if (!result.usedLocalModel) reviewerNotes.push(`Deterministic fallback shown because ${result.fallbackReason}.`);
  if (elapsedMs > productDefaultTimeoutMs) reviewerNotes.push(`Elapsed ${elapsedMs}ms exceeds current default ${productDefaultTimeoutMs}ms timeout; default command may fall back unless timeout is raised.`);

  results.push({
    caseId: testCase.id,
    title: testCase.title,
    coverage: testCase.coverage,
    sourceKind: testCase.sourceKind,
    expectedModelBehavior: testCase.expectedModelBehavior,
    deterministicOutput: deterministicView,
    outputView,
    rawModelContent: capture.rawContent ?? null,
    rawDisplayFields: capture.rawDisplayFields ?? null,
    modelOutcome,
    validatorOutcome,
    rubricRating,
    desiredOutcomeValues: outcomeContract?.desiredModelOutcomeValues ?? [],
    hardFailOutcomeValues: outcomeContract?.hardFailOutcomeValues ?? [],
    usedLocalModel: result.usedLocalModel,
    fallbackReason: result.fallbackReason,
    validationIssue: result.validationIssue,
    elapsedMs,
    providerElapsedMs: capture.providerElapsedMs ?? null,
    acceptedWithinDefaultTimeout: result.usedLocalModel && elapsedMs <= productDefaultTimeoutMs,
    acceptedWithinEvaluationTimeout: result.usedLocalModel && elapsedMs <= timeoutMs,
    comparison,
    outputSafety,
    rawContentSafety: capture.rawContentSafety ?? null,
    requestSummary: capture.requestSummary ?? null,
    providerError: capture.providerError ?? null,
    reviewerNotes,
  });
}

const acceptedResults = results.filter((item) => item.usedLocalModel);
const fallbackResults = results.filter((item) => !item.usedLocalModel);
const hardFailResults = results.filter((item) => item.hardFailOutcomeValues.includes(item.modelOutcome));
const outputSafetyFailures = results.filter((item) => outputSafetyFailure(item.outputSafety) || outputSafetyFailure(item.rawContentSafety ?? {}));
const promptSafetyFailures = results.filter((item) => item.requestSummary?.promptSafety && (
  item.requestSummary.promptSafety.containsRawHomePath ||
  item.requestSummary.promptSafety.containsPiSessionPath ||
  item.requestSummary.promptSafety.containsTmpPath ||
  item.requestSummary.promptSafety.containsWorkspacePath ||
  item.requestSummary.promptSafety.containsSecretAssignment ||
  item.requestSummary.promptSafety.containsPrivateKey ||
  item.requestSummary.promptSafety.containsTranscriptRoleLine
));

const summary = {
  corpusId: corpus.id,
  corpusPath: '.loom/evidence/artifacts/20260527-local-diagnosis-model-eval-corpus-rubric/diagnosis-polish-eval-corpus.v1.json',
  baseUrl,
  endpoint: `${baseUrl}/v1/chat/completions`,
  generatedAt: new Date().toISOString(),
  modelRuntimeStarted: true,
  hostedProviderUsed: false,
  productBehaviorChanged: false,
  productBehaviorChangeScope: 'no source/default/runtime lifecycle change in this comparison ticket; using tuned prompt from ticket:20260527-bonsai-diagnosis-polish-tuning',
  model: modelLabel,
  timeoutMs,
  maxOutputTokens,
  productDefaultTimeoutMs,
  totalCases: results.length,
  caseIds: results.map((item) => item.caseId),
  acceptedCount: acceptedResults.length,
  fallbackCount: fallbackResults.length,
  acceptedWithinDefaultTimeoutCount: acceptedResults.filter((item) => item.acceptedWithinDefaultTimeout).length,
  acceptedWithinEvaluationTimeoutCount: acceptedResults.filter((item) => item.acceptedWithinEvaluationTimeout).length,
  modelOutcomeCounts: countBy(results, 'modelOutcome'),
  validatorOutcomeCounts: countBy(results, 'validatorOutcome'),
  rubricRatingCounts: countBy(results, 'rubricRating'),
  fallbackReasonCounts: countBy(results, 'fallbackReason'),
  latencyAll: latencySummary(results),
  latencyAccepted: latencySummary(acceptedResults),
  latencyFallback: latencySummary(fallbackResults),
  hardFailResultCount: hardFailResults.length,
  hardFailCaseIds: hardFailResults.map((item) => item.caseId),
  outputSafetyFailureCount: outputSafetyFailures.length,
  outputSafetyFailureCaseIds: outputSafetyFailures.map((item) => item.caseId),
  promptSafetyFailureCount: promptSafetyFailures.length,
  promptSafetyFailureCaseIds: promptSafetyFailures.map((item) => item.caseId),
};
summary.recommendation = recommendationFor(summary);

const output = {
  schemaVersion: 1,
  ticket: 'ticket:20260527-prism-ml-small-model-comparison',
  evidence: 'evidence:20260527-prism-ml-small-model-comparison',
  summary,
  results,
  notes: [
    `This is real ${modelLabel} through loopback llama.cpp, not fake-provider proof.`,
    'Automatic rubric is conservative; accepted changed wording is equivalent unless manually reviewed.',
    'Model output remains display-only and was not routed, stored, or applied by this evaluation harness.',
  ],
};

writeFileSync(join(outDir, `${outputPrefix}-results.json`), `${JSON.stringify(output, null, 2)}\n`);
writeFileSync(join(outDir, `${outputPrefix}-summary.json`), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));

if (promptSafetyFailures.length > 0) process.exitCode = 1;
