# Llama.cpp Constrained JSON Probe Evidence

ID: evidence:20260529-llama-cpp-constrained-json-probe
Type: Evidence Dossier
Status: recorded
Created: 2026-05-29
Updated: 2026-05-29
Observed: 2026-05-29 UTC

## Summary

Ran `ticket:20260529-llama-cpp-constrained-json-probe` against the existing local Bonsai 4B Q1_0 GGUF and installed local `llama-server`. The probe tested whether request-level grammar / JSON-schema constraints are actually enforced before any source adapter implementation is considered.

Result: constrained decoding is active on this installed runtime for multiple routes. The strongest product-adjacent route, `/v1/chat/completions` with OpenAI-style `response_format: { type: "json_schema", json_schema: { name, strict, schema } }`, passed two tiny enforcement probes and then produced 15/15 parse-valid, 15/15 schema-valid, and 15/15 harness-verifier-passing generator outputs on the synthetic/redacted narrative corpus. No local judge was run; this evidence is generator-format evidence only.

This materially changes the model-format diagnosis: the prior malformed/schema-invalid Bonsai narrative failures are likely addressable by runtime-level constrained decoding. It does not prove semantic grounding, judge quality, accepted `/flight-learn` narratives, or product readiness.

Artifact directory:

```text
.loom/evidence/artifacts/20260529-llama-cpp-constrained-json-probe/
```

Key artifacts:

- `run-constrained-json-probe.mjs` - evidence-only harness.
- `constrained-json-probe-summary.json` - aggregate result and recommendation.
- `constrained-json-route-results.json` - tiny route enforcement probes.
- `constrained-json-narrative-results.json` - generator-only narrative corpus results.
- `sanitized-raw-samples.json` - redacted previews of tiny and narrative outputs.
- `runtime-provenance.txt` - runtime/model/checksum/base URL provenance.
- `server-command.txt` - redacted loopback server command.
- `llama-server-health.json`, `server-start-status.txt`, `server-final-status.txt` - server lifecycle observations.
- `server-stdout.redacted.log`, `server-stderr.redacted.log` - redacted runtime logs.
- `privacy-scan.json` - artifact privacy scan.
- `post-run-listener-check.txt` - post-run listener check for TCP port `18120`.
- `post-run-diff-check.txt` - `git diff --check` output.
- `workspace-status-after.txt` - workspace status snapshot after the run.

## Runtime And Model Provenance

Observed runtime/model from `runtime-provenance.txt` and `constrained-json-probe-summary.json`:

- Runtime: `/opt/homebrew/bin/llama-server`.
- Version: `9360 (6b4e4bd58)`, AppleClang Darwin arm64 build.
- Model: Bonsai 4B Q1_0 GGUF, path redacted in artifacts.
- SHA256: `4524b3f997f0f06444e568d1f26e2efd69effa3218c7ad3047432fb171e42168`.
- Server: `http://127.0.0.1:18120`.
- Server health: `{"status":"ok"}`.
- Server final status: `exited-0`.
- Post-run listener check on port `18120`: no output, meaning no listener was observed by that command.

Redacted command shape:

```bash
/opt/homebrew/bin/llama-server -m ~ --host 127.0.0.1 --port 18120 -c 4096 --no-webui --jinja
```

No hosted provider, provider key, new model download, runtime install/build/upgrade, non-loopback endpoint, source adapter edit, product default change, storage/routing/classifier change, or product mutation was performed by this run.

## Tiny Constraint Enforcement Probe

The harness sent prompts that explicitly asked the model not to output the constrained object. A route counted as enforced only when both contradictory prompts returned exactly the constrained JSON object shape:

```json
{"verdict":"CONSTRAINED","count":7}
```

Observed route results:

| Route | Endpoint | Result | Notes |
| --- | --- | --- | --- |
| `chat-response-format-json-schema-openai` | `/v1/chat/completions` | enforced | Both tiny probes returned constrained JSON. |
| `chat-response-format-json-schema-schema-only` | `/v1/chat/completions` | accepted but not enforced/inconclusive | One prose output and one unconstrained JSON output. |
| `chat-top-level-json-schema` | `/v1/chat/completions` | enforced | Both tiny probes returned constrained JSON. |
| `chat-request-grammar` | `/v1/chat/completions` | accepted but not enforced/inconclusive | One output stopped at an incomplete JSON prefix; one probe passed. |
| `completion-json-schema` | `/completion` | enforced | Both tiny probes returned constrained JSON. |
| `completion-grammar` | `/completion` | enforced | Both tiny probes returned constrained JSON. |

This supports the important distinction required by the ticket: request acceptance alone was not treated as enforcement. The `schema-only` chat route was accepted but clearly ignored or did not apply the schema in this runtime shape.

## Narrative Generator-Only Probe

Because `chat-response-format-json-schema-openai` proved enforcement and is closest to the current adapter path, the harness used it for a generator-only pass over the existing synthetic/redacted 15-case narrative corpus.

Observed aggregate metrics from `constrained-json-narrative-results.json`:

```json
{
  "routeId": "chat-response-format-json-schema-openai",
  "corpusId": "flight-learn-narrative-what-happened-eval-corpus-v1",
  "totalCases": 15,
  "parseValidCount": 15,
  "schemaValidCount": 15,
  "verifierPassCount": 15,
  "malformedOrSchemaInvalidCount": 0,
  "timeoutCount": 0,
  "latencyMs": {
    "min": 1852,
    "max": 3354,
    "avg": 2705
  }
}
```

Interpretation boundary: the harness verifier checked JSON parseability, required nested shape, sentence/factId shape, and factId membership against synthetic harness facts. It did not run the production judge and did not evaluate whether the prose is semantically grounded, useful, non-actionable, or acceptable for display.

## Privacy And Safety Scan

`privacy-scan.json` reports:

```json
{
  "pass": true,
  "scannedFiles": 20,
  "forbiddenPatternCount": 0,
  "findings": []
}
```

The scan covered the artifact files plus the ticket/evidence/audit/research records touched by this slice after redaction. It checked for raw home paths, Pi session paths, credential-looking assignments, prompt markers, and private-session-text markers. The first harness run exposed a redacted server log prompt-marker issue; the harness and log artifact were redacted, then the scan was rerun and passed. This follow-up did not rerun model generation; it only corrected artifact redaction/scanning hygiene.

## Post-run Checks

- `server-final-status.txt` records the local server exited with status `0`.
- `post-run-listener-check.txt` records no listener on TCP port `18120` after the run.
- `post-run-diff-check.txt` records `git diff --check` with no output.
- `workspace-status-after.txt` shows the repository already has many pre-existing modified/untracked files, including prior Loom records and source files. This run's intended write boundary was limited to this ticket plus `.loom/evidence/**` artifacts/records.

## What This Shows

- `ticket:20260529-llama-cpp-constrained-json-probe#ACC-001` is supported: artifacts record runtime version, model checksum, loopback command/health/final status, and no hosted/non-loopback route.
- `ticket:20260529-llama-cpp-constrained-json-probe#ACC-002` is supported: tiny probes distinguish routes that enforced constraints from routes that merely accepted the request. Four routes enforced constraints; two chat routes were accepted but not fully enforced/inconclusive.
- `ticket:20260529-llama-cpp-constrained-json-probe#ACC-003` is supported for generator-format only: the narrative corpus was run without judge and produced 15/15 parse-valid, 15/15 schema-valid, 15/15 harness-verifier-passing outputs with zero timeouts on the selected constrained route.
- `ticket:20260529-llama-cpp-constrained-json-probe#ACC-004` is supported within this evidence scope: privacy scan passed, server stopped, no listener was observed after the run, and no product source/default/storage/routing mutation was performed by the harness.
- `ticket:20260529-llama-cpp-constrained-json-probe#ACC-005` is supported by an explicit route recommendation: shape a successor adapter implementation ticket for the proven OpenAI-style chat JSON-schema route, then separately isolate judge/latency before any productization claim.

## What This Does Not Show

- This does not prove accepted `/flight-learn` narrative wording.
- This does not prove semantic grounding, judge quality, non-actionability, display usefulness, or user comprehension.
- This does not prove release readiness or broad Bonsai 4B suitability.
- This does not prove classifier readiness or artifact-routing automation readiness.
- This does not test private/operator Pi sessions.
- This does not change `/flight-learn` defaults, flags, UI behavior, source-of-truth fields, storage, routing, rules, docs, or package metadata.
- This does not justify weakening fact-ID, privacy, safety, judge, or deterministic fallback gates.

## Recommendation

Move `ticket:20260529-llama-cpp-constrained-json-probe` to review, not closed, and request audit. If audit clears the evidence, the next model-specific execution unit should be a narrow adapter implementation ticket for request-level JSON schema support on the proven `/v1/chat/completions` route. That successor should remain opt-in and should run a focused judge/latency replay before any productized narrative claim.
