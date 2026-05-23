# Interactive Rule Promotion TUI Validation

ID: ticket:20260523-interactive-rule-promotion-tui-validation
Type: Ticket
Status: blocked
Created: 2026-05-23
Updated: 2026-05-23
Risk: medium - real TUI behavior can differ from fake-Pi tests and determines whether the UX is actually usable
Priority: high - gates completion claims for interactive rule promotion
Depends On: ticket:20260523-flight-rules-management-export

## Summary

Validate the full interactive reflection-to-rule promotion flow in a real Pi TUI and record evidence. The closure claim is that the operator can use keyboard-driven Pi UI to review a real proposal, create/edit/approve a rule, see it affect a later turn, disable it, and trust the documented behavior.

## Related Records

- `plan:20260523-reflection-rule-promotion-ux` - owns the full interactive UX route and validation posture.
- `evidence:20260523-shared-watcher-validation` - prior real flow evidence that generated usable reflection patterns.
- `ticket:20260523-guided-reflection-action-flow` - proposal/action UI under validation.
- `ticket:20260523-guided-rule-draft-approval-flow` - rule draft/approval UI under validation.
- `ticket:20260523-approved-flight-rule-injection` - injection behavior under validation.
- `ticket:20260523-flight-rules-management-export` - disable/status/export behavior under validation.

- `audit:20260523-interactive-rule-promotion-review` - confirms this ticket remains the real-TUI blocker.

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

- Use real Pi TUI with the extension installed/enabled in the active workspace.
- Prefer an existing real proposal such as the exact-edit-mismatch pattern if still available, or generate a harmless fixture pattern.
- Capture terminal evidence via tmux pane snapshots or Pi session refs.

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

Blocked on real interactive Pi TUI smoke. Automated/fake-Pi implementation evidence exists in `evidence:20260523-interactive-rule-promotion-validation`, but this ticket's closure specifically requires real TUI evidence for proposal review, Make Rule draft/edit/scope approval, rule injection, disable, and follow-up audit.

## Journal

- 2026-05-23: Created ticket from `plan:20260523-reflection-rule-promotion-ux` to ensure the ask-user-question-style UX is proven in a real interactive Pi session before completion claims.
- 2026-05-23: Implementation dependencies reached automated review state, but this ticket remains blocked pending real interactive Pi TUI validation evidence.
- 2026-05-23: Audit `audit:20260523-interactive-rule-promotion-review` confirmed this ticket remains blocked until real TUI evidence is captured.
- 2026-05-23: First real TUI attempt showed action selection lacked proposal context; updated `/flight-review` choices/prompts to include title, summary, likely fix, confidence, and ID, with tests and validation re-run.
