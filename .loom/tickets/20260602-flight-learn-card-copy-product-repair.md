# Flight Learn Card Copy Product Repair

ID: ticket:20260602-flight-learn-card-copy-product-repair
Type: Ticket
Status: blocked
Created: 2026-06-02
Updated: 2026-06-02
Risk: high - this may change the product prompt/schema/validation path for the primary model-enabled `/flight-learn` card-copy surface.
Priority: high - product source should change only after a repair variant earns integration.
Depends On: ticket:20260602-flight-learn-card-copy-prompt-schema-variants

## Summary

Integrate one evidenced same-model repair into the product local-model card-copy path. This ticket should only start if `ticket:20260602-flight-learn-card-copy-prompt-schema-variants` identifies a concrete prompt/schema/validator variant worth integrating and records why it preserves privacy, safety, source-of-truth, expected-behavior, evidence, routing, storage, and fallback boundaries.

Single closure claim: the product card-copy adapter/validator path implements the selected repair and remains safely display-only, with tests/evidence proving the repair does not weaken the non-negotiable gates.

## Related Records

- `plan:20260602-flight-learn-model-enabled-comprehension-repair` - parent repair strategy and invariants.
- `ticket:20260602-flight-learn-card-copy-prompt-schema-variants` - prerequisite experiment selecting the variant to integrate or declaring no-go.
- `ticket:20260602-flight-learn-card-copy-failure-diagnostics` - diagnostic evidence behind the selected repair target.
- `plan:20260531-flight-learn-llm-authored-card-copy` - existing card-copy implementation plan whose contract/rendering tickets are already closed.
- `spec:flight-learn-inbox-ux` REQ-033 through REQ-048 and SCN-011 through SCN-015 - product behavior requirements to preserve.
- `src/flight-learn-local-diagnosis-model.ts` - likely prompt, fact-packet, validation, fallback, and display-state write seam.
- `src/flight-learn-llama-cpp-adapter.ts` - likely JSON-schema adapter write seam.
- `src/flight-learn-local-diagnosis-model.test.ts` and `src/flight-learn-llama-cpp-adapter.test.ts` - likely focused tests.
- `src/flight-learn-inbox.ts` and `src/flight-learn-inbox.test.ts` - read first; write only if selected repair changes display-state/card-copy assumptions.

## Scope

In scope:

- Implement exactly one selected prompt/schema/validator repair from the prerequisite variant ticket.
- Update focused tests for accepted model-enabled card-copy fields and rejected unsafe/action-advice/privacy/mutation/generated-evidence/unsupported-expected cases.
- Preserve deterministic fallback as the default and safe recovery path.
- Preserve opt-in local-model enablement, loopback-only adapter constraints, bounded/redacted fact packets, structured output validation, and display-only semantics.
- Record implementation evidence and audit before closure.

Out of scope:

- Implementing multiple unproven variants or speculative prompt churn.
- Weakening privacy/safety/source-of-truth gates to improve pass rate.
- New model families, runtime downloads/installs, hosted providers, non-loopback calls, telemetry, custom forks, or dependency changes.
- Default-enabling local model use or adding top-level visible slash commands.
- Route ranking, classifier automation, dogfood collection, artifact application, rule/source/docs/Loom/skill/prompt mutation, or storage truth mutation from model text.
- Broad renderer redesign. If the selected repair needs more than a narrow display-state/card-copy wiring adjustment, create a separate rendering ticket.

Implementation invariants:

- Unsafe/action-advice/privacy/mutation output remains a card-level fail-closed deterministic fallback.
- Any field-local partial acceptance must apply only to non-safety failures such as unsupported, empty, unknown, or low-information fields, and only when the remaining fields independently pass hard gates.
- Expected behavior remains supported only by expected-behavior or delta-expectation facts. Unknown expected behavior must stay unknown and editable.
- Evidence summary is display-only and cannot replace deterministic evidence refs.
- Model text must not route, rank, persist truth, create/apply artifacts, edit source/docs/Loom/rules/skills/prompts, or feed classifier labels.

Likely first Ralph run:

- Read this ticket, parent plan, prerequisite variant recommendation, relevant spec requirements, source seams, and existing tests.
- Set this ticket active only after confirming the prerequisite selected an integration variant rather than no-go/replan.
- Implement the selected repair narrowly.
- Write evidence under `.loom/evidence/20260602-flight-learn-card-copy-product-repair.md` with artifacts under `.loom/evidence/artifacts/20260602-flight-learn-card-copy-product-repair/`.
- Move to review pending audit.

Stop conditions:

- Stop if the prerequisite ticket did not select a concrete variant.
- Stop if integration would require weakening a non-negotiable gate.
- Stop if implementation reveals a behavior change not covered by `spec:flight-learn-inbox-ux`; route a spec amendment before continuing.
- Stop if runtime/model/download/provider changes seem necessary; return to plan/operator decision.
- Stop if source changes grow beyond the selected prompt/schema/validator repair.

## Acceptance

- ACC-001: Selected repair is implemented narrowly.
  - Evidence: source diff changes only the selected prompt/schema/validator/display-state seam identified by prerequisite evidence.
  - Audit: challenge speculative changes, broad cleanup, or variant drift.

- ACC-002: Safety/privacy/source-of-truth gates remain non-negotiable.
  - Evidence: focused tests reject raw paths/session paths/secrets/prompts/transcripts/stack traces, route/action advice, mutation instructions, generated evidence, unsupported expected behavior, and storage/routing/classifier side effects.
  - Audit: challenge any gate weakening or partial acceptance of unsafe output.

- ACC-003: Model-enabled and fallback behavior remain observable.
  - Evidence: focused tests and, where useful, render artifacts show successful repaired fake-provider/model-shaped output and deterministic fallback for invalid/unsafe/timeout cases.
  - Audit: challenge whether tests prove product integration rather than only schema validity.

- ACC-004: Project checks pass.
  - Evidence: focused tests, typecheck, build, full tests as practical, scoped `git diff --check`, and privacy/source-side-effect scans pass or have recorded blockers.
  - Audit: challenge skipped checks and stale generated/build artifacts.

- ACC-005: Evidence and audit support closure.
  - Evidence: implementation evidence dossier links commands/artifacts and a bounded audit reviews source diff, tests, trust boundary, and claims.
  - Audit: required before closure.

## Current State

Blocked by no-go prerequisite. `ticket:20260602-flight-learn-card-copy-prompt-schema-variants` is closed as no-go same-model variant evidence after audit `audit:20260602-flight-learn-card-copy-prompt-schema-variants-review`. No integration-worthy same-model variant was selected.

Do not start product source changes. This ticket can only proceed if a later operator/product decision supplies a new concrete integration target, such as a different authorized local model/runtime path, a newly shaped prompt-family experiment that selects an integration variant, or a separately shaped evidence-summary-only/validator-repair goal. Without that authority, this ticket should remain blocked or be cancelled by the parent plan rather than inventing a repair.

## Journal

- 2026-06-02: Created as the third child ticket of `plan:20260602-flight-learn-model-enabled-comprehension-repair`; blocked pending an evidenced prompt/schema variant recommendation.
- 2026-06-02: Remained blocked after `ticket:20260602-flight-learn-card-copy-prompt-schema-variants` closed as no-go evidence. No selected same-model repair exists to implement.
