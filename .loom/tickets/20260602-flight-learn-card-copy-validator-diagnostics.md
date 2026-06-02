# Flight Learn Card Copy Validator Diagnostics

ID: ticket:20260602-flight-learn-card-copy-validator-diagnostics
Type: Ticket
Status: closed
Created: 2026-06-02
Updated: 2026-06-02
Risk: medium - this introduces or exercises validator diagnostics near a safety-sensitive display gate, but should not change accepted card behavior.
Priority: high - prompt/validator repair should not proceed from aggregate rejection categories alone.

## Summary

Create a privacy-safe diagnostic path for `/flight-learn` local model card-copy validation. The diagnostic should explain, per field and rule/category, why a response would be rejected or omitted without persisting raw prompts, raw model output, private sessions, local paths, secrets, transcripts, stack traces, or provider logs.

Single closure claim: maintainers can inspect current validator rejection behavior over synthetic/redacted fixtures and, where authorized, local/open model outputs using safe categories/rule IDs instead of raw text, and product display behavior is unchanged.

## Related Records

- `plan:20260602-flight-learn-prompt-validator-contract-repair` - parent plan and sequencing.
- `spec:flight-learn-inbox-ux` REQ-049 through REQ-054 and SCN-016 through SCN-018 - behavior contract for hard-vs-field-local validation and privacy-safe diagnostics.
- `evidence:20260602-flight-learn-gpt55-hosted-sanity-check` - showed `gpt-5.5` produced 8/8 parse/schema-compatible responses but current validator rejected all outputs; exact raw-text causes were intentionally not persisted.
- `audit:20260602-flight-learn-gpt55-hosted-sanity-check-review` - supports prompt/validator misalignment at the class level and explicitly requires a safe rejection-inspection path before exact validator fixes.
- `evidence:20260602-flight-learn-small-model-batch-eval` - SmolLM2 produced schema-valid output but unsafe accepted categories under current gates.
- `audit:20260602-flight-learn-small-model-batch-eval-review` - treats SmolLM2 as a repair lead, not comprehension evidence.
- `src/flight-learn-local-diagnosis-model.ts` - likely validator/diagnostic seam.
- `src/flight-learn-local-diagnosis-model.test.ts` - likely focused test seam.

## Scope

In scope:

- Add or expose a diagnostic function/harness that reports validation outcomes with structured categories such as field, hard-vs-soft failure, rule ID, reason category, top-level key presence, length, and hashes where useful.
- Preserve the existing product `buildFlightLearnDiagnosisViewWithLocalPolish` behavior unless later repair tickets change it.
- Use synthetic/redacted fixture responses to cover unsupported facts, broad unsafe/non-display patterns, route/action advice, mutation instructions, generated-evidence claims, expected-known/unknown behavior, duplicate/empty fields, raw path/session path, secret-looking text, prompt/transcript text, and safe paraphrase.
- When explicitly authorized inside the execution run, local/open model outputs may be evaluated only through safe diagnostics that omit raw text and raw prompt content.
- Produce an evidence dossier and artifacts showing per-field/rule taxonomy and privacy checks.

Out of scope:

- Changing product acceptance semantics, prompt/schema shape, model display behavior, renderer layout, or timeout policy.
- Hosted model calls or hosted output inspection.
- New model downloads, runtime installs/upgrades, non-loopback endpoints, telemetry, custom forks, or dependency changes.
- Persisting raw prompts, raw model output, raw local paths, private Pi sessions, stack traces, transcripts, provider logs, secrets, credentials, or unredacted excerpts.
- Opening downstream comprehension validation, dogfood collection, classifier work, route ranking, or product integration.

Likely first Ralph run:

- Read this ticket, parent plan, spec requirements/scenarios, GPT-5.5 evidence/audit, small-model evidence/audit, and source seam.
- Set status active.
- Implement or artifact-build the smallest diagnostic surface that preserves current display behavior.
- Add focused tests and evidence artifacts under `.loom/evidence/artifacts/20260602-flight-learn-card-copy-validator-diagnostics/`.
- Move to review with evidence ready for audit.

Stop conditions:

- Stop if diagnosing accurately would require raw private/model/prompt text in Loom.
- Stop if the diagnostic change would alter product accept/reject behavior; route that to the repair ticket instead.
- Stop if hosted calls or credential changes seem necessary.
- Stop if the needed source change is broader than validation diagnostics.

## Acceptance

- ACC-001: Diagnostic output is structured and privacy-safe.
  - Evidence: tests and artifacts show diagnostic records include field/rule/category/length/hash metadata without raw prompts, raw model output, private paths, secrets, transcripts, or stack traces.
  - Audit: challenge accidental leakage and whether rule/category names are specific enough to guide repair.

- ACC-002: Product behavior remains unchanged.
  - Evidence: focused tests compare existing accepted/rejected/fallback behavior before/after or otherwise prove the new diagnostic path does not affect `buildFlightLearnDiagnosisViewWithLocalPolish` product decisions.
  - Audit: challenge hidden semantic changes under the label of diagnostics.

- ACC-003: Rejection taxonomy covers known risk classes.
  - Evidence: fixture cases exercise unsupported facts, hard unsafe/privacy/action/mutation/generated-evidence/provenance leaks, expected behavior support, duplicate/empty/low-information fields, and safe paraphrase.
  - Audit: challenge missing classes that would make the next repair ticket guess.

- ACC-004: Checks and evidence are complete enough for repair planning.
  - Evidence: focused tests, typecheck/build as practical, scoped `git diff --check`, privacy scan, source diff summary, and evidence dossier pass or record blockers.
  - Audit: required before the contract-repair ticket relies on this diagnostic result.

## Current State

Closed as diagnostic-only work. The bounded implementation run added `diagnoseLocalDiagnosisPolishResponse(...)`, focused tests, and privacy-safe evidence artifacts without changing product display/acceptance behavior. Audit `audit:20260602-flight-learn-card-copy-validator-diagnostics-review` returned `clear`, with no material findings, and recommended unblocking the successor contract-repair ticket.

Evidence: `evidence:20260602-flight-learn-card-copy-validator-diagnostics`.
Audit: `audit:20260602-flight-learn-card-copy-validator-diagnostics-review`.

## Journal

- 2026-06-02: Created as first child ticket of `plan:20260602-flight-learn-prompt-validator-contract-repair`.
- 2026-06-02: Set status to active and launched bounded diagnostic implementation run.
- 2026-06-02: Added privacy-safe validator diagnostic path, focused tests, taxonomy artifact, and evidence dossier; moved ticket to review.
- 2026-06-02: Audit `audit:20260602-flight-learn-card-copy-validator-diagnostics-review` returned `clear`. Closed as diagnostic-only work; successor contract-repair ticket may open from this evidence.
