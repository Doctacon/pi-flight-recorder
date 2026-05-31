# Local Narrative Judge Provider Contract Review

ID: audit:20260528-local-narrative-judge-provider-contract-review
Type: Audit
Status: recorded
Created: 2026-05-28
Updated: 2026-05-28
Audited: 2026-05-28
Target: ticket:20260528-local-narrative-judge-provider-contract

## Summary

Adversarial review found the fake-provider local judge contract mostly matches the ticket posture: requests are built from bounded redacted facts and fact-ID-verified candidate sentences; the judge is invoked only after deterministic verification; reject, uncertainty, low confidence, unsafe/action-advice verdicts, malformed JSON, extra fields, provider errors, and timeouts fail closed; no real model, hosted, download, storage, routing, classifier, or release-readiness claim is made.

One response-schema gap blocks clean closure: an accepted judge sentence can return `verdict: "supported"` with an empty `supportedFactIds` array and still accept the narrative. That weakens ACC-001/ACC-002 strictness and the requested coverage-mismatch fail-closed posture because the judge can approve support without tying the approval to any cited fact.

## Target

Reviewed `ticket:20260528-local-narrative-judge-provider-contract` and its implementation/evidence for ACC-001 through ACC-005. The target is the fake-provider/provider-interface contract for local narrative judge validation after `ticket:20260528-narrative-fact-id-contract-verifier`.

Out of scope for this audit: real Bonsai/Prometheus/NLI/llama.cpp judge behavior, model quality, latency, model downloads, UI release readiness, or implementing fixes.

## Audit Scope And Lenses

Lenses used:

- acceptance: ACC-001 through ACC-005 closure posture;
- privacy and local-first: bounded judge request, no raw sessions/paths/secrets/raw prompts/transcripts/provider keys, no hosted/non-loopback/download/default behavior;
- schema strictness: no extra keys, no rewrite fields, no fact creation, exact coverage, malformed response failure;
- veto-only behavior: judge cannot rewrite display text, add facts, route/classify/mutate, or persist output;
- ordering and fail-closed behavior: judge only after deterministic verifier passes; deterministic failures skip judge; no judge/reject/uncertain/low confidence/unsafe/unsupported/malformed/provider-error/timeout fall back;
- evidence honesty: fake-provider scope only, adapter/CLI tests cover non-narrative generator-only behavior rather than narrative judge behavior.

## Context And Evidence Reviewed

Records and artifacts:

- `.loom/tickets/20260528-local-narrative-judge-provider-contract.md` - target ticket, scope, ACC-001 through ACC-005, current state.
- `.loom/evidence/20260528-local-narrative-judge-provider-contract.md` - evidence dossier and non-claims.
- `.loom/evidence/artifacts/20260528-local-narrative-judge-provider-contract/run-local-narrative-judge-provider-contract-harness.mjs` - fake generator/judge harness.
- `.loom/evidence/artifacts/20260528-local-narrative-judge-provider-contract/harness-summary.json` - recorded 13/13 harness summary.
- `.loom/research/20260528-local-narrative-judge-validation.md` - hybrid fact-ID + deterministic verifier + local judge recommendation and limits.
- `.loom/tickets/20260528-narrative-fact-id-contract-verifier.md` and `.loom/audit/20260528-narrative-fact-id-contract-verifier-narrowed-scope-review.md` - prerequisite deterministic verifier closure and residual semantic-risk handoff.

Source/tests:

- `src/flight-learn-local-diagnosis-model.ts`
- `src/flight-learn-local-diagnosis-model.test.ts`
- `src/flight-learn-llama-cpp-adapter.ts`
- `src/flight-learn-llama-cpp-adapter.test.ts`
- `src/pi-extension.ts`
- `src/pi-extension.test.ts`

Commands/probes run from `/Users/crlough/Code/personal/pi-flight-recorder`:

```bash
npm test -- src/flight-learn-local-diagnosis-model.test.ts src/flight-learn-llama-cpp-adapter.test.ts src/pi-extension.test.ts
```

Result: passed, `3` files / `63` tests.

```bash
npm run typecheck && git diff --check
```

Result: `tsc --noEmit` passed; `git diff --check` passed with no output.

Small no-write fake-provider probes:

- A privacy probe captured a judge request built from fixture raw paths/secrets/transcript-like/prompt-like input. The serialized judge request did not contain the raw fixture path, session filename, fixture secret values, transcript lines, prompt-like text, or stack-trace text; top-level request keys were `candidate`, `deterministic`, `facts`, `policy`, `prompt`, `schemaVersion`, and `signal`.
- A schema probe returned an accepted judge response with `supportedFactIds: []`; the narrative was accepted (`usedLocalModel: true`, `fallbackReason: null`). See FIND-001.

## Findings

### FIND-001 - Accepted judge sentences do not have to identify any supported fact IDs

Severity: blocker for ACC-001/ACC-002 closure. Confidence: high.

Observed:

- The ticket requires a bounded request/response contract with sentence verdicts, reasons, supported fact IDs, and confidence/uncertainty fields, and asks audit to challenge schema ambiguity (`.loom/tickets/20260528-local-narrative-judge-provider-contract.md:55-57`). It also requires fail-closed handling for unsupported verdicts and missing coverage (`.loom/tickets/20260528-local-narrative-judge-provider-contract.md:33-36`).
- The source validates that `supportedFactIds` is an array and that any provided ID is one of the candidate sentence's cited IDs, but it does not require the array to be non-empty before accepting `supported` or `supported-cautious-connection` verdicts (`src/flight-learn-local-diagnosis-model.ts:942-970`).
- A no-write probe with a deterministic-verifier-passing narrative and judge response `{ overallVerdict: "accept", verdict: "supported", supportedFactIds: [], unsupportedClaims: [], confidence: "high" }` returned `usedLocalModel: true` and accepted the candidate. That means the response can claim support without identifying a supporting cited fact.

Why it matters:

- The contract is meant to be auditable and fact-ID constrained. Accepting an empty support list makes the `supportedFactIds` field optional in practice and allows an internally inconsistent approval to pass.
- This is not a real-model quality issue; it is a deterministic response-schema issue that can be fixed in the fake-provider contract.

Required follow-up:

- Reject accepted sentence verdicts when `supportedFactIds.length === 0`.
- Add a focused unit test and harness exercise for `supported`/`supported-cautious-connection` with empty `supportedFactIds` failing closed, preferably as `schema-invalid` or `unsupported-facts`.
- Re-run focused tests, the judge harness, `npm run typecheck`, and `git diff --check`, then update evidence.

## Correct Observations

- ACC-001 is mostly implemented. The source exposes `LocalNarrativeJudgeProvider`, request/response types, `judgeProvider`, and `judgeTimeoutMs` (`src/flight-learn-local-diagnosis-model.ts:24-30`, `src/flight-learn-local-diagnosis-model.ts:124-199`). The request builder sends policy, deterministic display context, cloned redacted facts, candidate text/sentences/fact IDs/cited facts, plus local judge prompt/signal (`src/flight-learn-local-diagnosis-model.ts:822-860`). Request bounds come from the fact packet and narrative limits (`src/flight-learn-local-diagnosis-model.ts:594-639`). FIND-001 is the remaining response-schema gap.
- ACC-002 is largely supported. The application only uses the already-verified generator candidate; judge response text/reasons are not applied to display fields (`src/flight-learn-local-diagnosis-model.ts:691-705`, `src/flight-learn-local-diagnosis-model.ts:801-813`). Extra top-level judge fields such as `rewrite` and extra sentence fields fail schema validation (`src/flight-learn-local-diagnosis-model.ts:871-874`, `src/flight-learn-local-diagnosis-model.ts:922-924`). The tests cover reject, uncertain, low confidence, unsafe/action-advice, malformed JSON, extra rewrite field, missing sentence coverage, provider error, and timeout fallback (`src/flight-learn-local-diagnosis-model.test.ts:260-389`).
- ACC-003 is supported in fake-provider scope. The judge provider interface has no URL/API-key/header/provider shape (`src/flight-learn-local-diagnosis-model.ts:144-145`), and real loopback generator adapter locality remains unchanged: explicit config only, literal IPv4/IPv6 loopback HTTP only, no credentials/path/query/hosted URL, proxy bypass, and no download behavior (`src/flight-learn-llama-cpp-adapter.ts:57-72`, `src/flight-learn-llama-cpp-adapter.ts:79-103`, `src/flight-learn-llama-cpp-adapter.ts:122-135`). Tests cover hosted/non-loopback/provider-key/model-path rejection and no raw path/API key in the generator prompt (`src/flight-learn-llama-cpp-adapter.test.ts:312-364`, `src/flight-learn-llama-cpp-adapter.test.ts:443-510`). The audit privacy probe found no raw fixture sessions/paths/secrets/raw prompts/transcripts in the captured judge request.
- ACC-004 is supported. The main flow validates generator output first, returns immediately on deterministic validation failure, and only then calls `validateNarrativeCandidateWithLocalJudge` for a narrative candidate (`src/flight-learn-local-diagnosis-model.ts:688-696`). Tests and harness show unknown fact IDs skip the judge (`src/flight-learn-local-diagnosis-model.test.ts:391-405`; `.loom/evidence/artifacts/20260528-local-narrative-judge-provider-contract/harness-summary.json:21-35`).
- ACC-005 evidence exists and is mostly honest. The evidence dossier records focused tests, harness, typecheck, diff-check, and explicitly says no real judge model/runtime/download/hosted call/UI integration/storage/routing/classifier/release claim was exercised (`.loom/evidence/20260528-local-narrative-judge-provider-contract.md:51-83`, `.loom/evidence/20260528-local-narrative-judge-provider-contract.md:127-133`). I re-ran the focused tests, typecheck, and diff-check successfully.
- Existing adapter/Pi tests honestly cover generator-only non-narrative polish after narrative now requires a judge. Their fake loopback responses omit `whatHappened` and assert headline/impact/expected-behavior display-only behavior without a judge (`src/flight-learn-llama-cpp-adapter.test.ts:100-106`, `src/flight-learn-llama-cpp-adapter.test.ts:312-364`, `src/pi-extension.test.ts:653-717`). They should not be cited as narrative-over-loopback proof.

## Verdict

`changes-needed` before closing `ticket:20260528-local-narrative-judge-provider-contract`.

ACC-003, ACC-004, and ACC-005 are supported within fake-provider scope. ACC-001/ACC-002 are not fully close-ready because the response schema currently accepts an approval that provides no supported fact IDs for an accepted sentence.

## Required Follow-up

Before closure:

1. Fix FIND-001 by requiring non-empty `supportedFactIds` for accepted sentence verdicts and failing closed when absent.
2. Add focused test and harness coverage for that case.
3. Re-run focused Vitest, judge harness, `npm run typecheck`, and `git diff --check`.
4. Update the evidence dossier/harness summary.

Optional clarity follow-up: evidence wording should distinguish the intentional local judge instruction `prompt` field from forbidden raw/user prompts, because the request object includes a generated local judge prompt while the privacy claim is about not leaking raw session/operator prompts.

## Residual Risk

- No real local judge/model quality, latency, JSON reliability, self-judge bias, or hardware fit was tested.
- No real judge adapter or CLI judge configuration exists yet; current loopback adapter/Pi tests cover non-narrative generator-only polish and will fail closed if a generator returns narrative without a configured judge.
- The harness writes artifact JSON, so I did not rerun it during this no-source-edit audit; I inspected the recorded harness and re-ran non-artifact focused tests/typecheck/diff-check.

## Closure Recommendation

Do not close yet. After FIND-001 is fixed and evidenced, this ticket likely becomes close-ready for the fake-provider/provider-interface contract only. Do not claim full hybrid narrative safety, UI readiness, or real judge/model quality from this ticket.

## Related Records

- `ticket:20260528-local-narrative-judge-provider-contract`
- `evidence:20260528-local-narrative-judge-provider-contract`
- `research:20260528-local-narrative-judge-validation`
- `ticket:20260528-narrative-fact-id-contract-verifier`
- `audit:20260528-narrative-fact-id-contract-verifier-narrowed-scope-review`
