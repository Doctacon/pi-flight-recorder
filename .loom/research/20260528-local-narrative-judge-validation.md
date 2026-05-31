# Local Narrative Judge Validation

ID: research:20260528-local-narrative-judge-validation
Type: Research
Status: completed
Created: 2026-05-28
Updated: 2026-05-28

## Summary

This research investigated whether `/flight-learn` can validate optional local-model `What happened?` narratives with a local/open-source judge instead of regex/token semantic allow-lists. Recommendation: replace the blocked regex-semantic validator with a hybrid contract where the generator must cite local fact IDs, deterministic code verifies schema/fact IDs/hard safety boundaries, and a local judge is only a veto/uncertainty gate for sentence-level support, actionability, and usefulness.

## Question

Can a local/open-source judge validate `/flight-learn` narrative `whatHappened` grounding and display-only safety well enough to unblock Bonsai 4B narrative UX, without hosted calls, unbounded private-session input, automatic downloads, or treating model text as source of truth?

## Scope

Covered:

- Local LLM-as-judge.
- Local NLI/entailment model.
- Citation/fact-ID constrained generation.
- Hybrid generator + fact IDs + deterministic verification + local judge.
- Candidate judge/generator schemas for bounded redacted fact packets and display-only candidate narratives.
- Privacy, latency, determinism, auditability, implementation complexity, self-approval risk, and fail-closed behavior.
- Downstream ticket shape for replacing `ticket:20260528-flight-learn-narrative-local-model-contract`.

Excluded:

- Product source edits.
- Hosted model calls, non-loopback endpoints, telemetry, or proprietary judge APIs.
- New model/runtime downloads or installs.
- Running Bonsai 4B, Prometheus, NLI, llama.cpp, ONNX, or Transformers.js.
- Raw Pi sessions, unredacted paths, secrets, stack traces, prompts, full transcripts, or private logs as research/search/model input.
- UI integration, storage/routing changes, classifier automation, or release-readiness claims.
- Continuing regex expansion as the primary semantic validator.

Assumptions:

- Deterministic diagnosis remains default/fallback and source-of-truth boundary.
- Existing hard filters remain appropriate for schema, length, raw paths, secrets, raw command strings, and obvious unsafe literals.
- A judge may only veto display wording; it cannot create facts, rewrite stored fields, route items, rank/classify candidates, or persist model output as truth.

## Method And Sources

Method:

- Reviewed project records, evidence, and source to ground current constraints and the failed regex path.
- Launched bounded research worker; output saved at `.loom/research/artifacts/20260528-local-narrative-judge-validation/researcher-output.md`.
- Performed parent verification with generic web/code searches only; no private project/session content was sent.
- No downloads, installs, local runtimes, hosted model calls with project data, or product source edits were performed.

Project-local sources:

- `plan:20260528-flight-learn-4b-narrative-what-happened` - blocked parent plan and safety constraints.
- `ticket:20260528-flight-learn-narrative-local-model-contract` - blocked regex-semantic implementation path and repeated audit failures.
- `spec:flight-learn-inbox-ux` REQ-024 through REQ-032 and SCN-008 through SCN-010 - optional local-model, display-only, fallback-safe behavior.
- `evidence:20260528-flight-learn-narrative-local-model-contract` - fake-provider evidence and its limits.
- `.loom/evidence/artifacts/20260528-flight-learn-narrative-local-model-contract/ralph-sixth-followup-audit-output.md` - latest adversarial audit showing regex bypasses persisted.
- `src/flight-learn-local-diagnosis-model.ts` - current prompt, packet, schema, validator, and fallback seam.
- `src/flight-learn-llama-cpp-adapter.ts` - current loopback-only local LLM adapter seam.

External and code sources:

- Zheng et al., “Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena” - shows LLM-as-judge promise and known position/verbosity/self-enhancement/reasoning-limit biases. https://arxiv.org/abs/2306.05685
- Wang et al., “Judging the Judges: A Systematic Study of Position Bias in LLM-as-a-Judge” - recent evidence that judge position bias varies by task/model/quality gap. https://aclanthology.org/2025.ijcnlp-long.18/
- Prometheus-Eval / Prometheus 2 - open evaluator model family and rubric-based judge candidate, but not product-specific proof. https://github.com/prometheus-eval/prometheus-eval and https://arxiv.org/abs/2405.01535
- llama.cpp server README - OpenAI-compatible local server supports chat completions and schema-constrained JSON response format. https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md
- Honovich et al., TRUE factual-consistency benchmark - positions NLI and QA-style approaches as factual-consistency evaluation methods, with limits. https://aclanthology.org/2022.naacl-main.287/
- Laban et al., SummaC - NLI-based factual-consistency pattern for generated summaries. https://github.com/tingofurro/summac
- MoritzLaurer DeBERTa-v3-base-mnli-fever-anli model card - local entailment model family candidate. https://huggingface.co/MoritzLaurer/DeBERTa-v3-base-mnli-fever-anli
- Transformers.js and ONNX Runtime Node docs - possible Node-local inference path, but with dependency/model-asset implications and default download/caching behavior unless explicitly controlled. https://huggingface.co/docs/transformers.js and https://github.com/microsoft/onnxruntime/tree/master/js/node
- Gao et al., ALCE citation benchmark - citation generation improves verifiability but citations alone remain incomplete. https://aclanthology.org/2023.emnlp-main.398/
- Slobodkin et al., “Attribute First, then Generate” - supports locally attributable sentence-level generation pattern. https://aclanthology.org/2024.acl-long.182/
- Min et al., FActScore - atomic-fact framing for long-form factuality; whole-paragraph binary acceptance is too coarse. https://aclanthology.org/2023.emnlp-main.741/

## Findings

1. The current failure is architectural, not a missing-regex bug. Five-plus audit/fix rounds kept finding new ways for semantically unsafe phrasing to bypass lexical patterns. Regex remains useful for hard raw-detail and schema guards, but not for proving grounding, non-actionability, or narrative usefulness.

2. Local LLM-as-judge is feasible and relevant but unsafe as the only acceptance gate. Published LLM-judge work supports judge utility for open-ended evaluation, while also documenting biases and inconsistency. For `/flight-learn`, an LLM judge should be a veto/uncertainty signal, not a source of truth or sole validator.

3. Open evaluator models exist, but they do not remove project-specific evaluation. Prometheus 2 is a plausible future local judge candidate because it is rubric-oriented and open, but this research did not verify license fit, hardware fit, latency, or `/flight-learn` accuracy. Adoption requires a separate authorized validation ticket.

4. The existing loopback `llama.cpp` adapter is the right local LLM seam to preserve. It already enforces loopback URLs and a bounded provider contract. A future judge adapter can reuse or wrap this seam, but must not add hosted endpoints, tools, telemetry, or automatic model downloads.

5. Local NLI/entailment is better aligned with sentence-level grounding than free-form regex. It can answer “is this sentence supported by these facts?” better than token matching. However, NLI alone does not cover route/action advice, mutation language, UI display-only policy, or usefulness. It also introduces a new runtime/model-asset path that needs authorization and calibration.

6. Citation/fact-ID constrained generation provides the strongest deterministic handle. If every narrative sentence must cite local redacted fact IDs, code can reject unknown/missing citations before any semantic judge runs. This is not enough by itself because a sentence can cite a real fact while adding unsupported causal bridges or action advice.

7. Atomic/sentence-level judgment is preferable to paragraph-level acceptance. `/flight-learn` narratives can mix supported and unsupported claims; accepting or rejecting the whole paragraph without sentence/fact-level reasons hides risk.

8. The replacement contract must fail closed. Malformed generator output, unknown fact IDs, hard-safety failures, judge parse errors, low confidence, uncertainty, timeout, provider failure, or self-approval concerns should all fall back to deterministic wording.

## Tradeoffs

- Local LLM-as-judge:
  - Strength: holistic natural-language assessment for grounding, actionability, and usefulness; can reuse loopback LLM infrastructure.
  - Weakness: probabilistic, biased, self-approval risk if same model generates and judges, slower, needs its own evaluation.
  - Consequence: useful as a veto layer, not sole gate.

- Local NLI/entailment:
  - Strength: directly supports sentence-level premise/hypothesis grounding checks and may be more stable than a free-form judge.
  - Weakness: does not decide display-only/action-advice/usefulness policy; adds ONNX/Python/model dependency and calibration burden.
  - Consequence: promising future sidecar/comparison, not MVP blocker.

- Citation/fact-ID constrained generation:
  - Strength: strongest deterministic verification of what local facts the model claims to use; reduces hallucination surface and produces auditable sentence support.
  - Weakness: citations do not prove entailment and may reduce prose quality or be gamed by citing vaguely related facts.
  - Consequence: should become mandatory structure for generated narrative candidates.

- Hybrid generator + fact IDs + deterministic verification + local judge:
  - Strength: combines proof-by-construction handles with semantic veto and auditable per-sentence reasons.
  - Weakness: highest complexity and latency; real judge quality remains unproven until authorized validation.
  - Consequence: recommended architecture for the next implementation path.

## Rejected Paths And Null Results

- Continue expanding regex/token semantic validation - rejected by repeated audit bypasses and operator direction. Keep regex only for hard raw-detail/schema/literal safety checks.
- LLM judge only - rejected because published biases and prompt-following uncertainty make it insufficient as a sole safety gate.
- Same Bonsai model as generator and sole judge - rejected for acceptance due to self-approval risk. It may be used only as explicitly labeled experimental baseline evidence.
- NLI-only gate - rejected for MVP because it does not cover action advice, mutation language, route/classifier policy, or usefulness.
- Citation/fact-ID only gate - rejected because a sentence can cite valid IDs while still making unsupported bridges or action recommendations.
- Hosted/proprietary judge APIs - rejected by project local-first/open-source posture and REQ-025.
- Automatic model/runtime download - rejected by REQ-025 and operator constraints.

## Conclusions

The best next contract is a hybrid judge/proof-by-construction path:

1. Generate a bounded redacted fact packet where every fact has a stable local ID.
2. Ask the local generator to return structured narrative sentences, each with non-empty `factIds`.
3. Deterministically reject malformed output, extra keys, unknown/missing fact IDs, too many/too-long sentences, raw paths/secrets/raw commands, redaction-placeholder echo, obvious route/action/mutation/classifier/ranking language, and any storage/source-of-truth side-effect language.
4. Send only the bounded fact packet and candidate sentences to a local judge provider.
5. Accept only if the judge returns structured `accept`, every sentence is supported or cautiously connected to cited facts, no sentence is unsafe/action-advice/not-useful/unsupported/uncertain, and no confidence is low.
6. Treat judge uncertainty, parse failure, timeout, provider error, or low confidence as deterministic fallback.

This conclusion does not prove any specific real judge model works. It only identifies the architecture that is more scalable and auditable than regex semantics under current constraints.

## Proposed Contracts

### Fact packet / generator input

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
    text: string;
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

### Generator output

```ts
interface NarrativeCandidateV2 {
  schemaVersion: 2;
  headline?: string;
  whatHappened?: {
    sentences: Array<{
      text: string;
      factIds: string[];
      role?: "sequence" | "recurrence" | "uncertainty" | "impact-link";
    }>;
  };
  whyItMatters?: string;
  expectedBehavior?: string | null;
}
```

### Judge input/output

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
}

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
    unsupportedClaims: string[];
    reason: string;
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

## Recommendations

Create successor execution tickets rather than unblocking the old regex-semantic ticket directly:

1. `ticket:20260528-narrative-fact-id-contract-verifier`
   - Supersede the blocked validator with fact-ID generation and deterministic verification.
   - Likely write scope: `src/flight-learn-local-diagnosis-model.ts`, colocated tests, sanitized harness artifacts.
   - No real model/runtime, no UI integration, no downloads.
   - Evidence: fake-provider tests and corpus harness for accepted grounded fact-ID narrative, unknown/missing IDs, malformed schema, hard-safety failures, timeout/provider error, and no storage/route side effects.

2. `ticket:20260528-local-narrative-judge-provider-contract`
   - Add a model-agnostic local judge provider interface and fake judge harness using the proposed judge schema.
   - Likely write scope: a successor local-diagnosis module or `src/flight-learn-local-diagnosis-model.ts`; adapter changes only if needed to keep loopback-only judge calls explicit.
   - No real judge quality claims, no downloads, no hosted calls, no UI/storage/routing changes.
   - Evidence: fake judge accept/reject/uncertain/timeout/parser cases; uncertainty fails closed; judge is veto-only.

3. Future authorized validation ticket:
   - With explicit operator authorization, compare real local judge candidates on the sanitized narrative corpus: Bonsai 4B self-judge baseline, a separate local evaluator model if approved/present, and/or NLI sidecar if approved.
   - Evidence-only scope unless adapter bugs are separately ticketed.
   - Must record self-approval caveats, latency, fallback metrics, sanitized examples, and no release-readiness claim.

Keep `ticket:20260528-flight-learn-narrative-local-model-contract` blocked or superseded; do not resume regex bypass fixes.

## Open Questions

- Which real local judge model, if any, should be authorized first? Prometheus 2 is plausible but needs license/hardware/local-availability review.
- Should Bonsai 4B be tested as both generator and self-judge baseline before authorizing a separate judge model? This would be useful diagnostically but weak for safety claims.
- Should local NLI be implemented through Node/ONNX, Python sidecar, or deferred until the fact-ID + fake-judge architecture is proven?
- What Pi TUI latency budget is acceptable for optional narrative polish with a second local model call?

## Related Records

- `ticket:20260528-local-narrative-judge-validation-research` - executable ticket that completed this research.
- `.loom/research/artifacts/20260528-local-narrative-judge-validation/researcher-output.md` - detailed research-worker brief.
- `plan:20260528-flight-learn-4b-narrative-what-happened` - blocked parent plan this research is meant to reshape.
- `ticket:20260528-flight-learn-narrative-local-model-contract` - blocked regex-semantic implementation path that should be superseded.
- `spec:flight-learn-inbox-ux` - current behavior contract for optional local-model polish and narrative `What happened?`.
- `evidence:20260528-flight-learn-narrative-local-model-contract` - fake-provider harness results and limits of the current contract.
