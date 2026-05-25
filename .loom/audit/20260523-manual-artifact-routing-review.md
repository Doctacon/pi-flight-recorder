# Manual Artifact Routing Review Audit

ID: audit:20260523-manual-artifact-routing-review
Type: Audit
Status: recorded
Created: 2026-05-23
Updated: 2026-05-23
Audited: 2026-05-23
Target: ticket:20260523-manual-artifact-routing-review

## Summary

A bounded Ralph-style adversarial review inspected the manual artifact-routing implementation, fake-Pi tests, evidence, and acceptance claims. Verdict: `clear` within audited scope. The implementation adds Pi-native delta review/routing and scriptable fallback commands while preserving the human gate: routes are stored as accepted but unapplied artifact candidates, and no durable artifacts are created or mutated.

## Target

- `ticket:20260523-manual-artifact-routing-review`
- Source diff for:
  - `src/pi-extension.ts`
  - `src/pi-extension.test.ts`
- Evidence:
  - `evidence:20260523-manual-artifact-routing-review-validation`

## Audit Scope And Lenses

Lenses:

- claim and evidence;
- acceptance coverage;
- product/UX: whether non-rule interventions are visible;
- human-gate preservation and no artifact mutation;
- cancellation/no-UI fallback correctness;
- compatibility with existing Flight Rule guided review;
- scope containment: no classifier/model route selection, no draft generation, no source/docs/Loom/rule/skill mutation.

Out of scope:

- real interactive TUI proof for the new delta-review flow;
- artifact draft/handoff generation;
- long-run route quality;
- classifier readiness;
- real provider/model behavior.

## Context And Evidence Reviewed

Reviewed records:

- `ticket:20260523-manual-artifact-routing-review`
- `plan:20260523-delta-artifact-learning-loop`
- `spec:delta-artifact-learning-loop`
- `ticket:20260523-delta-record-data-model`
- `ticket:20260523-delta-capture-signals`
- `evidence:20260523-manual-artifact-routing-review-validation`

Reviewed source paths:

- `src/pi-extension.ts`
- `src/pi-extension.test.ts`

Reviewed validation evidence:

```text
npm run typecheck                                                -> passed
npm test -- src/pi-extension.test.ts src/delta-capture.test.ts src/storage.test.ts -> 3 files / 29 tests passed
npm test                                                         -> 15 files / 70 tests passed
npm run test:smoke:local                                         -> 1 file / 1 test passed
npm run build                                                    -> passed
npm pack --dry-run                                               -> 77 files
```

## Findings

None - no material findings within audited scope.

## Verdict

`clear` within audited scope.

ACC-001 is supported: the fake-Pi guided review uses a choice prompt for pending deltas and an editor prefill containing expectation, reality, signals, and evidence. The route prompt repeats signal/evidence context so the user is not routing only from an opaque ID.

ACC-002 is supported: selecting a route stores an artifact candidate with artifact type and rationale, marks the delta routed, accepts the route candidate, and leaves `applied=false`. The test verifies no Flight Rule candidate or rule was created by the route.

ACC-003 is supported: observe/no-artifact and dismiss fallback paths are tested and preserve evidence refs. Observe is represented as a first-class `observe` artifact route rather than a failure state.

ACC-004 is supported: no-UI fallback tells the user to use `/flight-deltas list|show|route|dismiss`, and fallback commands are tested for route and dismiss.

ACC-005 is supported: the full suite still passes, including existing guided Flight Rule promotion/injection/disable tests.

## Required Follow-up

- Continue with `ticket:20260523-artifact-candidate-drafts` to add safe draft/handoff text for selected artifact types.
- Keep durable artifact creation behind later explicit approval workflows.
- Consider real interactive TUI validation for delta review before making strong release claims about this new UX, but do not treat that as required for this ticket's fake-Pi acceptance.

## Residual Risk

- The guided flow is validated with fake-Pi UI tests, not real interactive TUI screenshots.
- The route taxonomy is broad; future UI work may need grouping if the choice list feels dense in real use.
- Fallback commands are intentionally scriptable but should not become the primary normal UX.
- Stored route rationale quality depends on the user; classifier readiness still requires a larger labeled/outcome corpus.

## Related Records

- `evidence:20260523-manual-artifact-routing-review-validation`
- `plan:20260523-delta-artifact-learning-loop`
- `spec:delta-artifact-learning-loop#REQ-005`
- `spec:delta-artifact-learning-loop#REQ-006`
- `spec:delta-artifact-learning-loop#REQ-007`
- `spec:delta-artifact-learning-loop#REQ-008`
- `ticket:20260523-artifact-candidate-drafts`
