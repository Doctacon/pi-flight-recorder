# Flight Learn Diagnosis View Model Validation

ID: evidence:20260527-flight-learn-diagnosis-view-model-validation
Type: Evidence Dossier
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Observed: 2026-05-27

## Summary

This dossier records validation for `ticket:20260527-flight-learn-diagnosis-view-model`. A bounded Ralph implementation run added a pure local diagnosis helper and focused tests. After audit finding `audit:20260527-flight-learn-diagnosis-view-model-review#FIND-001`, a follow-up implementation run removed the summary gate around useful human fields and added `expectedBehavior`. The coordinator reran focused tests, typecheck, build, full tests, diff whitespace checks, and targeted side-effect scans before and after the follow-up.

## Source State

Changed source/test files for this ticket:

- `src/flight-learn-diagnosis.ts`
- `src/flight-learn-diagnosis.test.ts`

Artifacts and command outputs are under:

```text
.loom/evidence/artifacts/20260527-flight-learn-diagnosis-view-model/
```

`08-source-provenance.txt` records the initial untracked status and SHA-256 hashes for the new files. `15-followup-source-provenance.txt` records the follow-up status and SHA-256 hashes after resolving the audit finding. Snapshots are preserved as:

- `flight-learn-diagnosis.ts.snapshot`
- `flight-learn-diagnosis.test.ts.snapshot`
- `flight-learn-diagnosis.followup.ts.snapshot`
- `flight-learn-diagnosis.followup.test.ts.snapshot`

## Observations

- Observation: focused helper tests passed.
  - Procedure: `npx vitest run src/flight-learn-diagnosis.test.ts`.
  - Result: `1 passed (1)`, `4 passed (4)`.
  - Artifact: `01-focused-tests.txt`.

- Observation: TypeScript typecheck passed.
  - Procedure: `npm run typecheck`.
  - Result: command completed through `tsc --noEmit` without errors.
  - Artifact: `02-typecheck.txt`.

- Observation: package build passed.
  - Procedure: `npm run build`.
  - Result: command completed through `npm run clean && tsc -p tsconfig.build.json` without errors.
  - Artifact: `03-build.txt`.

- Observation: full test suite passed after the helper was added.
  - Procedure: `npm test`.
  - Result: `19 passed (19)`, `95 passed (95)`.
  - Artifact: `04-full-tests.txt`.

- Observation: targeted diff whitespace check passed.
  - Procedure: `git diff --check -- src/flight-learn-diagnosis.ts src/flight-learn-diagnosis.test.ts`.
  - Result: no output, no whitespace errors.
  - Artifact: `05-diff-check.txt`.

- Observation: targeted scan found no obvious forbidden side-effect hooks in the new helper/test files.
  - Procedure: `rg "fetch\(|complete\(|modelProvider|http|https|createExpectationDelta|recordDelta|registerCommand|writeFile|appendFile" src/flight-learn-diagnosis.ts src/flight-learn-diagnosis.test.ts`.
  - Result: no matches.
  - Artifact: `06-forbidden-side-effect-scan.txt`.

- Observation: source inspection shows the helper returns a display-only object.
  - Procedure: inspected `src/flight-learn-diagnosis.ts`.
  - Result: `buildFlightLearnDiagnosisView(...)` returns `headline`, `whatHappened`, `whyItMatters`, `rawClue`, `confidence`, and `limits`; inputs are `ExpectationDelta` and optional `DeltaDetectorSignal[]`; no store or command-registration APIs are imported.

- Observation: tests cover the shaped cases.
  - Procedure: inspected `src/flight-learn-diagnosis.test.ts`.
  - Result: tests cover a reflection-cluster/raw-command screenshot-shaped case, build/validation domain, stale edit, user correction, useful manual human-authored fields, no-mutation behavior, raw detector summary plus useful edited expectation/reality/impact fields, and low-confidence unknown fallback.

- Observation: follow-up focused helper tests passed after resolving `FIND-001`.
  - Procedure: `npx vitest run src/flight-learn-diagnosis.test.ts`.
  - Result: `1 passed (1)`, `5 passed (5)`.
  - Artifact: `09-followup-focused-tests.txt`.

- Observation: follow-up TypeScript typecheck passed.
  - Procedure: `npm run typecheck`.
  - Result: command completed through `tsc --noEmit` without errors.
  - Artifact: `10-followup-typecheck.txt`.

- Observation: follow-up package build passed.
  - Procedure: `npm run build`.
  - Result: command completed through `npm run clean && tsc -p tsconfig.build.json` without errors.
  - Artifact: `11-followup-build.txt`.

- Observation: follow-up full test suite passed.
  - Procedure: `npm test`.
  - Result: `19 passed (19)`, `96 passed (96)`.
  - Artifact: `12-followup-full-tests.txt`.

- Observation: follow-up targeted diff whitespace check passed.
  - Procedure: `git diff --check -- src/flight-learn-diagnosis.ts src/flight-learn-diagnosis.test.ts`.
  - Result: no output, no whitespace errors.
  - Artifact: `13-followup-diff-check.txt`.

- Observation: follow-up targeted side-effect scan found no obvious forbidden side-effect hooks.
  - Procedure: `rg "fetch\(|complete\(|modelProvider|http|https|createExpectationDelta|recordDelta|registerCommand|writeFile|appendFile" src/flight-learn-diagnosis.ts src/flight-learn-diagnosis.test.ts`.
  - Result: no matches.
  - Artifact: `14-followup-forbidden-side-effect-scan.txt`.

## What This Shows

- `ticket:20260527-flight-learn-diagnosis-view-model#ACC-001` - supported. Source inspection and focused tests show a pure local helper returning structured display diagnosis fields, now including `expectedBehavior` in addition to the required fields.
- `ticket:20260527-flight-learn-diagnosis-view-model#ACC-002` - supported. The focused test `turns a reflection-cluster raw command into a plain-English validation diagnosis` asserts the headline/what-happened text exclude raw `bash cd`, raw cluster ID, and raw `/Users/alice` path while preserving a redacted `rawClue`.
- `ticket:20260527-flight-learn-diagnosis-view-model#ACC-003` - supported. Focused tests cover build/validation, stale edit, user correction, reflection-cluster, and unknown fallback cases.
- `ticket:20260527-flight-learn-diagnosis-view-model#ACC-004` - supported after follow-up. The focused manual-field test asserts useful human-authored summary/reality/impact/expectation win and that the source delta JSON is unchanged. The added follow-up test asserts a raw detector summary can still use a derived headline while preserving useful edited `reality`, `impact`, and `expectation` as display fields without mutating the delta.
- `ticket:20260527-flight-learn-diagnosis-view-model#ACC-005` - supported by source inspection, the targeted side-effect scan, and the absence of package/schema/command changes in this ticket scope.

## What This Does Not Show

- It does not show the helper integrated into `/flight-learn`; that belongs to `ticket:20260527-flight-learn-diagnosis-card-integration`.
- It does not show real Pi TUI behavior; that belongs to `ticket:20260527-flight-learn-diagnosis-real-pi-validation`.
- It does not prove every possible detector/evidence phrase will produce a good headline. The helper is deterministic and conservative; real fixtures may require tuning.
- It does not prove that `expectedBehavior` is displayed in the TUI; that belongs to the integration ticket.
- It does not prove hosted/model-provider behavior because no provider path is intended or used.

## Related Records

- `ticket:20260527-flight-learn-diagnosis-view-model` - ticket under validation.
- `plan:20260527-flight-learn-plain-english-diagnosis-cards` - parent plan.
- `spec:flight-learn-inbox-ux` - requirements REQ-019 through REQ-023 and SCN-007.
- `evidence:20260527-flight-learn-plain-english-feedback` - motivating screenshot/feedback.
