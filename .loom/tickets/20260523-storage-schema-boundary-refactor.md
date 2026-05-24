# Storage Schema Boundary Refactor

ID: ticket:20260523-storage-schema-boundary-refactor
Type: Ticket
Status: closed
Created: 2026-05-23
Updated: 2026-05-23
Risk: high - persistence refactors can corrupt local evidence, break migrations, or silently change search/reflection/rule behavior
Depends On: ticket:20260523-repeatable-local-smoke-harness

## Summary

Refactor `src/storage.ts` into clearer internal boundaries while preserving the SQLite database contract. The current module is over one thousand lines and mixes schema/migration setup, row mapping, sanitization, FTS query building, episode search, occurrence ledger, feedback controls, cluster/proposal state, and Flight Rule persistence. That concentration makes migration safety and privacy review hard.

Single closure claim: storage source structure has clearer schema/migration, mapping/sanitization, and domain persistence seams while existing database compatibility and behavior are preserved.

## Related Records

- `plan:20260523-codebase-stabilization-release-readiness` - parent plan and stabilization route.
- `ticket:20260523-repeatable-local-smoke-harness` - prerequisite proof path for behavior preservation.
- `constitution:main` - local-first, evidence-backed storage and privacy constraints.
- `spec:failure-memory-mvp` - failure/fix episode and evidence storage requirements.
- `spec:live-failure-monitoring` - occurrence, feedback, cluster, reflection, and suggestion-state requirements.
- `spec:seamless-failure-memory-ux` - local derived-data privacy and model-boundary requirements.
- `src/storage.ts` and `src/storage.test.ts` - primary implementation and migration/behavior test scope.

## Scope

May change:

- `src/storage.ts` and new internal storage modules under `src/`.
- `src/storage.test.ts` and narrowly related tests/fixtures that verify migrations, redaction, and storage behavior.
- Type-only exports if tests or downstream modules need stable internal boundaries; avoid broad public API expansion unless necessary.
- Generated `dist/` only as the result of the normal build, if the implementation agent updates build artifacts.

Must not change:

- Database file location defaults.
- Existing table/column meanings or migration compatibility.
- Episode, occurrence, feedback, cluster, reflection proposal, candidate, or rule semantics.
- Redaction/sanitization behavior except to add tests that pin existing guarantees.
- FTS query behavior except for bug fixes explicitly spun into another ticket.
- Docs or product behavior.

Suggested seam shape, to be adjusted only if source inspection shows a cleaner equivalent:

- schema and migration setup/version handling;
- row-to-domain mappers and JSON parsing helpers;
- sanitization/admission helpers for stored text/source refs/evidence refs;
- episode/search repository behavior;
- occurrence/feedback/cluster/reflection/rule repository behavior.

Stop conditions:

- If migration compatibility is uncertain, stop and create a focused migration research/evidence ticket rather than continuing the refactor.
- If tests reveal behavior differences, either preserve old behavior or split a bug-fix ticket; do not combine behavior fixes with this refactor.

## Acceptance

- ACC-001: Storage responsibilities are split into cohesive internal modules or clearly separated boundaries, with `FlightRecorderStore` remaining a stable facade for existing callers.
  - Evidence: Diff/file inventory and source inspection showing which responsibilities moved.
  - Audit: Review should challenge whether callers now depend on unstable internal details.

- ACC-002: Existing database compatibility is preserved, including legacy migration fixtures and current schema version behavior.
  - Evidence: `src/storage.test.ts` and any migration fixture tests pass; if a legacy DB fixture exists, it is exercised.
  - Audit: Review should inspect migration/version paths, not only happy-path fresh DB tests.

- ACC-003: Redaction/sanitization guarantees for stored snippets, source refs, evidence refs, and paths remain covered.
  - Evidence: Passing focused tests for secret/path redaction and bounded stored text.
  - Audit: Review should inspect for raw session paths or sensitive-looking values entering persisted derived records.

- ACC-004: Full validation passes: `npm run typecheck`, `npm test`, `npm run build`, local smoke harness, and `npm pack --dry-run`.
  - Evidence: Loom evidence record with command output.
  - Audit: Separate audit is required because persistence changes can silently invalidate user data.

## Current State

Closed. `src/storage.ts` now imports row types, JSON/hash helpers, row-to-domain mappers, episode/evidence sanitizers, and project-scope path matching from `src/storage-mappers.ts`. `FlightRecorderStore`, data-dir helpers, schema/migration SQL, repository methods, and `buildFtsQuery` remain in `src/storage.ts` as the stable public facade. No schema or product behavior changes were made.

Evidence is recorded in `evidence:20260523-storage-schema-boundary-refactor-validation`: typecheck, local smoke, full tests, build, and package dry-run passed. Audit `audit:20260523-storage-schema-boundary-refactor-review` returned `clear` with no material findings. Residual non-blocking risks: `src/storage.ts` is still large and migration coverage remains representative rather than exhaustive.

## Journal

- 2026-05-23: Created ticket under `plan:20260523-codebase-stabilization-release-readiness` after inspection found `src/storage.ts` at roughly 1297 lines with schema, mapping, redaction, search, occurrence, feedback, reflection, and rule persistence in one module.
- 2026-05-23: Set Status to `active` after implementing the first behavior-preserving storage seam extraction. Note: status was updated after the source edit rather than before; continuing with evidence/audit before closure.
- 2026-05-23: Extracted `src/storage-mappers.ts` for row types, JSON/hash helpers, row mappers, sanitizers, and project path matching; kept schema/migration SQL and `FlightRecorderStore` facade in `src/storage.ts`.
- 2026-05-23: Ran `npm run typecheck`, `npm run test:smoke:local`, `npm test`, `npm run build`, and `npm pack --dry-run`; all passed. Recorded `evidence:20260523-storage-schema-boundary-refactor-validation`.
- 2026-05-23: Ran Ralph audit and recorded `audit:20260523-storage-schema-boundary-refactor-review`; verdict `clear`.
- 2026-05-23: Closed ticket with partial-seam and representative-migration-coverage limits explicit.
