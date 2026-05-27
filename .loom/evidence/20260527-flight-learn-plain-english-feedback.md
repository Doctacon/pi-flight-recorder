# Flight Learn Plain-English Feedback

ID: evidence:20260527-flight-learn-plain-english-feedback
Type: Evidence Observation
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Observed: 2026-05-27

## Summary

The operator reviewed the real focused-card `/flight-learn` UI and found it mostly improved, but identified a remaining comprehension problem: the `Issue` and `What happened?` sections are still code-heavy, internal, and hard to understand in plain English. The screenshot also shows the primary issue text compressed into one long line with truncation.

## Source And Procedure

- Source: operator-provided screenshot and feedback in the current Loom Weaver shaping session.
- Original screenshot path provided by operator: `/var/folders/xk/pmxkhd7x635cskr6l4qw0mx00000gn/T/pi-clipboard-ce2749f1-09fc-47a0-95e1-2f67d5566a67.png`.
- Preserved artifact: `.loom/evidence/artifacts/20260527-flight-learn-plain-english-feedback/focused-card-plain-english-feedback.png`.
- Related UI state: focused-card `/flight-learn` after the focused-card redesign and real Pi validation.

## Observation

The screenshot shows a focused-card view with the header `Flight Learn — Issue 4 of 6` and primary content like:

```text
Issue
  bash cd /Users/<user>/Code/personal/pi-flight-recorder && npm test > pi-flight…

What happened?
  Observed 2 related failure occurrences in reflection cluster cluster_73111b7e16551a58.

Why it matters
  Repeated local friction across tools/cwds: bash.
```

The operator feedback was:

> for the most part it looks better, but the 'issue' and 'what happened?' are a bit nebulous. i look at them and they say a bunch of code but there's no way to really understand what's happened in plain english. and also, it's all forced onto one line.

## What This Shows

- Supports a new UX requirement: the primary selected-delta card needs a plain-English diagnosis that is more useful than raw command text, cluster IDs, detector labels, or storage field text.
- Supports a layout requirement: primary prose should wrap at a human reading width instead of stretching/truncating across the full terminal width.
- Challenges any claim that the current focused-card UI has fully solved cognitive load; it improved the layout shape but not the semantics of the primary diagnosis.

## What This Does Not Show

- It does not prove the correct generation algorithm for the plain-English diagnosis.
- It does not prove Pi TUI primitives are required; it only shows the current output still has content and wrapping problems.
- It does not invalidate the prior focused-card validation; that validation remains accurate for command-surface, route-selection, editor handoff, and candidate-only storage behavior.

## Related Records

- `spec:flight-learn-inbox-ux` - should own the durable UX requirement implied by this feedback.
- `plan:20260527-flight-learn-focused-card-redesign` - prior redesign plan whose output this feedback evaluates.
- `evidence:20260527-flight-learn-focused-card-real-pi-validation` - prior real Pi focused-card proof; this evidence is a follow-up UX challenge rather than a contradiction.
