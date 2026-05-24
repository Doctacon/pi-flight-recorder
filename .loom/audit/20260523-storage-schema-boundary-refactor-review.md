# Audit: Storage Schema Boundary Refactor

ID: audit:20260523-storage-schema-boundary-refactor-review
Type: Audit
Status: recorded
Created: 2026-05-23
Updated: 2026-05-23
Audited: 2026-05-23
Target: ticket:20260523-storage-schema-boundary-refactor

## Summary

Ralph performed a bounded audit of the storage boundary refactor. Verdict is `clear`: no material findings were identified, and the mapper/sanitizer extraction is acceptable as a first behavior-preserving storage seam split.

## Target

Target was `ticket:20260523-storage-schema-boundary-refactor` and the source changes that extracted storage row mapping/sanitization helpers into `src/storage-mappers.ts` while preserving `FlightRecorderStore` and existing schema/migration behavior.

## Audit Scope And Lenses

Scope reviewed by Ralph:

- ticket acceptance;
- validation evidence;
- `src/storage.ts`;
- `src/storage-mappers.ts`;
- `src/storage.test.ts`;
- `src/local-smoke.test.ts`;
- git diff/status.

Lenses:

- acceptance and evidence;
- public facade stability;
- schema/migration preservation;
- redaction/sanitization preservation;
- seam quality.

Out of scope:

- real historical/corrupt DB migration matrix beyond existing tests;
- complete storage repository decomposition;
- real Pi TUI behavior.

## Context And Evidence Reviewed

- Ralph review run: `pi --no-extensions --no-skills --no-context-files --no-prompt-templates --no-themes --tools read,grep,find,ls,bash -p ...` from `/Users/crlough/Code/personal/pi-flight-recorder`; reviewer was instructed to inspect ticket, evidence, source, tests, smoke, and diff/status without editing files.
- `.loom/tickets/20260523-storage-schema-boundary-refactor.md` - target ticket and acceptance.
- `.loom/evidence/20260523-storage-schema-boundary-refactor-validation.md` - validation evidence.
- `src/storage.ts`, `src/storage-mappers.ts` - refactored source.
- `src/storage.test.ts`, `src/local-smoke.test.ts` - storage and smoke validation.

## Findings

None - no material findings within audited scope.

## Verdict

`clear`.

Ralph reported:

- `ACC-001` is supported: `FlightRecorderStore` remains the facade in `src/storage.ts`; callers still use `storage.js`; row types, JSON/hash helpers, row-to-domain mappers, episode/evidence sanitizers, and project-scope path matching moved to `src/storage-mappers.ts`; no other source imports the mapper module directly.
- `ACC-002` is supported: schema/migration SQL appears unchanged by diff; migration paths remain in `initialize()`/`migrateSchema()`; existing legacy migration test passed.
- `ACC-003` is supported: focused tests still cover event text redaction, episode/source-ref/path redaction, occurrence/evidence redaction, and rule candidate sanitization; extraction appears behavior-preserving.
- `ACC-004` is supported by the evidence dossier; Ralph also independently ran `npm run typecheck && npm test -- src/storage.test.ts src/local-smoke.test.ts`, which passed.

Ralph judged the seam split narrow but sufficient: it is not a complete schema/repository decomposition, but it creates a meaningful internal mapping/sanitization boundary while leaving high-risk schema SQL untouched.

## Required Follow-up

No required follow-up before closing this ticket.

Optional later work: split schema/migrations or domain repositories with dedicated migration fixture coverage, but that should be a separate ticket.

## Residual Risk

- `src/storage.ts` is still large and still owns schema, migrations, search, occurrence, cluster, reflection, and rule persistence.
- Legacy migration coverage is synthetic/partial, not exhaustive against real historical DBs.
- Workspace contains unrelated modified/untracked files from adjacent work; disposition should remain bounded to this ticket’s files/evidence.

## Related Records

- `ticket:20260523-storage-schema-boundary-refactor` - consuming ticket.
- `evidence:20260523-storage-schema-boundary-refactor-validation` - validation evidence.
- `plan:20260523-codebase-stabilization-release-readiness` - parent plan.
