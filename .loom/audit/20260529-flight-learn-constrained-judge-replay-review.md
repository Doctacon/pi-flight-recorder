# Flight Learn Constrained Judge Replay Review

ID: audit:20260529-flight-learn-constrained-judge-replay-review
Type: Audit
Status: recorded
Created: 2026-05-29
Updated: 2026-05-29
Audited: 2026-05-29 UTC
Target: ticket:20260529-flight-learn-constrained-judge-replay

## Summary

Ralph audited the constrained generator plus local judge replay evidence for `ticket:20260529-flight-learn-constrained-judge-replay`. Verdict: changes-needed. The negative gate direction is justified, but closure should not proceed until raw temporary server log cleanup is fixed/evidenced and fallback metric wording distinguishes narrative non-acceptance from product-level deterministic fallback state.

## Target

Audit target: `ticket:20260529-flight-learn-constrained-judge-replay` in review state, especially the evidence dossier and artifacts under:

```text
.loom/evidence/20260529-flight-learn-constrained-judge-replay.md
.loom/evidence/artifacts/20260529-flight-learn-constrained-judge-replay/
```

The closure claim under review was whether the project has comparable local evidence showing whether schema-constrained Bonsai 4B generator output can pass the existing deterministic verifier and local judge within a usable latency envelope, without weakening safety/privacy gates or changing product behavior.

## Audit Scope And Lenses

Scope:

- Challenge `ACC-001` through `ACC-005`.
- Check whether the harness used the implemented constrained adapter path and the expected corpus/model/runtime.
- Check whether metrics separate generator parse/schema, deterministic verifier, judge, accepted narratives, fallback/non-acceptance, safety, timeout, and latency.
- Check safety/privacy claims, including prompt/log persistence, raw path/session/secret/transcript leakage, server lifecycle, and source side effects.
- Check whether the negative gate recommendation is justified without overclaiming from a 15-case synthetic corpus.
- Check whether product non-claims are preserved.

Lenses:

- claim and evidence
- scope and acceptance
- safety/privacy/trust boundary
- performance/latency
- follow-through

Out of scope:

- Rerunning the expensive llama/model replay.
- Operator comprehension validation.
- Product UI integration.
- New model/runtime recommendations.

## Context And Evidence Reviewed

Ralph review run inspected:

- `.loom/tickets/20260529-flight-learn-constrained-judge-replay.md`
- `.loom/evidence/20260529-flight-learn-constrained-judge-replay.md`
- `.loom/plans/20260529-flight-learn-comprehension-path.md`
- `.loom/evidence/20260529-flight-learn-constrained-json-adapter.md`
- `.loom/evidence/20260529-llama-cpp-constrained-json-probe.md`
- `.loom/audit/20260529-llama-cpp-constrained-json-probe-review.md`
- `.loom/evidence/20260529-bonsai-4b-schema-prompt-tuning.md`
- replay harness and artifacts, including `run-constrained-judge-replay.mjs`, `07-replay-summary.json`, `08-replay-results.json`, `09-sanitized-output-samples.json`, `10-qualitative-failure-notes.md`, `privacy-scan.json`, `15-source-side-effect-scan.txt`, `16-focused-tests.txt`, and `17-diff-check.txt`
- `src/flight-learn-local-diagnosis-model.ts`
- `src/flight-learn-llama-cpp-adapter.ts`
- current git status/diff for ticket files

Reviewer-ran cheap checks only:

- JSON count recomputation.
- `git diff --check`.
- Privacy-pattern scan.
- OS temp-log existence check.

The reviewer did not rerun llama-server/model replay.

## Findings

### FIND-001: Raw temporary server logs remained after replay, so ACC-003 was not yet supported

The harness created temporary server log files for `llama-server` stdout/stderr, wrote server output to them, summarized them, but did not unlink them. The artifact `11-server-log-summary.txt` claimed raw server logs were temporary only and not persisted. The reviewer found four matching temp files still present in the OS temp directory, including two stderr logs around 44KB. The reviewer did not inspect their contents.

Why it matters: `ACC-003` requires privacy and boundary evidence. Prompt/server logs can contain prompt echoes, private paths, or other sensitive runtime details. They must not persist after the replay.

Required follow-up: remove the stale temp logs, update the harness to delete temp logs in `finally`, and record cleanup evidence. A full model rerun is not required for the existing metrics.

### FIND-002: “15 fallbacks” is ambiguous versus product-level fallback state

Aggregate artifacts reported `fallbackCount: 15` and ticket/evidence prose repeated “15 fallbacks.” But per-case results show some cases where no narrative was accepted while product-level `usedLocalModel` remained true and `productFallbackReason` was null. The reviewer recomputed: 0 accepted narratives and 15 narrative non-acceptances, but only 10 product-level fallback-reason cases; 5 cases used local model output for some display fields without an accepted `whatHappened` narrative.

Why it matters: the negative gate still holds, but unqualified “15 fallbacks” can mislead future agents into thinking every product display fully fell back to deterministic text. The ticket needs to distinguish narrative acceptance failure from product-level fallback state.

Required follow-up: clarify metric naming in ticket/evidence/summary or add an errata artifact distinguishing narrative non-acceptance from product fallback.

## Correct Observations

The audit found the following parts directionally supported:

- `ACC-001` is largely supported: runtime/model/corpus provenance, loopback command, health, and product adapter path are recorded; the adapter source sends JSON-schema response formats.
- Staged parse/schema/verifier/judge/accepted metrics are present in aggregate and per-case artifacts.
- Server stop/listener evidence exists.
- Source side-effect scan reports no compared source files changed during replay.
- Focused tests and `git diff --check` passed.
- Non-claims are preserved, and the parent plan correctly blocks/reshapes UI integration on zero accepted narratives.

## Verdict

Changes-needed. The negative recommendation is directionally right, but the ticket should not close until `FIND-001` and `FIND-002` are dispositioned and cheap privacy/diff checks are rerun.

## Required Follow-up

1. Clean up persisted temporary server logs and make the replay harness delete temporary logs automatically.
2. Clarify fallback versus narrative-acceptance metrics before closure.
3. Update evidence/ticket wording and artifacts accordingly.
4. Rerun cheap privacy and diff checks.
5. Request a follow-up Ralph audit before closure.

## Residual Risk

Even after follow-up, evidence remains limited to 15 synthetic/redacted cases, one Bonsai 4B Q1_0 model, one llama-server version, and no operator comprehension or real-session usefulness validation.

## Related Records

- `ticket:20260529-flight-learn-constrained-judge-replay`
- `evidence:20260529-flight-learn-constrained-judge-replay`
- `plan:20260529-flight-learn-comprehension-path`
