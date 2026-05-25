# Outcome and Recurrence Metrics

ID: ticket:20260523-outcome-recurrence-metrics
Type: Ticket
Status: closed
Created: 2026-05-23
Updated: 2026-05-23
Risk: medium - recurrence metrics can become misleading if they imply causality without enough evidence, but bounded/local status can still provide useful learning signals
Priority: medium - needed before classifier readiness can be evaluated honestly
Depends On: ticket:20260523-artifact-candidate-drafts

## Summary

Track whether routed artifact candidates are accepted/applied and whether similar deltas recur afterward. The closure claim is that the system can distinguish solved, recurring, unresolved, and rerouted delta categories with evidence-backed limits, without claiming causality or long-run success prematurely.

## Related Records

- `plan:20260523-delta-artifact-learning-loop` - outcome-learning milestone and classifier sequencing.
- `spec:delta-artifact-learning-loop#REQ-009` - accepted/applied artifact and recurrence tracking requirement.
- `ticket:20260523-artifact-candidate-drafts` - artifact candidates whose outcomes will be tracked.
- `spec:seamless-failure-memory-ux` - existing cluster/reflection state and recurrence signals.
- `src/pattern-miner.ts`, `src/storage.ts`, `src/reflection.ts` - likely implementation seams.

## Scope

May change:

- Storage fields/APIs for artifact candidate accepted/applied/outcome status and timestamps.
- Recurrence-linking logic that associates later similar deltas with earlier artifact candidates.
- Status/export/summary surfaces that report solved/recurring/unresolved categories with limits.
- Tests over fixture timelines.

Must not change:

- No classifier implementation.
- No automatic rerouting or artifact mutation.
- No claims that a candidate caused improvement without enough evidence.
- No long-run analytics dashboard beyond the smallest status needed for this loop.

Metric constraints:

- Metrics should use cautious language: “no recurrence observed since applied,” “recurring after applied,” or “insufficient evidence,” not “fixed forever.”
- Later deltas may link to a prior candidate by signature/cluster/artifact target/rationale, but links must remain inspectable and correctable.

## Acceptance

- ACC-001: Artifact candidates can be marked accepted/applied/rejected and store outcome notes without losing original route/evidence/rationale.
  - Evidence: storage/API tests.
  - Audit: Review should ensure outcome state is separate from route decision.

- ACC-002: Later similar delta records can be linked back to prior artifact candidates as recurrence evidence.
  - Evidence: fixture timeline tests showing recurrence after applied candidate.
  - Audit: Review should challenge over-linking and false causality.

- ACC-003: A status/summary surface reports categories such as unresolved, no recurrence observed, recurring after applied, and insufficient evidence with limits.
  - Evidence: snapshot tests or command output tests.
  - Audit: Review should reject overconfident success language.

- ACC-004: Rerouting remains possible when recurrence shows a prior artifact did not bridge the delta.
  - Evidence: tests showing a recurring delta can create/link a new candidate without deleting prior outcome history.
  - Audit: Review should inspect history preservation.

- ACC-005: Full validation passes.
  - Evidence: `npm run typecheck`, `npm test`, `npm run build`.
  - Audit: Ticket-level review recommended for metric language and recurrence logic.

## Current State

Closed. Local outcome/recurrence metrics are implemented with cautious summaries, inspectable recurrence links, and history-preserving reroutes.

Closure support:

- ACC-001: `src/delta-outcomes.ts` plus storage tests/helpers mark candidates accepted/applied/rejected and record outcome notes while preserving original route/evidence/rationale.
- ACC-002: `recordDeltaRecurrenceWithStore` links later deltas to prior artifact candidates and marks recurrence after applied only when timestamps support that category.
- ACC-003: CLI/Pi summary/status surfaces report `unresolved`, `insufficient evidence`, `no recurrence observed`, and `recurring after applied` with explicit local-observation limits and no causal success claim.
- ACC-004: fixture tests reroute after recurrence to a new candidate while preserving prior candidate rationale and recurrence history.
- ACC-005: final validation passed `npm run typecheck`, `npm test` (17 files / 76 tests), `npm run test:smoke:local`, `npm run build`, and `npm pack --dry-run` (83 files).

Evidence: `evidence:20260523-outcome-recurrence-metrics-validation`.
Audit: `audit:20260523-outcome-recurrence-metrics-review` with verdict `clear` within audited scope.

Residual limits: no real interactive Pi TUI proof for the new fallback commands, no long-run corpus proof, no classifier, no automatic route/artifact mutation, and no causal proof that any artifact improved behavior.

## Journal

- 2026-05-23: Created to preserve the idea that a solution is an observed outcome, not merely an artifact draft.
- 2026-05-23: Set active after `ticket:20260523-artifact-candidate-drafts` closed; starting bounded implementation for outcome status, recurrence links, cautious summaries, and reroute-history preservation.
- 2026-05-23: Implemented local outcome/recurrence helpers, reject status support, CLI/Pi summary/outcome/recurrence surfaces, and focused tests.
- 2026-05-23: Recorded `evidence:20260523-outcome-recurrence-metrics-validation`; validation passed typecheck, focused tests, full tests, local smoke, build, and pack dry-run. Moved to review for audit.
- 2026-05-23: Recorded `audit:20260523-outcome-recurrence-metrics-review` with verdict `clear` within audited scope; closed with real-TUI, long-run corpus, classifier, and causal-effectiveness proof explicitly out of scope.
