# Release Readiness Follow-up Review

ID: audit:20260523-release-readiness-followup-review
Type: Audit
Status: recorded
Created: 2026-05-23
Updated: 2026-05-23
Audited: 2026-05-23
Target: ticket:20260523-post-real-tui-release-reconciliation, ticket:20260523-seamless-install-and-real-pi-smoke, ticket:20260523-high-confidence-suggestion-ux

## Summary

Ralph reviewed the post-real-TUI release reconciliation, disposable installed-package smoke, and high-confidence suggestion evidence. Verdict: `concerns` only for the high-confidence visible-notification rendering claim; docs and plan reconciliation are honest, and installed-package startup/status/capture/suggested-state claims are supported if kept narrow.

## Target

Review targets:

- `ticket:20260523-post-real-tui-release-reconciliation` - whether README/docs/plans were reconciled without stale blockers or overclaims.
- `ticket:20260523-seamless-install-and-real-pi-smoke` - whether installed-package/no-CLI startup and live capture/suggestion-state claims are supported.
- `ticket:20260523-high-confidence-suggestion-ux` - whether the evidence supports closing the real-TUI high-confidence notification gap.

## Audit Scope And Lenses

Lenses:

- claim and evidence;
- acceptance;
- installed-package versus `-e` extension loading boundary;
- fake/local provider versus hosted/real model-provider boundary;
- real TUI versus fake-Pi/local smoke boundary;
- docs overclaiming and stale blocker language;
- follow-through for partial high-confidence notification evidence.

Out of scope:

- hosted/real model-provider reflection;
- long-run corpus tuning;
- broad source-code review of suggestion rendering internals;
- global/user-scope Pi package install;
- changing product behavior to force notification persistence.

## Context And Evidence Reviewed

- Ralph review run: manual bounded review from the three target tickets, new evidence dossier, README/docs diff, plan-state diff, pane artifacts, and DB/status artifacts.
- `evidence:20260523-installed-package-high-confidence-smoke` - primary installed-package/high-confidence smoke dossier.
- `.loom/evidence/artifacts/20260523-installed-package-high-confidence-smoke/01-pi-install-output.txt` - `pi install <package> -l` success.
- `.loom/evidence/artifacts/20260523-installed-package-high-confidence-smoke/03-project-settings.json` - project-local package settings.
- `.loom/evidence/artifacts/20260523-installed-package-high-confidence-smoke/05-startup-pane.txt` - TUI extension list containing `pi-extension.js` without `--no-extensions`.
- `.loom/evidence/artifacts/20260523-installed-package-high-confidence-smoke/06-status-before-pane.txt` - installed extension `/flight-status` before tool call.
- `.loom/evidence/artifacts/20260523-installed-package-high-confidence-smoke/08-status-after-pane.txt` - real bash tool failure and post-turn status.
- `.loom/evidence/artifacts/20260523-installed-package-high-confidence-smoke/09-db-after.json` - occurrence persisted with `suggestion.kind=suggested` and confidence `0.82`.
- `.loom/evidence/artifacts/20260523-installed-package-high-confidence-smoke/07-after-toolcall-*s-pane.txt` and `tui-2026-05-23_19-13-59-2655.log` - checked for formatted notification text.
- `README.md`, `docs/first-run.md`, `docs/live-monitoring.md` - release-facing wording after reconciliation.
- `.loom/plans/20260523-automated-real-pi-tui-rule-promotion-validation.md` - completion state after child closure.
- `.loom/plans/20260523-reflection-rule-promotion-ux.md` - real-TUI blocker removal and review state.
- `.loom/plans/20260523-seamless-failure-memory-ux.md` - residual gap wording after smoke.
- `evidence:20260523-interactive-rule-promotion-real-tui-validation` and `audit:20260523-interactive-rule-promotion-real-tui-review` - support for removing guided-rule-promotion blocker wording.

## Findings

### FIND-001: High-confidence visible notification rendering is not captured

The installed-package/high-confidence smoke proves a real Pi `bash` tool failure was captured and the suggestion engine emitted suggested state (`emittedInWindow=1`, `last=ep_70da13e85de121ce`, DB `suggestion.kind=suggested`, confidence `0.82`). However, neither the interval pane captures nor the TUI write log contain the formatted notification text from `formatLiveSuggestion` (`Seen before`, `Prior fix`, or `likely match`).

Why it matters: this supports live suggestion decision/capture state in a real TUI but does not fully prove the visible notification UX. Closing `ticket:20260523-high-confidence-suggestion-ux` as though the formatted notification rendering was observed would overclaim.

Required disposition: keep the high-confidence ticket in `review` or record an explicitly narrower accepted closure claim. Release docs should preserve the partial limit unless a later run captures the formatted text or source review changes the acceptance boundary with authority.

## Verdict

`concerns` overall because of `FIND-001`, but no material findings against the installed-package smoke or post-real-TUI release reconciliation when their claims stay narrow.

Supported claims:

- Disposable project-local `pi install <package> -l` succeeded and the real TUI loaded `pi-extension.js` from package settings rather than Flight Recorder via `-e`.
- Installed extension `/flight-status` rendered in real TUI without CLI setup.
- A real Pi bash tool result was captured and persisted as a live occurrence.
- The suggestion decision state was high-confidence/suggested in status and DB.
- README/docs no longer claim guided Flight Rule promotion is blocked/unproven and correctly preserve real-provider, long-run corpus, and high-confidence notification-rendering limits.
- `plan:20260523-automated-real-pi-tui-rule-promotion-validation` completion is supported by closed child tickets and evidence/audit.
- `plan:20260523-reflection-rule-promotion-ux` correctly no longer presents real-TUI rule promotion as blocked, while avoiding broader completion overclaiming.

Unsupported if claimed:

- that the formatted high-confidence warning notification text visibly rendered in the terminal transcript;
- that the local helper provider proves hosted/real model-provider behavior;
- that source-checkout local smoke proves installed-package behavior.

## Required Follow-up

- `ticket:20260523-high-confidence-suggestion-ux` should remain `review` unless the consuming surface accepts a narrower closure claim or a later real-TUI run captures the formatted notification text.
- `ticket:20260523-seamless-install-and-real-pi-smoke` may close if it cites the installed-package/status/capture/suggested-state evidence narrowly and does not claim visible notification rendering.
- `ticket:20260523-post-real-tui-release-reconciliation` may close if it cites this audit and preserves the partial high-confidence limit.

## Residual Risk

- Local provider helper drove the tool call; this avoided network calls but does not prove model-provider behavior.
- Project-local package install was tested; global/user install remains unproven.
- TUI notification rendering may be transient, suppressed during tool-result handling, or simply uncaptured; source/UX follow-up is needed before claiming the visible notification path.
- Long-run corpus quality and real model-assisted reflection remain outside this review.

## Related Records

- `evidence:20260523-installed-package-high-confidence-smoke` - primary smoke evidence.
- `ticket:20260523-seamless-install-and-real-pi-smoke` - installed-package smoke owner.
- `ticket:20260523-high-confidence-suggestion-ux` - partial high-confidence notification owner.
- `ticket:20260523-post-real-tui-release-reconciliation` - docs/plan reconciliation owner.
- `evidence:20260523-interactive-rule-promotion-real-tui-validation` - supports real-TUI rule-promotion docs update.
- `audit:20260523-interactive-rule-promotion-real-tui-review` - prior clear audit for rule-promotion real-TUI proof.
