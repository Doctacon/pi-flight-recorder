# Ralph Audit Output: Narrative Local Model Contract

Ticket: `ticket:20260528-flight-learn-narrative-local-model-contract`
Verdict: **changes-needed**
Auditor: Ralph adversarial audit review
Date: 2026-05-28

## Review

### Correct

- The prompt is field-specific and display-only on its face: it separates `headline`/Problem, narrative `whatHappened`, `whyItMatters`, and `expectedBehavior`, and tells the model to keep `whatHappened` grounded, 2-4 sentences, distinct from the headline, and JSON-only (`src/flight-learn-local-diagnosis-model.ts:565-579`).
- Deterministic fallback/default paths are still present: disabled and provider-unavailable return deterministic views before model work (`src/flight-learn-local-diagnosis-model.ts:586-588`), provider timeout/error/invalid validation fall back (`src/flight-learn-local-diagnosis-model.ts:596-611`), and accepted output only applies display fields plus a display-only limit note (`src/flight-learn-local-diagnosis-model.ts:684-695`).
- Focused tests cover many required safety/fallback classes: disabled/unavailable (`src/flight-learn-local-diagnosis-model.test.ts:80-90`), accepted grounded narrative (`src/flight-learn-local-diagnosis-model.test.ts:134-146`), exact duplicate fallback (`src/flight-learn-local-diagnosis-model.test.ts:148-166`), unsupported concrete facts (`src/flight-learn-local-diagnosis-model.test.ts:168-176`), raw command/path/secret/redaction placeholder probes (`src/flight-learn-local-diagnosis-model.test.ts:178-191`), route/mutation/classifier probes (`src/flight-learn-local-diagnosis-model.test.ts:193-201`), overlong narrative (`src/flight-learn-local-diagnosis-model.test.ts:204-218`), fact-packet redaction/bounds (`src/flight-learn-local-diagnosis-model.test.ts:220-337`), malformed/empty/extra/overlong fields (`src/flight-learn-local-diagnosis-model.test.ts:339-359`), generic unsafe output (`src/flight-learn-local-diagnosis-model.test.ts:361-463`), request-copy mutation (`src/flight-learn-local-diagnosis-model.test.ts:465-483`), and provider error/timeout (`src/flight-learn-local-diagnosis-model.test.ts:485-518`).
- Harness artifacts are compatible with the narrative corpus as written: `harness-summary.json` records 15 cases, 7 accepted / 8 fallback, zero validator mismatches, zero prompt/output safety failures, and zero exercise mismatches (`.loom/evidence/artifacts/20260528-flight-learn-narrative-local-model-contract/harness-summary.json:1-53`).
- I re-ran `npm test -- src/flight-learn-local-diagnosis-model.test.ts` (18 passed), `npm run typecheck` (passed), and `git diff --check` (no output). I did not re-run the harness because it overwrites the harness result artifacts; I inspected the recorded harness artifacts instead.

### FIND-001 — Blocker — Imperative action advice can be accepted in `whatHappened`

`ACC-002` requires route/action advice and mutation instructions to fall back (`.loom/tickets/20260528-flight-learn-narrative-local-model-contract.md:63-65`). The parent plan explicitly lists route/action advice as a class the narrative contract must distinguish/reject (`.loom/plans/20260528-flight-learn-4b-narrative-what-happened.md:38-45`), and REQ-032 requires the narrative to remain display-only/safety-bounded (`.loom/specs/flight-learn-inbox-ux.md:112-114`).

The validator does not currently reject bare imperative action advice such as `Run validation...`, `Rerun validation...`, `Review the result...`, or `Keep validating...` when those words are supported by the fact packet. The forbidden-output patterns catch route/choose/press/click, explicit mutation verbs with certain objects, and pronoun+modal action phrasing, but not sentence-start imperative run/rerun/review/keep advice (`src/flight-learn-local-diagnosis-model.ts:171-179`). `validateResponseField` then accepts `whatHappened` if `containsUnsafeOutput` is false and narrative token support passes (`src/flight-learn-local-diagnosis-model.ts:748-753`, `src/flight-learn-local-diagnosis-model.ts:789-808`).

Adversarial reproduction with a fake provider returned `usedLocalModel: true`, `fallbackReason: null` for all of these `whatHappened` values against a validation/stale-shell fact packet:

- `Rerun validation from a fresh project shell after reinstalling the package.`
- `Run validation from a fresh project shell after reinstalling the package.`
- `Review the result and rerun validation from a fresh shell.`
- `Keep validating from a fresh shell.`

The current tests do not cover this form. They cover route/mutation/classifier strings (`src/flight-learn-local-diagnosis-model.test.ts:193-201`) and pronoun+modal action strings (`src/flight-learn-local-diagnosis-model.test.ts:432-463`), but not bare imperative action advice.

Required follow-up: add output validation and tests for bare imperative action advice in `whatHappened` before closure. At minimum, cover sentence-start or clause-start `run`, `rerun`/`re-run`, `review`, `install`/`reinstall`, `fix`, `update`, `keep validating/editing/routing`, etc., while preserving non-imperative narrative uses such as “the validation was rerun.” Re-run focused tests and update/re-run the corpus harness after the fix.

### FIND-002 — Blocker — Validator accepts fact-packet/internal-structure echo that the prompt forbids

The prompt tells the model: `Do not echo or summarize the fact packet structure. Do not include nested objects, arrays, delta, signals, evidence, bounds, or analysis fields` (`src/flight-learn-local-diagnosis-model.ts:573-574`). However, the narrative connective allow-list includes internal/contract terms such as `delta`, `evidence`, `fact`, `headline`, `packet`, `summary`, `stored`, and `support` (`src/flight-learn-local-diagnosis-model.ts:212-303`), and `isSupportedNarrativeToken` accepts allow-listed tokens even when they are not grounded in the case-specific facts (`src/flight-learn-local-diagnosis-model.ts:803-808`).

Adversarial reproduction with a fake provider accepted internal-structure echo with `usedLocalModel: true`, `fallbackReason: null`, for example:

- `The fact packet shows the delta summary, evidence, and headline all point to the same pattern.`
- `The stored delta and evidence summary support the headline, and the fact packet keeps the exact details bounded.`

Those strings are not raw paths/secrets, but they violate the contract/prompt and would leak implementation language into the operator-facing narrative. The tests assert that the prompt contains the no-echo instruction (`src/flight-learn-local-diagnosis-model.test.ts:123-129`), but they do not test that the validator rejects model output that ignores it.

Required follow-up: add validator rejection and focused/corpus tests for fact-packet/internal-structure echo. A narrow fix could reject phrases such as `fact packet`, `delta summary`, `signals`, `bounds`, `JSON`, `allowed keys`, and `headline`/`Problem` meta-commentary when they appear as model narrative output, while still allowing user-facing words like “evidence” where appropriate.

### FIND-003 — Concern — “no-better than deterministic/headline” handling is narrower than the ticket/evidence claim

The ticket’s closure claim is a narrative that is “more useful than repeating the headline” (`.loom/tickets/20260528-flight-learn-narrative-local-model-contract.md:12-15`), its scope asks for duplicate/no-better-than-headline tests (`.loom/tickets/20260528-flight-learn-narrative-local-model-contract.md:35-40`), and SCN-010 says the narrative should be visibly more informative than repeating the headline (`.loom/specs/flight-learn-inbox-ux.md:216-219`).

Implementation only treats exact normalized duplicates of the deterministic headline or deterministic `whatHappened` as non-useful (`src/flight-learn-local-diagnosis-model.ts:765-786`). The focused test covers exact duplicate strings only (`src/flight-learn-local-diagnosis-model.test.ts:148-166`). The harness explicitly accepts a no-better generic narrative: NARR-EVAL-015 has coverage `no-better-than-deterministic`, expected validator outcome `accepted`, actual validator outcome `accepted`, and output `Pi saw a repeated issue. It happened more than once. The issue may matter because it was repeated.` (`.loom/evidence/artifacts/20260528-flight-learn-narrative-local-model-contract/narrative-local-model-contract-harness-results.json:1282-1368`). The corpus itself says this probe is “less informative than the desired narrative and barely distinct from the headline” while expecting validator acceptance (`.loom/evidence/artifacts/20260528-flight-learn-narrative-rubric-corpus/narrative-what-happened-eval-corpus.v1.json:2569-2606`).

This may be an intentional “safe but quality-worse” allowance, but it conflicts with the ticket/evidence wording that duplicate/no-useful output falls back (`.loom/evidence/20260528-flight-learn-narrative-local-model-contract.md:96-102`). Since runtime validation has no human rubric pass, an accepted-worse narrative would render as local-model phrasing in the next UI ticket.

Required follow-up: make the product contract explicit before closure. Either (a) strengthen validator/tests/harness so semantically no-better generic narratives fall back, or (b) revise the ticket/evidence to stop claiming no-better output falls back and document that safe-but-worse prose is a known quality residual risk to be caught by real-model validation/human review rather than runtime validation.

## Required Follow-up

1. Fix FIND-001 and add tests/harness coverage for bare imperative action advice in `whatHappened`.
2. Fix FIND-002 and add tests/harness coverage for fact-packet/internal-structure echo.
3. Resolve FIND-003 by either enforcing semantic no-better fallback or narrowing the acceptance/evidence claims to match the current validator.
4. Re-run focused tests, typecheck, `git diff --check`, and the fake-provider narrative corpus harness after changes.

## Residual Risk

- The grounding validator is still token/allow-list based. Even after the blockers are fixed, it can only approximate whether prose is useful or semantically faithful.
- Synthetic/redacted fake-provider evidence does not prove Bonsai 4B output quality, latency, or safety. The current evidence correctly does not claim real-model readiness.
- The next UI integration should not render local-model narrative until this contract review is resolved, because accepted action advice or internal-structure echo would be user-visible.

## Inspected Context

Read/inspected: ticket, parent plan, evidence dossier, harness summary/results, harness script, narrative corpus, `REQ-030`..`REQ-032`/`SCN-010`, `src/flight-learn-local-diagnosis-model.ts`, `src/flight-learn-local-diagnosis-model.test.ts`, and git diff/status for the requested paths. Also ran focused test/typecheck/diff-check and small read-only fake-provider reproduction commands for the adversarial cases above.
