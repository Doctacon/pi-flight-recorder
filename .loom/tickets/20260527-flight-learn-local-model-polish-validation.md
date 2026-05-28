# Flight Learn Local Model Polish Validation

ID: ticket:20260527-flight-learn-local-model-polish-validation
Type: Ticket
Status: closed
Created: 2026-05-27
Updated: 2026-05-27
Risk: high - release claims about local model behavior require real runtime and real Pi evidence, while unavailable-runtime cases must not be laundered through mocks.
Priority: medium - validation is mandatory before claiming model-polished `/flight-learn` behavior.
Depends On: ticket:20260527-flight-learn-local-model-polish-integration

## Summary

Validate optional local-model diagnosis polish after integration. This ticket must distinguish fake-provider/unit proof, disabled/fallback real Pi proof, and actual local Bonsai/runtime proof. If no approved local runtime/model is available, the real-model portion must be marked blocked instead of claimed.

Single closure claim: the project has honest evidence for the integrated local-model polish path, including deterministic fallback safety and, when explicitly authorized runtime/model are available, real Pi proof with a local model.

## Related Records

- `plan:20260527-flight-learn-local-model-diagnosis-polish` - parent strategy and sequencing.
- `evidence:20260527-flight-learn-local-model-polish-validation` - validation evidence and real-model blocker.
- `audit:20260527-flight-learn-local-model-polish-validation-review` - validation audit; verdict `clear` with blocked real-model limitation preserved.
- `research:20260527-local-diagnosis-model-runtime` - identifies expected runtime/model validation constraints.
- `ticket:20260527-flight-learn-local-model-polish-integration` - implementation slice to validate.
- `spec:flight-learn-inbox-ux` - REQ-024 through REQ-029 and SCN-008/SCN-009 define validation expectations.
- Prior real Pi validation records for deterministic/focused-card behavior, especially `evidence:20260527-flight-learn-diagnosis-real-pi-validation`, are useful precedent for artifact shape.

## Scope

In scope:

- Run focused tests proving fake-provider valid/fallback behavior.
- Run typecheck/build/full tests or justify narrower validation if environment prevents full suite.
- Run a disposable real Pi validation with model polish disabled/unavailable to prove deterministic fallback and normal `/flight-learn` remain usable.
- If the operator has explicitly installed/authorized a local runtime and model, run a disposable real Pi validation with the configured local model enabled.
- For Bonsai validation, prefer the smallest configured Bonsai model first, likely Bonsai 1.7B GGUF through `llama.cpp`, then record if 4B/8B is needed for output quality.
- Capture evidence artifacts under `.loom/evidence/artifacts/...` and write a corresponding evidence record.
- Verify storage safety after route submission: accepted artifact candidate remains candidate-only/unapplied, no flight rules/source/docs/Loom mutation, and model wording is not persisted into source-of-truth delta fields.
- Record blocked status honestly if no approved real local runtime/model is available.

Out of scope:

- Implementing fixes discovered by validation; file new/updated tickets for defects unless tiny scoped fixes are explicitly authorized in a separate execution pass.
- Downloading or installing model weights without explicit operator action.
- Hosted provider validation.
- Long-run corpus quality tuning.
- Global package install claims beyond the validation environment.

Likely write scope:

- `.loom/evidence/...` and `.loom/evidence/artifacts/...` for validation observations.
- `.loom/audit/...` only if a later review agent performs an audit; do not fabricate review.
- This ticket's state/journal.
- Source edits only if a separate implementation/fix ticket is created or this ticket is explicitly rescoped by the operator.

Stop conditions:

- If the model runtime/model path is unavailable, mark real-model validation blocked and still validate disabled/fallback behavior.
- If validation shows hosted/non-loopback access, automatic download, raw session leakage, or source-of-truth mutation, stop and route back to implementation tickets/spec.
- If model-polished output is hallucinated, unsafe, overlong, or confusing despite passing validators, stop and route to contract/validator follow-up.
- If real Pi TUI automation cannot establish package provenance, do not claim installed-package behavior.

## Acceptance

- ACC-001: Fake-provider and deterministic fallback validation is recorded.
  - Evidence: test artifacts and evidence record show valid fake output, invalid/timeout fallback, no storage/routing side effects, typecheck/build/tests status.
  - Audit: review should challenge whether fake-provider proof is being overstated as real-model proof.

- ACC-002: Real Pi disabled/unavailable fallback is validated.
  - Evidence: disposable real Pi artifacts show `/flight` command palette still exposes only `flight-status`/`flight-learn`, `/flight-learn` renders deterministic diagnosis when model polish is disabled/unavailable, and normal route/editor/storage behavior still works.
  - Audit: review should challenge package provenance and whether the Pi run loaded the built extension under test.

- ACC-003: Real local-model proof exists, or the ticket honestly records it as blocked.
  - Evidence: if available, artifacts show explicitly configured local runtime/model, local-only invocation, model-polished display disclosure, fallback behavior, and no source-of-truth mutation. If unavailable, Current State and evidence record name the blocker and avoid claiming real-model behavior.
  - Audit: review should challenge network/locality, model provenance, and overclaiming.

- ACC-004: Candidate-only safety remains true after a real route flow.
  - Evidence: DB/status artifacts show accepted artifact candidate with `applied=false` and no active flight rule/source/docs/Loom mutation after route submission.
  - Audit: review should challenge whether model output influenced route ranking or persisted fields.

- ACC-005: Evidence and audit posture are honest.
  - Evidence: evidence record links artifacts and states limits; audit record exists only if a real audit was performed, otherwise ticket remains review/open as appropriate.
  - Audit: review should challenge unsupported closure.

## Current State

Closed as validation complete with real-model proof blocked. Validation evidence is recorded in `evidence:20260527-flight-learn-local-model-polish-validation`. Focused fake-provider/adapter tests passed (4 files / 63 tests), typecheck passed, build passed, full tests passed (21 files / 126 tests), and diff checks passed. Disposable real Pi project-local install loaded `pi-extension.js`; `/flight` showed only `flight-status` and `flight-learn`; `/flight-learn delta-review --local-model-polish --local-model-url http://127.0.0.1:9` rendered `Local model unavailable (runtime unavailable); deterministic wording shown.`; route submission stored an accepted `test-check` artifact candidate with `applied=false` and zero rule records. Status privacy copy includes the explicit local-polish model-call path.

Actual real Bonsai/`llama.cpp` proof was blocked at this ticket's closure: no approved local runtime/model env or binary was available, and no download/install/hosted/non-loopback probe was attempted. Audit `audit:20260527-flight-learn-local-model-polish-validation-review` returned `clear` on the condition that closure preserved this limitation. That limitation was later addressed by follow-up `ticket:20260527-real-bonsai-local-model-validation`, which proves the real local-model path can work on one supported synthetic fixture but does not prove broad Bonsai quality.

## Journal

- 2026-05-27: Created as the final validation slice for optional Bonsai/local-model diagnosis polish. The ticket separates fake-provider proof, real Pi fallback proof, and actual real-model proof to prevent evidence laundering.
- 2026-05-27: Set active after integration closed. Beginning focused/unit validation, disposable real Pi fallback validation, and real-model availability check without downloading/installing model weights.
- 2026-05-27: Recorded `evidence:20260527-flight-learn-local-model-polish-validation` with focused tests, typecheck, build, full tests, diff checks, real Pi fallback/card/route/status artifacts, and an explicit real Bonsai/`llama.cpp` blocker. Moved to review.
- 2026-05-27: Recorded `audit:20260527-flight-learn-local-model-polish-validation-review` with verdict `clear`. Closed as validation complete with real-model proof blocked/unproven.
- 2026-05-27: Follow-up `ticket:20260527-real-bonsai-local-model-validation` later unblocked and validated Bonsai 1.7B Q1_0 through `llama.cpp` for one supported fixture; this ticket remains historically closed with its original blocked-state evidence.
