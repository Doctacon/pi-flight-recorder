# Flight Learn Diagnosis Card Integration

ID: ticket:20260527-flight-learn-diagnosis-card-integration
Type: Ticket
Status: closed
Created: 2026-05-27
Updated: 2026-05-27
Risk: medium - this changes the primary `/flight-learn` UI while preserving route/editor/storage safety and command-surface constraints.
Priority: high - this is the user-visible fix for the operator's focused-card feedback.
Depends On: ticket:20260527-flight-learn-diagnosis-view-model

## Summary

Integrate the deterministic diagnosis view model into the focused-card `/flight-learn` TUI so the primary selected-delta card explains the problem in plain English instead of leading with raw commands, paths, cluster IDs, or detector text.

Single closure claim: the focused-card `/flight-learn` render path uses the diagnosis view model for its primary `Problem` / `What happened?` / `Why it matters` sections, wraps primary prose at a readable measure, demotes raw details to secondary sections, and preserves existing interaction and storage safety.

## Related Records

- `plan:20260527-flight-learn-plain-english-diagnosis-cards` - parent plan and sequencing.
- `ticket:20260527-flight-learn-diagnosis-view-model` - hard prerequisite that provides the tested display helper.
- `spec:flight-learn-inbox-ux` - owns REQ-019 through REQ-023 and SCN-007, plus earlier focused-card requirements.
- `evidence:20260527-flight-learn-plain-english-feedback` - screenshot/feedback showing the current primary card is too code-heavy.
- `evidence:20260527-flight-learn-focused-card-real-pi-validation` - prior behavior that must not regress: command surface, focused-card baseline, route/editor handoff, and candidate-only storage.
- `/Users/crlough/.bun/install/global/node_modules/@earendil-works/pi-coding-agent/docs/tui.md` - Pi TUI component/width/wrapping guidance.
- `src/flight-learn-inbox.ts` and `src/flight-learn-inbox.test.ts` - primary implementation and focused tests.
- `src/pi-extension.ts` and `src/pi-extension.test.ts` - production wrapper and route/editor/storage behavior.

## Scope

In scope:

- Use the helper from `ticket:20260527-flight-learn-diagnosis-view-model` in focused-card rendering.
- Replace or supplement the primary `Issue` section with a clearer label such as `Problem` or an equivalent plain-English diagnosis section.
- Render `What happened?` and `Why it matters` from the diagnosis view model by default, while still allowing explicit user edits to expectation/reality/impact through the existing edit path.
- Demote raw commands, paths, cluster IDs, detector labels, and evidence provenance to secondary sections such as `Raw clue`, `Why suggested`, or expanded evidence.
- Constrain primary prose to a readable measure, for example 72-88 visible columns, while still returning lines that do not exceed the Pi component `width` parameter.
- Consult Pi TUI docs before changing rendering. Use `Text`, `Markdown`, `Container`, `SelectList`, `DynamicBorder`, or wrapping utilities if they fit the package/dependency boundary. If not, keep the current custom renderer but explain in evidence why direct Pi TUI primitives were not adopted in this slice.
- Update focused component tests, production-wrapper tests, and deterministic render artifacts.

Out of scope:

- Changing visible slash commands.
- Changing storage schema or automatically rewriting `ExpectationDelta` fields.
- Changing route/editor/candidate-only semantics.
- Adding hosted/model/provider calls, network access, classifier automation, or optional model-assisted phrasing.
- Implementing artifact outcome follow-up UI.
- Real installed Pi validation; that belongs to `ticket:20260527-flight-learn-diagnosis-real-pi-validation`.

Constraints:

- Derived diagnosis text is display-only. Route submission must not silently store derived diagnosis text as edited expectation/reality/impact unless the operator explicitly edits those fields.
- Existing keyboard behavior must remain discoverable: issue navigation, route selection, evidence expansion, edit, dismiss, skip, quit/cancel, and enter-to-choose.
- Existing candidate-only safety must remain intact: selecting a follow-up opens the normal `Why this follow-up?` editor and stores accepted but unapplied candidates only.
- Rendered lines must remain width-safe under Pi TUI rules.

First likely Ralph run:

- Read this ticket, its dependency ticket result/evidence, the parent plan, `spec:flight-learn-inbox-ux`, Pi TUI docs, `src/flight-learn-inbox.ts`, `src/flight-learn-inbox.test.ts`, `src/pi-extension.ts`, and `src/pi-extension.test.ts`.
- Integrate the helper into the focused-card layout only.
- Produce focused tests/render artifacts before wider validation.
- Stop if the integration would require changing storage semantics, command registration, or dependency/package shape beyond this ticket.

## Acceptance

- ACC-001: Focused-card primary sections use the diagnosis view model so raw command/path/cluster ID text is not the primary headline when a plain-English diagnosis can be derived.
  - Evidence: focused render test and artifact for a screenshot-shaped fixture showing a plain-English `Problem`/headline and no raw command or cluster ID in that primary field.
  - Audit: closure audit should compare rendered output against `evidence:20260527-flight-learn-plain-english-feedback` and challenge whether the cognitive-load issue was actually addressed.

- ACC-002: Raw details remain inspectable but visually secondary.
  - Evidence: focused render tests/artifacts showing raw command or cluster/provenance detail under `Raw clue`, `Why suggested`, or expanded evidence rather than primary headline.
  - Audit: closure audit should challenge hidden-evidence risk and ensure provenance is not erased.

- ACC-003: Primary explanatory prose wraps to a readable measure and every returned line remains width-safe at representative narrow and wide widths.
  - Evidence: tests checking line widths and render artifact at a wide terminal width where prose does not become a one-line wall.
  - Audit: closure audit should inspect width behavior and whether custom wrapping or Pi TUI utilities are justified.

- ACC-004: Route selection, evidence expansion, edit, dismiss, skip, cancel, editor handoff, and candidate-only storage behavior remain covered by tests.
  - Evidence: existing and updated focused tests plus `src/pi-extension.test.ts` coverage; full tests/typecheck/build when closing.
  - Audit: closure audit should challenge regressions to storage safety and interaction behavior.

- ACC-005: The integration does not add visible commands, default model/provider calls, network access, classifier automation, automatic artifact application, or silent stored-delta mutation.
  - Evidence: source inspection, tests, and command-registration assertions where available.
  - Audit: closure audit should search the diff for forbidden behavior and package/dependency changes.

## Current State

Closed. The focused-card integration closure claim is satisfied: production focused-card rendering now uses `buildFlightLearnDiagnosisView(...)` for the primary selected-delta diagnosis and preserves existing route/editor/storage safety.

Final implementation shape:

- `src/flight-learn-inbox.ts` imports and calls `buildFlightLearnDiagnosisView(...)` for focused-card display.
- The primary focused-card section is now `Problem`, followed by diagnosis-based `What happened?`, `Why it matters`, and `Expected` text.
- Raw command/provenance details are secondary under `Raw clue`, `Why suggested`, and expanded evidence.
- Primary prose is wrapped through `wrapFocusedProse(...)` with a readable max measure while retaining Pi TUI width safety.
- `src/pi-extension.ts` remains the production wrapper and still passes `layout: "focused-card"`; command registration and storage semantics were not changed.

Evidence:

- `evidence:20260527-flight-learn-diagnosis-card-integration-validation`
  - focused tests passed: 2 files / 34 tests;
  - typecheck passed;
  - build passed;
  - render artifact shows plain-English primary diagnosis and secondary raw clue;
  - full tests passed: 19 files / 97 tests;
  - diff check passed;
  - source-only side-effect scan found no forbidden hooks.

Audit:

- `audit:20260527-flight-learn-diagnosis-card-integration-review` returned `clear` with no findings.

Residual risk:

- Real installed Pi TUI behavior is not proven by this ticket; it is owned by `ticket:20260527-flight-learn-diagnosis-real-pi-validation`.
- Operator preference after hands-on use remains to be learned.
- Width tests are representative, not exhaustive across all terminal/theme/unicode variants.
- The implementation kept the existing custom renderer rather than adding direct Pi TUI component imports because package/dependency changes were outside ticket scope.

## Journal

- 2026-05-27: Created ticket as the second child of `plan:20260527-flight-learn-plain-english-diagnosis-cards`. It is intentionally separated from the helper so display semantics and TUI integration can be reviewed independently.
- 2026-05-27: Set status to `active` after dependency closure; launching bounded Ralph implementation run for focused-card integration.
- 2026-05-27: Ralph implementation integrated the diagnosis helper into focused-card rendering, added/updated tests, generated render artifact output, and ran focused tests/typecheck/build/full tests/diff check. Recorded `evidence:20260527-flight-learn-diagnosis-card-integration-validation` and moved to `review` for audit.
- 2026-05-27: Audit `audit:20260527-flight-learn-diagnosis-card-integration-review` returned `clear` with no findings. Closed ticket with real Pi validation explicitly deferred to the dependent validation ticket.
