# Flight Learn Rationale Editor Fallback Validation

ID: evidence:20260525-flight-learn-rationale-editor-fallback-validation
Type: Evidence Dossier
Status: recorded
Created: 2026-05-25
Updated: 2026-05-25
Observed: 2026-05-25

## Summary

This dossier records validation for `ticket:20260525-flight-learn-rationale-editor-fallback`, which removes custom inline rationale text entry from the `/flight-learn` inbox and hands rationale text to Pi's existing editor helper after route selection.

## Observations

- Observation: operator screenshot shows the inline custom `Routing rationale` panel where keys were not recognized.
  - Procedure/source: screenshot supplied at `/var/folders/xk/pmxkhd7x635cskr6l4qw0mx00000gn/T/pi-clipboard-1a05612d-3360-48d5-9eea-ae9bdd756310.png`; copied to `.loom/evidence/artifacts/20260525-flight-learn-rationale-editor-fallback/user-screenshot-inline-rationale-stuck.png`.
  - Actual result: the custom component reached `Routing rationale`, but the operator reported no subsequent keystrokes were recognized.

- Observation: focused tests passed after route selection was changed to close the custom component and use the rationale editor helper.
  - Procedure/source: `npm test -- src/flight-learn-inbox.test.ts src/pi-extension.test.ts` from repository root.
  - Actual result: 2 test files passed; 32 tests passed. Output is preserved in `.loom/evidence/artifacts/20260525-flight-learn-rationale-editor-fallback/focused-tests.txt`.

- Observation: full regression tests passed.
  - Procedure/source: `npm test` from repository root.
  - Actual result: 18 test files passed; 90 tests passed. Output is preserved in `.loom/evidence/artifacts/20260525-flight-learn-rationale-editor-fallback/full-tests.txt`.

- Observation: TypeScript typecheck passed.
  - Procedure/source: `npm run typecheck` from repository root.
  - Actual result: `tsc --noEmit` exited successfully. Output is preserved in `.loom/evidence/artifacts/20260525-flight-learn-rationale-editor-fallback/typecheck.txt`.

- Observation: build passed.
  - Procedure/source: `npm run build` from repository root.
  - Actual result: clean build completed through `tsc -p tsconfig.build.json`. Output is preserved in `.loom/evidence/artifacts/20260525-flight-learn-rationale-editor-fallback/build.txt`.

- Observation: local smoke passed.
  - Procedure/source: `npm run test:smoke:local` from repository root.
  - Actual result: 1 test file passed; 1 test passed. Output is preserved in `.loom/evidence/artifacts/20260525-flight-learn-rationale-editor-fallback/local-smoke.txt`.

- Observation: package dry-run completed.
  - Procedure/source: `npm pack --dry-run` from repository root after build.
  - Actual result: package dry run completed and included built `dist/flight-learn-inbox.js` and `dist/pi-extension.js`. Output is preserved in `.loom/evidence/artifacts/20260525-flight-learn-rationale-editor-fallback/pack-dry-run.txt`.

- Observation: targeted diff whitespace check produced no findings.
  - Procedure/source: `git diff --check -- src/flight-learn-inbox.ts src/flight-learn-inbox.test.ts src/pi-extension.ts src/pi-extension.test.ts .loom/tickets/20260525-flight-learn-rationale-editor-fallback.md`.
  - Actual result: command exited successfully with empty output. Output file `.loom/evidence/artifacts/20260525-flight-learn-rationale-editor-fallback/diff-check.txt` is empty.

## Artifacts

- `.loom/evidence/artifacts/20260525-flight-learn-rationale-editor-fallback/user-screenshot-inline-rationale-stuck.png` - pre-fix stuck inline rationale panel.
- `.loom/evidence/artifacts/20260525-flight-learn-rationale-editor-fallback/focused-tests.txt` - focused test output.
- `.loom/evidence/artifacts/20260525-flight-learn-rationale-editor-fallback/full-tests.txt` - full regression test output.
- `.loom/evidence/artifacts/20260525-flight-learn-rationale-editor-fallback/typecheck.txt` - typecheck output.
- `.loom/evidence/artifacts/20260525-flight-learn-rationale-editor-fallback/build.txt` - build output.
- `.loom/evidence/artifacts/20260525-flight-learn-rationale-editor-fallback/local-smoke.txt` - local smoke output.
- `.loom/evidence/artifacts/20260525-flight-learn-rationale-editor-fallback/pack-dry-run.txt` - package dry-run output.
- `.loom/evidence/artifacts/20260525-flight-learn-rationale-editor-fallback/diff-check.txt` - empty successful diff check output.

## What This Shows

- `ticket:20260525-flight-learn-rationale-editor-fallback#ACC-001` - supports - component tests now observe route-card Enter returning `route-selected`, and the inline rationale typing path is no longer used by normal route selection.
- `ticket:20260525-flight-learn-rationale-editor-fallback#ACC-002` - supports - Pi extension tests observe custom route selection followed by `askReviewEditor` rationale submission, then accepted artifact candidate storage with `applied=false` and preserved evidence refs.
- `ticket:20260525-flight-learn-rationale-editor-fallback#ACC-003` - supports - Pi extension tests observe rationale editor cancellation leaving the delta as `candidate` and creating zero artifact candidates.
- `ticket:20260525-flight-learn-rationale-editor-fallback#ACC-004` - supports - focused tests, full tests, typecheck, build, local smoke, package dry-run, and diff check passed; source changes did not alter command registration, model/provider behavior, or storage schema.

## What This Does Not Show

- This is not a fresh live Pi replay after the fallback change. The screenshot captures the pre-fix inline rationale failure.
- This evidence assumes Pi's existing `ctx.ui.editor` remains usable for free-form text entry; that editor is already used elsewhere in the extension but was not manually replayed in this run.
- This does not validate artifact outcome follow-up custom UI, classifier behavior, or long-run corpus behavior.

## Related Records

- `ticket:20260525-flight-learn-rationale-editor-fallback` - ticket under validation.
- `ticket:20260525-flight-learn-custom-tui-inbox` - original custom inbox implementation.
- `ticket:20260525-flight-learn-custom-tui-keyboard-input` - earlier input fix whose evidence did not include a fresh live replay.
- `spec:flight-learn-inbox-ux` - intended custom inbox behavior.
