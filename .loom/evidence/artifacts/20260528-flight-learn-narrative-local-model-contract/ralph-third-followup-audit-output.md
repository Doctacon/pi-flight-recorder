# Ralph Third Follow-up Audit Output — Narrative Local Model Contract

Audited: 2026-05-28
Target: `ticket:20260528-flight-learn-narrative-local-model-contract`
Verdict: `changes-needed`

## Summary

`FIND-SFU-001` is **not fully resolved**. The exact second-follow-up examples for `rerun the validation`, `validate`, and unpunctuated introductory `rerun validation` are covered, but small read-only fake-provider probes still accepted action advice in `whatHappened` when the imperative uses an article/adjective object or the common verb `check`.

`FIND-SFU-002` is **partially resolved but not fully closed**. The explicit `delta` / fact packet / JSON / signal / bounds / bare `headline` probes now fall back, and the intentional generic `stored evidence` allowance is consistent. However, bare `packet`/`bounded packet` fact-packet echo and bare `Problem` display-label echo are still accepted.

ACC-001..005 should **not close as a set** until the two remaining blockers below are fixed and re-evidenced.

## Correct / Confirmed

- Focused validation still passes:
  - `npm test -- src/flight-learn-local-diagnosis-model.test.ts` → 1 file, 19 tests passed.
  - `npm run typecheck` → passed.
  - `git diff --check` → no output.
- The prompt now states the field-specific contract: `headline/Problem` stays concise, `whatHappened` is the narrative field, and it must be distinct from the headline (`src/flight-learn-local-diagnosis-model.ts:572-580`).
- Tests and harness exercises cover the exact second-follow-up examples for `rerun the validation`, `validate`, and unpunctuated introductory `rerun validation` (`src/flight-learn-local-diagnosis-model.test.ts:193-208`, `.loom/evidence/artifacts/20260528-flight-learn-narrative-local-model-contract/run-narrative-local-model-contract-harness.mjs:244-254`).
- False-positive guards looked healthy in focused probes: descriptive `Review churn...`, passive `Validation was rerun...`, supported imperative `expectedBehavior`, and generic `stored evidence` were accepted; explicit bare `headline`, `fact packet`, and JSON/signal/bounds probes fell back as unsafe.
- Corpus/evidence consistency is improved: the evidence now explicitly permits generic operator-facing `stored evidence` while forbidding internal field-name/meta echo (`.loom/evidence/20260528-flight-learn-narrative-local-model-contract.md:99-107`). The corpus no longer showed a `stored delta` accepted positive in the inspected grep results.

## Findings

### FIND-TFU-001 — Blocker — `whatHappened` still accepts action advice through article/adjective objects and `check` imperatives

Evidence:

- The `whatHappened` imperative pattern only recognizes `run`/`rerun` followed by optional `the` plus a fixed object, and does not include `check` as an imperative verb (`src/flight-learn-local-diagnosis-model.ts:183-184`). The validator applies that pattern per punctuation/comma-split clause (`src/flight-learn-local-diagnosis-model.ts:781-786`).
- Existing tests/harness added the prior examples, but not `run a validation`, `run local validation`, or `check validation` (`src/flight-learn-local-diagnosis-model.test.ts:197-207`; harness script lines `244-250`).
- Read-only fake-provider probes accepted these route/action-advice narratives with `usedLocalModel: true` and `fallbackReason: null`:
  - `After reinstalling the package, run a validation from a fresh shell.`
  - `After reinstalling the package, run local validation from a fresh shell.`
  - `Check validation from a fresh shell after reinstalling the package.`
  - `After reinstalling the package, check validation from a fresh shell.`

Why it matters:

- This is still action advice in the display-only `What happened?` field. It directly challenges ACC-002 (`route/action advice ... fall back`) in the ticket (`.loom/tickets/20260528-flight-learn-narrative-local-model-contract.md:67-69`) and REQ-032 (`route advice ... MUST fall back`) in the spec (`.loom/specs/flight-learn-inbox-ux.md:112-114`).
- The ticket current state overclaims that article-bearing and common imperative bypasses are addressed (`.loom/tickets/20260528-flight-learn-narrative-local-model-contract.md:82-84`).

Required follow-up:

- Extend `whatHappened` action-advice detection to cover article/adjective objects such as `run a validation` / `run local validation` and common supported imperative verbs such as `check` when used as action advice.
- Add focused tests and harness exercises for those accepted probes.
- Preserve the confirmed false-positive behavior for descriptive `Review` nouns, passive/descriptive validation wording, and supported `expectedBehavior` imperatives.

### FIND-TFU-002 — Blocker — Internal/display-field echo boundary still has accepted `packet` and `Problem` meta-language

Evidence:

- The prompt says not to echo fact-packet structure and not to mention internal field names, while allowing generic stored evidence (`src/flight-learn-local-diagnosis-model.ts:578`).
- The unsafe regex catches `fact packet`, `bounded fact packet`, `delta`, `signals`, `bounds`, `headline`, and `problem field/key/section`, but not bare `packet`, `bounded packet`, or bare `Problem` (`src/flight-learn-local-diagnosis-model.ts:180`).
- The narrative connective allow-list explicitly includes `bounded`, `packet`, `redacted`, `problem`, and related meta tokens (`src/flight-learn-local-diagnosis-model.ts:200-201`, `src/flight-learn-local-diagnosis-model.ts:216-307`).
- Read-only fake-provider probes accepted these outputs with `usedLocalModel: true` and `fallbackReason: null`:
  - `The packet points to the same stale shell pattern.`
  - `The bounded packet points to the same stale shell pattern.`
  - `The redacted packet points to the same stale shell pattern.`
  - `The Problem points to the same stale shell pattern.`
- The explicit probes `The fact packet...`, `The bounded fact packet...`, `The JSON response uses allowed keys, signals, and bounds...`, and `The headline...` did fall back, so the remaining issue is the narrower wording bypass.

Why it matters:

- Bare `packet` is still fact-packet/meta echo, just without the word `fact`.
- Bare `Problem` meta-language is not a useful narrative; it echoes the display field relationship instead of explaining the observed sequence/pattern. This weakens ACC-001's distinct-field claim and ACC-002's internal/meta safety boundary.

Required follow-up:

- Decide and encode the boundary for bare `packet`/`bounded packet`/`redacted packet` and bare `Problem` in `whatHappened`.
- If these are meant to be forbidden, reject them explicitly and add tests/harness probes.
- Keep the intentional `stored evidence` allowance: `The stored evidence points to the same stale shell pattern.` was accepted and appears consistent with the current prompt/evidence claim.

## ACC Closure Assessment

- ACC-001: **Do not close yet.** The prompt exists, but accepted `Problem` meta-language and remaining action-advice bypasses make the contract still route/action-prone.
- ACC-002: **Do not close.** `whatHappened` still accepts action advice and internal/meta echo probes.
- ACC-003: **Appears supportable within inspected scope.** Deterministic fallback/default behavior and no source mutation are covered by existing tests, but ticket closure is blocked by ACC-002.
- ACC-004: **Do not close as final evidence yet.** The harness consumes the corpus and records zero mismatches, but it does not exercise the newly accepted bypasses.
- ACC-005: **Mechanical validation passed, but acceptance should not close yet.** Focused tests/typecheck/diff-check passed; they are not sufficient while blockers remain.

## Required Follow-up

1. Fix `FIND-TFU-001` action-advice bypasses and add focused tests plus harness exercises.
2. Fix or explicitly disposition `FIND-TFU-002` for bare `packet` and bare `Problem` meta-language; add tests/harness probes.
3. Re-run focused Vitest, fake-provider narrative harness, `npm run typecheck`, and `git diff --check`.
4. Update ticket/evidence current-state wording so it does not claim article-bearing/common-imperative/internal-echo coverage until the new probes are included.

## Residual Risk

- The grounding/safety validator remains regex/token based and will need continued adversarial probes as model phrasing varies.
- Fake-provider evidence still does not prove Bonsai 4B quality, latency, or runtime behavior.
- Safe but generic low-quality narratives remain intentionally accepted as a rubric-level residual risk (`accepted-narrative-worse`), not a runtime fallback condition.

## Inspected Context

- `.loom/tickets/20260528-flight-learn-narrative-local-model-contract.md`
- `.loom/audit/20260528-flight-learn-narrative-local-model-contract-review.md`
- `.loom/audit/20260528-flight-learn-narrative-local-model-contract-followup-review.md`
- `.loom/audit/20260528-flight-learn-narrative-local-model-contract-second-followup-review.md`
- `.loom/evidence/20260528-flight-learn-narrative-local-model-contract.md`
- `.loom/evidence/artifacts/20260528-flight-learn-narrative-local-model-contract/harness-summary.json`
- `.loom/evidence/artifacts/20260528-flight-learn-narrative-local-model-contract/narrative-local-model-contract-harness-results.json`
- `.loom/evidence/artifacts/20260528-flight-learn-narrative-local-model-contract/run-narrative-local-model-contract-harness.mjs`
- `.loom/evidence/artifacts/20260528-flight-learn-narrative-rubric-corpus/narrative-what-happened-eval-corpus.v1.json`
- `.loom/specs/flight-learn-inbox-ux.md` REQ-030..REQ-032 / SCN-010 diff context
- `src/flight-learn-local-diagnosis-model.ts`
- `src/flight-learn-local-diagnosis-model.test.ts`
- `git status --short`, relevant `git diff`, focused tests/typecheck/diff-check, and read-only fake-provider probes

No source files were edited in this audit.
