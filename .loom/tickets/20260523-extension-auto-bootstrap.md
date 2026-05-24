# Extension Auto Bootstrap

ID: ticket:20260523-extension-auto-bootstrap
Type: Ticket
Status: closed
Created: 2026-05-23
Updated: 2026-05-23
Risk: medium - changes default extension lifecycle and background behavior inside Pi
Priority: high - this removes the normal need to run CLI commands

## Summary

Make the Pi extension initialize itself on session start and quietly begin local failure capture/index maintenance with status and disable controls. The closure claim is that after package install, normal Pi use no longer requires `npm run cli` to start recording/indexing failures.

## Related Records

- `spec:seamless-failure-memory-ux` - defines install-first UX, bootstrap, status, and privacy requirements.
- `spec:live-failure-monitoring` - existing watch/status behavior this ticket builds on.
- `plan:20260523-seamless-failure-memory-ux` - coordinates this ticket with live suggestions and reflection.
- `ticket:20260522-pi-live-failure-hook` - current extension hook foundation in review.

## Scope

May change:

- `src/pi-extension.ts`, extension state/config helpers, Pi extension tests, and docs/status text.
- Optional local settings file under the data dir for extension mode/privacy defaults.

Must not change:

- No reflection clustering yet.
- No model calls.
- No OS daemon installation.
- No autonomous code changes.

Bootstrap should treat package installation/enabling as the user opt-in. Defaults should be quiet: automatic local capture/index maintenance enabled, immediate suggestions gated or off according to the spec, and easy disable/pause from inside Pi.

## Acceptance

- ACC-001: On fake-Pi `session_start`, the extension initializes data dir/config and starts quiet local capture or watch/index maintenance without a CLI command.
  - Evidence: Fake-Pi lifecycle test.
  - Audit: Review bootstrap is non-blocking and handles missing session file/source dirs.

- ACC-002: Extension exposes status showing mode, data dir, capture/index state, last sync/failure, and degraded/disabled errors.
  - Evidence: Command test for `/flight-status` or existing status command.
  - Audit: Review status is actionable and does not imply more coverage than implemented.

- ACC-003: Extension exposes pause/disable/resume controls that persist across session reloads.
  - Evidence: Test using temp config/data dir across two extension instances.
  - Audit: Review defaults are local-first and reversible.

- ACC-004: Bootstrap failures do not interrupt the active Pi session; they are visible through status/notification only.
  - Evidence: Test simulated data-dir/source failure path.
  - Audit: Review no uncaught async errors escape startup.

## Current State

Closed. The seamless UX implementation review state is reconciled for this ticket's bounded slice. Implementation validation is recorded across `evidence:20260523-seamless-ux-validation`, `evidence:20260523-live-pi-tui-smoke`, `evidence:20260523-findings-fix-validation`, `evidence:20260523-installed-package-high-confidence-smoke`, and `evidence:20260523-high-confidence-visible-suggestion-tui`. `audit:20260523-seamless-ux-followup-review` cleared FIND-001 through FIND-005, and `audit:20260523-high-confidence-visible-suggestion-review` cleared the remaining visible high-confidence suggestion gap. `audit:20260523-final-review-state-reconciliation-review` found no material issue with closing stale seamless implementation tickets.

Residual limits remain routed to `ticket:20260523-real-corpus-evaluation-and-tuning` and `plan:20260523-seamless-failure-memory-ux`: hosted/real model-provider reflection and long-run corpus precision/noise tuning are not claimed here.

## Journal

- 2026-05-23: Created ticket for the first seamless-UX slice after operator clarified CLI should not be normal UX.
- 2026-05-23: Implemented seamless UX slice for this ticket and moved to review with validation evidence in `evidence:20260523-seamless-ux-validation`.
- 2026-05-23: Review run recorded `audit:20260523-seamless-ux-review` with verdict `changes-needed`; pending disposition: FIND-002, FIND-004.
- 2026-05-23: Dispositioned review finding(s) for this ticket with `evidence:20260523-live-pi-tui-smoke` and/or `evidence:20260523-findings-fix-validation`; follow-up audit `audit:20260523-seamless-ux-followup-review` returned `clear` in the inspected scope; residual high-confidence notification/model-provider/long-run tuning gaps remain as follow-up where applicable.
- 2026-05-23: Fixed multi-session autostart lock contention by treating duplicate watcher ownership as shared indexing instead of degraded startup; evidence in `evidence:20260523-shared-watcher-validation`.
- 2026-05-23: Final review-state reconciliation closed this stale `review` ticket with supporting evidence/audit links; residual provider/corpus limits remain outside this ticket.
