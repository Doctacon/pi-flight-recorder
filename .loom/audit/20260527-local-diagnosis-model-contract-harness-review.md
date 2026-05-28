# Local Diagnosis Model Contract Harness Review

ID: audit:20260527-local-diagnosis-model-contract-harness-review
Type: Audit
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Audited: 2026-05-27
Target: ticket:20260527-local-diagnosis-model-contract-harness

## Summary

A Ralph reviewer audited the model-agnostic local diagnosis polish contract/harness implementation, tests, and evidence. The review found the default/fallback shape, no-side-effect boundary, and validation commands mostly supported, but identified blocker findings in prompt-input redaction and model-output validation.

## Target

- `ticket:20260527-local-diagnosis-model-contract-harness` acceptance ACC-001 through ACC-005.
- Source changes in `src/flight-learn-local-diagnosis-model.ts` and `src/flight-learn-local-diagnosis-model.test.ts`.
- Evidence record `evidence:20260527-local-diagnosis-model-contract-harness-validation` and artifacts.

## Audit Scope And Lenses

Lenses: claim and evidence, acceptance, security/trust boundary, privacy, output-validation safety, side effects, dependency/tooling, and follow-through.

In scope:

- Fact-packet and prompt boundedness/redaction.
- Deterministic fallback and provider failure behavior.
- Structured response validation and unsafe/unsupported output rejection.
- Display-only/no-side-effect semantics.
- Whether the recorded evidence supports the exact ticket acceptance claims.

Out of scope:

- Real Bonsai, `llama.cpp`, Ollama, MLX, or other runtime behavior.
- Future loopback adapter/provider locality.
- UI integration.

## Context And Evidence Reviewed

- Ralph review run: reviewer inspected the ticket, validation evidence/artifacts, runtime research, relevant specs, source/tests, redaction utilities, types, package surface, git diff/status, and source-inspection artifact.
- `src/flight-learn-local-diagnosis-model.ts` - contract implementation.
- `src/flight-learn-local-diagnosis-model.test.ts` - focused fake-provider and validation tests.
- `src/redact.ts` - path/secret redaction utilities used by the fact-packet builder.
- `evidence:20260527-local-diagnosis-model-contract-harness-validation` - focused/full tests, typecheck, build, and source inspection.
- `spec:flight-learn-inbox-ux` REQ-024 through REQ-029 / SCN-008 and SCN-009 - safety/UX requirements.

## Findings

### FIND-001: Non-home absolute paths and raw timestamp metadata can enter the model prompt

Severity: blocker.

The fact-packet builder sanitizes text through existing redaction utilities, but those utilities primarily cover `/Users/...`, `/home/...`, Pi session paths under those roots, temp paths, and some Windows path output validation. They do not redact arbitrary local absolute paths such as `/workspace/acme/private/project`, `/opt/...`, or `/mnt/...`. The reviewer reproduced a packet/prompt where `/workspace/acme/private/project/src/secret.ts` survived. `evidenceFact()` also passes evidence timestamps through unsanitized/unbounded.

This challenges ACC-002 and REQ-026 because the ticket and spec require excluding unredacted local paths from model input. Current tests only covered `/Users/alice` paths, so the evidence overstates path-redaction coverage.

### FIND-002: Output validation is overpermissive for generic hallucinations and action phrasing

Severity: blocker.

Unsupported-fact validation uses content tokens plus a broad common allowlist. The allowlist includes generic factual/action words such as `file`, `changed`, `wrong`, `test`, `code`, and `failed`, and short action words such as `add` are ignored because token extraction only considers words with at least four characters. The display-only forbidden patterns do not catch short action phrasing such as `Add a test.`

The reviewer reproduced `validateLocalDiagnosisPolishResponse(JSON.stringify({ headline: "The wrong file changed." }), ...)` returning success against a fact packet that did not support that fact, and noted `Add a test.` is similarly not blocked. This challenges ACC-003 and REQ-027 / SCN-009 because hallucinated or action-like model output must fall back to deterministic text.

## Verdict

`changes-needed` - ACC-001, ACC-004, and ACC-005 are mostly supported within the reviewed scope, but ACC-002 and ACC-003 are not yet safe enough to close. The implementation needs stricter prompt-input path/timestamp handling and stricter output validation before the ticket can honestly claim the contract is safe.

## Required Follow-up

- Harden fact-packet redaction so all path-like absolute local paths are omitted or redacted, not only `/Users` and `/home` paths.
- Sanitize/bound every string field in the fact packet, including evidence timestamps, or omit timestamps from model input.
- Add regression tests for non-home absolute paths, malformed/raw timestamp metadata, and raw prompt/transcript-like snippets if they may appear in evidence.
- Tighten output validation to reject generic unsupported factual claims and display-action phrasing such as `Add a test.` and `The wrong file changed.`
- Update evidence after the fixes; current ACC-002 and ACC-003 claims are not fully supported.

## Residual Risk

- Provider locality remains a future-adapter responsibility. The contract has no URL/API-key surface and no network calls, but an injected provider can do arbitrary work until the adapter constrains it.
- Secret detection remains heuristic; the safer posture is conservative omission/rejection rather than assuming all secret formats can be recognized.

## Related Records

- `ticket:20260527-local-diagnosis-model-contract-harness` - consuming ticket for finding disposition.
- `evidence:20260527-local-diagnosis-model-contract-harness-validation` - current validation evidence, now challenged for ACC-002 and ACC-003 scope.
- `spec:flight-learn-inbox-ux` - owns local-model input/output requirements.
