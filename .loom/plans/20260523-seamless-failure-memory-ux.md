# Seamless Failure Memory UX Plan

ID: plan:20260523-seamless-failure-memory-ux
Type: Plan
Status: active
Created: 2026-05-23
Updated: 2026-05-23
Risk: high - changes default extension behavior, background capture, user interruption policy, reflection cadence, and privacy/model boundaries

## Summary

This plan decomposes the remaining work from the current CLI/debug-oriented live-monitoring MVP to the desired seamless Pi extension experience: install the extension, work normally, have failures captured automatically, see only high-confidence prior fixes immediately, and receive periodic evidence-backed reflections over repeated failure patterns.

It needs more than one ticket because the route spans extension lifecycle defaults, durable occurrence data, suggestion noise controls, feedback state, real Pi install validation, cluster modeling, local pattern mining, reflection scheduling, proposal generation, UI/actions, docs, and real-corpus tuning.

## Related Records

- `constitution:main` - local-first, evidence-backed responses, human feedback gates, and small vertical slices.
- `spec:failure-memory-mvp` - existing retrospective failure episode foundation.
- `spec:live-failure-monitoring` - current live watcher/suggestion behavior and constraints.
- `spec:seamless-failure-memory-ux` - behavior contract for this plan.
- `research:20260522-live-failure-watcher-inspiration` - watcher/event-hook tradeoffs and non-copying constraints.
- `plan:20260522-live-failure-monitoring` - current implemented foundation now in review.
- `evidence:20260522-live-monitoring-validation` - validation baseline for current live-monitoring MVP.

## Strategy

Move from a developer harness to product UX in two linked arcs:

1. **Seamless immediate loop.** Make extension install/session-start the normal activation path. Persist live failure occurrences. Notify only for high-confidence prior fixes. Give the user Pi-native controls and feedback. Prove the no-CLI path in a real Pi smoke before demoting CLI docs.
2. **Reflective pattern loop.** Use the occurrence ledger to group repeated failures, schedule reflection at non-disruptive times, generate pattern-level proposals, expose `/flight-reflect` and feedback actions, then tune against real session data.

Core design constraints:

- Installation/enabling the extension is the opt-in for local capture, but model-assisted reflection is a separate explicit opt-in/manual action.
- CLI remains available for debug/recovery, but no normal product path should require `npm run cli`.
- Immediate suggestions are intentionally conservative. Low-confidence/no-match failures are stored for reflection instead of surfaced immediately.
- Reflection should produce one proposal for a repeated pattern, not one popup for every error.
- All derived data stays local by default; raw session logs are not copied into Loom evidence or model prompts.
- No autonomous fixes, no mutation of Pi tool/user command semantics, and no background model calls by default.

Order matters:

- Extension bootstrap comes first because it removes CLI from the normal path.
- Occurrence ledger comes before both better suggestions and clustering because suppressed failures must persist.
- High-confidence suggestion UX and feedback controls come before reflection UI so the same action/silence semantics can be reused.
- Real Pi smoke for no-CLI capture gates documentation demotion.
- Cluster model/miner/scheduler/generator/UI should proceed in order because each layer consumes the previous layer's state.
- Real-corpus evaluation is last because fixture tests cannot prove noise/precision for the user's actual failure history.

Parallelism:

- After `ticket:20260523-live-failure-ledger`, immediate-suggestion work and cluster data-model work can proceed partly in parallel if the occurrence interface is stable.
- `ticket:20260523-cli-demotion-and-debug-tools` should wait until the no-CLI smoke proves the product path.

Replan triggers:

- Pi extension lifecycle lacks a reliable session-start/shutdown hook for safe autostart.
- Capturing user-bash results safely requires mutating command semantics.
- Real Pi TUI smoke shows notifications are too intrusive even with high thresholds.
- Deterministic clustering produces too many false positives to support reflection.
- Model-assisted reflection cannot be bounded/redacted enough to satisfy local-first constraints.

## Execution Units

### Unit: Extension auto bootstrap

Ticket: `ticket:20260523-extension-auto-bootstrap`

Initialize local state and quiet capture/index maintenance from the Pi extension lifecycle so normal users do not run CLI commands. This is the first product-UX slice and should preserve non-blocking startup and disable/pause controls.

### Unit: Live failure occurrence ledger

Ticket: `ticket:20260523-live-failure-ledger`

Persist live failures as first-class local occurrences with redacted snippets, normalized signatures, dedupe/repeat metadata, and suggestion outcome. This creates the shared substrate for immediate suggestion gating and later reflection.

### Unit: High-confidence suggestion UX

Ticket: `ticket:20260523-high-confidence-suggestion-ux`

Tighten live suggestion defaults and formatting so only high-confidence, evidence-backed prior fixes interrupt the user. Low-confidence matches should be quiet but retained for reflection.

### Unit: Extension feedback controls

Ticket: `ticket:20260523-extension-feedback-controls`

Add Pi-native feedback/silence/snooze/control actions that steer future suggestions and reflections without automatic Loom promotion or rule enforcement.

### Unit: Seamless install and real Pi smoke

Ticket: `ticket:20260523-seamless-install-and-real-pi-smoke`

Validate the actual install-first path in Pi and record evidence that extension activation/capture works without the CLI. This is the gate before documentation says the product is seamless.

### Unit: CLI demotion and debug tools

Ticket: `ticket:20260523-cli-demotion-and-debug-tools`

Move docs/help from CLI-first to extension-first while preserving CLI as debug/recovery/power-user tooling.

### Unit: Failure cluster data model

Ticket: `ticket:20260523-failure-cluster-data-model`

Add local cluster/pattern records and membership state so repeated occurrences can be represented before reflection generation.

### Unit: Local pattern miner

Ticket: `ticket:20260523-local-pattern-miner`

Implement deterministic local clustering and ranking, preferring precision over recall and avoiding model calls.

### Unit: Reflection trigger scheduler

Ticket: `ticket:20260523-reflection-trigger-scheduler`

Select eligible clusters for reflection through manual, threshold, idle/session-end, and optional daily triggers with cooldown/snooze controls.

### Unit: Reflection proposal generator

Ticket: `ticket:20260523-reflection-proposal-generator`

Generate evidence-backed pattern proposals locally by default, with optional bounded/redacted model-assisted synthesis only when explicitly enabled or manually invoked.

### Unit: Reflection UI actions

Ticket: `ticket:20260523-reflection-ui-actions`

Expose `/flight-reflect`, digest rendering, and actions in Pi so the user can review and steer pattern proposals.

### Unit: Real corpus evaluation and tuning

Ticket: `ticket:20260523-real-corpus-evaluation-and-tuning`

Run the full flow against real Pi session history, tune thresholds/defaults, record evidence, and perform adversarial review before claiming the optimal flow is complete.

## Milestones

### Milestone: No-CLI Capture Path

Child tickets: `ticket:20260523-extension-auto-bootstrap`, `ticket:20260523-live-failure-ledger`, `ticket:20260523-seamless-install-and-real-pi-smoke`

A user can install/enable the extension and have failures captured locally without running CLI commands during normal use.

### Milestone: Trustworthy Immediate Suggestions

Child tickets: `ticket:20260523-high-confidence-suggestion-ux`, `ticket:20260523-extension-feedback-controls`

Live suggestions interrupt only for high-confidence prior fixes, and the user can correct/silence/steer them from inside Pi.

### Milestone: Product-Facing Docs Match UX

Child tickets: `ticket:20260523-cli-demotion-and-debug-tools`

Docs/help lead with extension-first usage and preserve CLI as debug tooling.

### Milestone: Pattern Reflection Core

Child tickets: `ticket:20260523-failure-cluster-data-model`, `ticket:20260523-local-pattern-miner`, `ticket:20260523-reflection-trigger-scheduler`, `ticket:20260523-reflection-proposal-generator`

Repeated failures become local clusters and produce pattern-level proposals at controlled cadence.

### Milestone: Reflection UX And Trust

Child tickets: `ticket:20260523-reflection-ui-actions`, `ticket:20260523-real-corpus-evaluation-and-tuning`

The user can review/refine reflection proposals in Pi, and real-corpus validation/audit informs defaults and follow-up work.

## Current State

Plan is active. All child tickets have implementation work completed and are now in `review` with validation evidence in `evidence:20260523-seamless-ux-validation`, `evidence:20260523-live-pi-tui-smoke`, and `evidence:20260523-findings-fix-validation`. Follow-up audit `audit:20260523-seamless-ux-followup-review` returned `clear` for FIND-001 through FIND-005 in the inspected scope.

Implemented plan-level outcomes:

- extension autostart and `/flight-status`;
- persistent live failure occurrence ledger;
- high-confidence suggestion gates and quiet buffering;
- Pi-native feedback/snooze/silence controls;
- local cluster model and deterministic pattern miner;
- reflection trigger/proposal pipeline and `/flight-reflect`;
- extension-first docs and debug CLI status/reflect commands;
- build, package dry-run, and project-local `pi install . -l` validation.

Review finding disposition:

- `FIND-001`: addressed by redacted derived storage/model context and regression tests.
- `FIND-002`: addressed for `/flight-status`, live failed `tool_result` capture, and `/flight-reflect` by live Pi TUI smoke.
- `FIND-003`: addressed by feedback target validation plus signature/cluster suppression propagation and regression tests.
- `FIND-004`: addressed by centralized command data-dir switching that stops watcher/engine state and regression test.
- `FIND-005`: addressed by v2 migration compatibility logic and legacy DB fixture test.

Remaining review risks before completion:

- high-confidence prior resolved suggestion notification was not exercised in the real Pi TUI smoke;
- model-assisted reflection was tested only with a fake provider;
- long-run real-corpus reflection precision/noise tuning remains limited to the new smoke occurrences rather than a mature occurrence corpus;
- follow-up audit is clear, but residual gaps remain intentionally open as follow-up/tuning evidence rather than blocking FIND-001 through FIND-005 closure.

## Journal

- 2026-05-23: Created plan after operator clarified that CLI should be a debug harness, while the product should be seamless after Pi extension install and should combine high-confidence immediate fixes with clustered periodic reflection.
- 2026-05-23: Executed the implementation route across all child tickets. Added extension autostart, occurrence ledger, feedback controls, pattern mining, reflection, docs, tests, build/package validation, project-local Pi install validation, and real default data-dir dry-run evidence. Moved child tickets to review pending interactive TUI smoke/audit/real occurrence tuning.
- 2026-05-23: Ran Ralph-backed review and recorded `audit:20260523-seamless-ux-review`; verdict `changes-needed` with FIND-001 through FIND-005. Child tickets remain in review pending finding disposition.
- 2026-05-23: Recorded live Pi TUI smoke in `evidence:20260523-live-pi-tui-smoke`, fixed/dispositioned FIND-001 through FIND-005, and recorded validation in `evidence:20260523-findings-fix-validation`.
- 2026-05-23: Ran follow-up Ralph review `audit:20260523-seamless-ux-followup-review`; verdict `clear` in inspected scope. Residual gaps remain for high-confidence live suggestion smoke, real model-provider reflection, and long-run corpus tuning.
- 2026-05-23: After real two-terminal use exposed watcher lock warning, changed duplicate autostart to shared-watcher behavior and recorded `evidence:20260523-shared-watcher-validation`.
