# Automated Real Pi TUI Rule Promotion Validation Plan

ID: plan:20260523-automated-real-pi-tui-rule-promotion-validation
Type: Plan
Status: completed
Created: 2026-05-23
Updated: 2026-05-23
Risk: high - nested real-Pi automation, extension loading, and system-prompt observation can accidentally touch user settings, real sessions, provider credentials, or raw prompt content if isolation and evidence boundaries are weak

## Summary

This plan decomposes the idea of testing the guided Flight Rule promotion flow without the operator manually driving the UI. The target outcome is a trustworthy real interactive Pi TUI validation of `/flight-review` rule promotion: select a proposal, choose Make Rule, edit/approve scope, observe approved-rule injection on a later turn, disable the rule, and preserve evidence/audit without touching real Pi session history or claiming unproven provider behavior.

This needs more than one ticket because the final validation ticket is currently blocked on two distinct prerequisites: a safe way to automate and capture a real Pi TUI, and an isolated fixture/observer setup that can prove injection/no-injection without leaking raw prompt or session data.

## Related Records

- `plan:20260523-reflection-rule-promotion-ux` - parent product plan whose remaining blocker is real interactive Pi TUI validation.
- `ticket:20260523-interactive-rule-promotion-tui-validation` - existing final validation ticket; this plan creates the unblocking path rather than replacing its closure claim.
- `evidence:20260523-interactive-rule-promotion-validation` - automated/fake-Pi evidence that proves implementation exists but explicitly does not prove real TUI behavior.
- `evidence:20260523-live-pi-tui-smoke` - prior operator-driven real TUI smoke showing live command rendering and reflection, but not guided rule promotion.
- `audit:20260523-interactive-rule-promotion-review` - confirms real TUI validation remains the outstanding blocker.
- `knowledge:pi-extension-command-bootstrap-data-dir` - warns that command data-dir switching must happen before bootstrap to avoid default-session indexing in isolated tests.
- Pi docs `docs/extensions.md` - defines extension loading, real interactive UI APIs, `before_agent_start`, chained system-prompt semantics, and non-interactive mode limits.
- Pi docs `docs/tui.md` and `docs/keybindings.md` - define keyboard interaction and selection/submit bindings used by the automated TUI driver.
- Pi docs `docs/packages.md` - defines package install and `-e/--extension` loading options that shape the safe extension-loading route.
- `src/pi-extension.ts` - command and event behavior under validation: `/flight-review`, `/flight-rules`, and `before_agent_start` rule injection.
- `src/pi-extension.test.ts` and `src/local-smoke.test.ts` - existing fake-Pi/local smoke coverage that can seed expectations but must not be used as real TUI proof.

## Strategy

Treat the work as evidence-first and risk-first. The dangerous ambiguity is not whether keystrokes can be sent to a terminal; it is whether the resulting artifact can honestly count as real Pi TUI proof while preserving local-first privacy boundaries.

The route is:

1. Prove a real interactive Pi process can be launched, isolated, controlled, captured, and exited from a PTY/tmux-style harness without using JSON/RPC/print mode and without touching user Pi settings or session logs.
2. Build the smallest isolated proof substrate: synthetic repeated-failure data, a disposable Pi home/workspace/data-dir, and a temporary observer extension loaded after Flight Recorder so it can record only the bounded Flight Recorder rule block or its absence from the chained system prompt.
3. Use the existing final validation ticket to drive the full guided flow in the real TUI and run adversarial audit before claiming the blocker is resolved.

Scope choices:

- Prefer a disposable `HOME`, disposable workspace, and disposable recorder `--data-dir` for every real-Pi run. If Pi needs project-local package settings, create them only in the disposable workspace.
- Prefer loading the real built package extension through `pi install <absolute package path> -l` in the disposable workspace after `npm run build`. If execution instead uses `--no-extensions -e ./dist/pi-extension.js`, the evidence must say the claim is about a real TUI extension load, not an installed-package smoke.
- Load the observer extension after Flight Recorder. Pi docs say `before_agent_start` handlers see the chained `event.systemPrompt` as of the current handler, including earlier `before_agent_start` modifications.
- Capture evidence with terminal artifacts such as `PI_TUI_WRITE_LOG`, tmux pane snapshots, and observer logs. Redact or avoid raw session paths, tool-call IDs, provider credentials, and full system prompts unless the exact value is necessary for the claim.
- If a later prompt is needed only to trigger `before_agent_start`, first attempt it with provider credentials unset. A provider/network failure after the observer captured injection may be acceptable evidence for injection. If Pi refuses to reach `before_agent_start` without a provider, a local-only stub provider may be used as a harness artifact, but the evidence must explicitly state that real model-provider behavior remains unproven.

Deliberately out of scope:

- No feature implementation or source refactor as part of this plan.
- No reliance on print, JSON, RPC, or fake-Pi harnesses as proof of keyboard-driven TUI interaction.
- No reading, syncing, or indexing the operator's real `~/.pi/agent/sessions` or default `~/.pi/flight-recorder` data.
- No hosted model/provider calls unless the operator separately authorizes them; this plan does not attempt to prove real provider reflection.
- No long-run real-corpus tuning or high-confidence live suggestion notification proof.
- No persistent changes to user Pi settings, project source settings, package metadata, docs, or tests unless a later ticket explicitly expands scope.

Replan triggers:

- `tmux`, `script`, or another PTY driver cannot produce a stable real interactive Pi capture in this environment.
- Pi extension loading cannot be isolated from user settings or real session directories.
- The observer cannot inspect chained `before_agent_start` state after Flight Recorder without recording raw prompt content.
- Triggering `before_agent_start` requires a real hosted provider call or credentials.
- The guided TUI flow changes behavior under automation, requires non-keyboard shortcuts, or cannot be captured well enough for audit.

## Execution Units

### Unit: Prove TUI automation guardrails

Ticket: `ticket:20260523-real-pi-tui-automation-guardrails`

Produce an evidenced launch/capture recipe for a real interactive Pi TUI process in a disposable environment. This ticket owns the terminal automation and isolation question only. It must not run the full rule-promotion validation and must not claim Flight Rule UX proof. Its single closure claim is that a later ticket can safely drive and capture a real Pi TUI session, or that a concrete blocker has been found and recorded.

### Unit: Build fixture and observer proof substrate

Ticket: `ticket:20260523-rule-promotion-tui-fixture-observer`

Create the disposable synthetic data fixture and temporary observer-extension artifact needed by the final run. This ticket owns the proof substrate: seeded proposal data, extension load order, observer redaction/allowlist behavior, and exact handoff instructions. It must not claim real TUI success. Its single closure claim is that the final validation ticket has a privacy-bounded fixture and observer ready to consume.

Depends on `ticket:20260523-real-pi-tui-automation-guardrails` because the artifact shape should follow the launch/capture route that actually works.

### Unit: Run and audit full guided rule-promotion validation

Ticket: `ticket:20260523-interactive-rule-promotion-tui-validation`

Use the proven automation route and fixture/observer substrate to execute the full guided `/flight-review` flow in a real Pi TUI. This existing ticket owns the final closure claim: keyboard-driven proposal review, Make Rule draft edit/scope approval, active-rule injection on a later turn, disable/no further injection, evidence dossier, and Ralph audit. It should remain blocked until the two preparatory tickets close or are explicitly superseded with evidence.

## Milestones

### Milestone: Safe real-TUI harness path

Child tickets: `ticket:20260523-real-pi-tui-automation-guardrails`

A future agent can start, drive, capture, and exit a real interactive Pi TUI session in an isolated environment without relying on non-interactive modes or touching user Pi state.

### Milestone: Privacy-bounded proof substrate

Child tickets: `ticket:20260523-rule-promotion-tui-fixture-observer`

The final validation run has a synthetic proposal fixture and observer extension that can prove rule injection/no-injection while preserving raw prompt and real-session privacy.

### Milestone: Original blocker resolved or truthfully reblocked

Child tickets: `ticket:20260523-interactive-rule-promotion-tui-validation`

The existing real-TUI validation ticket either closes with evidence and audit, or records a concrete blocker that explains why unattended real-TUI validation remains impossible or unsafe.

## Current State

Completed. All child tickets are closed:

- `ticket:20260523-real-pi-tui-automation-guardrails` proved isolated real Pi TUI launch/control/capture and explicit extension loading.
- `ticket:20260523-rule-promotion-tui-fixture-observer` produced the synthetic proposal fixture and privacy-bounded observer/local-provider substrate.
- `ticket:20260523-interactive-rule-promotion-tui-validation` executed the full guided `/flight-review` flow in a real interactive Pi TUI and closed with `evidence:20260523-interactive-rule-promotion-real-tui-validation` plus audit `audit:20260523-interactive-rule-promotion-real-tui-review` (`clear`).

The original real-TUI Flight Rule promotion blocker is resolved within this plan's scope. Residual release limits remain outside this plan: installed package behavior is covered separately by `evidence:20260523-installed-package-high-confidence-smoke`; real hosted/model-provider behavior and long-run corpus tuning remain unproven.

## Journal

- 2026-05-23: Created plan after shaping the unattended real Pi TUI validation idea into a risk-first route: first prove automation/isolation, then build fixture/observer, then execute the existing final validation ticket with evidence and audit.
- 2026-05-23: Driver executed all three child tickets. Recorded real-TUI rule-promotion evidence and clear audit; set plan status to `completed`.
