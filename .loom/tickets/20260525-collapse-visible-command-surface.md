# Collapse Visible Command Surface

ID: ticket:20260525-collapse-visible-command-surface
Type: Ticket
Status: closed
Created: 2026-05-25
Updated: 2026-05-25
Risk: medium - user-facing Pi command registration and compatibility change; underlying capabilities must remain reachable without leaving debug commands visible by default.
Priority: high - command palette clutter directly contradicts the streamlined `/flight-status` + `/flight-learn` operator model.

## Summary

Change the Pi extension's default top-level command registration so the command palette shows only the intended normal `pi-flight-recorder` commands: `/flight-status` and `/flight-learn`. Demote the existing debug/fallback/internal commands into subcommands/guided flows under those two commands, CLI/debug recovery paths, or explicit opt-in legacy aliases.

Closure claim: in normal default extension registration, the old debug/fallback slash command list is no longer registered, while the capabilities they represented remain available through the simplified surface or documented debug paths. Real interactive Pi command-palette proof remains a stated residual limit.

## Related Records

- `spec:visible-command-surface` - authoritative behavior contract for the default two-command visible surface and legacy demotion map.
- `spec:seamless-failure-memory-ux` - owns failure memory/reflection/status behavior that must remain reachable.
- `spec:delta-artifact-learning-loop` - owns `/flight-learn` learning-loop behavior and human-gated artifact/outcome constraints.
- `ticket:20260525-streamlined-learning-inbox-command` - introduced `/flight-learn` but left legacy top-level commands visible.
- `constitution:main` - local-first, evidence-backed, human-gated promotion principles.

## Scope

In scope:

- Update `src/pi-extension.ts` default command registration so only `/flight-status` and `/flight-learn` are registered as top-level `flight-*` slash commands in normal mode.
- Move or route former top-level command behavior through the two visible commands:
  - `/flight-sync`, `/flight-mode`, `/flight-watch` -> `/flight-status` subcommands or CLI/debug recovery.
  - `/seen-this-before` -> `/flight-learn` prior-failure lookup path or LLM-callable tool/natural-language path.
  - `/flight-feedback`, `/flight-reflect`, `/flight-review`, `/flight-delta-review`, `/flight-deltas`, `/flight-rules` -> `/flight-learn` guided/subcommand paths, with status/export inspection allowed under `/flight-status` where appropriate.
- Decide and implement whether legacy aliases are removed entirely from normal mode or gated behind an explicit developer/advanced opt-in.
- Update fallback/no-UI messages so they do not instruct users to run commands that are no longer registered by default.
- Update README/docs/tests to present `/flight-status` and `/flight-learn` as the normal visible Pi surface, while CLI/debug capabilities remain documented separately.

Out of scope:

- No change to storage schema, detector logic, classifier readiness, model/provider behavior, or artifact/rule/outcome semantics.
- No automatic artifact application, source/docs/Loom/rule/skill/prompt mutation, or classifier labels.
- No removal of CLI debug/recovery commands unless a separate ticket owns that.
- No changes to Pi itself or assumption that Pi has hidden command metadata.

Likely read scope:

- `src/pi-extension.ts`
- `src/pi-extension.test.ts`
- `src/pi-extension-command-utils.ts`
- `src/cli.ts`
- `README.md`
- `docs/first-run.md`
- `docs/live-monitoring.md`
- Pi extension API docs/types for `registerCommand`

Likely write scope:

- `src/pi-extension.ts`
- `src/pi-extension.test.ts`
- docs listed above
- possibly additional focused tests if command-router helpers move
- evidence/audit records for this ticket
- this ticket

Stop conditions:

- If preserving a capability would require a third default visible command, stop and return to shaping; the current invariant is exactly two visible commands.
- If hidden command registration appears supported by Pi in a newer API, verify it with source/types before relying on it.
- If legacy alias removal breaks important installed-package compatibility in a way the ticket cannot safely resolve, block and report the specific compatibility gap.
- Do not widen into recurrence-link UX, classifier work, or real TUI automation beyond evidence needed for this command surface change.

## Acceptance

- ACC-001: Default fake-Pi command registration tests assert the normal extension registers `/flight-status` and `/flight-learn` as the only visible `pi-flight-recorder` top-level slash commands; old `flight-*` debug/fallback commands and `/seen-this-before` are not registered by default.
  - Evidence: focused registration test.
  - Audit: challenge whether any remaining visible command violates `spec:visible-command-surface#REQ-001`.

- ACC-002: Former status/control/debug behaviors remain reachable through `/flight-status` subcommands/guidance or documented CLI/debug paths.
  - Evidence: focused command-handler tests or docs inspection for sync/mode/watch/rules status/export routes.
  - Audit: challenge accidental capability loss.

- ACC-003: Former learning/review/query behaviors remain reachable through `/flight-learn` guided/subcommand paths or the LLM-callable local tool/natural-language path.
  - Evidence: focused tests or docs inspection for prior-failure lookup, reflection/delta review, artifact outcome follow-up, feedback/rule handoff routes.
  - Audit: challenge whether `/flight-learn` became an incoherent kitchen sink or still behaves like a guided inbox.

- ACC-004: Fallback and no-UI messages no longer point normal users at unregistered legacy slash commands.
  - Evidence: focused tests or string scan snapshots.
  - Audit: challenge stale instructions.

- ACC-005: Docs present the two-command normal model and demote CLI/advanced behavior to debug/recovery wording.
  - Evidence: docs diff/inspection.
  - Audit: challenge docs/source mismatch.

- ACC-006: Existing behavior tests continue to pass after command-surface changes, and validation includes at least typecheck plus focused Pi extension tests.
  - Evidence: `npm run typecheck`; focused `src/pi-extension.test.ts`; full `npm test` if feasible.
  - Audit: review test evidence limits, especially lack of real TUI proof unless separately gathered.

## Current State

Closed. Acceptance is satisfied within the ticket's source/fake-Pi/package evidence boundary.

Implemented:

- Default extension registration now exposes only `/flight-status` and `/flight-learn`.
- Legacy slash aliases are retained only behind explicit developer opt-in via `PI_FLIGHT_RECORDER_LEGACY_COMMANDS=1` or the `flight-recorder-legacy-commands` flag when available.
- Former status/control/debug behavior is reachable through `/flight-status` subcommands: `sync`, `mode`, `watch`, and `rules` inspection/control.
- Former learning/query/review behavior is reachable through `/flight-learn` subcommands: `seen`, `feedback`, `reflect`, `review`, `delta-review`, `deltas`, and `rules`.
- Fallback/no-UI guidance, reflection digest actions, artifact draft next steps, README, first-run docs, and live-monitoring docs now point normal users at `/flight-status` and `/flight-learn` paths.

Evidence: `evidence:20260525-collapse-visible-command-surface-validation` records focused Pi extension tests (23 tests), typecheck, full tests (81 tests), local smoke, build, package dry-run, and source/build scans.

Audit: `audit:20260525-collapse-visible-command-surface-review` verdict `clear` within audited scope.

Residual limits:

- no real interactive Pi TUI command-palette validation was captured for this ticket;
- no installed-package smoke was run after this specific command-surface change;
- the optional Pi flag path was fake-tested, while the documented practical legacy opt-in is the environment variable;
- `flight-status rules` dispatch technically reaches the full rules handler, so docs should continue framing normal activation/review under `/flight-learn rules`.

## Journal

- 2026-05-25: Created from operator report that typing `/flight` still shows many commands and from the clarified invariant that only `/flight-status` and `/flight-learn` should be visible by default.
- 2026-05-25: Set active for current-session bounded implementation slice.
- 2026-05-25: Implemented default two-command registration, explicit opt-in legacy aliases, `/flight-status` and `/flight-learn` subcommand routing, fallback text updates, source tests, local smoke updates, docs updates, and command-surface spec alignment.
- 2026-05-25: Validation passed: `npm test -- src/pi-extension.test.ts` (23 tests), `npm run typecheck`, full `npm test` (17 files / 81 tests), `npm run test:smoke:local`, `npm run build`, and `npm pack --dry-run`; recorded `evidence:20260525-collapse-visible-command-surface-validation`.
- 2026-05-25: Moved to review. Audit should challenge default visibility, capability reachability, stale legacy slash guidance, docs/source consistency, and evidence limits.
- 2026-05-25: Recorded `audit:20260525-collapse-visible-command-surface-review` with verdict `clear`; closed with residual real-TUI/install and legacy opt-in limits stated.
