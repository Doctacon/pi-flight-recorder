# Manual Artifact Routing Review

ID: ticket:20260523-manual-artifact-routing-review
Type: Ticket
Status: open
Created: 2026-05-23
Updated: 2026-05-23
Risk: high - this UX encodes the product judgment about what kinds of artifacts can bridge deltas, and a weak flow would bias users toward rules instead of the right intervention
Priority: medium - essential before any classifier or artifact drafting is trustworthy
Depends On: ticket:20260523-delta-record-data-model

## Summary

Expose a Pi-native review flow for expectation deltas. The user should be able to inspect a delta, refine expectation/reality if needed, choose an artifact route, record rationale, and store the route without applying or generating durable artifacts automatically.

## Related Records

- `plan:20260523-delta-artifact-learning-loop` - owns sequencing and manual-first strategy.
- `spec:delta-artifact-learning-loop#REQ-005` through `#REQ-008` - manual routing, artifact type taxonomy, candidate state, and human gates.
- `ticket:20260523-delta-record-data-model` - data substrate.
- `ticket:20260523-delta-capture-signals` - optional upstream source of reviewable candidates.
- `plan:20260523-reflection-rule-promotion-ux` - existing guided review UX and Flight Rule flow to coexist with, not replace.
- `src/interactive-review.ts`, `src/pi-extension.ts` - likely UI/command seams.

## Scope

May change:

- Pi extension command(s) or guided UI for listing/reviewing delta candidates and choosing artifact routes.
- Interactive helper usage/tests as needed for selection/editor/confirmation.
- Storage updates to mark route/rationale/status on delta records.
- Fallback command text for non-interactive/no-UI paths.

Must not change:

- No source code/docs/Loom/rule/skill mutation.
- No artifact draft generation beyond storing route/rationale; drafting belongs to `ticket:20260523-artifact-candidate-drafts`.
- No classifier/model route selection.
- No removal or regression of existing `/flight-review` rule promotion flow.

UX constraints:

- Artifact choices must make non-rule interventions visible: code-legibility/refactor ticket, test/check, Loom record, prompt/context doc, skill/template, observe/no-artifact.
- The flow should ask for or preserve rationale because the rationale is the future classifier/corpus signal.
- Cancellation must leave no misleading routed/applied state.

## Acceptance

- ACC-001: A user can review a pending delta candidate through Pi-native selection/editor prompts and see expectation, reality, evidence summary, and signal reason.
  - Evidence: fake-Pi UI transcript tests and snapshot/assertions over prompt labels/choices.
  - Audit: Review should challenge whether enough context appears to route without ID-copying.

- ACC-002: The user can select an artifact type and record routing rationale, and the delta state reflects routed status without creating or applying the artifact.
  - Evidence: storage/UI tests asserting route type, rationale, and no artifact application side effects.
  - Audit: Review should inspect human-gate preservation.

- ACC-003: The user can dismiss or choose observe/no-artifact without losing evidence provenance.
  - Evidence: tests for dismiss/observe paths.
  - Audit: Review should ensure observe/no-artifact is not treated as failure.

- ACC-004: No-UI fallback is explicit and scriptable.
  - Evidence: tests or command output showing fallback commands/usage.
  - Audit: Review should ensure fallback does not become primary ID choreography for normal UX.

- ACC-005: Existing Flight Rule guided review tests continue to pass.
  - Evidence: `npm run typecheck`, `npm test`, `npm run build`.
  - Audit: Regression review should compare the two guided review flows.

## Current State

Ready after `ticket:20260523-delta-record-data-model`; it can consume detector candidates when `ticket:20260523-delta-capture-signals` lands, but should also work with manually seeded delta records for vertical testing.

## Journal

- 2026-05-23: Created to preserve the manual reflective judgment step before any classifier or artifact generator is introduced.
