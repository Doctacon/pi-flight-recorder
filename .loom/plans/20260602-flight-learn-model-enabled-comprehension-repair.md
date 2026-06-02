# Flight Learn Model-Enabled Comprehension Repair

ID: plan:20260602-flight-learn-model-enabled-comprehension-repair
Type: Plan
Status: open
Created: 2026-06-02
Updated: 2026-06-02
Risk: high - this plan repairs the local-model comprehension path that gates whether `/flight-learn` can collect trustworthy human routing labels without weakening privacy or source-of-truth boundaries.

## Summary

This plan repairs the model-enabled `/flight-learn` comprehension path after the all-field card-copy runtime replay closed as negative real-runtime evidence. The product renderer and fake-provider path can show safe authored card copy, but the current Bonsai 4B Q1_0 local runtime produced 0/8 product gate passes, so the successor operator comprehension validation has no real model-enabled cards to review.

The desired outcome is not “make the model pass at any cost.” The desired outcome is: either the current explicitly authorized local Bonsai path is repaired enough to produce privacy-safe, product-gated, model-enabled card renders for operator comprehension validation, or the project records an evidence-backed no-go that routes to a new operator decision such as a different authorized local model or fallback-only validation.

This needs multiple tickets because the next honest move is evidence-first diagnosis, then a bounded prompt/schema/gate experiment, then product integration only if a repair variant earns it, then a real runtime replay gate before any comprehension validation or corpus collection resumes.

## Related Records

- `plan:20260531-flight-learn-llm-authored-card-copy` - parent card-copy plan whose runtime replay closed negative and whose successor comprehension validation remains blocked.
- `ticket:20260531-flight-learn-llm-card-copy-runtime-replay` - closed negative real-runtime replay: Bonsai 4B Q1_0 produced 0/8 product gate passes and 8/8 deterministic fallbacks.
- `audit:20260531-flight-learn-llm-card-copy-runtime-replay-review` - clear evidence audit that explicitly requires repair, operator decision, another authorized local model, or fallback-only rescope before model-enabled comprehension validation.
- `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` - existing successor comprehension validation ticket; remains blocked until this repair plan produces enough safe real model-enabled renders or is explicitly rescoped.
- `spec:flight-learn-inbox-ux` REQ-033 through REQ-048 and SCN-011 through SCN-015 - current behavior contract for model-enabled comprehension, local LLM draft/card-copy display, hidden evidence, expected-behavior truthfulness, and fallback safety.
- `research:20260529-flight-learn-comprehension-recovery-options` - prior conclusion that schema validity is not semantic usefulness and that display draft, accepted narrative, and deterministic fallback must stay distinct.
- `evidence:20260529-flight-learn-constrained-judge-replay` - earlier negative accepted-narrative replay; shows current Bonsai 4B has repeatedly failed stricter semantic gates.
- `evidence:20260531-flight-learn-llm-card-copy-runtime-replay` - latest fake/real card-copy replay evidence and render pack.
- `src/flight-learn-local-diagnosis-model.ts` - likely prompt, fact-packet, validation, fallback, and display-state seam.
- `src/flight-learn-llama-cpp-adapter.ts` - likely llama.cpp JSON-schema adapter seam.
- `src/flight-learn-inbox.ts` - renderer seam; should not need changes unless repair changes display-state/card-copy assumptions.

## Strategy

The negative gate is not a reason to weaken the product trust boundary. It is a reason to stop treating the current prompt/schema/gate stack as ready for model-enabled comprehension.

The repair route is evidence-first and same-model-first:

1. **Diagnose the failure shape before changing prompts or gates.** The last replay did not persist raw model output, correctly for privacy, so the project knows only aggregate categories: timeouts and unsafe-output fallbacks. Before editing product source, gather a privacy-safe field-level taxonomy that answers whether failures are prompt length, schema shape, unsupported fact citations, over-broad unsafe detection, action/mutation advice, expected-behavior invention, or model capacity.
2. **Experiment outside product source first.** Run a small set of artifact-local prompt/schema variants against synthetic/redacted cases and the current validator. Variants should optimize for shorter prompts, smaller output burden, explicit omissions for unknown/low-information cases, and product-compatible field jobs. Do not treat JSON/schema success as enough; measure product-gate pass and rendered card usefulness signals.
3. **Integrate only a repair that earns product integration.** Product source changes should be limited to the selected variant or narrowly evidenced validator repair. Do not merge speculative prompt churn, broad gate relaxation, or new model dependencies.
4. **Replay before comprehension validation.** The repaired path must produce enough safe real model-enabled product renders to make operator validation meaningful. If the repaired Bonsai path still yields mostly deterministic fallbacks, keep `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` blocked.

Scope included:

- privacy-safe diagnostic replay over synthetic/redacted cards;
- artifact-local Bonsai prompt/schema/gate experiments using only the already authorized Bonsai 4B Q1_0 local model/runtime when explicitly authorized for execution;
- source implementation of a selected same-model repair when evidence supports it;
- focused tests, render artifacts, typecheck/build/full test as appropriate, privacy scans, and audit;
- gate reconciliation for the existing blocked comprehension-validation ticket.

Scope excluded:

- hosted/non-loopback model calls, telemetry, automatic downloads, or new model families;
- Bonsai 8B, Ternary Bonsai, MLX models, NLI/factuality models, or any other model/runtime unless the operator gives fresh authorization in a later record or launch;
- weakening privacy/safety/source-of-truth gates to increase pass rate;
- allowing model output to route, rank, store truth, create/apply artifacts, edit source/docs/Loom/rules/skills/prompts, or feed classifier labels;
- using raw private Pi sessions, raw local paths, secrets, prompts, transcripts, stack traces, raw server logs, or unredacted model output in Loom;
- dogfood corpus/outcome collection or classifier readiness claims.

Repair invariants:

- Unsafe/action-advice/privacy/mutation output remains fail-closed for the card; do not downgrade those failures into partial display just to recover pass rate.
- Field-local omission is acceptable only for unsupported, low-information, empty, or unknown fields when the remaining displayed fields independently pass hard gates.
- Expected behavior remains fact-bound. Unknown expected behavior must say Pi does not know yet and keep the edit affordance visible.
- Evidence remains deterministic and collapsed by default; model text may summarize bounded evidence only as display copy.
- Real-runtime success means product-gated rendered cards, not parse/schema validity.

Replan triggers:

- Diagnostics show failures are genuine unsafe/action-advice behavior rather than prompt/schema mismatch or benign over-filtering.
- No artifact-local variant produces enough product-gated Bonsai renders within the current timeout/resource envelope.
- A repair requires relaxing privacy, route/action, mutation, source-of-truth, or expected-behavior gates.
- A repair requires a new model/runtime/download/provider without fresh operator authorization.
- Repaired replay still yields too few real model-enabled cards for operator validation.

## Execution Units

### Unit: Failure diagnostics for current card-copy path

Ticket: `ticket:20260602-flight-learn-card-copy-failure-diagnostics`

Produce a privacy-safe diagnostic evidence packet that explains why current Bonsai all-field card-copy responses fail product gates. The ticket should use synthetic/redacted cases and, when explicitly authorized for execution, the already available Bonsai 4B Q1_0 loopback runtime. It should persist only aggregate and sanitized field-level categories, not raw prompts, raw model output, raw server logs, or private sessions.

Scope boundary: evidence dossier, artifact-local harness/scripts, artifacts, and ticket updates only. Product source remains read-only. If a source diagnostic hook appears necessary, stop and route a separate implementation ticket.

Order reason: without this, prompt/gate edits would guess whether the failure is prompt burden, schema shape, timeout, validator false positive, or true unsafe generation.

Validation/audit expectation: artifact index, per-case/per-field failure taxonomy, timeout/latency metrics if runtime runs, privacy scan, scoped diff check, and audit or clear review before downstream tickets treat the diagnosis as reliable.

### Unit: Same-model prompt/schema repair experiment

Ticket: `ticket:20260602-flight-learn-card-copy-prompt-schema-variants`
Depends On: `ticket:20260602-flight-learn-card-copy-failure-diagnostics`

Run a bounded artifact-local experiment over two or three repair variants for the current Bonsai 4B path. Candidate variants may include a shorter product-compatible prompt, lower output burden, clearer omission rules, narrower field jobs, or a product-compatible schema simplification. The experiment should compare product-gate pass, field coverage, timeout/latency, unsafe rejections, and representative rendered cards.

Scope boundary: research/evidence artifacts and artifact-local harnesses only. Do not edit product source. Do not add dependencies or model families. Do not treat a variant as selected unless it preserves the repair invariants and beats the current 0/8 real product-gate baseline.

Order reason: product integration should consume an evidenced variant, not speculative prompt churn.

Validation/audit expectation: variant matrix, sanitized metrics, rendered examples, privacy scan, scoped diff check, and an explicit recommendation: integrate variant, no-go same-model path, or replan for operator-authorized different model.

### Unit: Product repair for selected same-model variant

Ticket: `ticket:20260602-flight-learn-card-copy-product-repair`
Depends On: `ticket:20260602-flight-learn-card-copy-prompt-schema-variants`

Implement the selected prompt/schema/validator repair in product source only if the prior experiment identifies a variant worth integrating. The closure claim should be one bounded product repair: the current local-model card-copy path uses the selected variant and preserves all privacy, safety, source-of-truth, expected-behavior, evidence, route, storage, and fallback boundaries.

Scope boundary: likely `src/flight-learn-local-diagnosis-model.ts`, `src/flight-learn-llama-cpp-adapter.ts`, and focused tests. Renderer changes are out of scope unless the selected repair changes a display-state assumption; any larger UI change should become a separate ticket. No docs/package/default command/model changes.

Order reason: only after evidence identifies a repair can source changes be bounded and reviewable.

Validation/audit expectation: focused contract/adapter tests for the selected repair, rejected unsafe/action-advice/privacy/mutation cases, render smoke for model-enabled and fallback states if behavior changes, typecheck/build/full tests as practical, diff check, privacy/source-side-effect scan, evidence dossier, and audit before closure.

### Unit: Repaired Bonsai runtime replay and gate reconciliation

Ticket: `ticket:20260602-flight-learn-card-copy-repaired-runtime-replay`
Depends On: `ticket:20260602-flight-learn-card-copy-product-repair`

Rerun the product adapter/renderer path against the repaired card-copy implementation and the same synthetic/redacted representative corpus. Use the already authorized Bonsai 4B Q1_0 loopback runtime only when explicitly authorized for execution and locally available without downloads/installs. Preserve a real-runtime render pack and update the gate state for the existing comprehension-validation ticket.

Scope boundary: evidence/harness/artifacts and ticket updates. Product source changes are out of scope; if replay finds a new product bug, stop and route a follow-up implementation ticket. Updating `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` from blocked to open is allowed only if acceptance in this ticket supports it.

Order reason: operator comprehension validation needs real model-enabled cards, not only fake-provider or artifact-local experiment success.

Validation/audit expectation: parse/schema/product-gate pass metrics, field coverage by field, fallback reasons, unsafe rejection counts, latency, render pack at representative widths, hidden-internals check, post-run listener check, privacy scan, diff check, and audit before unblocking comprehension validation.

Gate rule: unblocking `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` requires at least five safe real product-gated model-enabled renders across representative non-private cases, zero unsafe/privacy accepted outputs, and no evidence that the repair weakened source-of-truth or route/storage boundaries. If fewer than five safe real model-enabled cards exist, close as negative or blocked evidence and keep comprehension validation blocked.

## Milestones

### Milestone: Failure shape is known

Child ticket: `ticket:20260602-flight-learn-card-copy-failure-diagnostics`

The project has a privacy-safe taxonomy explaining the current 0/8 real product-gate result well enough to choose repair experiments without guessing from aggregate fallback counts.

### Milestone: Same-model repair candidate is selected or rejected

Child ticket: `ticket:20260602-flight-learn-card-copy-prompt-schema-variants`

The project has artifact-local evidence showing whether a Bonsai 4B prompt/schema/gate repair is worth integrating. A no-go result is an acceptable milestone outcome if it is evidence-backed.

### Milestone: Product path carries only an evidenced repair

Child ticket: `ticket:20260602-flight-learn-card-copy-product-repair`

The source path changes only when a selected variant earns integration, and the implementation preserves the local-first, display-only, human-gated, deterministic-source-of-truth boundaries.

### Milestone: Comprehension validation gate is honestly reconciled

Child ticket: `ticket:20260602-flight-learn-card-copy-repaired-runtime-replay`

The project knows whether repaired Bonsai card copy produces enough real product-gated model-enabled renders to unblock the existing operator comprehension validation, or whether the plan must return to operator choice.

## Current State

Open. The operator selected the repair path for model-enabled comprehension after the previous runtime replay and audit showed the current Bonsai 4B all-field card-copy path produced no product-gated model-enabled cards. No implementation has started for this plan. The next executable ticket is `ticket:20260602-flight-learn-card-copy-failure-diagnostics`.

`ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` remains blocked until this plan's repaired runtime replay provides enough safe real model-enabled cards or the operator explicitly rescopes validation.

## Journal

- 2026-06-02: Created plan with Status `open` after the operator asked to shape the repair for model-enabled comprehension, not implement it. Child tickets created for diagnostics, artifact-local variants, product repair, and repaired runtime replay/gate reconciliation.
