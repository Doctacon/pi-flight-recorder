# High Confidence Suggestion UX

ID: ticket:20260523-high-confidence-suggestion-ux
Type: Ticket
Status: review
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

Implementation is complete and in review. Live suggestions now require prior resolved evidence, confidence/specificity gates, cooldown/window controls, and active snooze/silence checks; broad and unresolved matches are buffered quietly. Live Pi TUI rendering remains unverified outside fake-Pi tests and is tracked by `ticket:20260523-seamless-install-and-real-pi-smoke`. Evidence: `evidence:20260523-seamless-ux-validation` OBS-001, OBS-002.

Audit disposition: `audit:20260523-seamless-ux-review` returned `changes-needed`; FIND-002 partly addressed by live Pi TUI smoke showing live capture/suppression status; high-confidence resolved suggestion notification remains not exercised in real TUI. Evidence: `evidence:20260523-live-pi-tui-smoke`. Follow-up audit `audit:20260523-seamless-ux-followup-review` returned `clear` for FIND-001 through FIND-005 in the inspected scope; remaining residual gaps are tracked as non-blocking follow-up/tuning unless this ticket explicitly covers high-confidence notification smoke or long-run corpus evaluation.

## Journal

- 2026-05-23: Created ticket to convert the current suggestion engine into a trust-preserving live UX.
- 2026-05-23: Implemented seamless UX slice for this ticket and moved to review with validation evidence in `evidence:20260523-seamless-ux-validation`.
- 2026-05-23: Review run recorded `audit:20260523-seamless-ux-review` with verdict `changes-needed`; pending disposition: FIND-002.
- 2026-05-23: Dispositioned review finding(s) for this ticket with `evidence:20260523-live-pi-tui-smoke` and/or `evidence:20260523-findings-fix-validation`; follow-up audit `audit:20260523-seamless-ux-followup-review` returned `clear` in the inspected scope; residual high-confidence notification/model-provider/long-run tuning gaps remain as follow-up where applicable.
