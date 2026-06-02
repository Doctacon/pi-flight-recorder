# Flight Learn Qwen3 4B Instruct Local Evaluation

ID: ticket:20260602-flight-learn-qwen3-4b-instruct-eval
Type: Ticket
Status: closed
Created: 2026-06-02
Updated: 2026-06-02
Risk: medium - this downloads and evaluates a new local model candidate over synthetic/redacted data, but must not change product source or privacy/trust boundaries.
Priority: high - current Bonsai 4B path is no-go and model-enabled comprehension remains blocked.

## Summary

Evaluate Qwen3-4B-Instruct-2507 Q4_K_M as a replacement local model candidate for `/flight-learn` card-copy comprehension. The operator explicitly selected this model with “let's try Qwen3-4B-Instruct-2507 Q4_K_M,” which authorizes downloading and evaluating that exact model candidate, but not any other model, runtime, provider, or product integration.

Single closure claim: the project has privacy-safe evidence showing whether Qwen3-4B-Instruct-2507 Q4_K_M can produce enough safe product-gated `/flight-learn` model-enabled card-copy renders to justify downstream comprehension validation, or an honest no-go/blocker explaining why it cannot.

## Related Records

- `research:20260602-small-local-model-options-for-flight-learn` - identifies Qwen3-4B-Instruct-2507 Q4_K_M as the strongest Apache/open-license candidate if memory allows.
- `plan:20260602-flight-learn-model-enabled-comprehension-repair` - current repair plan blocked after same-model Bonsai no-go; this ticket is an operator-authorized different-model branch.
- `ticket:20260602-flight-learn-card-copy-prompt-schema-variants` - closed no-go evidence for current Bonsai variants.
- `audit:20260602-flight-learn-card-copy-prompt-schema-variants-review` - says product repair remains blocked and a different authorized local model is a valid next direction.
- `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` - remains blocked unless a replay produces enough safe real model-enabled cards.
- `spec:flight-learn-inbox-ux` REQ-033 through REQ-048 and SCN-011 through SCN-015 - behavior and trust-boundary contract any model candidate must satisfy.
- `src/flight-learn-local-diagnosis-model.ts` - product prompt/validation/fact-packet seam to use read-only.
- `src/flight-learn-llama-cpp-adapter.ts` - product llama.cpp adapter seam to use read-only.
- `src/flight-learn-inbox.ts` - focused-card renderer seam to use read-only for render artifacts if practical.

## Scope

In scope:

- Download/cache exactly Qwen3-4B-Instruct-2507 Q4_K_M GGUF if not already present, preferably from `bartowski/Qwen_Qwen3-4B-Instruct-2507-GGUF` file `Qwen_Qwen3-4B-Instruct-2507-Q4_K_M.gguf`, or another clearly equivalent GGUF source if the preferred source is unavailable and the source/license is recorded.
- Record model source, license/source notes, file size, SHA256, and cache status without writing raw local absolute paths into Loom.
- Run local `llama-server` loopback-only with this model using the existing installed runtime; no runtime install/build/upgrade.
- Use synthetic/redacted representative `/flight-learn` cases only.
- Exercise the current product card-copy path first: `buildFlightLearnDiagnosisViewWithLocalPolish` through `createLlamaCppLocalDiagnosisPolishOptions` and the focused-card renderer where practical.
- Record parse-valid, schema-valid, product-gate pass, display state, narrative status, field coverage, fallback reasons, unsafe rejections, timeouts/errors, latency, approximate observed memory/RSS when practical, render width checks, and hidden-internals checks.
- If the exact product path has transport/model-template issues, record the blocker and do not silently switch to a different runtime/model path.
- Update `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` only if the gate rule below passes; otherwise keep it blocked.

Out of scope:

- Product source, tests, docs, package files, configs, specs, plans, or research changes except this ticket/evidence and downstream blocked-ticket state if the gate passes or fails.
- Downloading any other model, quantization, runtime, dependency, or package.
- Hosted inference, non-loopback endpoints, telemetry, custom llama.cpp forks, or model/runtime installs.
- Raw private Pi sessions, raw local paths, secrets, prompts, transcripts, stack traces, raw server logs, or unredacted model output in Loom.
- Product integration, default model selection, command-surface changes, classifier/dogfood collection, route ranking, artifact application, or source/docs/Loom/rule/skill/prompt mutation from model output.

Gate rule:

- To unblock `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation`, this ticket must produce at least five safe real product-gated model-enabled card renders across representative synthetic/redacted cases, with zero unsafe/privacy accepted outputs and no evidence that source-of-truth, route/storage, expected-behavior, evidence, or hidden-provenance boundaries were weakened.
- The intentional safety/adversarial case may correctly fall back and still count as a safety success, but it does not count as one of the five model-enabled renders.
- If the gate is not met, keep comprehension validation blocked and record the no-go/blocker.

Likely first Ralph run:

- Read this ticket, related research/evidence/audit, and source seams.
- Download/cache the exact model if absent, recording provenance and checksum.
- Run a bounded synthetic/redacted product replay and render pack.
- Write `evidence:20260602-flight-learn-qwen3-4b-instruct-eval` with artifacts under `.loom/evidence/artifacts/20260602-flight-learn-qwen3-4b-instruct-eval/`.
- Update this ticket to review or blocked. If the gate passes, update downstream comprehension-validation ticket to open with a journal entry; otherwise keep it blocked.

Stop conditions:

- Stop if the model download source is gated, unavailable, not clearly Qwen3-4B-Instruct-2507 Q4_K_M, or requires accepting a license outside the known Qwen Apache/open-weight posture.
- Stop if download or runtime would require installing a tool, changing runtime, using hosted inference, or using a non-loopback endpoint.
- Stop if evidence would require raw private sessions, raw prompts, raw model outputs, raw logs, or unredacted local paths in Loom.
- Stop if Qwen output is accepted despite unsafe/action/mutation/privacy/generated-evidence behavior; record failure and keep downstream validation blocked.
- Stop if server cleanup/listener checks fail.

## Acceptance

- ACC-001: Model provenance and memory footprint are recorded.
  - Evidence: artifact index/runtime provenance includes model source, file name, file size, SHA256, license/source notes, cache status, runtime version, loopback status, and approximate observed memory/RSS when practical.
  - Audit: challenge model identity, source trust, license posture, memory claims, and hidden downloads.

- ACC-002: Product-path replay metrics are recorded honestly.
  - Evidence: summary records parse/schema/product-gate pass, field coverage, fallback reasons, unsafe rejections, timeouts/errors, latency, display states, and gate disposition.
  - Audit: challenge treating schema success, raw model output, or fake-provider success as comprehension.

- ACC-003: Representative render pack exists when product-gated cards exist.
  - Evidence: render artifacts at representative widths for model-enabled successes and fallback/safety cards, plus width/default-hidden-internals checks. If no product-gated cards exist, evidence explains why render pack is fallback-only or blocked.
  - Audit: challenge whether renders reflect product integration and hidden provenance requirements.

- ACC-004: Downstream comprehension gate is reconciled honestly.
  - Evidence: `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` remains blocked or is moved to open strictly according to the gate rule, with current-state/journal update.
  - Audit: challenge premature unblocking or failure to route a positive result.

- ACC-005: Privacy/side-effect boundaries hold.
  - Evidence: privacy scan over artifacts/evidence/tickets, scoped `git diff --check`, source-side-effect/status scan, post-run listener check, no raw logs/output/prompts persisted, and no product/source/storage/routing/classifier side effects.
  - Audit: challenge accidental leakage, stale runtime processes, unrelated source edits, or dogfood/classifier claims.

## Current State

Closed as negative current-product-path evidence. The bounded local Qwen3-4B-Instruct-2507 Q4_K_M evaluation completed and recorded `evidence:20260602-flight-learn-qwen3-4b-instruct-eval` with artifacts under `.loom/evidence/artifacts/20260602-flight-learn-qwen3-4b-instruct-eval/`. Audit `audit:20260602-flight-learn-qwen3-4b-instruct-eval-review` returned `clear` as a bounded evaluation audit with a negative current-product-path outcome.

The exact authorized GGUF was downloaded/cached and evaluated through local loopback `llama-server` using synthetic/redacted `/flight-learn` cases. Result: 8/8 cases timed out under the current 5-second product path, 0/8 parse-valid, 0/8 schema-valid, 0/8 product-gated model-enabled cards, and 8/8 deterministic fallback renders. The downstream comprehension-validation gate did not pass and remains blocked.

This does not prove Qwen3-4B-Instruct-2507 is globally unusable; it proves this model did not work under the current product prompt/schema/5-second timeout path. Any shorter-prompt, longer-timeout, schema, or product repair experiment needs a separate shaped ticket/authorization.

## Journal

- 2026-06-02: Created ticket after operator selected Qwen3-4B-Instruct-2507 Q4_K_M as the next model to try. The authorization is scoped to this exact model candidate and does not permit other model/runtime downloads or product integration.
- 2026-06-02: Set status to active and launched bounded Ralph evaluation run.
- 2026-06-02: Completed bounded local replay. Model provenance recorded (`Qwen_Qwen3-4B-Instruct-2507-Q4_K_M.gguf`, SHA256 `2fde00ce69dd4899c70d020845e2638353015bba0fdf161b3eb965f2bca4464e`, approx 2.33 GiB, Apache-2.0 upstream posture). Product-path metrics were 0/8 parse-valid, 0/8 schema-valid, 0/8 product-gated model-enabled cards, 8/8 timeouts/fallbacks. Gate disposition: keep `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` blocked.
- 2026-06-02: Audit `audit:20260602-flight-learn-qwen3-4b-instruct-eval-review` returned clear as bounded negative current-product-path evidence. Closed ticket; downstream comprehension validation remains blocked.
