# Llama.cpp Constrained JSON For Flight Learn Narrative

ID: research:20260529-llama-cpp-constrained-json
Type: Research
Status: completed
Created: 2026-05-29
Updated: 2026-05-29

## Summary

The Bonsai 4B narrative failures look like a standard local-LLM structured-output problem: prompt-only JSON requests produced almost-valid JSON, wrong top-level fields, multiple JSON objects, and schema drift. `llama.cpp` has grammar / JSON-schema constrained decoding features that may make this fixable, but there are upstream caveats: some chat-template paths can ignore `response_format`, `$ref`/`$defs` schemas can silently fall back or explode grammar size, and some reasoning/thinking modes can break grammar enforcement.

Current project adapter evidence matters: `src/flight-learn-llama-cpp-adapter.ts` sends only `response_format: { type: "json_object" }` to `/v1/chat/completions`, which asks for JSON-ish output but does not enforce the project’s nested schema. The next honest step is an evidence-only local probe that proves whether constrained decoding is active for the existing `llama-server`/Bonsai 4B path before any product adapter change is proposed.

## Question

Can the existing local `llama.cpp` + Bonsai 4B path be made to reliably produce schema-valid narrative JSON through constrained decoding, or is the current runtime/API/template path ignoring or failing schema constraints?

## Scope

Covered:

- External `llama.cpp` documentation/issues about grammar and JSON-schema constrained decoding.
- Current project adapter shape for local Bonsai calls.
- The next evidence-only probe needed before productization.

Excluded:

- Implementing adapter support.
- Starting or modifying model runtimes.
- Downloading new models or upgrading `llama.cpp`.
- Weakening fact-ID verifier, judge, privacy, or fail-closed behavior.
- Proving narrative quality or real-user usefulness.

## Method And Sources

Sources inspected:

- `llama.cpp` server README, including documented `--grammar`, `--grammar-file`, `--json-schema`, `--json-schema-file`, request-level `grammar`, and `json_schema` support for grammar-based sampling: https://github.com/ggml-org/llama.cpp/blob/550d684bd13132d4af744cee64c1a3acb0ceaf09/tools/server/README.md
- `llama.cpp` grammar documentation describing GBNF and JSON-schema-to-grammar support: https://github.com/ggml-org/llama.cpp/blob/master/grammars/README.md
- `llama.cpp` PR #21537 noting `response_format: json_schema` may be silently ignored by some chat templates unless passed through to the grammar path: https://github.com/ggml-org/llama.cpp/pull/21537
- `llama.cpp` issue #21228 noting `$ref`/`$defs` JSON schemas can silently fail/fall back because grammar rule counts exceed thresholds: https://github.com/ggml-org/llama.cpp/issues/21228
- `llama.cpp` issue #20345 noting grammar enforcement can be inactive when thinking is enabled for some models: https://github.com/ggml-org/llama.cpp/issues/20345
- `llama.cpp` unit-test snippets showing chat completion tests for `response_format`, top-level `json_schema`, and `grammar`: https://github.com/ggml-org/llama.cpp/blob/f486ce9f/tools/server/tests/unit/test_chat_completion.py
- Project source inspection: `src/flight-learn-llama-cpp-adapter.ts` currently posts to `/v1/chat/completions` with `response_format: { type: "json_object" }` and no project schema/grammar.
- Project evidence: `evidence:20260529-bonsai-4b-schema-prompt-tuning` showed prompt/schema tuning improved structure but accepted narratives stayed `0/15`.

Source quality note: `llama.cpp` is actively changing; exact API behavior must be verified against the installed local runtime version before relying on documentation or upstream issue conclusions.

## Findings

### 1. The current project path requests JSON but not the actual schema

`src/flight-learn-llama-cpp-adapter.ts` sends:

```ts
response_format: { type: "json_object" }
```

That can encourage JSON object output, but it does not constrain the response to:

```json
{
  "schemaVersion": 2,
  "whatHappened": {
    "sentences": [
      { "text": "...", "factIds": ["F1"] }
    ]
  }
}
```

This explains the observed failure shape: the model produced JSON-like content, but with wrong top-level `sentences`, multiple objects, arrays where objects were required, or extra sections.

### 2. `llama.cpp` has runtime-level mechanisms that should be tested

The server docs describe grammar-constrained sampling via:

- server startup flags: `--grammar`, `--grammar-file`, `--json-schema`, `--json-schema-file`;
- request fields: `grammar`, `json_schema`;
- OpenAI-compatible chat `response_format` variants.

If active, constrained decoding should prevent invalid-token paths instead of relying on prompt obedience. That directly targets malformed JSON and schema drift.

### 3. The chat `response_format` path may be the wrong first trust target

Upstream issues and PRs show `response_format: json_schema` can be ignored or behave differently depending on server version and chat templates. That means the probe must first prove constraints are active with a tiny impossible/const schema before using narrative prompts.

A good probe should not assume “request accepted” means “grammar active.” It should use a prompt that would naturally answer in prose while a schema forces an exact output, then inspect whether the output actually satisfies the constraint.

### 4. Keep the schema simple and inline

The narrative schema should avoid `$ref`, `$defs`, recursive types, and deeply nested abstractions. Upstream issue #21228 reports `$ref`/`$defs` can silently fail or create grammar-size issues. For our use case, an inline shallow schema is enough for a probe.

### 5. Constrained decoding solves only format, not semantic safety

Even perfect schema validity does not prove the narrative is grounded, non-actionable, or useful. The fact-ID verifier and local judge still matter. The likely next bottleneck after constrained JSON is judge latency/behavior, already visible in prompt tuning.

## Tradeoffs

### Option A: Request-level JSON schema on `/v1/chat/completions`

Strengths:

- Closest to the existing adapter path.
- If it works, product integration could be relatively small later.

Risks:

- Upstream issues show chat-template-specific failures and OpenAI compatibility drift.
- Need to prove it is actually enforced, not merely accepted.

### Option B: Request-level `grammar` or `json_schema` on `/completion`

Strengths:

- Docs/tests show grammar/json_schema support at completion level.
- May avoid chat-template `response_format` issues.

Risks:

- Would be a different adapter path than current chat completions.
- May require prompt formatting changes and separate product integration if positive.

### Option C: Prompt retry / repair loop

Strengths:

- No runtime/API dependency.
- Could improve malformed JSON without changing transport.

Risks:

- More latency, more model calls, and still not a guarantee.
- Does not address the root structured-output reliability problem as cleanly as constrained decoding.

Recommended first probe: test both Option A and Option B as evidence-only runtime/API probes. Do not choose a product path until one proves constraints are active on this installed runtime.

## Rejected Paths And Null Results

- **Prompt harder again** - rejected as the primary next move. Prompt tuning already improved structure but did not produce accepted narratives; constrained decoding targets the remaining format issue more directly.
- **Productize the tuned prompt** - rejected. Accepted narratives remain `0/15`.
- **Use complex Pydantic-style `$defs` schemas** - rejected for this probe because upstream reports silent failures with `$ref`/`$defs`.
- **Treat constrained JSON as semantic validation** - rejected. It can enforce shape, not grounding or usefulness.
- **Upgrade/build/download `llama.cpp` first** - rejected for the next ticket. The first question is what the existing installed runtime can do; upgrades require separate authorization.

## Conclusions

1. The observed Bonsai failures are consistent with prompt-only structured-output failure, not a definitive model capability failure.
2. The current adapter likely underuses `llama.cpp` because it asks for a JSON object but not a schema/grammar matching the project contract.
3. `llama.cpp` constrained decoding is a plausible fix for malformed/schema-invalid generator output, but must be proven locally because upstream behavior depends on server version, route, and chat template.
4. A useful next ticket should be evidence-only: prove constraint enforcement on tiny schemas, then run a generator-only constrained narrative pass. It should not change product code or claim end-to-end narrative success.

## Recommendations

Create one bounded ticket: `ticket:20260529-llama-cpp-constrained-json-probe`.

The ticket should:

- use only the existing Bonsai 4B GGUF and installed local `llama-server`;
- start loopback-only runtime if available;
- prove or falsify constraint enforcement with trivial const/required-field schemas;
- compare chat `response_format`, top-level `json_schema`/`grammar`, and `/completion` routes if supported;
- avoid `$ref`/`$defs`;
- run generator-only narrative schema tests before involving judge;
- preserve strict verifier/judge/privacy gates as product invariants;
- recommend either adapter integration, judge/latency isolation, runtime/API upgrade research, or abandonment of this path based on evidence.

Do not create a product adapter ticket until the constrained-decoding probe proves a working route on the installed runtime.

## Open Questions

- Does the installed `llama-server` version `9360` enforce request-level `json_schema` or `grammar` on `/v1/chat/completions` with the Bonsai `--jinja` setup?
- If chat completions ignore constraints, does `/completion` enforce the same schema or grammar reliably?
- Can constrained generation produce the project’s nested narrative schema within the current timeout/token budget?
- After generator constraints work, is the local self-judge timeout still the dominant blocker?

## Related Records

- `evidence:20260529-bonsai-4b-schema-prompt-tuning` - prompt tuning evidence that motivates constrained decoding.
- `audit:20260529-bonsai-4b-schema-prompt-tuning-review` - bounded audit of tuning result.
- `research:20260529-flight-recorder-core-loop-stocktake` - says grammar-constrained JSON is an optional narrow model-work successor, not the core product path.
- `spec:flight-learn-inbox-ux` - owns optional local-model narrative requirements and safety boundaries.
- `src/flight-learn-llama-cpp-adapter.ts` - current adapter shape inspected for this research.
