# Interactive Rule Promotion Real TUI Validation

ID: evidence:20260523-interactive-rule-promotion-real-tui-validation
Type: Evidence Dossier
Status: recorded
Created: 2026-05-23
Updated: 2026-05-23
Observed: 2026-05-23

## Validation Question

Does the real interactive Pi TUI support the guided Flight Recorder reflection-to-rule promotion flow: proposal review, Make Rule action selection, draft edit, scope approval, later approved-rule injection, disable, and no further injection?

## Procedure

Launched a real interactive Pi TUI inside tmux using the isolated guardrail route:

```text
env -i \
  HOME=<temp-home> \
  PATH=<redacted-path> \
  TERM=xterm-256color \
  SHELL=/bin/bash \
  PI_OFFLINE=1 \
  PI_CODING_AGENT_DIR=<temp-agent-dir> \
  PI_CODING_AGENT_SESSION_DIR=<temp-session-dir> \
  PI_TUI_WRITE_LOG=<temp-tui-log-dir> \
  PFR_RULE_OBSERVER_LOG=<temp-observer-log> \
  PFR_LOCAL_STUB_KEY=stub \
  pi --offline --no-extensions --no-skills --no-prompt-templates --no-context-files --no-session --no-tools \
    --model pfr-local/stub \
    -e <absolute dist/pi-extension.js> \
    -e <absolute rule-block-observer-extension.ts>
```

Fixture and environment:

```text
Fixture data dir: /tmp/pfr-rule-promotion-fixture-data-maS4qw
Workspace/cwd: /tmp/pfr-rule-promotion-workspace-o1QGI1
Flight Recorder extension: dist/pi-extension.js
Observer extension: .loom/evidence/artifacts/20260523-rule-promotion-tui-fixture-observer/rule-block-observer-extension.ts
Rule ID observed: rule_22b8d9a30a3d4d6c
Candidate ID observed: rule_cand_f9de9dbea5029357
```

The fixture came from `evidence:20260523-rule-promotion-tui-fixture-observer` and contains synthetic local exact-text edit mismatch occurrences, not real Pi session data.

Keyboard path driven through the real TUI:

```text
/flight-review --data-dir <fixture-data-dir> --min-count 2 Enter
Enter                     # select first proposal
Down Enter                # select Make Rule
End + literal text        # edit draft by appending " Keep rule concise."
Enter                     # submit editor
Enter                     # approve global scope
/flight-rules status --data-dir <fixture-data-dir> Enter
trigger observer before disable Enter
/flight-rules disable <rule-id> --data-dir <fixture-data-dir> Enter
trigger observer after disable Enter
/flight-rules status --data-dir <fixture-data-dir> Enter
/quit Enter
```

The later prompts used the local no-network stub provider from the observer extension only to trigger Pi `before_agent_start`; this does not prove hosted/real model behavior.

## Artifacts

Artifact directory:

```text
.loom/evidence/artifacts/20260523-interactive-rule-promotion-real-tui/
```

Key artifacts:

```text
01-startup-pane.txt
02-proposal-select-pane.txt
03-action-select-pane.txt
04-rule-draft-editor-pane.txt
05-rule-draft-edited-pane.txt
06-scope-select-pane.txt
07-approved-notification-pane.txt
08-db-after-approval.json
09-rules-status-active-pane.txt
10-after-injection-trigger-pane.txt
11-observer-after-injection.ndjson
12-disable-rule-pane.txt
13-after-disable-trigger-pane.txt
14-observer-after-disable.ndjson
15-rules-status-disabled-pane.txt
16-db-final.json
run-env.txt
tui-2026-05-23_18-50-38-80243.log
```

`run-env.txt` records `forced_kill=false`; the TUI exited cleanly.

## Observations

### OBS-001: Real TUI proposal review rendered the synthetic proposal

`02-proposal-select-pane.txt` shows the real Pi TUI select dialog:

```text
Choose a Flight Recorder proposal

→ 1. exact-text edit mismatches (0.75) — Before editing, re-read the target block and apply the smallest exact-te ...[truncated] [refl_c70bb44179db5cd8]

↑↓ navigate  enter select  escape/ctrl+c cancel
```

This used `/flight-review --data-dir <fixture> --min-count 2`; no proposal/action fallback command was typed for selection.

### OBS-002: Real TUI action review showed proposal context and Make Rule option

After pressing `Enter` on the proposal, `03-action-select-pane.txt` shows:

```text
Action for Flight Recorder proposal
Pattern: exact-text edit mismatches
Seen 2 related failures in <temp-path>.
Likely fix/next step: Before editing, re-read the target block and apply the smallest exact-text replacement; if the block changed, fall back to a narrower patch instead of retrying the stale oldText.
Confidence: 0.75 (local); Proposal: refl_c70bb44179db5cd8

→ Useful — Mark this proposal as helpful signal
  Make Rule — Draft and approve reusable guidance
  Wrong match — Record that this proposal grouped the wrong things
  Snooze — Hide this pattern temporarily
  Silence — Hide this pattern until changed manually
  Promote later — Store intent without activating a rule
```

Automation selected `Make Rule` by keyboard (`Down Enter`).

### OBS-003: Real TUI draft editor opened and accepted an edit

`04-rule-draft-editor-pane.txt` shows the draft editor:

```text
Review Flight Rule draft

Before exact-text edit replacements, re-read the target block and use the smallest current oldText; if the block changed, narrow the patch instead of retrying stale text.

enter submit  shift+enter newline  escape/ctrl+c cancel
```

`05-rule-draft-edited-pane.txt` shows the edited draft before submission:

```text
Before exact-text edit replacements, re-read the target block and use the smallest current oldText; if the block changed, narrow the patch instead of retrying stale text. Keep rule concise.
```

### OBS-004: Real TUI scope approval and approval notification worked

`06-scope-select-pane.txt` shows the scope approval dialog:

```text
Approve this Flight Rule?

→ Approve global — Use across codebases
  Approve project — Use only in this project/cwd
  Save draft — Keep candidate pending
  Cancel — Do not create a candidate
```

After pressing `Enter`, `07-approved-notification-pane.txt` shows:

```text
Approved Flight Rule rule_22b8d9a30a3d4d6c (global). It will be considered for future turns.
```

Database inspection after approval (`08-db-after-approval.json`) shows:

```json
{
  "candidates": [
    {
      "id": "rule_cand_f9de9dbea5029357",
      "status": "approved",
      "ruleId": "rule_22b8d9a30a3d4d6c"
    }
  ],
  "rules": [
    {
      "id": "rule_22b8d9a30a3d4d6c",
      "status": "active",
      "scope": "global",
      "injectionCount": 0,
      "lastInjectedAt": null
    }
  ]
}
```

### OBS-005: Real TUI status showed active rule before injection

`09-rules-status-active-pane.txt` shows:

```text
Flight Rules status:
Active/disabled rules:
- rule_22b8d9a30a3d4d6c [active; global; injected 0]: Before exact-text edit replacements, re-read the target block and use the smallest current oldText; if the block changed, narrow the patch instead of retrying stale text.
Keep rule concise.
```

### OBS-006: Later prompt triggered bounded approved-rule injection

After the prompt `trigger observer before disable`, `10-after-injection-trigger-pane.txt` shows the local stub response:

```text
trigger observer before disable

PFR_LOCAL_STUB_RESPONSE
```

The observer output `11-observer-after-injection.ndjson` shows Flight Recorder rule-block presence without raw prompt/full-system-prompt logging:

```json
{"type":"before_agent_start","sequence":1,"hasFlightRecorderRuleBlock":true,"ruleIds":["rule_22b8d9a30a3d4d6c"],"blockLineCount":2,"blockByteCount":255,"blockSha256":"ae9a7d8029269cb583dfadc08b4121e53dc5c92ff3f52cb196f6ac9e7d3d8de6","redactedBlockExcerpt":"Flight Recorder approved rules:\n- [rule_22b8d9a30a3d4d6c; global] Before exact-text edit replacements, re-read the target block and use the smallest current oldText; if the block changed, narrow the patch instead of retrying stale text. Keep rule concise."}
```

### OBS-007: Disable command and no-injection after disable worked

`12-disable-rule-pane.txt` shows:

```text
Disabled Flight Rule rule_22b8d9a30a3d4d6c.
```

After the prompt `trigger observer after disable`, `14-observer-after-disable.ndjson` contains two observations: first present before disable, then absent after disable:

```json
{"type":"before_agent_start","sequence":1,"hasFlightRecorderRuleBlock":true,"ruleIds":["rule_22b8d9a30a3d4d6c"],"blockLineCount":2,"blockByteCount":255,"blockSha256":"ae9a7d8029269cb583dfadc08b4121e53dc5c92ff3f52cb196f6ac9e7d3d8de6","redactedBlockExcerpt":"Flight Recorder approved rules:\n- [rule_22b8d9a30a3d4d6c; global] Before exact-text edit replacements, re-read the target block and use the smallest current oldText; if the block changed, narrow the patch instead of retrying stale text. Keep rule concise."}
{"type":"before_agent_start","sequence":2,"hasFlightRecorderRuleBlock":false,"ruleIds":[],"blockLineCount":0,"blockByteCount":0,"blockSha256":null,"redactedBlockExcerpt":null}
```

Final status in `15-rules-status-disabled-pane.txt` shows:

```text
Flight Rules status:
Active/disabled rules:
- rule_22b8d9a30a3d4d6c [disabled; global; injected 1]: Before exact-text edit replacements, re-read the target block and use the smallest current oldText; if the block changed, narrow the patch instead of retrying stale text.
Keep rule concise.
```

Final database inspection (`16-db-final.json`) shows the rule disabled with one injection:

```json
{
  "rules": [
    {
      "id": "rule_22b8d9a30a3d4d6c",
      "status": "disabled",
      "scope": "global",
      "injectionCount": 1,
      "lastInjectedAt": "2026-05-24T01:51:01.821Z",
      "disabledAt": "2026-05-24T01:51:07.840Z"
    }
  ]
}
```

## What This Shows

- Supports `ticket:20260523-interactive-rule-promotion-tui-validation#ACC-001`: real TUI evidence shows proposal review and action selection through Pi dialogs without typing full proposal/action fallback commands.
- Supports `ticket:20260523-interactive-rule-promotion-tui-validation#ACC-002`: real TUI evidence shows draft review, draft edit, scope approval, and resulting candidate/rule IDs.
- Supports `ticket:20260523-interactive-rule-promotion-tui-validation#ACC-003`: a later prompt/turn shows approved rule injection through a bounded observer record containing only the approved Flight Recorder rule block.
- Supports `ticket:20260523-interactive-rule-promotion-tui-validation#ACC-004`: disabling the rule prevents further injection and status reflects disabled state.

## What This Does Not Show

- It does not prove hosted/real model-provider behavior; prompts used a local no-network stub provider only to trigger Pi lifecycle events.
- It does not prove installed-package behavior; the run used explicit `-e dist/pi-extension.js` loading.
- It does not prove long-run corpus tuning or high-confidence live suggestion notification.
- It does not use the operator's real Pi session data; the proposal fixture is synthetic.
- It does not by itself satisfy `ACC-005`; audit is recorded separately.

## Related Records

- `ticket:20260523-interactive-rule-promotion-tui-validation` - consuming ticket.
- `evidence:20260523-real-pi-tui-automation-guardrails` - terminal automation guardrail.
- `evidence:20260523-rule-promotion-tui-fixture-observer` - fixture and observer substrate.
- `plan:20260523-automated-real-pi-tui-rule-promotion-validation` - parent plan.
- `plan:20260523-reflection-rule-promotion-ux` - broader product plan.
