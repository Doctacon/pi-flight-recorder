# Installed-Package And High-Confidence Real TUI Smoke

ID: evidence:20260523-installed-package-high-confidence-smoke
Type: Evidence Dossier
Status: recorded
Created: 2026-05-23
Updated: 2026-05-23
Observed: 2026-05-23

## Validation Question

Can `pi-flight-recorder` load through Pi's project-local package install path in a disposable real interactive Pi TUI, initialize status without the debug CLI, capture a failed Pi bash tool result, and produce a prior-resolved live suggestion decision from synthetic local evidence?

## Procedure

Validation was run from `/Users/crlough/Code/personal/pi-flight-recorder` after:

```text
npm run typecheck          # passed
npm test                   # 14 files / 63 tests passed
npm run test:smoke:local   # 1 file / 1 test passed
npm run build              # passed
npm pack --dry-run         # total files 74
```

A disposable environment was created:

```text
run_root=/tmp/pfr-installed-highconf-SUwWLA
home=/tmp/pfr-installed-highconf-SUwWLA/home
workspace=/tmp/pfr-installed-highconf-SUwWLA/workspace
agent_dir=/tmp/pfr-installed-highconf-SUwWLA/home/.pi/agent
session_dir=/tmp/pfr-installed-highconf-SUwWLA/home/.pi/agent/sessions
data_dir=/tmp/pfr-installed-highconf-SUwWLA/home/.pi/flight-recorder
source_dir=/tmp/pfr-installed-highconf-SUwWLA/source-sessions
```

The package was installed into disposable project-local Pi settings:

```sh
cd <temp-workspace>
env -i HOME=<temp-home> PATH=<redacted-path> TERM=xterm-256color SHELL=/bin/bash \
  PI_CODING_AGENT_DIR=<temp-agent-dir> \
  PI_CODING_AGENT_SESSION_DIR=<temp-session-dir> \
  pi install /Users/crlough/Code/personal/pi-flight-recorder -l
```

Then a synthetic prior resolved session was seeded into the disposable Flight Recorder data dir. The synthetic prior failure was `npm test` with `PFR_HIGHCONF_FAILURE`, followed by an assistant attempt and a successful `npm test` validation. No real Pi session data was read.

A real interactive Pi TUI was launched via tmux from the disposable workspace:

```text
env -i HOME=<temp-home> PATH=<redacted-path> TERM=xterm-256color SHELL=/bin/bash PI_OFFLINE=1 \
  PI_CODING_AGENT_DIR=<temp-agent-dir> \
  PI_CODING_AGENT_SESSION_DIR=<temp-session-dir> \
  PI_TUI_WRITE_LOG=<temp-tui-log-dir> \
  PFR_LOCAL_STUB_KEY=stub \
  pi --offline --no-skills --no-prompt-templates --no-context-files --no-session \
    --model pfr-local/bash-fail \
    -e <tool-call-provider-extension>
```

The helper extension registered a local no-network provider that emitted exactly one harmless `bash` tool call with command `npm test`; the temp workspace `package.json` made that command print `PFR_HIGHCONF_FAILURE` and exit non-zero. The helper exists only to trigger Pi's real tool execution path without hosted model calls; it is not evidence of hosted/real provider behavior.

## Artifacts

Artifact directory:

```text
.loom/evidence/artifacts/20260523-installed-package-high-confidence-smoke/
```

Key artifacts:

```text
01-pi-install-output.txt
02-seed-output.json
03-project-settings.json
03-workspace-package.json
04-engine-precheck.json
05-startup-pane.txt
06-status-before-pane.txt
07-after-toolcall-01s-pane.txt ... 07-after-toolcall-12s-pane.txt
07-after-toolcall-pane.txt
08-status-after-pane.txt
09-db-after.json
run-env.txt
tool-call-provider-extension.ts
seed-high-confidence-fixture.mjs
tui-2026-05-23_19-13-59-2655.log
```

`run-env.txt` records `forced_kill=false`; the TUI exited cleanly.

## Observations

### OBS-001: Validation commands passed before smoke

The pre-smoke validation command output in the session showed:

```text
npm run typecheck          # exited successfully
npm test                   # 14 passed files, 63 passed tests
npm run test:smoke:local   # 1 passed file, 1 passed test
npm run build              # exited successfully
npm pack --dry-run         # total files: 74
```

This verifies the source checkout was in a built/packageable state before the installed-package TUI smoke.

### OBS-002: Project-local Pi install succeeded in disposable workspace

`01-pi-install-output.txt` shows:

```text
Installing /Users/crlough/Code/personal/pi-flight-recorder...
Installed /Users/crlough/Code/personal/pi-flight-recorder
```

`03-project-settings.json` shows a project-local package entry pointing at the package path:

```json
{
  "packages": [
    "/Users/crlough/Code/personal/pi-flight-recorder"
  ]
}
```

### OBS-003: Real Pi TUI loaded Flight Recorder from installed package settings

`05-startup-pane.txt` shows a real interactive Pi TUI with both the installed package extension and the temporary local provider helper:

```text
[Extensions]
  pi-extension.js, tool-call-provider-extension.ts
```

The run did not use `--no-extensions` and did not load Flight Recorder via `-e`; the only `-e` path was the helper provider extension.

### OBS-004: `/flight-status` worked from the installed extension without CLI setup

`06-status-before-pane.txt` shows:

```text
Flight recorder: suggest-on-failure (autostart on)
Data dir: /tmp/pfr-installed-highconf-SUwWLA/home/.pi/flight-recorder
Capture/index: active; watched 0; last sync never
Failures captured: 0; last occurrence: none
Suggestions: minConfidence=0.78, emittedInWindow=0, last=none, last suppression=none
Reflection: session-end=true, daily=false, model=disabled
Flight Rules: active=0, pending=0, last injected=none
User-bash capture: disabled (Pi user_bash is pre-execution; command semantics are not wrapped).
Errors: none
```

This supports installed-package command registration and extension bootstrap in a real TUI using disposable state.

### OBS-005: Precheck showed the synthetic prior evidence would pass high-confidence gates

`04-engine-precheck.json` shows the seeded prior resolved episode produced a suggestion at the extension's configured threshold:

```json
{
  "decisionKind": "suggestion",
  "confidence": 0.82,
  "priorFix": "Validation passed: npm test",
  "episodes": [
    {
      "id": "ep_70da13e85de121ce",
      "status": "resolved",
      "confidence": 0.8999999999999999,
      "resolution": "Validation passed: npm test"
    }
  ]
}
```

### OBS-006: Real Pi bash tool execution produced a failed `tool_result`

`08-status-after-pane.txt` shows the TUI ran the provider-emitted bash tool call:

```text
trigger the high confidence suggestion smoke

$ npm test

PFR_HIGHCONF_FAILURE

Command exited with code 7

PFR_LOCAL_TOOLCALL_DONE
```

This was Pi's real bash tool execution path, not `user_bash`, print mode, JSON mode, RPC mode, or fake-Pi tests.

### OBS-007: Flight Recorder recorded a suggested live occurrence in the real TUI run

`08-status-after-pane.txt` shows the post-turn status:

```text
Failures captured: 1; last occurrence: occ_3a60ff012c2d0c96
Suggestions: minConfidence=0.78, emittedInWindow=1, last=ep_70da13e85de121ce, last suppression=none
```

`09-db-after.json` corroborates the occurrence and suggestion outcome:

```json
{
  "counts": {
    "episodes": 1,
    "occurrences": 1,
    "feedback": 0
  },
  "occurrences": [
    {
      "id": "occ_3a60ff012c2d0c96",
      "source": "tool_result",
      "toolName": "bash",
      "command": "npm test",
      "suggestion": {
        "kind": "suggested",
        "episodeId": "ep_70da13e85de121ce",
        "confidence": 0.82
      }
    }
  ]
}
```

### OBS-008: The formatted transient notification text was not captured in pane or TUI-log artifacts

The run captured pane snapshots every second for 12 seconds after the prompt and preserved the TUI write log. Searches over the final pane snapshots and TUI log did not find the formatted `formatLiveSuggestion` strings such as `Seen before`, `Prior fix`, or `likely match`.

This means the run supports the high-confidence suggestion decision/emission state (`emittedInWindow=1`, `last=<episode>`, DB `kind=suggested`) but does not directly prove that the formatted warning notification text was visibly rendered in the terminal transcript.

## What This Shows

- Supports `ticket:20260523-seamless-install-and-real-pi-smoke#ACC-001`: disposable project-local `pi install <package> -l` succeeded and the TUI loaded `pi-extension.js` from installed package settings.
- Supports `ticket:20260523-seamless-install-and-real-pi-smoke#ACC-002`: `/flight-status` rendered from the installed extension without `npm run cli`, with autostart on and no errors.
- Supports `ticket:20260523-seamless-install-and-real-pi-smoke#ACC-003`: a real Pi `bash` tool result was captured as a live occurrence, and status/DB show a prior-resolved suggestion outcome rather than quiet suppression.
- Partially supports `ticket:20260523-high-confidence-suggestion-ux#ACC-004`: the real TUI run exercised a prior-resolved high-confidence suggestion decision, but the formatted warning notification text itself was not captured.

## What This Does Not Show

- It does not prove hosted/real model-provider behavior; the provider was a local deterministic helper.
- It does not read or tune against a real long-run corpus.
- It does not prove visible rendering of the formatted high-confidence notification text; pane/TUI-log artifacts only prove the suggestion state and captured occurrence.
- It does not prove global/user-scope Pi package install; it proves disposable project-local `pi install <package> -l`.

## Related Records

- `ticket:20260523-seamless-install-and-real-pi-smoke` - primary installed-package smoke consumer.
- `ticket:20260523-high-confidence-suggestion-ux` - high-confidence live suggestion consumer.
- `ticket:20260523-post-real-tui-release-reconciliation` - docs/plan reconciliation consumer.
- `plan:20260523-seamless-failure-memory-ux` - broader UX plan.
