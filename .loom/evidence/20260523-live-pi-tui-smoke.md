# Live Pi TUI Smoke

ID: evidence:20260523-live-pi-tui-smoke
Type: Evidence Observation
Status: recorded
Created: 2026-05-23
Updated: 2026-05-23
Observed: 2026-05-23

## Related Records

- `audit:20260523-seamless-ux-review#FIND-002`
- `ticket:20260523-seamless-install-and-real-pi-smoke`
- `ticket:20260523-high-confidence-suggestion-ux`
- `ticket:20260523-reflection-ui-actions`
- `plan:20260523-seamless-failure-memory-ux`

## Observation

The operator installed/enabled `pi-flight-recorder` for the active Pi project/session and ran a live interactive Pi TUI smoke in `/Users/crlough/Code/personal/geo-trail-cv`.

Procedure performed by operator in the Pi TUI:

1. Ran `/flight-status`.
2. Asked the assistant to run a harmless failing bash tool call: `bash -lc 'echo PFR_SMOKE_FAILURE >&2; exit 7'`.
3. Ran `/flight-status` again.
4. Ran the same harmless failing bash tool call again.
5. Ran `/flight-reflect --min-count 2`.

Key status excerpt before live failure:

```text
Flight recorder: suggest-on-failure (autostart on)
Data dir: /Users/crlough/.pi/flight-recorder
Capture/index: active; watched 5; last sync 2026-05-23T14:22:44.574Z
Failures captured: 0; last occurrence: none
Suggestions: minConfidence=0.78, emittedInWindow=0, last=none, last suppression=none
Reflection: session-end=true, daily=false, model=disabled
User-bash capture: disabled (Pi user_bash is pre-execution; command semantics are not wrapped).
Errors: none
Privacy: local SQLite only by default; no model calls unless `/flight-reflect --model` or model reflection is enabled.
```

Observed failed tool result in TUI:

```text
$ bash -lc 'echo PFR_SMOKE_FAILURE >&2; exit 7'
PFR_SMOKE_FAILURE
Command exited with code 7
```

Key status excerpt after first live failure:

```text
Flight recorder: suggest-on-failure (autostart on)
Capture/index: active; watched 5; last sync 2026-05-23T14:23:55.833Z
Failures captured: 1; last occurrence: occ_a66201a3ff5a2f05
Suggestions: minConfidence=0.78, emittedInWindow=0, last=none, last suppression=unresolved-match
Errors: none
```

Key reflection excerpt after two repeated failures:

```text
Flight Recorder reflection: 1 pattern ready.
Pattern: bash bash -lc 'echo PFR_SMOKE_FAILURE >&2; exit 7' PFR_SMOKE_FAILURE Command ex…
Seen 2 related failures in /Users/crlough/Code/personal/geo-trail-cv.
Likely durable fix: No prior resolution is strong enough to claim a fix. Next step: inspect the representative evidence, identify the common failing command/tool, and validate one narrow remediation before turning it into a rule.
Confidence: 0.55 (local)
Evidence:
- occ_438defe0ebb9f9a4: entry <tool-call-id>, /Users/crlough/Code/personal/geo-trail-cv, <Pi session jsonl path>
- occ_a66201a3ff5a2f05: entry <tool-call-id>, /Users/crlough/Code/personal/geo-trail-cv, <Pi session jsonl path>
Limits:
- Reflection is inferred from local failure occurrences; inspect evidence before changing code or workflow.
- No model call was made; this is a local deterministic summary.
Actions: useful | wrong-match | snooze | silence-pattern | promote-later | make-rule
Proposal: refl_b380065672d20e99
```

Tool-call IDs and the full session path were redacted from this evidence record because the key claim does not require preserving them verbatim.

## What This Shows

- Supports `audit:20260523-seamless-ux-review#FIND-002` disposition in part: `/flight-status` exists and renders in a real interactive Pi TUI session after install/reload.
- Supports live `tool_result` capture in the TUI: after one failed bash tool call, status showed `Failures captured: 1`, a concrete `occ_*` ID, and `last suppression=unresolved-match`.
- Supports reflection UI behavior in the TUI: after two repeated failures, `/flight-reflect --min-count 2` rendered one grouped pattern with local deterministic no-fix/investigation wording, evidence refs, limits, actions, and proposal ID.
- Supports the no-background-model claim for this smoke: status showed `model=disabled`, and reflection output stated `No model call was made`.

## What This Does Not Show

- It does not test a high-confidence prior resolved suggestion notification.
- It does not prove model-assisted reflection with a real provider.
- It does not prove long-run real-corpus precision/noise tuning.
- It does not by itself resolve `FIND-001`, `FIND-003`, `FIND-004`, or `FIND-005`.
