# Bonsai Diagnosis Polish Tuning

ID: evidence:20260527-bonsai-diagnosis-polish-tuning
Type: Evidence Dossier
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Observed: 2026-05-27

## Summary

This dossier records the prompt-only tuning pass for optional `/flight-learn` local-model diagnosis polish. The tuning target was the real Bonsai 1.7B failure pattern from `evidence:20260527-bonsai-diagnosis-model-evaluation`: 5/12 accepted, 7/12 fallback, with 6 schema-invalid fallbacks mostly caused by extra non-display `confidence` fields.

The implemented change is deliberately narrow: `src/flight-learn-local-diagnosis-model.ts` now explicitly tells the local model not to include `confidence`, scores, metadata, route/action/status/severity, nested objects/arrays, or echoed fact-packet structure. The validator remains strict; no extra fields are accepted. No timeout default, route/storage behavior, runtime lifecycle, adapter locality, or visible command surface changed.

Final post-tuning real Bonsai pass over the same 12-case synthetic/redacted corpus:

- accepted: 8/12, up from 5/12;
- fallback: 4/12, down from 7/12;
- unexpected fallback: 1, down from 3;
- hard-fail/unsafe accepted outputs: 0;
- output safety failures: 0;
- prompt safety failures: 0;
- accepted within current 750 ms product default timeout: 1/8, unchanged from pre-tuning 1 accepted case within default timeout;
- accepted outputs remained `accepted-equivalent` under the conservative automatic rubric, not proven better than deterministic wording.

Recommendation after tuning: keep the feature opt-in/experimental and document/use explicit timeout guidance for real Bonsai experimentation; do not claim broad release-quality wording improvement from Bonsai 1.7B.

Artifact directory:

```text
.loom/evidence/artifacts/20260527-bonsai-diagnosis-polish-tuning/
```

Key artifacts:

- `16-source-change-excerpt.txt` - current prompt/test excerpt and note that source files are untracked in this workspace from prior local-model work, so normal git diff does not show the targeted prompt change.
- `11-focused-local-model-test.txt` - focused contract test output.
- `harness-summary.json`, `diagnosis-polish-eval-harness-results.json`, `fake-provider-exercise-results.json` - fake-provider harness output after tuning.
- `pre-tuning-real-bonsai-eval-summary.json` - copied baseline summary from the prerequisite real Bonsai evaluation.
- `real-bonsai-eval-summary.json`, `real-bonsai-eval-results.json`, `05-real-bonsai-eval-output.txt` - post-tuning real Bonsai run.
- `12-before-after-comparison.json` - pre/post metric comparison.
- `01-runtime-provenance.txt`, `02-model-provenance.txt`, `03-server-start.txt`, `04-server-health.json`, `06-server-final-status.txt`, `07-server-stop.txt`, `14-server-log-summary.txt` - local runtime/model/server evidence.
- `08-typecheck.txt`, `09-full-test.txt`, `10-diff-check.txt` - validation outputs.
- `15-privacy-scan.json` - targeted artifact privacy scan.
- `13-artifact-listing.txt` - artifact inventory.

## Related Records

- `ticket:20260527-bonsai-diagnosis-polish-tuning`
- `ticket:20260527-bonsai-diagnosis-model-evaluation`
- `evidence:20260527-bonsai-diagnosis-model-evaluation`
- `ticket:20260527-local-diagnosis-model-eval-harness`
- `evidence:20260527-local-diagnosis-model-eval-harness`
- `spec:flight-learn-inbox-ux` REQ-024 through REQ-029

## Procedure

Prompt-only source change:

```text
Added explicit prompt instructions:
- Do not include confidence, scores, metadata, notes, rationale, route, action, status, severity, or any other non-display field.
- Do not echo or summarize the fact packet structure. Do not include nested objects, arrays, delta, signals, evidence, bounds, or analysis fields.
```

Focused test:

```bash
npm test -- src/flight-learn-local-diagnosis-model.test.ts \
  > .loom/evidence/artifacts/20260527-bonsai-diagnosis-polish-tuning/11-focused-local-model-test.txt 2>&1
```

Fake-provider harness:

```bash
node --import tsx \
  .loom/evidence/artifacts/20260527-bonsai-diagnosis-polish-tuning/run-diagnosis-polish-eval-harness.mjs \
  > .loom/evidence/artifacts/20260527-bonsai-diagnosis-polish-tuning/fake-harness-run-output.txt
```

Real Bonsai post-tuning run used the existing operator-approved local GGUF model and Homebrew `llama.cpp`; no new model was downloaded. Final server command:

```bash
llama-server \
  -m ~/.cache/pi-flight-recorder/bonsai/Bonsai-1.7B_Q1_0.gguf \
  --host 127.0.0.1 \
  --port 18124 \
  -c 2048 \
  --no-webui \
  --jinja
```

Final evaluation command:

```bash
node --import tsx \
  .loom/evidence/artifacts/20260527-bonsai-diagnosis-polish-tuning/run-real-bonsai-eval.mjs \
  http://127.0.0.1:18124 \
  5000 \
  128 \
  > .loom/evidence/artifacts/20260527-bonsai-diagnosis-polish-tuning/05-real-bonsai-eval-output.txt
```

Validation commands:

```bash
npm run typecheck > .loom/evidence/artifacts/20260527-bonsai-diagnosis-polish-tuning/08-typecheck.txt 2>&1
npm test > .loom/evidence/artifacts/20260527-bonsai-diagnosis-polish-tuning/09-full-test.txt 2>&1
git diff --check > .loom/evidence/artifacts/20260527-bonsai-diagnosis-polish-tuning/10-diff-check.txt
```

## Observations

### Source tuning

`16-source-change-excerpt.txt` records the current prompt builder. The relevant tuned instructions are:

```text
Do not include confidence, scores, metadata, notes, rationale, route, action, status, severity, or any other non-display field.
Do not echo or summarize the fact packet structure. Do not include nested objects, arrays, delta, signals, evidence, bounds, or analysis fields.
```

The focused test now asserts that the prompt contains these instructions. The source files are currently untracked in this workspace due prior local-model work, so `10-diff-check.txt` records their untracked status rather than a normal line diff:

```text
git_status_short_for_source=
?? src/flight-learn-local-diagnosis-model.test.ts
?? src/flight-learn-local-diagnosis-model.ts
git_diff_check=
```

### Safety contract remains strict

The validator still rejects extra fields. The fake-provider exercise summary reports all existing fallback classes remain covered:

```json
{
  "exerciseFallbackReasonCounts": {
    "null": 2,
    "malformed-json": 1,
    "schema-invalid": 1,
    "unsafe-output": 1,
    "unsupported-facts": 1,
    "timeout": 1,
    "provider-error": 1
  },
  "exercisedFallbackReasons": [
    "malformed-json",
    "provider-error",
    "schema-invalid",
    "timeout",
    "unsafe-output",
    "unsupported-facts"
  ],
  "metricFieldValidation": {
    "perCase": { "ok": true, "missing": [] },
    "exercises": { "ok": true, "missing": [] }
  }
}
```

The exercise named `exercise-schema-invalid-extra-field` still expects and gets `schema-invalid`; the validator was not loosened to accept `confidence` or any other non-display field.

### Fake-provider harness post-tuning

`harness-summary.json` records:

```json
{
  "modelRuntimeStarted": false,
  "hostedProviderUsed": false,
  "productBehaviorChanged": true,
  "productBehaviorChangeScope": "prompt-only local-model polish instruction change; no route/storage/default/runtime lifecycle change",
  "totalCases": 12,
  "deterministicMismatchCount": 0,
  "promptSafetyFailureCount": 0,
  "perCaseHardFailResultCount": 0,
  "allHardFailResultCount": 1
}
```

The `allHardFailResultCount: 1` is the pre-existing representative redaction-placeholder exercise where the harness marks an accepted placeholder echo as rubric-unsafe. The per-case corpus run remains `perCaseHardFailResultCount: 0`.

### Real Bonsai post-tuning summary

`real-bonsai-eval-summary.json` records:

```json
{
  "modelRuntimeStarted": true,
  "hostedProviderUsed": false,
  "productBehaviorChanged": true,
  "productBehaviorChangeScope": "prompt-only local-model polish instruction change; no route/storage/default/runtime lifecycle change",
  "totalCases": 12,
  "acceptedCount": 8,
  "fallbackCount": 4,
  "acceptedWithinDefaultTimeoutCount": 1,
  "acceptedWithinEvaluationTimeoutCount": 8,
  "modelOutcomeCounts": {
    "accepted-equivalent": 8,
    "fallback-unexpected": 1,
    "fallback-expected": 3
  },
  "validatorOutcomeCounts": {
    "accepted": 8,
    "fallback": 4
  },
  "rubricRatingCounts": {
    "equivalent": 8,
    "invalidFallback": 4
  },
  "fallbackReasonCounts": {
    "null": 8,
    "malformed-json": 3,
    "schema-invalid": 1
  },
  "hardFailResultCount": 0,
  "outputSafetyFailureCount": 0,
  "promptSafetyFailureCount": 0
}
```

The final fallback cases were:

- `LDM-EVAL-003`: `malformed-json`, unexpected fallback; the model still began adding `confidence` plus a nested `delta` object and was cut off.
- `LDM-EVAL-006`: `schema-invalid`, expected fallback; the model still included `confidence`.
- `LDM-EVAL-007`: `malformed-json`, expected fallback; the model still began adding `confidence` plus a nested `delta` object and was cut off.
- `LDM-EVAL-009`: `malformed-json`, expected fallback; the model still began adding `confidence` plus a nested `delta` object and was cut off.

This means the prompt tuning improved but did not eliminate the model's non-display/echo behavior.

### Before/after comparison

`12-before-after-comparison.json` records:

```json
{
  "acceptedCount": { "before": 5, "after": 8, "delta": 3 },
  "fallbackCount": { "before": 7, "after": 4, "delta": -3 },
  "fallbackReasonCounts": {
    "before": { "null": 5, "schema-invalid": 6, "unsupported-facts": 1 },
    "after": { "null": 8, "malformed-json": 3, "schema-invalid": 1 }
  },
  "acceptedWithinDefaultTimeoutCount": { "before": 1, "after": 1, "delta": 0 },
  "hardFailResultCount": { "before": 0, "after": 0, "delta": 0 },
  "outputSafetyFailureCount": { "before": 0, "after": 0, "delta": 0 },
  "promptSafetyFailureCount": { "before": 0, "after": 0, "delta": 0 }
}
```

Latency moved upward in this single pass:

```json
{
  "latencyAllMeanMs": { "before": 869.791, "after": 972.052, "delta": 102.261 },
  "latencyAllP95Ms": { "before": 1157.965, "after": 1323.008, "delta": 165.043 }
}
```

### Runtime/locality

`01-runtime-provenance.txt` records Homebrew `llama.cpp` version `9360 (6b4e4bd58)`. `02-model-provenance.txt` records the same Bonsai model checksum as prior validation:

```text
sha256=3d7c6c90dd98717a203adb22d5eacd2581850e40aa5327e144b97766cae5f7e3
```

`03-server-start.txt` records loopback `http://127.0.0.1:18124`. `04-server-health.json` returned `{"status":"ok"}`. `07-server-stop.txt` records `server_stopped=true`. `14-server-log-summary.txt` records 12 prompt-evaluation timing groups, matching the 12-case corpus pass.

### Validation and privacy

`11-focused-local-model-test.txt` shows:

```text
Test Files  1 passed (1)
Tests  12 passed (12)
```

`08-typecheck.txt` shows `npm run typecheck` completed without errors.

`09-full-test.txt` shows:

```text
Test Files  21 passed (21)
Tests  126 passed (126)
```

`10-diff-check.txt` contains no `git diff --check` errors.

`15-privacy-scan.json` reports:

```json
{
  "forbiddenPatternCount": 0,
  "matches": []
}
```

The scan is targeted, not exhaustive. It checks saved artifacts for raw home-user paths, `.pi/agent/sessions/`, workspace/tmp paths, raw API key/token assignments, private-key blocks, and raw chat transcript role lines. The source excerpt redacts a synthetic test fixture user path to `/Users/<fixture>`.

## Recommendation

Keep optional local model polish **opt-in and experimental**. The prompt-only tuning is worth keeping because it improved Bonsai acceptance on the synthetic/redacted corpus without weakening validators or adding safety failures. However:

- accepted outputs are still only `accepted-equivalent` by the automatic rubric;
- 4/12 cases still fell back, including continued non-display/fact-packet echo behavior;
- only 1/8 accepted outputs completed within the current 750 ms default timeout;
- latency rose in this single fresh-server pass;
- the corpus is synthetic/redacted and diagnosis-polish-specific.

Do not claim broad release-quality improvement from Bonsai 1.7B. If documenting the flag for users, pair it with explicit timeout guidance such as using `--local-model-timeout-ms 5000` for Bonsai experiments and explaining that deterministic wording remains the default/fallback. Do not change the product default timeout based on this single local pass.

## What This Shows

- `ticket:20260527-bonsai-diagnosis-polish-tuning#ACC-001` is supported: the tuning decision cites the real failure pattern and implements the smallest safe prompt-only change.
- `ticket:20260527-bonsai-diagnosis-polish-tuning#ACC-002` is supported: focused tests and fake-provider exercises still cover malformed JSON, schema-invalid extra fields, unsafe route/action output, unsupported facts, timeout, and provider-error fallback.
- `ticket:20260527-bonsai-diagnosis-polish-tuning#ACC-003` is supported: the fake-provider harness and real Bonsai corpus evaluation were rerun after the source prompt change, with before/after comparison.
- `ticket:20260527-bonsai-diagnosis-polish-tuning#ACC-004` is supported: the recommendation is explicit and conservative: keep opt-in experimental with timeout guidance; no broader quality/release claim.

## What This Does Not Show

- This does not prove Bonsai 1.7B produces better wording than deterministic diagnosis; automatic accepted outputs were equivalent.
- This does not prove private real-session quality or release readiness.
- This does not justify weakening validators to accept extra fields.
- This does not justify changing the 750 ms default timeout.
- This does not authorize Bonsai 4B/8B or other model-family downloads.
- This does not prove OS-level network isolation; locality rests on loopback command, adapter constraints, server evidence, and no hosted/provider-key setup.
- This does not close `ticket:20260523-real-corpus-evaluation-and-tuning`.

## Freshness And Recheck Triggers

Re-run or supersede this evidence if:

- `src/flight-learn-local-diagnosis-model.ts` prompt/schema/validator behavior changes;
- timeout defaults or CLI local-model flags change;
- the corpus or harness artifacts change;
- Bonsai/runtime/model version changes;
- larger-model or alternate-model evaluation is authorized;
- audit challenges the prompt-only safety claim, acceptance counts, latency interpretation, or recommendation.
