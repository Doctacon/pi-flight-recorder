# High Confidence Suggestion UX

ID: ticket:20260523-high-confidence-suggestion-ux
Type: Ticket
Status: closed
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

Review. Focused follow-up evidence is recorded in `evidence:20260523-installed-package-high-confidence-smoke`. A disposable real Pi TUI run seeded synthetic prior resolved evidence, triggered a harmless failed Pi bash tool call, and status/DB showed a high-confidence suggestion state: `kind=suggested`, confidence `0.82`, `emittedInWindow=1`, and `last=ep_70da13e85de121ce`.

This narrows but does not fully erase the previous real-TUI gap: pane snapshots and the TUI write log did not capture the formatted transient warning notification text (`Seen before`, `Prior fix`, `likely match`). Therefore ACC-004 is only partially supported for visible notification rendering. Keep this ticket in `review` unless a later audit accepts the narrower closure claim or a follow-up run captures the notification text.

Closed. High-confidence suggestions now render through a persistent Flight Recorder TUI widget in addition to the transient notification. Focused fake-Pi tests assert widget text, and `evidence:20260523-high-confidence-visible-suggestion-tui` captures the formatted suggestion in a disposable installed-package real Pi TUI after a failed Pi `bash` tool result.

Closure support:

- ACC-001: Same-cwd prior resolved suggestion behavior remains covered by `src/live-suggestions.test.ts` and `src/pi-extension.test.ts`; widget text is asserted in `src/pi-extension.test.ts`.
- ACC-002: Broad/low-confidence suppression remains covered by `src/live-suggestions.test.ts` and no source change widened matching thresholds.
- ACC-003: Cooldown/max-window/silence behavior remains covered by existing suggestion tests; widget rendering only happens after `decision.kind === "suggestion"`.
- ACC-004: Real TUI evidence `07-after-toolcall-01s-pane.txt` through `07-after-toolcall-15s-pane.txt` shows `⚠ Seen before: likely match (0.82)` and `Prior fix: Validation passed: npm test`; status/DB show `kind=suggested`, `emittedInWindow=1`, and confidence `0.82`.

Audit `audit:20260523-high-confidence-visible-suggestion-review` returned `clear` within audited scope. Residual limits remain for hosted/real provider behavior, global/user-scope package install, and long-run corpus tuning.

## Journal

- 2026-05-23: Created ticket to convert the current suggestion engine into a trust-preserving live UX.
- 2026-05-23: Implemented seamless UX slice for this ticket and moved to review with validation evidence in `evidence:20260523-seamless-ux-validation`.
- 2026-05-23: Review run recorded `audit:20260523-seamless-ux-review` with verdict `changes-needed`; pending disposition: FIND-002.
- 2026-05-23: Dispositioned review finding(s) for this ticket with `evidence:20260523-live-pi-tui-smoke` and/or `evidence:20260523-findings-fix-validation`; follow-up audit `audit:20260523-seamless-ux-followup-review` returned `clear` in the inspected scope; residual high-confidence notification/model-provider/long-run tuning gaps remain as follow-up where applicable.
- 2026-05-23: Set status back to `active` for focused real TUI high-confidence prior-resolved suggestion smoke.
- 2026-05-23: Recorded `evidence:20260523-installed-package-high-confidence-smoke`; moved to `review` with ACC-004 only partially supported because the suggestion state is evidenced but the transient formatted notification text was not captured.
- 2026-05-23: Consumed `audit:20260523-release-readiness-followup-review#FIND-001`; keeping ticket in `review` instead of closing over the visible-notification rendering gap.
- 2026-05-23: Set status to `active` to resolve visible notification rendering by adding a persistent high-confidence suggestion widget and re-validating in real TUI.
- 2026-05-23: Added `showLiveSuggestion()` widget path, updated fake-Pi tests, and recorded `evidence:20260523-high-confidence-visible-suggestion-tui` with real TUI visible suggestion text.
- 2026-05-23: Recorded `audit:20260523-high-confidence-visible-suggestion-review` with verdict `clear`; closed ticket.
