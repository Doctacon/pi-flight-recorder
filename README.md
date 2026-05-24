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
- shared watcher behavior for multiple simultaneous Pi sessions in the same project/source set;
- live failure occurrence ledger for quiet/no-match/suppressed failures;
- high-confidence live suggestion gates with prior-resolution requirement, specificity gate, cooldown, and silence/snooze feedback;
- local repeated-failure clustering and `/flight-reflect` pattern proposals;
- optional model-assisted reflection only when explicitly requested and a provider is available;
- Pi commands: `/flight-status`, `/flight-mode`, `/flight-feedback`, `/flight-reflect`, `/flight-review`, `/flight-rules`, `/flight-sync`, `/seen-this-before`, `/flight-watch`;
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
npm run test:smoke:local
npm run build
```

`npm run test:smoke:local` is a release-oriented local smoke path. It uses synthetic Pi JSONL fixture data plus temporary recorder data directories, not your real `~/.pi/agent/sessions` or `~/.pi/flight-recorder` state, and exercises extension status/sync/query/live occurrence/reflection/rule surfaces in a fake-Pi harness.

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
/flight-review
/flight-rules status
/flight-feedback --action snooze --occurrence occ_...
/seen-this-before --cwd current Cannot find module src/config/app.ts
```

Default behavior:

- autostart is on after the extension is enabled;
- mode defaults to `suggest-on-failure`, but live nudges require conservative gates;
- no-match, low-confidence, cooldown, broad-match, and silenced failures are buffered quietly;
- `/flight-reflect` groups repeated buffered failures into pattern-level proposals;
- model-assisted reflection is disabled by default and only used for `/flight-reflect --model` when Pi provides a model completion surface;
- if another Pi session already owns the watcher lock, this session uses the shared watcher/index and continues live occurrence capture without an autostart warning.

## Immediate suggestions

A live nudge is shown only when a failed `tool_result` matches strong prior local evidence:

- prior episode has an observed resolution;
- match clears confidence and specificity gates;
- same-cwd matches are preferred;
- cooldown and max-window budgets allow another notification;
- the signature is not snoozed or silenced.

When a live nudge does pass these gates, the extension shows the formatted prior-fix text as a warning and as a visible Flight Recorder widget so the suggestion remains inspectable after the tool result renders.

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

Use `/flight-review` or `/flight-reflect --interactive` for a guided Pi-native review flow. `make-rule` drafts a Flight Rule candidate, lets you edit/approve scope, and only approved rules are injected into future turns. `/flight-rules status|pending|show|disable|export` keeps rules inspectable and reversible.

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
- Derived snippets and event/occurrence text redact obvious token/password/key/private-key patterns and user-home/session-file paths.
- Model-assisted reflection is opt-in/manual and uses bounded redacted snippets plus redacted local path labels.
- Query/suggestion/reflection answers cite local evidence and limits.

## Release validation limits

Current validation includes automated tests, the source-checkout local smoke command, build/package dry-run, installed project-local Pi package smoke in a disposable TUI, selected prior real Pi TUI smoke for status/live capture/reflection, real interactive TUI evidence for guided Flight Rule promotion, and real TUI evidence for visible high-confidence prior-resolved suggestion text. The following remain explicit limits rather than proven release claims:

- model-assisted reflection has only fake-provider/bounded-context validation unless you explicitly run it with a real provider;
- long-run reflection precision/noise tuning needs a mature local occurrence corpus.

`npm run test:smoke:local` is for a source checkout. It calls the source CLI entrypoint and fake-Pi extension harness; it is not a substitute for real TUI validation. Installed-package behavior is covered only by the separate disposable project-local Pi smoke evidence, not by local smoke itself.

## Loom records

Planning lives under `.loom/`, including:

- `.loom/specs/seamless-failure-memory-ux.md`
- `.loom/plans/20260523-seamless-failure-memory-ux.md`
- `.loom/tickets/20260523-*.md`
- `.loom/evidence/`
