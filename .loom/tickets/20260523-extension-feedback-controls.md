# Extension Feedback Controls

ID: ticket:20260523-extension-feedback-controls
Type: Ticket
Status: closed
Created: 2026-05-23
Updated: 2026-05-23
Risk: medium - feedback state changes future suggestion/reflection behavior
Priority: high - user needs control over noise and trust
Depends On: ticket:20260523-high-confidence-suggestion-ux

## Summary

Add Pi-native feedback and control actions for live suggestions and future reflections: useful, wrong match, already solved, snooze, silence pattern, promote later, and make rule/remember. The closure claim is that the user can correct or steer the system from inside Pi without leaving the flow.

## Related Records

- `spec:seamless-failure-memory-ux` - REQ-013 and REQ-014 define feedback/control expectations.
- `constitution:main` - human feedback gates promotion.
- `plan:20260523-seamless-failure-memory-ux` - feedback controls are reused by reflection tickets.
- `ticket:20260523-high-confidence-suggestion-ux` - suggestions need actions and suppression state.

## Scope

May change:

- Feedback storage schema, Pi commands, suggestion/reflection action helpers, tests, docs.

Must not change:

- No automatic Loom promotion yet unless stored as `promote-later` intent only.
- No autonomous rule enforcement beyond recording preferences/silence state.
- No reflection digest UI yet except shared action primitives.

Feedback should be local, inspectable, and tied to episode IDs, occurrence IDs, cluster IDs, and/or normalized signatures where applicable.

## Acceptance

- ACC-001: Pi commands or action-like commands record feedback for a suggestion/occurrence/signature.
  - Evidence: Fake-Pi command tests and storage tests.
  - Audit: Review invalid IDs/actions produce friendly messages.

- ACC-002: Snooze and silence pattern affect future live suggestion decisions.
  - Evidence: Test creates a silence/snooze record and asserts later matching failures do not notify.
  - Audit: Review status explains suppression reason.

- ACC-003: `promote-later` and `make-rule` are persisted as user intent without creating Loom records or durable rules automatically.
  - Evidence: Storage tests and docs.
  - Audit: Review no automatic promotion violates constitution feedback gate.

- ACC-004: Status shows recent feedback/silence state enough to troubleshoot why a match did or did not appear.
  - Evidence: Fake-Pi status snapshot test.
  - Audit: Review output is concise and not privacy-leaky.

## Current State

Closed. The seamless UX implementation review state is reconciled for this ticket's bounded slice. Implementation validation is recorded across `evidence:20260523-seamless-ux-validation`, `evidence:20260523-live-pi-tui-smoke`, `evidence:20260523-findings-fix-validation`, `evidence:20260523-installed-package-high-confidence-smoke`, and `evidence:20260523-high-confidence-visible-suggestion-tui`. `audit:20260523-seamless-ux-followup-review` cleared FIND-001 through FIND-005, and `audit:20260523-high-confidence-visible-suggestion-review` cleared the remaining visible high-confidence suggestion gap. `audit:20260523-final-review-state-reconciliation-review` found no material issue with closing stale seamless implementation tickets.

Residual limits remain routed to `ticket:20260523-real-corpus-evaluation-and-tuning` and `plan:20260523-seamless-failure-memory-ux`: hosted/real model-provider reflection and long-run corpus precision/noise tuning are not claimed here.

## Journal

- 2026-05-23: Created ticket to close the feedback/control loop for seamless UX.
- 2026-05-23: Implemented seamless UX slice for this ticket and moved to review with validation evidence in `evidence:20260523-seamless-ux-validation`.
- 2026-05-23: Review run recorded `audit:20260523-seamless-ux-review` with verdict `changes-needed`; pending disposition: FIND-003.
- 2026-05-23: Dispositioned review finding(s) for this ticket with `evidence:20260523-live-pi-tui-smoke` and/or `evidence:20260523-findings-fix-validation`; follow-up audit `audit:20260523-seamless-ux-followup-review` returned `clear` in the inspected scope; residual high-confidence notification/model-provider/long-run tuning gaps remain as follow-up where applicable.
- 2026-05-23: Final review-state reconciliation closed this stale `review` ticket with supporting evidence/audit links; residual provider/corpus limits remain outside this ticket.
