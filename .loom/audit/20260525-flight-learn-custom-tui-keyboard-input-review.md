# Flight Learn Custom TUI Keyboard Input Review

ID: audit:20260525-flight-learn-custom-tui-keyboard-input-review
Type: Audit
Status: recorded
Created: 2026-05-25
Updated: 2026-05-25
Audited: 2026-05-25
Target: ticket:20260525-flight-learn-custom-tui-keyboard-input

## Summary

A Ralph reviewer audited the custom `/flight-learn` keyboard input fix after a user reported the routing-rationale panel appeared unresponsive. Verdict: `clear` within scope; the fix plausibly addresses representative Kitty/CSI-u terminal input while preserving legacy/raw key behavior.

## Target

The target was `ticket:20260525-flight-learn-custom-tui-keyboard-input` and the source/test changes in:

- `src/flight-learn-inbox.ts`
- `src/flight-learn-inbox.test.ts`

## Audit Scope And Lenses

Scope:

- whether the reported stuck state is plausibly fixed for real Pi/terminal keyboard input;
- whether Kitty/CSI-u printable and shortcut keys are handled in edit/rationale/review flows;
- whether legacy raw input behavior remains intact;
- whether command surface, storage semantics, model/provider behavior, and no-auto-apply boundaries remain unchanged;
- whether evidence limits are honest.

Out of scope:

- a fresh live Pi interactive replay after the fix;
- visual layout redesign;
- artifact outcome follow-up;
- classifier/model/provider behavior.

## Context And Evidence Reviewed

- Ralph review run: reviewer subagent inspected ticket, evidence, and current source/test changes; returned `clear`.
- `ticket:20260525-flight-learn-custom-tui-keyboard-input` - acceptance and scope.
- `evidence:20260525-flight-learn-custom-tui-keyboard-input-validation` - screenshot observation, focused tests, full tests, typecheck, build, local smoke, and diff check.
- `src/flight-learn-inbox.ts` - CSI-u parsing, printable decoding, modifier handling, and unchanged persistence boundary.
- `src/flight-learn-inbox.test.ts` - regression tests for Kitty/CSI-u shortcut and printable input plus existing raw input tests.

## Findings

None - no material findings within audited scope.

## Verdict

`clear` - the bug is plausibly fixed for representative Kitty/CSI-u input. The audit observed that the component now parses CSI-u sequences, maps functional keys/modifiers, decodes printable CSI-u text, and tests the route-completion flow using CSI-u input. Legacy/raw input tests still pass, and no command/storage/model/auto-apply behavior changed in the inspected diff.

## Required Follow-up

No additional code changes are required before closing this ticket.

If the operator can reproduce in live Pi after reinstall/rebuild, capture a fresh screenshot/PTY log and open a narrower follow-up with the exact key sequence or terminal behavior.

## Residual Risk

- No fresh live Pi replay was captured after the fix.
- The regression tests cover representative Kitty/CSI-u sequences, not every terminal keyboard protocol variant.
- Existing broader custom inbox visual limits still apply: this is a component-level input fix, not final live UX validation.

## Related Records

- `ticket:20260525-flight-learn-custom-tui-keyboard-input` - consuming ticket.
- `evidence:20260525-flight-learn-custom-tui-keyboard-input-validation` - validation evidence.
- `ticket:20260525-flight-learn-custom-tui-inbox` - original custom inbox implementation ticket.
- `spec:flight-learn-inbox-ux` - intended custom inbox behavior.
