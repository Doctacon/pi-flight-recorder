# Flight Learn Qwen3 4B Instruct Evaluation Review

ID: audit:20260602-flight-learn-qwen3-4b-instruct-eval-review
Type: Audit
Status: recorded
Created: 2026-06-02
Updated: 2026-06-02
Audited: 2026-06-02 UTC
Target: ticket:20260602-flight-learn-qwen3-4b-instruct-eval

## Summary

Audited `ticket:20260602-flight-learn-qwen3-4b-instruct-eval` and its evidence packet. The ticket can close as **negative current-product-path evidence**: the exact authorized Qwen3-4B-Instruct-2507 Q4_K_M GGUF was downloaded and evaluated locally, but it produced 0/8 product-gated model-enabled cards under the current 5-second product path, so downstream comprehension validation correctly remains blocked.

## Target

Target under review:

- `ticket:20260602-flight-learn-qwen3-4b-instruct-eval`
- Evidence dossier `evidence:20260602-flight-learn-qwen3-4b-instruct-eval`
- Evaluation artifacts under `.loom/evidence/artifacts/20260602-flight-learn-qwen3-4b-instruct-eval/`

The ticket is in `review` and asks whether ACC-001 through ACC-005 are supported after downloading/caching and evaluating the operator-authorized Qwen3-4B-Instruct-2507 Q4_K_M model candidate.

## Audit Scope And Lenses

Lenses used:

- acceptance and evidence: whether ACC-001 through ACC-005 are supported by the dossier and artifacts;
- model identity/source: whether the downloaded model is the authorized Qwen3-4B-Instruct-2507 Q4_K_M candidate and whether license/source notes are honest;
- metric interpretation: whether the evidence correctly reports 0/8 under the current 5-second product path without overclaiming global Qwen quality or operator comprehension;
- gate reconciliation: whether `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` remains blocked because the replay gate did not pass;
- privacy/runtime/scope: whether artifacts avoid raw prompts, raw model output, raw logs, private paths, secrets, and transcript content; whether runtime stayed loopback-only and cleaned up; whether product source remained unchanged during the run;
- memory claim: whether file size and approximate RSS claims are supported and not overread.

Out of scope:

- re-running the Qwen model;
- changing timeouts, prompts, schemas, validators, or product source;
- selecting the next model candidate;
- operator comprehension validation;
- dogfood corpus/outcome collection, classifier readiness, or release readiness.

## Context And Evidence Reviewed

- Ralph review run: bounded live-reference audit of `ticket:20260602-flight-learn-qwen3-4b-instruct-eval`, its evidence dossier, key artifacts, downstream comprehension-validation ticket, relevant research/spec requirements, representative renders, and read-only source seams.
- `.loom/tickets/20260602-flight-learn-qwen3-4b-instruct-eval.md` - ticket scope, authorization boundary, ACC-001 through ACC-005, current review state, and gate rule.
- `.loom/evidence/20260602-flight-learn-qwen3-4b-instruct-eval.md` - evidence dossier, model provenance summary, replay metrics, non-claims, render/privacy checks, and downstream disposition.
- `00-artifact-index.json` - inspected synthetic/redacted corpus coverage, model metadata, runtime status, render files, checks, and non-claims.
- `01-model-provenance.json` - inspected model identity and runtime provenance: `Qwen_Qwen3-4B-Instruct-2507-Q4_K_M.gguf`, source repo `bartowski/Qwen_Qwen3-4B-Instruct-2507-GGUF`, upstream `Qwen/Qwen3-4B-Instruct-2507`, upstream license `apache-2.0`, SHA256 `2fde00ce69dd4899c70d020845e2638353015bba0fdf161b3eb965f2bca4464e`, file size 2.33 GiB, cache status `downloaded-this-run`, runtime `/opt/homebrew/bin/llama-server` version `9360 (6b4e4bd58)`, loopback base URL, health ok, raw logs not persisted, and approximate RSS summary.
- `02-qwen3-replay-summary.json` - inspected product-path metrics: 8 cases, 0 parse-valid, 0 schema-valid, 0 product-gated model-enabled cards, 0 safe product-gated cards, 8 deterministic fallbacks, 8 timeouts, 0 unsafe accepted outputs, average latency 5008ms, prompt length average 5207 chars, gate disposition `keep-downstream-comprehension-validation-blocked`.
- `03-qwen3-replay-status.json` - inspected real runtime status `ran`.
- `04-source-side-effect-scan.json` - inspected source fingerprint before/after scan for `src/flight-learn-local-diagnosis-model.ts`, `src/flight-learn-llama-cpp-adapter.ts`, and `src/flight-learn-inbox.ts`; pass with no changed compared sources.
- `05-render-line-widths.json` - inspected width checks for all 16 fallback render artifacts; pass.
- `06-render-contract-check.json` - inspected default-hidden-internals checks for all fallback render artifacts; pass with no forbidden findings.
- `08-post-run-listener-check.txt` - inspected post-run listener check; records checked TCP port and no listener output.
- `13-final-privacy-scan.json` - inspected final privacy scan: 34 files scanned, 0 findings.
- Representative fallback renders: `real-case-01-repeated-workflow-72.txt`, `real-case-05-safety-adversarial-72.txt`, and `real-case-08-evidence-summary-92.txt` - inspected fallback status line, deterministic wording, collapsed evidence, visible route/actions, and no default raw clue/provenance internals.
- `.loom/research/20260602-small-local-model-options-for-flight-learn.md` - inspected model-selection context and the warning that candidate reputation does not prove `/flight-learn` readiness.
- `.loom/tickets/20260531-flight-learn-llm-card-copy-comprehension-validation.md` - inspected current blocked state; it records the Qwen evaluation as negative evidence and keeps validation blocked.
- `.loom/specs/flight-learn-inbox-ux.md` REQ-033 through REQ-048 and SCN-011 through SCN-015 - inspected model-enabled comprehension, hidden evidence, expected-behavior, fallback, and source-of-truth requirements.
- Read-only source seam inspection: `src/flight-learn-local-diagnosis-model.ts` shows product timeout normalization clamps to 5,000ms and timeout falls back deterministically; `src/flight-learn-llama-cpp-adapter.ts` shows loopback-only URL validation and JSON-schema response format; `src/flight-learn-inbox.ts` shows fallback status copy and collapsed evidence/default-hidden provenance behavior.
- Read-only grep over persisted render `.txt` artifacts found no raw home paths, Pi session paths, secret markers, `Raw clue`, `Why suggested`, cluster IDs, prompt markers, or transcript markers. A broader grep found only harness regex literals and evidence prose mentions of forbidden terms, not leaked content.
- Read-only scoped `git diff --check` over the ticket/evidence/artifact paths passed with no output.
- Read-only scoped `git status --short` shows the broader workspace has unrelated dirty source files; the source fingerprint artifact supports only the scoped claim that compared source seams did not change during this evaluation.

## Findings

None - no material findings within this bounded audit scope.

Supporting observations:

- ACC-001 is supported: `00-artifact-index.json` and `01-model-provenance.json` record the exact authorized model file, source repo/file, upstream model, upstream license note, SHA256, file size, cache status, runtime version, loopback health, and approximate RSS. The memory claim is framed as file size plus approximate observed RSS, not total system memory or general deployability.
- ACC-002 is supported: `02-qwen3-replay-summary.json` records parse/schema/product-gate metrics, fallback reasons, timeouts, latency, field coverage, display states, and gate disposition. The dossier correctly limits the result to the current product path and timeout.
- ACC-003 is supported as a fallback-only render pack: no product-gated cards existed, and the dossier says the render pack is fallback-only. Width and hidden-internals checks passed.
- ACC-004 is supported: downstream `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` remains blocked, and the Qwen ticket/evidence record the gate failure rather than treating model reputation or fallback renders as comprehension.
- ACC-005 is supported: privacy scans passed, independent render grep found no leakage, raw prompts/model responses/server logs were not persisted, listener cleanup was recorded, runtime was loopback-only, and source side-effect scan passed for the compared source seams.

## Verdict

Verdict: `clear` as a bounded evaluation audit, with a negative current-product-path outcome.

`ticket:20260602-flight-learn-qwen3-4b-instruct-eval` can close as-is as negative evidence for Qwen3-4B-Instruct-2507 Q4_K_M under the current product prompt/schema/5-second timeout path. The evidence supports the exact closure claim: the model was evaluated locally and safely, produced no product-gated model-enabled cards, and therefore cannot unblock operator comprehension validation from this run.

This verdict does not mean Qwen3-4B-Instruct-2507 is globally unusable. It means the current product path and 5-second envelope did not produce a usable model-enabled card-copy render pack.

## Required Follow-up

- Close `ticket:20260602-flight-learn-qwen3-4b-instruct-eval` as negative current-product-path evidence, not as a global model-quality conclusion.
- Keep `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` blocked; the gate required at least five safe real product-gated model-enabled renders and this run produced zero.
- Do not start dogfood corpus/outcome collection, classifier-readiness work, or operator comprehension validation from this packet.
- Do not infer product source repair, timeout changes, prompt changes, or default-model selection from this audit. Those would need separate operator-shaped tickets/evidence.
- If Qwen remains interesting, shape a separate bounded experiment for shorter prompts, longer explicitly authorized timeout, or a different schema; do not treat this ticket as authorization for those changes.

## Residual Risk

- All cases timed out, so the run did not exercise Qwen's completed-output semantics, product validators on Qwen text, or safety behavior for accepted Qwen card copy.
- The RSS numbers are approximate observed process RSS under this harness and should not be treated as total memory requirement, memory ceiling, or Pi-session deployability proof.
- The model came from a third-party GGUF quantizer repo with upstream model/license notes recorded; this is sufficient for this evaluation packet but not a supply-chain certification.
- Render artifacts are deterministic fallback cards only, not model-enabled cards.
- The source side-effect claim is scoped to compared seams during the evaluation. The broader workspace remains dirty from unrelated work.
- Operator comprehension, real-session usefulness, UI adequacy for live users, dogfood label quality, classifier readiness, and release readiness remain unverified.

## Related Records

- `ticket:20260602-flight-learn-qwen3-4b-instruct-eval` - consuming ticket that owns closure disposition.
- `evidence:20260602-flight-learn-qwen3-4b-instruct-eval` - evaluation evidence reviewed.
- `research:20260602-small-local-model-options-for-flight-learn` - model-selection context and candidate caveats.
- `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` - downstream validation that remains blocked.
- `spec:flight-learn-inbox-ux` - behavior and trust-boundary contract for model-enabled card copy and fallback.
