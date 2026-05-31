# Research: local narrative judge validation

ID: research-artifact:20260528-local-narrative-judge-validation-researcher-output  
Related ticket: ticket:20260528-local-narrative-judge-validation-research  
Created: 2026-05-28

## Summary

Recommendation: replace the failed regex-semantic validator with a **hybrid contract**: require the generator to produce sentence-level fact IDs, verify those IDs and hard safety constraints deterministically, then use an optional local judge only as a veto/uncertainty signal for semantic support, actionability, and usefulness. Do not use a standalone local LLM judge, standalone NLI model, or citation-only generation as the acceptance gate; each leaves important gaps for `/flight-learn`'s privacy-sensitive display-only narrative.

No runtime/model quality is proven by this research. The next implementation slice should use fake providers and deterministic tests first; any real Bonsai/Prometheus/NLI validation needs explicit model/runtime authorization and must keep deterministic fallback as the default.

## Method and project constraints inspected

Read project records/source named by the ticket: the blocked parent plan, blocked regex-validator ticket, current research record, UX spec REQ-024..REQ-032 and SCN-008..SCN-010, fake-provider evidence, sixth follow-up audit, narrative corpus, `src/flight-learn-local-diagnosis-model.ts`, `src/flight-learn-llama-cpp-adapter.ts`, and `package.json`.

External searches used only generic terms about local LLM judges, NLI/factuality, constrained generation, and citation/attribution. No raw Pi session content, private paths, commands, prompts, stack traces, secrets, or user-specific data were used in searches. No downloads, installs, hosted model calls with project data, or local runtimes were started.

## Findings

1. **The current failure is architectural, not a missing-regex problem.** The sixth follow-up audit still found accepted action-advice and mixed-case meta-label bypasses after five regex expansion rounds, and the ticket is now blocked because regex/token allow-lists are not a scalable validator for open-ended narrative semantics. Local project source also shows the validator relying on lexical support sets, hard forbidden regexes, and narrative connective token allow-lists in `src/flight-learn-local-diagnosis-model.ts`, which explains why every audit can create a new near-miss phrasing. [Local audit](../../../evidence/artifacts/20260528-flight-learn-narrative-local-model-contract/ralph-sixth-followup-audit-output.md)

2. **Local LLM-as-judge is feasible but unsafe as the only gate.** LLM-as-judge can approximate human preference in some open-ended evaluation settings; MT-Bench/Chatbot Arena reports GPT-4 judge agreement over 80% with human preference, but the same paper names position, verbosity, self-enhancement, and reasoning-limit biases. Later work confirms position bias varies by judge, task, and solution-quality gap. That evidence supports using an LLM judge as a useful semantic reviewer, not as a deterministic proof. [MT-Bench paper](https://arxiv.org/abs/2306.05685), [position-bias study](https://aclanthology.org/2025.ijcnlp-long.18/)

3. **Open evaluator LLMs exist, but they do not remove product-specific validation work.** Prometheus 2 is an open evaluator model intended for rubric-based direct assessment and pairwise ranking; its repo/model card report 7B and 8x7B variants, local vLLM support, Apache-2.0 model packaging, and custom rubrics. But the 7B model still needs substantial local resources, the model card notes generated-data terms, and none of the published metrics prove `/flight-learn` narrative grounding or action-advice rejection. Treat Prometheus-like models as future authorized judge candidates, not an immediate required dependency. [Prometheus-Eval](https://github.com/prometheus-eval/prometheus-eval), [Prometheus 2 model card](https://huggingface.co/prometheus-eval/prometheus-7b-v2.0-GGUF/raw/main/README.md), [Prometheus 2 paper](https://arxiv.org/abs/2405.01535)

4. **The existing loopback adapter is a good local-runtime seam.** `src/flight-learn-llama-cpp-adapter.ts` already rejects non-loopback URLs, avoids API-key/provider shape, bounds prompt/response sizes, and calls `/v1/chat/completions` with JSON output. Current llama.cpp server docs support OpenAI-compatible chat completions and `response_format` for plain JSON or schema-constrained JSON, plus grammar/JSON-schema constrained generation. A future ticket can extend the adapter or add a sibling judge adapter without introducing hosted calls, but must not enable llama.cpp built-in tools or automatic model downloads. [llama.cpp server docs](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md)

5. **Local NLI/entailment is aligned with sentence-level grounding, but it is not enough for the full `/flight-learn` contract.** TRUE standardized factual-consistency evaluation and recommends large-scale NLI and question-generation/answering metrics as starting points; SummaC revisits NLI for summary consistency and exposes CPU/GPU Python models; DeBERTa-v3-base-mnli-fever-anli is trained on MNLI, FEVER-NLI, and ANLI and exposes premise/hypothesis scoring. These are useful for “is sentence supported by facts?” but do not directly decide “is this route/action advice?”, “is this useful rather than generic?”, or “does this violate display-only language?” [TRUE](https://aclanthology.org/2022.naacl-main.287/), [SummaC README](https://github.com/tingofurro/summac/blob/master/README.md), [DeBERTa NLI model card](https://huggingface.co/MoritzLaurer/DeBERTa-v3-base-mnli-fever-anli)

6. **Node-local NLI is technically possible but adds a new runtime/dependency family.** Transformers.js supports text classification and zero-shot classification in browser/Node-style JavaScript via ONNX Runtime, and ONNX Runtime Node supports local model inference with CPU prebuilt binaries across macOS/Linux/Windows. However, product `package.json` currently has no ML runtime dependency beyond tests/build tooling, and Transformers.js downloads/caches models by default unless pointed at local assets. This should be a separate authorized prototype if pursued. [Transformers.js docs](https://huggingface.co/docs/transformers.js/en/index), [ONNX Runtime Node README](https://github.com/microsoft/onnxruntime/blob/master/js/node/README.md)

7. **Citation/fact-ID constrained generation gives the strongest deterministic handle.** Citation-generation research exists because generated answers hallucinate and citations improve verifiability; ALCE still found that even the best models lacked complete citation support 50% of the time on ELI5, so citations alone are not a guarantee. “Attribute First, then Generate” is closer to this product need: it first selects concise source spans, plans sentence-level attribution, then generates sentence-by-sentence with those attributions, reducing human fact-checking effort by over 50% while preserving fine-grained support. For `/flight-learn`, fact IDs can point to bounded redacted local facts rather than documents. [ALCE](https://aclanthology.org/2023.emnlp-main.398/), [Attribute First, then Generate](https://arxiv.org/html/2403.17104)

8. **Atomic-fact thinking helps define the judge contract.** FActScore argues binary factuality is inadequate because long-form generations can mix supported and unsupported pieces; it decomposes generations into atomic facts and scores the percentage supported by reliable sources. `/flight-learn` does not need a full FActScore clone, but it should avoid whole-paragraph “looks grounded” acceptance and instead judge each narrative sentence/fact against cited fact IDs. [FActScore](https://aclanthology.org/2023.emnlp-main.741/)

9. **The project already has the right fallback posture.** REQ-024..REQ-032 require optional, local/open-source, bounded, structured, display-only local-model polish; invalid/unsafe/unsupported/slow/unavailable output must fall back to deterministic wording and must not affect routing, storage, classifier behavior, artifacts, source, Loom, rules, skills, or prompts. The replacement validator must preserve that: the judge can only veto display text; it cannot create facts or source-of-truth state. [Spec](../../../specs/flight-learn-inbox-ux.md)

## Option comparison

| Approach | Strengths | Weaknesses / failure mode | Privacy | Latency/runtime | Determinism/auditability | Fit |
| --- | --- | --- | --- | --- | --- | --- |
| 1. Local LLM-as-judge | Best at holistic language judgments: grounding, actionability, usefulness, sentence quality. Can reuse llama.cpp loopback seam. Rubric can mirror narrative corpus. | Biased/inconsistent; vulnerable to self-approval if same model generated text; can over-trust fluent prose; needs its own eval. Published judge quality is not product-specific. | Good if only bounded fact packet and candidate text are sent to loopback. | Adds another model call; Prometheus-like judges may need 7B+ resources. Same Bonsai as judge is cheaper but riskier. | Low-to-medium. Structured judge output helps, but verdict is probabilistic. | Useful as veto layer, not sole gate. |
| 2. Local NLI/entailment | Sentence-level support check is directly aligned with “is this claim entailed by facts?” More stable than free-form judge. | Does not cover action advice, display-only boundary, narrative usefulness, or domain-specific CLI/session concepts without calibration. Adds ONNX/Python/model asset path. | Good if premise is fact text only. | Potentially faster than LLM judge once loaded; new dependency/runtime. | Medium. Scores are inspectable but thresholds need calibration. | Good future sidecar; not MVP gate. |
| 3. Citation/fact-ID constrained generation | Deterministically verifies every sentence names allowed support; unknown facts/citations can be rejected before semantic judging. Fits existing bounded fact packet. | A sentence can cite a real fact ID while adding unsupported connective claims. Fact IDs do not by themselves detect action advice or low-information generic prose. | Strongest: facts are bounded/redacted and IDs are local. | Low overhead; can use existing generator call and deterministic parser. | High for schema/IDs; medium for semantics. | Mandatory foundation. |
| 4. Hybrid generator + fact IDs + deterministic verification + local judge | Combines proof-by-construction handles with semantic veto. Fails closed at multiple layers. Gives audit artifacts sentence-by-sentence. | More complex; two-stage validation; real judge quality still needs evidence. | Strong if no raw sessions and no non-loopback endpoints. | Highest latency if judge runs; fallback remains deterministic. | Highest: deterministic checks plus structured judge reasons. | Recommended. |

## Recommendation

Pursue **Approach 4: hybrid generator + fact IDs + deterministic verification + local judge**.

Minimum acceptable architecture:

1. Build a redacted fact packet where every fact has a stable local ID.
2. Ask the generator to return structured narrative sentences, each with cited fact IDs.
3. Deterministically reject malformed JSON, extra keys, too many/too-long sentences, missing/unknown fact IDs, empty support, low-information cases, duplicate deterministic wording, raw paths, secret-looking output, raw commands, redaction-placeholder echo, route/action/mutation/classifier language, and any output that would change routing/storage/source-of-truth state.
4. Only after deterministic checks pass, send the bounded fact packet plus candidate sentences to a local judge provider.
5. Accept only if the judge returns structured `accept` with every sentence supported and no unsafe/actionable/unsupported verdicts. Treat parse errors, uncertainty, disagreement, timeout, provider failure, or low-confidence/ambiguous verdicts as deterministic fallback.
6. Keep the judge as a **veto**, not a source of truth. The judge cannot add facts, rewrite facts, choose routes, or decide stored state.

Model/runtime recommendation:

- **Implementation MVP:** no real judge required. Add provider interfaces and fake-provider tests/harness artifacts first.
- **First real local judge smoke:** use the existing loopback `llama.cpp` seam with an explicitly configured local model only after operator authorization. Prefer a different judge model than the generator to reduce self-approval risk. Prometheus 2 7B GGUF is a plausible future evaluator candidate, but requires license/terms review and hardware evidence before adoption.
- **If only Bonsai 4B is available:** it can be tested as an experimental judge, but same-model generator+judge results must be labeled self-approval risk and must not support strong safety/release claims.
- **NLI:** keep as a future optional sidecar or comparison ticket. It may be valuable for sentence support scoring, but do not block the MVP on adding ONNX/Python/Transformers runtime.

## Proposed fact packet and generation schema

### Generator input packet

```ts
interface NarrativeFactPacketV2 {
  schemaVersion: 2;
  deterministic: {
    headline: string;
    whatHappened: string;
    whyItMatters: string;
    expectedBehavior: string | null;
    confidence: "low" | "medium" | "high";
  };
  facts: Array<{
    id: `F${number}`;
    kind:
      | "deterministic-headline"
      | "deterministic-what-happened"
      | "deterministic-why-it-matters"
      | "expected-behavior"
      | "delta-summary"
      | "delta-expectation"
      | "delta-reality"
      | "delta-impact"
      | "occurrence-count"
      | "signal"
      | "evidence-summary";
    text: string;              // already redacted, bounded, no raw paths/secrets/transcripts
    confidence?: number | null;
  }>;
  bounds: {
    maxNarrativeSentences: 4;
    maxNarrativeChars: 520;
    maxFacts: number;
    maxFactChars: number;
  };
}
```

### Generator output schema

```ts
interface NarrativeCandidateV2 {
  schemaVersion: 2;
  headline?: string;
  whatHappened?: {
    sentences: Array<{
      text: string;
      factIds: string[];        // non-empty; each ID must exist in packet.facts
      role?: "sequence" | "recurrence" | "uncertainty" | "impact-link";
    }>;
  };
  whyItMatters?: string;
  expectedBehavior?: string | null;
}
```

Deterministic verifier rules:

- reject unknown/duplicate/excessive fact IDs;
- reject a narrative sentence with no fact IDs;
- reject output with unsupported fields or malformed shape;
- reject if combined `sentences[].text` exceeds existing bounds or sentence count;
- run existing hard privacy/safety guards, but treat them as hard literal/syntax guards only, not semantic proof;
- reject low-information packets unless the candidate merely preserves uncertainty and the judge agrees;
- reject if candidate tries to cite internal field names, fact packet structure, route/ranking/classifier/mutation instructions, or raw evidence identifiers;
- fail closed if the local runtime cannot use schema-constrained output; parser rejection is sufficient.

## Proposed local judge contract/schema

### Judge input

```ts
interface NarrativeJudgeRequestV1 {
  schemaVersion: 1;
  policy: {
    field: "whatHappened";
    displayOnly: true;
    maxSentences: 4;
    rejectOnUncertainty: true;
  };
  deterministic: NarrativeFactPacketV2["deterministic"];
  facts: NarrativeFactPacketV2["facts"];
  candidate: {
    sentences: Array<{
      index: number;
      text: string;
      factIds: string[];
      citedFacts: Array<{ id: string; text: string }>;
    }>;
  };
  rubric: {
    acceptOnlyIf: [
      "every concrete claim is supported by cited facts or cautious connective tissue over cited facts",
      "sentence is retrospective description, not operator action advice",
      "no raw commands, paths, secrets, stack traces, transcripts, prompts, route advice, mutation instructions, classifier/ranking claims, or unsupported concrete facts",
      "narrative is more useful than repeating the headline when facts support more detail"
    ];
  };
}
```

### Judge output

```ts
interface NarrativeJudgeResponseV1 {
  schemaVersion: 1;
  overallVerdict: "accept" | "reject" | "uncertain";
  failClosedReason?:
    | "unsupported-facts"
    | "unsafe-output"
    | "action-advice"
    | "low-information"
    | "not-useful"
    | "schema-invalid"
    | "judge-uncertain";
  sentences: Array<{
    index: number;
    verdict:
      | "supported"
      | "supported-cautious-connection"
      | "partially-supported"
      | "unsupported"
      | "unsafe"
      | "action-advice"
      | "not-useful"
      | "uncertain";
    supportedFactIds: string[];
    unsupportedClaims: string[];  // short phrases only; no hidden chain-of-thought
    reason: string;               // concise audit reason
    confidence: "low" | "medium" | "high";
  }>;
}
```

Acceptance rule:

```text
accept iff
  deterministic verifier passed AND
  overallVerdict == "accept" AND
  every sentence verdict is "supported" or "supported-cautious-connection" AND
  no sentence confidence == "low" AND
  failClosedReason is absent.
Otherwise fallback to deterministic text.
```

Do not expose judge confidence as product confidence. It is only a fallback diagnostic.

## Rejected paths

- **Continue expanding regex/token semantic validation.** Rejected by repeated audit bypasses and operator direction. Keep regex only for hard raw-detail, schema, and obvious unsafe-literal filters.
- **LLM judge only.** Rejected because judge bias, self-approval risk, and prompt-following failures are documented; it also lacks deterministic proof that cited facts are known/local.
- **Same Bonsai model as generator and sole judge.** Rejected for acceptance because it can approve its own phrasing. Allowed only as experimental evidence with explicit self-approval caveat.
- **NLI-only gate.** Rejected for MVP because entailment does not cover route/action advice, mutation language, narrative usefulness, or UI display-only semantics; runtime path also needs new authorized dependencies/model assets.
- **Citation/fact-ID only gate.** Rejected because valid fact IDs can accompany unsupported bridges, causal overreach, or action advice. Use fact IDs as mandatory deterministic structure, not complete semantics.
- **Hosted/proprietary judge/model APIs.** Rejected by REQ-025 and project open-source/local-first policy.
- **Automatic model/runtime download.** Rejected by REQ-025 and ticket stop conditions.

## Downstream ticket shape

### Ticket 1: Narrative fact-ID contract and deterministic verifier

- **Goal:** Supersede the blocked regex-semantic contract with fact-ID generation and deterministic verification.
- **Likely source boundaries:** `src/flight-learn-local-diagnosis-model.ts`, colocated tests, sanitized harness artifacts under `.loom/evidence/artifacts/...`.
- **No-goals:** no UI integration, no real model/runtime, no adapter changes unless schema field shape requires a type-only provider interface, no downloads.
- **Acceptance/evidence:** fake-provider tests for accepted grounded fact-ID narrative, unknown fact ID, missing citations, unsupported connective claim probe, route/action advice, mutation/classifier language, raw path/secret/raw command, low-information packet, malformed JSON, timeout/provider error; narrative corpus harness updated with fact-ID probes; `npm test -- src/flight-learn-local-diagnosis-model.test.ts`, corpus harness, `npm run typecheck`, `git diff --check`.
- **Audit focus:** challenge whether deterministic verifier is still smuggling semantic regex allow-listing, whether fact IDs are required for every sentence, and whether fallback remains deterministic.

### Ticket 2: Local narrative judge provider contract

- **Goal:** Add a model-agnostic judge provider interface and fake judge harness using the proposed judge schema.
- **Likely source boundaries:** `src/flight-learn-local-diagnosis-model.ts` or a new successor module, colocated tests; optionally `src/flight-learn-llama-cpp-adapter.ts` only if adding a separate judge provider wrapper remains loopback-only.
- **No-goals:** no real judge model quality claims, no downloads, no hosted calls, no UI/storage/routing changes.
- **Acceptance/evidence:** fake judge accept/reject/uncertain cases; parser rejects extra keys and bad verdicts; local judge failure/timeout falls back; same narrative corpus adversarial cases covered; typecheck/diff-check.
- **Audit focus:** judge is veto-only, cannot create facts, cannot mutate product state, and uncertainty fails closed.

### Ticket 3: Authorized real local judge/NLI comparison

- **Goal:** With explicit operator authorization, run sanitized corpus against one or more local judge candidates: existing Bonsai 4B as self-judge baseline, separate local evaluator model if approved/present, and/or NLI sidecar if approved.
- **Write scope:** evidence/research artifacts only unless a model/runtime adapter bug is found and separately ticketed.
- **Acceptance/evidence:** per-case metrics for accept/fallback/safety/latency; redacted examples; no private session content; explicit self-approval caveat; no release readiness claim.
- **Stop conditions:** model asset missing, runtime missing, model requires download/install not authorized, non-loopback endpoint required, raw sessions needed.

## Sources

### Kept

- `flight-learn-inbox-ux.md` — owns REQ-024..REQ-032 and SCN-008..SCN-010 local-model display-only constraints.
- `ralph-sixth-followup-audit-output.md` — direct evidence that regex-semantic validation still admits bypasses.
- `src/flight-learn-local-diagnosis-model.ts` — current fact packet, prompt, schema, validator, and fallback seam.
- `src/flight-learn-llama-cpp-adapter.ts` — existing local loopback adapter and runtime boundary.
- Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena (https://arxiv.org/abs/2306.05685) — primary evidence for LLM judge promise and known biases.
- Judging the Judges: A Systematic Study of Position Bias in LLM-as-a-Judge (https://aclanthology.org/2025.ijcnlp-long.18/) — recent source on judge position bias.
- Prometheus-Eval / Prometheus 2 (https://github.com/prometheus-eval/prometheus-eval, https://arxiv.org/abs/2405.01535) — open evaluator model candidate and local inference implications.
- llama.cpp server docs (https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md) — local OpenAI-compatible server, schema/grammar constrained JSON, and runtime caveats.
- TRUE (https://aclanthology.org/2022.naacl-main.287/) — broad factual-consistency evaluation evidence for NLI/QG approaches.
- SummaC (https://github.com/tingofurro/summac/blob/master/README.md) — sentence-level NLI factual-consistency implementation pattern.
- MoritzLaurer DeBERTa-v3 NLI model card (https://huggingface.co/MoritzLaurer/DeBERTa-v3-base-mnli-fever-anli) — candidate local entailment model family.
- Transformers.js (https://huggingface.co/docs/transformers.js/en/index) and ONNX Runtime Node (https://github.com/microsoft/onnxruntime/blob/master/js/node/README.md) — plausible Node-local inference path for NLI.
- ALCE (https://aclanthology.org/2023.emnlp-main.398/) — citation-generation benchmark and evidence that citations alone remain incomplete.
- Attribute First, then Generate (https://arxiv.org/html/2403.17104) — best source for sentence-level fine-grained attribution and attribute-first generation pattern.
- FActScore (https://aclanthology.org/2023.emnlp-main.741/) — atomic-fact evaluation framing.

### Dropped / not used as primary support

- AWS Strands/AWS evaluator posts — hosted/proprietary context; conflicts with local-first preference.
- Generic “run LLMs locally” DEV posts — broad SEO/tutorial value, not specific enough for this contract.
- Citeformer PyPI page — interesting structural citation-mask implementation, but new/tool-specific, Python-oriented, and unnecessary once llama.cpp + attribution papers establish the design pattern.
- LongCite — useful sentence-level citation model, but 8B/9B long-context QA focus and evaluation depends on hosted judge in its README; not an MVP fit.
- Google TrueTeacher T5-11B — strong factual-consistency model but non-commercial intended use and too heavy for this product path without separate authorization.

## Gaps and explicit limits

- No real Bonsai 4B, Prometheus, NLI, llama.cpp, ONNX, or Transformers.js runtime was executed.
- No model quality, latency, memory use, or acceptance rate is proven for this project.
- The proposed judge schema is a research recommendation, not implemented source.
- Prometheus and other candidate model licenses/terms, hardware requirements, and local availability need separate review before adoption.
- A local NLI threshold cannot be chosen from literature alone; it must be calibrated on the redacted narrative corpus and likely human-reviewed examples.
- Same-model generator+judge may be useful for diagnostics but cannot provide independent validation.
- Fact IDs reduce hallucination surface but do not prove semantic entailment; hence the recommended judge remains a veto layer and all uncertainty fails closed.
- The research artifact does not update the primary research record status; a coordinator should reconcile this output into `research:20260528-local-narrative-judge-validation` and close/supersede the blocked regex ticket accordingly.
