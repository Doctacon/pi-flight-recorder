# Collapse Visible Command Surface Validation

ID: evidence:20260525-collapse-visible-command-surface-validation
Type: Evidence Dossier
Status: recorded
Created: 2026-05-25
Updated: 2026-05-25
Observed: 2026-05-25

## Summary

Validation observations for `ticket:20260525-collapse-visible-command-surface`: default command registration, subcommand routing, docs/source scans, and regression checks after collapsing the Pi extension surface to `/flight-status` and `/flight-learn`.

## Observations

- Observation: Focused Pi extension tests passed after changing command registration and routing.
  - Procedure/source: Ran `npm test -- src/pi-extension.test.ts` from `/Users/crlough/Code/personal/pi-flight-recorder` after source/docs changes.
  - Actual result: Vitest reported `Test Files 1 passed (1)` and `Tests 23 passed (23)`.

- Observation: TypeScript typecheck passed.
  - Procedure/source: Ran `npm run typecheck`.
  - Actual result: `tsc --noEmit` completed with exit code 0.

- Observation: Full automated test suite passed.
  - Procedure/source: Ran `npm test`.
  - Actual result: Vitest reported `Test Files 17 passed (17)` and `Tests 81 passed (81)`.

- Observation: Local smoke path passed with the new subcommand surface.
  - Procedure/source: Ran `npm run test:smoke:local`.
  - Actual result: Vitest reported `Test Files 1 passed (1)` and `Tests 1 passed (1)`.

- Observation: Build completed successfully.
  - Procedure/source: Ran `npm run build`.
  - Actual result: `npm run clean && tsc -p tsconfig.build.json` completed with exit code 0.

- Observation: Package dry-run succeeded and included built extension output.
  - Procedure/source: Ran `npm pack --dry-run`.
  - Actual result: npm reported package `pi-flight-recorder@0.1.0`, `total files: 83`, including `dist/pi-extension.js` and docs.

- Observation: Built extension output registers only `/flight-status` and `/flight-learn` before the explicit legacy alias gate.
  - Procedure/source: Ran `rg -n "registerCommand\?\.\(|legacyCommandAliasesEnabled|PI_FLIGHT_RECORDER_LEGACY_COMMANDS" dist/pi-extension.js | head -60` after build.
  - Actual result: `dist/pi-extension.js` shows `pi.registerCommand?.("flight-status"` and `pi.registerCommand?.("flight-learn"` before `if (legacyCommandAliasesEnabled(pi))`, with legacy aliases registered only inside that conditional block.

- Observation: Source/docs scan found no normal fallback guidance pointing at removed top-level slash commands; remaining old slash-command mentions are explicitly legacy/history references or CLI names.
  - Procedure/source: Ran `rg -n '/flight-(sync|mode|watch|feedback|reflect|review|delta-review|deltas|rules)|/seen-this-before' src/pi-extension.ts src/reflection.ts src/artifact-drafts.ts src/cli.ts src/*.test.ts README.md docs/first-run.md docs/live-monitoring.md`.
  - Actual result: The remaining matches were import paths containing `flight-rules`, tests that assert legacy commands are absent by default / present only by opt-in, CLI `seen-this-before`, `/flight-learn seen-this-before` alias support, legacy alias registration inside `legacyCommandAliasesEnabled`, and docs explicitly labeling legacy aliases as not registered by default.

## Artifacts

Key command excerpts:

```text
npm test -- src/pi-extension.test.ts
Test Files  1 passed (1)
Tests  23 passed (23)
```

```text
npm run typecheck
> tsc --noEmit
```

```text
npm test
Test Files  17 passed (17)
Tests  81 passed (81)
```

```text
npm run test:smoke:local
Test Files  1 passed (1)
Tests  1 passed (1)
```

```text
npm pack --dry-run
name: pi-flight-recorder
version: 0.1.0
total files: 83
```

## What This Shows

- `ticket:20260525-collapse-visible-command-surface#ACC-001` - supports - focused Pi extension tests now assert default registration exposes only `flight-status` and `flight-learn`; build output inspection shows legacy aliases behind an explicit gate.
- `ticket:20260525-collapse-visible-command-surface#ACC-002` - supports - focused tests and local smoke use `/flight-status sync`, `/flight-status mode`, and `/flight-status watch` subcommands for former status/control/debug behavior, including an explicit watcher-status routing regression test.
- `ticket:20260525-collapse-visible-command-surface#ACC-003` - supports - focused tests and local smoke use `/flight-learn seen`, `/flight-learn reflect`, `/flight-learn review`, `/flight-learn delta-review`, `/flight-learn deltas`, `/flight-learn feedback`, and `/flight-learn rules` paths for former learning/review/query behavior.
- `ticket:20260525-collapse-visible-command-surface#ACC-004` - supports - source/docs scan and updated focused tests observed no normal fallback guidance pointing at hidden legacy top-level slash commands.
- `ticket:20260525-collapse-visible-command-surface#ACC-005` - supports - README, first-run docs, and live-monitoring docs were updated and scanned for normal two-command guidance plus explicit legacy opt-in wording.
- `ticket:20260525-collapse-visible-command-surface#ACC-006` - supports - typecheck, focused Pi extension tests, full tests, local smoke, build, and package dry-run all passed.

## What This Does Not Show

- This evidence does not prove the real interactive Pi command palette visually shows only `/flight-status` and `/flight-learn`; no real TUI command-palette screenshot was captured in this ticket.
- This evidence does not prove global/user-scope package install behavior after this change; package dry-run and build are source/package checks only.
- This evidence does not prove real hosted/model-provider reflection; model behavior remains bounded by existing fake/local validation.
- This evidence does not prove long-run corpus precision/noise tuning.
- This evidence does not prove that every possible legacy slash alias path is documented exhaustively; it supports the normal surface and tested routing paths.

## Related Records

- `ticket:20260525-collapse-visible-command-surface` - execution ticket whose acceptance this dossier supports.
- `spec:visible-command-surface` - intended behavior and evidence plan for the two-command visible surface.
- `spec:delta-artifact-learning-loop` - learning-loop behavior preserved under `/flight-learn`.
- `spec:seamless-failure-memory-ux` - failure memory/reflection behavior preserved under the simplified command surface.
