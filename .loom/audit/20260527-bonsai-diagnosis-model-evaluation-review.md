# Bonsai Diagnosis Model Evaluation Review

ID: audit:20260527-bonsai-diagnosis-model-evaluation-review
Type: Audit
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Audited: 2026-05-27
Target: ticket:20260527-bonsai-diagnosis-model-evaluation

## Summary

A Ralph reviewer audited the initial real Bonsai corpus evaluation evidence. Verdict was `changes-needed`. ACC-001 through ACC-004 and ACC-006 were mostly supported, but ACC-005 latency/default-timeout evidence was not fully honest because the saved latency run appeared to be a warmed repeated server pass.

## Findings

### RALPH-BONSAI-EVAL-001: Latency evidence omits warmed/repeated server run context

Severity: medium.

The server log contained 36 generation timing groups, consistent with three corpus-shaped passes rather than one 12-case pass. The persisted result timings appeared to come after prior full passes against the same server/cache. The evidence report used those timings for default-timeout posture without disclosing the warmed repeated state.

Impact: the default-timeout conclusion could understate cold or first-pass latency, making `acceptedWithinDefaultTimeoutCount` less reliable.

Required follow-up: either disclose that the saved latency metrics are from a warmed/repeated server run and limit timeout conclusions, or rerun a clean first-pass corpus evaluation from a fresh server/cache and replace/supplement latency/default-timeout metrics.

## Correctness Notes

- ACC-001 mostly supported: runtime/model provenance, checksum, loopback command, health, server log, and adapter locality evidence were present.
- ACC-002 supported: all 12 corpus cases were run with structured results.
- ACC-003 supported with caveat: privacy scan clean and results separated validator/fallback/safety/usefulness fields.
- ACC-004 supported: accepted outputs were explicitly equivalent, not better.
- ACC-006 supported: recommendation followed from weak acceptance and a concrete follow-up tuning ticket existed.

## Verdict

`changes-needed`

## Required Follow-up

Resolve `RALPH-BONSAI-EVAL-001` and run follow-up review.

## Residual Risk

- Locality rests on loopback/server/adapter evidence, not packet capture.
- Workspace was dirty with broader source changes from prior local-model work; no-product-change attribution should remain explicit.
- Privacy scan is targeted, not exhaustive.

## Reviewed Context

Ticket, evidence dossier, real Bonsai artifacts, corpus/rubric, prerequisite harness evidence/audit, prior real Bonsai validation evidence, follow-up tuning ticket, and relevant source files.
