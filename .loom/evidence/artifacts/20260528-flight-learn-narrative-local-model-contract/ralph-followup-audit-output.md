# Ralph Follow-up Audit — Narrative Local Model Contract

Target: `ticket:20260528-flight-learn-narrative-local-model-contract`
Date: 2026-05-28
Verdict: `changes-needed`

## Verdict

Closure is not yet supported. `ACC-001`, `ACC-003`, and `ACC-005` have usable support in the inspected source/tests and validation output. `FIND-003` is honestly dispositioned by narrowed ticket/evidence claims and an explicit residual quality risk. However, `ACC-002` is still not satisfied because `whatHappened` can still accept some action-advice and internal-structure wording. `ACC-004` is partially supported by the harness, but the harness does not cover the bypasses below.

## Findings

### FIND-FU-001 — Blocker — `FIND-001` is not fully resolved; action advice can bypass the imperative regex

Evidence:

- The new `WHAT_HAPPENED_IMPERATIVE_ACTION_PATTERN` only recognizes imperatives at the start of the field or after sentence punctuation/semicolon plus whitespace: `src/flight-learn-local-diagnosis-model.ts:183`, applied at `src/flight-learn-local-diagnosis-model.ts:771-772`.
- Tests/harness cover direct sentence-start examples such as `Rerun...`, `Run...`, `Review...`, and `Keep validating...`: `src/flight-learn-local-diagnosis-model.test.ts:193-205`, `.loom/evidence/artifacts/20260528-flight-learn-narrative-local-model-contract/run-narrative-local-model-contract-harness.mjs:244-245`, with matching artifact results at `narrative-local-model-contract-harness-results.json:1465-1495`.
- A focused fake-provider probe against current source accepted this `whatHappened` as local model output: `After reinstalling the package, rerun validation from a fresh shell.` The result was `usedLocalModel: true`, `fallbackReason: null`.
- The same probe confirmed sentence-start `Rerun validation from a fresh project shell after reinstalling the package.` falls back with `unsafe-output`, so the failure is an under-broad boundary case, not total absence of the fix.

Why it matters: this is still action advice in the narrative field, which challenges `ACC-002` (`route/action advice ... fall back`) at `.loom/tickets/20260528-flight-learn-narrative-local-model-contract.md:65-67` and the display-only boundary in `REQ-032`.

Additional regex risk: the same pattern is over-broad for descriptive nouns. A focused probe with `Review churn increased after the same stale edit pattern repeated.` fell back as `unsafe-output` / `whatHappened narrative included action advice`, even though it is descriptive narrative wording. That false positive is safer than accepting action advice, but the follow-up fix should avoid trading one gap for the other.

Required follow-up: reject imperative clauses after introductory phrases/commas/colons (for example `After ..., rerun ...`) while preserving supported imperative `expectedBehavior` text. Add focused tests and harness exercises for these bypass forms and at least one descriptive `Review churn...` non-action narrative.

### FIND-FU-002 — Blocker — `FIND-002` is only partially resolved; prompt, validator, and harness still disagree on internal-structure terms

Evidence:

- The prompt forbids fact-packet structure echo and explicitly names `delta`, `signals`, `evidence`, `bounds`, and analysis fields: `src/flight-learn-local-diagnosis-model.ts:577`.
- The validator’s forbidden internal-structure regex rejects specific forms such as `fact packet`, `json response`, `delta summary`, `signals`, and `bounds`, but not bare `delta` or `evidence`: `src/flight-learn-local-diagnosis-model.ts:180`.
- A focused fake-provider probe accepted `The delta and evidence point to the same pattern.` with `usedLocalModel: true`, `fallbackReason: null`.
- The regenerated harness artifact still treats an accepted positive case as local-model output while saying `The stored delta says...`: `narrative-local-model-contract-harness-results.json:410-430` and `:483-485`.
- By contrast, the narrow added exercises do reject the exact fact-packet/json examples: harness script lines `.loom/evidence/artifacts/20260528-flight-learn-narrative-local-model-contract/run-narrative-local-model-contract-harness.mjs:246-247`, artifact results `narrative-local-model-contract-harness-results.json:1511-1540`.

Why it matters: the current evidence says `ACC-002` is supported because “internal fact-packet/structure echo” falls back (`.loom/evidence/20260528-flight-learn-narrative-local-model-contract.md:100-102`), but the runtime and harness still accept at least some internal-structure vocabulary that the prompt itself forbids. This makes `FIND-002` unresolved unless the intended contract is narrowed to allow terms such as `stored delta` / `evidence` in operator-facing prose.

Required follow-up: reconcile the contract. Either reject bare internal terms (`delta`, `stored delta`, structural `evidence`, etc.) in `whatHappened`, or revise the prompt/evidence/corpus to state which operator-facing terms are intentionally allowed. Add adversarial and positive cases that make this boundary explicit.

## Correct / Supported

- `ACC-001` is supported by source inspection: the prompt now separates field jobs, names `whatHappened` as the narrative field, requires 2-4 sentences and distinctness from the headline, and restates display-only/no side-effect constraints (`src/flight-learn-local-diagnosis-model.ts:571-579`).
- Expected-behavior imperative text was not falsely rejected in the focused positive path: tests accept `expectedBehavior: "Run validation from a fresh project shell."` (`src/flight-learn-local-diagnosis-model.test.ts:96-115`), and a probe with supported `expectedBehavior: "Run validation from a fresh project shell after reinstalling the package."` also returned `usedLocalModel: true`.
- `FIND-003` is honestly dispositioned: the ticket narrows the duplicate/no-better claim to exact duplicates plus residual safe-generic quality risk (`.loom/tickets/20260528-flight-learn-narrative-local-model-contract.md:80-89`), the evidence explicitly says safe-but-generic/no-better narratives are not runtime-rejected (`.loom/evidence/20260528-flight-learn-narrative-local-model-contract.md:100-112`), and `NARR-EVAL-015` remains accepted as `accepted-narrative-worse` (`narrative-local-model-contract-harness-results.json:1300-1368`).
- `ACC-003` is supported within inspected scope by the existing focused tests and source shape: fallback returns deterministic display text, accepted polish applies display fields only, and tests cover no source delta mutation.
- `ACC-005` validation commands were re-run in this follow-up pass: `npm test -- src/flight-learn-local-diagnosis-model.test.ts` passed 19 tests; `npm run typecheck` passed; `git diff --check` produced no output.

## Required Follow-up

1. Fix the `whatHappened` action-advice detector to catch imperative clauses after introductory phrases/commas without rejecting descriptive nouns such as `Review churn...`.
2. Reconcile the internal-structure boundary between prompt, validator, corpus, and evidence; add tests/harness cases for the chosen boundary.
3. Re-run focused Vitest, the fake-provider narrative harness, `npm run typecheck`, and `git diff --check` after the fixes.
4. Update the ticket/evidence current-state wording so it does not claim `FIND-001`/`FIND-002` are resolved until the above gaps are addressed.

## Residual Risk

- The grounding validator remains token/allow-list based and can still admit safe but low-quality generic prose; this is now honestly recorded as residual quality risk rather than runtime fallback behavior.
- The evidence remains fake-provider/local-contract only. It does not prove Bonsai 4B quality, latency, or real `llama.cpp` behavior.
- I did not rerun the provided harness script because it writes regenerated JSON artifacts. I inspected the existing regenerated artifacts and ran non-writing fake-provider probes instead.

## Inspected Context

Read/inspected:

- `.loom/tickets/20260528-flight-learn-narrative-local-model-contract.md`
- `.loom/audit/20260528-flight-learn-narrative-local-model-contract-review.md`
- `.loom/evidence/20260528-flight-learn-narrative-local-model-contract.md`
- `.loom/evidence/artifacts/20260528-flight-learn-narrative-local-model-contract/harness-summary.json`
- `.loom/evidence/artifacts/20260528-flight-learn-narrative-local-model-contract/narrative-local-model-contract-harness-results.json`
- `.loom/evidence/artifacts/20260528-flight-learn-narrative-local-model-contract/run-narrative-local-model-contract-harness.mjs`
- `src/flight-learn-local-diagnosis-model.ts`
- `src/flight-learn-local-diagnosis-model.test.ts`
- Relevant `REQ-030` through `REQ-032` / `SCN-010` lines in `.loom/specs/flight-learn-inbox-ux.md`
- `git status --short` and `git diff` for requested tracked source files

Commands/probes run:

- `npm test -- src/flight-learn-local-diagnosis-model.test.ts` — passed, 19 tests.
- `npm run typecheck` — passed.
- `git diff --check` — no output.
- Non-writing fake-provider probes for sentence-start imperative, comma-prefaced imperative, supported expectedBehavior imperative, internal-structure wording, and descriptive `Review churn...` wording.
