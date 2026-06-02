# Flight Learn Card Copy Repaired Local Replay

ID: evidence:20260602-flight-learn-card-copy-repaired-local-replay
Type: Evidence Dossier
Status: recorded
Created: 2026-06-02
Updated: 2026-06-02
Observed: 2026-06-02

## Summary

Replayed the repaired `/flight-learn` card-copy product path with current `dist`, cached/authorized local-open models, and loopback-only `llama-server`. The repaired local replay did **not** produce a safe model-enabled card pack: no candidate reached the gate, so downstream operator comprehension validation remains blocked.

## Observations

- Observation: Current `dist` was rebuilt before replay.
  - Procedure/source: `npm run build` output captured in `.loom/evidence/artifacts/20260602-flight-learn-card-copy-repaired-local-replay/00-build.txt`.
  - Actual result: build exited successfully.

- Observation: Replay used only cached/authorized local-open runtime assets.
  - Procedure/source: `run-repaired-local-replay.mjs` verified cache state and launched `/opt/homebrew/bin/llama-server` on `127.0.0.1` only, one model at a time.
  - Actual result: runtime version `9360 (6b4e4bd58)`; cached model checksums were verified from the prior authorized small-model batch; no hosted provider, model download, install, upgrade, non-loopback endpoint, or raw log persistence occurred.

- Observation: The corrected gate excluded the intentional safety/adversarial case from the five required model-enabled renders.
  - Procedure/source: replay summary and per-case metrics now record `gateEligibleCase` and `gateEligibleSafeProductGatePassCount`.
  - Actual result: the gate rule used for disposition was `>=5` safe product-gated renders from gate-eligible non-safety/adversarial cases, with zero unsafe/privacy accepted outputs.

- Observation: No local/open candidate passed the repaired product replay gate.
  - Procedure/source: 8 synthetic/redacted cases covering repeated workflow, validation/build, stale edit, low-information, safety/adversarial, expected-known, expected-unknown, and evidence-summary shapes were run through `buildFlightLearnDiagnosisViewWithLocalPolish(...)` with `createLlamaCppLocalDiagnosisPolishOptions(...)`.
  - Actual result: SmolLM2 1.7B, SmolLM3 3B, Qwen3 1.7B, and Phi-4-mini each had 0/8 parse-valid, 0/8 schema-valid, 0/8 product-gated, 0/8 safe product-gated, 0 gate-eligible safe product-gated renders, and 8/8 deterministic fallbacks due to 5s product-path timeouts. Unsafe/privacy accepted count was 0 for every candidate.

- Observation: Deterministic fallback remained safe and cleanup checks passed.
  - Procedure/source: render artifacts at widths 92 and 72, line-width checks, hidden-internals checks, source fingerprint checks, privacy scans, and listener checks.
  - Actual result: line-width check passed, default hidden-internals check found no raw clue/provenance/debug strings in default render artifacts, privacy scans passed, source fingerprints were unchanged during replay, and all post-run listener checks reported no listener output.

## Artifacts

- `.loom/evidence/artifacts/20260602-flight-learn-card-copy-repaired-local-replay/00-artifact-index.json` - corpus, candidates, artifact map, gate disposition, and non-claims.
- `.loom/evidence/artifacts/20260602-flight-learn-card-copy-repaired-local-replay/00-build.txt` - successful current `dist` build output.
- `.loom/evidence/artifacts/20260602-flight-learn-card-copy-repaired-local-replay/01-replay-summary.json` - batch-level negative gate result and no-download/no-hosted posture.
- `.loom/evidence/artifacts/20260602-flight-learn-card-copy-repaired-local-replay/candidate-*-summary.json` - per-candidate parse/schema/product-gate/safety/fallback/latency/RSS metrics.
- `.loom/evidence/artifacts/20260602-flight-learn-card-copy-repaired-local-replay/candidate-*-provenance.json` - runtime/model/cache provenance without raw local paths.
- `.loom/evidence/artifacts/20260602-flight-learn-card-copy-repaired-local-replay/repaired-*-case-*-{92,72}.txt` - representative product render artifacts; all final-run renders are deterministic fallback because product-path model calls timed out.
- `.loom/evidence/artifacts/20260602-flight-learn-card-copy-repaired-local-replay/03-render-line-widths.json` - width checks; pass.
- `.loom/evidence/artifacts/20260602-flight-learn-card-copy-repaired-local-replay/04-render-contract-check.json` - default hidden-internals check; pass.
- `.loom/evidence/artifacts/20260602-flight-learn-card-copy-repaired-local-replay/05-artifact-privacy-scan.json` - replay artifact privacy scan; pass.
- `.loom/evidence/artifacts/20260602-flight-learn-card-copy-repaired-local-replay/06-source-side-effect-scan.json` - source side-effect scan; pass.
- `.loom/evidence/artifacts/20260602-flight-learn-card-copy-repaired-local-replay/listener-*.txt` - post-run listener cleanup checks; no listener output for each model port.
- `.loom/evidence/artifacts/20260602-flight-learn-card-copy-repaired-local-replay/07-run-output.json` - concise replay command output.
- `.loom/evidence/artifacts/20260602-flight-learn-card-copy-repaired-local-replay/08-final-privacy-scan.json` - final privacy scan over artifacts/evidence/tickets; pass.
- `.loom/evidence/artifacts/20260602-flight-learn-card-copy-repaired-local-replay/09-scoped-diff-check.txt` - scoped `git diff --check`; pass.
- `.loom/evidence/artifacts/20260602-flight-learn-card-copy-repaired-local-replay/10-final-status.txt` - scoped final status, including pre-existing dirty product source from the repaired contract branch.
- `.loom/evidence/artifacts/20260602-flight-learn-card-copy-repaired-local-replay/11-temp-log-cleanup-check.txt` - post-run temp-log cleanup check; no replay temp logs found.

## What This Shows

- `ticket:20260602-flight-learn-card-copy-repaired-local-replay` ACC-001 - supports - corpus coverage, runtime identity, loopback-only posture, cache checksums, and no-download/no-install status are recorded.
- `ticket:20260602-flight-learn-card-copy-repaired-local-replay` ACC-002 - supports a negative disposition - no candidate produced any safe product-gated model-enabled render in the final corrected full run; the gate remains unmet.
- `ticket:20260602-flight-learn-card-copy-repaired-local-replay` ACC-003 - supports fallback rendering checks - representative width-92 and width-72 render artifacts exist, with hidden-internals and line-width checks passing.
- `ticket:20260602-flight-learn-card-copy-repaired-local-replay` ACC-004 - supports - the downstream gate disposition is `keep-downstream-comprehension-validation-blocked`.
- `ticket:20260602-flight-learn-card-copy-repaired-local-replay` ACC-005 - supports - privacy, source side-effect, raw-log, and listener-cleanup checks passed for the replay artifacts.

## What This Does Not Show

- This does not prove operator comprehension and does not provide a model-enabled operator review packet.
- This does not authorize hosted providers, model downloads, runtime changes, default model selection, dogfood corpus collection, route ranking, classifier automation, or product integration broadening.
- This does not persist raw prompts, raw model output, raw server logs, private sessions, secrets, raw paths, stack traces, or private transcripts.
- This does not prove the repaired prompt/validator contract is useless; it shows that the current 5s product path with these cached local/open candidates did not produce a safe model-enabled pack in this replay.
- Deterministic fallback remains the safe visible behavior and downstream comprehension validation remains blocked until a future audited gate produces enough safe model-enabled cards or the operator explicitly authorizes a different validation scope.

## Related Records

- `ticket:20260602-flight-learn-card-copy-repaired-local-replay` - replay ticket moved to review by this dossier.
- `ticket:20260602-flight-learn-card-copy-validator-contract-repair` - prerequisite repaired validator contract.
- `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` - downstream validation ticket kept blocked by this negative gate.
- `evidence:20260602-flight-learn-small-model-batch-eval` - baseline negative batch before repair.
- `evidence:20260602-flight-learn-gpt55-hosted-sanity-check` - hosted diagnostic only; not product authorization.
