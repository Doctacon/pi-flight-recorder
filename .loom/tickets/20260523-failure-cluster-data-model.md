# Failure Cluster Data Model

ID: ticket:20260523-failure-cluster-data-model
Type: Ticket
Status: review
Created: 2026-05-23
Updated: 2026-05-23
Risk: medium - cluster schema shapes all reflection behavior
Priority: high - reflection needs grouped occurrences, not just episode search
Depends On: ticket:20260523-live-failure-ledger

## Summary

Add local data structures for grouping failure occurrences into clusters/patterns, including cluster identity, membership, counts, representative evidence, status, and feedback state. The closure claim is that repeated failures can be represented as durable local pattern candidates before any reflection text is generated.

## Related Records

- `spec:seamless-failure-memory-ux` - REQ-008, REQ-009, and local data surface contract.
- `ticket:20260523-live-failure-ledger` - occurrence source data for clusters.
- `plan:20260523-seamless-failure-memory-ux` - starts the reflection milestone.

## Scope

May change:

- Storage schema/types, cluster repository methods, tests, and migration/rebuild behavior.

Must not change:

- No clustering algorithm beyond enough deterministic assignment helpers if needed.
- No reflection prose generation.
- No model calls.
- No UI.

Cluster records should be rebuildable from occurrences where possible, with separate persisted user feedback/silence state that is not lost casually.

## Acceptance

- ACC-001: Store can create/update cluster records with normalized key, representative signature, count, cwd/project summary, first/last seen timestamps, and member occurrence IDs.
  - Evidence: Storage tests over temp SQLite.
  - Audit: Review schema is sufficient for ranking/proposal tickets.

- ACC-002: Cluster membership can be rebuilt from occurrence records without duplicating members.
  - Evidence: Test rebuilds clusters twice and asserts idempotency.
  - Audit: Review rebuild does not erase user-authored feedback state.

- ACC-003: Representative evidence refs can be queried for a cluster with bounded snippets.
  - Evidence: Storage/query tests.
  - Audit: Review redaction and snippet bounds.

- ACC-004: Cluster status supports active, snoozed, silenced, dismissed, and promoted-later/make-rule intent.
  - Evidence: Storage tests.
  - Audit: Review status semantics align with feedback controls.

## Current State

Implementation is complete and in review. Storage now has occurrence clusters, membership, representative evidence, status transitions, and reflection proposal records while preserving user-authored feedback state. Evidence: `evidence:20260523-seamless-ux-validation` OBS-001, OBS-002.

Audit disposition: `audit:20260523-seamless-ux-review` returned `changes-needed`; FIND-003 addressed by feedback validation/signature suppression propagation; FIND-005 addressed by migration fixture. Evidence: `evidence:20260523-findings-fix-validation` OBS-004 and OBS-006. Follow-up audit `audit:20260523-seamless-ux-followup-review` returned `clear` for FIND-001 through FIND-005 in the inspected scope; remaining residual gaps are tracked as non-blocking follow-up/tuning unless this ticket explicitly covers high-confidence notification smoke or long-run corpus evaluation.

## Journal

- 2026-05-23: Created ticket for the data-model foundation of reflective failure memory.
- 2026-05-23: Implemented seamless UX slice for this ticket and moved to review with validation evidence in `evidence:20260523-seamless-ux-validation`.
- 2026-05-23: Review run recorded `audit:20260523-seamless-ux-review` with verdict `changes-needed`; pending disposition: FIND-003, FIND-005.
- 2026-05-23: Dispositioned review finding(s) for this ticket with `evidence:20260523-live-pi-tui-smoke` and/or `evidence:20260523-findings-fix-validation`; follow-up audit `audit:20260523-seamless-ux-followup-review` returned `clear` in the inspected scope; residual high-confidence notification/model-provider/long-run tuning gaps remain as follow-up where applicable.
