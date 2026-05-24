# High-Confidence Visible Suggestion Real TUI Validation

ID: evidence:20260523-high-confidence-visible-suggestion-tui
Type: Evidence Dossier
Status: recorded
Created: 2026-05-23
Updated: 2026-05-23
Observed: 2026-05-23

## Validation Question

After adding a persistent Flight Recorder widget for high-confidence live suggestions, does a disposable installed-package real Pi TUI run visibly render the formatted prior-fix suggestion text after a failed Pi `bash` tool result?

## Source Change Under Observation

Changed source:

- `src/pi-extension-command-utils.ts` adds `showLiveSuggestion()`, which calls `ctx.ui.notify(..., "warning")` and sets widget `pi-flight-recorder-live-suggestion` to the formatted suggestion lines.
- `src/pi-extension.ts` calls `showLiveSuggestion()` for `decision.kind === "suggestion"`.
- `src/pi-extension-types.ts` adds the optional `setWidget` UI shape.
- `src/pi-extension.test.ts` asserts fake-Pi notification and widget text for high-confidence suggestions.

The widget is intentionally used only for high-confidence suggestions that already pass prior-resolution, confidence, specificity, cooldown, and suppression gates. Low-confidence/no-match cases remain quiet.

## Procedure

Pre-smoke validation:

```text
npm run typecheck                                      # passed
npm test -- src/pi-extension.test.ts src/local-smoke.test.ts  # 2 files / 16 tests passed
npm run build                                         # passed
npm pack --dry-run                                    # total files 74
```

A disposable environment was created:

```text
run_root=/tmp/pfr-visible-highconf-Xsz8BE
home=/tmp/pfr-visible-highconf-Xsz8BE/home
workspace=/tmp/pfr-visible-highconf-Xsz8BE/workspace
agent_dir=/tmp/pfr-visible-highconf-Xsz8BE/home/.pi/agent
session_dir=/tmp/pfr-visible-highconf-Xsz8BE/home/.pi/agent/sessions
data_dir=/tmp/pfr-visible-highconf-Xsz8BE/home/.pi/flight-recorder
source_dir=/tmp/pfr-visible-highconf-Xsz8BE/source-sessions
```

The package was installed into disposable project-local Pi settings:

```text
pi install /Users/crlough/Code/personal/pi-flight-recorder -l
```

Then a synthetic prior resolved session was seeded into the disposable Flight Recorder data dir. The helper provider extension was loaded only to trigger a deterministic local no-network bash tool call; it is not evidence of hosted/real model-provider behavior.

The real interactive Pi TUI was launched via tmux:

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

The Flight Recorder extension itself loaded from the project-local package settings, not via `-e`.

## Artifacts

Artifact directory:

```text
.loom/evidence/artifacts/20260523-high-confidence-visible-suggestion-tui/
```

Key artifacts:

```text
00-pack-dry-run.txt
01-pi-install-output.txt
02-seed-output.json
03-project-settings.json
03-workspace-package.json
04-engine-precheck.json
05-startup-pane.txt
06-status-before-pane.txt
07-after-toolcall-01s-pane.txt ... 07-after-toolcall-15s-pane.txt
07-after-toolcall-pane.txt
08-status-after-pane.txt
09-db-after.json
run-env.txt
tool-call-provider-extension.ts
seed-high-confidence-fixture.mjs
tui-*.log
```

`run-env.txt` records `forced_kill=false`; the TUI exited cleanly.

## Observations

### OBS-001: Fake-Pi/widget regression and build validation passed

Focused validation passed:

```text
npm run typecheck
npm test -- src/pi-extension.test.ts src/local-smoke.test.ts
# Test Files 2 passed; Tests 16 passed
npm run build
npm pack --dry-run
# total files 74
```

`src/pi-extension.test.ts` now asserts that a high-confidence `tool_result` produces both the transient notification text and widget text containing `Seen before` and `Prior fix: Validation passed: npm test`.

### OBS-002: Installed package loaded in real TUI

`01-pi-install-output.txt` shows:

```text
Installing /Users/crlough/Code/personal/pi-flight-recorder...
Installed /Users/crlough/Code/personal/pi-flight-recorder
```

`05-startup-pane.txt` shows:

```text
[Extensions]
  pi-extension.js, tool-call-provider-extension.ts
```

### OBS-003: Real TUI status before failure showed clean installed-extension state

`06-status-before-pane.txt` shows:

```text
Flight recorder: suggest-on-failure (autostart on)
Data dir: /tmp/pfr-visible-highconf-Xsz8BE/home/.pi/flight-recorder
Capture/index: active; watched 0; last sync never
Failures captured: 0; last occurrence: none
Suggestions: minConfidence=0.78, emittedInWindow=0, last=none, last suppression=none
Reflection: session-end=true, daily=false, model=disabled
Errors: none
```

### OBS-004: Real Pi tool failure rendered visible high-confidence suggestion widget

After the local helper provider triggered a real Pi `bash` tool call, `07-after-toolcall-01s-pane.txt` shows:

```text
trigger the high confidence visible suggestion smoke

$ npm test

PFR_HIGHCONF_FAILURE

Command exited with code 7

PFR_LOCAL_TOOLCALL_DONE

⚠ Seen before: likely match (0.82)
Failure: `npm test` exited 7: PFR_HIGHCONF_FAILURE
Prior fix: Validation passed: npm test
Evidence:
- session prior-high-confidence, entry prior-fail-0001, cwd <temp-path>, <temp-path>
- session prior-high-confidence, entry prior-assistant-0001, cwd <temp-path>, <temp-path>
- session prior-high-confidence, entry prior-pass-0001, cwd <temp-path>, <temp-path>
Limits:
- Prior match is from a different cwd (<temp-path>); inspect before applying in /private/tmp/pfr-visible-highconf-Xsz8BE/workspace.
- Likely fix is inferred from later session events; inspect evidence before applying.
```

The same visible widget text appears in every sampled pane from `07-after-toolcall-01s-pane.txt` through `07-after-toolcall-15s-pane.txt` and in `07-after-toolcall-pane.txt`.

### OBS-005: Status and DB corroborate suggested state

`08-status-after-pane.txt` shows:

```text
Failures captured: 1; last occurrence: occ_3a60ff012c2d0c96
Suggestions: minConfidence=0.78, emittedInWindow=1, last=ep_962e49ceb96fc12d, last suppression=none
```

`09-db-after.json` shows:

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
        "episodeId": "ep_962e49ceb96fc12d",
        "confidence": 0.82
      }
    }
  ]
}
```

## What This Shows

- Supports `ticket:20260523-high-confidence-suggestion-ux#ACC-001`: focused fake-Pi tests assert concise prior-fix text and the real TUI widget displays `Seen before`, `Prior fix`, evidence refs, confidence, and limits.
- Supports `ticket:20260523-high-confidence-suggestion-ux#ACC-004`: a real interactive Pi TUI installed-package smoke captured the visible high-confidence suggestion text after a failed Pi `bash` tool result.
- Supersedes the high-confidence notification-rendering concern in `audit:20260523-release-readiness-followup-review#FIND-001` with stronger visible TUI evidence.
- Reinforces `ticket:20260523-seamless-install-and-real-pi-smoke#ACC-001` through `ACC-003` in the final code shape after the widget change.

## What This Does Not Show

- It does not prove hosted/real model-provider behavior; the provider was a local deterministic helper.
- It does not prove long-run corpus tuning or production precision/noise rates.
- It does not prove global/user-scope Pi package install; this is disposable project-local `pi install <package> -l`.
- The temp-path cwd redaction in the fixture makes the suggestion include a cross-cwd limit in this smoke. Unit tests still cover same-cwd prior resolved suggestions; this run proves visible real-TUI rendering, not same-cwd ranking semantics.

## Related Records

- `ticket:20260523-high-confidence-suggestion-ux` - primary consuming ticket.
- `audit:20260523-release-readiness-followup-review#FIND-001` - prior concern superseded by this evidence.
- `evidence:20260523-installed-package-high-confidence-smoke` - prior smoke that proved suggested state but not visible text.
- `ticket:20260523-seamless-install-and-real-pi-smoke` - installed package smoke owner.
- `plan:20260523-seamless-failure-memory-ux` - broader UX plan.
