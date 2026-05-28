# Local Diagnosis Model Contract Harness Third Follow-up Review

ID: audit:20260527-local-diagnosis-model-contract-harness-third-followup-review
Type: Audit
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Audited: 2026-05-27
Target: ticket:20260527-local-diagnosis-model-contract-harness

## Summary

A Ralph reviewer audited the third follow-up fix for the `can` modal action bypass. The audited `can` phrases are now rejected, but the review found another adjacent display-action bypass for `need(s) to`, `has to`, and `have to` phrasing.

## Target

- Third follow-up implementation for `audit:20260527-local-diagnosis-model-contract-harness-second-followup-review`.
- `ticket:20260527-local-diagnosis-model-contract-harness` ACC-003.
- Source changes in `src/flight-learn-local-diagnosis-model.ts` and `src/flight-learn-local-diagnosis-model.test.ts`.

## Audit Scope And Lenses

Lenses: follow-through, output-validation safety, acceptance, evidence sufficiency.

In scope:

- Whether the `can` modal-action bypass was fixed.
- Whether obvious adjacent action-like phrasing still undermines ACC-003.

Out of scope:

- Real runtime/provider locality.
- UI integration and adapter behavior.

## Context And Evidence Reviewed

- Ralph review run: reviewer inspected the ticket, second follow-up audit, validation evidence/artifacts, REQ-026/REQ-027/SCN-009, implementation source, tests, current worktree status, and targeted ad hoc probes.
- Third follow-up artifacts showed focused tests, typecheck, build, and full tests passing.

## Findings

### FIND-001: `need(s) to`, `has to`, and `have to` action phrasing bypass display-only validation

Severity: blocker.

The third follow-up fixed the audited `can` modal examples, but the modal-action rejection pattern misses common phrasing where the modal/obligation term is followed by `to` before the action verb. The reviewer reproduced accepted unsafe display text in a fact-supported context:

- `The assistant needs to update a file.` -> accepted.
- `The assistant has to update a file.` -> accepted.
- `We have to add a test.` -> accepted.

This still challenges ACC-003 and REQ-027 because model output can become action advice instead of display-only diagnosis wording.

## Verdict

`changes-needed` - The specific `can` bypass is resolved, but ACC-003 remains blocked by adjacent action-like phrasing. Another narrow fix and regression pass is required.

## Required Follow-up

- Reject `need(s)? to`, `has to`, and `have to` action phrasing before unsupported-fact validation.
- Add regression tests with supported fact tokens so unsupported-fact validation cannot mask the issue.
- Refresh validation evidence and re-audit ACC-003.

## Residual Risk

The output validator remains heuristic; ambiguous action-like phrasing should continue to fail closed. Real provider locality/side effects remain future-adapter scope.

## Related Records

- `ticket:20260527-local-diagnosis-model-contract-harness` - consuming ticket.
- `audit:20260527-local-diagnosis-model-contract-harness-second-followup-review` - prior review.
- `evidence:20260527-local-diagnosis-model-contract-harness-validation` - validation evidence to refresh after fix.
