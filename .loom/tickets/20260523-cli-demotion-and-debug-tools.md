# CLI Demotion And Debug Tools

ID: ticket:20260523-cli-demotion-and-debug-tools
Type: Ticket
Status: review
Created: 2026-05-23
Updated: 2026-05-23
Risk: low - primarily docs/help and debug affordance alignment
Priority: medium - prevents users from mistaking the debug harness for normal UX
Depends On: ticket:20260523-seamless-install-and-real-pi-smoke

## Summary

Reposition the CLI as a debug/recovery/power-user tool after extension autostart works, and add any debug commands needed to inspect seamless state without making CLI the normal path. The closure claim is that docs/help communicate “install extension and work normally,” while CLI remains useful for troubleshooting.

## Related Records

- `spec:seamless-failure-memory-ux` - REQ-001 and REQ-015 require no normal CLI activation and clear status.
- `plan:20260523-seamless-failure-memory-ux` - this supports the seamless install milestone.
- `ticket:20260523-seamless-install-and-real-pi-smoke` - proves the no-CLI path before docs are demoted.

## Scope

May change:

- README, first-run docs, CLI help text, debug/status commands, tests for help output.

Must not change:

- No core capture/suggestion/reflection behavior.
- No removal of existing CLI commands; they remain for debug/rebuild/manual use.

Docs should make clear that `npm run cli` is for development from the repo, while installed package usage should happen through Pi extension commands/status.

## Acceptance

- ACC-001: README/first-run docs lead with install-extension normal UX and put CLI under debug/manual sections.
  - Evidence: Docs inspection.
  - Audit: Review instructions do not imply users must run watcher CLI for normal use.

- ACC-002: CLI help labels sync/query/watch as debug/manual/recovery tools where appropriate.
  - Evidence: CLI help snapshot/unit test.
  - Audit: Review no command is removed unexpectedly.

- ACC-003: If seamless state needs inspection from shell, debug output is machine-readable and does not require starting behavior manually.
  - Evidence: CLI status/debug test.
  - Audit: Review status aligns with extension state files.

## Current State

Implementation is complete and in review. README/first-run/live-monitoring now lead with extension-first usage; CLI help labels the CLI as debug/manual/recovery; `status --json` exposes machine-readable state without starting behavior. Evidence: `evidence:20260523-seamless-ux-validation` OBS-001, OBS-002, OBS-003.

Audit disposition: `audit:20260523-seamless-ux-review` returned `changes-needed`; FIND-002 addressed enough for docs to continue presenting extension-first flow because live Pi TUI smoke now exists for status/capture/reflection. Evidence: `evidence:20260523-live-pi-tui-smoke`; high-confidence notification remains a residual untested scenario. Follow-up audit `audit:20260523-seamless-ux-followup-review` returned `clear` for FIND-001 through FIND-005 in the inspected scope; remaining residual gaps are tracked as non-blocking follow-up/tuning unless this ticket explicitly covers high-confidence notification smoke or long-run corpus evaluation.

## Journal

- 2026-05-23: Created ticket to correct product-facing documentation after seamless extension behavior lands.
- 2026-05-23: Implemented seamless UX slice for this ticket and moved to review with validation evidence in `evidence:20260523-seamless-ux-validation`.
- 2026-05-23: Review run recorded `audit:20260523-seamless-ux-review` with verdict `changes-needed`; pending disposition: FIND-002.
- 2026-05-23: Dispositioned review finding(s) for this ticket with `evidence:20260523-live-pi-tui-smoke` and/or `evidence:20260523-findings-fix-validation`; follow-up audit `audit:20260523-seamless-ux-followup-review` returned `clear` in the inspected scope; residual high-confidence notification/model-provider/long-run tuning gaps remain as follow-up where applicable.
