# Watch CLI Controls

ID: ticket:20260522-watch-cli-controls
Type: Ticket
Status: review
Created: 2026-05-22
Updated: 2026-05-22
Risk: low - command wrapper over watcher/suggestion services
Priority: medium - users need to start, stop, and inspect live mode outside Pi
Depends On: ticket:20260522-session-watch-service

## Summary

Expose live monitoring controls through the CLI: watch start/stop/status, foreground mode, source/data-dir configuration, mode, debounce, confidence, and cooldown options. The closure claim is that a user can opt into automatic tracking from a terminal and see clear live status without entering Pi.

## Related Records

- `spec:live-failure-monitoring` - especially REQ-004, REQ-012, REQ-014, SCN-004, and SCN-005.
- `ticket:20260522-session-watch-service` - provides watcher lifecycle.
- `ticket:20260522-live-suggestion-engine` - provides mode/cooldown/status semantics when suggestions are enabled.
- `plan:20260522-live-failure-monitoring` - sequences CLI controls before Pi live hook polish.

## Scope

May change:

- `src/cli.ts`, CLI tests, watcher command docs, and status formatting.

Must not change:

- No OS daemon installation.
- No Pi extension event handling.
- No new extraction heuristics.

A foreground watch command is acceptable for this slice. If background stop/status across processes requires persistent PID management beyond current lock/status support, keep it minimal and explicit rather than inventing full daemon supervision.

## Acceptance

- ACC-001: CLI exposes `watch start`, `watch stop`, and `watch status` or equivalent documented commands.
  - Evidence: CLI tests for help and command dispatch.
  - Audit: Review names align with docs/spec and do not conflict with existing commands.

- ACC-002: `watch start --foreground` or equivalent keeps process alive, runs catch-up, and processes a fixture file change.
  - Evidence: Integration test or bounded smoke test with temp directory.
  - Audit: Review test has deterministic shutdown and no leaked process/timer.

- ACC-003: Status output includes mode, watched paths, last sync, last failure/suggestion where available, and warnings/errors.
  - Evidence: Snapshot/structured-output test.
  - Audit: Review status is useful for diagnosing inactive/degraded watcher state.

- ACC-004: CLI options configure source dirs, data dir, mode, debounce, confidence threshold, and cooldown.
  - Evidence: Unit tests parse options into watcher/suggestion config.
  - Audit: Review defaults are conservative and opt-in.

## Current State

Implementation appears complete and is in review. Added `watch start --foreground`, `watch status`, and `watch stop` CLI controls with source/data-dir/mode/debounce/poll/confidence/cooldown/max-suggestions options. `watch start` remains foreground-only by design; OS daemon installation is out of scope. No separate Ralph audit has been run yet.

## Evidence

- `evidence:20260522-live-monitoring-validation` - records CLI status/stop smoke and foreground watcher smoke.
- `src/cli.test.ts` - covers watch status/stop command dispatch and conservative start behavior.
- `src/watch-service.test.ts` - covers foreground watcher lifecycle behavior used by CLI.

## Journal

- 2026-05-22: Created ticket with Status `open`. Scope is CLI control surface only.
- 2026-05-22: Implemented watch CLI controls and moved ticket to `review` with validation evidence.
