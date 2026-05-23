# Guided Rule Draft Approval Flow

ID: ticket:20260523-guided-rule-draft-approval-flow
Type: Ticket
Status: review
Created: 2026-05-23
Updated: 2026-05-23
Risk: medium-high - approval turns reflection output into durable behavior state
Priority: high - core value of reflection-to-rule promotion
Depends On: ticket:20260523-rule-candidate-data-model, ticket:20260523-guided-reflection-action-flow

## Summary

Implement the interactive Make Rule path: create or reuse a rule candidate from a reflection proposal, generate a concise draft rule, let the user review/edit it, choose scope, and explicitly approve/save/cancel. The closure claim is that a useful proposal can become a human-approved scoped Flight Rule candidate/active rule through a guided Pi flow, without prompt injection yet.

## Related Records

- `plan:20260523-reflection-rule-promotion-ux` - defines the guided make-rule and approval UX.
- `ticket:20260523-rule-candidate-data-model` - provides candidate/rule persistence.
- `ticket:20260523-guided-reflection-action-flow` - provides the interactive proposal/action entrypoint.
- `spec:seamless-failure-memory-ux` - requires human feedback gates and no autonomous fixes.
- `src/reflection.ts`, `src/pi-extension.ts`, `src/storage.ts` - likely affected source.

- `audit:20260523-interactive-rule-promotion-review` - follow-up review of implementation; verdict `concerns` due missing real TUI evidence, no material automated-scope blockers.

## Scope

May change:

- Rule draft generation logic, likely in a new helper module or `src/reflection.ts` adjunct.
- `src/pi-extension.ts` guided flow for Make Rule from proposal.
- Storage usage to create/update/approve candidates.
- Tests for draft, edit, scope, approve/save/cancel behavior.
- Docs describing draft vs approved rule state.

Must not change:

- No `before_agent_start` rule injection yet.
- No automatic activation from `useful` alone.
- No file export/materialization.
- No background model calls. Optional model refinement is out of this ticket unless explicitly added later.

Rule drafting constraints:

- Resolved/high-confidence proposals may draft behavior rules.
- Unresolved/low-confidence proposals must draft investigation reminders or refuse to draft a fix-like rule.
- Draft text must be concise, redacted, and suitable for future prompt injection after approval.
- Default scope suggestion should be global for generic agent/tool workflow patterns and project for repo/build/library-specific patterns.

## Acceptance

- ACC-001: Selecting Make Rule for a proposal creates or reuses a draft candidate with redacted draft text and evidence refs.
  - Evidence: fake-Pi/storage test.

- ACC-002: The user can accept the draft, edit it, save as draft, cancel, or approve with `global` or `project` scope through fake-Pi UI.
  - Evidence: fake-Pi tests for each branch or representative branches plus cancellation.

- ACC-003: Approval is explicit; running Make Rule alone must not create an injected/active future-turn rule unless the user selected approve.
  - Evidence: storage state assertions.

- ACC-004: Exact-edit-mismatch proposals produce a concrete workflow rule resembling: re-read the target block before exact-text edits and use current smallest oldText.
  - Evidence: deterministic draft-generation test using fixture proposal data.

- ACC-005: Low-confidence/unresolved proposals do not overclaim a durable fix.
  - Evidence: draft-generation test.

## Current State

Implementation is complete and in review. Automated validation evidence is recorded in `evidence:20260523-interactive-rule-promotion-validation`: `npm run typecheck`, `npm test` (13 files, 62 tests), `npm run build`, and `npm pack --dry-run` passed. Follow-up audit `audit:20260523-interactive-rule-promotion-review` returned `concerns` with no material code blockers in the automated scope; real TUI validation remains plan-level blocked follow-up.

## Journal

- 2026-05-23: Created ticket from `plan:20260523-reflection-rule-promotion-ux` to implement the core guided rule-promotion flow.
- 2026-05-23: Implemented this slice as part of `plan:20260523-reflection-rule-promotion-ux`; moved to review with evidence `evidence:20260523-interactive-rule-promotion-validation`.
- 2026-05-23: Follow-up audit `audit:20260523-interactive-rule-promotion-review` returned `concerns` with no material code blockers for this automated implementation scope.
- 2026-05-23: First real TUI attempt showed action selection lacked proposal context; updated `/flight-review` choices/prompts to include title, summary, likely fix, confidence, and ID, with tests and validation re-run.
