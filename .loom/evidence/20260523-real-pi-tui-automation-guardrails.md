# Real Pi TUI Automation Guardrails Evidence

ID: evidence:20260523-real-pi-tui-automation-guardrails
Type: Evidence Dossier
Status: recorded
Created: 2026-05-23
Updated: 2026-05-23
Observed: 2026-05-23

## Validation Question

Can a later ticket safely launch, drive, capture, and exit a real interactive Pi TUI session under automation without using print/JSON/RPC mode, user Pi settings, real Pi session logs, default recorder data, or provider credentials?

## Procedure

Ran a real interactive `pi` process inside `tmux` 3.5a from an isolated temporary environment. The main proof run used:

```text
env -i \
  HOME=<temp-home> \
  PATH=<current-path-redacted> \
  TERM=xterm-256color \
  SHELL=/bin/bash \
  PI_OFFLINE=1 \
  PI_CODING_AGENT_DIR=<temp-home>/.pi/agent \
  PI_CODING_AGENT_SESSION_DIR=<temp-home>/.pi/agent/sessions \
  PI_TUI_WRITE_LOG=<temp-run>/tui-logs \
  pi --offline --no-extensions --no-skills --no-prompt-templates --no-context-files --no-session --no-tools
```

The tmux pane was created with a 120x40 size. Automation sent these keys:

```text
/hotkeys Enter
q
/quit Enter
```

An earlier exploratory run sent `/help Enter`; Pi does not have `/help` as a built-in slash command and therefore attempted to process it as a prompt, producing a no-API-key error. That exploratory run is retained as a limitation/probe, not as the primary command-rendering proof.

## Artifacts

Artifact directory:

```text
.loom/evidence/artifacts/20260523-real-pi-tui-automation-guardrails/
```

Key artifacts:

```text
run2-env.txt                         # sanitized launch/environment metadata
11-hotkeys-startup-pane.txt          # tmux pane after startup
12-after-hotkeys-pane.txt            # tmux pane after /hotkeys Enter
13-after-quit-before-kill-pane.txt   # final pane capture before session ended
run2-tui-2026-05-23_18-37-53-16215.log # raw ANSI stream from PI_TUI_WRITE_LOG
run2-auth.json                       # temp Pi auth file copied after run; contents: {}
run2-settings.json                   # temp Pi settings file copied after run
run2-temp-home-files.txt             # files created under temp HOME
run2-temp-workspace-files.txt        # files created under temp workspace
guard-probe-extension.ts             # tiny artifact-local extension used to prove explicit -e loading
run3-env.txt                         # sanitized explicit extension-loading launch metadata
21-extension-startup-pane.txt        # pane showing [Extensions] guard-probe-extension.ts
22-after-guard-probe-pane.txt        # pane showing GUARD_PROBE_OK hello notification
run3-tui-*.log                       # raw ANSI stream for explicit extension-loading run
```

Sanitized run metadata excerpt from `run2-env.txt`:

```text
home=/tmp/pfr-tui-guardrails-hotkeys-esXo4r/home
workspace=/tmp/pfr-tui-guardrails-hotkeys-esXo4r/workspace
agent_dir=/tmp/pfr-tui-guardrails-hotkeys-esXo4r/home/.pi/agent
session_dir=/tmp/pfr-tui-guardrails-hotkeys-esXo4r/home/.pi/agent/sessions
tui_log_dir=/tmp/pfr-tui-guardrails-hotkeys-esXo4r/tui-logs
forced_kill=false
```

Temp Pi auth/settings observations:

```text
run2-auth.json: {}
run2-settings.json: { "lastChangelogVersion": "0.75.5" }
run2-temp-home-files.txt:
  /tmp/pfr-tui-guardrails-hotkeys-esXo4r/home/.pi/agent/auth.json
  /tmp/pfr-tui-guardrails-hotkeys-esXo4r/home/.pi/agent/settings.json
run2-temp-workspace-files.txt: empty
```

## Observations

### OBS-001: Real interactive Pi TUI started in tmux

`11-hotkeys-startup-pane.txt` shows the interactive Pi header rendered in the tmux pane:

```text
pi v0.75.5
escape interrupt · ctrl+c/ctrl+d clear/exit · / commands · ! bash · ctrl+o more
Press ctrl+o to show full startup help and loaded resources.
...
/private/tmp/pfr-tui-guardrails-hotkeys-esXo4r/workspace
```

The startup pane also shows:

```text
Warning: No models available. Use /login to log into a provider via OAuth or API key.
```

This warning is expected because the run used `env -i`, `PI_OFFLINE=1`, a temp `HOME`, and an empty temp auth file.

### OBS-002: Keystrokes drove a built-in slash-command UI

`12-after-hotkeys-pane.txt` shows the result of sending `/hotkeys` followed by `Enter`. The pane rendered Pi's built-in keyboard shortcut screen:

```text
Keyboard Shortcuts

Navigation
...
Editing
...
Other
...
/                     Slash commands
!                     Run bash command
!!                    Run bash command (excluded from context)
```

This is a real interactive TUI command response, not print/json/rpc output.

### OBS-003: The TUI stream was captured through `PI_TUI_WRITE_LOG`

`run2-tui-log-dir-listing.txt` shows a generated TUI write log:

```text
tui-2026-05-23_18-37-53-16215.log
```

The copied artifact `run2-tui-2026-05-23_18-37-53-16215.log` is 61,810 bytes and preserves the raw ANSI stream for the run.

### OBS-004: Session exited cleanly without forced kill

`run2-env.txt` records:

```text
forced_kill=false
```

The automation sent `/quit Enter`; the tmux session ended without `tmux kill-session` being required.

### OBS-005: Isolation boundaries held for this guardrail run

The command used a temp `HOME`, temp `PI_CODING_AGENT_DIR`, temp `PI_CODING_AGENT_SESSION_DIR`, `--no-session`, `--no-extensions`, `--no-skills`, `--no-prompt-templates`, `--no-context-files`, `--no-tools`, and `PI_OFFLINE=1`.

Observed temp-home files were limited to temp Pi `auth.json` and `settings.json`; observed temp workspace files were empty. The copied temp auth file contains `{}`. No default `~/.pi/flight-recorder` or real Pi session root was used by this guardrail procedure.

### OBS-006: Explicit `--no-extensions -e <extension>` loading works in the same isolated TUI route

A second guardrail run loaded only the artifact-local `guard-probe-extension.ts` via:

```text
pi --offline --no-extensions --no-skills --no-prompt-templates --no-context-files --no-session --no-tools -e <absolute-extension-path>
```

`21-extension-startup-pane.txt` shows the extension list contained the explicit extension:

```text
[Extensions]
  guard-probe-extension.ts
```

After automation sent `/guard-probe hello Enter`, `22-after-guard-probe-pane.txt` shows the extension command notification:

```text
GUARD_PROBE_OK hello
```

`run3-env.txt` records `forced_kill=false`. This establishes the recommended extension-loading strategy for later tickets: use `--no-extensions -e <absolute-extension-path>` for the Flight Recorder extension and observer extension when the claim is real TUI extension behavior, while explicitly not claiming installed-package smoke unless a later ticket runs disposable `pi install <package> -l`.

## What This Shows

- Supports `ticket:20260523-real-pi-tui-automation-guardrails#ACC-001`: real interactive Pi TUI launched under tmux automation, received keystrokes, rendered built-in command UI, produced terminal/TUI logs, and exited cleanly.
- Supports `ticket:20260523-real-pi-tui-automation-guardrails#ACC-002`: the run used disposable `HOME`, agent dir, session dir, workspace, no discovered extensions/context/skills/prompts, no saved session, empty auth, offline mode, and no provider credentials.
- Supports `ticket:20260523-real-pi-tui-automation-guardrails#ACC-003`: the chosen later-ticket extension-loading strategy is `--no-extensions -e <absolute-extension-path>` under the same isolated TUI route; a guard-probe extension loaded and handled `/guard-probe hello`.
- Supports `ticket:20260523-real-pi-tui-automation-guardrails#ACC-004`: the key inputs for later automation are concrete: type slash command text, press `Enter`, use selection/navigation keys as needed, and exit with `/quit Enter` or `Ctrl+D` when the editor is empty.

## What This Does Not Show

- It does not load the `pi-flight-recorder` extension.
- It does not install the package locally; the selected later strategy is explicit `-e` loading, not installed-package proof.
- It does not prove guided Flight Rule promotion, selection dialogs, editor dialogs, rule injection, or disable/no-injection behavior.
- It does not prove provider/model behavior. The run intentionally had no model credentials.
- It does not prove long-running stability across many sessions.

## Handoff For Later Tickets

Recommended baseline for later real-TUI automation:

1. Use `tmux new-session -d -x 120 -y 40` with a disposable `HOME`, `PI_CODING_AGENT_DIR`, `PI_CODING_AGENT_SESSION_DIR`, and workspace.
2. Use `PI_TUI_WRITE_LOG=<temp-log-dir>` plus `tmux capture-pane -p` snapshots after each step.
3. Keep `env -i` and explicitly opt in only the env vars needed for the run.
4. Use `--no-extensions -e <absolute-flight-recorder-dist-extension> -e <absolute-observer-extension>` for final TUI validation, so unrelated installed extensions cannot affect evidence. If a later ticket needs an installed-package claim, run a separate disposable `pi install <absolute-package-path> -l` proof and scope the claim accordingly.
5. Avoid model/provider calls unless a later ticket explicitly requires and authorizes them.
6. Treat invalid slash commands as prompts; use documented commands such as `/hotkeys`, `/session`, `/quit`, or extension-registered commands.

## Related Records

- `ticket:20260523-real-pi-tui-automation-guardrails` - consuming ticket.
- `plan:20260523-automated-real-pi-tui-rule-promotion-validation` - parent plan.
- Pi docs `docs/tui.md` - documents `PI_TUI_WRITE_LOG`.
- Pi docs `docs/tmux.md` and `docs/keybindings.md` - inform terminal/key handling.
