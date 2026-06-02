# Flight Learn LLM Card Copy Operator Feedback

ID: evidence:20260531-flight-learn-llm-card-copy-operator-feedback
Type: Evidence Dossier
Status: recorded
Created: 2026-05-31
Updated: 2026-05-31
Observed: 2026-05-31 UTC

## Summary

The operator supplied a live `/flight-learn` screenshot and product feedback while `ticket:20260529-flight-learn-comprehension-validation` was blocked on operator review. The feedback shows that the current focused card is still too detector-shaped for the desired seamless learning inbox.

The durable product signal is not merely “collect the pending review packet.” The operator is asking for the main reading surface to be local-LLM-authored from facts, while keeping raw evidence hidden by default and inspectable on demand.

## Observed Screenshot Shape

The screenshot showed a focused `/flight-learn` card with these visible sections:

- `Problem` used a deterministic plain-English headline about repeated validation failure.
- `What happened?` and `Why it matters` were readable but still short deterministic summaries.
- `Expected` was unknown and asked the operator to edit the intended behavior.
- `Raw clue` surfaced detector-style wording about a repeated file-not-found pattern.
- `Why suggested` exposed internal detector/provenance language, including a detector label, confidence-like score, occurrence count, and an internal cluster-style identifier.
- `Evidence` was already hidden by default with a key to expand concise refs.
- Follow-up route choices and keyboard actions were visible.

No screenshot file was copied into Loom. This record intentionally omits local filesystem paths, raw session paths, secrets, prompts, transcripts, raw stack traces, and exact internal identifiers.

## Operator Feedback

The operator's product judgment:

- The visible sections `Problem`, `What happened?`, `Why it matters`, `Expected`, `Raw clue`, `Why suggested`, and `Evidence` should be readable through a local LLM-generated comprehension layer.
- The goal is a seamless, easy-to-digest interface for users resolving recurring issues.
- Actual evidence should remain hidden by default, as the current card already does.

## Interpretation

This feedback supports a repair branch before dogfood corpus/outcome collection:

- Local LLM output should author the primary card copy when explicitly enabled and gated.
- Evidence itself must not be generated. The local LLM may summarize bounded redacted evidence, but raw/redacted evidence refs remain deterministic source-of-truth and inspectable by explicit expansion.
- `Raw clue` and `Why suggested` should not remain default primary sections. Their user-facing replacement should be fielded copy such as `Why this was flagged`, with debug/provenance details behind expansion.
- `Expected` can be phrased by the LLM only from known facts. If the expected behavior is unknown, the card must say that Pi does not know it yet and keep the edit affordance.

## Non-Claims

This evidence does not prove that Bonsai 4B, another local model, or the current schema can produce acceptable all-field card copy. It only records that the current visible card shape is not yet the intended comprehension experience.

This evidence does not authorize hosted models, default model calls, automatic downloads, route automation, classifier labels, storage mutation, artifact application, or treating model text as source-of-truth.
