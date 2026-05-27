# Flight Learn Delta At-a-Glance Validation

ID: evidence:20260525-flight-learn-delta-at-a-glance-validation
Type: Evidence Dossier
Status: recorded
Created: 2026-05-25
Updated: 2026-05-25
Observed: 2026-05-25

## Summary

This dossier records validation for `ticket:20260525-flight-learn-delta-at-a-glance`, which improves the custom `/flight-learn` inbox so selected deltas and route choices are easier to understand at a glance.

## Observations

- Observation: focused render/integration tests passed.
  - Procedure/source: `npm test -- src/flight-learn-inbox.test.ts src/pi-extension.test.ts` from repository root.
  - Actual result: 2 test files passed; 32 tests passed. Output is preserved in `.loom/evidence/artifacts/20260525-flight-learn-delta-at-a-glance/focused-tests.txt`.

- Observation: full regression tests passed.
  - Procedure/source: `npm test` from repository root.
  - Actual result: 18 test files passed; 90 tests passed. Output is preserved in `.loom/evidence/artifacts/20260525-flight-learn-delta-at-a-glance/full-tests.txt`.

- Observation: TypeScript typecheck passed.
  - Procedure/source: `npm run typecheck` from repository root.
  - Actual result: `tsc --noEmit` exited successfully. Output is preserved in `.loom/evidence/artifacts/20260525-flight-learn-delta-at-a-glance/typecheck.txt`.

- Observation: build passed.
  - Procedure/source: `npm run build` from repository root.
  - Actual result: clean build completed through `tsc -p tsconfig.build.json`. Output is preserved in `.loom/evidence/artifacts/20260525-flight-learn-delta-at-a-glance/build.txt`.

- Observation: render artifact shows the improved at-a-glance layout.
  - Procedure/source: `.loom/evidence/artifacts/20260525-flight-learn-delta-at-a-glance/render-at-a-glance.mjs` imported built `dist/flight-learn-inbox.js` and rendered a fixture similar to the operator screenshot at width 104.
  - Actual result: `.loom/evidence/artifacts/20260525-flight-learn-delta-at-a-glance/render-output.txt` shows stripped item labels, renamed `Pending deltas` / `Selected delta` panes, separated `At a glance`, `Why suggested`, and `Evidence preview` sections, a prominent active follow-up line, and compact route guide.

- Observation: targeted diff whitespace check produced no findings.
  - Procedure/source: `git diff --check -- src/flight-learn-inbox.ts src/flight-learn-inbox.test.ts src/pi-extension.test.ts .loom/specs/flight-learn-inbox-ux.md .loom/tickets/20260525-flight-learn-delta-at-a-glance.md .loom/evidence/20260525-flight-learn-delta-at-a-glance-validation.md`.
  - Actual result: command exited successfully with empty output. Output file `.loom/evidence/artifacts/20260525-flight-learn-delta-at-a-glance/diff-check.txt` is empty.

## Artifacts

- `.loom/evidence/artifacts/20260525-flight-learn-delta-at-a-glance/render-output.txt` - render-level visual artifact for the improved layout.
- `.loom/evidence/artifacts/20260525-flight-learn-delta-at-a-glance/render-at-a-glance.mjs` - fixture renderer.
- `.loom/evidence/artifacts/20260525-flight-learn-delta-at-a-glance/focused-tests.txt` - focused test output.
- `.loom/evidence/artifacts/20260525-flight-learn-delta-at-a-glance/full-tests.txt` - full test output.
- `.loom/evidence/artifacts/20260525-flight-learn-delta-at-a-glance/typecheck.txt` - typecheck output.
- `.loom/evidence/artifacts/20260525-flight-learn-delta-at-a-glance/build.txt` - build output.
- `.loom/evidence/artifacts/20260525-flight-learn-delta-at-a-glance/diff-check.txt` - empty successful diff check output.

Key render excerpt:

```text
Flight Learn - 3 pending deltas - selected 3/3
+ Pending deltas ----------------+ + Selected delta ---------------------------------------------------+
| 1/3 stale edit block · 2 refs | | Showing item 3 of 3 |
| 2/3 validation retry loop ... | | At a glance |
| > 3/3 exact-text edit misma... | | - Issue: exact-text edit mismatches |
+--------------------------------+ | - What happened: Observed 2 related failure occurrences in ref... |
 | - Why it matters: Repeated local friction across tools/cwds: e... |
 | - Expected: unknown — press e to add what should have happened |
 | - Signal: reflection-cluster 0.55; evidence refs: 2 |
 | |
 | Why suggested |
...
Active follow-up: [3] Loom ticket — Route to bounded implementation or cleanup work
Follow-up choices: 1 Code legibility 2 Test/check ▶ 3 Loom ticket ◀ 4 Flight Rule 5 Observe
How to choose: Rule=behavior reminder | Code=confusing source | Test=missing check | Ticket=larger wo...
```

## What This Shows

- `ticket:20260525-flight-learn-delta-at-a-glance#ACC-001` - supports - render tests/artifact show issue, what happened, why it matters, expected behavior, signal, and evidence count.
- `ticket:20260525-flight-learn-delta-at-a-glance#ACC-002` - supports - render tests/artifact show generic `Repeated failure pattern:` prefixes stripped from list/detail labels.
- `ticket:20260525-flight-learn-delta-at-a-glance#ACC-003` - supports - render tests/artifact show a prominent active follow-up line, visibly marked selected route card, and route guide.
- `ticket:20260525-flight-learn-delta-at-a-glance#ACC-004` - supports - focused tests, full tests, typecheck, build, and diff check passed; changes are presentation-only.

## What This Does Not Show

- This is not a fresh live Pi screenshot after the UI change.
- This does not prove the route choice is correct; it only makes the delta and route options easier to inspect.
- This does not introduce or validate automatic route classification.

## Related Records

- `ticket:20260525-flight-learn-delta-at-a-glance` - ticket under validation.
- `spec:flight-learn-inbox-ux` - UX contract updated with at-a-glance requirement.
