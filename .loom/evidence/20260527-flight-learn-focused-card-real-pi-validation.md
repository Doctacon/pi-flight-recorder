# Flight Learn Focused Card Real Pi Validation

ID: evidence:20260527-flight-learn-focused-card-real-pi-validation
Type: Evidence Dossier
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Observed: 2026-05-27

## Summary

This dossier records real installed Pi TUI validation for `ticket:20260527-flight-learn-focused-card-real-pi-validation`. A disposable project-local `pi install -l` loaded `pi-extension.js`, `/flight` showed only `/flight-status` and `/flight-learn`, `/flight-learn` opened the focused-card pending-delta UI with representative local fixture data, route selection handed off to the normal `Why this follow-up?` editor, and local storage recorded an accepted but unapplied artifact candidate.

## Observations

- Observation: source was built before real Pi validation.
  - Procedure/source: `npm run build` from repository root.
  - Actual result: build completed through `tsc -p tsconfig.build.json`. Output is preserved in `.loom/evidence/artifacts/20260527-flight-learn-focused-card-real-pi-validation/01-build.txt`.

- Observation: additional package/build provenance identifies the installed path and focused-card dist fingerprint.
  - Procedure/source: after the real Pi run, gathered `git rev-parse HEAD`, `git status --short`, `package.json` Pi extension declaration, `stat` and SHA-256 for `dist/pi-extension.js`, focused-card string fingerprints from built `dist/flight-learn-inbox.js`, temp project settings, and resolved package path.
  - Actual result: `.loom/evidence/artifacts/20260527-flight-learn-focused-card-real-pi-validation/19-build-provenance.txt` records commit `1fb7624b5b0273b2ff0c9f7ad8cb23bdcbd7c342`, dirty source state including the focused-card source/test files, `dist/pi-extension.js` SHA-256 `6bc3f10e7a7580e808f5018d96ee827e78448cbf5502b0a1e113711c8cb3bfc9`, built focused-card fingerprints including `layout: "focused-card"`, and resolved installed package path `/Users/crlough/Code/personal/pi-flight-recorder`.

- Observation: disposable project-local Pi package install succeeded.
  - Procedure/source: from a temporary workspace with disposable `HOME`, `PI_CODING_AGENT_DIR`, and `PI_CODING_AGENT_SESSION_DIR`, ran `pi install /Users/crlough/Code/personal/pi-flight-recorder -l`.
  - Actual result: `.loom/evidence/artifacts/20260527-flight-learn-focused-card-real-pi-validation/02-pi-install-output.txt` shows `Installed /Users/crlough/Code/personal/pi-flight-recorder`; `.loom/evidence/artifacts/20260527-flight-learn-focused-card-real-pi-validation/04-project-settings.json` contains the project-local package path.

- Observation: representative pending-delta data was seeded locally without hosted/model-provider calls.
  - Procedure/source: `.loom/evidence/artifacts/20260527-flight-learn-focused-card-real-pi-validation/seed-focused-card-fixture.mjs` imported built local storage code and wrote to the disposable data dir.
  - Actual result: `.loom/evidence/artifacts/20260527-flight-learn-focused-card-real-pi-validation/03-seed-output.json` shows 2 expectation deltas and 2 detector signals in the temp database.

- Observation: real interactive Pi TUI started in tmux and loaded the installed extension.
  - Procedure/source: fresh tmux session from disposable workspace with `PI_OFFLINE=1`, disposable Pi dirs, `PI_TUI_WRITE_LOG`, `--offline`, `--no-skills`, `--no-prompt-templates`, `--no-context-files`, `--no-session`, and `--no-tools`.
  - Actual result: `.loom/evidence/artifacts/20260527-flight-learn-focused-card-real-pi-validation/05-startup-pane.txt` shows `pi v0.75.5` and `[Extensions] pi-extension.js`. `run-env.txt` records `forced_kill=false` after `/quit`.

- Observation: normal command palette surface remained two commands.
  - Procedure/source: typed `/flight` in the real TUI and captured the pane before executing a command.
  - Actual result: `.loom/evidence/artifacts/20260527-flight-learn-focused-card-real-pi-validation/06-command-palette-flight-pane.txt` shows only:
    - `flight-status  [p] Show pi-flight-recorder status; ...`
    - `flight-learn   [p] Guided learning inbox; ...`

- Observation: `/flight-learn --data-dir <temp-data-dir>` opened the focused-card UI in real Pi.
  - Procedure/source: after clearing the command palette input, typed `/flight-learn --data-dir <temp-data-dir>` and captured the pane.
  - Actual result: `.loom/evidence/artifacts/20260527-flight-learn-focused-card-real-pi-validation/08-flight-learn-focused-card-default-pane.txt` shows `Flight Learn — Issue 1 of 2`, primary sections `Issue`, `What happened?`, `Why it matters`, `Expected`, `Why suggested`, `Evidence`, and vertical `Choose a follow-up` rows. It does not show the old split-pane `Pending deltas` / `Selected delta` table.

- Observation: active route visibility worked in the real UI.
  - Procedure/source: pressed `2` in the custom UI and captured the pane.
  - Actual result: `.loom/evidence/artifacts/20260527-flight-learn-focused-card-real-pi-validation/09-route-testcheck-selected-pane.txt` shows `▶ [2] Test/check` with the route description immediately below it.

- Observation: evidence expansion worked in the real UI and remained visually secondary until requested.
  - Procedure/source: pressed `v` in the custom UI and captured the pane.
  - Actual result: `.loom/evidence/artifacts/20260527-flight-learn-focused-card-real-pi-validation/10-expanded-evidence-pane.txt` shows three concise evidence refs under the `Evidence` section, while the primary diagnosis and selected route remain visible.

- Observation: route selection handed off to Pi's normal editor titled `Why this follow-up?`.
  - Procedure/source: pressed `Enter` while `Test/check` was selected, then captured the pane.
  - Actual result: `.loom/evidence/artifacts/20260527-flight-learn-focused-card-real-pi-validation/11-why-followup-editor-pane.txt` shows the normal editor with title `Why this follow-up?` and prefill `I chose Test/check because ...`. `.loom/evidence/artifacts/20260527-flight-learn-focused-card-real-pi-validation/12-why-followup-editor-edited-pane.txt` shows the edited reason before submission.

- Observation: submitting the reason stored an accepted but unapplied artifact candidate and did not create/apply rules.
  - Procedure/source: submitted the editor, captured notification/status panes, and inspected the local SQLite store using `.loom/evidence/artifacts/20260527-flight-learn-focused-card-real-pi-validation/inspect-db-after-route.mjs`.
  - Actual result: `.loom/evidence/artifacts/20260527-flight-learn-focused-card-real-pi-validation/13-after-route-submit-pane.txt` shows `Artifact candidate: artifact_cand_186d8a1a7d21cdd0 [accepted; applied=false]` and `No artifact was created or applied.` `.loom/evidence/artifacts/20260527-flight-learn-focused-card-real-pi-validation/17-db-after-route.json` shows the routed delta, one `test-check` artifact candidate with `status: accepted`, `applied: false`, `evidenceRefCount: 3`, `ruleCandidates: 0`, and `flightRules: 0`.

- Observation: `/flight-status --data-dir <temp-data-dir>` rendered post-route local state in the real TUI.
  - Procedure/source: after route submission, typed `/flight-status --data-dir <temp-data-dir>` and captured the pane.
  - Actual result: `.loom/evidence/artifacts/20260527-flight-learn-focused-card-real-pi-validation/14-status-after-route-pane.txt` shows `Deltas: pending=1, artifact candidates=1`, `Flight Rules: active=0, pending=0`, and privacy text stating local SQLite/no model calls by default.

- Observation: raw TUI output was captured.
  - Procedure/source: `PI_TUI_WRITE_LOG` was set to the disposable run's `tui-logs` directory.
  - Actual result: `.loom/evidence/artifacts/20260527-flight-learn-focused-card-real-pi-validation/16-tui-log-dir-listing.txt` lists `tui-2026-05-26_20-12-47-33034.log`, copied into the artifact directory.

## Artifacts

Artifact directory:

```text
.loom/evidence/artifacts/20260527-flight-learn-focused-card-real-pi-validation/
```

Key artifacts:

- `01-build.txt` - build output.
- `02-pi-install-output.txt` - disposable project-local `pi install -l` output.
- `03-seed-output.json` - local fixture seed result.
- `04-project-settings.json` - temp workspace package settings.
- `05-startup-pane.txt` - real TUI startup pane showing installed extension loaded.
- `06-command-palette-flight-pane.txt` - real command palette capture for `/flight`.
- `08-flight-learn-focused-card-default-pane.txt` - focused-card default view.
- `09-route-testcheck-selected-pane.txt` - active route capture.
- `10-expanded-evidence-pane.txt` - evidence expansion capture.
- `11-why-followup-editor-pane.txt` - editor handoff capture.
- `12-why-followup-editor-edited-pane.txt` - edited rationale capture.
- `13-after-route-submit-pane.txt` - post-submit notification capture.
- `14-status-after-route-pane.txt` - post-route status capture.
- `17-db-after-route.json` - local storage inspection after route.
- `19-build-provenance.txt` - git/source/dist/package provenance for the local path build loaded by Pi.
- `run-env.txt` - sanitized launch metadata.
- `tui-2026-05-26_20-12-47-33034.log` - raw TUI write log copied from the disposable run.

Key focused-card excerpt:

```text
Flight Learn — Issue 1 of 2
2 pending · 3 evidence refs · ↑/↓ changes issue

Issue
 bash cd /Users/<user>/Code/personal/pi-flight-recorder && npm run build from stale panes

What happened?
 Observed 2 related failure occurrences where validation commands ran from a stale shell context after package reinstall.

Why it matters
 Repeated local friction across tools and cwd setup makes release validation slower and harder to trust.

Expected
 unknown — press e to add what should have happened

Evidence
 3 refs hidden by default — press v to view concise refs.

Choose a follow-up
▶ [1] Code legibility
 Create a refactor/readability route when code shape causes repeated confusion
 [2] Test/check
 Route to a missing or weak validation check
```

## What This Shows

- `ticket:20260527-flight-learn-focused-card-real-pi-validation#ACC-001` - supports - build/install/startup/provenance artifacts identify the local package path, dist extension declaration/hash, focused-card built code fingerprint, disposable project-local install, and real TUI loading `pi-extension.js` after launch.
- `ticket:20260527-flight-learn-focused-card-real-pi-validation#ACC-002` - supports - real TUI pane captures show the focused-card `/flight-learn` UI with representative fixture data.
- `ticket:20260527-flight-learn-focused-card-real-pi-validation#ACC-003` - supports - route capture shows `▶ [2] Test/check` with visible description; default pane keeps evidence hidden by default and secondary to the diagnosis.
- `ticket:20260527-flight-learn-focused-card-real-pi-validation#ACC-004` - supports - editor handoff, notification, status pane, and DB inspection show accepted `test-check` artifact candidate with `applied=false`, preserved evidence, and no rule records.
- `ticket:20260527-flight-learn-focused-card-real-pi-validation#ACC-005` - supports - command palette capture for `/flight` shows only `/flight-status` and `/flight-learn` as the visible Flight Recorder commands.

## What This Does Not Show

- It does not prove hosted/real model-provider behavior. The run intentionally used offline/no-provider mode and only extension slash commands.
- It does not prove global/user-scope package install; it proves disposable project-local `pi install <package> -l`.
- It does not prove long-run corpus precision/noise tuning.
- It does not validate artifact outcome follow-up custom UI.
- It does not prove every terminal/theme/key-protocol variant. It proves this tmux/xterm-256color real Pi route.
- It does not by itself prove the operator will prefer this UI after hands-on use; it provides real TUI evidence for review.

## Related Records

- `ticket:20260527-flight-learn-focused-card-real-pi-validation` - ticket under validation.
- `ticket:20260527-flight-learn-focused-card-integration` - production integration prerequisite.
- `plan:20260527-flight-learn-focused-card-redesign` - parent plan.
- `spec:flight-learn-inbox-ux` - visual behavior contract.
- `spec:visible-command-surface` - command-surface contract.
- `evidence:20260527-flight-learn-split-pane-ux-feedback` - baseline screenshots that motivated the focused-card redesign.
