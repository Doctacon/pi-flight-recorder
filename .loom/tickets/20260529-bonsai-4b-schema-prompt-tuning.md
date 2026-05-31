# Bonsai 4B Schema Prompt Tuning

ID: ticket:20260529-bonsai-4b-schema-prompt-tuning
Type: Ticket
Status: closed
Created: 2026-05-29
Updated: 2026-05-29
Risk: medium - this is harness/prompt experimentation around a privacy-sensitive local-model path, but it must not change product defaults or storage/routing behavior.
Priority: medium - this is the next bounded follow-up after real 4B validation failed mostly on format/schema rather than narrative reasoning.

## Summary

Run a bounded prompt/schema tuning experiment for the existing Bonsai 4B Q1_0 local model to determine whether the prior `0 accepted / 15 fallback` narrative result was primarily a prompt/contract compliance problem. The single closure claim is: the project has comparable local evidence showing whether prompt-only/schema-instruction changes materially improve Bonsai 4B's JSON/schema compliance under the existing strict verifier + local judge path, without changing `/flight-learn` product defaults or weakening safety gates.

This ticket should not productize a new prompt. It should create experiment evidence first. If a variant looks promising, product integration belongs in a successor ticket after audit.

## Related Records

- `plan:20260529-flight-recorder-product-recalibration` - parent recalibration plan; this tuning ticket is the model-contract hypothesis test before a broader core-loop stocktake.
- `plan:20260528-flight-learn-4b-narrative-what-happened` - completed parent plan; it established the safe narrative architecture and closed with a negative Bonsai 4B recommendation under the first real prompt/contract run.
- `ticket:20260528-bonsai-4b-narrative-validation` - prior real Bonsai 4B validation ticket; closed negative with `0 accepted / 15 fallback`.
- `evidence:20260528-bonsai-4b-narrative-validation` - baseline evidence; dominant failures were malformed JSON (12), schema-invalid (2), and timeout (1), while raw samples showed plausible but wrongly-shaped narrative output.
- `audit:20260528-bonsai-4b-narrative-validation-followup-review` - clear audit for the prior negative validation; preserve its non-claims and privacy posture.
- `spec:flight-learn-inbox-ux` REQ-030 through REQ-032 and SCN-010 - intended behavior for distinct `Problem` and narrative `What happened?` when optional local model output is accepted.
- `research:20260528-local-narrative-judge-validation` - selected the hybrid fact-ID verifier plus local judge veto architecture; this ticket must not revert to regex semantic validation.
- `ticket:20260528-narrative-fact-id-contract-verifier` - implemented the deterministic fact-ID verifier that must remain strict.
- `ticket:20260528-local-narrative-judge-provider-contract` - implemented the judge provider/veto contract that must remain strict.
- `ticket:20260528-local-narrative-llama-cpp-judge-adapter` - implemented loopback-only llama.cpp judge adapter and explicit judge flags.
- `.loom/evidence/artifacts/20260528-bonsai-4b-narrative-validation/raw-bonsai-4b-samples.json` - diagnostic examples of schema/format mismatch; use only as redacted/synthetic tuning input.
- `.loom/evidence/artifacts/20260528-flight-learn-narrative-rubric-corpus/narrative-what-happened-eval-corpus.v1.json` - 15-case synthetic/redacted narrative corpus to reuse for comparable metrics.

## Scope

In scope:

- Use only the already-downloaded Bonsai 4B Q1_0 GGUF with checksum `4524b3f997f0f06444e568d1f26e2efd69effa3218c7ad3047432fb171e42168`.
- Use only a loopback `llama.cpp` server if an existing local runtime is already available; do not install, build, download, or fetch tooling.
- Create or update a harness under `.loom/evidence/artifacts/20260529-bonsai-4b-schema-prompt-tuning/` that runs the existing synthetic/redacted 15-case narrative corpus through prompt variants.
- Compare against the prior real-run baseline: 15 cases, 0 accepted, 15 fallback, malformed JSON 12, schema-invalid 2, timeout 1.
- Try prompt/schema-instruction variants that keep the same strict product contract, for example: a single exact JSON exemplar, fewer nonessential instructions, explicit `schemaVersion: 2`, explicit `whatHappened.sentences[]`, `single JSON object only`, and no markdown/prose outside JSON.
- Record staged metrics for each variant: parse-valid JSON count, schema-valid count, deterministic verifier pass count, judge pass count, accepted count, fallback count/reasons, unsafe accept count, timeout count, latency summary, and qualitative notes.
- Preserve strict fail-closed product posture: invalid, unsupported, unsafe, uncertain, prompt-echo, private, or route/action content must fall back.
- Record sanitized raw samples only when useful to explain a failure mode; do not persist raw private sessions, prompts from real sessions, unredacted paths, secrets, stack traces, or transcripts.
- Produce an evidence dossier and request audit before closure.
- Include a short `Project implications` or equivalent section in the evidence/ticket closure that says what the tuning result implies for the larger Flight Recorder loop: continue model narrative work, move to grammar-constrained JSON, pivot back to deterministic UX/core-loop corpus work, or shape a successor plan.

Out of scope:

- Changing `/flight-learn` default behavior, UI behavior, command visibility, routing, storage, artifact candidates, classifier behavior, source-of-truth fields, or rule/source/docs/Loom mutation behavior.
- Weakening the fact-ID verifier, judge veto behavior, hard privacy/safety gates, or fail-closed fallback semantics.
- Replacing semantic validation with regex allow-lists or accepting unsupported narrative because it reads well.
- Downloading Bonsai 8B, Ternary, MLX models, Prometheus/NLI models, alternate open-source models, custom `llama.cpp` forks, or any hosted/non-loopback model endpoint.
- Productizing a tuned prompt in source as part of this ticket. If evidence supports productization, create a successor implementation ticket.
- Claiming release readiness, broad Bonsai inferiority/suitability, independent judge quality, real-user usefulness, or generalized latency from this synthetic/redacted corpus.

System-shape constraints:

- The model may only affect display-only candidate wording after strict validation.
- The deterministic fact packet remains the source of facts; model prose is never source of truth.
- The local judge remains a veto/uncertainty gate and cannot rewrite candidate text.
- Product strictness must remain unchanged while the harness may expose staged diagnostic counters.

Stop conditions:

- Stop immediately if any variant produces an accepted narrative that includes unsupported facts, action/route advice, prompt echo, private/raw content, raw local paths, secrets, transcript-like content, mutation instructions, or ungrounded claims.
- Stop if the Bonsai 4B file is missing or checksum differs; ask before redownloading or substituting.
- Stop if running the experiment would require installing/building/downloading a runtime or using a non-loopback/hosted endpoint.
- Stop if evidence would require raw private sessions or unredacted local artifacts.
- Stop and route to a separate grammar-constrained JSON ticket if prompt-only variants do not materially reduce malformed/schema-invalid output.
- Stop and route to a separately authorized model/judge evaluation if existing Bonsai 4B appears unsuitable after prompt-only tuning.

## Acceptance

- ACC-001: The experiment is comparable to the prior 4B validation baseline.
  - Evidence: harness artifacts name the corpus version, model checksum, local runtime/loopback command, prompt variants, and baseline metrics from `evidence:20260528-bonsai-4b-narrative-validation`.
  - Audit: challenge whether results are comparable or quietly changed corpus/model/runtime/safety gates.

- ACC-002: Prompt variants are evaluated with staged metrics, not a single vague success/failure label.
  - Evidence: each variant records parse-valid JSON, schema-valid output, verifier pass, judge pass, accepted/fallback counts, fallback reasons, timeout count, latency summary, and unsafe accept count for all 15 cases.
  - Audit: challenge missing cases, hidden failures, or aggregation that masks unsafe outputs.

- ACC-003: At least one variant shows material format/schema improvement, or the ticket closes with a clear negative prompt-only conclusion.
  - Evidence: material improvement means at minimum reducing malformed JSON failures from the baseline 12/15 to 6/15 or fewer and producing at least 5 schema-valid outputs, while preserving zero unsafe accepts. If no variant reaches that bar, evidence must say prompt-only tuning did not clear the next-stage threshold and recommend grammar-constrained JSON or another follow-up rather than productization.
  - Audit: challenge whether the threshold is met without weakening validation or cherry-picking cases.

- ACC-004: Safety and privacy remain intact.
  - Evidence: zero unsafe accepted outputs, privacy scan over artifacts, no raw `/Users/...` paths or private transcripts, server stop status, and no product source/default/storage/routing side effects from this ticket.
  - Audit: challenge redaction, prompt echo, route/action advice, model-output persistence, and source-of-truth mutation boundaries.

- ACC-005: The recommendation is explicit and bounded.
  - Evidence: evidence/ticket state one of: continue prompt tuning, proceed to grammar-constrained JSON investigation, create productization ticket, or abandon Bonsai 4B for this contract pending separate authorization. It must preserve non-claims about release readiness, broad Bonsai model quality, independent judge quality, and latency generalization.
  - Audit: challenge overclaiming from a synthetic/redacted 15-case corpus.

- ACC-006: Product-loop implications are captured for the follow-up stocktake.
  - Evidence: the evidence/ticket closure includes a concise section explaining whether the result suggests a code blocker, prompt/schema blocker, safety/evidence blocker, UX design blocker, or non-critical polish detour for the broader Flight Recorder loop.
  - Audit: challenge whether the ticket stayed too narrow and failed to inform `ticket:20260529-flight-recorder-core-loop-stocktake`.

## Current State

Closed as a bounded evidence-only prompt/schema experiment. Evidence is recorded at `evidence:20260529-bonsai-4b-schema-prompt-tuning`; audit `audit:20260529-bonsai-4b-schema-prompt-tuning-review` returned clear to close. The best variant, `exact-example-single-json`, materially improved format/schema compliance (8/15 parse-valid, 8/15 schema-valid, 7/15 verifier pass) over the prior malformed/schema baseline, with zero unsafe accepted outputs. It still produced 0/15 accepted narratives because downstream judge calls timed out, one candidate was rejected as unsafe/non-display content, and some outputs remained malformed or timed out. Server stop status and privacy scan are recorded. The closure claim is limited: prompt/schema tuning improved structured-output staging but does not justify productization, release readiness, broad Bonsai claims, or weakening any verifier/judge/privacy gates. Feed this result into `ticket:20260529-flight-recorder-core-loop-stocktake`.

## Journal

- 2026-05-29: Created by Loom Weaver after the prior real 4B validation closed negative. Shaped as one executable tuning ticket rather than a plan because grammar-constrained JSON, alternate models, and productization are successor decisions only if this prompt-only experiment produces evidence that warrants them.
- 2026-05-29: Amended by Loom Weaver after the operator raised a broader project-thread concern. Linked to `plan:20260529-flight-recorder-product-recalibration` and added `ACC-006` so the tuning result feeds a product-level stocktake.
- 2026-05-29: Driver set status to active and launched bounded Ralph implementation for the prompt/schema tuning harness and evidence.
- 2026-05-29: Worker transport returned a parent Pi extension `database is locked` error, but artifacts were written under `.loom/evidence/artifacts/20260529-bonsai-4b-schema-prompt-tuning/`. Driver reconciled those artifacts directly, ran/redid artifact redaction/privacy scan, confirmed server stop/no listener, wrote `evidence:20260529-bonsai-4b-schema-prompt-tuning`, and moved ticket to review. Result: prompt/schema compliance improved for `exact-example-single-json`, accepted narratives remain 0/15; no productization claim.
- 2026-05-29: Audit `audit:20260529-bonsai-4b-schema-prompt-tuning-review` returned clear to close for the bounded evidence-only scope. Closed ticket with residual risks preserved: synthetic 15-case corpus, no accepted narratives, self-judge timeout behavior, no real-user/release/productization claim.
