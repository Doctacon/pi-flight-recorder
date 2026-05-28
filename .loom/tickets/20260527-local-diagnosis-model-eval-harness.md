# Local Diagnosis Model Evaluation Harness

ID: ticket:20260527-local-diagnosis-model-eval-harness
Type: Ticket
Status: closed
Created: 2026-05-27
Updated: 2026-05-27
Risk: medium - a weak harness would make later model-quality evidence hard to trust and could hide fallback or safety failures.
Priority: high - required before real Bonsai quality evaluation is meaningful.
Depends On: ticket:20260527-local-diagnosis-model-eval-corpus-rubric

## Summary

Build or assemble a repeatable local evaluation harness for `/flight-learn` diagnosis polish. The single closure claim is: the project can run the evaluation corpus through deterministic diagnosis and through the local-model contract using fake/provider substitutes, producing structured metrics that a later real Bonsai run can compare against.

This ticket should make evaluation repeatable before real-model measurement. It is not a product tuning ticket and must not change `/flight-learn` user behavior.

## Related Records

- `plan:20260527-flight-learn-local-model-quality-evaluation` - parent plan and sequencing.
- `ticket:20260527-local-diagnosis-model-eval-corpus-rubric` - hard prerequisite; defines the corpus and rubric this harness must consume.
- `spec:flight-learn-inbox-ux` - REQ-024 through REQ-029 define local-model safety boundaries.
- `src/flight-learn-diagnosis.ts` - deterministic diagnosis baseline.
- `src/flight-learn-local-diagnosis-model.ts` - local model fact-packet, prompt, schema, timeout, validator, and fallback behavior.
- `src/flight-learn-llama-cpp-adapter.ts` - real adapter boundary; this ticket should not require it to be running.
- `package.json` - current scripts and dev dependency constraints.
- `evidence:20260527-local-diagnosis-model-eval-harness` - harness run, deterministic baseline, fake-provider exercises, privacy scan, typecheck/full-test/diff-check evidence.
- `audit:20260527-local-diagnosis-model-eval-harness-review` - first audit; verdict `changes-needed`.
- `audit:20260527-local-diagnosis-model-eval-harness-followup-review` - final follow-up audit; verdict `clear`.

## Scope

In scope:

- Implement or assemble a dev/test harness that consumes the corpus artifact from `ticket:20260527-local-diagnosis-model-eval-corpus-rubric`.
- Run deterministic diagnosis over every corpus case and emit structured baseline outputs.
- Run the local-model contract with fake providers for valid, invalid, unsafe, timeout, and fallback paths.
- Emit per-case structured results with at least: case ID, deterministic output, model/provider outcome, `usedLocalModel`, fallback reason, validation issue, latency field, redaction/safety flags, and rubric-compatible placeholders.
- Add focused tests or a documented local command so future agents can rerun the harness in an isolated environment.
- Record evidence for the deterministic baseline and fake-provider harness behavior.

Out of scope:

- Starting `llama-server`, running Bonsai, downloading models, installing runtimes, or requiring local model availability.
- Changing `/flight-learn` product UI, command registration, default behavior, route/storage semantics, artifact candidates, rules, docs, package exports, or visible command surface.
- Weakening validators, length limits, redaction, fallback, or loopback-only adapter constraints.
- Scoring Bonsai quality or deciding release posture; that belongs to the next ticket.

Likely write scope:

- A narrow dev/test harness location chosen by the implementer, such as a colocated test utility, fixture-driven test, or script.
- Corpus result artifacts under `.loom/evidence/artifacts/20260527-local-diagnosis-model-eval-harness/`.
- Evidence record `.loom/evidence/20260527-local-diagnosis-model-eval-harness.md`.
- This ticket's Current State and Journal.

Stop conditions:

- Stop if consuming the corpus would require raw/private session data.
- Stop if harness implementation would need runtime dependencies, hosted services, automatic downloads, or a persistent model server.
- Stop if the corpus shape is ambiguous enough that the harness would need to redefine expected outcomes; return to the corpus/rubric ticket.
- Stop if source changes expand into product behavior tuning rather than evaluation infrastructure.

## Acceptance

- ACC-001: The harness consumes the corpus contract without redefining the rubric.
  - Evidence: Focused test or command output over the corpus records every case ID and expected-outcome category from the corpus artifact.
  - Audit: Review should challenge whether the harness silently skips hard cases.

- ACC-002: Deterministic baseline results are recorded.
  - Evidence: Structured output artifact contains deterministic diagnosis fields for every case, plus any deterministic low-confidence/fallback notes.
  - Audit: Review should challenge whether deterministic output is being treated as perfect rather than as baseline/oracle for stored facts.

- ACC-003: Fake-provider local-model paths exercise valid, invalid, unsafe, timeout, and schema-rejected outcomes.
  - Evidence: Tests or harness artifacts show accepted model output, deterministic fallback for invalid output, fallback for unsafe/secret-looking or unsupported facts, and timeout/error fallback.
  - Audit: Review should challenge whether fake-provider proof is being mislabeled as real Bonsai proof.

- ACC-004: Metrics are structured enough for the Bonsai evaluation ticket.
  - Evidence: Per-case result shape includes acceptance/fallback status, fallback reason, validation issue, latency, redaction/safety flags, and rubric fields needed for human or scripted rating.
  - Audit: Review should challenge missing fields that would force the next ticket to reinterpret outputs manually.

- ACC-005: Validation remains healthy for any source changes.
  - Evidence: Run focused tests for the harness plus `npm run typecheck`; run `npm test` or justify if the change is Loom/artifact-only. Record `git diff --check` when source changes occur.
  - Audit: Review should challenge skipped validation or source changes outside the declared harness boundary.

## Current State

Closed. Built `.loom/evidence/artifacts/20260527-local-diagnosis-model-eval-harness/run-diagnosis-polish-eval-harness.mjs`, which consumes the 12-case corpus, validates the contract, records deterministic baselines, runs per-case fake-provider scenarios, and runs representative fake-provider exercises for valid, malformed JSON, schema-invalid, unsafe, unsupported, timeout, and provider-error paths. Evidence is recorded in `evidence:20260527-local-diagnosis-model-eval-harness`. No Bonsai/runtime/hosted provider was started and no product source behavior was changed. First audit returned `changes-needed`; follow-up added `reviewerNotes` placeholders, metric-field validation, and clarified per-case vs exercise/all hard-fail counts. Final audit `audit:20260527-local-diagnosis-model-eval-harness-followup-review` returned `clear`.

Important limit: this is fake-provider/local contract evidence only. It does not prove real Bonsai quality, latency, reliability, or JSON behavior across the corpus.

## Journal

- 2026-05-27: Created as the second child ticket of `plan:20260527-flight-learn-local-model-quality-evaluation`.
- 2026-05-27: Dependency `ticket:20260527-local-diagnosis-model-eval-corpus-rubric` closed; this ticket is now unblocked and ready to consume the corpus/rubric artifact.
- 2026-05-27: Set status to active. Read ticket, parent/corpus evidence, corpus audit, and workspace state before writing harness artifacts.
- 2026-05-27: Added repeatable `.loom/` harness artifact and ran it successfully. Recorded deterministic baseline, full structured harness results, fake-provider exercise results, privacy scan, typecheck, full tests, and diff-check in `evidence:20260527-local-diagnosis-model-eval-harness`. Moved to review.
- 2026-05-27: Recorded `audit:20260527-local-diagnosis-model-eval-harness-review` with verdict `changes-needed`. Addressed finding by adding `reviewerNotes` placeholders to results and validating emitted metric fields against `caseContract.metricFieldsExpectedFromHarness`; reran harness and refreshed evidence.
- 2026-05-27: Recorded `audit:20260527-local-diagnosis-model-eval-harness-followup-review` with verdict `clear`; closed ticket with fake-provider-only limits preserved.
