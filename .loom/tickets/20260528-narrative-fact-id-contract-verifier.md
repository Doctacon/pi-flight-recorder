# Narrative Fact-ID Contract Verifier

ID: ticket:20260528-narrative-fact-id-contract-verifier
Type: Ticket
Status: closed
Created: 2026-05-28
Updated: 2026-05-28
Risk: high - this changes the local-model response contract for optional `/flight-learn` narrative text and must avoid replacing one unsafe semantic gate with another.
Priority: high - first successor implementation ticket after the regex-semantic validator was rejected.

## Summary

Replace the blocked regex/token semantic validator for narrative `whatHappened` with a proof-by-construction fact-ID response contract and deterministic verifier. The bounded closure claim is: optional local-model narrative output must cite known redacted local facts for every narrative sentence, and deterministic code verifies schema, fact IDs, length, hard privacy/safety literals, fallback behavior, and display-only boundaries without claiming semantic entailment.

This ticket implements only the generator/fact-ID and deterministic-verifier half of the hybrid architecture from `research:20260528-local-narrative-judge-validation`. It must not claim real model quality or semantic grounding proof; the local judge veto belongs to a dependent ticket.

## Related Records

- `research:20260528-local-narrative-judge-validation` - completed research recommending hybrid fact-ID + deterministic verifier + local judge veto architecture.
- `ticket:20260528-local-narrative-judge-validation-research` - closed research ticket with clear audit.
- `audit:20260528-local-narrative-judge-validation-research-review` - audit confirming research scope and limits.
- `ticket:20260528-flight-learn-narrative-local-model-contract` - blocked regex-semantic path; do not resume regex bypass fixes from it.
- `plan:20260528-flight-learn-4b-narrative-what-happened` - blocked parent plan to reshape after successor tickets.
- `spec:flight-learn-inbox-ux` REQ-024 through REQ-032 and SCN-008 through SCN-010 - optional local-model display-only and fallback constraints.
- `src/flight-learn-local-diagnosis-model.ts` - likely source target for fact packet/schema/prompt/verifier changes.
- `src/flight-learn-local-diagnosis-model.test.ts` - focused contract tests.
- `src/flight-learn-llama-cpp-adapter.test.ts` and `src/pi-extension.test.ts` - fake local-model responses may need schema updates to preserve opt-in smoke behavior.

## Scope

In scope:

- Add stable local fact IDs to the bounded/redacted fact packet or a versioned successor packet shape.
- Update the local-model prompt to require structured `whatHappened.sentences[]` with `text` and non-empty `factIds` for every narrative sentence.
- Add deterministic verification for:
  - response JSON/schema shape and no extra keys;
  - known/non-empty fact IDs for each narrative sentence;
  - narrative sentence count/combined length bounds;
  - hard raw-path/secret/raw-command/redaction-placeholder/prompt/transcript/stack-trace literals;
  - obvious display-only violations such as route/action/mutation/classifier/ranking language;
  - duplicate deterministic wording and empty/non-useful output fallback;
  - timeout/provider-error/malformed JSON fallback;
  - no source delta/storage/routing/artifact mutation.
- Replace broad narrative token-support allow-lists as the primary semantic gate. Do not keep expanding regexes to decide general grounding/usefulness.
- Update fake-provider tests and sanitized harness artifacts to exercise fact-ID acceptance and rejection paths.
- Keep existing loopback adapter locality and no-download behavior unchanged.

Out of scope:

- Local judge provider interface or real judge model calls.
- Real Bonsai 4B, Prometheus, NLI, ONNX, Transformers.js, llama.cpp runtime validation.
- UI integration or visible card layout changes.
- CLI default changes, new visible slash commands, model downloads, runtime lifecycle management, hosted calls, telemetry, storage/routing/classifier/artifact side effects, source/docs/Loom mutations outside ticket records/evidence.
- Claiming accepted fact-ID output is semantically entailed; this ticket only proves deterministic structure and hard safety.

Stop conditions:

- Stop if implementing this requires unbounded session input, raw transcripts, raw local paths, or a model/runtime download.
- Stop if the implementation cannot avoid semantic regex whack-a-mole.
- Stop if all narrative acceptance would require the local judge provider to exist first; then mark blocked and move to the judge ticket.

Expected first Ralph run:

- Implementation worker: inspect the research, blocked ticket, current source/tests, then implement fact-ID packet/schema/prompt/verifier changes and focused tests. No real model/runtime work.

## Acceptance

- ACC-001: Fact packet exposes stable redacted local fact IDs.
  - Evidence: source/tests show deterministic fields, delta fields, signals, and evidence summaries are available as bounded sanitized facts with IDs; raw paths/secrets/prompts/transcripts remain redacted/omitted.
  - Audit: challenge ID stability, unsafe fact text leakage, and unbounded input.

- ACC-002: Generator prompt/schema requires sentence-level fact IDs for narrative `whatHappened`.
  - Evidence: tests/source inspection show `whatHappened` is no longer accepted as arbitrary string narrative and every narrative sentence must cite known fact IDs.
  - Audit: challenge schema ambiguity and backward-compatible loopholes that bypass fact IDs.

- ACC-003: Deterministic verifier fails closed for malformed, uncited, unknown-ID, overlong, duplicate, hard-unsafe literal, explicit display-only literal, timeout, and provider-error cases within the bounded deterministic scope.
  - Evidence: focused tests and/or harness artifacts cover accepted fact-ID narrative plus missing/unknown/duplicate/excessive IDs, extra fields, raw path/secret/redaction-placeholder output, enumerated raw-command literals, explicit route/routed/routing/follow-up/action/mutation/classifier/ranking literals, duplicate output, malformed JSON, timeout, provider error, and no mutation.
  - Audit: challenge whether the ticket overclaims semantic action/classifier grounding. Spaced `follow up`, bucket-fit semantics, and other route/classifier-adjacent paraphrases are explicitly not claimed here; they belong to the dependent local judge provider ticket.

- ACC-004: Existing local-model integration remains local-first and display-only.
  - Evidence: adapter/fake Pi tests or justified focused subset show loopback-only request behavior, bounded prompt with fact IDs, local-model disclosure/fallback behavior, and no storage/routing/artifact mutation from model wording.
  - Audit: challenge hidden hosted/network/provider-key behavior and side effects.

- ACC-005: Validation is healthy and evidence is recorded.
  - Evidence: focused Vitest, relevant adapter/Pi tests or justified subset, harness if updated, `npm run typecheck`, and `git diff --check`; evidence dossier records command outcomes and limits.
  - Audit: separate review before closure, with explicit statement that real-model/judge quality is not proven.

## Current State

Closed. Fact-ID deterministic verifier implementation is complete within this ticket's narrowed source scope. Evidence is recorded at `evidence:20260528-narrative-fact-id-contract-verifier` and artifacts under `.loom/evidence/artifacts/20260528-narrative-fact-id-contract-verifier/`. Final narrowed-scope audit `audit:20260528-narrative-fact-id-contract-verifier-narrowed-scope-review` returned `clear`. The ticket closes only as the deterministic fact-ID verifier prerequisite: fact packet version `2`, stable redacted fact IDs, structured `whatHappened.sentences[].text + factIds`, schema/fact-ID/hard-literal verification, local-first adapter compatibility, and display-only/no-mutation behavior are supported. It does not close semantic entailment, usefulness, spaced `follow up`/bucket paraphrases, judge-provider behavior, real Bonsai/local-runtime behavior, UI integration, or full REQ-032 safety.

## Journal

- 2026-05-28: Created as successor to the blocked regex-semantic narrative contract. First move is bounded implementation of fact-ID packet/schema/prompt/verifier changes with fake-provider evidence only.
- 2026-05-28: Set active and launching bounded implementation worker. Scope remains source/tests/evidence for fact-ID deterministic verifier only; no local judge, real model, UI, runtime, download, hosted call, or release claim.
- 2026-05-28: Implemented fact packet version `2` with stable redacted fact IDs, structured `whatHappened.sentences[].text + factIds` response validation, schemaVersion `2`, deterministic known-ID checks, and hard safety/display-only fallback. Removed the narrative token allow-list semantic grounding path from `whatHappened`; local judge remains future work. Updated fake-provider fixtures in local diagnosis, llama.cpp adapter, and Pi extension tests. Created `evidence:20260528-narrative-fact-id-contract-verifier` and harness artifacts. Validation passed: focused local-model tests (19), adapter/Pi tests (40), combined focused tests (59), harness (10/10), `npm run typecheck`, and `git diff --check`. Moved to review for audit.
- 2026-05-28: Initial audit `audit:20260528-narrative-fact-id-contract-verifier-review` returned `changes-needed` with `FIND-001` transcript-like deterministic fact leakage, `FIND-002` passive route advice, and `FIND-003` broader raw command literals. Fixed by expanding transcript detection after whitespace collapse, broadening hard route-language rejection, adding common executable+argument raw command detection, rejecting duplicate/excessive fact IDs, and adding tests/harness exercises. Re-ran local-model tests (20), fact-ID harness (13/13), adapter/Pi tests (40), typecheck, and diff-check; all passed. Follow-up audit is next.
- 2026-05-28: First follow-up audit `audit:20260528-narrative-fact-id-contract-verifier-followup-review` returned `changes-needed` with remaining single-role prompt/transcript-like leakage, `ls`/`curl` command literal bypasses, and optional sentence `role` schema ambiguity. Fixed by treating any exact role-labelled source text as transcript-like input, expanding raw command hard-safety coverage for common shell/network/file commands, and rejecting `role` as an extra sentence key. Re-ran local-model tests (20), fact-ID harness (16/16), adapter/Pi tests (40), typecheck, and diff-check; all passed. Second follow-up audit is next.
- 2026-05-28: Second follow-up audit `audit:20260528-narrative-fact-id-contract-verifier-second-followup-review` returned `changes-needed` with remaining project/common command literal bypasses (`tsx`, `duckdb`, `vite`, `deno`) and non-`route` follow-up/classifier advice variants. Fixed by broadening executable+argument hard-safety coverage for project/common local tooling and rejecting `follow-up`/`followup` wording in model output. Re-ran local-model tests (20), fact-ID harness (18/18), adapter/Pi tests (40), typecheck, and diff-check; all passed. Third follow-up audit is next.
- 2026-05-28: Third follow-up audit `audit:20260528-narrative-fact-id-contract-verifier-third-followup-review` returned `changes-needed` for spaced `follow up` and bucket-fit semantic paraphrases. Per the completed research and operator direction to stop regex-semantic whack-a-mole, narrowed ACC-003/evidence to deterministic hard-literal families and explicitly routed remaining semantic action/classifier variants to the dependent local judge provider ticket. No source change was made for those semantic paraphrases.
- 2026-05-28: Narrowed-scope audit `audit:20260528-narrative-fact-id-contract-verifier-narrowed-scope-review` returned `clear` and recommended closure under the narrowed deterministic hard-literal scope. Closed ticket. Next dependency is `ticket:20260528-local-narrative-judge-provider-contract`.
