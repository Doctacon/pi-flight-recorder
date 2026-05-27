# Flight Learn Diagnosis Real Pi Validation

ID: evidence:20260527-flight-learn-diagnosis-real-pi-validation
Type: Evidence Dossier
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Observed: 2026-05-27

## Summary

This dossier records real installed Pi TUI validation for `ticket:20260527-flight-learn-diagnosis-real-pi-validation`. A disposable project-local `pi install -l` loaded `pi-extension.js`; `/flight` showed only `/flight-status` and `/flight-learn`; `/flight-learn` opened the focused-card UI with a screenshot-shaped raw-command fixture; the primary card showed a plain-English `Problem`, `What happened?`, and wrapped `Why it matters`; raw command/provenance details remained secondary; evidence expansion worked; route selection opened Pi's normal `Why this follow-up?` editor; and local storage recorded an accepted but unapplied artifact candidate.

## Observations

- Observation: current package built before real Pi validation.
  - Procedure: `npm run build` from repository root.
  - Result: build completed through `npm run clean && tsc -p tsconfig.build.json` without errors.
  - Artifact: `.loom/evidence/artifacts/20260527-flight-learn-diagnosis-real-pi-validation/01-build.txt`.

- Observation: disposable project-local Pi install succeeded.
  - Procedure: in a temporary workspace with disposable `HOME`, `PI_CODING_AGENT_DIR`, and `PI_CODING_AGENT_SESSION_DIR`, ran `pi install /Users/crlough/Code/personal/pi-flight-recorder -l`.
  - Result: install output shows `Installed /Users/crlough/Code/personal/pi-flight-recorder`; temp project settings point to that package path.
  - Artifacts: `02-pi-install-output.txt`, `04-project-settings.json`.

- Observation: representative fixture data was seeded locally.
  - Procedure: `seed-diagnosis-fixture.mjs` imported built local storage code and wrote two pending expectation deltas to the disposable data dir. The first/most recent delta matched the operator screenshot shape: raw command summary, reflection-cluster reality text, raw command evidence, and detector signal.
  - Result: `03-seed-output.json` shows `delta_realpi_plain_english_raw` as candidate with two evidence refs, plus a secondary queue item.

- Observation: real interactive Pi TUI launched in tmux and loaded the installed extension.
  - Procedure: launched Pi from the temp workspace with disposable dirs, `PI_OFFLINE=1`, `PI_TUI_WRITE_LOG`, `--offline`, `--no-skills`, `--no-prompt-templates`, `--no-context-files`, `--no-session`, and `--no-tools`.
  - Result: startup pane shows `pi v0.75.5` and `[Extensions] pi-extension.js`; run env records `forced_kill=false` after `/quit`.
  - Artifacts: `05-startup-pane.txt`, `run-env.txt`.

- Observation: `/flight` command palette still showed only two Flight Recorder commands.
  - Procedure: typed `/flight` in the real TUI and captured the pane.
  - Result: command palette showed only `flight-status` and `flight-learn`.
  - Artifact: `06-command-palette-flight-pane.txt`.

- Observation: `/flight-learn --data-dir <temp-data-dir>` opened the plain-English diagnosis focused card in real Pi.
  - Procedure: typed `/flight-learn --data-dir <temp-data-dir>` and captured the pane.
  - Result: pane shows `Flight Learn — Issue 1 of 2`, then primary sections:
    - `Problem` / `A validation command failed repeatedly in this project.`
    - `What happened?` / `Pi saw the same validation-failure pattern twice in recent sessions.`
    - `Why it matters` / wrapped across two lines: `Repeated validation friction makes it harder to trust whether the latest code` / `actually passed.`
    - `Expected` / `unknown — press e to add what should have happened`
  - Artifact: `08-flight-learn-diagnosis-default-pane.txt`.

- Observation: raw command/provenance detail remained secondary by default.
  - Procedure: inspected the default pane.
  - Result: raw command text appears under `Raw clue`, after the primary diagnosis sections. Reflection-cluster provenance appears under `Why suggested`. Evidence is collapsed by default as `2 refs hidden by default — press v to view concise refs.`
  - Artifact: `08-flight-learn-diagnosis-default-pane.txt`.

- Observation: evidence expansion worked and kept the diagnosis visible.
  - Procedure: pressed `v` and captured the pane.
  - Result: evidence refs appeared under `Evidence`, while `Problem`, `What happened?`, `Why it matters`, `Raw clue`, and follow-up rows remained visible.
  - Artifact: `09-expanded-evidence-pane.txt`.

- Observation: route selection highlighted the active route and editor handoff worked.
  - Procedure: pressed `2`, captured active route pane, pressed `Enter`, captured editor pane, edited the reason, and submitted.
  - Result: route pane shows `▶ [2] Test/check`; editor pane shows Pi's normal editor titled `Why this follow-up?`; edited reason was submitted.
  - Artifacts: `10-route-testcheck-selected-pane.txt`, `11-why-followup-editor-pane.txt`, `12-why-followup-editor-edited-pane.txt`.

- Observation: route submission stored an accepted but unapplied candidate and did not create/apply rules.
  - Procedure: captured post-submit notification, ran `/flight-status --data-dir <temp-data-dir>`, and inspected the SQLite store with `inspect-db-after-route.mjs`.
  - Result: notification says `Artifact candidate: artifact_cand_a5abc3c0bc0cea01 [accepted; applied=false]` and `No artifact was created or applied.` DB inspection shows one `test-check` artifact candidate with `status: accepted`, `applied: false`, `evidenceRefCount: 2`, `ruleCandidates: 0`, and `flightRules: 0`.
  - Artifacts: `13-after-route-submit-pane.txt`, `14-status-after-route-pane.txt`, `17-db-after-route.json`.

- Observation: package/build provenance identifies the loaded local path and diagnosis-focused dist fingerprint.
  - Procedure: after the real Pi run, gathered git commit/status, package extension declaration, `dist/pi-extension.js` and `dist/flight-learn-inbox.js` stat/hash, focused diagnosis fingerprints from built dist, temp project settings, and resolved installed package path.
  - Result: `18-build-provenance.txt` records commit `bce5e9da4979e60bcb94bc4b7785991c33fbf5f5`, dirty state for current tickets, `dist/flight-learn-inbox.js` fingerprint lines including `buildFlightLearnDiagnosisView`, `FOCUSED_PRIMARY_PROSE_WIDTH`, `Raw clue`, `Problem`, and `layout: "focused-card"`, plus resolved package path `/Users/crlough/Code/personal/pi-flight-recorder`.

- Observation: raw TUI output was captured.
  - Procedure: `PI_TUI_WRITE_LOG` was set to the disposable run's `tui-logs` directory and the log was copied into the artifact directory.
  - Result: `16-tui-log-dir-listing.txt` lists `tui-2026-05-26_21-31-44-37760.log`.

## Key Pane Excerpt

```text
Flight Learn — Issue 1 of 2
2 pending · 2 evidence refs · ↑/↓ changes issue

Problem
 A validation command failed repeatedly in this project.

What happened?
 Pi saw the same validation-failure pattern twice in recent sessions.

Why it matters
 Repeated validation friction makes it harder to trust whether the latest code
 actually passed.

Expected
 unknown — press e to add what should have happened

Raw clue
 Repeated failure pattern: bash cd /Users/<user>/Code/personal/pi-flight-recorder &&
 npm test > pi-flight-recorder.log
```

## Artifacts

Artifact directory:

```text
.loom/evidence/artifacts/20260527-flight-learn-diagnosis-real-pi-validation/
```

Key artifacts:

- `01-build.txt` - build output.
- `02-pi-install-output.txt` - disposable project-local install output.
- `03-seed-output.json` - local fixture seed result.
- `05-startup-pane.txt` - real TUI startup showing extension loaded.
- `06-command-palette-flight-pane.txt` - `/flight` command palette capture.
- `08-flight-learn-diagnosis-default-pane.txt` - default diagnosis focused-card capture.
- `09-expanded-evidence-pane.txt` - evidence expansion capture.
- `10-route-testcheck-selected-pane.txt` - active route capture.
- `11-why-followup-editor-pane.txt` - editor handoff capture.
- `12-why-followup-editor-edited-pane.txt` - edited reason capture.
- `13-after-route-submit-pane.txt` - post-submit notification.
- `14-status-after-route-pane.txt` - post-route status.
- `17-db-after-route.json` - local DB inspection after route.
- `18-build-provenance.txt` - source/dist/package provenance.
- `tui-2026-05-26_21-31-44-37760.log` - raw TUI write log.

## What This Shows

- `ticket:20260527-flight-learn-diagnosis-real-pi-validation#ACC-001` - supported. Build/install/startup/provenance artifacts identify the project-local package path, built dist fingerprints, and real TUI loading `pi-extension.js`.
- `ticket:20260527-flight-learn-diagnosis-real-pi-validation#ACC-002` - supported. `/flight` command palette capture shows only `flight-status` and `flight-learn`.
- `ticket:20260527-flight-learn-diagnosis-real-pi-validation#ACC-003` - supported. Real Pi default pane shows a plain-English `Problem` and `What happened?` for the raw-command fixture, not a raw command/path/cluster ID as the primary headline.
- `ticket:20260527-flight-learn-diagnosis-real-pi-validation#ACC-004` - supported. Default and expanded evidence panes show raw command/provenance under `Raw clue`, `Why suggested`, and `Evidence`, while primary diagnosis remains separate.
- `ticket:20260527-flight-learn-diagnosis-real-pi-validation#ACC-005` - supported. Real Pi pane shows `Why it matters` wrapped across readable lines rather than forced into one long/truncated line.
- `ticket:20260527-flight-learn-diagnosis-real-pi-validation#ACC-006` - supported. Real Pi editor/submission/status/DB artifacts show `Why this follow-up?` handoff, accepted `test-check` candidate with `applied=false`, preserved evidence count, and zero rule records.

## What This Does Not Show

- It does not prove hosted/real model-provider behavior. The run intentionally used offline/no-provider mode.
- It does not prove global/user-scope package install; it proves disposable project-local install.
- It does not prove long-run corpus precision/noise tuning.
- It does not prove artifact outcome follow-up custom UI.
- It does not prove all terminal/theme/key-protocol variants. It proves this tmux/xterm-256color route.
- It does not prove the operator will prefer this UI after continued hands-on use.

## Related Records

- `ticket:20260527-flight-learn-diagnosis-real-pi-validation` - ticket under validation.
- `ticket:20260527-flight-learn-diagnosis-card-integration` - implementation prerequisite.
- `plan:20260527-flight-learn-plain-english-diagnosis-cards` - parent plan.
- `spec:flight-learn-inbox-ux` - UX behavior contract.
- `spec:visible-command-surface` - two-command command-surface contract.
- `spec:delta-artifact-learning-loop` - candidate-only route/storage safety contract.
- `evidence:20260527-flight-learn-plain-english-feedback` - original screenshot/feedback this validation addresses.
