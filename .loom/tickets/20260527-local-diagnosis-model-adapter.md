# Local Diagnosis Model Adapter

ID: ticket:20260527-local-diagnosis-model-adapter
Type: Ticket
Status: open
Created: 2026-05-27
Updated: 2026-05-27
Risk: high - this introduces an optional local model process or loopback integration and must fail closed without hosted/network/default behavior.
Priority: medium - executable only after the contract harness is proven.
Depends On: ticket:20260527-local-diagnosis-model-contract-harness

## Summary

Implement the first explicit local runtime adapter for diagnosis polish, consuming the completed runtime research and contract harness. The likely target is PrismML Bonsai GGUF through `llama.cpp`, but this ticket must follow the completed research conclusion rather than hard-code a runtime by chat memory.

Single closure claim: an explicitly configured local runtime can be invoked through the safe diagnosis-polish contract, while disabled/missing/unsupported runtimes fail closed to deterministic diagnosis text and never call hosted or non-loopback services.

## Related Records

- `plan:20260527-flight-learn-local-model-diagnosis-polish` - parent strategy and sequencing.
- `research:20260527-local-diagnosis-model-runtime` - should be completed before this ticket starts; preliminary conclusion favors Bonsai GGUF through `llama.cpp`.
- `ticket:20260527-local-diagnosis-model-contract-harness` - provides the prompt/schema/validator/fallback contract this adapter must use.
- `spec:flight-learn-inbox-ux` - REQ-024 through REQ-029 constrain runtime behavior and side effects.
- `package.json` - current package has no runtime dependencies; adapter must avoid unnecessary dependency/package bloat.
- `src/reflection.ts` - provider abstraction precedent, not the policy authority for this path.

## Scope

In scope:

- Implement one local runtime adapter selected by completed research. Expected initial target: external `llama.cpp` invocation for PrismML Bonsai GGUF.
- Require explicit local opt-in and explicit runtime/model configuration. Acceptable shapes include environment variables or project settings selected by the research/integration plan; no hidden defaults.
- Support only local process invocation or loopback endpoint. If a server endpoint is supported, validate loopback host only (`127.0.0.1`, `localhost`, or equivalent) and reject non-loopback URLs.
- Invoke the model through the contract harness from `ticket:20260527-local-diagnosis-model-contract-harness`; do not construct separate unsafe prompts.
- Use safe process spawning or request construction; avoid shell interpolation.
- Enforce timeout, max output size, error handling, and fallback to deterministic diagnosis.
- Detect unsupported/missing runtime or model path with user-friendly fallback reasons.
- Add tests with mocks/fake binaries/fake loopback responses proving enabled, disabled, missing runtime, timeout, malformed output, non-loopback rejection, and no auto-download behavior.

Out of scope:

- Installing `llama.cpp`, Ollama, MLX, Bonsai, or model weights.
- Bundling model weights or runtime binaries into the package.
- Adding a new visible top-level Pi command.
- UI rendering changes beyond any minimal API surface needed for the next integration ticket.
- Real Pi TUI validation; that belongs to `ticket:20260527-flight-learn-local-model-polish-validation`.
- Supporting multiple runtimes in the first adapter unless the completed research proves one runtime cannot satisfy the target.

Likely write scope:

- New adapter source module, for example `src/local-diagnosis-model-adapter.ts` or equivalent.
- Settings/config parsing code only if needed and bounded.
- Colocated tests for adapter behavior and policy enforcement.
- No documentation outside `.loom/` under the Loom Weaver-shaped ticket unless a later implementation agent scopes docs explicitly.

Stop conditions:

- If the completed research does not recommend a concrete adapter, block this ticket.
- If the chosen runtime requires automatic model downloads or bundled proprietary/hosted behavior, block and route back to research/spec.
- If local invocation cannot be bounded to loopback/process-only behavior, stop and return to shaping.
- If adapter implementation requires package dependency changes larger than this ticket's review scope, stop and split dependency/package strategy into a separate ticket.

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

Open but not ready to execute until `ticket:20260527-local-diagnosis-model-contract-harness` is closed and `research:20260527-local-diagnosis-model-runtime` has a completed adapter recommendation. No source implementation has started.

## Journal

- 2026-05-27: Created as the adapter slice for optional local model diagnosis polish. Bonsai GGUF/`llama.cpp` is the preferred candidate from preliminary research, but this ticket is intentionally dependent on the completed research and contract harness.
