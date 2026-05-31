# Flight Learn Narrative What Happened Feedback

ID: evidence:20260528-flight-learn-narrative-what-happened-feedback
Type: Evidence Observation
Status: recorded
Created: 2026-05-28
Updated: 2026-05-28
Observed: 2026-05-28

## Summary

The operator provided a `/flight-learn` focused-card screenshot and clarified that the current `Problem` and `What happened?` sections are too repetitive. The operator wants `Problem` to stay concise while `What happened?` becomes a longer narrative, specifically using Bonsai 4B Q1_0 GGUF when explicitly enabled.

The screenshot itself was not copied into Loom artifacts. This record preserves only the product observation and redacted visible text needed to shape downstream work.

## Observation

Visible card shape in the operator-provided screenshot:

```text
Problem
  A repeated workflow problem showed up across recent sessions.

What happened?
  Pi saw a repeated failure pattern twice in recent sessions.
```

The operator's product feedback:

```text
The thing is, I think I do want a longer narrative inside of the issue's "what happened?" ... the 'problem' and 'what happened' are almost the exact same words and that's not helpful. 'what happened' should be a narrative from the Bonsai 4B Q1_0 GGUF
```

## Interpretation

This challenges the current local-model quality rubric that rewarded matching deterministic wording. For this UI surface, a useful local-model result should not merely mirror the deterministic diagnosis. It should make the `What happened?` section carry narrative context while keeping the headline concise and display-only.

## What This Shows

- `spec:flight-learn-inbox-ux#REQ-030` through `REQ-032` and `SCN-010` are motivated by operator-visible UI feedback: the current card can duplicate the same concept across `Problem` and `What happened?`.
- `plan:20260528-flight-learn-4b-narrative-what-happened` should evaluate Bonsai 4B against a narrative-specific goal rather than the prior equivalence-focused rubric.

## What This Does Not Show

- This does not prove Bonsai 4B can produce the desired narrative safely.
- This does not authorize making local-model output default or required.
- This does not justify weakening privacy, display-only, route/storage, or unsupported-fact safeguards.
- This does not provide a complete visual QA pass across terminal sizes or themes.

## Freshness And Recheck Triggers

Revisit this evidence if the focused-card layout changes materially, if `Problem`/`What happened?` section semantics change, or if Bonsai 4B narrative validation shows that the desired narrative cannot be produced safely under local-first constraints.
