# Flight Learn GPT-5.5 Hosted Sanity Check

ID: evidence:20260602-flight-learn-gpt55-hosted-sanity-check
Type: Evidence Dossier
Status: recorded
Created: 2026-06-02
Updated: 2026-06-02
Observed: 2026-06-02 UTC

Ticket: ticket:20260602-flight-learn-gpt55-hosted-sanity-check
Result: mixed diagnostic result; downstream comprehension validation remains blocked.

## Claim

`gpt-5.5` was available through the already-authenticated Pi OpenAI/Codex provider path and was evaluated over the same 8 synthetic/redacted `/flight-learn` card-copy cases in two modes. The current product 5-second path timed out on every hosted CLI call. When hosted transport timeout was isolated with a 60-second harness timeout, `gpt-5.5` returned parse-valid/schema-compatible JSON for all 8 cases, but the current product validator rejected all 8 outputs. This points to a process/prompt/validator issue, not only a small-local-model capability issue.

This hosted result does **not** authorize product integration, hosted defaults, downstream operator comprehension validation, dogfood corpus collection, classifier work, or weakening local-first boundaries.

## Setup

- Provider path: `pi` authenticated provider listing showed `openai-codex / gpt-5.5` available.
- Probe: a tiny no-sensitive-data JSON echo using `pi --provider openai-codex --model gpt-5.5 --no-tools --no-extensions --no-skills --no-context-files --no-session --system-prompt '' -p @<tempfile>` returned the expected tiny JSON in 5810ms.
- Data: 8 synthetic/redacted cases reused from `evidence:20260602-flight-learn-small-model-batch-eval`.
- Product seam: `buildFlightLearnDiagnosisViewWithLocalPolish` and current `buildLocalDiagnosisPrompt`/`buildLocalDiagnosisFactPacket`/validator behavior from `dist`.
- Privacy posture: raw prompts, raw hosted model output, raw provider logs, private session data, credentials, stack traces, and raw local paths were not persisted. Output metrics include lengths, field presence, top-level keys, hashes, categories, and pass/fallback states only.

## Metrics

| Mode | Parse valid | Schema compatible | Product-gated | Safe product-gated | Timeouts | Unsafe rejected | Unsafe accepted | Avg latency | Gate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| current-product-5s | 0/8 | 0/8 | 0/8 | 0/8 | 8/8 | 0 | 0 | 5003ms | fail |
| relaxed-validator | 8/8 | 8/8 | 0/8 | 0/8 | 0/8 | 5 | 0 | 18637ms | fail |

Relaxed-validator fallback reasons:

| Reason | Count |
| --- | ---: |
| unsupported-facts | 3 |
| unsafe-output | 5 |

Relaxed-validator field presence in hosted JSON:

| Field | Count |
| --- | ---: |
| headline | 8/8 |
| whatHappened | 8/8 |
| whyItMatters | 8/8 |
| expectedBehavior | 6/8 |
| whyThisWasFlagged | 8/8 |
| evidenceSummary | 7/8 |

## Process diagnosis

Classification: **mixed**.

- **Transport/product-timeout issue:** the current 5-second product path timed out for 8/8 hosted CLI calls and killed the child/temp prompt as intended. This means the 5-second product timeout cannot be used to judge hosted frontier-model semantics through the Pi CLI transport.
- **Validator/safety/prompt issue:** after isolating transport with a 60-second harness timeout, `gpt-5.5` produced parse-valid/schema-compatible JSON for 8/8 cases, but current product validation rejected every case: 3 unsupported-facts and 5 unsafe-output. That is strong evidence that the current all-field prompt/validator contract is too brittle or misaligned for even a frontier model through this path.
- **No unsafe accepted outputs:** unlike SmolLM2, the hosted run produced 0 product-accepted unsafe-category outputs because nothing passed the product gate.

## Checks

- Temp prompt deletion: pass for availability probe and all model calls.
- Session side-effect check: pass; no new Pi session files were detected by count/newest-mtime before/after.
- Source side-effect scan: pass; `src/flight-learn-local-diagnosis-model.ts` and `src/flight-learn-inbox.ts` fingerprints unchanged.
- Render width checks: pass for 32 render artifacts at widths 92 and 72.
- Default hidden-internals render check: pass; no raw clue, why-suggested, cluster IDs, raw session paths, home paths, or secret-like markers found in default render artifacts.
- Artifact privacy scan: pass after refining the scan to treat policy labels as labels, not raw prompt/output content.
- Final privacy scan over artifacts, evidence, and touched tickets: pass (`11-final-privacy-scan.json`).
- Scoped `git diff --check`: pass (`08-git-diff-check.txt`).
- Workspace status for touched paths was captured in `09-workspace-status.txt`.
- No product source, tests, docs, package, config, spec, plan, research, or audit files were edited by the run.

## Artifacts

Directory: `.loom/evidence/artifacts/20260602-flight-learn-gpt55-hosted-sanity-check/`

Key files:

- `00-artifact-index.json` — corpus, artifacts, render list, checks, and gate disposition.
- `01-availability-and-probe.json` — model-list availability and tiny JSON probe result, without credentials or raw prompt/output.
- `02-run-summary.json` — aggregate mode metrics, process diagnosis, checks, and non-claims.
- `mode-current-product-5s-summary.json` — per-case current product timeout metrics.
- `mode-relaxed-validator-summary.json` — per-case relaxed validator metrics and field/key presence.
- `current-product-5s-*.txt`, `relaxed-validator-*.txt` — privacy-safe focused-card renders; model-authored display text omitted where relevant.
- `03-render-line-widths.json`, `04-render-contract-check.json`, `05-artifact-privacy-scan.json`, `06-source-side-effect-scan.json`, `07-session-side-effect-check.json` — validation and safety checks.
- `08-git-diff-check.txt`, `09-workspace-status.txt`, `11-final-privacy-scan.json` — final diff/status/privacy checks.

## What This Shows

- Supports `ticket:20260602-flight-learn-gpt55-hosted-sanity-check#ACC-001`: `gpt-5.5` availability and tiny probe succeeded without credential persistence.
- Supports `ticket:20260602-flight-learn-gpt55-hosted-sanity-check#ACC-002`: current product 5-second mode was measured and timed out 8/8.
- Supports `ticket:20260602-flight-learn-gpt55-hosted-sanity-check#ACC-003`: relaxed-validator mode isolated transport and showed 8/8 parse/schema-compatible responses rejected by current validator/safety gates.
- Supports `ticket:20260602-flight-learn-gpt55-hosted-sanity-check#ACC-004`: process diagnosis is mixed: hosted CLI transport cannot fit the 5-second path, and the prompt/validator contract rejects all relaxed frontier outputs.
- Supports `ticket:20260602-flight-learn-gpt55-hosted-sanity-check#ACC-005`: privacy and side-effect checks passed for this hosted synthetic/redacted run.

## What This Does Not Show

- Does not measure actual operator comprehension.
- Does not justify hosted inference in product, hosted defaults, product OpenAI provider support, or weakening local-first policy.
- Does not unblock `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation`; hosted evidence alone is not a safe local-first product render pack.
- Does not prove `gpt-5.5` cannot write useful card copy; it shows the current product prompt/validator path rejects its outputs over this corpus.
- Does not identify exact wording defects because raw hosted model text was intentionally not persisted.

## Recommended Follow-up

Shape a local-first prompt/validator repair ticket using this hosted sanity result as diagnostic evidence. The repair should reduce all-field burden, clarify or split the validator's unsafe/non-display patterns, and add a safe way to inspect validation-rejection reasons without storing raw model output. Do not start operator comprehension validation until a local/open model path produces the required safe product-gated render pack.
