# Local Diagnosis Model Contract Harness Follow-up Review

ID: audit:20260527-local-diagnosis-model-contract-harness-followup-review
Type: Audit
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Audited: 2026-05-27
Target: ticket:20260527-local-diagnosis-model-contract-harness

## Summary

A Ralph reviewer audited the follow-up fixes for the first contract-harness review. The exact original fixtures were addressed, but the review found two remaining blocker gaps: path redaction still misses path-like variants, and action-output rejection still permits modal action phrasing.

## Target

- Follow-up implementation for `audit:20260527-local-diagnosis-model-contract-harness-review#FIND-001` and `#FIND-002`.
- `ticket:20260527-local-diagnosis-model-contract-harness` acceptance ACC-002 and ACC-003.
- Source changes in `src/flight-learn-local-diagnosis-model.ts` and `src/flight-learn-local-diagnosis-model.test.ts`.
- Evidence record `evidence:20260527-local-diagnosis-model-contract-harness-validation` follow-up artifacts.

## Audit Scope And Lenses

Lenses: follow-through, claim and evidence, privacy, security/trust boundary, output-validation safety, acceptance.

In scope:

- Whether the prior path/timestamp finding was fully resolved.
- Whether the prior unsupported-fact/action-output finding was fully resolved.
- Whether evidence now supports ACC-002 and ACC-003.

Out of scope:

- Real runtime/provider locality.
- UI integration.
- Adapter behavior.

## Context And Evidence Reviewed

- Ralph review run: reviewer inspected the ticket, prior audit, evidence record/artifacts, REQ-026/REQ-027/SCN-009, `src/flight-learn-local-diagnosis-model.ts`, `src/flight-learn-local-diagnosis-model.test.ts`, `src/redact.ts`, and source-inspection artifacts.
- Follow-up evidence: focused tests, typecheck, build, full tests, and source inspection passed.
- Source/tests: targeted inspection of redaction patterns and display-action validation.

## Findings

### FIND-001: Path-like local path handling is still incomplete

Severity: blocker.

The follow-up redaction covers the original `/workspace`, `/opt`, `/mnt`, and `/var/lib` fixtures, but still misses or partially redacts path-like variants. The reviewer reproduced:

- `/workspace/My Project/src/secret.ts` becoming `[local path omitted] Project/src/secret.ts`, leaving path tail detail.
- `file:///workspace/acme/private/project/src/secret.ts` surviving in fact packet and prompt.
- If a `file://` path reaches the fact packet, output validation can accept the same raw path because raw-path output patterns do not catch file URIs.

This keeps ACC-002 and ACC-003 untrusted for all path-like local paths and means the original path finding is only partially resolved.

### FIND-002: Action-output rejection still has a modal-phrasing bypass

Severity: blocker.

Direct `Add a test.` is rejected, but modal/recommendation phrasing such as `You could add a test.` can be accepted in a validation context where `test` is supported by facts. The forbidden-action patterns catch direct imperatives and `should/must/need/will` forms, but not `could` or similar modal phrasing. Token validation then ignores `add` because it is shorter than four characters and treats `test` as supported by the validation synonym group.

This keeps ACC-003 untrusted because display-action phrasing can still bypass validation.

## Verdict

`changes-needed` - The follow-up fixed the exact first-audit examples but not the broader safety properties required by ACC-002 and ACC-003. Another focused fix and regression pass is required before closure.

## Required Follow-up

- Harden path redaction and output rejection for `file://` URIs, paths with spaces, path tails after partial redaction, colon-prefixed path forms, and equivalent path-like local variants.
- Add regression tests covering those variants in both fact-packet/prompt construction and output validation.
- Tighten display-action validation for modal/recommendation phrasing such as `You could add a test.` before unsupported-fact token validation.
- Refresh evidence and run follow-up audit again.

## Residual Risk

- Provider locality remains future-adapter scope.
- Redaction and unsupported-fact detection are heuristic; the contract should continue to prefer false negatives/fallback over allowing unsafe or unsupported model text.

## Related Records

- `audit:20260527-local-diagnosis-model-contract-harness-review` - first review pass.
- `ticket:20260527-local-diagnosis-model-contract-harness` - consuming ticket.
- `evidence:20260527-local-diagnosis-model-contract-harness-validation` - validation evidence needing refresh after another fix.
