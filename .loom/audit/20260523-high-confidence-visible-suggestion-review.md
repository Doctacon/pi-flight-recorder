# High-Confidence Visible Suggestion Review

ID: audit:20260523-high-confidence-visible-suggestion-review
Type: Audit
Status: recorded
Created: 2026-05-23
Updated: 2026-05-23
Audited: 2026-05-23
Target: ticket:20260523-high-confidence-suggestion-ux

## Summary

Ralph reviewed the high-confidence visible suggestion source change, focused tests, and disposable installed-package real TUI evidence. Verdict: `clear` within audited scope; the prior visible-notification finding is resolved by a persistent Flight Recorder widget captured in real TUI pane artifacts.

## Target

`ticket:20260523-high-confidence-suggestion-ux`, specifically `ACC-004` and prior `audit:20260523-release-readiness-followup-review#FIND-001`.

Reviewed claim: high-confidence prior-resolved live suggestions now visibly render in a real interactive Pi TUI after a failed Pi `bash` tool result, without widening the product into model calls, autonomous fixes, or noisy low-confidence notifications.

## Audit Scope And Lenses

Lenses:

- claim and evidence;
- acceptance;
- visible UX proof versus internal suggested-state proof;
- scope control and interruption policy;
- installed-package versus `-e` loading boundary;
- fake/local provider versus hosted/real model-provider boundary;
- privacy/redaction boundaries.

Out of scope:

- hosted/real provider behavior;
- long-run corpus precision/noise tuning;
- global/user-scope Pi package install;
- broad source review outside the suggestion-display path.

## Context And Evidence Reviewed

- Ralph review run: manual bounded review from the high-confidence ticket, diff, focused tests, real TUI evidence, and release follow-up audit finding.
- `src/pi-extension-command-utils.ts` - `showLiveSuggestion()` calls `notify()` and `ctx.ui.setWidget("pi-flight-recorder-live-suggestion", ...)`.
- `src/pi-extension.ts` - high-confidence `decision.kind === "suggestion"` now uses `showLiveSuggestion()`.
- `src/pi-extension-types.ts` - optional `setWidget` UI type added.
- `src/pi-extension.test.ts` - fake-Pi test asserts both notification text and widget text include `Seen before` and `Prior fix`.
- Command output: `npm run typecheck` passed.
- Command output: `npm test -- src/pi-extension.test.ts src/local-smoke.test.ts` passed, 2 files / 16 tests.
- Command output: `npm run build` passed.
- Command output: `npm pack --dry-run` reported total files 74.
- `evidence:20260523-high-confidence-visible-suggestion-tui` - primary evidence dossier.
- `.loom/evidence/artifacts/20260523-high-confidence-visible-suggestion-tui/07-after-toolcall-01s-pane.txt` through `07-after-toolcall-15s-pane.txt` - visible suggestion widget captured repeatedly.
- `.loom/evidence/artifacts/20260523-high-confidence-visible-suggestion-tui/08-status-after-pane.txt` - status corroborates suggested state.
- `.loom/evidence/artifacts/20260523-high-confidence-visible-suggestion-tui/09-db-after.json` - DB occurrence has `suggestion.kind=suggested` and confidence `0.82`.
- `audit:20260523-release-readiness-followup-review#FIND-001` - prior gap being challenged.

## Findings

None - no material findings within audited scope.

## Verdict

`clear` within audited scope.

The evidence now supports the exact claim that was previously missing: the formatted high-confidence suggestion text is visible in a real interactive Pi TUI artifact. `07-after-toolcall-01s-pane.txt` through `07-after-toolcall-15s-pane.txt` show `⚠ Seen before: likely match (0.82)`, `Prior fix: Validation passed: npm test`, evidence refs, and limits after a real Pi `bash` tool result. Status and DB evidence corroborate that this was a suggested live occurrence rather than a manually printed message.

The source change stays inside the ticket boundary: it only adds a persistent widget for already-approved high-confidence suggestion decisions; it does not change matching thresholds, model behavior, source mutation, or low-confidence notification behavior. The local helper provider remains properly bounded as a deterministic no-network trigger for Pi tool execution, not provider proof.

## Required Follow-up

No required follow-up blocks closure of `ticket:20260523-high-confidence-suggestion-ux` within its scoped acceptance claim.

Keep separate residual limits visible for:

- hosted/real provider reflection;
- long-run corpus precision/noise tuning;
- global/user-scope Pi package install.

## Residual Risk

- The widget persists until replaced/cleared by future UI behavior; this appears acceptable because high-confidence suggestions are rare and gated, but future UX tuning may add an explicit dismiss/clear command if users find it sticky.
- The real TUI smoke used temp paths, so the suggestion included a cross-cwd limit due temp-path redaction/canonicalization. Unit tests still cover same-cwd suggestions; this audit did not review broader cwd-normalization behavior.
- The provider was local deterministic helper code; no hosted model behavior was tested.

## Related Records

- `ticket:20260523-high-confidence-suggestion-ux` - consuming ticket.
- `evidence:20260523-high-confidence-visible-suggestion-tui` - audited evidence.
- `audit:20260523-release-readiness-followup-review#FIND-001` - prior concern superseded in this scope.
- `evidence:20260523-installed-package-high-confidence-smoke` - prior partial smoke.
