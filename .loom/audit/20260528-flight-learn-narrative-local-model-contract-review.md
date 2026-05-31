# Flight Learn Narrative Local Model Contract Review

ID: audit:20260528-flight-learn-narrative-local-model-contract-review
Type: Audit
Status: recorded
Created: 2026-05-28
Updated: 2026-05-28
Audited: 2026-05-28
Target: ticket:20260528-flight-learn-narrative-local-model-contract

## Summary

Ralph performed an adversarial review of the field-specific local-model narrative contract implementation, tests, evidence, harness artifacts, narrative corpus, and relevant spec/plan/ticket claims.

Verdict: `changes-needed`.

The audit found two blockers and one concern before closure:

- `FIND-001`: bare imperative action advice could be accepted in `whatHappened`.
- `FIND-002`: fact-packet/internal-structure echo could be accepted despite prompt instructions forbidding it.
- `FIND-003`: exact duplicate fallback was implemented, but semantically generic/no-better output remained accepted while some ticket/evidence wording implied all no-better output falls back.

Ralph audit output is preserved at:

```text
.loom/evidence/artifacts/20260528-flight-learn-narrative-local-model-contract/ralph-audit-output.md
```

## Target

Review target:

- `ticket:20260528-flight-learn-narrative-local-model-contract`
- source changes to `src/flight-learn-local-diagnosis-model.ts`
- tests in `src/flight-learn-local-diagnosis-model.test.ts`
- evidence/harness artifacts under `.loom/evidence/artifacts/20260528-flight-learn-narrative-local-model-contract/`

## Audit Scope And Lenses

Lenses:

- acceptance `ACC-001` through `ACC-005`
- prompt/contract correctness
- validator safety and grounding
- field-specific narrative allowance
- raw path/secret/raw command/redaction placeholder/route-action/mutation/classifier safety
- deterministic fallback/default semantics
- harness-rubric compatibility
- scope adherence
- evidence overclaiming

The review paid special attention to whether narrative connective-token allowance over-admits unsupported facts or fact-packet/internal-structure echo.

## Context And Evidence Reviewed

Ralph reported inspecting:

- `.loom/tickets/20260528-flight-learn-narrative-local-model-contract.md`
- `.loom/plans/20260528-flight-learn-4b-narrative-what-happened.md`
- `.loom/evidence/20260528-flight-learn-narrative-local-model-contract.md`
- `.loom/evidence/artifacts/20260528-flight-learn-narrative-local-model-contract/harness-summary.json`
- `.loom/evidence/artifacts/20260528-flight-learn-narrative-local-model-contract/narrative-local-model-contract-harness-results.json`
- `.loom/evidence/artifacts/20260528-flight-learn-narrative-local-model-contract/run-narrative-local-model-contract-harness.mjs`
- `.loom/evidence/artifacts/20260528-flight-learn-narrative-rubric-corpus/narrative-what-happened-eval-corpus.v1.json`
- `.loom/specs/flight-learn-inbox-ux.md` with `REQ-030` through `REQ-032` / `SCN-010`
- `src/flight-learn-local-diagnosis-model.ts`
- `src/flight-learn-local-diagnosis-model.test.ts`
- git diff/status for requested paths

Ralph also re-ran focused tests, typecheck, and `git diff --check`, and ran small read-only fake-provider reproductions for adversarial cases.

## Findings

### FIND-001 — Blocker — Imperative action advice can be accepted in `whatHappened`

The validator did not reject sentence-start imperative action advice such as:

- `Rerun validation from a fresh project shell after reinstalling the package.`
- `Run validation from a fresh project shell after reinstalling the package.`
- `Review the result and rerun validation from a fresh shell.`
- `Keep validating from a fresh shell.`

Ralph reproduced these as accepted (`usedLocalModel: true`, `fallbackReason: null`) against a validation/stale-shell fact packet. This challenged `ACC-002`, the parent plan's route/action boundary, and `REQ-032` display-only safety.

Required follow-up: add validation/tests for bare imperative action advice in `whatHappened` while preserving non-imperative narrative wording such as “validation was rerun.”

### FIND-002 — Blocker — Validator accepts fact-packet/internal-structure echo that the prompt forbids

The prompt forbids echoing or summarizing fact-packet structure, but the validator accepted narrative phrasing such as:

- `The fact packet shows the delta summary, evidence, and headline all point to the same pattern.`
- `The stored delta and evidence summary support the headline, and the fact packet keeps the exact details bounded.`

This would leak implementation language into the operator-facing narrative and contradicted the prompt/contract.

Required follow-up: reject fact-packet/internal-structure echo and add tests/harness coverage.

### FIND-003 — Concern — “no-better than deterministic/headline” handling is narrower than the ticket/evidence claim

The implementation rejected exact normalized duplicates of deterministic headline/`whatHappened`, but it did not reject semantically generic safe prose. The harness accepted `NARR-EVAL-015` as `accepted-narrative-worse`, matching the corpus, while evidence wording said duplicate/no-useful output falls back.

Required follow-up: either strengthen validation to reject semantically no-better generic narratives or narrow ticket/evidence claims and record this as a residual quality risk.

## Verdict

`changes-needed`: follow-up is required before the ticket can honestly close.

## Required Follow-up

- Fix `FIND-001` and add tests/harness exercises.
- Fix `FIND-002` and add tests/harness exercises.
- Disposition `FIND-003` by validation change or claim/evidence narrowing.
- Re-run focused tests, typecheck, `git diff --check`, and the fake-provider narrative corpus harness.

## Residual Risk

- The grounding validator remains token/allow-list based.
- Synthetic/fake-provider evidence does not prove Bonsai 4B quality, latency, or safety.
- UI integration should not depend on this contract until findings are resolved.

## Related Records

- `ticket:20260528-flight-learn-narrative-local-model-contract`
- `evidence:20260528-flight-learn-narrative-local-model-contract`
- `plan:20260528-flight-learn-4b-narrative-what-happened`
- `spec:flight-learn-inbox-ux#REQ-030`
- `spec:flight-learn-inbox-ux#REQ-031`
- `spec:flight-learn-inbox-ux#REQ-032`
- `spec:flight-learn-inbox-ux#SCN-010`
