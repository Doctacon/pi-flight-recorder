# Local Diagnosis Model Runtime Research

ID: ticket:20260527-local-diagnosis-model-runtime-research
Type: Ticket
Status: closed
Created: 2026-05-27
Updated: 2026-05-27
Risk: medium - this decides the local model runtime boundary for a privacy-sensitive UI path, but does not change source behavior.
Priority: high - downstream implementation should not choose a model runtime by convenience.

## Summary

Investigate local/open-source runtime options for optional `/flight-learn` diagnosis phrasing and create a completed research record recommending the adapter strategy.

Single closure claim: the project has a citable research record that compares viable local runtime options, rejects unsafe/hosted paths, and defines the adapter/validation constraints downstream implementation must follow.

## Related Records

- `plan:20260527-flight-learn-local-model-diagnosis-polish` - parent plan.
- `constitution:main` - local-first/open-source principle.
- `spec:flight-learn-inbox-ux` - REQ-024 through REQ-029 and SCN-008/SCN-009.
- `research:20260527-local-diagnosis-model-runtime` - active research record seeded with preliminary Bonsai findings; this ticket owns completing it.
- `src/reflection.ts` - existing bounded model-assisted reflection precedent, not necessarily the target runtime.
- `package.json` - dependency/package footprint constraints.

## Scope

In scope:

- Research small local/open-source model runtime options suitable for short diagnosis paraphrasing.
- Compare at least:
  - PrismML Bonsai 1-bit GGUF through llama.cpp, with special attention to Q1_0 support, memory footprint, license, runtime maturity, and CLI/server integration;
  - PrismML Bonsai 1-bit MLX, with special attention to Apple-Silicon specialization and fork/upstream status;
  - loopback local service such as Ollama if it can run the selected local model without hosted/provider behavior and is already installed/configured;
  - Node-native/local library options if relevant;
  - explicit rejection of hosted/non-loopback providers.
- Evaluate privacy, offline behavior, dependency/package impact, installation expectations, model-size expectations, timeout/fallback behavior, and real validation feasibility.
- Create `.loom/research/20260527-local-diagnosis-model-runtime.md` or equivalent completed research record.
- Recommend one adapter path for the next tickets, or block the plan if no acceptable option exists.

Out of scope:

- Source implementation.
- Installing model runtimes or model weights.
- Benchmarking large models or tuning prompts against private real sessions.
- Enabling any model calls in `/flight-learn`.

Stop conditions:

- If every viable path requires hosted providers, automatic downloads, non-open-source components, or large package/dependency changes, record that and block downstream implementation instead of forcing a runtime.
- If choosing a runtime needs operator authority, identify the exact decision and mark the ticket blocked.

## Acceptance

- ACC-001: A completed research record exists comparing viable local runtime options and rejected paths.
  - Evidence: `.loom/research/...` record with sources/method/findings/tradeoffs/conclusion.
  - Audit: review should challenge whether the research is sufficient for implementation to proceed.

- ACC-002: The research recommends a concrete adapter boundary and explicit opt-in configuration shape, or blocks implementation with a reason.
  - Evidence: research conclusion names adapter shape and downstream constraints.
  - Audit: review should challenge whether the recommendation respects local-first/open-source and package constraints.

- ACC-003: The research defines validation preconditions for fake-provider tests and real local-model proof.
  - Evidence: research record lists evidence expectations and what remains blocked if no local runtime/model is available.
  - Audit: review should challenge overclaiming of local-model behavior without a real runtime.

## Current State

Closed. `research:20260527-local-diagnosis-model-runtime` is completed with a bounded recommendation: implement the first real-runtime adapter as an explicitly configured external `llama.cpp` server over validated loopback HTTP, starting validation with Bonsai 1.7B GGUF Q1_0 and keeping 4B/8B only as quality fallbacks. No source code was edited and no runtime/model install or inference was performed.

Acceptance posture:

- ACC-001: satisfied by the completed research record's comparison of Bonsai GGUF/`llama.cpp`, Bonsai MLX, Ollama, Node-native/local library options, CLI/server modes, and rejected hosted/non-loopback/auto-download paths.
- ACC-002: satisfied by the research recommendation for a `kind: "llama-cpp-server"` loopback-only adapter and explicit opt-in config shape.
- ACC-003: satisfied by the research validation preconditions for fake-provider/no-runtime tests, adapter tests, and future real Bonsai proof.

Audit posture: `audit:20260527-local-diagnosis-model-runtime-research-review` returned `concerns`, not acceptance blockers. `FIND-001` warned that downstream plan/adapter wording lagged the completed research. The actionable adapter-ticket portion was resolved by updating `ticket:20260527-local-diagnosis-model-adapter` to narrow first-adapter scope to loopback-only `llama.cpp` server and explicitly exclude CLI/process runtime lifecycle, MLX, Ollama, Node-native, generic provider URLs, hosted endpoints, and downloads. The parent plan remains a direction-setting record and was not edited by Driver; downstream tickets now point at the completed research for adapter scope. Residual risk is intentionally preserved: no real local-model behavior, latency, JSON compliance, or Bonsai quality has been proven.

## Journal

- 2026-05-27: Created ticket from the local-model diagnosis polish plan. The first move is research, not implementation.
- 2026-05-27: Operator expressed interest in PrismML Bonsai 1-bit because of its low memory usage. Research should evaluate Bonsai first rather than treating it as a generic local-model option.
- 2026-05-27: Seeded `research:20260527-local-diagnosis-model-runtime` with preliminary source findings: Bonsai GGUF/`llama.cpp` looks like the best first candidate, Bonsai 1.7B should be tried first for memory, and 4B/8B remain quality fallbacks pending real JSON/prompt validation.
- 2026-05-27: Set status to active to start runtime research execution under the parent plan.
- 2026-05-27: Completed `research:20260527-local-diagnosis-model-runtime` with public-source findings and a concrete adapter recommendation: loopback-only external `llama.cpp` server, Bonsai 1.7B GGUF Q1_0 first, deterministic fallback always, no hosted/non-loopback/auto-download/runtime-management paths. Moved ticket to review because audit is the next acceptance step.
- 2026-05-27: Recorded `audit:20260527-local-diagnosis-model-runtime-research-review` with verdict `concerns`. Dispositioned `FIND-001` by reconciling `ticket:20260527-local-diagnosis-model-adapter` to the completed research. Closed this ticket; the remaining limitations are explicit future validation risks, not blockers for the model-agnostic contract harness.
