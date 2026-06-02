# Flight Learn Card Copy Validator Contract Repair

ID: ticket:20260602-flight-learn-card-copy-validator-contract-repair
Type: Ticket
Status: closed
Created: 2026-06-02
Updated: 2026-06-02
Risk: high - this changes the prompt/schema/validator contract that controls whether model-authored card copy may render in `/flight-learn`.
Priority: high - current evidence implicates the contract, but repair must not weaken hard safety/source-of-truth gates.
Depends On: ticket:20260602-flight-learn-card-copy-validator-diagnostics

## Summary

Repair the `/flight-learn` local model card-copy prompt/schema/validator contract according to the updated behavior spec and diagnostic evidence. The repair should distinguish hard card-level safety failures from field-local non-safety omissions, reduce all-field burden, and avoid brittle token-whitelist rejection of useful paraphrase while preserving deterministic fallback and source-of-truth boundaries.

Single closure claim: the product validator/prompt contract has been repaired narrowly so safe grounded model-authored card copy can pass when appropriate, unsafe or source-of-truth-violating output still fails closed, and tests/evidence prove the boundary.

## Related Records

- `plan:20260602-flight-learn-prompt-validator-contract-repair` - parent strategy and sequencing.
- `ticket:20260602-flight-learn-card-copy-validator-diagnostics` - prerequisite rejection taxonomy and diagnostic evidence.
- `spec:flight-learn-inbox-ux` REQ-049 through REQ-054 and SCN-016 through SCN-018 - behavior contract this ticket implements.
- `evidence:20260602-flight-learn-gpt55-hosted-sanity-check` and `audit:20260602-flight-learn-gpt55-hosted-sanity-check-review` - diagnostic evidence that current prompt/validator path rejects frontier schema-compatible output 8/8.
- `evidence:20260602-flight-learn-small-model-batch-eval` and `audit:20260602-flight-learn-small-model-batch-eval-review` - local small-model evidence and SmolLM2 safety signal.
- `src/flight-learn-local-diagnosis-model.ts` - likely prompt, fact-packet, validator, fallback, display-state write seam.
- `src/flight-learn-llama-cpp-adapter.ts` - possible schema update seam if response shape changes.
- `src/flight-learn-local-diagnosis-model.test.ts` and `src/flight-learn-llama-cpp-adapter.test.ts` - likely focused tests.
- `src/flight-learn-inbox.ts` and `src/flight-learn-inbox.test.ts` - read first; write only if display-state/card-copy assumptions change.

## Scope

In scope:

- Repair prompt/schema/validation semantics so model output may render when safe core fields pass even if optional non-safety fields are omitted or replaced by deterministic wording.
- Keep hard safety failures card-level fail-closed: privacy leaks, raw paths/session paths, secrets, prompt/transcript text, route/action advice, artifact/source/Loom/rule/skill/prompt mutation instructions, generated-evidence claims, classifier/ranking claims, and internal provenance/debug leakage.
- Make support validation less brittle by rejecting concrete unsupported facts rather than ordinary paraphrase, compression, cautious connection, and domain synonyms.
- Preserve fact-bound expected behavior; unknown expected behavior stays unknown and editable.
- Preserve evidence as deterministic source material; model evidence summaries are display-only and cannot replace refs.
- Add/update focused tests for positive safe paraphrase and negative hard-safety cases.
- Record implementation evidence and route to audit.

Out of scope:

- Hosted provider support in product, hosted defaults, or OpenAI integration.
- New model families, downloads, runtime installs/upgrades, non-loopback endpoints, telemetry, custom forks, dependency changes, or default-enabling local models.
- Broad renderer redesign, command-surface changes, storage/schema migrations, route ranking, classifier automation, dogfood collection, artifact application, or source/docs/Loom/rule/skill/prompt mutation from model text.
- Changing operator comprehension-validation criteria or opening that validation ticket directly.
- Persisting raw model output, raw prompts, raw private sessions, secrets, stack traces, transcripts, provider logs, or unredacted local paths in Loom evidence.

Likely first Ralph run:

- Start only after `ticket:20260602-flight-learn-card-copy-validator-diagnostics` closes with audit.
- Read prerequisite evidence/audit, parent plan, spec requirements/scenarios, source seams, and existing tests.
- Set status active.
- Implement one coherent contract repair; avoid speculative cleanup.
- Write evidence under `.loom/evidence/20260602-flight-learn-card-copy-validator-contract-repair.md` with artifacts under `.loom/evidence/artifacts/20260602-flight-learn-card-copy-validator-contract-repair/`.
- Move to review pending audit.

Stop conditions:

- Stop if prerequisite diagnostics are missing or ambiguous enough that the repair would guess.
- Stop if repair requires weakening hard safety/privacy/source-of-truth gates.
- Stop if product changes grow beyond prompt/schema/validator/display-state semantics.
- Stop if intended behavior seems to conflict with `spec:flight-learn-inbox-ux`; return to spec shaping before implementation.
- Stop if a runtime/model/provider change appears necessary; route back to plan/operator authorization.

## Acceptance

- ACC-001: Hard-vs-field-local validation is implemented.
  - Evidence: tests show hard unsafe/privacy/action/mutation/generated-evidence/internal-provenance failures still produce deterministic fallback, while unsupported/empty/duplicate/low-information optional fields can be omitted or replaced without erasing safe supported core model copy.
  - Audit: challenge accidental safety relaxation or confusing partial-display semantics.

- ACC-002: Support validation accepts safe paraphrase and rejects concrete hallucination.
  - Evidence: fixture tests show ordinary paraphrase/synonyms/cautious connective wording pass when grounded, while unsupported concrete events, counts, files, commands, actors, routes, mutations, or evidence claims fail.
  - Audit: challenge both over-permissive and token-whitelist brittle behavior.

- ACC-003: Prompt/schema changes reduce all-field burden without changing trust boundaries.
  - Evidence: tests or prompt snapshots show allowed omissions/field jobs are clear, expected behavior remains fact-bound, evidence remains display-only, and no route/storage/source/classifier authority is introduced.
  - Audit: challenge broad prompt churn or hidden product-scope changes.

- ACC-004: Existing product behavior remains safe and observable.
  - Evidence: focused tests cover accepted model-enabled copy, deterministic fallback for timeout/malformed/unsafe/unsupported hard failures, display-state/narrative status where applicable, typecheck/build/full tests as practical, and scoped `git diff --check`.
  - Audit: challenge skipped validation and stale generated artifacts.

- ACC-005: Evidence and audit support closure.
  - Evidence: implementation evidence dossier includes command outputs, render snapshots if display behavior changes, privacy scan, source diff summary, and audit.
  - Audit: required before closure.

## Current State

Closed. Bounded implementation/evidence run completed. Source changes repair hard-vs-field-local validation, reduce all-field burden in the prompt, keep expected behavior fact-bound, keep unsafe/source-of-truth failures card-level fail-closed, and add focused tests. Evidence recorded at `evidence:20260602-flight-learn-card-copy-validator-contract-repair`. Audit `audit:20260602-flight-learn-card-copy-validator-contract-repair-review` returned `clear` and supports unblocking the repaired local/open runtime replay ticket only.

## Journal

- 2026-06-02: Created as second child ticket of `plan:20260602-flight-learn-prompt-validator-contract-repair`; blocked pending privacy-safe validator diagnostics.
- 2026-06-02: Unblocked after `ticket:20260602-flight-learn-card-copy-validator-diagnostics` closed with clear audit and privacy-safe diagnostic evidence.
- 2026-06-02: Set status to active and launched bounded contract-repair implementation run.
- 2026-06-02: Implementation and evidence completed; focused tests, typecheck, build, full tests, scoped diff check, and privacy scan passed. Moved to review pending audit.
- 2026-06-02: Audit `audit:20260602-flight-learn-card-copy-validator-contract-repair-review` returned `clear`; closed ticket and unblocked repaired local/open replay. This does not unblock operator comprehension validation.
