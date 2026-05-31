# Flight Learn Constrained JSON Adapter

ID: ticket:20260529-flight-learn-constrained-json-adapter
Type: Ticket
Status: closed
Created: 2026-05-29
Updated: 2026-05-29
Risk: medium - this changes the privacy-sensitive opt-in local-model transport contract, but it is loopback-only, fail-closed, and does not change defaults or storage/routing behavior.
Priority: high - this is the first execution unit for `plan:20260529-flight-learn-comprehension-path` and gates all later model-enabled comprehension work.

## Summary

Implement request-level JSON-schema constrained output in the local `llama.cpp` adapter for explicitly enabled `/flight-learn` local diagnosis/narrative calls. The single closure claim is: when the operator already opts into local model phrasing, the adapter sends route-specific JSON-schema constrained chat-completion requests on the proven `/v1/chat/completions` route and still fails closed without changing product defaults, storage, routing, or source-of-truth behavior.

## Related Records

- `plan:20260529-flight-learn-comprehension-path` - parent plan and sequencing rationale.
- `spec:flight-learn-inbox-ux` REQ-024 through REQ-036 and SCN-008 through SCN-011 - local model must be explicit, local, bounded, display-only, and may be the richer comprehension path once enabled.
- `research:20260529-llama-cpp-constrained-json` - explains why prompt-only JSON is insufficient and why simple inline schemas should be used.
- `ticket:20260529-llama-cpp-constrained-json-probe` - closed proof that the installed runtime enforces OpenAI-style chat `response_format: json_schema`.
- `evidence:20260529-llama-cpp-constrained-json-probe` - generator-only route evidence and latency/profile.
- `audit:20260529-llama-cpp-constrained-json-probe-review` - clear audit of the route evidence and non-claims.
- `evidence:20260529-flight-learn-constrained-json-adapter` - implementation evidence for this ticket.
- `audit:20260529-flight-learn-constrained-json-adapter-review` - initial Ralph audit; concerns found and dispositioned.
- `audit:20260529-flight-learn-constrained-json-adapter-followup-review` - follow-up Ralph audit; clear for closure within bounded scope.
- `src/flight-learn-llama-cpp-adapter.ts` - primary source seam for this ticket.
- `src/flight-learn-local-diagnosis-model.ts` - generator response contract, judge response contract, verifier, and fail-closed behavior.
- `src/flight-learn-llama-cpp-adapter.test.ts` and related local diagnosis tests - likely focused test surface.

## Scope

In scope:

- Update the opt-in llama.cpp adapter so local diagnosis polish requests use `response_format: { type: "json_schema", json_schema: { name, strict: true, schema } }` instead of unconstrained `json_object`.
- Add a distinct inline JSON schema for the generator response contract: `schemaVersion: 2`, display-only keys, and `whatHappened.sentences[].text + factIds` with `additionalProperties: false` where practical.
- Add a distinct inline JSON schema for the local narrative judge response contract: `schemaVersion: 1`, `overallVerdict`, optional `failClosedReason`, and sentence verdict objects matching the existing judge validator.
- Keep schemas simple and inline; avoid `$ref`, `$defs`, recursion, or complex generated schemas.
- Keep existing loopback-only URL validation, direct loopback HTTP agent/proxy bypass, response byte/content limits, model label limits, timeouts, and fail-closed error behavior.
- Add focused tests that capture request bodies through a fake local HTTP server or equivalent and prove the schema route is used for generator and judge calls.
- Preserve existing explicit model opt-in. Do not add a second user-visible flag unless implementation discovers a compatibility need that cannot be handled safely inside the adapter.

Out of scope:

- Enabling model calls by default.
- Changing `/flight-learn` command visibility, defaults, UI flow, routing, storage, artifact candidate semantics, classifier behavior, or source-of-truth fields.
- Downloading, installing, upgrading, or authorizing any model/runtime.
- Calling hosted providers, non-loopback endpoints, telemetry, or provider-key endpoints.
- Weakening the deterministic verifier, local judge, privacy checks, or fallback behavior.
- Productizing any accepted narrative claim; this ticket only changes the adapter request contract.
- Adding retries, repair loops, prompt-only workaround paths, or fallback to unconstrained generation unless explicitly reshaped.

Stop conditions:

- Stop and route back to the plan if implementing schema constraints requires broad interface changes beyond the adapter/local diagnosis seam.
- Stop if source changes would make model output affect routing, storage, classifier behavior, artifact creation, source/docs/Loom/rule mutation, or default command behavior.
- Stop if compatibility pressure suggests silently falling back to unconstrained generation; that would reintroduce the failure mode this plan is trying to remove.

## Acceptance

- ACC-001: Generator requests use the proven constrained route.
  - Evidence: focused test captures the adapter POST body for `completeLocalDiagnosisPolish` and verifies OpenAI-style `response_format.type === "json_schema"`, `json_schema.strict === true`, an inline schema with no `$ref`/`$defs`, `schemaVersion: 2`, and the required `whatHappened.sentences[].text + factIds` shape.
  - Audit: challenge whether the test proves the actual product adapter body, not only a helper.

- ACC-002: Judge requests use a distinct constrained schema.
  - Evidence: focused test captures the adapter POST body for `completeLocalNarrativeJudge` and verifies a judge-specific schema with `schemaVersion: 1`, allowed verdict enums, sentence verdict fields, and no generator-schema mismatch.
  - Audit: challenge whether the judge schema can accidentally make a generator-shaped response acceptable or hide judge failures.

- ACC-003: Fail-closed and local-only behavior remain intact.
  - Evidence: focused tests cover non-loopback/invalid URLs, runtime HTTP errors, invalid transport, overlarge responses, and schema-route request failure flowing to existing adapter errors/fallback behavior; no hosted or proxy endpoint is reachable through config.
  - Audit: challenge privacy, loopback validation, proxy bypass, and fallback semantics.

- ACC-004: Product boundaries are unchanged.
  - Evidence: tests/source inspection show no new default model calls, no new top-level commands, no storage/routing/classifier changes, no model-output persistence as source-of-truth, and no artifact/rule/source/docs/Loom mutation path.
  - Audit: challenge hidden side effects in `/flight-learn` argument parsing or inbox integration.

- ACC-005: Implementation evidence is sufficient for a source change.
  - Evidence: focused adapter/local-diagnosis tests, typecheck, build, full test run as practical, `git diff --check`, and a concise evidence dossier/artifact set.
  - Audit: request Ralph review before closure because this is a trust-boundary adapter change.

## Current State

Closed. The bounded adapter slice is implemented, evidenced, audited, and follow-up reviewed. Source changes were limited to `src/flight-learn-llama-cpp-adapter.ts` and `src/flight-learn-llama-cpp-adapter.test.ts`. The adapter now sends distinct OpenAI-style `response_format: json_schema` request bodies for generator and judge calls while preserving loopback-only/fail-closed behavior and existing explicit opt-in. Evidence is recorded at `evidence:20260529-flight-learn-constrained-json-adapter`; artifacts show focused adapter tests, typecheck, build, full tests, diff-check, privacy scan, and audit follow-up focused tests passing. Initial audit concerns were dispositioned: the visible `MAX_MAX_OUTPUT_TOKENS` diff against repository `HEAD` is documented as residual/pre-existing dirty-workspace context outside this closure claim, and the fake generator fixture now includes schema-shaped duplicate deterministic `whatHappened` without implying accepted narrative behavior. Follow-up audit `audit:20260529-flight-learn-constrained-json-adapter-followup-review` returned clear for closure within bounded scope.

This closure does not prove real `llama-server` replay, accepted narrative wording, judge/latency behavior, operator comprehension, or release readiness. The next plan ticket is `ticket:20260529-flight-learn-constrained-judge-replay`.

## Journal

- 2026-05-29: Created by Loom Weaver as the first child ticket of `plan:20260529-flight-learn-comprehension-path` after the constrained JSON probe closed with clear audit.
- 2026-05-29: Driver set status to active for bounded Ralph execution. Preflight read the ticket and observed pre-existing dirty workspace state. Launching worker against the ticket with live-reference context; expected output is source/test changes plus evidence artifacts, leaving audit/closure for a later pass.
- 2026-05-29: Ralph implementation updated the llama.cpp adapter to use route-specific JSON-schema response formats for generator and judge calls, added focused request-body schema assertions, and preserved existing local-only/fail-closed tests. Evidence recorded at `evidence:20260529-flight-learn-constrained-json-adapter`: focused adapter tests passed, typecheck passed, build passed, full tests passed, diff-check passed, privacy scan passed. Moved ticket to review for audit; not closed.
- 2026-05-29: Ralph audit `audit:20260529-flight-learn-constrained-json-adapter-review` returned concerns. Driver dispositioned `FIND-002` by updating `validPolishJson()` to include schema-shaped `whatHappened.sentences[].text + factIds`, reran focused adapter tests and diff-check, and updated evidence. Driver dispositioned `FIND-001` by documenting the visible max-token clamp diff as a residual pre-existing dirty-workspace/request-budget issue outside this ticket's closure claim rather than changing the clamp in this scope. Follow-up audit remained required before closure.
- 2026-05-29: Follow-up Ralph audit `audit:20260529-flight-learn-constrained-json-adapter-followup-review` returned clear for closure. Closed ticket with residual risks preserved: real runtime replay, accepted narrative wording, judge/latency behavior, operator comprehension, release readiness, and broad workspace cleanliness remain unproven/out of scope.
