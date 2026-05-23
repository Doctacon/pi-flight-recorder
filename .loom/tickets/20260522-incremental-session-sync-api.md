# Incremental Session Sync API

ID: ticket:20260522-incremental-session-sync-api
Type: Ticket
Status: review
Created: 2026-05-22
Updated: 2026-05-22
Risk: medium - sync semantics affect live correctness and duplicate alerts
Priority: high - watcher and Pi hook both need changed-file sync and new-episode detection

## Summary

Refactor the existing sync path into a reusable incremental API that can sync one changed Pi session file, return newly extracted episodes, and preserve idempotency. The closure claim is that live systems can process changed session files without rescanning all source directories or re-alerting on already-known episodes.

## Related Records

- `spec:live-failure-monitoring` - especially REQ-002, REQ-003, REQ-006, and REQ-009.
- `spec:failure-memory-mvp` - existing parser/extractor/storage behavior to preserve.
- `research:20260522-live-failure-watcher-inspiration` - supports catch-up and incremental sync design.
- `plan:20260522-live-failure-monitoring` - sequences this as the foundation for live mode.

## Scope

May change:

- `src/sync.ts`, storage repository methods, tests, and types for incremental sync results.
- Existing CLI `sync` implementation only as needed to call the refactored API.

Must not change:

- No file watcher process yet.
- No Pi event hook changes.
- No suggestion/notification engine beyond returning enough new-episode data.

The API should distinguish `indexed`, `skipped`, `warnings`, `episodesExtracted`, and `newEpisodeIds` for a single file and for a batch. It should tolerate malformed/partial JSONL by preserving current non-fatal warning behavior.

## Acceptance

- ACC-001: A public library function can sync a single `.jsonl` file and return structured results including new episode IDs.
  - Evidence: Unit/integration test over a fixture file.
  - Audit: Review result fields are sufficient for watcher/suggestion consumers.

- ACC-002: Re-syncing an unchanged file returns skipped/no-new-episodes rather than duplicating episodes.
  - Evidence: Test syncs same fixture twice and asserts stable row counts plus empty new episode list.
  - Audit: Review idempotency with current hash/mtime logic.

- ACC-003: Updating/appending a fixture file causes only that file to be parsed and returns newly detected episodes.
  - Evidence: Test appends a new failed command to an existing fixture and asserts one new episode ID.
  - Audit: Review old episodes are not re-alerted as new.

- ACC-004: Existing `sync` CLI behavior remains compatible.
  - Evidence: Existing CLI tests pass plus any updated tests for summary counts.
  - Audit: Review no regression to `spec:failure-memory-mvp` behavior.

## Current State

Implementation appears complete and is in review. Added `syncSessionFile`, structured per-file results, new episode ID detection, batch result details, and storage helpers for episode ID lookup. Existing CLI sync behavior remains compatible. Acceptance is supported by automated tests and validation evidence; no separate Ralph audit has been run yet.

## Evidence

- `evidence:20260522-live-monitoring-validation` - records `npm run typecheck`, `npm test`, `npm run build`, `npm pack --dry-run`, and claim-linked support for this ticket.
- `src/sync.test.ts` - covers single-file sync, unchanged skip/idempotency, appended new episode IDs, and batch summary compatibility.

## Journal

- 2026-05-22: Created ticket with Status `open` for the first live-monitoring foundation slice.
- 2026-05-22: Moved to `active` and began implementation of incremental sync as the first dependency for live monitoring.
- 2026-05-22: Moved to `review` after implementing incremental sync and recording validation evidence.
