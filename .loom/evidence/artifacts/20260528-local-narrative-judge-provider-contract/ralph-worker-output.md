# Ralph Worker Output — Local Narrative Judge Provider Contract

Task: `ticket:20260528-local-narrative-judge-provider-contract`
Date: 2026-05-28

## Result

Implemented the local narrative judge provider contract in fake-provider scope and moved the ticket to review.

## Changed Files

Source/tests:

- `src/flight-learn-local-diagnosis-model.ts`
- `src/flight-learn-local-diagnosis-model.test.ts`
- `src/flight-learn-llama-cpp-adapter.test.ts`
- `src/pi-extension.test.ts`

Loom/evidence:

- `.loom/tickets/20260528-local-narrative-judge-provider-contract.md`
- `.loom/evidence/20260528-local-narrative-judge-provider-contract.md`
- `.loom/evidence/artifacts/20260528-local-narrative-judge-provider-contract/run-local-narrative-judge-provider-contract-harness.mjs`
- `.loom/evidence/artifacts/20260528-local-narrative-judge-provider-contract/local-narrative-judge-provider-contract-results.json`
- `.loom/evidence/artifacts/20260528-local-narrative-judge-provider-contract/harness-summary.json`
- `.loom/evidence/artifacts/20260528-local-narrative-judge-provider-contract/ralph-worker-output.md`

## Implementation Notes

- Added `LocalNarrativeJudgeProvider`, request, candidate, cited-fact, verdict, confidence, and structured response types.
- Added `judgeProvider` and `judgeTimeoutMs` options to the local polish path.
- Built judge requests only after deterministic fact-ID verification succeeds.
- Judge request contains bounded redacted facts, deterministic display context, candidate sentence text, candidate fact IDs, cited fact texts, policy metadata, prompt, and abort signal.
- Added strict judge response validation:
  - `schemaVersion: 1` required;
  - no extra top-level or sentence fields;
  - valid `overallVerdict` and optional `failClosedReason` only;
  - exact sentence coverage by index;
  - every accepted sentence must be `supported` or `supported-cautious-connection`;
  - no low confidence;
  - no unsupported claims;
  - supported fact IDs must be among the candidate sentence's cited fact IDs.
- Judge is veto-only: it cannot rewrite display text, add facts, choose routes, classify, store, or mutate anything.
- Narrative candidates now fail closed with existing `provider-unavailable` fallback when no judge provider is configured.
- Non-narrative polish still works without a judge provider.
- Deterministic verifier failures skip the judge provider entirely.
- Adapter/Pi fake fixtures were adjusted so generator-only tests continue to cover non-narrative polish without requiring a judge.

## Validation

Commands run:

```bash
npm test -- src/flight-learn-local-diagnosis-model.test.ts src/flight-learn-llama-cpp-adapter.test.ts src/pi-extension.test.ts
node --import tsx .loom/evidence/artifacts/20260528-local-narrative-judge-provider-contract/run-local-narrative-judge-provider-contract-harness.mjs
npm run typecheck
git diff --check
```

Results:

- Focused tests passed: `3` test files / `63` tests.
- Sanitized judge harness passed: `13` exercises / `13` matched expected outcomes.
- `npm run typecheck` passed.
- `git diff --check` passed with no output.

## Evidence

Evidence dossier recorded at:

```text
.loom/evidence/20260528-local-narrative-judge-provider-contract.md
```

Harness artifacts recorded under:

```text
.loom/evidence/artifacts/20260528-local-narrative-judge-provider-contract/
```

Key harness outcomes:

- accepted after judge accept;
- no judge provider fails closed for narrative;
- no narrative does not require judge;
- deterministic verifier failure skips judge;
- judge reject/uncertain/low-confidence/action-advice/malformed/extra-field/missing-coverage/provider-error/timeout all fail closed.

## Limits / Non-Claims

- No real judge model was run.
- No real local model/runtime was run.
- No model downloads, installs, hosted calls, telemetry, or non-loopback provider calls occurred.
- No UI integration, storage/routing/classifier behavior, artifact mutation, or release-readiness claim was added.
- This proves the provider contract and fake-provider fail-closed paths only; real judge quality remains future validation work.

## Next Step

Run an adversarial audit for `ticket:20260528-local-narrative-judge-provider-contract` before closure.
