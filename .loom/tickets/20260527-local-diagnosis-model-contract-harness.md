# Local Diagnosis Model Contract Harness

ID: ticket:20260527-local-diagnosis-model-contract-harness
Type: Ticket
Status: closed
Created: 2026-05-27
Updated: 2026-05-27
Risk: high - this ticket defines the safety contract for model input/output in a privacy-sensitive UI path.
Priority: high - downstream adapter and UI work must not invent prompt, schema, redaction, or fallback semantics.
Depends On: ticket:20260527-local-diagnosis-model-runtime-research

## Summary

Implement the model-agnostic contract for optional local-model diagnosis polish: bounded redacted fact packet construction, prompt construction, structured response schema, validation/rejection, timeout/error fallback, and fake-provider tests.

Single closure claim: a future adapter can call a local model through a narrow contract that never sends raw sessions, rejects unsafe or malformed output, and always returns deterministic diagnosis text when model output is unavailable or untrusted.

## Related Records

- `plan:20260527-flight-learn-local-model-diagnosis-polish` - parent strategy and sequencing.
- `research:20260527-local-diagnosis-model-runtime` - runtime/model research; this ticket should consume its completed conclusion before execution.
- `spec:flight-learn-inbox-ux` - REQ-024 through REQ-029 and SCN-008/SCN-009 define required behavior.
- `ticket:20260527-flight-learn-diagnosis-view-model` - implemented deterministic diagnosis baseline and fallback.
- `src/flight-learn-diagnosis.ts` - likely read/write seam for deterministic diagnosis and optional polish helpers.
- `src/flight-learn-diagnosis.test.ts` - likely test seam for diagnosis view-model behavior.
- `src/redact.ts` - likely read scope for existing redaction utilities.
- `evidence:20260527-local-diagnosis-model-contract-harness-validation` - validation outputs for the implementation run.
- `audit:20260527-local-diagnosis-model-contract-harness-review` - first audit pass; verdict `changes-needed` with blockers for non-home absolute path/timestamp input handling and overpermissive unsupported-fact/action output validation.
- `audit:20260527-local-diagnosis-model-contract-harness-followup-review` - follow-up audit; verdict `changes-needed` because path-like variants and modal action phrasing still bypass validation.
- `audit:20260527-local-diagnosis-model-contract-harness-second-followup-review` - second follow-up audit; verdict `changes-needed` because `can` modal action phrasing still bypasses validation.
- `audit:20260527-local-diagnosis-model-contract-harness-third-followup-review` - third follow-up audit; verdict `changes-needed` because `need(s) to`, `has to`, and `have to` action phrasing still bypass display-only validation.
- `audit:20260527-local-diagnosis-model-contract-harness-fourth-followup-review` - fourth follow-up audit; verdict `changes-needed` because objectless obligation/action phrasing still bypasses validation.
- `audit:20260527-local-diagnosis-model-contract-harness-fifth-followup-review` - fifth follow-up audit; verdict `changes-needed` because modal/obligation action advice with verbs outside the hard-coded list still bypasses validation.
- `audit:20260527-local-diagnosis-model-contract-harness-sixth-followup-review` - final follow-up audit; verdict `clear` for ACC-001 through ACC-005 within model-agnostic harness scope.

## Scope

In scope:

- Define a model-agnostic local diagnosis polish interface, likely separate from the existing reflection provider because this path requires local-only policy, structured output, and stricter validation.
- Build a bounded redacted fact packet from already-local fields such as deterministic diagnosis view, delta summary/reality/expectation/impact, detector signals, concise evidence metadata, and route-safe context.
- Explicitly exclude raw session transcripts, full prompts, unredacted local paths, secrets, unconstrained command output, and full evidence snippets from the fact packet.
- Define a small JSON response schema for display wording only, likely including optional replacements for `headline`, `whatHappened`, `whyItMatters`, and possibly `expectedBehavior`, plus no route/action fields.
- Implement schema, length, content, and safety validation.
- Implement timeout/error/unavailable fallback to deterministic diagnosis text.
- Add fake-provider tests for valid output, malformed JSON, overlong fields, secret-looking output, invented unsupported facts, non-local/raw details, timeout, and provider error.
- Prove no storage, routing, artifact, rule, source-doc, Loom, skill, or prompt mutation happens inside the contract.

Out of scope:

- Real Bonsai, `llama.cpp`, MLX, Ollama, or other runtime invocation.
- UI integration into `/flight-learn` focused-card rendering.
- Project settings or command flag UX beyond the minimal option shape needed to test the contract.
- Installing or downloading model weights.
- Changing visible command registration.

Likely write scope:

- `src/flight-learn-diagnosis.ts` or a new focused helper such as `src/flight-learn-local-diagnosis-model.ts`.
- New/updated colocated tests, likely `src/flight-learn-diagnosis.test.ts` and/or a new test file.
- Loom evidence/audit records after execution, not before.

Stop conditions:

- If a fact packet cannot be made useful without including raw sessions or sensitive details, stop and route back to `spec:flight-learn-inbox-ux` / research.
- If validation cannot distinguish display-only phrasing from route/action recommendations, stop and split/refine the schema.
- If implementation would require a real runtime adapter to test safety, stop and keep this ticket model-agnostic.

## Acceptance

- ACC-001: The code exposes a model-agnostic local diagnosis polish contract with deterministic fallback.
  - Evidence: focused tests show valid fake-provider output can replace display wording and provider absence/error/timeout returns deterministic diagnosis.
  - Audit: review should challenge whether fallback is complete and whether the contract can be used without a model.

- ACC-002: The fact packet is bounded and redacted.
  - Evidence: tests assert local paths, secrets, raw session text, full prompts, and long/unbounded snippets are omitted or redacted.
  - Audit: review should inspect the prompt/fact-packet builder for privacy leaks and scope creep.

- ACC-003: Model output is strictly structured, length-bounded, and display-only.
  - Evidence: tests cover malformed JSON, missing required fields, extra route/action fields, overlong fields, secret-looking output, and invented unsupported facts being rejected.
  - Audit: review should challenge whether the validator is too permissive and whether output can influence routing/storage.

- ACC-004: No storage, routing, artifact, rule, source, docs, Loom, skills, or prompts are mutated by the contract.
  - Evidence: focused tests or source inspection artifact show the contract only returns display data and does not call store/artifact/rule mutation APIs.
  - Audit: review should challenge accidental side effects.

- ACC-005: Standard validation passes for the touched source boundary.
  - Evidence: focused tests, `npm run typecheck`, `npm run build`, and relevant full tests or justified narrower test set.
  - Audit: review should challenge any skipped tests or unsupported closure claim.

## Current State

Closed. Implementation added `src/flight-learn-local-diagnosis-model.ts` and `src/flight-learn-local-diagnosis-model.test.ts` for the model-agnostic local diagnosis polish contract/harness only. No real runtime adapter, network call, model download, package/config change, visible command change, or UI integration was added.

Acceptance posture:

- ACC-001: satisfied by deterministic default/fallback behavior, fake-provider valid-output path, provider-unavailable/error/timeout fallback tests, and final audit.
- ACC-002: satisfied by bounded/redacted fact packet and prompt tests covering local paths, non-home/URI/spaced path variants, secrets, raw session transcripts, full prompts, stack traces, evidence caps, long snippet truncation, and timestamp handling.
- ACC-003: satisfied by structured JSON, key/length/type, unsafe-output, unsupported-fact, and action-phrase validation tests. Multiple audit passes found and drove hardening for path variants and action-advice bypasses; `audit:20260527-local-diagnosis-model-contract-harness-sixth-followup-review` returned `clear`.
- ACC-004: satisfied by source inspection and module shape: the contract imports deterministic diagnosis, redaction, and types only, and returns display data without store/artifact/rule/source/docs/Loom/skill/prompt mutation APIs.
- ACC-005: satisfied by evidence-recorded focused tests, `npm run typecheck`, `npm run build`, full `npm test`, source inspection, and diff checks. Latest recorded full test suite passed `20 files / 109 tests`.

Residual risk: output validation remains heuristic rather than semantic proof against every possible action-like or hallucinated paraphrase, and real local runtime/provider locality remains future adapter-ticket scope. These are named limits, not blockers for the model-agnostic contract harness.

## Journal

- 2026-05-27: Created from `plan:20260527-flight-learn-local-model-diagnosis-polish` after the operator selected PrismML Bonsai as the preferred low-memory candidate. This slice intentionally remains model-agnostic so Bonsai does not weaken the safety contract.
- 2026-05-27: Set status to active after runtime research closed. Dispatching a bounded implementation run for the contract/harness only.
- 2026-05-27: Implemented the model-agnostic contract/harness and fake-provider tests. A focused test initially exposed that deterministic display fields also needed prompt/transcript redaction before entering the fact packet; fixed by sanitizing deterministic packet fields through the same bounded redaction path. Validation passed: focused tests, `npm run typecheck`, `npm run build`, full `npm test`, and import-boundary source inspection. Evidence recorded in `evidence:20260527-local-diagnosis-model-contract-harness-validation`. Moved to review pending audit.
- 2026-05-27: Recorded `audit:20260527-local-diagnosis-model-contract-harness-review` with verdict `changes-needed`. Set ticket back to active for follow-up on FIND-001 and FIND-002.
- 2026-05-27: Follow-up implementation addressed audit blockers only. Added non-home absolute path redaction before fact-packet/prompt use, bounded/valid ISO evidence timestamps with malformed/raw timestamps omitted, stricter unsupported-fact/action output rejection, and regression tests for `/workspace`/`/opt`/`/mnt`/`/var/lib`, malformed timestamp metadata, `The wrong file changed.`, and `Add a test.` Validation passed: focused tests, typecheck, build, full test suite, and source inspection. Evidence refreshed in `evidence:20260527-local-diagnosis-model-contract-harness-validation`. Moved to review for follow-up audit; not closed.
- 2026-05-27: Recorded `audit:20260527-local-diagnosis-model-contract-harness-followup-review` with verdict `changes-needed`. Set ticket back to active for remaining path-like URI/space-tail redaction and modal action-phrasing rejection.
- 2026-05-27: Second follow-up implementation addressed only the remaining follow-up audit blockers. Hardened path redaction/rejection for file-URI local paths, spaced local paths, colon-prefixed/equivalent local path variants, and partial-redaction path tails. Hardened output validation for modal action/recommendation wording before unsupported-fact token checks. Added regression coverage for fact-packet/prompt construction and output validation. Validation passed: focused tests, `npm run typecheck`, `npm run build`, full `npm test`, and source inspection. Evidence refreshed in `evidence:20260527-local-diagnosis-model-contract-harness-validation`. Moved to review; not closed.
- 2026-05-27: Recorded `audit:20260527-local-diagnosis-model-contract-harness-second-followup-review` with verdict `changes-needed`. Set ticket back to active for the remaining `can` modal action-phrasing bypass.
- 2026-05-27: Third follow-up implementation addressed only the remaining second-follow-up audit blocker. Added `can` to modal action-phrasing rejection before unsupported-fact validation and regression coverage for the four audited `can` examples with supported `test`, `file`, and `update` facts. Validation passed: focused tests, `npm run typecheck`, `npm run build`, full `npm test`, and source inspection. Evidence refreshed in `evidence:20260527-local-diagnosis-model-contract-harness-validation`. Moved to review; not closed.
- 2026-05-27: Recorded `audit:20260527-local-diagnosis-model-contract-harness-third-followup-review` with verdict `changes-needed`. Set ticket back to active for the remaining `need(s) to`, `has to`, and `have to` action-phrasing bypass.
- 2026-05-27: Fourth follow-up implementation addressed only the remaining third-follow-up audit blocker. Broadened modal action-phrasing rejection to cover `need(s) to`, `has to`, and `have to` forms and extended the supported-token regression test to the audited examples. Validation passed: focused tests, `npm run typecheck`, `npm run build`, full `npm test`, source inspection, and `git diff --check`. Evidence refreshed in `evidence:20260527-local-diagnosis-model-contract-harness-validation`. Moved to review; not closed.
- 2026-05-27: Recorded `audit:20260527-local-diagnosis-model-contract-harness-fourth-followup-review` with verdict `changes-needed`. Set ticket back to active for objectless obligation/action phrasing.
- 2026-05-27: Fifth follow-up implementation addressed only the remaining fourth-follow-up audit blocker. Generalized modal/obligation action rejection so action verbs are unsafe whether or not they have an explicit object, and extended regression coverage to the audited objectless examples. Validation passed: focused tests, `npm run typecheck`, `npm run build`, full `npm test`, source inspection, and `git diff --check`. Evidence refreshed in `evidence:20260527-local-diagnosis-model-contract-harness-validation`. Moved to review; not closed.
- 2026-05-27: Recorded `audit:20260527-local-diagnosis-model-contract-harness-fifth-followup-review` with verdict `changes-needed`. Set ticket back to active for actor+modal+domain-action advice bypasses.
- 2026-05-27: Sixth follow-up implementation addressed only the remaining fifth-follow-up audit blocker. Replaced the narrow modal action-verb list with a broader actor+modal+verb fail-closed pattern and added regression coverage for the audited `rerun`, `review`, and `reinstall` examples. Validation passed: focused tests, `npm run typecheck`, `npm run build`, full `npm test`, source inspection, and `git diff --check`. Evidence refreshed in `evidence:20260527-local-diagnosis-model-contract-harness-validation`. Moved to review; not closed.
- 2026-05-27: Recorded `audit:20260527-local-diagnosis-model-contract-harness-sixth-followup-review` with verdict `clear`. Closed the ticket with residual heuristic-output and future-provider-locality risks named.
