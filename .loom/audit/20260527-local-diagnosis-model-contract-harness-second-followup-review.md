# Local Diagnosis Model Contract Harness Second Follow-up Review

ID: audit:20260527-local-diagnosis-model-contract-harness-second-followup-review
Type: Audit
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Audited: 2026-05-27
Target: ticket:20260527-local-diagnosis-model-contract-harness

## Summary

A Ralph reviewer audited the second follow-up fixes. The path-handling blockers appear resolved for the reviewed variants, but the audit found one remaining blocker: `can` modal action phrasing still bypasses display-only validation.

## Target

- Second follow-up implementation for `audit:20260527-local-diagnosis-model-contract-harness-followup-review`.
- `ticket:20260527-local-diagnosis-model-contract-harness` ACC-003.
- Source changes in `src/flight-learn-local-diagnosis-model.ts` and `src/flight-learn-local-diagnosis-model.test.ts`.

## Audit Scope And Lenses

Lenses: follow-through, output-validation safety, acceptance, evidence sufficiency, side-effect boundary.

In scope:

- File URI, spaced path, path-tail, and colon-prefixed local path handling.
- Modal action/recommendation phrasing validation.
- Evidence and command support for second follow-up claims.

Out of scope:

- Real runtime/provider locality.
- UI integration and adapter behavior.

## Context And Evidence Reviewed

- Ralph review run: reviewer inspected the ticket, prior audits, validation evidence/artifacts, REQ-026/REQ-027/SCN-009, `src/flight-learn-local-diagnosis-model.ts`, `src/flight-learn-local-diagnosis-model.test.ts`, and `src/redact.ts`.
- The reviewer reran focused tests and `npm run typecheck`; both passed.
- The reviewer challenged modal action phrasing with ad hoc `tsx --eval` probes.

## Findings

### FIND-001: `can` modal action phrasing still bypasses display-only validation

Severity: blocker.

The second follow-up rejects the tested modal forms `could`, `might`, `may`, `would`, and `should`, but omits `can`. The reviewer reproduced action phrasing being accepted in supported fact contexts:

- `You can add a test.` -> accepted.
- `We can add a test.` -> accepted.
- `The assistant can add a test.` -> accepted.
- `You can update a file.` -> accepted.

This challenges ACC-003 and REQ-027 because optional model output must be display-only and unsafe/action-like output must fall back to deterministic text.

## Verdict

`changes-needed` - Path-handling appears adequate for the reviewed follow-up variants, and ACC-001/ACC-002/ACC-004/ACC-005 are mostly supported. ACC-003 remains blocked by the `can` modal action-phrasing bypass.

## Required Follow-up

- Reject `can` modal/action phrasing before unsupported-fact validation.
- Add regression tests where supporting facts include `test`, `file`, and `update`, so token validation cannot mask the action-phrasing bypass.
- Refresh focused validation evidence and re-audit ACC-003.

## Residual Risk

- Provider locality and provider side effects remain future-adapter responsibility.
- Redaction and action/fact validation remain heuristic; ambiguous action-like model text should continue to fall back conservatively.

## Related Records

- `ticket:20260527-local-diagnosis-model-contract-harness` - consuming ticket.
- `audit:20260527-local-diagnosis-model-contract-harness-followup-review` - prior follow-up review.
- `evidence:20260527-local-diagnosis-model-contract-harness-validation` - validation evidence to refresh after fix.
