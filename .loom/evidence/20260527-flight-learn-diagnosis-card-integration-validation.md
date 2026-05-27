# Flight Learn Diagnosis Card Integration Validation

ID: evidence:20260527-flight-learn-diagnosis-card-integration-validation
Type: Evidence Dossier
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Observed: 2026-05-27

## Summary

This dossier records validation for `ticket:20260527-flight-learn-diagnosis-card-integration`. A bounded Ralph implementation run integrated the deterministic diagnosis helper into the focused-card `/flight-learn` renderer, changed the primary card label from `Issue` to `Problem`, rendered diagnosis-based `What happened?`, `Why it matters`, and `Expected` text, added a secondary `Raw clue` section, and preserved existing route/editor/storage safety tests.

## Source State

Changed source/test files for this ticket:

- `src/flight-learn-inbox.ts`
- `src/flight-learn-inbox.test.ts`
- `src/pi-extension.test.ts`

Dependency source/test files from the prior ticket remain part of the current working tree:

- `src/flight-learn-diagnosis.ts`
- `src/flight-learn-diagnosis.test.ts`

Artifacts and command outputs are under:

```text
.loom/evidence/artifacts/20260527-flight-learn-diagnosis-card-integration/
```

## Observations

- Observation: focused component and Pi extension tests passed.
  - Procedure: `npx vitest run src/flight-learn-inbox.test.ts src/pi-extension.test.ts`.
  - Result: `2 passed (2)`, `34 passed (34)`.
  - Artifact: `01-focused-tests.txt`.

- Observation: TypeScript typecheck passed.
  - Procedure: `npm run typecheck`.
  - Result: command completed through `tsc --noEmit` without errors.
  - Artifact: `02-typecheck.txt`.

- Observation: package build passed.
  - Procedure: `npm run build`.
  - Result: command completed through `npm run clean && tsc -p tsconfig.build.json` without errors.
  - Artifact: `03-build.txt`.

- Observation: deterministic render artifact shows the new focused-card diagnosis layout.
  - Procedure: `node .loom/evidence/artifacts/20260527-flight-learn-diagnosis-card-integration/render-focused-diagnosis-card.mjs` after build.
  - Result: output shows `Problem` followed by `A validation command failed repeatedly in this project.`, `What happened?` followed by `Pi saw the same validation-failure pattern twice in recent sessions.`, wrapped `Why it matters`, `Expected`, secondary `Raw clue`, `Why suggested`, collapsed evidence, route rows, and expanded evidence after pressing `v` in the component.
  - Artifact: `04-render-output.txt`.

- Observation: full test suite passed.
  - Procedure: `npm test`.
  - Result: `19 passed (19)`, `97 passed (97)`.
  - Artifact: `05-full-tests.txt`.

- Observation: targeted diff whitespace check passed.
  - Procedure: `git diff --check -- src/flight-learn-inbox.ts src/flight-learn-inbox.test.ts src/pi-extension.test.ts .loom/evidence/artifacts/20260527-flight-learn-diagnosis-card-integration/render-focused-diagnosis-card.mjs`.
  - Result: no output, no whitespace errors.
  - Artifact: `06-diff-check.txt`.

- Observation: source provenance was recorded.
  - Procedure: recorded `git status --short` and SHA-256 hashes for the changed source/test files.
  - Result: `07-source-provenance.txt` records modified focused-card files plus the new diagnosis helper/test files and their hashes.

- Observation: source fingerprint shows focused-card production wrapper still uses focused-card layout and the component uses the diagnosis helper.
  - Procedure: `rg "layout: \"focused-card\"|Flight Learn — Issue|Problem|buildFlightLearnDiagnosisView" ...`.
  - Result: `src/flight-learn-inbox.ts` imports and calls `buildFlightLearnDiagnosisView(...)`; `src/pi-extension.ts` still passes `layout: "focused-card"`; tests assert `Problem` and production render behavior.
  - Artifact: `09-source-fingerprint.txt`.

- Observation: source-only side-effect scan found no obvious forbidden hooks in the changed focused-card source and diagnosis helper source.
  - Procedure: `rg "registerCommand|fetch\(|complete\(|modelProvider|http|https|createExpectationDelta|recordDelta|createArtifactCandidate|acceptArtifactCandidate|rerouteExpectationDelta|markExpectationDelta" src/flight-learn-inbox.ts src/flight-learn-diagnosis.ts`.
  - Result: no matches.
  - Artifact: `10-source-only-forbidden-side-effect-scan.txt`.

## Key Render Excerpt

```text
Problem
 A validation command failed repeatedly in this project.

What happened?
 Pi saw the same validation-failure pattern twice in recent sessions.

Why it matters
 Repeated validation friction makes it harder to trust whether the latest code
 actually passed.

Expected
 unknown — press e to add what should have happened

Raw clue
 Repeated failure pattern: bash cd /Users/<user>/Code/personal/pi-flight-recorder &&
 npm test > pi-flight-recorder.log
```

## What This Shows

- `ticket:20260527-flight-learn-diagnosis-card-integration#ACC-001` - supported. Focused render tests and render artifact show `Problem` and plain-English diagnosis text instead of raw command/path/cluster ID as the primary headline.
- `ticket:20260527-flight-learn-diagnosis-card-integration#ACC-002` - supported. Render artifact and tests show raw command detail under `Raw clue` and detector/provenance under `Why suggested` / expanded evidence rather than as the primary diagnosis.
- `ticket:20260527-flight-learn-diagnosis-card-integration#ACC-003` - supported. Focused tests assert representative line widths; render artifact shows `Why it matters` wraps to a readable measure even at 132 columns, while width checks keep every rendered line within the component width.
- `ticket:20260527-flight-learn-diagnosis-card-integration#ACC-004` - supported by focused component tests and Pi extension tests covering route selection, evidence expansion, edit, dismiss, skip, cancel, editor handoff, candidate-only storage, and no rule records.
- `ticket:20260527-flight-learn-diagnosis-card-integration#ACC-005` - supported by source inspection, source-only side-effect scan, unchanged production command registration, and tests preserving candidate-only behavior.

## What This Does Not Show

- It does not show real installed Pi TUI behavior; that belongs to `ticket:20260527-flight-learn-diagnosis-real-pi-validation`.
- It does not prove all terminal/theme variants.
- It does not prove operator preference after hands-on use.
- It does not add direct `@earendil-works/pi-tui` component imports. The implementation kept the existing custom renderer because package/dependency changes were outside this ticket's scope; this is consistent with the ticket's stop condition.
- It does not change artifact outcome follow-up UI.

## Related Records

- `ticket:20260527-flight-learn-diagnosis-card-integration` - ticket under validation.
- `ticket:20260527-flight-learn-diagnosis-view-model` - dependency ticket providing the helper.
- `plan:20260527-flight-learn-plain-english-diagnosis-cards` - parent plan.
- `spec:flight-learn-inbox-ux` - requirements REQ-019 through REQ-023 and SCN-007.
- `evidence:20260527-flight-learn-plain-english-feedback` - motivating feedback/screenshot.
