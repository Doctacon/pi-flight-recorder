# Flight Learn Focused Card Real Pi Validation

ID: ticket:20260527-flight-learn-focused-card-real-pi-validation
Type: Ticket
Status: closed
Created: 2026-05-27
Updated: 2026-05-27
Risk: medium - validates an installed interactive Pi TUI workflow where fake-Pi/render evidence has historically been insufficient.
Priority: medium - must happen before release-quality visual claims, but only after production integration lands.
Depends On: ticket:20260527-flight-learn-focused-card-integration

## Summary

Validate the focused-card `/flight-learn` pending-delta UI in a real installed Pi session. Fake-Pi and render artifacts are useful but cannot prove the actual interactive TUI, command palette, package install, theme, terminal, and editor handoff experience. This ticket captures the real visual proof and records any remaining UX gaps honestly.

Single closure claim: a real interactive Pi run shows the focused-card `/flight-learn` UI with representative pending deltas, and the evidence records whether it solves the split-pane readability problem without regressing command surface or safe route behavior.

## Related Records

- `plan:20260527-flight-learn-focused-card-redesign` - owns this ticket as the real-Pi proof milestone.
- `ticket:20260527-flight-learn-focused-card-integration` - prerequisite production integration.
- `spec:flight-learn-inbox-ux` - visual behavior contract and evidence expectations.
- `spec:visible-command-surface` - command palette expectations.
- `evidence:20260527-flight-learn-split-pane-ux-feedback` - baseline screenshots that motivated the redesign.
- Prior real Pi evidence under `.loom/evidence/artifacts/20260523-*` - shows the standard for distinguishing real TUI proof from fake-Pi/render proof.

## Scope

In scope:

- Build the package from the repository state that includes the focused-card integration.
- Install it into Pi using the local package/install path appropriate for this repo.
- Fully restart Pi so stale extension code is not reused.
- Seed or use representative pending delta data locally without hosted/model-provider calls.
- Verify typing `/flight` shows only `/flight-status` and `/flight-learn` in normal mode when practical.
- Run `/flight-learn` and capture real screenshot/ANSI/PTY/log evidence of the focused-card UI.
- Verify active route visibility, evidence expansion, route-selected handoff to `Why this follow-up?`, and candidate-only storage behavior when practical.
- Record honest limitations and follow-up tickets for issues found.

Out of scope:

- Implementing redesign fixes beyond very small evidence-harness adjustments. If the live UI is still not good enough, record the failure and route a new implementation ticket.
- Hosted/model-provider reflection, classifier tuning, long-run corpus evaluation, or global/user-scope install certification.
- Artifact outcome follow-up custom UI unless the integration ticket explicitly added it.

Likely read scope:

- Build/install docs and package scripts.
- Prior real Pi validation evidence.
- Source/tests only as needed to seed representative data or inspect storage results.

Likely write scope:

- `.loom/evidence/artifacts/20260527-flight-learn-focused-card-real-pi-validation/`
- `.loom/evidence/20260527-flight-learn-focused-card-real-pi-validation.md`
- this ticket's Current State/Journal
- follow-up ticket(s) only if validation reveals bounded implementation work.

Stop conditions:

- If local install or Pi restart cannot be completed, record the blocker instead of substituting fake-Pi proof.
- If stale extension code appears, investigate install path/package duplication before judging the UI.
- If the live UI still resembles the split-pane/table problem or the active route remains hard to see, do not claim success; record screenshots and route follow-up work.
- If candidate storage behavior appears to auto-apply artifacts or mutate source/Loom/docs/rules, stop and escalate as a safety regression.

## Acceptance

- ACC-001: Real Pi startup/install evidence identifies the package build used for validation and shows the extension loaded after restart.
  - Evidence: install output, startup pane/log, and environment notes under `.loom/evidence/artifacts/20260527-flight-learn-focused-card-real-pi-validation/`.
  - Audit: challenge stale package/path risk if evidence is ambiguous.

- ACC-002: A real interactive screenshot or ANSI/PTY log shows the focused-card `/flight-learn` pending-delta UI with representative data.
  - Evidence: screenshot or terminal capture attached to the evidence dossier.
  - Audit: compare against `evidence:20260527-flight-learn-split-pane-ux-feedback` and `spec:flight-learn-inbox-ux#SCN-006`.

- ACC-003: The active route is visibly obvious in the real UI, and evidence/signals/provenance do not dominate the default screen.
  - Evidence: screenshot/ANSI capture plus short observation notes.
  - Audit: visual review should challenge whether this is actually a +10 improvement or another +1 polish pass.

- ACC-004: Route selection still hands off to the `Why this follow-up?` editor and stores an accepted but unapplied artifact candidate when completed.
  - Evidence: screenshot/log of editor handoff and local storage inspection with sensitive data redacted.
  - Audit: challenge no-auto-apply semantics.

- ACC-005: Normal command surface remains `/flight-status` and `/flight-learn` only, or any inability to verify the palette is explicitly recorded.
  - Evidence: command palette screenshot/PTY capture or an honest limitation note.
  - Audit: challenge whether visible command clutter was reintroduced.

## Current State

Closed. A disposable project-local installed-package real Pi run validated the focused-card `/flight-learn` pending-delta UI in tmux with representative local fixture data.

What was observed:

- `npm run build` completed before validation;
- `pi install /Users/crlough/Code/personal/pi-flight-recorder -l` succeeded in a disposable workspace;
- a fresh real Pi TUI launched with disposable `HOME`, agent/session/data dirs, offline/no-provider settings, and `PI_TUI_WRITE_LOG`;
- startup pane showed `[Extensions] pi-extension.js`;
- typing `/flight` showed only `flight-status` and `flight-learn`;
- `/flight-learn --data-dir <temp-data-dir>` opened the focused-card view with `Flight Learn — Issue 1 of 2`, not the split-pane table;
- pressing `2` made `▶ [2] Test/check` obvious;
- pressing `v` expanded concise evidence refs while keeping the primary diagnosis and route visible;
- pressing `Enter` opened Pi's normal `Why this follow-up?` editor;
- submitting the reason stored an accepted `test-check` artifact candidate with `applied=false` and zero rule records.

Evidence:

- `evidence:20260527-flight-learn-focused-card-real-pi-validation`
  - build/install/startup artifacts;
  - command palette pane capture;
  - focused-card pane capture;
  - route/evidence/editor/submission/status pane captures;
  - local DB inspection;
  - raw TUI write log;
  - build/package provenance artifact.

Audit:

- `audit:20260527-flight-learn-focused-card-real-pi-validation-review` verdict `clear` after follow-up.
- First audit pass found package-build provenance under-specified for ACC-001; this was resolved by adding `19-build-provenance.txt` with git/source/dist/package path and hash evidence.

Residual limits:

- project-local install only, not global/user-scope install;
- offline/no-provider slash-command validation only, not hosted/real model-provider behavior;
- one tmux/xterm-256color terminal route, not all terminal/theme variants;
- artifact outcome follow-up custom UI remains out of scope;
- operator hands-on preference after continued use remains to be learned.

## Journal

- 2026-05-27: Created ticket from `plan:20260527-flight-learn-focused-card-redesign` to keep real interactive Pi proof separate from fake-Pi/render validation.
- 2026-05-27: Marked current state ready after `ticket:20260527-flight-learn-focused-card-integration` closed; real Pi proof is the next honest validation step.
- 2026-05-27: Set Status `active` and began disposable installed-package real Pi validation.
- 2026-05-27: Built package, installed it with disposable project-local `pi install -l`, seeded representative pending deltas, launched real Pi in tmux, captured command palette/focused-card/route/evidence/editor/status panes, inspected DB state, and recorded evidence in `evidence:20260527-flight-learn-focused-card-real-pi-validation`.
- 2026-05-27: Ran bounded Ralph audit. First pass required stronger package build provenance for ACC-001; added `19-build-provenance.txt`, reran audit, and recorded `audit:20260527-flight-learn-focused-card-real-pi-validation-review` with verdict `clear`.
- 2026-05-27: Closed ticket with real Pi project-local proof and limitations preserved.
