# Flight Learn LLM Card Copy Contract Follow-up Review

ID: audit:20260531-flight-learn-llm-card-copy-contract-followup-review
Type: Audit
Status: recorded
Created: 2026-05-31
Updated: 2026-05-31
Audited: 2026-05-31 UTC
Target: ticket:20260531-flight-learn-llm-card-copy-contract

## Summary

Audited the follow-up fixes for `ticket:20260531-flight-learn-llm-card-copy-contract` after `audit:20260531-flight-learn-llm-card-copy-contract-review` returned `changes-needed`. The three prior findings appear resolved within this contract slice, and ACC-001 through ACC-005 are now supported enough for the ticket to close without claiming rendering, real-runtime quality, or operator comprehension.

## Target

Target under review:

- `ticket:20260531-flight-learn-llm-card-copy-contract`
- Follow-up evidence `evidence:20260531-flight-learn-llm-card-copy-contract-followup`
- Prior audit findings from `audit:20260531-flight-learn-llm-card-copy-contract-review`
- Source diff for:
  - `src/flight-learn-local-diagnosis-model.ts`
  - `src/flight-learn-local-diagnosis-model.test.ts`
  - `src/flight-learn-llama-cpp-adapter.ts`
  - `src/flight-learn-llama-cpp-adapter.test.ts`

The ticket is in `review` and asks whether the follow-up fixes are enough to close the contract ticket and unblock the rendering ticket.

## Audit Scope And Lenses

Lenses used:

- finding disposition: whether FIND-001 through FIND-003 from the prior audit were actually fixed;
- acceptance and evidence: whether ACC-001 through ACC-005 are supported by source, tests, scans, and evidence artifacts;
- trust boundary: whether model output remains display-only and cannot route, rank, persist truth, mutate artifacts/source/Loom, or feed classifier labels;
- field-specific validation: whether `whyThisWasFlagged`, `evidenceSummary`, and `expectedBehavior` now have support semantics aligned with REQ-043, REQ-044, REQ-047, and ACC-002;
- adapter schema alignment: whether the llama.cpp constrained schema now matches the optional-field prompt and validator contract;
- scope: whether follow-up stayed out of rendering, real runtime replay, dogfood, and command-surface changes.

Out of scope:

- focused-card rendering behavior;
- real Bonsai/llama.cpp output quality or latency;
- accepted narrative quality beyond preserving existing gates;
- operator comprehension;
- dogfood corpus/outcome readiness;
- broad release readiness.

## Context And Evidence Reviewed

- `.loom/tickets/20260531-flight-learn-llm-card-copy-contract.md` - ticket scope, acceptance criteria, follow-up current state, and closure claim.
- `.loom/audit/20260531-flight-learn-llm-card-copy-contract-review.md` - prior findings and required follow-up.
- `.loom/evidence/20260531-flight-learn-llm-card-copy-contract-followup.md` - follow-up evidence and finding disposition claims.
- `.loom/evidence/20260531-flight-learn-llm-card-copy-contract.md` - original implementation evidence and non-claims.
- `.loom/plans/20260531-flight-learn-llm-authored-card-copy.md` - parent route and scope boundaries.
- `.loom/specs/flight-learn-inbox-ux.md` REQ-042 through REQ-048 and SCN-013 through SCN-015 - intended card-copy, evidence, expected-behavior, and hidden-provenance behavior.
- `.loom/evidence/artifacts/20260531-flight-learn-llm-card-copy-contract-followup/01-focused-tests.txt` - focused tests passed, 2 files and 42 tests.
- `.loom/evidence/artifacts/20260531-flight-learn-llm-card-copy-contract-followup/02-typecheck.txt` - typecheck passed.
- `.loom/evidence/artifacts/20260531-flight-learn-llm-card-copy-contract-followup/03-build.txt` - build passed.
- `.loom/evidence/artifacts/20260531-flight-learn-llm-card-copy-contract-followup/04-full-tests.txt` - full tests passed, 21 files and 149 tests.
- `.loom/evidence/artifacts/20260531-flight-learn-llm-card-copy-contract-followup/06-source-side-effect-scan.txt` - targeted scan found no source/storage/routing/artifact/classifier write APIs added; matches were guardrail strings.
- `.loom/evidence/artifacts/20260531-flight-learn-llm-card-copy-contract-followup/11-post-evidence-privacy-scan.json` - privacy scan passed, 19 files scanned, 0 findings.
- `git diff` for the four source/test files - inspected validation logic, prompt/schema alignment, tests, and write-scope boundaries.
- Source lines inspected include `src/flight-learn-local-diagnosis-model.ts:263-269`, `src/flight-learn-local-diagnosis-model.ts:674-688`, `src/flight-learn-local-diagnosis-model.ts:1138-1149`, `src/flight-learn-local-diagnosis-model.ts:1176-1196`, `src/flight-learn-local-diagnosis-model.ts:1199-1238`, `src/flight-learn-local-diagnosis-model.ts:1392-1409`, `src/flight-learn-llama-cpp-adapter.ts:75-112`, `src/flight-learn-local-diagnosis-model.test.ts:1015-1111`, and `src/flight-learn-llama-cpp-adapter.test.ts:343-371`.
- `git status --short` - confirmed workspace remains dirty with unrelated Loom/source changes; this audit only wrote this audit record.

## Findings

None - no material findings within this bounded follow-up audit scope.

Prior finding disposition:

- `FIND-001` resolved: `validateFactCitedDisplayField` now checks `whyThisWasFlagged` and `evidenceSummary` text against `buildSupportSetFromFacts(citedFacts)` rather than whole-packet support, while still requiring `evidenceSummary` facts to be evidence-summary facts and `whyThisWasFlagged` to cite a flagging-support fact (`src/flight-learn-local-diagnosis-model.ts:1199-1238`, `src/flight-learn-local-diagnosis-model.ts:1392-1409`). Regression tests reject expectation-only text attached to unrelated cited facts (`src/flight-learn-local-diagnosis-model.test.ts:1088-1098`).
- `FIND-002` resolved for this contract slice: `expectedBehavior` now uses only `expected-behavior` and `delta-expectation` support facts, rejects missing expected facts, and rejects simple negation mismatches (`src/flight-learn-local-diagnosis-model.ts:1176-1196`). Regression tests cover no-expectation invention, cross-field reality wording, invented clean-container wording, inverted wording, and a supported conservative rewrite (`src/flight-learn-local-diagnosis-model.test.ts:1015-1067`).
- `FIND-003` resolved: the llama.cpp generator schema now requires only `schemaVersion`, leaving `whatHappened` optional and relying on product validation for `empty-output` (`src/flight-learn-llama-cpp-adapter.ts:75-112`). The adapter test asserts `required: ["schemaVersion"]` (`src/flight-learn-llama-cpp-adapter.test.ts:343-346`).

## Verdict

Verdict: `clear`.

Within the audited contract/test/schema slice, the follow-up fixes resolve the prior findings and support ACC-001 through ACC-005. The implementation now exposes the all-field card-copy contract, binds new fact-cited display fields to cited facts, narrows expected-behavior support to expected facts, aligns the constrained llama.cpp schema with the optional-field prompt/validator contract, preserves display-only/no-side-effect boundaries, and records passing focused tests, typecheck, build, full tests, diff checks, side-effect scan, and privacy scan.

This verdict does not accept or prove focused-card rendering, real local-runtime usefulness, operator comprehension, or dogfood corpus readiness.

## Required Follow-up

No further follow-up is required before closing `ticket:20260531-flight-learn-llm-card-copy-contract`, provided the parent consumes this audit and records the disposition in the ticket.

After closure, the next scoped execution unit should be `ticket:20260531-flight-learn-llm-card-copy-rendering`. That ticket must prove the renderer actually uses these fields, hides raw clue/provenance by default, preserves key/actions, and avoids storage/routing side effects.

## Residual Risk

- The support checks for non-judged fields remain conservative token/support gates, not formal semantic entailment. They are materially stronger after follow-up but may still reject useful model phrasing or allow bland generic wording.
- `expectedBehavior` is now honest enough for this contract slice, but it is still not fact-cited like `whyThisWasFlagged` or `evidenceSummary`; future runtime/operator validation should watch for awkward or over-conservative expected-behavior copy.
- Fake-provider and schema tests do not prove Bonsai/llama.cpp can produce useful all-field card copy.
- Rendering, evidence expansion behavior, fallback UI, and operator comprehension remain unverified until downstream tickets run.
- The side-effect scan is targeted and supports the no-obvious-side-effects claim; it is not a whole-program proof that later rendering or command wiring cannot misuse the fields.

## Related Records

- `ticket:20260531-flight-learn-llm-card-copy-contract` - consuming ticket that owns closure and finding disposition.
- `audit:20260531-flight-learn-llm-card-copy-contract-review` - prior audit whose findings this pass reviewed.
- `evidence:20260531-flight-learn-llm-card-copy-contract-followup` - follow-up evidence reviewed.
- `plan:20260531-flight-learn-llm-authored-card-copy` - parent plan; rendering is the next child ticket after contract closure.
- `spec:flight-learn-inbox-ux` - intended behavior for local LLM card-copy fields and evidence boundaries.
