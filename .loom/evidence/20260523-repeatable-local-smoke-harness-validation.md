# Repeatable Local Smoke Harness Validation

ID: evidence:20260523-repeatable-local-smoke-harness-validation
Type: Evidence Dossier
Status: recorded
Created: 2026-05-23
Updated: 2026-05-23
Observed: 2026-05-23

## Summary

This dossier records validation for `ticket:20260523-repeatable-local-smoke-harness`. The observed source state adds a dedicated `npm run test:smoke:local` command that runs an isolated synthetic-fixture smoke test for extension status, sync/query, live occurrence capture, reflection, and Flight Rule status/injection surfaces.

## Observations

- Observation: A dedicated local smoke command exists and passed.
  - Procedure/source: Ran `npm run test:smoke:local` in `/Users/crlough/Code/personal/pi-flight-recorder`.
  - Actual result: `vitest run src/local-smoke.test.ts` reported `Test Files 1 passed (1)` and `Tests 1 passed (1)`.

- Observation: The smoke test uses isolated synthetic fixture paths and temp recorder data dirs.
  - Procedure/source: Inspected and executed `src/local-smoke.test.ts`.
  - Actual result: The test creates a synthetic Pi JSONL fixture under `mkdtemp(path.join(tmpdir(), "pfr-local-smoke-source-"))`, a recorder data dir under `mkdtemp(path.join(tmpdir(), "pfr-local-smoke-data-"))`, and a fake `HOME` with a sentinel default `.pi/agent/sessions` failure. It asserts the source path does not contain `.pi/agent/sessions`, asserts the data dir is not `getDefaultDataDir()`, asserts its database path is not the default database path, runs `/flight-mode index-only --data-dir <temp>`, and verifies the temp DB did not index the sentinel default-session failure.

- Observation: The smoke path exercises the intended fake-Pi extension surfaces.
  - Procedure/source: `src/local-smoke.test.ts` registers the Pi extension in a fake command/event harness and runs commands/events against the isolated data dir.
  - Actual result: The test checks `/flight-status --data-dir`, `/flight-mode index-only --data-dir` default-session isolation, `/flight-sync --source --data-dir`, `/seen-this-before --data-dir --cwd current`, direct CLI `main(["status", "--data-dir", dataDir, "--json"])`, `/flight-mode suggest-on-failure --data-dir`, two failed `tool_result` events, occurrence persistence, `/flight-reflect --min-count 2`, `/flight-review` guided Make Rule approval with fake `select`/`editor`, `before_agent_start` rule injection, and `/flight-rules status --data-dir`.

- Observation: Documentation exposes the smoke command.
  - Procedure/source: Inspected changed README and first-run docs.
  - Actual result: `README.md` and `docs/first-run.md` include `npm run test:smoke:local` in development/first-run validation and state that it uses synthetic fixture data plus temporary recorder data dirs rather than real Pi sessions or `~/.pi/flight-recorder` state.

- Observation: Full validation passed after adding the smoke harness.
  - Procedure/source: Ran `npm run typecheck && npm test && npm run build && npm pack --dry-run`.
  - Actual result: Typecheck exited successfully; tests reported `Test Files 14 passed (14)` and `Tests 63 passed (63)`; build exited successfully; `npm pack --dry-run` produced `pi-flight-recorder-0.1.0.tgz` with total files `62`.

## Artifacts

Command excerpts:

```text
> pi-flight-recorder@0.1.0 test:smoke:local
> vitest run src/local-smoke.test.ts

Test Files  1 passed (1)
Tests       1 passed (1)
```

```text
> pi-flight-recorder@0.1.0 typecheck
> tsc --noEmit

> pi-flight-recorder@0.1.0 test
> vitest run

Test Files  14 passed (14)
Tests       63 passed (63)

> pi-flight-recorder@0.1.0 build
> npm run clean && tsc -p tsconfig.build.json

npm pack --dry-run ...
pi-flight-recorder-0.1.0.tgz
npm notice total files: 62
```

Changed paths relevant to this ticket:

```text
M README.md
M docs/first-run.md
M package.json
?? src/local-smoke.test.ts
?? .loom/evidence/20260523-repeatable-local-smoke-harness-validation.md
```

## What This Shows

- `ticket:20260523-repeatable-local-smoke-harness#ACC-001` - supports - a single documented command, `npm run test:smoke:local`, runs the local smoke path.
- `ticket:20260523-repeatable-local-smoke-harness#ACC-002` - supports - the smoke path uses synthetic fixture source data and temporary recorder data dirs, with assertions against default real Pi session/data paths.
- `ticket:20260523-repeatable-local-smoke-harness#ACC-003` - supports - the smoke path exercises bootstrap/status, sync/query indexing, failed occurrence capture, reflection output, guided rule approval/injection, and rules status surfaces in a deterministic fake-Pi harness.
- `ticket:20260523-repeatable-local-smoke-harness#ACC-004` - supports - typecheck, full tests, build, and package dry-run passed after the harness was added.

## What This Does Not Show

- It does not exercise a real interactive Pi TUI.
- It does not exercise a real model provider.
- It does not prove long-run corpus tuning or high-confidence live suggestion notification ergonomics.
- It does not prove behavior outside the deterministic fake-Pi/local fixture path.
- It does not execute the built `dist/cli.js` binary; it directly calls the source CLI `main()` entrypoint under Vitest.
- It does not install the package into Pi; package dry-run only verifies packaged files.

## Related Records

- `ticket:20260523-repeatable-local-smoke-harness` - consuming ticket.
- `plan:20260523-codebase-stabilization-release-readiness` - parent plan.
- `knowledge:pi-extension-command-bootstrap-data-dir` - isolation lesson guarded by the smoke path.
- `spec:seamless-failure-memory-ux` - extension-first behavior and privacy boundary.
