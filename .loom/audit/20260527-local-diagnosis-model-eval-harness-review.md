# Local Diagnosis Model Evaluation Harness Review

ID: audit:20260527-local-diagnosis-model-eval-harness-review
Type: Audit
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Audited: 2026-05-27
Target: ticket:20260527-local-diagnosis-model-eval-harness

## Summary

A Ralph reviewer audited the first harness evidence. Verdict was `changes-needed`. Most acceptance was supported, but the review found that the harness did not fully consume the corpus metric-field contract because emitted results omitted the required `reviewerNotes` field and the harness did not validate emitted metric fields against `caseContract.metricFieldsExpectedFromHarness`.

## Findings

### RALPH-LDM-HARNESS-001: Harness does not consume the full corpus metric-field contract

Severity: medium.

The corpus contract requires `metricFieldsExpectedFromHarness`, including `reviewerNotes`. The harness contract validation checked required case fields and outcome-contract enum references, but `runScenario` emitted no `reviewerNotes` field. All 12 `perCaseResults` and all 8 `exerciseResults` lacked `reviewerNotes`.

Impact: ACC-001/ACC-004 were not fully supported; the harness was close but did not fully satisfy the corpus contract or the ticket's rubric-compatible placeholder requirement.

Required follow-up:

- Add `reviewerNotes` (null placeholder is fine) to per-case and exercise results.
- Extend harness validation to consume `caseContract.metricFieldsExpectedFromHarness` and fail if emitted results omit required metric fields.
- Re-run the harness and refresh summary/evidence before closure.

## Correctness Notes

- ACC-002 supported: deterministic baseline recorded for all 12 cases with `deterministicMismatchCount: 0`.
- ACC-003 mostly supported: fake-provider exercises cover valid, malformed JSON, schema-invalid, unsafe redaction-placeholder, unsafe route/action, unsupported facts, timeout, and provider-error paths.
- Every corpus case is run.
- Privacy posture is supported at targeted-scan level.
- Fake-provider proof is not mislabeled as Bonsai.
- Typecheck, full tests, and diff-check artifacts are present.

## Verdict

`changes-needed`

## Required Follow-up

Resolve `RALPH-LDM-HARNESS-001` and run follow-up review.

## Residual Risk

- The original summary's hard-fail count was per-case-only despite an exercise recording `accepted-unsafe`; naming should clarify per-case vs exercise/all-results hard fails.
- Current workspace has unrelated source modifications from prior local-model work; closure should preserve this attribution boundary.

## Reviewed Context

Ticket, parent plan, corpus/evidence/audit records, harness script/results/baseline/fake-provider/privacy/typecheck/full-test/diff-check artifacts, corpus JSON contract, and relevant source/package files.
