# Flight Learn Inbox UX

ID: spec:flight-learn-inbox-ux
Type: Spec
Status: active
Created: 2026-05-25
Updated: 2026-05-27

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

Later operator screenshots showed that a hand-rolled split-pane ASCII layout is still the wrong shape even after at-a-glance copy improvements: the visual seam between item list and selected-detail sections is confusing, signals/evidence blend into the primary diagnosis, and horizontal route cards make the active follow-up hard to find.

Pi supports richer extension UI primitives: `ctx.ui.custom()`, custom components, overlays, `SelectList`, `SettingsList`, `Markdown`, theme-aware styling, widgets, status indicators, keybindings, autocomplete providers, and custom message/tool renderers. The Flight Learn workflow should use those capabilities for the review path rather than relying on primitive dialogs or hand-rolled ASCII table layouts for the primary experience.

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
- REQ-015: The primary delta-review screen SHOULD use a focused selected-item card or step flow rather than a side-by-side split-pane table by default. The pending list may be condensed into progress, a short queue preview, or a secondary drawer, but the selected delta must read as the main object on screen.
- REQ-016: Follow-up route selection MUST use prominent selectable rows/cards with a strong active state and per-option purpose text. The active follow-up must not rely only on subtle brackets, horizontal chip order, or a repeated summary line.
- REQ-017: Detector signals, evidence refs, record IDs, and provenance details MUST be visually secondary to the at-a-glance diagnosis and follow-up choice. They should appear behind progressive disclosure or under clearly separated sections, not as peers in one continuous text block.
- REQ-018: Implementations SHOULD prefer Pi TUI building blocks such as `Container`, `Text`, `SelectList`, `Box`, `DynamicBorder`, and overlay/dialog patterns before adding more custom ASCII layout primitives. If custom rendering remains necessary, the ticket should explain why Pi primitives were insufficient.
- REQ-019: The primary selected-delta headline MUST be a plain-English diagnosis generated from local stored delta fields, detector signals, and evidence snippets; it MUST NOT use a raw shell command, file path, cluster ID, detector ID, or unprocessed storage summary as the primary headline when a clearer deterministic phrase can be derived.
- REQ-020: Plain-English diagnosis generation MUST be local and deterministic by default. It MUST NOT introduce hosted model/provider calls, classifier automation, or network access. Optional model-assisted phrasing may only be introduced behind an explicit future opt-in path and must not be required for the default inbox.
- REQ-021: The inbox MUST keep display diagnosis separate from stored delta truth. Derived plain-English text may improve the UI, but it must not silently rewrite `ExpectationDelta.summary`, `expectation`, `reality`, `impact`, evidence refs, artifact drafts, source files, Loom records, rules, skills, or prompts unless the operator explicitly edits or approves a separate mutation workflow.
- REQ-022: Raw commands, paths, detector labels, cluster IDs, and evidence provenance MUST be visually secondary to the primary diagnosis. They may appear as `Raw clue`, `Why suggested`, or expanded evidence, but they must not be the first thing the operator has to decode.
- REQ-023: Primary diagnosis prose SHOULD wrap to a human reading measure even on wide terminals. Rendered lines still MUST obey Pi TUI width limits, but primary explanatory text should avoid full-width single-line stretching/truncation when a narrower prose column would be easier to scan.

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

### SCN-006: Focused card review avoids split-pane confusion

Exercises: REQ-014, REQ-015, REQ-016, REQ-017, REQ-018

GIVEN several pending deltas exist and one delta is selected
WHEN the operator opens `/flight-learn`
THEN the selected delta reads as one focused review card or step
AND the pending queue is visibly secondary to that selected item
AND signals/evidence/provenance are separated from the primary diagnosis
AND the active follow-up route is obvious without scanning a horizontal sentence.

### SCN-007: Raw detector text becomes a plain-English diagnosis

Exercises: REQ-019, REQ-020, REQ-021, REQ-022, REQ-023

GIVEN a pending detector-created delta whose stored summary is a raw command such as `bash cd ... && npm test` and whose reality names an internal reflection cluster ID
WHEN the operator opens `/flight-learn`
THEN the primary headline describes the problem in plain English, such as `A validation command failed repeatedly in this project`
AND `What happened?` explains the observed recurrence without requiring the operator to decode a cluster ID
AND raw command/path/cluster details are secondary or hidden behind evidence/provenance affordances
AND the explanatory prose wraps to a readable measure within the component width
AND no stored delta fields are changed merely because the UI derived friendlier text.

## Evidence Plan

- REQ-001 through REQ-007 / SCN-001 through SCN-003: fake-Pi command/component tests prove `/flight-learn` opens the custom inbox for pending deltas, selection/edit/route/dismiss/skip flows store the same safe records as the old flow, and no durable artifact mutation occurs.
- REQ-008 through REQ-010 / SCN-002 and SCN-005: component render tests or snapshot artifacts over fixture deltas at narrow and wide widths prove progressive disclosure, key hints, theme use, and width safety.
- REQ-011 / SCN-004: fake no-UI tests prove fallback behavior still works and names default-available commands.
- REQ-012: either include artifact follow-up in the same ticket evidence or record a follow-up ticket; do not claim it complete if only delta routing was implemented.
- REQ-013: regression tests and source review prove no default model/provider/classifier or auto-apply path was introduced.
- REQ-015 through REQ-018 / SCN-006: render artifacts and tests should compare the focused-card layout against a representative multi-delta fixture and show that pending queue, primary diagnosis, secondary evidence/signals, and active route selection have separate visual hierarchy.
- REQ-019 through REQ-023 / SCN-007: deterministic view-model tests should cover detector-created deltas with raw commands, cluster IDs, user corrections, stale edit attempts, missing evidence, and human-authored fields. Render artifacts should show that primary diagnosis text is plain-English, raw details are secondary, and prose wraps at a readable measure while staying width-safe.
- Visual UX claim: before strong release claims, capture at least one real interactive Pi TUI screenshot or ANSI log showing the custom inbox with representative data.

## Open Questions

- Should the first implementation slice cover only pending delta review/routing, or also artifact outcome follow-up? Recommendation: implement pending delta review/routing first, then reuse the component shell for outcome follow-up in a later ticket if the slice grows.
- Should the component be an overlay or replace the editor area? Recommendation: replace the editor area for the first slice, because the current review flow is modal and focused; overlays can be added later if the inbox needs to coexist with chat context.
- Should route recommendations be ranked? Recommendation: route cards can group likely/default-safe choices, but avoid classifier-like ranking language until routed/outcome corpus exists.
- Should the split-pane layout be polished further or replaced? Recommendation: replace it for the primary review path. The current screenshots show that the split-pane shape itself creates the cognitive-load problem; further border/copy tweaks are likely incremental.

## Quality Bar

Good inbox behavior:

```text
Flight Learn  •  Issue 5 of 6

Problem
  A validation command failed repeatedly from the wrong project or shell context.

What happened?
  Pi saw the same validation-failure pattern twice in recent sessions.

Why it matters
  Repeated setup/cwd friction makes it harder to trust whether the latest code actually passed.

Expected
  unknown — press e to add what should have happened

Choose a follow-up
> Code legibility
  Use when confusing source/project shape caused repeated mistakes.

  Test/check
  Use when a missing validation check would have caught this.

  Flight Rule
  Use when Pi needs a reusable behavior reminder.

v evidence  •  e edit expected  •  enter choose  •  ↑↓ move  •  q quit
```

Bad inbox behavior:

```text
Choose an expectation delta
1. Repeated failure pattern: bash bash -lc 'echo ...' [delta_...]
2. Repeated failure pattern: bash cd /Users/<user>/Code/... && npm ...
...
```

Also bad:

```text
+ Pending deltas -----------+ + Selected delta -----------------------+
| > 5/6 bash cd /Users/... | | At a glance | Why suggested | Evidence |
+--------------------------+ +----------------------------------------+
Follow-up choices: 1 Code legibility 2 Test/check [3 Flight Rule] 4 Observe
```

This is still too much of a table. It makes the selected item, explanation, evidence, and route choice compete for attention.

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

- Focused card: one selected delta fills the primary screen, with item count/progress instead of a dominant side-by-side queue.
- Vertical route selector: `Code legibility`, `Test/check`, `Flight Rule`, and `Observe` appear as rows/cards with the active row visibly highlighted and described.
- Field edit modal: edit only expectation/reality/impact, not detector signals or evidence refs.
- Evidence drawer: show concise refs only when requested by `v`, expand to fuller redacted snippets without changing route selection.
- Route cards: `Test/check — missing or weak validation`, `Loom spec — intended behavior ambiguity`, `Observe — keep evidence only`.
- Plain-English diagnosis: `A validation command failed repeatedly in this project.` as the primary headline, with `Raw clue: npm test > pi-flight…` under evidence/provenance rather than under the headline.

Non-examples:

- A prettier version of the same giant text blob.
- A route screen that dumps all evidence before every choice.
- A model-generated route recommendation presented as fact.
- A UI that creates Loom tickets or active rules directly from a route selection.
- A third top-level command such as `/flight-inbox`.
- A primary headline that is only a command, path, cluster ID, detector type, or redacted source filename.
- Silently rewriting stored delta fields because the UI found a friendlier phrase.

## Constraints

- Must follow Pi TUI rules: component `render(width)` lines must not exceed width, state changes call render invalidation, and theme colors come from the callback theme.
- For primary prose, prefer a readable measure over using the whole terminal width. Use Pi TUI wrapping utilities or an equivalent width-safe local wrapper so plain-English paragraphs do not become one-line/truncated command walls.
- Prefer built-in Pi TUI components such as `SelectList`, `Markdown`, `Container`, `Text`, and `DynamicBorder` before building custom primitives from scratch.
- Preserve local-first privacy, redaction, and human gates from `spec:delta-artifact-learning-loop`.
- Preserve the two-command visible surface from `spec:visible-command-surface`.
- Do not make visual quality claims without visual evidence.

## Related Records

- `spec:visible-command-surface` - owns `/flight-learn` as one of two default visible commands; this spec owns the UX behind it.
- `spec:delta-artifact-learning-loop` - owns delta/artifact/outcome semantics that this inbox must preserve.
- `ticket:20260525-streamlined-learning-inbox-command` - created the current functional but primitive one-command flow.
- `ticket:20260525-collapse-visible-command-surface` - collapsed visible commands; this UX work builds on that surface.
- `evidence:20260527-flight-learn-plain-english-feedback` - operator screenshot/feedback showing that focused-card layout improved but primary diagnosis text remains too code-heavy and one-line/truncated.
- `/Users/crlough/.bun/install/global/node_modules/@earendil-works/pi-coding-agent/docs/tui.md` - Pi TUI capabilities and component constraints.
- `/Users/crlough/.bun/install/global/node_modules/@earendil-works/pi-coding-agent/docs/extensions.md` - extension UI APIs, command handlers, and custom UI integration.
