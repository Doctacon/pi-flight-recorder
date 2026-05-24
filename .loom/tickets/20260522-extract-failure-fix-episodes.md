# Extract Failure Fix Episodes

ID: ticket:20260522-extract-failure-fix-episodes
Type: Ticket
Status: closed
Created: 2026-05-22
Updated: 2026-05-23
Risk: medium - heuristic errors can create misleading recovery advice
Priority: high - this is the core product differentiation
Depends On: ticket:20260522-ingest-pi-sessions

## Summary

Implement the failure/fix episode extractor over parsed Pi session events. The closure claim is that fixture sessions produce structured candidate episodes with failure signatures, source evidence, likely attempted fixes, likely resolutions when supported, confidence, and explicit limits.

## Related Records

- `spec:failure-memory-mvp` - especially REQ-004 through REQ-006, REQ-010 through REQ-013, SCN-001 through SCN-003 and SCN-005/SCN-006.
- `research:20260522-agent-session-memory-landscape` - explains why outcome-aware extraction is the MVP differentiator.
- `ticket:20260522-ingest-pi-sessions` - provides normalized events and branch ancestry.
- `ticket:20260522-store-and-index-episodes` - stores extracted episodes once both interfaces are ready.
- `plan:20260522-pi-flight-recorder-mvp` - coordinates extraction after parser/storage foundations.

## Scope

May change:

- Episode extraction source files, signature normalization, redaction helpers, confidence scoring, fixture sessions, and tests.
- Minimal integration with storage interfaces when available.

Must not change:

- No autonomous code-fix application.
- No embeddings/clustering requirement.
- No broad idea mining.
- No Pi UI/commands beyond data shape required by later tickets.

Extraction should prefer honest uncertainty over overconfident advice. If no resolution is supported, the episode should still be searchable as an observed unresolved failure.

Likely first Ralph run: implement deterministic fixture-driven heuristics for failed command/tool events, normalized signatures, adjacent attempted-fix windows, later passing validation detection on the same branch path, and secret redaction tests.

Stop if fixture scenarios reveal that resolution inference cannot be made safely without operator guidance; update spec limits before widening heuristics.

## Acceptance

- ACC-001: Non-zero `bashExecution` and errored `toolResult` events produce candidate failure episodes with source refs and normalized signatures.
  - Evidence: Unit tests over fixtures assert episode fields, signatures, and source refs.
  - Audit: Review signatures are stable but not so lossy that unrelated failures collapse together.

- ACC-002: The extractor distinguishes observed failure evidence, attempted fixes, and likely resolution evidence.
  - Evidence: Fixture test with fail-edit-pass sequence asserts separate fields and confidence.
  - Audit: Review no inferred resolution is presented as fact.

- ACC-003: Branch-aware extraction avoids linking resolution evidence from an unrelated sibling branch.
  - Evidence: Branching fixture test asserts only same-path resolution is linked.
  - Audit: Review ancestry/path logic against `spec:failure-memory-mvp#SCN-003`.

- ACC-004: Secret-looking values are redacted from derived snippets/signatures shown to users.
  - Evidence: Redaction unit tests for token/password/key/private-key-like patterns.
  - Audit: Review redaction does not destroy source refs needed for local inspection.

- ACC-005: Low-confidence or unresolved episodes remain searchable with explicit limits.
  - Evidence: Fixture test asserts unresolved status/limits instead of fake fix.
  - Audit: Review user-facing fields cannot imply closure where none exists.

## Current State

Closed. The MVP implementation review state is reconciled. `evidence:20260522-mvp-validation` supports the scaffold/parser/storage/extractor/query/Pi-wrapper/docs acceptance at fixture/test/build/package level, and later release validation (`npm run typecheck`, `npm test`, `npm run test:smoke:local`, `npm run build`, and `npm pack --dry-run`) passed in the stabilized code shape. `audit:20260523-final-review-state-reconciliation-review` found no material issue with closing stale MVP review tickets while preserving broader limits.

Residual limits remain outside this ticket: full real-corpus precision tuning and hosted/model-provider behavior are not claimed by the MVP closure.

## Journal

- 2026-05-22: Created ticket with Status `open`. Scope is outcome-aware extraction only; query UX and Pi wrapper are separate.

- 2026-05-22: Implemented the ticket scope and moved Status to `review`. Validation evidence: `evidence:20260522-mvp-validation`. Closure still needs review/audit disposition; residual live-Pi and heuristic-quality limits are explicit where applicable.
- 2026-05-23: Final review-state reconciliation closed this stale `review` ticket with supporting evidence/audit links; residual provider/corpus limits remain outside this ticket.
