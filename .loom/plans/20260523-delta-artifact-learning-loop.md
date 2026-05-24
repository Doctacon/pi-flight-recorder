# Delta Artifact Learning Loop Plan

ID: plan:20260523-delta-artifact-learning-loop
Type: Plan
Status: active
Created: 2026-05-23
Updated: 2026-05-23
Risk: high - this broadens the product from failure memory into behavior-shaping artifact routing, so weak boundaries could create noisy classifiers, premature automation, or unsafe artifact mutation

## Summary

This plan decomposes the first implementation arc for `spec:delta-artifact-learning-loop`: capture expectation-vs-reality deltas, manually route them to artifact candidates, track outcomes/recurrence, and only then evaluate whether an LLM classifier is justified.

It needs multiple tickets because the work crosses domain model, detector signals, Pi review UX, artifact candidate drafting, outcome metrics, and classifier-readiness research. The route deliberately avoids starting with an automated classifier; the classifier is valuable only after a labeled outcome corpus exists.

## Related Records

- `spec:delta-artifact-learning-loop` - behavior contract for expectation deltas, artifact routing, human gates, outcome tracking, and classifier readiness.
- `constitution:main` - local-first, evidence-backed responses, human feedback gates promotion, and small vertical slices.
- `spec:failure-memory-mvp` - existing evidence/provenance and failure/fix episode foundation.
- `spec:seamless-failure-memory-ux` - existing reflection proposals, feedback actions, and privacy boundaries this plan extends.
- `plan:20260523-reflection-rule-promotion-ux` - current Flight Rule artifact route; this plan generalizes beyond rules without replacing that flow.
- `src/types.ts`, `src/storage.ts`, `src/reflection.ts`, `src/pi-extension.ts` - likely implementation seams for delta state, storage, reflection proposals, and guided review.

## Strategy

Build the corpus before building the classifier.

The product direction is strong only if “problem” means a delta between desired and actual session behavior, and “solution” means whichever artifact makes that delta stop recurring. That makes code-legibility/refactor tickets, tests, context docs, Loom records, skills, and observe/no-op first-class possibilities alongside Flight Rules.

The route uses a manual-first learning loop:

1. **Define the data contract.** Add local delta and artifact-candidate state before UI or detector work depends on it.
2. **Capture candidate deltas.** Support explicit user capture and low-risk detector signals, but keep suggestions pending/reviewable.
3. **Route manually.** Let the user review expectation/reality, choose artifact type, and record rationale. This is the reflective work and should not be automated away early.
4. **Draft safe candidates.** Store artifact candidates and handoff text without mutating source/docs/Loom/rules except through existing explicit approval flows.
5. **Measure recurrence.** Track accepted/applied candidates and whether similar deltas recur afterward, because “solution” is an outcome, not a draft.
6. **Evaluate classifier readiness.** Once enough labeled deltas/outcomes exist, produce research or an ADR-style recommendation for whether automated routing should remain advisory, become opt-in, or stay out of scope.

Deliberately out of scope for this plan:

- a default LLM classifier that automatically chooses artifacts;
- automatic source-code/doc/Loom/skill/rule mutation;
- team/shared taxonomy workflows;
- hosted model or memory services;
- replacing the existing Flight Rule approval/injection path;
- proving long-run frontier-movement metrics without a mature corpus.

Validation posture:

- each implementation ticket should run `npm run typecheck`, `npm test`, `npm run build`, and relevant focused tests;
- storage tickets need migration/redaction/old-DB compatibility tests;
- detector tickets need fixture tests with explainable signals and low false-positive bias;
- UI tickets need fake-Pi review transcript tests and cancellation/no-mutation assertions;
- outcome tickets need recurrence-linking fixtures;
- classifier-readiness work should produce a research record or explicit decision with corpus counts and limits, not a classifier by default.

Replan triggers:

- the data model collapses delta records and artifact candidates so tightly that outcomes cannot be tracked independently;
- detector signals are too noisy to be reviewed without user annoyance;
- artifact candidate drafting pressures implementation agents into mutating source/Loom outside approval workflows;
- the first artifact taxonomy proves too broad for one review UI;
- evidence shows users skip manual rationale because the review flow is too heavy.

## Execution Units

### Unit: Delta and artifact-candidate data model

Ticket: `ticket:20260523-delta-record-data-model`

Add the local domain model for expectation deltas, detector signals, artifact candidates, statuses, evidence refs, routing rationale, and outcome fields. This is a storage/type contract ticket only; it must not implement detectors, UI, or artifact creation.

### Unit: Delta capture signals

Ticket: `ticket:20260523-delta-capture-signals`

Add explicit manual capture and low-risk detector suggestions for candidate deltas using existing session/failure/reflection signals. Detector output must explain why a candidate exists and stay pending until review.

Depends on `ticket:20260523-delta-record-data-model`.

### Unit: Manual artifact-routing review

Ticket: `ticket:20260523-manual-artifact-routing-review`

Expose a Pi-native review flow that shows the delta, asks the user to refine expectation/reality when needed, selects an artifact type, records rationale, and stores the route without applying artifacts.

Depends on `ticket:20260523-delta-record-data-model` and benefits from `ticket:20260523-delta-capture-signals`.

### Unit: Safe artifact candidate drafts

Ticket: `ticket:20260523-artifact-candidate-drafts`

Generate/store safe artifact candidate drafts or handoff text for the first few artifact types, with no automatic mutation. First recommended targets are Flight Rule handoff, Loom ticket candidate, code-legibility/refactor ticket candidate, test/check candidate, and observe/no-artifact.

Depends on `ticket:20260523-manual-artifact-routing-review`.

### Unit: Outcome and recurrence metrics

Ticket: `ticket:20260523-outcome-recurrence-metrics`

Track accepted/applied artifact candidates and link later similar deltas back to prior candidates so old categories can be seen as solved, recurring, or still unresolved.

Depends on `ticket:20260523-artifact-candidate-drafts`.

### Unit: Classifier readiness evaluation

Ticket: `ticket:20260523-classifier-readiness-evaluation`

Evaluate whether enough manually routed deltas/outcomes exist to justify automated artifact classification. This ticket should produce a research/decision artifact and must not implement a default classifier unless a later plan explicitly accepts that direction.

Depends on `ticket:20260523-outcome-recurrence-metrics`.

## Milestones

### Milestone: Delta corpus substrate

Child tickets: `ticket:20260523-delta-record-data-model`, `ticket:20260523-delta-capture-signals`

The system can locally collect reviewable expectation-delta candidates with evidence and explainable signals.

### Milestone: Human routing loop

Child tickets: `ticket:20260523-manual-artifact-routing-review`, `ticket:20260523-artifact-candidate-drafts`

The user can route a delta to a safe artifact candidate and preserve rationale without mutating durable project artifacts automatically.

### Milestone: Outcome learning loop

Child tickets: `ticket:20260523-outcome-recurrence-metrics`

The system can tell whether accepted/applied candidates appear to reduce recurrence or whether a category remains open and needs rerouting.

### Milestone: Classifier decision, not classifier theater

Child tickets: `ticket:20260523-classifier-readiness-evaluation`

The project has evidence-backed guidance on whether automated artifact routing is ready, advisory-only, or still premature.

## Current State

Plan is active. `ticket:20260523-delta-record-data-model` is the first execution unit and is now active. This plan remains a future product arc, not a release-readiness blocker, and still deliberately sequences corpus/manual routing before classifier automation.

## Journal

- 2026-05-23: Created plan from operator ideation that the project's power lies in defining “what is a problem?” as expectation delta, then choosing/creating the artifact most likely to bridge that delta. Strategy intentionally chooses corpus/manual routing before classifier automation.
- 2026-05-23: Started first execution unit, `ticket:20260523-delta-record-data-model`.
