# Flight Learn Narrative Local Model Contract Evidence

ID: evidence:20260528-flight-learn-narrative-local-model-contract
Type: Evidence Dossier
Status: recorded
Created: 2026-05-28
Updated: 2026-05-28
Observed: 2026-05-28

## Summary

Implemented and validated the field-specific local-model narrative contract for `/flight-learn` `whatHappened` display wording under `ticket:20260528-flight-learn-narrative-local-model-contract`.

The implementation remains fake-provider/local-contract only. No Bonsai model, `llama-server`, hosted provider, network endpoint, telemetry path, model download, UI rendering change, adapter change, CLI default change, or storage/routing path was exercised or changed.

Changed source targets:

- `src/flight-learn-local-diagnosis-model.ts`
- `src/flight-learn-local-diagnosis-model.test.ts`

Artifact directory:

```text
.loom/evidence/artifacts/20260528-flight-learn-narrative-local-model-contract/
```

Key artifacts:

- `run-narrative-local-model-contract-harness.mjs` - fake-provider harness consuming the narrative corpus.
- `narrative-local-model-contract-harness-results.json` - per-case corpus/harness results.
- `harness-summary.json` - compact harness metrics, regenerated after audit follow-up fixes.
- `ralph-worker-output.md` - implementation worker report.
- `ralph-audit-output.md` - initial Ralph review output; recorded as `audit:20260528-flight-learn-narrative-local-model-contract-review` with `changes-needed`.
- `ralph-followup-audit-output.md` - first follow-up review output; recorded as `audit:20260528-flight-learn-narrative-local-model-contract-followup-review` with `changes-needed`.
- `ralph-second-followup-audit-output.md` - second follow-up review output; recorded as `audit:20260528-flight-learn-narrative-local-model-contract-second-followup-review` with `changes-needed`.
- `ralph-third-followup-audit-output.md` - third follow-up review output; recorded as `audit:20260528-flight-learn-narrative-local-model-contract-third-followup-review` with `changes-needed`.
- `ralph-fourth-followup-audit-output.md` - fourth follow-up review output; recorded as `audit:20260528-flight-learn-narrative-local-model-contract-fourth-followup-review` with `changes-needed`.
- `ralph-fifth-followup-audit-output.md` - fifth follow-up review output; recorded as `audit:20260528-flight-learn-narrative-local-model-contract-fifth-followup-review` with `changes-needed`.

## Procedure

Source records and implementation targets were inspected first, including the active ticket, parent plan, prerequisite corpus/evidence/audit, `REQ-030` through `REQ-032` / `SCN-010`, current local diagnosis model source/tests, and the prior fake-provider harness shape.

Implementation changes were then made only in the allowed source files, plus this ticket's evidence/artifact directory and ticket record.

Commands run:

```bash
npm test -- src/flight-learn-local-diagnosis-model.test.ts
node --import tsx .loom/evidence/artifacts/20260528-flight-learn-narrative-local-model-contract/run-narrative-local-model-contract-harness.mjs
npm run typecheck
git diff --check
```

Final observed command results after audit follow-up fixes:

- Focused Vitest run: `src/flight-learn-local-diagnosis-model.test.ts` passed with 19 tests.
- Narrative corpus fake-provider harness exited successfully, including added exercise probes for sentence-start, comma/colon-prefaced, article/adjective-object/current/possessive-object, leading-adverb/prepositional/purpose, `check`, `validate`, `use`, `verify`, and unpunctuated-intro imperatives plus singular/plural/case-variant internal fact-packet/structure/headline/packet/Problem echo.
- `npm run typecheck` exited successfully.
- `git diff --check` produced no output.

## Observations

`harness-summary.json` records:

```json
{
  "totalCases": 15,
  "perCaseValidatorOutcomeCounts": {
    "accepted": 7,
    "fallback": 8
  },
  "perCaseFallbackReasonCounts": {
    "null": 7,
    "unsupported-facts": 2,
    "unsafe-output": 5,
    "schema-invalid": 1
  },
  "perCaseRubricOutcomeCounts": {
    "accepted-narrative-better": 5,
    "accepted-equivalent": 1,
    "fallback-expected": 8,
    "accepted-narrative-worse": 1
  },
  "exerciseFallbackReasonCounts": {
    "malformed-json": 1,
    "timeout": 1,
    "provider-error": 1,
    "empty-output": 1,
    "unsafe-output": 25
  },
  "validatorMismatchCount": 0,
  "promptSafetyFailureCount": 0,
  "outputSafetyFailureCount": 0,
  "exerciseMismatchCount": 0,
  "acceptedNarrativeBetterAcceptedCount": 5,
  "fallbackExpectedFallbackCount": 8
}
```

The overlong/wall-of-text corpus probe falls back with the existing `schema-invalid` fallback reason and a specific validation issue (`whatHappened narrative exceeded ... limit`). No new fallback enum value was introduced, preserving existing UI fallback label exhaustiveness outside this ticket's write scope.

Audit follow-up note: `audit:20260528-flight-learn-narrative-local-model-contract-followup-review` found that a positive corpus example used the internal term `stored delta`; the corpus example text was adjusted to `stored facts`. A second follow-up found that the prompt over-forbade ordinary `evidence` wording while the corpus intentionally used it. The prompt now forbids internal field names/meta-language (`delta`, `signals`, `bounds`, JSON/allowed-key/schema terms, `headline`, packet/fact-packet wording, and capitalized `Problem` meta-language) while allowing generic operator-facing references such as `stored evidence`.

## What This Shows

- `ACC-001` is supported: the prompt now states field-specific jobs, keeps `headline` / `Problem` concise and conservative, makes `whatHappened` the grounded 2-4 sentence narrative field, requires distinctness from the headline, and keeps JSON output to allowed display fields only.
- `ACC-002` is supported: focused tests and the corpus harness show bounded narrative acceptance, exact duplicate `whatHappened` fallback, unsupported concrete facts fallback, privacy/raw-detail/redaction-placeholder fallback, sentence-start/comma/colon/introductory-phrase/article/adjective/current/possessive-object/leading-adverb/prepositional/purpose/`check`/`validate`/`use`/`verify` imperative action fallback, singular/plural/case-variant internal fact-packet/structure/headline/packet/Problem echo fallback, route/action/mutation/classifier fallback, overlong narrative fallback, malformed JSON fallback, timeout fallback, and provider-error fallback. Safe but generic/no-better narratives are not claimed to be runtime-rejected; the corpus records that class as `accepted-narrative-worse` for later real-model quality review.
- `ACC-003` is supported: disabled/unavailable/default tests preserve deterministic views, invalid model output keeps deterministic display fields, and source deltas are not mutated by accepted or rejected fake-provider output.
- `ACC-004` is supported: the fake-provider harness consumes all 15 narrative corpus cases and records per-case validator/rubric outcomes without starting a real model.
- `ACC-005` is supported by the focused test run, corpus harness run, successful typecheck, and clean `git diff --check`.

## What This Does Not Show

- This does not prove Bonsai 4B can produce useful or safe narratives.
- This does not validate real `llama.cpp` runtime behavior, latency, lifecycle, or model output quality.
- This does not render the narrative in the focused card UI; that belongs to the integration ticket.
- This does not prove every safe-but-generic narrative will be rejected at runtime. The runtime validator rejects exact duplicates and unsafe/unsupported output, while the narrative rubric still rates safe-but-worse prose separately.
- This does not change CLI defaults, adapter behavior, storage semantics, route ranking, artifact generation, source edits, Loom mutations, rules, skills, or prompts outside the local-model prompt string under test.

## Freshness And Recheck Triggers

Re-run or supersede this evidence if the local-model prompt, response schema, narrative validator, safety regexes, fact-packet shape, fallback enum, narrative corpus, `REQ-030` through `REQ-032`, or focused-card UI integration changes.
