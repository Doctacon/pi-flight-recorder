# Small Local Model Options For Flight Learn

ID: research:20260602-small-local-model-options-for-flight-learn
Type: Research
Status: completed
Created: 2026-06-02
Updated: 2026-06-02

## Summary

Investigated small open/open-weight local models that could replace or challenge Bonsai 4B Q1_0 for `/flight-learn` model-enabled card-copy comprehension when memory is scarce, then ran a follow-up web scan for better options. The main conclusion is: prefer a smaller model at a healthier quantization such as Q4/Q5 over a 4B model at Q1. The strongest memory-conscious shortlist is now Qwen3 1.7B/Qwen3-4B-Instruct-2507, SmolLM3 3B, Phi-4-mini 3.8B, and possibly LFM2 1.2B as a speed/memory wild card with license caveats. Every candidate still needs a synthetic/redacted replay before any product integration or download claim.

## Question

Which small local models are plausible candidates for `/flight-learn` card-copy comprehension under tight memory constraints, while preserving local-first/open-source preference and avoiding downloads or runtime changes without operator authorization?

## Scope

Covered:

- Small text/instruct models roughly 0.6B to 4B parameters, plus memory/quality tradeoffs for quantized GGUF use.
- Local llama.cpp-compatible or GGUF-available candidates where possible.
- License and openness posture when visible from model cards or official repositories.
- Fit for the specific `/flight-learn` task: bounded JSON/card-copy from redacted facts, not general chatbot quality.

Excluded:

- Hosted inference.
- Automatic downloads or installs.
- 8B+ dense models as default candidates.
- Large MoE or vision-first models as default candidates.
- Claims that any model works for `/flight-learn` without a replay/evidence ticket.

## Method And Sources

External source scan on 2026-06-02 plus current project evidence.

- `evidence:20260602-flight-learn-card-copy-prompt-schema-variants` - same-model Bonsai 4B variants removed timeouts but still failed product usefulness; Bonsai remains no-go for current variants.
- `evidence:20260602-flight-learn-card-copy-failure-diagnostics` - Bonsai Q1/current prompt had 6/8 timeouts and 0/8 product gate passes.
- Qwen3 official/Hugging Face sources - Qwen3 dense family includes 0.6B, 1.7B, and 4B under Apache 2.0; Qwen3-4B-Instruct-2507 model card describes 4B parameters and long context. URLs: https://qwenlm.github.io/blog/qwen3/ and https://huggingface.co/Qwen/Qwen3-4B-Instruct-2507
- Hugging Face SmolLM sources - SmolLM3 is a fully open 3B model at the 3B-4B quality tier; SmolLM2-1.7B-Instruct GGUF exists. URLs: https://github.com/huggingface/smollm and https://huggingface.co/HuggingFaceTB/SmolLM2-1.7B-Instruct-GGUF
- Microsoft Phi-3.5/Phi-4 Mini model cards - Phi-3.5-mini-instruct and Phi-4-mini-instruct are MIT licensed; Phi-4-mini is a newer 3.8B class candidate. URLs: https://huggingface.co/microsoft/Phi-3.5-mini-instruct and https://huggingface.co/microsoft/Phi-4-mini-instruct
- Gemma 3 QAT/GGUF sources - Gemma 3 1B/4B QAT GGUF models are memory-friendly, but Gemma uses the Gemma license/access terms rather than Apache/MIT. URLs: https://huggingface.co/google/gemma-3-4b-it-qat-q4_0-gguf and https://developers.googleblog.com/en/gemma-3-quantized-aware-trained-state-of-the-art-ai-to-consumer-gpus/
- Ministral GGUF/model cards - Ministral 3B/4B instruct GGUF options exist and sources report Apache 2.0 licensing for some variants. URLs: https://huggingface.co/QuantFactory/Ministral-3b-instruct-GGUF and https://huggingface.co/QuantFactory/Ministral-4b-instruct-GGUF
- llama.cpp project - supports local GGUF inference and is already the runtime family used by the project. URL: https://github.com/ggml-org/llama.cpp
- Follow-up web scan, 2026-06-02: Distil Labs small-model benchmark reported Qwen3 family dominance among small fine-tuning bases and Qwen3-4B-Instruct-2507 as top among its tested small models. URL: https://www.distillabs.ai/blog/we-benchmarked-12-small-language-models-across-8-tasks-to-find-the-best-base-model-for-fine-tuning/
- Follow-up web scan, 2026-06-02: Hugging Face SmolLM/SmolLM3 sources report SmolLM3 3B outperforms Llama 3.2 3B and Qwen2.5 3B while staying competitive with 4B alternatives, with Apache 2.0/full-training-detail openness. URLs: https://github.com/huggingface/smollm and https://github.com/huggingface/blog/blob/main/smollm3.md
- Follow-up web scan, 2026-06-02: Qwen3-4B-Instruct-2507 GGUF Q4_K_M pages report ~2.5GB file size, making it a realistic upper-bound candidate if memory allows. URL: https://huggingface.co/bartowski/Qwen_Qwen3-4B-Instruct-2507-GGUF
- Follow-up web scan, 2026-06-02: Liquid AI LFM2 1.2B GGUF pages report Q4 files around ~0.7-0.8GB and on-device speed claims, but the LFM license is Apache-derived with commercial-use thresholds rather than plain Apache/MIT. URLs: https://huggingface.co/LiquidAI/LFM2-1.2B-GGUF and https://www.liquid.ai/lfm-license

Source quality note: official model cards/repos are stronger than third-party quantizer pages. Third-party GGUF pages establish availability, not product fit.

## Findings

1. Bonsai 4B Q1_0 likely suffered from both runtime burden and extreme quantization quality loss.
   - The project evidence shows shorter prompts fixed timeouts but did not fix semantic usefulness.
   - Q1 is an aggressive quantization; a smaller Q4/Q5 model may use similar or modestly more memory while preserving more semantics.

2. Memory should be reasoned in bands, not just parameter count.
   - Approximate weight memory for GGUF-style quantization: 0.6B Q4 ~0.4-0.7GB, 1.5B-1.7B Q4 ~1.0-1.3GB, 3B Q4 ~1.8-2.3GB, 3.8B-4B Q4 ~2.3-3.2GB.
   - Add KV cache and runtime overhead. For this task, keep context small, such as 2k-4k, rather than allocating a huge native context.

3. Best first candidates under strict open-source preference:
   - Qwen3 1.7B or Qwen2.5 1.5B Instruct-style GGUF at Q4/Q5: likely best tiny first test because Qwen's small models are Apache 2.0 and instruction-capable.
   - SmolLM2 1.7B Instruct Q4/Q5: very memory-friendly, open, and useful as a low-memory baseline.
   - SmolLM3 3B Instruct Q4: stronger small-model candidate if roughly ~2GB weight memory is acceptable; follow-up sources strengthen this recommendation.
   - Phi-4-mini-instruct Q4, or Phi-3.5-mini-instruct Q4 if Phi-4 GGUF support is less convenient: heavier around the 3.8B class but MIT licensed and likely stronger for instruction following.
   - Qwen3-4B-Instruct-2507 Q4_K_M: likely the strongest Apache-licensed small-model candidate if ~2.5GB model-file memory plus KV/runtime overhead is acceptable.
   - Ministral 3B/4B Instruct Q4: plausible, but should be checked against official model/source licensing and llama.cpp compatibility before selection.

4. Good but license-caveated candidates:
   - LFM2 1.2B Q4 is an interesting memory/speed wild card at roughly sub-1GB GGUF file sizes, but the LFM Open License has large-business/free-use thresholds and is not as clean as Apache/MIT for this project's open-source-first posture.
   - Gemma 3 1B/4B QAT Q4 may be memory-efficient and strong, but Gemma's license/access terms make it less aligned with the project's open-source-first principle than Apache/MIT candidates.
   - Llama 3.2 1B/3B is small and often good, but Meta's license is not OSI-style open source; avoid as first pick unless the operator accepts that tradeoff.

5. Candidates to avoid as first moves:
   - MoE models, even with small active parameter counts, because disk/RAM/runtime complexity may exceed the memory goal.
   - Vision/multimodal models unless text-only is unavailable, because they add irrelevant weights/behavior.
   - Thinking variants that cannot be reliably kept in concise non-thinking mode, because they may waste tokens and complicate JSON output.
   - Q1/Q2 quantization unless memory is so constrained that quality loss is acceptable.

## Tradeoffs

- Qwen3/Qwen2.5 1.5B-1.7B Q4/Q5 - best first low-memory candidate; Apache 2.0; may be weaker than 3B/4B on nuanced card copy but cheap to test.
- SmolLM2 1.7B Q4/Q5 - smallest fully open instruct baseline; likely fast and memory-light; may lack enough instruction fidelity for strict JSON/card-copy.
- SmolLM3 3B Q4 - better semantic quality at still-small size; costs more memory than 1.7B but likely less painful than 4B Q4.
- Phi-4-mini 3.8B Q4 - newer stronger instruction-following candidate; MIT license; memory closer to 4B class.
- Phi-3.5-mini 3.8B Q4 - older but still plausible MIT fallback if Phi-4 GGUF/runtime support is inconvenient.
- Gemma 3 1B/4B QAT Q4 - attractive memory/quality, but license posture is not as clean for this project.
- Qwen3-4B-Instruct-2507 Q4_K_M - likely strongest Apache candidate in this band; ~2.5GB GGUF file size from third-party quantizer source; higher memory than 1.7B/3B but better odds.
- LFM2 1.2B Q4 - very memory-light and speed-focused; promising as a wild card, but license is less clean and product JSON/card-copy fit is unproven.
- Qwen3 0.6B Q4 - extremely memory-light; useful only as a curiosity/baseline, probably too weak for all-field card-copy semantics.

## Rejected Paths And Null Results

- Another Bonsai Q1 prompt pass - rejected for now by two negative evidence packets and no-go variant audit.
- Larger 8B+ models as first repair - rejected by operator's memory constraint.
- Hosted providers - rejected by local-first/privacy constraints.
- Automatic model downloads - rejected; each new model requires explicit operator authorization.
- Treating a model's general benchmark quality as `/flight-learn` readiness - rejected; each candidate needs the same redacted replay gate.

## Conclusions

The best next model direction is not another 4B Q1 model. It is a small, permissively licensed instruct model at Q4/Q5 with a small context window and the existing constrained JSON/replay harness.

Recommended first shortlist after follow-up search:

1. Qwen3 1.7B / Qwen2.5 1.5B Instruct GGUF, Q4_K_M or Q5_K_M, for the lowest-memory Apache-first test.
2. SmolLM3 3B Instruct GGUF, Q4_K_M, if ~2GB weight memory is acceptable; stronger evidence than SmolLM2 for 3B-4B competitiveness.
3. Qwen3-4B-Instruct-2507 GGUF, Q4_K_M, if ~2.5GB model file plus KV/runtime overhead is acceptable; likely best quality-per-open-license candidate.
4. Phi-4-mini-instruct GGUF, Q4_K_M, if memory can tolerate the 3.8B class and MIT license is preferred.
5. LFM2 1.2B Q4 as a speed/memory wild card only if the LFM license tradeoff is accepted.

Gemma 3 QAT and Llama 3.2 can be considered only after explicitly accepting their license/open-weight tradeoffs.

## Recommendations

- Shape a new model-selection/evaluation ticket before any download: compare 3-4 authorized candidate models on the same synthetic/redacted `/flight-learn` replay corpus.
- Capture memory/RSS, latency, parse/schema validity, product-gate pass, unsafe accepted count, and representative sanitized render shape.
- Keep context small, ideally 2k-4k, and test Q4/Q5 before falling to lower quantization.
- Do not unblock product repair or comprehension validation from model reputation alone.

## Open Questions

- What is the actual memory budget the operator can spare during Pi sessions: <1GB, 1-2GB, 2-3GB, or 3-4GB?
- Is Gemma's custom license acceptable, or should candidates be limited to Apache/MIT-style open-source licenses?
- Is a 3B Q4 model acceptable if it materially improves semantic quality over 1.7B Q4?

## Related Records

- `plan:20260602-flight-learn-model-enabled-comprehension-repair` - current repair plan blocked after same-model no-go.
- `ticket:20260602-flight-learn-card-copy-prompt-schema-variants` - no-go evidence for current Bonsai variants.
- `audit:20260602-flight-learn-card-copy-prompt-schema-variants-review` - finding that product repair should remain blocked.
- `spec:flight-learn-inbox-ux` - behavior contract any model candidate must satisfy.
