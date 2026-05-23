# Reflection Trigger Scheduler

ID: ticket:20260523-reflection-trigger-scheduler
Type: Ticket
Status: open
Created: 2026-05-23
Updated: 2026-05-23
Risk: medium - trigger timing controls interruption/noise and background behavior
Priority: medium - reflection should happen at useful cadence, not every failure
Depends On: ticket:20260523-local-pattern-miner

## Summary

Add controllable reflection triggers for manual, threshold, idle/session-end, and optional daily digest modes. The closure claim is that repeated failure clusters can be scheduled for reflection at non-disruptive times with transparent status and settings.

## Related Records

- `spec:seamless-failure-memory-ux` - REQ-010 defines reflection trigger expectations.
- `ticket:20260523-local-pattern-miner` - supplies ranked clusters that triggers evaluate.
- `plan:20260523-seamless-failure-memory-ux` - scheduler bridges mining and proposal generation.

## Scope

May change:

- Trigger scheduler service, Pi extension lifecycle hooks, settings, tests, status output.

Must not change:

- No proposal text generation beyond returning selected cluster IDs.
- No model calls.
- No autonomous code edits.

Safe triggers should include `/flight-reflect` manual invocation, cluster-count threshold, idle/session-end if Pi exposes reliable events, and optional daily digest. If a Pi idle/session-end event is unavailable or ambiguous, document the fallback instead of faking it.

## Acceptance

- ACC-001: Manual trigger selects eligible clusters and returns a bounded reflection job plan.
  - Evidence: Unit/fake-Pi command test.
  - Audit: Review command is available even when automatic triggers are disabled.

- ACC-002: Threshold trigger marks a cluster eligible after repeated occurrences without interrupting active work.
  - Evidence: Scheduler test over synthetic occurrence timeline.
  - Audit: Review no per-error reflection spam.

- ACC-003: Idle/session-end/daily settings are persisted and visible through status, with unavailable Pi events documented honestly.
  - Evidence: Fake-Pi lifecycle tests or documented fallback.
  - Audit: Review status does not overclaim unsupported triggers.

- ACC-004: Trigger cooldown/snooze prevents repeatedly reflecting on the same cluster.
  - Evidence: Scheduler tests.
  - Audit: Review interaction with silence/snooze feedback.

## Current State

Ready after local pattern miner. No reflection scheduler exists.

## Journal

- 2026-05-23: Created ticket to make reflection cadence explicit and non-disruptive.
