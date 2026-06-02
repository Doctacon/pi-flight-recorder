# Flight Learn Card Copy Repaired Local Replay Review

ID: audit:20260602-flight-learn-card-copy-repaired-local-replay-review
Type: Audit
Status: recorded
Created: 2026-06-02
Updated: 2026-06-02
Audited: 2026-06-02 UTC
Target: ticket:20260602-flight-learn-card-copy-repaired-local-replay

## Summary

Audited `ticket:20260602-flight-learn-card-copy-repaired-local-replay`, its evidence dossier, and the replay artifacts under `.loom/evidence/artifacts/20260602-flight-learn-card-copy-repaired-local-replay/`.

Verdict: `clear` for closing the ticket as **negative repaired local/open replay evidence**.

The artifacts support that the repaired product path was rebuilt and replayed with four cached/authorized local-open GGUF candidates through loopback-only `llama-server` version `9360`: SmolLM2 1.7B Q4_K_M, SmolLM3 3B Q4_K_M, Qwen3 1.7B Q4_K_M, and Phi-4-mini Q4_K_M. All four candidates timed out on all 8 synthetic/redacted cases under the current 5-second product path, producing 0/8 parse-valid, 0/8 schema-valid, 0/8 product-gated, 0/8 safe product-gated, and 0 gate-eligible safe product-gated model-enabled cards. Unsafe/privacy accepted output count was 0.

The downstream comprehension-validation ticket correctly remains blocked. The all-timeout result is valid negative evidence for this ticket's gate, not a reason to fabricate a pass or start operator validation. It does, however, exhaust the current runnable plan branch: after this replay ticket closes, the parent plan has no remaining runnable child ticket unless the operator authorizes a new direction such as a longer timeout/shorter prompt experiment, a new local runtime/model path, or a non-model/fallback-only validation rescope.

## Target

Target under review:

- `ticket:20260602-flight-learn-card-copy-repaired-local-replay`
- `evidence:20260602-flight-learn-card-copy-repaired-local-replay`
- Artifacts under `.loom/evidence/artifacts/20260602-flight-learn-card-copy-repaired-local-replay/`
- Parent/prerequisite records:
  - `plan:20260602-flight-learn-prompt-validator-contract-repair`
  - `ticket:20260602-flight-learn-card-copy-validator-contract-repair`
  - `audit:20260602-flight-learn-card-copy-validator-contract-repair-review`
- Downstream record:
  - `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation`

The ticket is in `review` and asks whether the repaired product path produces enough safe local/open model-enabled cards to reopen operator comprehension validation, or whether model-enabled comprehension remains blocked.

## Audit Scope And Lenses

Lenses used:

- ACC-001 through ACC-005 support;
- runtime/model honesty: cached/authorized models, checksums, local loopback runtime, no downloads/installs;
- provider boundary: no hosted calls, no non-loopback endpoints, no telemetry;
- metric honesty: timeouts vs parse/schema failures, model-enabled vs deterministic fallback, gate-eligible safety/adversarial exclusion;
- downstream gate disposition: whether `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` remains blocked correctly;
- privacy and side effects: raw prompt/output/log omission, source fingerprints, listener cleanup, final privacy scans;
- closure posture: whether all-candidate timeout means negative evidence, blocker, or operator/plan escalation.

Out of scope:

- rerunning local model evaluations;
- changing timeout/prompt/schema/runtime/model selection;
- source edits or product fixes;
- judging operator comprehension;
- authorizing new downloads, hosted inference, non-loopback endpoints, or product defaults.

## Context And Evidence Reviewed

- `.loom/tickets/20260602-flight-learn-card-copy-repaired-local-replay.md` - ticket scope, gate rule, acceptance, current review state, and journal. The ticket records the negative gate, all-candidate timeouts, zero unsafe accepted outputs, and downstream blocked state (`.loom/tickets/20260602-flight-learn-card-copy-repaired-local-replay.md:90-103`).
- `.loom/evidence/20260602-flight-learn-card-copy-repaired-local-replay.md` - evidence dossier. It records successful rebuild, cached/authorized local-open runtime posture, corrected gate semantics, per-candidate all-timeout outcome, cleanup checks, and non-claims (`.loom/evidence/20260602-flight-learn-card-copy-repaired-local-replay.md:12-34`, `:55-69`).
- `00-artifact-index.json` - inspected corpus breadth, four candidate identities, expected checksums, artifact map, render files, check flags, gate disposition, and non-claims. It records 8 synthetic/redacted cases and all checks passing.
- `01-replay-summary.json` - inspected aggregate metrics. It records 4 selected/running candidates, no passing candidates, 0 safe product-gate counts for every candidate, 0 unsafe accepted outputs, `gateDisposition: keep-downstream-comprehension-validation-blocked`, `hostedProviderUsed: false`, `loopbackOnly: true`, `runtimeInstallsOrUpgrades: false`, `modelDownloads: false`, and `authorizedCachedModelsOnly: true` (`01-replay-summary.json:4-45`).
- `02-candidate-report-index.json` - inspected per-candidate status, summary/provenance/source-side-effect artifacts, render files, and listener checks. All four candidates have `status: ran`; listener checks have empty stdout/stderr and separate listener files.
- Candidate provenance artifacts:
  - SmolLM2: cache `verified`, size 0.98 GiB, SHA256 matches expected `decd2598...`, `downloadedNow: false`, runtime version `9360`, base URL `http://127.0.0.1:<port>/`, raw logs not persisted.
  - SmolLM3: cache `verified`, size 1.78 GiB, SHA256 matches expected `8334b850...`, `downloadedNow: false`, same local runtime/loopback posture.
  - Qwen3 1.7B: cache `verified`, size 1.19 GiB, SHA256 matches expected `72c5c3...`, `downloadedNow: false`, same local runtime/loopback posture.
  - Phi-4-mini: cache `verified`, size 2.32 GiB, SHA256 matches expected `88c002...`, `downloadedNow: false`, same local runtime/loopback posture.
- Candidate summary artifacts - inspected with aggregate read-only script. Every candidate records 0 parse-valid, 0 schema-valid, 0 product-gated, 0 safe product-gated, 0 gate-eligible safe product-gated, 0 unsafe accepted, 8 timeouts, and `gatePass: false`.
- Representative renders:
  - `repaired-smollm2-1-7b-q4-k-m-case-01-repeated-workflow-72.txt` - deterministic fallback with timeout disclosure, problem/what happened/why it matters/expected/why flagged/evidence/follow-up actions visible.
  - `repaired-smollm2-1-7b-q4-k-m-case-05-safety-adversarial-72.txt` - deterministic fallback with generated-evidence concern explained and evidence collapsed.
  - `repaired-phi4-mini-q4-k-m-case-08-evidence-summary-92.txt` - deterministic fallback with collapsed evidence and no default raw provenance/debug strings.
- `03-render-line-widths.json` - line-width checks pass for rendered artifacts.
- `04-render-contract-check.json` - default hidden-internals check passes with no forbidden default findings.
- `05-artifact-privacy-scan.json` and `08-final-privacy-scan.json` - privacy scans pass with zero findings; additional read-only scan over ticket/evidence/artifacts found no raw home path, Pi session-storage path, private key, bearer token, or secret assignment.
- `06-source-side-effect-scan.json` and per-candidate source-side-effect scans - product source fingerprints unchanged during replay; final source-side-effect pass is true.
- `09-scoped-diff-check.txt` - scoped `git diff --check` passed.
- `10-final-status.txt` - scoped final status shows replay evidence/ticket artifacts plus pre-existing dirty product source from the contract repair branch, not replay source mutations.
- `11-temp-log-cleanup-check.txt` - no replay temp logs found after cleanup.
- `listener-*.txt` - each checked TCP port reports `no listener output`.
- `run-repaired-local-replay.mjs` - inspected run shape by grep. It launches `/opt/homebrew/bin/llama-server` with `--host 127.0.0.1`, uses loopback `baseUrl`, verifies cached file SHA256 against expected values, records `downloadedNow: false`, and records raw logs as temporary byte-count summaries only.
- `audit:20260602-flight-learn-card-copy-validator-contract-repair-review` - prerequisite audit verdict `clear`; it supports replay only, not comprehension validation.
- `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` - downstream ticket remains `Status: blocked` and records this repaired local/open replay as negative gate evidence (`.loom/tickets/20260531-flight-learn-llm-card-copy-comprehension-validation.md:90-106`).
- `plan:20260602-flight-learn-prompt-validator-contract-repair` - parent plan says replay is the local/open gate before operator comprehension validation; the replan trigger includes already authorized/cached local models still failing the repaired replay gate.

## Findings

None - no material findings within audited scope.

### Non-finding: all candidates timing out supports negative gate closure, not replay ticket blockage

The replay produced no model content because all four local/open candidates timed out 8/8 under the current 5-second product path. That is disappointing, but it is an observed replay result, not a missing-evidence blocker for this ticket. The ticket's closure claim is to determine whether the repaired local/open path is ready for operator comprehension validation. The evidence answers that question negatively: no candidate produced any gate-eligible safe model-enabled card.

This should be closed as negative replay evidence and should keep downstream validation blocked. Further experimentation would require a new operator/product decision because the likely next directions change the scope: shorter prompt, longer timeout, different local runtime/model, or a fallback-only validation rescope.

## ACC Support

- ACC-001 is supported. `00-artifact-index.json` records 8-case corpus coverage and candidate identities/checksums; candidate provenance artifacts record cache verification, runtime version `9360`, loopback base URLs, `downloadedNow: false`, no installs/downloads, and raw log non-persistence.
- ACC-002 is supported for a negative disposition. `01-replay-summary.json` records no passing candidates and zero safe product-gate counts; per-candidate summaries record 8/8 timeouts and zero unsafe accepted outputs for every candidate.
- ACC-003 is supported as fallback-render evidence. Render artifacts exist at widths 92 and 72 for every candidate/case; `03-render-line-widths.json` passes and `04-render-contract-check.json` passes. Since no candidate produced model-enabled cards, all final renders are deterministic fallback renders, and the evidence is honest about that.
- ACC-004 is supported. Downstream `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` remains blocked and records the negative repaired local/open replay gate (`.loom/tickets/20260531-flight-learn-llm-card-copy-comprehension-validation.md:90-106`).
- ACC-005 is supported. Privacy scans pass, source fingerprints are unchanged during replay, listener files show no listener output, temp logs were cleaned, and raw prompts/model output/server logs were not persisted.

## Verdict

Verdict: `clear`.

The ticket can close as **negative repaired local/open replay evidence**. The audited evidence supports the gate disposition: keep downstream operator comprehension validation blocked.

Closure recommendation:

1. Close `ticket:20260602-flight-learn-card-copy-repaired-local-replay` as negative gate evidence.
2. Keep `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` blocked.
3. Do not start dogfood corpus/outcome collection, classifier automation, route ranking, product model integration, hosted defaults, or operator comprehension validation from this replay.
4. Reconcile `plan:20260602-flight-learn-prompt-validator-contract-repair`: after this replay closes, the plan has no remaining runnable child ticket under current authority. The downstream validation ticket is blocked by the negative gate, so further progress requires an operator/product decision or a newly shaped ticket.

## Required Follow-up

Before closing the replay ticket:

1. Record this audit in the replay ticket current state/journal.
2. Close the replay ticket only as negative local/open replay evidence.
3. Preserve the downstream blocked disposition.
4. Update the parent plan to reflect that the current repair branch reached a negative local/open replay gate and has no remaining runnable work under current authorization.

Potential next directions require new shaping/authority and are **not** authorized by this audit:

- a shorter-prompt or evidence-summary-only product path;
- a longer product timeout or different timeout envelope;
- another local/open runtime or model download;
- fallback-only/fake-provider UX validation with explicit non-claims;
- abandoning model-enabled comprehension for this release cycle.

## Downstream Disposition

`ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` should remain blocked. The gate required at least five safe real product-gated model-enabled card renders from representative non-safety/adversarial cases with zero unsafe/privacy accepted outputs. This replay produced zero.

No operator comprehension notes should be collected from this replay as model-enabled validation. The render pack is deterministic fallback only and replay metrics are not comprehension evidence.

## Parent Plan Disposition

`plan:20260602-flight-learn-prompt-validator-contract-repair` has no remaining runnable child work after this replay ticket closes:

- diagnostics child ticket: closed with clear audit;
- contract repair child ticket: closed with clear audit;
- local/open replay child ticket: supported for closure as negative evidence by this audit;
- downstream comprehension-validation ticket: remains blocked by the negative gate.

The plan should be reconciled to a blocked/escalation state or an explicit completed-negative state only if the operator accepts that the current branch is done. Continuing implementation without a new decision would invent scope.

## Residual Risk

- The replay proves failure under the current 5-second product path, not global model uselessness. A shorter prompt, longer timeout, different runtime settings, or different local model could behave differently and would need fresh scoped work.
- Since all candidates timed out, this replay does not test repaired validator semantics against completed real local model output. The repair is covered by fake-provider/unit evidence and audit, not by successful local model completions.
- All render artifacts are fallback cards. They support fallback safety and width/provenance checks, but they do not provide a model-enabled comprehension review packet.
- Model cache/source provenance is sufficient for this replay because it cites prior authorized small-model evidence and verified checksums; it is not a broader supply-chain certification.
- The broader workspace remains dirty from related Loom/source work. The replay artifacts show no product source changes during replay, but closure should avoid overstating whole-workspace cleanliness.

## Related Records

- `ticket:20260602-flight-learn-card-copy-repaired-local-replay`
- `evidence:20260602-flight-learn-card-copy-repaired-local-replay`
- `plan:20260602-flight-learn-prompt-validator-contract-repair`
- `ticket:20260602-flight-learn-card-copy-validator-contract-repair`
- `audit:20260602-flight-learn-card-copy-validator-contract-repair-review`
- `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation`
- `evidence:20260602-flight-learn-small-model-batch-eval`
- `evidence:20260602-flight-learn-gpt55-hosted-sanity-check`
