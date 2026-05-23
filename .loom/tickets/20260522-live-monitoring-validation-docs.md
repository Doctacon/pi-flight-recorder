# Live Monitoring Validation And Docs

ID: ticket:20260522-live-monitoring-validation-docs
Type: Ticket
Status: review
Created: 2026-05-22
Updated: 2026-05-22
Risk: low - validation/docs should summarize implemented behavior without changing semantics
Priority: medium - needed before treating live monitoring as trustworthy
Depends On: ticket:20260522-watch-cli-controls, ticket:20260522-pi-live-failure-hook

## Summary

Create final validation evidence and documentation for live failure monitoring. The closure claim is that a future user/agent can enable live tracking, understand quiet vs suggest modes, test a fixture failure, inspect status, and understand known limits without relying on chat history.

## Related Records

- `spec:live-failure-monitoring` - evidence plan and intended behavior.
- `plan:20260522-live-failure-monitoring` - final milestone for live monitoring.
- Prior live-monitoring child tickets - implementation whose combined behavior this ticket validates.

## Scope

May change:

- README, `docs/first-run.md`, new live monitoring docs, fixture smoke scripts if useful, and `.loom/evidence/` records for validation output.

Must not change:

- No new watcher/suggestion/Pi behavior except tiny fixes revealed by validation.
- No OS daemon install.
- No autonomous fixing.

Validation should include at least one temp-directory watcher flow and one fake-Pi or live-Pi hook flow. If live Pi TUI verification is not performed, the docs/evidence must say so explicitly.

## Acceptance

- ACC-001: End-to-end watcher smoke path shows a new appended failure is indexed automatically.
  - Evidence: Command output or test log captured in evidence record.
  - Audit: Review it supports `spec:live-failure-monitoring#SCN-001`.

- ACC-002: Suggestion-engine smoke path shows a prior fix suggestion and a cooldown/suppression case.
  - Evidence: Test output or fixture run captured in evidence record.
  - Audit: Review it supports `SCN-002` and `SCN-003` without overclaiming real-corpus precision.

- ACC-003: Pi hook validation is captured, either through live Pi manual check or fake-Pi tests explicitly labeled as such.
  - Evidence: Evidence record cites command/test/manual output and limits.
  - Audit: Review docs do not imply live TUI verification if only fake-Pi tests ran.

- ACC-004: Docs explain how to enable/disable live monitoring, choose quiet vs suggest mode, inspect status, understand privacy/redaction, and troubleshoot watcher errors.
  - Evidence: Docs inspection.
  - Audit: Review docs keep live mode opt-in and do not promise autonomous fixes.

## Current State

Implementation appears complete and is in review. Added `docs/live-monitoring.md`, updated README and first-run docs, and recorded `evidence:20260522-live-monitoring-validation` with typecheck/test/build/pack, CLI watch status/stop, foreground watcher smoke, suggestion tests, and fake-Pi validation. No live Pi TUI smoke or separate Ralph audit has been run yet.

## Evidence

- `evidence:20260522-live-monitoring-validation` - validation dossier for live monitoring.
- `README.md`, `docs/first-run.md`, `docs/live-monitoring.md` - explain enabling/disabling live monitoring, quiet vs suggest modes, status, privacy, troubleshooting limits, and Pi hook limits.

## Journal

- 2026-05-22: Created ticket with Status `open`. Scope is final validation and documentation for live behavior.
- 2026-05-22: Added validation docs/evidence and moved ticket to `review`.
