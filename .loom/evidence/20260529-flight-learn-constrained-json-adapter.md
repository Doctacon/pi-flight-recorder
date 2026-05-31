# Flight Learn Constrained JSON Adapter Evidence

ID: evidence:20260529-flight-learn-constrained-json-adapter
Type: Evidence Dossier
Status: recorded
Created: 2026-05-29
Updated: 2026-05-29
Observed: 2026-05-29 UTC

## Summary

Implemented `ticket:20260529-flight-learn-constrained-json-adapter` through the bounded adapter/test slice. The local llama.cpp adapter now sends OpenAI-style `response_format: { type: "json_schema", json_schema: { name, strict: true, schema } }` for both explicitly enabled generator and judge chat-completion calls.

The generator schema is distinct from the judge schema. Generator requests use `flight_learn_diagnosis_polish_v2` with `schemaVersion: 2`, required `whatHappened.sentences[].text + factIds`, optional display-only fields, and nested `additionalProperties: false`. Judge requests use `flight_learn_narrative_judge_v1` with `schemaVersion: 1`, `overallVerdict`, optional `failClosedReason`, and sentence verdict objects matching the existing judge validator.

No product defaults, command surface, storage, routing, classifier behavior, source-of-truth fields, artifact/rule/source/docs/Loom mutation, hosted endpoints, downloads, retries, repair loops, or unconstrained fallback generation were added.

Artifact directory:

```text
.loom/evidence/artifacts/20260529-flight-learn-constrained-json-adapter/
```

Key artifacts:

- `00-preflight-status.txt` - workspace status before this run; records pre-existing dirty state.
- `01-prechange-focused-tests.txt` - focused adapter tests before this slice changed code.
- `02-focused-tests.txt` - focused adapter tests after implementation.
- `03-typecheck.txt` - `npm run typecheck`.
- `04-build.txt` - `npm run build`.
- `05-full-tests.txt` - full `npm test` run.
- `06-diff-check.txt` - `git diff --check`.
- `07-postchange-status.txt` - workspace status after implementation.
- `privacy-scan.json` - privacy scan over this ticket's Loom artifacts/records.
- `08-followup-focused-tests.txt` - focused adapter test rerun after audit follow-up.
- `09-followup-diff-check.txt` - `git diff --check` rerun after audit follow-up.
- `10-final-diff-check.txt` - final `git diff --check` after closure/unblock record updates.

## Source Changes Observed

Changed source/test files:

- `src/flight-learn-llama-cpp-adapter.ts`
  - Added simple inline JSON schemas for generator and local narrative judge responses.
  - Replaced `response_format: { type: "json_object" }` with schema-constrained `json_schema` response formats.
  - Kept the existing `/v1/chat/completions` route, loopback URL validation, direct loopback HTTP agent/proxy bypass, response byte/content caps, model-label validation, and adapter error behavior.
  - Audit noted that the current diff against repository `HEAD` includes `MAX_MAX_OUTPUT_TOKENS = 512` instead of `256`. That request-budget value was not changed during the audit follow-up because the workspace already contained substantial pre-existing local-model changes and changing it here would risk crossing ticket boundaries. This ticket's closure claim does not depend on increasing that clamp; the residual diff is documented for review.
- `src/flight-learn-llama-cpp-adapter.test.ts`
  - Added request-body assertions that inspect the actual adapter POST body for generator and judge calls.
  - Asserted schema names, `strict: true`, no `$ref`/`$defs`, required schema versions, required `whatHappened.sentences[].text + factIds`, judge verdict enums, and supported factId shape.
  - Preserved existing local-only, proxy-bypass, unsafe config, timeout, HTTP error, invalid transport, oversized response, and malformed-content tests.
  - After audit, updated the basic generator fixture so its fake provider content includes the required schema-shaped `whatHappened.sentences[].text + factIds` object. The sentence duplicates deterministic text so this no-judge transport test still validates generator request-body construction without implying accepted narrative behavior.

No `src/flight-learn-local-diagnosis-model.ts` change was required.

## Validation Commands

| Artifact | Command | Result |
| --- | --- | --- |
| `01-prechange-focused-tests.txt` | `npm test -- src/flight-learn-llama-cpp-adapter.test.ts` before implementation | 1 file passed, 13 tests passed |
| `02-focused-tests.txt` | `npm test -- src/flight-learn-llama-cpp-adapter.test.ts src/flight-learn-local-diagnosis-model.test.ts` after implementation | 2 files passed, 37 tests passed |
| `03-typecheck.txt` | `npm run typecheck` | passed |
| `04-build.txt` | `npm run build` | passed |
| `05-full-tests.txt` | `npm test` | 21 files passed, 142 tests passed |
| `06-diff-check.txt` | `git diff --check` | no output, passed |
| `08-followup-focused-tests.txt` | `npm test -- src/flight-learn-llama-cpp-adapter.test.ts` after audit follow-up | 1 file passed, 13 tests passed |
| `09-followup-diff-check.txt` | `git diff --check` after audit follow-up | no output, passed |
| `10-final-diff-check.txt` | `git diff --check` after closure/unblock record updates | no output, passed |

The pre-change focused test run is not a red test; it records the starting adapter-test baseline from the already dirty workspace. The post-change focused test run exercises the new schema assertions. The follow-up focused test confirms the audit fixture correction did not break the adapter tests.

## Privacy And Boundary Scan

`privacy-scan.json` reports:

```json
{
  "pass": true,
  "scannedFiles": 17,
  "forbiddenPatternCount": 0,
  "findings": []
}
```

Command artifacts were redacted to replace the local repository path with `<repo>` before the scan. The scan checked 17 files for raw home paths, Pi session paths, credential-looking assignments, prompt markers, and transcript markers across this ticket's evidence artifacts/records, audit records, ticket records, and parent plan update.

## What This Shows

- `ticket:20260529-flight-learn-constrained-json-adapter#ACC-001` is supported: focused tests inspect the actual generator adapter POST body and verify OpenAI-style `response_format.type === "json_schema"`, `strict: true`, inline schema with no `$ref`/`$defs`, `schemaVersion: 2`, and the required `whatHappened.sentences[].text + factIds` shape.
- `ticket:20260529-flight-learn-constrained-json-adapter#ACC-002` is supported: focused tests inspect the actual judge adapter POST body and verify the distinct `flight_learn_narrative_judge_v1` schema with `schemaVersion: 1`, allowed verdict/fail-closed enums, and sentence verdict fields.
- `ticket:20260529-flight-learn-constrained-json-adapter#ACC-003` is supported by existing and preserved focused tests: invalid/non-loopback URLs, unsafe config keys, proxy-bypass behavior, abort timeout, HTTP error, invalid transport, oversized responses, and malformed content still fail closed or fall back through existing behavior.
- `ticket:20260529-flight-learn-constrained-json-adapter#ACC-004` is supported within this source slice: only the adapter and its focused tests changed; no command defaults, storage/routing/classifier behavior, source-of-truth persistence, or artifact/rule/source/docs/Loom mutation path was introduced.
- `ticket:20260529-flight-learn-constrained-json-adapter#ACC-005` is supported within this evidence scope: focused tests, typecheck, build, full tests, diff-check, audit follow-up focused tests, initial audit, and clear follow-up audit are recorded.

## What This Does Not Show

- This does not prove accepted `/flight-learn` narrative wording.
- This does not prove local judge acceptance, semantic grounding, operator comprehension, real-session usefulness, release readiness, or broad Bonsai suitability.
- This does not run Bonsai 4B or `llama-server`; runtime replay belongs to `ticket:20260529-flight-learn-constrained-judge-replay`.
- This does not change `/flight-learn` defaults or make model calls without explicit opt-in.
- This does not justify weakening verifier, judge, privacy, display-only, or deterministic fallback gates.

## Audit Follow-up

Initial audit `audit:20260529-flight-learn-constrained-json-adapter-review` returned concerns, not a clear verdict:

- `FIND-001`: the evidence claimed request limits were kept while the current diff against repository `HEAD` includes `MAX_MAX_OUTPUT_TOKENS = 512` instead of `256`. Disposition: documented the visible request-budget diff and narrowed the evidence wording to response byte/content caps and current adapter behavior. The cap was not changed during follow-up because this workspace had pre-existing dirty local-model changes; changing it here would risk crossing ticket scope.
- `FIND-002`: `validPolishJson()` omitted schema-required `whatHappened`. Disposition: updated the fixture to include required `whatHappened.sentences[].text + factIds` while keeping the no-judge transport test from claiming accepted narrative behavior. `08-followup-focused-tests.txt` records the focused adapter tests still pass.

## Follow-up Audit And Next Move

Follow-up audit `audit:20260529-flight-learn-constrained-json-adapter-followup-review` returned clear for closure within bounded scope. The ticket can close with residual risks preserved: no real `llama-server` replay, no accepted narrative wording claim, no judge/latency evidence, no operator comprehension evidence, and no release-readiness claim.

Next plan move: unblock `ticket:20260529-flight-learn-constrained-judge-replay` and run the constrained generator plus judge/latency replay.
