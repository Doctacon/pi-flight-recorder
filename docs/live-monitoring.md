# Live Failure Monitoring

Live monitoring is now extension-first.

```text
Pi session_start
  -> load local settings
  -> start quiet local capture/indexing
failed Pi tool_result
  -> record redacted failure occurrence
  -> search prior resolved evidence
  -> notify only when high-confidence gates pass
quiet failures
  -> cluster for /flight-reflect
```

## Modes

```text
off                 no live capture or suggestions
index-only          keep local capture/index fresh, no suggestions
suggest-on-failure  capture plus rare evidence-backed suggestions
```

The Pi extension defaults to `suggest-on-failure` with conservative gates. Most failures stay quiet and become reflection input.

## Pi commands

```text
/flight-status
/flight-mode status|pause|resume|disable|off|index-only|suggest-on-failure
/flight-feedback --action snooze --occurrence occ_...
/flight-reflect [--min-count N] [--limit N] [--model] [--interactive]
/flight-review
/flight-rules status|pending|show|approve|reject|disable|export
/flight-watch status
/flight-watch stop
```

`/flight-watch start` remains available as a manual/debug command inside Pi, but normal extension startup does not require it.

## Multiple Pi sessions

Multiple Pi TUIs can run in the same project/worktree. Only one process owns the polling watcher lock for a data dir + source set; later sessions enter a shared-watcher state instead of warning. Those sessions still record their own live failed `tool_result` occurrences and use the shared local index.

`/flight-status` reports this as:

```text
Capture/index: shared watcher; another Pi session is indexing these sources
```

This is normal, not degraded.

## Suggestion gates

A failed `tool_result` may produce a notification only when:

- live mode is `suggest-on-failure`;
- the signature is not snoozed or silenced;
- the per-window suggestion budget is available;
- the signature is not cooling down;
- a prior episode matches;
- that prior episode has an observed resolution;
- the match is specific enough for a live nudge;
- confidence clears the configured threshold.

When a failure passes these gates, Flight Recorder shows the prior-fix text as a warning and a visible widget above the editor so the suggestion remains inspectable after the tool result renders.

Suppressed reasons are stored with occurrences, including `no-match`, `unresolved-match`, `broad-match`, `low-confidence`, `cooldown`, `max-suggestions`, and `silenced`.

## Occurrence ledger

Live failures are recorded separately from historical extracted episodes. Each occurrence stores redacted/bounded text plus metadata:

- source (`tool_result`, `manual`, etc.);
- tool and command when available;
- cwd;
- session file and entry/tool id when available;
- normalized signature;
- repeat count for duplicate events;
- suggestion outcome or suppression reason.

This ledger is the reflection buffer. Low-confidence/no-match failures are intentionally retained rather than shown immediately.

## Reflection

```text
/flight-reflect
/flight-reflect --min-count 3
```

Reflection mines local occurrence clusters and emits pattern-level proposals with evidence, likely durable fix or next investigation step, confidence, limits, and actions.

`/flight-reflect --model` is explicit. It uses bounded redacted snippets only when Pi exposes a model provider; otherwise deterministic local reflection is used and labeled.

## Feedback

```text
/flight-feedback --action useful --proposal refl_...
/flight-feedback --action wrong-match --occurrence occ_...
/flight-feedback --action snooze --occurrence occ_...
/flight-feedback --action silence-pattern --signature "..."
/flight-feedback --action promote-later --cluster cluster_...
/flight-feedback --action make-rule --cluster cluster_...
```

Snooze and silence affect future live suggestions/reflection. `promote-later` stores user intent. `make-rule` creates a draft Flight Rule candidate; only explicit approval through the guided review flow or `/flight-rules approve` activates a rule for future turns.

## Debug CLI

The CLI is a debug/manual/recovery harness:

```sh
npm run cli -- status --json
npm run cli -- watch start --foreground --mode index-only
npm run cli -- reflect --min-count 2
```

Foreground CLI watch still uses local polling, debounce, a local lock, and stop-request files. It intentionally does not install an OS daemon.

## Validation limits

Automated tests and local smoke cover live occurrence capture, quiet buffering, reflection, feedback/rule paths, and bounded prompt injection in fake-Pi/source-checkout contexts. Real Pi evidence now covers `/flight-status`, failed `tool_result` capture, `/flight-reflect` rendering, disposable project-local package startup, guided Flight Rule promotion, and visible prior-resolved high-confidence suggestion text. Release evidence still does not prove:

- model-assisted reflection with a real provider;
- long-run precision/noise tuning over a mature local occurrence corpus.

## Privacy and limits

- All capture, search, clustering, and local reflection are local SQLite by default.
- Stored live occurrence text redacts obvious secrets and user-home/session-file paths before persistence.
- No network/model calls happen automatically.
- Raw Pi sessions remain the source of truth.
- `user_bash` is registered but not wrapped. Pi exposes it before execution, and result capture would require replacing shell semantics.
- Suggestions/reflections are heuristic evidence pointers, not autonomous fixes.
