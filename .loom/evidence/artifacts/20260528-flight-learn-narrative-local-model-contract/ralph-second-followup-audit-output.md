# Ralph Second Follow-up Audit: Narrative Local Model Contract

Target: `ticket:20260528-flight-learn-narrative-local-model-contract`
Audited: 2026-05-28
Verdict: `changes-needed`

## Review

- Correct: Focused validation is still healthy for the covered cases. `npm test -- src/flight-learn-local-diagnosis-model.test.ts` passed 19 tests; `npm run typecheck` passed; `git diff --check` produced no output. Existing harness artifacts show 15 corpus cases, zero validator mismatches, zero prompt/output safety failures, and zero exercise mismatches in `harness-summary.json:7-53`.
- Correct: The specific first follow-up examples for `After reinstalling the package, rerun validation...` and `After the same pattern repeated: review the result...` are now covered in tests/harness and reject with `unsafe-output` (`src/flight-learn-local-diagnosis-model.test.ts:193-207`, `run-narrative-local-model-contract-harness.mjs:244-250`, `narrative-local-model-contract-harness-results.json:1510-1624`).
- Correct: The descriptive noun false-positive and supported `expectedBehavior` imperative boundary held in probes: `Review churn happened...` was accepted for `whatHappened`, while `expectedBehavior: "Run validation from a fresh project shell."` was accepted when the expectation was supported.
- Blocker: `FIND-FU-001` is only partially fixed; action advice still bypasses the `whatHappened` validator.
- Blocker: `FIND-FU-002` is only partially fixed; prompt/validator/corpus/evidence still disagree about internal/display-field wording, especially bare `headline` and `evidence` language.
- Note: `FIND-003` is now honestly dispositioned as an exact-duplicate fallback plus safe-generic quality residual risk, not a runtime guarantee that all no-better prose falls back.

## Findings

### FIND-SFU-001 — Blocker — `whatHappened` action advice still bypasses after articles, alternate verbs, and unpunctuated introductory phrases

Severity: high  
Confidence: high  
Disposition: open  
Challenges: `ACC-002`, prior `FIND-FU-001`

What I observed:

- The imperative detector splits on punctuation/comma and then applies an anchored clause regex (`src/flight-learn-local-diagnosis-model.ts:780-785`). The regex catches `rerun validation` / `run validation`, but not `rerun the validation`, `run the validation`, or `validate ...` (`src/flight-learn-local-diagnosis-model.ts:183`).
- Tests and harness cover the narrower strings (`rerun validation`, `run validation`, `review the result`, `keep validating`) but not article-bearing or `validate` action advice (`src/flight-learn-local-diagnosis-model.test.ts:193-207`, `run-narrative-local-model-contract-harness.mjs:244-247`).
- Non-writing fake-provider probes were accepted as local-model output (`usedLocalModel: true`, `fallbackReason: null`) for action advice in `whatHappened`:
  - `After reinstalling the package, rerun the validation from a fresh shell.`
  - `After the same pattern repeated: run the validation from a fresh shell.`
  - `Validate from a fresh shell after reinstalling the package.`
  - `After reinstalling the package, validate from a fresh shell.`
  - `After reinstalling the package rerun validation from a fresh shell.`

Why it matters:

`ACC-002` requires route/action advice to fall back (`.loom/tickets/20260528-flight-learn-narrative-local-model-contract.md:66-68`). These examples are still display instructions, not narrative description, so `FIND-FU-001` cannot be closed.

Required follow-up:

- Expand `whatHappened` action-advice detection to cover article-bearing verb phrases (`run/rerun/re-run the validation/checks/tests`) and direct action verbs such as `validate` when used imperatively.
- Detect common introductory phrase + imperative forms even without punctuation, or otherwise reject the action clause before unsupported-fact checks.
- Add focused tests and harness exercises for these bypasses while keeping the existing descriptive `Review churn...` and supported `expectedBehavior` cases green.

### FIND-SFU-002 — Blocker — Internal/display-field echo boundary remains inconsistent for bare `headline` and `evidence`

Severity: high  
Confidence: high  
Disposition: open  
Challenges: `ACC-002`, `ACC-004`, prior `FIND-FU-002`

What I observed:

- The prompt still says: `Do not echo or summarize the fact packet structure. Do not include nested objects, arrays, delta, signals, evidence, bounds, or analysis fields.` (`src/flight-learn-local-diagnosis-model.ts:577`).
- The forbidden-pattern list rejects `delta`, `signals`, `bounds`, fact-packet/JSON phrases, and `headline field/key`, but not bare `headline` or bare `evidence` (`src/flight-learn-local-diagnosis-model.ts:171-180`). The narrative connective allow-list explicitly includes `evidence` and `headline` (`src/flight-learn-local-diagnosis-model.ts:235-253`).
- Tests/harness exercise mixed internal echoes such as fact-packet/delta/JSON/signals, but do not cover bare `headline` or bare `evidence` echo (`src/flight-learn-local-diagnosis-model.test.ts:216-227`, `run-narrative-local-model-contract-harness.mjs:248-250`).
- Non-writing fake-provider probes were accepted (`usedLocalModel: true`, `fallbackReason: null`) for:
  - `The headline points to the same stale shell pattern.`
  - `The evidence points to the same stale shell pattern.`
- Corpus/harness positives also intentionally accept `evidence` wording while the prompt forbids it: NARR-EVAL-001 accepted `two recent evidence summaries... summarized evidence` (`narrative-local-model-contract-harness-results.json:132-135`), and NARR-EVAL-005 accepted `This is evidence of...` (`narrative-local-model-contract-harness-results.json:483-485`).
- The evidence dossier overclaims reconciliation: it says prompt, validator, corpus, and evidence now agree that internal `delta`/fact-packet/JSON/signal/bounds/headline meta-language should not appear (`.loom/evidence/20260528-flight-learn-narrative-local-model-contract.md:99`), but bare `headline` is accepted and `evidence` is both prompt-forbidden and corpus-accepted.

Why it matters:

The `stored delta` positive-case fix is real, and probes confirmed fact-packet/JSON/signal/delta examples now reject. But the broader `FIND-FU-002` requirement was to reconcile prompt, validator, corpus, and evidence. That reconciliation is incomplete, so `ACC-002` and `ACC-004` do not yet support closure.

Required follow-up:

- Choose and record the intended boundary:
  - If `evidence` is allowed as ordinary operator-facing wording, narrow the prompt/evidence language so it forbids the internal `evidence` field/section/summary echo rather than every use of the word, and add tests for the distinction.
  - If it is not allowed, reject bare `evidence` in `whatHappened` and update positive corpus examples.
- Reject or explicitly justify bare `headline` meta-language; add focused tests/harness exercises for `The headline points...` and similar field-name echo.
- Update the evidence dossier after the prompt/validator/corpus boundary is actually coherent.

## `FIND-003` disposition

`FIND-003` appears honestly dispositioned now. The ticket narrows the no-better claim to exact duplicates plus a safe-generic quality residual risk (`.loom/tickets/20260528-flight-learn-narrative-local-model-contract.md:81-83`). The evidence dossier likewise says safe-but-generic/no-better narratives are not claimed to be runtime-rejected (`.loom/evidence/20260528-flight-learn-narrative-local-model-contract.md:103-111`). The harness records NARR-EVAL-015 as expected/actual `accepted-narrative-worse` with `validatorOutcome: accepted` (`narrative-local-model-contract-harness-results.json:1284-1304`, `1356-1368`).

## ACC closure assessment

- `ACC-001`: supported for the existence of a field-specific prompt/contract (`src/flight-learn-local-diagnosis-model.ts:571-579`).
- `ACC-002`: not supported for closure because `FIND-SFU-001` and `FIND-SFU-002` still admit unsafe/action or unresolved internal/meta wording.
- `ACC-003`: supported by existing focused tests for disabled/unavailable/default fallback and no source-delta mutation; I found no new storage/routing side-effect evidence.
- `ACC-004`: partially supported by the harness artifacts, but not sufficient for closure until the harness/corpus covers the remaining action-advice and bare headline/evidence boundary.
- `ACC-005`: supported for the commands I ran: focused Vitest, typecheck, and `git diff --check` all passed.

## Required follow-up before closure

1. Fix the remaining action-advice bypasses in `whatHappened` and add tests/harness exercises for article-bearing, `validate`, and unpunctuated introductory-phrase imperatives.
2. Reconcile internal/meta-language rules across prompt, validator, corpus, tests, harness, and evidence, especially bare `headline` and `evidence` wording.
3. Re-run focused tests, typecheck, `git diff --check`, and the fake-provider harness after fixes.
4. Update the evidence dossier so `ACC-002`/`ACC-004` claims do not overstate the covered boundary.

## Residual risk

- The grounding validator remains token/allow-list heuristic even after these fixes.
- Fake-provider coverage does not prove Bonsai 4B output quality, latency, or real runtime behavior.
- Safe but generic prose remains an accepted quality risk unless a later ticket adds semantic quality gating.

## Inspected context

Read/inspected: ticket, initial audit, first follow-up audit, local-model evidence dossier, rubric corpus evidence, harness summary/results/script, narrative corpus, `src/flight-learn-local-diagnosis-model.ts`, `src/flight-learn-local-diagnosis-model.test.ts`, relevant spec diff, and relevant git status/diff. I did not rerun the harness because the harness script writes artifacts and the task requested no source/file edits; I inspected its existing outputs instead and ran only focused tests/typecheck/diff-check plus non-writing fake-provider probes.
