# Flight Learn 4B Narrative What Happened

ID: plan:20260528-flight-learn-4b-narrative-what-happened
Type: Plan
Status: completed
Created: 2026-05-28
Updated: 2026-05-28
Risk: high - this changes a privacy-sensitive local-model UI contract and could over-admit unsupported model narrative if validators/rubrics are loosened casually.

## Summary

This plan shapes the operator's new `/flight-learn` direction: keep `Problem` as a concise diagnosis, but make `What happened?` carry a more useful narrative when an explicitly enabled local Bonsai 4B Q1_0 GGUF model is available. The prior 4B comparison judged the model against a conservative equivalence rubric and strict token-support validator; this plan evaluates and implements a different field-specific contract where narrative is the point.

The plan needs multiple execution units because the work has separate closure stories: define a narrative rubric/corpus, implement a field-specific narrative local-model contract, integrate the narrative into the focused-card UI safely, then validate with real Bonsai 4B and visual evidence.

## Related Records

- `spec:flight-learn-inbox-ux` - amended with REQ-030 through REQ-032 and SCN-010 for distinct `Problem` / narrative `What happened?` behavior.
- `evidence:20260528-flight-learn-narrative-what-happened-feedback` - operator screenshot/feedback motivating this plan.
- `ticket:20260527-prism-ml-small-model-comparison` - showed Bonsai 4B runs locally but fails the old strict equivalence/support rubric.
- `evidence:20260527-prism-ml-small-model-comparison` - 1.7B vs 4B metrics and the finding that 4B produced richer paraphrases but was rejected as unsupported.
- `ticket:20260527-bonsai-diagnosis-polish-tuning` - tuned the generic local-model prompt and preserved strict display-only safeguards.
- `src/flight-learn-diagnosis.ts` - deterministic diagnosis fallback, including currently short `whatHappened` phrases.
- `src/flight-learn-local-diagnosis-model.ts` - local-model fact packet, prompt, schema, validator, timeout, and fallback boundary.
- `src/flight-learn-inbox.ts` - focused-card rendering surface for `Problem` / `What happened?`.
- `src/flight-learn-llama-cpp-adapter.ts` - loopback-only `llama.cpp` adapter.
- `research:20260528-local-narrative-judge-validation` - completed research that replaced the failed regex-semantic validation path with a hybrid fact-ID verifier plus local judge veto architecture.
- `ticket:20260528-local-narrative-judge-validation-research` - closed research execution ticket with clear audit.
- `ticket:20260528-narrative-fact-id-contract-verifier` - closed successor implementation ticket for fact-ID constrained narrative generation and deterministic verification.
- `ticket:20260528-local-narrative-judge-provider-contract` - closed successor implementation ticket for the fake-provider local judge veto contract.
- `ticket:20260528-local-narrative-llama-cpp-judge-adapter` - active adapter/config ticket authorized by the operator to unblock real local validation.

## Strategy

Do not treat this as a generic quality tuning task. The product design is field-specific:

- `Problem` should remain a short, conservative headline.
- `What happened?` should become a short narrative paragraph when local narrative polish is explicitly enabled and valid.
- The narrative may connect recurrence, evidence summaries, sequence, and uncertainty in 2-4 concise sentences.
- The narrative must be grounded in the bounded fact packet and remain display-only.
- Deterministic text remains the default and fallback when the model is disabled, unavailable, slow, invalid, unsafe, or unsupported.

The old Bonsai 4B rejection pattern is now a signal: 4B may be better at narrative than the old validator allowed. But the solution is not to accept arbitrary paraphrase. The implementation should add a field-specific narrative contract and rubric that distinguishes:

- useful narrative connective tissue;
- acceptable cautious generalization from stored facts;
- unsupported concrete facts;
- route/action advice;
- raw path/secret/command leakage;
- mutation/classifier/ranking claims.

Scope boundaries:

- Keep `/flight-status` and `/flight-learn` as the only normal visible Pi surface.
- Do not make local-model output default or required.
- Do not call hosted providers, non-loopback endpoints, telemetry, provider keys, or automatic downloads.
- Do not download additional models; Bonsai 4B Q1_0 is already present from the operator-authorized comparison.
- Do not route, rank, classify, persist stored delta fields, mutate artifacts, create rules, edit source/docs/Loom/skills/prompts, or otherwise treat model output as source of truth.
- Do not weaken raw path, secret, stack trace, transcript, route/action, artifact/rule/source mutation, or schema safety checks.
- Do not claim release readiness from synthetic/redacted corpus evidence.

Validation posture inherited by all child tickets:

- Preserve local-first redaction and evidence artifacts; do not store raw private sessions or secrets.
- Keep deterministic fallback as the oracle for facts, not necessarily for prose style.
- Use both automated checks and human-reviewable artifacts because narrative quality is not fully captured by current token matching.
- Audit must challenge whether the narrative contract over-admits unsupported facts or overclaims 4B quality.

Replan triggers:

- Safe narrative validation requires raw sessions or unbounded transcript text.
- Bonsai 4B repeatedly leaks raw details, route advice, or unsupported concrete facts under narrative-specific prompting.
- The desired behavior requires making local model output default/required.
- The UI work expands beyond `What happened?` into route recommendations, classifier behavior, or artifact generation.
- Validator changes would weaken existing non-narrative fields or safety checks.

## Execution Units

### Unit: Narrative corpus and rubric

Ticket: `ticket:20260528-flight-learn-narrative-rubric-corpus`

Create a narrative-specific evaluation corpus/rubric for `What happened?`. It should include cases where deterministic `Problem` and `What happened?` are repetitive, cases where 4B-style narrative is helpful, and adversarial cases where narrative overreaches. It should define what counts as grounded narrative, useful connective tissue, unsupported concrete fact, unsafe output, and no-better-than-deterministic.

Scope boundary: Loom artifacts/records only. Do not edit product source, run Bonsai, change validators, or alter UI behavior.

Order reason: implementation needs a behavior-specific target before changing prompts/validators.

### Unit: Superseded regex-semantic narrative contract

Ticket: `ticket:20260528-flight-learn-narrative-local-model-contract`
Depends On: `ticket:20260528-flight-learn-narrative-rubric-corpus`

This original implementation unit is blocked/superseded. It attempted to implement the field-specific local-model contract for narrative `whatHappened`, but repeated audits showed that semantic grounding/usefulness/action-advice validation for open-ended narrative text cannot be made trustworthy by regex/token allow-lists. Do not resume this unit by adding more regex bypass fixes.

Scope boundary: preserve its artifacts as historical evidence only. Successor implementation now lives in the two units below.

Order reason: this unit explains why the plan moved to the hybrid architecture; it is not a current execution path.

### Unit: Fact-ID contract verifier

Ticket: `ticket:20260528-narrative-fact-id-contract-verifier`
Depends On: `ticket:20260528-flight-learn-narrative-rubric-corpus`

Implement the generator-facing proof-by-construction half of the narrative contract: bounded redacted facts with stable IDs, `schemaVersion: 2`, structured `whatHappened.sentences[].text + factIds`, deterministic schema/fact-ID/hard-safety verification, display-only fallback, and fake-provider/harness coverage.

Scope boundary: source/tests/evidence for `src/flight-learn-local-diagnosis-model.ts` plus compatibility tests. Do not claim semantic entailment, real model quality, UI integration, or judge behavior.

Order reason: the UI and judge can only consume narrative candidates after the deterministic fact-ID seam exists.

### Unit: Local narrative judge provider contract

Ticket: `ticket:20260528-local-narrative-judge-provider-contract`
Depends On: `ticket:20260528-narrative-fact-id-contract-verifier`

Implement the fake-provider/provider-interface local judge contract as a veto/uncertainty gate over fact-ID-verified narrative sentences. It validates bounded judge responses, fails closed for uncertainty/low confidence/unsupported/unsafe/malformed/provider-error/timeout paths, and cannot rewrite display text or mutate source-of-truth state.

Scope boundary: provider interface, request/response validation, tests, and sanitized harness artifacts only. No real judge model, downloads, hosted calls, UI integration, or release claims.

Order reason: semantic paraphrase/action/classifier concerns belong to the local judge gate, not deterministic regex expansion.

### Unit: Focused-card narrative integration

Ticket: `ticket:20260528-flight-learn-narrative-inbox-integration`
Depends On: `ticket:20260528-local-narrative-judge-provider-contract`

Integrate accepted narrative `whatHappened` output into the `/flight-learn` focused card. The rendered card should make `Problem` and `What happened?` visibly distinct, wrap the narrative to a readable measure, disclose local-model phrasing, and keep evidence/route actions unchanged.

Scope boundary: `src/flight-learn-inbox.ts`, `src/pi-extension.ts` only if flag/options plumbing needs an explicit narrative mode, and focused render/integration tests. Do not alter storage semantics or make Bonsai/4B required.

Order reason: product UI should change only after the narrative contract is safe and test-covered.

### Unit: Bonsai 4B narrative validation

Ticket: `ticket:20260528-bonsai-4b-narrative-validation`
Depends On: `ticket:20260528-flight-learn-narrative-inbox-integration`

Run real Bonsai 4B Q1_0 through the narrative corpus and at least one focused-card render or disposable Pi TUI validation. Record acceptance/fallback/safety/latency metrics, sanitized examples, visual evidence, and a narrow recommendation about whether 4B narrative is worth using experimentally.

Scope boundary: evidence and validation only. Do not download new models, change source, change defaults, or claim release readiness.

Order reason: real-model claims and UI usefulness need evidence after the product contract and rendering path exist.

## Milestones

### Milestone: Narrative behavior is defined

Child tickets: `ticket:20260528-flight-learn-narrative-rubric-corpus`

A future worker can judge whether `What happened?` is useful narrative rather than duplicate headline text without relying on chat history.

### Milestone: Narrative contract is safe

Child tickets: `ticket:20260528-narrative-fact-id-contract-verifier`, `ticket:20260528-local-narrative-judge-provider-contract`

Fake-provider tests and harness artifacts show the model can return narrative `whatHappened` text only through a fact-ID constrained deterministic verifier and a local judge veto/uncertainty gate, with deterministic fallback for invalid output. This milestone does not prove real judge/model quality.

### Milestone: Focused-card UX reflects the contract

Child tickets: `ticket:20260528-flight-learn-narrative-inbox-integration`

The focused card can display distinct concise `Problem` and narrative `What happened?` sections while preserving route/evidence/storage safety.

### Milestone: Real 4B narrative posture is known

Child tickets: `ticket:20260528-bonsai-4b-narrative-validation`

The project has local evidence about whether Bonsai 4B Q1_0 is useful for narrative `What happened?` under the new contract.

## Current State

Blocked on real-validation authorization. `ticket:20260528-flight-learn-narrative-rubric-corpus`, `ticket:20260528-narrative-fact-id-contract-verifier`, `ticket:20260528-local-narrative-judge-provider-contract`, and `ticket:20260528-flight-learn-narrative-inbox-integration` are closed with clear audits in their bounded scopes. The original regex-semantic contract ticket remains blocked/superseded and should not be resumed. Completed with a negative Bonsai 4B recommendation. `ticket:20260528-flight-learn-narrative-rubric-corpus`, `ticket:20260528-narrative-fact-id-contract-verifier`, `ticket:20260528-local-narrative-judge-provider-contract`, `ticket:20260528-flight-learn-narrative-inbox-integration`, `ticket:20260528-local-narrative-llama-cpp-judge-adapter`, and `ticket:20260528-bonsai-4b-narrative-validation` are closed with clear final audits in their bounded scopes. The original regex-semantic contract ticket remains blocked/superseded and should not be resumed. Real Bonsai 4B Q1_0 validation found 0 accepted narratives / 15 fallbacks under the current contract, so the plan outcome is: the safe architecture exists, the focused card can consume accepted narratives, but Bonsai 4B Q1_0 should not be used for accepted narrative wording without a separate tuning/alternate-model follow-up. This plan does not prove broad Bonsai inferiority, independent judge quality, latency generalization, UI release readiness, or release readiness.

## Journal

- 2026-05-28: Created plan after operator feedback that current `Problem` and `What happened?` are nearly duplicate and that `What happened?` should become a Bonsai 4B-generated narrative when explicitly enabled. Added one plan with four child tickets; no source implementation started.
- 2026-05-28: Began plan execution. First active child is `ticket:20260528-flight-learn-narrative-rubric-corpus`; dependencies will be drained in order unless blocked by a safety, scope, product, architecture, evidence, or time/context limit.
- 2026-05-28: Blocked plan after `ticket:20260528-flight-learn-narrative-local-model-contract` exposed an architectural flaw: semantic grounding/usefulness/action-advice validation for arbitrary local-model narrative cannot be made trustworthy by repeatedly expanding regex rules. Need a revised contract before continuing child ticket execution.
- 2026-05-28: Created `research:20260528-local-narrative-judge-validation` and `ticket:20260528-local-narrative-judge-validation-research` as the next unblocker for this plan.
- 2026-05-28: Completed and audited `ticket:20260528-local-narrative-judge-validation-research`; verdict clear. The research recommends replacing the blocked regex-semantic contract with successor tickets for fact-ID constrained narrative generation/deterministic verification and a local judge provider contract.
- 2026-05-28: Created successor tickets `ticket:20260528-narrative-fact-id-contract-verifier` and `ticket:20260528-local-narrative-judge-provider-contract`; starting the fact-ID verifier first.
- 2026-05-28: Closed `ticket:20260528-narrative-fact-id-contract-verifier` after narrowed-scope clear audit. The deterministic fact-ID verifier is now available as a prerequisite slice, but semantic paraphrase/action/classifier judgment remains owned by `ticket:20260528-local-narrative-judge-provider-contract`.
- 2026-05-28: Closed `ticket:20260528-local-narrative-judge-provider-contract` after follow-up clear audit. Updated the plan to mark the original regex-semantic contract unit as superseded and unblock focused-card narrative integration. Next child is `ticket:20260528-flight-learn-narrative-inbox-integration`; real Bonsai 4B validation remains later.
- 2026-05-28: Closed `ticket:20260528-flight-learn-narrative-inbox-integration` after clear audit for bounded UI-consumption scope. Marked `ticket:20260528-bonsai-4b-narrative-validation` and this plan blocked pending explicit operator authorization / validation-shape decision for real local judge handling and real Bonsai narrative validation.
- 2026-05-28: Operator authorized the unblock path: add a local judge adapter, use only the existing Bonsai 4B Q1_0 for later validation, and allow loopback-only `llama.cpp` servers. Created active `ticket:20260528-local-narrative-llama-cpp-judge-adapter`; real Bonsai validation remains after that adapter closes.
- 2026-05-28: Closed `ticket:20260528-local-narrative-llama-cpp-judge-adapter` after clear follow-up audit. Set `ticket:20260528-bonsai-4b-narrative-validation` active for real local 4B validation with no new downloads or hosted calls.
- 2026-05-28/29 UTC: Closed `ticket:20260528-bonsai-4b-narrative-validation` after clear follow-up audit as a negative validation result. Completed plan: architecture/UI seams are in place, but Bonsai 4B Q1_0 produced 0 accepted narratives under the current contract and is not recommended for accepted narrative wording without separate follow-up.
