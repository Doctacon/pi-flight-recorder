# Repeatable Local Smoke Harness

ID: ticket:20260523-repeatable-local-smoke-harness
Type: Ticket
Status: closed
Created: 2026-05-23
Updated: 2026-05-23
Risk: medium - validation tooling must prove extension behavior without reading real operator sessions or weakening local-first privacy
Depends On: ticket:20260523-loom-review-state-reconciliation

## Summary

Add a repeatable project-local smoke validation path for the extension and CLI using isolated temporary data dirs and fixture Pi session data. The harness should make future behavior-preserving refactors and release claims easier to trust without depending on the operator's real Pi history or hosted services.

Single closure claim: the project has one documented, runnable local smoke path that exercises key extension/CLI behavior against isolated fixture data and proves it does not pollute or depend on real sessions.

## Related Records

- `plan:20260523-codebase-stabilization-release-readiness` - parent plan and ordering rationale.
- `constitution:main` - requires local-first behavior, evidence-backed responses, and no raw session leakage by default.
- `knowledge:pi-extension-command-bootstrap-data-dir` - records the data-dir/bootstrap isolation bug this harness must guard against.
- `spec:live-failure-monitoring` - defines live capture, suggestion, and occurrence behavior.
- `spec:seamless-failure-memory-ux` - defines extension-first UX and privacy/model boundaries.
- `README.md`, `docs/first-run.md`, `docs/live-monitoring.md` - document current validation and normal/debug paths.
- `src/pi-extension.test.ts`, `src/cli.test.ts`, `src/storage.test.ts`, `src/watch-service.test.ts` - likely starting points for fixture and harness patterns.

## Scope

May change:

- Test files, fixture files, and narrow test utilities needed for a project-local smoke path.
- Package scripts only if needed to expose a clearly named smoke command.
- Documentation that explains how to run the smoke path.
- Loom evidence records when the smoke command is actually run.

Must not change:

- Product behavior, Pi command semantics, database schema, generated `dist/` output except as a consequence of normal build validation, or real user data.
- Raw Pi session logs copied from the operator's machine into fixtures, Loom evidence, or repository files.
- Hosted model/provider calls.

Harness boundary:

- Use synthetic/minimal Pi JSONL fixture data or generated temp session files.
- Use temp/project-local data dirs only.
- Include a check or assertion that command-level `--data-dir` bootstrap does not index default real sessions.
- Prefer deterministic local reflection and fake-Pi UI/model stubs where real TUI is not the target.
- This ticket does not gather real TUI evidence; it creates the local proof path later tickets can use.

## Acceptance

- ACC-001: A single documented command or test target runs the local smoke path from a clean checkout after install/build prerequisites.
  - Evidence: Command output recorded in a Loom evidence record or in the ticket journal, plus the file/script/docs path for the harness.
  - Audit: Review should verify the command is not merely a unit-test alias without extension/CLI smoke coverage.

- ACC-002: The smoke path uses isolated fixture/temp session data and isolated temp/project-local recorder data dirs.
  - Evidence: Test assertions or harness output showing data-dir/source-dir values are not default `~/.pi/agent/sessions` or `~/.pi/flight-recorder`.
  - Audit: Review should inspect for accidental reads/writes of operator real session paths.

- ACC-003: The smoke path covers bootstrap/status, sync or catch-up indexing, failed occurrence capture or equivalent fixture ingestion, reflection output, and rules/status surfaces at least at a deterministic fake-Pi or CLI level.
  - Evidence: Passing smoke output and/or focused tests naming those behaviors.
  - Audit: Review should challenge whether each behavior is actually exercised rather than mocked away.

- ACC-004: Existing validation still passes: `npm run typecheck`, `npm test`, `npm run build`, and `npm pack --dry-run`.
  - Evidence: Command output in a Loom evidence record.
  - Audit: Separate audit is useful because later refactor tickets will rely on this harness.

## Current State

Closed. Added a dedicated local smoke harness in `src/local-smoke.test.ts`, exposed it as `npm run test:smoke:local`, and documented it in `README.md` and `docs/first-run.md`. The smoke uses synthetic Pi JSONL fixtures, temporary recorder data dirs, a fake `HOME`, and a default-session sentinel to guard against accidental default-session indexing. It exercises extension status/mode/sync/query/live occurrence/reflection/guided rule approval/injection/rules status plus direct CLI `main(["status", "--data-dir", dataDir, "--json"])`.

Evidence is recorded in `evidence:20260523-repeatable-local-smoke-harness-validation`: `npm run test:smoke:local` passed; `npm run typecheck`, `npm test`, `npm run build`, and `npm pack --dry-run` passed. Audit `audit:20260523-repeatable-local-smoke-harness-review` returned `clear` with no material findings. Residual non-blocking limits: the smoke uses source CLI `main()` rather than built `dist/cli.js`, fake-Pi harness rather than real TUI, and isolated temp dirs are not explicitly cleaned up.

## Journal

- 2026-05-23: Created ticket under `plan:20260523-codebase-stabilization-release-readiness` to establish a repeatable isolated proof path before source refactors.
- 2026-05-23: Set Status to `active` after reconciliation ticket closed; starting bounded implementation/validation run for an isolated local smoke target.
- 2026-05-23: Added `src/local-smoke.test.ts`, `test:smoke:local` script, and docs references in README/first-run. Initial smoke passed but Ralph audit returned concerns about default-session trap strength and direct CLI coverage.
- 2026-05-23: Hardened smoke with fake `HOME`, planted default-session sentinel, asserted sentinel was not indexed into temp DB, and added direct CLI `main()` status smoke. Re-ran `npm run test:smoke:local`, `npm run typecheck`, `npm test`, `npm run build`, and `npm pack --dry-run`; all passed.
- 2026-05-23: Recorded validation in `evidence:20260523-repeatable-local-smoke-harness-validation` and follow-up audit in `audit:20260523-repeatable-local-smoke-harness-review`; verdict `clear`.
- 2026-05-23: Closed ticket with residual fake-Pi/built-bin/temp-cleanup limits explicitly carried forward.
