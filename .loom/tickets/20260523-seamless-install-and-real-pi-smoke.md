# Seamless Install And Real Pi Smoke

ID: ticket:20260523-seamless-install-and-real-pi-smoke
Type: Ticket
Status: review
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

Implementation/package validation is partially complete and in review. Build, package dry-run, and `pi install . -l` project-local install succeeded. Interactive Pi TUI smoke for `/flight-status`, live notification rendering, and live no-CLI capture remains unverified in this harness. Evidence: `evidence:20260523-seamless-ux-validation` OBS-003, OBS-004.

Audit disposition: `audit:20260523-seamless-ux-review` returned `changes-needed`; FIND-002 addressed for `/flight-status`, live failed `tool_result` capture, and `/flight-reflect` in a real Pi TUI session. Evidence: `evidence:20260523-live-pi-tui-smoke`. Follow-up audit `audit:20260523-seamless-ux-followup-review` returned `clear` for FIND-001 through FIND-005 in the inspected scope; remaining residual gaps are tracked as non-blocking follow-up/tuning unless this ticket explicitly covers high-confidence notification smoke or long-run corpus evaluation.

## Journal

- 2026-05-23: Created ticket to prove the seamless install UX in real Pi.
- 2026-05-23: Implemented seamless UX slice for this ticket and moved to review with validation evidence in `evidence:20260523-seamless-ux-validation`.
- 2026-05-23: Review run recorded `audit:20260523-seamless-ux-review` with verdict `changes-needed`; pending disposition: FIND-002.
- 2026-05-23: Dispositioned review finding(s) for this ticket with `evidence:20260523-live-pi-tui-smoke` and/or `evidence:20260523-findings-fix-validation`; follow-up audit `audit:20260523-seamless-ux-followup-review` returned `clear` in the inspected scope; residual high-confidence notification/model-provider/long-run tuning gaps remain as follow-up where applicable.
