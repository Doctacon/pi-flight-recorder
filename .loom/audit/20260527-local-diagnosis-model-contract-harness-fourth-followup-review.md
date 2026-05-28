# Local Diagnosis Model Contract Harness Fourth Follow-up Review

ID: audit:20260527-local-diagnosis-model-contract-harness-fourth-followup-review
Type: Audit
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Audited: 2026-05-27
Target: ticket:20260527-local-diagnosis-model-contract-harness

## Summary

A Ralph reviewer audited the fourth follow-up fix for `need(s) to`, `has to`, and `have to` action phrasing. The exact object-taking examples are now rejected, but the review found one remaining blocker: objectless obligation/action phrases such as `We have to update.` still bypass display-only validation.

## Target

- Fourth follow-up implementation for `audit:20260527-local-diagnosis-model-contract-harness-third-followup-review`.
- `ticket:20260527-local-diagnosis-model-contract-harness` ACC-003.
- Source changes in `src/flight-learn-local-diagnosis-model.ts` and `src/flight-learn-local-diagnosis-model.test.ts`.

## Audit Scope And Lenses

Lenses: follow-through, output-validation safety, acceptance, evidence sufficiency.

In scope:

- Whether `need(s) to`, `has to`, and `have to` action phrasing is rejected.
- Whether obvious objectless variants still undermine ACC-003.

Out of scope:

- Real runtime/provider locality.
- UI integration and adapter behavior.

## Context And Evidence Reviewed

- Ralph review run: reviewer inspected the ticket, prior third-follow-up audit, validation record, validation artifacts, implementation source, tests, REQ-026/REQ-027/SCN-009, prior audit chain, and targeted local probes.
- The reviewer reran focused validation and typecheck successfully.

## Findings

### FIND-001: Objectless obligation/action phrasing still bypasses display-only validation

Severity: blocker.

The exact prior examples with explicit objects are rejected, but the display-only validation regex still misses action phrases where the action verb is sentence-terminal or objectless. The reviewer reproduced accepted unsafe output in a supported-token context:

- `We have to update.` -> accepted.
- `The assistant has to update.` -> accepted.
- `The assistant needs to update.` -> accepted.

This keeps ACC-003 untrusted and still conflicts with REQ-027 / SCN-009 because model output can become action advice instead of display-only diagnosis wording.

## Verdict

`changes-needed` - ACC-003 remains blocked by objectless obligation/action phrasing. Another narrow fix and regression pass is required.

## Required Follow-up

- Extend display-only validation to reject `need(s) to` / `has to` / `have to` action phrases even when the action verb is sentence-terminal or has no explicit object.
- Add supported-token regression tests for those objectless forms.
- Refresh validation evidence and re-audit ACC-003 before proceeding.

## Residual Risk

The validator remains heuristic; ambiguous action-like phrasing should continue to fail closed. Provider locality/side effects remain future-adapter scope.

## Related Records

- `ticket:20260527-local-diagnosis-model-contract-harness` - consuming ticket.
- `audit:20260527-local-diagnosis-model-contract-harness-third-followup-review` - prior review.
- `evidence:20260527-local-diagnosis-model-contract-harness-validation` - validation evidence to refresh after fix.
