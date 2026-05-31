# Flight Learn Comprehension Path

ID: plan:20260529-flight-learn-comprehension-path
Type: Plan
Status: active
Created: 2026-05-29
Updated: 2026-05-29
Risk: high - this coordinates the core `/flight-learn` review experience, privacy-sensitive local-model integration, and evidence gates that decide when human routing labels are trustworthy.

## Summary

This plan makes `/flight-learn` understandable enough for human artifact routing. The product invariant is now sharper than “model polish”: deterministic facts remain the source of truth and deterministic fallback remains safe, but the intended usable comprehension path may depend on an explicitly enabled local model once that model output is schema-constrained, verified, judged, and visibly display-only.

The work needs multiple tickets because it crosses different closure stories: adapter contract implementation, real local judge/latency evidence, draft comprehension display, accepted narrative upgrade, operator comprehension validation, and only then dogfood corpus/outcome collection. The plan outcome is not model autonomy. The outcome is a gated path where a human can understand cards well enough to route them, while model text never routes, persists truth, mutates artifacts, or bypasses safety gates.

## Related Records

- `spec:flight-learn-inbox-ux` - owns `/flight-learn` UX behavior; amended with REQ-033 through REQ-041 and SCN-011 through SCN-012 to state that model-enabled comprehension can be the intended rich path, local drafts can be displayed as non-authoritative reading help, and deterministic fallback remains safe and non-dead-ending.
- `research:20260529-llama-cpp-constrained-json` - records why constrained decoding is the right next technical hypothesis and why prompt-only JSON was insufficient.
- `ticket:20260529-llama-cpp-constrained-json-probe` - closed with clear audit; proves installed Bonsai 4B/llama.cpp can enforce generator JSON schema on the product-adjacent chat route.
- `evidence:20260529-llama-cpp-constrained-json-probe` - records 15/15 parse/schema/harness-verifier pass for generator-only constrained output and route-level enforcement evidence.
- `audit:20260529-llama-cpp-constrained-json-probe-review` - clear audit for the bounded generator-format claim and non-claims.
- `research:20260529-flight-recorder-core-loop-stocktake` - maps the core product loop and warns against classifier automation before a routed/outcome corpus exists. This plan supersedes the “optional polish” framing by treating model narrative as a comprehension-critical but non-authoritative layer.
- `research:20260529-flight-learn-comprehension-recovery-options` - records the post-replay recovery decision: schema-constrained JSON solved format, not semantic acceptance; next path is a two-tier local LLM draft vs accepted narrative contract.
- `ticket:20260529-bonsai-4b-schema-prompt-tuning` and `evidence:20260529-bonsai-4b-schema-prompt-tuning` - prior prompt-only tuning baseline: better structure but 0/15 accepted narratives due to judge/timeout/safety failures.
- `ticket:20260528-local-narrative-llama-cpp-judge-adapter` - existing loopback-only judge flags and fail-closed behavior that must remain intact.
- `src/flight-learn-llama-cpp-adapter.ts` - current adapter seam; now sends the proven JSON-schema route for explicitly enabled local llama.cpp generator/judge calls.
- `src/flight-learn-local-diagnosis-model.ts` - fact packet, prompt, verifier, local judge request/response contract, and display-only fallback behavior.
- `src/flight-learn-inbox.ts` and `src/pi-extension.ts` - current `/flight-learn` inbox integration and explicit local-model flags.

## Strategy

Treat local narrative as a **comprehension layer**, not as mere wording polish and not as source-of-truth.

The prior stocktake was right that artifact routing, outcome tracking, and classifier readiness are the durable product loop. But it underweighted the operator's key product fact: the loop cannot collect trustworthy human labels if the operator cannot understand what each card is flagging or why it matters. Therefore corpus collection must be downstream of comprehension validation, not a parallel track.

The route is risk-first and gate-driven:

1. **Constrain generation at the adapter seam.** The generator-format blocker is now proven solvable on the installed runtime. Put that evidence into the opt-in llama.cpp adapter path while keeping loopback-only, fail-closed behavior and existing human gates. Do not add a second user-visible opt-in unless implementation discovers a compatibility need; the model call is already explicitly enabled by `--local-model-polish --local-model-url ...`.
2. **Replay the real judge/latency path before accepted-narrative claims.** Schema-valid generator output is not accepted narrative. The local Bonsai 4B replay showed 0/15 accepted narratives, so the old all-or-nothing accepted narrative gate cannot be the only route to operator comprehension.
3. **Split local model display into draft vs accepted tiers.** A local LLM draft may be shown as explicitly labeled reading help after hard syntactic/privacy/safety gates, using the existing explicit local-model opt-in. A judge-accepted narrative remains a stricter upgrade when verifier/judge acceptance succeeds. Neither tier may route, persist truth, mutate artifacts/source/docs/Loom/rules/skills/prompts, or feed classifier labels.
4. **Validate comprehension as a human task.** Success is not “JSON schema passes” or “judge accepted.” Success is the operator being able to answer: What happened? Why does it matter? What route or observe/no-artifact decision fits? Capture redacted render evidence and operator review notes before collecting labels.
5. **Begin corpus/outcome collection only after comprehension is adequate.** Bad labels from misunderstood cards are worse than delayed labels. Classifier automation remains out of scope.

Scope included:

- opt-in local llama.cpp adapter support for request-level JSON schema on the proven route;
- local constrained generator + judge replay using existing Bonsai 4B only;
- `/flight-learn` display integration for accepted narratives behind explicit local flags;
- redacted comprehension validation artifacts and operator routing-confidence notes;
- initial dogfood corpus/outcome collection after comprehension passes.

Scope excluded:

- making local model calls by default;
- hosted providers, non-loopback endpoints, telemetry, or automatic model/runtime downloads;
- weakening fact-ID verifier, local judge veto, hard privacy checks, or fallback semantics;
- allowing model output to route, classify, persist stored truth, create artifacts, mutate source/docs/Loom/rules/skills/prompts, or become source-of-truth;
- classifier automation or route ranking;
- broad release-readiness claims.

Sequential dependencies matter. If a ticket closes negative, later tickets should stop or replan rather than forcing progress:

- If adapter JSON-schema support cannot be implemented safely, stop before judge replay.
- If judge/latency replay still produces 0 accepted narratives or unacceptable latency, stop before accepted-narrative UI claims and reshape around draft comprehension or a judge/model successor.
- If comprehension validation fails, stop before corpus/outcome collection and route the failure to UX/model/fallback tickets.
- If real dogfood exposes privacy leakage or route confusion, stop classifier-readiness talk and repair the comprehension loop first.

## Execution Units

### Unit: Constrained JSON adapter implementation

Ticket: `ticket:20260529-flight-learn-constrained-json-adapter`

Implement the proven request-level JSON-schema route in the local llama.cpp adapter for explicitly enabled local diagnosis/narrative calls. The ticket should add distinct schema-constrained bodies for generator and judge calls where applicable, keep loopback-only URL validation and proxy bypass, and fail closed if the runtime rejects or violates the schema.

Scope boundary: source adapter and focused tests only, plus evidence. Do not change `/flight-learn` visible command surface, storage semantics, artifact routing, model defaults, or corpus collection.

Order reason: every later ticket depends on the product path using the same constrained-output route that the probe proved.

Validation/audit expectation: focused adapter tests should inspect request bodies and fail-closed behavior; full test/typecheck/build as appropriate; audit should challenge source-boundary creep and whether the implementation silently falls back to unconstrained generation.

### Unit: Constrained generator plus judge/latency replay

Ticket: `ticket:20260529-flight-learn-constrained-judge-replay`
Depends On: `ticket:20260529-flight-learn-constrained-json-adapter`

Run the synthetic/redacted narrative corpus through the implemented constrained adapter path with the local judge enabled. The ticket should measure generator parse/schema/verifier pass, judge pass/fail, accepted narratives, fallback reasons, unsafe accepted outputs, and latency. It should preserve raw previews only in redacted/sanitized artifacts.

Scope boundary: evidence/harness work against existing Bonsai 4B Q1_0 and existing local runtime only. No new models, no hosted calls, no product default changes, no judge weakening.

Order reason: schema-valid generator output is not enough. The plan cannot proceed to UI/comprehension claims until the local judge bottleneck is measured.

Validation/audit expectation: evidence dossier plus audit before closing. Audit should challenge overclaiming, privacy, timeout interpretation, and whether accepted narratives are truly accepted by the existing verifier/judge contract.

### Unit: Local LLM draft comprehension gate

Ticket: `ticket:20260529-flight-learn-local-draft-comprehension-gate`
Depends On: `ticket:20260529-flight-learn-constrained-judge-replay`

Implement the two-tier recovery path: `/flight-learn` may display an explicitly labeled local LLM draft explanation as reading help when existing local-model flags are enabled and hard display gates pass, even if the stricter local judge does not promote the draft to an accepted narrative. Deterministic facts remain source of truth and route/action choices remain human-controlled.

Scope boundary: local diagnosis result state, hard display gates, focused-card rendering, command wiring tests, and render/evidence artifacts. Do not add default model calls, new top-level commands, hosted/non-loopback endpoints, storage/routing/classifier side effects, or accepted-narrative claims.

Order reason: the operator needs LLM help to understand cards, while the accepted-narrative gate closed negative for the current Bonsai 4B runtime. This slice restores a safe comprehension path without weakening accepted-narrative or privacy gates.

Validation/audit expectation: focused fake-provider tests, render artifacts for draft/fallback states, side-effect tests, typecheck/build/full tests as practical, evidence dossier, and audit for trust-boundary language.

### Unit: Accepted narrative inbox integration

Ticket: `ticket:20260529-flight-learn-model-comprehension-integration`
Depends On: `ticket:20260529-flight-learn-constrained-judge-replay`

Integrate accepted constrained local narratives into the `/flight-learn` focused card as a stricter upgrade when verifier/judge acceptance succeeds. This ticket is currently blocked by the negative replay result and should not be executed unless later judge/model evidence supports accepted narratives.

Scope boundary: `/flight-learn` inbox rendering/integration tests and small command help/flag copy if needed. Do not add top-level commands, auto-enable models, persist model wording as delta truth, change route ranking, or create artifacts.

Order reason: accepted-narrative integration is useful only if evidence shows accepted narratives under current or newly authorized gates. The draft comprehension gate is now the next executable path.

Validation/audit expectation: render artifacts for accepted and fallback states, focused tests proving no storage/routing side effects from model text, and audit for UI trust-boundary language.

### Unit: Operator comprehension validation

Ticket: `ticket:20260529-flight-learn-comprehension-validation`
Depends On: `ticket:20260529-flight-learn-local-draft-comprehension-gate`

Validate whether rendered `/flight-learn` cards are actually understandable enough for human routing. Produce a redacted render pack comparing draft-enabled cards and deterministic fallback cards, then capture operator-facing review notes answering what happened, why it matters, and what route/observe decision fits. Accepted narrative cards may be included only if later evidence unblocks them.

Scope boundary: evidence and validation artifacts only unless a tiny render harness is needed under `.loom/evidence/artifacts/**`. Do not collect private raw sessions into Loom. Do not treat schema validity as comprehension success.

Order reason: this is the gate between model/UI implementation and corpus collection. The product must not collect labels from cards the operator cannot interpret.

Validation/audit expectation: evidence should include rendered cards and structured comprehension notes; audit should challenge whether the validation measures understanding rather than aesthetics.

### Unit: Dogfood corpus and outcome seed

Ticket: `ticket:20260529-flight-learn-dogfood-corpus-outcomes`
Depends On: `ticket:20260529-flight-learn-comprehension-validation`

Start the first dogfood corpus/outcome collection pass only after comprehension validation clears. Review a bounded batch of safe representative deltas through `/flight-learn`, record route/observe decisions and confidence, and capture outcome/recurrence follow-up readiness without persisting raw private content in Loom.

Scope boundary: operational validation/evidence and local ledger use. Source changes are out of scope unless comprehension validation explicitly identifies a small blocking bug and a separate ticket is created. Classifier automation remains out of scope.

Order reason: this creates the human-routed labels the core loop needs, but only after the cards are understandable enough to trust those labels.

Validation/audit expectation: evidence should summarize counts, route distribution, confidence, blocked/unclear cases, and privacy posture. Audit should challenge whether the corpus is genuinely usable for later classifier-readiness evaluation or merely activity.

## Milestones

### Milestone: Product path uses constrained local output

Child tickets: `ticket:20260529-flight-learn-constrained-json-adapter`

The opt-in local llama.cpp path uses the proven schema-constrained request route and remains loopback-only/fail-closed. This milestone does not claim accepted narratives.

### Milestone: Acceptance bottleneck is known

Child tickets: `ticket:20260529-flight-learn-constrained-judge-replay`

The project knows whether constrained generator output can pass the local judge and at what latency/fallback profile. Accepted narratives remained zero for the current Bonsai 4B runtime, so accepted-narrative integration stays blocked and the plan pivots to explicitly labeled draft comprehension.

### Milestone: `/flight-learn` can render local draft comprehension safely

Child tickets: `ticket:20260529-flight-learn-local-draft-comprehension-gate`

A local LLM draft explanation can appear in the focused card only when explicitly enabled and hard display gates pass. The card labels the draft as non-authoritative reading help, keeps deterministic facts as source of truth, and preserves route/storage side-effect boundaries.

### Milestone: Accepted narrative can render as a stricter upgrade

Child tickets: `ticket:20260529-flight-learn-model-comprehension-integration`

Accepted narrative wording appears in the focused card only when explicitly enabled and strictly verified/judged. This milestone remains blocked for the current Bonsai 4B runtime unless new evidence supports accepted narratives.

### Milestone: Human comprehension is evidenced

Child tickets: `ticket:20260529-flight-learn-comprehension-validation`

The operator can understand representative draft-enabled and fallback cards well enough to identify what happened, why it matters, and which route/observe decision fits. If not, corpus collection waits.

### Milestone: Initial labels/outcomes begin from understood cards

Child tickets: `ticket:20260529-flight-learn-dogfood-corpus-outcomes`

The project has an initial privacy-safe dogfood corpus/outcome seed that can inform future classifier-readiness work without pretending automation is ready.

## Current State

Active. `ticket:20260529-flight-learn-constrained-json-adapter` is closed with evidence and clear follow-up audit. `ticket:20260529-flight-learn-constrained-judge-replay` closed as a negative accepted-narrative gate. `ticket:20260529-flight-learn-local-draft-comprehension-gate` is now closed with evidence and clear follow-up audit, adding the explicitly labeled local LLM draft reading-help path behind existing local-model opt-in and hard display gates. `ticket:20260529-flight-learn-model-comprehension-integration` remains blocked as accepted-narrative integration. The next executable child ticket is `ticket:20260529-flight-learn-comprehension-validation`, now open, to validate whether draft-enabled cards are understandable enough for human routing.

## Journal

- 2026-05-29: Created by Loom Weaver after the operator rejected the framing of local narrative as mere polish. Shaped a five-ticket plan that treats constrained local narrative as a comprehension-critical but non-authoritative layer, gates corpus collection behind comprehension validation, and preserves deterministic fallback as safe rather than feature-equivalent.
- 2026-05-29: First child ticket `ticket:20260529-flight-learn-constrained-json-adapter` completed and closed after implementation evidence, initial audit concerns, follow-up disposition, and clear follow-up audit. Unblocked `ticket:20260529-flight-learn-constrained-judge-replay` as the next execution unit.
- 2026-05-29: Second child ticket `ticket:20260529-flight-learn-constrained-judge-replay` completed and closed as a negative gate after replay evidence, initial audit fixes, and clear follow-up audit. Result: 0/15 accepted narratives under the existing verifier + local judge gates. Plan was blocked before model-enabled inbox integration; later child tickets remained blocked unless the plan was reshaped with new evidence/authorization.
- 2026-05-29: Operator chose the recovery path by questionnaire: local LLM draft layer, reuse existing local-model flags, and shape a ticket before implementation. Added `research:20260529-flight-learn-comprehension-recovery-options`, amended `spec:flight-learn-inbox-ux` with draft requirements, created `ticket:20260529-flight-learn-local-draft-comprehension-gate`, and moved plan back to active with accepted-narrative integration still blocked.
- 2026-05-29: `ticket:20260529-flight-learn-local-draft-comprehension-gate` completed and closed after implementation evidence, initial audit findings, follow-up fixes, and clear follow-up audit. Unblocked `ticket:20260529-flight-learn-comprehension-validation` as the next execution unit.
