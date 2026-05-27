# Flight Learn Focused Card Redesign

ID: plan:20260527-flight-learn-focused-card-redesign
Type: Plan
Status: completed
Created: 2026-05-27
Updated: 2026-05-27
Risk: medium - redesigns the primary interactive Pi TUI for `/flight-learn` and must preserve existing local, human-gated route/storage semantics.

## Summary

Replace the current `/flight-learn` pending-delta split-pane/table UI with a focused selected-item card or step flow that feels like a product surface rather than a hand-rolled diagnostic table. This matters because operator screenshots show that incremental copy/border changes improved the screen only slightly: the selected item relationship is still hard to perceive, signals/evidence compete with the diagnosis, and active route selection is hard to see.

This needs more than one ticket because the work should first establish a visual/interaction contract and deterministic render evidence, then integrate the focused card into the real command path, then prove the result in a real installed Pi session. The plan completes when `/flight-learn` pending-delta review is focused, visually separated, route selection is obvious, storage semantics remain unchanged, and real Pi evidence exists.

## Related Records

- `spec:flight-learn-inbox-ux` - active UX contract; amended on 2026-05-27 to prefer a focused card/step flow over the split-pane table shape.
- `spec:visible-command-surface` - keeps `/flight-status` and `/flight-learn` as the only normal visible commands; this plan must not add command clutter.
- `spec:delta-artifact-learning-loop` - owns delta/artifact/outcome safety semantics; this plan must preserve candidate-only, human-gated behavior.
- `evidence:20260527-flight-learn-split-pane-ux-feedback` - preserves screenshots and operator observations motivating the redesign.
- `ticket:20260525-flight-learn-delta-at-a-glance` - prior incremental improvement that closed successfully but did not solve the underlying visual-shape problem.
- `/Users/crlough/.bun/install/global/node_modules/@earendil-works/pi-coding-agent/docs/tui.md` - documents Pi TUI primitives, overlays, `SelectList`, `Container`, `Text`, `Box`, `DynamicBorder`, and width/theming rules.

## Strategy

Treat this as a design-shape correction, not another polish pass. The current component is mostly manual string layout: ASCII boxes, horizontal route chips, and mixed-detail lines. That has reached diminishing returns. The next route should make the selected delta the primary object and move everything else into secondary layers:

- primary card: issue, what happened, why it matters, expected behavior;
- secondary metadata: progress/queue preview, signal summary, evidence count;
- explicit action area: vertical route rows/cards with a strong active state and plain-language descriptions;
- progressive disclosure: evidence/provenance and fuller detector signal text appear only when requested;
- existing safety: route selection still exits to the normal `Why this follow-up?` editor and creates accepted but unapplied artifact candidates.

Use Pi TUI primitives where they materially help. `SelectList`, `Text`, `Container`, `Box`, and `DynamicBorder` are likely enough for a cleaner vertical flow; if production constraints make a hand-rendered component unavoidable, the child ticket must explain why and still satisfy the focused-card behavior contract. Do not use this plan to add new top-level commands, classifier automation, hosted model calls, or automatic artifact/rule/source/doc/Loom mutation.

The order is evidence-first and risk-first: create a deterministic render/harness slice before changing the production command path, then wire behavior, then validate in real Pi. Replan if the renderer cannot produce a clearly better artifact at representative widths, or if Pi built-in components cannot be used without regressing keyboard/fallback behavior.

## Execution Units

### Unit: Focused card render harness

Ticket: ticket:20260527-flight-learn-focused-card-render-harness

Create a deterministic focused-card render path or prototype for pending delta review and prove it with fixture render artifacts and tests before replacing the production command flow. The single closure claim is: a focused-card layout exists and demonstrably avoids the current split-pane/table visual problem for representative data.

Scope boundary: likely read/write `src/flight-learn-inbox.ts`, `src/flight-learn-inbox.test.ts`, and `.loom/evidence/artifacts/...` for render fixtures. Do not change storage, command registration, artifact candidate creation, or real Pi package behavior in this unit.

Validation expectations: component render tests over long summaries/evidence; render artifact at representative width; source inspection showing Pi TUI primitives were used where practical or why custom rendering remains necessary. Stop and return to shaping if the prototype still resembles a split-pane table or cannot make route focus obvious.

### Unit: Production delta-review integration

Ticket: ticket:20260527-flight-learn-focused-card-integration

Replace the production `/flight-learn` pending-delta custom UI with the focused-card flow while preserving existing outputs and storage side effects. The single closure claim is: real `/flight-learn` pending-delta review uses the new focused card interaction and still emits the same safe results for route, edit, dismiss, skip, and cancel paths.

Depends on the render harness. Scope boundary: likely `src/flight-learn-inbox.ts`, `src/flight-learn-inbox.test.ts`, `src/pi-extension.ts`, `src/pi-extension.test.ts`, and evidence artifacts. Do not add commands, migrations, model/provider calls, classifier recommendations, or auto-apply behavior. Preserve no-custom-UI fallback and the editor handoff for `Why this follow-up?`.

Validation expectations: focused component and extension tests; full tests/typecheck/build; render artifact showing production path; audit should challenge semantic preservation and route/storage safety before closure.

### Unit: Real Pi visual validation

Ticket: ticket:20260527-flight-learn-focused-card-real-pi-validation

Install and run the redesigned package in a real Pi session and capture visual proof. The single closure claim is: a real interactive Pi run shows the focused-card `/flight-learn` UI with representative data, and the result is materially better than the split-pane screenshots without command-surface or storage regressions.

Depends on production integration. Scope boundary: build/install/restart Pi, run `/flight-learn`, capture screenshot/ANSI/PTY evidence, inspect command palette if practical, and update Loom evidence/tickets. Do not implement further redesign inside this ticket unless explicitly narrowed as a follow-up; if live use reveals design failure, record the failure and route a new ticket rather than claiming success.

Validation expectations: installed-package output, real Pi screenshot or ANSI log, note whether only `/flight-status` and `/flight-learn` remain visible, verify active route is obvious, verify evidence expansion works or record it as follow-up, and preserve honest limitations.

## Milestones

### Milestone: Better shape is visible before integration

Child tickets: ticket:20260527-flight-learn-focused-card-render-harness

A deterministic render artifact shows a selected-delta focused card, secondary queue/evidence treatment, and vertical obvious route selection. If this milestone fails, do not proceed to production integration.

### Milestone: `/flight-learn` uses the focused card safely

Child tickets: ticket:20260527-flight-learn-focused-card-render-harness, ticket:20260527-flight-learn-focused-card-integration

The production command path uses the focused-card interaction, tests pass, and audit has challenged that storage/route semantics and fallback behavior remained safe.

### Milestone: Real Pi proof exists

Child tickets: ticket:20260527-flight-learn-focused-card-real-pi-validation

A real installed Pi session shows the new UI with representative pending deltas and records what was and was not validated.

## Current State

Completed. All execution units are closed:

- `ticket:20260527-flight-learn-focused-card-render-harness` closed with deterministic focused-card render evidence and audit disposition;
- `ticket:20260527-flight-learn-focused-card-integration` closed with production `askFlightLearnDeltaInbox(...)` focused-card wiring, tests, render artifact, and clear audit;
- `ticket:20260527-flight-learn-focused-card-real-pi-validation` closed with disposable project-local installed-package real Pi evidence and clear audit after provenance follow-up.

Final plan-level outcome: production `/flight-learn` pending-delta review now uses a focused selected-issue card instead of the split-pane/table shape, keeps route/storage safety, and has real Pi pane/TUI evidence showing command palette, focused-card UI, route selection, evidence expansion, editor handoff, candidate-only storage, and local status.

Residual risks/follow-ups:

- global/user-scope install remains unproven;
- hosted/real model-provider behavior remains unproven;
- artifact outcome follow-up custom UI remains future work;
- vertical route rows still use left/right route navigation, which is visible/tested but should be watched in continued live use;
- direct Pi TUI primitive dependency adoption remains unresolved because the implementation kept the existing custom component contract rather than adding a package dependency.

## Journal

- 2026-05-27: Created plan after operator screenshots and feedback showed the split-pane `/flight-learn` inbox remained hard to scan despite incremental at-a-glance improvements. Created three child tickets for render harness, production integration, and real Pi validation.
- 2026-05-27: Set plan Status `active` when `ticket:20260527-flight-learn-focused-card-render-harness` began execution.
- 2026-05-27: `ticket:20260527-flight-learn-focused-card-render-harness` closed with render evidence and audit disposition; production integration remains next.
- 2026-05-27: `ticket:20260527-flight-learn-focused-card-integration` closed with production-wrapper focused-card integration, validation evidence, and clear audit. Real Pi validation remains next.
- 2026-05-27: `ticket:20260527-flight-learn-focused-card-real-pi-validation` closed with disposable project-local installed-package real Pi evidence and clear audit after package-provenance follow-up.
- 2026-05-27: Marked plan `completed`; all child tickets are closed and residual risks are named.
