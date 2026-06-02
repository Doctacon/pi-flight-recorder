# Flight Learn LLM Card Copy Contract

ID: ticket:20260531-flight-learn-llm-card-copy-contract
Type: Ticket
Status: closed
Created: 2026-05-31
Updated: 2026-05-31
Risk: high - this changes the local-model output contract and trust boundary for the primary `/flight-learn` reading surface.
Priority: high - this is the first executable slice for `plan:20260531-flight-learn-llm-authored-card-copy` and must land before rendering can safely rely on all-field copy.

## Summary

Extend the explicitly enabled local-model card-copy contract so `/flight-learn` can receive safe fielded display copy for the whole primary reading surface: `Problem`, `What happened?`, `Why it matters`, `Expected`, `Why this was flagged`, and optional collapsed `Evidence summary`.

The closure claim is: the local-model contract and validators can accept safe fact-grounded all-field card copy and reject generated evidence, invented expected behavior, raw/private/internal/provenance leakage, action advice, or unsupported claims without changing storage, routing, artifacts, source/docs/Loom records, rules, skills, prompts, or classifier behavior.

## Related Records

- `plan:20260531-flight-learn-llm-authored-card-copy` - parent plan and decomposition.
- `spec:flight-learn-inbox-ux` REQ-042 through REQ-048 and SCN-013 through SCN-015 - intended behavior for authored card copy and hidden provenance.
- `evidence:20260531-flight-learn-llm-card-copy-operator-feedback` - operator screenshot feedback that triggered this contract extension.
- `ticket:20260529-flight-learn-local-draft-comprehension-gate` - existing safe draft display gates and display-state split.
- `ticket:20260529-flight-learn-constrained-json-adapter` - existing JSON-schema adapter implementation to preserve if adapter schemas change.
- `src/flight-learn-local-diagnosis-model.ts` - likely primary contract/fact-packet/validator implementation seam.
- `src/flight-learn-llama-cpp-adapter.ts` - likely constrained schema seam if request schemas need new fields.
- `src/flight-learn-local-diagnosis-model.test.ts` and `src/flight-learn-llama-cpp-adapter.test.ts` - likely focused test seams.

## Scope

In scope:

- Extend the local diagnosis/card-copy response shape to include fielded display jobs for:
  - headline/problem;
  - what-happened narrative;
  - why-it-matters impact;
  - expected-behavior wording;
  - why-this-was-flagged rationale;
  - evidence summary.
- Preserve a bounded redacted fact packet and support/fact reference mechanism for the new fields.
- Add field-specific hard gates for generated-evidence claims, invented expected behavior, raw local/session paths, secrets, stack traces, prompt/transcript text, raw commands, detector/provenance/debug language, route/action advice, artifact/rule/ticket/source mutation instructions, classifier/ranking claims, overlong/malformed/schema-incompatible output, and unknown fact references where references are required.
- Keep local model output display-only and non-authoritative.
- Update adapter JSON schemas only as needed to request/validate the new contract.
- Add focused fake-provider tests and side-effect tests.
- Produce evidence artifacts and privacy/side-effect scans.

Out of scope:

- Rendering the new fields in the focused card, except minimal test scaffolding if needed.
- Running real Bonsai/llama.cpp runtime replay.
- Adding hosted/non-loopback model calls, default model calls, automatic downloads, or new visible commands.
- Changing route choices, route ranking, classifier behavior, delta storage semantics, artifact candidates, source/docs/Loom/rules/skills/prompts, or applying artifacts.
- Weakening accepted-narrative verifier/judge gates.

Likely first Ralph run:

- Read this ticket, parent plan, amended spec requirements, prior draft-gate evidence/audit, and the local diagnosis/adapter code.
- Implement the smallest contract extension with fake-provider tests and no UI rendering claim.
- Stop if the existing validator design cannot safely support all-field copy without broader redesign.

Stop conditions:

- Stop if all-field support would require raw private sessions, unredacted local paths, secrets, prompts, transcripts, stack traces, or raw evidence in model input/output.
- Stop if expected-behavior generation cannot be distinguished from invented expected behavior.
- Stop if evidence summary would replace deterministic evidence refs rather than summarize them.
- Stop if implementation would change storage/routing/artifact side effects.
- Stop if product rendering changes are needed to make tests pass beyond tiny contract scaffolding; route to the rendering ticket instead.

## Acceptance

- ACC-001: The local-model card-copy contract has explicit fields for the whole primary reading surface.
  - Evidence: source/tests show schema or validation support for headline/problem, what happened, why it matters, expected behavior, why flagged, and evidence summary.
  - Audit: challenge whether the implementation still forces the renderer to reuse raw clue/detector/provenance strings.

- ACC-002: Hard gates protect privacy, source-of-truth, and human-routing boundaries for every new field.
  - Evidence: focused tests reject raw paths/session paths, secrets, stack traces, prompt/transcript markers, raw commands when forbidden, route/action/mutation advice, classifier/ranking claims, generated-evidence claims, invented expected behavior, unknown facts, overlong fields, and malformed/schema-invalid output.
  - Audit: challenge field-specific bypasses, especially evidence summary and expected behavior.

- ACC-003: Model output remains display-only and side-effect-free.
  - Evidence: tests or source scans show no storage/routing/artifact/source/docs/Loom/rules/skills/prompts/classifier side effects from accepting card-copy fields.
  - Audit: challenge whether any accepted field can influence route choice, ranking, candidate creation, stored delta truth, or classifier labels.

- ACC-004: Existing safe fallback behavior and accepted-narrative gates remain intact.
  - Evidence: focused regression tests cover disabled/provider-error/timeout/unsafe fallback, draft display, accepted-narrative path where applicable, and unsafe/action-advice fail-closed precedence.
  - Audit: challenge whether the broader schema weakens prior judge/verifier or fallback semantics.

- ACC-005: Validation artifacts are privacy-safe and reviewable.
  - Evidence: focused tests, typecheck/build/full tests as practical, `git diff --check`, privacy scan over artifacts/evidence, and evidence dossier.
  - Audit: challenge overclaiming real local-runtime usefulness, since this ticket uses fake-provider contract tests only.

## Current State

Closed. The contract-first extension is implemented and reviewed. The local-model card-copy contract now exposes fielded display copy for the primary reading surface, including `whyThisWasFlagged` and `evidenceSummary`, and the llama.cpp generator schema aligns with the optional-field validator contract.

Audit disposition:

- Initial audit `audit:20260531-flight-learn-llm-card-copy-contract-review` returned `changes-needed`.
- Follow-up evidence `evidence:20260531-flight-learn-llm-card-copy-contract-followup` resolved all three findings.
- Follow-up audit `audit:20260531-flight-learn-llm-card-copy-contract-followup-review` returned `clear` and states ACC-001 through ACC-005 are supported enough for closure.

Validation passed: focused tests, typecheck, build, full tests, scoped `git diff --check`, source side-effect scan, and privacy scan. No focused-card rendering, real runtime replay, or operator comprehension validation was performed; those remain downstream tickets.

## Journal

- 2026-05-31: Created as the first child ticket of `plan:20260531-flight-learn-llm-authored-card-copy`.
- 2026-05-31: Set status to active and launched bounded Ralph implementation run. Workspace already contains unrelated dirty/untracked Loom records; worker must preserve unrelated state.
- 2026-05-31: Implemented fielded local-model card-copy contract in `src/flight-learn-local-diagnosis-model.ts` and extended the llama.cpp generator schema in `src/flight-learn-llama-cpp-adapter.ts`. Added focused fake-provider/schema tests for all-field acceptance, unsupported expected behavior, generated/internal evidence-summary rejection, unknown fact IDs, and fact-cited field shape. Evidence recorded at `evidence:20260531-flight-learn-llm-card-copy-contract`; moved ticket to review pending audit.
- 2026-05-31: Audit `audit:20260531-flight-learn-llm-card-copy-contract-review` returned `changes-needed` with three findings: cited facts not bound to new field text, weak expectedBehavior support semantics, and adapter schema still requiring `whatHappened`. Moved ticket back to active for follow-up fixes.
- 2026-05-31: Implemented follow-up fixes for all three audit findings. Evidence recorded at `evidence:20260531-flight-learn-llm-card-copy-contract-followup`; focused tests, typecheck, build, full tests, diff check, source side-effect scan, and privacy scan passed. Moved ticket back to review pending follow-up audit.
- 2026-05-31: Follow-up audit `audit:20260531-flight-learn-llm-card-copy-contract-followup-review` returned `clear` with no material findings. Closed ticket and unblocked the rendering child ticket.
