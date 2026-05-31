# Bonsai 4B Schema Prompt Tuning Evidence

ID: evidence:20260529-bonsai-4b-schema-prompt-tuning
Type: Evidence Dossier
Status: recorded
Created: 2026-05-29
Updated: 2026-05-29
Observed: 2026-05-29 UTC

## Summary

Ran a bounded local Bonsai 4B Q1_0 prompt/schema tuning experiment for `ticket:20260529-bonsai-4b-schema-prompt-tuning`. The run used the existing Bonsai 4B GGUF only, a loopback-only `llama-server`, the existing 15-case synthetic/redacted narrative corpus, and the strict `schemaVersion: 2` / `whatHappened.sentences[].text + factIds` contract with deterministic verifier and local judge gate.

Result: prompt tuning improved generator JSON/schema compliance for one variant, but **no variant produced accepted narratives** under the current strict verifier + local self-judge path. The best variant, `exact-example-single-json`, produced 8 parse-valid outputs, 8 schema-valid outputs, and 7 verifier-passing narrative candidates, compared with the prior real-run baseline of 12 malformed JSON and 2 schema-invalid fallbacks. However, accepted count remained 0/15 because judge calls timed out, one candidate was rejected as unsafe/non-display content, and some outputs remained malformed or timed out.

This supports the operator's suspicion that the prior 0/15 result was not simply “Bonsai cannot write narrative.” The stronger statement is: the current product path is blocked first by structured-output contract compliance and then by local judge latency/behavior, not by source architecture. This evidence does not support productizing local narrative wording yet.

Artifact directory:

```text
.loom/evidence/artifacts/20260529-bonsai-4b-schema-prompt-tuning/
```

Key artifacts:

- `run-bonsai-4b-schema-prompt-tuning.mjs` - harness used for this experiment.
- `schema-prompt-tuning-summary.json` - aggregate metrics by prompt variant.
- `schema-prompt-tuning-results.json` - per-case structured results.
- `schema-prompt-tuning-run-output.txt` - printed summary output.
- `sanitized-raw-samples.json` - redacted/synthetic raw previews for representative failures/candidates.
- `runtime-provenance.txt` - local runtime/model/checksum/base URL provenance.
- `server-command.txt` - redacted loopback server command.
- `llama-server-health.json` - health response.
- `server-start-status.txt` and `server-final-status.txt` - server lifecycle observations.
- `privacy-scan.json` - artifact privacy scan; `pass: true`.
- `post-run-diff-check.txt` - `git diff --check` output; empty means passed.

## Runtime And Model Provenance

Observed runtime/model:

- Runtime: `/opt/homebrew/bin/llama-server`.
- Version: `9360 (6b4e4bd58)`, AppleClang Darwin arm64 build.
- Model: `~/.cache/pi-flight-recorder/bonsai/Bonsai-4B-Q1_0.gguf`.
- SHA256: `4524b3f997f0f06444e568d1f26e2efd69effa3218c7ad3047432fb171e42168`.
- Server: `http://127.0.0.1:18119`.
- Server health: `{"status":"ok"}`.
- Stop status: `stopped`.

Command shape, redacted:

```bash
llama-server -m ~/.cache/pi-flight-recorder/bonsai/Bonsai-4B-Q1_0.gguf --host 127.0.0.1 --port 18119 -c 4096 --no-webui --jinja
```

No hosted provider, non-loopback endpoint, new model download, runtime install/build, source behavior change, product default change, storage/routing/classifier change, artifact/rule/source mutation, or release-readiness claim was made.

## Baseline For Comparison

Prior real 4B validation baseline from `evidence:20260528-bonsai-4b-narrative-validation`:

```json
{
  "totalCases": 15,
  "acceptedCount": 0,
  "fallbackCount": 15,
  "fallbackReasons": {
    "malformed-json": 12,
    "schema-invalid": 2,
    "timeout": 1
  }
}
```

This experiment reused the same synthetic/redacted narrative corpus ID recorded in `schema-prompt-tuning-summary.json`: `flight-learn-narrative-what-happened-eval-corpus-v1`.

## Prompt Variant Results

From `schema-prompt-tuning-summary.json`:

| Variant | Parse-valid | Schema-valid | Verifier pass | Judge pass | Accepted | Main fallback shape |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `baseline-current` | 1/15 | 0/15 | 0/15 | 0/15 | 0/15 | 7 timeout, 7 malformed, 1 schema-invalid |
| `exact-example-single-json` | 8/15 | 8/15 | 7/15 | 0/15 | 0/15 | 11 timeout, 3 malformed, 1 unsafe-output |
| `minimal-what-happened-only` | 2/15 | 2/15 | 0/15 | 0/15 | 0/15 | 6 timeout, 7 malformed, 2 empty-output |

The `exact-example-single-json` variant met the ticket's material format/schema improvement threshold: malformed JSON fell below 6/15, schema-valid outputs reached at least 5/15, and unsafe accepted outputs stayed at zero. It did **not** meet any productization bar because accepted narratives stayed at zero.

## Qualitative Failure Shape

Representative redacted/synthetic previews in `sanitized-raw-samples.json` show three useful patterns:

1. The source/current prompt still often timed out or emitted extra top-level fields such as `sentences` instead of `whatHappened.sentences`.
2. The exact-example prompt frequently produced the correct required nesting, e.g. `{"schemaVersion":2,"whatHappened":{"sentences":[...]}}`.
3. Correctly-shaped generator candidates then failed later, usually because the local Bonsai self-judge timed out at the configured budget. One candidate was rejected by deterministic safety validation as unsafe/non-display content before acceptance.

No accepted narrative text was produced, so there is no accepted-card visual evidence to claim.

## Privacy And Safety Scan

`privacy-scan.json` reports:

```json
{
  "pass": true,
  "forbiddenPatternCount": 0,
  "findings": []
}
```

The scan covered 16 artifact files after redaction. It checked for raw home/repo paths, private session paths, secret assignments, prompt markers, and transcript markers. Artifacts use synthetic/redacted corpus cases and redacted model paths (`~` / `<repo>` style where applicable).

Safety observations:

- Unsafe accepted outputs: `0`.
- Accepted narratives: `0`.
- One exact-example candidate produced an `unsafe-output` fallback, not an accepted output.
- Deterministic fail-closed behavior remained intact for invalid, unsafe, timeout, and judge-failed paths.

## Post-run Checks

- `server-final-status.txt` records the loopback `llama-server` was stopped.
- A live listener check after the run found no listener on TCP port `18119`.
- `post-run-diff-check.txt` records `git diff --check` with no output.

The initial Ralph worker transport did not return a normal inline summary to the Driver because the parent Pi extension emitted `database is locked`; the worker nevertheless wrote the experiment artifacts. Driver reconciled the artifact outputs directly into this evidence dossier and ticket state.

## What This Shows

- `ticket:20260529-bonsai-4b-schema-prompt-tuning#ACC-001` is supported: artifacts record the same corpus, the existing Bonsai 4B checksum, loopback runtime command/health/stop status, and prior baseline metrics.
- `ticket:20260529-bonsai-4b-schema-prompt-tuning#ACC-002` is supported: each variant has staged parse/schema/verifier/judge/accepted/fallback/latency/unsafe metrics in `schema-prompt-tuning-summary.json` and per-case detail in `schema-prompt-tuning-results.json`.
- `ticket:20260529-bonsai-4b-schema-prompt-tuning#ACC-003` is partially-positive and bounded: `exact-example-single-json` materially improved format/schema compliance, but did not produce accepted narratives.
- `ticket:20260529-bonsai-4b-schema-prompt-tuning#ACC-004` is supported within this evidence scope: privacy scan passed, unsafe accepted outputs were zero, server stopped, and no product/source/default/storage/routing side effects were made by this ticket.
- `ticket:20260529-bonsai-4b-schema-prompt-tuning#ACC-005` is supported: recommendation is to avoid productization and route next model work to a judge/latency isolation or grammar/JSON-mode investigation rather than continuing blind prompt tweaks.
- `ticket:20260529-bonsai-4b-schema-prompt-tuning#ACC-006` is supported: the project-level implication is that local-model narrative remains a polish layer; the broader Flight Recorder loop is not blocked by code architecture but by UX/evidence/model-contract questions around optional wording.

## What This Does Not Show

- This does not prove Bonsai 4B can safely power `/flight-learn` narrative output.
- This does not prove Bonsai 4B is broadly suitable or unsuitable for other tasks.
- This does not prove an independent judge would accept or reject the same candidates.
- This does not prove longer judge timeouts, grammar-constrained JSON mode, different quantization, or another local/open-source model would fail or succeed.
- This does not validate real private Pi sessions or real-user usefulness.
- This does not claim release readiness.
- This does not justify weakening verifier, privacy, fact-ID, or judge gates.

## Project-loop Implications

The immediate technical blocker is not the existing Flight Recorder source architecture. The implemented system can build fact packets, call a loopback model, validate structured output, fail closed, and render fallback. The recent stall is better described as a **model-contract and evidence bottleneck** inside an optional UX polish layer.

What changed after tuning:

- Prompt/schema changes can materially improve generator format compliance for Bonsai 4B.
- Accepted narratives remain blocked by downstream judge latency/behavior and strict safety gates.
- Local narrative generation is still not ready to be recommended as a product path.

Recommended next direction for `ticket:20260529-flight-recorder-core-loop-stocktake`:

1. Treat this result as evidence that local narrative work is not hopeless, but also not on the critical path to the core delta/artifact learning loop.
2. Do not create a productization ticket yet.
3. If model work continues, isolate the next bottleneck with a separate judge/latency replay ticket or a grammar-constrained JSON investigation; do not keep broad prompt tweaking inside the same ticket.
4. Consider pivoting product attention back to deterministic `/flight-learn` clarity, real manually routed corpus collection, and outcome/recurrence feedback, because those are closer to the project's original value proposition.
