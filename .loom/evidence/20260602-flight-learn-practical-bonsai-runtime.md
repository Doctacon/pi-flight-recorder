# Flight Learn Practical Bonsai Runtime Evidence

ID: evidence:20260602-flight-learn-practical-bonsai-runtime
Type: Evidence Dossier
Status: recorded
Created: 2026-06-02
Updated: 2026-06-02
Observed: 2026-06-02
Target: ticket:20260602-flight-learn-practical-bonsai-runtime

## Summary

This dossier records validation for the explicit practical Bonsai path. The observed implementation lets `/flight-learn --bonsai` start an operator-installed local `llama-server` against a local PrismML Bonsai GGUF file, use the existing hard-safety display gate, and clean up afterward.

The observations include fake-runtime lifecycle tests, a real cached Bonsai 1.7B command-scoped smoke, typecheck/tests/build, listener cleanup, scoped diff check, privacy scan, and Ralph review artifacts. The subprocess environment is sanitized to an allowlist instead of inheriting provider keys/proxy variables. No model/runtime download, install, hosted provider, non-loopback endpoint, raw prompt, raw model output, or raw server log was persisted.

## Observations

- Observation: Focused Bonsai/runtime and Pi extension tests passed.
  - Procedure/source: `npm test -- src/flight-learn-bonsai-runtime.test.ts src/pi-extension.test.ts`.
  - Actual result: 2 test files / 36 tests passed. The tests cover fixed no-shell argv shape, loopback host, fake `llama-server` request shape, sanitized child environment, process cleanup, `/flight-learn --bonsai` integration, deterministic fallback for missing model file, missing runtime command, never-healthy startup, and no storage of model wording into artifact drafts.

- Observation: Full automated test suite passed.
  - Procedure/source: `npm test`.
  - Actual result: 22 test files / 137 tests passed.

- Observation: TypeScript checks and build passed.
  - Procedure/source: `npm run typecheck`; `npm run build`.
  - Actual result: both commands passed.

- Observation: A real cached Bonsai 1.7B command-scoped smoke passed.
  - Procedure/source: inline synthetic smoke using `startBonsaiLocalDiagnosisRuntime` with cached PrismML Bonsai 1.7B Q1_0 and operator-installed `llama-server`.
  - Actual result: `01-real-bonsai-command-runtime-smoke.json` records `startedRuntime: true`, `usedLocalModel: true`, `displayState: validated`, `fallbackReason: null`, `hardSafetyDisplayScanPass: true`, `modelDownloads: false`, `runtimeInstallsOrUpgrades: false`, `hostedProviderUsed: false`, `cleanupCalled: true`, and sanitized child environment use.

- Observation: The real smoke listener was cleaned up.
  - Procedure/source: `lsof -nP -iTCP:<smokePort> -sTCP:LISTEN` after the smoke cleanup.
  - Actual result: `02-listener-cleanup.txt` records no remaining listener on the smoke port.

- Observation: Scoped diff whitespace check and privacy scan passed.
  - Procedure/source: `git diff --check -- <scoped files>` and a redaction/privacy scan over this ticket/spec/research/artifact set.
  - Actual result: `03-diff-check.txt` has no findings; `05-privacy-scan.json` reports zero findings.

## Artifacts

Artifact directory:

```text
.loom/evidence/artifacts/20260602-flight-learn-practical-bonsai-runtime/
```

Key artifacts:

- `00-artifact-index.json` - artifact map and non-claims.
- `01-real-bonsai-command-runtime-smoke.json` - summary-only real cached Bonsai command-runtime smoke; no raw prompt/model output/server log.
- `02-listener-cleanup.txt` - confirms no remaining listener on the smoke port.
- `03-diff-check.txt` - scoped `git diff --check` result.
- `04-validation-summary.json` - summarized validation command outcomes.
- `05-privacy-scan.json` - privacy scan over Loom records/artifacts for this ticket.
- `06-ralph-review-output.md` - initial Ralph review output with three findings.
- `07-ralph-followup-review-output.md` - follow-up Ralph review output with clear verdict after fixes.

## What This Shows

- `ticket:20260602-flight-learn-practical-bonsai-runtime#ACC-001` - supports - `/flight-learn --bonsai` / `--local-model-bonsai` are implemented under the existing `/flight-learn` surface, help/status text and docs name the practical path, and manual `--local-model-polish --local-model-url` tests still pass.
- `ticket:20260602-flight-learn-practical-bonsai-runtime#ACC-002` - supports - fake-runtime tests and source checks show the command uses a local model file, fixed argv, no shell interpolation, literal `127.0.0.1`, sanitized child environment, existing loopback adapter, and no download/install/hosted/provider-key/proxy path.
- `ticket:20260602-flight-learn-practical-bonsai-runtime#ACC-003` - supports - tests cover missing model, missing runtime command, never-healthy startup cleanup/fallback, and existing adapter/local-model fallback behavior without interrupting review.
- `ticket:20260602-flight-learn-practical-bonsai-runtime#ACC-004` - supports - fake-runtime tests observe cleanup events, and the real smoke listener cleanup check found no remaining listener.
- `ticket:20260602-flight-learn-practical-bonsai-runtime#ACC-005` - partially supports - hard-safety and no-side-effect behavior remain covered by existing local diagnosis/adapter/extension tests plus the new `/flight-learn --bonsai` integration test. This dossier is implementation evidence, not independent audit.

## What This Does Not Show

- It does not prove operator comprehension or global Bonsai output quality.
- It does not authorize model/runtime downloads or installs.
- It does not prove every local machine has a compatible `llama-server`; missing runtime falls back.
- It does not prove long-running daemon behavior or shared server reuse; this ticket intentionally implements command-scoped startup/cleanup only.
- It does not make model output a source of truth for routing, storage, artifacts, source files, Loom records, rules, skills, prompts, or classifier labels.
- It does not replace future release/UX review if the operator wants comprehension validation over real cards.

## Related Records

- `ticket:20260602-flight-learn-practical-bonsai-runtime` - owns the scoped implementation and acceptance criteria.
- `spec:flight-learn-inbox-ux#REQ-057` and `spec:flight-learn-inbox-ux#REQ-058` - own intended practical Bonsai behavior.
- `evidence:20260602-flight-learn-hard-safety-bonsai-comprehension` - prior evidence that the hard-safety Bonsai card-copy gate can render safe cached Bonsai output.
