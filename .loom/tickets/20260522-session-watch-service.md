# Session Watch Service

ID: ticket:20260522-session-watch-service
Type: Ticket
Status: review
Created: 2026-05-22
Updated: 2026-05-22
Risk: medium - long-running watcher lifecycle can create duplicate processing or stale state
Priority: high - automatic tracking needs source-file change detection
Depends On: ticket:20260522-incremental-session-sync-api

## Summary

Implement a local watch service for Pi session JSONL files with debounce, catch-up sync, start/stop/status lifecycle, and duplicate watcher prevention. The closure claim is that `pi-flight-recorder` can keep its index fresh automatically when Pi writes session files.

## Related Records

- `spec:live-failure-monitoring` - especially REQ-001 through REQ-006 and REQ-014.
- `research:20260522-live-failure-watcher-inspiration` - SocratiCode-inspired watcher patterns: native watcher, debounce, filters, locks, non-fatal errors, catch-up.
- `ticket:20260522-incremental-session-sync-api` - provides changed-file sync and new-episode detection.
- `plan:20260522-live-failure-monitoring` - sequences watcher before suggestion/UI layers.

## Scope

May change:

- New watcher service/source files, lock/status state, watcher tests, and package dependencies if needed.
- CLI command surface for watch start/stop/status only if it stays in this ticket's boundary.

Must not change:

- No Pi extension live hook yet.
- No suggestion popup engine except returning new episode notifications to callbacks.
- No OS-level daemon installation.

Implementation should evaluate `@parcel/watcher` as an open-source runtime dependency, inspired by SocratiCode, but must not copy SocratiCode AGPL code. If native watcher setup is impractical, create a bounded polling fallback or block with rationale.

## Acceptance

- ACC-001: Watch service can start watching configured session source directories and reports active status.
  - Evidence: Test with temporary directory and mocked/fake watcher or real watcher if stable.
  - Audit: Review watched paths and state are visible through status.

- ACC-002: Watch start runs catch-up sync before reporting active.
  - Evidence: Test starts watch with existing fixture failure and asserts it is indexed.
  - Audit: Review catch-up failures are represented as warnings/degraded state rather than hidden.

- ACC-003: Debounced file changes call incremental sync once per burst and only for relevant `.jsonl` files.
  - Evidence: Fake timer test or integration test appends multiple times and asserts one sync callback.
  - Audit: Review non-JSONL and out-of-source paths are ignored.

- ACC-004: Duplicate watcher start for the same source is prevented or reported clearly.
  - Evidence: Test starts same source twice and asserts one active watcher plus status message/lock behavior.
  - Audit: Review behavior across same-process and intended cross-process boundary.

- ACC-005: Stop tears down subscriptions/timers and updates status.
  - Evidence: Test start/stop/status sequence.
  - Audit: Review no timers/subscriptions remain after stop.

## Current State

Implementation appears complete and is in review. Added `SessionWatchService` with foreground polling, catch-up sync, debounce, JSONL filtering via discovered session files, local lock, persisted status, stop request, non-fatal warning/error counts, and tests. Chose a polling watcher for this slice instead of adding a native watcher dependency; this is documented as a deliberate low-friction fallback. No separate Ralph audit has been run yet.

## Evidence

- `evidence:20260522-live-monitoring-validation` - records validation commands and a foreground watcher smoke run that indexed an appended failure.
- `src/watch-service.test.ts` - covers active status, catch-up, debounced changed-file sync, malformed partial JSONL warning behavior, duplicate lock behavior, and stop/status.

## Journal

- 2026-05-22: Created ticket with Status `open`. Scope is automatic file tracking, not suggestions or Pi UI.
- 2026-05-22: Implemented watch service after incremental sync foundation and moved ticket to `review` with validation evidence.
