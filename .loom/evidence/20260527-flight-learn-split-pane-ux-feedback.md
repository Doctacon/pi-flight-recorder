# Flight Learn Split-Pane UX Feedback

ID: evidence:20260527-flight-learn-split-pane-ux-feedback
Type: Evidence Dossier
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Observed: 2026-05-27

## Summary

This dossier preserves operator-provided visual feedback showing that the current `/flight-learn` split-pane custom TUI remains hard to scan even after at-a-glance copy and active-route marker improvements.

## Observations

- Observation: In the earlier split-pane screenshot, the operator reported that it took time to understand that the `Delta` pane applied only to the selected pending item, that `Signals` blended into one large text block, and that the active route option was hard to identify while moving left/right.
  - Artifact: `.loom/evidence/artifacts/20260527-flight-learn-split-pane-ux-feedback/delta-side-block-route-active-hard-to-see.png`

- Observation: In the later screenshot after incremental layout improvements, the operator reported that the screen was "a little better" but still visually ugly, especially around the transition between `Pending deltas` and `Why suggested`, and questioned whether Pi has richer primitives that would enable a larger UX improvement.
  - Artifact: `.loom/evidence/artifacts/20260527-flight-learn-split-pane-ux-feedback/split-pane-still-hard-to-scan.png`

## Interpretation Boundaries

- This evidence supports a UX problem statement: the current split-pane/table-like shape is cognitively heavy for real operator use.
- This evidence does not prove a specific replacement design works.
- This evidence does not validate implementation, storage behavior, keyboard behavior, or live installed-package behavior.

## Related Records

- `spec:flight-learn-inbox-ux` - amended to prefer a focused selected-item card/step flow over the split-pane table shape.
- `plan:20260527-flight-learn-focused-card-redesign` - decomposes the redesign work created from this feedback.
