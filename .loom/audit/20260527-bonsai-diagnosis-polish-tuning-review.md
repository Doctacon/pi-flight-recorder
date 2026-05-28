# Bonsai Diagnosis Polish Tuning Review

ID: audit:20260527-bonsai-diagnosis-polish-tuning-review
Type: Audit
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Audited: 2026-05-27
Target: ticket:20260527-bonsai-diagnosis-polish-tuning

## Summary

A Ralph reviewer audited the prompt-only Bonsai diagnosis polish tuning ticket, evidence, artifacts, and source. Verdict is `concerns`: no blocker for closing this as a narrow prompt-tuning ticket, but closure must preserve two caveats and must not turn the result into release-readiness evidence.

## Target

Target: `ticket:20260527-bonsai-diagnosis-polish-tuning`

The review challenged whether the tuning stayed narrow, whether validators remained strict, whether post-change harness and real Bonsai evidence was rerun, whether before/after metrics and timeout conclusions were honest, whether privacy/locality evidence was sufficient, whether recommendation overclaims, and whether the untracked-source caveat hides missing diff context.

## Audit Scope And Lenses

Lenses:

- claim and evidence
- scope
- acceptance
- implementation
- safety/trust boundary
- performance/timeout posture
- follow-through

## Context And Evidence Reviewed

The reviewer inspected:

- `.loom/tickets/20260527-bonsai-diagnosis-polish-tuning.md`
- `.loom/evidence/20260527-bonsai-diagnosis-polish-tuning.md`
- `.loom/evidence/artifacts/20260527-bonsai-diagnosis-polish-tuning/`
- prerequisite evidence and audit for Bonsai evaluation and the fake-provider harness
- `spec:flight-learn-inbox-ux` REQ-024 through REQ-029
- `src/flight-learn-local-diagnosis-model.ts`
- `src/flight-learn-local-diagnosis-model.test.ts`
- `src/flight-learn-llama-cpp-adapter.ts`
- current git status

The reviewer also re-ran the focused local-model test successfully.

## Findings

### RBT-AUDIT-001 — Concern: prompt-only claim is not VCS-diff-proven

Evidence discloses that the changed source files are untracked, so `git diff` cannot prove only prompt/test lines changed. Current source inspection supports the claimed narrow behavior, but closure should not phrase this as verified by git diff.

Disposition required by ticket: preserve this as a closure caveat. The ticket may still close because source inspection, tests, and evidence support the narrow prompt-only claim.

### RBT-AUDIT-002 — Concern: strict unsafe-output claim should stay qualified

The fake-provider harness still records one accepted-unsafe redaction-placeholder exercise. Evidence discloses this as a pre-existing rubric-vs-validator residual, and the real corpus has zero hard fails. ACC-002 should be read as: no validator weakening occurred and covered fallback classes still pass, not as proof that every unsafe-looking output is rejected.

Disposition required by ticket: preserve this as residual risk. If strict rejection of redaction placeholders is required before release, route a separate validator-hardening ticket.

## Correctness Notes

- ACC-001 supported: the tuning target is evidence-backed by pre-tuning Bonsai counts and the exact `confidence`/extra-field failure pattern. The implemented prompt changes are narrow.
- ACC-002 mostly supported: the validator still rejects extra fields, malformed JSON, unsafe output, unsupported facts, timeouts, and provider errors; focused tests and harness cover these paths.
- ACC-003 supported: fake-provider harness and real Bonsai corpus were rerun post-change.
- ACC-004 supported: recommendation is conservative and does not claim broad quality or release readiness.
- Locality/default posture remains consistent with the spec: opt-in flag, default timeout unchanged, loopback-only adapter, and loopback runtime evidence.

## Verdict

`concerns`

No blocker found for closing this as a narrow prompt-tuning ticket if the caveats above remain explicit.

## Required Follow-up

Before closure:

- keep the untracked-source caveat in the closure note;
- keep the redaction-placeholder accepted-unsafe residual in the closure note;
- do not use this ticket as release-readiness evidence.

Optional follow-up:

- If strict rejection of redaction placeholders is required before release, open/route a separate validator-hardening ticket.

## Residual Risk

Single synthetic/redacted corpus, one local runtime/hardware pass, no OS-level network isolation, no proof of better wording than deterministic output, and only 1/8 accepted post-tuning outputs within the current 750 ms default timeout.

## Related Records

- `ticket:20260527-bonsai-diagnosis-polish-tuning`
- `evidence:20260527-bonsai-diagnosis-polish-tuning`
- `evidence:20260527-bonsai-diagnosis-model-evaluation`
- `audit:20260527-bonsai-diagnosis-model-evaluation-followup-review`
- `evidence:20260527-local-diagnosis-model-eval-harness`
- `spec:flight-learn-inbox-ux`
