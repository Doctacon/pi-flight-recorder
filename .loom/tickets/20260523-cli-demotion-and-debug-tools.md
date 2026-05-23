# CLI Demotion And Debug Tools

ID: ticket:20260523-cli-demotion-and-debug-tools
Type: Ticket
Status: open
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

Ready after no-CLI path is proven. Current docs still include CLI-first setup because that was the developer harness.

## Journal

- 2026-05-23: Created ticket to correct product-facing documentation after seamless extension behavior lands.
