# Rule Promotion TUI Fixture and Observer Evidence

ID: evidence:20260523-rule-promotion-tui-fixture-observer
Type: Evidence Dossier
Status: recorded
Created: 2026-05-23
Updated: 2026-05-23
Observed: 2026-05-23

## Validation Question

Does the final real-TUI validation ticket have a deterministic, isolated rule-promotion fixture and a privacy-bounded observer/local-provider artifact that can prove Flight Recorder rule-block injection or absence without logging raw prompts or system prompts?

## Artifacts

Artifact directory:

```text
.loom/evidence/artifacts/20260523-rule-promotion-tui-fixture-observer/
```

Key artifacts:

```text
README.md
seed-rule-promotion-fixture.ts
fixture-summary.json
fixture-paths.txt
fixture-db-inspection.txt
rule-block-observer-extension.ts
synthetic-rule-injector-extension.ts
observer-absence.ndjson
observer-presence.ndjson
observer-absence-*.txt / observer-presence-*.txt
observer-absence-tui-*.log / observer-presence-tui-*.log
```

## Observations

### OBS-001: Fixture setup produced one deterministic exact-text edit mismatch proposal

Procedure:

```sh
DATA_DIR=$(mktemp -d /tmp/pfr-rule-promotion-fixture-data-XXXXXX)
CWD=$(mktemp -d /tmp/pfr-rule-promotion-workspace-XXXXXX)
npx tsx .loom/evidence/artifacts/20260523-rule-promotion-tui-fixture-observer/seed-rule-promotion-fixture.ts "$DATA_DIR" "$CWD"
```

Observed summary from `fixture-summary.json`:

```json
{
  "dataDir": "/tmp/pfr-rule-promotion-fixture-data-maS4qw",
  "databasePath": "/tmp/pfr-rule-promotion-fixture-data-maS4qw/flight-recorder.db",
  "cwd": "/tmp/pfr-rule-promotion-workspace-o1QGI1",
  "proposals": [
    {
      "id": "refl_c70bb44179db5cd8",
      "clusterId": "cluster_a0a444da4838caa3",
      "title": "Pattern: exact-text edit mismatches",
      "likelyFix": "Before editing, re-read the target block and apply the smallest exact-text replacement; if the block changed, fall back to a narrower patch instead of retrying the stale oldText.",
      "confidence": 0.75,
      "evidenceCount": 2
    }
  ],
  "mining": { "examined": 2 }
}
```

Database inspection from `fixture-db-inspection.txt`:

```text
failure_occurrences: 2
failure_clusters: 1
reflection_proposals: 1
rule_candidates: 0
flight_rules: 0
{"id":"refl_c70bb44179db5cd8","title":"Pattern: exact-text edit mismatches","confidence":0.75}
```

This fixture is suitable for:

```text
/flight-review --data-dir /tmp/pfr-rule-promotion-fixture-data-maS4qw --min-count 2
```

The fixture was seeded with synthetic local storage APIs and local reflection, not by indexing real Pi sessions. This setup evidence is not itself real-TUI UX proof.

### OBS-002: Observer extension records allowlisted rule-block facts only

`rule-block-observer-extension.ts` extracts only the appended `Flight Recorder approved rules:` block from `event.systemPrompt`. It writes one JSON object per `before_agent_start` event to `PFR_RULE_OBSERVER_LOG` with these fields:

```text
type
sequence
hasFlightRecorderRuleBlock
ruleIds
blockLineCount
blockByteCount
blockSha256
redactedBlockExcerpt
```

The observer does not write the user prompt, full system prompt, provider payload, raw session data, or credentials. It also registers a local no-network provider `pfr-local/stub` using `streamSimple`, so a later prompt can trigger `before_agent_start` without hosted provider credentials.

### OBS-003: Observer records absence marker in a real Pi TUI run

Procedure:

- launched real interactive Pi TUI in tmux using the guardrail environment pattern;
- loaded only `rule-block-observer-extension.ts` via `--no-extensions -e <observer>`;
- selected local stub model with `--model pfr-local/stub` and `PFR_LOCAL_STUB_KEY=stub`;
- sent prompt text `observer absence probe`;
- captured pane/TUI logs and observer output.

`observer-absence.ndjson` contains:

```json
{"type":"before_agent_start","sequence":1,"hasFlightRecorderRuleBlock":false,"ruleIds":[],"blockLineCount":0,"blockByteCount":0,"blockSha256":null,"redactedBlockExcerpt":null}
```

`observer-absence-after-prompt-pane.txt` shows the prompt was processed by the local stub model and rendered:

```text
observer absence probe

PFR_LOCAL_STUB_RESPONSE
```

### OBS-004: Observer records present rule block in a real Pi TUI run when loaded after an injector

Procedure:

- launched real interactive Pi TUI in tmux using the guardrail environment pattern;
- loaded `synthetic-rule-injector-extension.ts` and `rule-block-observer-extension.ts` with explicit `-e` paths;
- selected local stub model with `--model pfr-local/stub`;
- sent prompt text `observer presence probe`;
- captured pane/TUI logs and observer output.

`observer-presence.ndjson` contains:

```json
{"type":"before_agent_start","sequence":1,"hasFlightRecorderRuleBlock":true,"ruleIds":["rule_deadbeef1234abcd"],"blockLineCount":2,"blockByteCount":165,"blockSha256":"8aff74ce2c29441de917bb88e60970d35ef9d8ef3d7f416b9ab10c1febbe81f5","redactedBlockExcerpt":"Flight Recorder approved rules:\n- [rule_deadbeef1234abcd; global] Before exact-text edit replacements, re-read the target block and use the smallest current oldText."}
```

`observer-presence-after-prompt-pane.txt` shows the prompt was processed by the local stub model and rendered:

```text
observer presence probe

PFR_LOCAL_STUB_RESPONSE
```

## Final Validation Handoff

Use these values from this observed fixture unless a later execution chooses to regenerate with `seed-rule-promotion-fixture.ts`:

```text
Fixture data dir: /tmp/pfr-rule-promotion-fixture-data-maS4qw
Fixture cwd/workspace: /tmp/pfr-rule-promotion-workspace-o1QGI1
Proposal: refl_c70bb44179db5cd8
Cluster: cluster_a0a444da4838caa3
Observer extension: .loom/evidence/artifacts/20260523-rule-promotion-tui-fixture-observer/rule-block-observer-extension.ts
Observer env: PFR_RULE_OBSERVER_LOG=<temp-log-path> PFR_LOCAL_STUB_KEY=stub
Model flag: --model pfr-local/stub
Extension-loading strategy: --no-extensions -e <absolute dist/pi-extension.js> -e <absolute observer extension>
```

Recommended final real-TUI key path:

```text
/flight-review --data-dir <fixture-data-dir> --min-count 2
Enter to select first proposal
Down/Enter as needed to choose Make Rule
Edit/accept draft in Pi editor
Enter to select Approve global
send a harmless prompt to trigger before_agent_start; observer should log hasFlightRecorderRuleBlock=true and ruleIds=[...]
/flight-rules disable <rule-id> --data-dir <fixture-data-dir>
send another harmless prompt; observer should log hasFlightRecorderRuleBlock=false
/flight-rules status --data-dir <fixture-data-dir>
/quit
```

The exact selection keystrokes should be confirmed by pane snapshots during the final run; do not replace real TUI selection with direct fallback commands for proposal/action/rule creation.

## What This Shows

- Supports `ticket:20260523-rule-promotion-tui-fixture-observer#ACC-001`: an isolated synthetic data dir contains a deterministic exact-text edit mismatch reflection proposal suitable for `/flight-review --data-dir <fixture> --min-count 2`.
- Supports `ticket:20260523-rule-promotion-tui-fixture-observer#ACC-002`: the observer extension artifact exists, its load order and env contract are documented, and its output fields are allowlisted.
- Supports `ticket:20260523-rule-promotion-tui-fixture-observer#ACC-003`: real Pi TUI probe runs show the observer records both absence and presence markers without raw prompt/full-system-prompt/provider-payload logging.
- Supports `ticket:20260523-rule-promotion-tui-fixture-observer#ACC-004`: final validation handoff names fixture data dir, workspace/cwd, extension loading strategy, observer output path/env, local stub model, and keyboard flow.

## What This Does Not Show

- It does not prove the guided `/flight-review` rule-promotion UX in a real Pi TUI.
- It does not load the actual `pi-flight-recorder` extension.
- It does not approve or inject a real Flight Recorder rule.
- It does not prove installed-package behavior.
- It does not prove hosted/real model-provider behavior; the local stub provider is intentionally no-network.

## Related Records

- `ticket:20260523-rule-promotion-tui-fixture-observer` - consuming ticket.
- `ticket:20260523-real-pi-tui-automation-guardrails` - terminal automation prerequisite.
- `ticket:20260523-interactive-rule-promotion-tui-validation` - final validation ticket that should consume this handoff.
- `plan:20260523-automated-real-pi-tui-rule-promotion-validation` - parent plan.
