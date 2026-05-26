# Flight Learn Follow-up Copy Validation

ID: evidence:20260525-flight-learn-followup-copy-validation
Type: Evidence Dossier
Status: recorded
Created: 2026-05-25
Updated: 2026-05-25
Observed: 2026-05-25

## Summary

This dossier records validation for `ticket:20260525-flight-learn-followup-copy`, which replaces user-facing `Routing rationale` wording with `Why this follow-up?` and plainer prefill text.

## Observations

- Observation: focused tests passed after the copy change.
  - Procedure/source: `npm test -- src/artifact-drafts.test.ts src/flight-learn-inbox.test.ts src/pi-extension.test.ts` from repository root.
  - Actual result: 3 test files passed; 34 tests passed. Output is preserved in `.loom/evidence/artifacts/20260525-flight-learn-followup-copy/focused-tests.txt`.

- Observation: full regression tests passed.
  - Procedure/source: `npm test` from repository root.
  - Actual result: 18 test files passed; 90 tests passed. Output is preserved in `.loom/evidence/artifacts/20260525-flight-learn-followup-copy/full-tests.txt`.

- Observation: TypeScript typecheck passed.
  - Procedure/source: `npm run typecheck` from repository root.
  - Actual result: `tsc --noEmit` exited successfully. Output is preserved in `.loom/evidence/artifacts/20260525-flight-learn-followup-copy/typecheck.txt`.

- Observation: build passed.
  - Procedure/source: `npm run build` from repository root.
  - Actual result: clean build completed through `tsc -p tsconfig.build.json`. Output is preserved in `.loom/evidence/artifacts/20260525-flight-learn-followup-copy/build.txt`.

- Observation: targeted diff whitespace check produced no findings.
  - Procedure/source: `git diff --check -- src/artifact-drafts.ts src/flight-learn-inbox.ts src/pi-extension.ts src/pi-extension.test.ts .loom/specs/flight-learn-inbox-ux.md .loom/tickets/20260525-flight-learn-followup-copy.md`.
  - Actual result: command exited successfully with empty output. Output file `.loom/evidence/artifacts/20260525-flight-learn-followup-copy/diff-check.txt` is empty.

## Artifacts

- `.loom/evidence/artifacts/20260525-flight-learn-followup-copy/focused-tests.txt` - focused test output.
- `.loom/evidence/artifacts/20260525-flight-learn-followup-copy/full-tests.txt` - full test output.
- `.loom/evidence/artifacts/20260525-flight-learn-followup-copy/typecheck.txt` - typecheck output.
- `.loom/evidence/artifacts/20260525-flight-learn-followup-copy/build.txt` - build output.
- `.loom/evidence/artifacts/20260525-flight-learn-followup-copy/diff-check.txt` - empty successful diff check output.

## What This Shows

- `ticket:20260525-flight-learn-followup-copy#ACC-001` - supports - source/tests now use `Why this follow-up?` for the Pi editor prompt and custom fallback copy instead of `Routing rationale`.
- `ticket:20260525-flight-learn-followup-copy#ACC-002` - supports - prefill text now says `I chose <follow-up> because ...` or explains Observe in plain language.
- `ticket:20260525-flight-learn-followup-copy#ACC-003` - supports - focused tests, full tests, typecheck, build, and diff check passed.

## What This Does Not Show

- This is not a live Pi screenshot after the copy change.
- This does not change the storage field name or internal concept of candidate rationale; it changes the user-facing wording.
- This does not validate the broader custom inbox live interaction issues beyond the copied prompt text.

## Related Records

- `ticket:20260525-flight-learn-followup-copy` - ticket under validation.
- `spec:flight-learn-inbox-ux` - UX contract updated to avoid internal `routing rationale` wording in the scenario.
