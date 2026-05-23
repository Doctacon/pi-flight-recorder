# Seamless Failure Memory UX

ID: spec:seamless-failure-memory-ux
Type: Spec
Status: active
Created: 2026-05-23
Updated: 2026-05-23

## Summary

This spec defines the desired product UX after the current live-monitoring MVP: a user installs the Pi extension, works normally, and `pi-flight-recorder` quietly captures failures, surfaces only high-confidence prior fixes immediately, and periodically reflects on repeated failure patterns to propose durable improvements.

## Product Slice

This spec owns the seamless extension-first workflow and reflective pattern loop. It builds on `spec:failure-memory-mvp` and `spec:live-failure-monitoring`.

Covered:

- extension install / session-start bootstrap with no normal CLI requirement;
- automatic local failure capture and indexing;
- immediate high-confidence live suggestions;
- persistent feedback and silence controls;
- repeated-failure clustering;
- reflection cadence and manual reflection;
- pattern-level solution proposals;
- privacy/consent boundaries for model-assisted reflection.

Out of scope:

- autonomous code edits;
- hosted memory/search services;
- sending raw session logs to external services by default;
- OS daemon install as the required path;
- replacing Pi's core tool execution semantics;
- generic semantic chat search unrelated to failure-memory episodes.

## Problem

The current implementation is useful as a developer harness, but the desired user experience is not “run CLI commands.” The desired experience is:

```text
install extension
  ↓
work normally in Pi
  ↓
failures are captured and indexed automatically
  ↓
strong prior fixes appear at failure time
  ↓
repeated weak/noisy failures are grouped for later reflection
  ↓
Pi proposes durable pattern-level improvements with evidence and feedback controls
```

The key product judgment is that not every error deserves an immediate solution attempt. One-off or low-confidence failures should be stored and clustered; repeated patterns should produce one higher-level proposal rather than many interruptions.

## Desired Behavior

Normal use requires only installing/enabling the Pi extension. The extension should initialize local state on session start, run quiet indexing in the background, observe failed Pi tool results, and record failure occurrences. It should only notify during active work when there is a high-confidence, evidence-backed prior fix.

Failures that do not clear immediate-suggestion gates enter a reflection buffer. Reflection groups related failures by normalized signature, tool/command, error text, cwd/project, files, and repeated failed attempts. Reflection runs manually or at safe cadence points and produces concise pattern-level proposals with evidence, confidence, limits, and actions.

## Requirements

- REQ-001: Installing/enabling the Pi extension MUST be the normal activation path; users SHOULD NOT need to run CLI commands for ongoing failure recording.
- REQ-002: On Pi `session_start`, the extension MUST initialize local state, load user/project settings, and start quiet local indexing/capture unless disabled.
- REQ-003: Extension bootstrap MUST be non-blocking and MUST surface degraded state through status rather than interrupting normal work.
- REQ-004: Live failed `tool_result` events MUST be recorded as local failure occurrences with redacted text, tool name, cwd, session file when available, timestamps, and a normalized signature.
- REQ-005: User shell failures SHOULD be captured only through a proven non-mutating result observation path. If that is not safe, user shell result capture MUST remain disabled and documented.
- REQ-006: Immediate suggestions MUST be shown only when confidence/noise gates pass. Default gates SHOULD require a prior resolution or strong exact-signature evidence, same-cwd preference, cooldown, and a per-window suggestion budget.
- REQ-007: Low-confidence/no-match/cooldown-suppressed failures MUST be retained for reflection without user interruption.
- REQ-008: The system MUST maintain a local reflection buffer that can group failure occurrences into clusters by normalized signature, command/tool, error tokens, cwd/project, files, and attempted remedies.
- REQ-009: Reflection MUST produce pattern-level proposals, not one proposal per one-off error, unless the user explicitly asks about a single failure.
- REQ-010: Reflection triggers MUST be controllable and non-disruptive: manual `/flight-reflect`, cluster threshold, session-end/idle, and optional daily digest are in scope.
- REQ-011: Reflection proposals MUST include pattern summary, affected commands/tools, representative evidence refs, likely durable fix or next investigation step, confidence, limits, and feedback actions.
- REQ-012: Model-assisted reflection MUST be opt-in or user-initiated, must send only bounded redacted snippets/evidence, and must clearly disclose when the active Pi model/provider is used. Local deterministic clustering MUST work without model calls.
- REQ-013: Feedback actions MUST let the user mark suggestions/reflections as useful, wrong match, snooze, silence pattern, already solved, promote-later, or make-rule/remember.
- REQ-014: User controls MUST include status, pause/resume, mode, disable, data dir, privacy/model-reflection settings, and reset/rebuild affordances inside Pi.
- REQ-015: Documentation and status output MUST make it clear what is running, what was captured, what was sent nowhere, and what remains unverified.

## Scenarios

### SCN-001: Install and work with no CLI

Exercises: REQ-001, REQ-002, REQ-003, REQ-014, REQ-015

GIVEN the package is installed as a Pi extension
WHEN Pi starts or resumes a session
THEN `pi-flight-recorder` initializes local state and starts quiet capture/indexing
AND `/flight-status` or equivalent reports active/degraded/disabled state
AND the user did not run `npm run cli`.

### SCN-002: High-confidence prior fix appears immediately

Exercises: REQ-004, REQ-006, REQ-011

GIVEN prior local episodes contain the same failure signature and an observed passing validation after a fix
WHEN a live Pi tool result fails with the same signature in the same cwd
THEN the extension shows one concise evidence-backed suggestion
AND cites prior source refs and limits
AND does not mutate the tool result.

### SCN-003: Low-confidence failures become reflection input

Exercises: REQ-007, REQ-008, REQ-009

GIVEN several failures are low confidence or unresolved
WHEN they occur during a session
THEN the user is not interrupted for each one
AND the occurrences are available for cluster-level reflection.

### SCN-004: Repeated pattern produces one proposal

Exercises: REQ-008, REQ-009, REQ-010, REQ-011, REQ-013

GIVEN three or more failures share an edit-oldText mismatch signature across a session
WHEN reflection runs at idle/session-end or via `/flight-reflect`
THEN the digest shows one grouped pattern proposal
AND proposes a durable behavior/rule or next investigation step
AND offers useful/wrong/snooze/silence/promote/make-rule actions.

### SCN-005: Model reflection respects privacy

Exercises: REQ-012, REQ-015

GIVEN model-assisted reflection is disabled
WHEN reflection runs automatically
THEN no model call is made and local deterministic pattern summaries are used
AND status says model reflection is disabled.

GIVEN the user invokes model-assisted `/flight-reflect --model` or enables it
WHEN reflection prepares context
THEN only bounded redacted evidence snippets are sent through the active Pi model/provider
AND the proposal states that model assistance was used.

## Evidence Plan

- REQ-001 through REQ-003 / SCN-001: fake-Pi extension tests and, before closure, a live Pi smoke test showing install/session-start capture without CLI.
- REQ-004 through REQ-007 / SCN-002 and SCN-003: unit/fake-Pi tests for live occurrence persistence, suggestion gating, cooldown, no-mutation, and quiet buffering.
- REQ-008 through REQ-011 / SCN-004: fixture corpus tests for clustering, ranking, trigger behavior, and reflection proposal shape.
- REQ-012 / SCN-005: tests for redaction/context bounding and explicit no-model default; manual or fake provider test for model-assisted mode.
- REQ-013 through REQ-015: fake-Pi command/action tests, persisted feedback tests, docs inspection, and status snapshots.

## Quality Bar

Good immediate suggestion:

```text
Flight Recorder: seen before (0.88)
Likely prior fix: re-read src/foo.ts and use exact current oldText before edit.
Evidence: session abc, entries fail123 -> read124 -> edit125 -> test126 passed.
Limit: prior fix inferred from one session; inspect before applying.
```

Good reflection proposal:

```text
Pattern: exact-text edit mismatches
Seen: 7 failures across 3 sessions, mostly edit tool oldText not found
Likely durable fix: before edit, read the target block or fall back to a smaller patch.
Evidence: sessions A/B/C, representative entries ...
Actions: useful | wrong | snooze | silence | make rule | promote later
```

Bad behavior:

```text
Every failure triggers a generic popup or background model call.
```

## Interface Contract

Expected extension-facing surfaces:

- `/flight-status` or `/flight-watch status` - current capture/index/reflection state.
- `/flight-mode` - off/index-only/suggest-on-failure/reflection settings.
- `/flight-reflect` - manual pattern reflection.
- `/flight-feedback` or inline action commands - mark suggestion/reflection outcomes.
- Optional settings storage under the local data dir and/or Pi settings, with safe defaults.

Expected local data surfaces:

- failure occurrences separate from extracted historical episodes;
- cluster/pattern records derived from occurrences;
- reflection proposal records with evidence refs and feedback state;
- silence/snooze/rule preference records;
- all derived state rebuildable or clearly labeled as user-authored feedback.

## Constraints

- Local-first and no hosted memory/search by default.
- No raw session dumps into prompts or records.
- No background model calls unless explicitly enabled or manually invoked.
- No autonomous fixes.
- No mutation of Pi tool/user command outcomes while observing failures.
- Suggestions/reflections must cite evidence and limits.

## Related Records

- `constitution:main` - local-first, evidence-backed, small vertical slices.
- `spec:failure-memory-mvp` - historical episode ingestion/query contract.
- `spec:live-failure-monitoring` - current live watcher/suggestion foundation.
- `research:20260522-live-failure-watcher-inspiration` - watcher/event-hook tradeoffs.
- `plan:20260523-seamless-failure-memory-ux` - implementation decomposition for this spec.
