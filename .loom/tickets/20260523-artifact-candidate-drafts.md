# Artifact Candidate Drafts

ID: ticket:20260523-artifact-candidate-drafts
Type: Ticket
Status: open
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

Waiting on `ticket:20260523-manual-artifact-routing-review`. The first execution should keep drafts candidate-only even if it is tempting to directly create Loom files.

## Journal

- 2026-05-23: Created to make artifact creation safe and explicit: candidates first, durable files/rules only through later approval workflows.
