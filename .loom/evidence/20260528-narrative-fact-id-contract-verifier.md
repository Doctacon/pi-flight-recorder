# Narrative Fact-ID Contract Verifier Evidence

ID: evidence:20260528-narrative-fact-id-contract-verifier
Type: Evidence Dossier
Status: recorded
Created: 2026-05-28
Updated: 2026-05-28
Observed: 2026-05-28

## Summary

Implemented the first successor contract after the failed regex-semantic narrative validator: optional local-model `whatHappened` output now uses a fact-ID deterministic verifier.

Changed source/test targets:

- `src/flight-learn-local-diagnosis-model.ts`
- `src/flight-learn-local-diagnosis-model.test.ts`
- `src/flight-learn-llama-cpp-adapter.ts`
- `src/flight-learn-llama-cpp-adapter.test.ts`
- `src/pi-extension.test.ts`

Artifact directory:

```text
.loom/evidence/artifacts/20260528-narrative-fact-id-contract-verifier/
```

Key artifacts:

- `run-fact-id-contract-harness.mjs` - sanitized fake-provider harness for the fact-ID deterministic verifier.
- `fact-id-contract-harness-results.json` - full harness exercise results.
- `harness-summary.json` - compact harness summary.
- `ralph-worker-output.md` - implementation worker report.
- `audit:20260528-narrative-fact-id-contract-verifier-review` - initial audit; verdict `changes-needed` with `FIND-001` through `FIND-003`.
- `audit:20260528-narrative-fact-id-contract-verifier-followup-review` - first follow-up audit; verdict `changes-needed` with remaining `FIND-001`, `FIND-003`, and low-severity `FIND-004`.
- `audit:20260528-narrative-fact-id-contract-verifier-second-followup-review` - second follow-up audit; verdict `changes-needed` with remaining raw-command and follow-up/classifier advice boundary concerns.
- `audit:20260528-narrative-fact-id-contract-verifier-third-followup-review` - third follow-up audit; verdict `changes-needed` because broad display-only/classifier semantics still exceeded deterministic hard-literal scope.

No real model, local runtime, model download, hosted call, UI integration, storage/routing change, classifier behavior, or source-of-truth mutation was exercised or added.

## Procedure

Read the ticket, completed judge-validation research, blocked regex-semantic contract ticket, relevant `/flight-learn` spec requirements/scenarios, and current local-model source/tests before editing.

Implementation changes:

- Changed `LocalDiagnosisFactPacket` to version `2` and added bounded `facts[]` support facts with stable local IDs such as `F1`, `F2`, `F9`, `F10`, `F20`, and `F21`.
- Added fact bounds: max narrative sentences/chars, max facts, and max fact chars.
- Updated the local-model prompt to require `schemaVersion: 2` and require `whatHappened` as `{ sentences: [{ text, factIds }] }` rather than an arbitrary string.
- Updated response validation so arbitrary string `whatHappened`, missing/empty/duplicate/excessive `factIds`, unknown IDs, malformed schema, overlong narratives, duplicate deterministic wording, hard unsafe literals, route/action/mutation/classifier language, provider errors, and timeouts fail closed.
- Removed the narrative token allow-list / unsupported-token semantic grounding gate from `whatHappened`; non-narrative fields retain existing deterministic support checks.
- Updated adapter request validation to require fact packet version `2` and updated fake local-model fixtures in adapter/Pi tests.

## Command Results

Focused local diagnosis model tests:

```bash
npm test -- src/flight-learn-local-diagnosis-model.test.ts
```

Result: passed, `1` test file / `20` tests.

Adapter and Pi integration fake-provider tests:

```bash
npm test -- src/flight-learn-llama-cpp-adapter.test.ts src/pi-extension.test.ts
```

Result after updating adapter version validation and fake response fixtures: passed, `2` test files / `40` tests.

Sanitized fact-ID harness:

```bash
node --import tsx .loom/evidence/artifacts/20260528-narrative-fact-id-contract-verifier/run-fact-id-contract-harness.mjs
```

Result after third audit follow-up fixes: passed, `18` exercises / `18` matched expected outcomes.

Combined focused validation:

```bash
npm test -- src/flight-learn-local-diagnosis-model.test.ts src/flight-learn-llama-cpp-adapter.test.ts src/pi-extension.test.ts
npm run typecheck
```

Result after second audit follow-up fixes: passed, `3` test files / `60` tests; TypeScript `tsc --noEmit` passed.

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
  "factPacketVersion": 2,
  "factCount": 12,
  "totalExercises": 18,
  "passCount": 18,
  "failCount": 0,
  "outcomes": {
    "accepted": 1,
    "schema-invalid": 4,
    "unsupported-facts": 1,
    "unsafe-output": 8,
    "empty-output": 1,
    "malformed-json": 1,
    "provider-error": 1,
    "timeout": 1
  }
}
```

## What This Shows

- `ACC-001` is supported: fact packet version `2` exposes stable bounded redacted fact IDs and retains redaction/omission behavior for raw paths, secrets, prompts, transcripts, stack traces, and overlong snippets.
- `ACC-002` is supported: prompt/schema require `whatHappened.sentences[].text` plus non-empty known `factIds`; arbitrary string narrative is schema-invalid.
- `ACC-003` is supported for the narrowed deterministic hard-literal verifier scope after audit follow-up fixes: tests/harness cover accepted fact-ID narrative, missing/unknown/duplicate/excessive IDs, extra/invalid schema, hard privacy/safety literals, enumerated raw command literals, explicit route/routed/routing/follow-up/action/mutation/classifier/ranking literals, duplicate deterministic output, malformed JSON, timeout, provider error, and no source delta mutation. This evidence does not claim broad semantic rejection of spaced `follow up`, bucket-fit, or other route/classifier-adjacent paraphrases; those belong to the dependent local judge provider ticket.
- `ACC-004` is supported: loopback adapter tests still pass, fake Pi local-model polish renders accepted fact-ID output, and persisted deltas/artifact candidates do not store model wording.
- `ACC-005` is supported by focused tests, adapter/Pi tests, harness, typecheck, and diff-check.

## Audit Follow-up

Initial audit `audit:20260528-narrative-fact-id-contract-verifier-review` returned `changes-needed`:

- `FIND-001`: transcript-like deterministic text could leak into `facts[]`/prompt after whitespace collapse.
- `FIND-002`: passive route advice could pass hard safety checks.
- `FIND-003`: non-npm raw command literals could pass hard safety checks.

Follow-up fixes:

- transcript detection now also catches inline/collapsed role-labelled transcript markers, and focused tests assert transcript-like `delta.reality` is omitted as raw content from packet facts and prompt;
- route-language hard safety now rejects route/routed/routing/route noun variants;
- raw command detection covers common executable + argument forms such as `git status`, `python manage.py`, `make test`, and `node script.js`;
- fact-ID validation also rejects duplicate and excessive `factIds` per sentence.

Validation after these fixes passed: local diagnosis tests (20), fact-ID harness (13/13), adapter/Pi tests (40), typecheck, and diff-check.

First follow-up audit `audit:20260528-narrative-fact-id-contract-verifier-followup-review` returned `changes-needed`:

- single-role prompt/transcript-like text could still reach deterministic fields, `facts[]`, and prompt;
- raw command detection still missed command literals such as `ls -la` and `curl ...`;
- the optional sentence `role` key made the prompt/schema contract ambiguous.

Second follow-up fixes:

- any exact role-labelled source text (`user:`, `assistant:`, `system:`, `developer:`, `tool:`, `bashExecution:`) is now treated as transcript/prompt-like input and omitted as raw content;
- raw command hard safety now covers additional shell/network/file command forms including `ls` and `curl` with arguments;
- sentence-level `role` is no longer accepted as an extra key;
- tests and harness exercises cover these regressions.

Validation after these second follow-up fixes passed: local diagnosis tests (20), fact-ID harness (16/16), adapter/Pi tests (40), typecheck, and diff-check.

Second follow-up audit `audit:20260528-narrative-fact-id-contract-verifier-second-followup-review` returned `changes-needed` because broader project/common command literals (`tsx`, `duckdb`, `vite`, `deno`) and non-`route` follow-up/classifier advice variants (`belongs/maps/fits/become ... follow-up`) could still pass.

Third follow-up fixes:

- raw command hard safety now includes project/common executables such as `tsx`, `vite`, `deno`, `duckdb`, `sqlite`, `psql`, `brew`, and related local tooling when followed by arguments;
- display-only hard safety now rejects `follow-up`/`followup` wording in model output to avoid route/classifier-adjacent advice in the narrative field;
- tests and harness exercises cover the new raw-command and follow-up-advice variants.

Validation after these third follow-up fixes passed: local diagnosis tests (20), fact-ID harness (18/18), adapter/Pi tests (40), typecheck, and diff-check.

Third follow-up audit `audit:20260528-narrative-fact-id-contract-verifier-third-followup-review` returned `changes-needed` because spaced `follow up` and bucket-fit semantic paraphrases still pass. That audit also recommended narrowing this ticket's deterministic-verifier claim rather than continuing regex expansion. The evidence and ticket now explicitly narrow ACC-003 to deterministic hard-literal families and route broader semantic action/classifier judgment to the dependent local judge provider ticket.

## What This Does Not Show

- This does not prove semantic entailment or narrative usefulness.
- This does not prove Bonsai 4B output quality, latency, JSON reliability, or local runtime behavior.
- This does not implement the local judge provider. A sentence can cite a valid fact ID while adding unsupported meaning, spaced follow-up advice, or bucket/classifier-like paraphrases; the dependent judge-provider ticket must address that as a veto/uncertainty gate.
- This does not change product UI layout or make local-model polish default.
- This does not weaken the deterministic diagnosis fallback/source-of-truth boundary.

## Freshness And Recheck Triggers

Re-run or supersede this evidence if the fact packet shape, fact IDs, local-model prompt, `whatHappened` response schema, hard safety filters, llama.cpp adapter request assertion, Pi local-model options, or local judge provider contract changes.
