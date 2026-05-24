# Interactive Rule Promotion TUI Validation

ID: ticket:20260523-interactive-rule-promotion-tui-validation
Type: Ticket
Status: closed
Created: 2026-05-23
Updated: 2026-05-23
Risk: medium - real TUI behavior can differ from fake-Pi tests and determines whether the UX is actually usable
Priority: high - gates completion claims for interactive rule promotion
Depends On: ticket:20260523-flight-rules-management-export, ticket:20260523-real-pi-tui-automation-guardrails, ticket:20260523-rule-promotion-tui-fixture-observer

## Summary

Validate the full interactive reflection-to-rule promotion flow in a real Pi TUI and record evidence. The closure claim is that the operator can use keyboard-driven Pi UI to review a real proposal, create/edit/approve a rule, see it affect a later turn, disable it, and trust the documented behavior.

## Related Records

- `plan:20260523-reflection-rule-promotion-ux` - owns the full interactive UX route and validation posture.
- `plan:20260523-automated-real-pi-tui-rule-promotion-validation` - owns the unattended automation strategy, guardrails, and fixture/observer prerequisites for this validation.
- `ticket:20260523-real-pi-tui-automation-guardrails` - must prove a safe real-TUI launch/capture route before this ticket can execute unattended.
- `ticket:20260523-rule-promotion-tui-fixture-observer` - must provide the deterministic fixture and observer handoff before this ticket can execute unattended.
- `evidence:20260523-shared-watcher-validation` - prior real flow evidence that generated usable reflection patterns.
- `ticket:20260523-guided-reflection-action-flow` - proposal/action UI under validation.
- `ticket:20260523-guided-rule-draft-approval-flow` - rule draft/approval UI under validation.
- `ticket:20260523-approved-flight-rule-injection` - injection behavior under validation.
- `ticket:20260523-flight-rules-management-export` - disable/status/export behavior under validation.

- `audit:20260523-interactive-rule-promotion-review` - prior audit confirming this ticket was the real-TUI blocker before unattended validation.
- `evidence:20260523-interactive-rule-promotion-real-tui-validation` - real interactive Pi TUI validation evidence for proposal selection, Make Rule, draft edit, scope approval, injection, disable, and no further injection.
- `audit:20260523-interactive-rule-promotion-real-tui-review` - follow-up review of the real-TUI evidence; verdict `clear` in audited scope.

## Scope

May change:

- Evidence files under `.loom/evidence/`.
- Audit request/record under `.loom/audit/`.
- Ticket/plan current-state notes after validation.
- Minor docs corrections found during smoke only if tightly scoped.

Must not change:

- No feature implementation except tiny documentation/evidence corrections.
- No closing tickets without evidence and audit disposition.
- No relying on print/JSON/RPC modes as proof of TUI interactions.

Validation setup:

- Use real Pi TUI with the extension installed/enabled in an isolated disposable workspace or otherwise evidence-backed safe environment.
- For unattended execution, consume the launch/capture route from `ticket:20260523-real-pi-tui-automation-guardrails` and the fixture/observer handoff from `ticket:20260523-rule-promotion-tui-fixture-observer`.
- Prefer an existing real proposal such as the exact-edit-mismatch pattern if still available, or generate a harmless fixture pattern; do not read or index the operator's real Pi sessions just to create validation data.
- Capture terminal evidence via tmux pane snapshots, `PI_TUI_WRITE_LOG`, Pi session refs, or equivalent real-TUI artifacts.
- Use an observer only if it records bounded Flight Recorder rule-block facts or absence markers; do not preserve raw system prompts/provider payloads as evidence.

## Acceptance

- ACC-001: Real TUI evidence shows interactive proposal review and action selection without typing full proposal/action commands for each step.
  - Evidence: `.loom/evidence/...` with TUI transcript/snapshot refs.

- ACC-002: Real TUI evidence shows Make Rule draft review/edit/scope approval and records the resulting candidate/rule ID.
  - Evidence: evidence dossier with IDs and status output.

- ACC-003: A later Pi prompt/turn shows the approved rule is injected or otherwise visible as active guidance, bounded and with no raw evidence leakage.
  - Evidence: TUI/session evidence.

- ACC-004: Disabling the rule prevents further injection and status reflects disabled state.
  - Evidence: TUI/session evidence.

- ACC-005: Follow-up Ralph audit reviews the UX evidence, privacy boundary, approval semantics, prompt noise, and reversibility.
  - Evidence: `.loom/audit/...` with verdict and findings.

## Current State

Closed. Real interactive Pi TUI validation is recorded in `evidence:20260523-interactive-rule-promotion-real-tui-validation`, and follow-up audit `audit:20260523-interactive-rule-promotion-real-tui-review` returned `clear` within audited scope.

Closure claim supported:

- ACC-001: `02-proposal-select-pane.txt` and `03-action-select-pane.txt` show real Pi TUI proposal/action selection; Make Rule was selected by keyboard instead of fallback command choreography.
- ACC-002: `04-rule-draft-editor-pane.txt`, `05-rule-draft-edited-pane.txt`, `06-scope-select-pane.txt`, `07-approved-notification-pane.txt`, and `08-db-after-approval.json` show draft review/edit, global scope approval, candidate `rule_cand_f9de9dbea5029357`, and rule `rule_22b8d9a30a3d4d6c`.
- ACC-003: `11-observer-after-injection.ndjson` shows a bounded `Flight Recorder approved rules` block with `rule_22b8d9a30a3d4d6c` on a later prompt/turn.
- ACC-004: `12-disable-rule-pane.txt`, `14-observer-after-disable.ndjson`, `15-rules-status-disabled-pane.txt`, and `16-db-final.json` show disable, no further injection, disabled status, and injection count `1`.
- ACC-005: `audit:20260523-interactive-rule-promotion-real-tui-review` reviewed UX evidence, privacy boundary, approval semantics, prompt-injection visibility, and reversibility.

Residual limits remain explicit and outside this ticket: the run used explicit `-e dist/pi-extension.js` loading rather than installed-package `pi install`, used a synthetic fixture rather than real session data, and used a local no-network stub provider to trigger Pi lifecycle events rather than a hosted/real model provider. High-confidence live suggestion notification and long-run corpus tuning remain separate release limits.

## Journal

- 2026-05-23: Created ticket from `plan:20260523-reflection-rule-promotion-ux` to ensure the ask-user-question-style UX is proven in a real interactive Pi session before completion claims.
- 2026-05-23: Implementation dependencies reached automated review state, but this ticket remains blocked pending real interactive Pi TUI validation evidence.
- 2026-05-23: Audit `audit:20260523-interactive-rule-promotion-review` confirmed this ticket remains blocked until real TUI evidence is captured.
- 2026-05-23: First real TUI attempt showed action selection lacked proposal context; updated `/flight-review` choices/prompts to include title, summary, likely fix, confidence, and ID, with tests and validation re-run.
- 2026-05-23: Added `plan:20260523-automated-real-pi-tui-rule-promotion-validation` and prerequisite tickets for unattended real-TUI automation guardrails plus fixture/observer setup. This ticket remains blocked until those prerequisites close or are explicitly superseded with equivalent evidence.
- 2026-05-23: Set Status to `active` after both unattended prerequisite tickets closed with evidence. Beginning real interactive Pi TUI validation using isolated tmux, fixture data dir, `dist/pi-extension.js`, observer extension, and local stub provider.
- 2026-05-23: Ran real interactive Pi TUI validation through `/flight-review --data-dir <fixture> --min-count 2`; selected first proposal, selected Make Rule, edited draft, approved global scope, observed rule injection on later prompt, disabled rule, and observed no injection after disable.
- 2026-05-23: Recorded `evidence:20260523-interactive-rule-promotion-real-tui-validation` with pane captures, TUI write log, observer NDJSON, and DB inspections.
- 2026-05-23: Recorded follow-up audit `audit:20260523-interactive-rule-promotion-real-tui-review`; verdict `clear` within audited scope.
- 2026-05-23: Closed ticket. Acceptance ACC-001 through ACC-005 is satisfied; residual limits for installed-package smoke, real model-provider behavior, high-confidence suggestion notification, and long-run corpus tuning remain outside this ticket.
