# Real Bonsai Local Model Validation Follow-up Review

ID: audit:20260527-real-bonsai-local-model-validation-followup-review
Type: Audit
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Audited: 2026-05-27
Target: ticket:20260527-real-bonsai-local-model-validation

## Summary

A follow-up Ralph review audited the evidence fixes for the real Bonsai validation ticket. The review found `FIND-001` resolved and most acceptance clear, but returned verdict `concerns` because artifact candidate metadata was still missing from durable evidence.

## Findings

### FIND-002 remains partially unresolved: metadata evidence omitted

Severity: medium.

`50-real-pi-valid-full-artifact-candidate.json` included `title`, `proposedDraft`, `nextStep`, and `limits` with no forbidden model text matches, but still omitted candidate `metadata` / raw `metadataJson`. Since candidate storage has a `metadataJson` field, ACC-004 could not fully clear on durable evidence yet.

Required follow-up: add or cite durable DB inspection evidence that includes candidate `metadata` / `metadataJson` and checks it for model-polished wording, or explicitly narrow ACC-004 to exclude metadata with rationale.

## Resolved From Prior Review

- FIND-001 resolved: `49-runtime-version-recheck.txt` captures `llama-server` and `llama-cli` version output `version: 9360 (6b4e4bd58)` and Homebrew MIT/package provenance.

## Acceptance Assessment

- ACC-001 clear.
- ACC-002 clear for the claimed loopback scope.
- ACC-003 clear with recorded limits: one supported real Bonsai fixture plus negative fallback proof.
- ACC-004 concerns until metadata evidence is added.
- ACC-005 clear.

## Verdict

`concerns`

## Required Follow-up

Add durable metadata inspection evidence for the artifact candidate, then run follow-up review before closure.

## Residual Risk

- No packet capture or OS-level network isolation; locality rests on loopback config, adapter restrictions, offline Pi flags, logs, and local URLs.
- Real model quality is proven only for one synthetic supported fixture.
- Artifact persistence check uses exact forbidden text matching.

## Reviewed Context

Ticket, first audit, evidence dossier, follow-up artifacts, source files, typecheck/build/full-test/diff artifacts, and relevant package/runtime records.
