# High Confidence Suggestion UX

ID: ticket:20260523-high-confidence-suggestion-ux
Type: Ticket
Status: open
Created: 2026-05-23
Updated: 2026-05-23
Risk: medium - user trust depends on not spamming weak or generic suggestions
Priority: high - immediate suggestions are the visible value of live capture
Depends On: ticket:20260523-live-failure-ledger

## Summary

Tighten immediate live suggestions so Pi only interrupts for high-confidence, evidence-backed prior fixes and records all other failures quietly for reflection. The closure claim is that live suggestions feel useful rather than noisy.

## Related Records

- `spec:seamless-failure-memory-ux` - REQ-006, REQ-007, SCN-002, SCN-003, and quality bar.
- `spec:live-failure-monitoring` - current suggestion engine and cooldown controls.
- `plan:20260523-seamless-failure-memory-ux` - this ticket completes the immediate-suggestion milestone.
- `ticket:20260523-live-failure-ledger` - supplies occurrence and suppression persistence.

## Scope

May change:

- `src/live-suggestions.ts`, `src/pi-extension.ts`, suggestion formatting, thresholds/defaults, tests, and docs.

Must not change:

- No reflection digest generation.
- No model calls.
- No autonomous edits.

Default gates should likely require a prior resolved episode or exact-signature high-confidence match, same-cwd preference, no active silence/snooze, cooldown, and max-per-window budget. Low-confidence matches should update occurrence/suppression state but not notify.

## Acceptance

- ACC-001: Same-cwd prior resolved failures produce concise live suggestions with prior fix, evidence refs, confidence, and limits.
  - Evidence: Fake-Pi event test and suggestion-engine test.
  - Audit: Review text matches quality bar and cites inspectable evidence.

- ACC-002: Broad token matches such as generic `Cannot find module` do not notify by default when confidence is low or no prior resolution exists.
  - Evidence: Test corpus reproducing broad low-confidence matches and asserts quiet suppression.
  - Audit: Review suppression still records occurrence for reflection.

- ACC-003: Cooldown, max-window, silence/snooze state, and same-signature dedupe prevent repeated notifications.
  - Evidence: Unit/fake-Pi tests over repeated failures.
  - Audit: Review status exposes why suggestions were suppressed.

- ACC-004: Live notification UX is validated in a real Pi TUI smoke or explicitly remains in review with fake-Pi evidence only.
  - Evidence: Manual evidence record or explicit limitation.
  - Audit: Review no closure over untested TUI behavior.

## Current State

Ready after occurrence ledger. Current suggestion engine has threshold/cooldown, but defaults and UX still allow low-confidence CLI query noise and do not yet persist suppression into a reflection buffer.

## Journal

- 2026-05-23: Created ticket to convert the current suggestion engine into a trust-preserving live UX.
