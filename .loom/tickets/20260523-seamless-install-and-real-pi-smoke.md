# Seamless Install And Real Pi Smoke

ID: ticket:20260523-seamless-install-and-real-pi-smoke
Type: Ticket
Status: closed
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

Review. Focused follow-up smoke is recorded in `evidence:20260523-installed-package-high-confidence-smoke`. It used disposable `HOME`, `PI_CODING_AGENT_DIR`, `PI_CODING_AGENT_SESSION_DIR`, workspace, and data dir; installed the package with `pi install /Users/crlough/Code/personal/pi-flight-recorder -l`; started a real interactive Pi TUI from project settings without `--no-extensions`; loaded Flight Recorder as `pi-extension.js`; rendered `/flight-status`; triggered a harmless failed Pi bash tool call through a local no-network helper provider; recorded one live occurrence; and status/DB showed `kind=suggested`, `emittedInWindow=1`, and `last=ep_70da13e85de121ce`.

Acceptance support:

- ACC-001: supported by `01-pi-install-output.txt`, `03-project-settings.json`, and `05-startup-pane.txt`.
- ACC-002: supported by `06-status-before-pane.txt`.
- ACC-003: supported by `08-status-after-pane.txt` and `09-db-after.json`.
- ACC-004: docs were updated in README, `docs/first-run.md`, and `docs/live-monitoring.md` to reflect installed-package and real-TUI rule-promotion evidence while preserving high-confidence notification rendering, real-provider, and long-run corpus limits.

Audit `audit:20260523-release-readiness-followup-review` returned `concerns` only for the high-confidence visible-notification rendering claim, which is outside this ticket's narrow installed-package/no-CLI closure claim. This ticket is closed with a narrow claim: disposable project-local package install/startup, installed-extension `/flight-status`, real Pi bash tool-result capture, and suggested-state status/DB are evidenced; visible high-confidence notification text remains owned by `ticket:20260523-high-confidence-suggestion-ux` and is not claimed here.

## Journal

- 2026-05-23: Created ticket to prove the seamless install UX in real Pi.
- 2026-05-23: Implemented seamless UX slice for this ticket and moved to review with validation evidence in `evidence:20260523-seamless-ux-validation`.
- 2026-05-23: Review run recorded `audit:20260523-seamless-ux-review` with verdict `changes-needed`; pending disposition: FIND-002.
- 2026-05-23: Dispositioned review finding(s) for this ticket with `evidence:20260523-live-pi-tui-smoke` and/or `evidence:20260523-findings-fix-validation`; follow-up audit `audit:20260523-seamless-ux-followup-review` returned `clear` in the inspected scope; residual high-confidence notification/model-provider/long-run tuning gaps remain as follow-up where applicable.
- 2026-05-23: Set status back to `active` for focused disposable installed-package/high-confidence real TUI smoke requested as release-readiness follow-up.
- 2026-05-23: Recorded `evidence:20260523-installed-package-high-confidence-smoke`; moved to `review` pending audit/closure.
- 2026-05-23: Consumed `audit:20260523-release-readiness-followup-review`; closed ticket with narrow installed-package/no-CLI smoke claim and routed visible notification rendering gap to `ticket:20260523-high-confidence-suggestion-ux`.
