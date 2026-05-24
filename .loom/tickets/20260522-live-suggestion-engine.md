# Live Suggestion Engine

ID: ticket:20260522-live-suggestion-engine
Type: Ticket
Status: closed
Created: 2026-05-22
Updated: 2026-05-23
Risk: medium - noisy or overconfident suggestions would undermine trust
Priority: high - this is the user-visible value of live monitoring
Depends On: ticket:20260522-incremental-session-sync-api

## Summary

Build the live suggestion engine that reacts to newly detected failures, searches prior episodes while excluding the current failure, applies cwd preference and noise controls, and returns structured suggestions or suppression reasons. The closure claim is that a new failure can automatically produce an evidence-backed “seen before” suggestion when appropriate, without alert storms.

## Related Records

- `spec:live-failure-monitoring` - especially REQ-009 through REQ-014 and SCN-002 through SCN-004.
- `spec:failure-memory-mvp` - existing query/result shape to reuse.
- `ticket:20260522-incremental-session-sync-api` - provides new episode IDs from live sync.
- `plan:20260522-live-failure-monitoring` - coordinates this with watcher and Pi hook surfaces.

## Scope

May change:

- New suggestion service/types, query filtering, status/cooldown state, tests, and CLI/internal formatting helpers.

Must not change:

- No watcher lifecycle implementation.
- No Pi event registration.
- No autonomous code edits or prompt injection.

The engine should accept a failure episode or live failure text, exclude that episode/source ref from matches, prefer same-cwd results, and return either `suggestion` or `suppressed` with reason (`low-confidence`, `cooldown`, `mode-off`, `index-only`, `no-match`).

## Acceptance

- ACC-001: Given a new failure episode and prior similar resolved episode, the engine returns a suggestion with prior fix, evidence refs, confidence, and limits.
  - Evidence: Unit test over fixture episodes.
  - Audit: Review output reuses evidence-backed shape and distinguishes inference from observation.

- ACC-002: The current episode/source is excluded from its own query results.
  - Evidence: Test where only current episode matches returns no suggestion or no-match suppression.
  - Audit: Review exclusion uses stable episode/source identifiers.

- ACC-003: Same-cwd prior matches are preferred over cross-project matches, and cross-project matches are labeled.
  - Evidence: Ranking/filter test with same and different cwd fixtures.
  - Audit: Review cross-project suggestions carry explicit limits.

- ACC-004: Confidence threshold, cooldown, max suggestions, and mode `off | index-only | suggest-on-failure` suppress noisy output.
  - Evidence: Unit tests for each suppression reason and status counters.
  - Audit: Review suppression does not prevent indexing itself.

- ACC-005: Suggestion status exposes last failure, last suggestion, suppression counts, and mode.
  - Evidence: Status snapshot test.
  - Audit: Review state is safe for future UI/CLI exposure.

## Current State

Closed. The live-monitoring implementation review state is reconciled. `evidence:20260522-live-monitoring-validation` supports incremental sync, watcher service, live suggestion decisions, CLI controls, Pi live hook behavior, and validation docs through tests plus CLI watcher smoke. Later real Pi evidence (`evidence:20260523-live-pi-tui-smoke`, `evidence:20260523-installed-package-high-confidence-smoke`, and `evidence:20260523-high-confidence-visible-suggestion-tui`) covers the no-CLI real TUI path, failed `tool_result` capture, reflection rendering, installed-package startup, and visible high-confidence prior-fix suggestion text. `audit:20260523-final-review-state-reconciliation-review` found no material issue with closing stale live-monitoring review tickets.

Residual limits remain outside this ticket: `user_bash` result capture is intentionally deferred because Pi exposes it before execution, real hosted/model-provider reflection is unproven, and long-run corpus precision/noise tuning remains separate.

## Evidence

- `evidence:20260522-live-monitoring-validation` - records full validation and links suggestion-engine acceptance support.
- `src/live-suggestions.test.ts` - covers prior-fix suggestions, current episode exclusion, cwd preference/cross-project labels, mode suppression, low-confidence suppression, cooldown, max-window suppression, and status counters.

## Journal

- 2026-05-22: Created ticket with Status `open`. Scope is suggestion decision logic, not watcher/Pi transport.
- 2026-05-22: Implemented live suggestion engine and moved ticket to `review` with validation evidence.
- 2026-05-23: Final review-state reconciliation closed this stale `review` ticket with supporting evidence/audit links; residual provider/corpus limits remain outside this ticket.
