# Classifier Readiness Evaluation

ID: research:20260525-classifier-readiness-evaluation
Type: Research
Status: completed
Created: 2026-05-25
Updated: 2026-05-25

## Summary

`pi-flight-recorder` is not ready for automated artifact classification. The current default local database does not yet contain the delta/artifact tables and therefore has zero expectation deltas, zero artifact candidates, zero outcome labels, and zero recurrence links available for classifier evaluation. The only evidence-backed recommendation is to keep routing manual-only and revisit after a labeled outcome corpus exists.

## Question

Does the current local expectation-delta / artifact-candidate / outcome corpus justify automated artifact classification, and if not, what data must be collected before classifier work is credible?

## Scope

Covers:

- local aggregate corpus counts from the default `pi-flight-recorder` SQLite database;
- readiness against `spec:delta-artifact-learning-loop#REQ-010` and the plan's 30-50 manually routed delta threshold;
- comparison of three downstream options:
  - continue manual-only;
  - advisory classifier suggestions;
  - opt-in classifier prototype in a later plan;
- privacy and failure-mode constraints for any future model-assisted route.

Excludes:

- implementing a classifier, prompt, model call, source change, package change, or automation;
- inspecting raw sessions, raw prompts, evidence snippets, drafts, or rationale text;
- external model/provider evaluation;
- claiming long-run classifier usefulness or artifact-routing accuracy.

Freshness limits:

- The aggregate counts are point-in-time observations from 2026-05-25. Recheck after manually routing and labeling more deltas.

## Method And Sources

- `ticket:20260523-classifier-readiness-evaluation` - scope, acceptance, and evaluation questions.
- `plan:20260523-delta-artifact-learning-loop` - sequencing rationale: corpus/manual routing/outcome evidence before classifier automation.
- `spec:delta-artifact-learning-loop#REQ-010` - automated artifact classification must not become default before enough manually routed outcomes exist.
- `constitution:main` - local-first, evidence-backed, human-gated promotion constraints.
- `evidence:20260525-classifier-readiness-corpus-counts` - aggregate-only observation over the default local SQLite corpus.
- Prerequisite records:
  - `ticket:20260523-outcome-recurrence-metrics`
  - `evidence:20260523-outcome-recurrence-metrics-validation`
  - `audit:20260523-outcome-recurrence-metrics-review`

No hosted model/provider calls were made. No raw session or prompt content was inspected or persisted.

## Findings

1. **The local routed/outcome corpus is empty.**
   - The default local database does not yet contain `expectation_deltas`, `delta_detector_signals`, `artifact_candidates`, or `delta_recurrence_links` tables under the read-only aggregate query.
   - Aggregate counts available for classifier evaluation are therefore: `expectationDeltas=0`, `artifactCandidates=0`, `distinctDeltasWithArtifactCandidates=0`, `outcomeLabeledArtifactCandidates=0`, `appliedWithOutcomeArtifactCandidates=0`, `recurrenceLinks=0`.
   - Source: `evidence:20260525-classifier-readiness-corpus-counts`.

2. **The plan/spec threshold is not met.**
   - The spec's recommended starting threshold is 30-50 manually routed deltas with at least some outcome labels before serious classifier evaluation.
   - Current routed delta count is `0`; outcome-labeled count is `0`; recurrence evidence count is `0`.

3. **Artifact-type distribution cannot be evaluated.**
   - There are no artifact candidates, so there is no evidence about whether routes are dominated by one type, cover code-legibility/test/rule/observe categories, or support any meaningful baseline.

4. **A simple “always make a Flight Rule” baseline cannot be measured yet.**
   - With zero routed examples, there is no human-label distribution to compare against.
   - This matters because the product explicitly rejects treating every repeated problem as a Flight Rule.

5. **Outcome quality cannot be evaluated yet.**
   - No applied/outcome-labeled candidates and no recurrence links means there is no evidence that any route helped, failed, needed reroute, or reduced recurrence.
   - A classifier trained or evaluated without outcomes would optimize label imitation at best, not solution quality.

6. **The privacy boundary for future classifier work must stay local/redacted/explicit.**
   - Any model-assisted route must use bounded/redacted evidence, disclose model use, and remain advisory or opt-in until evaluated.
   - Raw sessions, prompts, paths, snippets, and provider payloads must not be sent or persisted by default.

## Tradeoffs

- **Option A: continue manual-only routing (recommended now).**
  - Strength: matches the current evidence; preserves human judgment; builds the labeled corpus the classifier needs; avoids noisy automation.
  - Weakness: slower corpus growth and more manual review burden.
  - Downstream consequence: no classifier ticket should be opened yet; focus on real usage, routing, outcome labels, and recurrence links.

- **Option B: advisory classifier suggestions.**
  - Strength: could reduce review friction later by suggesting likely artifact types while preserving human approval.
  - Weakness: with zero labels/outcomes today, suggestions would be vibes, not evidence-backed; bad suggestions could bias users toward Flight Rules or away from code-legibility/test fixes.
  - Downstream consequence: reject for now. Reconsider only after enough human-routed labels exist to compare suggestions against manual decisions and outcome evidence.

- **Option C: opt-in classifier prototype in a later plan.**
  - Strength: could be useful once there is a corpus and a bounded evaluation harness; can stay local/redacted and opt-in.
  - Weakness: premature now; likely to create classifier theater and distract from corpus quality.
  - Downstream consequence: reject for now. A later plan may prototype only after threshold and evaluation gates are satisfied.

## Rejected Paths And Null Results

- **Default classifier implementation now** - rejected because it violates `REQ-010` and has zero local labels/outcomes to evaluate.
- **Hosted/model-assisted classifier now** - rejected because there is no corpus basis and no explicit operator authorization for model/provider calls.
- **Lowering the threshold because the new data model exists** - rejected; schema support is not outcome evidence.
- **Measuring only route-label agreement without outcomes** - insufficient; the product defines a solution by recurrence/outcome, not just selected artifact type.
- **Using raw sessions to bootstrap labels automatically** - out of scope and privacy-risky for this ticket; detectors may create candidates, but routing/outcome labels must remain human-reviewed.

## Conclusions

The recommendation is **not ready**.

Automated artifact classification should remain out of scope until the project has a meaningful local corpus. At minimum, re-evaluation should require:

- at least 30 manually routed deltas, with a stronger target of 50 before default automation is even discussed;
- at least 10 outcome-labeled artifact candidates, including several applied candidates;
- recurrence links for at least some applied candidates, including both no-recurrence-observed and recurring-after-applied examples;
- at least three artifact types represented with multiple examples, so “always make a Flight Rule” can be compared against real human routing;
- an explicit baseline comparison: generic Flight Rule route, majority-class route, simple rule-based route, and any proposed model-assisted route;
- privacy review for any model-assisted evaluation context.

Until then, classifier suggestions would be classifier theater: plausible-looking, but unsupported by evidence.

## Recommendations

- Close `ticket:20260523-classifier-readiness-evaluation` as **not ready** with this research and aggregate evidence.
- Do not create a classifier implementation ticket or plan now.
- Keep `plan:20260523-delta-artifact-learning-loop` completed after this final execution unit closes; future classifier work should start a new plan only after threshold evidence exists.
- Use the existing manual loop to collect labeled data:
  - review/capture deltas;
  - route to artifact candidates with rationale;
  - mark applied/rejected/outcomes;
  - link recurrences when similar deltas appear.
- Re-run this aggregate evaluation when the corpus approaches the threshold.

## Open Questions

- What exact corpus threshold should unlock advisory-only experiments versus opt-in prototypes? This research proposes minimum gates, but a future plan should confirm them against real data.
- Should future evaluation include synthetic fixtures as a regression suite after real labels exist? Synthetic data can test mechanics but should not substitute for real manual outcome labels.

## Related Records

- `ticket:20260523-classifier-readiness-evaluation` - consuming ticket.
- `evidence:20260525-classifier-readiness-corpus-counts` - aggregate corpus observation.
- `spec:delta-artifact-learning-loop#REQ-010` - classifier gating requirement.
- `plan:20260523-delta-artifact-learning-loop` - sequencing plan now ready to close after this ticket.
- `constitution:main` - local-first and human-gated promotion constraints.
