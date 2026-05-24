# Storage Schema Boundary Refactor Validation

ID: evidence:20260523-storage-schema-boundary-refactor-validation
Type: Evidence Dossier
Status: recorded
Created: 2026-05-23
Updated: 2026-05-23
Observed: 2026-05-23

## Summary

This dossier records validation for `ticket:20260523-storage-schema-boundary-refactor`. The observed source state extracts storage row types, JSON/hash helpers, row-to-domain mappers, redaction/sanitization helpers, and project-scope path matching into `src/storage-mappers.ts` while preserving `FlightRecorderStore` as the caller-facing facade and leaving schema/migration SQL unchanged.

## Observations

- Observation: Storage mapping/sanitization responsibilities were split out of `src/storage.ts`.
  - Procedure/source: Inspected line counts and changed files after refactor.
  - Actual result: `src/storage.ts` decreased to 992 lines. New internal module `src/storage-mappers.ts` has 323 lines and contains row interfaces, `json`, `parseJson`, `hash`, `sanitizeEpisodeForStorage`, row-to-domain mappers, `sanitizeEvidenceRefs`, and `cwdIsInsideProject`.

- Observation: Public storage facade and schema/migration ownership were preserved.
  - Procedure/source: Inspected `src/storage.ts` imports and validation results.
  - Actual result: `FlightRecorderStore`, `getDefaultDataDir`, `ensureDataDir`, `defaultDatabasePath`, schema creation, migrations, query/search, occurrence/feedback/cluster/proposal/rule methods, and `buildFtsQuery` remain exported from `src/storage.ts`; callers still import the same public storage surface.

- Observation: Full validation passed after the refactor.
  - Procedure/source: Ran `npm run typecheck && npm run test:smoke:local && npm test && npm run build && npm pack --dry-run`.
  - Actual result: Typecheck exited successfully; local smoke reported `Test Files 1 passed (1)` and `Tests 1 passed (1)`; full tests reported `Test Files 14 passed (14)` and `Tests 63 passed (63)`; build exited successfully; package dry-run produced `pi-flight-recorder-0.1.0.tgz` with total files `74`, including `dist/storage-mappers.js`.

## Artifacts

Line-count excerpt:

```text
 992 src/storage.ts
 323 src/storage-mappers.ts
```

Validation excerpts:

```text
> npm run typecheck
> tsc --noEmit

> npm run test:smoke:local
Test Files  1 passed (1)
Tests       1 passed (1)

> npm test
Test Files  14 passed (14)
Tests       63 passed (63)

> npm run build
> tsc -p tsconfig.build.json

> npm pack --dry-run
npm notice total files: 74
pi-flight-recorder-0.1.0.tgz
```

Relevant changed/untracked source paths:

```text
M src/storage.ts
?? src/storage-mappers.ts
```

## What This Shows

- `ticket:20260523-storage-schema-boundary-refactor#ACC-001` - supports - row mapping, JSON/hash helpers, sanitization, and project path-boundary logic moved into a cohesive internal module while `FlightRecorderStore` remains the stable facade.
- `ticket:20260523-storage-schema-boundary-refactor#ACC-002` - supports - full storage tests passed, including existing migration fixture coverage and schema-version behavior in `src/storage.test.ts`.
- `ticket:20260523-storage-schema-boundary-refactor#ACC-003` - supports - redaction/sanitization tests still passed after moving sanitization helpers.
- `ticket:20260523-storage-schema-boundary-refactor#ACC-004` - supports - typecheck, local smoke, full tests, build, and package dry-run passed.

## What This Does Not Show

- It does not exhaustively test corrupt/unusual DB shapes beyond the existing legacy/partial fixture coverage.
- It does not split schema/migration SQL into its own module; those remain in `src/storage.ts` so this is a first behavior-preserving boundary extraction.
- It does not change or improve storage behavior.
- It does not prove real Pi TUI behavior.

## Related Records

- `ticket:20260523-storage-schema-boundary-refactor` - consuming ticket.
- `ticket:20260523-repeatable-local-smoke-harness` - local smoke prerequisite.
- `spec:failure-memory-mvp` - episode storage/query behavior.
- `spec:live-failure-monitoring` - occurrence/feedback/reflection storage behavior.
- `spec:seamless-failure-memory-ux` - local derived-data privacy and model boundary.
- `plan:20260523-codebase-stabilization-release-readiness` - parent plan.
