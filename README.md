# pi-flight-recorder

Local-first failure memory and reflection for Pi coding sessions.

The product goal is extension-first: install the Pi extension, keep working, and let the recorder quietly index failures, surface only high-confidence prior fixes, and periodically reflect on repeated failure patterns.

## Status

Implemented:

- strict TypeScript library + debug CLI;
- Pi JSONL parser with source refs and branch ancestry;
- local SQLite/FTS5 index using Node 24 `node:sqlite`;
- failure/fix episode extraction with redaction;
- incremental single-file sync and foreground polling watcher;
- Pi extension autostart on `session_start` with persisted local settings;
- live failure occurrence ledger for quiet/no-match/suppressed failures;
- high-confidence live suggestion gates with prior-resolution requirement, specificity gate, cooldown, and silence/snooze feedback;
- local repeated-failure clustering and `/flight-reflect` pattern proposals;
- optional model-assisted reflection only when explicitly requested and a provider is available;
- Pi commands: `/flight-status`, `/flight-mode`, `/flight-feedback`, `/flight-reflect`, `/flight-sync`, `/seen-this-before`, `/flight-watch`;
- debug CLI commands: `status`, `sync`, `query`, `seen-this-before`, `watch`, `reflect`, `feedback`.

## Requirements

- Node.js 24+ with `node:sqlite` and FTS5.
- Local Pi sessions under `~/.pi/agent/sessions/` and/or `~/.pi/agent/sessions-archive/`.

Node currently prints an `ExperimentalWarning` when `node:sqlite` is first loaded. This is accepted to avoid a native SQLite dependency.

## Install for development

```sh
npm install
npm run typecheck
npm test
npm run build
```

## Normal Pi usage

Build the package, install/enable it as a Pi extension, then work normally in Pi. The extension initializes local state on `session_start`, starts quiet local indexing/capture unless disabled, and keeps all derived state under:

```text
~/.pi/flight-recorder/
```

Useful Pi commands:

```text
/flight-status
/flight-mode status
/flight-mode pause
/flight-mode resume
/flight-mode disable
/flight-reflect
/flight-feedback --action snooze --occurrence occ_...
/seen-this-before --cwd current Cannot find module src/config/app.ts
```

Default behavior:

- autostart is on after the extension is enabled;
- mode defaults to `suggest-on-failure`, but live nudges require conservative gates;
- no-match, low-confidence, cooldown, broad-match, and silenced failures are buffered quietly;
- `/flight-reflect` groups repeated buffered failures into pattern-level proposals;
- model-assisted reflection is disabled by default and only used for `/flight-reflect --model` when Pi provides a model completion surface.

## Immediate suggestions

A live nudge is shown only when a failed `tool_result` matches strong prior local evidence:

- prior episode has an observed resolution;
- match clears confidence and specificity gates;
- same-cwd matches are preferred;
- cooldown and max-window budgets allow another notification;
- the signature is not snoozed or silenced.

The extension does **not** mutate Pi tool results. `user_bash` remains disabled for result capture because Pi exposes it before execution; wrapping shell commands would risk changing semantics.

## Reflection

Repeated quiet failures are stored as local occurrences, mined into clusters, and summarized as pattern proposals:

```text
/flight-reflect --min-count 3
/flight-reflect --model   # explicit, bounded/redacted model assistance if available
```

Reflection proposals include:

- pattern summary;
- affected tools/cwds/counts;
- likely durable fix or next investigation step;
- representative evidence refs;
- confidence and limits;
- actions: `useful`, `wrong-match`, `snooze`, `silence-pattern`, `promote-later`, `make-rule`.

## Debug CLI usage

The CLI is a development/debug/recovery harness, not the normal UX.

```sh
npm run cli -- status --json
npm run cli -- sync
npm run cli -- seen-this-before "Cannot find module src/config/app.ts"
npm run cli -- reflect --min-count 2
npm run cli -- watch start --foreground --mode index-only
npm run cli -- feedback --action useful --episode ep_...
```

The foreground watcher intentionally does not install launchd/systemd services.

## Local-first privacy posture

- No network calls are made by default.
- Raw Pi sessions stay as source files; derived indexes are rebuildable.
- Derived snippets redact obvious token/password/key/private-key patterns.
- Model-assisted reflection is opt-in/manual and uses bounded redacted snippets.
- Query/suggestion/reflection answers cite local evidence and limits.

## Loom records

Planning lives under `.loom/`, including:

- `.loom/specs/seamless-failure-memory-ux.md`
- `.loom/plans/20260523-seamless-failure-memory-ux.md`
- `.loom/tickets/20260523-*.md`
- `.loom/evidence/`
