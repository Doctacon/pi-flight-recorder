# Store And Index Episodes

ID: ticket:20260522-store-and-index-episodes
Type: Ticket
Status: review
Created: 2026-05-22
Updated: 2026-05-22
Risk: medium - local persistence and FTS choices shape future query behavior
Priority: high - query and extraction need a durable local index
Depends On: ticket:20260522-bootstrap-project-scaffold

## Summary

Create the local SQLite/FTS storage layer for sessions, events, parse warnings, candidate episodes, and searchable text. The closure claim is that parsed fixture data can be synced idempotently into a local inspectable index and queried with exact tokens without embeddings.

## Related Records

- `spec:failure-memory-mvp` - especially REQ-007 through REQ-009 and SCN-004.
- `research:20260522-agent-session-memory-landscape` - supports SQLite/FTS-first storage.
- `ticket:20260522-ingest-pi-sessions` - provides parsed events this storage layer will consume once available.
- `plan:20260522-pi-flight-recorder-mvp` - sequences storage before extraction/query surfaces.

## Scope

May change:

- SQLite adapter, schema/migrations, repository/index interfaces, temporary-db test helpers, and storage tests.
- Config for data directory and source index paths.

Must not change:

- No final failure/fix heuristics beyond minimal synthetic episode fixtures required to test storage.
- No embeddings provider integration.
- No hosted services.
- No Pi command wrapper.

The storage layer should be rebuildable from source sessions and should not make raw session files the only way to inspect derived state. FTS should support stack traces, commands, error codes, package names, and file paths.

Likely first Ralph run: check available SQLite/FTS options in the local Node runtime, choose the smallest open-source/local dependency, implement schema and tests.

Stop if Node runtime lacks a viable FTS5 path; update research/plan with the package tradeoff before implementing around it.

## Acceptance

- ACC-001: Local schema stores session metadata, event/source refs, parse warnings, and episode-like searchable records with migration/version handling.
  - Evidence: Schema/migration tests on a temporary database.
  - Audit: Review schema is local, inspectable, and not coupled to hosted services.

- ACC-002: Sync is idempotent for unchanged source sessions.
  - Evidence: Integration test syncs the same fixture twice and asserts stable row counts/content hashes.
  - Audit: Review duplicate prevention logic and failure behavior.

- ACC-003: FTS query returns exact-token matches for command names, file paths, and stack/error text without embeddings.
  - Evidence: Integration test inserts fixture records and queries exact tokens.
  - Audit: Review that FTS ranking output is deterministic enough for tests.

- ACC-004: Storage config supports a local default data directory plus override for tests/project-local use.
  - Evidence: Unit/integration test uses temp directory override; docs mention default.
  - Audit: Review no test writes to real `~/.pi` paths.

## Current State

Implementation complete. `src/storage.ts` creates local SQLite/FTS5 schema, idempotently stores parsed sessions, stores episodes, supports FTS search, and records feedback. Storage and CLI tests pass. Evidence is recorded in `evidence:20260522-mvp-validation`. Ready for closure review; no independent Ralph audit has been performed.

## Journal

- 2026-05-22: Created ticket with Status `open`. Scope is storage/FTS infrastructure, not extraction heuristics or query UX.

- 2026-05-22: Implemented the ticket scope and moved Status to `review`. Validation evidence: `evidence:20260522-mvp-validation`. Closure still needs review/audit disposition; residual live-Pi and heuristic-quality limits are explicit where applicable.
