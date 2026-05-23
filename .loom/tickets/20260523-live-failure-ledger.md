# Live Failure Occurrence Ledger

ID: ticket:20260523-live-failure-ledger
Type: Ticket
Status: review
Created: 2026-05-23
Updated: 2026-05-23
Risk: medium - adds persistent event-level state that downstream clustering and suggestions depend on
Priority: high - reflection needs low-confidence failures retained, not discarded
Depends On: ticket:20260523-extension-auto-bootstrap

## Summary

Add a persistent local occurrence ledger for live failures observed by the extension, separate from historical extracted episodes. The closure claim is that every observed live tool failure can be durably recorded, deduped, redacted, and reused for immediate suggestions or later reflection.

## Related Records

- `spec:seamless-failure-memory-ux` - REQ-004, REQ-007, and local data surface contract.
- `spec:live-failure-monitoring` - current live failure detection and delayed sync behavior.
- `plan:20260523-seamless-failure-memory-ux` - sequences this before clustering/reflection.
- `evidence:20260522-live-monitoring-validation` - current validation baseline.

## Scope

May change:

- Storage schema/migrations or schema initialization, new occurrence types, live event normalization, redaction, and tests.
- Pi live hook to write occurrences before/alongside suggestion lookup.

Must not change:

- No clustering engine yet.
- No reflection proposals yet.
- No user-bash wrapping unless it can be proven non-mutating inside this ticket; otherwise keep result capture deferred and documented.

The ledger should record enough for future clustering without storing raw secrets: source kind, tool name, command if available, redacted output/content snippet, cwd, session file, entry/tool call id when available, timestamp, normalized signature, immediate suggestion outcome/suppression reason, and duplicate/cooldown metadata.

## Acceptance

- ACC-001: Failed live `tool_result` events create occurrence records with redacted snippets and normalized signatures.
  - Evidence: Storage + fake-Pi event tests.
  - Audit: Review no raw secret-looking values are stored in derived fields.

- ACC-002: Repeated identical events are deduped or linked as repeated occurrences without corrupting counts.
  - Evidence: Test emits same failure twice and asserts repeat count/occurrence relationship.
  - Audit: Review dedupe key does not erase distinct failures from different cwd/session contexts.

- ACC-003: Occurrence records can be queried by recent window, cwd, signature, and suggestion status.
  - Evidence: Unit tests over temp SQLite store.
  - Audit: Review query interface is sufficient for cluster tickets.

- ACC-004: User-bash result capture is either implemented through a non-mutating path with tests or explicitly remains disabled with a status/docs note.
  - Evidence: Fake-Pi test or documented deferred state.
  - Audit: Review the extension never changes shell command semantics.

## Current State

Implementation is complete and in review. Live failed `tool_result` events are recorded as redacted occurrence records with normalized signatures, repeat counts, metadata, and suggestion outcomes; user-bash result capture remains explicitly disabled and surfaced in status/docs. Evidence: `evidence:20260523-seamless-ux-validation` OBS-001, OBS-002.

Audit disposition: `audit:20260523-seamless-ux-review` returned `changes-needed`; FIND-001 addressed by redacted occurrence/event persistence and tests; FIND-005 addressed by v2 migration compatibility fixture. Evidence: `evidence:20260523-findings-fix-validation` OBS-003 and OBS-006. Follow-up audit `audit:20260523-seamless-ux-followup-review` returned `clear` for FIND-001 through FIND-005 in the inspected scope; remaining residual gaps are tracked as non-blocking follow-up/tuning unless this ticket explicitly covers high-confidence notification smoke or long-run corpus evaluation.

## Journal

- 2026-05-23: Created ticket to establish the data foundation for seamless capture and reflection.
- 2026-05-23: Implemented seamless UX slice for this ticket and moved to review with validation evidence in `evidence:20260523-seamless-ux-validation`.
- 2026-05-23: Review run recorded `audit:20260523-seamless-ux-review` with verdict `changes-needed`; pending disposition: FIND-001, FIND-005.
- 2026-05-23: Dispositioned review finding(s) for this ticket with `evidence:20260523-live-pi-tui-smoke` and/or `evidence:20260523-findings-fix-validation`; follow-up audit `audit:20260523-seamless-ux-followup-review` returned `clear` in the inspected scope; residual high-confidence notification/model-provider/long-run tuning gaps remain as follow-up where applicable.
