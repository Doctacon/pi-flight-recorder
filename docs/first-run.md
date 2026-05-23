# First Run

`pi-flight-recorder` builds a local failure-memory index from Pi JSONL sessions.

## 1. Install and verify

```sh
npm install
npm run typecheck
npm test
npm run build
```

## 2. Sync sessions

Default sync reads:

```text
~/.pi/agent/sessions
~/.pi/agent/sessions-archive
```

Run:

```sh
npm run cli -- sync
```

For a project-local index or fixture corpus:

```sh
npm run cli -- sync --source /path/to/session-root --data-dir ./.pi-flight-recorder
```

Useful options:

```text
--source DIR    repeatable source directory or JSONL file root
--data-dir DIR  local index directory
--limit N       only process first N discovered JSONL files
--force         reparse even unchanged files
--json          machine-readable sync summary
```

## 3. Query failure memory

```sh
npm run cli -- seen-this-before "npm test Cannot find module src/config/app.ts"
```

Project-filtered query:

```sh
npm run cli -- seen-this-before --cwd /Users/me/project "Cannot find module"
```

JSON output:

```sh
npm run cli -- query --json "duckdb path error"
```

## 4. Interpret output

A good match separates:

- prior failure;
- likely prior fix if one was observed;
- attempts worth inspecting or avoiding;
- files mentioned;
- evidence refs: session id, entry id, cwd, source file;
- limits and confidence.

If no passing validation was detected after a failure, the episode is shown as unresolved instead of inventing a fix.

## 5. Optional live monitoring

Live monitoring is opt-in. Start with quiet indexing:

```sh
npm run cli -- watch start --foreground --mode index-only
```

For evidence-backed suggestions when new failures are detected:

```sh
npm run cli -- watch start --foreground --mode suggest-on-failure --min-confidence 0.7 --cooldown-ms 300000
```

Use explicit sources/data directory when testing fixtures:

```sh
npm run cli -- watch start --foreground --source /path/to/session-root --data-dir ./.pi-flight-recorder --mode suggest-on-failure
```

Inspect status or request stop from another shell:

```sh
npm run cli -- watch status --data-dir ./.pi-flight-recorder
npm run cli -- watch stop --data-dir ./.pi-flight-recorder
```

Live monitor behavior:

- catch-up sync runs before the watcher reports active;
- only `.jsonl` files are considered;
- file changes are debounced before incremental single-file sync;
- duplicate watchers for the same source/data dir are blocked by a local lock;
- malformed partial JSONL writes become warnings instead of crashing;
- `index-only` suppresses suggestions while keeping the index fresh;
- `suggest-on-failure` applies confidence, cooldown, and max-window controls before showing anything.

This slice uses a foreground polling watcher. It does not install launchd/systemd services.

## 6. Record feedback

```sh
npm run cli -- feedback --episode ep_... --rating useful
```

Allowed ratings:

```text
useful
wrong-match
already-solved
not-useful
promote-later
```

Feedback is local SQLite state only. It is not automatically promoted into Loom or any project memory.

## 7. Pi extension use

The source extension is `src/pi-extension.ts`. It registers:

```text
/flight-sync
/seen-this-before
/flight-mode
/flight-watch
flight_seen_this_before
```

Example inside Pi:

```text
/flight-sync --data-dir ~/.pi/flight-recorder
/seen-this-before --cwd current Cannot find module src/config/app.ts
/flight-mode suggest-on-failure --data-dir ~/.pi/flight-recorder
/flight-watch start --source ~/.pi/agent/sessions --mode index-only
/flight-watch status
```

Live Pi behavior:

- `tool_result` failures are inspected without mutating the result;
- high-confidence matches use Pi notifications with prior fix/evidence/limits;
- low-confidence/no-match/cooldown cases are quiet;
- the current session file is synced after a short delay because Pi persists final tool-result messages after the live event;
- `user_bash` is registered as a future seam, but this slice does not wrap user shell commands.

The wrapper calls the same core library used by the CLI.

## Notes and limits

- Node 24 currently prints an `ExperimentalWarning` for `node:sqlite` on sync/query. This is expected for the MVP.
- Extraction is heuristic. Treat “likely fix” as a pointer to inspect, not proof.
- Obvious secret-looking values are redacted in derived snippets, but raw Pi session files remain local source of truth.
- The MVP does not call embeddings, hosted APIs, or autonomous code fixers.
- Live monitoring is opt-in and foreground-only in this slice.
- Suggestions are heuristic pointers to prior evidence, not proof that the old fix applies.
