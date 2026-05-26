# Flight Learn Custom TUI Keyboard Input Fix

ID: ticket:20260525-flight-learn-custom-tui-keyboard-input
Type: Ticket
Status: closed
Created: 2026-05-25
Updated: 2026-05-25
Risk: medium - fixes a live user-facing interaction bug in the custom Pi TUI inbox.
Priority: high - the first custom `/flight-learn` UI win appears to trap the user after entering routing rationale.

## Summary

Fix the custom `/flight-learn` inbox so keyboard input keeps working in the routing-rationale/edit states in real Pi terminals. The observed symptom is: after the operator scrolls to a pending issue and presses Enter, the UI enters the `Routing rationale` panel, but subsequent typing/keys appear to do nothing.

Likely cause to verify/fix: the component currently handles legacy raw key sequences and printable ASCII, but real Pi terminals may send Kitty/CSI-u keyboard protocol sequences for printable characters. In that mode, the component can recognize Enter but ignore normal typed rationale/edit characters and shortcut keys.

## Related Records

- `ticket:20260525-flight-learn-custom-tui-inbox` - previous custom inbox implementation ticket.
- `spec:flight-learn-inbox-ux` - UX behavior and fallback requirements.
- `evidence:20260525-flight-learn-custom-tui-inbox-validation` - previous render/test validation, now known to miss this real-terminal input mode.
- User screenshot path: `/var/folders/xk/pmxkhd7x635cskr6l4qw0mx00000gn/T/pi-clipboard-fd02f55d-63cd-44a3-bc48-92ff8e6a8847.png` - shows the inbox in `Routing rationale` mode after Enter.

## Scope

In scope:

- Make `src/flight-learn-inbox.ts` handle real Pi/terminal keyboard sequences for printable input and shortcut keys in review/edit/rationale modes.
- Add regression tests using Kitty/CSI-u sequences for shortcut keys and typed rationale text.
- Preserve existing legacy/raw key behavior and storage semantics.
- Preserve no-auto-apply boundaries and no new top-level commands.

Out of scope:

- Redesigning the custom inbox layout.
- Artifact outcome follow-up custom UI.
- Real PTY automation unless quick and safe; a component-level regression is acceptable for this bug fix, but evidence must state the limit.

## Acceptance

- ACC-001: In the custom component, printable text delivered as Kitty/CSI-u input is accepted in rationale mode and can complete a route.
- ACC-002: Shortcut keys delivered as Kitty/CSI-u input work for review-mode actions such as edit, route selection, and quit/cancel where applicable.
- ACC-003: Existing legacy/raw input tests still pass.
- ACC-004: No storage semantics, command surface, model/provider behavior, or auto-apply behavior changes.

## Current State

Closed. The custom inbox now decodes representative Kitty/CSI-u keyboard sequences in addition to legacy raw input.

Implemented behavior:

- printable CSI-u input is accepted in edit/rationale modes;
- CSI-u shortcut keys work for entering edit mode, clearing fields/rationale with Ctrl+U, selecting route cards, and submitting with Enter;
- legacy/raw input behavior remains covered by existing tests;
- command surface, storage semantics, model/provider behavior, and no-auto-apply boundaries were unchanged.

Evidence:

- `evidence:20260525-flight-learn-custom-tui-keyboard-input-validation`
  - focused tests: 2 files, 31 tests passed;
  - full tests: 18 files, 89 tests passed;
  - `npm run typecheck` passed;
  - `npm run build` passed;
  - `npm run test:smoke:local` passed;
  - operator screenshot preserved as evidence of the pre-fix stuck state.

Audit:

- `audit:20260525-flight-learn-custom-tui-keyboard-input-review` verdict `clear`.

Limitations preserved:

- No fresh live Pi replay was captured after the fix.
- Regression tests cover representative Kitty/CSI-u sequences, not every terminal protocol variant.
- Follow-up `ticket:20260525-flight-learn-rationale-editor-fallback` supersedes the user-facing stuck-state mitigation by removing normal inline custom rationale text entry entirely. This ticket should be read as input hardening, not final proof that inline rationale entry is reliable.

## Journal

- 2026-05-25: Created after user reported the custom `/flight-learn` inbox becomes unresponsive after pressing Enter on a pending issue and entering the routing-rationale panel.
- 2026-05-25: Implemented CSI-u/Kitty key decoding in `src/flight-learn-inbox.ts` and added regression coverage for CSI-u shortcut/printable input completing an edit + route + rationale flow.
- 2026-05-25: Validation passed and evidence recorded in `evidence:20260525-flight-learn-custom-tui-keyboard-input-validation`.
- 2026-05-25: Ralph audit returned `clear`; closed with live-replay limitation preserved.
- 2026-05-25: Added supersession note after the operator reiterated the inline rationale panel still did not recognize keystrokes. Follow-up `ticket:20260525-flight-learn-rationale-editor-fallback` removes that inline free-form text-entry state from the normal route path.
