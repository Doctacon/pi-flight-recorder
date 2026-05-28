# Real Bonsai Local Model Validation Review

ID: audit:20260527-real-bonsai-local-model-validation-review
Type: Audit
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Audited: 2026-05-27
Target: ticket:20260527-real-bonsai-local-model-validation

## Summary

A Ralph reviewer audited the real Bonsai validation ticket and evidence. The review found the core real-local-model path credible, but returned verdict `concerns` because two evidence subclaims needed tightening before closure.

## Findings

### FIND-001: Evidence overclaims runtime version/commit output

Severity: medium.

The evidence dossier said version output reported `version: 9360 (6b4e4bd58)`, but the cited artifact `03-runtime-provenance.txt` had empty `llama_server_version=` and `llama_cli_version=` fields. ACC-001 remained supported by Homebrew package/version/license info, but the version/commit subclaim was not supported as written.

Required follow-up: correct or recapture the `llama-server --version` / commit claim.

### FIND-002: Artifact-draft persistence proof is incomplete in cited DB artifact

Severity: medium.

ACC-004 asks for stored delta/artifact draft source-of-truth fields to be checked. Artifact `41-real-pi-valid-bonsai-db-after-route.json` included candidate status/rationale/nextStep but omitted `title`, `proposedDraft`, `limitsJson`, and `metadataJson`. Code/tests support the safety claim, and reviewer live read-only inspection found draft safety, but durable evidence was incomplete.

Required follow-up: add or cite durable evidence for full artifact-candidate draft fields.

## Correctness Notes

- ACC-001 mostly supported: Homebrew-installed `llama.cpp 9360` with MIT metadata and Bonsai Apache-2.0/GGUF/llama.cpp provenance were observed.
- ACC-002 supported: server log and final status show local Bonsai GGUF loaded and listening on `127.0.0.1:18117`; adapter code remains strict loopback with direct non-proxy HTTP agent.
- ACC-003 supported with limits: direct adapter probe returned `usedLocalModel: true`; raw local response came from loopback with redacted prompt; real Pi displayed the local-model disclosure; negative no-expectation probe was honestly represented as fallback.
- ACC-004 directionally supported: route flow stored one accepted `test-check` candidate with `applied=false`, zero rule candidates, zero flight rules, and stored delta fields remained raw/deterministic.
- ACC-005 supported: typecheck/build/full tests passed and diff check was clean.

## Verdict

`concerns`

## Required Follow-up

- Recapture version output or narrow the claim.
- Add durable full artifact-candidate draft inspection evidence.
- Rerun or record follow-up audit before closure.

## Residual Risk

- No packet capture or OS-level network isolation was performed; locality rests on loopback config, adapter restrictions, offline Pi flags, server logs, and local URLs.
- Real model quality is proven only for one supported synthetic fixture.
- The accepted Bonsai output was conservative and close to deterministic text; do not claim quality improvement, only validated local-model path viability.

## Reviewed Context

Ticket, evidence dossier, requested artifacts, runtime research, UX spec, source files, relevant tests, and package metadata.
