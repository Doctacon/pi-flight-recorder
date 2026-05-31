# Ralph Fifth Follow-up Audit Output

Ticket: `ticket:20260528-flight-learn-narrative-local-model-contract`
Audit target: fixes after `audit:20260528-flight-learn-narrative-local-model-contract-fourth-followup-review`
Date: 2026-05-28

## Verdict

`changes-needed`.

`FIND-FFU-001` and `FIND-FFU-002` are fixed for the exact fourth-follow-up examples, but not fully resolved as classes. I reproduced fresh accepted `whatHappened` action-advice bypasses and an all-caps `PROBLEM(S)` internal/meta echo bypass. Therefore `ACC-002` cannot close, and the ticket should not close yet.

## Findings

### Correct / supported

- `ACC-001` is supported: the prompt is field-specific and tells the model that `headline/Problem` is concise, `whatHappened` is the grounded 2-4 sentence narrative field, and output is display-only (`src/flight-learn-local-diagnosis-model.ts:571-582`).
- Exact `FIND-FFU-001` examples now fall back as unsafe in focused tests (`src/flight-learn-local-diagnosis-model.test.ts:194-219`) and in my fake-provider probes: `run the current validation`, `rerun your validation`, `check the current validation`, `validate current result`, `Use a fresh shell...`, and `Use stored evidence...` all returned `usedLocalModel:false`, `fallbackReason:"unsafe-output"`.
- Exact `FIND-FFU-002` plural examples are covered in tests (`src/flight-learn-local-diagnosis-model.test.ts:239-263`), and my probes confirmed `deltas`, `packets`, `headlines`, and Title Case `Problems` fall back as unsafe.
- The intended allowances still work in probes: passive/descriptive `Validation was rerun from an old shell...`, generic `The stored evidence points...`, and supported imperative `expectedBehavior` values were accepted.
- Command health checked in this audit: `npm test -- src/flight-learn-local-diagnosis-model.test.ts` passed 19 tests; `npm run typecheck` passed; `git diff --check` produced no output.

### Blocker: FIND-5FU-001 — action advice still bypasses after leading adverbs/prepositional or purpose phrases

The current detector checks only clause starts after splitting on punctuation/comma (`src/flight-learn-local-diagnosis-model.ts:783-788`). The action regex allows optional `and|then|please` and a limited intro list (`after|before|when|once|if|because`) (`src/flight-learn-local-diagnosis-model.ts:184-186`). Imperatives preceded by other short leading text are missed and then pass grounding because their concrete tokens are supported.

Accepted fake-provider probes (`usedLocalModel:true`, `fallbackReason:null`):

- `Now rerun validation from a fresh shell after reinstalling the package.`
- `Now run validation from a fresh shell after reinstalling the package.`
- `For validation use a fresh shell after reinstalling the package.`
- `During validation use a fresh shell after reinstalling the package.`
- `To validate the stale shell pattern use stored evidence.`

These are still route/action-style advice in `whatHappened`, which violates `REQ-032` (`.loom/specs/flight-learn-inbox-ux.md:114`) and blocks `ACC-002` (`.loom/tickets/20260528-flight-learn-narrative-local-model-contract.md:69-71`).

### Blocker: FIND-5FU-002 — all-caps `PROBLEM(S)` meta echo still bypasses

The internal/meta pattern rejects most internal terms case-insensitively, but the separate `Problems?` pattern is case-sensitive (`src/flight-learn-local-diagnosis-model.ts:180-181`). My probes accepted:

- `The PROBLEM points to the same stale shell pattern.`
- `The PROBLEMS point to the same stale shell pattern.`

This leaves a casing variant of the `Problem` display-field/meta echo that the fourth follow-up was meant to close. The exact Title Case `Problem(s)` examples are fixed, but the singular/plural class is not fully closed.

### Note: descriptive false-positive introduced by broad `use` handling

The broad start-of-clause `use` rejection also rejects a grounded descriptive noun phrase:

- `Use of a fresh shell was expected after the validation repeated from an old shell.` returned `unsafe-output`.

This does not admit unsafe text, but the next fix should preserve descriptive/passive narrative forms while closing the bypasses above.

### Note: evidence/harness overclaims current safety coverage

The evidence dossier currently says `ACC-002` is supported and lists broad imperative/internal coverage (`.loom/evidence/20260528-flight-learn-narrative-local-model-contract.md:104-110`). The harness exercise list covers many prior variants (`run-narrative-local-model-contract-harness.mjs:239-265`) but not the accepted `now/for/during/to` action-advice probes or all-caps `PROBLEM(S)`. Update tests, harness exercises/results, ticket state, and evidence after the fix.

## ACC closure assessment

- `ACC-001`: supported / closeable.
- `ACC-002`: not closeable; blockers above admit unsafe/action and internal/meta output.
- `ACC-003`: supported / closeable based on display-only application and fallback behavior (`src/flight-learn-local-diagnosis-model.ts:616-625`, `src/flight-learn-local-diagnosis-model.ts:690-702`) plus focused tests.
- `ACC-004`: mechanically supported for recorded corpus consumption (15 cases, zero mismatches in `harness-summary.json:1-53`), but should be refreshed with the new adversarial exercises before a closure claim.
- `ACC-005`: command-health evidence is supported for this audit, but must be rerun after fixes.

## Required follow-up

1. Extend `whatHappened` action-advice detection for leading adverbs and unpunctuated prepositional/purpose phrases such as `now`, `for validation`, `during validation`, and `to validate ... use ...`.
2. Preserve safe descriptive/passive text, including `Use of ... was expected`, while rejecting imperative `Use ...` advice.
3. Reject all-caps `PROBLEM` / `PROBLEMS` meta echo without banning ordinary lower-case `problem` prose.
4. Add focused tests and harness exercises for the new probes, regenerate evidence artifacts, update ticket/evidence claims, then rerun focused tests, harness, typecheck, and `git diff --check`.
5. Run another follow-up audit before closure.

## Residual risk

The validator remains regex/token-heuristic based, so adversarial grammar variants may continue to appear. Evidence is still fake-provider/local-contract only; it does not prove Bonsai 4B quality, latency, or runtime behavior. Safe but generic/no-better prose remains an accepted and documented quality residual risk.

## Inspected context

Read/inspected: active ticket, initial through fourth audits, local-model evidence dossier, harness summary/results/script, narrative corpus, relevant spec requirements, `src/flight-learn-local-diagnosis-model.ts`, `src/flight-learn-local-diagnosis-model.test.ts`, git status/diff. Ran read-only focused tests/typecheck/diff-check and fake-provider probes. I did not run the harness script because it rewrites result artifacts and this audit was no-edit except this output file.
