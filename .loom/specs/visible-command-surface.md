# Visible Command Surface

ID: spec:visible-command-surface
Type: Spec
Status: active
Created: 2026-05-25
Updated: 2026-05-25

## Summary

This spec defines the Pi-facing slash command surface for `pi-flight-recorder`. It resolves the current UX mismatch where the intended normal workflow is two commands, but the command palette still exposes debug, fallback, and internal workflow commands as peer choices.

Downstream implementation should cite this spec when changing command registration, command routing, docs, tests, or package UX.

## Product Slice

This spec owns the visible top-level Pi slash commands registered by the extension and the routing principle for advanced/debug functionality.

Covered:

- which `pi-flight-recorder` commands should appear as top-level slash commands;
- where existing advanced capabilities should move;
- compatibility/deprecation behavior for old command names;
- tests/evidence needed to prove the visible command surface is simplified.

Out of scope:

- CLI debug command removal;
- changing storage models, detector behavior, classifier readiness, or artifact semantics;
- changing Pi's command palette implementation;
- real TUI validation mechanics beyond the evidence expectation.

## Spec Set Coverage

This spec cross-cuts `spec:seamless-failure-memory-ux` and `spec:delta-artifact-learning-loop`. Those specs define failure memory, reflection, delta, artifact, and outcome behavior. This spec defines how those behaviors are exposed in Pi without overwhelming the operator.

## Problem

The product direction now says the operator should only need to remember:

```text
/flight-status
/flight-learn
```

But the extension still registers many top-level commands, so typing `/flight` in Pi shows debug/fallback/internal commands such as `/flight-sync`, `/flight-mode`, `/flight-watch`, `/flight-feedback`, `/flight-reflect`, `/flight-review`, `/flight-delta-review`, `/flight-deltas`, and `/flight-rules` beside the two intended commands.

Source/API inspection found `RegisteredCommand` supports only `name`, `description`, `getArgumentCompletions`, and `handler`; there is no documented `hidden` or `visible` option. Therefore the way to make a command not visible in the command palette is to not register it as a top-level slash command by default.

## Desired Behavior

The default installed Pi extension should present exactly two top-level `pi-flight-recorder` slash commands:

```text
/flight-status
/flight-learn
```

`/flight-status` is the inspection/status surface: "is Flight Recorder alive, what is it doing, and what state exists?"

`/flight-learn` is the action/review surface: "walk me through the next useful learning, query, review, routing, or outcome step."

Advanced/debug capabilities should remain available, but not as visible top-level slash commands by default. They should be reachable through one of:

- subcommands or guided choices under `/flight-status` or `/flight-learn`;
- the existing CLI/debug harness;
- an explicit opt-in developer/advanced mode that registers legacy aliases only when deliberately enabled.

## Not Doing

- Do not keep the current many-command palette and merely document that most commands are advanced.
- Do not depend on a hidden command option unless Pi actually supports one.
- Do not remove the underlying capabilities needed for recovery, debug, tests, or advanced workflows.
- Do not add a third default top-level command unless the operator explicitly revises the two-command invariant.
- Do not make `/flight-learn` apply artifacts, activate rules, mutate source/docs/Loom, or generate classifier labels automatically.

## Requirements

- REQ-001: By default, the extension MUST register only `/flight-status` and `/flight-learn` as top-level `pi-flight-recorder` slash commands.
- REQ-002: `/flight-status` MUST remain the default visible inspection command and SHOULD expose advanced status/control/debug paths through subcommands or guided text rather than separate top-level slash commands.
- REQ-003: `/flight-learn` MUST remain the default visible action command and SHOULD expose learning actions such as direct prior-failure lookup, reflection review, delta review, artifact follow-up, feedback, and rule handoff through guided flow or subcommands.
- REQ-004: Existing advanced capabilities currently provided by `/flight-sync`, `/flight-mode`, `/flight-watch`, `/flight-feedback`, `/flight-reflect`, `/flight-review`, `/flight-delta-review`, `/flight-deltas`, `/flight-rules`, and `/seen-this-before` MUST either be reachable through the two visible commands, remain reachable through the CLI/tool surface, or be explicitly deprecated with docs/tests updated.
- REQ-005: Legacy top-level slash aliases MAY exist only behind explicit advanced/developer opt-in. They MUST NOT be registered by default in normal Pi package use.
- REQ-006: Fallback/no-UI messages MUST NOT instruct normal users to run hidden legacy slash commands. They should point to `/flight-learn`, `/flight-status`, or CLI/debug recovery paths that actually remain available.
- REQ-007: Docs and tests MUST describe the normal Pi command surface as two commands and must not list legacy commands as normal user-facing choices.
- REQ-008: The command-surface collapse MUST preserve local-first, no-model-by-default, human-gated artifact/rule/outcome behavior.

## Scenarios

### SCN-001: Command palette stays small

Exercises: REQ-001, REQ-007

GIVEN the extension is installed in normal mode
WHEN the operator types `/flight` in Pi
THEN the visible `pi-flight-recorder` top-level command list contains `/flight-status` and `/flight-learn`
AND debug/fallback/internal command names do not appear as peer choices.

### SCN-002: Advanced sync and mode controls remain reachable

Exercises: REQ-002, REQ-004

GIVEN an operator needs to inspect or change capture/index behavior
WHEN they use the status/debug path
THEN sync/mode/watch-like functionality remains available without registering `/flight-sync`, `/flight-mode`, or `/flight-watch` as default top-level commands.

### SCN-003: Learning actions remain reachable

Exercises: REQ-003, REQ-004, REQ-008

GIVEN the operator wants prior-failure lookup, reflection review, delta review, artifact outcome feedback, rule handoff, or feedback actions
WHEN they run `/flight-learn`
THEN the appropriate guided action or subcommand path is available
AND the system preserves human approval gates and local-first behavior.

### SCN-004: Legacy aliases are opt-in only

Exercises: REQ-005, REQ-006

GIVEN a developer deliberately enables legacy/debug command aliases
WHEN the extension loads in that mode
THEN the old commands may be registered for debugging
BUT normal docs, status prompts, and no-UI guidance still frame `/flight-status` and `/flight-learn` as the default product surface.

## Evidence Plan

- REQ-001 / SCN-001: fake-Pi command registration test asserts the normal registration set contains only `flight-status` and `flight-learn` for `flight-*` commands, plus any non-command tool registrations that remain separate.
- REQ-002 through REQ-004 / SCN-002 and SCN-003: focused command-handler tests assert former advanced behaviors are reachable through `/flight-status` or `/flight-learn` subcommands/guided paths, or through documented CLI/tool fallback.
- REQ-005 / SCN-004: test an explicit opt-in path if legacy aliases are retained; otherwise inspect that no legacy aliases register by default.
- REQ-006: snapshot or focused tests assert fallback messages do not mention removed hidden slash commands as normal next steps.
- REQ-007: docs inspection or tests assert README/first-run/live-monitoring present the two-command normal model.
- REQ-008: existing delta/rule/outcome tests continue to pass and no classifier/model/provider path is introduced.

## Open Questions

None. `ticket:20260525-collapse-visible-command-surface` chose `/flight-learn seen <query>` as the explicit prior-failure lookup route and retained legacy slash aliases only behind explicit developer opt-in.

## Quality Bar

Good behavior:

```text
/flight
  flight-status  Show Flight Recorder status and advanced debug entrypoints
  flight-learn   Guided learning inbox and prior-failure/review actions
```

Bad behavior:

```text
/flight
  flight-sync
  flight-mode
  flight-watch
  flight-status
  flight-feedback
  flight-reflect
  flight-review
  flight-delta-review
  flight-deltas
  flight-rules
```

The operator should not need to know which subsystem owns the next step. The product should decide that after `/flight-status` or `/flight-learn` starts.

## Interface Contract

Default top-level Pi commands:

- `/flight-status [subcommand/options]`
- `/flight-learn [subcommand/options]`

Demotion map for legacy commands:

- `/flight-sync`, `/flight-mode`, `/flight-watch` -> `/flight-status` subcommands or CLI debug recovery.
- `/seen-this-before` -> `/flight-learn` prior-failure lookup path or LLM-callable local tool flow.
- `/flight-feedback`, `/flight-reflect`, `/flight-review`, `/flight-delta-review`, `/flight-deltas`, `/flight-rules` -> guided/subcommand paths under `/flight-learn`, with status/export inspection allowed under `/flight-status` where appropriate.

Compatibility:

- Legacy top-level aliases may be removed from default registration.
- If retained, they must require explicit advanced/developer opt-in and be documented as not normal product UX. Current implementation uses `PI_FLIGHT_RECORDER_LEGACY_COMMANDS=1` and an optional Pi flag path when available.

## Constraints

- Local-first, no hosted model/provider calls by default.
- Human-gated artifact, rule, outcome, and recurrence decisions.
- No automatic source/docs/Loom/rule/skill/prompt mutation.
- Keep CLI/library boundaries usable without Pi.
- Avoid substituting docs-only simplification for actual command-palette simplification.

## Related Records

- `constitution:main` - local-first, evidence-backed, human-gated promotion, and small vertical slice principles.
- `spec:seamless-failure-memory-ux` - owns failure memory/reflection behavior that must be routed through the smaller command surface.
- `spec:delta-artifact-learning-loop` - owns learning-loop behavior and already requires a small command model for corpus building.
- `ticket:20260525-streamlined-learning-inbox-command` - implemented `/flight-learn` but left legacy commands visible, which this spec corrects.
- `spec:flight-learn-inbox-ux` - owns the visual/interactive quality of the `/flight-learn` workflow after this spec establishes it as a default visible command.
