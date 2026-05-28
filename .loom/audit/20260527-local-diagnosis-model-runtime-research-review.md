# Local Diagnosis Model Runtime Research Review

ID: audit:20260527-local-diagnosis-model-runtime-research-review
Type: Audit
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Audited: 2026-05-27
Target: ticket:20260527-local-diagnosis-model-runtime-research

## Summary

A Ralph reviewer audited the completed runtime research ticket and research record for acceptance, source quality, local-first/open-source posture, hosted/non-loopback/download risks, overclaiming, and downstream readiness. The audit found the ticket acceptance claims supported, with one follow-through concern about stale downstream/plan wording relative to the completed research.

## Target

- `ticket:20260527-local-diagnosis-model-runtime-research` acceptance claims ACC-001 through ACC-003.
- `research:20260527-local-diagnosis-model-runtime` completed recommendation.
- Consumption risk for downstream local-model contract and adapter tickets.

## Audit Scope And Lenses

Lenses: claim and evidence, acceptance, surface boundary, security/trust boundary, dependency/tooling, follow-through.

In scope:

- Whether the completed research compares viable local runtime options and rejected paths.
- Whether the research recommends a concrete adapter boundary and explicit opt-in configuration shape.
- Whether validation preconditions are clear and avoid overclaiming real Bonsai behavior.
- Whether local-first/open-source and package constraints are respected.

Out of scope:

- Independent re-fetch of every public URL cited by the research.
- Real local Bonsai, `llama.cpp`, MLX, Ollama, or Node-native runtime behavior.
- Implementation quality for future tickets.

## Context And Evidence Reviewed

- Ralph review run: reviewer inspected the ticket, research record, parent plan, relevant specs, constitution, `package.json`, `src/reflection.ts`, and downstream local-model tickets.
- `ticket:20260527-local-diagnosis-model-runtime-research` - acceptance and current review-state claims.
- `research:20260527-local-diagnosis-model-runtime` - source synthesis, findings, adapter recommendation, rejected paths, and validation preconditions.
- `spec:flight-learn-inbox-ux` - REQ-024 through REQ-029 local-model constraints.
- `spec:visible-command-surface` - two-command visible command invariant.
- `spec:delta-artifact-learning-loop` - local-first, human-gated artifact semantics.
- `constitution:main` - local-first/open-source principle.
- `package.json` - current dependency footprint.
- `src/reflection.ts` - existing provider/prompt precedent.

## Findings

### FIND-001: Plan and adapter ticket wording lag the completed research

The reviewer found that the parent plan still describes the runtime research as active and points to the runtime-research ticket as the next move, while the future adapter ticket still leaves room for a local process/CLI path and safe process spawning. The completed research chose a narrower first adapter: external `llama.cpp` server over validated loopback HTTP only, with no CLI/process path, MLX, Ollama, Node-native, generic OpenAI-compatible URL, hosted provider, non-loopback endpoint, automatic download, or runtime lifecycle management in the first adapter.

Impact: this does not block ACC-001 through ACC-003 or the immediate model-agnostic contract harness ticket, but it could mislead the later adapter worker if they consume preliminary plan/ticket wording without the completed research.

## Verdict

`concerns` - The runtime research ticket's acceptance claims are supported within the audited scope, and the immediate contract-harness ticket can consume the research safely. The concern is follow-through: downstream adapter execution should be reconciled to the completed research before launch.

## Required Follow-up

- Before launching `ticket:20260527-local-diagnosis-model-adapter`, reconcile that ticket with the completed research so the first adapter is only `kind: "llama-cpp-server"` over validated loopback HTTP.
- Driver should disposition this finding in the runtime-research ticket. The finding need not block closing the runtime-research ticket if the adapter ticket is updated before execution.

## Residual Risk

- External source claims were reviewed through the research record and cited project files; the reviewer did not independently re-fetch every public URL.
- No real local-model behavior, latency, JSON compliance, or Bonsai quality has been proven.
- A loopback URL check proves only that Flight Recorder calls loopback; it cannot prove the operator's local server is not itself proxying elsewhere. Later adapter work should reject provider headers/API keys/proxies and document operator-managed runtime trust.

## Related Records

- `ticket:20260527-local-diagnosis-model-runtime-research` - consuming ticket for audit disposition.
- `research:20260527-local-diagnosis-model-runtime` - reviewed research recommendation.
- `ticket:20260527-local-diagnosis-model-adapter` - follow-through target before adapter execution.
