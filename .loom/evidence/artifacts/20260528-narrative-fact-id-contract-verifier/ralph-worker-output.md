# Worker Output: Narrative Fact-ID Contract Verifier

## Result

Implemented `ticket:20260528-narrative-fact-id-contract-verifier` and moved the ticket to `review`.

## Changed

Product/source and tests:

- `src/flight-learn-local-diagnosis-model.ts`
  - Upgraded local diagnosis fact packet to `version: 2`.
  - Added stable bounded redacted `facts[]` support facts with IDs such as `F1`, `F2`, `F9`, `F10`, `F20`, and `F21`.
  - Added fact/narrative bounds to the fact packet.
  - Updated prompt to require `schemaVersion: 2` and structured `whatHappened: { sentences: [{ text, factIds }] }`.
  - Rejects arbitrary string `whatHappened` output.
  - Verifies every sentence has non-empty known `factIds`.
  - Preserves hard privacy/safety/display-only rejection and deterministic fallback.
  - Removed the narrative token allow-list semantic grounding gate from `whatHappened`.
- `src/flight-learn-local-diagnosis-model.test.ts`
  - Updated fake-provider responses to schema version 2 and fact-cited `whatHappened` objects.
  - Added/updated coverage for accepted fact-ID narrative, string rejection, missing/unknown fact IDs, duplicate deterministic output, hard unsafe output, provider errors/timeouts, and no mutation.
- `src/flight-learn-llama-cpp-adapter.ts`
  - Updated local request assertion to require fact packet version `2`.
- `src/flight-learn-llama-cpp-adapter.test.ts`
  - Updated fake llama.cpp response and child-process request fixture for version `2`/fact IDs.
- `src/pi-extension.test.ts`
  - Updated local-model fake response fixtures to version `2`/fact IDs.

Loom records/artifacts:

- `.loom/evidence/20260528-narrative-fact-id-contract-verifier.md`
- `.loom/tickets/20260528-narrative-fact-id-contract-verifier.md`
- `.loom/evidence/artifacts/20260528-narrative-fact-id-contract-verifier/run-fact-id-contract-harness.mjs`
- `.loom/evidence/artifacts/20260528-narrative-fact-id-contract-verifier/fact-id-contract-harness-results.json`
- `.loom/evidence/artifacts/20260528-narrative-fact-id-contract-verifier/harness-summary.json`
- `.loom/evidence/artifacts/20260528-narrative-fact-id-contract-verifier/ralph-worker-output.md`

## Validation

Ran:

```bash
npm test -- src/flight-learn-local-diagnosis-model.test.ts
```

Result: passed, `1` file / `19` tests.

```bash
npm test -- src/flight-learn-llama-cpp-adapter.test.ts src/pi-extension.test.ts
```

Result after compatibility fixes: passed, `2` files / `40` tests.

```bash
node --import tsx .loom/evidence/artifacts/20260528-narrative-fact-id-contract-verifier/run-fact-id-contract-harness.mjs
```

Result: passed, `10` exercises / `10` matched expected outcomes.

```bash
npm test -- src/flight-learn-local-diagnosis-model.test.ts src/flight-learn-llama-cpp-adapter.test.ts src/pi-extension.test.ts
npm run typecheck
git diff --check
```

Result: focused tests passed, `3` files / `59` tests; `tsc --noEmit` passed; `git diff --check` passed with no output.

## Limits / Non-claims

- No local judge provider was implemented.
- No real Bonsai, Prometheus, NLI, llama.cpp runtime, model download, install, hosted call, or UI validation was run.
- This does not prove semantic entailment or narrative usefulness. A sentence can still cite a valid fact ID while adding unsupported meaning; the dependent judge-provider ticket must address that as a veto/uncertainty gate.
- Local-model wording remains display-only and does not route, classify, rank, persist stored delta fields, create artifacts, or mutate source/docs/Loom/rules/skills/prompts.

## Recommended Next Step

Run audit for `ticket:20260528-narrative-fact-id-contract-verifier`, focusing on schema loopholes, fact-ID stability/redaction, hard-safety boundaries, and whether any prose overclaims semantic grounding before the judge-provider ticket exists.
