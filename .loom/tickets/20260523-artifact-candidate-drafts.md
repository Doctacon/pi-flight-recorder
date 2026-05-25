# Artifact Candidate Drafts

ID: ticket:20260523-artifact-candidate-drafts
Type: Ticket
Status: closed
Created: 2026-05-23
Updated: 2026-05-23
Risk: high - draft generation sits close to source/Loom/rule mutation, so it must preserve candidate-only behavior and explicit approval boundaries
Priority: medium - this is where routing becomes useful without premature automation
Depends On: ticket:20260523-manual-artifact-routing-review

## Summary

Generate and store safe artifact candidate drafts or handoff text for manually routed deltas. The closure claim is that routed deltas can produce inspectable, evidence-backed candidate artifacts for a small first set of artifact types without mutating source code, docs, Loom records, skills, prompt files, or active rules.

## Related Records

- `plan:20260523-delta-artifact-learning-loop` - strategy and first recommended artifact targets.
- `spec:delta-artifact-learning-loop#REQ-006` through `#REQ-008` - artifact taxonomy, candidate state, and human-gated creation.
- `ticket:20260523-manual-artifact-routing-review` - upstream routed delta/rationale.
- `plan:20260523-reflection-rule-promotion-ux` - existing approved Flight Rule candidate/approval path.
- `spec:seamless-failure-memory-ux` - no autonomous fixes and local-first privacy constraints.

## Scope

May change:

- Artifact candidate drafting functions for the first small set of artifact types.
- Storage updates linking routed deltas to artifact candidate drafts.
- Pi/CLI surfaces for viewing candidate drafts and handoff instructions.
- Tests for candidate content, redaction, cancellation, and no mutation.

First recommended artifact targets:

- Flight Rule handoff: create or link to an existing rule-candidate workflow, but do not activate the rule.
- Loom ticket candidate: produce a ticket-shaped draft/handoff under local candidate state, not a `.loom/tickets` file.
- Code-legibility/refactor ticket candidate: a specialized Loom ticket route naming confusing code seam and expected refactor outcome.
- Test/check candidate: describe a regression or verification artifact to create later.
- Observe/no-artifact: mark why no artifact should be created yet.

Must not change:

- No direct writes to `.loom/tickets`, `.loom/specs`, `CLAUDE.md`, `AGENTS.md`, prompt templates, skills, docs, tests, or source files.
- No active Flight Rule injection without existing explicit approval.
- No classifier/model default route selection.
- No broad support for every artifact type before the first set is proven.

## Acceptance

- ACC-001: For each first-set artifact type, a routed delta can produce an artifact candidate with draft/next-step text, evidence refs, rationale, status, and limits.
  - Evidence: focused tests over fixture deltas for Flight Rule handoff, Loom/code-legibility ticket candidate, test/check candidate, and observe/no-artifact.
  - Audit: Review should reject drafts that lack evidence or rationale.

- ACC-002: Candidate creation does not mutate durable project artifacts or active behavior.
  - Evidence: tests or filesystem assertions showing no writes outside local data dir during draft generation.
  - Audit: Review should challenge source/Loom/rule mutation boundaries.

- ACC-003: Flight Rule candidates integrate with the existing human approval path rather than bypassing it.
  - Evidence: tests showing a Flight Rule artifact candidate is pending/draft and not injected until existing rule approval occurs.
  - Audit: Review should inspect compatibility with `plan:20260523-reflection-rule-promotion-ux`.

- ACC-004: Draft text is bounded/redacted and cites only local evidence refs or summaries safe for display.
  - Evidence: redaction and size-limit tests.
  - Audit: Privacy review should inspect secret/path handling.

- ACC-005: Full validation passes.
  - Evidence: `npm run typecheck`, `npm test`, `npm run build`.
  - Audit: A ticket-level review is recommended because of the mutation boundary risk.

## Current State

Closed. Safe deterministic draft/handoff text is generated and stored for the first artifact set without mutating durable artifacts or active behavior.

Closure support:

- ACC-001: `src/artifact-drafts.ts` generates bounded candidate drafts/next steps/limits for `flight-rule`, `loom-ticket`, `code-legibility`, `test-check`, and `observe`; tests assert evidence refs, rationale, status, and limits are present.
- ACC-002: focused tests snapshot a temp project and `.loom/tickets` directory and assert no project/Loom files are written; candidates remain `applied=false`.
- ACC-003: Flight Rule handoff candidates remain local artifact candidates, do not create rule candidates or active rules, and point to the existing explicit `/flight-review`/`/flight-rules` approval workflow.
- ACC-004: draft text is bounded/redacted; tests assert representative secret-like values and raw `/Users/...` paths are absent from serialized candidates.
- ACC-005: final validation passed `npm run typecheck`, `npm test` (16 files / 72 tests), `npm run test:smoke:local`, `npm run build`, and `npm pack --dry-run` (80 files).

Evidence: `evidence:20260523-artifact-candidate-drafts-validation`.
Audit: `audit:20260523-artifact-candidate-drafts-review` with verdict `clear` within audited scope.

Residual limits: deterministic templates only, no actual Loom/source/docs/test/skill/prompt artifact writing, no active Flight Rule approval/injection bypass, no model/classifier drafting, no real-TUI proof for this new draft display path, and no outcome/recurrence evaluation.

## Journal

- 2026-05-23: Created to make artifact creation safe and explicit: candidates first, durable files/rules only through later approval workflows.
- 2026-05-23: Set active after `ticket:20260523-manual-artifact-routing-review` closed; implementing candidate-only draft/handoff text for the first artifact set.
- 2026-05-23: Added `src/artifact-drafts.ts`, candidate-draft tests, index export, and Pi delta route/show integration that stores and displays draft/handoff text without applying artifacts.
- 2026-05-23: Recorded `evidence:20260523-artifact-candidate-drafts-validation`; final validation passed `npm run typecheck`, `npm test`, `npm run test:smoke:local`, `npm run build`, and `npm pack --dry-run`.
- 2026-05-23: Recorded `audit:20260523-artifact-candidate-drafts-review` with verdict `clear`; closed with actual artifact creation and classifier/model behavior explicitly out of scope.
