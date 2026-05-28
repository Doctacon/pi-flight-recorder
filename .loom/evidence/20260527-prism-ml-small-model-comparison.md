# Prism-ML Small Model Comparison

ID: evidence:20260527-prism-ml-small-model-comparison
Type: Evidence Dossier
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Observed: 2026-05-27

## Summary

This dossier records the operator-authorized Prism-ML small-model comparison for optional `/flight-learn` local-model diagnosis polish on a 16GB MacBook environment. The operator authorized a `1.7B + 4B` sweep, Prism-ML GGUF model weights only, and explicitly chose to avoid Prism-ML Ternary models/custom `llama.cpp` forks.

The comparison used the tuned prompt from `ticket:20260527-bonsai-diagnosis-polish-tuning`, the same 12-case synthetic/redacted corpus, Homebrew `llama.cpp`, loopback-only `llama-server`, 5000 ms evaluation timeout, 128 max output tokens, and 2048-token context for both models.

Result: **Bonsai 1.7B remains the better choice under the current strict validator and prompt.** Bonsai 4B Q1_0 downloaded and ran successfully on the 16GB MacBook, but it accepted only 1/12 cases, fell back on 11/12, and was slower. Its raw outputs often looked like richer paraphrases, but the strict support validator rejected them as `unsupported-facts`. No hard-fail/unsafe accepted output was observed for either model.

Artifact directory:

```text
.loom/evidence/artifacts/20260527-prism-ml-small-model-comparison/
```

Key artifacts:

- `03-hf-model-metadata-summary.json` - Hugging Face public metadata summary for Bonsai 1.7B and 4B GGUF repos.
- `04-hf-file-heads.txt` - HEAD-derived file size/checksum/disposition info with signed redirect URLs redacted.
- `05-download-authorization-and-target.txt` - operator-authorized download target.
- `06-download-output.txt` - download progress for Bonsai 4B Q1_0.
- `07-model-4b-provenance.txt` - Bonsai 4B local size/checksum.
- `08-runtime-provenance.txt` - Homebrew `llama.cpp` runtime provenance.
- `09-local-model-provenance.txt` - local 1.7B and 4B model provenance.
- `run-prism-ml-model-eval.mjs` - matched corpus runner used for both models.
- `bonsai-1.7b-eval-summary.json`, `bonsai-1.7b-eval-results.json` - 1.7B evaluation.
- `bonsai-4b-eval-summary.json`, `bonsai-4b-eval-results.json` - 4B evaluation. Audit initially found a misleading inherited 1.7B note in this 4B results artifact; it was corrected in-place to name `PrismML Bonsai 4B GGUF Q1_0`.
- `bonsai-*.server-*`, `bonsai-*.llama-server.log`, `bonsai-*.server-log-summary.txt` - loopback server evidence for each model.
- `23-model-comparison-summary.json` - side-by-side metrics and recommendation.
- `20-typecheck.txt`, `21-focused-local-model-test.txt`, `22-diff-check.txt` - validation checks.
- `25-privacy-scan.json` - targeted privacy scan.
- `24-artifact-listing.txt` - artifact inventory.

## Related Records

- `ticket:20260527-prism-ml-small-model-comparison`
- `ticket:20260527-bonsai-diagnosis-polish-tuning`
- `evidence:20260527-bonsai-diagnosis-polish-tuning`
- `ticket:20260527-local-diagnosis-model-eval-harness`
- `evidence:20260527-local-diagnosis-model-eval-harness`
- `spec:flight-learn-inbox-ux` REQ-024 through REQ-029

## Procedure

Public model metadata was inspected via Hugging Face API and HEAD requests. The selected download was:

```text
repo=prism-ml/Bonsai-4B-gguf
file=Bonsai-4B-Q1_0.gguf
target=/Users/<user>/.cache/pi-flight-recorder/bonsai/Bonsai-4B-Q1_0.gguf
```

The selected 4B Q1_0 file was downloaded with `curl -fL --retry 3 --continue-at -` after operator authorization. No Ternary model, MLX model, 8B model, runtime, fork, or toolchain was downloaded or installed.

Each model was run with the same command shape, changing only model path and port:

```bash
llama-server \
  -m ~/.cache/pi-flight-recorder/bonsai/<model>.gguf \
  --host 127.0.0.1 \
  --port <18131-or-18132> \
  -c 2048 \
  --no-webui \
  --jinja
```

Each model was evaluated with:

```bash
node --import tsx \
  .loom/evidence/artifacts/20260527-prism-ml-small-model-comparison/run-prism-ml-model-eval.mjs \
  http://127.0.0.1:<port> \
  5000 \
  128 \
  "<model label>" \
  "<output prefix>"
```

Validation checks:

```bash
npm run typecheck > .loom/evidence/artifacts/20260527-prism-ml-small-model-comparison/20-typecheck.txt 2>&1
npm test -- src/flight-learn-local-diagnosis-model.test.ts > .loom/evidence/artifacts/20260527-prism-ml-small-model-comparison/21-focused-local-model-test.txt 2>&1
git diff --check > .loom/evidence/artifacts/20260527-prism-ml-small-model-comparison/22-diff-check.txt
```

## Observations

### Download and model provenance

`04-hf-file-heads.txt` records:

- `Bonsai-4B-Q1_0.gguf` content length / linked size: `572270624` bytes.
- `Bonsai-1.7B-Q1_0.gguf` content length / linked size: `248302272` bytes.
- The `Bonsai-4B-Q1_0.gguf` and `Bonsai-4B.gguf` filenames resolve to the same object/etag in the public Hugging Face repo.

`07-model-4b-provenance.txt` records:

```text
model_path=/Users/<user>/.cache/pi-flight-recorder/bonsai/Bonsai-4B-Q1_0.gguf
model_present=true
model_size_bytes=572270624
4524b3f997f0f06444e568d1f26e2efd69effa3218c7ad3047432fb171e42168  /Users/<user>/.cache/pi-flight-recorder/bonsai/Bonsai-4B-Q1_0.gguf
```

`09-local-model-provenance.txt` records existing Bonsai 1.7B Q1_0:

```text
model_path=/Users/<user>/.cache/pi-flight-recorder/bonsai/Bonsai-1.7B-Q1_0.gguf
model_present=true
size_bytes=248302272
3d7c6c90dd98717a203adb22d5eacd2581850e40aa5327e144b97766cae5f7e3  /Users/<user>/.cache/pi-flight-recorder/bonsai/Bonsai-1.7B-Q1_0.gguf
```

Runtime provenance in `08-runtime-provenance.txt` records Homebrew `llama.cpp` version `9360 (6b4e4bd58)`.

### Matched evaluation settings

Both models used:

```json
{
  "corpus": "local-diagnosis-model-eval-corpus-v1",
  "cases": 12,
  "timeoutMs": 5000,
  "maxOutputTokens": 128,
  "contextTokens": 2048,
  "productDefaultTimeoutMs": 750
}
```

Both model runs report `hostedProviderUsed: false`, `productBehaviorChanged: false`, and:

```text
productBehaviorChangeScope=no source/default/runtime lifecycle change in this comparison ticket; using tuned prompt from ticket:20260527-bonsai-diagnosis-polish-tuning
```

Audit caveat: this no-source-change claim is based on the comparison procedure and source inspection, not a clean VCS proof, because the workspace contains broader prior local-model source changes/untracked files.

### Bonsai 1.7B result

`bonsai-1.7b-eval-summary.json` records:

```json
{
  "acceptedCount": 8,
  "fallbackCount": 4,
  "acceptedWithinDefaultTimeoutCount": 1,
  "modelOutcomeCounts": {
    "accepted-equivalent": 8,
    "fallback-unexpected": 1,
    "fallback-expected": 3
  },
  "fallbackReasonCounts": {
    "null": 8,
    "schema-invalid": 2,
    "malformed-json": 2
  },
  "latencyAll": {
    "medianMs": 880.682,
    "p95Ms": 1283.614,
    "meanMs": 952.035
  },
  "hardFailResultCount": 0,
  "outputSafetyFailureCount": 0,
  "promptSafetyFailureCount": 0
}
```

Final RSS snapshot in `bonsai-1.7b-server-final-status.txt` was `1190576` KiB.

### Bonsai 4B result

`bonsai-4b-eval-summary.json` records:

```json
{
  "acceptedCount": 1,
  "fallbackCount": 11,
  "acceptedWithinDefaultTimeoutCount": 0,
  "modelOutcomeCounts": {
    "fallback-unexpected": 6,
    "fallback-expected": 5,
    "accepted-equivalent": 1
  },
  "fallbackReasonCounts": {
    "unsupported-facts": 11,
    "null": 1
  },
  "latencyAll": {
    "medianMs": 1574.961,
    "p95Ms": 2306.825,
    "meanMs": 1675.834
  },
  "hardFailResultCount": 0,
  "outputSafetyFailureCount": 0,
  "promptSafetyFailureCount": 0
}
```

Final RSS snapshot in `bonsai-4b-server-final-status.txt` was `1704432` KiB.

The 4B run completed on the 16GB MacBook with no server crash, but was slower than 1.7B and far less accepted by the strict support validator.

### Why 4B fell back

`bonsai-4b-eval-results.json` shows 11/12 fallbacks were `unsupported-facts`. Manual inspection of raw 4B outputs shows they were often coherent paraphrases, but they introduced unsupported or stronger words under the current token-level support validator. Examples include:

- `LDM-EVAL-001`: added phrases like `stale shell` and `inconsistent execution environments`.
- `LDM-EVAL-002`: added `TypeScript compile step` and `package trustworthiness`.
- `LDM-EVAL-008`: stated validation failed due to redacted path/credential information rather than only saying sensitive output was redacted before storage.
- `LDM-EVAL-012`: turned diagnosis into modal/action phrasing with `Assistant should...`.

This is not evidence that 4B is unsafe; output safety failures were zero. It is evidence that 4B is a poor fit for the current strict display-only support validator without additional prompt or validator tuning.

### Locality and server lifecycle

Both model servers used loopback only:

- 1.7B: `http://127.0.0.1:18131/v1/chat/completions`
- 4B: `http://127.0.0.1:18132/v1/chat/completions`

Both health checks returned:

```json
{"status":"ok"}
```

Both stop artifacts report `server_stopped=true`. A post-run `lsof` check found no listeners on ports `18131` or `18132`.

### Validation and privacy

`20-typecheck.txt` shows `npm run typecheck` completed without errors.

`21-focused-local-model-test.txt` shows:

```text
Test Files  1 passed (1)
Tests  12 passed (12)
```

`22-diff-check.txt` contains no `git diff --check` errors.

`25-privacy-scan.json` reports:

```json
{
  "forbiddenPatternCount": 0,
  "matches": []
}
```

The scan checks saved artifacts for raw home-user paths, `.pi/agent/sessions/`, workspace/tmp paths, raw API key/token assignments, private-key blocks, chat transcript role lines, and unredacted Hugging Face signed redirect URL parameters.

## Recommendation

`23-model-comparison-summary.json` records:

```json
{
  "decision": "prefer-1.7b-over-4b-for-current-validator-and-prompt",
  "rationale": "Bonsai 4B Q1_0 was slower and accepted only 1/12 cases under the current strict support validator, while tuned 1.7B accepted 8/12 with zero safety failures. 4B produced richer paraphrases, but the validator rejected them as unsupported facts; do not recommend 4B for /flight-learn polish without a separate prompt/validator tuning ticket."
}
```

Practical recommendation for this 16GB MacBook setup:

- Keep Bonsai 1.7B Q1_0 as the only currently useful Prism-ML GGUF local-model experiment for `/flight-learn`.
- Do not switch to Bonsai 4B Q1_0 under the current prompt/validator.
- If the operator wants to pursue 4B further, create a separate tuning ticket focused on either stronger copy-the-deterministic-fields prompting or support-validator/rubric improvements; do not weaken display-only safety just to increase acceptance.
- Do not evaluate 8B or Ternary models without fresh operator authorization.

## What This Shows

- `ticket:20260527-prism-ml-small-model-comparison#ACC-001` is supported: the 4B download was explicitly authorized, selected from Prism-ML GGUF, and recorded with local size/checksum.
- `ticket:20260527-prism-ml-small-model-comparison#ACC-002` is supported: both 1.7B and 4B were run over all 12 cases with matched corpus/timeout/token/context settings.
- `ticket:20260527-prism-ml-small-model-comparison#ACC-003` is supported: loopback commands, health checks, stop artifacts, no hosted provider usage, and privacy scan are recorded.
- `ticket:20260527-prism-ml-small-model-comparison#ACC-004` is supported: the recommendation compares acceptance, fallback causes, safety, memory/RSS, and latency without claiming release readiness.
- `ticket:20260527-prism-ml-small-model-comparison#ACC-005` is supported by `audit:20260527-prism-ml-small-model-comparison-review`; the audit returned `concerns` with no closure blocker after artifact-note correction and caveat preservation.

## What This Does Not Show

- This does not prove 4B is generally worse as a language model; it only shows poor acceptance under the current `/flight-learn` strict support validator and corpus.
- This does not prove either model produces better wording than deterministic diagnosis; accepted outputs were automatically classified equivalent.
- This does not validate private real sessions, larger corpora, all hardware, or long-run memory behavior.
- This does not authorize 8B, Ternary, MLX, or custom `llama.cpp` fork testing.
- This does not justify changing default timeout, source behavior, validators, or release posture.
- This does not provide OS-level packet capture; locality rests on loopback command, adapter constraints, server evidence, and no hosted/provider-key setup.

## Freshness And Recheck Triggers

Re-run or supersede this evidence if:

- prompt/schema/validator behavior changes;
- the corpus/rubric/harness changes;
- `llama.cpp` or model versions change;
- another model family or quantization is authorized;
- timeout defaults or CLI local-model flags change;
- audit challenges download scope, locality/privacy, metrics, or recommendation.
