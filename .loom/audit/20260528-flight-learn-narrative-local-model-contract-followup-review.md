# Flight Learn Narrative Local Model Contract Follow-up Review

ID: audit:20260528-flight-learn-narrative-local-model-contract-followup-review
Type: Audit
Status: recorded
Created: 2026-05-28
Updated: 2026-05-28
Audited: 2026-05-28
Target: ticket:20260528-flight-learn-narrative-local-model-contract

## Summary

Ralph performed a follow-up adversarial review after fixes for `audit:20260528-flight-learn-narrative-local-model-contract-review`.

Verdict: `changes-needed`.

`FIND-003` was honestly dispositioned as a residual quality risk, but closure was still blocked because:

- `FIND-FU-001`: action advice can bypass the new imperative regex after introductory phrases/commas, e.g. `After reinstalling the package, rerun validation from a fresh shell.`
- `FIND-FU-002`: prompt/validator/corpus/evidence still disagree about internal terms; bare `delta` / `evidence` phrasing can be accepted, and the harness still had an accepted positive case with `stored delta says`.

Ralph follow-up output is preserved at:

```text
.loom/evidence/artifacts/20260528-flight-learn-narrative-local-model-contract/ralph-followup-audit-output.md
```

## Target

Review target:

- `ticket:20260528-flight-learn-narrative-local-model-contract`
- fixes made after initial changes-needed audit
- source/test/harness/evidence state for the narrative local-model contract

## Audit Scope And Lenses

Lenses:

- disposition of prior `FIND-001`, `FIND-002`, and `FIND-003`
- acceptance `ACC-001` through `ACC-005`
- under-broad and over-broad regex changes
- false positives for `expectedBehavior` imperative wording
- internal-structure echo bypasses
- evidence overclaiming

## Context And Evidence Reviewed

Ralph reported inspecting:

- `.loom/tickets/20260528-flight-learn-narrative-local-model-contract.md`
- `.loom/audit/20260528-flight-learn-narrative-local-model-contract-review.md`
- `.loom/evidence/20260528-flight-learn-narrative-local-model-contract.md`
- `.loom/evidence/artifacts/20260528-flight-learn-narrative-local-model-contract/harness-summary.json`
- `.loom/evidence/artifacts/20260528-flight-learn-narrative-local-model-contract/narrative-local-model-contract-harness-results.json`
- `.loom/evidence/artifacts/20260528-flight-learn-narrative-local-model-contract/run-narrative-local-model-contract-harness.mjs`
- `src/flight-learn-local-diagnosis-model.ts`
- `src/flight-learn-local-diagnosis-model.test.ts`
- relevant `REQ-030` through `REQ-032` / `SCN-010` lines
- git status/diff for requested tracked files

Ralph re-ran focused tests, typecheck, and `git diff --check`, and ran non-writing fake-provider probes.

## Findings

### FIND-FU-001 — Blocker — Action advice can bypass the imperative regex

The new imperative detector rejected sentence-start action advice, but still accepted action advice after an introductory phrase and comma:

```text
After reinstalling the package, rerun validation from a fresh shell.
```

Ralph also noted the detector was over-broad for descriptive nouns such as `Review churn...`.

Required follow-up: reject imperative clauses after introductory phrases, commas, and colons while preserving descriptive narrative nouns and supported imperative `expectedBehavior` text.

### FIND-FU-002 — Blocker — Internal-structure boundary remains inconsistent

The prompt forbids fact-packet structure echo and names `delta`, `signals`, `evidence`, and `bounds`, but the validator allowed bare `delta` / `evidence` phrasing, and the harness still accepted a positive case containing `stored delta says`.

Required follow-up: reconcile prompt, validator, corpus, and evidence by either rejecting bare internal terms in `whatHappened` or intentionally allowing them and narrowing the prompt/evidence. Ralph recommended explicit tests/harness cases for the chosen boundary.

## Verdict

`changes-needed`: closure is not yet supported until the follow-up blockers are resolved.

## Required Follow-up

- Fix action-advice detection for comma/colon/introductory-phrase bypasses without rejecting descriptive nouns such as `Review churn...`.
- Reconcile internal-structure vocabulary across prompt, validator, corpus, and evidence.
- Re-run focused tests, the fake-provider narrative harness, typecheck, and `git diff --check`.
- Update ticket/evidence current-state wording after the fixes.

## Residual Risk

- Token/allow-list grounding remains heuristic.
- Safe but generic low-quality prose remains a recorded quality residual risk.
- Fake-provider evidence does not prove Bonsai 4B quality, latency, or runtime behavior.

## Related Records

- `ticket:20260528-flight-learn-narrative-local-model-contract`
- `audit:20260528-flight-learn-narrative-local-model-contract-review`
- `evidence:20260528-flight-learn-narrative-local-model-contract`
