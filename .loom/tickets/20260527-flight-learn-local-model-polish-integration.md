# Flight Learn Local Model Polish Integration

ID: ticket:20260527-flight-learn-local-model-polish-integration
Type: Ticket
Status: open
Created: 2026-05-27
Updated: 2026-05-27
Risk: high - this touches the primary `/flight-learn` review UI and must not change routing, storage, artifact, or command-surface semantics.
Priority: medium - visible value appears here, but only after the contract and adapter are proven.
Depends On: ticket:20260527-local-diagnosis-model-adapter

## Summary

Wire the validated optional local-model diagnosis polish path into the `/flight-learn` focused-card inbox. Deterministic diagnosis remains the default and fallback; model-polished text appears only when explicitly enabled, validated, and safe.

Single closure claim: `/flight-learn` can display optional local-model-polished diagnosis wording without changing candidate-only routing, evidence expansion, editor fallback, storage, artifact, rule, or visible command behavior.

## Related Records

- `plan:20260527-flight-learn-local-model-diagnosis-polish` - parent strategy and sequencing.
- `ticket:20260527-local-diagnosis-model-adapter` - provides the explicit local runtime adapter.
- `ticket:20260527-local-diagnosis-model-contract-harness` - owns prompt/schema/validation/fallback semantics.
- `spec:flight-learn-inbox-ux` - REQ-024 through REQ-029 and SCN-008/SCN-009 define optional model polish behavior.
- `spec:visible-command-surface` - default visible commands must remain only `/flight-status` and `/flight-learn`.
- `ticket:20260527-flight-learn-diagnosis-card-integration` - completed deterministic focused-card diagnosis integration.
- `src/flight-learn-inbox.ts` - likely focused-card renderer and custom UI seam.
- `src/pi-extension.ts` - likely command/options seam.
- `src/pi-extension.test.ts` and `src/flight-learn-inbox.test.ts` - likely UI/command test seams.

## Scope

In scope:

- Add optional model-polish resolution to the `/flight-learn` delta inbox path after deterministic diagnosis is built.
- Keep deterministic diagnosis as default, fallback, and test oracle.
- Make the opt-in path recoverable and explicit. It may use project/local settings, environment variables, or a `/flight-learn` flag/subcommand shape chosen by earlier tickets, but must not add a new visible top-level command.
- Render validated model-polished wording only in display fields such as `Problem`, `What happened?`, `Why it matters`, and optional `Expected` when supported by the contract.
- Add unobtrusive disclosure when model phrasing is used, e.g. `Local model phrasing; deterministic fallback available`.
- Preserve secondary raw details under existing evidence/provenance affordances.
- Preserve route selection, `Why this follow-up?` editor fallback, artifact candidate creation, `applied=false`, no active rule/source/doc/Loom mutation, and visible command surface.
- Add tests for disabled default, enabled valid model output, enabled fallback/invalid output, disclosure, and no storage/routing side effects.

Out of scope:

- Implementing or changing the local runtime adapter.
- Tuning Bonsai prompts against real private corpora.
- Adding classifier automation, route ranking, or auto-apply behavior.
- Changing visible command registration beyond existing `/flight-status` and `/flight-learn`.
- Replacing the focused-card custom renderer with new Pi TUI dependencies.
- Real Pi validation; that belongs to `ticket:20260527-flight-learn-local-model-polish-validation`.

Likely write scope:

- `src/flight-learn-inbox.ts`.
- `src/pi-extension.ts` and option/config handling only if required by the adapter.
- Focused tests in `src/flight-learn-inbox.test.ts`, `src/pi-extension.test.ts`, and/or new test files.

Stop conditions:

- If integration requires changing storage/routing semantics, stop and route back to the spec/plan.
- If enabling model polish would make `/flight-learn` noticeably block without clear timeout/fallback, stop and split UI responsiveness handling.
- If the opt-in UX would add visible command clutter, stop and route to `spec:visible-command-surface`.
- If model-polished wording appears authoritative or hides raw evidence, stop and revise UI copy.

## Acceptance

- ACC-001: `/flight-learn` deterministic behavior remains unchanged by default.
  - Evidence: existing focused-card tests still pass and new tests show no model call without explicit enablement.
  - Audit: review should challenge regressions to command surface or default UI text.

- ACC-002: Valid optional local-model wording can be displayed when explicitly enabled.
  - Evidence: fake/adapter tests show validated model phrasing appears in primary diagnosis fields and includes unobtrusive disclosure.
  - Audit: review should challenge whether the UI overstates model authority.

- ACC-003: Invalid, unavailable, slow, or unsafe model behavior falls back to deterministic text.
  - Evidence: tests show fallback rendering and fallback reason without interrupting review.
  - Audit: review should challenge whether fallback leaks raw errors or blocks the inbox.

- ACC-004: Routing/storage/artifact/rule/source/Loom semantics do not change.
  - Evidence: tests or inspection artifact show route selection still goes through human rationale, stored candidates remain unapplied, and local model output is not persisted into source-of-truth fields.
  - Audit: review should challenge accidental coupling between polished wording and route ranking or artifact content.

- ACC-005: Standard validation passes for the touched source boundary.
  - Evidence: focused tests, `npm run typecheck`, `npm run build`, full tests, and `git diff --check` or equivalent.
  - Audit: review should challenge any skipped UI/command tests.

## Current State

Open but not ready to execute until the local adapter ticket is closed. No source implementation has started. The first likely Ralph run should wire a fake/local-polish provider into the focused-card path and prove default/fallback behavior before any real runtime validation.

## Journal

- 2026-05-27: Created as the UI integration slice for optional Bonsai/local-model diagnosis polish. This ticket explicitly preserves the two-command surface and candidate-only learning semantics.
