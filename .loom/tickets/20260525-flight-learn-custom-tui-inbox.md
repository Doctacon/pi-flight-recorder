# Flight Learn Custom TUI Inbox

ID: ticket:20260525-flight-learn-custom-tui-inbox
Type: Ticket
Status: closed
Created: 2026-05-25
Updated: 2026-05-25
Risk: medium - replaces a user-facing interactive review path with a custom Pi TUI component while preserving storage, routing, and human-gate semantics.
Priority: high - the command surface is now simple, but the primary `/flight-learn` experience is visually clunky and cognitively heavy.

## Summary

Implement the first custom Pi TUI slice for `/flight-learn`: pending expectation-delta review and routing should use a cohesive `ctx.ui.custom()` inbox instead of the current generic select/editor/select sequence. The new screen should make pending items, selected-delta detail, evidence, and route choices scannable while preserving all existing local-only and human-gated behavior.

Closure claim: when pending delta candidates exist in interactive Pi, `/flight-learn` presents a custom, width-safe, keyboard-navigable inbox for selecting, reviewing, editing fields, dismissing/skipping, and routing one delta into a local artifact candidate without applying any durable artifact.

## Related Records

- `spec:flight-learn-inbox-ux` - authoritative intended UX, quality bar, requirements, scenarios, and evidence expectations for this ticket.
- `spec:delta-artifact-learning-loop` - owns delta/artifact/outcome semantics and human-gated artifact constraints.
- `spec:visible-command-surface` - requires `/flight-learn` to remain one of the two normal visible commands.
- `ticket:20260525-streamlined-learning-inbox-command` - current functional one-command flow that this ticket should preserve semantically while improving the UI.
- `ticket:20260525-collapse-visible-command-surface` - recent command-surface cleanup that this ticket must not undo.
- `/Users/crlough/.bun/install/global/node_modules/@earendil-works/pi-coding-agent/docs/tui.md` - Pi custom component, overlay, theme, keyboard, and width-safety rules.
- `/Users/crlough/.bun/install/global/node_modules/@earendil-works/pi-coding-agent/docs/extensions.md` - extension `ctx.ui.custom()` and mode/fallback behavior.

## Scope

In scope:

- Add a custom Pi TUI component/path for pending expectation-delta review under `/flight-learn` when interactive custom UI is available.
- Replace the current delta-review sequence of:
  - `askReviewChoice("Choose an expectation delta")`,
  - `askReviewEditor("Review expectation delta")`,
  - `askReviewChoice("Route expectation delta")`,
  - `askReviewEditor("Routing rationale")`
  with a cohesive inbox flow for the pending-delta path.
- Preserve existing record writes and semantics:
  - accept/refine the selected delta;
  - dismiss when the user chooses dismiss;
  - create and accept an `ArtifactCandidate` when the user routes;
  - do not apply or activate any durable artifact.
- Keep `/flight-learn` as the entrypoint; do not add a new top-level slash command.
- Keep existing subcommand/primitive/no-UI fallback for non-interactive modes and recovery.
- Add focused tests for custom inbox routing, edit-field preservation, dismiss/skip/cancel, no-durable-artifact mutation, and fallback behavior.
- Add render/snapshot-style tests or artifacts that make the visual layout reviewable at representative widths.

Out of scope:

- Artifact candidate outcome follow-up custom UI, unless it falls out naturally from reusable shell work without widening the ticket. If not included, leave it for a follow-up ticket and do not claim it done.
- Full recurrence-link selection UX.
- Classifier/model/provider route suggestions.
- Storage schema migrations.
- Automatic creation of Loom records, source edits, docs edits, prompt/skill edits, or active Flight Rules.
- New top-level commands or command-palette changes.
- Global theme redesign or custom Pi theme creation.

Likely read scope:

- `src/pi-extension.ts`
- `src/interactive-review.ts`
- `src/pi-extension-types.ts`
- `src/pi-extension.test.ts`
- `src/local-smoke.test.ts`
- `src/artifact-drafts.ts`
- `src/storage.ts`
- `src/types.ts`
- Pi docs: `docs/tui.md`, `docs/extensions.md`

Likely write scope:

- new or existing source module for the custom inbox component (for example `src/flight-learn-inbox.ts` or a similarly scoped file);
- `src/pi-extension.ts` integration;
- `src/pi-extension-types.ts` if fake/custom UI typing needs to include `custom`;
- focused tests in `src/pi-extension.test.ts` and/or a colocated component test file;
- possible small updates to docs after implementation, if behavior or key hints need user-facing documentation;
- evidence/audit records for this ticket;
- this ticket.

Design constraints:

- Use Pi TUI primitives and rules from `docs/tui.md`: theme from callback, width-safe render lines, key handling through `matchesKey`/keybindings, invalidation on state changes.
- Prefer a focused editor-replacement component over an overlay for the first slice. The review flow is modal and focused; overlay complexity is not needed unless implementation discovers a clear reason.
- Keep evidence concise by default and expandable on demand.
- Keep route choices compact and distinguishable; avoid classifier-like ranking language.
- Keep fake/no-UI fallback honest and still usable.

Stop conditions:

- Stop and return to shaping if implementing the component requires a third default top-level command.
- Stop if the implementation would need storage migrations or semantic changes to delta/artifact records.
- Stop if the only viable path requires default model/provider calls or automated route classification.
- Stop if custom TUI APIs are unavailable in the package version actually used by the project; update the ticket with the specific blocker and route back to research/spec.
- Stop if the visual component cannot be tested or rendered deterministically enough to support the UX claim.

## Acceptance

- ACC-001: With pending expectation-delta candidates and interactive custom UI available, `/flight-learn` opens a custom inbox instead of the primitive select/editor/select path.
  - Evidence: focused fake-Pi/custom-UI test showing the custom component path is invoked and completes a pending-delta flow.
  - Audit: challenge whether the old primitive flow still owns the primary interactive path.

- ACC-002: The inbox lets the user inspect pending deltas with a compact list and selected-delta detail view that separates summary, expectation, reality, impact, detector signals, and evidence.
  - Evidence: component render snapshot/test or artifact at representative terminal widths.
  - Audit: challenge whether the UI actually reduces cognitive load versus reformatting the blob.

- ACC-003: The inbox lets the user edit expectation/reality/impact as fields or focused edit actions without editing detector/evidence text.
  - Evidence: test that edits those fields and verifies stored delta updates while evidence refs remain intact.
  - Audit: challenge accidental evidence mutation or field parsing regressions.

- ACC-004: The inbox lets the user route a selected delta to an artifact type with rationale and stores the same accepted artifact candidate semantics as the old flow.
  - Evidence: storage assertions after route selection: delta accepted/routed as expected, artifact candidate accepted, `applied=false`, candidate draft/next step present, evidence refs preserved.
  - Audit: challenge semantic drift from `spec:delta-artifact-learning-loop`.

- ACC-005: Dismiss, skip/cancel, and no-custom-UI fallback paths remain safe and comprehensible.
  - Evidence: focused tests for dismiss status, skip/cancel no-op, and fallback guidance naming `/flight-learn ...` or CLI/debug recovery paths that exist.
  - Audit: challenge stale command references and accidental destructive behavior.

- ACC-006: The component is visually reviewable and width-safe.
  - Evidence: render tests/snapshots at narrow and wide widths assert no rendered line exceeds width, key hints are visible, and long paths/snippets are truncated or wrapped safely.
  - Audit: challenge overclaiming visual polish without visual artifacts.

- ACC-007: The implementation preserves safety boundaries: no default model/provider call, classifier automation, durable artifact mutation, source/docs/Loom/rule/skill/prompt creation, or active Flight Rule activation.
  - Evidence: focused tests plus source review/audit.
  - Audit: challenge hidden side effects.

- ACC-008: Validation includes at least typecheck, focused tests for the new component/path, relevant existing Pi extension tests, and a real or simulated visual artifact. If no real interactive Pi TUI screenshot is captured, the ticket must say that visual evidence is render-level only.
  - Evidence: command outputs and evidence record.
  - Audit: review evidence limits before closure.

## Current State

Closed. The first pending-delta custom TUI slice is implemented and reviewed.

Implemented behavior:

- `/flight-learn` and `/flight-learn delta-review` prefer a custom `ctx.ui.custom()` inbox when pending expectation-delta candidates exist and custom UI is available.
- The inbox renders a compact item/detail view with separated expectation, reality, impact, detector signals, evidence, wrapped route cards for the full production route set, and visible key hints.
- The inbox supports route-with-rationale, edit fields, dismiss, skip, and cancel/quit actions.
- Edit mode snapshots fields and discards edits on Escape; Enter saves edited fields for the in-component review result.
- Routing preserves existing semantics: accepted/routed delta state, accepted artifact candidate, evidence refs preserved, `applied=false`, draft/next step stored, and no durable artifact mutation.
- Non-custom/no-UI fallback remains through the existing primitive guided flow and subcommand paths.

Evidence:

- `evidence:20260525-flight-learn-custom-tui-inbox-validation`
  - focused custom inbox / Pi extension tests: 2 files, 30 tests passed;
  - full regression tests: 18 files, 88 tests passed;
  - `npm run typecheck` passed;
  - `npm run build` passed;
  - `npm run test:smoke:local` passed;
  - `npm pack --dry-run` completed;
  - render-level artifact at 56 and 104 columns captured under `.loom/evidence/artifacts/20260525-flight-learn-custom-tui-inbox/`.

Audit:

- `audit:20260525-flight-learn-custom-tui-inbox-review` verdict `clear` after a first pass identified and the implementation resolved edit-cancel and route-card visibility issues.

Limitations preserved:

- No real interactive Pi TUI screenshot, PTY capture, or installed-package validation was gathered for this ticket.
- Artifact outcome follow-up remains on the prior primitive flow; this ticket only claims pending delta review/routing.
- Width safety was tested with deterministic ASCII fixtures at representative widths, not every terminal/theme or wide Unicode case.

## Journal

- 2026-05-25: Created by Loom Weaver after operator feedback that `/flight-learn` reduced typing but the current primitive review UI is clunky and visually poor. Scoped to the first custom TUI slice for pending expectation-delta review/routing.
- 2026-05-25: Set active for execution. Read ticket and linked specs before source edits.
- 2026-05-25: Implemented `src/flight-learn-inbox.ts`, custom inbox tests, and Pi extension integration. Focused tests, typecheck, full tests, build, local smoke, and render artifacts passed/recorded in `evidence:20260525-flight-learn-custom-tui-inbox-validation`.
- 2026-05-25: Ralph audit first pass returned `changes-needed` for edit Escape cancellation semantics and full route-card visibility. Fixed both by adding edit snapshots/Escape rollback, wrapping route cards across rows, full route-set tests, and updated render evidence.
- 2026-05-25: Ralph follow-up audit returned `clear`. Closed ticket with residual limits recorded: render-level visual proof only, no live Pi screenshot, and artifact outcome follow-up remains out of scope.
