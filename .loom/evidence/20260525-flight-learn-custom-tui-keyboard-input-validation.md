# Flight Learn Custom TUI Keyboard Input Validation

ID: evidence:20260525-flight-learn-custom-tui-keyboard-input-validation
Type: Evidence Dossier
Status: recorded
Created: 2026-05-25
Updated: 2026-05-25
Observed: 2026-05-25

## Summary

This dossier records validation for `ticket:20260525-flight-learn-custom-tui-keyboard-input`, a bug fix for the custom `/flight-learn` inbox becoming apparently unresponsive after entering the routing-rationale panel in real Pi.

## Observations

- Observation: user screenshot shows the custom inbox in `Routing rationale` mode after Enter.
  - Procedure/source: screenshot supplied by the operator at `/var/folders/xk/pmxkhd7x635cskr6l4qw0mx00000gn/T/pi-clipboard-fd02f55d-63cd-44a3-bc48-92ff8e6a8847.png`; copied to `.loom/evidence/artifacts/20260525-flight-learn-custom-tui-keyboard-input/user-screenshot-routing-rationale.png`.
  - Actual result: the UI had advanced into `Routing rationale` for `Code legibility`, so Enter was handled; the reported failure after that was consistent with printable/subsequent key input being ignored.

- Observation: focused component and Pi extension tests passed after adding Kitty/CSI-u input coverage.
  - Procedure/source: `npm test -- src/flight-learn-inbox.test.ts src/pi-extension.test.ts` from repository root.
  - Actual result: 2 test files passed; 31 tests passed. Output is preserved in `.loom/evidence/artifacts/20260525-flight-learn-custom-tui-keyboard-input/focused-tests.txt`.

- Observation: full regression tests passed.
  - Procedure/source: `npm test` from repository root.
  - Actual result: 18 test files passed; 89 tests passed. Output is preserved in `.loom/evidence/artifacts/20260525-flight-learn-custom-tui-keyboard-input/full-tests.txt`.

- Observation: TypeScript typecheck passed.
  - Procedure/source: `npm run typecheck` from repository root.
  - Actual result: `tsc --noEmit` exited successfully. Output is preserved in `.loom/evidence/artifacts/20260525-flight-learn-custom-tui-keyboard-input/typecheck.txt`.

- Observation: package build passed.
  - Procedure/source: `npm run build` from repository root.
  - Actual result: clean build completed through `tsc -p tsconfig.build.json`. Output is preserved in `.loom/evidence/artifacts/20260525-flight-learn-custom-tui-keyboard-input/build.txt`.

- Observation: local smoke test passed.
  - Procedure/source: `npm run test:smoke:local` from repository root.
  - Actual result: 1 test file passed; 1 test passed. Output is preserved in `.loom/evidence/artifacts/20260525-flight-learn-custom-tui-keyboard-input/local-smoke.txt`.

- Observation: targeted whitespace/diff check produced no findings.
  - Procedure/source: `git diff --check -- src/flight-learn-inbox.ts src/flight-learn-inbox.test.ts .loom/tickets/20260525-flight-learn-custom-tui-keyboard-input.md`.
  - Actual result: command exited successfully with empty output. Output file `.loom/evidence/artifacts/20260525-flight-learn-custom-tui-keyboard-input/diff-check.txt` is empty.

## Artifacts

- `.loom/evidence/artifacts/20260525-flight-learn-custom-tui-keyboard-input/user-screenshot-routing-rationale.png` - operator-supplied screenshot showing the stuck state in the routing-rationale panel.
- `.loom/evidence/artifacts/20260525-flight-learn-custom-tui-keyboard-input/focused-tests.txt` - focused test output.
- `.loom/evidence/artifacts/20260525-flight-learn-custom-tui-keyboard-input/full-tests.txt` - full regression test output.
- `.loom/evidence/artifacts/20260525-flight-learn-custom-tui-keyboard-input/typecheck.txt` - typecheck output.
- `.loom/evidence/artifacts/20260525-flight-learn-custom-tui-keyboard-input/build.txt` - build output.
- `.loom/evidence/artifacts/20260525-flight-learn-custom-tui-keyboard-input/local-smoke.txt` - local smoke output.
- `.loom/evidence/artifacts/20260525-flight-learn-custom-tui-keyboard-input/diff-check.txt` - empty successful diff check output.

## What This Shows

- `ticket:20260525-flight-learn-custom-tui-keyboard-input#ACC-001` - supports - focused test coverage now sends Kitty/CSI-u printable text in rationale mode and observes a completed routed result with the typed rationale.
- `ticket:20260525-flight-learn-custom-tui-keyboard-input#ACC-002` - supports - focused test coverage now sends Kitty/CSI-u shortcut keys for edit, clear, route selection, and Enter.
- `ticket:20260525-flight-learn-custom-tui-keyboard-input#ACC-003` - supports - existing focused custom inbox/Pi extension tests and full regression tests still pass.
- `ticket:20260525-flight-learn-custom-tui-keyboard-input#ACC-004` - supports - the changed code is limited to component input decoding/tests; no command surface, storage semantics, model/provider, or auto-apply path changed.

## What This Does Not Show

- This is not a fresh real interactive Pi replay after the fix. The user screenshot demonstrates the pre-fix stuck state, while the fix is validated by component-level Kitty/CSI-u regression tests.
- The tests cover representative Kitty/CSI-u sequences for printable text and shortcuts, not every terminal keyboard protocol variant.
- This evidence does not validate visual layout, artifact outcome follow-up, classifier behavior, or installed-package behavior.

## Related Records

- `ticket:20260525-flight-learn-custom-tui-keyboard-input` - ticket under validation.
- `ticket:20260525-flight-learn-custom-tui-inbox` - original custom inbox implementation ticket.
- `spec:flight-learn-inbox-ux` - intended custom inbox behavior.
