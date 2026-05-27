# Flight Learn Focused Card Integration

ID: ticket:20260527-flight-learn-focused-card-integration
Type: Ticket
Status: closed
Created: 2026-05-27
Updated: 2026-05-27
Risk: medium - replaces the production interactive `/flight-learn` pending-delta UI while preserving route/storage/fallback semantics.
Priority: high - needed after the render harness proves the focused-card shape.
Depends On: ticket:20260527-flight-learn-focused-card-render-harness

## Summary

Wire the focused-card pending-delta review flow into the real `/flight-learn` custom UI path. This ticket should replace the split-pane/table experience in production while preserving the existing result contract: edit fields, route-selected handoff to the `Why this follow-up?` editor, dismiss, skip, cancel, no-custom-UI fallback, and candidate-only storage behavior.

Single closure claim: `/flight-learn` pending-delta review uses the focused-card interaction in production and preserves all existing safe route/storage semantics.

## Related Records

- `plan:20260527-flight-learn-focused-card-redesign` - owns sequencing and proof posture.
- `ticket:20260527-flight-learn-focused-card-render-harness` - prerequisite focused-card renderer/prototype and render evidence.
- `spec:flight-learn-inbox-ux` - behavior contract for the custom inbox and focused-card requirements.
- `spec:visible-command-surface` - prevents adding new top-level commands.
- `spec:delta-artifact-learning-loop` - requires candidate-only, human-gated artifact behavior.
- `ticket:20260525-flight-learn-rationale-editor-fallback` - preserves the decision that route selection exits custom UI and uses Pi's normal editor for `Why this follow-up?`.
- `ticket:20260525-flight-learn-custom-tui-keyboard-input` - records keyboard hardening that should not regress.

## Scope

In scope:

- Replace the production pending-delta custom UI path with the focused-card flow proven by the render harness.
- Preserve `FlightLearnDeltaInboxResult` semantics unless a linked spec/ticket explicitly revises them.
- Preserve `route-selected` behavior: selecting a follow-up closes the custom UI and opens the normal Pi editor prompt `Why this follow-up?`.
- Preserve edit, skip, dismiss, cancel, and evidence expansion interactions or provide equivalent interactions documented in the UI.
- Preserve width safety, theme use, and keyboard discoverability.
- Update focused component tests and extension tests.
- Record validation evidence for tests/typecheck/build/render artifact.

Out of scope:

- Adding or exposing new slash commands.
- Storage migrations.
- Automatic route classification or model/provider calls.
- Auto-applying Flight Rules, Loom records, docs, source edits, tests, prompts, skills, or artifact candidates.
- Artifact candidate outcome follow-up UI.
- Real installed Pi validation; that belongs to the dependent validation ticket.

Likely read scope:

- Source/tests from the render harness ticket.
- `src/flight-learn-inbox.ts`
- `src/pi-extension.ts`
- `src/pi-extension-types.ts`
- `src/flight-learn-inbox.test.ts`
- `src/pi-extension.test.ts`
- related tickets/specs listed above

Likely write scope:

- `src/flight-learn-inbox.ts`
- `src/flight-learn-inbox.test.ts`
- `src/pi-extension.ts` only if integration seam changes are required
- `src/pi-extension.test.ts`
- `.loom/evidence/artifacts/20260527-flight-learn-focused-card-integration/`
- `.loom/evidence/20260527-flight-learn-focused-card-integration-validation.md`
- `.loom/audit/20260527-flight-learn-focused-card-integration-review.md` if a Ralph audit is run
- this ticket's Current State/Journal

Stop conditions:

- If the focused-card renderer from the prerequisite ticket is not materially better than the split-pane layout, do not integrate it.
- If route/storage/fallback semantics require redesign rather than preservation, stop and return to spec/plan shaping.
- If tests reveal stale assumptions in prior keyboard/fallback tickets, update this ticket or split a compatibility ticket before continuing.

## Acceptance

- ACC-001: Running the custom `/flight-learn` pending-delta path renders the focused-card flow instead of the split-pane/table UI.
  - Evidence: focused extension/component tests and render artifact from the production component path.
  - Audit: challenge against `spec:flight-learn-inbox-ux#REQ-015` and `#SCN-006`.

- ACC-002: Route selection emits the same safe `route-selected` handoff used before, and `maybeHandleDeltaInbox` still opens the normal Pi editor with `Why this follow-up?` before storing an accepted artifact candidate.
  - Evidence: `src/pi-extension.test.ts` coverage for custom inbox route selection and artifact candidate creation with `applied=false`.
  - Audit: challenge no-auto-apply and candidate-only behavior against `spec:delta-artifact-learning-loop`.

- ACC-003: Edit, evidence expansion, dismiss, skip, cancel/quit, and route navigation remain discoverable and functional.
  - Evidence: component input tests for each interaction and updated key-hint assertions.
  - Audit: challenge keyboard behavior against prior CSI-u/Kitty hardening and ordinary Pi conventions.

- ACC-004: No default visible command surface changes, no hosted/model-provider calls, no classifier automation, and no storage migration are introduced.
  - Evidence: command-registration tests still pass; source diff inspection; full test suite.
  - Audit: challenge hidden scope creep and accidental command registration.

- ACC-005: Focused tests, full tests, typecheck, build, and diff check pass, and evidence records preserve outputs.
  - Evidence: `npm test -- src/flight-learn-inbox.test.ts src/pi-extension.test.ts`, `npm test`, `npm run typecheck`, `npm run build`, and `git diff --check` outputs.
  - Audit: separate Ralph audit is recommended before closure because the ticket changes primary UX and must preserve semantics.

## Current State

Closed. Production `askFlightLearnDeltaInbox(...)` now constructs the custom pending-delta component with `layout: "focused-card"`, so `/flight-learn` uses the focused-card flow when interactive custom UI is available. The route-selected editor handoff, candidate-only storage, fallback/no-custom behavior, command surface, no-model/no-classifier boundaries, and no-auto-apply behavior were preserved.

What changed:

- `src/flight-learn-inbox.ts` wires production `askFlightLearnDeltaInbox(...)` to `layout: "focused-card"`;
- `src/pi-extension.test.ts` now asserts production custom inbox renders `Flight Learn — Issue 1 of 1`, `Choose a follow-up`, and no `Pending deltas` split-pane table;
- `src/flight-learn-inbox.test.ts` now exercises focused-card interactions for edit/save, edit-cancel rollback, evidence expansion, route selection, CSI-u input, dismiss, skip, cancel, and width safety;
- deterministic production-wrapper render artifact is preserved under `.loom/evidence/artifacts/20260527-flight-learn-focused-card-integration/`.

Evidence:

- `evidence:20260527-flight-learn-focused-card-integration-validation`
  - focused tests: 2 files / 33 tests passed;
  - full tests: 18 files / 91 tests passed;
  - `npm run typecheck` passed;
  - `npm run build` passed;
  - targeted `git diff --check` passed;
  - production wrapper render artifact captured collapsed and expanded focused-card states.

Audit:

- `audit:20260527-flight-learn-focused-card-integration-review` verdict `clear`; no material findings.

Residual risk:

- no real interactive Pi screenshot/PTY proof yet;
- vertical route rows still use left/right route navigation, which is explicit and tested but should be watched in live validation;
- direct Pi TUI primitive dependency adoption remains unresolved because this integration uses the existing custom component contract rather than adding a package dependency.

## Journal

- 2026-05-27: Created ticket from `plan:20260527-flight-learn-focused-card-redesign` as the production integration slice after the render harness.
- 2026-05-27: Set Status `active` after confirming `ticket:20260527-flight-learn-focused-card-render-harness` is closed with evidence and audit disposition.
- 2026-05-27: Wired production `askFlightLearnDeltaInbox(...)` to create the component with `layout: "focused-card"` and updated extension/component tests for the production focused-card path.
- 2026-05-27: Recorded validation in `evidence:20260527-flight-learn-focused-card-integration-validation` after focused tests, full tests, typecheck, build, diff-check, and production-wrapper render artifact generation.
- 2026-05-27: Ran bounded Ralph review and recorded `audit:20260527-flight-learn-focused-card-integration-review`; audit verdict `clear` with no material findings.
- 2026-05-27: Closed ticket. Next execution unit is real installed Pi validation: `ticket:20260527-flight-learn-focused-card-real-pi-validation`.
