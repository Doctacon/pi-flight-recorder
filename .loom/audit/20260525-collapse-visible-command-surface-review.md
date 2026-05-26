# Collapse Visible Command Surface Review

ID: audit:20260525-collapse-visible-command-surface-review
Type: Audit
Status: recorded
Created: 2026-05-25
Updated: 2026-05-25
Audited: 2026-05-25
Target: ticket:20260525-collapse-visible-command-surface

## Summary

Bounded Ralph-style adversarial review inspected the ticket, command-surface spec, implementation diff, docs/spec updates, focused tests, and validation evidence for the visible command collapse. Verdict: `clear` within audited scope; the default command palette contract is implemented and tested, with legacy aliases gated behind explicit opt-in and normal guidance routed through `/flight-status` and `/flight-learn`.

## Target

- `ticket:20260525-collapse-visible-command-surface`
- Intended behavior: `spec:visible-command-surface`
- Code diff involving:
  - `src/pi-extension.ts`
  - `src/pi-extension-types.ts`
  - `src/pi-extension.test.ts`
  - `src/local-smoke.test.ts`
  - `src/reflection.ts`
  - `src/reflection.test.ts`
  - `src/artifact-drafts.ts`
  - `src/artifact-drafts.test.ts`
  - `src/cli.ts`
- Docs/spec diff involving:
  - `README.md`
  - `docs/first-run.md`
  - `docs/live-monitoring.md`
  - `.loom/specs/seamless-failure-memory-ux.md`
  - `.loom/specs/delta-artifact-learning-loop.md`
- Evidence:
  - `evidence:20260525-collapse-visible-command-surface-validation`

## Audit Scope And Lenses

Lenses:

- default command visibility: does normal registration expose only `/flight-status` and `/flight-learn`?
- capability preservation: are former sync/mode/watch/query/reflection/delta/rule/feedback behaviors still reachable without top-level command clutter?
- stale guidance: do fallback/no-UI messages and docs point normal users to commands that still exist by default?
- human-gate/privacy safety: did the change introduce classifier/model/provider calls or automatic artifact/rule/source mutation?
- evidence fit: do tests and scans support the acceptance claims without overclaiming real TUI or install behavior?
- scope: did the implementation stay inside command registration/routing/docs/tests rather than widening into classifier/recurrence/product work?

Out of scope:

- real interactive Pi command-palette validation;
- global/user-scope package install validation;
- real hosted/model-provider reflection;
- long-run corpus precision/noise tuning;
- redesigning the delta recurrence-link UX;
- changing Pi's command API.

## Context And Evidence Reviewed

- Ralph review run: current-session bounded review from `ticket:20260525-collapse-visible-command-surface`, `spec:visible-command-surface`, the implementation diff, and `evidence:20260525-collapse-visible-command-surface-validation` - challenged acceptance, stale guidance, and evidence limits.
- `spec:visible-command-surface` - confirmed the expected default top-level command set is exactly `/flight-status` and `/flight-learn` and that legacy aliases may exist only behind explicit opt-in.
- `src/pi-extension.ts` - inspected registration order, legacy opt-in gate, `/flight-status` subcommand dispatch, `/flight-learn` subcommand dispatch, and updated fallback strings.
- `src/pi-extension-types.ts` - inspected optional flag/getFlag additions used only for explicit developer opt-in.
- `src/pi-extension.test.ts` - inspected tests for default registration, legacy opt-in registration, sync/query subcommands, watcher status routing, learning paths, fallback delta paths, outcome/recurrence paths, and rule paths.
- `src/local-smoke.test.ts` - inspected fake-Pi smoke migration from legacy commands to `/flight-status` and `/flight-learn` subcommands.
- `src/reflection.ts` and `src/artifact-drafts.ts` - inspected user-facing next-step text updates from legacy slash commands to `/flight-learn ...` routes.
- `README.md`, `docs/first-run.md`, `docs/live-monitoring.md` - inspected normal two-command docs and explicit legacy opt-in wording.
- `evidence:20260525-collapse-visible-command-surface-validation` - reviewed validation outputs: focused Pi extension tests, typecheck, full tests, local smoke, build, package dry-run, and source/build scans.

Reviewed validation excerpts:

```text
npm test -- src/pi-extension.test.ts
Test Files  1 passed (1)
Tests  23 passed (23)
```

```text
npm run typecheck
# tsc --noEmit completed with exit code 0
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
npm run build
# clean + tsconfig.build completed with exit code 0
```

```text
npm pack --dry-run
# total files: 83
```

## Findings

None - no material findings within audited scope.

## Verdict

`clear` within audited scope.

Acceptance review:

- ACC-001: satisfied. Default fake-Pi registration asserts the command map is exactly `flight-learn` and `flight-status`; legacy aliases are asserted absent by default. Built output also shows legacy aliases registered only inside `legacyCommandAliasesEnabled(pi)`.
- ACC-002: satisfied. Former status/control/debug behavior is reachable through `/flight-status sync`, `/flight-status mode`, and `/flight-status watch`; focused tests include watcher-status routing, and local smoke uses mode/sync through `/flight-status`.
- ACC-003: satisfied. Former learning/review/query behavior is reachable through `/flight-learn seen`, `/flight-learn reflect`, `/flight-learn review`, `/flight-learn delta-review`, `/flight-learn deltas`, `/flight-learn feedback`, and `/flight-learn rules`; focused tests/local smoke exercise these paths.
- ACC-004: satisfied. Fallback/no-UI and generated action guidance now point to `/flight-learn ...` or `/flight-status ...`; the source/docs scan leaves only explicit legacy-history/opt-in mentions and non-slash CLI references.
- ACC-005: satisfied. README, first-run docs, and live-monitoring docs present the two-command normal model and demote legacy aliases to developer opt-in recovery/debug wording.
- ACC-006: satisfied by `evidence:20260525-collapse-visible-command-surface-validation`: typecheck, focused Pi extension tests, full tests, local smoke, build, package dry-run, and scans passed.

The implementation did not add classifier automation, default model/provider calls, or automatic source/docs/Loom/rule/skill/prompt mutation. Artifact/rule/outcome behavior remains human-gated.

## Required Follow-up

None before closing `ticket:20260525-collapse-visible-command-surface`.

Recommended later follow-up, not blocking this ticket:

- Capture real interactive Pi TUI command-palette evidence showing `/flight` discovery displays only the two normal commands after reinstall/restart.
- Run installed-package smoke after this change if making a stronger release/package claim.
- If users need legacy aliases in practice, validate the `PI_FLIGHT_RECORDER_LEGACY_COMMANDS=1` startup path in a disposable Pi session.

## Residual Risk

- Evidence is automated/fake-Pi/source-package based; it does not prove the real interactive command picker UI.
- `npm pack --dry-run` proves package composition but not real installed-package behavior after this change.
- The optional Pi flag opt-in path was tested through a fake `getFlag`; docs rely on the environment-variable opt-in, which is simpler and remains the practical recovery route.
- `flight-status rules` dispatch can technically reach the full rule handler, not only read-only status/export actions. This does not violate the two-command visibility goal, but future docs should keep normal rule activation framed under `/flight-learn rules` and human approval.
- Long-run corpus and provider/model behavior remain out of scope and unproven.

## Related Records

- `ticket:20260525-collapse-visible-command-surface`
- `evidence:20260525-collapse-visible-command-surface-validation`
- `spec:visible-command-surface`
- `spec:delta-artifact-learning-loop#REQ-012`
- `spec:seamless-failure-memory-ux`
