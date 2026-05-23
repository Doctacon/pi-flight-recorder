# Live Failure Watcher Inspiration

ID: research:20260522-live-failure-watcher-inspiration
Type: Research
Status: completed
Created: 2026-05-22
Updated: 2026-05-22

## Summary

This research looked at SocratiCode's watcher/auto-resume architecture and Pi extension event hooks to shape the next `pi-flight-recorder` product behavior: automatic failure tracking and immediate “seen this before” suggestions. The conclusion is to add an opt-in live layer with two complementary paths: a file-watcher/daemon that keeps the index fresh from Pi JSONL changes, and a Pi event hook that reacts immediately when a live tool/user bash command fails.

## Question

What architecture should `pi-flight-recorder` use to automatically track live Pi failures and suggest prior fixes without requiring the user to manually run `sync` and type the current error?

## Scope

Covered:

- SocratiCode's file watcher, debounce, ignore/filter, lock, auto-start, and catch-up patterns.
- Pi extension events relevant to live failure detection.
- How those patterns should translate to Pi session JSONL rather than codebase indexing.

Excluded:

- Implementing the watcher now.
- Copying SocratiCode code. SocratiCode is AGPL-3.0-only, so its source is used as design inspiration, not as code to transplant.
- Broader daemon supervision systems such as launchd/systemd.
- Hosted services or embedding-backed matching.

## Method And Sources

- Web search for SocratiCode daemon/file watcher implementation identified `giancarloerra/SocratiCode` and its watcher docs.
- Cloned `https://github.com/giancarloerra/SocratiCode` at commit `bca259805ec3843467c2e070c88935162724d02f` via `fetch_content`.
- Inspected:
  - `src/services/watcher.ts` for watcher structure, debounce, ignore filtering, cross-process lock, error throttling, stop/status helpers, and opportunistic auto-start.
  - `src/tools/index-tools.ts` for manual watch start catch-up behavior.
  - `src/services/startup.ts` for auto-resume and catch-up on startup.
- Re-read local Pi extension docs at `/Users/crlough/.bun/install/global/node_modules/@earendil-works/pi-coding-agent/docs/extensions.md` around `tool_result`, `tool_call`, and `user_bash` events.

## Findings

1. SocratiCode uses `@parcel/watcher` for a single native recursive subscription per project, with a fixed debounce timer of 2000ms before triggering incremental updates. See `DEBOUNCE_MS` and `scheduleUpdate` in [`src/services/watcher.ts`](https://github.com/giancarloerra/SocratiCode/blob/bca259805ec3843467c2e070c88935162724d02f/src/services/watcher.ts#L21-L24) and [`src/services/watcher.ts#L111-L145`](https://github.com/giancarloerra/SocratiCode/blob/bca259805ec3843467c2e070c88935162724d02f/src/services/watcher.ts#L111-L145).
2. SocratiCode guards against duplicate watchers with an in-memory subscription map plus a cross-process lock before subscribing. See [`src/services/watcher.ts#L15-L19`](https://github.com/giancarloerra/SocratiCode/blob/bca259805ec3843467c2e070c88935162724d02f/src/services/watcher.ts#L15-L19) and [`src/services/watcher.ts#L92-L103`](https://github.com/giancarloerra/SocratiCode/blob/bca259805ec3843467c2e070c88935162724d02f/src/services/watcher.ts#L92-L103).
3. SocratiCode filters events before scheduling work: it checks supported/special files, makes paths relative to the watched root, rejects out-of-root paths, and applies ignore rules. See [`src/services/watcher.ts#L37-L42`](https://github.com/giancarloerra/SocratiCode/blob/bca259805ec3843467c2e070c88935162724d02f/src/services/watcher.ts#L37-L42) and [`src/services/watcher.ts#L178-L188`](https://github.com/giancarloerra/SocratiCode/blob/bca259805ec3843467c2e070c88935162724d02f/src/services/watcher.ts#L178-L188).
4. SocratiCode treats watcher failures as non-fatal: logs/throttles errors, stops after too many consecutive watcher errors, and backs off when infrastructure appears down. See [`src/services/watcher.ts#L131-L141`](https://github.com/giancarloerra/SocratiCode/blob/bca259805ec3843467c2e070c88935162724d02f/src/services/watcher.ts#L131-L141) and [`src/services/watcher.ts#L151-L171`](https://github.com/giancarloerra/SocratiCode/blob/bca259805ec3843467c2e070c88935162724d02f/src/services/watcher.ts#L151-L171).
5. SocratiCode watch start runs a catch-up update before starting the watcher so changes made while the watcher was down are not missed; failures during catch-up are non-fatal. See [`src/tools/index-tools.ts#L343-L374`](https://github.com/giancarloerra/SocratiCode/blob/bca259805ec3843467c2e070c88935162724d02f/src/tools/index-tools.ts#L343-L374).
6. SocratiCode startup auto-resume checks whether a project is already indexed, handles interrupted indexing separately, starts watching completed indexes, and runs an incremental catch-up in the background. See [`src/services/startup.ts#L20-L37`](https://github.com/giancarloerra/SocratiCode/blob/bca259805ec3843467c2e070c88935162724d02f/src/services/startup.ts#L20-L37), [`src/services/startup.ts#L73-L111`](https://github.com/giancarloerra/SocratiCode/blob/bca259805ec3843467c2e070c88935162724d02f/src/services/startup.ts#L73-L111), and [`src/services/startup.ts#L114-L135`](https://github.com/giancarloerra/SocratiCode/blob/bca259805ec3843467c2e070c88935162724d02f/src/services/startup.ts#L114-L135).
7. Pi extension docs expose `tool_result` after tool execution and before final tool-result message events. Handlers can inspect `event.toolName`, `event.input`, `event.content`, `event.details`, and `event.isError`, and can use `ctx.signal` for nested async work. This is the best immediate hook for live tool failures.
8. Pi extension docs expose `user_bash` for user-triggered `!` / `!!` commands with `event.command`, `event.cwd`, and the ability to wrap or replace bash operations. This can observe user shell commands separately from assistant tool calls.
9. Pi extension docs warn that final tool-result message events are emitted after `tool_result`, and tool results can interleave in parallel mode. A Pi live hook should either record from the event directly or schedule a short catch-up sync of the current session after persistence, rather than assuming `ctx.sessionManager` already includes the final tool-result entry.

## Tradeoffs

- **File watcher vs Pi event hook.** A file watcher is host-agnostic and keeps the index current across Pi sessions, restarts, and missed events. A Pi event hook is lower-latency and can show suggestions in the active session. The live product should support both; watcher is the durable baseline, Pi hook is the immediate UX.
- **Daemon process vs foreground watch command.** A foreground watch command is simpler and testable; a daemon/background supervisor is more convenient but adds lifecycle complexity. Start with `watch --foreground` plus Pi extension auto-start hooks; add OS daemonization later if needed.
- **Watch every JSONL append vs poll current session.** Watching session files minimizes Pi API coupling but must debounce partial writes. A Pi hook can capture live failures before the file is fully persisted, but needs careful source refs. Use both: event hook for immediate query text, debounced file sync for durable provenance.
- **Immediate notification vs quiet indexing.** Auto-suggestions can become noisy. The behavior needs thresholds, cooldowns, and user-configurable modes: `off`, `index-only`, `suggest-on-failure`.
- **Native watcher dependency.** SocratiCode uses `@parcel/watcher`, which is a good model for recursive native watching. The implementation ticket should evaluate adding it as an open-source runtime dependency rather than attempting brittle recursive `fs.watch` logic.

## Rejected Paths And Null Results

- **Only periodic sync** - rejected because it keeps the index fresh eventually but does not satisfy “command fails → immediately seen-before suggestion.”
- **Only Pi `tool_result` hook** - rejected because it misses failures from older sessions, external processes, or periods when the extension is not loaded.
- **Auto-injecting a follow-up prompt for every failure** - rejected as too intrusive for the first live slice. Use notifications/custom messages first; agent-steering should be a later opt-in.
- **Copying SocratiCode watcher code** - rejected due AGPL source license and because our domain is Pi session logs, not codebase files.

## Conclusions

The next product behavior should be specified as opt-in live failure monitoring:

```text
Pi command/tool/user-bash failure or JSONL append
  ↓
debounced current-session sync / direct event capture
  ↓
new failure episode extracted
  ↓
query prior episodes excluding the current source failure
  ↓
if confidence threshold and cooldown allow, show evidence-backed suggestion
```

The implementation should keep the existing local-first core and add:

- incremental single-file sync and episode diffing;
- watcher service with debounce, ignore/filter, status, stop, catch-up, and lock/cooldown behavior;
- suggestion engine that searches prior failures while excluding the current episode;
- Pi extension live hook and user-visible controls;
- docs/tests for watch mode, immediate hook mode, and quiet/noisy behavior.

## Recommendations

- Create `spec:live-failure-monitoring` for the intended behavior.
- Create a new multi-ticket plan rather than extending the already-reviewed MVP plan.
- Use SocratiCode patterns as architectural inspiration: native watcher, debounce, filtered events, cross-process lock, catch-up on start, non-fatal watcher failure handling, status/stop commands.
- Keep live mode opt-in until noise/precision has been tested on the user's real sessions.

## Open Questions

- Which notification surface should be default inside Pi: `ctx.ui.notify`, visible `custom_message`, or both? Recommended MVP: notify first; custom message only for higher-confidence matches.
- Should the watcher be started automatically on Pi session start? Recommended MVP: opt-in command/config first, then auto-start after trust improves.
- Should live suggestions query across all projects by default or current cwd only? Recommended MVP: current cwd first, with explicitly labeled cross-project fallback if no current-project match exists.

## Related Records

- `spec:live-failure-monitoring` - consumes this research as the behavior contract.
- `plan:20260522-live-failure-monitoring` - decomposes implementation work.
- `spec:failure-memory-mvp` - existing core that live monitoring builds on.
