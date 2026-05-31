# Flight Recorder Core Loop Stocktake Audit

ID: audit:20260529-flight-recorder-core-loop-stocktake-review
Type: Audit
Status: recorded
Created: 2026-05-29
Updated: 2026-05-29
Audited: 2026-05-29
Target: ticket:20260529-flight-recorder-core-loop-stocktake

## Summary

Ralph reviewed `ticket:20260529-flight-recorder-core-loop-stocktake` and the completed stocktake research. Verdict is clear for the bounded Loom-only stocktake: ACC-001 through ACC-005 are supported, with residual caveats that the review is record-synthesis, not release readiness, real-user validation, classifier readiness, or a broad source-architecture audit.

## Target

The target is the research/stocktake closure claim for `ticket:20260529-flight-recorder-core-loop-stocktake`: a concise, evidence-backed map of the current Flight Recorder loop, the local-model narrative bottleneck, the Bonsai prompt/schema tuning implication, and the next bounded direction after tuning. The ticket explicitly scopes Loom records only and excludes source changes, model downloads, classifier work, release readiness, and roadmap theater (`.loom/tickets/20260529-flight-recorder-core-loop-stocktake.md:14-16`, `.loom/tickets/20260529-flight-recorder-core-loop-stocktake.md:42-49`).

## Audit Scope And Lenses

Lenses used: ACC-001..ACC-005 acceptance support, claim/evidence fit, local-model stall diagnosis, Bonsai tuning consumption, recommendation boundedness, privacy/scope, and overclaiming risk.

Out of scope: source-code implementation review, rerunning model experiments, validating real private sessions, classifier evaluation, and deciding the successor product priority for the operator.

## Context And Evidence Reviewed

- Ralph review run: bounded audit over `ticket:20260529-flight-recorder-core-loop-stocktake`, `research:20260529-flight-recorder-core-loop-stocktake`, and the related Loom records named by the audit request.
- `.loom/tickets/20260529-flight-recorder-core-loop-stocktake.md` - acceptance criteria and scope (`ACC-001`..`ACC-005` at lines 68-85; current closure claim at line 90).
- `.loom/research/20260529-flight-recorder-core-loop-stocktake.md` - completed stocktake under review.
- `.loom/plans/20260529-flight-recorder-product-recalibration.md` - parent two-step recalibration plan.
- `.loom/tickets/20260529-bonsai-4b-schema-prompt-tuning.md`, `.loom/evidence/20260529-bonsai-4b-schema-prompt-tuning.md`, and `.loom/audit/20260529-bonsai-4b-schema-prompt-tuning-review.md` - prerequisite tuning result and audit.
- `.loom/specs/failure-memory-mvp.md` and `.loom/plans/20260522-pi-flight-recorder-mvp.md` - original failure-memory contract and completed MVP boundary.
- `.loom/specs/delta-artifact-learning-loop.md` and `.loom/plans/20260523-delta-artifact-learning-loop.md` - expectation-delta/artifact/outcome loop contract and completed implementation arc.
- `.loom/specs/flight-learn-inbox-ux.md` - `/flight-learn` UX and optional local-model narrative contract.
- `.loom/research/20260525-classifier-readiness-evaluation.md` and `.loom/evidence/20260525-classifier-readiness-corpus-counts.md` - classifier-readiness gate and empty-corpus observation.
- `.loom/plans/20260528-flight-learn-4b-narrative-what-happened.md` and `.loom/evidence/20260528-bonsai-4b-narrative-validation.md` - local narrative architecture and prior negative 4B validation.
- Read-only checks: `grep` over the stocktake research for raw home paths, private-session paths, obvious secret assignments, transcript markers, and `.jsonl` references returned no matches; `git status --short` was inspected for scope caveats.

## Findings

No material negative findings within the audited scope.

### ACC-001: current product loop is mapped and record-supported

Supported. The stocktake maps the loop as failure memory -> expectation delta -> `/flight-learn` review -> artifact candidate routing -> outcome/recurrence feedback -> classifier readiness (`.loom/research/20260529-flight-recorder-core-loop-stocktake.md:62-69`). That map is consistent with the failure-memory MVP completion boundary (`.loom/plans/20260522-pi-flight-recorder-mvp.md:111-115`), the delta-artifact spec's coverage of expectation deltas, manual artifact routing, outcome/recurrence, and corpus-building (`.loom/specs/delta-artifact-learning-loop.md:21-27`, `.loom/specs/delta-artifact-learning-loop.md:66-77`), and the completed delta-artifact plan state (`.loom/plans/20260523-delta-artifact-learning-loop.md:142-153`).

### ACC-002: local-model narrative stall is diagnosed fairly

Supported. The stocktake does not reduce the stall to “the model failed” or “the code is bad”; it separates UX comprehension need, domain-language ambiguity, privacy/display-only gates, prompt/schema compliance, semantic safety, judge latency/behavior, and evidence standards (`.loom/research/20260529-flight-recorder-core-loop-stocktake.md:92-102`). This matches the narrative plan's field-specific model contract and safety boundaries (`.loom/plans/20260528-flight-learn-4b-narrative-what-happened.md:35-60`, `.loom/plans/20260528-flight-learn-4b-narrative-what-happened.md:94-118`) and the prior real 4B validation showing 0/15 accepted narratives mostly from malformed/schema-invalid output before accepted display (`.loom/evidence/20260528-bonsai-4b-narrative-validation.md:14`, `.loom/evidence/20260528-bonsai-4b-narrative-validation.md:94-103`).

The stocktake's “not source architecture outright” diagnosis is acceptable only in the bounded sense used by the records: this run did not surface a source-architecture blocker, while the optional model path still has model-contract/judge/evidence bottlenecks. The prior Bonsai tuning audit already preserves this caveat (`.loom/audit/20260529-bonsai-4b-schema-prompt-tuning-review.md:23-24`).

### ACC-003: Bonsai prompt tuning result is consumed correctly

Supported. The stocktake records the material tuning result accurately: prior 0/15 accepted validation; best tuned variant `exact-example-single-json` at 8/15 parse-valid, 8/15 schema-valid, 7/15 verifier pass, 0/15 accepted, and zero unsafe accepts; and no productization claim (`.loom/research/20260529-flight-recorder-core-loop-stocktake.md:104-117`). Those numbers match the evidence table and bounded conclusion (`.loom/evidence/20260529-bonsai-4b-schema-prompt-tuning.md:81-88`) and the prerequisite audit's clear-but-bounded verdict (`.loom/audit/20260529-bonsai-4b-schema-prompt-tuning-review.md:10-12`).

### ACC-004: recommendation is actionable and bounded

Supported. The stocktake recommends one bounded successor ticket for deterministic `/flight-learn` dogfooding/corpus collection, with explicit goals to verify operator understanding/routing, record artifact/outcome friction, and identify UX blockers (`.loom/research/20260529-flight-recorder-core-loop-stocktake.md:194-198`). It also explicitly names what not to do next: do not productize the Bonsai prompt, weaken gates, start classifier automation, authorize/download new models implicitly, or make local narrative required for `/flight-learn` usefulness (`.loom/research/20260529-flight-recorder-core-loop-stocktake.md:200-213`). This is more concrete than vague roadmap language and aligns with classifier-readiness research recommending manual corpus collection before automation (`.loom/research/20260525-classifier-readiness-evaluation.md:107-130`).

### ACC-005: privacy and scope are intact for the stocktake record

Supported for the stocktake record itself. The research excludes source changes, new runtimes, classifier implementation, release readiness, raw private sessions, secrets, raw prompts, transcripts, stack traces, unredacted local paths, and broad roadmap scope (`.loom/research/20260529-flight-recorder-core-loop-stocktake.md:31-40`). The target record uses relative Loom references and no raw private path/secret/transcript content was found by the targeted scan.

Scope caveat: current `git status --short` shows broader uncommitted source changes and an untracked `worker/` handoff file in the repository. I did not attribute those source changes to this stocktake ticket, and the stocktake itself is Loom-only, but this audit should not be reused as a repository-wide clean-worktree/no-source-diff proof.

## Verdict

clear. The stocktake is accurate enough to close as a bounded product-loop synthesis. It satisfies ACC-001 through ACC-005, correctly consumes the Bonsai prompt/schema tuning result, avoids overclaiming release readiness or real-user/model/classifier usefulness, and provides an actionable next slice rather than roadmap theater.

The verdict is bounded: it certifies the stocktake record against the reviewed Loom evidence, not the current source implementation, not live Pi usefulness, not real private-session corpus quality, and not broad architecture health.

## Required Follow-up

None required before closing `ticket:20260529-flight-recorder-core-loop-stocktake` for its Loom-only stocktake scope.

Before any successor claim, keep the stocktake's own limits intact:

- Create a separate bounded ticket if proceeding with deterministic `/flight-learn` dogfooding/corpus collection.
- Create a separate evidence-only ticket if proceeding with judge/latency replay or grammar-constrained JSON model work.
- Do not use this stocktake to justify prompt productization, classifier automation, release readiness, or weakening privacy/fact-ID/judge gates.
- If a future closure needs a clean-worktree/no-source-edit claim, reconcile current source modifications separately.

## Residual Risk

- The recommendation is based on Loom record synthesis and synthetic/redacted model evidence, not new real-user dogfooding.
- The classifier-readiness count is point-in-time evidence from 2026-05-25; it must be rechecked after meaningful manual routing/outcome data exists.
- Bonsai prompt tuning improved structure but still produced 0/15 accepted narratives and used the same local self-judge path; independent judge quality, longer timeout behavior, grammar-constrained JSON, and alternate local/open-source models remain unproven.
- The stocktake's source-architecture conclusion is a bounded “not evidenced as the blocker here” conclusion, not a full architecture audit.

## Closure Recommendation

Close `ticket:20260529-flight-recorder-core-loop-stocktake` as reviewed/accepted for the research-only scope. Use the stocktake to shape the next bounded product slice around deterministic `/flight-learn` dogfooding and routed/outcome corpus collection; keep any further local-model work separate, narrow, and evidence-only until accepted safe narratives exist and pass audit.

## Related Records

- `ticket:20260529-flight-recorder-core-loop-stocktake` - audited ticket.
- `research:20260529-flight-recorder-core-loop-stocktake` - audited stocktake record.
- `plan:20260529-flight-recorder-product-recalibration` - parent recalibration plan.
- `ticket:20260529-bonsai-4b-schema-prompt-tuning` - prerequisite tuning ticket.
- `evidence:20260529-bonsai-4b-schema-prompt-tuning` - tuning evidence consumed by the stocktake.
- `audit:20260529-bonsai-4b-schema-prompt-tuning-review` - prerequisite tuning audit.
- `spec:delta-artifact-learning-loop` - core delta/artifact/outcome contract.
- `research:20260525-classifier-readiness-evaluation` - classifier-readiness gate.
