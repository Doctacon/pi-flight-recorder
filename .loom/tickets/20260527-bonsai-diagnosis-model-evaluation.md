# Bonsai Diagnosis Model Evaluation

ID: ticket:20260527-bonsai-diagnosis-model-evaluation
Type: Ticket
Status: closed
Created: 2026-05-27
Updated: 2026-05-27
Risk: high - this is the first multi-case real-model quality claim for a privacy-sensitive UI path and can easily overclaim from narrow evidence.
Priority: high - this produces the release/tuning decision for optional local-model polish.
Depends On: ticket:20260527-local-diagnosis-model-eval-harness

## Summary

Evaluate PrismML Bonsai 1.7B Q1_0 through the repeatable diagnosis-polish harness using explicit loopback `llama.cpp`. The single closure claim is: Bonsai 1.7B's safety, usefulness, latency, fallback behavior, and comparison to deterministic diagnosis are measured across the evaluation corpus, and the project has an evidence-backed recommendation for what to claim or do next.

This ticket is evaluation and decision only. It must not quietly become prompt tuning, product behavior changes, default changes, or larger-model exploration.

## Related Records

- `plan:20260527-flight-learn-local-model-quality-evaluation` - parent plan and strategy.
- `ticket:20260527-local-diagnosis-model-eval-harness` - hard prerequisite; supplies corpus runner, deterministic baseline, and result schema.
- `ticket:20260527-real-bonsai-local-model-validation` - prior one-fixture real Bonsai proof and safety validation.
- `evidence:20260527-real-bonsai-local-model-validation` - model/runtime provenance, prior latency observations, TUI disclosure proof, and route safety.
- `research:20260527-local-diagnosis-model-runtime` - explains why Bonsai 1.7B GGUF through `llama.cpp` is the first target and why 4B/8B require separate authorization.
- `spec:flight-learn-inbox-ux` - REQ-024 through REQ-029 define opt-in, local-only, bounded, validated, display-only behavior.
- `src/flight-learn-local-diagnosis-model.ts` and `src/flight-learn-llama-cpp-adapter.ts` - source reality for model contract and loopback adapter.
- `evidence:20260527-bonsai-diagnosis-model-evaluation` - real Bonsai 1.7B corpus evaluation evidence.
- `audit:20260527-bonsai-diagnosis-model-evaluation-review` - first audit; verdict `changes-needed`.
- `audit:20260527-bonsai-diagnosis-model-evaluation-followup-review` - final follow-up audit; verdict `clear`.
- `ticket:20260527-bonsai-diagnosis-polish-tuning` - follow-up tuning ticket recommended by evaluation.

## Scope

In scope:

- Use an explicitly operator-approved local Bonsai 1.7B Q1_0 GGUF and `llama.cpp` server, preferably the already downloaded local cache from `ticket:20260527-real-bonsai-local-model-validation` if still present.
- Start `llama-server` bound to `127.0.0.1` on a disposable port and run the harness against the evaluation corpus.
- Record runtime/model freshness, command, loopback URL, request path, lack of provider keys/headers, and local-only setup evidence.
- Capture structured metrics: accepted model outputs, deterministic fallbacks, schema invalid outputs, unsafe/unsupported outputs, fallback reasons, validation issues, elapsed time distribution, and redaction/safety checks.
- Apply the corpus rubric to compare Bonsai output against deterministic baseline: better, equivalent, worse, invalid/fallback, or unsafe.
- Record a narrow recommendation: keep opt-in experimental as-is, recommend a concrete prompt/validator/timeout/doc follow-up ticket, ask for authorization to evaluate Bonsai 4B/8B, or do not recommend Bonsai 1.7B beyond fallback-safe experimentation.

Out of scope:

- Downloading Bonsai 4B/8B, trying other model families, or installing new runtimes without explicit operator authorization.
- Calling hosted inference APIs, non-loopback endpoints, telemetry, provider-key paths, `llama.cpp -hf`, `ollama pull`, or any app-managed model download/install path.
- Editing product prompt, validators, timeout defaults, UI disclosure, storage, routing, docs, package files, or source behavior as part of this evaluation ticket.
- Claiming broad operator satisfaction, production quality, all model sizes, all hardware, or long-run latency from this corpus.
- Persisting raw private session content or unredacted sensitive examples in Loom or fixtures.

Likely write scope:

- `.loom/evidence/20260527-bonsai-diagnosis-model-evaluation.md`
- `.loom/evidence/artifacts/20260527-bonsai-diagnosis-model-evaluation/`
- This ticket's Current State and Journal.
- If the harness requires a tiny compatibility fix to run, stop and route it back to `ticket:20260527-local-diagnosis-model-eval-harness` or create a separate source-change ticket instead of folding it into this evaluation.

Stop conditions:

- Stop if Bonsai/runtime is unavailable and setup would require new downloads or installs beyond prior authorization.
- Stop if only non-loopback binding works.
- Stop if the harness cannot run the corpus without source changes.
- Stop if model output repeatedly fails validators and the only apparent fix would weaken safety constraints.
- Stop if evidence would need raw private session content to make the quality claim.
- Stop and ask/shape a new ticket if Bonsai 4B/8B evaluation appears necessary.

## Acceptance

- ACC-001: The real model/runtime path is observed and local-only for this evaluation.
  - Evidence: Runtime/model provenance or freshness check, server command, loopback URL, `/v1/chat/completions` compatibility, no provider keys/headers, and server log/status artifacts.
  - Audit: Review should challenge whether this is real Bonsai versus fake-provider/fallback-only proof and whether locality is overclaimed.

- ACC-002: The full evaluation corpus is run through Bonsai 1.7B or any skipped cases are explicitly explained.
  - Evidence: Structured per-case result artifact includes model outcome, deterministic baseline reference, fallback reason/validation issue, elapsed time, and safety flags for each case.
  - Audit: Review should challenge skipped hard cases, one-off manual probes, and missing result fields.

- ACC-003: Safety and privacy outcomes are measured separately from usefulness.
  - Evidence: Report separates schema-invalid, unsupported-fact, secret/path/redaction, timeout/runtime, and accepted-output categories; no raw sensitive content is persisted.
  - Audit: Review should challenge path/secret leakage, hallucinated facts, and any sign model output influenced route/storage decisions.

- ACC-004: Usefulness is compared against deterministic output with the saved rubric.
  - Evidence: Sanitized examples and counts classify model output as better, equivalent, worse, invalid/fallback, or unsafe relative to deterministic diagnosis; the report explains the rating rationale and limits.
  - Audit: Review should challenge style-over-truth scoring and broad quality claims.

- ACC-005: Latency and timeout posture are recorded honestly.
  - Evidence: Report includes elapsed-time distribution over the corpus and discusses whether current timeout behavior makes model acceptance likely or mostly fallback-prone.
  - Audit: Review should challenge conclusions drawn from too few timing observations or one warm server run.

- ACC-006: A narrow release/tuning recommendation is recorded without implementing it.
  - Evidence: Current State and evidence state one of: keep opt-in experimental as-is; create a concrete follow-up tuning ticket; request operator authorization for larger model evaluation; or do not recommend 1.7B beyond fallback-safe experimentation.
  - Audit: Review should challenge whether the recommendation follows from the measured data and preserves deterministic default/fallback boundaries.

## Current State

Closed. Ran real Bonsai 1.7B Q1_0 through the 12-case corpus using loopback `llama.cpp` on `127.0.0.1:18121`. Evidence is recorded in `evidence:20260527-bonsai-diagnosis-model-evaluation`. Final fresh-server pass summary: 5/12 accepted, 7/12 deterministic fallback, 6 schema-invalid fallbacks mostly from extra `confidence` field, 1 unsupported-facts fallback, no accepted unsafe output, accepted outputs were equivalent to deterministic text, not better. Recommendation: keep opt-in experimental and execute follow-up `ticket:20260527-bonsai-diagnosis-polish-tuning` before any release-quality model-improvement claim. First audit returned `changes-needed` for warmed-run latency ambiguity; follow-up fresh-server pass resolved it and final audit `audit:20260527-bonsai-diagnosis-model-evaluation-followup-review` returned `clear`.

## Journal

- 2026-05-27: Created as the third child ticket of `plan:20260527-flight-learn-local-model-quality-evaluation`.
- 2026-05-27: Dependency `ticket:20260527-local-diagnosis-model-eval-harness` closed; this ticket is now unblocked for real Bonsai 1.7B quality evaluation through the harness.
- 2026-05-27: Set status to active. Read ticket, prerequisite harness evidence, prior real Bonsai evidence, adapter source, and workspace state before starting runtime evaluation.
- 2026-05-27: Reused existing operator-approved Bonsai 1.7B Q1_0 GGUF and Homebrew `llama.cpp`; started `llama-server` on `127.0.0.1:18121`, ran the corpus harness, stopped the server, captured provenance/results/privacy/validation artifacts, wrote `evidence:20260527-bonsai-diagnosis-model-evaluation`, created follow-up `ticket:20260527-bonsai-diagnosis-polish-tuning`, and moved to review.
- 2026-05-27: Recorded `audit:20260527-bonsai-diagnosis-model-evaluation-review` with verdict `changes-needed` due warmed-run latency ambiguity. Reran a fresh-server single corpus pass, refreshed metrics/evidence, and recorded `audit:20260527-bonsai-diagnosis-model-evaluation-followup-review` with verdict `clear`. Closed ticket with narrow quality limits preserved.
