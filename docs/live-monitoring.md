# Live Failure Monitoring

Live monitoring is an opt-in layer over the local Failure Memory index.

```text
Pi JSONL append or failed Pi tool result
  -> incremental sync / live failure query
  -> prior episode search excluding the current failure
  -> suggestion only if mode, confidence, cooldown, and window gates allow
```

## Modes

```text
off                 do nothing live
index-only          keep the index fresh, no suggestions
suggest-on-failure  show evidence-backed suggestions for confident matches
```

Default live mode is conservative. CLI watch defaults to `index-only`; the Pi extension defaults to `off` until `/flight-mode` or `/flight-watch` opts in.

## CLI

Foreground watcher:

```sh
npm run cli -- watch start --foreground --mode index-only
npm run cli -- watch start --foreground --mode suggest-on-failure --min-confidence 0.7 --cooldown-ms 300000
```

Status and stop request:

```sh
npm run cli -- watch status
npm run cli -- watch stop
```

Useful options:

```text
--source DIR          repeatable Pi session source directory
--data-dir DIR        local flight-recorder data directory
--mode MODE           off | index-only | suggest-on-failure
--debounce-ms N       wait for JSONL write bursts before syncing
--poll-interval-ms N  foreground polling interval
--min-confidence N    minimum suggestion confidence
--cooldown-ms N       per-signature suggestion cooldown
--max-suggestions N   max suggestions per window
```

This slice intentionally does not install an OS daemon. Keep the foreground process running in a terminal/tmux pane, or use Pi `/flight-watch start` for a watcher owned by the Pi extension process.

## Pi extension

```text
/flight-mode suggest-on-failure --data-dir ~/.pi/flight-recorder --min-confidence 0.7
/flight-watch start --source ~/.pi/agent/sessions --mode index-only
/flight-watch status
/flight-watch stop
```

The live Pi hook inspects failed `tool_result` events and does not mutate the result. It searches immediately from the event content, then schedules a delayed current-session sync because Pi persists the final tool-result entry after the live event fires.

`user_bash` is registered but not wrapped in this slice. Pi exposes user bash before execution; safely observing the result would require replacing/wrapping shell operations. That is deferred to avoid changing command semantics.

## Watcher behavior

- Catch-up sync runs before the watcher reports `active`.
- Only `.jsonl` files are considered.
- Changes are debounced before incremental sync.
- A local lock prevents duplicate watchers for the same source set.
- Status is persisted to `live-status.json` under the data dir.
- `watch stop` writes a stop request that a foreground watcher observes on its next poll.
- Malformed/partial JSONL lines are stored as parse warnings, not fatal errors.

## Privacy

All live behavior is local. It uses the same SQLite/FTS5 index and redaction helpers as manual sync/query. No embeddings or network calls are made by default.

## Limits

- Suggestions are heuristic and evidence-backed, not autonomous fixes.
- Cross-project matches are labeled in limits.
- Low-confidence and cooldown-suppressed cases are intentionally quiet.
- Foreground CLI watch is not an OS service; stopping a terminal stops the watcher.
