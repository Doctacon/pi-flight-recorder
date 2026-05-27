# Flight Learn Focused Card Render Harness

ID: ticket:20260527-flight-learn-focused-card-render-harness
Type: Ticket
Status: closed
Created: 2026-05-27
Updated: 2026-05-27
Risk: medium - changes the visual contract and component rendering strategy for a primary interactive workflow, but should avoid production side effects in this slice.
Priority: high - this is the first risk-reducing slice for the focused card redesign.

## Summary

Create a deterministic focused-card render path or prototype for pending delta review so the team can judge a +10 UI direction before wiring it into the production `/flight-learn` command path. The current split-pane/table layout has reached diminishing returns; this ticket should prove a selected-delta card/step flow with secondary evidence/signals and prominent vertical route selection.

Single closure claim: a focused-card layout exists, is covered by render tests/artifacts, and visibly avoids the current split-pane/table problem for representative pending-delta data.

## Related Records

- `plan:20260527-flight-learn-focused-card-redesign` - owns the multi-ticket strategy and sequencing.
- `spec:flight-learn-inbox-ux` - defines focused-card requirements, especially REQ-014 through REQ-018 and SCN-006.
- `evidence:20260527-flight-learn-split-pane-ux-feedback` - preserves the screenshots and operator feedback this ticket must address.
- `ticket:20260525-flight-learn-delta-at-a-glance` - prior incremental improvement; do not repeat the same split-pane polish path.
- `/Users/crlough/.bun/install/global/node_modules/@earendil-works/pi-coding-agent/docs/tui.md` - inspect before implementation; prefer Pi TUI primitives where they fit.

## Scope

In scope:

- Build or refactor a deterministic renderable focused-card view for pending expectation-delta review.
- Use or evaluate Pi TUI primitives such as `Container`, `Text`, `SelectList`, `Box`, and `DynamicBorder` before adding more custom ASCII layout code.
- Make selected-delta content the primary visual object: issue, what happened, why it matters, expected behavior.
- Make pending queue/progress secondary rather than a dominant side-by-side pane.
- Make route choices vertical/selectable with a clearly visible active option and plain-language purpose text.
- Keep signals/evidence/provenance visually secondary by default, with an obvious disclosure affordance.
- Add/update deterministic component tests and render artifact scripts for representative long summaries, evidence, and route labels.

Out of scope:

- Wiring the new layout into the production `/flight-learn` command path if that requires behavior/result changes.
- Changing SQLite storage, delta/artifact data models, command registration, fallback command behavior, artifact candidate semantics, classifier behavior, or model/provider behavior.
- Real Pi install/screenshot validation.
- Artifact outcome follow-up UI.

Likely read scope:

- `src/flight-learn-inbox.ts`
- `src/flight-learn-inbox.test.ts`
- `src/pi-extension.test.ts` only if render fixtures are currently shared
- Pi TUI docs and relevant installed type/source files for built-in components
- related Loom records listed above

Likely write scope:

- `src/flight-learn-inbox.ts`
- `src/flight-learn-inbox.test.ts`
- `.loom/evidence/artifacts/20260527-flight-learn-focused-card-render-harness/`
- `.loom/evidence/20260527-flight-learn-focused-card-render-harness-validation.md` when validation is gathered
- this ticket's Current State/Journal

Stop conditions:

- If the best achievable output still looks like a split-pane table, stop and return to shaping.
- If Pi TUI primitives cannot be used due to extension/component constraints, record why in the ticket/evidence before continuing with custom rendering.
- If implementation starts requiring storage semantics, command routing, or artifact side effects, stop and split or move to the integration ticket.

## Acceptance

- ACC-001: The render artifact shows one selected delta as the primary card/step, with visible progress such as `Issue 5 of 6`, and without a dominant side-by-side `Pending deltas` / `Selected delta` table.
  - Evidence: deterministic render artifact at representative width preserved under `.loom/evidence/artifacts/20260527-flight-learn-focused-card-render-harness/`.
  - Audit: review should compare the artifact against `spec:flight-learn-inbox-ux#SCN-006` and the split-pane screenshots.

- ACC-002: Follow-up choices render as vertical rows/cards with a strong active state and per-option purpose text; the active option is visible without scanning a horizontal sentence.
  - Evidence: render tests and artifact showing multiple route options and active selection movement.
  - Audit: challenge whether the active route is visually obvious in plain ANSI output and with theme styling.

- ACC-003: Signals, evidence refs, record IDs, and provenance are secondary by default and do not blend into the primary diagnosis; there is a visible affordance for evidence expansion.
  - Evidence: render tests or snapshot artifact for collapsed and expanded evidence states.
  - Audit: challenge whether the default screen still overloads the operator with source-path/evidence noise.

- ACC-004: Render output remains width-safe and theme-aware, and focused tests pass without changing storage or command semantics.
  - Evidence: focused tests, `npm run typecheck`, and targeted `git diff --check`; source inspection or test assertion that no storage/command path changed in this slice.
  - Audit: separate audit is recommended because this ticket establishes the visual contract for downstream integration.

- ACC-005: The implementation either uses Pi TUI building blocks where practical or records a concrete reason they were insufficient for this component.
  - Evidence: source diff and/or validation note citing the components used or the limitation found.
  - Audit: challenge generic claims like "Pi cannot do this" against the TUI docs.

## Current State

Closed. The ticket delivered a deterministic focused-card render harness behind an explicit `layout: "focused-card"` option, focused tests, render artifacts, and validation evidence. It did not wire the focused-card layout into production `/flight-learn`; that remains assigned to `ticket:20260527-flight-learn-focused-card-integration`.

What changed in this ticket:

- added a focused-card render path for the existing `FlightLearnDeltaInboxComponent`;
- added focused-card tests for primary selected issue, hidden-by-default evidence, expanded evidence, vertical route rows, active route marker, and width safety;
- added deterministic render artifact script/output under `.loom/evidence/artifacts/20260527-flight-learn-focused-card-render-harness/`;
- recorded validation evidence in `evidence:20260527-flight-learn-focused-card-render-harness-validation`.

Evidence:

- focused tests: 2 files / 33 tests passed;
- full tests: 18 files / 91 tests passed;
- `npm run typecheck` passed;
- `npm run build` passed;
- targeted `git diff --check` passed;
- render artifact captured collapsed and expanded focused-card states.

Audit:

- `audit:20260527-flight-learn-focused-card-render-harness-review` returned verdict `changes-needed` with `FIND-001` about scope ambiguity: current uncommitted git diff also contains prior default split-pane output changes from earlier work.
- Disposition for `FIND-001`: resolved by record clarification, not source change. The default split-pane changes were already present in the dirty workspace before this ticket began and belong to prior `ticket:20260525-flight-learn-delta-at-a-glance` work. This ticket's closure claim is narrowed to the explicit focused-card render harness path and its deterministic evidence; it does not validate or claim ownership of the prior default split-pane changes.

Residual risk:

- direct Pi TUI primitive usage remains unresolved for production integration because this package currently has no direct `@earendil-works/pi-tui` dependency and this ticket excluded dependency/package changes;
- route rows are vertical but route navigation still uses left/right keys in the existing component interaction model; integration should decide whether to change that UX;
- real Pi theme/focus/terminal behavior is unproven until `ticket:20260527-flight-learn-focused-card-real-pi-validation`.

## Journal

- 2026-05-27: Created ticket from `plan:20260527-flight-learn-focused-card-redesign` after operator feedback showed incremental split-pane polish was not enough.
- 2026-05-27: Set Status `active` and began the render/prototype harness slice from the ticket, plan, spec, screenshot evidence, current component, and Pi TUI docs.
- 2026-05-27: Implemented explicit `layout: "focused-card"` render mode, focused-card tests, and deterministic render fixture while leaving production `/flight-learn` on the existing default layout.
- 2026-05-27: Recorded validation in `evidence:20260527-flight-learn-focused-card-render-harness-validation` after focused tests, full tests, typecheck, build, diff-check, and render artifact generation.
- 2026-05-27: Ran bounded Ralph review and recorded `audit:20260527-flight-learn-focused-card-render-harness-review`; dispositioned `FIND-001` by narrowing this ticket's closure claim and evidence to the focused-card harness path only, because default split-pane changes were prior dirty-worktree state.
- 2026-05-27: Closed ticket with production integration and real Pi validation deferred to child tickets named by `plan:20260527-flight-learn-focused-card-redesign`.
