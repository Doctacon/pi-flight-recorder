# Guided Reflection Action Flow

ID: ticket:20260523-guided-reflection-action-flow
Type: Ticket
Status: review
Created: 2026-05-23
Updated: 2026-05-23
Risk: medium - changes user-facing reflection review behavior and feedback recording path
Priority: high - first visible step from command choreography to guided UX
Depends On: ticket:20260523-interactive-review-ui-primitives

## Summary

Add an interactive review path for reflection proposals so the user can select a proposal and action through Pi-native UI instead of copying proposal IDs into `/flight-feedback`. The closure claim is that existing feedback actions for reflection proposals can be applied through a guided TUI flow, while commands remain as fallback.

## Related Records

- `plan:20260523-reflection-rule-promotion-ux` - defines the interactive review route.
- `ticket:20260523-interactive-review-ui-primitives` - provides reusable guided UI helper(s).
- `ticket:20260523-reflection-ui-actions` - existing `/flight-reflect` digest and proposal output.
- `ticket:20260523-extension-feedback-controls` - existing feedback actions and suppression semantics.
- `src/pi-extension.ts`, `src/reflection.ts`, `src/storage.ts` - likely affected source.

- `audit:20260523-interactive-rule-promotion-review` - follow-up review of implementation; verdict `concerns` due missing real TUI evidence, no material automated-scope blockers.

## Scope

May change:

- `src/pi-extension.ts` to add `/flight-review` and/or `/flight-reflect --interactive`.
- Reflection formatting to include concise command fallback hints.
- Tests for fake-Pi interactive proposal/action selection.
- Docs for the guided review path.

Must not change:

- No active rule injection.
- No automatic rule activation.
- No custom TUI component unless the primitive ticket proves built-ins are insufficient.
- No model calls unless user explicitly requested existing model-assisted reflection behavior.

Action scope:

- Should support `useful`, `wrong-match`, `snooze`, `silence-pattern`, and `promote-later` for proposals/clusters.
- `make-rule` may either route to the guided rule draft flow when available or report that rule drafting requires the next slice; do not silently no-op.

## Acceptance

- ACC-001: `/flight-review` or `/flight-reflect --interactive` lists eligible proposals and lets the user select one through a fake-Pi UI test.
  - Evidence: fake-Pi command test.

- ACC-002: The selected feedback action is recorded against the correct proposal/cluster/signature and affects later reflection eligibility where applicable.
  - Evidence: storage/fake-Pi tests for useful/wrong/snooze/silence at minimum.

- ACC-003: Cancel/timeout leaves storage unchanged and reports a friendly no-action outcome.
  - Evidence: fake-Pi cancellation test.

- ACC-004: Non-interactive fallback remains available through existing `/flight-feedback` command and is mentioned in output/docs.
  - Evidence: docs or status/output snapshot.

## Current State

Implementation is complete and in review. Automated validation evidence is recorded in `evidence:20260523-interactive-rule-promotion-validation`: `npm run typecheck`, `npm test` (13 files, 62 tests), `npm run build`, and `npm pack --dry-run` passed. Follow-up audit `audit:20260523-interactive-rule-promotion-review` returned `concerns` with no material code blockers in the automated scope; real TUI validation remains plan-level blocked follow-up.

## Journal

- 2026-05-23: Created ticket from `plan:20260523-reflection-rule-promotion-ux` to make reflection action selection interactive before adding rule approval.
- 2026-05-23: Implemented this slice as part of `plan:20260523-reflection-rule-promotion-ux`; moved to review with evidence `evidence:20260523-interactive-rule-promotion-validation`.
- 2026-05-23: Follow-up audit `audit:20260523-interactive-rule-promotion-review` returned `concerns` with no material code blockers for this automated implementation scope.
- 2026-05-23: First real TUI attempt showed action selection lacked proposal context; updated `/flight-review` choices/prompts to include title, summary, likely fix, confidence, and ID, with tests and validation re-run.
