# Audit: Interactive Rule Promotion UX Review

Date: 2026-05-23
Auditor: Ralph (bounded Pi review, read-only)
Scope: `plan:20260523-reflection-rule-promotion-ux` implementation and validation evidence.

## Inputs Reviewed

- `.loom/plans/20260523-reflection-rule-promotion-ux.md`
- child tickets named by the plan
- `.loom/evidence/20260523-interactive-rule-promotion-validation.md`
- `src/storage.ts`
- `src/flight-rules.ts`
- `src/interactive-review.ts`
- `src/pi-extension.ts`
- `src/storage.test.ts`
- `src/flight-rules.test.ts`
- `src/interactive-review.test.ts`
- `src/pi-extension.test.ts`
- `README.md`
- `docs/first-run.md`
- `docs/live-monitoring.md`

## Verdict

`concerns`

No material code blockers were found in the reviewed/fixed automated scope, but the plan should not close because real Pi TUI validation is still explicitly absent.

## Prior Finding Disposition

- Project scope path boundary: cleared. `src/storage.ts` uses `path.relative` via `cwdIsInsideProject`; tests cover `/repo/subdir` matching and `/repo2` not matching.
- Reject disabling active rules: cleared. `rejectRuleCandidate()` disables linked `flight_rules`; tests verify rejected approved candidates no longer inject through active lookup.
- Cluster `make-rule` docs/behavior: cleared enough. `/flight-feedback --action make-rule --cluster ...` can synthesize/lookup a proposal and create a draft candidate.
- Interactive cancel durable state: cleared in source, partially covered in tests. `handleMakeRuleProposal()` does not create candidate/feedback until after editor + scope selection; tests cover editor cancellation with no candidate/no `make-rule` feedback. Minor residual: edited-draft then scope-cancel branch is not separately tested.
- Test coverage: acceptable for automated/fake-Pi implementation scope. Remaining gaps are representative, not blockers for implementation review.

## Evidence Gaps

- `.loom/evidence/20260523-interactive-rule-promotion-validation.md` is automated/fake-Pi only.
- `ticket:20260523-interactive-rule-promotion-tui-validation` remains blocked and acceptance requires real TUI proposal review, make/edit/approve, later injection, disable, and audit.
- Docs are adequate for basics but thin on export options, rule state meanings, and project/global scope behavior.

## Residual Risks

- Real Pi `ctx.ui.select/editor` ergonomics and keyboard flow are unproven.
- Prompt-injection UX/noise is only fake-event tested.
- Project-root matching is lexical path-boundary matching; symlink/case edge cases are not covered.
- Noninteractive project-scope approval depends on available cwd; redacted evidence paths are not a reliable internal project root.

## Suggested Disposition

- The following tickets may move to accepted/closed if the operator accepts automated evidence: `ticket:20260523-rule-candidate-data-model`, `ticket:20260523-interactive-review-ui-primitives`, `ticket:20260523-guided-reflection-action-flow`, `ticket:20260523-guided-rule-draft-approval-flow`, `ticket:20260523-approved-flight-rule-injection`, `ticket:20260523-flight-rules-management-export`.
- Keep `ticket:20260523-interactive-rule-promotion-tui-validation` blocked/open.
- Keep `plan:20260523-reflection-rule-promotion-ux` active until real TUI evidence is recorded, or explicitly re-scope the plan to automated implementation complete with real TUI validation deferred.
