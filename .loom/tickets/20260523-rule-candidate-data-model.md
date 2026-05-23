# Rule Candidate Data Model

ID: ticket:20260523-rule-candidate-data-model
Type: Ticket
Status: review
Created: 2026-05-23
Updated: 2026-05-23
Risk: medium - adds durable local schema that later UI and prompt injection depend on
Priority: high - prerequisite for any safe rule promotion flow

## Summary

Add the local SQLite data model, migrations, types, and storage APIs for Flight Rule candidates and approved/disabled rules. This is the durable state contract behind interactive `make-rule` promotion. The closure claim is that proposals can be represented as redacted draft rule candidates and later as scoped active/disabled rules without any UI or prompt-injection behavior yet.

## Related Records

- `plan:20260523-reflection-rule-promotion-ux` - owns the overall interactive rule-promotion route.
- `spec:seamless-failure-memory-ux` - requires local-first feedback controls and no autonomous fixes.
- `ticket:20260523-extension-feedback-controls` - existing `make-rule` feedback action should remain compatible.
- `ticket:20260523-reflection-ui-actions` - existing reflection proposal records are the main source for candidates.
- `src/storage.ts`, `src/types.ts`, `src/reflection.ts` - likely read/write scope for rule candidate persistence.

- `audit:20260523-interactive-rule-promotion-review` - follow-up review of implementation; verdict `concerns` due missing real TUI evidence, no material automated-scope blockers.

## Scope

May change:

- `src/types.ts` for rule candidate/active rule types.
- `src/storage.ts` for schema, migrations, CRUD/list/query APIs, redaction/bounds.
- `src/storage.test.ts` for lifecycle and migration coverage.
- Minimal exports in `src/index.ts` if required by tests or later tickets.

Must not change:

- No Pi interactive UI yet.
- No prompt/system injection yet.
- No automatic activation from `make-rule`.
- No file materialization into repo docs.

State model constraints:

- Candidate status should distinguish at least `draft`, `approved`, `rejected`, and `disabled` or equivalent active-rule relationship.
- Scope should support `global` and `project` at minimum; project scope must retain a redacted display path and an internal matching root if needed.
- Candidate/rule evidence should reference proposal/cluster/occurrence IDs and bounded evidence summaries, not raw session dumps.

## Acceptance

- ACC-001: Opening an old/current DB creates/migrates rule candidate and rule tables without breaking existing tests.
  - Evidence: migration/legacy fixture test.

- ACC-002: Storage APIs can create, fetch, list, update, approve/reject/disable rule candidates or equivalent active rules.
  - Evidence: unit tests over candidate lifecycle.

- ACC-003: Candidate creation from a reflection proposal can store bounded draft text, source proposal/cluster IDs, evidence counts/refs, proposed scope, timestamps, and status.
  - Evidence: storage test using an existing reflection proposal fixture.

- ACC-004: Stored draft/rule/evidence display text is redacted/bounded and does not persist raw `/Users/alice` paths or obvious secrets in derived text fields.
  - Evidence: redaction regression test.

- ACC-005: Re-creating a candidate for the same source proposal dedupes or returns the existing active draft rather than creating noisy duplicates.
  - Evidence: unit test.

## Current State

Implementation is complete and in review. Automated validation evidence is recorded in `evidence:20260523-interactive-rule-promotion-validation`: `npm run typecheck`, `npm test` (13 files, 62 tests), `npm run build`, and `npm pack --dry-run` passed. Follow-up audit `audit:20260523-interactive-rule-promotion-review` returned `concerns` with no material code blockers in the automated scope; real TUI validation remains plan-level blocked follow-up.

## Journal

- 2026-05-23: Created ticket from `plan:20260523-reflection-rule-promotion-ux` as the prerequisite data/state slice for interactive rule promotion.
- 2026-05-23: Implemented this slice as part of `plan:20260523-reflection-rule-promotion-ux`; moved to review with evidence `evidence:20260523-interactive-rule-promotion-validation`.
- 2026-05-23: Follow-up audit `audit:20260523-interactive-rule-promotion-review` returned `concerns` with no material code blockers for this automated implementation scope.
