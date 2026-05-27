# Flight Learn Focused Card Real Pi Validation Review

ID: audit:20260527-flight-learn-focused-card-real-pi-validation-review
Type: Audit
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Audited: 2026-05-27
Target: ticket:20260527-flight-learn-focused-card-real-pi-validation

## Summary

A bounded Ralph review audited the real installed Pi validation ticket, pane captures, TUI log, storage inspection, package install evidence, and build/package provenance. The first pass found one provenance gap for ACC-001; after provenance evidence was added, follow-up Ralph review cleared the ticket.

Verdict: `clear` after follow-up provenance evidence.

## Target

The audit targeted `ticket:20260527-flight-learn-focused-card-real-pi-validation`, especially acceptance claims ACC-001 through ACC-005 and the evidence represented by:

- `evidence:20260527-flight-learn-focused-card-real-pi-validation`
- `.loom/evidence/artifacts/20260527-flight-learn-focused-card-real-pi-validation/`
- build/install/provenance artifacts
- real TUI pane captures
- local DB inspection after route selection

## Audit Scope And Lenses

Scope:

- verify that package build/install/startup evidence identifies the local package loaded by Pi;
- verify real Pi/tmux pane captures show focused-card `/flight-learn` UI with representative data;
- verify active route and progressive evidence display are visible in the real UI;
- verify route selection hands off to `Why this follow-up?` and stores accepted but unapplied artifact candidates;
- verify command palette still shows only `/flight-status` and `/flight-learn`;
- challenge overclaims beyond project-local, offline, disposable real Pi validation.

Lenses:

- claim and evidence;
- real-Pi proof strength;
- stale package/path risk;
- command-surface safety;
- UX/visual hierarchy;
- route/storage safety;
- evidence limitations.

Out of scope:

- global/user-scope package install;
- hosted/real model-provider behavior;
- long-run corpus tuning;
- artifact outcome follow-up UI;
- all terminal/theme/key-protocol variants;
- final operator preference after hands-on use.

## Context And Evidence Reviewed

- Ralph review run, first pass: reviewed target ticket, evidence dossier, integration records/audit, UX/command/storage specs, split-pane baseline evidence, package/source snippets, and all named real-Pi artifacts. Returned `changes-needed` because ACC-001 package build identity evidence was under-specified.
- Ralph review run, follow-up pass: reviewed updated evidence dossier and `19-build-provenance.txt`. Returned `clear` after provenance evidence resolved the prior finding.
- `ticket:20260527-flight-learn-focused-card-real-pi-validation` - acceptance and scope under review.
- `evidence:20260527-flight-learn-focused-card-real-pi-validation` - validation dossier audited.
- `.loom/evidence/artifacts/20260527-flight-learn-focused-card-real-pi-validation/01-build.txt` - build output.
- `.loom/evidence/artifacts/20260527-flight-learn-focused-card-real-pi-validation/02-pi-install-output.txt` - local package install output.
- `.loom/evidence/artifacts/20260527-flight-learn-focused-card-real-pi-validation/05-startup-pane.txt` - TUI startup with `pi-extension.js` loaded.
- `.loom/evidence/artifacts/20260527-flight-learn-focused-card-real-pi-validation/06-command-palette-flight-pane.txt` - `/flight` command palette capture.
- `.loom/evidence/artifacts/20260527-flight-learn-focused-card-real-pi-validation/08-flight-learn-focused-card-default-pane.txt` - focused-card default view.
- `.loom/evidence/artifacts/20260527-flight-learn-focused-card-real-pi-validation/09-route-testcheck-selected-pane.txt` - active route capture.
- `.loom/evidence/artifacts/20260527-flight-learn-focused-card-real-pi-validation/10-expanded-evidence-pane.txt` - evidence expansion capture.
- `.loom/evidence/artifacts/20260527-flight-learn-focused-card-real-pi-validation/11-why-followup-editor-pane.txt` and `12-why-followup-editor-edited-pane.txt` - editor handoff captures.
- `.loom/evidence/artifacts/20260527-flight-learn-focused-card-real-pi-validation/13-after-route-submit-pane.txt` - route submission notification.
- `.loom/evidence/artifacts/20260527-flight-learn-focused-card-real-pi-validation/14-status-after-route-pane.txt` - post-route status.
- `.loom/evidence/artifacts/20260527-flight-learn-focused-card-real-pi-validation/17-db-after-route.json` - local DB inspection after route.
- `.loom/evidence/artifacts/20260527-flight-learn-focused-card-real-pi-validation/19-build-provenance.txt` - git/source/dist/package provenance.
- `ticket:20260527-flight-learn-focused-card-integration` and `audit:20260527-flight-learn-focused-card-integration-review` - prerequisite integration context.
- `spec:flight-learn-inbox-ux`, `spec:visible-command-surface`, and `spec:delta-artifact-learning-loop` - behavior and safety contracts.

## Findings

### FIND-001: Package build provenance initially under-specified for ACC-001

First-pass review found that the install/startup artifacts proved a local path install and extension load, but did not uniquely identify the built package code: build output lacked a git SHA, dirty status, dist hash, or focused-card fingerprint, and project settings pointed to a live repo path.

Disposition before closure: resolved by adding `.loom/evidence/artifacts/20260527-flight-learn-focused-card-real-pi-validation/19-build-provenance.txt`, which records:

- git commit `1fb7624b5b0273b2ff0c9f7ad8cb23bdcbd7c342` and dirty source state;
- `package.json` Pi extension declaration pointing at `./dist/pi-extension.js`;
- `dist/pi-extension.js` mtime/size and SHA-256 `6bc3f10e7a7580e808f5018d96ee827e78448cbf5502b0a1e113711c8cb3bfc9`;
- built focused-card fingerprints including `layout: "focused-card"`;
- temp project-local package setting and resolved installed package path `/Users/crlough/Code/personal/pi-flight-recorder`.

Follow-up Ralph review confirmed the finding was cleared for this ticket's scope.

## Verdict

`clear` after follow-up. ACC-001 through ACC-005 are supported for disposable project-local real Pi validation:

- ACC-001: build/install/startup/provenance evidence identifies the local package path, dist extension hash/fingerprint, and real TUI loading `pi-extension.js`.
- ACC-002: real TUI capture shows focused-card `/flight-learn` with representative pending data.
- ACC-003: real TUI capture shows obvious active `▶ [2] Test/check` route and evidence hidden/expanded through progressive disclosure.
- ACC-004: real TUI/editor/DB evidence shows `Why this follow-up?` handoff and accepted-but-unapplied `test-check` candidate with no rule records.
- ACC-005: command palette capture shows only `flight-status` and `flight-learn` for `/flight`.

The verdict does not claim global install, hosted model/provider behavior, long-run corpus behavior, artifact outcome UI, or all terminal/theme variants.

## Required Follow-up

None before this ticket can close.

Future release/handoff should continue to name the remaining limits: project-local install only, offline/no-provider run, and single tmux/xterm-256color terminal route.

## Residual Risk

- Operator preference after hands-on use remains unproven, though the real screenshot/PTY evidence is materially stronger than render/fake-Pi proof.
- Vertical route rows still use left/right route navigation; it was visible/tested but should be watched in continued live use.
- The worktree remains dirty with multiple related Loom/source changes; commit/handoff should preserve clear attribution across the focused-card tickets.

## Related Records

- `ticket:20260527-flight-learn-focused-card-real-pi-validation` - consuming ticket.
- `evidence:20260527-flight-learn-focused-card-real-pi-validation` - validation dossier audited.
- `plan:20260527-flight-learn-focused-card-redesign` - parent plan.
- `spec:flight-learn-inbox-ux` - intended UX contract.
- `spec:visible-command-surface` - command palette contract.
