# Reflection UI Actions

ID: ticket:20260523-reflection-ui-actions
Type: Ticket
Status: open
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

Ready after proposal generator. No reflection UI exists.

## Journal

- 2026-05-23: Created ticket for the Pi-facing reflection experience.
