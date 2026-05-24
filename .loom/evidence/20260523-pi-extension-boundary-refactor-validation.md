# Pi Extension Boundary Refactor Validation

ID: evidence:20260523-pi-extension-boundary-refactor-validation
Type: Evidence Dossier
Status: recorded
Created: 2026-05-23
Updated: 2026-05-23
Observed: 2026-05-23

## Summary

This dossier records validation for `ticket:20260523-pi-extension-boundary-refactor`. The observed source state extracts Pi extension types/state, command/common helpers, and event parsing helpers out of `src/pi-extension.ts` without changing public command or hook behavior.

## Observations

- Observation: Pi extension source responsibilities were split into internal modules.
  - Procedure/source: Inspected line counts and changed files after refactor.
  - Actual result: `src/pi-extension.ts` decreased to 945 lines. New internal modules were added: `src/pi-extension-types.ts` for `PiLike`, `PiCommandContext`, and `LiveExtensionState`; `src/pi-extension-command-utils.ts` for command argument parsing, mode/action parsing, cwd/status helpers, and notifications; `src/pi-extension-event-utils.ts` for failed tool-result detection, query extraction, and event metadata parsing.

- Observation: The extracted event helpers preserve prior behavior rather than changing tool-result semantics.
  - Procedure/source: Inspected `src/pi-extension-event-utils.ts` and test results.
  - Actual result: Event query extraction still uses `contentToText`, failed-result detection still checks `isError` and nested `details.exitCode`, and metadata still preserves `id`/`toolCallId`/`entryId` fallback order.

- Observation: The local smoke harness passed after the refactor.
  - Procedure/source: Ran `npm run test:smoke:local`.
  - Actual result: `Test Files 1 passed (1)`, `Tests 1 passed (1)`.

- Observation: Full validation passed after the refactor.
  - Procedure/source: Ran `npm run typecheck && npm test && npm run build && npm pack --dry-run`.
  - Actual result: Typecheck exited successfully; tests reported `Test Files 14 passed (14)` and `Tests 63 passed (63)`; build exited successfully; package dry-run produced `pi-flight-recorder-0.1.0.tgz` with total files `71` including the new internal Pi extension modules.

## Artifacts

Line-count excerpt:

```text
945 src/pi-extension.ts
 80 src/pi-extension-command-utils.ts
 51 src/pi-extension-event-utils.ts
 48 src/pi-extension-types.ts
```

Validation excerpts:

```text
> npm run test:smoke:local
Test Files  1 passed (1)
Tests       1 passed (1)
```

```text
> npm run typecheck
> tsc --noEmit

> npm test
Test Files  14 passed (14)
Tests       63 passed (63)

> npm run build
> tsc -p tsconfig.build.json

> npm pack --dry-run
npm notice total files: 71
pi-flight-recorder-0.1.0.tgz
```

Relevant changed/untracked source paths:

```text
M src/pi-extension.ts
?? src/pi-extension-command-utils.ts
?? src/pi-extension-event-utils.ts
?? src/pi-extension-types.ts
```

## What This Shows

- `ticket:20260523-pi-extension-boundary-refactor#ACC-001` - supports - command/common helper, event parsing, and extension type/state boundaries now live outside `src/pi-extension.ts`.
- `ticket:20260523-pi-extension-boundary-refactor#ACC-002` - supports - full Pi extension tests and local smoke passed after the refactor, covering command registration, status, data-dir switching, feedback/reflection, rules, and before-agent-start injection behavior.
- `ticket:20260523-pi-extension-boundary-refactor#ACC-003` - supports - the local smoke harness still passed with fake `HOME`, default-session sentinel isolation, and command-specific `--data-dir` assertions; existing Pi extension data-dir switching tests also passed in `npm test`.
- `ticket:20260523-pi-extension-boundary-refactor#ACC-004` - supports - `npm run typecheck`, `npm test`, `npm run build`, `npm run test:smoke:local`, and `npm pack --dry-run` passed.

## What This Does Not Show

- It does not prove real Pi TUI behavior.
- It does not prove the seam split is the final desired architecture; it is a behavior-preserving first extraction.
- It does not refactor all command handlers, feedback/review/rule flows, or lifecycle code out of `src/pi-extension.ts`.
- It does not validate built package execution beyond build/package dry-run.

## Related Records

- `ticket:20260523-pi-extension-boundary-refactor` - consuming ticket.
- `ticket:20260523-repeatable-local-smoke-harness` - local smoke prerequisite.
- `knowledge:pi-extension-command-bootstrap-data-dir` - data-dir isolation invariant covered by smoke/tests.
- `plan:20260523-codebase-stabilization-release-readiness` - parent plan.
