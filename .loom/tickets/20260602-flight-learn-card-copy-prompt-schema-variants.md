# Flight Learn Card Copy Prompt Schema Variants

ID: ticket:20260602-flight-learn-card-copy-prompt-schema-variants
Type: Ticket
Status: closed
Created: 2026-06-02
Updated: 2026-06-02
Risk: medium - this experiments with model prompts/schemas and must not turn artifact-local success into product claims.
Priority: high - same-model repair should be tested before product source changes.
Depends On: ticket:20260602-flight-learn-card-copy-failure-diagnostics

## Summary

Run a bounded artifact-local experiment over repair variants for the current Bonsai 4B Q1_0 `/flight-learn` card-copy path. The experiment should use the diagnostic taxonomy from the prerequisite ticket to choose two or three variants that preserve the product trust boundary while trying to improve real product-gate pass rate above the current 0/8 baseline.

Single closure claim: the project has evidence selecting a same-model prompt/schema/gate repair for product integration, or evidence-backed no-go showing the current Bonsai path should not receive more product prompt churn without a new operator decision.

## Related Records

- `plan:20260602-flight-learn-model-enabled-comprehension-repair` - parent repair strategy.
- `ticket:20260602-flight-learn-card-copy-failure-diagnostics` - prerequisite failure taxonomy that should drive variant choice.
- `ticket:20260531-flight-learn-llm-card-copy-runtime-replay` - current 0/8 real product-gate baseline.
- `evidence:20260529-flight-learn-constrained-judge-replay` - earlier negative Bonsai evidence; warns against equating schema validity with usefulness.
- `research:20260529-flight-learn-comprehension-recovery-options` - prior recovery options and rejected paths.
- `spec:flight-learn-inbox-ux` REQ-033 through REQ-048 and SCN-011 through SCN-015 - requirements variants must preserve.
- `src/flight-learn-local-diagnosis-model.ts` - current prompt/validator seam to inspect read-only.
- `src/flight-learn-llama-cpp-adapter.ts` - current JSON schema adapter seam to inspect read-only.

## Scope

In scope:

- Use the diagnostic findings to define two or three repair variants.
- Candidate variants may include a shorter product-compatible prompt, lower output burden, clearer omission rules, field-job wording changes, schema simplification that can map back to the current product contract, or stricter prompt separation between display copy and prohibited action/mutation advice.
- Run variants over synthetic/redacted representative cases.
- When explicitly authorized for execution, use the already available Bonsai 4B Q1_0 loopback runtime only; otherwise record `real-runtime-not-run` and keep real usefulness unproven.
- Measure parse-valid, schema-valid, product-gate pass, field coverage, fallback reasons, unsafe rejections, timeout/latency, and representative rendered card shape.
- Write a research/evidence packet recommending integrate/no-go/replan.

Out of scope:

- Product source changes.
- New model families, downloads, installs, hosted/non-loopback calls, telemetry, custom forks, or package dependency changes.
- Broad validator relaxation. Any variant that improves pass rate by allowing route/action advice, mutation instructions, privacy leakage, invented expected behavior, generated evidence, or unsupported source-of-truth claims must be rejected.
- Operator comprehension validation or dogfood corpus collection.

Variant constraints:

- Variants must stay local-first and product-compatible enough that a later implementation ticket can integrate one bounded repair.
- Real-runtime success is product-gated rendered card output, not JSON shape alone.
- Unsafe/action-advice/privacy/mutation output remains fail-closed.
- Field-local omissions are allowed only for unsupported, empty, low-information, or unknown fields when remaining displayed fields pass independently.
- The experiment must not silently authorize a different model/runtime.

Likely first Ralph run:

- Start after `ticket:20260602-flight-learn-card-copy-failure-diagnostics` closes or records a sufficient diagnostic recommendation.
- Read diagnostic evidence, current source seams, and prior Bonsai replay artifacts.
- Build artifact-local variant harness under `.loom/evidence/artifacts/20260602-flight-learn-card-copy-prompt-schema-variants/` or `.loom/research/artifacts/20260602-flight-learn-card-copy-prompt-schema-variants/`.
- Preserve sanitized metrics and render examples.
- Write a research or evidence record and update this ticket to review or blocked.

Stop conditions:

- Stop if diagnostics do not identify plausible prompt/schema/gate repair targets.
- Stop if every plausible variant requires weakening a non-negotiable safety/privacy/source-of-truth gate.
- Stop if real runtime would require a new download/install/provider or non-loopback endpoint.
- Stop if variant evidence cannot be recorded without raw private data or unredacted model output.

## Acceptance

- ACC-001: Variant set is justified by diagnostics.
  - Evidence: variant matrix cites diagnostic categories from the prerequisite ticket and explains what each variant tests.
  - Audit: challenge speculative variants unrelated to observed failures.

- ACC-002: Same-model metrics are recorded honestly.
  - Evidence: aggregate and per-case metrics compare variants against the 0/8 product-gate baseline, separating parse/schema validity from product-gated rendered cards.
  - Audit: challenge metric laundering, denominator games, and ignoring fallback/timeout/unsafe cases.

- ACC-003: Safety and source-of-truth invariants hold in the experiment.
  - Evidence: unsafe accepted count is zero, generated evidence/route/mutation/expected-behavior invention cases fail closed, and privacy scans pass.
  - Audit: challenge any variant that improves pass rate by weakening gates.

- ACC-004: Integration recommendation is explicit.
  - Evidence: record recommends one of: integrate selected variant, no-go same-model path, or replan for operator-authorized different model/fallback-only validation. Recommendation includes threshold rationale and residual risks.
  - Audit: challenge whether evidence is strong enough to justify source changes.

- ACC-005: No product source changes occur.
  - Evidence: scoped diff/status confirms writes are limited to Loom evidence/research/artifacts and this ticket.
  - Audit: challenge accidental product edits or dependency/config changes.

## Current State

Closed as no-go same-model variant evidence. The bounded artifact-local same-model experiment completed and recorded `evidence:20260602-flight-learn-card-copy-prompt-schema-variants` with artifacts under `.loom/evidence/artifacts/20260602-flight-learn-card-copy-prompt-schema-variants/`. Audit `audit:20260602-flight-learn-card-copy-prompt-schema-variants-review` returned `concerns` for future integration but clear to close this ticket as no-go evidence.

Real Bonsai 4B Q1_0 ran through loopback-only `llama-server`; checksum matched; no downloads, installs, hosted calls, non-loopback endpoints, telemetry, custom forks, raw prompts, raw model responses, raw server logs, private sessions, raw local paths, secrets, transcripts, or stack traces were persisted. Product source remained read-only and source fingerprints were unchanged.

Variants tested: `short-all-fields`, `core-four-fields`, and `flag-evidence-lite`. All 24 variant responses were parse/schema valid and had zero timeouts, so shorter/lower-burden prompts fixed the timeout symptom. However, `short-all-fields` and `core-four-fields` produced 0/8 product-validation passes; `flag-evidence-lite` produced 6/8 product-gate-equivalent passes but only for `evidenceSummary`, and one product-validator accepted output carried a non-negotiable mutation-like signal caught by the experiment guard.

No variant earned product integration. This ticket does not unblock `ticket:20260602-flight-learn-card-copy-product-repair`, repaired runtime replay, or operator comprehension validation. Continuing the model-enabled comprehension repair now requires operator/product direction: authorize a different local model/runtime, shape a different prompt-family/research path, or explicitly rescope to fallback-only/evidence-summary-only UX with separate validator repair.

## Journal

- 2026-06-02: Created as the second child ticket of `plan:20260602-flight-learn-model-enabled-comprehension-repair`; blocked until failure diagnostics close or provide enough evidence to choose variants.
- 2026-06-02: Unblocked after `ticket:20260602-flight-learn-card-copy-failure-diagnostics` closed with clear audit. Variant work is limited to artifact-local same-model experiments and must not edit product source.
- 2026-06-02: Set status to active and launched bounded Ralph variant experiment run. Existing Bonsai 4B Q1_0 loopback runtime remains authorized; no downloads/installs/hosted calls are permitted.
- 2026-06-02: Completed artifact-local same-model variant experiment. Evidence recorded at `evidence:20260602-flight-learn-card-copy-prompt-schema-variants`. Shorter prompts removed timeouts, but no tested variant produced an integration-worthy model-enabled comprehension path; ticket moved to review pending audit.
- 2026-06-02: Audit `audit:20260602-flight-learn-card-copy-prompt-schema-variants-review` returned concerns for future integration but clear to close as no-go evidence. Closed ticket and kept product repair blocked.
