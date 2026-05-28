# Flight Learn Local Model Diagnosis Polish

ID: plan:20260527-flight-learn-local-model-diagnosis-polish
Type: Plan
Status: closed
Created: 2026-05-27
Updated: 2026-05-27
Risk: high - this introduces optional local model execution into a privacy-sensitive UI path and must preserve local-first, explicit opt-in, deterministic fallback, and candidate-only safety boundaries.

## Summary

This plan decomposes optional **small local model** polish for `/flight-learn` diagnosis wording. The deterministic diagnosis helper remains the default and fallback, but an explicitly configured local/open-source model may improve the phrasing of the selected delta's display-only `Problem`, `What happened?`, and `Why it matters` text.

This needs more than one ticket because the work crosses several trust boundaries: choosing a local runtime, defining a safe bounded prompt/response contract, implementing an opt-in adapter, wiring it into the focused-card UI without changing storage or routing semantics, and validating with real local-model evidence when an approved runtime is available.

## Related Records

- `constitution:main` - establishes local-first/open-source defaults and evidence-backed behavior.
- `spec:flight-learn-inbox-ux` - now owns optional local-model diagnosis polish requirements REQ-024 through REQ-029 and SCN-008/SCN-009.
- `spec:delta-artifact-learning-loop` - owns human-gated routing and artifact semantics; local model polish must not classify, route, or mutate artifacts.
- `spec:visible-command-surface` - owns the two-command default visible surface; this plan must not add top-level commands.
- `research:20260527-local-diagnosis-model-runtime` - completed runtime investigation; recommendation favors PrismML Bonsai GGUF through explicit loopback `llama.cpp` server, with Bonsai 1.7B as first low-memory validation candidate and 4B/8B as quality fallbacks.
- `evidence:20260527-local-diagnosis-model-contract-harness-validation` - contract harness validation.
- `evidence:20260527-local-diagnosis-model-adapter-validation` - adapter validation.
- `evidence:20260527-flight-learn-local-model-polish-integration-validation` - UI/command integration validation.
- `evidence:20260527-flight-learn-local-model-polish-validation` - final validation with real Pi fallback and blocked real Bonsai proof.
- `plan:20260527-flight-learn-plain-english-diagnosis-cards` - completed deterministic baseline that this plan augments, not replaces.
- `ticket:20260527-flight-learn-diagnosis-view-model` - implemented deterministic display-only helper and tests.
- `ticket:20260527-flight-learn-diagnosis-card-integration` - integrated deterministic diagnosis into focused-card UI.
- `ticket:20260527-flight-learn-diagnosis-real-pi-validation` - proved deterministic diagnosis card in real Pi.
- `src/flight-learn-diagnosis.ts` - current deterministic diagnosis helper and fallback.
- `src/flight-learn-inbox.ts` - focused-card renderer that will consume optional polished display text.
- `src/reflection.ts` - existing model-assisted reflection precedent with bounded/redacted evidence and fallback behavior, though diagnosis polish must be local-only unless a future constitutional/spec change says otherwise.

## Strategy

The model should be a **local paraphraser**, not a source of truth.

Accepted direction:

- deterministic diagnosis remains default, test oracle, and fallback;
- local model polish is opt-in through explicit local configuration or a recoverable `/flight-learn` option, never a new top-level command;
- only local/open-source execution is allowed: local process or loopback endpoint, no hosted provider, telemetry, or non-loopback network;
- no automatic model-weight download during `/flight-learn`;
- model input is a bounded redacted fact packet, not raw sessions or transcripts;
- output is structured JSON with length and content validation;
- invalid/unsafe/slow/unavailable output falls back to deterministic text;
- model output is display-only and must not mutate `ExpectationDelta`, route ranking, artifact candidates, rules, source files, docs, Loom records, skills, or prompts.

The plan is research-first because choosing a runtime is a real architecture/trust decision. Implementation must not smuggle in a hosted provider, a package dependency, or automatic install behavior just because it is convenient.

Likely runtime shape to evaluate:

- PrismML Bonsai 1-bit as the operator-preferred first candidate because its Apache-2.0 models target very low memory footprints and local/open-source runtimes;
- Bonsai GGUF through llama.cpp as the likely most portable adapter path if Q1_0 support is available in the installed/upstream runtime;
- Bonsai MLX as an Apple-Silicon-specific option if the required 1-bit MLX support is acceptable;
- a local loopback API such as Ollama only if it can run the selected local model without hosted/provider behavior and is already installed/configured;
- other local CLI/server wrappers only if Bonsai proves unsuitable;
- a Node-native/local library only if dependency and packaging impact remain acceptable.

Rejected paths:

- using Pi's hosted/active model provider for this UI path;
- calling OpenAI/Anthropic/Gemini/MotherDuck/etc. or any non-loopback endpoint;
- downloading weights automatically in package install or first run;
- making local model availability required for `/flight-learn`;
- storing model-written diagnosis text back into the delta by default;
- treating model output as a route recommendation or classifier label.

Replanning triggers:

- no acceptable local/open-source runtime can be found without violating package/privacy constraints;
- the only viable runtime requires dependency/package changes larger than this plan's ticket scope;
- validation shows the small local model routinely hallucinates, leaks raw details into primary text, or makes the UI slower/confusing;
- local model invocation cannot be bounded to redacted facts and strict fallback.

## Execution Units

### Unit: Local runtime research and adapter decision

Ticket: ticket:20260527-local-diagnosis-model-runtime-research

Investigate small local/open-source model runtime options for diagnosis phrasing and produce a completed research record with the recommended adapter boundary, rejected paths, privacy constraints, and validation preconditions. This unit must not edit source. It should decide whether the next implementation should target a loopback API, CLI process, or other local adapter, and what explicit configuration should enable it.

### Unit: Prompt contract and validator harness

Ticket: ticket:20260527-local-diagnosis-model-contract-harness
Depends On: ticket:20260527-local-diagnosis-model-runtime-research

Implement the model-agnostic prompt/fact-packet builder, response schema, validator, timeout/fallback wrapper, and fake-provider tests. This ticket should prove bounded redaction, structured JSON validation, unsafe output rejection, and deterministic fallback without depending on a real local model runtime.

### Unit: Opt-in local runtime adapter

Ticket: ticket:20260527-local-diagnosis-model-adapter
Depends On: ticket:20260527-local-diagnosis-model-contract-harness

Implement the chosen local runtime adapter from the research ticket behind explicit local configuration. The adapter must only call a local process or loopback endpoint, must fail closed, and must not add visible command clutter or default model behavior. If the chosen runtime is not available in the environment, the ticket should still be able to validate adapter fallback with mocks and record real-runtime validation as deferred to the final validation ticket.

### Unit: Focused-card optional polish integration

Ticket: ticket:20260527-flight-learn-local-model-polish-integration
Depends On: ticket:20260527-local-diagnosis-model-adapter

Wire optional local-model polish into `/flight-learn` focused-card rendering. The UI should open normally with deterministic text when disabled/unavailable, and use validated model phrasing only when explicitly enabled. The card should disclose local model polish unobtrusively and preserve edit/route/evidence/editor/storage behavior.

### Unit: Local-model validation and real Pi proof

Ticket: ticket:20260527-flight-learn-local-model-polish-validation
Depends On: ticket:20260527-flight-learn-local-model-polish-integration

Validate the full path. At minimum, fake local-provider tests and a disposable real Pi fallback/disabled run must pass. If an approved local runtime/model is installed or explicitly provided, run a disposable real Pi validation showing model-polished wording, fallback behavior, and candidate-only storage safety. If no approved local runtime/model is available, mark the real-model portion blocked rather than claiming it with mocks.

## Milestones

### Milestone: Runtime choice is justified

Child tickets: ticket:20260527-local-diagnosis-model-runtime-research

The project has a citable research conclusion naming the local runtime strategy, rejected paths, security/privacy constraints, and what evidence is required before local-model claims can be made.

### Milestone: Model output is bounded and safe

Child tickets: ticket:20260527-local-diagnosis-model-contract-harness

A model-agnostic contract can build redacted fact packets, accept valid structured output, reject unsafe/malformed output, and return deterministic fallback without storage or routing side effects.

### Milestone: Local model can be invoked explicitly

Child tickets: ticket:20260527-local-diagnosis-model-adapter

The chosen local adapter exists behind explicit opt-in and fails closed when unavailable, without hosted/network/default model behavior.

### Milestone: `/flight-learn` can use local polish without changing semantics

Child tickets: ticket:20260527-flight-learn-local-model-polish-integration

The focused-card UI can show validated local-model phrasing when enabled, but route/editor/evidence/candidate-only storage behavior remains unchanged.

### Milestone: Real-world proof is honest

Child tickets: ticket:20260527-flight-learn-local-model-polish-validation

Evidence either proves the full path with an approved local runtime/model in disposable real Pi, or records the real-model validation as blocked while preserving fake-provider and deterministic fallback evidence.

## Current State

Closed. All five execution tickets are closed:

- `ticket:20260527-local-diagnosis-model-runtime-research` - closed; researched Bonsai/`llama.cpp` and recommended explicit loopback `llama.cpp` server, Bonsai 1.7B GGUF Q1_0 first.
- `ticket:20260527-local-diagnosis-model-contract-harness` - closed; implemented bounded redacted fact packet, prompt, structured response validation, timeout/fallback, and fake-provider tests.
- `ticket:20260527-local-diagnosis-model-adapter` - closed; implemented explicit `llama-cpp-server` loopback adapter with proxy-safe direct HTTP agent, no dependencies/downloads/runtime lifecycle, and audit `clear`.
- `ticket:20260527-flight-learn-local-model-polish-integration` - closed; wired optional display-only polish into focused-card `/flight-learn` behind explicit flags without changing command surface or routing/storage semantics, and audit `clear`.
- `ticket:20260527-flight-learn-local-model-polish-validation` - closed as validation complete with real-model proof blocked; focused tests/typecheck/build/full tests passed, real Pi fallback and candidate-only route safety were validated, and audit `clear` preserved the limitation.

Result: optional local-model diagnosis polish is implemented as guarded display-only phrasing. Initial closure left actual real Bonsai/`llama.cpp` model behavior unproven, but follow-up `ticket:20260527-real-bonsai-local-model-validation` later ran an operator-approved real Bonsai 1.7B GGUF Q1_0 / `llama.cpp` validation. It proves the real local-model path can work on one supported synthetic fixture and preserve candidate-only safety. Do not broaden that into a claim about arbitrary delta quality, long-run latency distribution, memory across environments, or all Bonsai model sizes.

## Journal

- 2026-05-27: Created plan after operator agreed that a small local model would be preferable for phrasing, provided the deterministic path remains fallback and the model is local/open-source, opt-in, bounded, validated, and display-only.
- 2026-05-27: Operator named PrismML Bonsai 1-bit as the preferred candidate because of its low memory footprint. Updated runtime research scope to evaluate Bonsai first, especially GGUF/llama.cpp portability versus MLX Apple-Silicon specialization.
- 2026-05-27: Created `research:20260527-local-diagnosis-model-runtime` with preliminary Bonsai source findings and created the remaining child tickets: `ticket:20260527-local-diagnosis-model-contract-harness`, `ticket:20260527-local-diagnosis-model-adapter`, `ticket:20260527-flight-learn-local-model-polish-integration`, and `ticket:20260527-flight-learn-local-model-polish-validation`.
- 2026-05-27: Executed and closed all child tickets with evidence and audits. Closed plan with real Bonsai/`llama.cpp` behavior explicitly blocked/unproven until an approved local runtime/model is available.
- 2026-05-27: After operator approval, completed `ticket:20260527-real-bonsai-local-model-validation`. Real Bonsai 1.7B Q1_0 via `llama.cpp` worked for one supported fixture and was validated in real Pi with local-model disclosure and candidate-only route safety; broad quality remains unproven.
