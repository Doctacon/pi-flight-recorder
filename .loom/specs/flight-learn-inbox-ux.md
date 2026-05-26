# Flight Learn Inbox UX

ID: spec:flight-learn-inbox-ux
Type: Spec
Status: active
Created: 2026-05-25
Updated: 2026-05-25

## Summary

This spec defines the interactive Pi TUI experience behind `/flight-learn`. It turns the operator feedback that the current primitive select/editor/select flow is visually clunky into a behavior contract for a cohesive learning inbox UI.

Downstream implementation should cite this spec when replacing generic `ctx.ui.select()` / `ctx.ui.editor()` review steps with `ctx.ui.custom()` components, custom renderers, keyboard interactions, or visual evidence for the learning loop.

## Product Slice

This spec owns the interactive user experience for reviewing and acting on Flight Recorder learning items inside Pi.

Covered:

- the `/flight-learn` interactive inbox screen;
- pending expectation-delta review and routing UX;
- artifact candidate follow-up UX shape;
- visual density, progressive disclosure, keyboard affordances, and fallback behavior;
- evidence expectations for visual quality.

Out of scope:

- changing the two-command visible surface owned by `spec:visible-command-surface`;
- changing delta/artifact/outcome storage semantics owned by `spec:delta-artifact-learning-loop`;
- adding classifier automation or model/provider calls;
- automatically applying artifacts, rules, source edits, docs, Loom records, skills, or prompts;
- building a separate dashboard, web UI, or non-Pi frontend.

## Spec Set Coverage

The current specs define what `/flight-learn` does and why it must be the normal entrypoint, but they do not define what a good interactive review experience feels like. This spec fills that quality and interaction gap without changing command visibility or artifact semantics.

## Problem

The current `/flight-learn` flow is functionally correct but visually poor:

- pending deltas appear as long one-line labels that truncate important context;
- detailed review appears as a large editable text blob, mixing editable fields with read-only evidence;
- route choices appear after the detail editor as another long list;
- evidence and route rationale are hard to scan;
- the operator must mentally connect separate screens into one workflow;
- the UI does not communicate progress, priority, recommendations, or safe actions clearly.

Pi supports richer extension UI primitives: `ctx.ui.custom()`, custom components, overlays, `SelectList`, `SettingsList`, `Markdown`, theme-aware styling, widgets, status indicators, keybindings, autocomplete providers, and custom message/tool renderers. The Flight Learn workflow should use those capabilities for the review path rather than relying on primitive dialogs for the primary experience.

## Desired Behavior

Running `/flight-learn` in interactive Pi should open a coherent learning inbox when reviewable items exist. The inbox should feel like one product surface, not a chain of generic dialogs.

For pending expectation deltas, the primary screen should show:

- a compact list of pending items;
- a readable detail pane for the selected delta;
- evidence and detector signals summarized with progressive disclosure;
- route/action choices as compact cards or rows;
- clear keyboard shortcuts for route, edit, dismiss, skip, and quit;
- a final confirmation/rationale step that stores a candidate without applying durable artifacts.

For artifact candidate follow-up, the same inbox pattern should show candidates needing applied/outcome feedback with outcome actions and cautious wording.

The UI should preserve all existing safety boundaries: candidate generation can assist, but humans still select routes, outcomes, approvals, and application markers. No source/docs/Loom/rule/skill/prompt mutation happens from the inbox itself.

## Not Doing

- Do not add more top-level slash commands.
- Do not make route recommendations look authoritative before a human selects them.
- Do not hide evidence provenance completely; summarize first, but keep inspectable evidence available.
- Do not require users to edit YAML/Markdown-like blobs for ordinary delta review.
- Do not remove CLI/subcommand fallback paths for non-interactive or broken-UI recovery.
- Do not use hosted services, model calls, or classifier labels as part of the default UI improvement.

## Requirements

- REQ-001: `/flight-learn` MUST remain the single normal entrypoint for the learning inbox in interactive Pi.
- REQ-002: When pending expectation-delta candidates exist and interactive custom UI is available, `/flight-learn` SHOULD present a single cohesive inbox screen rather than a sequence of primitive select/editor/select dialogs.
- REQ-003: The inbox MUST display the selected delta with separate read-only sections for summary, signals, evidence, and current status.
- REQ-004: The inbox MUST present editable delta fields, such as expectation, reality, and impact, as explicit fields or focused edit actions rather than requiring the user to edit a mixed read-only/read-write text blob.
- REQ-005: Artifact route choices MUST be presented as compact route cards/rows with short labels, plain-language purpose, and enough differentiation to choose without reading a wall of text.
- REQ-006: The UI MUST make safe next actions visible: route, observe, dismiss, skip, edit, help, and quit/cancel.
- REQ-007: The UI MUST preserve human-gated behavior: selected routes create local artifact candidates only; no durable artifact is applied or activated from the inbox without the separate approval workflow.
- REQ-008: Evidence display MUST be progressive: show concise evidence summaries by default, with a way to inspect fuller redacted refs/snippets when needed.
- REQ-009: The UI MUST be theme-aware and width-safe. Rendered lines must not exceed the provided component width, and styling must use the theme supplied by Pi callbacks.
- REQ-010: Keyboard affordances MUST be discoverable in the UI and should use Pi/TUI conventions where possible: arrows for navigation, enter to select, escape/ctrl+c to cancel, and visible hints for route/edit/skip/dismiss/help.
- REQ-011: Non-interactive/no-custom-UI modes MUST degrade honestly to existing subcommand or primitive-dialog fallback behavior, with guidance pointing at `/flight-learn` and `/flight-status` paths that exist by default.
- REQ-012: Artifact candidate follow-up SHOULD use the same inbox design language as delta review, even if implemented in a later slice.
- REQ-013: The inbox MUST not introduce default model/provider calls, hosted services, classifier automation, or automatic source/docs/Loom/rule/skill/prompt mutation.
- REQ-014: The selected delta view SHOULD include a plain-language at-a-glance summary of the issue, what happened, why it matters, expected behavior if known, and the currently selected follow-up route guidance so the operator can route without decoding internal record fields.

## Scenarios

### SCN-001: Pending deltas open a cohesive inbox

Exercises: REQ-001, REQ-002, REQ-003, REQ-006, REQ-010

GIVEN several pending expectation-delta candidates exist
WHEN the operator runs `/flight-learn` in interactive Pi
THEN a Flight Learn inbox opens
AND the operator can move through pending deltas while seeing a detail pane for the selected item
AND the visible footer/help text explains the available keyboard actions.

### SCN-002: Delta details separate editable fields from evidence

Exercises: REQ-003, REQ-004, REQ-008

GIVEN a selected delta has expectation/reality/impact text, detector signals, and evidence refs
WHEN the operator reviews it in the inbox
THEN the detail view shows those categories separately
AND editing expectation/reality/impact does not require editing evidence or detector text.

### SCN-003: Route selection creates only a candidate

Exercises: REQ-005, REQ-006, REQ-007, REQ-013

GIVEN the operator selects a route card and enters/accepts a plain-language reason for that follow-up
WHEN they confirm the route
THEN the system stores an accepted artifact candidate locally
AND no Flight Rule, Loom record, source file, docs file, skill, prompt template, or active rule is created or applied by that action.

### SCN-004: No custom UI fallback remains usable

Exercises: REQ-011

GIVEN Pi is running in a mode where `ctx.ui.custom()` is unavailable or fails
WHEN the operator runs `/flight-learn`
THEN the system falls back to the existing safe guided/subcommand path
AND guidance names `/flight-learn ...` or CLI/debug recovery paths that actually exist by default.

### SCN-005: Visual quality is reviewable

Exercises: REQ-009, REQ-010

GIVEN a deterministic fixture with multiple deltas and long evidence snippets
WHEN the inbox component renders at representative terminal widths
THEN the output remains width-safe, visually scannable, theme-aware, and includes key hints.

## Evidence Plan

- REQ-001 through REQ-007 / SCN-001 through SCN-003: fake-Pi command/component tests prove `/flight-learn` opens the custom inbox for pending deltas, selection/edit/route/dismiss/skip flows store the same safe records as the old flow, and no durable artifact mutation occurs.
- REQ-008 through REQ-010 / SCN-002 and SCN-005: component render tests or snapshot artifacts over fixture deltas at narrow and wide widths prove progressive disclosure, key hints, theme use, and width safety.
- REQ-011 / SCN-004: fake no-UI tests prove fallback behavior still works and names default-available commands.
- REQ-012: either include artifact follow-up in the same ticket evidence or record a follow-up ticket; do not claim it complete if only delta routing was implemented.
- REQ-013: regression tests and source review prove no default model/provider/classifier or auto-apply path was introduced.
- Visual UX claim: before strong release claims, capture at least one real interactive Pi TUI screenshot or ANSI log showing the custom inbox with representative data.

## Open Questions

- Should the first implementation slice cover only pending delta review/routing, or also artifact outcome follow-up? Recommendation: implement pending delta review/routing first, then reuse the component shell for outcome follow-up in a later ticket if the slice grows.
- Should the component be an overlay or replace the editor area? Recommendation: replace the editor area for the first slice, because the current review flow is modal and focused; overlays can be added later if the inbox needs to coexist with chat context.
- Should route recommendations be ranked? Recommendation: route cards can group likely/default-safe choices, but avoid classifier-like ranking language until routed/outcome corpus exists.

## Quality Bar

Good inbox behavior:

```text
Flight Learn  •  7 pending deltas  •  Review 1/7

┌ Items ─────────────────────┐ ┌ Delta ───────────────────────────────┐
│ > Exact-text edit mismatch │ │ Summary: repeated edit oldText miss  │
│   Typecheck retry loop     │ │ Reality: 4 related failures          │
│   Bash smoke failure       │ │ Signals: reflection cluster 0.55     │
└────────────────────────────┘ │ Evidence: 2 refs shown, 3 hidden      │
                               └───────────────────────────────────────┘
Routes:  [Code legibility] [Test/check] [Flight Rule] [Observe] [Dismiss]
Keys: ↑↓ item • r route • e edit fields • v evidence • s skip • q quit
```

Bad inbox behavior:

```text
Choose an expectation delta
1. Repeated failure pattern: bash bash -lc 'echo ...' [delta_...]
2. Repeated failure pattern: bash cd /Users/<user>/Code/... && npm ...
...
```

A reviewer should be able to tell whether the UI reduces cognitive load: fewer giant text blobs, less path noise, visible current step, visible safe actions, and no need to infer workflow state across separate dialogs.

## Interface Contract

Default command:

- `/flight-learn` opens the learning inbox when interactive custom UI and reviewable items are available.

Fallback/subcommands:

- `/flight-learn delta-review`, `/flight-learn deltas ...`, `/flight-learn feedback ...`, and CLI debug commands remain recovery paths.

Expected component inputs:

- pending deltas with signals, evidence refs, current status, and active artifact candidate if any;
- artifact route choices and descriptions;
- current store/data-dir context;
- optional fixture data for deterministic render tests.

Expected component outputs:

- selected action: route, edit-fields, show-evidence, dismiss, skip, cancel/quit;
- route choice and rationale when routing;
- edited expectation/reality/impact fields when submitted.

Side effects:

- local SQLite/index writes only for accepted/dismissed/routed delta state and artifact candidate records;
- no durable artifact application or activation.

Error semantics:

- custom UI unavailable: fallback to existing primitive/subcommand path with honest guidance;
- no pending deltas: continue current `/flight-learn` outcome/no-items behavior until artifact follow-up is included in the custom inbox;
- missing evidence: show an honest missing-evidence state and offer observe/skip/dismiss rather than implying confidence.

Compatibility:

- Keep `/flight-learn` as the entrypoint; do not add new top-level commands.
- Keep existing data records compatible; this is a presentation/interactions change, not a storage migration.

## Examples And Non-Examples

Examples:

- Split pane: item list on the left, selected delta details on the right, route/action row at the bottom.
- Field edit modal: edit only expectation/reality/impact, not detector signals or evidence refs.
- Evidence drawer: show two concise refs by default, expand to redacted snippets on `v`.
- Route cards: `Test/check — missing or weak validation`, `Loom spec — intended behavior ambiguity`, `Observe — keep evidence only`.

Non-examples:

- A prettier version of the same giant text blob.
- A route screen that dumps all evidence before every choice.
- A model-generated route recommendation presented as fact.
- A UI that creates Loom tickets or active rules directly from a route selection.
- A third top-level command such as `/flight-inbox`.

## Constraints

- Must follow Pi TUI rules: component `render(width)` lines must not exceed width, state changes call render invalidation, and theme colors come from the callback theme.
- Prefer built-in Pi TUI components such as `SelectList`, `Markdown`, `Container`, `Text`, and `DynamicBorder` before building custom primitives from scratch.
- Preserve local-first privacy, redaction, and human gates from `spec:delta-artifact-learning-loop`.
- Preserve the two-command visible surface from `spec:visible-command-surface`.
- Do not make visual quality claims without visual evidence.

## Related Records

- `spec:visible-command-surface` - owns `/flight-learn` as one of two default visible commands; this spec owns the UX behind it.
- `spec:delta-artifact-learning-loop` - owns delta/artifact/outcome semantics that this inbox must preserve.
- `ticket:20260525-streamlined-learning-inbox-command` - created the current functional but primitive one-command flow.
- `ticket:20260525-collapse-visible-command-surface` - collapsed visible commands; this UX work builds on that surface.
- `/Users/crlough/.bun/install/global/node_modules/@earendil-works/pi-coding-agent/docs/tui.md` - Pi TUI capabilities and component constraints.
- `/Users/crlough/.bun/install/global/node_modules/@earendil-works/pi-coding-agent/docs/extensions.md` - extension UI APIs, command handlers, and custom UI integration.
