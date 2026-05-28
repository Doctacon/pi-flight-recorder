# Bonsai Diagnosis Model Evaluation

ID: evidence:20260527-bonsai-diagnosis-model-evaluation
Type: Evidence Dossier
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Observed: 2026-05-27

## Summary

This dossier records a real Bonsai 1.7B Q1_0 evaluation over the 12-case `/flight-learn` diagnosis-polish corpus. It reused the operator-approved local Bonsai GGUF file and Homebrew `llama.cpp`, started `llama-server` on `127.0.0.1:18121`, ran the saved corpus through the real `llama.cpp` adapter with a 5000 ms evaluation timeout, captured safety/usefulness/fallback/latency metrics, and stopped the server after the run.

Result: Bonsai 1.7B produced accepted display-only wording for 5 of 12 cases on the final fresh-server pass. All accepted outputs were classified `accepted-equivalent`, not better than deterministic wording by the automatic comparison. Seven cases fell back deterministically; six were `schema-invalid` because the model added a non-display `confidence` field, and one was `unsupported-facts`. No accepted unsafe output was observed. The evidence supports only fallback-safe opt-in experimentation and recommends a follow-up tuning ticket before any release-quality claim.

Artifact directory:

```text
.loom/evidence/artifacts/20260527-bonsai-diagnosis-model-evaluation/
```

Key artifacts:

- `01-runtime-provenance.txt` - `llama.cpp`/Homebrew runtime provenance.
- `02-model-provenance.txt` - local Bonsai GGUF presence, size, checksum.
- `03-server-start.txt` - loopback server command and endpoint.
- `03-llama-server.log` - redacted server log.
- `04-server-health.json` - health check.
- `05-real-bonsai-eval-output.txt` - stdout summary from real evaluation run.
- `06-server-final-status.txt` - final loopback health/RSS snapshot.
- `07-server-stop.txt` - server stop confirmation.
- `run-real-bonsai-eval.mjs` - repeatable real Bonsai corpus runner.
- `real-bonsai-eval-results.json` - full per-case model/evaluation results.
- `real-bonsai-eval-summary.json` - summary counts, latency, and recommendation.
- `08-typecheck.txt` - `npm run typecheck` output.
- `09-full-test.txt` - `npm test` output.
- `10-diff-check.txt` - `git diff --check` output.
- `11-git-status.txt` - workspace state snapshot.
- `12-artifact-listing.txt` - artifact inventory.
- `13-privacy-scan.json` - targeted scan over saved artifacts.
- `14-server-log-summary.txt` - confirms the final server log has 12 prompt-evaluation timing groups for the 12-case corpus pass.

## Related Records

- `ticket:20260527-bonsai-diagnosis-model-evaluation`
- `plan:20260527-flight-learn-local-model-quality-evaluation`
- `ticket:20260527-local-diagnosis-model-eval-harness`
- `evidence:20260527-local-diagnosis-model-eval-harness`
- `ticket:20260527-real-bonsai-local-model-validation`
- `evidence:20260527-real-bonsai-local-model-validation`
- `research:20260527-local-diagnosis-model-runtime`
- `spec:flight-learn-inbox-ux` REQ-024 through REQ-029
- `ticket:20260527-bonsai-diagnosis-polish-tuning` - follow-up tuning ticket recommended by this evaluation.

## Procedure

Runtime/model provenance:

```bash
llama-server --version
llama-cli --version
brew info llama.cpp
shasum -a 256 ~/.cache/pi-flight-recorder/bonsai/Bonsai-1.7B-Q1_0.gguf
```

Server command:

```bash
llama-server \
  -m ~/.cache/pi-flight-recorder/bonsai/Bonsai-1.7B-Q1_0.gguf \
  --host 127.0.0.1 \
  --port 18121 \
  -c 2048 \
  --no-webui \
  --jinja
```

Evaluation command:

```bash
node --import tsx \
  .loom/evidence/artifacts/20260527-bonsai-diagnosis-model-evaluation/run-real-bonsai-eval.mjs \
  http://127.0.0.1:18121 \
  5000 \
  128 \
  > .loom/evidence/artifacts/20260527-bonsai-diagnosis-model-evaluation/05-real-bonsai-eval-output.txt
```

Validation commands:

```bash
npm run typecheck > .loom/evidence/artifacts/20260527-bonsai-diagnosis-model-evaluation/08-typecheck.txt 2>&1
npm test > .loom/evidence/artifacts/20260527-bonsai-diagnosis-model-evaluation/09-full-test.txt 2>&1
git diff --check > .loom/evidence/artifacts/20260527-bonsai-diagnosis-model-evaluation/10-diff-check.txt
```

The saved artifacts were redacted for the local home path and project workspace path before the privacy scan.

## Observations

### Runtime and model path

`01-runtime-provenance.txt` records:

- `llama-server` and `llama-cli` resolved to `/opt/homebrew/bin/...`.
- Both reported `version: 9360 (6b4e4bd58)` built for Darwin arm64.
- Homebrew metadata reports `llama.cpp 9360`, license `MIT`.

`02-model-provenance.txt` records:

```text
model_path=/Users/<user>/.cache/pi-flight-recorder/bonsai/Bonsai-1.7B-Q1_0.gguf
model_present=true
model_size_bytes=248302272
sha256=3d7c6c90dd98717a203adb22d5eacd2581850e40aa5327e144b97766cae5f7e3
```

This reused the model authorized/downloaded during `ticket:20260527-real-bonsai-local-model-validation`; no larger model was downloaded.

### Loopback server

`03-server-start.txt` records the loopback command:

```text
server_command=llama-server -m /Users/<user>/.cache/pi-flight-recorder/bonsai/Bonsai-1.7B-Q1_0.gguf --host 127.0.0.1 --port 18121 -c 2048 --no-webui --jinja
base_url=http://127.0.0.1:18121
endpoint=http://127.0.0.1:18121/v1/chat/completions
```

`04-server-health.json` returned:

```json
{"status":"ok"}
```

`06-server-final-status.txt` captured the process bound to the same command and health still OK. RSS in that snapshot was about `1193904` KiB. `07-server-stop.txt` records `server_stopped=true`.

### Corpus run summary

`real-bonsai-eval-summary.json` records:

```json
{
  "totalCases": 12,
  "acceptedCount": 5,
  "fallbackCount": 7,
  "acceptedWithinDefaultTimeoutCount": 1,
  "acceptedWithinEvaluationTimeoutCount": 5,
  "modelOutcomeCounts": {
    "accepted-equivalent": 5,
    "fallback-unexpected": 3,
    "fallback-expected": 4
  },
  "validatorOutcomeCounts": {
    "accepted": 5,
    "fallback": 7
  },
  "rubricRatingCounts": {
    "equivalent": 5,
    "invalidFallback": 7
  },
  "fallbackReasonCounts": {
    "null": 5,
    "schema-invalid": 6,
    "unsupported-facts": 1
  },
  "hardFailResultCount": 0,
  "outputSafetyFailureCount": 0,
  "promptSafetyFailureCount": 0
}
```

All 12 corpus cases were run:

- `LDM-EVAL-001`
- `LDM-EVAL-002`
- `LDM-EVAL-003`
- `LDM-EVAL-004`
- `LDM-EVAL-005`
- `LDM-EVAL-006`
- `LDM-EVAL-007`
- `LDM-EVAL-008`
- `LDM-EVAL-009`
- `LDM-EVAL-010`
- `LDM-EVAL-011`
- `LDM-EVAL-012`

### Accepted outputs

Accepted cases:

- `LDM-EVAL-001`
- `LDM-EVAL-002`
- `LDM-EVAL-005`
- `LDM-EVAL-010`
- `LDM-EVAL-012`

All accepted outputs had `changedFields: []` compared with the deterministic baseline. The automatic rubric therefore classified them as `accepted-equivalent`, not `better`.

Example accepted output (`LDM-EVAL-001`) matched deterministic display fields:

```json
{
  "headline": "A validation command failed repeatedly in this project.",
  "whatHappened": "Pi saw the same validation-failure pattern twice in recent sessions.",
  "whyItMatters": "Repeated validation friction makes the result hard to trust.",
  "expectedBehavior": "Validation should run from a fresh project shell after changes."
}
```

### Fallback outputs

Fallback cases:

- `LDM-EVAL-003` - `fallback-unexpected`, `schema-invalid`
- `LDM-EVAL-004` - `fallback-unexpected`, `schema-invalid`
- `LDM-EVAL-006` - `fallback-expected`, `schema-invalid`
- `LDM-EVAL-007` - `fallback-expected`, `schema-invalid`
- `LDM-EVAL-008` - `fallback-expected`, `schema-invalid`
- `LDM-EVAL-009` - `fallback-expected`, `schema-invalid`
- `LDM-EVAL-011` - `fallback-unexpected`, `unsupported-facts`

The dominant failure mode was Bonsai adding an extra non-display field:

```json
"validationIssue": "provider response included non-display fields"
```

The raw model content for those cases commonly included a `confidence` field, which the product validator correctly rejected as a non-display field. This is a useful tuning signal; it is not evidence that the validator should be weakened.

### Safety and privacy outcomes

`real-bonsai-eval-summary.json` reports:

- `hardFailResultCount: 0`
- `outputSafetyFailureCount: 0`
- `promptSafetyFailureCount: 0`

`13-privacy-scan.json` reports:

```json
{
  "forbiddenPatternCount": 0,
  "matches": []
}
```

The scan is targeted and not exhaustive. It checks saved artifacts for obvious raw home paths, `.pi/agent/sessions/`, workspace/tmp paths, raw API key/token assignments, private-key blocks, and raw chat transcript role lines. It explicitly does not treat `llama.cpp` log vocabulary such as `token: <number>` as a credential assignment.

### Latency and timeout posture

`real-bonsai-eval-summary.json` records:

```json
{
  "latencyAll": {
    "count": 12,
    "minMs": 680.528,
    "medianMs": 852.701,
    "p95Ms": 1157.965,
    "maxMs": 1157.965,
    "meanMs": 869.791
  },
  "latencyAccepted": {
    "count": 5,
    "minMs": 706.225,
    "medianMs": 829.884,
    "p95Ms": 997.362,
    "maxMs": 997.362,
    "meanMs": 848.91
  },
  "productDefaultTimeoutMs": 750,
  "acceptedWithinDefaultTimeoutCount": 1,
  "acceptedWithinEvaluationTimeoutCount": 5
}
```

The evaluation used an explicit 5000 ms timeout to measure model behavior rather than prematurely forcing fallback. Only 1 of 5 accepted outputs completed within the current 750 ms default timeout on the final fresh-server pass. `14-server-log-summary.txt` records 12 prompt-evaluation timing groups in the final server log, matching the 12-case corpus pass. This supports keeping timeout/default posture explicit and evidence-backed rather than silently changing it here.

### Validation commands

`08-typecheck.txt` shows `npm run typecheck` completed without errors.

`09-full-test.txt` shows:

```text
Test Files  21 passed (21)
Tests  126 passed (126)
```

`10-diff-check.txt` contains no `git diff --check` errors.

`11-git-status.txt` records the wider workspace state. It includes unrelated existing source modifications from prior local-model work; this ticket changed `.loom/` records/artifacts only and did not edit product source.

## Recommendation

`real-bonsai-eval-summary.json` records:

```json
{
  "decision": "create-follow-up-tuning-ticket-before-release-claim",
  "rationale": "Real Bonsai accepted 5/12 cases and had 3 unexpected fallback(s); quality/reliability is not strong enough for a release claim without prompt/schema/timeout tuning evidence."
}
```

Recommendation: keep the current feature **opt-in and experimental**. Do not claim Bonsai improves `/flight-learn` diagnosis wording broadly. Use deterministic diagnosis as default/fallback. Before any stronger release claim, execute `ticket:20260527-bonsai-diagnosis-polish-tuning` or explicitly decide not to tune.

## What This Shows

- `ticket:20260527-bonsai-diagnosis-model-evaluation#ACC-001` is supported: real `llama.cpp`/Bonsai runtime/model provenance, loopback server command, local endpoint, health, and no provider-key/hosted setup are recorded.
- `ticket:20260527-bonsai-diagnosis-model-evaluation#ACC-002` is supported: all 12 corpus cases were run with structured per-case results.
- `ticket:20260527-bonsai-diagnosis-model-evaluation#ACC-003` is supported: accepted/fallback/schema-invalid/unsupported/safety/privacy categories are separated, and saved artifact privacy scan is clean.
- `ticket:20260527-bonsai-diagnosis-model-evaluation#ACC-004` is supported: Bonsai outputs are classified against deterministic baseline using the saved rubric; accepted outputs were equivalent, not better.
- `ticket:20260527-bonsai-diagnosis-model-evaluation#ACC-005` is supported: latency distribution and default-timeout posture are recorded.
- `ticket:20260527-bonsai-diagnosis-model-evaluation#ACC-006` is supported: a narrow recommendation is recorded and follow-up `ticket:20260527-bonsai-diagnosis-polish-tuning` exists.

## What This Does Not Show

- This does not prove Bonsai 1.7B is generally useful for `/flight-learn`; acceptance was only 5/12 on the final fresh-server pass, and accepted outputs were equivalent to deterministic text.
- This does not prove quality on private real sessions; the corpus is synthetic/redacted and diagnosis-polish-specific.
- This does not justify changing product defaults, prompt, schema, timeout, docs, route behavior, storage semantics, or command visibility in this ticket.
- This does not authorize downloading Bonsai 4B/8B or trying other models.
- This does not provide OS-level network isolation or packet capture; locality rests on loopback command, adapter restrictions, server logs, endpoint evidence, and no provider-key/hosted setup.
- This does not close `ticket:20260523-real-corpus-evaluation-and-tuning`.

## Freshness And Recheck Triggers

Re-run or supersede this evidence if:

- the corpus or harness artifacts change;
- `src/flight-learn-local-diagnosis-model.ts` prompt/schema/validator/fallback behavior changes;
- `src/flight-learn-llama-cpp-adapter.ts` changes;
- timeout defaults or command flags change;
- Bonsai/runtime version changes;
- a larger model or new runtime is authorized;
- audit challenges classification, latency, locality, or privacy claims.
