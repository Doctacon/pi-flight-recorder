# Real Pi TUI Automation Guardrails

ID: ticket:20260523-real-pi-tui-automation-guardrails
Type: Ticket
Status: closed
Created: 2026-05-23
Updated: 2026-05-23
Risk: high - real Pi TUI automation can accidentally use user settings, real sessions, or provider credentials if isolation is not proven before the validation run
Priority: high - this is the first prerequisite for unattended real-TUI rule-promotion validation

## Summary

Prove a safe, repeatable way to launch, drive, capture, and exit a real interactive Pi TUI session in automation. This ticket does not validate Flight Rule promotion. Its closure claim is only that the final validation ticket has an evidenced terminal automation and isolation recipe, or that a concrete blocker has been recorded.

## Related Records

- `plan:20260523-automated-real-pi-tui-rule-promotion-validation` - owns the decomposition and sequencing for unattended real-TUI validation.
- `ticket:20260523-interactive-rule-promotion-tui-validation` - final validation ticket that will consume this guardrail work.
- `evidence:20260523-live-pi-tui-smoke` - prior operator-driven real TUI proof that the extension can render commands/reflection, but not unattended automation.
- Pi docs `docs/extensions.md` - defines real interactive mode, extension loading, and non-interactive mode limits.
- Pi docs `docs/tui.md` and `docs/keybindings.md` - define keyboard input/selection semantics that the automation must exercise.
- Pi docs `docs/packages.md` - defines package install and `-e/--extension` routes that must be isolated from user settings.
- `knowledge:pi-extension-command-bootstrap-data-dir` - informs the data-dir isolation risk when command handlers bootstrap state.

## Scope

May change:

- Evidence and artifact files under `.loom/evidence/` and `.loom/evidence/artifacts/`.
- This ticket's Current State and Journal.
- Temporary directories outside the repository for disposable `HOME`, workspace, Pi settings, session files, recorder data dirs, and terminal logs.

May run:

- Local inspection commands such as `pi --help`, `pi list`, `tmux -V`, `script`, `which`, and non-destructive shell probes.
- A real interactive Pi TUI process under a PTY/tmux-style harness with an isolated environment.
- Minimal commands inside the TUI that prove keyboard submission, command rendering, and clean exit without exercising Flight Rule promotion.

Must not change:

- No application source, package files, repository docs, tests, generated files, or persistent Pi settings outside disposable temp directories.
- No global `~/.pi/agent/settings.json`, project `.pi/settings.json` in the real repository, default `~/.pi/flight-recorder`, or real `~/.pi/agent/sessions` content.
- No real provider/model calls or credential use.
- No use of print, JSON, or RPC mode as proof of interactive TUI behavior.

Required guardrails:

- Use a disposable `HOME` and disposable workspace when launching Pi unless evidence shows an equally isolated route.
- Prefer `--no-extensions` plus explicit extension/package loading for test runs so unrelated installed extensions cannot affect evidence.
- Preserve the exact command/environment recipe in evidence, with secrets and irrelevant absolute session paths redacted.
- Stop and route back to the plan if a stable real-TUI automation path cannot be proven without touching user state.

## Acceptance

- ACC-001: Evidence shows a real interactive Pi TUI process was launched under terminal automation, received keystrokes, rendered the expected command or prompt response, and exited cleanly.
  - Evidence: `.loom/evidence/...` dossier with the launch command, environment isolation summary, terminal log path or tmux pane snapshots, and exit/cleanup notes.
  - Audit: Final validation audit can rely on this evidence; no separate Ralph audit is required for this guardrail ticket unless the evidence is ambiguous.

- ACC-002: Evidence demonstrates the automation route did not use the operator's real Pi settings, real Pi session logs, default recorder database, or provider credentials.
  - Evidence: recorded temp `HOME`/workspace/data-dir paths, explicit `--no-extensions` or isolated package-loading strategy, and checks showing no default `~/.pi/flight-recorder` or real session root was used.
  - Audit: Final validation audit should challenge this boundary before the final blocker closes.

- ACC-003: The ticket records the chosen extension-loading strategy for later tickets: disposable project-local `pi install <absolute package path> -l` after build, or `--no-extensions -e <extension path>`, with the evidence claim scoped to whichever path actually worked.
  - Evidence: command transcript and explanation in the evidence dossier.
  - Audit: Final validation audit should reject installed-package claims unless the chosen strategy actually installed the package in the disposable workspace.

- ACC-004: The ticket identifies the concrete key inputs that later automation should use for command entry, selection movement, selection confirmation, cancellation, and exit.
  - Evidence: terminal log/snapshot plus a concise handoff note in Current State or the evidence dossier.
  - Audit: Final validation audit should check that the final run uses real keyboard interaction, not command fallback choreography.

- ACC-005: If automation is not feasible, the ticket stays non-closed or closes only with an explicit blocker/replan recommendation rather than weakening the real-TUI proof requirement.
  - Evidence: blocker notes with command output or terminal artifacts.
  - Audit: Any closure without a working recipe must be treated as plan reblocking, not validation success.

## Current State

Closed. Evidence `evidence:20260523-real-pi-tui-automation-guardrails` records a real interactive Pi TUI launched under tmux 3.5a with disposable `HOME`, `PI_CODING_AGENT_DIR`, `PI_CODING_AGENT_SESSION_DIR`, workspace, offline mode, empty temp auth, no saved session, no discovered extensions/skills/prompts/context files, no tools, and no provider credentials. Automation sent real keystrokes, rendered `/hotkeys`, captured tmux panes plus `PI_TUI_WRITE_LOG`, and exited with `forced_kill=false`.

The same evidence also proves the chosen later-ticket extension-loading strategy: `--no-extensions -e <absolute-extension-path>`. An artifact-local guard-probe extension appeared under `[Extensions]`, handled `/guard-probe hello`, rendered `GUARD_PROBE_OK hello`, and exited cleanly. This closes the guardrail ticket without claiming package install, Flight Recorder behavior, guided rule promotion, model/provider behavior, or long-run TUI stability.

No separate Ralph audit was recorded for this ticket because acceptance is a guardrail observation recipe and the evidence is explicit about its limits; the final validation audit should still challenge whether later tickets followed this route and preserved privacy boundaries.

## Journal

- 2026-05-23: Created as the first child ticket of `plan:20260523-automated-real-pi-tui-rule-promotion-validation` to separate terminal automation/privacy guardrails from the final Flight Rule UX proof.
- 2026-05-23: Set Status to `active`. Beginning bounded manual-Ralph execution for real Pi TUI launch/capture guardrails; no Flight Rule UX validation is in scope for this ticket.
- 2026-05-23: Ran isolated tmux real-Pi TUI probe with `/hotkeys`; captured pane snapshots and `PI_TUI_WRITE_LOG` artifacts under `.loom/evidence/artifacts/20260523-real-pi-tui-automation-guardrails/`.
- 2026-05-23: Ran isolated explicit-extension probe with artifact-local `guard-probe-extension.ts` loaded by `--no-extensions -e <absolute-extension-path>`; `/guard-probe hello` rendered `GUARD_PROBE_OK hello` and exited cleanly.
- 2026-05-23: Recorded `evidence:20260523-real-pi-tui-automation-guardrails` and closed ticket. ACC-001 through ACC-004 are supported; ACC-005 is not applicable because automation was feasible. Residual limits are preserved for later tickets.
