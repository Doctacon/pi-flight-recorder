# Live Monitoring Validation

ID: evidence:20260522-live-monitoring-validation
Type: Evidence Dossier
Status: recorded
Created: 2026-05-22
Updated: 2026-05-22
Observed: 2026-05-23

## Summary

Validation dossier for the `plan:20260522-live-failure-monitoring` implementation. It records automated test/build/package checks plus a bounded CLI foreground watcher smoke run. Evidence is observational; tickets own acceptance and closure decisions.

## Observations

- Observation: TypeScript strict typecheck completed without errors.
  - Procedure/source: `cd /Users/crlough/Code/personal/pi-flight-recorder && npm run typecheck`
  - Actual result: command exited 0.

- Observation: Full Vitest suite completed successfully after live monitoring implementation and the final Pi extension cooldown-state adjustment.
  - Procedure/source: `cd /Users/crlough/Code/personal/pi-flight-recorder && npm test`
  - Actual result: 9 test files passed, 35 tests passed. Node printed the expected experimental `node:sqlite` warning.

- Observation: Build completed successfully.
  - Procedure/source: `cd /Users/crlough/Code/personal/pi-flight-recorder && npm run build`
  - Actual result: command exited 0 and emitted `dist/` files including `dist/live-suggestions.*` and `dist/watch-service.*`.

- Observation: Package dry-run completed and included new live-monitoring build/docs files.
  - Procedure/source: `cd /Users/crlough/Code/personal/pi-flight-recorder && npm pack --dry-run` after final build.
  - Actual result: command exited 0; tarball contents included `dist/live-suggestions.js`, `dist/watch-service.js`, `docs/first-run.md`, and `docs/live-monitoring.md`.

- Observation: CLI watch status and stop commands run against an empty temp data dir.
  - Procedure/source: `DATA_DIR=$(mktemp -d /tmp/pfr-watch-status-XXXXXX) && npm run cli -- watch status --data-dir "$DATA_DIR" && npm run cli -- watch stop --data-dir "$DATA_DIR"`
  - Actual result excerpt:

    ```text
    Flight recorder live mode: stopped
    Watcher: stopped
    No persisted watcher status found.
    Flight recorder watch stop requested: /tmp/pfr-watch-status-j99ebO/watch-stop.json
    ```

- Observation: Foreground CLI watcher indexed an appended JSONL failure in a temp session corpus.
  - Procedure/source: A temp source dir was created with a `session.jsonl` header; `npm run cli -- watch start --foreground --source "$ROOT" --data-dir "$DATA" --mode index-only --poll-interval-ms 25 --debounce-ms 25` was started; a failed `bashExecution` entry was appended; `watch stop` requested stop; `query --json "Cannot find module"` was run against the same data dir.
  - Actual result excerpt:

    ```text
    Flight recorder live mode: index-only
    Watcher: active
    Sources: /tmp/pfr-live-src-KPyHeP
    Watched files: 1
    Last failure: ep_6a048d6bbd969a2c from /tmp/pfr-live-src-KPyHeP/session.jsonl
    Suggestion mode: index-only
    Last suggestion: none
    Warnings: 0
    Errors: 0
    Flight recorder watch stopped.
    ```

    Query excerpt after watcher exit:

    ```text
    "id": "ep_6a048d6bbd969a2c",
    "sourceFile": "/tmp/pfr-live-src-KPyHeP/session.jsonl",
    "problemSummary": "`npm test` exited 1: Error: Cannot find module '../paths'",
    "entryId": "fail0001"
    ```

## Artifacts

- Source files added/changed for live behavior:
  - `src/sync.ts`, `src/sync.test.ts` - incremental single-file sync and new episode IDs.
  - `src/watch-service.ts`, `src/watch-service.test.ts` - polling watcher, debounce, lock/status/stop, catch-up.
  - `src/live-suggestions.ts`, `src/live-suggestions.test.ts` - suggestion engine, current-episode exclusion, cwd preference, suppression.
  - `src/cli.ts`, `src/cli.test.ts` - `watch` CLI controls.
  - `src/pi-extension.ts`, `src/pi-extension.test.ts` - `/flight-mode`, `/flight-watch`, live `tool_result` hook, persistent cooldown state, delayed sync.
  - `README.md`, `docs/first-run.md`, `docs/live-monitoring.md` - user-facing documentation.

- Validation command excerpts:

  ```text
  npm run typecheck
  > tsc --noEmit
  # exit 0
  ```

  ```text
  npm test
  Test Files  9 passed (9)
  Tests  35 passed (35)
  ```

  ```text
  npm run build
  > rm -rf dist
  > tsc -p tsconfig.build.json
  # exit 0
  ```

  ```text
  npm pack --dry-run
  Tarball Contents included dist/live-suggestions.*, dist/watch-service.*, docs/live-monitoring.md
  # exit 0
  ```

## What This Shows

- `ticket:20260522-incremental-session-sync-api#ACC-001` through `#ACC-004` - supports: automated tests cover single-file sync, unchanged skip/idempotency, appended new episode IDs, and batch sync compatibility; full typecheck/test/build passed.
- `ticket:20260522-session-watch-service#ACC-001` through `#ACC-005` - supports: tests cover active status, catch-up sync, debounced change sync, duplicate lock behavior, stop/status, and malformed partial JSONL warning behavior; CLI smoke showed foreground watcher indexing an appended failure.
- `ticket:20260522-live-suggestion-engine#ACC-001` through `#ACC-005` - supports: tests cover suggestion with prior fix/evidence, current episode exclusion, cwd preference/cross-project label, suppression by mode/threshold/cooldown/max-window, and status counters.
- `ticket:20260522-watch-cli-controls#ACC-001` through `#ACC-004` - supports: CLI tests and smoke cover `watch status`, `watch stop`, conservative `watch start` foreground requirement, and status output; service tests cover foreground watch behavior and options.
- `ticket:20260522-pi-live-failure-hook#ACC-001` through `#ACC-005` - supports: fake-Pi tests cover command/hook registration, live mode setting, failed `tool_result` suggestion without mutation, low-noise behavior through suggestion engine tests, and delayed current-session sync. User bash result observation is explicitly deferred rather than overclaimed.
- `ticket:20260522-live-monitoring-validation-docs#ACC-001` through `#ACC-004` - supports: this evidence includes watcher smoke, suggestion/cooldown tests, fake-Pi hook validation, and docs updates.

## What This Does Not Show

- It does not show a manual live Pi TUI smoke test; Pi validation is via fake-Pi extension tests.
- It does not show OS daemon behavior; this slice is foreground/polling watcher only.
- It does not show native watcher behavior; the implementation deliberately avoids a native watcher dependency for this slice.
- It does not prove suggestion quality on the user's full real session corpus; tests use curated fixtures and one temp smoke fixture.
- It does not show safe wrapping of `user_bash` command results. The implementation registers the event as a future seam and documents that result observation is deferred to avoid altering shell semantics.
- It does not eliminate the Node 24 `node:sqlite` experimental warning.

## Related Records

- `plan:20260522-live-failure-monitoring` - validation target.
- `spec:live-failure-monitoring` - requirements and scenarios exercised by tests/smoke.
- `research:20260522-live-failure-watcher-inspiration` - design inspiration and limits.
- `ticket:20260522-incremental-session-sync-api`
- `ticket:20260522-session-watch-service`
- `ticket:20260522-live-suggestion-engine`
- `ticket:20260522-watch-cli-controls`
- `ticket:20260522-pi-live-failure-hook`
- `ticket:20260522-live-monitoring-validation-docs`
