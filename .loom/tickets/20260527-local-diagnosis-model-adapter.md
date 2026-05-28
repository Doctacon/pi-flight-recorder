# Local Diagnosis Model Adapter

ID: ticket:20260527-local-diagnosis-model-adapter
Type: Ticket
Status: closed
Created: 2026-05-27
Updated: 2026-05-27
Risk: high - this introduces an optional local model process or loopback integration and must fail closed without hosted/network/default behavior.
Priority: medium - executable only after the contract harness is proven.
Depends On: ticket:20260527-local-diagnosis-model-contract-harness

## Summary

Implement the first explicit local runtime adapter for diagnosis polish, consuming the completed runtime research and contract harness. The selected first target is an explicitly configured external `llama.cpp` server over validated loopback HTTP, intended for PrismML Bonsai GGUF Q1_0 models but not hardcoded to a model size.

Single closure claim: an explicitly configured loopback-only `llama.cpp` server can be invoked through the safe diagnosis-polish contract, while disabled/missing/unsupported runtimes fail closed to deterministic diagnosis text and never call hosted or non-loopback services.

## Related Records

- `plan:20260527-flight-learn-local-model-diagnosis-polish` - parent strategy and sequencing.
- `research:20260527-local-diagnosis-model-runtime` - completed runtime decision; first adapter is `kind: "llama-cpp-server"` over validated loopback HTTP, with Bonsai 1.7B GGUF Q1_0 as the first validation target and 4B/8B only as quality fallbacks.
- `ticket:20260527-local-diagnosis-model-contract-harness` - provides the prompt/schema/validator/fallback contract this adapter must use.
- `spec:flight-learn-inbox-ux` - REQ-024 through REQ-029 constrain runtime behavior and side effects.
- `package.json` - current package has no runtime dependencies; adapter must avoid unnecessary dependency/package bloat.
- `src/reflection.ts` - provider abstraction precedent, not the policy authority for this path.
- `evidence:20260527-local-diagnosis-model-adapter-validation` - implementation validation outputs for focused adapter tests, adapter+contract tests, typecheck, build, full test suite, source/package inspection, and diff check.
- `audit:20260527-local-diagnosis-model-adapter-review` - first audit pass; verdict `changes-needed` because bare `fetch` may honor process-level proxy configuration under Node `--use-env-proxy`.
- `audit:20260527-local-diagnosis-model-adapter-followup-review` - second audit pass; verdict `changes-needed` because direct `node:http` without an explicit proxy bypass can still honor process-level proxy settings initialized at startup.
- `audit:20260527-local-diagnosis-model-adapter-second-followup-review` - final audit pass; verdict `clear` after explicit proxy-empty `Agent` and startup-env proxy regression.

## Scope

In scope:

- Implement exactly one first local runtime adapter: `kind: "llama-cpp-server"` over validated loopback HTTP.
- Require explicit local opt-in and explicit runtime configuration. Acceptable shapes include environment variables or project settings selected by the implementation, but no hidden defaults.
- Accept only loopback HTTP URLs, preferably literal `127.0.0.1` or `[::1]`; reject hosted domains, LAN/public IPs, ordinary domains, `0.0.0.0`, credentials in URLs, non-HTTP protocols, proxies, custom provider headers, and generic OpenAI-compatible provider configuration.
- Call only the configured loopback `POST /v1/chat/completions` endpoint with `stream: false`, small output limits, conservative generation parameters, and schema/JSON helper fields when supported.
- Invoke the model through the contract harness from `ticket:20260527-local-diagnosis-model-contract-harness`; do not construct separate unsafe prompts.
- Enforce timeout, max output size, HTTP error handling, response parsing, and fallback to deterministic diagnosis.
- Detect unsupported/missing runtime or model path with user-friendly fallback reasons.
- Add tests with mocks/fake binaries/fake loopback responses proving enabled, disabled, missing runtime, timeout, malformed output, non-loopback rejection, and no auto-download behavior.

Out of scope:

- Installing `llama.cpp`, Ollama, MLX, Bonsai, or model weights.
- Bundling model weights or runtime binaries into the package.
- Adding a new visible top-level Pi command.
- UI rendering changes beyond any minimal API surface needed for the next integration ticket.
- Real Pi TUI validation; that belongs to `ticket:20260527-flight-learn-local-model-polish-validation`.
- Supporting multiple runtimes in the first adapter.
- Supporting one-shot `llama-cli`, subprocess runtime lifecycle, MLX, Ollama, Node-native bindings, generic OpenAI-compatible URLs, or hosted provider compatibility.

Likely write scope:

- New adapter source module, for example `src/local-diagnosis-model-adapter.ts` or equivalent.
- Settings/config parsing code only if needed and bounded to `llama-cpp-server` loopback configuration.
- Colocated tests for adapter behavior and policy enforcement.
- No documentation outside `.loom/` under the Loom Weaver-shaped ticket unless a later implementation agent scopes docs explicitly.

Stop conditions:

- If implementation pressure reintroduces CLI/process runtime lifecycle, MLX, Ollama, Node-native bindings, generic provider URLs, hosted endpoints, automatic downloads, or runtime/model management, stop and route back to research/spec instead of widening this ticket.
- If loopback validation cannot be made strict enough to reject hosted/non-loopback/proxy/provider-header paths, stop and return to shaping.
- If the chosen adapter requires package dependency changes larger than this ticket's review scope, stop and split dependency/package strategy into a separate ticket.

## Acceptance

- ACC-001: The adapter is explicitly opt-in and disabled by default.
  - Evidence: tests show no runtime call happens without explicit enablement/configuration.
  - Audit: review should challenge hidden defaults and accidental provider calls.

- ACC-002: The adapter only invokes local execution.
  - Evidence: tests prove local process invocation or loopback-only URL acceptance, non-loopback rejection, and no hosted provider path.
  - Audit: review should challenge SSRF/non-loopback holes, shell interpolation, and environment-variable surprises.

- ACC-003: Missing, unsupported, slow, or failed runtime behavior falls back cleanly.
  - Evidence: tests cover missing binary/model, unsupported output, timeout, process failure, and malformed model output returning deterministic diagnosis plus a fallback reason.
  - Audit: review should challenge whether failures interrupt `/flight-learn` or leak raw errors.

- ACC-004: No model weights or runtime binaries are installed, downloaded, or bundled.
  - Evidence: source/package diff and tests or inspection artifact show no download/install path and no new heavyweight runtime dependency unless explicitly scoped and justified.
  - Audit: review should challenge package footprint and local-first assumptions.

- ACC-005: Standard validation passes for the touched source boundary.
  - Evidence: focused adapter tests, `npm run typecheck`, `npm run build`, and relevant full tests or justified narrower test set.
  - Audit: review should challenge any untested policy branch.

## Current State

Closed. Implemented `src/flight-learn-llama-cpp-adapter.ts` and `src/flight-learn-llama-cpp-adapter.test.ts` for exactly one optional `kind: "llama-cpp-server"` runtime adapter. No package dependency, UI, command, download/install, subprocess, runtime lifecycle, Ollama, MLX, Node-native, or generic hosted-provider support was added.

Closure basis: `audit:20260527-local-diagnosis-model-adapter-second-followup-review` returned `clear` after the explicit proxy-empty `Agent` fix and startup-env proxy regression.

- FIND-001 disposition: direct `node:http` uses an explicit proxy-empty `Agent` (`new Agent({ keepAlive: false, proxyEnv: {} })`) assigned on each adapter request. Regression coverage includes both in-process proxy environment variables and a child process started with `NODE_OPTIONS=--use-env-proxy` plus proxy variables present at startup; both observe the target loopback server receives the adapter request while the proxy server receives none.
- Acceptance support: `evidence:20260527-local-diagnosis-model-adapter-validation` records focused adapter tests (11 passed), env-proxy focused tests (11 passed), adapter+contract tests (23 passed), typecheck, build, full test suite (21 files / 120 tests), source/package inspection, and diff whitespace check passing.

Residual limits: this ticket does not prove real Bonsai/`llama.cpp` quality, latency, JSON reliability, UI disclosure, or benign behavior of an operator-configured local server. Those remain for later integration/validation tickets.

## Journal

- 2026-05-27: Created as the adapter slice for optional local model diagnosis polish. Bonsai GGUF/`llama.cpp` is the preferred candidate from preliminary research, but this ticket is intentionally dependent on the completed research and contract harness.
- 2026-05-27: Reconciled ticket wording after `audit:20260527-local-diagnosis-model-runtime-research-review#FIND-001`; first adapter scope is now only `kind: "llama-cpp-server"` over validated loopback HTTP, with no CLI/process runtime lifecycle, MLX, Ollama, Node-native, generic provider URL, hosted endpoint, or download path.
- 2026-05-27: Set status to active after contract harness closed with final audit `clear`. Dispatching a bounded implementation run for the loopback-only adapter.
- 2026-05-27: Implemented the loopback-only `llama-cpp-server` adapter and policy tests. The adapter exposes explicit config-to-provider/options helpers, validates canonical `http://127.0.0.1` and `http://[::1]` base URLs before any request, rejects hosted/non-loopback/credentialed/obfuscated/proxy/provider-key/model-path shapes, sends the contract prompt as the only chat message to `/v1/chat/completions`, enforces non-streaming conservative JSON parameters and response size/shape limits, uses the supplied abort signal, and returns/throws through the contract harness for deterministic fallback without raw error leakage. Validation passed and is recorded in `evidence:20260527-local-diagnosis-model-adapter-validation`. Moved to review for audit; not closed.
- 2026-05-27: Recorded `audit:20260527-local-diagnosis-model-adapter-review` with verdict `changes-needed`. Set ticket back to active for process-level proxy bypass/guard follow-up.
- 2026-05-27: FIND-001 follow-up replaced bare fetch with direct `node:http` loopback transport, added the HTTP_PROXY/NO_PROXY regression using real target and proxy servers, refreshed adapter/contract/typecheck/build/full-suite/source-scan/diff evidence in `evidence:20260527-local-diagnosis-model-adapter-validation`, and moved the ticket to review (not closed).
- 2026-05-27: Recorded `audit:20260527-local-diagnosis-model-adapter-followup-review` with verdict `changes-needed`; the review reproduced that `node:http` can still use startup process-level proxy settings under `NODE_OPTIONS=--use-env-proxy`. Set ticket back to active for explicit proxy bypass/fail-closed follow-up.
- 2026-05-27: Second FIND-001 follow-up added an explicit proxy-empty `node:http` Agent, added a startup-env child-process regression under `NODE_OPTIONS=--use-env-proxy`, refreshed adapter/contract/typecheck/build/full-suite/source-scan/diff evidence in `evidence:20260527-local-diagnosis-model-adapter-validation`, and moved the ticket to review (not closed).
- 2026-05-27: Recorded `audit:20260527-local-diagnosis-model-adapter-second-followup-review` with verdict `clear`. Closed ticket with residual limits preserved for real-model/UI validation.
