# Flight Learn Hard-Safety Bonsai Comprehension Path

ID: ticket:20260602-flight-learn-hard-safety-bonsai-comprehension
Type: Ticket
Status: closed
Created: 2026-06-02
Updated: 2026-06-02
Risk: medium - changes optional local-model display validation semantics and prompt/schema behavior while preserving hard privacy/safety gates
Priority: high - operator explicitly rejected the overbuilt validator/test harness and selected the Bonsai path

## Summary

Replace the current over-constrained local card-copy gate with a hard-safety-only display gate and return to the operator-preferred PrismML Bonsai GGUF path, especially Bonsai 1.7B Q1_0 as the first target. The closure claim is: optional local model text can render when it is parseable, length-bounded display copy and does not contain hard privacy/safety/action-advice failures; unsupported-fact/token/citation quality failures no longer erase otherwise readable model copy.

This ticket exists because the prior repaired replay proved the harness was measuring schema/validator/timeout brittleness, not comprehension. The operator's current decision is to stop broad model-gate testing and validate only hard safety/privacy/action-advice failures for display text.

## Related Records

- `spec:flight-learn-inbox-ux` - owns intended `/flight-learn` model-copy behavior and safety boundaries.
- `research:20260527-local-diagnosis-model-runtime` - selected PrismML Bonsai 1.7B GGUF Q1_0 through loopback `llama.cpp` as the first validation target.
- `evidence:20260527-prism-ml-small-model-comparison` - recorded Bonsai 1.7B as the better PrismML option under older strict validation, with zero hard safety failures.
- `plan:20260602-flight-learn-prompt-validator-contract-repair` - prior branch now superseded/redirected by this operator decision.
- `ticket:20260602-flight-learn-card-copy-repaired-local-replay` - negative evidence showing the overbuilt repaired 5s product path timed out every tested candidate.

## Scope

In scope:

- Update the local diagnosis prompt/schema/validator path in `src/flight-learn-local-diagnosis-model.ts` and `src/flight-learn-llama-cpp-adapter.ts` so displayed model copy is gated only by parseability, length/shape needed for rendering, and hard safety/privacy/action-advice checks.
- Keep deterministic fallback for disabled/unavailable/malformed/timeout/hard-unsafe output.
- Keep all model text display-only: no routing, storage, source, artifact, Loom, rule, skill, prompt, classifier, or evidence mutation authority.
- Prefer the cached/authorized PrismML Bonsai 1.7B Q1_0 path for any real local smoke; do not download or install anything.
- Update the spec/plan/ticket records enough that future agents do not resurrect the token-support product gate.

Out of scope:

- No broad model shopping, full replay matrix, hosted checks, comprehension corpus, or classifier collection.
- No automatic model/runtime download, install, or server lifecycle in product code.
- No default hosted provider or non-loopback endpoint.
- No attempt to prove global model quality.

## Acceptance

- ACC-001: Safe model-authored display fields are accepted even when they are paraphrases, lack fact IDs, cite optional fields imperfectly, or contain unsupported non-safety wording that the old support validator would have rejected.
- ACC-002: Hard privacy/safety/action-advice failures remain card-level fail-closed: raw local/session paths, secrets, prompt/transcript/stack traces/raw commands, route/action advice, artifact/rule/source/Loom/skill/prompt mutation instructions, classifier/ranking claims, or generated-evidence claims.
- ACC-003: The llama.cpp adapter requests a simpler JSON display schema suitable for Bonsai: optional string fields plus `schemaVersion`, not mandatory fact-cited nested fields.
- ACC-004: The prompt is shorter and asks for comprehension copy, not evidence proof or route decisions; default explicit local-model timeout is high enough for Bonsai 1.7B's previously observed latency envelope.
- ACC-005: Evidence is intentionally narrow: focused unit coverage for hard gates and safe paraphrase acceptance, plus at most a single cached Bonsai 1.7B local smoke if available. No broad replay matrix is required or desired for closure.
- ACC-006: The ticket, plan/spec, and final summary honestly state that this validates hard display safety and integration shape only, not operator comprehension or model quality.

## Current State

Closed. Implemented the operator decision: the optional local-model product gate no longer uses the overbuilt semantic/support validator as the card-level comprehension metric. It now renders parseable, bounded display copy unless displayed model text contains hard privacy/safety/action-advice failures. The prompt and llama.cpp schema were simplified to core comprehension strings, default local timeout is 5000 ms, default output budget is 256 tokens, and the legacy narrative judge no longer blocks card-copy rendering.

Evidence `evidence:20260602-flight-learn-hard-safety-bonsai-comprehension` records focused/full tests, typecheck, build, scoped diff check, privacy scan, listener cleanup, and one cached PrismML Bonsai 1.7B Q1_0 loopback smoke. The Bonsai smoke passed with `displayState: validated`, no fallback, no hosted provider, no model/runtime download/install, no raw prompt/model output/server log persistence, and a clean hard-safety display scan.

No broad model replay matrix was run. This closure validates the hard-safety integration path, not global model quality or operator comprehension.

## Journal

- 2026-06-02: Created and set active from operator directive after prior repaired replay closed negatively due to harness brittleness/timeouts rather than useful comprehension validation.
- 2026-06-02: Implemented hard-safety-only prompt/schema/validator simplification, updated focused and extension tests, and smoke-checked cached PrismML Bonsai 1.7B Q1_0 through loopback `llama.cpp` with no downloads/hosted calls.
- 2026-06-02: Evidence recorded in `evidence:20260602-flight-learn-hard-safety-bonsai-comprehension`; closed with narrow validation and explicit non-claims. Separate audit was not launched because the operator explicitly asked to stop the prior heavyweight testing/process loop; closure relies on source tests, build/typecheck, privacy scan, and the single Bonsai smoke.
