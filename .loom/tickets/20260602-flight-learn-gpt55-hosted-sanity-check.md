# Flight Learn GPT-5.5 Hosted Sanity Check

ID: ticket:20260602-flight-learn-gpt55-hosted-sanity-check
Type: Ticket
Status: closed
Created: 2026-06-02
Updated: 2026-06-02
Risk: medium - this intentionally uses a hosted OpenAI model over synthetic/redacted evaluation cases to diagnose whether the current `/flight-learn` model-gating process is itself broken.
Priority: high - repeated local-model failures may be a process/prompt/validator problem rather than only a model-capability problem.

## Summary

Run an explicit hosted frontier-model sanity check for `/flight-learn` card-copy comprehension using the already-authenticated Pi OpenAI/Codex subscription path and `gpt-5.5`, if available. The operator authorized this hosted check in response to repeated local-model failures and wants to know whether the current test/process is broken if a frontier model also fails.

Single closure claim: the project has privacy-safe evidence showing whether `gpt-5.5` can satisfy the same `/flight-learn` prompt/schema/validator gate over the synthetic/redacted card-copy corpus, and if not, whether the observed failure points to transport timeout, prompt/schema/validator process issues, or remaining model-output safety risk.

## Related Records

- `ticket:20260602-flight-learn-small-model-batch-eval` - closed negative current-product-path evidence over four under-4GB local candidates; SmolLM2 surfaced a safety-validator gap.
- `evidence:20260602-flight-learn-small-model-batch-eval` - corpus, metrics, and privacy posture to reuse for comparison.
- `audit:20260602-flight-learn-small-model-batch-eval-review` - confirms local batch as negative current-product-path evidence and downstream comprehension validation remains blocked.
- `ticket:20260602-flight-learn-qwen3-4b-instruct-eval` - prior Qwen3-4B current-product-path timeout evidence.
- `audit:20260602-flight-learn-qwen3-4b-instruct-eval-review` - confirms Qwen current-path result is not a global model-quality conclusion.
- `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` - downstream validation remains blocked unless a gate produces enough safe model-enabled cards; this hosted sanity check should not automatically unblock local-first product validation.
- `evidence:20260602-flight-learn-gpt55-hosted-sanity-check` - hosted frontier sanity-check evidence and artifacts for this ticket.
- `spec:flight-learn-inbox-ux` REQ-033 through REQ-048 and SCN-011 through SCN-015 - model-enabled card copy, source-of-truth, fallback, evidence, and hidden-internals boundaries.
- `src/flight-learn-local-diagnosis-model.ts` - product prompt, fact packet, timeout clamp, and validator seams.
- `src/flight-learn-inbox.ts` - focused-card renderer seam.

## Scope

In scope:

- Use `pi --list-models` and a tiny no-sensitive-data probe to confirm whether the authenticated Pi provider can access `openai-codex/gpt-5.5`.
- Use only the same 8 synthetic/redacted card-copy cases from the small-model batch corpus; do not use private Pi sessions, local paths, stack traces, secrets, transcripts, or real user prompts.
- Use `pi --provider openai-codex --model gpt-5.5` with `--no-tools --no-extensions --no-skills --no-context-files --no-session` and temporary prompt files that are deleted after each call.
- Run two diagnostic modes:
  - **current-product-5s mode**: call `buildFlightLearnDiagnosisViewWithLocalPolish` with a hosted-provider shim and the current 5-second product timeout. This measures whether the current product path can tolerate the hosted transport.
  - **relaxed-validator mode**: call `gpt-5.5` with the exact current product prompt/fact packet but a longer harness timeout, then feed the returned JSON string back through the current product validator/render path using a no-network cached-response provider. This isolates semantic prompt/schema/validator behavior from hosted CLI/network latency.
- Record model availability, provider path, prompt mode, parse/schema/product-gate/safe-product-gate counts, fallback reasons, unsafe rejected/accepted counts, field coverage, latency, and gate disposition.
- Render privacy-safe focused cards at widths 92 and 72 for comparison; omit hosted model-authored display text from Loom artifacts while preserving model-enabled state and metrics.
- Preserve a concise process diagnosis: transport timeout vs parse/schema issue vs validator/safety issue vs pass.

Out of scope:

- Product source/test/docs/config/package changes.
- Product integration, default model selection, hosted provider support in the product, or loosening local-first defaults.
- Opening/downstream comprehension validation solely from a hosted-model result.
- Runtime/tool/package installs or OpenAI auth changes.
- Raw hosted prompts, raw hosted model output, raw server/provider logs, OpenAI credentials/tokens, private Pi sessions, raw local paths, stack traces, transcripts, or secrets in Loom.
- Feeding hosted output into classifier labels, routing, storage, source/docs/Loom mutation, rules, skills, or prompts.

Stop conditions:

- Stop if `gpt-5.5` is not listed/available via the authenticated Pi provider path.
- Stop if the hosted call requires adding credentials, changing auth, installing tools, or using a provider other than the already-authenticated Pi provider path.
- Stop if privacy-safe execution would require real/private Pi data or persisting raw prompts/model outputs.
- Stop if `pi` cannot run with `--no-session` and disabled tools/extensions/skills/context.
- Stop if artifacts would include credentials, raw prompts, raw model output, private paths, transcripts, stack traces, or secrets.

## Acceptance

- ACC-001: Hosted model availability/auth path is verified without exposing credentials.
  - Evidence: model-list/probe artifact records provider/model availability and a tiny no-sensitive-data JSON echo success or honest availability blocker; no credential values are persisted.
  - Audit: challenge whether the run silently used a different model/provider or required hidden credential setup.

- ACC-002: The current product 5-second mode is measured honestly.
  - Evidence: per-case metrics record timeouts/errors/fallbacks/product-gate counts for the current product timeout path.
  - Audit: challenge interpreting hosted-transport timeouts as semantic model failure.

- ACC-003: The relaxed-validator mode isolates prompt/schema/validator behavior.
  - Evidence: per-case metrics record parse-valid, schema-valid, product-gated, safe-product-gated, fallback reasons, unsafe accepted/rejected signals, field coverage, and latency using the exact current product prompt and validator.
  - Audit: challenge treating relaxed mode as product integration or operator comprehension validation.

- ACC-004: Process diagnosis is explicit and bounded.
  - Evidence: evidence dossier classifies the outcome as pass, transport-timeout issue, parse/schema issue, validator/safety issue, or mixed, with rationale tied to observed metrics.
  - Audit: challenge overclaiming frontier-model results, confusing hosted vs local-first requirements, or hiding that prompt/validator may be too strict.

- ACC-005: Privacy and side-effect boundaries hold.
  - Evidence: raw prompts/output omitted, temp files deleted, no product source changes, no sessions created for the hosted calls, scoped `git diff --check`, privacy scan, and source-side-effect scan.
  - Audit: challenge accidental prompt/output/log/credential leakage or unintended product changes.

## Current State

Closed as hosted diagnostic mixed-failure evidence. The bounded hosted sanity-check run completed using `openai-codex/gpt-5.5` through the already-authenticated Pi provider path and the synthetic/redacted 8-case corpus only.

Result: mixed diagnostic failure. Current-product-5s mode timed out 8/8 hosted CLI calls. Relaxed-validator mode isolated transport with a 60-second harness timeout and got 8/8 parse-valid, 8/8 schema-compatible responses, but the current product validator rejected all 8 outputs: 3 unsupported-facts and 5 unsafe-output. Product-gated and safe product-gated counts were 0/8 in both modes.

Evidence is recorded in `evidence:20260602-flight-learn-gpt55-hosted-sanity-check`; artifacts are under `.loom/evidence/artifacts/20260602-flight-learn-gpt55-hosted-sanity-check/`. Audit `audit:20260602-flight-learn-gpt55-hosted-sanity-check-review` returned `clear` for closing as diagnostic mixed-failure evidence. Downstream `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` remains blocked because hosted frontier evidence alone is not a local-first safe model-enabled render pack and produced 0 product-gated cards.

## Journal

- 2026-06-02: Created after operator explicitly authorized trying the already-authenticated OpenAI subscription path with `gpt-5.5` to test whether the current model-gating process is broken. Scope is limited to synthetic/redacted hosted sanity evidence; no product integration or local-first policy change is authorized.
- 2026-06-02: Set status to active and launched bounded hosted sanity-check execution run.
- 2026-06-02: Completed hosted sanity-check run and moved to review. `gpt-5.5` was available and the tiny probe passed; current-product-5s timed out 8/8; relaxed-validator produced 8/8 parse/schema-compatible responses but 0/8 product-gated cards due to product validator rejections. Downstream comprehension validation remains blocked.
- 2026-06-02: Audit `audit:20260602-flight-learn-gpt55-hosted-sanity-check-review` returned `clear` for closure as diagnostic mixed-failure evidence. Closed ticket; next recommended work is a local-first prompt/schema/validator repair ticket with a privacy-safe rejection-inspection mechanism.
