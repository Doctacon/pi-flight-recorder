# Docs Package Release Contract Validation

ID: evidence:20260523-docs-package-release-contract-validation
Type: Evidence Dossier
Status: recorded
Created: 2026-05-23
Updated: 2026-05-23
Observed: 2026-05-23

## Summary

This dossier records validation for `ticket:20260523-docs-package-release-contract`. The observed docs state extension-first usage while explicitly preserving release validation limits for real TUI rule promotion, high-confidence real TUI suggestions, real model-provider reflection, and long-run corpus tuning.

## Observations

- Observation: README now exposes validation limits and source-checkout smoke scope.
  - Procedure/source: Inspected `README.md` after docs alignment.
  - Actual result: README includes a `Release validation limits` section stating that guided Flight Rule promotion in real TUI, high-confidence real TUI suggestions, real model-assisted reflection, and long-run tuning remain unproven; it also states `npm run test:smoke:local` is a source-checkout fake-Pi/source-CLI smoke and not a real TUI or installed package smoke.

- Observation: First-run docs now expose validation limits.
  - Procedure/source: Inspected `docs/first-run.md` after docs alignment.
  - Actual result: The docs state that the local smoke uses synthetic fixture data and temp recorder dirs, is not real interactive Pi TUI proof, and does not execute the installed package binary; the same four release edges remain unproven.

- Observation: Live-monitoring docs now separate automated/local smoke from real release gaps.
  - Procedure/source: Inspected `docs/live-monitoring.md` after docs alignment.
  - Actual result: The docs state automated tests/local smoke cover fake-Pi/source-checkout contexts and prior real Pi smoke covered `/flight-status`, failed `tool_result` capture, and `/flight-reflect`, while the real TUI/model/corpus gaps remain unproven.

- Observation: Package dry-run includes expected built extension and docs surfaces.
  - Procedure/source: Ran `npm pack --dry-run` as part of full validation.
  - Actual result: Package dry-run produced `pi-flight-recorder-0.1.0.tgz` with total files `74`, including `dist/pi-extension.js`, new internal extension/storage modules under `dist/`, `README.md`, `docs/first-run.md`, `docs/live-monitoring.md`, and `package.json`.

- Observation: Full release validation passed after docs/package alignment.
  - Procedure/source: Ran `npm run typecheck && npm run test:smoke:local && npm test && npm run build && npm pack --dry-run`.
  - Actual result: Typecheck exited successfully; local smoke reported `Test Files 1 passed (1)` and `Tests 1 passed (1)`; full tests reported `Test Files 14 passed (14)` and `Tests 63 passed (63)`; build exited successfully; package dry-run produced `pi-flight-recorder-0.1.0.tgz`.

## Artifacts

Validation excerpts:

```text
> npm run typecheck
> tsc --noEmit

> npm run test:smoke:local
Test Files  1 passed (1)
Tests       1 passed (1)

> npm test
Test Files  14 passed (14)
Tests       63 passed (63)

> npm run build
> tsc -p tsconfig.build.json

> npm pack --dry-run
npm notice total files: 74
pi-flight-recorder-0.1.0.tgz
```

Docs/package paths touched by this ticket:

```text
README.md
docs/first-run.md
docs/live-monitoring.md
package.json
```

## What This Shows

- `ticket:20260523-docs-package-release-contract#ACC-001` - supports - README/first-run/live-monitoring docs align on extension-first usage, local smoke scope, and release limitations.
- `ticket:20260523-docs-package-release-contract#ACC-002` - supports - package dry-run includes expected `dist`, docs, README, and package metadata surfaces.
- `ticket:20260523-docs-package-release-contract#ACC-003` - supports - docs explicitly avoid overclaiming real TUI, real model-provider, and long-run corpus proof.
- `ticket:20260523-docs-package-release-contract#ACC-004` - supports - full validation passed after docs/package alignment.

## What This Does Not Show

- It does not prove real Pi TUI guided Flight Rule promotion.
- It does not prove high-confidence real TUI suggestion notification.
- It does not prove real model-provider reflection.
- It does not prove long-run corpus tuning.
- It does not execute an installed package in Pi.

## Related Records

- `ticket:20260523-docs-package-release-contract` - consuming ticket.
- `ticket:20260523-release-evidence-gap-smoke` - prerequisite evidence/defer pass.
- `evidence:20260523-release-evidence-gap-smoke` - release-risk proof/defer source.
- `plan:20260523-codebase-stabilization-release-readiness` - parent plan.
