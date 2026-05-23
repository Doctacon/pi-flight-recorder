# Failure Cluster Data Model

ID: ticket:20260523-failure-cluster-data-model
Type: Ticket
Status: open
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

Ready after live failure ledger. Current storage has episodes/feedback but no occurrence cluster or reflection pattern model.

## Journal

- 2026-05-23: Created ticket for the data-model foundation of reflective failure memory.
