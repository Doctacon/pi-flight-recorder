# Interactive Review UI Primitives

ID: ticket:20260523-interactive-review-ui-primitives
Type: Ticket
Status: closed
Created: 2026-05-23
Updated: 2026-05-23
Risk: medium - UX helper design will shape all guided review flows
Priority: high - unlocks interactive proposal/rule review without copy/paste commands

## Summary

Create a small testable internal abstraction for Pi-native guided review interactions: choose an item, choose an action, edit text, confirm decisions, and gracefully fall back when interactive UI is unavailable. The closure claim is that later Flight Recorder flows can use ask-user-question-style interactions without binding business logic directly to Pi dialog implementation details.

## Related Records

- `plan:20260523-reflection-rule-promotion-ux` - chooses Pi-native interactive UI as the primary promotion route.
- Pi `docs/extensions.md` - documents `ctx.ui.select`, `confirm`, `input`, and `editor`.
- Pi `docs/tui.md` - custom UI option if built-in dialogs are insufficient later.
- `src/pi-extension.ts` - likely integration surface for command handlers and Pi contexts.

- `audit:20260523-interactive-rule-promotion-review` - follow-up review of implementation; verdict `concerns` due missing real TUI evidence, no material automated-scope blockers.

## Scope

May change:

- New helper module such as `src/interactive-review.ts` or similar.
- Test doubles/fake UI helpers in relevant tests.
- Minimal types for review options/results.
- `src/pi-extension.test.ts` only enough to prove helper integration if needed.

Must not change:

- No rule candidate lifecycle beyond what the data-model ticket provides.
- No prompt injection.
- No dependency on `@juicesharp/rpiv-ask-user-question` unless separately researched/approved; use Pi-native UI first.
- No full custom TUI component unless built-in dialogs cannot meet acceptance.

Design constraints:

- Must be keyboard-friendly in the Pi TUI.
- Must be unit-testable without real TUI.
- Must return explicit cancel/timeout results rather than throwing for normal cancellation.
- Must keep command fallback viable for print/JSON/RPC or no-UI contexts.

## Acceptance

- ACC-001: A helper can present a bounded single-select question with labels/descriptions and return the selected action or cancellation.
  - Evidence: unit/fake-UI tests.

- ACC-002: A helper can request multi-line draft editing through Pi's editor/input surface and return edited text or cancellation.
  - Evidence: unit/fake-UI tests.

- ACC-003: No-UI/fallback behavior produces a friendly message or structured fallback result instead of failing silently.
  - Evidence: tests with missing `ctx.ui` methods.

- ACC-004: Helper API is documented enough in code/tests for later tickets to reuse without re-deciding UI mechanics.
  - Evidence: tests and exported types or module-level comments.

## Current State

Closed. The Flight Rule implementation review state is reconciled. Automated implementation evidence is recorded in `evidence:20260523-interactive-rule-promotion-validation`, and the original real-TUI blocker is resolved by `evidence:20260523-interactive-rule-promotion-real-tui-validation`. `audit:20260523-interactive-rule-promotion-real-tui-review` returned `clear` for the guided proposal selection, Make Rule draft/edit/scope approval, approved-rule injection, disable, and no-injection-after-disable flow. `audit:20260523-final-review-state-reconciliation-review` found no material issue with closing stale rule-promotion implementation tickets.

Residual limits remain outside this ticket: hosted/real model-provider behavior and long-run corpus tuning are not claimed.

## Journal

- 2026-05-23: Created ticket from `plan:20260523-reflection-rule-promotion-ux` to establish Pi-native ask-user-question-style primitives before implementing guided flows.
- 2026-05-23: Implemented this slice as part of `plan:20260523-reflection-rule-promotion-ux`; moved to review with evidence `evidence:20260523-interactive-rule-promotion-validation`.
- 2026-05-23: Follow-up audit `audit:20260523-interactive-rule-promotion-review` returned `concerns` with no material code blockers for this automated implementation scope.
- 2026-05-23: Final review-state reconciliation closed this stale `review` ticket with supporting evidence/audit links; residual provider/corpus limits remain outside this ticket.
