# Classifier Readiness Evaluation

ID: ticket:20260523-classifier-readiness-evaluation
Type: Ticket
Status: closed
Created: 2026-05-23
Updated: 2026-05-25
Risk: high - an LLM classifier can look useful while routing deltas by vibes, so readiness must be evidence-backed before any default automation is accepted
Priority: low - intentionally sequenced after corpus/outcome data exists
Depends On: ticket:20260523-outcome-recurrence-metrics

## Summary

Evaluate whether `pi-flight-recorder` has enough manually routed delta/outcome data to justify automated artifact classification. This is a research/decision ticket, not an implementation ticket for a default classifier. Its closure claim is an evidence-backed recommendation: not ready, advisory-only experiment, opt-in classifier prototype in a later plan, or keep manual indefinitely.

## Related Records

- `plan:20260523-delta-artifact-learning-loop` - explains why classifier work comes after corpus and outcome tracking.
- `spec:delta-artifact-learning-loop#REQ-010` - classifier must not become default before enough labeled outcomes exist.
- `ticket:20260523-outcome-recurrence-metrics` - prerequisite outcome/recurrence state.
- `constitution:main` - local-first and human-gated promotion constraints.

## Scope

May change:

- Research records under `.loom/research/` and this ticket's state/journal.
- Optional local analysis scripts/artifacts under `.loom/evidence/artifacts/` if needed to summarize corpus counts, label distribution, and outcome availability.
- Evidence records if actual corpus observations are gathered.

Must not change:

- No application source, package files, prompts, classifiers, model calls, or default automation.
- No raw session dumps, raw prompts, or unredacted user data in research/evidence.
- No claim that classifier routing is reliable without measured agreement/outcome evidence.

Evaluation questions:

- How many deltas have been manually routed?
- How many have artifact candidates and outcome/recurrence labels?
- Is the artifact-type distribution broad enough to train/evaluate routing, or dominated by one type?
- Can a simple baseline outperform generic “make a rule” routing?
- What privacy boundary would any model-assisted classifier need?
- What failure mode would be unacceptable: wrong artifact, premature rule, missed code-legibility issue, or noisy review burden?

## Acceptance

- ACC-001: The ticket records corpus counts and label/outcome coverage, with redacted/aggregate evidence only.
  - Evidence: research/evidence record with aggregate counts and limits.
  - Audit: Review should challenge whether the sample is sufficient and representative.

- ACC-002: The ticket compares at least three options: continue manual-only, advisory classifier suggestions, and opt-in classifier prototype in a later plan.
  - Evidence: research record with tradeoffs and rejected paths.
  - Audit: Review should challenge classifier theater and premature automation.

- ACC-003: The ticket produces a recommendation and downstream route without implementing the classifier.
  - Evidence: `.loom/research/...` or constitution/decision recommendation if it becomes durable roadmap judgment.
  - Audit: If the recommendation enables automation, a separate adversarial review is required before a new implementation plan.

- ACC-004: If corpus thresholds are not met, the result says “not ready” and names what data must be collected next.
  - Evidence: research conclusion with thresholds/next data needs.
  - Audit: Review should reject attempts to lower the bar retroactively.

## Current State

Closed. Aggregate corpus evidence, research recommendation, and audit are complete.

Closure support:

- ACC-001: `evidence:20260525-classifier-readiness-corpus-counts` records aggregate-only local SQLite counts and label/outcome coverage. The read-only observation found no delta/artifact tables in the default database and therefore `0` expectation deltas, `0` artifact candidates, `0` outcome-labeled candidates, and `0` recurrence links available for classifier evaluation.
- ACC-002: `research:20260525-classifier-readiness-evaluation` compares manual-only routing, advisory classifier suggestions, and opt-in classifier prototype options with tradeoffs and rejected paths.
- ACC-003: the recommendation is **not ready**: continue manual-only routing; do not create a classifier implementation ticket/plan; revisit after threshold evidence exists. No classifier was implemented.
- ACC-004: thresholds are not met; the research names the next data needed: 30-50 manually routed deltas, outcome-labeled/applied candidates, recurrence links, artifact-type diversity, and baseline comparisons.

Audit: `audit:20260525-classifier-readiness-evaluation-review` with verdict `clear` within audited scope.

No application source/package/prompt/classifier/model changes were made. No raw sessions, raw prompts, snippets, commands, rationale text, drafts, evidence refs, or unredacted session paths were exported.

Residual limits: this is a point-in-time aggregate over the default local DB, not a long-run corpus study; missing delta/artifact tables support `not ready` but do not diagnose why the corpus has not accumulated.

## Journal

- 2026-05-23: Created to preserve the operator/LLM insight that a classifier may be useful, but only after corpus and outcome data exist.
- 2026-05-23: Set active after `ticket:20260523-outcome-recurrence-metrics` closed; starting aggregate-only corpus evaluation and research recommendation. No source/classifier/model changes are in scope.
- 2026-05-25: Recorded `evidence:20260525-classifier-readiness-corpus-counts`; aggregate local corpus counts are all zero for deltas, artifact candidates, outcome labels, and recurrence links, with delta/artifact tables absent in the read-only default DB observation.
- 2026-05-25: Completed `research:20260525-classifier-readiness-evaluation` with recommendation `not ready`; moved to review for audit.
- 2026-05-25: Recorded `audit:20260525-classifier-readiness-evaluation-review` with verdict `clear`; closed without source/classifier/model changes.
