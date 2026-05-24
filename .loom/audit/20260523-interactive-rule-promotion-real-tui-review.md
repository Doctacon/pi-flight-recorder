# Interactive Rule Promotion Real TUI Review

ID: audit:20260523-interactive-rule-promotion-real-tui-review
Type: Audit
Status: recorded
Created: 2026-05-23
Updated: 2026-05-23
Audited: 2026-05-23
Target: ticket:20260523-interactive-rule-promotion-tui-validation

## Summary

Ralph reviewed the real interactive Pi TUI validation evidence for guided Flight Rule promotion. Verdict: `clear` within the audited scope; the evidence supports the ticket's real-TUI acceptance criteria while preserving explicit limits for real providers, installed-package smoke, long-run corpus tuning, and high-confidence suggestion notification.

## Target

`ticket:20260523-interactive-rule-promotion-tui-validation` acceptance and closure story after the unattended real-TUI validation run.

Primary claims reviewed:

- real TUI proposal review/action selection happened without fallback command choreography;
- Make Rule draft edit and scope approval happened in real TUI;
- approved rule injection was visible on a later turn through a bounded observer;
- disabling the rule prevented further injection and status reflected disabled state;
- privacy and evidence limits were not overstated.

## Audit Scope And Lenses

Lenses:

- claim and evidence;
- acceptance;
- product/UX keyboard path;
- privacy and trust boundary;
- prompt-injection boundary;
- reversibility;
- follow-through and residual-risk visibility.

Out of scope:

- hosted/real model-provider correctness;
- installed-package behavior;
- high-confidence live suggestion notification;
- long-run corpus tuning;
- broad code review of the Flight Recorder implementation beyond source seams needed to interpret evidence.

## Context And Evidence Reviewed

- Ralph review run: manual bounded review in current harness from `ticket:20260523-interactive-rule-promotion-tui-validation`, `evidence:20260523-interactive-rule-promotion-real-tui-validation`, and linked guardrail/fixture evidence.
- `ticket:20260523-interactive-rule-promotion-tui-validation` - acceptance criteria and closure boundary.
- `evidence:20260523-interactive-rule-promotion-real-tui-validation` - primary real TUI validation dossier.
- `.loom/evidence/artifacts/20260523-interactive-rule-promotion-real-tui/02-proposal-select-pane.txt` - proposal select UI.
- `.loom/evidence/artifacts/20260523-interactive-rule-promotion-real-tui/03-action-select-pane.txt` - action select UI with Make Rule option.
- `.loom/evidence/artifacts/20260523-interactive-rule-promotion-real-tui/04-rule-draft-editor-pane.txt` and `05-rule-draft-edited-pane.txt` - draft editor before/after edit.
- `.loom/evidence/artifacts/20260523-interactive-rule-promotion-real-tui/06-scope-select-pane.txt` and `07-approved-notification-pane.txt` - explicit scope approval and approved rule notification.
- `.loom/evidence/artifacts/20260523-interactive-rule-promotion-real-tui/09-rules-status-active-pane.txt`, `12-disable-rule-pane.txt`, and `15-rules-status-disabled-pane.txt` - active/disable/status TUI evidence.
- `.loom/evidence/artifacts/20260523-interactive-rule-promotion-real-tui/11-observer-after-injection.ndjson` and `14-observer-after-disable.ndjson` - bounded observer evidence for injection/no-injection.
- `.loom/evidence/artifacts/20260523-interactive-rule-promotion-real-tui/08-db-after-approval.json` and `16-db-final.json` - database state corroborating candidate/rule IDs, active/disabled state, and injection count.
- `evidence:20260523-real-pi-tui-automation-guardrails` - isolated tmux/`PI_TUI_WRITE_LOG` route and extension-loading proof.
- `evidence:20260523-rule-promotion-tui-fixture-observer` - synthetic fixture and observer/local-provider substrate.
- `src/flight-rules.ts` - injection block format reviewed for interpreting observer extraction.

## Findings

None - no material findings within audited scope.

## Verdict

`clear` within audited scope.

The real-TUI artifacts support `ticket:20260523-interactive-rule-promotion-tui-validation#ACC-001` through `#ACC-004`: the pane captures show keyboard-driven proposal/action/draft/scope dialogs; the approval notification and DB inspection establish candidate/rule IDs; observer NDJSON shows a bounded Flight Recorder rule block present before disable and absent after disable; status output corroborates active then disabled state and injection count.

The evidence does not overclaim hosted model behavior or installed-package behavior. The local stub provider is correctly framed as a no-network way to trigger Pi lifecycle events, not as real model-provider validation. The observer output is bounded to rule-block facts and does not include raw full prompts, full system prompts, provider payloads, real session logs, or credentials.

## Required Follow-up

No required follow-up blocks closure of `ticket:20260523-interactive-rule-promotion-tui-validation` within its scoped real-TUI acceptance claim.

Before broader release or product claims, keep these as separate limits/follow-ups rather than folding them into this ticket:

- installed-package real Pi smoke;
- hosted/real model-provider reflection or inference behavior;
- high-confidence live suggestion notification in real TUI;
- long-run corpus tuning.

## Residual Risk

- The run used explicit `-e dist/pi-extension.js` extension loading, not `pi install <package> -l`; installed-package behavior remains unproven.
- The later prompts used `pfr-local/stub` to trigger Pi lifecycle events; this proves `before_agent_start` injection/no-injection visibility, not actual hosted model interpretation of the rule.
- The fixture is synthetic and narrow; it proves the guided exact-text edit mismatch path, not every reflection pattern or every scope choice.
- The audit did not perform a broad source-code review of all Flight Rule management edge cases.

## Related Records

- `ticket:20260523-interactive-rule-promotion-tui-validation` - consuming ticket.
- `evidence:20260523-interactive-rule-promotion-real-tui-validation` - audited validation dossier.
- `evidence:20260523-real-pi-tui-automation-guardrails` - TUI automation prerequisite.
- `evidence:20260523-rule-promotion-tui-fixture-observer` - fixture/observer prerequisite.
- `plan:20260523-automated-real-pi-tui-rule-promotion-validation` - parent plan.
