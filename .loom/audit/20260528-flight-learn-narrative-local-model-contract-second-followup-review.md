# Flight Learn Narrative Local Model Contract Second Follow-up Review

ID: audit:20260528-flight-learn-narrative-local-model-contract-second-followup-review
Type: Audit
Status: recorded
Created: 2026-05-28
Updated: 2026-05-28
Audited: 2026-05-28
Target: ticket:20260528-flight-learn-narrative-local-model-contract

## Summary

Ralph performed a second follow-up review after fixes for `audit:20260528-flight-learn-narrative-local-model-contract-followup-review`.

Verdict: `changes-needed`.

The review found the first follow-up examples were fixed, but two blocker classes remained:

- `FIND-SFU-001`: article-bearing, `validate`, and unpunctuated introductory phrase imperatives could still be accepted in `whatHappened`.
- `FIND-SFU-002`: prompt/validator/corpus/evidence still disagreed about internal/meta language, especially bare `headline` and `evidence` wording.

Ralph output is preserved at:

```text
.loom/evidence/artifacts/20260528-flight-learn-narrative-local-model-contract/ralph-second-followup-audit-output.md
```

## Target

Review target:

- `ticket:20260528-flight-learn-narrative-local-model-contract`
- second fix attempt after initial and first follow-up changes-needed audits
- source/test/harness/evidence state for narrative local-model contract

## Audit Scope And Lenses

Lenses:

- prior finding disposition
- imperative action-advice bypasses after commas/colons and without punctuation
- false positive descriptive `Review` noun handling
- supported `expectedBehavior` imperative wording
- internal `delta`/fact-packet/JSON/signal/headline echo handling
- corpus/evidence consistency
- acceptance/evidence overclaiming

## Context And Evidence Reviewed

Ralph reported inspecting:

- ticket, initial audit, first follow-up audit
- local-model evidence dossier
- rubric corpus evidence
- harness summary/results/script
- narrative corpus
- `src/flight-learn-local-diagnosis-model.ts`
- `src/flight-learn-local-diagnosis-model.test.ts`
- relevant spec requirements
- relevant git status/diff

Ralph ran focused tests, typecheck, `git diff --check`, and non-writing fake-provider probes.

## Findings

### FIND-SFU-001 — Blocker — `whatHappened` action advice still bypasses after articles, alternate verbs, and unpunctuated introductory phrases

Ralph reproduced accepted action advice for examples such as:

```text
After reinstalling the package, rerun the validation from a fresh shell.
After the same pattern repeated: run the validation from a fresh shell.
Validate from a fresh shell after reinstalling the package.
After reinstalling the package, validate from a fresh shell.
After reinstalling the package rerun validation from a fresh shell.
```

Required follow-up: expand `whatHappened` action-advice detection for article-bearing action phrases, `validate`, and introductory-phrase imperatives, while preserving descriptive nouns and supported `expectedBehavior` imperatives.

### FIND-SFU-002 — Blocker — Internal/display-field echo boundary remains inconsistent for bare `headline` and `evidence`

Ralph observed that the prompt still forbade `evidence`, while the validator/corpus accepted ordinary evidence phrasing; bare `headline` meta-language was also accepted.

Required follow-up: choose and record the intended boundary. Either reject `evidence` or permit generic operator-facing `evidence` wording while forbidding internal field/structure echo; reject or explicitly justify bare `headline` meta-language.

## Verdict

`changes-needed`: closure is not supported until the remaining bypasses and boundary mismatch are resolved.

## Required Follow-up

- Fix remaining action-advice bypasses and add tests/harness exercises.
- Reconcile prompt/validator/corpus/evidence boundary for `evidence` and `headline` wording.
- Re-run focused tests, harness, typecheck, and `git diff --check`.
- Update evidence and ticket current state before another follow-up review.

## Residual Risk

- Token/allow-list grounding remains heuristic.
- Fake-provider evidence does not prove Bonsai 4B quality or runtime behavior.
- Safe but generic prose remains an accepted quality residual risk.

## Related Records

- `ticket:20260528-flight-learn-narrative-local-model-contract`
- `audit:20260528-flight-learn-narrative-local-model-contract-review`
- `audit:20260528-flight-learn-narrative-local-model-contract-followup-review`
- `evidence:20260528-flight-learn-narrative-local-model-contract`
