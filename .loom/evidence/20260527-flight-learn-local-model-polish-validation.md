# Flight Learn Local Model Polish Validation

ID: evidence:20260527-flight-learn-local-model-polish-validation
Type: Evidence Dossier
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Observed: 2026-05-27

## Summary

This dossier validates the integrated optional local-model diagnosis polish path without laundering fake evidence into real-model claims. It records focused fake-provider/adapter proof, real Pi disabled/unavailable fallback proof, real Pi candidate-only route safety, package/build provenance, and an honest blocker for actual Bonsai/`llama.cpp` proof because no explicit approved local runtime/model configuration was available in this environment.

## Related Records

- `ticket:20260527-flight-learn-local-model-polish-validation`
- `ticket:20260527-flight-learn-local-model-polish-integration`
- `ticket:20260527-local-diagnosis-model-adapter`
- `ticket:20260527-local-diagnosis-model-contract-harness`
- `research:20260527-local-diagnosis-model-runtime`
- `spec:flight-learn-inbox-ux` REQ-024 through REQ-029 / SCN-008 and SCN-009
- `spec:visible-command-surface`

Artifact directory:

```text
.loom/evidence/artifacts/20260527-flight-learn-local-model-polish-validation/
```

## Focused Fake-provider / Adapter Validation

Procedure:

```bash
npx vitest run src/flight-learn-inbox.test.ts src/pi-extension.test.ts src/flight-learn-local-diagnosis-model.test.ts src/flight-learn-llama-cpp-adapter.test.ts
```

Artifact: `01-focused-tests.txt`

Observed result:

```text
Test Files  4 passed (4)
Tests  63 passed (63)
```

What this covers:

- validated fake/local model wording appears only in display fields with `Local model phrasing; deterministic fallback available`;
- invalid/unavailable model behavior falls back to deterministic wording with generic disclosure;
- model output is rejected by the contract when unsupported/unsafe;
- explicit loopback adapter proxy/SSRF constraints remain covered;
- Pi extension tests cover explicit flag behavior, real loopback fake chat server integration, fallback without URL, status privacy copy, custom-throw accepted behavior, and candidate-only storage assertions.

## Static Validation

### Typecheck

Procedure:

```bash
npm run typecheck
```

Artifact: `02-typecheck.txt`

Observed result: command exited successfully with `tsc --noEmit`.

### Build

Procedure:

```bash
npm run build
```

Artifact: `03-build.txt`

Observed result: command exited successfully with `npm run clean && tsc -p tsconfig.build.json`.

### Full test suite

Procedure:

```bash
npm test
```

Artifact: `25-full-test.txt`

Observed result:

```text
Test Files  21 passed (21)
Tests  126 passed (126)
```

The run emitted Node experimental SQLite warnings already present in this suite; no test failure was observed.

### Diff whitespace checks

Procedures:

```bash
git diff --check
```

Artifacts: `22-final-diff-check.txt`, `26-final-diff-check.txt`

Observed result: both artifacts are empty; no whitespace errors were reported.

## Real Model Availability Check

Procedure: inspect only; no downloads, installs, hosted calls, or non-loopback probes.

Artifact: `04-real-model-availability.txt`

Observed result:

```text
LLAMA_CPP_REAL_MODEL_BASE_URL=<unset>
llama-server=
llama-cli=
llama.cpp=
approved_model_env=<unset>
real_model_status=blocked-no-explicit-approved-runtime-or-model-config
note=no downloads, installs, hosted providers, or non-loopback probes were attempted
```

Conclusion: actual Bonsai/`llama.cpp` model proof is blocked in this environment. This dossier does not claim real Bonsai behavior.

## Real Pi Package/TUI Validation

### Disposable install and fixture setup

Procedures:

- Built package before validation (`03-build.txt`).
- Created disposable temp `HOME`, `PI_CODING_AGENT_DIR`, `PI_CODING_AGENT_SESSION_DIR`, workspace, data dir, and TUI log dir.
- Ran project-local install in the disposable workspace:

```bash
pi install /Users/crlough/Code/personal/pi-flight-recorder -l
```

- Seeded local expectation-delta fixture with `seed-local-polish-fixture.mjs`.

Artifacts:

- `05-pi-install-output.txt`
- `06-project-settings.json`
- `07-seed-output.json`
- `run-env.txt`

Observed result: Pi startup later showed `[Extensions] pi-extension.js`; project settings point at the local package path.

### Real Pi command surface and loaded extension

Procedure: launched Pi in tmux with disposable dirs, `PI_OFFLINE=1`, `PI_TUI_WRITE_LOG`, `--offline`, `--no-skills`, `--no-prompt-templates`, `--no-context-files`, `--no-session`, and `--no-tools`; typed `/flight` and captured the pane.

Artifacts:

- `08-startup-pane.txt`
- `09-command-palette-flight-pane.txt`
- `19-tui-log-dir-listing.txt`
- copied raw TUI log `tui-2026-05-27_10-45-38-42598.log`

Observed result: startup shows `pi v0.75.5` and `[Extensions] pi-extension.js`; `/flight` command palette shows only `flight-status` and `flight-learn`.

### Real Pi local-model unavailable fallback card

Procedure: ran a disposable real Pi flag probe:

```text
/flight-learn delta-review --data-dir <temp-data-dir> --local-model-polish --local-model-url http://127.0.0.1:9
```

Artifact: `24-flag-probe-local-polish-fallback-pane.txt`

Observed result: the focused card showed:

```text
Flight Learn — Issue 1 of 2
2 pending · 2 evidence refs · ↑/↓ changes issue
Local model unavailable (runtime unavailable); deterministic wording shown.

Problem
 A validation command failed repeatedly in this project.
```

This proves real Pi renders deterministic diagnosis plus the local-model fallback disclosure when the explicitly configured loopback runtime is unavailable.

### Real Pi fallback route safety

Procedure: ran another disposable real Pi session with the same unreachable loopback URL, selected Test/check, submitted a human reason, and inspected the local database.

Artifacts:

- `28-fallback-route-card-pane.txt`
- `29-fallback-route-testcheck-selected-pane.txt`
- `30-fallback-route-editor-edited-pane.txt`
- `31-fallback-route-after-submit-pane.txt`
- `32-fallback-route-db-after-route.json`

Observed result:

- Card showed `Local model unavailable (runtime unavailable); deterministic wording shown.`
- Route selection highlighted `Test/check`.
- Post-submit notification said `Artifact candidate: artifact_cand_87131b1ba115698b [accepted; applied=false]` and `No artifact was created or applied.`
- DB inspection shows one `test-check` candidate with `status: accepted`, `applied: false`, evidence ref count 2, `ruleCandidates: 0`, and `flightRules: 0`.
- Stored delta summary remained the raw stored/deterministic source text; model/fallback wording was not written back to the delta.

### Real Pi status privacy copy

Procedure: after a route flow, ran:

```text
/flight-status --data-dir <temp-data-dir>
```

Artifact: `17-status-after-route-pane.txt`

Observed result: status includes:

```text
Privacy: local SQLite only by default; no model calls unless explicitly enabled by `/flight-learn reflect --model`, model reflection settings, or `/flight-learn --local-model-polish --local-model-url ...`.
```

### Build/package provenance

Procedure: gathered git status, package Pi extension declaration, dist file stat/hash, and dist fingerprints.

Artifact: `21-build-provenance.txt`

Observed result: provenance records:

- commit `8e2ba30637ffc8c07738b43c8b5b6f56d08bbf53` with dirty worktree;
- package Pi extension declaration `./dist/pi-extension.js`;
- dist hashes for `pi-extension.js`, `flight-learn-inbox.js`, `flight-learn-local-diagnosis-model.js`, and `flight-learn-llama-cpp-adapter.js`;
- dist fingerprints for `--local-model-polish`, status privacy copy, `Local model phrasing`, `Local model unavailable`, `buildFlightLearnDiagnosisViewWithLocalPolish`, and `proxyEnv`.

## What This Shows

- `ticket:20260527-flight-learn-local-model-polish-validation#ACC-001` is supported. Focused fake-provider/adapter tests, typecheck, build, full tests, and diff checks are recorded.
- `ACC-002` is supported for disabled/unavailable real Pi behavior. Real Pi command palette still exposes only `flight-status`/`flight-learn`; real Pi renders deterministic diagnosis plus unavailable local-model disclosure with an explicit unreachable loopback URL; route/editor/storage behavior still works.
- `ACC-003` is honestly blocked for actual real Bonsai/`llama.cpp` proof. No approved runtime/model config was present; no download/install/hosted/non-loopback probe was attempted; the blocker is recorded in `04-real-model-availability.txt`.
- `ACC-004` is supported. Real Pi fallback route artifacts and DB inspection show accepted candidate-only storage with `applied=false`, zero rule records, preserved evidence, and no persisted model/fallback wording in stored delta source-of-truth fields.
- `ACC-005` is supported subject to audit: evidence separates fake-provider proof, real Pi unavailable fallback proof, and blocked real-model proof rather than claiming model quality from mocks.

## What This Does Not Show

- This does not prove real Bonsai model quality, latency, JSON reliability, memory use, or `llama.cpp` runtime compatibility.
- This does not prove model-polished wording in real Pi with a real local model; that remains blocked pending explicit local runtime/model availability.
- This does not prove hosted provider behavior; hosted providers remain out of scope and unauthorized.
- This does not prove global/user-scope package install; it proves disposable project-local install.
- This does not prove all terminal/theme/key-protocol variants; it proves the tmux/xterm-256color route captured here.
- This does not prove long-run corpus quality tuning or model prompt quality over private corpora.
- This does not replace audit before ticket closure.
