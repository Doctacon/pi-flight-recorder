# Bootstrap Project Scaffold

ID: ticket:20260522-bootstrap-project-scaffold
Type: Ticket
Status: review
Created: 2026-05-22
Updated: 2026-05-22
Risk: low - new empty project scaffold with narrow reversible files
Priority: high - all implementation tickets depend on a runnable baseline

## Summary

Create the initial TypeScript project scaffold for `pi-flight-recorder`: package metadata, strict TypeScript config, test runner, source/test directories, CLI entry placeholder, and development scripts. The closure claim is that future tickets can run typecheck/tests and add implementation inside a stable project skeleton.

## Related Records

- `constitution:main` - establishes local-first/open-source and TypeScript strict constraints.
- `spec:failure-memory-mvp` - defines the MVP behavior future implementation tickets will build toward.
- `plan:20260522-pi-flight-recorder-mvp` - sequences this ticket as the first execution unit.

## Scope

May change:

- `package.json`, lockfile, `tsconfig.json`, test config, `.gitignore`, `src/`, `test/` or colocated `*.test.ts`, and minimal README/dev docs updates needed for running the scaffold.

Must not change:

- No parser/index/extractor business behavior beyond placeholders required to prove the scaffold.
- No network-backed dependencies or hosted services.
- No broad formatting churn outside this new project.

Likely first Ralph run: inspect current Node/Bun availability, choose an open-source TypeScript test runner compatible with the environment, create scaffold, and run install/typecheck/test commands.

Stop if local runtime constraints make the intended TypeScript/SQLite route impossible without a material package decision.

## Acceptance

- ACC-001: The project has strict TypeScript configuration and a package manifest with scripts for typecheck and tests.
  - Evidence: `npm`/`bun` package metadata inspection plus successful typecheck/test command output.
  - Audit: Review that scripts are local and do not require hosted credentials.

- ACC-002: A minimal CLI/library entry can be imported or executed without implementing MVP behavior.
  - Evidence: Smoke test or unit test imports the entry and asserts a version/help placeholder.
  - Audit: Check that placeholder behavior does not pretend the MVP is implemented.

- ACC-003: The scaffold documents the local-first constraint and the intended source/test layout for later tickets.
  - Evidence: README/dev docs inspection.
  - Audit: Review that docs do not add scope beyond the plan.

## Current State

Implementation complete. The project has package metadata, strict TypeScript config, test/build scripts, CLI/library placeholder evolved into MVP commands, README/CLAUDE guidance, and passing validation. Evidence is recorded in `evidence:20260522-mvp-validation`. Ready for closure review; no independent Ralph audit has been performed.

## Journal

- 2026-05-22: Created ticket with Status `open` from the MVP plan. First move is project scaffold only, before parser/storage implementation.

- 2026-05-22: Implemented the ticket scope and moved Status to `review`. Validation evidence: `evidence:20260522-mvp-validation`. Closure still needs review/audit disposition; residual live-Pi and heuristic-quality limits are explicit where applicable.
