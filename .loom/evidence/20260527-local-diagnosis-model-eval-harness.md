# Local Diagnosis Model Evaluation Harness

ID: evidence:20260527-local-diagnosis-model-eval-harness
Type: Evidence Dossier
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Observed: 2026-05-27

## Summary

This dossier records the repeatable local harness for evaluating optional `/flight-learn` diagnosis-polish behavior before any real Bonsai quality run. The harness consumes the corpus from `evidence:20260527-local-diagnosis-model-eval-corpus-rubric`, rebuilds deterministic diagnosis outputs from the saved cases, runs fake-provider local-model contract paths, and emits structured metrics for the later Bonsai evaluation ticket.

No Bonsai runtime, `llama-server`, hosted provider, model download, runtime install, product UI path, route/storage behavior, package export, or visible command surface was changed by this ticket. The harness is a `.loom/` artifact and uses current source helpers through `node --import tsx`.

Artifact directory:

```text
.loom/evidence/artifacts/20260527-local-diagnosis-model-eval-harness/
```

Key artifacts:

- `run-diagnosis-polish-eval-harness.mjs` - repeatable local harness command.
- `diagnosis-polish-eval-harness-results.json` - full structured harness output.
- `deterministic-baseline-results.json` - deterministic baseline for all corpus cases.
- `fake-provider-exercise-results.json` - representative fake-provider exercise results.
- `harness-summary.json` - concise run summary and counts.
- `harness-run-output.txt` - stdout from the harness run.
- `privacy-scan.json` - targeted scan over saved harness artifacts.
- `typecheck.txt` - `npm run typecheck` output.
- `full-test.txt` - `npm test` output with workspace path redacted.
- `diff-check.txt` - `git diff --check` output.
- `artifact-listing.txt` - artifact inventory.

## Related Records

- `ticket:20260527-local-diagnosis-model-eval-harness`
- `plan:20260527-flight-learn-local-model-quality-evaluation`
- `ticket:20260527-local-diagnosis-model-eval-corpus-rubric`
- `evidence:20260527-local-diagnosis-model-eval-corpus-rubric`
- `audit:20260527-local-diagnosis-model-eval-corpus-rubric-followup-review`
- `spec:flight-learn-inbox-ux` REQ-024 through REQ-029

## Procedure

Harness run:

```bash
node --import tsx .loom/evidence/artifacts/20260527-local-diagnosis-model-eval-harness/run-diagnosis-polish-eval-harness.mjs \
  > .loom/evidence/artifacts/20260527-local-diagnosis-model-eval-harness/harness-run-output.txt
```

Validation commands:

```bash
npm run typecheck > .loom/evidence/artifacts/20260527-local-diagnosis-model-eval-harness/typecheck.txt 2>&1
npm test > .loom/evidence/artifacts/20260527-local-diagnosis-model-eval-harness/full-test.txt 2>&1
# redacted the project-local /Users/<user>/... workspace path in full-test.txt after capture
git diff --check > .loom/evidence/artifacts/20260527-local-diagnosis-model-eval-harness/diff-check.txt
```

Privacy scan procedure:

- Scanned harness artifacts for obvious raw home-user paths, `.pi/agent/sessions/`, workspace/tmp paths, raw API key/token assignments, private-key blocks, and raw chat transcript role lines.
- Allowed placeholders: `/Users/<user>`, `<pi-session-file:redacted>`, `[REDACTED_CREDENTIAL]`, `[stack trace omitted]`, `[local path omitted]`.
- Redacted the workspace path from `full-test.txt` before final scan.

## Observations

### Corpus contract consumed

`harness-summary.json` reports:

```json
{
  "corpusId": "local-diagnosis-model-eval-corpus-v1",
  "modelRuntimeStarted": false,
  "hostedProviderUsed": false,
  "productBehaviorChanged": false,
  "totalCases": 12,
  "contractValidation": {
    "ok": true,
    "errors": [],
    "totalCases": 12,
    "modelOutcomeEnum": [
      "accepted-better",
      "accepted-equivalent",
      "accepted-worse",
      "accepted-unsafe",
      "accepted-unsupported",
      "fallback-expected",
      "fallback-unexpected",
      "runtime-error",
      "not-run"
    ]
  }
}
```

All 12 case IDs from the corpus were recorded:

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

### Deterministic baseline recorded

`harness-summary.json` reports `deterministicMismatchCount: 0`, meaning the harness reconstructed deterministic outputs from the corpus cases and matched the baseline output saved by the corpus/rubric ticket.

`deterministic-baseline-results.json` contains per-case deterministic fields:

- `headline`
- `whatHappened`
- `whyItMatters`
- `expectedBehavior`
- `confidence`
- `rawClue`
- `limits`
- corpus-comparison status
- low-confidence/fallback notes

This baseline is a comparison/oracle for stored facts. It is not claimed to be perfect product copy.

### Per-case fake-provider outcomes recorded

The per-case fake-provider run produced:

```json
{
  "perCaseModelOutcomeCounts": {
    "accepted-equivalent": 7,
    "fallback-expected": 5
  },
  "perCaseValidatorOutcomeCounts": {
    "accepted": 7,
    "fallback": 5
  },
  "perCaseFallbackReasonCounts": {
    "null": 7,
    "unsupported-facts": 4,
    "unsafe-output": 1
  }
}
```

Each per-case result includes:

- `caseId`
- `coverage`
- `sourceKind`
- `expectedModelBehavior`
- `deterministicOutput`
- `scenarioId`
- `modelOutcome`
- `validatorOutcome`
- `rubricRating`
- `desiredOutcomeValues`
- `hardFailOutcomeValues`
- `usedLocalModel`
- `fallbackReason`
- `validationIssue`
- `elapsedMs`
- `providerResponse`
- `safetyFlags`
- `promptSafety`
- `factPacketBounds`
- `outputView`
- `reviewerNotes`

### Representative fake-provider exercises recorded

The representative fake-provider exercise run covered valid, invalid, unsafe, unsupported, timeout, and provider-error paths:

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
  ]
}
```

Exercise IDs:

- `exercise-valid`
- `exercise-malformed-json`
- `exercise-schema-invalid-extra-field`
- `exercise-unsafe-redaction-placeholder`
- `exercise-unsafe-route-action`
- `exercise-unsupported-fact`
- `exercise-timeout`
- `exercise-provider-error`

The redaction-placeholder exercise intentionally records validator outcome separately from rubric outcome. In this run the current validator accepted the placeholder echo, so the harness marked it `accepted-unsafe` rather than counting it as privacy success. This explains `exerciseHardFailResultCount: 1` / `allHardFailResultCount: 1`; the per-case corpus run itself had `perCaseHardFailResultCount: 0`.

The final summary also reports metric-field validation against `caseContract.metricFieldsExpectedFromHarness`:

```json
{
  "metricFieldValidation": {
    "expectedFields": [
      "modelOutcome",
      "validatorOutcome",
      "usedLocalModel",
      "fallbackReason",
      "validationIssue",
      "elapsedMs",
      "rubricRating",
      "reviewerNotes"
    ],
    "perCase": { "ok": true, "missing": [] },
    "exercises": { "ok": true, "missing": [] }
  }
}
```

### Safety and privacy scan

`privacy-scan.json` reports:

```json
{
  "forbiddenPatternCount": 0,
  "matches": [],
  "redactionsApplied": {
    "full-test.txt": [
      "/Users/<user>/Code/personal/pi-flight-recorder"
    ]
  }
}
```

`harness-summary.json` reports `promptSafetyFailureCount: 0`. The harness does record prompt flags for redacted raw command words and display-only instruction language, but the failure count is scoped to raw/private paths, session files, secret assignments, private keys, and transcript role lines.

### Validation commands

`typecheck.txt` shows:

```text
> pi-flight-recorder@0.1.0 typecheck
> tsc --noEmit
```

No typecheck errors were printed.

`full-test.txt` shows:

```text
Test Files  21 passed (21)
Tests  126 passed (126)
```

`diff-check.txt` shows no `git diff --check` output.

## What This Shows

- `ticket:20260527-local-diagnosis-model-eval-harness#ACC-001` is supported: the harness consumed the corpus contract, recorded all 12 case IDs, validated required fields/enums/outcome contracts, and reported zero contract errors.
- `ticket:20260527-local-diagnosis-model-eval-harness#ACC-002` is supported: deterministic baseline results were recorded for every case, with `deterministicMismatchCount: 0` against the corpus baseline.
- `ticket:20260527-local-diagnosis-model-eval-harness#ACC-003` is supported: fake-provider paths exercised valid acceptance, malformed JSON, schema-invalid extra fields, unsafe route/action output, unsupported facts, timeout fallback, provider-error fallback, and the redaction-placeholder accepted-but-unsafe rubric path.
- `ticket:20260527-local-diagnosis-model-eval-harness#ACC-004` is supported: per-case and exercise outputs include model outcome, validator outcome, fallback reason, validation issue, elapsed time, safety flags, rubric rating, reviewer notes placeholder, desired/hard-fail outcome values, and output view fields. The harness also validates that emitted results contain all `metricFieldsExpectedFromHarness` fields.
- `ticket:20260527-local-diagnosis-model-eval-harness#ACC-005` is supported: the harness command ran successfully; `npm run typecheck` and `npm test` passed; `git diff --check` was clean. No product source changes were made by this ticket.

## What This Does Not Show

- This does not show real Bonsai 1.7B quality, latency, reliability, or JSON behavior; all model-provider paths here are fake/local contract exercises.
- This does not start or validate `llama-server`, download models, install runtimes, call hosted providers, or prove loopback runtime behavior.
- This does not decide release posture or tune prompt/validator/timeout defaults. Those belong to `ticket:20260527-bonsai-diagnosis-model-evaluation` or a later concrete tuning ticket.
- This does not close `ticket:20260523-real-corpus-evaluation-and-tuning`; the corpus and harness are synthetic/redacted and diagnosis-polish-specific.
- The privacy scan is targeted, not exhaustive. It should be rerun if artifacts or harness output shape changes.

## Freshness And Recheck Triggers

Re-run this harness if:

- `diagnosis-polish-eval-corpus.v1.json` changes;
- `src/flight-learn-diagnosis.ts` or `src/flight-learn-local-diagnosis-model.ts` changes;
- local-model fallback reasons, response schema, fact-packet bounds, or validator rules change;
- the Bonsai evaluation ticket needs additional metric fields;
- audit challenges prompt safety, accepted-unsafe classification, or result-shape sufficiency.
