# Local Pattern Miner

ID: ticket:20260523-local-pattern-miner
Type: Ticket
Status: review
Created: 2026-05-23
Updated: 2026-05-23
Risk: medium - bad grouping creates noisy or misleading reflection proposals
Priority: high - this decides whether reflection is useful
Depends On: ticket:20260523-failure-cluster-data-model

## Summary

Implement deterministic local clustering/ranking over failure occurrences so repeated errors become pattern candidates. The closure claim is that the system can identify repeated failure patterns worth reflection without model calls.

## Related Records

- `spec:seamless-failure-memory-ux` - REQ-008 and REQ-009 define clustering behavior and pattern-level output expectations.
- `ticket:20260523-failure-cluster-data-model` - provides cluster storage and membership model.
- `plan:20260523-seamless-failure-memory-ux` - pattern mining feeds reflection triggers and proposals.

## Scope

May change:

- New pattern-mining service, signature normalization, ranking heuristics, tests, and docs comments.

Must not change:

- No reflection prose generation.
- No Pi UI.
- No model calls.
- No broad embeddings/vector database.

Clustering should combine exact normalized signatures with fallback buckets for tool/command/error tokens/cwd/files. Prefer precision over recall for user-visible clusters; low-confidence clusters may remain hidden until enough support accumulates.

## Acceptance

- ACC-001: Identical normalized failures across occurrences are grouped into one cluster with accurate counts and representative evidence.
  - Evidence: Unit/integration fixture test.
  - Audit: Review idempotent repeated runs.

- ACC-002: Similar but not identical failures can be grouped only when token/tool/cwd evidence clears a conservative threshold.
  - Evidence: Fixture tests for same-pattern and false-friend examples.
  - Audit: Review false positive cases are not promoted to visible clusters.

- ACC-003: Cluster ranking prioritizes repeated frequency, recency, same-cwd concentration, unresolved pain, and prior failed attempts.
  - Evidence: Ranking tests.
  - Audit: Review ranking does not bury high-impact repeated patterns behind generic tokens.

- ACC-004: Miner can run incrementally for new occurrences and can rebuild all clusters deterministically.
  - Evidence: Tests for incremental and rebuild paths.
  - Audit: Review user feedback/silence state is preserved.

## Current State

Implementation is complete and in review. Deterministic local mining groups exact signatures and conservative known failure classes, ranks by repetition/recency/cwd concentration, and can run incrementally/rebuild idempotently. Evidence: `evidence:20260523-seamless-ux-validation` OBS-001, OBS-002.

Audit disposition: `audit:20260523-seamless-ux-review` returned `changes-needed`; The real-occurrence tuning gap is partly reduced by live Pi TUI smoke creating repeated occurrences and one reflection cluster; long-run precision tuning remains residual follow-up. Evidence: `evidence:20260523-live-pi-tui-smoke`. Follow-up audit `audit:20260523-seamless-ux-followup-review` returned `clear` for FIND-001 through FIND-005 in the inspected scope; remaining residual gaps are tracked as non-blocking follow-up/tuning unless this ticket explicitly covers high-confidence notification smoke or long-run corpus evaluation.

## Journal

- 2026-05-23: Created ticket for deterministic local pattern mining before any reflection generation.
- 2026-05-23: Implemented seamless UX slice for this ticket and moved to review with validation evidence in `evidence:20260523-seamless-ux-validation`.
- 2026-05-23: Review run recorded `audit:20260523-seamless-ux-review` with verdict `changes-needed`; pending disposition: real-occurrence tuning gap.
- 2026-05-23: Dispositioned review finding(s) for this ticket with `evidence:20260523-live-pi-tui-smoke` and/or `evidence:20260523-findings-fix-validation`; follow-up audit `audit:20260523-seamless-ux-followup-review` returned `clear` in the inspected scope; residual high-confidence notification/model-provider/long-run tuning gaps remain as follow-up where applicable.
