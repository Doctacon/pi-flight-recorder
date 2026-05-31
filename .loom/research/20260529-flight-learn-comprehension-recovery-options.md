# Flight Learn Comprehension Recovery Options

ID: research:20260529-flight-learn-comprehension-recovery-options
Type: Research
Status: completed
Created: 2026-05-29
Updated: 2026-05-29

## Summary

Investigated why schema-constrained local Bonsai 4B output did not produce accepted `/flight-learn` narratives, and what to do next. The key conclusion is: JSON schema/constrained decoding solved format control, not semantic explanation quality. The recovery path should stop treating local judge acceptance as the only way to make cards understandable. Instead, split the product into a safe, clearly labeled local LLM **draft comprehension layer** for human reading, plus a stricter **accepted narrative** path for text that can claim verifier/judge acceptance.

This research does not authorize implementation. It should feed a plan/spec reshape before new tickets are executed.

## Question

Given that `ticket:20260529-flight-learn-constrained-judge-replay` closed with 0/15 accepted narratives even though JSON-schema output worked earlier, what architecture should recover `/flight-learn` comprehension without weakening privacy, source-of-truth, routing, or human-gated boundaries?

## Scope

Covered:

- Current project evidence from constrained JSON and constrained judge replay.
- External research/source synthesis around structured outputs, schema-vs-semantic validation, llama.cpp JSON-schema behavior, local LLM judge reliability, and open-source/local validation patterns.
- Recovery options that preserve local-first/open-source constraints.

Excluded:

- Hosted model calls.
- Automatic downloads or installs.
- Choosing a new model without operator authorization.
- Product implementation details beyond plan-level options.
- Claims about operator comprehension without validation.

## Method And Sources

Project sources:

- `evidence:20260529-llama-cpp-constrained-json-probe` - generator-only constrained JSON baseline: 15/15 parse/schema/verifier pass, no judge.
- `evidence:20260529-flight-learn-constrained-json-adapter` - product adapter now uses OpenAI-style `response_format.type=json_schema`.
- `evidence:20260529-flight-learn-constrained-judge-replay` - product adapter + judge replay: 13/15 parse/schema, 8/15 verifier, 0/3 judge, 0/15 accepted narratives.
- `plan:20260529-flight-learn-comprehension-path` - currently blocked before model-enabled inbox integration.

External web research, 2026-05-29, using generic non-private queries:

- llama.cpp server README: documents OpenAI-compatible chat completions and schema-constrained JSON response format. URL: https://github.com/ggml-org/llama.cpp/blob/f0d3c7405c323784a60f14ddddfbac3f7404d417/tools/server/README.md
- llama.cpp issue #21228: `$ref`/`$defs` can silently fall back or fail in JSON-schema grammar paths. URL: https://github.com/ggml-org/llama.cpp/issues/21228
- llama.cpp PR #21537: some chat template handlers ignored `response_format.json_schema`. URL: https://github.com/ggml-org/llama.cpp/pull/21537
- llama.cpp issue #20345: grammar enforcement can fail with thinking-mode behavior. URL: https://github.com/ggml-org/llama.cpp/issues/20345
- General structured-output analysis: schema/JSON guarantees syntax/shape, not semantic correctness. URLs: https://tianpan.co/blog/2026-04-15-semantic-validation-llm-outputs and https://tianpan.co/blog/2026-04-18-structured-output-json-mode-failure-modes
- LLM-as-judge reliability research: judge consistency is a known failure mode; context and task framing matter. URLs: https://arxiv.org/html/2509.21117v1 and https://aclanthology.org/2025.acl-long.470.pdf
- Open-source/local validation examples: local/structured guard libraries and NLI/factuality approaches exist, but many solve shape/repair or require separate model/runtime evaluation. Example URLs: https://github.com/ndcorder/outputguard, https://github.com/ashwinpaulallen/llm-schema-validator, https://github.com/IBM/FactReasoner

Source quality note: llama.cpp sources are primary for runtime behavior. Blog sources are secondary but align with project evidence. Judge reliability papers are research context, not direct product proof. Open-source libraries are examples, not adopted dependencies.

## Findings

1. Schema-constrained JSON worked for format, not meaning.
   - Project evidence: generator-only route achieved 15/15 structured/verifier results, but product replay with judge achieved 0/15 accepted narratives.
   - External sources consistently distinguish syntactic/schema guarantees from semantic correctness.

2. The strict judge gate is probably the wrong bottleneck for the user's actual pain.
   - The operator's problem is comprehension: “I do not understand the errors at all without an LLM.”
   - Requiring model wording to pass a local judge before any rich explanation appears makes the UI deterministic-only in exactly the cases where the operator needs help.
   - This does not mean model text should become truth or routing authority; it means display policy and acceptance policy should be separated.

3. Current Bonsai 4B Q1_0 is likely too weak or too constrained for the current all-or-nothing accepted narrative path.
   - It often duplicated deterministic text, included unsupported/unsafe display content, timed out, or produced judge-rejected candidates.
   - The low quantization and 5s timeouts likely contribute, but increasing timeouts alone would not solve semantic usefulness.

4. Local LLM judges are not a reliable single source of acceptance.
   - External judge-reliability research reports inconsistency and context sensitivity in LLM-as-judge systems.
   - For this product, the human operator is the eventual judge of comprehension. A local judge can veto obvious risk, but should not be the sole gateway for making a card readable.

5. The current product has two different needs that were collapsed into one gate.
   - Need A: help the operator understand what happened right now.
   - Need B: produce a fact-grounded narrative that the system can label “accepted.”
   - Need A can tolerate an explicitly labeled, non-authoritative draft if hard privacy/safety gates pass and deterministic facts are visible.
   - Need B should keep stricter verifier/judge acceptance.

## Tradeoffs

### Option A: Keep current all-or-nothing accepted narrative gate

Strengths:

- Maximum conservatism.
- No unaccepted model text shown.
- Simple trust story.

Weaknesses:

- Fails the operator's stated need; 0/15 accepted means the card stays hard to understand.
- Makes a weak local judge/model combination a product blocker.

Decision pressure: not recommended as the next product path.

### Option B: Split display into “LLM draft” and “accepted narrative” tiers

Strengths:

- Addresses operator comprehension immediately while keeping model text non-authoritative.
- Preserves strict accepted narrative contract for any stronger claims.
- Lets human feedback validate usefulness before classifier/corpus collection.
- Compatible with local-first/open-source constraints using the existing Bonsai runtime.

Risks:

- Draft text can still be misleading unless hard safety gates, visible citations, uncertainty language, and deterministic facts remain prominent.
- Requires spec/plan update because the old plan assumed judge acceptance before model-enabled UI integration.

Decision pressure: recommended.

### Option C: Tune Bonsai prompt/schema/judge until accepted narratives pass

Strengths:

- Preserves original gate model.
- May improve accepted count without new downloads.

Weaknesses:

- Already consumed several tickets with zero accepted narratives.
- Risks chasing judge quirks instead of solving comprehension.
- Still may not work with Bonsai 4B Q1_0.

Decision pressure: useful as a small bounded experiment only after display-policy split, not as the main path.

### Option D: Authorize a stronger local/open-source model or separate local NLI/factuality verifier

Strengths:

- Could improve semantic quality and/or judging.
- Keeps local/open-source posture if explicitly authorized.

Weaknesses:

- Requires new authorization/download/evaluation.
- May increase latency and resource demands.
- Still does not remove need for human comprehension validation.

Decision pressure: viable optional successor, not the default next move without operator authorization.

## Rejected Paths And Null Results

- Treating JSON schema success as product success: rejected by current replay evidence and external structured-output guidance.
- Proceeding to model-enabled inbox integration as originally written: rejected by 0/15 accepted narratives and the parent plan's own stop condition.
- Weakening privacy/source-of-truth/routing gates: rejected by product constraints.
- Using hosted providers: rejected by local-first/privacy constraints unless explicitly authorized later.
- Downloading new models automatically: rejected; requires fresh operator authorization.

## Conclusions

The failure is not “JSON schema did not work.” The failure is “schema-constrained Bonsai 4B plus current verifier/judge did not produce accepted semantic narratives.” The product should not give up on LLM-assisted comprehension, because the operator explicitly needs it. But the next design should stop requiring the local judge to approve every rich display sentence before the operator can read anything useful.

The safest recovery is a two-tier comprehension contract:

1. **Local LLM draft explanation**: display-only, clearly labeled, bounded/redacted, hard privacy/safety filtered, never persisted as truth, never used for routing, shown alongside deterministic facts and citations.
2. **Accepted narrative**: stricter verifier/judge-approved text, used only when it passes the existing accepted narrative contract.

This keeps deterministic facts as source-of-truth while making `/flight-learn` understandable enough for the human to route artifacts.

## Recommendations

1. Update `spec:flight-learn-inbox-ux` and `plan:20260529-flight-learn-comprehension-path` to distinguish “LLM draft comprehension” from “accepted narrative.”
2. Create a new ticket before UI integration: `flight-learn-local-draft-comprehension-gate`.
   - Goal: render an explicitly labeled local LLM draft only if hard syntactic/privacy/safety gates pass.
   - Keep deterministic facts/citations visible.
   - Do not require local judge acceptance for draft display.
   - Do not persist model text or alter routing/storage.
3. Keep the accepted narrative path as a stricter optional upgrade, not the blocker for basic comprehension.
4. Add comprehension validation against rendered cards before any corpus/outcome collection.
5. If Bonsai draft quality is still unusable, ask the operator for fresh authorization to evaluate a stronger local/open-source model or a local NLI/factuality verifier.

## Open Questions

- Should unaccepted local draft text be shown by default when the operator passes `--local-model-polish`, or require a more explicit flag such as `--local-model-draft`?
- What exact hard gates should block draft display? Recommended minimum: parse/schema, length, no raw paths/session paths/secrets/stack traces/prompts, no route/action advice, no mutation instructions, no unsupported artifact/source/rule claims.
- How should the UI make uncertainty visible without overwhelming the operator?
- Should the local judge be retained only as an advisory warning for draft display, or run only for accepted-narrative promotion?

## Related Records

- `plan:20260529-flight-learn-comprehension-path`
- `evidence:20260529-flight-learn-constrained-judge-replay`
- `ticket:20260529-flight-learn-constrained-judge-replay`
- `spec:flight-learn-inbox-ux`
