# Flight Learn Constrained Judge Replay Evidence

ID: evidence:20260529-flight-learn-constrained-judge-replay
Type: Evidence Dossier
Status: recorded
Created: 2026-05-29
Updated: 2026-05-29
Observed: 2026-05-29 UTC

## Summary

Ran `ticket:20260529-flight-learn-constrained-judge-replay` against the existing local Bonsai 4B Q1_0 GGUF and installed local `llama-server`, using the implemented constrained adapter path rather than a standalone prompt-only harness.

Result: constrained adapter generation improved structured output compared with prompt-only tuning, but **accepted narratives remained 0/15** under the existing deterministic verifier plus local judge gates. The replay produced 13/15 parse-valid, 13/15 schema-valid, 8/15 deterministic-verifier-passing generator outputs, 3 judge calls, 0 judge passes, and 0 unsafe accepted outputs. Observed narrative non-acceptance reasons were timeout, empty-output/no narrative candidate, unsupported-facts, schema-invalid, and unsafe-output. Audit follow-up clarified that the original `fallbackCount` metric means narrative non-acceptance, not complete product-level deterministic fallback: 10/15 cases had a product-level fallback reason, while 5/15 used some local-model display fields without an accepted `whatHappened` narrative.

Recommendation from this evidence: stop/replan before model-enabled inbox integration for this Bonsai 4B/current-runtime path. Do not weaken verifier, judge, privacy, or fallback gates to force progress.

Artifact directory:

```text
.loom/evidence/artifacts/20260529-flight-learn-constrained-judge-replay/
```

Key artifacts:

- `00-preflight-status.txt` - workspace status before replay; records substantial pre-existing dirty state.
- `01-corpus-summary.txt` - corpus ID/count/case inventory summary.
- `02-runtime-preflight.txt` - local `llama-server` availability and Bonsai model checksum preflight.
- `source-fingerprints-before.json` / `source-fingerprints-after.json` - source fingerprints for side-effect comparison.
- `03-runtime-provenance.txt` - runtime version, model checksum, base URL, corpus ID/count.
- `04-server-command.txt` - redacted loopback `llama-server` command.
- `05-llama-server-health.json` and `06-server-start-status.txt` - server start/health observation.
- `07-replay-summary.json` - aggregate replay metrics and recommendation.
- `08-replay-results.json` - per-case staged metrics and sanitized previews.
- `09-sanitized-output-samples.json` - sanitized output previews only; no full prompts.
- `10-qualitative-failure-notes.md` - qualitative failure summary.
- `11-server-log-summary.txt` - server log byte-count summary and audit follow-up note that stale temp logs were deleted.
- `12-server-final-status.txt` - server exit observation.
- `13-post-run-listener-check.txt` - post-run listener check.
- `14-replay-run-output.txt` - redacted command output summary from the replay harness.
- `15-source-side-effect-scan.txt` - source fingerprint comparison.
- `16-focused-tests.txt` - focused adapter/local-model tests after replay.
- `17-diff-check.txt` - `git diff --check` after replay.
- `18-post-run-status.txt` - workspace status after replay.
- `19-final-diff-check.txt` - final `git diff --check` after evidence/ticket updates.
- `20-final-ticket-artifact-status.txt` - final status of this ticket's evidence/ticket/artifact paths.
- `privacy-scan.json` - privacy scan over this ticket's artifacts/evidence/ticket record.
- `21-temp-log-cleanup.md` - audit follow-up cleanup evidence for stale temporary server logs.
- `22-fallback-metric-errata.json` - audit follow-up clarification of narrative non-acceptance vs product-level fallback counts.
- `23-followup-diff-check.txt` - `git diff --check` after audit follow-up.
- `24-followup-privacy-scan.json` - follow-up privacy/temp-log scan after audit fixes.
- `25-followup-ticket-artifact-status.txt` - ticket/evidence/audit/artifact status after audit follow-up.
- `26-harness-syntax-check.txt` - syntax check for the updated replay harness.
- `27-final-diff-check.txt` - final `git diff --check` after closure/plan updates.
- `28-final-privacy-scan.json` - final privacy/temp-log scan after closure/plan updates.
- `29-final-ticket-plan-status.txt` - final selected ticket/plan status summary.

## Runtime And Model Provenance

Observed runtime/model from `03-runtime-provenance.txt` and `07-replay-summary.json`:

- Runtime: `/opt/homebrew/bin/llama-server`.
- Version: `9360 (6b4e4bd58)`, AppleClang Darwin arm64 build.
- Model: `~/.cache/pi-flight-recorder/bonsai/Bonsai-4B-Q1_0.gguf`.
- SHA256: `4524b3f997f0f06444e568d1f26e2efd69effa3218c7ad3047432fb171e42168`.
- Server: `http://127.0.0.1:18130`.
- Server health: healthy.
- Server final status: `exit={"code":0,"signal":null}`.
- Post-run listener check: no `181xx` listener observed by the lsof filter.

Redacted command shape:

```bash
/opt/homebrew/bin/llama-server -m ~/.cache/pi-flight-recorder/bonsai/Bonsai-4B-Q1_0.gguf --host 127.0.0.1 --port 18130 -c 4096 --no-webui --jinja
```

No hosted provider, non-loopback endpoint, new model download, runtime install/build/upgrade, custom fork, source/product edit, default change, storage/routing/classifier change, artifact/rule/source mutation, or UI/productization claim was made.

## Harness Path

The harness at `run-constrained-judge-replay.mjs` drove the product adapter flow:

```text
buildFlightLearnDiagnosisViewWithLocalPolish
  -> createLlamaCppLocalDiagnosisPolishOptions
  -> llama.cpp generator provider
  -> deterministic verifier
  -> llama.cpp local narrative judge provider when a narrative candidate existed
```

Constrained adapter configuration recorded in `07-replay-summary.json`:

```json
{
  "route": "/v1/chat/completions",
  "responseFormat": "OpenAI-style response_format.type=json_schema via product adapter",
  "generatorSchemaName": "flight_learn_diagnosis_polish_v2",
  "judgeSchemaName": "flight_learn_narrative_judge_v1",
  "generatorTimeoutMs": 5000,
  "judgeTimeoutMs": 5000,
  "generatorMaxOutputTokens": 320,
  "judgeMaxOutputTokens": 512,
  "loopbackOnly": true,
  "failClosed": true
}
```

The harness records prompt lengths for observability but does not persist full prompts.

## Corpus And Baselines

Corpus:

- Path: `.loom/evidence/artifacts/20260528-flight-learn-narrative-rubric-corpus/narrative-what-happened-eval-corpus.v1.json`.
- ID: `flight-learn-narrative-what-happened-eval-corpus-v1`.
- Count: 15 synthetic/redacted cases.

Prior baseline recorded in this replay:

| Baseline | Parse-valid | Schema-valid | Verifier pass | Judge pass | Accepted | Latency |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Constrained generator-only probe | 15/15 | 15/15 | 15/15 | not run | not run | avg 2705ms, max 3354ms |
| Prompt-only best variant | 8/15 | 8/15 | 7/15 | 0/15 | 0/15 | avg 3255ms total, judge avg 5002ms |
| This constrained adapter + judge replay | 13/15 | 13/15 | 8/15 | 0/3 | 0/15 | avg 4444ms total, max 9511ms |

## Aggregate Replay Metrics

From `07-replay-summary.json`:

```json
{
  "totalCases": 15,
  "parseValidCount": 13,
  "schemaValidCount": 13,
  "verifierPassCount": 8,
  "narrativeCandidateCount": 3,
  "judgeCallCount": 3,
  "judgePassCount": 0,
  "acceptedCount": 0,
  "fallbackCount": 15,
  "fallbackReasons": {
    "timeout": 3,
    "empty-output": 6,
    "unsupported-facts": 2,
    "schema-invalid": 1,
    "unsafe-output": 3
  },
  "timeoutCount": 3,
  "unsafeAcceptedCount": 0,
  "metricClarification": "fallbackCount/fallbackReasons are narrative non-acceptance counts, not product-level deterministic fallback counts.",
  "narrativeAcceptedCount": 0,
  "narrativeNonAcceptedCount": 15,
  "productFallbackCount": 10,
  "productUsedLocalModelWithoutAcceptedNarrativeCount": 5,
  "latencyMs": {
    "min": 2593,
    "max": 9511,
    "avg": 4444
  },
  "generatorLatencyMs": {
    "min": 2592,
    "max": 5007,
    "avg": 3696
  },
  "judgeLatencyMs": {
    "min": 2003,
    "max": 5003,
    "avg": 3730
  }
}
```

Qualitative shape:

- Most schema-valid outputs still failed before judge because they duplicated deterministic wording, included unsafe/non-display wording, cited unknown fact IDs, or included unsupported display fields.
- Only 3 cases reached the local judge; all 3 failed closed.
- One judge call timed out at the 5s budget; the other judge failures were `not useful` and sentence coverage/schema mismatch.
- Unsafe accepted outputs stayed at zero.
- Metric clarification: `fallbackCount: 15` in the generated summary means 15/15 `whatHappened` narrative non-acceptances, not 15 complete product-level deterministic fallbacks. Product-level fallback-reason cases were 10/15; 5/15 used some local-model display output without an accepted narrative. See `22-fallback-metric-errata.json`.

## Validation Commands

| Artifact | Command | Result |
| --- | --- | --- |
| `14-replay-run-output.txt` | `node --import tsx .loom/evidence/artifacts/20260529-flight-learn-constrained-judge-replay/run-constrained-judge-replay.mjs` | Completed 15-case replay, 0 accepted, server stopped. |
| `15-source-side-effect-scan.txt` | source fingerprint before/after comparison for `src/flight-learn-local-diagnosis-model.ts`, `src/flight-learn-llama-cpp-adapter.ts`, `src/flight-learn-inbox.ts`, `src/pi-extension.ts` | passed; no compared source file changed during replay. |
| `16-focused-tests.txt` | `npm test -- src/flight-learn-llama-cpp-adapter.test.ts src/flight-learn-local-diagnosis-model.test.ts` | 2 files passed, 37 tests passed. |
| `17-diff-check.txt` | `git diff --check` | no output, passed. |
| `19-final-diff-check.txt` | final `git diff --check` after evidence/ticket updates | no output, passed. |
| `21-temp-log-cleanup.md` | deleted stale `pfr-constrained-judge-*` temp server logs without reading contents | removed 4 matching files; 0 remained. |
| `22-fallback-metric-errata.json` | recomputed narrative and product fallback metrics from `08-replay-results.json` | 15/15 narrative non-acceptances, 10/15 product fallback-reason cases, 5/15 partial local-model display cases without accepted narrative. |
| `23-followup-diff-check.txt` | `git diff --check` after audit follow-up | no output, passed. |
| `24-followup-privacy-scan.json` | privacy scan plus temp-log existence check after audit follow-up | passed; 32 files scanned, 0 forbidden findings, 0 matching temp logs. |
| `25-followup-ticket-artifact-status.txt` | status of this ticket's evidence/audit/artifact paths after audit follow-up | recorded changed/untracked ticket-scope files only. |
| `26-harness-syntax-check.txt` | `node --check` for the updated replay harness | passed. |
| `27-final-diff-check.txt` | final `git diff --check` after closure/plan updates | no output, passed. |
| `28-final-privacy-scan.json` | final privacy/temp-log scan after closure/plan updates | passed; 37 files scanned, 0 forbidden findings, 0 matching temp logs. |
| `29-final-ticket-plan-status.txt` | final selected ticket/plan status summary | replay ticket closed, model integration blocked, parent plan blocked. |

## Privacy And Boundary Scan

`privacy-scan.json` originally reported:

```json
{
  "pass": true,
  "scannedFiles": 26,
  "forbiddenPatternCount": 0,
  "findings": []
}
```

The original scan checked 26 files across this ticket's artifacts, evidence record, and ticket record for raw home paths, Pi session paths, credential-looking assignments, prompt markers, and transcript markers. Artifacts are synthetic/redacted and include sanitized model-output previews only. Initial audit later found stale temporary server logs in the OS temp directory despite no log copies in Loom artifacts. Follow-up deleted those stale temp files, updated the harness to unlink future temp logs in `finally`, and recorded a passing follow-up privacy/temp-log scan in `24-followup-privacy-scan.json`.

## What This Shows

- `ticket:20260529-flight-learn-constrained-judge-replay#ACC-001` is supported: artifacts record corpus ID/path/count, model checksum, runtime version, loopback server command/health/final status, adapter configuration, and prior baselines. The harness used the product adapter provider flow.
- `ticket:20260529-flight-learn-constrained-judge-replay#ACC-002` is supported: per-case and aggregate artifacts separate parse-valid, schema-valid, verifier pass, judge pass, accepted narrative/non-acceptance, narrative non-acceptance reasons, product-level fallback reasons, unsafe accepted outputs, timeout, and latency.
- `ticket:20260529-flight-learn-constrained-judge-replay#ACC-003` is supported within this evidence scope after audit follow-up: unsafe accepted outputs were zero, privacy scans passed, stale temp server logs were deleted without reading/persisting contents, the harness now deletes future temp logs, the server stopped, no listener was observed, and source fingerprints show no compared product source changed during replay.
- `ticket:20260529-flight-learn-constrained-judge-replay#ACC-004` is supported with a negative gate recommendation: accepted narrative count is 0/15, narrative non-acceptance is 15/15, product-level fallback-reason cases are 10/15, total latency max was 9511ms, and later model-enabled inbox integration should stop/replan for this runtime rather than weakening gates.
- `ticket:20260529-flight-learn-constrained-judge-replay#ACC-005` is supported by explicit non-claims below.

## What This Does Not Show

- This does not prove operator comprehension, real-session usefulness, release readiness, classifier readiness, or broad Bonsai suitability.
- This does not prove Bonsai 4B can or cannot work with different timeouts, prompts, quantizations, local/open-source judges, or separately authorized runtimes.
- This does not validate private Pi sessions.
- This does not productize local narrative wording or change `/flight-learn` defaults, visible command surface, storage, routing, artifact candidates, rules, docs, source files, Loom records, skills, prompts, or classifier behavior.
- This does not justify weakening deterministic verifier, local judge veto, hard privacy gates, display-only restrictions, or fail-closed fallback behavior.

## Audit Follow-up

Initial audit `audit:20260529-flight-learn-constrained-judge-replay-review` returned `changes-needed`:

- `FIND-001`: stale temporary server logs remained in the OS temp directory. Disposition: removed 4 matching `pfr-constrained-judge-*` temp log files without reading or persisting their contents, updated `run-constrained-judge-replay.mjs` to unlink temp logs in `finally`, and recorded cleanup/scan evidence in `21-temp-log-cleanup.md` and `24-followup-privacy-scan.json`.
- `FIND-002`: `fallbackCount: 15` was ambiguous versus product-level fallback state. Disposition: clarified that `fallbackCount` was narrative non-acceptance, added `22-fallback-metric-errata.json`, and updated evidence/ticket wording to distinguish 15/15 narrative non-acceptances from 10/15 product-level fallback-reason cases and 5/15 partial local-model display cases without accepted narrative.

Follow-up audit `audit:20260529-flight-learn-constrained-judge-replay-followup-review` returned clear for bounded closure as a negative gate.

## Recommendation

Close the ticket as a negative gate: keep `ticket:20260529-flight-learn-model-comprehension-integration` blocked and route back to the parent plan to decide whether to shape a judge/latency/schema successor or stop model-comprehension work for the current Bonsai 4B runtime pending fresh authorization.
