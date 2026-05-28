# Local Diagnosis Model Evaluation Corpus And Rubric Review

ID: audit:20260527-local-diagnosis-model-eval-corpus-rubric-review
Type: Audit
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Audited: 2026-05-27
Target: ticket:20260527-local-diagnosis-model-eval-corpus-rubric

## Summary

A Ralph reviewer audited the first corpus/rubric evidence. Verdict was `changes-needed`. ACC-001 through ACC-004 were largely supported, but the review found two issues before closure: a mismatch between rubric safety expectations and current validator reality for redaction placeholders, and an under-specified harness `modelOutcome` contract.

## Findings

### RALPH-LDM-EVAL-001: Redaction-placeholder hard-fail is not aligned with current validator reality

Severity: high.

The corpus/rubric said redaction placeholders in model output are unsafe and case `LDM-EVAL-008` rejected `[REDACTED_CREDENTIAL]` / stack trace detail. The reviewer observed that current validator patterns only catch some redaction forms and a read-only probe returned `ok: true` for `[REDACTED_CREDENTIAL]` and `[stack trace omitted]`.

Impact: the next harness could treat case 008 as privacy fallback evidence while product validation accepts the placeholder echo.

Required follow-up: add an explicit harness-side rubric safety check/adversarial expected-output contract, or create a validator follow-up before relying on the corpus to prove privacy fallback behavior.

### RALPH-LDM-EVAL-002: Harness metric contract leaves modelOutcome semantics to inference

Severity: medium.

The artifact defined metric field names and rating/fallback reasons, but did not enumerate allowed `modelOutcome` values or per-case expected result labels. Many per-case expectations were prose `primary` strings.

Impact: ACC-005 was only partially supported; the harness could consume the shape but would need to invent metric labels and interpret prose.

Required follow-up: add a small enum/contract for `modelOutcome` and per-case allowed/expected outcomes, or state that rubric review remains manual and `modelOutcome` is free-form.

## Acceptance Assessment

- ACC-001 supported.
- ACC-002 supported at inventory level, with the validator caveat above.
- ACC-003 mostly supported; rubric prioritizes evidence accuracy, privacy, fallback, and display-only boundaries.
- ACC-004 supported at saved-corpus scan level.
- ACC-005 partially supported pending outcome contract tightening.

## Verdict

`changes-needed`

## Required Follow-up

- Resolve `RALPH-LDM-EVAL-001` before using case 008 as evidence of privacy fallback correctness.
- Tighten the harness input contract for `modelOutcome` / per-case expected outcomes before closing ACC-005.

## Residual Risk

The corpus is intentionally synthetic/redacted and diagnosis-polish-specific. It is not too close to only the prior Bonsai fixture, but real-world representativeness remains limited and should not support broad Bonsai quality or release claims.

## Reviewed Context

Ticket, parent plan, evidence dossier, corpus JSON, summary, privacy scan, generator, diff check, diagnosis tests, local-model tests, and local diagnosis model contract. No files edited by the reviewer.
