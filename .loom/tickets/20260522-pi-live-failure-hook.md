# Pi Live Failure Hook

ID: ticket:20260522-pi-live-failure-hook
Type: Ticket
Status: review
Created: 2026-05-22
Updated: 2026-05-22
Risk: medium - Pi event timing and notification noise affect active user workflow
Priority: high - this delivers the imagined “command fails → seen before” behavior inside Pi
Depends On: ticket:20260522-live-suggestion-engine

## Summary

Extend the Pi extension so it can observe failed live tool/user bash events, trigger incremental sync or direct suggestion lookup, and notify the user when a prior failure/fix is likely relevant. The closure claim is that inside Pi, a live failure can produce an evidence-backed suggestion automatically without mutating tool results.

## Related Records

- `spec:live-failure-monitoring` - especially REQ-007, REQ-008, REQ-010 through REQ-013, SCN-002 through SCN-004.
- `research:20260522-live-failure-watcher-inspiration` - records Pi event-hook constraints and tool-result timing.
- `ticket:20260522-live-suggestion-engine` - provides suggestion/suppression decisions.
- `ticket:20260522-incremental-session-sync-api` - provides current-session delayed sync when needed.
- `plan:20260522-live-failure-monitoring` - coordinates Pi integration with watcher/CLI controls.

## Scope

May change:

- `src/pi-extension.ts`, Pi wrapper tests, extension docs, and minimal config/state helpers.

Must not change:

- Do not alter tool result content, error state, or user bash command outcome.
- Do not inject follow-up user prompts automatically.
- Do not enable suggest-on-failure by default unless explicit config/command opts in.
- Do not add tmux/Ghostty UI.

The hook should use `tool_result` for assistant tool failures and `user_bash` or a documented alternative for user `!`/`!!` failures. Because Pi final tool-result messages may not be persisted at `tool_result` time, the hook should either query using event text immediately and schedule delayed current-session sync, or wait until a later message/turn event with explicit tests.

## Acceptance

- ACC-001: Pi extension can set/query live mode via commands such as `/flight-watch` or `/flight-mode`.
  - Evidence: Fake-Pi command registration tests.
  - Audit: Review live mode is opt-in and clear.

- ACC-002: Failed `tool_result` events trigger suggestion lookup without modifying the event result.
  - Evidence: Fake-Pi event test asserts no mutation and expected notification/suppression.
  - Audit: Review hook respects Pi event timing and cancellation signal.

- ACC-003: User bash failures are observed or explicitly deferred with a documented reason and follow-up if Pi API constraints block it.
  - Evidence: Fake-Pi test or documented blocked state.
  - Audit: Review the user-facing claim does not overstate unsupported event coverage.

- ACC-004: High-confidence suggestions are delivered with prior fix, evidence refs, confidence, and limits; low-confidence/no-match/cooldown states do not spam the user.
  - Evidence: Fake-Pi tests covering suggestion and suppression cases.
  - Audit: Review notification text is concise and evidence-backed.

- ACC-005: The hook can schedule delayed current-session sync so durable provenance catches up after immediate suggestion.
  - Evidence: Test using fake timer/current session path or documented fallback.
  - Audit: Review errors during delayed sync are non-fatal and status-visible.

## Current State

Implementation appears complete and is in review. Added `/flight-mode`, `/flight-watch`, live `tool_result` handling, immediate suggestion lookup, delayed current-session sync, and fake-Pi tests asserting tool-result non-mutation. `user_bash` is registered as a future seam but result observation is explicitly deferred because Pi fires it before execution and wrapping shell operations could alter command semantics. No live Pi TUI smoke or separate Ralph audit has been run yet.

## Evidence

- `evidence:20260522-live-monitoring-validation` - records fake-Pi validation and explicitly names the absence of live Pi TUI smoke.
- `src/pi-extension.test.ts` - covers command/hook registration, live mode setting, failed `tool_result` suggestion without mutation, and delayed current-session sync.
- `src/live-suggestions.test.ts` - covers low-noise suppression behavior reused by the Pi hook.

## Journal

- 2026-05-22: Created ticket with Status `open`. Scope is Pi live observation/notification, not file watcher daemon.
- 2026-05-22: Implemented Pi live hook and moved ticket to `review` with fake-Pi validation evidence; user-bash result wrapping remains deferred and documented.
