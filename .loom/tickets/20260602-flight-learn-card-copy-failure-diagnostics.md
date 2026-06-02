# Flight Learn Card Copy Failure Diagnostics

ID: ticket:20260602-flight-learn-card-copy-failure-diagnostics
Type: Ticket
Status: closed
Created: 2026-06-02
Updated: 2026-06-02
Risk: medium - this gathers model/runtime diagnostics over synthetic/redacted data and must avoid persisting raw model output or private artifacts.
Priority: high - this is the first repair slice after the negative runtime gate.

## Summary

Diagnose why the current Bonsai 4B Q1_0 all-field `/flight-learn` card-copy path fails product gates. The last replay proved the aggregate failure shape, but not the field-level cause: 0/8 product gate passes, 5 unsafe-output rejections, and 3 timeouts. This ticket should produce a privacy-safe diagnostic evidence packet that identifies likely repair targets before any product prompt, schema, or validator code changes.

Single closure claim: the project has a safe, actionable failure taxonomy for the current card-copy path, or an honest blocker explaining why field-level diagnosis cannot be gathered without violating privacy/runtime boundaries.

## Related Records

- `plan:20260602-flight-learn-model-enabled-comprehension-repair` - parent repair plan and sequencing.
- `ticket:20260531-flight-learn-llm-card-copy-runtime-replay` - closed negative replay being diagnosed.
- `audit:20260531-flight-learn-llm-card-copy-runtime-replay-review` - confirms this should close as negative evidence and route to repair/operator decision.
- `evidence:20260531-flight-learn-llm-card-copy-runtime-replay` - aggregate metrics and render artifacts from the failed real runtime path.
- `spec:flight-learn-inbox-ux` REQ-033 through REQ-048 and SCN-011 through SCN-015 - behavior and trust-boundary requirements diagnostics must preserve.
- `src/flight-learn-local-diagnosis-model.ts` - fact-packet, prompt, validation, fallback, and display-state seam to inspect read-only.
- `src/flight-learn-llama-cpp-adapter.ts` - JSON-schema adapter seam to inspect read-only.

## Scope

In scope:

- Inspect current source and prior replay artifacts.
- Build an artifact-local diagnostic harness if needed.
- Use synthetic/redacted cases only.
- Classify per-case and per-field failure categories such as timeout, schema shape, unknown fact ID, unsupported cited fact, expected-behavior invention, field-local unsafe phrase, route/action advice, mutation instruction, privacy/path/prompt leakage, low-information omission, or validator false-positive candidate.
- When explicitly authorized for execution, run the already available Bonsai 4B Q1_0 local runtime on loopback only. If runtime authorization, availability, checksum, or loopback safety is absent, record `real-runtime-not-run` and diagnose from existing artifacts/source only.
- Persist only metrics, categories, and sanitized/redacted examples that pass privacy scan. Prefer no raw output snippets; if a short sanitized snippet is necessary to support a finding, redact before writing and record the redaction rule.

Out of scope:

- Product source, tests, docs, package files, configuration, or spec changes.
- Prompt/schema/validator implementation changes.
- New model downloads, new runtimes, hosted calls, non-loopback endpoints, telemetry, installs, or custom forks.
- Raw private Pi sessions, raw local paths, secrets, prompts, transcripts, stack traces, raw server logs, or unredacted model output in Loom.
- Operator comprehension validation, dogfood corpus collection, classifier claims, route ranking, or artifact/source/Loom mutation.

Likely first Ralph run:

- Read this ticket, parent plan, runtime replay dossier/audit, and relevant source seams.
- Create `.loom/evidence/artifacts/20260602-flight-learn-card-copy-failure-diagnostics/` with an artifact-local harness if needed.
- If real runtime is authorized at launch and safe, run a small synthetic/redacted replay that captures field-level categories without persisting raw output.
- Write `evidence:20260602-flight-learn-card-copy-failure-diagnostics` and update this ticket to review or blocked.

Stop conditions:

- Stop if diagnosis requires changing product source.
- Stop if useful diagnosis requires persisting raw prompts, raw model output, raw server logs, private sessions, or unredacted local artifacts.
- Stop if real runtime requires a new download/install/provider or cannot be bound loopback-only.
- Stop if failures are genuine unsafe/action-advice/privacy leakage; do not soften those into repair targets.

## Acceptance

- ACC-001: Diagnostic corpus and runtime status are honest.
  - Evidence: evidence dossier/artifact index records synthetic/redacted case coverage and states whether real Bonsai runtime ran, with safe provenance or an explicit not-run reason.
  - Audit: challenge sample cherry-picking, runtime authorization, and any overclaim based on source-only diagnosis.

- ACC-002: Field-level failure taxonomy is recorded.
  - Evidence: artifacts summarize per-case and per-field categories without raw private data or unredacted model output.
  - Audit: challenge whether categories are actionable enough for the next prompt/schema variant ticket.

- ACC-003: Repair targets are distinguished from non-negotiable safety failures.
  - Evidence: dossier separates possible prompt/schema/timeout/validator-overreach issues from true unsafe/action-advice/privacy/mutation behavior that must remain fail-closed.
  - Audit: challenge any recommendation that would weaken safety or source-of-truth gates.

- ACC-004: No product behavior changes occur.
  - Evidence: scoped `git diff --check`, status/fingerprint or source-side-effect scan showing only allowed Loom/evidence/artifact writes.
  - Audit: challenge accidental source/test/config edits or hidden dependency changes.

- ACC-005: Privacy boundary holds.
  - Evidence: privacy scan over artifacts/evidence/ticket with zero findings; raw logs/output/prompts are not persisted.
  - Audit: challenge leakage through sanitized examples, local paths, prompt markers, or server logs.

## Current State

Closed as diagnostic evidence. The bounded evidence/diagnostic run completed and recorded `evidence:20260602-flight-learn-card-copy-failure-diagnostics` with artifacts under `.loom/evidence/artifacts/20260602-flight-learn-card-copy-failure-diagnostics/`. Audit `audit:20260602-flight-learn-card-copy-failure-diagnostics-review` returned `clear` and confirmed this ticket can close as a bounded diagnostic result.

Real Bonsai 4B Q1_0 ran through loopback-only `llama-server`; checksum matched the expected Bonsai 4B checksum; no downloads, installs, hosted calls, non-loopback endpoints, telemetry, custom forks, raw prompts, raw model responses, raw server logs, private sessions, raw local paths, secrets, transcripts, or stack traces were persisted.

Diagnostic result: 8 synthetic/redacted cases, 0/8 product gate passes, 6/8 timeouts, 2/8 unsafe-output fallbacks, and only 2/8 raw responses observed before timeout. Field taxonomy from the observed responses points to timeout/resource envelope as the primary repair target, with secondary targets around fact-id/citation robustness and low-information `whatHappened` output. A generated-evidence-like unsafe field and unknown fact ID citation were identified as non-negotiable fail-closed boundaries.

Product source remained read-only; source fingerprint scan passed. Final scoped diff/privacy checks and audit are recorded. Downstream variant work may proceed only as artifact-local same-model experiments; this ticket does not justify product source repair, gate relaxation, longer timeout defaults, or comprehension validation.

## Journal

- 2026-06-02: Created as the first child ticket of `plan:20260602-flight-learn-model-enabled-comprehension-repair` after the operator selected the repair path for model-enabled comprehension.
- 2026-06-02: Set status to active. Operator authorized use of the existing local Bonsai 4B Q1_0 loopback runtime for this repair plan under the no-download/no-install/no-hosted-call boundary.
- 2026-06-02: Completed bounded diagnostics. Evidence recorded at `evidence:20260602-flight-learn-card-copy-failure-diagnostics`; real Bonsai runtime ran locally and produced 0/8 product gate passes, 6 timeouts, and 2 unsafe-output fallbacks. Moved ticket to review pending audit.
- 2026-06-02: Audit `audit:20260602-flight-learn-card-copy-failure-diagnostics-review` returned clear. Closed ticket as diagnostic evidence and unblocked artifact-local same-model variant work.
