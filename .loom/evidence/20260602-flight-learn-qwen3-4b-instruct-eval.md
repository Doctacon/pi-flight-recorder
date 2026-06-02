# Flight Learn Qwen3 4B Instruct Evaluation Evidence

ID: evidence:20260602-flight-learn-qwen3-4b-instruct-eval
Type: Evidence Dossier
Status: recorded
Created: 2026-06-02
Updated: 2026-06-02
Observed: 2026-06-02 UTC

## Summary

Executed `ticket:20260602-flight-learn-qwen3-4b-instruct-eval` as a bounded local model-evaluation run for Qwen3-4B-Instruct-2507 Q4_K_M over 8 synthetic/redacted representative `/flight-learn` card-copy cases.

The exact authorized model file was downloaded/cached and evaluated:

- Source repo: `bartowski/Qwen_Qwen3-4B-Instruct-2507-GGUF`.
- File: `Qwen_Qwen3-4B-Instruct-2507-Q4_K_M.gguf`.
- Upstream model: `Qwen/Qwen3-4B-Instruct-2507`.
- Upstream license observed from model card/API: `apache-2.0`.
- Cache display path: `~/.cache/pi-flight-recorder/qwen3/Qwen_Qwen3-4B-Instruct-2507-Q4_K_M.gguf`.
- SHA256: `2fde00ce69dd4899c70d020845e2638353015bba0fdf161b3eb965f2bca4464e`.
- File size: 2,497,280,736 bytes, approximately 2.33 GiB.

Real local `llama-server` ran loopback-only with no runtime install/build/upgrade, hosted provider, non-loopback endpoint, telemetry, custom fork, or extra model download. Raw server logs were temporary and deleted after byte-count summary. Raw model responses and raw model-authored display text were not persisted in Loom.

Main result: Qwen3-4B-Instruct-2507 Q4_K_M produced **0/8 product-gated model-enabled cards** under the current product path and 5-second product timeout. All 8 cases timed out, so downstream comprehension validation remains blocked.

Artifact directory: `.loom/evidence/artifacts/20260602-flight-learn-qwen3-4b-instruct-eval/`

## Artifact Inventory

Key artifacts:

- `run-qwen3-4b-instruct-eval.mjs` - artifact-local replay harness using synthetic/redacted cases and current built product modules.
- `00-artifact-index.json` - case inventory, model/runtime artifact pointers, checks, and non-claims.
- `01-model-provenance.json` - runtime/model provenance, source/license notes, file size, SHA256, cache status, loopback health, temp-log handling, and approximate RSS summary.
- `02-qwen3-replay-summary.json` - aggregate and per-case product-path metrics.
- `03-qwen3-replay-status.json` - real runtime status.
- `04-source-side-effect-scan.json` - source fingerprint before/after scan for read-only source seams.
- `05-render-line-widths.json` - width checks for fallback render artifacts.
- `06-render-contract-check.json` - default-hidden-internals checks for fallback render artifacts.
- `07-artifact-privacy-scan.json` - artifact-local privacy scan.
- `08-post-run-listener-check.txt` - post-run listener check showing no listener output for the runtime port.
- `09-replay-run-output.json` - sanitized command summary.
- `10-harness-syntax-check.txt` - `node --check` result for the harness.
- `11-harness-run-console.json` - sanitized console output from the successful harness run.
- `12-final-diff-check.txt` - scoped diff/whitespace/listing check for this evidence packet.
- `13-final-privacy-scan.json` - final privacy scan over evidence, tickets, and artifacts.
- `real-case-*-72.txt` / `real-case-*-92.txt` - fallback render artifacts for all 8 cases at representative widths.

Coverage from `00-artifact-index.json`: repeated workflow, validation/build, stale edit, low-information, safety/adversarial rejection, expected-known, expected-unknown, evidence-summary, and fallback.

## Runtime And Model Provenance

From `01-model-provenance.json`:

- Runtime path: `/opt/homebrew/bin/llama-server`.
- Runtime version: `9360 (6b4e4bd58)`.
- Runtime health: loopback server responded `ok`.
- Model cache status: `downloaded-this-run`.
- Model SHA256: `2fde00ce69dd4899c70d020845e2638353015bba0fdf161b3eb965f2bca4464e`.
- Model file size: 2.33 GiB.
- Approximate observed RSS during replay: min 782,016 KiB, max 1,821,184 KiB, avg 1,143,583 KiB.
- Raw log bytes summarized: stdout 0 bytes, stderr 12,969 bytes.
- Raw logs persisted: false.

No hosted provider, non-loopback endpoint, automatic runtime install, telemetry, custom runtime fork, extra model family, product source edit, default model change, storage/routing/classifier change, or artifact/rule/source mutation occurred.

## Product Replay Metrics

From `02-qwen3-replay-summary.json`:

| Metric | Result |
|---|---:|
| Total cases | 8 |
| Parse-valid outputs | 0 |
| Schema-valid outputs | 0 |
| Product-gated model-enabled cards | 0 |
| Safe product-gated model-enabled cards | 0 |
| Product fallbacks | 8 |
| Unsafe accepted outputs | 0 |
| Unsafe rejections | 0 |
| Timeouts | 8 |
| Avg latency | 5008 ms |
| Prompt length avg | 5207 chars |

Fallback reasons:

```json
{
  "timeout": 8
}
```

Display states:

```json
{
  "deterministic": 8
}
```

Field coverage from raw model output was zero for all required all-field card-copy fields because no responses completed before the product timeout. Deterministic fallback view coverage remained present for the existing fallback fields: headline 8/8, what happened 8/8, why it matters 8/8, expected behavior 6/8, why this was flagged 0/8, evidence summary 0/8.

## Render And Privacy Checks

Render artifacts are fallback renders only because no model-enabled product-gated card passed. They were emitted at widths 92 and 72 for every synthetic/redacted case.

Checks:

- `05-render-line-widths.json`: pass; max rendered line length stayed within each target width.
- `06-render-contract-check.json`: pass; default fallback renders did not expose `Raw clue`, detector/debug provenance, raw session paths, or secret markers.
- `07-artifact-privacy-scan.json`: pass; artifact-local scan found zero forbidden findings.
- `13-final-privacy-scan.json`: pass; final scan across evidence, tickets, and artifacts found zero forbidden findings.
- `04-source-side-effect-scan.json`: pass; read-only source seam fingerprints were unchanged.
- `08-post-run-listener-check.txt`: no post-run listener output for the runtime port.
- `12-final-diff-check.txt`: scoped diff/whitespace checks reported no findings for this packet.

## Acceptance Mapping

- Download/cache exact authorized GGUF if absent: satisfied. The Qwen3-4B-Instruct-2507 Q4_K_M GGUF was cached under the approved qwen3 cache location with recorded SHA256 and size.
- Use local `llama-server` only: satisfied. Runtime was existing local `llama-server` on loopback.
- Synthetic/redacted replay only: satisfied. No real Pi session data, user prompts, local private paths, secrets, stack traces, or raw transcripts were used in replay cases.
- Preserve source-of-truth and routing boundaries: satisfied. Model output did not route, classify, store truth, create rules, mutate source, or update product config; all cases fell back deterministically.
- Preserve privacy-safe evidence: satisfied. Raw model responses, raw server logs, raw prompts, and model-authored display text were not persisted.
- Gate rule for downstream comprehension validation: **not satisfied**. Required at least 5 safe real product-gated model-enabled renders and zero unsafe/privacy accepted outputs; observed 0 safe real product-gated model-enabled renders.

## Downstream Disposition

`ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` remains blocked. There is no Qwen-supported basis to open operator comprehension validation or dogfood corpus/outcome collection from this run.

## Risks / Notes

- This is negative evidence for the current product path and timeout, not necessarily proof that the model is unusable under every possible prompt/timeout/schema. Product integration or prompt/timeout changes were outside this bounded ticket.
- The run measured product-path completion and gates, not operator comprehension.
- Because all cases timed out, safety judge quality for completed Qwen card-copy text was not exercised.
