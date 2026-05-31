# Flight Recorder Core Loop Stocktake

ID: ticket:20260529-flight-recorder-core-loop-stocktake
Type: Ticket
Status: closed
Created: 2026-05-29
Updated: 2026-05-29
Risk: medium - this is a project-direction stocktake over core product semantics, and a weak conclusion could send later implementation toward the wrong loop.
Priority: medium - this should run after the Bonsai prompt-tuning ticket so the project does not stay trapped in local-model narrative work without a product-level checkpoint.
Depends On: ticket:20260529-bonsai-4b-schema-prompt-tuning

## Summary

Create a durable stocktake of where `pi-flight-recorder` is in its core product loop and what, if anything, should be reevaluated after the Bonsai 4B prompt/schema tuning experiment. The single closure claim is: the project has a concise, evidence-backed map of the current Flight Recorder loop, the real blockers to moving forward, and the recommended next direction after the local-model narrative experiment.

This is not an implementation ticket. It is an investigation/recalibration ticket that should write Loom records only and should not change source behavior.

## Related Records

- `plan:20260529-flight-recorder-product-recalibration` - parent plan coordinating the prompt-tuning experiment with this product-level stocktake.
- `ticket:20260529-bonsai-4b-schema-prompt-tuning` - prerequisite; its result should inform whether local-model narrative work remains worth pursuing.
- `spec:failure-memory-mvp` - original product slice: local evidence-backed failure/fix memory.
- `spec:delta-artifact-learning-loop` - broadened product definition: problems are expectation deltas; solutions are human-routed artifacts whose outcomes can later train automation.
- `spec:flight-learn-inbox-ux` - current UX contract for reviewing/routing deltas in `/flight-learn`, including optional local narrative `What happened?` behavior.
- `plan:20260523-delta-artifact-learning-loop` - completed implementation arc for delta capture, routing, artifact candidates, outcome/recurrence, and classifier-readiness evaluation.
- `research:20260525-classifier-readiness-evaluation` - explains why classifier automation remains premature until manually routed outcome corpus exists.
- `plan:20260528-flight-learn-4b-narrative-what-happened` - completed local-model narrative architecture/validation plan; closed with negative 4B recommendation under the first contract run.
- `evidence:20260528-bonsai-4b-narrative-validation` - baseline real 4B evidence: 0 accepted narratives / 15 fallbacks, mostly malformed/schema-invalid output.

## Scope

In scope:

- Inspect the current specs, plans, tickets, evidence, and relevant source surfaces enough to map the product loop as implemented and evidenced today.
- Explain the project in the operator's terms: recurring friction/errors become expectation deltas; deltas are reviewed in `/flight-learn`; the user routes deltas to artifact candidates; outcomes/recurrence build the corpus for future automation.
- Identify where the project has spent time recently and why: UX comprehension, deterministic diagnosis, optional Bonsai narrative, strict safety gates, local judge, and validation artifacts.
- Distinguish actual code blockers from product/evidence/contract blockers. Do not say “the model failed” if the evidence says the prompt/schema contract failed first.
- Consume the completed result of `ticket:20260529-bonsai-4b-schema-prompt-tuning` and state what it implies for the broader project.
- Produce a concise durable stocktake record, preferably under `.loom/research/`, that future agents can read before continuing the project.
- Recommend the next direction after tuning, for example: keep tuning prompt/schema, investigate grammar-constrained JSON, switch effort back to deterministic UX, gather real private-session/corpus evidence without persisting raw content, improve artifact-routing/outcome loop, or shape a new plan.

Out of scope:

- Implementing source changes.
- Editing product defaults, prompt code, local-model contracts, validators, storage, routes, UI, docs, package metadata, or tests.
- Starting classifier automation.
- Downloading or authorizing new models/runtimes.
- Declaring release readiness.
- Creating broad multi-month roadmap theater; this stocktake should make the next move clearer, not replace execution with process.

Key questions the stocktake should answer:

1. What is the core loop of `pi-flight-recorder` now, and which parts are implemented/evidenced versus aspirational?
2. What has actually kept the project in the local-model narrative area: product need, code architecture, prompt/schema mismatch, safety validation, evidence standards, or scope drift?
3. If Bonsai prompt tuning improves format/schema compliance, what is the smallest safe successor step?
4. If prompt tuning does not improve compliance, should the project step back to deterministic UX, grammar-constrained JSON, alternate local model research, or core-loop corpus work?
5. Is local-model narrative actually on the critical path to the product goal, or merely one possible polish layer over the more important human-reviewed delta/artifact loop?

Stop conditions:

- Stop if the tuning ticket is not closed or does not have enough evidence to inform the stocktake; update status instead of guessing.
- Stop if answering a question would require raw private sessions, unredacted paths, secrets, or full transcripts in Loom records.
- Stop if the stocktake reveals a behavior/spec contradiction that requires operator judgment before recommendation.
- Stop if the work starts proposing source edits; route those to a successor ticket or plan.

## Acceptance

- ACC-001: The stocktake maps the current product loop clearly.
  - Evidence: a durable Loom record explains the implemented/evidenced path from failure memory to expectation deltas, `/flight-learn` review, artifact candidates, outcome/recurrence, and classifier-readiness limits.
  - Audit/review: challenge whether it reflects the actual records rather than the chat narrative.

- ACC-002: The stocktake identifies the real bottleneck(s) behind the local-model narrative detour.
  - Evidence: the record separates code blockers, UX/product blockers, prompt/schema blockers, safety/judge blockers, evidence blockers, and corpus/classifier blockers.
  - Audit/review: challenge blame-shifting to “the model” or “the code” without evidence.

- ACC-003: The tuning ticket's result is interpreted at the product level.
  - Evidence: the stocktake explicitly consumes `ticket:20260529-bonsai-4b-schema-prompt-tuning` and states what its result means for `/flight-learn` UX and the larger delta/artifact loop.
  - Audit/review: challenge recommendations that ignore the new tuning evidence.

- ACC-004: The recommendation is actionable and bounded.
  - Evidence: the record recommends the next smallest move and names what should not happen next, including whether to continue model work, pivot to deterministic UX, prioritize corpus/outcome collection, or create a new plan.
  - Audit/review: challenge vague “keep improving” conclusions.

- ACC-005: Privacy and scope remain intact.
  - Evidence: no source files or non-Loom files are edited; no raw private sessions, secrets, unredacted absolute paths, or full transcripts are persisted in the stocktake.
  - Audit/review: challenge privacy leakage and source-edit creep.

## Current State

Closed as a reviewed Loom-only stocktake. Research record `research:20260529-flight-recorder-core-loop-stocktake` is completed and audit `audit:20260529-flight-recorder-core-loop-stocktake-review` returned clear. The stocktake maps the current core loop from failure memory to expectation deltas, `/flight-learn` review, artifact candidate routing, outcome/recurrence, and classifier readiness; separates implemented/evidenced work from aspirational/unproven claims; interprets the closed Bonsai prompt/schema tuning result; and recommends pivoting the next product move toward deterministic `/flight-learn` dogfooding/corpus/outcome collection rather than productizing local narrative. No source or non-Loom product files were edited by this ticket. Residual limits remain: this is record synthesis, not real-user dogfooding, classifier readiness, release readiness, or a broad source-architecture audit.

## Journal

- 2026-05-29: Created by Loom Weaver as part of `plan:20260529-flight-recorder-product-recalibration`. The operator questioned whether the local-model narrative work had become too large and asked for a project-level checkpoint after the tuning ticket.
- 2026-05-29: Driver set status to active after closing prerequisite `ticket:20260529-bonsai-4b-schema-prompt-tuning`; launched bounded Ralph stocktake/research run.
- 2026-05-29: Created completed stocktake research at `research:20260529-flight-recorder-core-loop-stocktake`. Key conclusion: local narrative remains optional polish; the main product loop is not blocked by code architecture, and the next smallest honest move should return to deterministic `/flight-learn` comprehension plus manually routed corpus/outcome collection. Moved ticket to review.
- 2026-05-29: Audit `audit:20260529-flight-recorder-core-loop-stocktake-review` returned clear for the bounded research-only scope. Closed ticket; successor recommendation is a separate deterministic `/flight-learn` dogfooding/corpus collection ticket if the operator chooses to continue product execution.
