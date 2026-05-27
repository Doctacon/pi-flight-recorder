# Flight Learn Focused Card Integration Validation

ID: evidence:20260527-flight-learn-focused-card-integration-validation
Type: Evidence Dossier
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Observed: 2026-05-27

## Summary

This dossier records validation for `ticket:20260527-flight-learn-focused-card-integration`, which wires the focused-card pending-delta review layout into the production `askFlightLearnDeltaInbox` custom UI path while preserving route/storage/fallback semantics.

## Observations

- Observation: production custom inbox creation now requests the focused-card layout.
  - Procedure/source: source inspection of `src/flight-learn-inbox.ts` after implementation.
  - Actual result: `askFlightLearnDeltaInbox(...)` calls `createFlightLearnDeltaInboxComponent({ input, done, tui, theme, layout: "focused-card" })`; direct component construction still supports the prior split-pane layout for tests/compatibility.

- Observation: focused component and extension tests passed.
  - Procedure/source: `npm test -- src/flight-learn-inbox.test.ts src/pi-extension.test.ts` from repository root.
  - Actual result: 2 test files passed; 33 tests passed. Output is preserved in `.loom/evidence/artifacts/20260527-flight-learn-focused-card-integration/focused-tests.txt`.

- Observation: full regression tests passed.
  - Procedure/source: `npm test` from repository root.
  - Actual result: 18 test files passed; 91 tests passed. Output is preserved in `.loom/evidence/artifacts/20260527-flight-learn-focused-card-integration/full-tests.txt`.

- Observation: TypeScript typecheck passed.
  - Procedure/source: `npm run typecheck` from repository root.
  - Actual result: `tsc --noEmit` exited successfully. Output is preserved in `.loom/evidence/artifacts/20260527-flight-learn-focused-card-integration/typecheck.txt`.

- Observation: build passed.
  - Procedure/source: `npm run build` from repository root.
  - Actual result: clean build completed through `tsc -p tsconfig.build.json`. Output is preserved in `.loom/evidence/artifacts/20260527-flight-learn-focused-card-integration/build.txt`.

- Observation: production-path render artifact shows focused-card output.
  - Procedure/source: `.loom/evidence/artifacts/20260527-flight-learn-focused-card-integration/render-production-focused-card.mjs` imported built `dist/flight-learn-inbox.js` and invoked `askFlightLearnDeltaInbox(...)` with a fake `ctx.ui.custom` that captures component renders.
  - Actual result: `.loom/evidence/artifacts/20260527-flight-learn-focused-card-integration/render-output.txt` shows the production wrapper rendering `Flight Learn — Issue 2 of 2`, primary `Issue` / `What happened?` / `Why it matters` / `Expected` sections, collapsed evidence by default, expanded evidence after `v`, and vertical `Choose a follow-up` rows.

- Observation: route-selected editor handoff and candidate-only storage remain covered.
  - Procedure/source: `src/pi-extension.test.ts` custom inbox test exercised editing expectation text, choosing route `2`, using the `Why this follow-up?` editor, then inspecting the local store.
  - Actual result: the delta became `routed`; expectation edit persisted; the artifact candidate type was `test-check`; candidate status was `accepted`; `applied=false`; evidence refs remained present; `rule_candidates` and `flight_rules` counts stayed `0`.

- Observation: focused-card interactions remain covered at component level.
  - Procedure/source: `src/flight-learn-inbox.test.ts` focused-card tests.
  - Actual result: tests cover focused-card render, evidence expansion, edit/save, edit-cancel rollback, route selection, Kitty/CSI-u shortcut/printable input, dismiss, skip, cancel, and width safety.

- Observation: targeted diff whitespace check produced no findings.
  - Procedure/source: `git diff --check -- src/flight-learn-inbox.ts src/flight-learn-inbox.test.ts src/pi-extension.test.ts .loom/tickets/20260527-flight-learn-focused-card-integration.md .loom/plans/20260527-flight-learn-focused-card-redesign.md`.
  - Actual result: command exited successfully with empty output. Output file `.loom/evidence/artifacts/20260527-flight-learn-focused-card-integration/diff-check.txt` is empty.

## Artifacts

- `.loom/evidence/artifacts/20260527-flight-learn-focused-card-integration/render-production-focused-card.mjs` - deterministic production-wrapper render fixture.
- `.loom/evidence/artifacts/20260527-flight-learn-focused-card-integration/render-output.txt` - collapsed and expanded production-wrapper focused-card output.
- `.loom/evidence/artifacts/20260527-flight-learn-focused-card-integration/focused-tests.txt` - focused test output.
- `.loom/evidence/artifacts/20260527-flight-learn-focused-card-integration/full-tests.txt` - full test output.
- `.loom/evidence/artifacts/20260527-flight-learn-focused-card-integration/typecheck.txt` - typecheck output.
- `.loom/evidence/artifacts/20260527-flight-learn-focused-card-integration/build.txt` - build output.
- `.loom/evidence/artifacts/20260527-flight-learn-focused-card-integration/diff-check.txt` - empty successful diff-check output.

Key render excerpt:

```text
Flight Learn — Issue 2 of 2
2 pending · 3 evidence refs · ↑/↓ changes issue

Issue
 bash cd /Users/<user>/Code/personal/pi-flight-recorder && npm run build from stale panes

What happened?
 Observed 2 related failure occurrences where validation commands ran from a stale shell context
 after package reinstall.

Why it matters
 Repeated local friction across tools and cwd setup makes release validation slower and harder to
 trust.

Expected
 unknown — press e to add what should have happened

Evidence
 3 refs hidden by default — press v to view concise refs.

Choose a follow-up
▶ [1] Code legibility
 Use when confusing source or project shape causes repeated mistakes.
 [2] Test/check
 Use when a missing or weak validation check would have caught this.
```

## What This Shows

- `ticket:20260527-flight-learn-focused-card-integration#ACC-001` - supports - production `askFlightLearnDeltaInbox` render artifact and extension test show focused-card output instead of split-pane/table output.
- `ticket:20260527-flight-learn-focused-card-integration#ACC-002` - supports - extension test exercises route-selected editor handoff and verifies accepted artifact candidate with `applied=false`, evidence refs preserved, and no rule records created.
- `ticket:20260527-flight-learn-focused-card-integration#ACC-003` - supports - focused component tests cover edit, evidence expansion, dismiss, skip, cancel, route selection, route navigation via numeric/left-right paths, and Kitty/CSI-u input.
- `ticket:20260527-flight-learn-focused-card-integration#ACC-004` - supports - source diff did not touch command registration, storage migrations, model/provider calls, or classifier behavior; full tests passed.
- `ticket:20260527-flight-learn-focused-card-integration#ACC-005` - supports - focused tests, full tests, typecheck, build, diff-check, and render artifact are preserved.

## What This Does Not Show

- This is not real interactive Pi TUI proof; installed-package/live terminal validation remains owned by `ticket:20260527-flight-learn-focused-card-real-pi-validation`.
- This does not validate global/user-scope package install, command palette behavior in a live terminal, or theme/contrast behavior in real Pi.
- This does not implement artifact candidate outcome follow-up UI.
- This does not add direct Pi TUI primitive imports/dependencies; it wires the focused-card shape through the existing custom component contract.
- This does not resolve whether route rows should use up/down navigation instead of left/right; key hints remain explicit and the behavior remains tested.

## Related Records

- `ticket:20260527-flight-learn-focused-card-integration` - ticket under validation.
- `ticket:20260527-flight-learn-focused-card-render-harness` - prerequisite renderer/prototype.
- `audit:20260527-flight-learn-focused-card-render-harness-review` - prior audit and scope-boundary finding.
- `plan:20260527-flight-learn-focused-card-redesign` - parent plan.
- `spec:flight-learn-inbox-ux` - UX behavior contract.
