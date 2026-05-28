# Local Diagnosis Model Contract Harness Fifth Follow-up Review

ID: audit:20260527-local-diagnosis-model-contract-harness-fifth-followup-review
Type: Audit
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Audited: 2026-05-27
Target: ticket:20260527-local-diagnosis-model-contract-harness

## Summary

A Ralph reviewer audited the fifth follow-up fix for objectless obligation/action phrasing. The objectless forms are fixed, but the review found another obvious action-advice bypass for modal/obligation phrases whose verb is outside the hard-coded action list, such as `rerun`, `review`, and `reinstall`.

## Target

- Fifth follow-up implementation for `audit:20260527-local-diagnosis-model-contract-harness-fourth-followup-review`.
- `ticket:20260527-local-diagnosis-model-contract-harness` ACC-003.
- Source changes in `src/flight-learn-local-diagnosis-model.ts` and tests.

## Audit Scope And Lenses

Lenses: follow-through, output-validation safety, acceptance, evidence sufficiency.

In scope:

- Whether objectless modal/obligation action phrasing was fixed.
- Whether obvious adjacent action-advice phrases still undermine ACC-003.

Out of scope:

- Real runtime/provider locality.
- UI integration and adapter behavior.

## Context And Evidence Reviewed

- Ralph review run: reviewer inspected the ticket, fourth follow-up audit, validation record, fifth follow-up artifacts, `src/flight-learn-local-diagnosis-model.ts`, tests, and REQ-026/REQ-027/SCN-009.
- The reviewer reran focused tests and typecheck; both passed.
- The reviewer ran targeted probes with action/domain verbs present in the fact packet.

## Findings

### FIND-001: Modal/obligation action advice bypasses validation when the verb is outside the hard-coded action list

Severity: blocker.

The current unsafe-output pattern only catches modal/obligation phrasing before a narrow verb list. The reviewer reproduced accepted action-advice output in supported fact contexts:

- `We have to rerun validation.` -> accepted.
- `We should rerun validation.` -> accepted.
- `The assistant should review the result.` -> accepted.
- `You should reinstall the package.` -> accepted.

These are direct recommendations, not display-only diagnosis wording. This keeps ACC-003 untrusted under REQ-027 / SCN-009.

## Verdict

`changes-needed` - The objectless forms from the prior audit are fixed, but ACC-003 remains blocked by obvious modal/obligation recommendation forms outside the narrow hard-coded verb list.

## Required Follow-up

- Extend display-only validation to reject modal/obligation action advice for obvious domain verbs such as `run`, `rerun`, `retry`, `review`, `inspect`, `verify`, `install`, and `reinstall`, or adopt a safer fail-closed structure for actor+modal+verb phrases.
- Add supported-token regression tests proving the audited examples fall back with `unsafe-output`.
- Refresh validation evidence and re-audit ACC-003.

## Residual Risk

The validator remains heuristic and cannot prove every possible action-like paraphrase is rejected. Residual heuristic risk may be acceptable only after obvious modal/obligation recommendation forms are covered. Real runtime/provider locality remains future-adapter scope.

## Related Records

- `ticket:20260527-local-diagnosis-model-contract-harness` - consuming ticket.
- `audit:20260527-local-diagnosis-model-contract-harness-fourth-followup-review` - prior review.
- `evidence:20260527-local-diagnosis-model-contract-harness-validation` - validation evidence to refresh after fix.
