# Local Diagnosis Model Runtime

ID: research:20260527-local-diagnosis-model-runtime
Type: Research
Status: active
Created: 2026-05-27
Updated: 2026-05-27

## Summary

This research evaluates local/open-source runtime options for optional `/flight-learn` diagnosis phrasing. The operator prefers PrismML Bonsai 1-bit because its memory footprint is unusually small. Preliminary source review supports Bonsai as the first candidate to evaluate, especially Bonsai GGUF through `llama.cpp`, but this record is not yet complete: no local runtime has been installed or exercised, no prompt/JSON compliance has been measured, and no real Pi validation has happened.

## Question

Which local/open-source model runtime and model family should `plan:20260527-flight-learn-local-model-diagnosis-polish` target first, while preserving explicit opt-in, no hosted calls, no automatic model downloads, deterministic fallback, bounded redacted inputs, and display-only output?

## Scope

Covered:

- PrismML Bonsai 1-bit GGUF models through `llama.cpp`.
- PrismML Bonsai 1-bit MLX models on Apple Silicon.
- Runtime integration shapes relevant to a Node/TypeScript Pi extension: local CLI, local loopback server, and external runtime configuration.
- Memory, license, platform, package-footprint, privacy, validation, and failure-mode implications.
- Current project constraints from the `/flight-learn` UX spec, local-first constitution, package manifest, and deterministic diagnosis implementation.

Excluded for now:

- Installing Bonsai, `llama.cpp`, MLX, Ollama, or model weights.
- Running inference quality or JSON-compliance tests.
- Benchmarking against private session corpora.
- Choosing a final model size without empirical prompt/validator results.
- Adding source code, dependencies, docs, or runtime configuration.

## Method And Sources

Sources inspected on 2026-05-27:

- `https://huggingface.co/prism-ml/Bonsai-1.7B-gguf/resolve/main/README.md` - official model card for Bonsai 1.7B GGUF.
- `https://huggingface.co/prism-ml/Bonsai-4B-gguf/resolve/main/README.md` - official model card for Bonsai 4B GGUF.
- `https://huggingface.co/prism-ml/Bonsai-8B-gguf/resolve/main/README.md` - official model card for Bonsai 8B GGUF.
- `https://huggingface.co/prism-ml/Bonsai-1.7B-mlx-1bit` - official model card for Bonsai 1.7B MLX.
- `https://github.com/PrismML-Eng/Bonsai-demo` - PrismML demo repository and upstream-status notes.
- `https://github.com/ggml-org/llama.cpp/pull/21273` - upstream `llama.cpp` Q1_0 support context; fetched content was noisy, so the demo repository's upstream-status table is the cleaner source for merged-backend claims.
- `package.json` - current package has no runtime dependencies and only TypeScript/Vitest/tsx dev dependencies.
- `src/reflection.ts` - existing model-assisted reflection precedent uses a provider interface and bounded redacted evidence, but that path is not local-only by construction.
- `spec:flight-learn-inbox-ux` - REQ-024 through REQ-029 require opt-in local/open-source model polish, bounded redacted input, structured validation, fallback, no storage/routing side effects, and unobtrusive disclosure.

Source quality note: PrismML model cards and demo repository are primary project sources for Bonsai claims. They are still vendor/self-reported sources for benchmark quality and performance. Runtime compatibility must be rechecked against the actual installed `llama.cpp`/MLX version during implementation/validation.

## Findings

- Bonsai 1-bit models are licensed Apache 2.0 in the inspected Hugging Face model cards.
- Bonsai GGUF model cards identify `library_name: llama.cpp`, `pipeline_tag: text-generation`, and `GGUF Q1_0` / Q1_0 g128 1-bit weight format.
- Bonsai GGUF sizes are attractive for this use case:
  - Bonsai 1.7B GGUF: 1.7B parameters, 32,768 token context, `0.24 GB` parameter memory, GGUF file about `0.25 GB` on disk.
  - Bonsai 4B GGUF: 4.0B parameters, 32,768 token context, `0.57 GB` parameter memory, GGUF file about `0.57 GB` on disk.
  - Bonsai 8B GGUF: 8.19B parameters, 65,536 token context, `1.15 GB` parameter memory, GGUF file about `1.16 GB` on disk.
- The model-card memory numbers are parameter memory only. Runtime memory will also include executable/runtime overhead, KV cache, prompt/context buffers, and OS/process overhead. `/flight-learn` prompts should be deliberately tiny so KV/cache overhead does not erase the memory advantage.
- Bonsai 1.7B MLX reports `0.27 GB` parameter memory and Apple Silicon/iOS/macOS focus. It requires PrismML's MLX fork for 1-bit kernels according to the inspected model card; the demo repository says MLX 1-bit support is pending upstream.
- The PrismML demo repository says Q1_0 support for CPU, Metal, CUDA, Vulkan, and optimized x86 CPU is merged into upstream `llama.cpp`, while the PrismML fork also exists. This makes GGUF/`llama.cpp` more portable than MLX as the default adapter target, but the actual installed runtime version still needs verification.
- Bonsai examples include both `llama-cli` and `llama-server`. The server example binds `--host 0.0.0.0`; this project should not copy that default. A local server adapter must require loopback only, e.g. `127.0.0.1`, unless a future explicit security decision says otherwise.
- Current `package.json` has no runtime dependencies. A Bonsai integration should not add heavyweight runtime dependencies or bundle model weights. The safest package boundary is an external local runtime configured by executable path/model path or loopback URL.
- Existing `src/reflection.ts` provides a useful precedent for provider abstraction and bounded prompt construction, but its `ModelReflectionProvider` is not sufficient as-is for this UI path because the new path must enforce local-only runtime policy, structured JSON output, timeout/fallback, and display-only semantics.

## Tradeoffs

### Bonsai 1.7B first

Optimizes for the operator's main value: negligible memory. It is likely enough for short paraphrasing if the prompt is constrained and the validator is strict. Risk: smaller model may be less reliable at strict JSON, may overgeneralize, or may require more fallback.

### Bonsai 4B fallback tier

Balances memory and quality. Still under 1 GB parameter memory, likely a better quality reserve than 1.7B, and less costly than 8B. Risk: adds another supported size to test/configure before any user value exists.

### Bonsai 8B quality tier

Still memory-light relative to full precision, and official cards report competitive 8B-class benchmark quality. Risk: larger startup/runtime footprint and more than the operator may need for a tiny phrasing task.

### GGUF through `llama.cpp`

Best default adapter direction because it is cross-platform, open-source, and already aligned with Bonsai GGUF model cards. It can support CLI or server mode. Risk: actual Q1_0 support depends on the installed `llama.cpp` version/build, and app code must avoid shell injection, non-loopback network, and automatic downloads.

### MLX first

Strong Apple-Silicon performance path, especially for local Mac/iOS use. Risk: Apple-specific and, for 1-bit, currently depends on PrismML's MLX fork/pending upstream support according to the source review. This is weaker as the first project-wide adapter boundary.

### Local loopback server

Lower per-request startup cost if a runtime is already running. Risk: lifecycle management, port/security concerns, accidental non-loopback exposure, and more operator setup. Must be opt-in and loopback-only.

### One-shot local CLI

Simpler privacy and lifecycle boundary: invoke a configured local binary with a configured model path and timeout. Risk: process startup may be too slow for interactive TUI unless model load is fast enough or the operator accepts the delay.

## Rejected Paths And Null Results

- Hosted providers are rejected for this feature. The spec requires local/open-source model execution and forbids hosted/non-loopback calls.
- Automatic model downloads during package install, first run, or `/flight-learn` are rejected. The operator must explicitly install/provide model weights and runtime.
- MLX-first default is rejected for now because it narrows support to Apple Silicon and may require fork-specific 1-bit MLX support.
- Copying Bonsai demo `llama-server --host 0.0.0.0` is rejected. If a server adapter is used, it must be loopback-only unless a separate security/governance decision changes that.
- Treating model output as durable truth, a classifier signal, route recommendation, artifact creation instruction, or mutation source is rejected by the spec and plan.

## Conclusions

Preliminary conclusion: PrismML Bonsai is a strong first candidate for optional local diagnosis polish because it matches the operator's low-memory goal, is Apache-2.0 in the inspected cards, supports local GGUF/`llama.cpp` execution, and is more than capable enough on paper for bounded paraphrasing.

The strongest initial implementation direction is **Bonsai GGUF through an external `llama.cpp` adapter**, not MLX and not a hosted provider. Start validation with **Bonsai 1.7B** because the task is small and memory is the motivating value. Keep **Bonsai 4B or 8B** as a quality fallback if 1.7B fails strict JSON/schema/relevance tests.

This is not yet a completed runtime decision. Completion still needs either deeper runtime research or an implementation spike that verifies the actual configured runtime can run Q1_0 Bonsai locally, produce valid structured output under small prompts, respect timeout/fallback, and preserve the focused-card UI's responsiveness.

## Recommendations

- Update `plan:20260527-flight-learn-local-model-diagnosis-polish` to name Bonsai GGUF/`llama.cpp` as the preferred candidate path while keeping runtime choice formally owned by `ticket:20260527-local-diagnosis-model-runtime-research`.
- Keep `ticket:20260527-local-diagnosis-model-contract-harness` model-agnostic so fallback, prompt contract, JSON validation, redaction, and display-only invariants do not depend on Bonsai.
- Make `ticket:20260527-local-diagnosis-model-adapter` consume the completed research conclusion and implement only one adapter first, likely local `llama.cpp` CLI or loopback server.
- Require validation tickets to distinguish fake-provider proof, disabled/fallback real Pi proof, and actual Bonsai/runtime proof. Do not claim actual local-model behavior until a real configured Bonsai model is run.

## Open Questions

- Should the first Bonsai adapter prefer one-shot `llama-cli` for privacy/lifecycle simplicity, or loopback `llama-server` for interactive latency? Recommendation pending: start with the simpler CLI boundary unless startup latency proves unacceptable.
- What should the operator-facing opt-in shape be: environment variables, project settings, or `/flight-learn` subcommand flag? The spec allows explicit local configuration or recoverable flag/subcommand path; implementation should choose one primary path and avoid visible command clutter.
- Is Bonsai 1.7B reliable enough at strict JSON and non-hallucination for this specific fact packet? This requires empirical fake/real prompt validation.
- Which exact `llama.cpp` version/build will be required for Q1_0 support, and how should the adapter detect unsupported binaries cleanly?

## Related Records

- `plan:20260527-flight-learn-local-model-diagnosis-polish` - consumes this research for runtime strategy.
- `ticket:20260527-local-diagnosis-model-runtime-research` - owns completion of this investigation before adapter implementation.
- `spec:flight-learn-inbox-ux` - defines the UX and safety requirements this runtime must preserve.
- `constitution:main` - requires open-source/local-first choices.
- `src/reflection.ts` - useful provider/prompt precedent, but not sufficient for local-only diagnosis polish.
- `package.json` - confirms current package has no runtime dependencies and should not casually absorb a model runtime.
