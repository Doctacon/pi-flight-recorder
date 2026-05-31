# Bonsai 4B Narrative Validation

ID: ticket:20260528-bonsai-4b-narrative-validation
Type: Ticket
Status: closed
Created: 2026-05-28
Updated: 2026-05-28
Risk: high - real local-model evidence can easily overclaim UI quality, latency, safety, or release posture from a small corpus.
Priority: medium - final validation unit for the Bonsai 4B narrative plan.
Depends On: ticket:20260528-flight-learn-narrative-inbox-integration

## Summary

Validate real Bonsai 4B Q1_0 GGUF for the narrative `What happened?` contract. The single closure claim is: the project has local evidence showing whether Bonsai 4B narrative output is useful, safe, and fast enough for opt-in `/flight-learn` experimentation, with visual evidence for the focused-card UX and a conservative recommendation.

This is a validation/evidence ticket only. It must not change source behavior or download new models.

## Related Records

- `plan:20260528-flight-learn-4b-narrative-what-happened` - parent plan.
- `ticket:20260528-flight-learn-narrative-inbox-integration` - prerequisite product integration.
- `ticket:20260527-prism-ml-small-model-comparison` - prior 4B evidence under old rubric.
- `evidence:20260527-prism-ml-small-model-comparison` - 4B download/provenance and baseline performance.
- `spec:flight-learn-inbox-ux` REQ-030 through REQ-032 and SCN-010 - behavior being validated.
- `.loom/evidence/artifacts/20260527-prism-ml-small-model-comparison/07-model-4b-provenance.txt` - existing Bonsai 4B checksum and local path.
- `src/flight-learn-llama-cpp-adapter.ts` - loopback adapter boundary.

## Scope

In scope:

- Start the existing local Bonsai 4B Q1_0 GGUF through Homebrew `llama.cpp` on a loopback-only port.
- Run the narrative corpus/harness under the implemented narrative contract.
- Capture runtime/model provenance, health, server command, stop status, latency, memory/RSS, acceptance/fallback/safety outcomes, and sanitized qualitative examples.
- Capture at least one redacted focused-card render or disposable real Pi TUI capture showing the narrative `What happened?` in context.
- Run validation commands needed for confidence after integration.
- Record evidence and audit before closure.

Out of scope:

- Downloading 8B, Ternary, MLX, or any other model.
- Installing/building runtimes or custom forks.
- Hosted inference, non-loopback endpoints, telemetry, provider keys, or external model APIs.
- Changing source, defaults, validators, prompt, UI, route/storage behavior, artifacts, rules, docs, Loom records, skills, or prompts.
- Claiming release readiness or broad quality from this synthetic/redacted validation.

Stop conditions:

- Stop if the 4B model file is missing or checksum differs from prior recorded provenance; ask before redownloading.
- Stop if `llama-server` cannot start locally without installing/building new tooling.
- Stop if evidence would require raw private sessions, unredacted paths, secrets, or full transcripts.
- Stop if model output creates unsafe accepted narratives; route to safety hardening rather than hiding the failure.

## Acceptance

- ACC-001: Real 4B local runtime evidence is captured.
  - Evidence: loopback server command, health, runtime/model checksum, stop status, no hosted/provider-key use.
  - Audit: challenge whether this is fake-provider proof or real 4B proof.

- ACC-002: Narrative corpus results are structured and comparable.
  - Evidence: all narrative corpus cases have accepted/fallback/safety/rubric/reviewer-note/latency fields.
  - Audit: challenge skipped cases or overclaiming from small corpus.

- ACC-003: Visual UX claim is supported.
  - Evidence: render artifact or real Pi TUI capture shows concise `Problem` and longer narrative `What happened?` without route/evidence crowding.
  - Audit: challenge whether the operator's screenshot complaint is actually addressed.

- ACC-004: Safety/privacy remain intact.
  - Evidence: privacy scan over artifacts, zero unsafe accepted outputs or explicit documented blockers, and no route/storage/artifact/source side effects.
  - Audit: challenge redaction, raw path, route/action, mutation, and persistence boundaries.

- ACC-005: Recommendation is explicit and conservative.
  - Evidence: ticket/evidence says whether to keep 4B narrative opt-in experimental, reject it, tune further, or request another model; no release-readiness claim.
  - Audit: challenge whether recommendation follows from data.

## Current State

Closed as a bounded negative validation result. Real local Bonsai 4B Q1_0 validation is recorded at `evidence:20260528-bonsai-4b-narrative-validation`. The operator-authorized shape used only the already-downloaded Bonsai 4B GGUF, a loopback-only `llama-server`, and the explicit local judge adapter pointed at the same Bonsai 4B endpoint. Results: 0 accepted narratives / 15 corpus cases; fallback reasons were malformed JSON (12), schema-invalid (2), and timeout (1). Initial audit `audit:20260528-bonsai-4b-narrative-validation-review` found a privacy artifact blocker from a raw repo path in post-validation test output; artifacts were redacted and privacy scan now passes with zero findings. Follow-up audit `audit:20260528-bonsai-4b-narrative-validation-followup-review` returned `clear` for closure as negative validation. Server stopped and post-validation focused tests/typecheck/diff-check passed. Recommendation is negative/conservative: do not use Bonsai 4B Q1_0 for accepted `/flight-learn` narrative wording under the current contract; consider separate prompt/schema tuning, grammar-constrained JSON investigation, or alternate local model/judge evaluation only with explicit follow-up scope. This does not prove broad Bonsai inferiority, independent judge quality, latency generalization, or release readiness.

## Journal

- 2026-05-28: Created as final child ticket of `plan:20260528-flight-learn-4b-narrative-what-happened`. No validation started.
- 2026-05-28: After focused-card narrative integration closed, marked blocked on explicit operator authorization and validation-shape decision. The hybrid contract needs real local judge handling before accepted real Bonsai narrative quality can be tested honestly.
- 2026-05-28: Operator authorized local judge adapter path, existing Bonsai 4B only, and loopback-only `llama.cpp` servers. `ticket:20260528-local-narrative-llama-cpp-judge-adapter` closed with clear follow-up audit. Set active for real 4B validation.
- 2026-05-28/29 UTC: Ran real Bonsai 4B Q1_0 through the 15-case synthetic/redacted narrative corpus using loopback `llama-server` and the explicit local judge adapter. Recorded `evidence:20260528-bonsai-4b-narrative-validation`. Results were 0 accepted narratives, 15 fallbacks, privacy scan pass, server stopped, post-validation focused tests/typecheck/diff-check pass. Moved to review for audit with negative recommendation.
- 2026-05-28/29 UTC: Initial audit `audit:20260528-bonsai-4b-narrative-validation-review` found a privacy blocker: a raw repo path remained in `post-validation-focused-tests.txt` and the privacy scan missed it because it was run too early. Redacted Bonsai validation artifacts, re-ran privacy scan (`pass: true`, zero findings), and kept `ACC-003` explicitly negative because no accepted narrative render exists. Follow-up audit is next.
- 2026-05-28/29 UTC: Follow-up audit `audit:20260528-bonsai-4b-narrative-validation-followup-review` returned `clear` for bounded negative validation closure. Closed ticket with recommendation not to use Bonsai 4B Q1_0 for accepted narrative wording under the current contract.
