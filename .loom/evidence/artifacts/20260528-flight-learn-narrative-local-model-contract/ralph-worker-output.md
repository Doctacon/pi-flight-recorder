# Ralph Worker Output: Narrative Local Model Contract

## Outcome

Implemented the field-specific local-model narrative contract for `whatHappened` within the ticket scope.

Key behavior changes:

- Prompt now tells the local model that `headline` / `Problem` stays concise and conservative while `whatHappened` is the grounded narrative field.
- `whatHappened` limit is now 520 chars with a 4-sentence validator ceiling.
- Validator allows bounded narrative connective tissue only for `whatHappened` while keeping non-narrative fields on the stricter support checks.
- Unsafe raw paths, commands, secrets/redaction placeholders, route/action advice, mutation instructions, classifier/ranking claims, unsupported concrete facts, malformed JSON, timeouts, provider errors, overlong narrative, and duplicate/no-useful narrative output fall back to deterministic display text.
- Deterministic fallback and display-only semantics remain unchanged; no storage/routing/adapters/UI defaults were changed.

## Files Changed By This Run

- `src/flight-learn-local-diagnosis-model.ts`
- `src/flight-learn-local-diagnosis-model.test.ts`
- `.loom/evidence/20260528-flight-learn-narrative-local-model-contract.md`
- `.loom/evidence/artifacts/20260528-flight-learn-narrative-local-model-contract/run-narrative-local-model-contract-harness.mjs`
- `.loom/evidence/artifacts/20260528-flight-learn-narrative-local-model-contract/narrative-local-model-contract-harness-results.json`
- `.loom/evidence/artifacts/20260528-flight-learn-narrative-local-model-contract/harness-summary.json`
- `.loom/evidence/artifacts/20260528-flight-learn-narrative-local-model-contract/ralph-worker-output.md`
- `.loom/tickets/20260528-flight-learn-narrative-local-model-contract.md`

## Evidence / Artifacts

Evidence dossier:

- `.loom/evidence/20260528-flight-learn-narrative-local-model-contract.md`

Harness summary:

```json
{
  "totalCases": 15,
  "perCaseValidatorOutcomeCounts": {
    "accepted": 7,
    "fallback": 8
  },
  "perCaseFallbackReasonCounts": {
    "null": 7,
    "unsupported-facts": 2,
    "unsafe-output": 5,
    "schema-invalid": 1
  },
  "perCaseRubricOutcomeCounts": {
    "accepted-narrative-better": 5,
    "accepted-equivalent": 1,
    "fallback-expected": 8,
    "accepted-narrative-worse": 1
  },
  "exerciseFallbackReasonCounts": {
    "malformed-json": 1,
    "timeout": 1,
    "provider-error": 1,
    "empty-output": 1
  },
  "validatorMismatchCount": 0,
  "promptSafetyFailureCount": 0,
  "outputSafetyFailureCount": 0,
  "exerciseMismatchCount": 0
}
```

## Commands Run

```bash
npm test -- src/flight-learn-local-diagnosis-model.test.ts
node --import tsx .loom/evidence/artifacts/20260528-flight-learn-narrative-local-model-contract/run-narrative-local-model-contract-harness.mjs
npm run typecheck
git diff --check
```

Observed final results:

- Focused Vitest: passed, 18 tests.
- Fake-provider narrative corpus harness: passed, 15 corpus cases with zero mismatches.
- Typecheck: passed.
- `git diff --check`: passed with no output.

## Unverified Claims / Risks

- Real Bonsai 4B / `llama-server` behavior was not run or claimed.
- Focused-card UI integration was not changed or verified.
- Full repository test suite was not run; validation used the focused local-model tests plus typecheck and corpus harness because this ticket scope was limited to the local-model contract.
- The narrative validator still uses lexical support/allowlist heuristics; adversarial audit should challenge whether the new connective-tissue allowance over-admits unsupported facts.
- Overlong narrative uses existing `schema-invalid` fallback with a specific narrative limit issue rather than a new fallback enum, preserving existing UI fallback switch exhaustiveness outside this ticket scope.

## Ticket State

Updated `ticket:20260528-flight-learn-narrative-local-model-contract` to `review` because ACC-001 through ACC-005 appear evidence-supported and audit is next.

## Recommended Next Move

Run an adversarial Ralph audit for `ticket:20260528-flight-learn-narrative-local-model-contract` over the diff, tests, evidence dossier, and harness artifacts before closure.
