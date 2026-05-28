# Flight Learn Local Model Polish Integration Validation

ID: evidence:20260527-flight-learn-local-model-polish-integration-validation
Type: Evidence Dossier
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Observed: 2026-05-27

## Related Records

- `ticket:20260527-flight-learn-local-model-polish-integration`
- `ticket:20260527-local-diagnosis-model-contract-harness`
- `ticket:20260527-local-diagnosis-model-adapter`
- `spec:flight-learn-inbox-ux` REQ-024 through REQ-029 / SCN-008 and SCN-009
- `spec:visible-command-surface`
- `audit:20260527-flight-learn-local-model-polish-integration-review`

## Source State Observed

Implemented optional local-model diagnosis polish integration in:

- `src/flight-learn-inbox.ts`
- `src/pi-extension.ts`
- `src/flight-learn-inbox.test.ts`
- `src/pi-extension.test.ts`

This integration consumes the already validated contract harness and loopback `llama.cpp` adapter:

- `src/flight-learn-local-diagnosis-model.ts`
- `src/flight-learn-llama-cpp-adapter.ts`

Raw command artifacts are stored under `.loom/evidence/artifacts/20260527-flight-learn-local-model-polish-integration/`.

## Observations

### Focused integration tests

Procedure:

```bash
npx vitest run src/flight-learn-inbox.test.ts src/pi-extension.test.ts src/flight-learn-local-diagnosis-model.test.ts src/flight-learn-llama-cpp-adapter.test.ts
```

Artifact: `.loom/evidence/artifacts/20260527-flight-learn-local-model-polish-integration/focused-tests.txt`

Observed result:

```text
Test Files  4 passed (4)
Tests  63 passed (63)
```

Relevant coverage observed:

- Default focused-card diagnosis tests still pass.
- Inbox component renders validated local-model-polished display wording and the disclosure `Local model phrasing; deterministic fallback available.`
- Inbox component renders fallback copy such as `Local model unavailable (timed out); deterministic wording shown.` without leaking raw provider errors.
- Edited fields stop using stale precomputed model wording.
- Pi extension test starts a real loopback fake chat server, invokes `/flight-learn --local-model-polish --local-model-url http://127.0.0.1:<port>`, observes polished display wording in the custom inbox, and verifies the request prompt contains redacted `/Users/<user>` rather than `/Users/alice`.
- The same Pi extension test routes the delta and verifies the stored delta summary remains the original raw/deterministic source text, the accepted artifact candidate remains `applied=false`, no flight rules are created, and the proposed draft does not persist the model-polished display phrase.
- Pi extension fallback test invokes `delta-review --local-model-polish` without a URL and observes deterministic diagnosis plus local-model fallback disclosure without raw provider error text.
- Pi extension status test verifies `/flight-status` privacy copy now includes the explicit `/flight-learn --local-model-polish --local-model-url ...` model-call path.
- Pi extension custom-throw test documents the accepted explicit-flag behavior when `ctx.ui.custom` exists but throws: the local model request may have already occurred, then primitive fallback still requires human review/rationale and stores only candidate-only artifacts.
- Adapter and contract tests still pass as part of this focused set.

### Typecheck

Procedure:

```bash
npm run typecheck
```

Artifact: `.loom/evidence/artifacts/20260527-flight-learn-local-model-polish-integration/typecheck.txt`

Observed result: command exited successfully with `tsc --noEmit`.

### Build

Procedure:

```bash
npm run build
```

Artifact: `.loom/evidence/artifacts/20260527-flight-learn-local-model-polish-integration/build.txt`

Observed result: command exited successfully with `npm run clean && tsc -p tsconfig.build.json`.

### Full test suite

Procedure:

```bash
npm test
```

Artifact: `.loom/evidence/artifacts/20260527-flight-learn-local-model-polish-integration/full-test.txt`

Observed result:

```text
Test Files  21 passed (21)
Tests  126 passed (126)
```

The run emitted Node experimental SQLite warnings already present in this suite; no test failure was observed.

### Source and package policy scan

Procedure:

```bash
node --input-type=module <policy scan>
```

Artifact: `.loom/evidence/artifacts/20260527-flight-learn-local-model-polish-integration/source-policy-scan.txt`

Observed result:

```text
package.json runtime dependency count: 0
integration policy scan passed: explicit flags only, status privacy copy updated, no new visible command markers, no hosted/provider/download/process tokens in extension, no runtime dependencies
```

The targeted scan checked for:

- optional `localDiagnosisPolish?: LocalDiagnosisPolishResult` item data rather than stored delta mutation;
- disclosure and fallback UI strings;
- stale-model-wording guard when editable fields change;
- explicit `/flight-learn` flags `--local-model-polish` and `--local-model-url`;
- use of the validated local adapter/contract harness;
- no model call when the custom UI API is absent (`if (!ctx.ui?.custom) return false`);
- no new visible command marker, hosted provider, API key, download, subprocess, or runtime lifecycle token in `src/pi-extension.ts`;
- no runtime dependency additions.

### Diff whitespace check

Procedure:

```bash
git diff --check
# plus no-index whitespace checks for untracked adapter files in this worktree
```

Artifact: `.loom/evidence/artifacts/20260527-flight-learn-local-model-polish-integration/git-diff-check.txt`

Observed result: command exited successfully with no whitespace errors.

## What This Shows

- `ticket:20260527-flight-learn-local-model-polish-integration#ACC-001` is supported by existing focused-card tests and integration tests showing deterministic behavior remains the default; no local model call path is configured unless `--local-model-polish` is explicit, and custom UI absence returns to fallback before building local-polish items. A separate test documents the accepted explicit-flag behavior when custom UI exists but throws: the local model request may occur before primitive fallback, but storage/routing still stays human-gated and candidate-only.
- `ACC-002` is supported by component and Pi extension tests showing validated local-model display wording can appear in primary diagnosis fields with unobtrusive disclosure when explicitly enabled against a loopback fake runtime.
- `ACC-003` is supported by fallback tests showing unavailable/invalid local-model configuration renders deterministic text plus a generic local-model fallback reason without raw provider error leakage.
- `ACC-004` is supported by route/storage assertions: model wording is not persisted into stored delta fields or artifact drafts, accepted artifact candidates remain candidate-only/unapplied, and no Flight Rules are created.
- `ACC-005` is supported by focused tests, typecheck, build, full test suite, source/package policy scan, and diff whitespace check passing.

## What This Does Not Show

- This does not prove real Bonsai or real `llama.cpp` model quality, latency, JSON reliability, or local runtime compatibility; the enabled integration proof used a loopback fake chat server.
- This does not prove real interactive Pi TUI behavior after integration; that belongs to `ticket:20260527-flight-learn-local-model-polish-validation`.
- This does not prove all pending deltas are model-polished. The integration precomputes optional model wording for the initial selected delta to avoid blocking the whole inbox; other items remain deterministic unless reviewed through a future/later path.
- This does not prove an operator-controlled local model server is benign; the configured local server remains an operator-managed trust boundary.
- This evidence was refreshed after `audit:20260527-flight-learn-local-model-polish-integration-review` found stale status privacy copy and an under-documented custom-throw behavior. It still does not replace follow-up audit before closure.
