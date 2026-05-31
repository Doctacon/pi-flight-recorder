# Bonsai 4B Narrative Validation Evidence

ID: evidence:20260528-bonsai-4b-narrative-validation
Type: Evidence Dossier
Status: recorded
Created: 2026-05-28
Updated: 2026-05-28
Observed: 2026-05-28/2026-05-29 UTC

## Summary

Ran real local Bonsai 4B Q1_0 GGUF through the narrative `What happened?` contract after the local `llama.cpp` judge adapter was added. The validation used the already-downloaded Bonsai 4B file only, a loopback-only `llama-server`, the implemented fact-ID generator contract, and the explicit local judge adapter configured to the same Bonsai 4B endpoint.

Result: Bonsai 4B produced **0 accepted narratives out of 15 synthetic/redacted corpus cases** under the current strict schema + verifier + local judge path. The failures were mostly malformed JSON or schema-invalid output before any accepted display. Recommendation: do **not** treat Bonsai 4B Q1_0 as useful for accepted `/flight-learn` narrative `What happened?` today. Keep deterministic fallback as the real user-facing behavior and, if desired, open a separate prompt/schema tuning or alternate local judge/model evaluation ticket.

Artifact directory:

```text
.loom/evidence/artifacts/20260528-bonsai-4b-narrative-validation/
```

Key artifacts:

- `runtime-provenance.txt` - `llama-server` version, model checksum, redacted model path, health, and RSS snapshot.
- `server-command.txt` - redacted loopback server command.
- `llama-server-health.json` - health response.
- `llama-server-4b.log` - redacted runtime log.
- `real-bonsai-4b-narrative-results.json` - per-case structured results.
- `real-bonsai-4b-narrative-summary.json` - compact metrics.
- `real-bonsai-4b-narrative-run-output.txt` - summary printed by the validation script.
- `raw-bonsai-4b-samples.json` - three synthetic raw output samples used to understand rejection shape.
- `real-4b-fallback-render.txt` - focused-card render showing deterministic fallback after real 4B rejection.
- `privacy-scan.json` - artifact privacy scan; `pass: true` after audit follow-up redaction.
- `server-final-status.txt` - stop status.
- `audit:20260528-bonsai-4b-narrative-validation-review` - initial audit; privacy artifact blocker.
- `audit:20260528-bonsai-4b-narrative-validation-followup-review` - follow-up audit; verdict `clear` for bounded negative validation closure.
- `post-validation-focused-tests.txt`, `post-validation-typecheck.txt`, `post-validation-diff-check.txt` - post-validation health checks.

No hosted provider, non-loopback endpoint, new model download, runtime install/build, source behavior change, storage/routing/classifier change, artifact/rule/source mutation, or release-readiness claim was made.

## Runtime And Model Provenance

Observed runtime/model:

- Runtime: Homebrew `llama-server`, version `9360 (6b4e4bd58)`, AppleClang arm64 build.
- Model: `~/.cache/pi-flight-recorder/bonsai/Bonsai-4B-Q1_0.gguf`.
- SHA256: `4524b3f997f0f06444e568d1f26e2efd69effa3218c7ad3047432fb171e42168`.
- Server: `http://127.0.0.1:18118`.
- Server health: `{"status":"ok"}`.
- RSS snapshot before stop: approximately `1,163,760 KB`.
- Stop status: `stopped`.

Command shape, redacted:

```bash
llama-server \
  -m ~/.cache/pi-flight-recorder/bonsai/Bonsai-4B-Q1_0.gguf \
  --host 127.0.0.1 \
  --port 18118 \
  -c 4096 \
  --no-webui \
  --jinja
```

The same loopback Bonsai 4B endpoint was used as generator and judge because the operator authorized only the existing 4B model. This is explicitly an experimental self-judge shape and does not prove independent judge quality.

## Corpus Results

From `real-bonsai-4b-narrative-summary.json`:

```json
{
  "totalCases": 15,
  "acceptedCount": 0,
  "fallbackCount": 15,
  "runtimeErrorCount": 0,
  "fallbackReasons": {
    "malformed-json": 12,
    "schema-invalid": 2,
    "timeout": 1
  },
  "rubricOutcomes": {
    "fallback-unexpected": 7,
    "fallback-expected": 8
  },
  "latencyMs": {
    "min": 2367,
    "max": 5007,
    "avg": 4052
  }
}
```

Interpretation:

- The positive/narrative-better corpus cases did not produce accepted narratives.
- All adversarial fallback cases did fall back, but this is not enough to recommend the model because positive cases also failed.
- The timeout count was low, but latency was near the configured 5-second timeout for some cases.
- The dominant issue was schema/JSON compliance, not accepted unsafe content.

## Raw Output Samples

`raw-bonsai-4b-samples.json` captured three synthetic raw generator outputs for diagnosis. They are synthetic/redacted and do not include private sessions. These samples show the model often produced plausible text but missed the required contract, e.g. top-level `sentences` without `schemaVersion`/`whatHappened`, multiple JSON objects, or unsupported/overconfident wording.

Example pattern:

```text
{"sentences":[...], "whyItMatters":"...", "expectedBehavior":"..."}
```

That is not valid for the implemented contract, which requires `schemaVersion: 2` and `whatHappened.sentences[]`.

## Visual Evidence

Because no real 4B narrative was accepted, there is no honest accepted-narrative visual artifact. `real-4b-fallback-render.txt` instead records the actual UI consequence for the first corpus case: fallback disclosure plus deterministic `What happened?` text.

Excerpt:

```text
Local model unavailable (invalid JSON); deterministic wording shown.

Problem
 A repeated workflow problem showed up across recent sessions.

What happened?
 The same failure pattern was observed twice in recent sessions.
```

This means the operator's desired distinct narrative visual path is **not** proven by real Bonsai 4B under the current contract.

## Privacy Scan

`privacy-scan.json` reports:

```json
{
  "pass": true,
  "forbiddenPatternCount": 0,
  "findings": []
}
```

The runtime log/provenance and post-validation command artifacts were redacted to use `~` or `<repo>` instead of raw home/repo paths. The corpus and outputs are synthetic/redacted.

## Post-validation Health Checks

Focused tests:

```bash
npm test -- src/flight-learn-llama-cpp-adapter.test.ts src/pi-extension.test.ts src/flight-learn-inbox.test.ts src/flight-learn-local-diagnosis-model.test.ts
```

Result: passed, `4` test files / `79` tests.

Typecheck:

```bash
npm run typecheck
```

Result: passed.

Diff check:

```bash
git diff --check
```

Result: passed with no output.

## Audit Follow-up

Initial audit `audit:20260528-bonsai-4b-narrative-validation-review` found a privacy blocker: `post-validation-focused-tests.txt` contained a raw absolute repo path and the earlier privacy scan had been run before that artifact existed.

Follow-up fix:

- Redacted Bonsai validation artifacts to replace the raw repo path with `<repo>` and the raw home path with `~`.
- Re-ran `privacy-scan.json`; it now reports `pass: true`, `forbiddenPatternCount: 0`. Follow-up audit returned `clear` for bounded negative validation closure.
- Preserved the negative `ACC-003` posture: no accepted Bonsai narrative render exists; the visual artifact is fallback-only.

## What This Shows

- `ACC-001` is supported: real local Bonsai 4B runtime evidence was captured with checksum, health, loopback command, RSS snapshot, and stop status.
- `ACC-002` is supported: all 15 synthetic/redacted narrative corpus cases have structured accepted/fallback/reason/latency/result fields.
- `ACC-003` is negatively answered rather than supported as a success claim: no accepted real 4B narrative existed to render; fallback render evidence shows deterministic wording remains safe but does not solve the desired narrative UX.
- `ACC-004` is supported in this validation scope: artifacts passed the privacy scan, all outputs fell back before persistence, server was loopback-only, and post-validation tests passed.
- `ACC-005` is supported: recommendation is explicit and conservative—do not use Bonsai 4B Q1_0 for accepted narrative `What happened?` under the current contract without further prompt/schema tuning or alternate model/judge evaluation.

## What This Does Not Show

- This does not prove Bonsai 4B is generally bad; it only shows this Q1_0 GGUF with this prompt/schema/timeout/local self-judge path did not produce accepted narratives.
- This does not prove an independent judge model would reject/accept the same outputs.
- This does not prove longer timeouts, a grammar-constrained server mode, prompt tuning, a different quantization, Bonsai 8B/Ternary/MLX, Prometheus, NLI, or another open-source judge/model would fail.
- This does not validate a real Pi TUI session; the visual artifact is a render harness over synthetic/redacted data.
- This does not claim release readiness.

## Recommendation

Keep deterministic fallback as the default and practical visible behavior. Do not recommend Bonsai 4B Q1_0 for `/flight-learn` accepted narrative wording under the current contract.

If the product goal remains important, the next honest options are separate follow-up tickets:

1. prompt/schema tuning for Bonsai 4B with raw-output diagnostics as the baseline;
2. a grammar-constrained local `llama.cpp` JSON mode investigation;
3. an alternate local/open-source generator or judge model evaluation with explicit authorization.
