# Local Narrative Judge Provider Contract Evidence

ID: evidence:20260528-local-narrative-judge-provider-contract
Type: Evidence Dossier
Status: recorded
Created: 2026-05-28
Updated: 2026-05-28
Observed: 2026-05-28

## Summary

Implemented the fake-provider local narrative judge contract for optional `/flight-learn` `whatHappened` narrative text under `ticket:20260528-local-narrative-judge-provider-contract`.

Changed source/test targets:

- `src/flight-learn-local-diagnosis-model.ts`
- `src/flight-learn-local-diagnosis-model.test.ts`
- `src/flight-learn-llama-cpp-adapter.test.ts`
- `src/pi-extension.test.ts`

Artifact directory:

```text
.loom/evidence/artifacts/20260528-local-narrative-judge-provider-contract/
```

Key artifacts:

- `run-local-narrative-judge-provider-contract-harness.mjs` - sanitized fake-generator/fake-judge harness.
- `local-narrative-judge-provider-contract-results.json` - full harness results.
- `harness-summary.json` - compact harness metrics.
- `ralph-worker-output.md` - implementation worker report.
- `audit:20260528-local-narrative-judge-provider-contract-review` - initial audit; verdict `changes-needed` with `FIND-001` for accepted judge sentences with empty `supportedFactIds`.
- `audit:20260528-local-narrative-judge-provider-contract-followup-review` - follow-up audit; verdict `clear` within fake-provider/provider-interface scope.

No real judge model, real local model, runtime start, model download, hosted call, UI integration, storage/routing/classifier change, artifact mutation, or release-readiness claim was exercised or added.

## Procedure

Read the ticket, completed judge-validation research, closed fact-ID verifier ticket/evidence/audit, and current local diagnosis model source/tests before editing.

Implementation changes:

- Added `LocalNarrativeJudgeProvider`, `LocalNarrativeJudgeRequest`, and structured judge response types.
- Added `judgeProvider` and `judgeTimeoutMs` options to `LocalDiagnosisPolishOptions`.
- Added a bounded judge request containing only policy metadata, deterministic display context, redacted `facts[]`, candidate sentence text, candidate fact IDs, cited fact texts, prompt, and abort signal.
- Added judge response validation for schema version, allowed keys, overall verdict, fail-closed reason, exact sentence coverage, per-sentence verdict, supported fact IDs, unsupported claims, reason, and confidence.
- Enforced judge veto-only behavior: judge output cannot rewrite text or add display fields; extra response fields fail closed.
- Enforced ordering: the local judge runs only after the deterministic fact-ID verifier accepts a `whatHappened` candidate.
- Enforced fail-closed behavior: narrative candidates without a configured judge provider fall back to deterministic wording; judge reject/uncertain/low confidence/malformed/extra-field/provider-error/timeout paths fall back.
- Updated adapter and Pi fake local-model fixtures so existing generator-only loopback tests continue to validate non-narrative display polish without requiring a judge.

## Command Results

Focused source/integration tests:

```bash
npm test -- src/flight-learn-local-diagnosis-model.test.ts src/flight-learn-llama-cpp-adapter.test.ts src/pi-extension.test.ts
```

Result: passed, `3` test files / `63` tests.

Sanitized local judge contract harness:

```bash
node --import tsx .loom/evidence/artifacts/20260528-local-narrative-judge-provider-contract/run-local-narrative-judge-provider-contract-harness.mjs
```

Result after audit follow-up fix: passed, `14` exercises / `14` matched expected outcomes.

Typecheck:

```bash
npm run typecheck
```

Result: passed, TypeScript `tsc --noEmit`.

Build:

```bash
npm run build
```

Result: passed (`npm run clean && tsc -p tsconfig.build.json`).

Diff check:

```bash
git diff --check
```

Result: passed with no output.

## Harness Summary

`harness-summary.json` records:

```json
{
  "modelRuntimeStarted": false,
  "hostedProviderUsed": false,
  "productSourceMutatedByHarness": false,
  "factPacketVersion": 2,
  "factCount": 12,
  "totalExercises": 14,
  "passCount": 14,
  "failCount": 0,
  "outcomes": {
    "accepted": 2,
    "provider-unavailable": 1,
    "unsupported-facts": 5,
    "unsafe-output": 1,
    "malformed-json": 1,
    "schema-invalid": 2,
    "provider-error": 1,
    "timeout": 1
  }
}
```

The harness also records judge call counts. Important ordering checks:

- accepted narrative after judge accept: judge called once;
- narrative with no judge provider: judge called zero times and fallback reason `provider-unavailable`;
- non-narrative polish with no judge provider: accepted and judge called zero times;
- deterministic verifier failure with unknown fact ID: judge called zero times.

## What This Shows

- `ACC-001` is supported: source/tests show a model-agnostic local judge provider interface and bounded request/response schema limited to redacted facts, candidate sentences, fact IDs/cited fact text, verdicts, reasons, and confidence.
- `ACC-002` is supported after audit follow-up fix: tests/harness show judge accept allows the already verified candidate, while reject, uncertain, low-confidence, empty supported fact IDs, unsafe/action-advice verdict, malformed JSON, extra fields, missing sentence coverage, provider error, and timeout all fall back to deterministic wording.
- `ACC-003` is supported in fake-provider scope: judge requests are built only from already redacted facts/candidate text and do not include raw sessions, unredacted paths, secrets, prompts, transcripts, provider keys, hosted URLs, or download/runtime behavior. Provider and judge error details are sanitized from validation issues.
- `ACC-004` is supported: tests/harness show judge runs only after deterministic fact-ID verification succeeds, and deterministic verifier failures do not call the judge.
- `ACC-005` is supported by focused tests, harness, typecheck, and diff-check.

## Audit Follow-up

Initial audit `audit:20260528-local-narrative-judge-provider-contract-review` returned `changes-needed` because accepted judge sentence verdicts could provide an empty `supportedFactIds` array and still accept the narrative.

Follow-up fix:

- accepted judge sentence verdicts now fail closed when `supportedFactIds` is empty;
- focused tests and harness add an `empty supported fact IDs` rejection case.

Validation after this fix passed: focused tests (63), judge harness (14/14), typecheck, build, and diff-check. Follow-up audit returned `clear` for the fake-provider/provider-interface scope.

## What This Does Not Show

- This does not prove any real judge model quality, reliability, latency, or JSON behavior.
- This does not run Bonsai 4B, Prometheus, NLI, ONNX, Transformers.js, `llama.cpp`, or any other runtime.
- This does not wire a real judge adapter, CLI flag, runtime lifecycle, model download, or UI configuration.
- This does not make local-model polish default or required.
- This does not change stored delta fields, routing, classifier behavior, artifact candidates, source files, docs, rules, skills, prompts, or Loom records outside this ticket/evidence update.

## Freshness And Recheck Triggers

Re-run or supersede this evidence if the fact packet shape, `whatHappened` candidate schema, judge provider interface, judge request/response schema, fallback enum/labels, generator adapter, Pi local-model options, or future real judge adapter changes.
