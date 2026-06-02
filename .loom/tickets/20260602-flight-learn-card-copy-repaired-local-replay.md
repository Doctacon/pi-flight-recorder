# Flight Learn Card Copy Repaired Local Replay

ID: ticket:20260602-flight-learn-card-copy-repaired-local-replay
Type: Ticket
Status: closed
Created: 2026-06-02
Updated: 2026-06-02
Risk: medium - this is evidence work over synthetic/redacted data, but its gate decides whether operator comprehension validation can restart.
Priority: high - hosted diagnostics and fake-provider tests cannot unblock local-first model-enabled validation.
Depends On: ticket:20260602-flight-learn-card-copy-validator-contract-repair

## Summary

Replay the repaired `/flight-learn` card-copy product path against representative synthetic/redacted cases and explicitly authorized local/open model runtimes. SmolLM2 1.7B Q4_K_M is the first target because it was the only fast schema-valid local candidate, but it was not safe under current gates. Already cached Bonsai/Qwen/SmolLM3/Phi candidates may be replayed if useful and still within authorization; no new downloads or runtime changes are allowed without fresh operator authorization.

Single closure claim: audited local/open replay evidence shows whether the repaired product path produces enough safe product-gated model-enabled cards to reopen downstream operator comprehension validation, or whether model-enabled comprehension remains blocked.

## Related Records

- `plan:20260602-flight-learn-prompt-validator-contract-repair` - parent plan and gate strategy.
- `ticket:20260602-flight-learn-card-copy-validator-contract-repair` - prerequisite product contract repair.
- `spec:flight-learn-inbox-ux` REQ-049 through REQ-054 and SCN-016 through SCN-018 - replay gate behavior and local-first validation constraints.
- `evidence:20260602-flight-learn-small-model-batch-eval` - baseline local model batch; SmolLM2 was promising but unsafe/not gate-ready.
- `audit:20260602-flight-learn-small-model-batch-eval-review` - confirms local batch did not unblock comprehension and SmolLM2 needs repair first.
- `evidence:20260602-flight-learn-gpt55-hosted-sanity-check` - hosted diagnostic only; not local-first validation evidence.
- `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` - downstream ticket to keep blocked or reopen strictly by this replay gate.
- `src/flight-learn-local-diagnosis-model.ts`, `src/flight-learn-llama-cpp-adapter.ts`, `src/flight-learn-inbox.ts` - product seams to inspect read-only during replay.

## Scope

In scope:

- Build or reuse a synthetic/redacted replay corpus covering repeated workflow, validation/build, stale edit, low-information, safety/adversarial rejection, expected-known, expected-unknown, evidence-summary, and fallback shapes.
- Run the repaired product path through existing local loopback runtime only; one model/server at a time.
- Prefer SmolLM2 1.7B Q4_K_M as first replay target if cached and still authorized. Replay additional already cached/authorized local candidates only when it helps compare repaired behavior without new downloads/installs.
- Record parse-valid, schema-valid, product-gated, safe product-gated, display state, narrative status, field coverage, fallback reasons, unsafe accepted/rejected counts, timeouts/errors, latency, memory/RSS when practical, and gate disposition.
- Produce privacy-safe render artifacts at representative widths, omitting model-authored display text from Loom artifacts when needed while preserving state/metrics.
- Update `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` only if the gate rule passes; otherwise keep it blocked with current-state/journal update.

Out of scope:

- Product source changes. If replay finds a product bug, stop and route a follow-up implementation ticket.
- New model downloads, runtime installs/upgrades, hosted providers, non-loopback endpoints, telemetry, custom forks, dependency changes, or model families not already authorized.
- Raw private Pi sessions, raw local paths, secrets, prompts, transcripts, stack traces, raw server logs, provider logs, or unredacted model output in Loom.
- Operator comprehension validation, dogfood corpus/outcome collection, classifier automation, route ranking, release-readiness claims, or product default model selection.

Gate rule:

- `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` may be moved from blocked to open only if at least one local/open model reaches at least five safe real product-gated model-enabled card renders across representative non-private cases, with zero unsafe/privacy accepted outputs and no evidence that source-of-truth, route/storage, expected-behavior, or evidence boundaries were weakened.
- The intentional safety/adversarial case may correctly fall back and still count as a safety success, but it does not count as one of the five model-enabled renders.
- If fewer than five safe real model-enabled renders exist, close or block honestly and keep comprehension validation blocked.

Likely first Ralph run:

- Start only after `ticket:20260602-flight-learn-card-copy-validator-contract-repair` closes with audit.
- Read parent plan, product repair evidence/audit, small-model batch evidence/audit, downstream comprehension-validation ticket, and product seams.
- Confirm runtime/model cache status and authorization without downloads/installs.
- Run replay sequentially, write evidence under `.loom/evidence/20260602-flight-learn-card-copy-repaired-local-replay.md` with artifacts under `.loom/evidence/artifacts/20260602-flight-learn-card-copy-repaired-local-replay/`, update this ticket to review, and reconcile downstream gate.

Stop conditions:

- Stop if prerequisite product repair is not closed with audit.
- Stop if runtime/model availability would require a new download/install/provider/non-loopback endpoint.
- Stop if replay would require raw private sessions or unredacted local artifacts.
- Stop if unsafe/action-advice/privacy/mutation/generated-evidence output appears to be product-accepted; record failure and do not unblock comprehension validation.
- Stop if server cleanup/listener checks fail.

## Acceptance

- ACC-001: Replay corpus and runtime posture are honest.
  - Evidence: artifact index lists case coverage, model/cache/runtime status, loopback-only status, no-download/no-install status, and authorization/provenance notes.
  - Audit: challenge sample breadth, runtime identity, model authorization, and hidden downloads.

- ACC-002: Product-gate metrics support the disposition.
  - Evidence: per-model summaries record parse/schema/product-gated/safe-product-gated counts, field coverage, fallback reasons, unsafe accepted/rejected counts, timeout/error counts, latency, memory where practical, and gate result.
  - Audit: challenge treating schema success, hosted diagnostics, fake-provider success, or fallback renders as local model-enabled comprehension.

- ACC-003: Representative render pack and hidden-internals checks exist.
  - Evidence: render artifacts at representative widths for model-enabled and fallback/safety cards where available, line-width checks, and default-hidden-internals checks.
  - Audit: challenge whether renders reflect repaired product integration and evidence/provenance boundaries.

- ACC-004: Downstream comprehension validation is reconciled honestly.
  - Evidence: `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` remains blocked or is opened strictly according to the gate rule, with current-state and journal update.
  - Audit: challenge premature unblocking or failure to route a positive gate.

- ACC-005: Privacy/side-effect boundaries hold.
  - Evidence: privacy scan, scoped `git diff --check`, source side-effect/status scan, post-run listener cleanup, no raw logs/output/prompts persisted, and no product/source/storage/routing/classifier side effects.
  - Audit: required before closure.

## Current State

Closed as negative repaired local/open replay evidence. Repaired local/open replay completed without product source/runtime/model/download/provider changes. Current `dist` was rebuilt, then SmolLM2 1.7B Q4_K_M, SmolLM3 3B, Qwen3 1.7B, and Phi-4-mini ran through the repaired product path over 8 synthetic/redacted cases using loopback-only `llama-server` version `9360`.

`evidence:20260602-flight-learn-card-copy-repaired-local-replay` records a negative gate after applying the ticket's safety/adversarial exclusion: all four candidates had 0/8 parse-valid, 0/8 schema-valid, 0/8 product-gated, 0 gate-eligible safe product-gated renders, and 8/8 deterministic fallbacks due to 5s product-path timeouts. Unsafe/privacy accepted output count was 0. Render line-width, hidden-internals, privacy, source side-effect, and listener cleanup checks passed.

Audit `audit:20260602-flight-learn-card-copy-repaired-local-replay-review` returned `clear` and supports closing as negative evidence. Downstream comprehension validation remains blocked; operator comprehension must not be inferred from replay metrics or deterministic fallback renders.

## Journal

- 2026-06-02: Created as third child ticket of `plan:20260602-flight-learn-prompt-validator-contract-repair`; blocked pending audited product contract repair.
- 2026-06-02: Unblocked after `ticket:20260602-flight-learn-card-copy-validator-contract-repair` closed with clear audit. Ready for repaired local/open replay using already authorized/cached models only.
- 2026-06-02: Set status to active and launched bounded repaired local/open replay run.
- 2026-06-02: Repaired local/open replay completed and moved to review. Evidence recorded in `evidence:20260602-flight-learn-card-copy-repaired-local-replay`; after correcting the gate to exclude the intentional safety/adversarial case and running all cached/authorized candidates, no model produced safe product-gated model-enabled renders under the 5s product path. `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` remains blocked.
- 2026-06-02: Audit `audit:20260602-flight-learn-card-copy-repaired-local-replay-review` returned `clear`; closed as negative repaired local/open replay evidence. Further progress requires a new operator/product decision such as shorter prompt, longer timeout, different local runtime/model, or fallback-only validation rescope.
