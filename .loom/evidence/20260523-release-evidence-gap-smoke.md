# Release Evidence Gap Smoke

ID: evidence:20260523-release-evidence-gap-smoke
Type: Evidence Dossier
Status: recorded
Created: 2026-05-23
Updated: 2026-05-23
Observed: 2026-05-23

## Summary

This dossier records the release-risk evidence/defer pass after the local smoke harness and behavior-preserving refactors. It separates final-code-shape local observations from real Pi TUI/model/corpus evidence that remains unavailable or intentionally deferred.

## Observations

- Observation: Final-code-shape local smoke passed.
  - Procedure/source: Ran `npm run test:smoke:local` after the Pi extension and storage boundary refactors.
  - Actual result: `Test Files 1 passed (1)` and `Tests 1 passed (1)`. The smoke covers fake-Pi extension status/mode/sync/query/live occurrence/reflection/guided rule approval/injection/rules status plus direct CLI `main()` status. It does not cover disable/no-injection; that is covered by broader fake-Pi tests in `src/pi-extension.test.ts` and full-test evidence from the refactor tickets.

- Observation: Built CLI status works against an explicit isolated release-smoke data dir.
  - Procedure/source: Ran `node dist/cli.js status --data-dir /tmp/pi-flight-recorder-release-gap-smoke --json` and summarized non-sensitive fields.
  - Actual result:

```json
{
  "dataDir": "/tmp/pi-flight-recorder-release-gap-smoke",
  "counts": {
    "sourceFiles": 0,
    "episodes": 0,
    "occurrences": 0,
    "clusters": 0,
    "proposals": 0,
    "feedbackActions": 0
  },
  "localOnly": true,
  "modelReflectionEnabled": false
}
```

- Observation: Real interactive rule-promotion TUI evidence was not gathered in this execution context.
  - Procedure/source: Read `ticket:20260523-interactive-rule-promotion-tui-validation`.
  - Actual result: The ticket remains `Status: blocked` and explicitly requires real Pi TUI evidence for proposal review/action selection, Make Rule draft/edit/scope approval, later injection, disable/no-injection, and follow-up audit. This pass did not substitute fake-Pi or CLI evidence for that acceptance.

- Observation: High-confidence live suggestion notification in a real TUI remains unproven.
  - Procedure/source: Read prior evidence posture and ran local smoke only.
  - Actual result: Local/fake-Pi coverage proves suggestion/injection code paths in tests, but no real Pi TUI high-confidence notification was captured after the final refactors. This remains an explicit release limit rather than a proven claim.

- Observation: Model-assisted reflection with a real provider was not attempted.
  - Procedure/source: Built CLI status and existing docs/evidence show model reflection disabled by default; no provider was invoked.
  - Actual result: The isolated CLI status reported `modelReflectionEnabled: false`. Existing model-assisted coverage remains fake-provider/local prompt-boundary evidence only.

- Observation: Long-run real-corpus tuning remains limited.
  - Procedure/source: This pass did not read or export raw real sessions and did not create a mature occurrence corpus.
  - Actual result: Long-run precision/noise tuning remains outside this evidence pass and should not be claimed as proven.

## Artifacts

Command excerpts:

```text
> npm run test:smoke:local
Test Files  1 passed (1)
Tests       1 passed (1)
```

```text
node dist/cli.js status --data-dir /tmp/pi-flight-recorder-release-gap-smoke --json
# summarized non-sensitive fields shown in Observations
```

Relevant status excerpt:

```text
.loom/tickets/20260523-interactive-rule-promotion-tui-validation.md
Status: blocked
Current State: Blocked on real interactive Pi TUI smoke ...
```

Git status excerpt during this pass:

```text
M README.md
M docs/first-run.md
M package.json
M src/pi-extension.ts
M src/storage.ts
?? src/local-smoke.test.ts
?? src/pi-extension-command-utils.ts
?? src/pi-extension-event-utils.ts
?? src/pi-extension-types.ts
?? src/storage-mappers.ts
?? .loom/evidence/20260523-release-evidence-gap-smoke.md
```

## What This Shows

- `ticket:20260523-release-evidence-gap-smoke#ACC-001` - supports - this evidence record names which release-risk scenarios were observed locally, not attempted, and why.
- `ticket:20260523-release-evidence-gap-smoke#ACC-002` - supports - real interactive rule-promotion state is reconciled by leaving `ticket:20260523-interactive-rule-promotion-tui-validation` blocked and not substituting fake-Pi evidence.
- `ticket:20260523-release-evidence-gap-smoke#ACC-003` - partially supports - approved-rule approval/injection/rules status are exercised in local smoke; disable/no-injection reversibility is covered by `src/pi-extension.test.ts` and final full-test evidence, not local smoke; high-confidence real TUI suggestion notification remains explicitly deferred as a release limit.
- `ticket:20260523-release-evidence-gap-smoke#ACC-004` - supports - model-assisted reflection and long-run corpus tuning are explicitly not claimed as proven; real-provider and mature-corpus evidence remain absent.
- `ticket:20260523-release-evidence-gap-smoke#ACC-005` - supports - this pass changed no implementation files beyond prerequisite harness/refactor work; this ticket itself produced evidence/status updates and no product behavior changes.

## What This Does Not Show

- It does not prove real Pi TUI guided rule promotion.
- It does not exercise Flight Rule disable/no-injection in the local smoke test; that coverage is from broader fake-Pi tests.
- It does not prove high-confidence live suggestion notification in a real TUI.
- It does not prove real model-provider reflection.
- It does not prove long-run corpus precision/noise tuning.
- It does not prove installed-package behavior beyond prior package dry-run and built CLI status.

## Related Records

- `ticket:20260523-release-evidence-gap-smoke` - consuming ticket.
- `ticket:20260523-interactive-rule-promotion-tui-validation` - still-blocked real TUI validation.
- `evidence:20260523-repeatable-local-smoke-harness-validation` - local smoke harness validation.
- `evidence:20260523-pi-extension-boundary-refactor-validation` - final extension refactor validation.
- `evidence:20260523-storage-schema-boundary-refactor-validation` - final storage refactor validation.
- `plan:20260523-codebase-stabilization-release-readiness` - parent plan.
