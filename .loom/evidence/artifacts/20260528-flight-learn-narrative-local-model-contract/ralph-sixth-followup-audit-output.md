# Ralph Sixth Follow-up Audit: Narrative Local Model Contract

Target: `ticket:20260528-flight-learn-narrative-local-model-contract`  
Audit date: 2026-05-28  
Verdict: `changes-needed`

## Review

- Correct: The exact fifth-follow-up examples for `FIND-5FU-001` are now rejected. Source includes `now|next` prefix handling and `for|during|to` introductory action detection in `src/flight-learn-local-diagnosis-model.ts:184-186`; focused tests cover `Now rerun...`, `For validation use...`, `During validation use...`, and `To validate ... use ...` at `src/flight-learn-local-diagnosis-model.test.ts:219-222`; my non-writing probes returned `usedLocalModel:false`, `fallbackReason:"unsafe-output"` for all four.
- Correct: The exact fifth-follow-up all-caps `PROBLEM(S)` examples are now rejected. Source rejects exact `Problem|Problems|PROBLEM|PROBLEMS` at `src/flight-learn-local-diagnosis-model.ts:181`; focused tests cover title/all-caps variants at `src/flight-learn-local-diagnosis-model.test.ts:259-265`; my probes confirmed `The Problems...` and `The PROBLEMS...` fall back as `unsafe-output`.
- Correct: The intended false-positive guards still hold in inspected source/tests/probes: descriptive `Review churn...`, descriptive `Use of...`, and supported imperative `expectedBehavior` are accepted in tests at `src/flight-learn-local-diagnosis-model.test.ts:230-246`. My probes also accepted passive/descriptive `Validation was rerun...`, generic `The stored evidence points...`, and supported `expectedBehavior: "Run validation from a fresh project shell after reinstalling the package."`.
- Correct: Stored-evidence allowance is now internally consistent for the inspected positive path: the prompt permits generic stored evidence at `src/flight-learn-local-diagnosis-model.ts:581`, the focused test accepts `The stored evidence points...` at `src/flight-learn-local-diagnosis-model.test.ts:272-276`, and the evidence dossier documents that boundary at `.loom/evidence/20260528-flight-learn-narrative-local-model-contract.md:103`.
- Correct: Corpus/evidence consistency improved: the prior `stored delta` positive example is now `stored facts` in `NARR-EVAL-005` at `.loom/evidence/artifacts/20260528-flight-learn-narrative-rubric-corpus/narrative-what-happened-eval-corpus.v1.json:1037`; the safe generic/no-better case remains explicitly `accepted` but `accepted-narrative-worse` at corpus lines `2600-2605`, matching the narrowed evidence claim at `.loom/evidence/20260528-flight-learn-narrative-local-model-contract.md:108`.
- Blocker: `FIND-6FU-001` below. Action-advice variants still bypass `whatHappened` validation.
- Blocker: `FIND-6FU-002` below. Mixed-case `Problem` display-label/meta echo still bypasses validation.
- Note: I did not re-run `run-narrative-local-model-contract-harness.mjs` because the script writes `harness-summary.json` and `narrative-local-model-contract-harness-results.json`; under the no-edit constraint I inspected the existing harness artifacts and ran non-writing fake-provider probes instead.

## Findings

### FIND-6FU-001 — Blocker — Action advice still bypasses after unlisted leading connective/prepositional phrases

`FIND-5FU-001` is resolved for its exact examples, but the action-advice class is not closed. The validator only checks imperative clauses at clause start or after an introductory pattern limited to `after|before|when|once|if|because|for|during|to` (`src/flight-learn-local-diagnosis-model.ts:184-186`) after splitting only on sentence punctuation, semicolon, colon, or comma (`src/flight-learn-local-diagnosis-model.ts:784-789`). No-comma leading forms using other connectives/prepositions can remain one clause and pass into token support.

Non-writing fake-provider probes against a validation/stale-shell fact packet reproduced accepted unsafe `whatHappened` output:

```text
While validating use a fresh shell after reinstalling the package.
=> usedLocalModel:true, fallbackReason:null

In validation use a fresh shell after reinstalling the package.
=> usedLocalModel:true, fallbackReason:null
```

Both are imperative action advice, not retrospective narrative description, and challenge `ACC-002` plus `REQ-032`'s display-only boundary (`.loom/specs/flight-learn-inbox-ux.md:114`). The existing tests cover nearby forms but not these bypasses (`src/flight-learn-local-diagnosis-model.test.ts:219-222`), and the harness exercises include `now`, `for`, and `to` but not these variants (`.loom/evidence/artifacts/20260528-flight-learn-narrative-local-model-contract/run-narrative-local-model-contract-harness.mjs:257-259`).

### FIND-6FU-002 — Blocker — Mixed-case `Problem` display-label/meta echo still bypasses validation

`FIND-5FU-002` is resolved for exact all-caps `PROBLEM(S)`, but case-variant display-label echo is not closed. The forbidden pattern only names exact `Problem`, `Problems`, `PROBLEM`, and `PROBLEMS` (`src/flight-learn-local-diagnosis-model.ts:181`). A mixed-case display-label echo is accepted:

```text
The ProBleM points to the same stale shell pattern.
=> usedLocalModel:true, fallbackReason:null
```

This conflicts with the ticket/evidence claim that case-variant `Problem` echo falls back (`.loom/tickets/20260528-flight-learn-narrative-local-model-contract.md:87`; `.loom/evidence/20260528-flight-learn-narrative-local-model-contract.md:58,108`). It should be rejected as display-label/meta echo while preserving ordinary lower-case `problem` prose.

## Acceptance Verdict

- `ACC-001`: Supported within inspected scope. The prompt is field-specific and display-only (`src/flight-learn-local-diagnosis-model.ts:575-583`).
- `ACC-002`: **Cannot close.** `FIND-6FU-001` and `FIND-6FU-002` still admit unsafe action advice / meta echo variants.
- `ACC-003`: Supported within inspected scope by default/fallback/no-mutation tests and source shape; I found no storage/routing side effects.
- `ACC-004`: Existing corpus harness compatibility is supported by the recorded 15-case, zero-mismatch summary (`harness-summary.json:25-53`), but the harness should add the new bypass probes after fixes so the evidence does not overclaim coverage.
- `ACC-005`: Focused Vitest, typecheck, and `git diff --check` passed in this audit run; closure remains blocked by `ACC-002`.

## Required Follow-up

1. Extend `whatHappened` action-advice detection for no-comma leading connective/prepositional forms such as `while validating use...` and `in validation use...`, or otherwise reject equivalent display instructions without blocking descriptive/passive narratives.
2. Reject mixed-case `Problem(s)` display-label/meta echo while preserving ordinary lower-case `problem/problems` prose.
3. Add focused tests and harness exercises for the two new blocker classes, plus regression guards for `Use of...`, passive/descriptive wording, supported `expectedBehavior`, and generic `stored evidence`.
4. Re-run focused Vitest, the fake-provider harness when edits are allowed, `npm run typecheck`, and `git diff --check`.
5. Update ticket/evidence wording after fixes; current prose overclaims action-advice and case-variant coverage.

## Residual Risk

- The validator remains regex/token-support heuristic; further adversarial variants may exist.
- Fake-provider evidence does not prove real Bonsai 4B quality, latency, or runtime behavior.
- Safe generic/no-better prose remains intentionally accepted as a rubric-level quality residual risk, not a runtime safety fallback.

## Inspected Context

Records/artifacts/files inspected: ticket, initial through fifth follow-up audit records, prior Ralph audit output summaries, evidence dossier, harness summary/results/script, narrative corpus, relevant spec requirements, `src/flight-learn-local-diagnosis-model.ts`, `src/flight-learn-local-diagnosis-model.test.ts`, and relevant git diff/status.

Commands run:

```bash
npm test -- src/flight-learn-local-diagnosis-model.test.ts   # passed, 19 tests
npm run typecheck                                           # passed
git diff --check                                            # passed, no output
node --import tsx - <<'NODE' ... non-writing fake-provider probes ...
```

No source files were edited during this audit.
