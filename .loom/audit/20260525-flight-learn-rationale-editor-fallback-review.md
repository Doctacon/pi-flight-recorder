# Flight Learn Rationale Editor Fallback Review

ID: audit:20260525-flight-learn-rationale-editor-fallback-review
Type: Audit
Status: recorded
Created: 2026-05-25
Updated: 2026-05-25
Audited: 2026-05-25
Target: ticket:20260525-flight-learn-rationale-editor-fallback

## Summary

A Ralph reviewer audited the change that removes normal inline custom rationale entry from the `/flight-learn` inbox and hands rationale text to Pi's existing editor helper after route selection. Verdict: `clear` within scope.

## Target

The target was `ticket:20260525-flight-learn-rationale-editor-fallback` and the source/test changes in:

- `src/flight-learn-inbox.ts`
- `src/pi-extension.ts`
- `src/flight-learn-inbox.test.ts`
- `src/pi-extension.test.ts`

## Audit Scope And Lenses

Scope:

- whether the normal route path avoids the stuck inline `Routing rationale` panel;
- whether `/flight-learn` asks for rationale through the existing editor helper after custom route selection;
- whether storage/no-auto-apply semantics are preserved;
- whether rationale cancellation leaves state unchanged;
- whether tests/evidence support the claim.

Lenses:

- acceptance and scope;
- implementation correctness;
- product/UX failure mode;
- semantic preservation and safety boundaries;
- evidence sufficiency and residual risk.

Out of scope:

- fresh live Pi replay after the fix;
- final custom free-form text editor design;
- artifact outcome follow-up custom UI.

## Context And Evidence Reviewed

- Ralph review run: reviewer subagent inspected the ticket, evidence, and current source/test changes; returned `clear`.
- `ticket:20260525-flight-learn-rationale-editor-fallback` - acceptance and scope.
- `evidence:20260525-flight-learn-rationale-editor-fallback-validation` - focused tests, full tests, typecheck, build, smoke, package dry-run, diff check, and screenshot artifact.
- `src/flight-learn-inbox.ts` - `startRationale()` now returns `route-selected` instead of entering inline rationale mode.
- `src/pi-extension.ts` - `maybeHandleDeltaInbox()` calls `askReviewEditor(ctx, "Routing rationale", ...)` after custom route selection.
- `src/pi-extension.test.ts` - integration tests for rationale submission, cancellation, no-auto-apply, and preserved evidence.
- `src/flight-learn-inbox.test.ts` - component tests for raw and CSI-u route selection returning `route-selected`.

## Findings

None - no material findings within audited scope.

Notes:

- The old `rationale` mode/render/input methods still exist as dead fallback code in `src/flight-learn-inbox.ts`, but no active normal path sets `mode = "rationale"`. The reviewer judged this harmless for this ticket, not a blocker.
- Evidence is code-level/fake-Pi validation, not a fresh live Pi replay.

## Verdict

`clear` - the normal custom route path now avoids the stuck inline rationale panel, asks for rationale through Pi's existing editor helper, preserves no-auto-apply semantics, and handles editor cancellation without storing a candidate.

## Required Follow-up

No additional code changes are required before closing this ticket.

If the operator can still reproduce after rebuild/reinstall/restart, capture a fresh live screenshot/log and open a narrower follow-up against the editor helper path.

## Residual Risk

- No fresh live Pi replay after this fallback change.
- The built-in editor helper is assumed to remain reliable because it is already used elsewhere, but this run did not manually replay it in live Pi.
- Dead rationale-mode code remains and can be removed in a later cleanup if desired.

## Related Records

- `ticket:20260525-flight-learn-rationale-editor-fallback` - consuming ticket.
- `evidence:20260525-flight-learn-rationale-editor-fallback-validation` - validation evidence.
- `ticket:20260525-flight-learn-custom-tui-inbox` - original custom inbox implementation.
- `ticket:20260525-flight-learn-custom-tui-keyboard-input` - prior input fix.
- `spec:flight-learn-inbox-ux` - intended custom inbox behavior.
