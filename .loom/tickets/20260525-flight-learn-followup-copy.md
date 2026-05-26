# Flight Learn Follow-up Copy

ID: ticket:20260525-flight-learn-followup-copy
Type: Ticket
Status: closed
Created: 2026-05-25
Updated: 2026-05-25
Risk: low - user-facing wording change only; storage semantics should not change.
Priority: high - operator confusion showed `routing rationale` is internal jargon.

## Summary

Replace the user-facing phrase `Routing rationale` in `/flight-learn` with plain language: `Why this follow-up?`. The prompt should make clear that the user is explaining why they chose a follow-up route for the selected issue, not performing an obscure routing operation.

## Scope

In scope:

- Update `/flight-learn` rationale/editor prompt titles and prefill text.
- Update custom fallback/dead rationale screen copy if it appears.
- Update artifact draft labels that may be shown to users.
- Update tests that match the old prompt title.

Out of scope:

- Storage schema/field renames.
- Changing artifact candidate semantics.
- Changing command surface.
- Reworking the overall custom UI.

## Acceptance

- ACC-001: User-facing rationale prompts say `Why this follow-up?` instead of `Routing rationale`.
- ACC-002: Prefill examples explain the selected follow-up in plain language.
- ACC-003: Focused tests and typecheck pass.

## Current State

Closed. User-facing `Routing rationale` wording was replaced with `Why this follow-up?` in the `/flight-learn` route-reason prompt and related fallback/candidate draft display text.

Implemented behavior:

- Pi editor prompt title is now `Why this follow-up?`.
- Prefill text says `I chose <follow-up> because ...` or explains Observe in plain language.
- Artifact candidate draft/detail labels now say `Why this follow-up` instead of rationale jargon.
- `spec:flight-learn-inbox-ux` scenario wording now uses `plain-language reason for that follow-up`.

Evidence:

- `evidence:20260525-flight-learn-followup-copy-validation`
  - focused tests: 3 files, 34 tests passed;
  - full tests: 18 files, 90 tests passed;
  - `npm run typecheck` passed;
  - `npm run build` passed;
  - targeted `git diff --check` passed.

Audit:

- Separate Ralph audit was not run for this low-risk wording-only ticket. The validation evidence and grep/source inspection were judged sufficient for closure because storage semantics, command registration, and behavior were unchanged.

## Journal

- 2026-05-25: Created after operator asked what `routing rationale` means and approved renaming it.
- 2026-05-25: Updated user-facing prompt/candidate wording and tests; validation passed and evidence recorded in `evidence:20260525-flight-learn-followup-copy-validation`.
- 2026-05-25: Closed as a low-risk copy-only fix without separate Ralph audit; remaining risk is only lack of live Pi screenshot after the copy change.
