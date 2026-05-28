# Local Diagnosis Model Runtime

ID: research:20260527-local-diagnosis-model-runtime
Type: Research
Status: completed
Created: 2026-05-27
Updated: 2026-05-27

## Summary

This research evaluated local/open-source runtime options for optional `/flight-learn` diagnosis phrasing. The operator-preferred PrismML Bonsai 1-bit line remains the best first model family because the inspected model cards report Apache-2.0 licensing, GGUF/`llama.cpp` support, and unusually small parameter memory.

Recommendation: implement the first real-runtime adapter as an **explicitly configured external `llama.cpp` server on loopback only**, using Bonsai **1.7B GGUF Q1_0** as the first validation target and Bonsai 4B/8B only as quality fallbacks. The adapter should not install `llama.cpp`, start a server, download weights, call hosted providers, accept non-loopback URLs, or become required for `/flight-learn`. The prompt/response contract remains model-agnostic and deterministic fallback remains the oracle.

No runtime/model installation or inference was authorized for this research. This record is sufficient to proceed to fake-provider contract tests and a loopback `llama.cpp` adapter ticket, but it does **not** prove Bonsai output quality, JSON reliability, latency, or local runtime behavior.

## Question

Which local/open-source model runtime and model family should `plan:20260527-flight-learn-local-model-diagnosis-polish` target first, while preserving explicit opt-in, no hosted calls, no automatic model downloads, deterministic fallback, bounded redacted inputs, and display-only output?

## Scope

Covered:

- PrismML Bonsai 1-bit GGUF models through `llama.cpp`, with Q1_0/runtime maturity checked first.
- PrismML Bonsai 1-bit MLX models on Apple Silicon.
- Runtime integration shapes relevant to a Node/TypeScript Pi extension: local loopback server, local CLI process, external runtime configuration, Ollama, and Node-native/local library options.
- Memory, license, platform, package-footprint, privacy, offline behavior, validation, timeout/fallback behavior, and failure-mode implications.
- Current project constraints from the `/flight-learn` UX spec, local-first constitution, package manifest, and deterministic/model-assisted reflection precedent.

Excluded:

- Installing Bonsai, `llama.cpp`, MLX, Ollama, Node-native bindings, or model weights.
- Running inference quality, prompt, latency, or JSON-compliance tests.
- Benchmarking against private session corpora.
- Sending local session contents, prompts, file paths, stack traces, or private data to any external service.
- Adding source code, dependencies, docs, or runtime configuration.

## Method And Sources

Sources inspected on 2026-05-27. External checks used only public source URLs and did not transmit local session contents or private project data.

Project sources:

- `constitution:main` - local-first/open-source, local data, evidence-backed behavior.
- `spec:flight-learn-inbox-ux` - REQ-024 through REQ-029 require opt-in local/open-source diagnosis polish, bounded redacted input, structured validation, deterministic fallback, no storage/routing side effects, and unobtrusive disclosure.
- `spec:visible-command-surface` - preserves the two-command visible command surface; no new top-level command should be added for model polish.
- `spec:delta-artifact-learning-loop` - preserves human-gated artifact routing and local-only default behavior.
- `plan:20260527-flight-learn-local-model-diagnosis-polish` - accepted plan direction for optional local polish.
- `package.json` - current package has no runtime dependencies and only TypeScript/Vitest/tsx dev dependencies.
- `src/reflection.ts` - existing provider abstraction and bounded/redacted prompt precedent, but not local-only or structured enough for this feature.

Public external sources:

- `https://huggingface.co/prism-ml/Bonsai-1.7B-gguf/raw/main/README.md` - official Bonsai 1.7B GGUF model card.
- `https://huggingface.co/prism-ml/Bonsai-4B-gguf/raw/main/README.md` - official Bonsai 4B GGUF model card.
- `https://huggingface.co/prism-ml/Bonsai-8B-gguf/raw/main/README.md` - official Bonsai 8B GGUF model card.
- `https://huggingface.co/prism-ml/Bonsai-1.7B-mlx-1bit/raw/main/README.md` - official Bonsai 1.7B MLX model card.
- `https://github.com/PrismML-Eng/Bonsai-demo` / `README.md` - PrismML demo repository, upstream-status table, setup/download behavior, run/server scripts.
- `https://github.com/ggml-org/llama.cpp` / `README.md`, `tools/server/README.md`, `LICENSE` - upstream `llama.cpp` license, CLI/server behavior, server host defaults, OpenAI-compatible endpoint, grammar/JSON schema support.
- GitHub API checks for `ggml-org/llama.cpp` PRs `#21273`, `#21528`, `#21629`, `#21539`, and `#21636` - Q1_0 CPU, Metal, CUDA, Vulkan, and optimized x86/generic CPU merge status.
- Raw upstream `llama.cpp` source files `ggml/include/ggml.h` and `ggml/src/ggml.c` - `GGML_TYPE_Q1_0` and `GGML_FTYPE_MOSTLY_Q1_0` appear in current `master`.
- `https://github.com/ml-explore/mlx` / `LICENSE` and GitHub API for `ml-explore/mlx#3161` - MLX license and PrismML 1-bit affine quantization upstream status.
- `https://github.com/ollama/ollama` / `README.md`, `docs/api.md`, `docs/modelfile.mdx`, `docs/import.mdx`, `LICENSE` - Ollama license, local REST API, structured output support, GGUF import flow.
- `https://github.com/withcatai/node-llama-cpp` / `README.md` and repository metadata - Node-native `llama.cpp` binding capabilities, license, binary/build behavior, and package-footprint implications.

Source quality and freshness notes:

- PrismML Bonsai model cards and demo repository are primary project sources for Bonsai license, model size, memory, formats, and recommended commands, but their quality/benchmark claims are self-reported and not proof for this UI task.
- GitHub PR/source checks are stronger support that Q1_0 is present in upstream `llama.cpp`, but downstream implementation must recheck the actual installed binary/version, because an operator may have an older build.
- Runtime documentation is current public documentation, not local proof. No inference command was run.
- Ollama and Node-native compatibility with Bonsai Q1_0 was not proven locally; both remain secondary paths unless a future ticket validates them with the exact model/runtime.

## Findings

### Project constraints

- `/flight-learn` diagnosis polish may only be optional local/open-source execution. It must not call hosted providers, non-loopback endpoints, telemetry services, or automatic model-weight downloads.
- The model input must be a bounded redacted fact packet, not raw session transcripts, full prompts, unredacted paths, secrets, stack traces, or unconstrained local history.
- Model output must be structured, validated, length-bounded, display-only phrasing. It must never affect routing, ranking, classifier behavior, delta status, stored `ExpectationDelta` fields, artifact candidates, source files, Loom records, rules, skills, or prompts.
- Current package footprint is intentionally small. There are no runtime dependencies, so the first adapter should avoid adding model runtimes, native bindings, or bundled weights to `package.json`.
- `src/reflection.ts` shows a useful provider/prompt precedent, but its `ModelReflectionProvider.complete(prompt)` shape is too broad for this feature because it does not itself enforce local-only runtime, loopback validation, JSON schema validation, timeouts, or display-only semantics.

### Bonsai GGUF through llama.cpp

- Bonsai GGUF model cards report `license: apache-2.0`, `library_name: llama.cpp`, `pipeline_tag: text-generation`, GGUF Q1_0 / Q1_0 g128 format, and local `llama-cli`/`llama-server` examples.
- The operator's low-memory preference is directly supported by the model-card parameter-memory figures:
  - Bonsai 1.7B GGUF: 1.7B parameters, 32,768 token context, `0.24 GB` parameter memory, GGUF file about `0.25 GB` on disk.
  - Bonsai 4B GGUF: 4.0B parameters, 32,768 token context, `0.57 GB` parameter memory, GGUF file about `0.57 GB` on disk.
  - Bonsai 8B GGUF: 8.19B parameters, 65,536 token context, `1.15 GB` parameter memory, GGUF file about `1.16 GB` on disk.
- Those memory numbers are parameter memory only. Runtime memory also includes executable/runtime overhead, KV cache, prompt/context buffers, Metal/CUDA/CPU backend overhead, and OS/process overhead. The prompt must stay tiny; Bonsai-demo estimates for 8B show context size can dominate total memory even when weights are small.
- Upstream `llama.cpp` is MIT licensed. Public GitHub PR checks show Q1_0 support merged in 2026 for CPU (`#21273`), Metal (`#21528`), CUDA (`#21629`), Vulkan (`#21539`), and optimized x86/generic CPU follow-up (`#21636`). Current upstream source includes `GGML_TYPE_Q1_0` and `GGML_FTYPE_MOSTLY_Q1_0`.
- `llama.cpp` documentation supports both `llama-cli` and `llama-server`. `llama-server` is described as a lightweight OpenAI-compatible HTTP server; docs show default local server on port 8080, `/v1/chat/completions`, and grammar/JSON schema constraints including `response_format` for chat completions.
- `llama.cpp` server documentation says `--host` defaults to `127.0.0.1`. PrismML model cards show examples with `--host 0.0.0.0`, but this project must not copy that host setting.
- `llama.cpp` CLI documentation includes `-hf <user>/<model>[:quant]`, which downloads from Hugging Face by default. This feature is useful for manual setup outside the app but must be disallowed in the product adapter. The adapter should use only a user-provided local server URL or, if a future CLI adapter is approved, a local `-m /path/to/model.gguf` path.
- PrismML's Bonsai-demo `setup.sh` is useful operator setup documentation, but it installs dependencies, downloads model files, and downloads/builds runtime binaries. The Flight Recorder package must not run or wrap that setup flow automatically.

### Bonsai MLX

- Bonsai 1.7B MLX reports Apache-2.0 licensing, MLX-native 1-bit g128 format, 0.27 GB parameter memory, and strong Apple Silicon/iOS/macOS positioning.
- MLX itself is MIT licensed, but the Bonsai model card states the Python path requires PrismML's MLX fork for 1-bit kernel support. The PrismML demo status table lists MLX 1-bit support as pending upstream, and GitHub API inspection showed `ml-explore/mlx#3161` open with no `merged_at` value.
- MLX is therefore a plausible Apple-Silicon-specialized future path, but it is weaker than GGUF/`llama.cpp` as the first project-wide adapter because it is platform-specific and currently fork-dependent for 1-bit Bonsai.

### Ollama loopback service

- Ollama is MIT licensed and exposes a local REST API, commonly at `http://localhost:11434`.
- Ollama docs support structured outputs using `format: "json"` or a JSON schema and non-streaming responses with `stream: false`.
- Ollama docs support importing a local GGUF model using a `Modelfile` with `FROM /path/to/file.gguf` and `ollama create`.
- Ollama is acceptable only as a future explicitly configured loopback adapter if the operator has already installed Ollama, created/imported the local model, and selected a loopback endpoint. The app must not call `ollama pull`, `ollama create`, or any hosted registry path, and this research did not prove Ollama can run Bonsai Q1_0 with the installed `llama.cpp` backend version.
- Ollama should not be the first adapter because it adds a second runtime/model registry boundary and makes it easier to accidentally depend on model-library pulls. A later `kind: ollama` adapter can be evaluated after the direct `llama.cpp` server path is proven.

### Node-native/local library options

- `node-llama-cpp` is MIT licensed, active, TypeScript-friendly, and advertises local `llama.cpp` execution plus JSON/schema-constrained generation.
- It would, however, add a runtime dependency with prebuilt binaries and a fallback path that downloads a `llama.cpp` release and builds from source if binaries are unavailable. That is much larger package/build surface than the current dependency-free runtime package and is unnecessary for an optional display-polish feature.
- Node-native bindings should not be the first adapter. Reconsider only if loopback `llama.cpp` server proves too operationally awkward and the operator accepts the package/build footprint and any install-time network behavior constraints.
- Browser/WASM JS options such as `wllama` are even less attractive for this server-side Pi extension path because Q1_0 Bonsai support and performance would need separate proof, while the package footprint would grow for no first-slice advantage.

## Tradeoffs

### Bonsai 1.7B first

Best match for the operator's main preference: low memory. Its parameter memory is small enough that a local model can plausibly be optional polish rather than infrastructure. Risk: 1.7B may be less reliable at strict JSON, may paraphrase too vaguely, or may require frequent fallback. This risk belongs in validation, not in model selection.

### Bonsai 4B / 8B as quality fallbacks

Bonsai 4B remains under 1 GB parameter memory and is the first quality fallback if 1.7B fails structured-output or phrasing tests. Bonsai 8B may improve quality but increases runtime/KV/cache pressure. The adapter should not hardcode a model size; validation should start with 1.7B and record when 4B/8B is needed.

### `llama.cpp` server versus one-shot `llama-cli`

A one-shot CLI process is attractive for lifecycle simplicity and avoids opening a server. But for an interactive TUI card, repeatedly loading a GGUF model on demand is likely the wrong latency shape, and safe subprocess handling would add command/path/shell-injection concerns. CLI remains useful for manual smoke tests or a later fallback adapter, using local `-m` only.

A pre-started `llama.cpp` server gives the app a small HTTP adapter, avoids model-load-on-every-card, avoids shelling out, and keeps model/runtime lifecycle outside the Node package. Its main risks are URL validation, loopback-only enforcement, timeout/fallback behavior, and avoiding generic hosted OpenAI-compatible endpoints. Those risks are bounded and testable.

### Direct `llama.cpp` server versus Ollama

Direct `llama.cpp` server is closer to the Bonsai GGUF model cards and upstream Q1_0 support, and it avoids Ollama's separate model registry/pull/create lifecycle. Ollama is local/open-source and can be useful if already configured, but it should be a later separate adapter, not a generic pass-through, because accidental pull/registry/provider behavior is easier to introduce.

### GGUF/`llama.cpp` versus MLX

GGUF/`llama.cpp` is more portable across CPU, Metal, CUDA, and Vulkan and has upstream Q1_0 merge evidence. MLX may be faster/better on Apple Silicon but is narrower and fork-dependent for 1-bit Bonsai as of this research. MLX should not be the first adapter boundary.

### External runtime versus bundled/native dependency

External runtime configuration keeps `package.json` small and respects explicit operator setup. Bundled/native dependencies could make setup smoother later but introduce install/build/download behavior and a larger security/release surface before the value is proven.

## Rejected Paths And Null Results

- Hosted providers are rejected for this feature. That includes OpenAI, Anthropic, Gemini, hosted Hugging Face inference/endpoints/spaces, MotherDuck-hosted execution, SaaS gateways, and any non-loopback OpenAI-compatible endpoint.
- Generic `baseUrl` support for arbitrary OpenAI-compatible APIs is rejected. The first adapter must be `kind: llama-cpp-server`, validate loopback, and avoid provider keys/headers. Do not let a configurable URL silently become a hosted-provider path.
- Non-loopback URLs are rejected, including LAN IPs, public IPs, ordinary domains, `0.0.0.0`, and hostnames that do not resolve to loopback. Recommended examples should use `http://127.0.0.1:<port>` or, if implemented carefully, `http://[::1]:<port>`.
- Automatic model-weight downloads during package install, first run, `/flight-learn`, health checks, or fallback are rejected.
- Automatic runtime installation/building/downloading from Flight Recorder is rejected for the first adapter. Operator-managed manual setup is allowed; app-managed setup is not.
- Calling `llama.cpp -hf ...`, `ollama pull`, `ollama create`, PrismML `setup.sh`, or any other model/runtime setup helper from the app is rejected.
- Copying PrismML's `llama-server --host 0.0.0.0` example is rejected. `llama.cpp` docs show the server default is `127.0.0.1`, and this project should preserve loopback-only behavior.
- MLX-first default is rejected because it is Apple-specific and 1-bit Bonsai support is fork/pending-upstream according to the inspected sources.
- Ollama-first default is rejected because Bonsai Q1_0 compatibility was not proven here and Ollama adds an extra model registry/import lifecycle.
- Node-native first implementation is rejected because it adds a large native/binary package surface to a dependency-light package for an optional display-polish feature.
- Treating local model output as durable truth, a classifier signal, route recommendation, artifact creation instruction, or mutation source is rejected by the spec and plan.

## Adapter Recommendation

Implement one first real-runtime adapter: **external `llama.cpp` server on loopback**.

Recommended model tier for validation:

1. Bonsai 1.7B GGUF Q1_0 first.
2. Bonsai 4B GGUF Q1_0 if 1.7B fails quality/JSON/relevance validation.
3. Bonsai 8B GGUF Q1_0 only if 4B still fails and the operator accepts the higher runtime footprint.

Recommended configuration shape, expressed as a typed local config object. Exact env/local-setting names can be finalized by the adapter ticket, but the semantics should stay this narrow:

```ts
type LocalDiagnosisPolishRuntime =
  | { enabled: false }
  | {
      enabled: true;
      kind: "llama-cpp-server";
      baseUrl: "http://127.0.0.1:8080"; // example only; must validate loopback
      model?: string;                    // optional label sent to /v1/chat/completions
      timeoutMs?: number;                // short UI timeout, then deterministic fallback
      maxOutputTokens?: number;          // small, diagnosis-card-sized output only
    };
```

Required adapter boundary:

- Disabled by default unless the operator explicitly enables local diagnosis polish and provides a loopback `llama.cpp` server URL.
- Accept only loopback HTTP URLs, preferably literal `127.0.0.1` or `[::1]`; reject hosted domains, LAN/public IPs, `0.0.0.0`, credentials in URLs, non-HTTP protocols, proxies, and custom provider headers.
- Call `POST /v1/chat/completions` on that loopback server with `stream: false`, small `max_tokens`, conservative generation parameters, and `response_format`/JSON schema when the configured server supports it.
- Treat server-side JSON schema/grammar as a helper only. The app must still parse and validate the returned JSON, enforce length/content constraints, reject unsafe/secret-looking or non-evidence facts, and fall back to deterministic wording.
- Do not start, stop, install, build, update, or download the runtime or model. The operator owns running `llama-server -m <local Bonsai GGUF> --host 127.0.0.1 --port <port>` or equivalent manual setup.
- Do not support `llama.cpp -hf`, Hugging Face URLs, remote model identifiers, Ollama pull/create, PrismML setup scripts, or automatic model discovery from the adapter.
- Do not add a top-level command. Opt-in should be local config, environment, or a recoverable `/flight-learn` option/subcommand path under the existing command surface.
- Keep the contract harness model-agnostic: the fact-packet builder, prompt, schema, validator, timeout wrapper, and deterministic fallback should work with fake providers before any real runtime is attached.

This recommendation does not require a new operator decision before the next implementation ticket. It does require operator-provided local runtime/model access before any future ticket claims real Bonsai behavior.

## Validation Preconditions

### Fake-provider / no-runtime tests required before adapter claims

The contract harness can proceed without a real model. It should prove:

- local-model polish is disabled by default;
- only bounded redacted facts are included in the model input;
- raw sessions, full prompts, unredacted paths, secret-looking values, stack traces, and unconstrained transcript text are excluded or redacted;
- valid structured JSON can replace only display wording for the current card;
- malformed JSON, schema-invalid JSON, overlong text, hallucinated facts, non-evidence claims, secret-looking output, errors, and timeouts all fall back to deterministic diagnosis;
- model output cannot mutate routing, route ranking, artifact candidates, `ExpectationDelta` fields, storage, source files, docs, Loom records, rules, skills, or prompts;
- UI/debug output records an honest fallback reason without interrupting review.

### Adapter tests required before implementation claims

The `llama.cpp` server adapter should prove with mocks/local fake HTTP only:

- non-loopback URLs are rejected before any request is made;
- credentials, provider headers/API keys, proxy use, and hosted-looking endpoints are rejected or ignored;
- the adapter only calls the configured loopback endpoint path and never downloads, installs, starts, shells out to, or manages a runtime;
- request bodies contain only the bounded prompt/fact packet and small generation/JSON parameters;
- HTTP errors, connection failures, invalid responses, slow responses, and schema failures return deterministic fallback;
- no source/storage/routing side effects occur when the adapter is disabled, unavailable, slow, or invalid.

### Real local-model proof required before release claims

No real-runtime proof exists from this research. A future validation ticket may claim actual local-model behavior only after an explicitly authorized disposable run with:

- an operator-installed `llama.cpp` build recent enough to include Q1_0 support, or a checked PrismML/upstream build with the same capability;
- a manually downloaded/provided Bonsai GGUF model, starting with Bonsai 1.7B Q1_0;
- `llama-server` bound to loopback (`127.0.0.1` or `[::1]`), not `0.0.0.0`;
- a synthetic or disposable fixture fact packet, not raw private sessions;
- captured non-sensitive evidence of runtime version/build, model family/size, request shape, response validation outcome, timeout/fallback behavior, and no storage/routing side effects;
- honest latency notes for the interactive card path.

If no approved local runtime/model is available, the real-model portion must be marked blocked/deferred. Fake-provider tests and deterministic fallback evidence must not be described as proof that Bonsai works.

## Conclusions

PrismML Bonsai GGUF through `llama.cpp` is the best first candidate for optional local diagnosis polish. It aligns with the operator's low-memory goal, satisfies open-source/local-first constraints on paper, and now has enough upstream Q1_0 `llama.cpp` support evidence to justify a bounded adapter ticket.

The adapter decision is complete: target **external `llama.cpp` server over validated loopback HTTP** first. Do not implement MLX, Ollama, Node-native bindings, generic OpenAI-compatible URLs, hosted providers, non-loopback endpoints, automatic downloads, or runtime lifecycle management in the first adapter.

This conclusion is bounded. It authorizes fake-provider contract work and a fail-closed loopback adapter, not release claims about Bonsai quality or real local-model behavior.

## Recommendations

- `ticket:20260527-local-diagnosis-model-contract-harness`: proceed model-agnostically. Build the fact packet, prompt, schema, validator, timeout/fallback wrapper, and fake-provider tests before any real runtime dependency.
- `ticket:20260527-local-diagnosis-model-adapter`: implement only `kind: "llama-cpp-server"` first, behind explicit local configuration and strict loopback URL validation. Do not add runtime dependencies or package-managed downloads.
- `ticket:20260527-flight-learn-local-model-polish-integration`: consume only validated display text; preserve deterministic fallback and display-only semantics.
- `ticket:20260527-flight-learn-local-model-polish-validation`: separate fake-provider proof, disabled/fallback real Pi proof, and actual Bonsai/runtime proof. Mark real-model proof blocked if an authorized local runtime/model is not available.
- Do not update specs or constitution for this recommendation; existing local-first/open-source and `/flight-learn` requirements already cover the constraints.

## Open Questions

- Is Bonsai 1.7B reliable enough at strict JSON and non-hallucinating paraphrase for the diagnosis fact packet? Requires real local prompt validation.
- Which exact `llama.cpp` release/build will the operator use, and can the adapter expose a helpful unsupported-runtime fallback if Q1_0 is missing? Requires implementation/validation environment.
- What timeout provides the right TUI feel? Recommendation: keep the adapter timeout short enough that deterministic fallback feels instant, but choose the exact value during UI integration.
- Should a future second adapter support Ollama after the direct `llama.cpp` path is proven? Only if the operator has already imported the local GGUF model and the adapter remains loopback-only/no-pull.

## Related Records

- `plan:20260527-flight-learn-local-model-diagnosis-polish` - consumes this research for runtime strategy.
- `ticket:20260527-local-diagnosis-model-runtime-research` - owns completion of this investigation before adapter implementation.
- `ticket:20260527-local-diagnosis-model-contract-harness` - next model-agnostic prompt/validator work.
- `ticket:20260527-local-diagnosis-model-adapter` - future implementation owner for the loopback `llama.cpp` server adapter.
- `spec:flight-learn-inbox-ux` - defines the UX and safety requirements this runtime must preserve.
- `spec:visible-command-surface` - prevents adding a new top-level command for opt-in polish.
- `spec:delta-artifact-learning-loop` - preserves human-gated routing/artifact semantics.
- `constitution:main` - requires local-first/open-source choices.
- `src/reflection.ts` - useful provider/prompt precedent, but not sufficient for local-only diagnosis polish.
- `package.json` - confirms current package has no runtime dependencies and should not absorb a model runtime for the first adapter.
