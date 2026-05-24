# Local Pattern Miner

ID: ticket:20260523-local-pattern-miner
Type: Ticket
Status: closed
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

Closed. The seamless UX implementation review state is reconciled for this ticket's bounded slice. Implementation validation is recorded across `evidence:20260523-seamless-ux-validation`, `evidence:20260523-live-pi-tui-smoke`, `evidence:20260523-findings-fix-validation`, `evidence:20260523-installed-package-high-confidence-smoke`, and `evidence:20260523-high-confidence-visible-suggestion-tui`. `audit:20260523-seamless-ux-followup-review` cleared FIND-001 through FIND-005, and `audit:20260523-high-confidence-visible-suggestion-review` cleared the remaining visible high-confidence suggestion gap. `audit:20260523-final-review-state-reconciliation-review` found no material issue with closing stale seamless implementation tickets.

Residual limits remain routed to `ticket:20260523-real-corpus-evaluation-and-tuning` and `plan:20260523-seamless-failure-memory-ux`: hosted/real model-provider reflection and long-run corpus precision/noise tuning are not claimed here.

## Journal

- 2026-05-23: Created ticket for deterministic local pattern mining before any reflection generation.
- 2026-05-23: Implemented seamless UX slice for this ticket and moved to review with validation evidence in `evidence:20260523-seamless-ux-validation`.
- 2026-05-23: Review run recorded `audit:20260523-seamless-ux-review` with verdict `changes-needed`; pending disposition: real-occurrence tuning gap.
- 2026-05-23: Dispositioned review finding(s) for this ticket with `evidence:20260523-live-pi-tui-smoke` and/or `evidence:20260523-findings-fix-validation`; follow-up audit `audit:20260523-seamless-ux-followup-review` returned `clear` in the inspected scope; residual high-confidence notification/model-provider/long-run tuning gaps remain as follow-up where applicable.
- 2026-05-23: Final review-state reconciliation closed this stale `review` ticket with supporting evidence/audit links; residual provider/corpus limits remain outside this ticket.
