# Seamless Install And Real Pi Smoke

ID: ticket:20260523-seamless-install-and-real-pi-smoke
Type: Ticket
Status: open
Created: 2026-05-23
Updated: 2026-05-23
Risk: medium - validates actual Pi package lifecycle instead of fake harness only
Priority: high - proves the user-facing no-CLI path
Depends On: ticket:20260523-extension-feedback-controls

## Summary

Validate and polish the actual install-first workflow: build/package, install the local Pi extension, start Pi, verify automatic capture/status, trigger a live failure, and record evidence. The closure claim is that a user can install the extension and get seamless local recording/suggestions without CLI setup during normal use.

## Related Records

- `spec:seamless-failure-memory-ux` - SCN-001 and SCN-002 require no-CLI install/session-start behavior.
- `docs/packages.md` from Pi documentation - local package install behavior.
- `plan:20260523-seamless-failure-memory-ux` - this is the first milestone validation gate.
- `evidence:20260522-live-monitoring-validation` - previous fake-Pi/CLI validation baseline.

## Scope

May change:

- Package manifest, README/docs, extension activation defaults, smoke script or checklist, evidence record.

Must not change:

- No reflection clustering/proposals.
- No OS daemon install.
- No model calls.

This ticket should use a real Pi run if possible. If a live Pi TUI smoke cannot be performed, the ticket must remain in `review` or `blocked` and say exactly why.

## Acceptance

- ACC-001: `pi install /Users/crlough/Code/personal/pi-flight-recorder` or documented equivalent loads the built extension successfully.
  - Evidence: Manual or command evidence.
  - Audit: Review package manifest/resource path correctness.

- ACC-002: Starting/resuming Pi after install auto-initializes flight recorder state and status without `npm run cli`.
  - Evidence: Live Pi TUI smoke evidence or explicit blocked note.
  - Audit: Review the test is not merely fake-Pi.

- ACC-003: A live failed Pi tool result is captured and either notifies with a high-confidence prior fix or records a quiet occurrence with status visible.
  - Evidence: Live smoke evidence with redacted excerpts.
  - Audit: Review no secrets/session raw dumps are stored in evidence.

- ACC-004: Docs explain the normal install-first path and demote CLI to debug/power-user usage.
  - Evidence: Docs inspection.
  - Audit: Review docs match actual defaults.

## Current State

Ready after extension feedback controls. Current validation is fake-Pi plus CLI; this ticket exists specifically to close that gap.

## Journal

- 2026-05-23: Created ticket to prove the seamless install UX in real Pi.
