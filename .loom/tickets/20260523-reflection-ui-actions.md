# Reflection UI Actions

ID: ticket:20260523-reflection-ui-actions
Type: Ticket
Status: closed
Created: 2026-05-23
Updated: 2026-05-23
Risk: medium - UX determines whether reflections are useful or another source of noise
Priority: high - makes pattern proposals visible and steerable in Pi
Depends On: ticket:20260523-reflection-proposal-generator

## Summary

Expose reflection proposals inside Pi through `/flight-reflect`, status/digest rendering, and feedback actions. The closure claim is that users can ask for or receive a concise pattern-level reflection and act on it without leaving Pi.

## Related Records

- `spec:seamless-failure-memory-ux` - REQ-010 through REQ-014 and reflection quality bar.
- `ticket:20260523-extension-feedback-controls` - shared feedback/action storage.
- `ticket:20260523-reflection-proposal-generator` - proposal records and generation boundary.
- `plan:20260523-seamless-failure-memory-ux` - final user-facing reflection slice.

## Scope

May change:

- Pi extension commands/rendering, reflection formatting, feedback command integration, docs/tests.

Must not change:

- No autonomous fixes.
- No automatic Loom writes; only `promote-later` intent.
- No raw session dumps in UI.

The first UI can be command/notification based. Rich custom renderers can be deferred unless needed for evidence readability.

## Acceptance

- ACC-001: `/flight-reflect` returns a bounded digest of eligible clusters/proposals with evidence, limits, and actions.
  - Evidence: Fake-Pi command test and snapshot.
  - Audit: Review output groups repeated failures rather than listing every occurrence.

- ACC-002: Reflection digest respects snooze/silence and trigger cooldown state.
  - Evidence: Tests over feedback state.
  - Audit: Review user controls are honored.

- ACC-003: Feedback actions from a reflection update proposal/cluster state and influence future digests.
  - Evidence: Fake-Pi command + storage tests.
  - Audit: Review action semantics are clear and reversible where appropriate.

- ACC-004: UI distinguishes local deterministic proposals from model-assisted proposals.
  - Evidence: Snapshot tests for both modes.
  - Audit: Review privacy disclosure is visible but concise.

## Current State

Closed. The seamless UX implementation review state is reconciled for this ticket's bounded slice. Implementation validation is recorded across `evidence:20260523-seamless-ux-validation`, `evidence:20260523-live-pi-tui-smoke`, `evidence:20260523-findings-fix-validation`, `evidence:20260523-installed-package-high-confidence-smoke`, and `evidence:20260523-high-confidence-visible-suggestion-tui`. `audit:20260523-seamless-ux-followup-review` cleared FIND-001 through FIND-005, and `audit:20260523-high-confidence-visible-suggestion-review` cleared the remaining visible high-confidence suggestion gap. `audit:20260523-final-review-state-reconciliation-review` found no material issue with closing stale seamless implementation tickets.

Residual limits remain routed to `ticket:20260523-real-corpus-evaluation-and-tuning` and `plan:20260523-seamless-failure-memory-ux`: hosted/real model-provider reflection and long-run corpus precision/noise tuning are not claimed here.

## Journal

- 2026-05-23: Created ticket for the Pi-facing reflection experience.
- 2026-05-23: Implemented seamless UX slice for this ticket and moved to review with validation evidence in `evidence:20260523-seamless-ux-validation`.
- 2026-05-23: Review run recorded `audit:20260523-seamless-ux-review` with verdict `changes-needed`; pending disposition: FIND-003.
- 2026-05-23: Dispositioned review finding(s) for this ticket with `evidence:20260523-live-pi-tui-smoke` and/or `evidence:20260523-findings-fix-validation`; follow-up audit `audit:20260523-seamless-ux-followup-review` returned `clear` in the inspected scope; residual high-confidence notification/model-provider/long-run tuning gaps remain as follow-up where applicable.
- 2026-05-23: Final review-state reconciliation closed this stale `review` ticket with supporting evidence/audit links; residual provider/corpus limits remain outside this ticket.
