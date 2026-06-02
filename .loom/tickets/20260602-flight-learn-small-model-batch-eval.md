# Flight Learn Small Model Batch Evaluation

ID: ticket:20260602-flight-learn-small-model-batch-eval
Type: Ticket
Status: closed
Created: 2026-06-02
Updated: 2026-06-02
Risk: medium - this downloads and evaluates multiple new local model candidates over synthetic/redacted data while preserving privacy and product trust boundaries.
Priority: high - Bonsai 4B and Qwen3-4B current-product-path evaluations did not unblock model-enabled comprehension.

## Summary

Evaluate at least four additional local small-model candidates for `/flight-learn` card-copy comprehension, constrained by the operator's memory ceiling: “try at least 4 more models as long as they're under 4GB memory.” This authorizes downloading and evaluating candidate GGUF model files under 4GB each, but not runtime installs, hosted calls, product source changes, or product integration.

Single closure claim: the project has privacy-safe comparative evidence over at least four under-4GB local model candidates showing whether any candidate produces enough safe product-gated `/flight-learn` model-enabled card-copy renders to justify downstream comprehension validation or further repair.

## Related Records

- `research:20260602-small-local-model-options-for-flight-learn` - current model shortlist and license/memory tradeoffs.
- `ticket:20260602-flight-learn-qwen3-4b-instruct-eval` - Qwen3-4B-Instruct-2507 Q4_K_M current-product-path evaluation, closed negative due to timeouts.
- `audit:20260602-flight-learn-qwen3-4b-instruct-eval-review` - confirms Qwen result is negative for current product path but not a global model-quality conclusion.
- `ticket:20260602-flight-learn-card-copy-prompt-schema-variants` - Bonsai same-model variant no-go evidence.
- `audit:20260602-flight-learn-card-copy-prompt-schema-variants-review` - confirms Bonsai same-model product repair remains blocked.
- `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` - downstream validation that remains blocked unless a replay gate produces enough safe real model-enabled cards.
- `evidence:20260602-flight-learn-small-model-batch-eval` - batch result over four under-4GB GGUF candidates.
- `spec:flight-learn-inbox-ux` REQ-033 through REQ-048 and SCN-011 through SCN-015 - behavior and trust-boundary contract all candidates must satisfy.
- `src/flight-learn-local-diagnosis-model.ts` - product prompt/validation/fact-packet seam to use read-only.
- `src/flight-learn-llama-cpp-adapter.ts` - product llama.cpp adapter seam to use read-only.
- `src/flight-learn-inbox.ts` - focused-card renderer seam to use read-only for render artifacts where practical.

## Scope

In scope:

- Select and evaluate at least four candidate GGUF files whose model file size is under 4GB each, prioritizing Apache/MIT/open candidates from the research shortlist.
- Preferred candidates, subject to availability and exact-source verification:
  - SmolLM3 3B Instruct Q4_K_M, preferably `ggml-org/SmolLM3-3B-GGUF` or equivalent upstream-derived GGUF.
  - Qwen3 1.7B Instruct/Chat Q4_K_M or Q5_K_M, exact GGUF source to be verified before download.
  - Phi-4-mini-instruct Q4_K_M, exact GGUF source to be verified before download.
  - SmolLM2 1.7B Instruct Q4_K_M or Q5_K_M, exact GGUF source to be verified before download.
  - Fallback candidates if one preferred candidate is unavailable: Ministral 3B Instruct Q4_K_M, LFM2 1.2B Q4_K_M with explicit license caveat, or another clearly under-4GB Apache/MIT/open small instruct model from the research record.
- Record model source, source/license notes, file name, file size, SHA256, cache status, and why each candidate fits the under-4GB constraint.
- Run existing local `llama-server` loopback-only with each model, no runtime install/build/upgrade.
- Use synthetic/redacted representative `/flight-learn` cases only.
- Exercise the current product card-copy path first for each model: `buildFlightLearnDiagnosisViewWithLocalPolish` through `createLlamaCppLocalDiagnosisPolishOptions`, and the focused-card renderer when product-gated cards or fallback renders are available.
- Record parse-valid, schema-valid, product-gate pass, safe product-gate pass, display state, narrative status, field coverage, fallback reasons, unsafe accepted/rejected counts, timeout/error counts, latency, approximate observed RSS when practical, render width checks, and hidden-internals checks.
- Update `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` only if the gate rule below passes for a model; otherwise keep it blocked.

Out of scope:

- Downloading files 4GB or larger.
- Downloading more than the selected candidate model files and their unavoidable metadata.
- Runtime/tool/package installs, hosted inference, non-loopback endpoints, telemetry, custom llama.cpp forks, or non-GGUF runtime migration.
- Product source, tests, docs, package files, configs, specs, plans, research, or audit changes except this ticket/evidence and downstream blocked-ticket state.
- Product integration, default model selection, command-surface changes, classifier/dogfood collection, route ranking, artifact application, or source/docs/Loom/rule/skill/prompt mutation from model output.
- Raw private Pi sessions, raw local paths, secrets, prompts, transcripts, stack traces, raw server logs, or unredacted model output in Loom.

Gate rule:

- To unblock `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation`, at least one evaluated model must produce at least five safe real product-gated model-enabled card renders across representative synthetic/redacted cases, with zero unsafe/privacy accepted outputs and no evidence that source-of-truth, route/storage, expected-behavior, evidence, or hidden-provenance boundaries were weakened.
- The intentional safety/adversarial case may correctly fall back and still count as a safety success, but it does not count as one of the five model-enabled renders.
- If no model meets the gate, keep comprehension validation blocked and rank candidates by evidence for future shaped work.

Likely first Ralph run:

- Read this ticket, related research/evidence/audits, downstream validation ticket, and source seams.
- Verify exact candidate repos/files and file sizes before downloading; skip candidates that are unavailable, gated, not clearly under 4GB, or license-caveated beyond the operator's current authorization.
- Download/cache selected candidate files under model-specific cache directories using tilde/redacted paths in Loom records.
- Evaluate models sequentially to avoid overlapping llama-server state and memory pressure.
- Write `evidence:20260602-flight-learn-small-model-batch-eval` with artifacts under `.loom/evidence/artifacts/20260602-flight-learn-small-model-batch-eval/`.
- Update this ticket to review or blocked. If the gate passes, update downstream comprehension-validation ticket to open with a journal entry; otherwise keep it blocked.

Stop conditions:

- Stop if fewer than four under-4GB candidates can be safely selected/downloaded without new authorization.
- Stop if downloads require accepting new non-open license terms not already accepted in this ticket's model shortlist context.
- Stop if any evaluation would require installing tools, changing runtime, using hosted inference, or using non-loopback endpoints.
- Stop if evidence would require raw private sessions, raw prompts, raw model outputs, raw logs, or unredacted local paths in Loom.
- Stop if a model output is accepted despite unsafe/action/mutation/privacy/generated-evidence behavior; record the failure and do not unblock downstream validation.
- Stop if server cleanup/listener checks fail.

## Acceptance

- ACC-001: At least four under-4GB model candidates are evaluated or an honest blocker explains why fewer could be safely evaluated.
  - Evidence: artifact index/model provenance records candidate source, file name, file size, SHA256, license/source notes, cache status, runtime version, loopback status, and approximate observed RSS when practical.
  - Audit: challenge model identity, source trust, license posture, under-4GB claims, hidden downloads, and skipped candidates.

- ACC-002: Product-path replay metrics are recorded per model.
  - Evidence: summary records parse/schema/product-gate pass, safe product-gate pass, field coverage, fallback reasons, unsafe rejections/accepted counts, timeouts/errors, latency, display states, and gate disposition for each model.
  - Audit: challenge treating schema success, raw model output, fake-provider success, or fallback renders as comprehension.

- ACC-003: Comparative recommendation is explicit.
  - Evidence: evidence record ranks candidates as proceed-to-comprehension-gate, promising-but-needs-prompt/timeout/schema repair, no-go-current-path, or blocked, with rationale tied to metrics and trust boundaries.
  - Audit: challenge overclaiming small sample results or model reputation.

- ACC-004: Downstream comprehension gate is reconciled honestly.
  - Evidence: `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` remains blocked or is moved to open strictly according to the gate rule, with current-state/journal update.
  - Audit: challenge premature unblocking or failure to route a positive result.

- ACC-005: Privacy/side-effect boundaries hold.
  - Evidence: privacy scan over artifacts/evidence/tickets, scoped `git diff --check`, source-side-effect/status scan, post-run listener checks, no raw logs/output/prompts persisted, and no product/source/storage/routing/classifier side effects.
  - Audit: challenge accidental leakage, stale runtime processes, unrelated source edits, or dogfood/classifier claims.

## Current State

Closed as negative current-product-path comparative evidence. The bounded batch evaluation completed over four under-4GB GGUF candidates: SmolLM3 3B Q4_K_M, Qwen3 1.7B Q4_K_M, Phi-4-mini-instruct Q4_K_M, and SmolLM2 1.7B Instruct Q4_K_M. All four were source/size checked, downloaded to local cache, and evaluated sequentially through the current product path with the existing loopback-only `llama-server`.

No candidate met the downstream gate. SmolLM2 was the only promising candidate for future repair (8/8 parse/schema valid, 4/8 product-gated, 2/8 safe product-gated, 0 timeouts), but it also had 2 product-accepted unsafe-category outputs and therefore cannot unblock comprehension validation. SmolLM3, Qwen3 1.7B, and Phi-4-mini all timed out 8/8 under the current 5s all-field product path.

Evidence is recorded in `evidence:20260602-flight-learn-small-model-batch-eval`; artifacts are under `.loom/evidence/artifacts/20260602-flight-learn-small-model-batch-eval/`. Audit `audit:20260602-flight-learn-small-model-batch-eval-review` returned `concerns` only for a noncanonical evidence header; that header was normalized before closure. Downstream `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` remains blocked.

## Journal

- 2026-06-02: Created ticket after operator requested trying at least four more models under 4GB memory. Authorization is scoped to under-4GB local GGUF candidate downloads/evaluation and does not permit product integration, runtime installs, hosted calls, or non-loopback endpoints.
- 2026-06-02: Set status to active and launched bounded Ralph batch-evaluation run.
- 2026-06-02: Completed batch evaluation and moved to review. Result: no candidate met the gate; downstream comprehension validation remains blocked. SmolLM2 is the only follow-up-worthy repair candidate but is unsafe/not gate-ready under the current product validator and prompt/schema path.
- 2026-06-02: Audit `audit:20260602-flight-learn-small-model-batch-eval-review` found one low-severity evidence-header hygiene issue. Normalized `evidence:20260602-flight-learn-small-model-batch-eval` to canonical evidence dossier headers, then closed ticket as negative current-product-path comparative evidence.
