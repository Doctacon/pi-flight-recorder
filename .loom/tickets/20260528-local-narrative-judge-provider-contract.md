# Local Narrative Judge Provider Contract

ID: ticket:20260528-local-narrative-judge-provider-contract
Type: Ticket
Status: closed
Created: 2026-05-28
Updated: 2026-05-28
Risk: high - this adds a second local-model validation boundary for privacy-sensitive narrative display text and must fail closed.
Priority: high - required before UI integration or real Bonsai 4B narrative validation can claim the hybrid architecture.
Depends On: ticket:20260528-narrative-fact-id-contract-verifier

## Summary

Add the local judge provider contract for `/flight-learn` narrative `whatHappened` text after the fact-ID deterministic verifier exists. The bounded closure claim is: a model-agnostic local judge can only veto or mark uncertainty over already fact-ID-verified candidate sentences, and any judge failure, uncertainty, low confidence, unsafe verdict, unsupported verdict, timeout, or malformed response falls back to deterministic wording without side effects.

This ticket does not run real judge models. It implements the fake-provider/provider-interface contract and evidence needed before any authorized real local judge comparison.

## Related Records

- `research:20260528-local-narrative-judge-validation` - completed research recommending local judge as veto/uncertainty gate after fact-ID deterministic verification.
- `ticket:20260528-local-narrative-judge-validation-research` - closed research ticket with clear audit.
- `ticket:20260528-narrative-fact-id-contract-verifier` - prerequisite fact-ID deterministic verifier.
- `ticket:20260528-flight-learn-narrative-local-model-contract` - blocked regex-semantic path to supersede.
- `spec:flight-learn-inbox-ux` REQ-024 through REQ-032 and SCN-008 through SCN-010 - optional local model constraints.
- `src/flight-learn-local-diagnosis-model.ts` - likely source target for provider interface/request/response validation.
- `src/flight-learn-llama-cpp-adapter.ts` - existing loopback generator adapter; inspect before deciding whether a judge adapter belongs here or later.
- `evidence:20260528-local-narrative-judge-provider-contract` - implementation evidence and fake-provider harness results.

## Scope

In scope:

- Add a local judge provider interface and request/response schema for fact-ID-verified narrative candidate sentences.
- Ensure the judge receives only bounded redacted facts and candidate sentences with cited fact IDs.
- Validate judge responses structurally and fail closed for malformed JSON, extra fields, bad verdicts, missing sentence verdicts, low confidence, `uncertain`, unsupported, unsafe, action-advice, low-information, timeout, and provider errors.
- Treat judge as veto-only: it cannot add facts, rewrite narrative text, choose routes, mutate storage, or create artifacts.
- Add fake judge tests/harness cases for accept/reject/uncertain/error/timeout paths.
- Preserve deterministic fallback/default and display-only semantics.

Out of scope:

- Real judge model runs, model downloads, model installs, Prometheus/Bonsai/NLI validation, ONNX/Transformers.js integration, or hardware/latency claims.
- UI integration, CLI defaults, new visible commands, route/storage/classifier/artifact changes, or source/docs/Loom mutations outside ticket records/evidence.
- Hosted/non-loopback/proprietary judge APIs.
- Reintroducing regex semantic grounding as the primary gate.

Stop conditions:

- Stop if the judge contract would require raw session input, raw paths, prompts, transcripts, stack traces, or private content.
- Stop if the judge provider cannot be made veto-only without product behavior ambiguity.
- Stop if real model/runtime validation becomes necessary to close this fake-provider contract ticket.

## Acceptance

- ACC-001: Judge provider request/response contract exists and is bounded.
  - Evidence: source/tests show a provider interface, request object, and response schema limited to redacted facts, candidate sentences, sentence verdicts, reasons, supported fact IDs, and confidence/uncertainty fields.
  - Audit: challenge hidden raw data exposure and schema ambiguity.

- ACC-002: Judge is veto-only and fails closed.
  - Evidence: tests show accept allows prior deterministic candidate, while reject/uncertain/low-confidence/malformed/timeout/provider-error paths fall back to deterministic text.
  - Audit: challenge whether judge can create or rewrite display text or source-of-truth state.

- ACC-003: Privacy/local-first boundaries are preserved.
  - Evidence: tests/source inspection show no hosted/non-loopback/provider-key shape, no automatic downloads, no raw sessions/paths/secrets/prompts/transcripts in judge request, and no side effects.
  - Audit: challenge leakage through judge reasons, unsupported claims, or provider error details.

- ACC-004: Integration remains compatible with the fact-ID verifier.
  - Evidence: tests show judge runs only after deterministic verifier passes, and deterministic verifier failures do not call judge.
  - Audit: challenge ordering and fallback semantics.

- ACC-005: Evidence and validation are recorded.
  - Evidence: focused tests, relevant harness, `npm run typecheck`, `git diff --check`, evidence dossier, and audit. Explicitly state no real judge/model quality is proven.
  - Audit: separate review before closure.

## Current State

Closed for fake-provider/provider-interface scope. `src/flight-learn-local-diagnosis-model.ts` now exposes `LocalNarrativeJudgeProvider`/request/response types, `judgeProvider`/`judgeTimeoutMs` options, bounded redacted judge requests, strict structured response validation, and veto-only fail-closed behavior. Initial audit `audit:20260528-local-narrative-judge-provider-contract-review` returned `changes-needed` because accepted judge sentence verdicts could omit supported fact IDs. Follow-up fix rejects accepted judge sentence verdicts with empty `supportedFactIds` and covers that case in tests/harness. Validation after fix passed: focused tests (3 files / 63 tests), sanitized judge harness (14/14), `npm run typecheck`, `npm run build`, and `git diff --check`. Follow-up audit `audit:20260528-local-narrative-judge-provider-contract-followup-review` returned `clear` within fake-provider/provider-interface scope. No real judge/model/runtime/download/hosted call/UI/storage/routing/release claim is proven by this ticket.

## Journal

- 2026-05-28: Created as dependent successor ticket after completed judge-validation research. Do not start until the fact-ID deterministic verifier ticket provides the candidate sentence/fact-ID seam.
- 2026-05-28: Set active after `ticket:20260528-narrative-fact-id-contract-verifier` closed with clear narrowed-scope audit. Launching bounded implementation worker for fake-provider judge contract only.
- 2026-05-28: Implemented local judge provider contract, bounded judge request, structured judge response validation, judge-only-after-deterministic-verifier ordering, no-judge fail-closed narrative behavior, fake-provider tests, and sanitized harness artifacts. Updated adapter/Pi fake fixtures for generator-only non-narrative polish compatibility. Validation passed: `npm test -- src/flight-learn-local-diagnosis-model.test.ts src/flight-learn-llama-cpp-adapter.test.ts src/pi-extension.test.ts` (63 tests), judge harness (13/13), `npm run typecheck`, and `git diff --check`. Moved to review.
- 2026-05-28: Initial audit `audit:20260528-local-narrative-judge-provider-contract-review` returned `changes-needed` with `FIND-001`: accepted judge sentences did not need non-empty `supportedFactIds`. Fixed by rejecting accepted verdicts with empty supported fact IDs and adding focused test/harness coverage. Re-ran focused tests (63), judge harness (14/14), typecheck, build, and diff-check; all passed. Follow-up audit is next.
- 2026-05-28: Follow-up audit `audit:20260528-local-narrative-judge-provider-contract-followup-review` returned `clear` for the fake-provider/provider-interface contract. Closed ticket with explicit non-claims for real judge/model quality, latency, runtime behavior, UI readiness, and release readiness.
