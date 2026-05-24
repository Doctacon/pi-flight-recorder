# CLI Demotion And Debug Tools

ID: ticket:20260523-cli-demotion-and-debug-tools
Type: Ticket
Status: closed
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

Closed. The seamless UX implementation review state is reconciled for this ticket's bounded slice. Implementation validation is recorded across `evidence:20260523-seamless-ux-validation`, `evidence:20260523-live-pi-tui-smoke`, `evidence:20260523-findings-fix-validation`, `evidence:20260523-installed-package-high-confidence-smoke`, and `evidence:20260523-high-confidence-visible-suggestion-tui`. `audit:20260523-seamless-ux-followup-review` cleared FIND-001 through FIND-005, and `audit:20260523-high-confidence-visible-suggestion-review` cleared the remaining visible high-confidence suggestion gap. `audit:20260523-final-review-state-reconciliation-review` found no material issue with closing stale seamless implementation tickets.

Residual limits remain routed to `ticket:20260523-real-corpus-evaluation-and-tuning` and `plan:20260523-seamless-failure-memory-ux`: hosted/real model-provider reflection and long-run corpus precision/noise tuning are not claimed here.

## Journal

- 2026-05-23: Created ticket to correct product-facing documentation after seamless extension behavior lands.
- 2026-05-23: Implemented seamless UX slice for this ticket and moved to review with validation evidence in `evidence:20260523-seamless-ux-validation`.
- 2026-05-23: Review run recorded `audit:20260523-seamless-ux-review` with verdict `changes-needed`; pending disposition: FIND-002.
- 2026-05-23: Dispositioned review finding(s) for this ticket with `evidence:20260523-live-pi-tui-smoke` and/or `evidence:20260523-findings-fix-validation`; follow-up audit `audit:20260523-seamless-ux-followup-review` returned `clear` in the inspected scope; residual high-confidence notification/model-provider/long-run tuning gaps remain as follow-up where applicable.
- 2026-05-23: Final review-state reconciliation closed this stale `review` ticket with supporting evidence/audit links; residual provider/corpus limits remain outside this ticket.
