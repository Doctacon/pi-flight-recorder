# Prism-ML Small Model Comparison

ID: ticket:20260527-prism-ml-small-model-comparison
Type: Ticket
Status: closed
Created: 2026-05-27
Updated: 2026-05-27
Risk: medium - downloads and runtime evaluation touch local model weights and could overclaim quality from a small synthetic corpus.
Priority: medium - operator requested small Prism-ML model testing on a 16GB MacBook after Bonsai 1.7B remained experimental.
Depends On: ticket:20260527-bonsai-diagnosis-polish-tuning

## Summary

Compare small Prism-ML GGUF models for optional `/flight-learn` diagnosis polish on the existing 12-case synthetic/redacted corpus. The operator authorized a 1.7B + 4B sweep, Prism-ML GGUF weights only, and explicitly chose to avoid Prism-ML Ternary models requiring a custom `llama.cpp` fork.

Single closure claim: the project has local evidence comparing current Bonsai 1.7B and Bonsai 4B GGUF behavior under the tuned prompt, with acceptance/fallback/safety/latency metrics and a conservative recommendation.

## Operator Authorization

- Model sweep: `1.7B + 4B`.
- Downloads: authorized for selected Prism-ML GGUF model weights into the local cache.
- Runtime scope: avoid Prism-ML Ternary models requiring a `llama.cpp` fork; use existing Homebrew `llama.cpp` only.
- No hosted inference, no telemetry, no runtime/toolchain installs, no automatic downloads beyond selected Prism-ML GGUF weights.

## Related Records

- `ticket:20260527-bonsai-diagnosis-polish-tuning` - prompt-only tuning prerequisite.
- `evidence:20260527-bonsai-diagnosis-polish-tuning` - tuned 1.7B evidence and recommendation.
- `ticket:20260527-bonsai-diagnosis-model-evaluation` - original real 1.7B evaluation.
- `evidence:20260527-local-diagnosis-model-eval-harness` - harness contract.
- `spec:flight-learn-inbox-ux` REQ-024 through REQ-029 - optional local-model safety boundaries.
- `src/flight-learn-local-diagnosis-model.ts` - tuned prompt/validator.
- `src/flight-learn-llama-cpp-adapter.ts` - loopback adapter.
- `evidence:20260527-prism-ml-small-model-comparison` - model download/provenance, matched 1.7B/4B evaluation, comparison, validation, and privacy evidence.
- `audit:20260527-prism-ml-small-model-comparison-review` - final audit; verdict `concerns` with no closure blocker.

## Scope

In scope:

- Inspect Prism-ML Bonsai 4B GGUF repository metadata and download the selected GGUF weight file only if it is compatible with existing Homebrew `llama.cpp`.
- Re-run the real Bonsai corpus evaluation for the existing 1.7B and the downloaded 4B using the same tuned prompt, timeout, max token, corpus, and loopback `llama.cpp` setup.
- Capture runtime/model provenance, checksums, file sizes, loopback server commands, health, stop status, per-model summaries, before/after comparison, privacy scan, and recommendation.
- Preserve deterministic fallback/default and display-only boundaries.

Out of scope:

- Bonsai 8B, Ternary Bonsai, MLX models, custom `llama.cpp` forks, runtime installs/builds, hosted inference, provider keys, telemetry, or non-loopback endpoints.
- Changing source, docs, prompts beyond the already tuned prompt from the prerequisite ticket.
- Changing `/flight-learn` defaults, timeout defaults, route/storage behavior, artifact/rule behavior, command visibility, or release posture.
- Claiming broad quality or release readiness from the synthetic/redacted corpus.

## Acceptance

- ACC-001: Download/model provenance is explicit and authorized.
  - Evidence: artifact records Hugging Face repo/file selected, local cache path redacted, file size, checksum, and confirmation no other weights/toolchains were downloaded.

- ACC-002: Both 1.7B and 4B are evaluated under the same tuned prompt/harness settings.
  - Evidence: per-model real Bonsai evaluation summaries/results over all 12 case IDs, with same timeout/max token/corpus.

- ACC-003: Safety/locality remain intact.
  - Evidence: loopback server command/health/stop artifacts, no hosted provider/provider-key usage, zero raw-path/secret artifact privacy scan matches, and no source/default/runtime lifecycle changes.

- ACC-004: Recommendation compares usefulness and latency without overclaiming.
  - Evidence: comparison artifact and evidence record say whether 4B is worth further experimentation on 16GB Mac, whether to keep 1.7B, whether to request 8B later, or whether neither improves enough.

- ACC-005: Review happens before closure.
  - Evidence: Ralph audit challenges download scope, metrics consistency, locality/privacy, and recommendation.

## Current State

Closed. Completed the authorized 1.7B + 4B Prism-ML GGUF sweep with existing Homebrew `llama.cpp` only. Downloaded only `prism-ml/Bonsai-4B-gguf` / `Bonsai-4B-Q1_0.gguf` into the local cache; no 8B, Ternary, MLX, custom fork, runtime install, hosted inference, telemetry, or provider key was used.

Evidence is recorded in `evidence:20260527-prism-ml-small-model-comparison`. Matched results on the 12-case corpus under the tuned prompt: Bonsai 1.7B accepted 8/12, fell back 4/12, mean latency 952 ms, final RSS `1190576` KiB; Bonsai 4B accepted 1/12, fell back 11/12 mostly as `unsupported-facts`, mean latency 1676 ms, final RSS `1704432` KiB. Both had zero hard-fail accepted outputs and zero output/prompt safety failures.

Recommendation: prefer 1.7B over 4B for the current strict validator/prompt. 4B runs on the 16GB MacBook but is slower and much less accepted; do not switch to 4B without a separate prompt/validator tuning ticket. Audit `audit:20260527-prism-ml-small-model-comparison-review` returned `concerns` with no closure blocker. Closure caveats: no-source-change is not VCS-proven due wider dirty/untracked workspace state; do not claim general 4B inferiority or release readiness.

## Journal

- 2026-05-27: Created and activated after operator authorized `1.7B + 4B`, Prism-ML GGUF-only downloads, and avoiding Ternary/custom-fork models.
- 2026-05-27: Downloaded Bonsai 4B Q1_0 GGUF, ran matched 1.7B and 4B corpus evaluations over loopback `llama.cpp`, recorded provenance/comparison/validation/privacy evidence, and moved to review for audit.
- 2026-05-27: Recorded `audit:20260527-prism-ml-small-model-comparison-review` with verdict `concerns`. Corrected a stale hardcoded artifact note that misnamed 4B as 1.7B, preserved the no-VCS-proof source caveat, and closed the ticket.
