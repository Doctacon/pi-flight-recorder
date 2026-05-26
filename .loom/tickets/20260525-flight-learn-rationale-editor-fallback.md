# Flight Learn Rationale Editor Fallback

ID: ticket:20260525-flight-learn-rationale-editor-fallback
Type: Ticket
Status: closed
Created: 2026-05-25
Updated: 2026-05-25
Risk: medium - fixes a live interaction failure in the new custom `/flight-learn` inbox.
Priority: high - the operator still observes that no keys are recognized once the custom rationale panel appears.

## Summary

Remove the fragile inline custom rationale-entry step from the custom `/flight-learn` inbox. The custom component should own browsing/selecting a delta, editing fields, and choosing a route card. After a route card is selected, close the custom component and use Pi's built-in editor prompt for routing rationale. This keeps the first custom UI win while relying on Pi's established text editor for free-form text entry.

## Related Records

- `ticket:20260525-flight-learn-custom-tui-inbox` - original custom inbox ticket.
- `ticket:20260525-flight-learn-custom-tui-keyboard-input` - attempted CSI-u input fix; useful, but the live screenshot/report indicates inline rationale entry remains too fragile.
- `spec:flight-learn-inbox-ux` - custom inbox UX contract; allows fallback/subcommand behavior when custom UI is unavailable or fragile.
- User screenshot: `/var/folders/xk/pmxkhd7x635cskr6l4qw0mx00000gn/T/pi-clipboard-1a05612d-3360-48d5-9eea-ae9bdd756310.png` - shows the custom rationale panel where subsequent keystrokes were not recognized.

## Scope

In scope:

- Change the custom inbox component so route selection returns a `route-selected` result instead of entering an inline free-form rationale mode.
- In Pi extension integration, prompt for routing rationale with the existing `askReviewEditor` after custom route selection.
- Preserve no-custom/no-UI fallback behavior and existing storage semantics.
- Update tests to prove custom route selection invokes the rationale editor and then stores the accepted artifact candidate with `applied=false`.

Out of scope:

- Final custom/free-form text editor implementation.
- Redesigning all `/flight-learn` screens.
- Artifact outcome follow-up custom UI.
- Model/provider or classifier behavior.

## Acceptance

- ACC-001: Pressing Enter/r on a route card in the custom inbox exits the custom component with a route-selected result instead of rendering the inline `Routing rationale` text-entry panel.
- ACC-002: `/flight-learn` then asks for routing rationale through the existing Pi editor helper and stores the same accepted artifact candidate semantics after rationale submission.
- ACC-003: Rationale editor cancellation leaves the delta/candidate unchanged except for already explicit non-mutating UI state.
- ACC-004: Existing custom UI, raw-key, CSI-u-key, fallback, no-auto-apply, and regression tests pass.

## Current State

Closed. The normal custom route path no longer enters inline custom rationale text entry.

Implemented behavior:

- route-card Enter/r in the custom inbox returns a `route-selected` result and closes the custom component;
- `src/pi-extension.ts` asks for `Routing rationale` through the existing `askReviewEditor` helper after custom route selection;
- successful rationale submission stores the same accepted artifact candidate semantics as before (`applied=false`, evidence refs preserved, no rule/source/docs/Loom mutation);
- rationale editor cancellation leaves the delta as `candidate` and creates no artifact candidate;
- raw-key and CSI-u key paths still work for custom review/edit/route selection.

Evidence:

- `evidence:20260525-flight-learn-rationale-editor-fallback-validation`
  - focused tests: 2 files, 32 tests passed;
  - full tests: 18 files, 90 tests passed;
  - `npm run typecheck` passed;
  - `npm run build` passed;
  - `npm run test:smoke:local` passed;
  - `npm pack --dry-run` completed;
  - operator screenshot preserved as pre-fix evidence.

Audit:

- `audit:20260525-flight-learn-rationale-editor-fallback-review` verdict `clear`.

Limitations preserved:

- No fresh live Pi replay after this fallback change.
- This relies on Pi's existing editor helper for rationale text entry; the helper is already used elsewhere, but was not manually replayed in live Pi during this run.

## Journal

- 2026-05-25: Created after the operator reported that even with the rationale panel visible, none of the advertised keystrokes were recognized. Chose the safer fix: remove custom free-form rationale entry from the component and hand text input back to Pi's built-in editor.
- 2026-05-25: Implemented route-selected component result and Pi extension rationale-editor handoff. Updated custom inbox and Pi extension tests, including editor cancellation preserving candidate state.
- 2026-05-25: Validation passed and evidence recorded in `evidence:20260525-flight-learn-rationale-editor-fallback-validation`.
- 2026-05-25: Ralph audit returned `clear`; closed with no-live-replay limitation preserved.
