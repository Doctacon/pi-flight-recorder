# Local Diagnosis Model Evaluation Corpus And Rubric

ID: ticket:20260527-local-diagnosis-model-eval-corpus-rubric
Type: Ticket
Status: closed
Created: 2026-05-27
Updated: 2026-05-27
Risk: medium - corpus and rubric choices determine whether later model-quality claims are meaningful or overfit to anecdotes.
Priority: high - this is the first execution unit for `plan:20260527-flight-learn-local-model-quality-evaluation`.

## Summary

Create a privacy-bounded evaluation corpus and scoring rubric for optional `/flight-learn` local-model diagnosis polish. The single closure claim is: the project has a durable, redacted set of diagnosis-polish cases and a rubric that defines useful, safe, fallback-worthy, and overclaimed model output before any real Bonsai quality run is judged.

This ticket is intentionally pre-model. It should prevent later agents from tuning against a single pleasing output or treating "valid JSON" as equivalent to operator usefulness.

## Related Records

- `plan:20260527-flight-learn-local-model-quality-evaluation` - parent plan and sequencing.
- `spec:flight-learn-inbox-ux` - REQ-024 through REQ-029 define optional local-model polish boundaries.
- `ticket:20260527-real-bonsai-local-model-validation` - proved one real Bonsai path and recorded that broad quality remains unproven.
- `evidence:20260527-real-bonsai-local-model-validation` - useful starting examples and residual limits.
- `research:20260527-local-diagnosis-model-runtime` - model/runtime constraints and rejected paths.
- `src/flight-learn-diagnosis.ts` and `src/flight-learn-local-diagnosis-model.ts` - current deterministic and local-model contract behavior to understand before selecting cases.
- `ticket:20260523-real-corpus-evaluation-and-tuning` - broader blocked corpus-evaluation context; do not claim this narrower ticket closes it.
- `evidence:20260527-local-diagnosis-model-eval-corpus-rubric` - corpus/rubric artifact evidence for this ticket.
- `audit:20260527-local-diagnosis-model-eval-corpus-rubric-review` - first audit; verdict `changes-needed`.
- `audit:20260527-local-diagnosis-model-eval-corpus-rubric-followup-review` - final follow-up audit; verdict `clear`.

## Scope

In scope:

- Inspect existing deterministic diagnosis tests, local-model tests, real Bonsai evidence, and redacted/synthetic fixture patterns.
- Define a corpus shape suitable for local diagnosis-polish evaluation: case ID, source kind, redacted stored delta fields, detector/evidence summaries, deterministic output, safety tags, expected model behavior, and notes.
- Curate representative cases using synthetic or redacted data only. Include both model-acceptable and model-rejection/fallback scenarios.
- Define a rubric for accuracy-to-evidence, clarity, concision, operator usefulness, unsupported-fact/hallucination risk, secret/path leakage, route/ranking contamination, and fallback correctness.
- Record a Loom evidence or research artifact that later harness/evaluation tickets can consume.

Out of scope:

- Running Bonsai or any real model.
- Editing product prompt, validators, adapter behavior, UI copy, storage, routing, docs, package metadata, or runtime configuration.
- Reading raw Pi sessions into Loom or persisting raw session excerpts, unredacted user paths, stack traces, prompts, secrets, or private transcripts.
- Creating classifier labels, route-ranking labels, artifact-quality labels, or any automation training set beyond diagnosis wording evaluation.
- Deciding that Bonsai is good or bad; this ticket defines how that decision will be measured.

Likely write scope:

- `.loom/evidence/20260527-local-diagnosis-model-eval-corpus-rubric.md`
- `.loom/evidence/artifacts/20260527-local-diagnosis-model-eval-corpus-rubric/`
- This ticket's Current State and Journal.

Stop conditions:

- Stop and return to the operator if representative cases require preserving raw private session content.
- Stop if the corpus definition starts depending on route classifications or artifact outcomes rather than diagnosis wording.
- Stop if the rubric would make model output authoritative over deterministic stored facts.
- Stop if a needed case exposes a behavior gap in the spec; route that to spec shaping instead of hiding it in the corpus.

## Acceptance

- ACC-001: A durable corpus artifact exists with at least ten privacy-bounded cases, or the ticket explicitly explains why fewer cases are currently honest.
  - Evidence: Loom evidence/research record plus structured artifact containing case IDs, redacted inputs, deterministic outputs, safety tags, and expected model behavior.
  - Audit: Review should challenge representativeness and whether examples are too close to one prior synthetic fixture.

- ACC-002: The corpus covers positive, neutral, and rejection/fallback cases.
  - Evidence: Case inventory includes at minimum raw-command recurrence, ownership/boundary confusion, missing expectation/low-information delta, human-authored delta, no-expectation/unsupported model-output case, redaction-sensitive path/secret-looking case, and route-contamination risk case.
  - Audit: Review should challenge whether rejected/fallback cases are strong enough to exercise validators rather than only happy paths.

- ACC-003: A scoring rubric defines useful and unsafe output without making model text source of truth.
  - Evidence: Rubric names accuracy-to-evidence, no unsupported facts, no secret/path leakage, clarity, concision, operator usefulness, fallback correctness, latency observation, and display-only boundaries.
  - Audit: Review should challenge whether the rubric rewards style over truth or allows model output to influence route/storage decisions.

- ACC-004: Privacy posture is explicit and checked.
  - Evidence: Evidence record states how raw sessions/secrets were avoided or redacted, and includes a manual or scripted scan of the saved corpus artifact for obvious local path/secret patterns.
  - Audit: Review should challenge secret/path leakage and whether private session excerpts were laundered into fixtures.

- ACC-005: The next harness ticket has a clear input contract.
  - Evidence: Corpus artifact has enough stable shape for `ticket:20260527-local-diagnosis-model-eval-harness` to consume without rediscovering case semantics from chat history.
  - Audit: Review should challenge ambiguity in fields, expected outcomes, and metric labels.

## Current State

Closed. Created `evidence:20260527-local-diagnosis-model-eval-corpus-rubric` with a 12-case privacy-bounded corpus, deterministic outputs, fact packets, expected model behavior, rubric dimensions, required coverage inventory, privacy scan, and diff-check artifact. No model runtime was started and no source/product behavior was changed. First audit returned `changes-needed`; follow-up tightened the rubric-vs-validator contract and added explicit harness outcome enums/per-case outcome contracts. Final audit `audit:20260527-local-diagnosis-model-eval-corpus-rubric-followup-review` returned `clear`.

Important limit: the corpus is synthetic/redacted and diagnosis-polish-specific. It does not prove Bonsai quality, latency, release readiness, or the broader real-corpus tuning ticket.

## Journal

- 2026-05-27: Created as the first child ticket of `plan:20260527-flight-learn-local-model-quality-evaluation`.
- 2026-05-27: Set status to active and began corpus/rubric execution. Read the parent plan, ticket, real Bonsai evidence, deterministic diagnosis tests, and local-model contract tests before writing artifacts.
- 2026-05-27: Generated `diagnosis-polish-eval-corpus.v1.json`, `corpus-summary.json`, and `privacy-scan.json`; wrote `evidence:20260527-local-diagnosis-model-eval-corpus-rubric`; moved ticket to review.
- 2026-05-27: Recorded `audit:20260527-local-diagnosis-model-eval-corpus-rubric-review` with verdict `changes-needed`. Addressed findings by separating validator outcome from rubric outcome, adding `modelOutcomeEnum` / `validatorOutcomeEnum` / `rubricRatingEnum`, adding per-case outcome contracts, and marking redaction-placeholder echo as `accepted-unsafe` if the current validator accepts it.
- 2026-05-27: Recorded `audit:20260527-local-diagnosis-model-eval-corpus-rubric-followup-review` with verdict `clear`; closed ticket with residual limits preserved.
