# Delta Record Data Model

ID: ticket:20260523-delta-record-data-model
Type: Ticket
Status: active
Created: 2026-05-23
Updated: 2026-05-23
Risk: high - the data model will shape future artifact routing and classifier evaluation, and a bad model would collapse evidence, rationale, and outcomes into unusable state
Priority: medium - foundational for the delta-artifact learning loop, but not a release-readiness blocker

## Summary

Add the local domain model for expectation deltas and artifact candidates. The closure claim is that `pi-flight-recorder` has a durable, redacted, local state contract for candidate/accepted/routed deltas, detector signals, artifact candidates, routing rationale, and outcome fields, without implementing detector heuristics, UI, or artifact creation.

## Related Records

- `plan:20260523-delta-artifact-learning-loop` - owns the multi-ticket route and sequencing.
- `spec:delta-artifact-learning-loop` - defines delta/artifact/outcome behavior and boundaries.
- `constitution:main` - local-first, evidence-backed, human-gated promotion principles.
- `spec:failure-memory-mvp` - existing provenance, redaction, and episode evidence model.
- `spec:seamless-failure-memory-ux` - existing reflection proposal and feedback state this model should coexist with.
- `src/types.ts`, `src/storage.ts`, `src/storage-mappers.ts` - likely type/storage/mapping write boundary.

## Scope

May change:

- TypeScript types/interfaces for delta records, detector signals, artifact candidates, statuses, artifact types, and outcome fields.
- Local SQLite schema/migrations and storage APIs needed to create/list/update these records.
- Storage mapper/sanitization helpers and tests for the new state.
- Index exports if needed for library consumers.

Must not change:

- No detector heuristics or session parsing behavior beyond what tests need to construct records.
- No Pi command/UI flow.
- No artifact drafting or source/Loom/rule creation behavior.
- No model calls or classifier behavior.
- No breaking existing failure occurrence, reflection proposal, feedback, or Flight Rule APIs.

Design constraints:

- Deltas and artifact candidates must be separate records so one delta can be rerouted and one candidate can have independent outcome state.
- Evidence refs must use existing redacted/local provenance patterns and must not copy raw session text unnecessarily.
- Artifact type must include at least: `flight-rule`, `loom-ticket`, `loom-spec`, `loom-research`, `loom-knowledge`, `test-check`, `prompt-context`, `skill-or-template`, `code-legibility`, and `observe`.
- Status should support candidate/pending review, accepted/routed, dismissed, resolved, and recurring states without pretending outcome is known at route time.

## Acceptance

- ACC-001: Types and storage schema represent expectation deltas, detector signals, artifact candidates, routing rationale, and outcome fields separately.
  - Evidence: focused type/storage tests and schema inspection.
  - Audit: Later plan audit should challenge whether the model can track recurrence and rerouting without lossy joins.

- ACC-002: New records preserve redacted evidence refs/provenance and avoid storing raw prompts, raw session dumps, secrets, or unbounded local paths in derived fields.
  - Evidence: redaction/sanitization tests using secret-like and path-heavy fixture text.
  - Audit: Privacy review should inspect mapper/storage boundaries.

- ACC-003: Migrations are compatible with existing databases and do not break current test suites for episodes, occurrences, reflection proposals, feedback, or Flight Rules.
  - Evidence: `npm run typecheck`, `npm test`, migration/old-DB fixture tests, and `npm run build`.
  - Audit: Review should compare against existing storage schema behavior.

- ACC-004: Storage APIs support create/list/update flows needed by later tickets without requiring detector/UI decisions.
  - Evidence: tests demonstrating create candidate delta, accept/dismiss/reroute delta, create artifact candidate, mark accepted/applied/outcome placeholder.
  - Audit: Review should reject APIs that imply automatic artifact application.

## Current State

Active. Execution is running as a bounded current-session Ralph slice. Read scope: `spec:delta-artifact-learning-loop`, `plan:20260523-delta-artifact-learning-loop`, constitution/spec dependencies, and `src/types.ts`, `src/storage.ts`, `src/storage-mappers.ts`, storage tests, and exports. Write scope: type/storage/mapping/test/index surfaces needed for the local delta/artifact-candidate data model plus this ticket/plan/evidence/audit records. Stop conditions: no detector heuristics, no Pi UI, no artifact mutation, no model/classifier behavior, and no breaking existing failure/reflection/rule APIs.

## Journal

- 2026-05-23: Created as the foundational child ticket of `plan:20260523-delta-artifact-learning-loop`.
- 2026-05-23: Set active for bounded current-session Ralph implementation slice; plan set active in parallel.
