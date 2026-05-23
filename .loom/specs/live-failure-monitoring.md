# Live Failure Monitoring

ID: spec:live-failure-monitoring
Type: Spec
Status: active
Created: 2026-05-22
Updated: 2026-05-22

## Summary

This spec defines the next product behavior for `pi-flight-recorder`: automatic tracking of live Pi failures and optional immediate “seen this before” suggestions when a command or tool fails.

## Product Slice

This spec owns the live monitoring workflow layered on top of the existing Failure Memory MVP. It covers file-watcher/daemon behavior, Pi event-hook behavior, incremental syncing, suggestion generation, notification controls, status/stop commands, and privacy/noise limits.

This slice stops before OS-level launch agents, hosted sync, embeddings, autonomous code edits, tmux/Ghostty dashboards, automatic Loom promotion, and always-on default enablement.

## Spec Set Coverage

`spec:failure-memory-mvp` defines retrospective parsing, extraction, storage, and query behavior. This spec adds live tracking and immediate suggestions so the user does not need to manually run `sync` and paste an error. Together, the specs cover both pull-based and live failure-memory workflows.

## Problem

The current MVP can retrospectively index prior Pi sessions and answer queries, but it does not notice failures as they happen. The desired behavior is:

```text
command fails in Pi
  ↓
flight recorder notices automatically
  ↓
indexes/extracts the new failure
  ↓
searches prior similar failures
  ↓
shows evidence-backed prior fixes or says no match
```

## Desired Behavior

When live monitoring is enabled, `pi-flight-recorder` keeps its local index current by watching Pi session JSONL files and/or listening to Pi extension events. On a new failure, it extracts or previews the failure episode, searches prior episodes while excluding the current failure, and surfaces a concise suggestion when the match clears configured confidence/noise gates.

The user can run live mode in quiet index-only mode or suggest-on-failure mode, inspect status, stop watching, and configure source directories/data directory/cwd filters.

## Not Doing

- No automatic code changes.
- No default always-on behavior before the user opts in.
- No hosted services or network calls.
- No guarantee that every failure produces a suggestion.
- No suggestions for low-confidence matches unless explicitly requested.
- No launchd/systemd background installation in this slice.
- No copying SocratiCode source code.

## Requirements

- REQ-001: The live layer MUST support a file-watcher mode that watches configured Pi session source directories for `.jsonl` changes.
- REQ-002: Watcher mode MUST run a catch-up sync on start before reporting itself active, so failures written while the watcher was off are not silently missed.
- REQ-003: Watcher mode MUST debounce bursts of file changes before syncing and MUST sync only changed session files when possible.
- REQ-004: Watcher mode MUST expose start, stop, and status controls with clear state for active, stopped, watched-by-another-process, errored, and catch-up-in-progress cases.
- REQ-005: The live layer SHOULD prevent duplicate watcher instances from processing the same source directory concurrently, using a local lock or equivalent process coordination.
- REQ-006: The live layer MUST tolerate malformed/partial JSONL during active writes by retrying later or recording non-fatal warnings rather than crashing.
- REQ-007: The Pi extension live hook MUST inspect failed tool results and user bash failures when available, without mutating the tool result or command outcome.
- REQ-008: The Pi live hook MUST not assume final tool-result messages are already persisted at `tool_result` time; it must either record from the event directly or schedule a short delayed current-session sync.
- REQ-009: New failure detection MUST distinguish newly extracted episodes from already-indexed episodes so the same failure does not repeatedly alert on every sync.
- REQ-010: Suggestions MUST query prior episodes while excluding the current episode/source ref and SHOULD prefer current-cwd matches before cross-project matches.
- REQ-011: Suggestions MUST include prior failure summary, likely prior fix if available, evidence refs, confidence, and limits, using the existing evidence-backed answer shape.
- REQ-012: Suggestion delivery MUST have noise controls: minimum confidence, per-signature cooldown, max suggestions per turn/window, and mode `off | index-only | suggest-on-failure`.
- REQ-013: All live tracking MUST remain local-first and reuse existing redaction rules before displaying snippets.
- REQ-014: The live layer MUST expose enough structured state for tests and future UI: watched paths, last sync time, last failure seen, last suggestion, warning/error counts, and current mode.

## Scenarios

### SCN-001: Watcher indexes a newly appended failed command

Exercises: REQ-001, REQ-002, REQ-003, REQ-006, REQ-009

GIVEN live watcher mode is enabled for a temporary Pi session directory
AND a session JSONL file receives a new failed `bashExecution` entry
WHEN the debounce window elapses
THEN only the changed session file is synced
AND a new failure episode is stored exactly once
AND malformed partial lines do not crash the watcher.

### SCN-002: Immediate Pi hook suggests a prior fix

Exercises: REQ-007, REQ-008, REQ-010, REQ-011, REQ-013

GIVEN the Pi extension is loaded in suggest-on-failure mode
AND prior sessions contain a similar resolved failure
WHEN a live `tool_result` or user bash command fails
THEN the extension searches prior episodes using the failure text
AND shows a concise “seen before” suggestion with evidence refs and limits
AND does not alter the original tool result.

### SCN-003: Noisy repeated failure is cooled down

Exercises: REQ-009, REQ-012, REQ-014

GIVEN the same failing command repeats several times in a short window
WHEN each failure is observed
THEN the system indexes the failures as needed
BUT emits at most one suggestion for the same normalized signature during the cooldown window
AND status exposes the suppressed suggestion count or last cooldown reason.

### SCN-004: Quiet mode tracks without interrupting

Exercises: REQ-004, REQ-012, REQ-014

GIVEN live mode is set to `index-only`
WHEN a new failure is detected
THEN the failure is indexed
AND no user-facing suggestion is shown
AND status reports the new failure count and last sync time.

### SCN-005: Cross-process watcher conflict is clear

Exercises: REQ-004, REQ-005

GIVEN one watcher process already owns the watch lock for a source directory
WHEN another process tries to start watching the same directory
THEN it reports that another process is watching
AND does not start a duplicate watcher.

## Evidence Plan

- REQ-001 through REQ-006 / SCN-001 and SCN-005: unit/integration tests with temporary directories, fake timers/debounce, partial JSONL writes, duplicate start attempts, stop/status checks, and changed-file sync assertions.
- REQ-007 through REQ-008 / SCN-002: fake Pi extension tests for failed `tool_result` and user bash events; assert the original result is not mutated and delayed/current-session sync behavior is explicit.
- REQ-009 through REQ-012 / SCN-002 through SCN-004: suggestion-engine tests using fixture episodes; assert current episode exclusion, cwd preference, confidence threshold, cooldown, and quiet mode.
- REQ-013: redaction tests covering live event snippets in addition to stored episode snippets.
- REQ-014: status snapshot tests for watched paths, last sync/failure/suggestion, mode, warning/error counts, and cooldown state.

## Open Questions

- Default Pi notification surface: recommended MVP uses `ctx.ui.notify` for suggestions and does not inject custom messages unless confidence is high and the user enables it.
- Watcher dependency: implementation should evaluate `@parcel/watcher` as an open-source dependency inspired by SocratiCode, with a polling fallback or friendly unsupported-platform error if native watcher setup fails.
- Auto-start policy: recommended MVP is opt-in. A later ticket may add project/user settings to auto-start after live behavior proves useful.

## Quality Bar

Live suggestions should feel timely but not noisy. The acceptable experience is:

```text
⚠ Seen before: likely match (0.86)
Prior fix: Validation passed after changing src/config/paths.ts
Evidence: session abc, entry fail123, entry pass456
Limit: inferred from prior session; inspect before applying
```

The unacceptable experience is repeated generic popups such as:

```text
I found related sessions about npm.
```

## Interface Contract

Expected interfaces:

- CLI: `pi-flight-recorder watch start|stop|status`, plus optional `--foreground`, `--source`, `--data-dir`, `--mode`, `--debounce-ms`, `--min-confidence`, and `--cooldown-ms`.
- Library: watcher service, incremental single-file sync, suggestion engine, status snapshot, start/stop lifecycle.
- Pi extension: commands such as `/flight-watch start|stop|status`, `/flight-mode`, and live event handlers for failed tool/user bash events.
- Outputs: structured status, sync results, suggestion result, suppression/cooldown reasons, warning/error summaries.
- Side effects: local SQLite index and feedback/status state only.
- Error semantics: watcher errors are non-fatal where possible; status must show degraded/error state; user-facing messages must be actionable.

## Examples And Non-Examples

Example live status:

```text
Flight recorder live mode: suggest-on-failure
Watcher: active
Sources: ~/.pi/agent/sessions, ~/.pi/agent/sessions-archive
Last sync: 2026-05-22T20:55:00Z
Last failure: npm test exited 1 in /repo
Last suggestion: ep_abc123 likely 0.86
Suppressed: 2 duplicate suggestions in cooldown
```

Non-example:

```text
Watcher running.
```

## Constraints

- Local-first, no network by default.
- Do not mutate tool results or user commands while observing failures.
- Do not display unredacted secret-looking values.
- Do not alert repeatedly for the same failure signature.
- Do not copy AGPL SocratiCode source code; use architecture inspiration only.

## Related Records

- `research:20260522-live-failure-watcher-inspiration` - investigation supporting this behavior.
- `spec:failure-memory-mvp` - core parser/extractor/storage/query behavior this spec builds on.
- `plan:20260522-live-failure-monitoring` - decomposes implementation.
