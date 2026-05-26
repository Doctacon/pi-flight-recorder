# First Run

`pi-flight-recorder` builds local failure memory from Pi JSONL sessions and runs best as a Pi extension.

## 1. Build and install

```sh
npm install
npm run typecheck
npm test
npm run test:smoke:local
npm run build
```

The local smoke command uses synthetic Pi session fixtures and temporary recorder data directories. It is intended as a release/refactor safety check for extension status, sync/query, live occurrence capture, reflection, and Flight Rule status/injection surfaces without reading your real Pi session history.

Then install/enable the package as a Pi extension using Pi's package workflow. The package manifest exposes:

```json
"pi": { "extensions": ["./dist/pi-extension.js"] }
```

After the extension is loaded, normal use happens inside Pi. You do not need to keep a separate CLI watcher running.

## 2. Check extension status

Inside Pi:

```text
/flight-status
```

Status reports:

- mode and autostart state;
- data directory;
- capture/index watcher state;
- captured failure occurrence counts;
- suggestion gates and last suppression reason;
- reflection settings;
- privacy/model status;
- the `user_bash` capture limitation.

Default data directory:

```text
~/.pi/flight-recorder/
```

## 3. Work normally

On Pi `session_start`, the extension initializes local settings and starts quiet local capture/indexing unless disabled. If another Pi TUI already owns the watcher lock for the same source set, the new session uses the shared watcher/index and still records its own live failed `tool_result` occurrences; `/flight-status` reports this as `shared watcher`, not an error.

On failed Pi `tool_result` events:

- high-confidence prior resolved matches may show a concise notification;
- no-match, low-confidence, broad-match, cooldown, and silenced failures are stored quietly as occurrences;
- the current session file is synced after a short delay so durable provenance can catch up.

The extension does not wrap or mutate tool results.

## 4. Use the learning inbox

For the expectation-delta / artifact-routing corpus, remember one command:

```text
/flight-learn
```

Run it whenever you want to move the next learning item forward. It will:

- prepare safe local delta candidates from existing repeated-failure signals;
- review and route one pending delta when one exists;
- otherwise ask about one artifact candidate that needs applied/outcome feedback;
- otherwise tell you there is nothing ready yet.

The normal pair to remember is:

```text
/flight-status
/flight-learn
```

Advanced fallback commands such as `/flight-delta-review` and `/flight-deltas outcome ...` still exist for debugging/recovery, but they are not the normal workflow.

## 5. Ask directly when needed

```text
/seen-this-before --cwd current npm test Cannot find module src/config/app.ts
```

A good match separates:

- prior failure;
- likely prior fix if one was observed;
- attempts worth inspecting or avoiding;
- files mentioned;
- evidence refs: session id, entry id, cwd, source file;
- limits and confidence.

If no passing validation was detected after a failure, the episode is shown as unresolved instead of inventing a fix.

## 6. Reflect on repeated failures

Manual reflection:

```text
/flight-reflect
/flight-reflect --min-count 3
/flight-review
/flight-reflect --interactive
```

For corpus-building, prefer `/flight-learn`; it wraps the review/outcome path so you do not need to remember the lower-level delta commands.

Optional model-assisted reflection, only when requested and Pi exposes a model completion surface:

```text
/flight-reflect --model
```

Reflection groups repeated local failures and proposes one pattern-level next step with evidence, confidence, limits, and actions. Use `/flight-review` for a guided keyboard-driven review: pick a proposal, pick an action, and optionally draft/edit/approve a scoped Flight Rule.

## 7. Give feedback

Examples:

```text
/flight-feedback --action useful --proposal refl_...
/flight-feedback --action wrong-match --occurrence occ_...
/flight-feedback --action snooze --occurrence occ_...
/flight-feedback --action silence-pattern --signature "npm test cannot find module paths"
/flight-feedback --action promote-later --cluster cluster_...
/flight-feedback --action make-rule --cluster cluster_...
/flight-rules status
```

Feedback is local SQLite state. `promote-later` records user intent. `make-rule` creates a draft candidate; a Flight Rule affects future turns only after explicit approval, and `/flight-rules disable` turns it off.

## 8. Control mode

```text
/flight-mode status
/flight-mode pause
/flight-mode resume
/flight-mode disable
/flight-mode index-only
/flight-mode suggest-on-failure --min-confidence 0.8 --cooldown-ms 300000
```

Modes:

```text
off                 no live capture or suggestions
index-only          local capture/indexing only
suggest-on-failure  capture plus rare high-confidence suggestions
```

## Debug CLI

The CLI is for development, recovery, and inspection:

```sh
npm run cli -- status --json
npm run cli -- sync --source /path/to/session-root --data-dir ./.pi-flight-recorder
npm run cli -- seen-this-before --data-dir ./.pi-flight-recorder "Cannot find module"
npm run cli -- reflect --data-dir ./.pi-flight-recorder --min-count 2
npm run cli -- watch start --foreground --mode index-only
```

Foreground CLI watch is not an OS service.

## Validation limits

The source-checkout local smoke command proves a deterministic fake-Pi path with synthetic fixture data and temp recorder data dirs. It is not real interactive Pi TUI proof and it does not execute the installed package path. Separate evidence now covers disposable project-local `pi install <package> -l` startup, real interactive TUI guided Flight Rule promotion, and visible high-confidence prior-resolved suggestion text.

Still-unproven release edges:

- model-assisted reflection with a real provider;
- long-run reflection precision/noise tuning over a mature occurrence corpus.

## Notes and limits

- Node 24 currently prints an `ExperimentalWarning` for `node:sqlite`; this is expected.
- Extraction, suggestions, and reflection are heuristic pointers to inspect, not proof.
- Obvious secret-looking values and user-home/session-file paths are redacted in derived snippets and live occurrence text; raw Pi session files remain local source of truth.
- No embeddings, hosted APIs, or autonomous code fixers are used by default.
- `user_bash` result capture remains disabled because Pi's event fires before command execution.
