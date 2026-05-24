# Pi Extension Boundary Refactor

ID: ticket:20260523-pi-extension-boundary-refactor
Type: Ticket
Status: closed
Created: 2026-05-23
Updated: 2026-05-23
Risk: medium - the refactor touches extension lifecycle, commands, event handlers, feedback, and prompt-injection boundaries that affect normal Pi usage
Depends On: ticket:20260523-repeatable-local-smoke-harness

## Summary

Refactor `src/pi-extension.ts` into clearer internal boundaries without changing public extension behavior. The current module is over one thousand lines and centralizes argument parsing, bootstrap state, command handlers, feedback/review/rule flows, live event handling, and before-agent-start rule injection. That makes future review difficult and increases the chance that small fixes alter unrelated behavior.

Single closure claim: Pi extension source structure is split into cohesive behavior-preserving seams while registered commands, lifecycle hooks, data-dir switching, live capture, reflection/review, and rule injection behavior remain unchanged.

## Related Records

- `plan:20260523-codebase-stabilization-release-readiness` - parent plan and stabilization route.
- `ticket:20260523-repeatable-local-smoke-harness` - prerequisite proof path for behavior preservation.
- `knowledge:pi-extension-command-bootstrap-data-dir` - bootstrap/data-dir isolation invariant this refactor must preserve.
- `spec:live-failure-monitoring` - defines live watcher and suggestion semantics.
- `spec:seamless-failure-memory-ux` - defines extension-first behavior, feedback controls, and privacy limits.
- `plan:20260523-reflection-rule-promotion-ux` - defines guided rule promotion and injection semantics that must not change.
- `src/pi-extension.ts` and `src/pi-extension.test.ts` - primary implementation and test scope.

## Scope

May change:

- `src/pi-extension.ts` and new internal modules under `src/` that it imports.
- `src/pi-extension.test.ts` and narrowly related tests if needed to keep behavior assertions on the new seams.
- Barrel exports only if required for tests; public package exports should not expand without justification.
- Generated `dist/` only as the result of the normal build, if the implementation agent updates build artifacts.

Must not change:

- Registered Pi command names or documented command behavior.
- Extension event names or hook semantics.
- Default mode/autostart behavior.
- `--data-dir` parsing-before-bootstrap behavior.
- Flight Rule approval/injection semantics.
- Storage schema or migration behavior.
- Docs except tiny corrections directly caused by moved internal names.

Suggested seam shape, to be adjusted only if source inspection shows a cleaner equivalent:

- command argument parsing and common command helpers;
- bootstrap/state lifecycle helpers;
- command handlers for status/mode/watch/sync/query;
- feedback/reflection/review/rules handlers;
- event handlers for tool results, user bash limitation, shutdown reflection, and before-agent-start injection.

Stop conditions:

- If a split requires behavior changes to make tests pass, stop and route that behavior question to a spec/ticket instead of burying it in the refactor.
- If Pi extension API assumptions are unclear, inspect Pi docs and update the ticket before changing behavior.

## Acceptance

- ACC-001: `src/pi-extension.ts` no longer owns all command, lifecycle, event, and review/rule code in one module; cohesive internal modules carry at least two of those boundaries.
  - Evidence: Diff/file inventory showing the new modules and reduced responsibilities.
  - Audit: Review should challenge whether this is a real seam split or just line movement.

- ACC-002: Public extension registration and command/hook behavior are preserved.
  - Evidence: Existing and added `src/pi-extension.test.ts` assertions pass, including command registration, bootstrap/status, data-dir switching, feedback/reflection, rules, and before-agent-start injection cases.
  - Audit: Review should compare command names and key output semantics before/after.

- ACC-003: The bootstrap/data-dir isolation invariant from `knowledge:pi-extension-command-bootstrap-data-dir` remains covered.
  - Evidence: Focused regression test or smoke assertion proving command-specific data dirs are applied before bootstrap and watcher state resets on data-dir switch.
  - Audit: Review should inspect for any new eager bootstrap path before data-dir parsing.

- ACC-004: Full validation passes: `npm run typecheck`, `npm test`, `npm run build`, local smoke harness, and `npm pack --dry-run`.
  - Evidence: Loom evidence record with command output.
  - Audit: Separate audit is useful because this refactor touches normal extension entrypoints.

## Current State

Closed. `src/pi-extension.ts` now imports cohesive internal modules for extension types/state (`src/pi-extension-types.ts`), command/common helpers (`src/pi-extension-command-utils.ts`), and event parsing helpers (`src/pi-extension-event-utils.ts`). Public command names, hook registrations, data-dir switching, live capture, review/rules, and before-agent-start rule injection behavior are preserved. Validation evidence is recorded in `evidence:20260523-pi-extension-boundary-refactor-validation`: local smoke, typecheck, full tests, build, and package dry-run passed. Audit `audit:20260523-pi-extension-boundary-refactor-review` returned `clear` with no material findings.

Residual non-blocking risks: the seam split is partial, with handlers/lifecycle/review-rule flows still mostly in `src/pi-extension.ts`; no real Pi TUI/package execution is proven by this ticket.

## Journal

- 2026-05-23: Created ticket under `plan:20260523-codebase-stabilization-release-readiness` after inspection found `src/pi-extension.ts` at roughly 1116 lines with many runtime responsibilities.
- 2026-05-23: Set Status to `active`; starting bounded behavior-preserving extraction with read/write scope limited to `src/pi-extension.ts`, new internal modules, tests if needed, evidence/audit, and this ticket.
- 2026-05-23: Extracted `src/pi-extension-types.ts`, `src/pi-extension-command-utils.ts`, and `src/pi-extension-event-utils.ts`; preserved tool-result parsing semantics and command/hook registrations.
- 2026-05-23: Ran `npm run test:smoke:local`, `npm run typecheck`, `npm test`, `npm run build`, and `npm pack --dry-run`; all passed. Recorded `evidence:20260523-pi-extension-boundary-refactor-validation`.
- 2026-05-23: Ran Ralph audit and recorded `audit:20260523-pi-extension-boundary-refactor-review`; verdict `clear`.
- 2026-05-23: Closed ticket with partial-seam and no-real-TUI limits explicit.
