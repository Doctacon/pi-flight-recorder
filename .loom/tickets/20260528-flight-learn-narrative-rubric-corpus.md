# Flight Learn Narrative Rubric Corpus

ID: ticket:20260528-flight-learn-narrative-rubric-corpus
Type: Ticket
Status: closed
Created: 2026-05-28
Updated: 2026-05-28
Risk: medium - a weak narrative rubric would either reject useful Bonsai 4B prose or admit unsupported facts into a privacy-sensitive UI.
Priority: high - first execution unit for `plan:20260528-flight-learn-4b-narrative-what-happened`.

## Summary

Create a narrative-specific corpus and rubric for `/flight-learn` `What happened?` local-model output. The single closure claim is: future implementation can judge whether a model-generated `What happened?` is useful narrative, grounded, privacy-safe, and distinct from the `Problem` headline without using the old deterministic-equivalence rubric.

This ticket is shaping/evaluation infrastructure only. It must not edit product source or run Bonsai.

## Related Records

- `plan:20260528-flight-learn-4b-narrative-what-happened` - parent plan and sequencing.
- `spec:flight-learn-inbox-ux` REQ-030 through REQ-032 and SCN-010 - intended behavior for distinct headline/narrative sections.
- `evidence:20260528-flight-learn-narrative-what-happened-feedback` - screenshot/operator feedback motivating the work.
- `evidence:20260527-prism-ml-small-model-comparison` - prior 4B evidence showing the old rubric rejected richer paraphrases as unsupported.
- `.loom/evidence/artifacts/20260527-local-diagnosis-model-eval-corpus-rubric/diagnosis-polish-eval-corpus.v1.json` - existing diagnosis-polish corpus to reuse or extend safely.
- `src/flight-learn-diagnosis.ts` - deterministic baseline fields.
- `src/flight-learn-local-diagnosis-model.ts` - current fact-packet shape and safety validator.
- `evidence:20260528-flight-learn-narrative-rubric-corpus` - corpus/rubric artifact dossier.
- `audit:20260528-flight-learn-narrative-rubric-corpus-review` - Ralph adversarial review; verdict `clear`.

## Scope

In scope:

- Create a Loom artifact corpus/rubric for narrative `whatHappened` evaluation, likely under `.loom/evidence/artifacts/20260528-flight-learn-narrative-rubric-corpus/`.
- Include cases where deterministic `Problem` and `What happened?` are repetitive, including the screenshot-shaped repeated workflow case.
- Include positive examples of acceptable narrative connective tissue and negative/adversarial examples: unsupported concrete facts, raw command/path leakage, route/action advice, artifact/rule/ticket/source mutation, redaction-placeholder echo, overlong wall-of-text narrative, and low-information cases that should fall back.
- Define outcome categories that separate validator outcome from human/rubric usefulness, e.g. `accepted-narrative-better`, `accepted-equivalent`, `accepted-unsafe`, `fallback-expected`, `fallback-unexpected`.
- Define reviewer notes / qualitative fields for narrative quality because useful narrative cannot be judged only by token equivalence.
- Record evidence and run an adversarial audit before closure.

Out of scope:

- Editing product source, prompts, validators, UI, adapter, docs, or CLI flags.
- Starting `llama-server`, running Bonsai, downloading models, or calling hosted providers.
- Persisting raw private Pi sessions, raw local paths, secrets, stack traces, full transcripts, or unredacted prompts.
- Changing route/storage/artifact/rule semantics or command visibility.

Stop conditions:

- Stop if representative narrative cases would require preserving raw private session data.
- Stop if the rubric cannot distinguish useful narrative from unsupported concrete facts without an operator/product decision.
- Stop if the work expands into implementation tuning.

## Acceptance

- ACC-001: The corpus covers the narrative problem.
  - Evidence: artifact contains multiple cases where deterministic `Problem` and `What happened?` duplicate each other, plus expected narrative behavior.
  - Audit: challenge whether the corpus only tests happy paths.

- ACC-002: The rubric distinguishes narrative usefulness from deterministic equivalence.
  - Evidence: rubric defines accepted narrative-better/equivalent/worse/unsafe/fallback categories and requires reviewer notes for narrative quality.
  - Audit: challenge whether the rubric lets any pleasant prose pass despite unsupported facts.

- ACC-003: Safety and privacy cases are explicit.
  - Evidence: adversarial cases include raw commands/paths, secrets/redaction placeholders, route/action advice, mutation instructions, unsupported specifics, and overlong output.
  - Audit: challenge gaps in privacy/display-only boundaries.

- ACC-004: Artifacts are redacted and reusable by the next ticket.
  - Evidence: privacy scan over artifacts, all case IDs present, and documented shape that the contract implementation ticket can consume.
  - Audit: challenge any raw private data or ambiguous fields.

## Current State

Closed. The narrative-specific corpus/rubric artifacts and evidence are recorded under `evidence:20260528-flight-learn-narrative-rubric-corpus` and `.loom/evidence/artifacts/20260528-flight-learn-narrative-rubric-corpus/`. The corpus contains 15 redacted synthetic cases with schema, outcome enums, reviewer note slots, positive repetitive-headline/useful-narrative cases, adversarial safety probes, a compact summary, and a privacy scan with zero forbidden matches. ACC-001 through ACC-004 are satisfied by the evidence dossier. Audit `audit:20260528-flight-learn-narrative-rubric-corpus-review` returned `clear` with no material findings.

Closure caveats: this ticket defines the narrative evaluation target only. It does not prove Bonsai 4B quality, does not validate product prompts/validators/UI/runtime behavior, and uses a synthetic/redacted corpus with mostly one probe per adversarial category. The next ticket must turn the corpus into executable contract/validator behavior. Post-closure clarification: during the local-model contract audit follow-up, `NARR-EVAL-005` accepted narrative wording was adjusted from internal `stored delta` phrasing to operator-facing `stored facts`; case IDs, coverage, and counts did not change.

## Journal

- 2026-05-28: Created as first child ticket of `plan:20260528-flight-learn-4b-narrative-what-happened`. No implementation started.
- 2026-05-28: Set active for `/loom-driver` execution. Related records/source were read; launching bounded worker for corpus/rubric artifact creation.
- 2026-05-28: Worker created `narrative-what-happened-eval-corpus.v1.json`, `narrative-what-happened-eval-summary.v1.json`, and `privacy-scan.v1.json`; recorded `evidence:20260528-flight-learn-narrative-rubric-corpus`; JSON parse validation passed; privacy scan reported zero forbidden matches. Moved to review because ACC-001 through ACC-004 appear evidence-supported and audit is next.
- 2026-05-28: Ralph audit recorded as `audit:20260528-flight-learn-narrative-rubric-corpus-review` with verdict `clear` and no material findings. Closed ticket with caveats that the corpus is synthetic/redacted and does not prove Bonsai/product behavior.
- 2026-05-28: Post-closure clarification from downstream contract audit: changed `NARR-EVAL-005` accepted narrative wording from `stored delta` to `stored facts` to keep corpus examples aligned with the prompt/validator boundary against internal structure echo. No case IDs, coverage, or summary counts changed.
