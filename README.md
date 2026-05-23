# pi-flight-recorder

Local-first flight recorder for Pi coding sessions.

The first product slice is **Failure Memory**: parse Pi session JSONL, extract command/tool failures and eventual fixes, then answer “have I seen this before?” with evidence-backed links to prior sessions.

## Status

MVP core plus opt-in live monitoring are implemented:

- strict TypeScript library + CLI;
- Pi JSONL parser with source refs and branch ancestry;
- local SQLite/FTS5 index using Node 24 `node:sqlite`;
- failure/fix episode extraction with redaction;
- incremental single-file sync that reports newly detected episode IDs;
- polling session watch service with catch-up, debounce, local lock, stop request, and persisted status;
- live suggestion engine with current-episode exclusion, cwd preference, confidence threshold, cooldown, and quiet modes;
- `sync`, `query`, `seen-this-before`, `watch`, and `feedback` CLI commands;
- Pi extension wrapper with `/flight-sync`, `/seen-this-before`, `/flight-mode`, `/flight-watch`, live `tool_result` suggestions, and `flight_seen_this_before` tool.

## Requirements

- Node.js 24+ with `node:sqlite` and FTS5.
- Local Pi sessions under `~/.pi/agent/sessions/` and/or `~/.pi/agent/sessions-archive/`.

Node currently prints an `ExperimentalWarning` when `node:sqlite` is first loaded. The project accepts that for the MVP to avoid a native SQLite dependency.

## Install for development

```sh
npm install
npm run typecheck
npm test
npm run build
```

## CLI usage

Index default Pi sessions:

```sh
npm run cli -- sync
```

Index a fixture or explicit source directory:

```sh
npm run cli -- sync --source /path/to/sessions --data-dir ./.pi-flight-recorder
```

Ask whether a failure has appeared before:

```sh
npm run cli -- seen-this-before --data-dir ./.pi-flight-recorder "Cannot find module src/config/app.ts"
```

Get machine-readable output:

```sh
npm run cli -- query --json "npm test Cannot find module"
```

Run opt-in live watching in the foreground:

```sh
npm run cli -- watch start --foreground --mode index-only
npm run cli -- watch start --foreground --mode suggest-on-failure --min-confidence 0.7 --cooldown-ms 300000
```

Inspect or request stop from another shell:

```sh
npm run cli -- watch status
npm run cli -- watch stop
```

Notes:

- `watch start` intentionally requires `--foreground`; OS launch agents/daemons are not installed by this slice.
- The watcher uses local polling plus debounce instead of a native watcher dependency, keeping install friction low.
- `index-only` updates the local index quietly; `suggest-on-failure` prints evidence-backed suggestions when confidence/cooldown gates allow.

See `docs/live-monitoring.md` for modes, Pi commands, status, stop requests, privacy, and limits.

Record local feedback:

```sh
npm run cli -- feedback --episode ep_... --rating useful
```

Ratings currently supported:

```text
useful | wrong-match | already-solved | not-useful | promote-later
```

## Pi extension

The extension entry is:

```text
src/pi-extension.ts
```

After build, `package.json` exposes a Pi package manifest:

```json
"pi": { "extensions": ["./dist/pi-extension.js"] }
```

It registers:

- `/flight-sync` - index local Pi sessions.
- `/seen-this-before` - query failure memory from inside Pi.
- `/flight-mode` - set live mode: `off`, `index-only`, or `suggest-on-failure`.
- `/flight-watch` - start, stop, or inspect live session watching inside Pi.
- `flight_seen_this_before` - tool-style query surface for agents.

Example command inside Pi:

```text
/flight-sync --source ~/.pi/agent/sessions --data-dir ~/.pi/flight-recorder
/seen-this-before --cwd current Cannot find module src/config/app.ts
/flight-mode suggest-on-failure --data-dir ~/.pi/flight-recorder --min-confidence 0.7
/flight-watch start --source ~/.pi/agent/sessions --mode index-only
```

When live mode is `suggest-on-failure`, failed Pi `tool_result` events are searched immediately and the current session file is synced after a short delay so durable provenance can catch up. Pi `user_bash` is registered as an explicit future seam, but this slice does not wrap user shell execution because that could alter command semantics.

## Local-first privacy posture

- No network calls are made by the MVP.
- Raw Pi sessions stay as source files; derived state is rebuildable.
- Derived snippets redact obvious token/password/key/private-key patterns.
- Query answers cite session files, entry IDs, cwd, and limits so claims stay inspectable.

## Loom records

Planning lives under `.loom/`:

- `.loom/research/20260522-agent-session-memory-landscape.md`
- `.loom/research/20260522-live-failure-watcher-inspiration.md`
- `.loom/specs/failure-memory-mvp.md`
- `.loom/specs/live-failure-monitoring.md`
- `.loom/plans/20260522-pi-flight-recorder-mvp.md`
- `.loom/plans/20260522-live-failure-monitoring.md`
- `.loom/tickets/20260522-*.md`
