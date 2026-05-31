# Flight Learn Constrained Judge Replay

ID: ticket:20260529-flight-learn-constrained-judge-replay
Type: Ticket
Status: closed
Created: 2026-05-29
Updated: 2026-05-29
Risk: medium - this runs a privacy-sensitive local model/judge path and can be overclaimed if generator-format success is confused with accepted narrative usefulness.
Priority: high - this gates whether model-enabled `/flight-learn` comprehension can proceed to UI integration.
Depends On: ticket:20260529-flight-learn-constrained-json-adapter

## Summary

Replay the narrative corpus through the implemented constrained generator plus local judge path. The single closure claim is: the project has comparable local evidence showing whether schema-constrained Bonsai 4B generator output can pass the existing deterministic verifier and local judge within a usable latency envelope, without weakening safety/privacy gates or changing product behavior.

## Related Records

- `plan:20260529-flight-learn-comprehension-path` - parent plan and gate ordering.
- `ticket:20260529-flight-learn-constrained-json-adapter` - prerequisite implementation; replay should exercise this product adapter path rather than an ad hoc prompt-only harness where practical.
- `spec:flight-learn-inbox-ux` REQ-030 through REQ-036 and SCN-010 through SCN-011 - narrative must be distinct, display-only, and comprehension-oriented.
- `evidence:20260529-llama-cpp-constrained-json-probe` - generator-only constrained baseline: 15/15 parse/schema/verifier pass, 0 judge run.
- `audit:20260529-llama-cpp-constrained-json-probe-review` - non-claims that this ticket must preserve.
- `evidence:20260529-bonsai-4b-schema-prompt-tuning` - prior prompt-only baseline: 7/15 verifier pass but 0/15 accepted, mostly judge timeout/unsafe/fallback after format improvement.
- `.loom/evidence/artifacts/20260528-flight-learn-narrative-rubric-corpus/narrative-what-happened-eval-corpus.v1.json` - synthetic/redacted 15-case corpus.
- `src/flight-learn-local-diagnosis-model.ts` - verifier and local judge contracts.
- `evidence:20260529-flight-learn-constrained-judge-replay` - replay evidence and negative gate recommendation.
- `audit:20260529-flight-learn-constrained-judge-replay-review` - initial Ralph audit; changes-needed findings dispositioned.
- `audit:20260529-flight-learn-constrained-judge-replay-followup-review` - follow-up Ralph audit; clear for bounded closure as a negative gate.
- `src/flight-learn-llama-cpp-adapter.ts` - constrained adapter path under test after prerequisite ticket closes.

## Scope

In scope:

- Use only the existing Bonsai 4B Q1_0 GGUF with checksum `4524b3f997f0f06444e568d1f26e2efd69effa3218c7ad3047432fb171e42168`.
- Use only an already-installed local `llama-server`; start it loopback-only and stop it before completion.
- Reuse the existing synthetic/redacted 15-case narrative corpus for comparability.
- Exercise the implemented constrained adapter path where practical, including generator and judge calls.
- Record staged metrics: generator parse-valid, schema-valid, deterministic verifier pass, judge pass, accepted count, fallback count/reasons, unsafe accepted outputs, timeout count, latency summaries, and qualitative failure notes.
- Preserve redacted/synthetic artifacts only; raw private sessions, raw local paths, secrets, stack traces, prompts, and transcripts must not be persisted.
- Produce an evidence dossier and request audit before closure.

Out of scope:

- Source/product changes beyond a replay harness under `.loom/evidence/artifacts/**`.
- New models, new quantizations, hosted/non-loopback providers, runtime installs/upgrades, custom forks, or automatic downloads.
- Weakening verifier, judge veto, hard privacy gates, display-only restrictions, or fail-closed fallback behavior.
- Productizing prompt/schema changes, UI wording, command flags, storage/routing behavior, or accepted narrative claims.
- Treating judge pass as operator comprehension validation; that belongs to a later ticket.

Stop conditions:

- Stop if the model file is missing or checksum differs; do not substitute or redownload.
- Stop if the local runtime is unavailable and would require install/build/upgrade.
- Stop if a harness would need raw private sessions or unredacted artifacts.
- Stop if unsafe content is accepted by the verifier/judge; record a hard safety blocker and do not proceed to UI integration.
- Stop and route back to the parent plan if accepted narratives remain zero or latency is clearly unusable; do not create UI/product claims by weakening gates.

## Acceptance

- ACC-001: Replay is comparable and uses the constrained path.
  - Evidence: artifacts record corpus ID, model checksum, runtime/version, loopback command, constrained adapter configuration, prior generator-only and prompt-only baselines, and server lifecycle.
  - Audit: challenge whether the harness quietly changed corpus/model/runtime or bypassed the implemented adapter.

- ACC-002: Staged metrics separate generator, verifier, judge, and acceptance.
  - Evidence: per-case and aggregate artifacts record parse-valid, schema-valid, verifier pass, judge pass, accepted/fallback, fallback reasons, unsafe accepted outputs, timeout, and latency.
  - Audit: challenge aggregation that hides judge failures or conflates schema success with acceptance.

- ACC-003: Safety and privacy remain intact.
  - Evidence: zero unsafe accepted outputs or a hard-blocking safety finding, privacy scan over artifacts, no raw private paths/sessions/secrets/transcripts/prompts, server stopped, and no product source/default/storage/routing side effects.
  - Audit: challenge redaction, prompt echo, route/action advice, and source-of-truth mutation boundaries.

- ACC-004: Recommendation gates later tickets.
  - Evidence: evidence/ticket closure explicitly recommends one of: proceed to model-enabled inbox integration, investigate judge/latency/schema separately, or stop model-comprehension work for this runtime pending new authorization. The recommendation must name accepted count, fallback shape, and latency limits.
  - Audit: challenge overclaiming from a synthetic/redacted 15-case corpus.

- ACC-005: Product non-claims are preserved.
  - Evidence: closure states that replay does not prove operator comprehension, real-session usefulness, release readiness, classifier readiness, or broad Bonsai suitability.
  - Audit: challenge any wording that treats accepted narratives as product-ready without rendered card/operator validation.

## Current State

Closed as a negative gate. The constrained adapter + local judge replay ran all 15 synthetic/redacted corpus cases against the existing Bonsai 4B Q1_0 GGUF and installed loopback `llama-server` through the product adapter provider flow. Evidence is recorded at `evidence:20260529-flight-learn-constrained-judge-replay` with artifacts under `.loom/evidence/artifacts/20260529-flight-learn-constrained-judge-replay/`. Result: 13/15 parse-valid, 13/15 schema-valid, 8/15 deterministic verifier pass, 3 judge calls, 0 judge pass, 0 accepted narratives, 15/15 narrative non-acceptances, 10/15 product-level fallback-reason cases, 5/15 partial local-model display cases without accepted narrative, and 0 unsafe accepted outputs. Focused adapter/local-model tests and `git diff --check` passed; privacy/temp-log scan passed; server stopped and no 181xx listener was observed. Initial audit `audit:20260529-flight-learn-constrained-judge-replay-review` returned changes-needed; follow-up removed stale temp server logs, updated the harness to delete future temp logs, clarified fallback metrics, reran cheap diff/privacy checks, and updated evidence. Follow-up audit `audit:20260529-flight-learn-constrained-judge-replay-followup-review` returned clear for bounded closure as a negative gate.

Recommendation: stop/replan before model-enabled inbox integration for this runtime rather than weakening gates. Do not unblock `ticket:20260529-flight-learn-model-comprehension-integration` from this evidence. Parent plan coordination is now blocked on a decision to shape a judge/latency/schema successor or stop current Bonsai 4B model-comprehension work pending fresh authorization.

## Journal

- 2026-05-29: Created by Loom Weaver as the second child ticket of `plan:20260529-flight-learn-comprehension-path`. This ticket is the acceptance/latency gate between adapter implementation and UI/comprehension integration.
- 2026-05-29: Driver unblocked after `ticket:20260529-flight-learn-constrained-json-adapter` closed with `evidence:20260529-flight-learn-constrained-json-adapter` and clear follow-up audit `audit:20260529-flight-learn-constrained-json-adapter-followup-review`.
- 2026-05-29: Driver set ticket active and prepared a bounded Ralph worker run. Preflight `git status --short` showed substantial pre-existing dirty/untracked Loom and local-model files; run boundary is replay harness/evidence/ticket/audit only, with no unrelated cleanup.
- 2026-05-29: Ralph worker ran the 15-case synthetic/redacted corpus through `buildFlightLearnDiagnosisViewWithLocalPolish` using constrained llama.cpp generator + judge providers on Bonsai 4B Q1_0. Evidence recorded at `evidence:20260529-flight-learn-constrained-judge-replay`. Aggregate result: 13/15 parse-valid, 13/15 schema-valid, 8/15 verifier pass, 3 judge calls, 0 judge pass, 0 accepted, 15 narrative non-acceptances, 0 unsafe accepted outputs; max total latency 9511ms. Focused tests and diff-check passed. Moved ticket to review for audit with negative recommendation: stop/replan before model-enabled inbox integration for this runtime.
- 2026-05-29: Initial Ralph audit `audit:20260529-flight-learn-constrained-judge-replay-review` returned changes-needed. Driver dispositioned `FIND-001` by deleting 4 stale temporary server log files without reading/persisting contents, updating the replay harness to unlink temp logs in `finally`, and recording cleanup/scan evidence. Driver dispositioned `FIND-002` by adding `22-fallback-metric-errata.json` and clarifying that `fallbackCount` means narrative non-acceptance, while product-level fallback-reason cases are 10/15 and partial local-model display cases without accepted narrative are 5/15. Follow-up audit remained required before closure.
- 2026-05-29: Follow-up Ralph audit `audit:20260529-flight-learn-constrained-judge-replay-followup-review` returned clear for bounded closure as a negative gate. Closed ticket with recommendation to stop/replan before model-enabled inbox integration for the current Bonsai 4B runtime; do not weaken verifier/judge/privacy gates and do not unblock integration from this evidence.
