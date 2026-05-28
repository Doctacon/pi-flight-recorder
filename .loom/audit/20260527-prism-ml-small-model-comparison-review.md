# Prism-ML Small Model Comparison Review

ID: audit:20260527-prism-ml-small-model-comparison-review
Type: Audit
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Audited: 2026-05-27
Target: ticket:20260527-prism-ml-small-model-comparison

## Summary

A Ralph reviewer audited the Prism-ML 1.7B + 4B GGUF comparison ticket, evidence, artifacts, source constraints, download scope, locality/privacy posture, and recommendation. Verdict is `concerns`: the ticket can proceed toward closure after preserving/dispositioning the caveats below.

## Target

Target: `ticket:20260527-prism-ml-small-model-comparison`

The review challenged whether downloads stayed within operator authorization, whether both models used the same tuned prompt/corpus/settings, whether 4B proof was real local model evidence, whether locality/privacy evidence was sufficient, whether model-quality claims were overclaimed, whether latency/memory/default-timeout conclusions were honest, whether this ticket changed source/default/runtime behavior, and whether the recommendation follows from measured data.

## Audit Scope And Lenses

Lenses:

- claim and evidence
- download/runtime scope
- acceptance
- locality/privacy
- performance and memory
- recommendation/overclaiming risk
- follow-through

## Context And Evidence Reviewed

The reviewer inspected:

- `.loom/tickets/20260527-prism-ml-small-model-comparison.md`
- `.loom/evidence/20260527-prism-ml-small-model-comparison.md`
- artifacts under `.loom/evidence/artifacts/20260527-prism-ml-small-model-comparison/`
- prerequisite tuning ticket/evidence/audit
- `spec:flight-learn-inbox-ux` REQ-024 through REQ-029
- `src/flight-learn-local-diagnosis-model.ts`
- `src/flight-learn-llama-cpp-adapter.ts`
- current local cache state and git status

## Findings

### FIND-001 — 4B result artifact had a misleading hardcoded note

The initial `bonsai-4b-eval-results.json` inherited a note that said, “This is real Bonsai 1.7B Q1_0 through loopback llama.cpp,” even though the 4B summary/server artifacts proved the run used 4B.

Disposition: resolved by updating `run-prism-ml-model-eval.mjs` to interpolate the `modelLabel` and correcting the saved 1.7B/4B results notes. The 4B results artifact now says `This is real PrismML Bonsai 4B GGUF Q1_0 through loopback llama.cpp, not fake-provider proof.`

### FIND-002 — No-source/default/runtime lifecycle change is not VCS-proven

The runner records `productBehaviorChanged: false`, and `git diff --check` proves whitespace cleanliness, but the wider workspace contains prior modified/untracked source from local-model work. This ticket's no-source-change claim is therefore best read as: no source changes were required or observed for this comparison run; it is not proven by a clean VCS diff.

Disposition: accepted as a closure caveat and recorded in the evidence/ticket. This does not block closing the comparison ticket because the ticket's work was model download/runtime evidence, not source modification.

## Correctness Notes

- ACC-001 mostly supported: authorization and target are explicit; 4B provenance records size and checksum; audit local cache inspection found only the expected 1.7B and 4B GGUF files.
- ACC-002 supported: both summaries use the same corpus, 12 cases, 5000 ms timeout, 128 max output tokens, 750 ms product default timeout, and `llama-server -c 2048 --no-webui --jinja` settings.
- ACC-003 locality/privacy mostly supported: adapter enforces loopback, server artifacts are loopback and healthy, privacy scan found zero matches, and no provider-key headers are sent.
- ACC-004 supported: recommendation is conservative; it distinguishes validator fit from general model quality and does not claim release readiness.
- 4B evidence is real local model proof, not fake-provider-only proof.

## Verdict

`concerns`

No blocker remains for closing after the dispositions above.

## Required Follow-up

Before closure:

- preserve the caveat that no-source-change is not VCS-proven due wider dirty/untracked workspace state;
- do not cite the old hardcoded note; use the corrected result note and 4B server/summary artifacts;
- do not claim release readiness or general 4B inferiority.

## Residual Risk

- No OS-level packet capture or shell-history audit; locality/download scope rests on artifacts, source constraints, and cache state.
- Single synthetic/redacted corpus, single run per model, one 16GB MacBook environment.
- Memory conclusions should prefer raw RSS KiB; GiB conversions are approximate.
- 4B quality is not generally disproven; current result only shows poor fit under this strict prompt/validator/corpus.

## Related Records

- `ticket:20260527-prism-ml-small-model-comparison`
- `evidence:20260527-prism-ml-small-model-comparison`
- `ticket:20260527-bonsai-diagnosis-polish-tuning`
- `evidence:20260527-bonsai-diagnosis-polish-tuning`
- `audit:20260527-bonsai-diagnosis-polish-tuning-review`
- `spec:flight-learn-inbox-ux`
