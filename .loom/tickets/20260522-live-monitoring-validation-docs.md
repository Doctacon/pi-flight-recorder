# Live Monitoring Validation And Docs

ID: ticket:20260522-live-monitoring-validation-docs
Type: Ticket
Status: closed
Created: 2026-05-22
Updated: 2026-05-23
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

Closed. The live-monitoring implementation review state is reconciled. `evidence:20260522-live-monitoring-validation` supports incremental sync, watcher service, live suggestion decisions, CLI controls, Pi live hook behavior, and validation docs through tests plus CLI watcher smoke. Later real Pi evidence (`evidence:20260523-live-pi-tui-smoke`, `evidence:20260523-installed-package-high-confidence-smoke`, and `evidence:20260523-high-confidence-visible-suggestion-tui`) covers the no-CLI real TUI path, failed `tool_result` capture, reflection rendering, installed-package startup, and visible high-confidence prior-fix suggestion text. `audit:20260523-final-review-state-reconciliation-review` found no material issue with closing stale live-monitoring review tickets.

Residual limits remain outside this ticket: `user_bash` result capture is intentionally deferred because Pi exposes it before execution, real hosted/model-provider reflection is unproven, and long-run corpus precision/noise tuning remains separate.

## Evidence

- `evidence:20260522-live-monitoring-validation` - validation dossier for live monitoring.
- `README.md`, `docs/first-run.md`, `docs/live-monitoring.md` - explain enabling/disabling live monitoring, quiet vs suggest modes, status, privacy, troubleshooting limits, and Pi hook limits.

## Journal

- 2026-05-22: Created ticket with Status `open`. Scope is final validation and documentation for live behavior.
- 2026-05-22: Added validation docs/evidence and moved ticket to `review`.
- 2026-05-23: Final review-state reconciliation closed this stale `review` ticket with supporting evidence/audit links; residual provider/corpus limits remain outside this ticket.
