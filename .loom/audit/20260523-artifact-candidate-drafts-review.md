# Artifact Candidate Drafts Review

ID: audit:20260523-artifact-candidate-drafts-review
Type: Audit
Status: recorded
Created: 2026-05-23
Updated: 2026-05-23
Audited: 2026-05-23
Target: ticket:20260523-artifact-candidate-drafts

## Summary

A bounded Ralph-style adversarial review inspected the artifact-candidate draft implementation, tests, evidence, and acceptance claims. Verdict: `clear` within audited scope. The implementation generates deterministic, local, redacted draft/handoff text for the first artifact set and stores it only in local candidate state; it does not mutate durable project artifacts or activate rules.

## Target

- `ticket:20260523-artifact-candidate-drafts`
- Source diff for:
  - `src/artifact-drafts.ts`
  - `src/artifact-drafts.test.ts`
  - `src/pi-extension.ts`
  - `src/pi-extension.test.ts`
  - `src/index.ts`
- Evidence:
  - `evidence:20260523-artifact-candidate-drafts-validation`

## Audit Scope And Lenses

Lenses:

- claim and evidence;
- acceptance coverage;
- mutation-boundary and human-gate preservation;
- Flight Rule approval/injection compatibility;
- privacy/redaction and bounded draft text;
- product scope: first-set artifacts only, no classifier/model behavior;
- regression risk to existing delta review and Flight Rule flows.

Out of scope:

- polished final artifact generation;
- writing actual Loom/source/docs/test/skill/prompt artifacts;
- real TUI validation;
- outcome/recurrence effectiveness;
- classifier readiness;
- hosted/model-provider drafting.

## Context And Evidence Reviewed

Reviewed records:

- `ticket:20260523-artifact-candidate-drafts`
- `plan:20260523-delta-artifact-learning-loop`
- `spec:delta-artifact-learning-loop`
- `ticket:20260523-manual-artifact-routing-review`
- `evidence:20260523-artifact-candidate-drafts-validation`

Reviewed source paths:

- `src/artifact-drafts.ts`
- `src/artifact-drafts.test.ts`
- `src/pi-extension.ts`
- `src/pi-extension.test.ts`
- `src/index.ts`

Reviewed validation evidence:

```text
npm run typecheck                                              -> passed
npm test -- src/artifact-drafts.test.ts src/pi-extension.test.ts src/storage.test.ts -> 3 files / 28 tests passed
npm test                                                       -> 16 files / 72 tests passed
npm run test:smoke:local                                       -> 1 file / 1 test passed
npm run build                                                  -> passed
npm pack --dry-run                                             -> 80 files
```

## Findings

None - no material findings within audited scope.

## Verdict

`clear` within audited scope.

ACC-001 is supported: the first-set artifact routes (`flight-rule`, `loom-ticket`, `code-legibility`, `test-check`, `observe`) generate candidate records with proposed draft text, next steps, rationale, evidence refs, status, limits, and confidence.

ACC-002 is supported: draft generation writes only local candidate state. Tests snapshot a temp project and `.loom/tickets` directory and assert no project/Loom files are created or changed. Candidates remain `applied=false`.

ACC-003 is supported: Flight Rule handoff candidates are not active rules and do not create rule candidates. The next step points to existing explicit rule approval workflow, and rule/rule-candidate counts remain zero.

ACC-004 is supported: draft text is bounded and redacted. Tests assert representative secret-like values and raw home paths are absent from serialized candidates.

ACC-005 is supported by full validation.

## Required Follow-up

- Continue with `ticket:20260523-outcome-recurrence-metrics` to track accepted/applied candidates and recurrence outcomes.
- When implementing actual artifact creation in the future, use separate approval workflows and tickets; do not retroactively treat candidate drafts as applied artifacts.
- Keep broad/generic artifact-type drafting conservative until the first-set flows produce useful corpus data.

## Residual Risk

- Drafts are deterministic templates, not polished final artifacts.
- The Flight Rule handoff is intentionally only a handoff; converting it into a rule candidate still requires a later explicit workflow.
- Redaction tests are representative, not exhaustive for every possible secret pattern.
- No real interactive TUI proof was gathered for the draft display path.

## Related Records

- `evidence:20260523-artifact-candidate-drafts-validation`
- `plan:20260523-delta-artifact-learning-loop`
- `spec:delta-artifact-learning-loop#REQ-006`
- `spec:delta-artifact-learning-loop#REQ-007`
- `spec:delta-artifact-learning-loop#REQ-008`
- `ticket:20260523-outcome-recurrence-metrics`
