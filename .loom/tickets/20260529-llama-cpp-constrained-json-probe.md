# Llama.cpp Constrained JSON Probe

ID: ticket:20260529-llama-cpp-constrained-json-probe
Type: Ticket
Status: closed
Created: 2026-05-29
Updated: 2026-05-29
Risk: medium - this probes a privacy-sensitive local-model transport path and could be overread as product readiness if the evidence is not tightly bounded.
Priority: medium - this directly tests whether the Bonsai narrative failure is fixable via constrained decoding rather than more prompt tweaking.

## Summary

Run an evidence-only probe to determine whether the existing local `llama.cpp`/Bonsai 4B runtime can enforce the `/flight-learn` narrative JSON shape through grammar or JSON-schema constrained decoding. The single closure claim is: the project knows which installed local runtime/API path, if any, actually enforces schema-valid JSON for Bonsai 4B generation, and whether that removes the generator-format blocker seen in prior narrative validation.

This ticket must not productize adapter changes. If a constrained route works, a successor implementation ticket may add adapter support after audit.

## Related Records

- `research:20260529-llama-cpp-constrained-json` - shaping research; records external `llama.cpp` support and caveats for grammar / JSON-schema constrained decoding.
- `evidence:20260529-llama-cpp-constrained-json-probe` - execution evidence for this ticket.
- `audit:20260529-llama-cpp-constrained-json-probe-review` - Ralph-backed review; clear within bounded scope.
- `research:20260529-flight-recorder-core-loop-stocktake` - says grammar-constrained JSON is a valid narrow model-work successor, but local narrative remains optional polish rather than the core product loop.
- `ticket:20260529-bonsai-4b-schema-prompt-tuning` - prior prompt/schema tuning ticket; closed with 8/15 schema-valid and 7/15 verifier-passing outputs for the best prompt, but 0/15 accepted narratives.
- `evidence:20260529-bonsai-4b-schema-prompt-tuning` - evidence that malformed/schema-invalid output improved with prompting but remained unaccepted, and that judge timeout/behavior remains a likely next bottleneck.
- `audit:20260529-bonsai-4b-schema-prompt-tuning-review` - clear audit of prior tuning; warns not to productize the tuned prompt.
- `spec:flight-learn-inbox-ux` REQ-024 through REQ-032 and SCN-010 - optional local-model narrative must remain opt-in, local/open-source, bounded, validated, display-only, and fail-closed.
- `src/flight-learn-llama-cpp-adapter.ts` - current adapter posts to `/v1/chat/completions` with `response_format: { type: "json_object" }`; source inspection only unless a successor implementation ticket is created.
- `.loom/evidence/artifacts/20260528-flight-learn-narrative-rubric-corpus/narrative-what-happened-eval-corpus.v1.json` - synthetic/redacted corpus for any narrative generator-only checks.

## Scope

In scope:

- Use only the already-downloaded Bonsai 4B Q1_0 GGUF with checksum `4524b3f997f0f06444e568d1f26e2efd69effa3218c7ad3047432fb171e42168`.
- Use only an existing local `llama-server` runtime if available; start it loopback-only on an unused localhost port and stop it before completion.
- Create artifacts under `.loom/evidence/artifacts/20260529-llama-cpp-constrained-json-probe/`.
- Probe constrained decoding routes supported by the installed runtime, such as:
  - `/v1/chat/completions` with OpenAI-style `response_format: { type: "json_schema", json_schema: ... }`;
  - `/v1/chat/completions` with top-level `json_schema` when accepted by this runtime;
  - `/v1/chat/completions` with request-level `grammar` when accepted by this runtime;
  - `/completion` with request-level `json_schema` or `grammar` if chat completions do not prove enforcement.
- First prove constraint enforcement with tiny schemas/grammars that make unconstrained output obvious, e.g. const string/object or required fields with `additionalProperties: false`.
- Use simple inline schemas only. Avoid `$ref`, `$defs`, recursive schemas, and complex generated schemas.
- If a route proves active constraint enforcement, run a generator-only narrative schema probe over the existing synthetic/redacted corpus. Generator-only means measure parse/schema/verifier behavior before local judge, so judge timeout does not hide the constrained-decoding result.
- Record staged metrics: route accepted/rejected, enforcement proof pass/fail, parse-valid count, schema-valid count, verifier pass count, malformed/schema-invalid count, timeout count, latency summary, raw redacted examples, and any route-specific errors.
- Preserve strict product invariants in interpretation: deterministic verifier, fact-ID grounding, judge veto, privacy gates, and fail-closed behavior are not weakened by this probe.
- Produce an evidence dossier and request audit before closure.

Out of scope:

- Editing `src/flight-learn-llama-cpp-adapter.ts` or any product source.
- Changing `/flight-learn` defaults, UI behavior, CLI flags, routing, storage, classifier behavior, artifact candidates, source-of-truth records, docs, package metadata, or tests.
- Downloading/authorizing Bonsai 8B, Ternary, MLX, alternate models, Prometheus/NLI models, custom forks, or hosted providers.
- Installing, upgrading, building, or replacing `llama.cpp`.
- Treating constrained JSON as semantic grounding, judge quality, narrative usefulness, release readiness, or productization proof.
- Persisting raw private sessions, unredacted local paths, secrets, stack traces, full prompts, or transcripts.

Stop conditions:

- Stop if the Bonsai 4B model file is missing or checksum differs; do not redownload or substitute.
- Stop if no existing local `llama-server` runtime can run the probe without install/build/upgrade.
- Stop if a route requires hosted/non-loopback endpoints or provider keys.
- Stop if evidence would require private raw session data or unredacted local artifacts.
- Stop if all constrained-decoding routes are unsupported or rejected by the installed runtime; record the runtime/API limitation instead of widening scope.
- Stop if constrained decoding produces schema-valid but semantically unsafe content; record it as a safety blocker rather than lowering gates.

## Acceptance

- ACC-001: Runtime/model provenance and local boundary are captured.
  - Evidence: local runtime version, Bonsai 4B checksum, loopback server command, health, stop status, and no hosted/provider-key use.
  - Audit: challenge whether the probe used the existing local model/runtime or silently changed the environment.

- ACC-002: Constraint enforcement is actually tested, not assumed.
  - Evidence: tiny const/required-field probes show for each route whether constraints are enforced, ignored, rejected, or inconclusive. The record must distinguish “server accepted the request” from “generation was constrained.”
  - Audit: challenge false positives where the model happened to comply without grammar enforcement.

- ACC-003: Narrative generator-format impact is measured separately from judge behavior.
  - Evidence: if any constrained route works, the synthetic/redacted narrative corpus is run generator-only and reports parse-valid, schema-valid, verifier-pass, malformed/schema-invalid, timeout, and latency metrics without local judge timeout hiding generator results.
  - Audit: challenge conflation of generator constraints with judge acceptance.

- ACC-004: Safety/privacy/product boundaries remain intact.
  - Evidence: privacy scan over artifacts, zero product source/default/storage/routing mutations, no raw private sessions or unredacted paths, server stopped, and unsafe outputs remain non-product evidence only.
  - Audit: challenge redaction, source-edit creep, prompt/transcript leakage, and weakened gate interpretations.

- ACC-005: Recommendation is explicit and routed.
  - Evidence: evidence/ticket recommends one of: create adapter implementation ticket for the proven constrained route; investigate judge/latency next; investigate runtime/API upgrade separately; or abandon constrained JSON for this installed runtime. It must preserve non-claims about product readiness, broad Bonsai quality, independent judge quality, and classifier/corpus readiness.
  - Audit: challenge productization or release claims from a transport probe.

## Current State

Closed. The bounded closure claim is satisfied and reviewed: this installed local `llama-server`/Bonsai 4B path can enforce schema-valid JSON for generator output through the product-adjacent `/v1/chat/completions` OpenAI-style `response_format: { type: "json_schema", json_schema: { name, strict, schema } }` route. Evidence recorded 15/15 parse-valid, 15/15 schema-valid, and 15/15 harness-verifier-passing generator-only outputs on the synthetic/redacted narrative corpus, with zero timeouts. Audit `audit:20260529-llama-cpp-constrained-json-probe-review` returned clear within the bounded scope. No judge was run; no semantic acceptance, product readiness, release readiness, or broad Bonsai suitability claim is made. No product/source/default/storage/routing behavior was changed.

Recommended successor: shape a separate adapter implementation ticket for opt-in request-level JSON-schema support on the proven chat route, and keep judge/latency replay as a separate follow-up before any productized narrative claim.

## Journal

- 2026-05-29: Created by Loom Weaver after external `llama.cpp` research showed constrained decoding is a plausible fix for prompt-only malformed/schema-invalid Bonsai output, but with route/template/runtime caveats that need local proof.
- 2026-05-29: Driver set status to active after operator requested execution. Preflight observed pre-existing modified/untracked workspace state, confirmed `/opt/homebrew/bin/llama-server` exists, and confirmed Bonsai 4B checksum `4524b3f997f0f06444e568d1f26e2efd69effa3218c7ad3047432fb171e42168`.
- 2026-05-29: Ran `.loom/evidence/artifacts/20260529-llama-cpp-constrained-json-probe/run-constrained-json-probe.mjs` against loopback `llama-server` on port `18120`. Tiny probes showed enforcement for `chat-response-format-json-schema-openai`, `chat-top-level-json-schema`, `completion-json-schema`, and `completion-grammar`; `chat-response-format-json-schema-schema-only` and `chat-request-grammar` were accepted but not fully enforced/inconclusive.
- 2026-05-29: Ran generator-only narrative corpus probe through `chat-response-format-json-schema-openai`: 15/15 parse-valid, 15/15 schema-valid, 15/15 harness-verifier pass, 0 malformed/schema-invalid, 0 timeout, average latency 2705ms. Judge and semantic acceptance were intentionally not run.
- 2026-05-29: Wrote `evidence:20260529-llama-cpp-constrained-json-probe`. Server final status/listener check, privacy scan, and `git diff --check` artifacts are recorded. Moved ticket to review for audit before closure or successor adapter-ticket shaping.
- 2026-05-29: Ralph audit `audit:20260529-llama-cpp-constrained-json-probe-review` returned clear within bounded scope. Closed ticket with residual risks preserved: runtime/version specificity, synthetic 15-case corpus, no judge/semantic acceptance, and dirty pre-existing workspace state.
