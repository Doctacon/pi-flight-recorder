# Flight Recorder Product Recalibration

ID: plan:20260529-flight-recorder-product-recalibration
Type: Plan
Status: completed
Created: 2026-05-29
Updated: 2026-05-29
Risk: medium - the project is at risk of mistaking a local-model narrative tuning problem for the whole product direction, or abandoning a useful UX path without evidence.

## Summary

This plan creates a short recalibration initiative for `pi-flight-recorder` after the operator reported losing the thread of the project. The original product goal was clear: remember recurring failures/friction. The product then correctly broadened “error” into expectation delta and “fix” into human-routed artifact candidate, but the recent work became concentrated in a narrow UX/model seam: making `/flight-learn` explain a delta in plain English and optionally generate a local Bonsai narrative.

The plan needs more than one execution unit because there are two distinct closure stories: first, test whether the Bonsai 4B narrative failure was mostly prompt/schema mismatch; second, step back and map what that result means for the core Flight Recorder loop. The outcome is not automatic classifier work or productized model behavior. The outcome is a grounded decision about whether to continue local-model narrative work, pivot back to deterministic UX/core-loop collection, or shape a successor plan.

## Related Records

- `spec:failure-memory-mvp` - original product behavior: local, evidence-backed prior failure/fix memory.
- `spec:delta-artifact-learning-loop` - core product expansion: problems are expectation deltas and solutions are human-routed artifacts with later outcome tracking.
- `spec:flight-learn-inbox-ux` - current UX contract for presenting deltas clearly in `/flight-learn`, including optional local narrative polish.
- `plan:20260523-delta-artifact-learning-loop` - completed implementation arc for delta capture, artifact routing, outcome/recurrence, and classifier-readiness evaluation.
- `research:20260525-classifier-readiness-evaluation` - shows classifier automation remains blocked by lack of manually routed outcome corpus.
- `plan:20260528-flight-learn-4b-narrative-what-happened` - completed model-narrative architecture plan; closed with negative 4B validation under the initial contract.
- `ticket:20260528-bonsai-4b-narrative-validation` and `evidence:20260528-bonsai-4b-narrative-validation` - real Bonsai 4B baseline: 0 accepted narratives / 15 fallback, mainly malformed/schema-invalid output.
- `ticket:20260529-bonsai-4b-schema-prompt-tuning` - first child ticket for prompt/schema-only tuning.
- `ticket:20260529-flight-recorder-core-loop-stocktake` - second child ticket for post-tuning product stocktake.

## Strategy

Treat the operator's concern as a product-shape signal, not just frustration with one model run.

The dangerous ambiguity is this: the recent blockage can look like “the model is stopping us” or “the code is stopping us,” but the records show a more nuanced issue. The project added strict local-first model gates because the field is privacy-sensitive and display-only. Bonsai 4B generated plausible narrative fragments, but it did not satisfy the exact JSON/schema/fact-ID contract often enough to reach the quality/judge layer. That does not prove the model is bad; it proves the current prompt/contract path is not yet usable.

At the same time, local-model narrative is not the whole product. It is a polish layer over the more important loop:

1. detect or capture an expectation delta;
2. show it clearly enough that a human understands it;
3. route it to an artifact candidate or observe/no-artifact;
4. track whether the chosen artifact changed recurrence;
5. only later consider classifier automation from labeled outcomes.

This plan therefore uses a two-step route:

1. **Risk-first model diagnosis:** run the prompt/schema tuning ticket because it directly tests the operator's suspicion that contract mismatch, not model reasoning, caused the 0/15 result.
2. **Product-level stocktake:** after tuning, step back and decide whether the project should continue investing in Bonsai narrative, use grammar-constrained JSON, return focus to deterministic UX/corpus collection, or shape a different initiative.

Scope included:

- prompt/schema-only Bonsai 4B tuning using the existing model and strict gates;
- a post-tuning stocktake of current product loop, bottlenecks, and next direction;
- Loom-only records and evidence to keep future agents from rediscovering the same confusion.

Scope excluded:

- productizing prompt changes in this plan;
- new model downloads, hosted calls, non-loopback endpoints, or runtime installs;
- weakening fact-ID verifier, local judge veto, or privacy gates;
- classifier automation;
- broad roadmap theater beyond the next bounded direction.

Validation posture inherited by child tickets:

- evidence must stay local/synthetic/redacted unless explicitly authorized otherwise;
- no raw private sessions, secrets, prompts, stack traces, full transcripts, or unredacted absolute paths in Loom artifacts;
- recommendation must distinguish model capability, prompt/schema compliance, safety validation, UX need, code architecture, and corpus readiness;
- audit/review should challenge overclaiming from a 15-case synthetic corpus.

Replan triggers:

- prompt tuning produces unsafe accepted output;
- prompt-only variants do not improve schema compliance, making grammar-constrained decoding or a different model family the real next question;
- tuning succeeds but accepted narrative still does not materially improve operator understanding;
- the stocktake finds that local-model narrative is not on the critical path to the core delta/artifact loop;
- the project needs operator judgment about product priority before another implementation ticket is honest.

## Execution Units

### Unit: Bonsai 4B schema/prompt tuning

Ticket: `ticket:20260529-bonsai-4b-schema-prompt-tuning`

Run a bounded prompt/schema tuning experiment against the existing Bonsai 4B Q1_0 GGUF and the existing synthetic/redacted narrative corpus. The goal is to determine whether prompt-only/schema-instruction changes materially improve parse/schema/verifier/judge pass rates over the prior 0/15 baseline while keeping strict fail-closed safety.

Scope boundary: harness/prompt experiment and evidence only. No product defaults, UI, routing, storage, source-of-truth, verifier/judge weakening, or model downloads.

Order reason: this directly tests the hypothesis that the local-model detour is blocked by contract mismatch rather than Bonsai reasoning quality.

### Unit: Core loop stocktake

Ticket: `ticket:20260529-flight-recorder-core-loop-stocktake`
Depends On: `ticket:20260529-bonsai-4b-schema-prompt-tuning`

Create a durable stocktake of where Flight Recorder is in its product loop after the prompt/schema tuning result. It should map the implemented/evidenced loop from failure memory to expectation deltas, `/flight-learn` review, artifact candidates, outcome/recurrence, and classifier-readiness limits; then name what actually needs reevaluation.

Scope boundary: Loom records only, likely a research/stocktake record. No source changes, prompt productization, classifier work, or new model authorization.

Order reason: the stocktake should consume the tuning result rather than guessing whether local narrative should continue.

## Milestones

### Milestone: Model-contract hypothesis tested

Child tickets: `ticket:20260529-bonsai-4b-schema-prompt-tuning`

The project knows whether the first Bonsai 4B narrative failure was likely prompt/schema compliance rather than pure model inability, based on comparable staged metrics and strict safety posture.

### Milestone: Product loop is legible again

Child tickets: `ticket:20260529-flight-recorder-core-loop-stocktake`

The operator and future agents have a concise durable map of where the project stands, what is implemented versus aspirational, which bottlenecks are real, and what the next smallest honest move should be.

## Current State

Completed. Both child tickets are closed with evidence/review:

- `ticket:20260529-bonsai-4b-schema-prompt-tuning` closed after `evidence:20260529-bonsai-4b-schema-prompt-tuning` and clear audit `audit:20260529-bonsai-4b-schema-prompt-tuning-review`. Result: prompt/schema tuning materially improved structured-output staging for `exact-example-single-json` but still produced 0/15 accepted narratives; do not productize local Bonsai narrative.
- `ticket:20260529-flight-recorder-core-loop-stocktake` closed after completed `research:20260529-flight-recorder-core-loop-stocktake` and clear audit `audit:20260529-flight-recorder-core-loop-stocktake-review`. Result: local narrative is optional polish, not the core product blocker; the next recommended product slice is deterministic `/flight-learn` dogfooding/corpus/outcome collection.

The plan outcome is a grounded decision: stop treating Bonsai narrative as the project center of gravity. The core Flight Recorder loop remains failure memory -> expectation delta -> `/flight-learn` review -> human artifact-candidate routing -> outcome/recurrence -> later classifier readiness. Further model work should be separate, narrow, and evidence-only (judge/latency replay or grammar-constrained JSON), while the recommended product continuation is to verify deterministic `/flight-learn` comprehension and collect manually routed outcome data.

## Journal

- 2026-05-29: Created by Loom Weaver after the operator explained the original product arc and concern that the project had become stuck in local-model narrative work. Chose a short two-ticket recalibration plan rather than a broad roadmap or immediate implementation change.
- 2026-05-29: Driver drained both child tickets in dependency order. Closed the Bonsai tuning ticket with clear audit and closed the core-loop stocktake ticket with clear audit. Marked plan completed with successor recommendation: deterministic `/flight-learn` dogfooding/corpus/outcome collection, not prompt productization or classifier automation.
