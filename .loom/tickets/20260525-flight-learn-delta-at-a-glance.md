# Flight Learn Delta At-a-Glance

ID: ticket:20260525-flight-learn-delta-at-a-glance
Type: Ticket
Status: closed
Created: 2026-05-25
Updated: 2026-05-25
Risk: low - presentation-only improvement to the custom inbox component.
Priority: high - operator cannot confidently route deltas from the current clipped/generic view.

## Summary

Improve the `/flight-learn` custom inbox so a selected delta is understandable at a glance before the user chooses a follow-up route. The current screen shows generic repeated-pattern labels, internal IDs, clipped reality/impact text, and route labels without enough guidance.

## Scope

In scope:

- Make item-list labels distinguishable by stripping generic prefixes like `Repeated failure pattern:` and showing concise evidence count/status.
- Add at-a-glance detail lines for selected delta: issue, what happened, why it matters, and expected behavior/unknown expectation.
- Add selected follow-up explanation, a more visible active route marker, and a compact route guide so route cards are easier to choose.
- Keep existing route selection, editor handoff, storage semantics, and command surface unchanged.
- Add/update focused render tests.

Out of scope:

- Automatic route classification.
- New top-level commands.
- Storage migrations.
- Real Pi screenshot validation.

## Acceptance

- ACC-001: The selected delta detail pane includes plain-language at-a-glance fields for issue, what happened, why it matters, and expected behavior.
- ACC-002: The pending item list is distinguishable when multiple deltas share a generic `Repeated failure pattern:` prefix.
- ACC-003: The route area clearly marks the active follow-up, explains it, and provides compact guidance for common route decisions.
- ACC-004: Focused tests and typecheck pass; storage semantics are unchanged.

## Current State

Closed. The custom `/flight-learn` inbox now renders selected deltas with an at-a-glance diagnosis and route guidance.

Implemented behavior:

- item labels strip generic prefixes like `Repeated failure pattern:` and include evidence count/status;
- selected delta detail is separated into `At a glance`, `Why suggested`, and `Evidence preview` sections;
- selected delta detail starts with plain-language `Issue`, `What happened`, `Why it matters`, `Expected`, and signal/evidence count lines;
- route area includes a prominent `Active follow-up: [key] <label> — <description>` line;
- selected route card is marked with `▶ ... ◀`;
- route area includes a compact guide: `Rule=behavior reminder | Code=confusing source | Test=missing check | Ticket=larger work | Observe=not sure`;
- route selection, editor handoff, storage, command surface, and no-auto-apply behavior are unchanged.

Evidence:

- `evidence:20260525-flight-learn-delta-at-a-glance-validation`
  - focused tests: 2 files, 32 tests passed;
  - full tests: 18 files, 90 tests passed;
  - `npm run typecheck` passed;
  - `npm run build` passed;
  - render artifact captured at `.loom/evidence/artifacts/20260525-flight-learn-delta-at-a-glance/render-output.txt`.

Audit:

- Separate Ralph audit was not run for this presentation-only ticket. Validation evidence and render artifact were judged sufficient for closure because the change does not alter storage semantics, command surface, model/provider behavior, or artifact application.

## Journal

- 2026-05-25: Created after operator screenshot showed the inbox was technically functional but hard to understand or route because the delta summary/evidence were too generic and clipped.
- 2026-05-25: Implemented item-label cleanup, at-a-glance selected delta fields, selected follow-up explanation, and compact route guide.
- 2026-05-25: After another operator screenshot showed the pane still felt like one large block and the active route was hard to see, revised the layout to rename panes to `Pending deltas` / `Selected delta`, add `At a glance` / `Why suggested` / `Evidence preview` section breaks, shorten evidence preview paths, and mark the active route with both a prominent active line and `▶ ... ◀` card markers.
- 2026-05-25: Validation passed and evidence recorded in `evidence:20260525-flight-learn-delta-at-a-glance-validation`; closed as presentation-only with no live-Pi screenshot limitation preserved.
