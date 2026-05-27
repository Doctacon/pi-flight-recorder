# Flight Learn Focused Card Render Harness Validation

ID: evidence:20260527-flight-learn-focused-card-render-harness-validation
Type: Evidence Dossier
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Observed: 2026-05-27

## Summary

This dossier records validation for `ticket:20260527-flight-learn-focused-card-render-harness`. The ticket's claim is limited to a deterministic focused-card render/prototype harness for pending delta review, not production `/flight-learn` integration or real Pi validation.

## Observations

- Observation: A focused-card render mode was added behind an explicit `layout: "focused-card"` component option.
  - Procedure/source: source inspection of `src/flight-learn-inbox.ts` after implementation.
  - Actual result: the existing default split-pane path remains the default; the focused-card path renders `Flight Learn — Issue N of M`, primary diagnosis sections, secondary `Why suggested` / `Evidence` sections, and vertical follow-up choices.
  - Scope note: the workspace was already carrying prior uncommitted split-pane/at-a-glance changes from `ticket:20260525-flight-learn-delta-at-a-glance` before this ticket began. This dossier supports only the explicit focused-card render harness path and should not be read as validation or ownership of those default split-pane output changes.

- Observation: focused component/extension tests passed.
  - Procedure/source: `npm test -- src/flight-learn-inbox.test.ts src/pi-extension.test.ts` from repository root.
  - Actual result: 2 test files passed; 33 tests passed. Output is preserved in `.loom/evidence/artifacts/20260527-flight-learn-focused-card-render-harness/focused-tests.txt`.

- Observation: full regression tests passed.
  - Procedure/source: `npm test` from repository root.
  - Actual result: 18 test files passed; 91 tests passed. Output is preserved in `.loom/evidence/artifacts/20260527-flight-learn-focused-card-render-harness/full-tests.txt`.

- Observation: TypeScript typecheck passed.
  - Procedure/source: `npm run typecheck` from repository root.
  - Actual result: `tsc --noEmit` exited successfully. Output is preserved in `.loom/evidence/artifacts/20260527-flight-learn-focused-card-render-harness/typecheck.txt`.

- Observation: build passed.
  - Procedure/source: `npm run build` from repository root.
  - Actual result: clean build completed through `tsc -p tsconfig.build.json`. Output is preserved in `.loom/evidence/artifacts/20260527-flight-learn-focused-card-render-harness/build.txt`.

- Observation: deterministic render artifact shows the focused-card layout.
  - Procedure/source: `.loom/evidence/artifacts/20260527-flight-learn-focused-card-render-harness/render-focused-card.mjs` imported built `dist/flight-learn-inbox.js`, selected issue 5 of 6, and rendered collapsed and expanded evidence states at width 100.
  - Actual result: `.loom/evidence/artifacts/20260527-flight-learn-focused-card-render-harness/render-output.txt` shows a single selected issue card with `Issue`, `What happened?`, `Why it matters`, `Expected`, `Why suggested`, `Evidence`, and vertical `Choose a follow-up` rows. The default collapsed state hides evidence refs and the expanded state shows concise refs.

- Observation: targeted diff whitespace check produced no findings.
  - Procedure/source: `git diff --check -- src/flight-learn-inbox.ts src/flight-learn-inbox.test.ts .loom/plans/20260527-flight-learn-focused-card-redesign.md .loom/tickets/20260527-flight-learn-focused-card-render-harness.md .loom/specs/flight-learn-inbox-ux.md`.
  - Actual result: command exited successfully with empty output. Output file `.loom/evidence/artifacts/20260527-flight-learn-focused-card-render-harness/diff-check.txt` is empty.

- Observation: Pi TUI primitives were evaluated but not imported in this harness slice.
  - Procedure/source: source/package inspection and Pi TUI docs inspection.
  - Actual result: this package does not currently declare `@earendil-works/pi-tui` as a dependency, and the ticket explicitly excludes package/dependency and production integration changes. The harness therefore uses the existing custom component contract and avoids the split-pane ASCII box layout in the focused-card path. The integration ticket can decide whether adding a direct Pi TUI dependency or adapting Pi primitives is worth the package-surface change.

## Artifacts

- `.loom/evidence/artifacts/20260527-flight-learn-focused-card-render-harness/render-focused-card.mjs` - deterministic render fixture.
- `.loom/evidence/artifacts/20260527-flight-learn-focused-card-render-harness/render-output.txt` - collapsed and expanded focused-card render output.
- `.loom/evidence/artifacts/20260527-flight-learn-focused-card-render-harness/focused-tests.txt` - focused test output.
- `.loom/evidence/artifacts/20260527-flight-learn-focused-card-render-harness/full-tests.txt` - full test output.
- `.loom/evidence/artifacts/20260527-flight-learn-focused-card-render-harness/typecheck.txt` - typecheck output.
- `.loom/evidence/artifacts/20260527-flight-learn-focused-card-render-harness/build.txt` - build output.
- `.loom/evidence/artifacts/20260527-flight-learn-focused-card-render-harness/diff-check.txt` - empty successful diff-check output.

Key render excerpt:

```text
Flight Learn — Issue 5 of 6
6 pending · 3 evidence refs · ↑/↓ changes issue

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

Why suggested
 reflection-cluster (0.55): Reflection cluster grouped cwd/setup validation failures from multiple
 sessions.

Evidence
 3 refs hidden by default — press v to view concise refs.

Choose a follow-up
▶ [1] Code legibility
 Use when confusing source or project shape causes repeated mistakes.
 [2] Test/check
 Use when a missing or weak validation check would have caught this.
```

## What This Shows

- `ticket:20260527-flight-learn-focused-card-render-harness#ACC-001` - supports - render artifact shows one selected issue card with issue count/progress and no dominant side-by-side `Pending deltas` / `Selected delta` table in the focused-card path.
- `ticket:20260527-flight-learn-focused-card-render-harness#ACC-002` - supports - render artifact and focused test show vertical route rows with active `▶ [1] Code legibility` / `▶ [2] Test/check` style markers and per-option purpose text.
- `ticket:20260527-flight-learn-focused-card-render-harness#ACC-003` - supports - focused render tests and artifact show collapsed evidence by default with `press v` affordance and expanded concise refs after toggling evidence.
- `ticket:20260527-flight-learn-focused-card-render-harness#ACC-004` - supports - focused tests, full tests, typecheck, build, and diff-check passed; source inspection shows the focused-card path is selected by explicit layout option rather than command/storage changes. Scope caveat: current git diff also contains prior uncommitted split-pane/default-output changes, so this evidence should be consumed with `audit:20260527-flight-learn-focused-card-render-harness-review#FIND-001` in mind.
- `ticket:20260527-flight-learn-focused-card-render-harness#ACC-005` - partially supports - Pi TUI primitives were inspected and not imported because this package lacks a direct dependency and the ticket excludes dependency/package integration; the limitation is recorded for the integration ticket.

## What This Does Not Show

- This does not show production `/flight-learn` uses the focused-card layout by default; that is owned by `ticket:20260527-flight-learn-focused-card-integration`.
- This does not validate or claim ownership of prior uncommitted default split-pane output changes from `ticket:20260525-flight-learn-delta-at-a-glance`.
- This does not show real interactive Pi TUI behavior, installed-package behavior, terminal theme fidelity, or command palette behavior.
- This does not prove the operator will judge the focused-card layout as good enough; it only provides deterministic render evidence for review.
- This does not validate artifact outcome follow-up UI.
- This does not add or prove direct use of Pi TUI built-in components.

## Related Records

- `ticket:20260527-flight-learn-focused-card-render-harness` - ticket under validation.
- `plan:20260527-flight-learn-focused-card-redesign` - parent plan.
- `spec:flight-learn-inbox-ux` - UX behavior contract.
- `evidence:20260527-flight-learn-split-pane-ux-feedback` - baseline split-pane feedback.
