# Extension Auto Bootstrap

ID: ticket:20260523-extension-auto-bootstrap
Type: Ticket
Status: open
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

Ready to start. Current extension has manual `/flight-mode` and `/flight-watch`; it does not auto-start capture on install/session start.

## Journal

- 2026-05-23: Created ticket for the first seamless-UX slice after operator clarified CLI should not be normal UX.
