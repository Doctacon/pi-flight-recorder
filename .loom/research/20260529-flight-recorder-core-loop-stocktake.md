# Flight Recorder Core Loop Stocktake

ID: research:20260529-flight-recorder-core-loop-stocktake
Type: Research
Status: completed
Created: 2026-05-29
Updated: 2026-05-29

## Summary

`pi-flight-recorder` is still coherent, but the recent work has concentrated on one optional polish layer. The durable core loop is: local failure memory -> expectation deltas -> `/flight-learn` review -> human artifact-candidate routing -> outcome/recurrence feedback -> later classifier readiness. That loop is partly implemented and evidenced through completed MVP and delta-artifact plans, but its long-run usefulness still depends on real manually routed outcome corpus.

The local Bonsai narrative work is not the project blocker. It addressed a real UX problem: cryptic bash-like delta summaries made `/flight-learn` hard to understand. But the optional local-model narrative path became slow because it crossed strict privacy, display-only, grounding, schema, judge, and evidence boundaries. The latest Bonsai prompt tuning showed structure can improve, but accepted narratives remain `0/15`; local narrative remains optional polish, not the core loop.

Recommendation: do not productize Bonsai narrative now. The next smallest honest move is to return focus to deterministic `/flight-learn` comprehension and core-loop corpus/outcome collection, while treating any further model work as a separate narrow investigation such as judge/latency replay or grammar-constrained JSON.

## Question

Where is `pi-flight-recorder` in its core product loop after Bonsai 4B prompt/schema tuning, what actually kept the project in local-model narrative work, and what next move should avoid losing the main product thread?

## Scope

Covered:

- Current product loop from failure memory through expectation deltas, `/flight-learn`, artifact candidates, outcome/recurrence, and classifier readiness.
- Implemented/evidenced versus aspirational/unproven state from accepted Loom records.
- Why recent work became local-model narrative-heavy.
- Interpretation of `ticket:20260529-bonsai-4b-schema-prompt-tuning` at the product level.
- Bounded recommendation for the next move.

Excluded:

- Source implementation changes.
- New model/runtime authorization or downloads.
- Classifier implementation.
- Release readiness claims.
- Raw private sessions, secrets, raw prompts, full transcripts, stack traces, or unredacted local paths.
- A broad roadmap beyond the next decision.

Freshness/recheck trigger: re-run this stocktake after a real corpus of manually routed deltas/outcomes exists, after a productized model prompt is proposed, or after another plan changes `/flight-learn` semantics.

## Method And Sources

This stocktake used project-owned Loom records as the source of truth and did not inspect or persist raw sessions.

Primary sources:

- `spec:failure-memory-mvp` and `plan:20260522-pi-flight-recorder-mvp` for the original local failure-memory slice and completed MVP boundary.
- `spec:delta-artifact-learning-loop` and `plan:20260523-delta-artifact-learning-loop` for the expectation-delta/artifact-routing/outcome loop and completed implementation arc.
- `research:20260525-classifier-readiness-evaluation` for the current automation gate: zero available routed/outcome labels at that observation point and a recommendation to keep routing manual-only until a corpus exists.
- `spec:flight-learn-inbox-ux` for the current `/flight-learn` UX contract, including deterministic plain-English diagnosis and optional local narrative polish.
- `plan:20260528-flight-learn-4b-narrative-what-happened` and `evidence:20260528-bonsai-4b-narrative-validation` for the local narrative architecture and first negative 4B validation.
- `ticket:20260529-bonsai-4b-schema-prompt-tuning`, `evidence:20260529-bonsai-4b-schema-prompt-tuning`, and `audit:20260529-bonsai-4b-schema-prompt-tuning-review` for the prompt/schema tuning result.
- `plan:20260529-flight-recorder-product-recalibration` and `ticket:20260529-flight-recorder-core-loop-stocktake` for this stocktake's scope.

No source files were edited. Source inspection was not needed because the ticket asked for a product-loop stocktake from existing records, not an implementation audit.

## Findings

### 1. The current core loop is clear

The project now has this product loop:

1. **Failure memory foundation.** Local Pi sessions are parsed/indexed into evidence-backed failure/fix memory so the tool can answer “have I seen this before?” without hosted services.
2. **Expectation delta model.** A problem is broadened from a hard command failure into a gap between expected and actual session behavior.
3. **`/flight-learn` review.** The operator reviews pending deltas through a small visible command surface and a focused inbox UX.
4. **Artifact candidate routing.** The operator decides what kind of artifact, if any, might prevent recurrence: rule, Loom ticket/record, test/check, prompt/context doc, skill/prompt-template candidate, code-legibility/refactor ticket, or observe/no-artifact.
5. **Outcome/recurrence feedback.** Applied/accepted candidates are tracked against later recurrence so “solution” means changed future behavior, not merely created text.
6. **Classifier readiness.** Automation remains gated until enough manually routed deltas with outcomes exist.

This loop matches the operator's original intent: keep track of recurring errors/friction, define “error” as expectation delta, and use human judgment first because both the error and the artifact that fixes it are ambiguous.

### 2. Implemented/evidenced versus aspirational

Implemented/evidenced by accepted records:

- The Failure Memory MVP plan is completed with fixture/test/build/package-level evidence for local parsing, storage, extraction, query, and Pi wrapper behavior. It does not claim long-run real-corpus precision.
- The Delta Artifact Learning Loop plan is completed. Its current state says the system can locally collect reviewable expectation-delta candidates, manually route them, store safe candidate-only draft/handoff text, and track cautious outcome/recurrence categories without durable artifact mutation.
- `/flight-learn` UX work has specs and completed implementation slices for focused-card review, plain-English deterministic diagnosis, optional local-model wiring, safety gates, and render/test evidence. The spec still requires local model output to remain opt-in and display-only.
- The local narrative architecture exists in bounded form: fact-ID constrained generation, deterministic verifier, local judge provider/adapter, strict fallback, and inbox consumption of accepted results.

Aspirational/unproven or still weak:

- A real manually routed outcome corpus sufficient for classifier evaluation is absent or not yet proven. `research:20260525-classifier-readiness-evaluation` observed zero available delta/artifact/outcome/recurrence labels in the default corpus at that point.
- Automated artifact classification is explicitly not ready.
- Real long-run usefulness of `/flight-learn` on private/operator sessions is not proven by the synthetic narrative corpus.
- Accepted Bonsai 4B narrative `What happened?` output is not proven; both real validation and prompt tuning ended at `0/15` accepted narratives.
- Independent judge quality, latency suitability, and release readiness are unproven.

### 3. Why the project got stuck in local-model narrative work

The stall was not one simple code blocker and not simply “the model failed.” It combined several pressures:

- **UX comprehension need.** The operator could not understand cryptic delta cards that surfaced raw bash-like summaries. Plain-English diagnosis and a better `What happened?` field were real product needs.
- **Ambiguous domain language.** “Error” became expectation delta, and a fix became an artifact candidate. That is product-correct but makes summarization harder than labeling a stack trace.
- **Strict local/privacy/display-only gates.** The model path cannot see raw sessions, full prompts, secrets, raw paths, stack traces, or transcripts. It cannot route, classify, persist truth, create artifacts, or mutate source/Loom/rules.
- **Prompt/schema compliance.** The first Bonsai real run mainly failed before narrative quality could be judged: malformed JSON, wrong schema, missing nesting, or timeout.
- **Semantic safety.** Regex validation was rejected because it could not reliably prove grounding, non-actionability, or usefulness. The replacement fact-ID plus judge architecture is safer but adds more gates.
- **Judge latency/behavior.** Prompt tuning produced verifier-passing candidates, but the local Bonsai self-judge timed out for those candidates and accepted none.
- **Evidence standards.** The project correctly refused to claim usefulness from synthetic examples, unsafe outputs, or unreviewed model text. That makes progress slower but preserves trust.

So the issue is best described as an optional UX-polish path with high safety/evidence standards, not a failure of the core product loop.

### 4. Bonsai prompt tuning result at product level

The closed prompt-tuning ticket materially changed the diagnosis:

- Prior real 4B validation: `0/15` accepted, mostly malformed/schema-invalid output.
- Prompt tuning best variant, `exact-example-single-json`: `8/15` parse-valid, `8/15` schema-valid, `7/15` verifier pass, `0/15` accepted, `0` unsafe accepted outputs.
- Audit cleared the ticket as a bounded evidence-only experiment and explicitly warned against productization.

Interpretation:

- Bonsai 4B can be nudged toward the required structure; the first 0/15 was not proof that it cannot write a narrative.
- End-to-end accepted narrative remains blocked by downstream judge timeout/behavior and strict safety gates.
- The result does not justify productizing prompt changes, increasing default model reliance, weakening validators, or claiming release readiness.
- For the broader Flight Recorder loop, this says local narrative is not hopeless, but it is not currently on the critical path.

### 5. Local narrative is polish, not the critical path

The core loop only requires the operator to understand the delta well enough to route it. A local model can improve that understanding, but the product does not require a model because:

- `spec:flight-learn-inbox-ux` requires deterministic diagnosis by default.
- `spec:delta-artifact-learning-loop` defines learning through human routing and outcome feedback, not model wording.
- `research:20260525-classifier-readiness-evaluation` says the automation bottleneck is corpus/outcome labels, not prettier prose.

Therefore the project should not let local-model narrative absorb the whole initiative. It should either remain a narrow optional investigation or pause while the project returns to corpus-building and deterministic UX usefulness.

## Tradeoffs

### Option A: Pivot to deterministic `/flight-learn` UX and core-loop corpus work (recommended)

Strengths:

- Closest to the original value proposition.
- Builds the labeled routed/outcome corpus needed for future automation.
- Avoids blocking on model schema/judge latency.
- Preserves local-first and human-gated semantics.

Weaknesses:

- The `What happened?` prose may remain less rich than desired.
- The operator may still notice repetition between deterministic `Problem` and `What happened?` until deterministic copy is improved.

Best next slice: a small dogfood/corpus ticket that uses deterministic `/flight-learn` on representative redacted or disposable data, records whether the operator can understand and route items, and captures which UX gaps block real corpus collection.

### Option B: Continue local-model work with a narrow bottleneck ticket

Strengths:

- Prompt tuning showed structure can improve.
- A focused judge/latency replay or grammar-constrained JSON investigation could isolate the next failure point.

Weaknesses:

- It still does not produce corpus/outcome labels.
- It risks extending the local-model detour without improving the main loop.
- Any new model/runtime path requires explicit authorization.

Use only if the operator deliberately wants model polish next. Do not productize the tuned prompt yet.

### Option C: Build classifier or route automation now

Strengths:

- Would feel like progress toward future automation.

Weaknesses:

- Directly conflicts with classifier-readiness research and `spec:delta-artifact-learning-loop#REQ-010`.
- No sufficient labeled outcome corpus exists.
- Risks classifier theater and biased artifact suggestions.

Reject for now.

## Rejected Paths And Null Results

- **Blame Bonsai 4B outright** - rejected. Prompt tuning improved structured output materially; the evidence says contract/judge path first, not pure model inability.
- **Blame source architecture outright** - rejected. Existing records show the core loop and model seams can run; the observed blocker was prompt/schema and judge/latency in an optional path.
- **Productize the tuned prompt** - rejected. Accepted narratives remain `0/15` and audit says no productization claim is supported.
- **Loosen verifier/judge/privacy gates to get accepted narratives** - rejected. That would undermine the display-only, local-first, evidence-backed trust boundary.
- **Resume regex-semantic validation** - rejected. The completed narrative plan records that regex semantic checks were superseded after audit failures.
- **Start classifier automation** - rejected. The routed/outcome corpus is not ready.
- **Create a broad roadmap now** - rejected. The next step should be a small product-loop slice, not more planning theater.

## Conclusions

1. The project has not lost its core product shape. Its durable loop is expectation-delta review and human-routed artifact candidates with later outcome/recurrence learning.
2. The recent local-model narrative work addressed a real UX pain, but it became expensive because the path touches privacy, grounding, display-only safety, schema compliance, judge behavior, and evidence quality at once.
3. The latest Bonsai prompt tuning is useful evidence: structure improved, accepted narratives did not. The next model bottleneck is judge/latency or constrained decoding, not more broad prompt tweaking.
4. Local narrative is not on the critical path to Flight Recorder's main value. Deterministic clarity plus corpus/outcome collection matters more right now.
5. The project should take one step back from model polish before investing further: validate that the deterministic `/flight-learn` loop is understandable enough to collect real human routing/outcome data.

## Recommendations

Primary recommendation:

- Create/execute one bounded successor ticket for deterministic core-loop dogfooding/corpus collection. It should use `/flight-learn` without model polish on representative redacted or disposable data, verify that the operator can understand and route deltas, record artifact candidates/outcome follow-up friction, and identify any UX blockers to collecting real labels. Keep source changes out unless the ticket explicitly scopes a small deterministic UX fix.

Do next, not now:

- If model work remains desired, shape a separate narrow ticket for either:
  - local judge/latency replay over the 7 verifier-passing candidates from prompt tuning; or
  - grammar-constrained JSON / JSON-mode investigation for `llama.cpp`.
- That ticket should remain evidence-only unless it produces accepted safe narratives and passes audit.

Do not do next:

- Do not productize Bonsai prompt changes from the tuning ticket.
- Do not weaken fact-ID, privacy, or judge gates.
- Do not start classifier automation.
- Do not download or authorize new models by implication.
- Do not treat the model narrative path as required for `/flight-learn` usefulness.

## Open Questions

- What real or disposable dataset should be used for deterministic `/flight-learn` dogfooding without persisting private raw content in Loom?
- Is the operator's immediate priority richer narrative prose, or collecting enough manually routed outcome data to make the learning loop useful?
- Should future model work invest in judge/latency replay first, or grammar-constrained JSON first? The answer matters only if model polish remains a near-term priority.
- What corpus threshold should trigger the next classifier-readiness recheck in this repository after real usage begins?

## Related Records

- `ticket:20260529-flight-recorder-core-loop-stocktake` - consuming ticket for this research.
- `plan:20260529-flight-recorder-product-recalibration` - parent plan for the prompt-tuning and stocktake sequence.
- `spec:failure-memory-mvp` - original failure-memory product contract.
- `plan:20260522-pi-flight-recorder-mvp` - completed MVP plan and evidence boundary.
- `spec:delta-artifact-learning-loop` - core expectation-delta/artifact/outcome product contract.
- `plan:20260523-delta-artifact-learning-loop` - completed implementation arc for the core learning loop.
- `research:20260525-classifier-readiness-evaluation` - classifier automation gate and empty-corpus observation.
- `spec:flight-learn-inbox-ux` - `/flight-learn` UX and optional local-model requirements.
- `plan:20260528-flight-learn-4b-narrative-what-happened` - completed local narrative plan and residual limits.
- `evidence:20260528-bonsai-4b-narrative-validation` - first real 4B negative validation evidence.
- `ticket:20260529-bonsai-4b-schema-prompt-tuning` - prerequisite tuning ticket.
- `evidence:20260529-bonsai-4b-schema-prompt-tuning` - tuning evidence consumed here.
- `audit:20260529-bonsai-4b-schema-prompt-tuning-review` - audit of the tuning evidence.
