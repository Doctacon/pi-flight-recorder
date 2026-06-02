# Flight Learn Prompt/Validator Contract Repair

ID: plan:20260602-flight-learn-prompt-validator-contract-repair
Type: Plan
Status: blocked
Created: 2026-06-02
Updated: 2026-06-02
Risk: high - this plan changes the contract that decides whether model-authored `/flight-learn` card copy is safe to show, and mistakes can either hide useful comprehension help or accept unsafe/generated-evidence text.

## Summary

This plan repairs the `/flight-learn` model card-copy prompt/schema/validator contract after repeated local-model failures and the hosted `gpt-5.5` sanity check showed the current process is implicated. The goal is not to make a particular model pass by weakening gates. The goal is to make the gate coherent: hard safety failures still fail closed, non-safety field support failures can be diagnosed and handled field-locally, and any product-gated success must be proven by a local/open runtime replay before operator comprehension validation resumes.

This needs multiple tickets because the next honest move is not implementation first. The work must first make validator failures inspectable without leaking raw model text, then repair the prompt/validator contract against the updated spec, then replay with local/open models to decide whether downstream comprehension validation can reopen.

## Related Records

- `spec:flight-learn-inbox-ux` REQ-049 through REQ-054 and SCN-016 through SCN-018 - new behavior contract for hard-vs-field-local validation, non-brittle support checks, privacy-safe rejection diagnostics, hosted diagnostic limits, and local replay gates.
- `evidence:20260602-flight-learn-gpt55-hosted-sanity-check` - hosted diagnostic evidence: current 5s path timed out 8/8; relaxed validator got 8/8 parse/schema-compatible `gpt-5.5` responses but 0/8 product-gated cards due to validator rejections.
- `audit:20260602-flight-learn-gpt55-hosted-sanity-check-review` - audit verdict `clear`; supports class-level prompt/validator/gate misalignment, but not exact raw-text or regex attribution.
- `evidence:20260602-flight-learn-small-model-batch-eval` - local small-model evidence; SmolLM2 is the only promising local follow-up but exposed unsafe accepted output under current gates.
- `audit:20260602-flight-learn-small-model-batch-eval-review` - confirms SmolLM2 must be treated as a repair lead, not comprehension evidence.
- `plan:20260602-flight-learn-model-enabled-comprehension-repair` - prior Bonsai/same-model repair branch that reached no-go and is superseded for further repair strategy by this plan.
- `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` - downstream operator-comprehension validation; remains blocked until a repaired local/open replay produces enough safe product-gated model-enabled cards.
- `src/flight-learn-local-diagnosis-model.ts` - prompt, fact packet, response validation, fallback, display-state, and likely repair seam.
- `src/flight-learn-llama-cpp-adapter.ts` - local loopback adapter seam for repaired replay; should remain loopback/local-first only.
- `src/flight-learn-inbox.ts` - focused-card rendering seam; should need no broad redesign unless display-state assumptions change.

## Strategy

The frontier-model diagnostic changes the framing. The problem is no longer “find a model that happens to satisfy this contract.” The problem is that the contract appears incoherent or too brittle for its intended product job.

The repair route is contract-first and evidence-first:

1. **Make rejections inspectable without leaking text.** The previous hosted run correctly avoided persisting raw hosted model output, but that means we know only rejection classes. Before changing validators, the project needs a privacy-safe rejection trace: field, category, rule, top-level keys, lengths, hashes, and controlled fixture examples. The trace must not become a raw-output logging path.
2. **Separate hard safety from field support.** Privacy leaks, raw paths, route/action advice, mutation instructions, generated-evidence claims, classifier/ranking claims, and internal provenance leakage remain card-level fail-closed. But unsupported, duplicate, empty, low-information, or unknown non-safety fields should not necessarily erase otherwise safe useful card copy.
3. **Stop treating token novelty as hallucination.** The support check should reject concrete unsupported facts, not ordinary paraphrase, cautious connective language, or domain synonyms needed for readable card copy.
4. **Reduce all-field burden.** The model should be allowed to omit or lose optional fields while still rendering safe core fields, with deterministic fallback for missing/unsupported pieces. Expected behavior remains fact-bound and editable when unknown.
5. **Replay local/open models before validation.** Hosted `gpt-5.5` is diagnostic only. A repaired product path must earn local-first confidence through a local/open replay, with SmolLM2 as the first practical target because it was fast and schema-valid but unsafe under current gates.

Scope included:

- spec-aligned prompt/schema/validator contract repair;
- privacy-safe validator diagnostics and evidence;
- fake-provider/fixture tests for hard safety, field-local omissions, support grounding, expected behavior, and display-only semantics;
- local/open runtime replay using already authorized/cached models where possible, especially SmolLM2;
- downstream gate reconciliation for the existing comprehension-validation ticket.

Scope excluded:

- hosted provider product integration, hosted defaults, or loosening local-first policy;
- automatic model downloads, new model families, runtime installs/upgrades, non-loopback endpoints, telemetry, or custom forks without fresh operator authorization;
- using raw private sessions, raw local paths, secrets, prompts, transcripts, stack traces, raw server logs, or raw model output in Loom;
- weakening hard safety/source-of-truth/route/storage/evidence boundaries to increase pass rate;
- starting operator comprehension validation, dogfood corpus collection, classifier readiness, or route ranking before a repaired local replay gate passes.

Replan triggers:

- Diagnostics show the validator is mostly rejecting genuinely unsafe output rather than brittle support/forbidden-pattern failures.
- Repair requires persisting raw model text, raw prompts, or private data to be diagnosable.
- Repair requires weakening hard privacy/action/mutation/generated-evidence/source-of-truth gates.
- SmolLM2 and other already authorized/cached local models still fail the repaired replay gate for safety or usefulness.
- A viable next step requires a new model/runtime/download/provider that the operator has not authorized.

## Execution Units

### Unit: Privacy-safe validator rejection diagnostics

Ticket: `ticket:20260602-flight-learn-card-copy-validator-diagnostics`

Create a validator diagnostic surface or harness that reports why a card-copy response was rejected without recording raw model text. It should characterize current validator behavior over controlled synthetic fixtures and, if explicitly authorized for the run, local/open model outputs captured only as privacy-safe categories/hashes.

Scope boundary: likely `src/flight-learn-local-diagnosis-model.ts`, focused tests, and Loom evidence/artifact-local harnesses. No product rendering redesign, no model integration, no hosted calls, no raw-output logging.

Order reason: changing validators without exact rejection traces would guess at the GPT/SmolLM2 failures and risk either over-relaxing safety or preserving the current brittle contract.

Validation/audit expectation: tests for category/rule reporting and no raw-text persistence; evidence dossier with per-field rejection taxonomy; privacy scan; typecheck/build/focused tests; audit before downstream repair relies on the diagnostics.

### Unit: Prompt/schema/validator contract repair

Ticket: `ticket:20260602-flight-learn-card-copy-validator-contract-repair`
Depends On: `ticket:20260602-flight-learn-card-copy-validator-diagnostics`

Implement the spec-aligned repair: hard safety remains card-level fail-closed, non-safety field failures become omittable/deterministic when enough core safe copy remains, support validation rejects concrete unsupported facts rather than ordinary paraphrase, and the prompt/schema no longer requires all fields to succeed for any model-enabled display.

Scope boundary: likely `src/flight-learn-local-diagnosis-model.ts`, `src/flight-learn-llama-cpp-adapter.ts` only if schema changes require adapter updates, and focused tests. Renderer changes are out of scope unless display-state/card-copy assumptions must be represented; broad UI redesign is out of scope.

Order reason: source repair must be driven by diagnostics and the updated spec, not by model-shopping pressure.

Validation/audit expectation: fake-provider fixture tests for safe paraphrase, unsupported concrete facts, expected-known/unknown, generated evidence, route/action/mutation advice, privacy leaks, raw path/session text, and field-local omissions; render smoke if display states change; evidence and audit before closure.

### Unit: Repaired local/open runtime replay

Ticket: `ticket:20260602-flight-learn-card-copy-repaired-local-replay`
Depends On: `ticket:20260602-flight-learn-card-copy-validator-contract-repair`

Replay the repaired product path with local/open model runtime(s), starting with SmolLM2 1.7B Q4_K_M if still cached/available because it was the only fast schema-valid local candidate. Already cached Bonsai/Qwen/SmolLM3/Phi candidates may be replayed if useful and still within authorization, but no new downloads or runtime changes are allowed without fresh operator authorization.

Scope boundary: evidence/harness/artifacts and ticket updates. Product source changes are out of scope. If replay reveals a source bug, stop and route a follow-up implementation ticket.

Order reason: hosted diagnostics and fake-provider tests cannot unblock local-first operator comprehension validation. The repaired path must prove itself against real local/open runtime behavior.

Validation/audit expectation: per-model parse/schema/product-gate/safe-product-gate metrics, field coverage, fallback reasons, unsafe accepted/rejected counts, latency, memory where practical, render pack, hidden-internals check, privacy scan, post-run listener cleanup, and audit. The existing comprehension-validation ticket may reopen only if the gate below passes.

Gate rule: unblocking `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` requires at least five safe real product-gated model-enabled card renders across representative non-private cases, zero unsafe/privacy accepted outputs, and no evidence that source-of-truth, route/storage, expected-behavior, or evidence boundaries were weakened. The intentional safety/adversarial case may correctly fall back and still count as a safety success, but it does not count as one of the five model-enabled renders.

### Unit: Operator comprehension validation after local replay

Ticket: `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation`
Depends On: `ticket:20260602-flight-learn-card-copy-repaired-local-replay`

Use the existing downstream validation ticket only after repaired local replay explicitly unblocks it. It owns actual operator review notes and must not treat replay metrics, schema validity, hosted output, fake-provider success, or fallback renders as comprehension.

Scope boundary: validation evidence and operator notes only. If cards are confusing, route back to repair instead of collecting dogfood labels.

## Milestones

### Milestone: Rejection behavior is inspectable without leaks

Child ticket: `ticket:20260602-flight-learn-card-copy-validator-diagnostics`

The project can explain field/rule/category rejection patterns without raw prompt/output persistence and without private data exposure.

### Milestone: The validator contract is coherent enough to test

Child ticket: `ticket:20260602-flight-learn-card-copy-validator-contract-repair`

The product validator implements the hard-vs-field-local distinction and non-brittle support behavior required by `spec:flight-learn-inbox-ux` without weakening safety or source-of-truth gates.

### Milestone: Local/open replay decides the product path

Child ticket: `ticket:20260602-flight-learn-card-copy-repaired-local-replay`

A repaired local/open runtime replay either produces enough safe product-gated cards to reopen operator validation, or gives an evidence-backed no-go that prevents more blind model shopping.

### Milestone: Human comprehension is measured only after the replay gate

Child ticket: `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation`

Actual operator notes are collected only after a safe local model-enabled render pack exists.

## Current State

Active. The governing spec was amended with REQ-049 through REQ-054 and SCN-016 through SCN-018 to make the intended repair behavior explicit. The prior same-model Bonsai repair branch is no longer the right execution route: diagnostics and variants closed no-go, four more small local models failed the current product gate, and the hosted `gpt-5.5` sanity check showed the current prompt/validator process itself is implicated.

Milestones 1 and 2 are complete: `ticket:20260602-flight-learn-card-copy-validator-diagnostics` and `ticket:20260602-flight-learn-card-copy-validator-contract-repair` both closed with clear audits. Milestone 3 completed negatively: `ticket:20260602-flight-learn-card-copy-repaired-local-replay` closed with clear audit as negative repaired local/open replay evidence. All four cached/authorized local-open candidates timed out 8/8 under the current 5s product path, yielding 0 product-gated model-enabled cards.

The plan is now blocked by an operator/product decision. There is no remaining runnable child ticket under current authority. Downstream comprehension validation remains blocked. Continuing would require a newly shaped direction such as a shorter-prompt experiment, longer timeout/product envelope, different local runtime/model authorization, evidence-summary-only path, or fallback-only validation rescope.

## Journal

- 2026-06-02: Created plan after hosted `gpt-5.5` sanity check and small-model batch showed the current prompt/validator contract, not just model choice, is the next repair target. Added child tickets for validator diagnostics, contract repair, and repaired local replay; linked existing comprehension-validation ticket as the downstream gate.
- 2026-06-02: First child ticket `ticket:20260602-flight-learn-card-copy-validator-diagnostics` closed with clear audit; plan moved to active and successor contract-repair ticket was unblocked.
- 2026-06-02: Contract repair child ticket closed with clear audit; repaired local/open replay ticket was unblocked as the next gate.
- 2026-06-02: Repaired local/open replay child ticket closed with clear audit as negative gate evidence: all cached/authorized candidates timed out under the current 5s product path. Plan moved to blocked because any further progress requires new operator/product authority.
