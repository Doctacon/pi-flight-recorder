# Live Failure Monitoring Plan

ID: plan:20260522-live-failure-monitoring
Type: Plan
Status: review
Created: 2026-05-22
Updated: 2026-05-22
Risk: medium - adds long-running watcher state, live Pi event handling, and user-facing automatic suggestions

## Summary

This plan decomposes the next `pi-flight-recorder` product behavior: automatic live failure tracking and immediate “seen this before” suggestions. It needs more than one ticket because changed-file sync, watcher lifecycle, suggestion gating, CLI controls, Pi event hooks, and final validation each have separate evidence and failure modes.

When complete, a user should be able to opt into live monitoring so Pi session failures are indexed automatically and, when a confident prior match exists, Pi shows an evidence-backed prior fix without the user manually running `sync` or pasting the error.

## Related Records

- `constitution:main` - local-first, outcome-aware project principles and MVP boundaries.
- `spec:failure-memory-mvp` - existing parser/extractor/storage/query contract that live monitoring builds on.
- `research:20260522-live-failure-watcher-inspiration` - SocratiCode/Pi event research supporting the architecture.
- `spec:live-failure-monitoring` - intended behavior and evidence plan for this live slice.
- `plan:20260522-pi-flight-recorder-mvp` - previous core MVP plan now in review; this plan is a successor slice, not a replacement.

## Strategy

Add live monitoring as an opt-in layer over the existing local Failure Memory core.

The route is:

1. Refactor sync into an incremental changed-file API that can report newly extracted episodes.
2. Build a session-file watcher service that does catch-up on start, debounces JSONL writes, prevents duplicate watchers, and exposes status.
3. Build a suggestion engine that takes new/live failures, queries prior episodes while excluding the current episode, applies cwd preference, and suppresses noisy output through mode/threshold/cooldown controls.
4. Expose terminal controls so live tracking can be started, stopped, and inspected outside Pi.
5. Extend the Pi wrapper to listen to live failed tool/user bash events and show suggestions without mutating tool results or injecting prompts.
6. Validate and document the live workflow, including explicit limits if live Pi TUI verification is not performed.

The plan deliberately leaves out OS daemon installation, always-on default enablement, autonomous fixes, tmux/Ghostty UI, hosted embeddings, and automatic Loom promotion.

Architecture notes from research:

- SocratiCode's watcher validates the pattern of native recursive watcher + debounce + ignore/filter + cross-process lock + catch-up + non-fatal failures, but its AGPL code must not be copied.
- Pi's `tool_result` event is the best immediate assistant-tool failure hook, but final persisted tool-result messages may not exist yet. The Pi hook must handle that timing honestly.

Validation posture: use automated tests for changed-file sync, watcher debounce/status, suggestion suppression, fake-Pi event handling, and docs/evidence. If a real Pi TUI smoke test is not run, record that as residual risk.

Replan triggers:

- `@parcel/watcher` or chosen watcher dependency creates install/runtime friction that is disproportionate for this project.
- Pi event ordering prevents safe immediate suggestions or delayed current-session sync.
- Suggestions are too noisy on real session logs even with thresholds/cooldowns.
- Cross-process lock/status needs more daemon infrastructure than the current slice should own.

## Execution Units

### Unit: Incremental changed-file sync

Ticket: `ticket:20260522-incremental-session-sync-api`

Refactor sync so watcher and Pi hook can process one changed session file and know which episodes are new. This is the foundation for avoiding full rescans and duplicate alerts. Single closure claim: changed session files can be synced idempotently with new episode IDs returned.

### Unit: Session file watch service

Ticket: `ticket:20260522-session-watch-service`

Implement source-directory watching with catch-up, debounce, JSONL filtering, duplicate-start protection, start/stop/status, and non-fatal errors. Single closure claim: session-file changes automatically keep the index fresh.

### Unit: Live suggestion engine

Ticket: `ticket:20260522-live-suggestion-engine`

Implement suggestion decisions for newly detected failures: exclude current failure, prefer cwd, enforce confidence/cooldown/mode, and return either evidence-backed suggestion or suppression reason. Single closure claim: a new failure can produce a trustworthy suggestion without alert storms.

### Unit: Watch CLI controls

Ticket: `ticket:20260522-watch-cli-controls`

Expose live monitoring from the terminal with watch start/stop/status and conservative options. Single closure claim: users can opt into and diagnose live tracking outside Pi.

### Unit: Pi live failure hook

Ticket: `ticket:20260522-pi-live-failure-hook`

Extend the Pi extension to observe failed tool/user bash events, trigger suggestion lookup and delayed sync, and notify the user without mutating results. Single closure claim: active Pi failures can automatically show prior-fix suggestions.

### Unit: Live validation and docs

Ticket: `ticket:20260522-live-monitoring-validation-docs`

Create final evidence and documentation for watcher mode, suggestion mode, Pi hook limits, privacy, and troubleshooting. Single closure claim: future users/agents can enable and verify live monitoring without chat history.

## Milestones

### Milestone: Live Index Freshness

Child tickets: `ticket:20260522-incremental-session-sync-api`, `ticket:20260522-session-watch-service`

The index can update automatically from changed Pi session files without manual `sync` and without duplicate processing.

### Milestone: Live Suggestion Decision

Child tickets: `ticket:20260522-live-suggestion-engine`

New failures can be compared to prior episodes with current-episode exclusion, cwd preference, confidence threshold, cooldown, and mode controls.

### Milestone: User-Facing Live Mode

Child tickets: `ticket:20260522-watch-cli-controls`, `ticket:20260522-pi-live-failure-hook`

The user can start/stop/status live mode and receive suggestions inside Pi when failures happen.

### Milestone: Trustworthy Handoff

Child tickets: `ticket:20260522-live-monitoring-validation-docs`

Docs and evidence explain how to use the feature, what was validated, and what remains risky or unverified.

## Current State

Plan implementation appears complete and is in review. All six child tickets are in `review`, and `evidence:20260522-live-monitoring-validation` records typecheck/test/build/package checks plus CLI watcher smoke. Remaining review limits: no live Pi TUI smoke was run, no separate Ralph audit was run, and `user_bash` result observation is explicitly deferred.

## Journal

- 2026-05-22: Created plan with Status `open`, based on SocratiCode watcher/Pi event research and active Live Failure Monitoring spec. Created six child tickets and linked them from execution units.
- 2026-05-22: Moved plan to `active` at operator request to implement the live failure monitoring plan and tickets.
- 2026-05-22: Moved plan to `review` after implementing child tickets, updating docs, and recording validation evidence.
