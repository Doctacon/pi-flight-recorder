# Flight Rules Management and Export

ID: ticket:20260523-flight-rules-management-export
Type: Ticket
Status: review
Created: 2026-05-23
Updated: 2026-05-23
Risk: medium - management/export controls affect reversibility and durable documentation boundaries
Priority: medium - needed for trust and portability after active rules exist
Depends On: ticket:20260523-approved-flight-rule-injection

## Summary

Add management, fallback command, and explicit export/materialization controls for Flight Rules. The closure claim is that users can inspect, disable, reject, and optionally export approved rules without relying solely on interactive flows and without any surprise writes to project/global docs.

## Related Records

- `plan:20260523-reflection-rule-promotion-ux` - defines commands as fallback/control-plane and export as explicit only.
- `ticket:20260523-approved-flight-rule-injection` - introduces active injected rules that must be inspectable/reversible.
- `spec:seamless-failure-memory-ux` - requires user controls, status, local-first privacy, and no autonomous file mutation.
- `README.md`, `docs/first-run.md`, `docs/live-monitoring.md` - likely docs scope.
- `src/pi-extension.ts`, `src/cli.ts`, `src/storage.ts` - likely implementation scope.

- `audit:20260523-interactive-rule-promotion-review` - follow-up review of implementation; verdict `concerns` due missing real TUI evidence, no material automated-scope blockers.

## Scope

May change:

- `/flight-rules pending|show|status|disable|reject|approve` fallback commands where not already covered.
- Optional debug CLI equivalents only if useful and small.
- Explicit export command such as `/flight-rules export --scope project|global [--output PATH]`.
- Docs describing interactive flow, fallback commands, rule states, and export behavior.
- Tests for command validation and no-surprise export.

Must not change:

- No automatic writes to `CLAUDE.md`, `AGENTS.md`, prompt templates, or repo docs.
- No hosted sync.
- No new rule injection semantics beyond the injection ticket.
- No automatic conversion of all candidates to docs.

Export constraints:

- Default export should print/copy-ready text or require explicit output path.
- Export content must be redacted and include evidence summary, not raw session dumps.
- Export should distinguish Flight Recorder local active rules from materialized project/global documentation.

## Acceptance

- ACC-001: Users can list pending candidates and active/disabled rules with concise redacted output.
  - Evidence: fake-Pi command tests.

- ACC-002: Users can show, disable, reject, and approve by ID with friendly validation errors for missing/invalid IDs.
  - Evidence: command tests.

- ACC-003: Disabled rules stop appearing in injection status/output.
  - Evidence: integration with storage/injection tests or fake-Pi status test.

- ACC-004: Export requires explicit user action/target and never silently writes repository docs.
  - Evidence: tests proving no file write without explicit output and docs review.

- ACC-005: Docs explain interactive primary UX, fallback commands, rule states, scope, privacy limits, and export behavior.
  - Evidence: docs diff and validation checklist.

## Current State

Implementation is complete and in review. Automated validation evidence is recorded in `evidence:20260523-interactive-rule-promotion-validation`: `npm run typecheck`, `npm test` (13 files, 62 tests), `npm run build`, and `npm pack --dry-run` passed. Follow-up audit `audit:20260523-interactive-rule-promotion-review` returned `concerns` with no material code blockers in the automated scope; real TUI validation remains plan-level blocked follow-up.

## Journal

- 2026-05-23: Created ticket from `plan:20260523-reflection-rule-promotion-ux` to preserve reversibility and command fallback after interactive rule approval/injection.
- 2026-05-23: Implemented this slice as part of `plan:20260523-reflection-rule-promotion-ux`; moved to review with evidence `evidence:20260523-interactive-rule-promotion-validation`.
- 2026-05-23: Follow-up audit `audit:20260523-interactive-rule-promotion-review` returned `concerns` with no material code blockers for this automated implementation scope.
