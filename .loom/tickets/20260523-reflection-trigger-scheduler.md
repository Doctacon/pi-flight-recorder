# Reflection Trigger Scheduler

ID: ticket:20260523-reflection-trigger-scheduler
Type: Ticket
Status: review
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

Implementation is complete and in review. Manual, threshold, and session-end trigger paths select eligible clusters with cooldown; daily digest remains a visible setting but no OS/background scheduler is installed. Evidence: `evidence:20260523-seamless-ux-validation` OBS-001, OBS-002.

Audit disposition: `audit:20260523-seamless-ux-review` returned `changes-needed`; FIND-003 addressed by scheduler consultation of active signature snooze/silence feedback and regression tests. Evidence: `evidence:20260523-findings-fix-validation` OBS-004. Follow-up audit `audit:20260523-seamless-ux-followup-review` returned `clear` for FIND-001 through FIND-005 in the inspected scope; remaining residual gaps are tracked as non-blocking follow-up/tuning unless this ticket explicitly covers high-confidence notification smoke or long-run corpus evaluation.

## Journal

- 2026-05-23: Created ticket to make reflection cadence explicit and non-disruptive.
- 2026-05-23: Implemented seamless UX slice for this ticket and moved to review with validation evidence in `evidence:20260523-seamless-ux-validation`.
- 2026-05-23: Review run recorded `audit:20260523-seamless-ux-review` with verdict `changes-needed`; pending disposition: FIND-003 and scheduler evidence gap.
- 2026-05-23: Dispositioned review finding(s) for this ticket with `evidence:20260523-live-pi-tui-smoke` and/or `evidence:20260523-findings-fix-validation`; follow-up audit `audit:20260523-seamless-ux-followup-review` returned `clear` in the inspected scope; residual high-confidence notification/model-provider/long-run tuning gaps remain as follow-up where applicable.
