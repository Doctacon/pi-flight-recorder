# Flight Learn Narrative Local Model Contract

ID: ticket:20260528-flight-learn-narrative-local-model-contract
Type: Ticket
Status: blocked
Created: 2026-05-28
Updated: 2026-05-28
Risk: high - this changes the local-model validation contract for a privacy-sensitive UI field and could admit unsupported narrative if not bounded.
Priority: high - required before UI integration can safely render Bonsai 4B narrative text.
Depends On: ticket:20260528-flight-learn-narrative-rubric-corpus

## Summary

Implement a field-specific local-model contract for narrative `whatHappened` output. The single closure claim is: optional local-model polish can accept a grounded 2-4 sentence `What happened?` narrative that is more useful than repeating the headline, while preserving deterministic fallback, strict safety checks, and display-only behavior.

This ticket should make Bonsai 4B-style narrative possible in the contract. It must not integrate the narrative into the focused card yet; that belongs to the next ticket.

## Related Records

- `plan:20260528-flight-learn-4b-narrative-what-happened` - parent plan.
- `ticket:20260528-flight-learn-narrative-rubric-corpus` - prerequisite corpus/rubric.
- `spec:flight-learn-inbox-ux` REQ-030 through REQ-032 and SCN-010 - intended behavior.
- `evidence:20260528-flight-learn-narrative-what-happened-feedback` - operator feedback.
- `evidence:20260527-prism-ml-small-model-comparison` - prior 4B output pattern under old validator.
- `src/flight-learn-local-diagnosis-model.ts` - likely implementation target.
- `src/flight-learn-local-diagnosis-model.test.ts` - likely focused test target.
- `src/flight-learn-llama-cpp-adapter.ts` - adapter should not need behavior changes.
- `evidence:20260528-flight-learn-narrative-rubric-corpus` - prerequisite corpus/rubric evidence.
- `audit:20260528-flight-learn-narrative-rubric-corpus-review` - prerequisite audit; verdict `clear`.
- `evidence:20260528-flight-learn-narrative-local-model-contract` - implementation/evidence dossier.
- `audit:20260528-flight-learn-narrative-local-model-contract-review` - initial audit; verdict `changes-needed` with `FIND-001` through `FIND-003`.
- `audit:20260528-flight-learn-narrative-local-model-contract-followup-review` - first follow-up audit; verdict `changes-needed` with `FIND-FU-001` and `FIND-FU-002`.
- `audit:20260528-flight-learn-narrative-local-model-contract-second-followup-review` - second follow-up audit; verdict `changes-needed` with `FIND-SFU-001` and `FIND-SFU-002`.
- `audit:20260528-flight-learn-narrative-local-model-contract-third-followup-review` - third follow-up audit; verdict `changes-needed` with `FIND-TFU-001` and `FIND-TFU-002`.
- `audit:20260528-flight-learn-narrative-local-model-contract-fourth-followup-review` - fourth follow-up audit; verdict `changes-needed` with `FIND-FFU-001` and `FIND-FFU-002`.
- `audit:20260528-flight-learn-narrative-local-model-contract-fifth-followup-review` - fifth follow-up audit; verdict `changes-needed` with `FIND-5FU-001` and `FIND-5FU-002`.
- `research:20260528-local-narrative-judge-validation` - completed research recommending a hybrid fact-ID constrained generation + deterministic verifier + local judge veto contract.
- `ticket:20260528-local-narrative-judge-validation-research` - closed research execution ticket; audit clear. Its recommendation should supersede or rewrite this blocked ticket rather than continuing regex bypass fixes.

## Scope

In scope:

- Update the local diagnosis model prompt/contract to describe separate field jobs: concise `headline`/`Problem`, narrative `whatHappened`, supporting `whyItMatters`, optional `expectedBehavior`.
- Add or adjust validator logic so `whatHappened` can be a bounded narrative paragraph while raw path/secret/route/action/mutation/schema checks remain strict.
- Preserve stricter validation for non-narrative fields where appropriate.
- Ensure unsupported concrete facts still fall back; acceptable narrative connective tissue should be defined by the prerequisite rubric.
- Add fake-provider tests for valid narrative, duplicate/no-better-than-headline output, unsupported details, unsafe content, route/action advice, redaction-placeholder echo, overlong narrative, malformed JSON, timeout, and provider error.
- Optionally add/update a harness artifact that consumes the narrative corpus without starting a real model.
- Record evidence and audit before closure.

Out of scope:

- Rendering narrative text in `src/flight-learn-inbox.ts`.
- Changing CLI defaults, timeout defaults, command visibility, adapter locality, model downloads, or runtime lifecycle.
- Running real Bonsai 4B; that belongs to validation ticket.
- Weakening safety checks for raw paths, secrets, prompts, transcripts, stack traces, route/action advice, artifact/rule/source mutation, or classifier/ranking claims.
- Persisting model output to stored delta fields or artifacts.

Stop conditions:

- Stop if implementation would require unbounded prompt/session input.
- Stop if the narrative validator cannot be implemented without broadly weakening existing safety checks.
- Stop if behavior requires a product decision not covered by the spec/rubric.

## Acceptance

- ACC-001: Field-specific narrative prompt/contract exists.
  - Evidence: focused tests or source inspection show the prompt tells the model to make `whatHappened` narrative and distinct from `headline` while keeping output display-only.
  - Audit: challenge whether instructions are too broad or route/action-prone.

- ACC-002: Narrative validation is bounded and safe.
  - Evidence: tests show accepted narrative is length-bounded and grounded; unsupported facts, raw paths/secrets, route/action advice, mutation instructions, redaction placeholders, malformed JSON, overlong output, timeout, and provider errors fall back.
  - Audit: challenge any validator weakening.

- ACC-003: Deterministic fallback/default semantics remain unchanged.
  - Evidence: tests show disabled/unavailable/invalid model output returns deterministic view and no source-of-truth fields change.
  - Audit: challenge hidden storage/routing side effects.

- ACC-004: Narrative harness/rubric compatibility is proven.
  - Evidence: fake-provider harness consumes the narrative corpus and records per-case narrative outcomes/notes.
  - Audit: challenge whether the harness redefines the rubric.

- ACC-005: Validation remains healthy.
  - Evidence: focused tests, `npm run typecheck`, relevant full tests or justified subset, `git diff --check`.

## Current State

Blocked. Repeated audits exposed that the ticket had drifted into trying to validate open-ended narrative semantics with regex/token allow-lists. That is not a scalable or honest contract for local-model narrative quality. Regex remains appropriate for hard syntactic safety guards such as raw paths, secrets, raw command strings, schema, and length, but not for deciding whether arbitrary natural-language `whatHappened` prose is semantically grounded, non-actionable, and useful.

The latest implementation has passing focused tests/harness/typecheck/diff-check, but acceptance is not trustworthy because `audit:20260528-flight-learn-narrative-local-model-contract-fifth-followup-review` still found bypasses and the pattern of findings shows the approach itself is flawed. Progress is blocked because `research:20260528-local-narrative-judge-validation` completed and recommends replacing this regex-semantic approach with successor tickets: fact-ID constrained narrative generation/deterministic verification and a local judge provider contract. Do not proceed to UI integration or real Bonsai validation from this ticket state, and do not resume regex bypass fixes here.

## Journal

- 2026-05-28: Created as second child ticket of `plan:20260528-flight-learn-4b-narrative-what-happened`. No implementation started.
- 2026-05-28: Set active after prerequisite corpus/rubric ticket closed with clear audit. Launching bounded implementation run for prompt/validator/test/harness changes within ticket scope.
- 2026-05-28: Implementation run updated `src/flight-learn-local-diagnosis-model.ts` and `src/flight-learn-local-diagnosis-model.test.ts`; created `evidence:20260528-flight-learn-narrative-local-model-contract` and fake-provider harness artifacts. Focused Vitest passed (18 tests), narrative corpus harness passed (15 cases; 7 accepted / 8 fallback; zero mismatches), `npm run typecheck` passed, and `git diff --check` passed. Moved to review because ACC-001 through ACC-005 appear evidence-supported and audit is next.
- 2026-05-28: Recorded `audit:20260528-flight-learn-narrative-local-model-contract-review` with verdict `changes-needed`. Fixed `FIND-001` by rejecting bare imperative action advice in `whatHappened`, fixed `FIND-002` by rejecting fact-packet/internal-structure echo, and dispositioned `FIND-003` by narrowing the claim: exact duplicates fall back, while safe-but-generic/no-better prose remains a known rubric-level quality risk (`accepted-narrative-worse`) rather than a runtime safety fallback. Re-ran focused Vitest (19 tests), narrative harness, typecheck, and `git diff --check`; all passed. Follow-up audit is next.
- 2026-05-28: Recorded first follow-up audit `audit:20260528-flight-learn-narrative-local-model-contract-followup-review` with verdict `changes-needed`. Fixed `FIND-FU-001` by detecting imperative clauses after comma/colon/introductory phrases while preserving descriptive `Review churn` narrative and supported imperative `expectedBehavior`. Fixed `FIND-FU-002` by rejecting bare internal `delta` output and adjusting the NARR-EVAL-005 accepted corpus example from `stored delta` to `stored facts` so corpus/prompt/validator agree. Re-ran focused Vitest (19 tests), narrative harness (15 cases plus fallback exercises; zero mismatches; unsafe-output exercises now 7), typecheck, and `git diff --check`; all passed. Second follow-up audit is next.
- 2026-05-28: Second follow-up audit returned `changes-needed` with `FIND-SFU-001` for article-bearing/`validate`/unpunctuated intro imperative bypasses and `FIND-SFU-002` for bare `headline` plus unresolved `evidence` boundary. Fixed by expanding `whatHappened` imperative detection, adding tests/harness exercises for the bypasses, rejecting bare `headline`/internal field echo, revising prompt/evidence to allow generic operator-facing `stored evidence`, and preserving descriptive `Review churn` plus supported imperative `expectedBehavior`. Re-ran focused Vitest (19 tests), narrative harness (15 cases plus fallback exercises; zero mismatches; unsafe-output exercises now 11), typecheck, and `git diff --check`; all passed. Third follow-up audit is next.
- 2026-05-28: Third follow-up audit returned `changes-needed` with `FIND-TFU-001` for `run a/local validation` and `check validation` imperatives and `FIND-TFU-002` for bare packet/Problem meta-language. Fixed by adding article/adjective action-object detection, `check` imperative detection, packet/Problem output rejection, and tests/harness exercises. Re-ran focused Vitest (19 tests), narrative harness (15 cases plus fallback exercises; zero mismatches; unsafe-output exercises now 16), typecheck, and `git diff --check`; all passed. Fourth follow-up audit is next.
- 2026-05-28: Fourth follow-up audit returned `changes-needed` with `FIND-FFU-001` for current/possessive-object and `use` imperatives and `FIND-FFU-002` for plural internal/meta terms. Fixed by broadening imperative clause detection to generic action verbs, rejecting plural internal/meta terms, and adding tests/harness exercises. Added one extra `verify` imperative probe before audit. Re-ran focused Vitest (19 tests), narrative harness (15 cases plus fallback exercises; zero mismatches; unsafe-output exercises now 21), typecheck, and `git diff --check`; all passed. Fifth follow-up audit is next.
- 2026-05-28: Fifth follow-up audit returned `changes-needed` with `FIND-5FU-001` for leading-adverb/prepositional/purpose action advice and `FIND-5FU-002` for all-caps Problem meta echo. Fixed by allowing `now/next` prefixes, adding `for/during/to` introductory action detection, making `use of` descriptive wording acceptable, rejecting `PROBLEM(S)`, and adding tests/harness exercises. Re-ran focused Vitest (19 tests), narrative harness (15 cases plus fallback exercises; zero mismatches; unsafe-output exercises now 25), typecheck, and `git diff --check`; all passed. Sixth follow-up audit is next.
- 2026-05-28: Sixth follow-up audit also returned `changes-needed`, and operator correctly challenged the underlying approach: semantic validation by expanding regex/token rules will not scale. Marked ticket blocked. The next move belongs to product/architecture shaping before further implementation; do not keep adding regex bypass fixes under this ticket.
- 2026-05-28: Linked the new unblocker records `research:20260528-local-narrative-judge-validation` and `ticket:20260528-local-narrative-judge-validation-research`.
- 2026-05-28: Research ticket closed with clear audit. Recommendation is to supersede/rewrite this ticket with fact-ID deterministic verifier and local judge provider tickets rather than unblocking this regex-semantic implementation.
