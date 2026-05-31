# Local Narrative Judge Provider Contract Follow-up Review

ID: audit:20260528-local-narrative-judge-provider-contract-followup-review
Type: Audit
Status: recorded
Created: 2026-05-28
Updated: 2026-05-28
Audited: 2026-05-28
Target: ticket:20260528-local-narrative-judge-provider-contract

## Summary

Follow-up adversarial review of `audit:20260528-local-narrative-judge-provider-contract-review#FIND-001` found the response-schema gap fixed in source and exercised by tests/harness/probes. No material findings were identified within the fake-provider/provider-interface audit scope; the ticket is closure-ready for that bounded scope, not for any real judge/model/runtime/UI/release claim.

## Target

Reviewed the follow-up state of `ticket:20260528-local-narrative-judge-provider-contract`, specifically whether accepted local narrative judge sentence verdicts (`supported` and `supported-cautious-connection`) now fail closed when `supportedFactIds` is empty, and whether ACC-001 through ACC-005 remain honestly supportable after the fix.

Out of scope: implementing changes, running real judge models, validating Bonsai/Prometheus/NLI/llama.cpp judge quality, model downloads, UI integration, CLI judge configuration, storage/routing/classifier changes, or release readiness.

## Audit Scope And Lenses

Lenses used:

- FIND-001 closure: accepted sentence verdicts with empty `supportedFactIds` must fail closed.
- Acceptance: ACC-001 through ACC-005 closure posture.
- Privacy/local-first: bounded judge request, no raw sessions/paths/secrets/operator prompts/transcripts/provider keys, no hosted/non-loopback/download/default behavior.
- Schema strictness: no extra fields/rewrite/fact creation, exact sentence coverage, malformed response failure.
- Veto-only: judge cannot rewrite display text, add facts, route/classify/mutate, or persist output.
- Ordering and fail-closed behavior: judge only after deterministic verifier passes; deterministic failures skip judge; no judge/reject/uncertain/low confidence/empty supported IDs/unsafe/malformed/extra fields/missing coverage/provider error/timeout fall back.
- Evidence honesty: fake-provider/provider-interface scope only.

## Context And Evidence Reviewed

- Ralph review run: this bounded follow-up review subagent inspected the ticket, evidence, prior audit, source/tests, harness artifacts, and ran no-write validation commands/probes.
- `.loom/tickets/20260528-local-narrative-judge-provider-contract.md:53-77` - ACC-001 through ACC-005 and current follow-up closure claim.
- `.loom/evidence/20260528-local-narrative-judge-provider-contract.md:52-149` - recorded tests/harness/typecheck/diff-check, follow-up fix claim, and explicit non-claims.
- `.loom/audit/20260528-local-narrative-judge-provider-contract-review.md:75-94` - original FIND-001 and required follow-up.
- `.loom/evidence/artifacts/20260528-local-narrative-judge-provider-contract/run-local-narrative-judge-provider-contract-harness.mjs:138-150` and `:228-242` - empty-support harness case and full fail-closed exercise set.
- `.loom/evidence/artifacts/20260528-local-narrative-judge-provider-contract/harness-summary.json:1-36` - recorded `14/14` harness pass summary and judge call counts.
- `src/flight-learn-local-diagnosis-model.ts:24-199`, `:688-705`, `:822-860`, `:863-998`, `:1001-1136` - provider/request/response types, ordering, request construction, judge schema validation, and deterministic verifier path.
- `src/flight-learn-local-diagnosis-model.test.ts:141-198`, `:200-258`, `:260-420`, `:604-681` - request privacy, accept/no-judge behavior, fail-closed cases, ordering, and source redaction tests.
- `src/flight-learn-llama-cpp-adapter.ts:57-99`, `:122-135`, `:292-317` and `src/flight-learn-llama-cpp-adapter.test.ts:312-364`, `:443-510` - generator adapter local/loopback/no-key posture.
- `src/pi-extension.test.ts:653-730` - Pi integration test remains generator-only/non-narrative and does not prove narrative judge runtime behavior.

Commands/probes run from `/Users/crlough/Code/personal/pi-flight-recorder`:

```bash
npm test -- src/flight-learn-local-diagnosis-model.test.ts src/flight-learn-llama-cpp-adapter.test.ts src/pi-extension.test.ts
```

Result: passed, `3` files / `63` tests.

```bash
npm run typecheck
```

Result: passed, `tsc --noEmit`.

```bash
git diff --check
```

Result: passed with no output.

No-write fake-provider probe:

- `supported` with `supportedFactIds: []` returned `usedLocalModel: false`, `fallbackReason: "unsupported-facts"`, and deterministic `whatHappened` fallback.
- `supported-cautious-connection` with `supportedFactIds: []` returned `usedLocalModel: false`, `fallbackReason: "unsupported-facts"`, and deterministic `whatHappened` fallback.
- A positive-control accepted cautious verdict with cited fact IDs returned `usedLocalModel: true`.
- The captured judge request keys were `candidate`, `deterministic`, `facts`, `policy`, `prompt`, `schemaVersion`, and `signal`; the serialized request did not contain the raw fixture path/session filename/secret-like values/transcript lines/prompt-like text/stack-trace text used by the probe.

I did not run `npm run build` because the script cleans/writes `dist/`; this no-edit audit does not use build output as closure evidence.

## Findings

None - no material findings within audited scope.

## Correct Observations

- FIND-001 is fixed in source. `JUDGE_ACCEPTED_SENTENCE_VERDICTS` includes both `supported` and `supported-cautious-connection` (`src/flight-learn-local-diagnosis-model.ts:252`), and accepted verdicts now return `unsupported-facts` when `supportedFactIds.length === 0` (`src/flight-learn-local-diagnosis-model.ts:942-946`). The follow-up no-write probe confirmed both accepted verdict labels fail closed.
- ACC-001 is supportable. The provider interface and request/response types are explicit and bounded (`src/flight-learn-local-diagnosis-model.ts:24-199`), request construction is limited to policy, deterministic context, redacted facts, candidate sentences/fact IDs/cited facts, generated prompt, and abort signal (`src/flight-learn-local-diagnosis-model.ts:822-860`), and schema validation rejects unsupported top-level/sentence fields, bad versions/verdicts/confidence, missing coverage, bad supported IDs, and invalid reasons/claims (`src/flight-learn-local-diagnosis-model.ts:863-998`).
- ACC-002 is supportable. The judge is called only as a validation gate after the deterministic response validates (`src/flight-learn-local-diagnosis-model.ts:688-697`); accepted output uses the original generator display fields, not judge text (`src/flight-learn-local-diagnosis-model.ts:699-705`, `src/flight-learn-local-diagnosis-model.ts:801-813`). Tests/harness cover accept, reject, uncertainty, low confidence, empty supported IDs, unsafe/action advice, malformed JSON, extra rewrite field, missing coverage, provider error, and timeout fallback (`src/flight-learn-local-diagnosis-model.test.ts:260-405`; harness lines `228-242`).
- ACC-003 is supportable in fake-provider scope. The judge provider interface has no URL/API-key/header/provider-key shape (`src/flight-learn-local-diagnosis-model.ts:144-145`), request source data is redacted before facts are built, tests assert raw prompt/transcript/path/secret-like fragments are omitted (`src/flight-learn-local-diagnosis-model.test.ts:604-681`), and the generator loopback adapter remains explicit, local HTTP loopback only, with unsafe config shapes rejected before requests (`src/flight-learn-llama-cpp-adapter.ts:57-99`, `src/flight-learn-llama-cpp-adapter.ts:292-317`; `src/flight-learn-llama-cpp-adapter.test.ts:443-510`).
- ACC-004 is supportable. Deterministic response validation happens before the judge (`src/flight-learn-local-diagnosis-model.ts:688-697`), deterministic narrative fact-ID failures return before judge invocation (`src/flight-learn-local-diagnosis-model.ts:1001-1136`), and tests/harness show unknown fact IDs skip the judge (`src/flight-learn-local-diagnosis-model.test.ts:407-420`; `harness-summary.json:21-35`).
- ACC-005 is supportable for the bounded contract. Focused tests, typecheck, diff-check, recorded `14/14` harness summary, evidence dossier, and this follow-up audit exist. The evidence explicitly does not claim real judge/model quality, runtime, downloads, hosted calls, UI integration, storage/routing/classifier changes, or release readiness (`.loom/evidence/20260528-local-narrative-judge-provider-contract.md:139-145`).

## Verdict

`clear` within the audited fake-provider/provider-interface scope. FIND-001 is actually fixed, and ACC-001 through ACC-005 are close-ready for this ticket's bounded claim.

This verdict must not be read as acceptance of real local judge quality, real model JSON reliability, latency/hardware suitability, UI readiness, or production release safety.

## Required Follow-up

None required before closing this ticket for the fake-provider/provider-interface contract.

If closure prose wants to rely on `npm run build`, add a non-ambiguous build command result or remove the build claim; I did not rerun build in this no-edit audit.

## Residual Risk

- No real judge model/runtime/adapter was run; model quality, latency, malformed-output rates, hardware fit, and self-judge bias remain untested.
- No real judge CLI/UI configuration exists; current adapter/Pi tests cover generator-only non-narrative polish, not narrative judge runtime behavior.
- The committed unit/harness empty-support regression case uses `supported`; the shared source check and follow-up probe cover `supported-cautious-connection` as well.
- The judge receives generated candidate sentence text by design. Source redaction and deterministic guards prevent raw source leakage in the reviewed paths, but future real adapters should re-audit prompt/transcript/path leak behavior with representative local runtime outputs.

## Closure Recommendation

Close `ticket:20260528-local-narrative-judge-provider-contract` only for the fake-provider/provider-interface local narrative judge contract. Do not claim full hybrid narrative safety, real Bonsai/local judge quality, hosted-provider support, UI readiness, release readiness, or storage/routing/classifier behavior from this ticket.

## Related Records

- `ticket:20260528-local-narrative-judge-provider-contract`
- `evidence:20260528-local-narrative-judge-provider-contract`
- `audit:20260528-local-narrative-judge-provider-contract-review`
- `ticket:20260528-narrative-fact-id-contract-verifier`
- `audit:20260528-narrative-fact-id-contract-verifier-narrowed-scope-review`
