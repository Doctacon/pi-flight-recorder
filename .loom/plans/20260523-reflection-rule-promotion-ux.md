# Interactive Reflection-to-Rule Promotion UX Plan

ID: plan:20260523-reflection-rule-promotion-ux
Type: Plan
Status: active
Created: 2026-05-23
Updated: 2026-05-23
Risk: medium-high - approved rules can affect future agent behavior, so UX must be explicit, reversible, bounded, and well-evidenced

## Summary

This plan turns useful Flight Recorder reflection proposals into durable, human-approved "Flight Rules" through an interactive Pi TUI review flow rather than copy/paste slash-command choreography.

The motivating real pattern is:

```text
Pattern: exact-text edit mismatches
Likely durable fix: Before editing, re-read the target block and apply the smallest exact-text replacement...
```

The desired product flow is:

```text
/flight-reflect --interactive  (or /flight-review)
  -> user tabs/selects a proposal card
  -> user selects Useful / Make Rule / Snooze / Wrong / Silence
  -> Make Rule opens a draft rule review
  -> user edits or accepts the draft
  -> user selects scope: Global / Project / Save Draft / Cancel
  -> approved rules are injected into future turns in a small visible bounded block
```

Slash commands remain available as debug/scriptable fallbacks, but the normal UX should feel like Pi-native option selection, not manually typing proposal IDs through every step.

## Related Records

- `spec:seamless-failure-memory-ux` - defines `make-rule/remember`, feedback controls, local-first privacy, and no autonomous fixes.
- `plan:20260523-seamless-failure-memory-ux` - current reflection/feedback foundation.
- `ticket:20260523-extension-feedback-controls` - existing feedback action semantics and storage.
- `ticket:20260523-reflection-ui-actions` - existing `/flight-reflect` digest/action output.
- `evidence:20260523-shared-watcher-validation` - proves real multi-session capture/reflection is producing usable patterns.
- Pi docs `docs/extensions.md` / `docs/tui.md` - Pi-native `ctx.ui.select`, `confirm`, `input`, `editor`, and custom UI surfaces.

## Strategy

Use Pi-native interactive UI as the primary path. The operator mentioned `@juicesharp/rpiv-ask-user-question` as the desired interaction style: concise choices, keyboard navigation, and no ID-copying. The implementation should first use Pi's built-in extension UI (`ctx.ui.select`, `ctx.ui.editor`, `ctx.ui.confirm`, or a custom TUI component if needed) because it is already available in Pi and avoids adding a runtime dependency. Any external package should be treated as inspiration unless separately justified.

The system shape has four layers:

1. **Rule state.** Store rule candidates and approved rules locally with evidence, scope, status, timestamps, and redacted/bounded text. `make-rule` creates a draft candidate; only `approve` activates it.
2. **Interactive review.** Add a guided review flow over reflection proposals. Users select actions with Pi UI instead of typing full commands.
3. **Guided rule approval.** The Make Rule path generates a draft from the proposal, lets the user edit/accept it, and asks for scope. Approval is explicit and reversible.
4. **Future-turn influence.** Approved relevant rules are injected through `before_agent_start` as a small visible bounded block. Draft/rejected/disabled rules are never injected.

Order matters:

- Rule storage comes first so UI state and future injection have a stable contract.
- A small UI primitive/adaptor comes next so command handlers can be tested without binding every flow directly to Pi dialogs.
- Guided proposal actions can ship before rule injection; they improve reflection review immediately.
- Rule approval should precede prompt injection to preserve the human gate.
- Injection must remain bounded and status-visible before any real-TUI claim.
- Real TUI validation/audit gates completion because fake-Pi tests do not prove keyboard/tab UX.

Deliberately out of scope for this plan:

- autonomous code edits or automatic rule activation;
- silently editing `CLAUDE.md`, `AGENTS.md`, prompt templates, or repo files;
- hosted/remote rule memory;
- background model calls;
- replacing Pi's core tool execution semantics;
- a dependency on `@juicesharp/rpiv-ask-user-question` unless a later ticket explicitly researches and accepts it.

Replan triggers:

- Pi dialog APIs cannot provide enough keyboard-driven UX for proposal/rule review;
- prompt injection causes unacceptable context bloat or invisible behavior changes;
- rule candidate text cannot be generated safely from local proposal evidence;
- real TUI validation shows the guided flow is slower or noisier than commands;
- privacy review finds raw session content leaking into rule text or prompts.

## Execution Units

### Unit: Rule candidate and active-rule data model

Ticket: `ticket:20260523-rule-candidate-data-model`

Add local schema, migrations, types, and storage APIs for rule candidates and active/disabled rules. This ticket owns the durable state contract: candidate status, approved rule status, scope, evidence refs, and redacted draft text. It must not implement interactive UI or prompt injection.

### Unit: Interactive review UI primitives

Ticket: `ticket:20260523-interactive-review-ui-primitives`

Create a small internal abstraction for Pi-native selection/editor/confirmation flows used by Flight Recorder. It should be easy to fake in tests, degrade gracefully when UI is unavailable, and keep command handlers from depending directly on complicated TUI details. It should prefer Pi built-ins over new dependencies.

### Unit: Guided reflection proposal actions

Ticket: `ticket:20260523-guided-reflection-action-flow`

Add the first interactive review path for reflection proposals: choose a proposal, choose an action, and record existing feedback actions (`useful`, `wrong-match`, `snooze`, `silence-pattern`, `promote-later`). `make-rule` may route to a placeholder until the rule draft ticket lands, but the proposal/action selection UX should be real.

### Unit: Guided rule draft and approval flow

Ticket: `ticket:20260523-guided-rule-draft-approval-flow`

Implement the Make Rule path end-to-end through candidate creation, draft preview/edit, scope choice, and explicit approval/save-draft/cancel. This ticket consumes the rule data model and interactive primitives. It should make the real exact-edit-mismatch proposal a good first-class flow.

### Unit: Approved rule injection and status

Ticket: `ticket:20260523-approved-flight-rule-injection`

Inject approved relevant Flight Rules into future agent turns through `before_agent_start` with strict bounds, scope filtering, redaction, and status visibility. This is the point where approved rules begin affecting agent behavior, so it needs strong tests and audit posture.

### Unit: Rule management, fallback commands, and export

Ticket: `ticket:20260523-flight-rules-management-export`

Expose inspect/disable/reject/export affordances so approved rules are reversible and portable. Commands remain the scriptable/debug fallback for the interactive flow. Export/materialization to docs must be explicit and never automatic.

### Unit: Real TUI validation and audit

Ticket: `ticket:20260523-interactive-rule-promotion-tui-validation`

Validate the full interactive flow in a real Pi TUI: review a real proposal, make/edit/approve a rule, observe injection on a later prompt, disable it, and record evidence. Run Ralph review before completion.

## Milestones

### Milestone: Safe rule state

Child tickets: `ticket:20260523-rule-candidate-data-model`

The system can persist draft candidates and approved/disabled rules with evidence and migration safety, but no UI or behavior change exists yet.

### Milestone: Interactive reflection review

Child tickets: `ticket:20260523-interactive-review-ui-primitives`, `ticket:20260523-guided-reflection-action-flow`

Users can review reflection proposals and apply existing feedback actions through Pi-native choices instead of command ID choreography.

### Milestone: Human-approved Flight Rules

Child tickets: `ticket:20260523-guided-rule-draft-approval-flow`

A proposal can become a draft candidate and then an explicitly approved scoped rule through a guided flow.

### Milestone: Rules influence future turns safely

Child tickets: `ticket:20260523-approved-flight-rule-injection`, `ticket:20260523-flight-rules-management-export`

Approved rules are injected only when relevant and bounded, can be inspected/disabled/exported, and remain local unless explicitly materialized.

### Milestone: Proven interactive UX

Child tickets: `ticket:20260523-interactive-rule-promotion-tui-validation`

The real TUI flow is evidenced and reviewed, including keyboard-driven interaction and reversibility.

## Validation and Evidence Posture

Every implementation ticket should run:

```sh
npm run typecheck
npm test
npm run build
npm pack --dry-run
```

Additional evidence expectations:

- storage tickets: migration/old-DB fixture tests and redaction tests;
- interactive tickets: fake-Pi UI transcript tests plus concise snapshot outputs;
- injection ticket: prompt/system context tests proving bounds, scope, disable, and no raw evidence leakage;
- final ticket: real interactive Pi TUI evidence captured via tmux/session output plus Ralph audit.

## Current State

Plan is active. Implementation is complete for the data model, interactive primitives, guided proposal action flow, guided rule draft/approval flow, approved-rule injection, and management/export fallback commands. Those child tickets are in `review` with automated evidence in `evidence:20260523-interactive-rule-promotion-validation`.

Implemented outcomes:

- rule candidate and active Flight Rule schema/storage APIs;
- Pi-native selection/editor helper abstraction;
- `/flight-review` and `/flight-reflect --interactive` guided proposal action flow;
- `make-rule` candidate creation, draft edit, scope selection, and approval;
- bounded `before_agent_start` injection of approved relevant rules;
- `/flight-rules pending|status|show|approve|reject|disable|export` fallback controls;
- docs and automated tests.

Validation passed: `npm run typecheck`, `npm test` (13 files, 62 tests), `npm run build`, and `npm pack --dry-run`.

Plan-level blocker: `ticket:20260523-interactive-rule-promotion-tui-validation` remains blocked until the guided flow is exercised in a real interactive Pi TUI and captured as evidence. Follow-up audit `audit:20260523-interactive-rule-promotion-review` returned `concerns`: no material code blockers in the automated implementation scope, but real TUI validation remains required before completion unless explicitly deferred.

## Journal

- 2026-05-23: Created initial command-oriented rule promotion plan after a real reflection identified exact-text edit mismatches.
- 2026-05-23: Reworked plan around operator direction that promotion should use an interactive ask-user-question-style Pi TUI flow rather than requiring commands for every step. Created child tickets for storage, interactive primitives, guided actions, guided approval, injection, management/export, and real TUI validation.
- 2026-05-23: Implemented all non-real-TUI slices and recorded automated validation in `evidence:20260523-interactive-rule-promotion-validation`. Plan remains active/blocker-bound on real interactive Pi TUI validation.
- 2026-05-23: Ran follow-up Ralph review `audit:20260523-interactive-rule-promotion-review`; verdict `concerns` with no material code blockers in automated scope and real TUI validation still outstanding.
