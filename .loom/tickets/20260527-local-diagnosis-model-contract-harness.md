# Local Diagnosis Model Contract Harness

ID: ticket:20260527-local-diagnosis-model-contract-harness
Type: Ticket
Status: open
Created: 2026-05-27
Updated: 2026-05-27
Risk: high - this ticket defines the safety contract for model input/output in a privacy-sensitive UI path.
Priority: high - downstream adapter and UI work must not invent prompt, schema, redaction, or fallback semantics.
Depends On: ticket:20260527-local-diagnosis-model-runtime-research

## Summary

Implement the model-agnostic contract for optional local-model diagnosis polish: bounded redacted fact packet construction, prompt construction, structured response schema, validation/rejection, timeout/error fallback, and fake-provider tests.

Single closure claim: a future adapter can call a local model through a narrow contract that never sends raw sessions, rejects unsafe or malformed output, and always returns deterministic diagnosis text when model output is unavailable or untrusted.

## Related Records

- `plan:20260527-flight-learn-local-model-diagnosis-polish` - parent strategy and sequencing.
- `research:20260527-local-diagnosis-model-runtime` - runtime/model research; this ticket should consume its completed conclusion before execution.
- `spec:flight-learn-inbox-ux` - REQ-024 through REQ-029 and SCN-008/SCN-009 define required behavior.
- `ticket:20260527-flight-learn-diagnosis-view-model` - implemented deterministic diagnosis baseline and fallback.
- `src/flight-learn-diagnosis.ts` - likely read/write seam for deterministic diagnosis and optional polish helpers.
- `src/flight-learn-diagnosis.test.ts` - likely test seam for diagnosis view-model behavior.
- `src/redact.ts` - likely read scope for existing redaction utilities.

## Scope

In scope:

- Define a model-agnostic local diagnosis polish interface, likely separate from the existing reflection provider because this path requires local-only policy, structured output, and stricter validation.
- Build a bounded redacted fact packet from already-local fields such as deterministic diagnosis view, delta summary/reality/expectation/impact, detector signals, concise evidence metadata, and route-safe context.
- Explicitly exclude raw session transcripts, full prompts, unredacted local paths, secrets, unconstrained command output, and full evidence snippets from the fact packet.
- Define a small JSON response schema for display wording only, likely including optional replacements for `headline`, `whatHappened`, `whyItMatters`, and possibly `expectedBehavior`, plus no route/action fields.
- Implement schema, length, content, and safety validation.
- Implement timeout/error/unavailable fallback to deterministic diagnosis text.
- Add fake-provider tests for valid output, malformed JSON, overlong fields, secret-looking output, invented unsupported facts, non-local/raw details, timeout, and provider error.
- Prove no storage, routing, artifact, rule, source-doc, Loom, skill, or prompt mutation happens inside the contract.

Out of scope:

- Real Bonsai, `llama.cpp`, MLX, Ollama, or other runtime invocation.
- UI integration into `/flight-learn` focused-card rendering.
- Project settings or command flag UX beyond the minimal option shape needed to test the contract.
- Installing or downloading model weights.
- Changing visible command registration.

Likely write scope:

- `src/flight-learn-diagnosis.ts` or a new focused helper such as `src/flight-learn-local-diagnosis-model.ts`.
- New/updated colocated tests, likely `src/flight-learn-diagnosis.test.ts` and/or a new test file.
- Loom evidence/audit records after execution, not before.

Stop conditions:

- If a fact packet cannot be made useful without including raw sessions or sensitive details, stop and route back to `spec:flight-learn-inbox-ux` / research.
- If validation cannot distinguish display-only phrasing from route/action recommendations, stop and split/refine the schema.
- If implementation would require a real runtime adapter to test safety, stop and keep this ticket model-agnostic.

## Acceptance

- ACC-001: The code exposes a model-agnostic local diagnosis polish contract with deterministic fallback.
  - Evidence: focused tests show valid fake-provider output can replace display wording and provider absence/error/timeout returns deterministic diagnosis.
  - Audit: review should challenge whether fallback is complete and whether the contract can be used without a model.

- ACC-002: The fact packet is bounded and redacted.
  - Evidence: tests assert local paths, secrets, raw session text, full prompts, and long/unbounded snippets are omitted or redacted.
  - Audit: review should inspect the prompt/fact-packet builder for privacy leaks and scope creep.

- ACC-003: Model output is strictly structured, length-bounded, and display-only.
  - Evidence: tests cover malformed JSON, missing required fields, extra route/action fields, overlong fields, secret-looking output, and invented unsupported facts being rejected.
  - Audit: review should challenge whether the validator is too permissive and whether output can influence routing/storage.

- ACC-004: No storage, routing, artifact, rule, source, docs, Loom, skills, or prompts are mutated by the contract.
  - Evidence: focused tests or source inspection artifact show the contract only returns display data and does not call store/artifact/rule mutation APIs.
  - Audit: review should challenge accidental side effects.

- ACC-005: Standard validation passes for the touched source boundary.
  - Evidence: focused tests, `npm run typecheck`, `npm run build`, and relevant full tests or justified narrower test set.
  - Audit: review should challenge any skipped tests or unsupported closure claim.

## Current State

Open and ready after `ticket:20260527-local-diagnosis-model-runtime-research` completes. No source implementation has started. The first likely Ralph run should implement only the contract/harness and fake-provider tests, not a real Bonsai adapter.

## Journal

- 2026-05-27: Created from `plan:20260527-flight-learn-local-model-diagnosis-polish` after the operator selected PrismML Bonsai as the preferred low-memory candidate. This slice intentionally remains model-agnostic so Bonsai does not weaken the safety contract.
