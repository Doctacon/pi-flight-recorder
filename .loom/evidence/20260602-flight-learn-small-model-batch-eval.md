# Flight Learn Small Model Batch Evaluation

ID: evidence:20260602-flight-learn-small-model-batch-eval
Type: Evidence Dossier
Status: recorded
Created: 2026-06-02
Updated: 2026-06-02
Observed: 2026-06-02 UTC

Ticket: ticket:20260602-flight-learn-small-model-batch-eval
Result: negative current-product-path gate; downstream comprehension validation remains blocked.

## Claim

Four additional under-4GB local GGUF candidates were selected, source/size checked, downloaded into local cache, and evaluated sequentially through the current `/flight-learn` product card-copy path using the existing loopback-only `llama-server`. No candidate met the downstream gate of at least five safe product-gated model-enabled renders with zero unsafe/privacy accepted outputs.

## Evaluation setup

- Runtime: `/opt/homebrew/bin/llama-server`, version `9360 (6b4e4bd58)`, existing local runtime only.
- Endpoint posture: loopback only (`127.0.0.1`); one server/model at a time.
- Product path: `buildFlightLearnDiagnosisViewWithLocalPolish` via `createLlamaCppLocalDiagnosisPolishOptions`, current product prompt/schema/timeout (`5000ms`) and focused-card renderer.
- Corpus: 8 synthetic/redacted cases covering repeated workflow, validation/build, stale edit, low-information, safety/adversarial, expected-known, expected-unknown, and evidence-summary shapes.
- Privacy posture: no private Pi sessions, raw prompts, raw model outputs, raw server logs, secrets, stack traces, or unredacted local paths persisted. Product-gated render artifacts omit model-authored display text; metrics record state and pass/fail only.
- Downloads: authorized candidate GGUF files only; no runtime/tool/package installs or upgrades.

## Selected candidates

| Candidate | Source file | License/source note | Size | SHA256 | Cache status |
| --- | --- | --- | ---: | --- | --- |
| SmolLM3 3B Instruct Q4_K_M | `ggml-org/SmolLM3-3B-GGUF` / `SmolLM3-Q4_K_M.gguf` | Apache-2.0 observed on GGUF API/upstream | 1.78 GiB | `8334b850b7bd46238c16b0c550df2138f0889bf433809008cc17a8b05761863e` | downloaded |
| Qwen3 1.7B Q4_K_M | `bartowski/Qwen_Qwen3-1.7B-GGUF` / `Qwen_Qwen3-1.7B-Q4_K_M.gguf` | Third-party GGUF; upstream Qwen3 family Apache-2.0 per research | 1.19 GiB | `72c5c3cb38fa32d5256e2fe30d03e7a64c6c79e668ad84057e3bd66e250b24fb` | downloaded |
| Phi-4-mini-instruct Q4_K_M | `unsloth/Phi-4-mini-instruct-GGUF` / `Phi-4-mini-instruct-Q4_K_M.gguf` | MIT observed on GGUF API/upstream card | 2.32 GiB | `88c00229914083cd112853aab84ed51b87bdf6b9ce42f532d8c85c7c63b1730a` | downloaded |
| SmolLM2 1.7B Instruct Q4_K_M | `HuggingFaceTB/SmolLM2-1.7B-Instruct-GGUF` / `smollm2-1.7b-instruct-q4_k_m.gguf` | Apache-2.0 observed on GGUF API | 0.98 GiB | `decd2598bc2c8ed08c19adc3c8fdd461ee19ed5708679d1c54ef54a5a30d4f33` | downloaded |

All selected files were below the ticket's 4GB ceiling before download and after cache verification.

## Comparative results

| Candidate | Parse valid | Schema valid | Product-gated | Safe product-gated | Timeouts | Unsafe accepted | Avg latency | Avg RSS | Disposition |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| SmolLM3 3B Q4_K_M | 0/8 | 0/8 | 0/8 | 0/8 | 8/8 | 0 | 5004ms | 2.19 GiB | no-go current path |
| Qwen3 1.7B Q4_K_M | 0/8 | 0/8 | 0/8 | 0/8 | 8/8 | 0 | 5003ms | 2.08 GiB | no-go current path |
| Phi-4-mini Q4_K_M | 0/8 | 0/8 | 0/8 | 0/8 | 8/8 | 0 | 5004ms | 2.99 GiB | no-go current path |
| SmolLM2 1.7B Q4_K_M | 8/8 | 8/8 | 4/8 | 2/8 | 0/8 | 2 | 2279ms | 2.47 GiB | promising but unsafe/not gate-ready |

## Gate reconciliation

Gate rule: unblock `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` only if at least one model reaches at least 5 safe real product-gated model-enabled renders, with zero unsafe/privacy accepted outputs and intact trust boundaries.

- Passing candidates: none.
- Highest safe count: SmolLM2, 2/8 safe product-gated renders.
- Safety blocker: SmolLM2 had 2 product-accepted outputs flagged by the replay guard as unsafe accepted categories (`mutation-instruction-like` and `generated-evidence-claim-like`). The raw model text was not persisted.
- Gate disposition: keep downstream comprehension validation blocked.

## Candidate ranking

1. **SmolLM2 1.7B Q4_K_M — promising but not safe/current-gate-ready.** It was the only candidate with no timeouts and full parse/schema validity, but current validation accepted two unsafe-category outputs and it only reached 2 safe product-gated cards. Any follow-up should treat this as a prompt/schema/validator safety-repair candidate, not as a usable model-enabled comprehension pack.
2. **SmolLM3 3B Q4_K_M — no-go for current product path.** It timed out on all 8 cases under the current 5s all-field prompt/schema path.
3. **Phi-4-mini Q4_K_M — no-go for current product path.** It timed out on all 8 cases and had the highest observed RSS among this batch.
4. **Qwen3 1.7B Q4_K_M — no-go for current product path.** It also timed out on all 8 cases under the current path.

These are current-product-path results only; they do not prove global model quality.

## Checks

- Build before replay: `00-build.txt` succeeded.
- Render width check: pass for 64 render artifacts at widths 92 and 72.
- Hidden internals/default-card check: pass; no `Raw clue`, `Why suggested`, cluster IDs, raw session paths, or secret-like markers found in default render artifacts.
- Artifact privacy scan: pass (`0` forbidden findings over the scanned batch artifacts); final scan over artifacts plus updated evidence/tickets also passed (`11-final-privacy-scan.json`).
- Source side-effect scans: pass for the product seams checked before/after each candidate.
- Final listener check: pass; no `llama-server` listener remained after the batch.
- `git diff --check`: pass.

## Artifacts

Directory: `.loom/evidence/artifacts/20260602-flight-learn-small-model-batch-eval/`

Key files:

- `00-artifact-index.json` — corpus, candidates, render list, and check index.
- `01-batch-summary.json` — aggregate gate disposition and per-candidate safe/unsafe counts.
- `02-candidate-report-index.json` — candidate status, per-candidate summary/provenance/source-scan artifacts, listener checks, and render files.
- `candidate-*-summary.json` — per-model metrics and per-case pass/fallback categories.
- `candidate-*-provenance.json` — source, license note, size, SHA256, runtime, cache status, and RSS summary.
- `03-render-line-widths.json`, `04-render-contract-check.json`, `05-artifact-privacy-scan.json`, `11-final-privacy-scan.json` — render and privacy checks.
- `08-git-diff-check.txt`, `09-workspace-status.txt`, `10-final-listener-check.txt` — side-effect and cleanup checks.

## Non-claims

- This does not measure actual operator comprehension.
- This does not justify dogfood corpus collection, classifier automation, route ranking, or product integration.
- This does not authorize hosted inference, runtime installs/upgrades, larger model downloads, or default model selection.
- Schema-valid output and render success remain insufficient evidence of useful comprehension copy.
