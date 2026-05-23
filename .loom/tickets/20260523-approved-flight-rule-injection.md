# Approved Flight Rule Injection

ID: ticket:20260523-approved-flight-rule-injection
Type: Ticket
Status: review
Created: 2026-05-23
Updated: 2026-05-23
Risk: high - approved rules alter future agent context and can create prompt noise or unintended behavior if not bounded
Priority: high - turns approved rules into useful durable guidance
Depends On: ticket:20260523-guided-rule-draft-approval-flow

## Summary

Inject approved relevant Flight Rules into future Pi turns through a bounded, visible context block. The closure claim is that explicitly approved global/project rules can influence future agent behavior while draft/rejected/disabled rules never inject, prompt size remains bounded, and `/flight-status` or rule status makes active rules visible.

## Related Records

- `plan:20260523-reflection-rule-promotion-ux` - owns the rule activation/injection strategy.
- `ticket:20260523-guided-rule-draft-approval-flow` - creates approved scoped rules.
- Pi `docs/extensions.md` - documents `before_agent_start` system prompt/message injection surfaces.
- `spec:seamless-failure-memory-ux` - no autonomous fixes, local-first, visible controls.
- `src/pi-extension.ts`, `src/storage.ts` - likely affected source.

- `audit:20260523-interactive-rule-promotion-review` - follow-up review of implementation; verdict `concerns` due missing real TUI evidence, no material automated-scope blockers.

## Scope

May change:

- `src/pi-extension.ts` `before_agent_start` handler or equivalent injection point.
- Storage query APIs for active rules by cwd/scope.
- Status output to show active/injected rule count or IDs.
- Tests for injection, bounds, scope, disable, and redaction.
- Docs explaining active Flight Rules.

Must not change:

- No automatic approval.
- No autonomous code edits.
- No raw evidence/session snippets in injected prompt text.
- No file materialization/export.

Injection constraints:

- Default cap: small bounded number of rules, e.g. 3-5.
- Inject only concise rule text and ID/scope, not evidence blobs.
- Project rules apply only when cwd is under the stored project root.
- Global rules apply across codebases.
- Disabled/rejected/draft candidates never inject.

## Acceptance

- ACC-001: Approved global rules inject into `before_agent_start` context in a bounded block with rule IDs and concise text.
  - Evidence: fake-Pi event/system-prompt test.

- ACC-002: Approved project rules inject only for matching cwd/project root; non-matching cwd excludes them.
  - Evidence: scope-filter tests.

- ACC-003: Draft, rejected, disabled, or unapproved candidates are not injected.
  - Evidence: state matrix test.

- ACC-004: Injected text is redacted/bounded and contains no raw evidence refs, raw `/Users/alice` paths, or obvious secrets.
  - Evidence: redaction/prompt-bound test.

- ACC-005: `/flight-status` or `/flight-rules status` shows enough active/injected-rule state to troubleshoot behavior.
  - Evidence: fake-Pi status snapshot test.

## Current State

Implementation is complete and in review. Automated validation evidence is recorded in `evidence:20260523-interactive-rule-promotion-validation`: `npm run typecheck`, `npm test` (13 files, 62 tests), `npm run build`, and `npm pack --dry-run` passed. Follow-up audit `audit:20260523-interactive-rule-promotion-review` returned `concerns` with no material code blockers in the automated scope; real TUI validation remains plan-level blocked follow-up.

## Journal

- 2026-05-23: Created ticket from `plan:20260523-reflection-rule-promotion-ux` for the point where approved rules begin affecting future Pi behavior.
- 2026-05-23: Implemented this slice as part of `plan:20260523-reflection-rule-promotion-ux`; moved to review with evidence `evidence:20260523-interactive-rule-promotion-validation`.
- 2026-05-23: Follow-up audit `audit:20260523-interactive-rule-promotion-review` returned `concerns` with no material code blockers for this automated implementation scope.
