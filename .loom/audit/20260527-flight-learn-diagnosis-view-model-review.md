# Flight Learn Diagnosis View Model Review

ID: audit:20260527-flight-learn-diagnosis-view-model-review
Type: Audit
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Audited: 2026-05-27
Target: ticket:20260527-flight-learn-diagnosis-view-model

## Summary

A bounded Ralph audit reviewed the first implementation of the deterministic local diagnosis view model against `ticket:20260527-flight-learn-diagnosis-view-model` acceptance criteria. The review found ACC-001, ACC-002, ACC-003, and ACC-005 supported, but identified a material ACC-004 gap around preserving useful human-authored fields when the stored summary remains raw/internal.

Verdict: `changes-needed`.

## Target

Target under review:

- `ticket:20260527-flight-learn-diagnosis-view-model`
- `src/flight-learn-diagnosis.ts`
- `src/flight-learn-diagnosis.test.ts`
- `evidence:20260527-flight-learn-diagnosis-view-model-validation`

The review challenged ACC-001 through ACC-005 for the helper-only ticket. It did not review focused-card integration or real Pi behavior, which belong to later child tickets.

## Audit Scope And Lenses

Lenses:

- claim and evidence;
- scope;
- local-first/privacy;
- display-only/source-of-truth boundary;
- generated prose quality;
- template overclaiming;
- side effects;
- test adequacy;
- maintainability.

Out of scope:

- `/flight-learn` UI integration;
- real Pi TUI behavior;
- global package install;
- hosted/model-provider behavior.

## Context And Evidence Reviewed

- Ralph review run: bounded review over the ticket, plan, spec, feedback evidence, validation evidence, artifacts, and helper diff/source.
- `ticket:20260527-flight-learn-diagnosis-view-model` - acceptance and scope under review.
- `plan:20260527-flight-learn-plain-english-diagnosis-cards` - parent plan and sequencing.
- `spec:flight-learn-inbox-ux` - REQ-019 through REQ-023 and SCN-007.
- `evidence:20260527-flight-learn-plain-english-feedback` - motivating screenshot/feedback.
- `evidence:20260527-flight-learn-diagnosis-view-model-validation` - validation dossier.
- `.loom/evidence/artifacts/20260527-flight-learn-diagnosis-view-model/` - focused tests, typecheck, build, full test output, diff check, side-effect scan, source snapshots, provenance.
- `src/flight-learn-diagnosis.ts` - helper implementation.
- `src/flight-learn-diagnosis.test.ts` - focused helper tests.

The reviewer also reran `npx vitest run src/flight-learn-diagnosis.test.ts`; it passed with 1 file / 4 tests.

## Findings

### FIND-001: ACC-004 only partially satisfied because useful human fields are summary-gated

`useHumanFields(...)` promotes human text only when `delta.summary` is itself useful and non-raw, then returns summary/reality/impact. It does not independently preserve useful `reality`, `impact`, or `expectation` when the summary remains raw/internal.

Why it matters: the ticket asks the helper to respect useful human-authored delta fields. A detector-created delta with a raw command summary but operator-edited plain `reality`, `impact`, or `expectation` would currently show generic detector prose instead of preserving the useful edited context.

Evidence cited by the reviewer:

- `src/flight-learn-diagnosis.ts` requires a useful summary before any human fields can win.
- `buildFlightLearnDiagnosisView(...)` falls back completely to generic templates when `useHumanFields(...)` returns `null`.
- `delta.expectation` participates in domain detection but is not surfaced as preferred human-authored display text.
- Existing ACC-004 test covers only a manual delta where summary/reality/impact are all useful.

Required follow-up:

- Update helper/tests so useful plain-English `reality`, `impact`, and/or `expectation` can be used independently of whether `summary` is useful.
- Add a focused test for raw detector summary plus useful human/plain fields, asserting the template headline can remain derived while `whatHappened`/`whyItMatters` or equivalent metadata preserves the useful fields.

## Verdict

`changes-needed`. ACC-001, ACC-002, ACC-003, and ACC-005 are supported within this ticket's scope, but ACC-004 should not close until FIND-001 is resolved or explicitly dispositioned by the ticket owner.

## Required Follow-up

Resolve FIND-001 in the ticket before closure, then run focused tests and a follow-up audit/review pass over the fix.

## Residual Risk

- Real `/flight-learn` integration and Pi TUI behavior remain out of scope for this ticket.
- Some domains are implemented but not individually tested, such as package-install, path/module, reversal-retry, and repeated-tool-failure.
- One evidence artifact, `07-helper-diff.txt`, is empty because the source files were untracked at the time; live source inspection, snapshots, SHA-256 provenance, and test artifacts compensated for the audit pass.

## Related Records

- `ticket:20260527-flight-learn-diagnosis-view-model` - consuming ticket and finding disposition owner.
- `evidence:20260527-flight-learn-diagnosis-view-model-validation` - validation reviewed.
- `plan:20260527-flight-learn-plain-english-diagnosis-cards` - parent plan.
