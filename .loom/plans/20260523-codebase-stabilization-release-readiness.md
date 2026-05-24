# Codebase Stabilization and Release Readiness

ID: plan:20260523-codebase-stabilization-release-readiness
Type: Plan
Status: completed
Created: 2026-05-23
Updated: 2026-05-23
Risk: high - the work coordinates Loom state repair, real Pi extension behavior, persistence boundaries, and release-facing docs for a local-first tool that affects future agent context

## Summary

This plan shapes the next codebase-level work for `pi-flight-recorder` after the extension-first failure-memory implementation. The codebase already has broad functionality, tests, docs, and packaged `dist/` output, but the recovery graph and source shape are not yet release-ready: many tickets sit in `review`, one real TUI validation ticket is blocked, the most important runtime seams live in very large modules, and some product claims depend on real Pi evidence that is still partial.

The outcome is not new product surface area. The outcome is a trustworthy, maintainable release candidate: Loom state reflects reality, risky extension behaviors have repeatable evidence, large modules have clearer seams without behavior change, and docs/package metadata match what has actually been proven.

This needs more than one ticket because it mixes graph reconciliation, evidence harnessing, behavior-preserving refactors, real integration validation, and final release contract cleanup. Those closure claims should not be bundled into one implementation run.

## Related Records

- `constitution:main` - constrains the tool to local-first, evidence-backed, Pi-session-aware failure memory with human feedback gates and no autonomous fixing.
- `spec:failure-memory-mvp` - defines the original failure/fix memory behavior that refactors must preserve.
- `spec:live-failure-monitoring` - defines live watcher/suggestion behavior and constraints.
- `spec:seamless-failure-memory-ux` - defines the extension-first product behavior and local/privacy boundary.
- `plan:20260523-seamless-failure-memory-ux` - shows the implemented seamless UX route and remaining residual evidence gaps.
- `plan:20260523-reflection-rule-promotion-ux` - shows the implemented Flight Rules route and the blocked real TUI validation gate.
- `ticket:20260523-interactive-rule-promotion-tui-validation` - existing blocked ticket for the real guided rule-promotion TUI proof.
- `knowledge:pi-extension-command-bootstrap-data-dir` - records a real bootstrap/data-dir isolation lesson that the smoke harness and extension refactor must preserve.
- `README.md`, `docs/first-run.md`, `docs/live-monitoring.md`, `package.json` - release-facing surfaces that must match proven behavior.
- `src/pi-extension.ts` - currently centralizes extension lifecycle, commands, event handlers, feedback, reflection, and rule injection in one large module.
- `src/storage.ts` - currently centralizes schema, migrations, row mapping, sanitization, search, occurrence, feedback, cluster, proposal, and rule persistence in one large module.

## Strategy

Treat this as a stabilization pass, not a feature expansion. The dangerous ambiguity in “shape the codebase” is whether to add more capability or make the existing capability trustworthy. This plan chooses trustworthiness because the current records already claim the product surface is implemented while leaving review, evidence, and maintainability debt.

Scope included:

- reconcile Loom records so `review`, `active`, and `blocked` states tell one honest story;
- create a repeatable local smoke harness before refactoring or making release claims;
- split the two largest source seams only where the split is behavior-preserving and test-backed;
- gather or explicitly defer the remaining real Pi evidence gaps;
- align docs/package surfaces with observed and reviewed behavior.

Scope excluded:

- new product features, new storage concepts, hosted services, embeddings, daemon/service installation, or autonomous fixes;
- changing Pi command semantics while refactoring;
- replacing SQLite or adding non-standard runtime dependencies;
- closing existing tickets merely by changing status without evidence/audit posture;
- treating fake-Pi unit tests as proof of real TUI behavior.

Order matters:

1. Reconcile Loom state first so implementation agents know what is actually open, stale, blocked, or ready for closure.
2. Add a repeatable local smoke harness before large refactors, so behavior-preserving claims have a stronger proof path than unit tests alone.
3. Refactor `src/pi-extension.ts` around lifecycle/command/event seams while preserving command behavior and bootstrap/data-dir invariants.
4. Refactor `src/storage.ts` around schema/migration/mapping/persistence seams while preserving database compatibility.
5. Run real evidence gates after the harness and refactors, because pre-refactor real smoke would not prove the final code shape.
6. Update release-facing docs/package metadata last, so public claims follow evidence instead of leading it.

Parallelism is limited. After the Loom reconciliation ticket, the smoke harness can start independently. The extension and storage refactors can proceed in either order once the harness exists, but both should finish before the final real evidence and release contract tickets. If either refactor reveals behavior ambiguity rather than a mechanical seam split, stop and route the ambiguity to a spec or research record instead of expanding the refactor ticket.

Replan triggers:

- real Pi TUI validation cannot be obtained in this environment and must become an explicit release blocker or deferred non-goal;
- refactoring either large module requires changing public behavior, schema, or command output beyond small test-stabilizing adjustments;
- the smoke harness would need to read the operator’s real sessions or persist raw session contents into Loom evidence;
- release docs need to claim behavior not supported by evidence;
- an existing review ticket contains unresolved acceptance that contradicts this stabilization route.

## Execution Units

### Unit: Reconcile Loom review state

Ticket: `ticket:20260523-loom-review-state-reconciliation`

Audit the existing Loom graph and update record state only where evidence supports the change. This is the first unit because stale `review` and `active` states make later execution unsafe. The closure claim is that the graph accurately distinguishes closed-ready work, blocked work, active plans, deferred risks, and follow-up tickets. This is a Loom-only execution unit; it must not edit source code.

### Unit: Add repeatable local smoke harness

Ticket: `ticket:20260523-repeatable-local-smoke-harness`

Create a project-local validation harness for extension/CLI behavior using isolated temporary data dirs and fixture Pi session data. This comes before refactoring so later tickets can prove behavior preservation without touching real operator session state. The closure claim is that an agent can run one documented local smoke path that exercises bootstrap isolation, occurrence capture, reflection, and rules/status surfaces without leaking real sessions into test data.

### Unit: Split Pi extension boundary

Ticket: `ticket:20260523-pi-extension-boundary-refactor`

Refactor the large Pi extension module into clearer lifecycle/bootstrap, command-routing, feedback/review/rule, and event-handler boundaries without changing registered commands, modes, event semantics, prompt injection semantics, or data-dir switching behavior. The closure claim is behavior-preserving source shape improvement for the Pi extension seam.

### Unit: Split storage and migration boundary

Ticket: `ticket:20260523-storage-schema-boundary-refactor`

Refactor the large storage module so schema/migration setup, row mapping/sanitization, search/episode persistence, occurrence/feedback persistence, and rule/reflection persistence have clearer boundaries while preserving the SQLite database contract and migration compatibility. The closure claim is behavior-preserving source shape improvement for the persistence seam.

### Unit: Close release evidence gaps

Ticket: `ticket:20260523-release-evidence-gap-smoke`

Use the harness and real Pi TUI where available to gather or explicitly defer the remaining evidence gaps: guided rule promotion, high-confidence suggestion notification, disable/no-injection behavior, model-assisted reflection with a real provider if available, and long-run corpus tuning limits. This unit should update evidence and existing relevant tickets/plans, not implement feature changes except tiny smoke/docs corrections. The closure claim is that release-risk behaviors are either evidenced in the final code shape or explicitly marked as unproven/deferred.

### Unit: Align release docs and package contract

Ticket: `ticket:20260523-docs-package-release-contract`

Update release-facing documentation and package surfaces after evidence/refactors so users see extension-first usage, supported commands, Node/runtime requirements, privacy limits, known unproven edges, and CLI debug positioning accurately. The closure claim is that docs/package contract matches the evidenced release candidate rather than aspirational implementation notes.

## Milestones

### Milestone: Graph is trustworthy enough to execute from

Child tickets: `ticket:20260523-loom-review-state-reconciliation`

Existing plans and tickets no longer force agents to infer whether work is active, blocked, review-only, deferred, or closeable. Later agents can start from Loom without replaying chat.

### Milestone: Behavior-preservation proof path exists

Child tickets: `ticket:20260523-repeatable-local-smoke-harness`

The project has a repeatable local smoke path that can support refactor and release claims without using real operator sessions or hosted services.

### Milestone: Main source seams are maintainable

Child tickets: `ticket:20260523-pi-extension-boundary-refactor`, `ticket:20260523-storage-schema-boundary-refactor`

The two largest modules have clearer boundaries while preserving tests, build, package output, database compatibility, and product behavior.

### Milestone: Release claims are evidenced

Child tickets: `ticket:20260523-release-evidence-gap-smoke`, `ticket:20260523-docs-package-release-contract`

Risky live/TUI behaviors are either evidenced or named as limits, and public docs/package surfaces match the final observed behavior.

## Current State

Completed. All six child tickets are closed:

- `ticket:20260523-loom-review-state-reconciliation`
- `ticket:20260523-repeatable-local-smoke-harness`
- `ticket:20260523-pi-extension-boundary-refactor`
- `ticket:20260523-storage-schema-boundary-refactor`
- `ticket:20260523-release-evidence-gap-smoke`
- `ticket:20260523-docs-package-release-contract`

The plan achieved its stabilization goal: the Loom graph has an explicit inventory/residual-risk story, local smoke validation exists, the largest extension/storage seams were split without intended behavior/schema changes, release-risk evidence gaps were either locally exercised or explicitly deferred, and release-facing docs/package surfaces now match the observed validation state. Final validation recorded in `evidence:20260523-docs-package-release-contract-validation` passed `npm run typecheck`, `npm run test:smoke:local`, `npm test` (14 files / 63 tests), `npm run build`, and `npm pack --dry-run`.

Residual risks are not hidden by this completion: real interactive Flight Rule promotion, high-confidence live suggestion notification in a real TUI, real model-provider reflection, long-run corpus tuning, and installed-package real Pi smoke remain outside this plan's completed scope unless separately evidenced. The next shaped execution path is `plan:20260523-automated-real-pi-tui-rule-promotion-validation`, starting with `ticket:20260523-real-pi-tui-automation-guardrails`. The broader future product arc is `plan:20260523-delta-artifact-learning-loop`, intentionally sequenced after the first artifact loop's real-TUI trust boundary is resolved.

No separate parent-plan Ralph audit was run in this Weaver reconciliation pass; child tickets carried their own evidence/audit records, and this update makes no new implementation or validation claim beyond those closed records.

## Journal

- 2026-05-23: Created plan from operator request to shape the codebase without implementing. Chose stabilization/release-readiness over feature expansion because existing product surface is broad while Loom state, evidence gates, and large module seams remain the main risks.
- 2026-05-23: Set plan to `active` after the reconciliation child ticket started. Weaver resolved the direction-record blocker by clarifying that reconciliation is inventory and honest state classification, not mass closure of old review tickets. Parent plan now records the narrower interpretation so Driver can resume without editing direction records from the Driver role.
- 2026-05-23: Weaver reconciliation pass confirmed all six child tickets are closed with evidence/audit posture recorded in their tickets. Set Status to `completed`; preserved residual real-TUI/model/corpus/installed-package limits as follow-up work rather than hiding them in the release-readiness completion claim.
