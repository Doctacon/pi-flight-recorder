# Flight Learn Plain-English Diagnosis Cards

ID: plan:20260527-flight-learn-plain-english-diagnosis-cards
Type: Plan
Status: open
Created: 2026-05-27
Updated: 2026-05-27
Risk: medium - the plan changes the primary operator-facing interpretation of failure-memory records while preserving storage, privacy, and candidate-only safety boundaries.

## Summary

This plan decomposes the next `/flight-learn` UX improvement: the focused-card layout is better than the split-pane UI, but the primary `Issue` and `What happened?` text can still be raw commands, internal reflection-cluster IDs, and one-line/truncated code. The outcome is a focused-card review experience whose top sections explain the problem in plain English, while raw commands and provenance remain secondary and inspectable.

This needs more than one ticket because the work has three separate closure stories: a deterministic local diagnosis view model, its integration into the Pi TUI card with readable wrapping and unchanged safety semantics, and real installed Pi validation with screenshot/PTY evidence.

## Related Records

- `spec:flight-learn-inbox-ux` - now owns the plain-English diagnosis requirements REQ-019 through REQ-023 and SCN-007.
- `evidence:20260527-flight-learn-plain-english-feedback` - preserves the operator screenshot/feedback that motivated this plan.
- `plan:20260527-flight-learn-focused-card-redesign` - prior completed plan that produced the focused-card baseline this plan improves.
- `evidence:20260527-flight-learn-focused-card-real-pi-validation` - proves the focused-card UI, command surface, route selection, editor handoff, and candidate-only storage behavior that must not regress.
- `spec:delta-artifact-learning-loop` - owns local candidate-only routing semantics; this plan must not introduce auto-apply behavior.
- `spec:visible-command-surface` - owns the two-command visible surface; this plan must not add visible slash commands.
- `/Users/crlough/.bun/install/global/node_modules/@earendil-works/pi-coding-agent/docs/tui.md` - confirms Pi TUI width rules, `ctx.ui.custom()`, wrapping utilities, and built-in components such as `Text`, `Markdown`, `Container`, `SelectList`, and `DynamicBorder`.
- `src/delta-capture.ts` - current detector-created deltas can populate `summary` and `reality` with raw cluster/command text.
- `src/flight-learn-inbox.ts` - current focused-card renderer uses `issueTitle(delta)` and `fields.reality` as primary card text.
- `src/pi-extension.ts` - route selection and editor handoff must continue to store accepted but unapplied artifact candidates without mutating durable artifacts.

## Strategy

The central design decision is to generate plain-English diagnosis text as a **display-time, deterministic, local view model**, not as a stored-data migration and not as a hosted/model-assisted summary.

Rejected/default-not-now paths:

- Do not call a hosted model or provider for default phrasing. This would violate the local-first posture and make `/flight-learn` depend on provider availability.
- Do not silently rewrite stored `ExpectationDelta.summary`, `expectation`, `reality`, or `impact` just because the UI can phrase them better. Stored truth and display diagnosis must stay separate unless the operator explicitly edits fields.
- Do not hide raw evidence. Commands, paths, cluster IDs, and detector labels should move out of the primary headline, not disappear.
- Do not add another visible command. The work stays behind `/flight-learn`.

The route is contract-first and vertical through the live UI:

1. Build a pure local diagnosis view-model helper over existing `ExpectationDelta`, `DeltaDetectorSignal`, and evidence refs. This isolates generation rules from rendering and makes them testable without Pi.
2. Integrate that view model into the focused-card renderer, rename/shape the primary sections around plain-English `Problem` / `What happened?`, demote raw clues, and constrain primary prose to a readable measure while preserving Pi TUI line-width rules.
3. Validate in real installed Pi with fixture data resembling the screenshot that exposed the problem.

Pi TUI docs matter for the second slice, but they are not a substitute for the content model. They help with width safety, wrapping, theme use, and possibly built-in `Text`/`Markdown`/`Container` composition. The first-class fix is still semantic: primary card content must come from a diagnosis view model rather than raw storage fields.

Replanning triggers:

- If deterministic local rules cannot produce useful plain-English phrasing for representative local fixtures, stop and route back to research/spec shaping rather than hiding the weakness with generic text.
- If adding direct `@earendil-works/pi-tui` imports requires package/dependency changes broader than the integration ticket, the ticket may stay on the current custom component contract and document why Pi primitives were not adopted in that slice.
- If real Pi validation shows the card is still hard to understand, do not close the validation ticket as success; record the failure and shape a follow-up.

## Execution Units

### Unit: Deterministic local diagnosis view model

Ticket: ticket:20260527-flight-learn-diagnosis-view-model

Create a pure, local, deterministic display helper that converts an `ExpectationDelta`, its detector signals, and evidence refs into a `headline`, `whatHappened`, `whyItMatters`, optional `rawClue`, and confidence/limits metadata for UI display. The helper should prefer human-authored plain fields when they are useful, fall back to signal-type templates and evidence-snippet extraction, and explicitly avoid raw paths, cluster IDs, and shell commands in the primary headline.

This ticket does not integrate the helper into the live UI and does not mutate storage. It closes when source tests and render/fixture artifacts prove the helper can turn representative raw detector deltas into plain-English display text.

### Unit: Focused-card integration and readable wrapping

Ticket: ticket:20260527-flight-learn-diagnosis-card-integration
Depends On: ticket:20260527-flight-learn-diagnosis-view-model

Use the diagnosis view model in the focused-card `/flight-learn` component. The primary card should read as a plain-English problem diagnosis, not a raw command. Raw clues and provenance move under secondary sections such as `Raw clue`, `Why suggested`, or expanded evidence. Primary prose should wrap to a readable measure while every rendered line still obeys Pi TUI width rules.

This ticket must preserve route selection, edit, evidence expansion, dismiss, skip, quit, editor handoff, candidate-only storage semantics, and the two-command visible surface.

### Unit: Real installed Pi validation

Ticket: ticket:20260527-flight-learn-diagnosis-real-pi-validation
Depends On: ticket:20260527-flight-learn-diagnosis-card-integration

Run a disposable installed-package real Pi TUI validation against fixture data resembling the operator screenshot. Capture command palette, focused-card default view, evidence expansion, route/editor handoff if feasible, DB safety, package provenance, and raw TUI output. Close only if the real UI shows the primary problem and what-happened text in plain English, raw details are secondary, and the existing route/storage safety still holds.

## Milestones

### Milestone: Diagnosis generation is deterministic and safe

Child tickets: ticket:20260527-flight-learn-diagnosis-view-model

A local helper can generate useful display diagnosis text from representative deltas without provider calls, network access, storage mutation, or hidden source-of-truth changes.

### Milestone: Focused card is semantically readable in render tests

Child tickets: ticket:20260527-flight-learn-diagnosis-card-integration

Deterministic render artifacts show that `/flight-learn` no longer puts raw commands or cluster IDs in the primary headline, preserves route/action behavior, and wraps primary prose to a readable measure.

### Milestone: Focused card is readable in real Pi

Child tickets: ticket:20260527-flight-learn-diagnosis-real-pi-validation

Real installed Pi evidence shows the improved card with representative data, while command-surface and candidate-only storage safety remain intact.

## Current State

Open. The operator feedback has been preserved as evidence, `spec:flight-learn-inbox-ux` has been amended with plain-English diagnosis requirements, and three child tickets are ready for execution. The next move is to execute `ticket:20260527-flight-learn-diagnosis-view-model` with a bounded implementation agent, not to implement from this shaping session.

## Journal

- 2026-05-27: Created plan after operator feedback that focused-card layout improved but primary `Issue` / `What happened?` content remained code-heavy, internal, and one-line/truncated. Chose deterministic display-time diagnosis generation as the default route and created three child tickets.
