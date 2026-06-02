# Flight Learn LLM Card Copy Contract Follow-up Evidence

ID: evidence:20260531-flight-learn-llm-card-copy-contract-followup
Type: Evidence Dossier
Status: recorded
Created: 2026-05-31
Updated: 2026-05-31
Observed: 2026-05-31 UTC

## Summary

Resolved the follow-up fixes for `ticket:20260531-flight-learn-llm-card-copy-contract` after `audit:20260531-flight-learn-llm-card-copy-contract-review` returned `changes-needed`.

This follow-up stays within the contract/test/schema slice. It does not change focused-card rendering, run a real local model runtime, collect dogfood data, or alter storage/routing/artifact side effects.

Artifact directory:

```text
.loom/evidence/artifacts/20260531-flight-learn-llm-card-copy-contract-followup/
```

## Finding Disposition

### FIND-001: Fact IDs for new card-copy fields were not bound to field text

Disposition: fixed pending follow-up audit.

Changes:

- `whyThisWasFlagged` and `evidenceSummary` now validate displayed text against support built from their cited facts, not the whole fact packet.
- `evidenceSummary` still requires cited facts to be `evidence-summary` facts.
- `whyThisWasFlagged` still requires at least one cited flagging-support fact.
- Focused tests now reject cases where the field text uses expectation-only wording while citing an allowed-kind but unrelated fact.

### FIND-002: `expectedBehavior` support was too broad once an expected fact existed

Disposition: fixed pending follow-up audit.

Changes:

- `expectedBehavior` is now validated against only `expected-behavior` and `delta-expectation` facts.
- Outputs with no expected-behavior facts still fail closed unless the field is omitted/null.
- A conservative negation check rejects polarity mismatches between the model-provided expected behavior and the expected facts.
- Focused tests now reject cross-field reality wording, invented clean-container wording, and inverted `do not run...` wording when an expectation exists, while still accepting a supported conservative rewrite.

### FIND-003: llama.cpp generator schema still required `whatHappened`

Disposition: fixed pending follow-up audit.

Changes:

- The generator JSON schema now requires only `schemaVersion`.
- `whatHappened` remains available as an optional fact-cited narrative object.
- The validator continues to reject empty responses through its `empty-output` path when no useful display field is present.
- Adapter schema tests now assert `required: ["schemaVersion"]`.

## Source Changes Observed

Changed files in this follow-up scope:

- `src/flight-learn-local-diagnosis-model.ts`
  - Added cited-fact support validation for `whyThisWasFlagged` and `evidenceSummary`.
  - Added expected-fact-only validation for `expectedBehavior`.
  - Added conservative expected-behavior negation mismatch rejection.
  - Refactored support-set construction so whole-packet support and cited-fact support are distinct.
- `src/flight-learn-local-diagnosis-model.test.ts`
  - Added regression tests for unrelated cited facts in `whyThisWasFlagged` and `evidenceSummary`.
  - Added regression tests for cross-field, invented, and inverted `expectedBehavior` wording with an existing expectation.
- `src/flight-learn-llama-cpp-adapter.ts`
  - Made `whatHappened` optional in the generator schema by requiring only `schemaVersion`.
- `src/flight-learn-llama-cpp-adapter.test.ts`
  - Updated generator schema assertion for optional `whatHappened`.

## Validation Commands

| Artifact | Command | Result |
| --- | --- | --- |
| `00-pre-followup-focused-tests.txt` | baseline focused tests before follow-up fix | passed; 2 files, 41 tests |
| `01-focused-tests.txt` | `npm test -- src/flight-learn-local-diagnosis-model.test.ts src/flight-learn-llama-cpp-adapter.test.ts` | passed; 2 files, 42 tests |
| `02-typecheck.txt` | `npm run typecheck` | passed |
| `03-build.txt` | `npm run build` | passed |
| `04-full-tests.txt` | `npm test` | passed; 21 files, 149 tests |
| `05-diff-check.txt` | `git diff --check` over scoped files/artifacts | passed; no output |
| `06-source-side-effect-scan.txt` | targeted side-effect grep over changed implementation files | no imports or write APIs added; matches are guardrail/prompt strings |
| `07-privacy-scan.json` | privacy scan over changed source/tests/ticket/evidence/artifacts | passed; 15 files scanned, 0 findings |
| `08-final-diff-check.txt` | final `git diff --check` after ticket/evidence updates | passed; no output |
| `09-final-privacy-scan.json` | final privacy scan after ticket/evidence updates | passed; 17 files scanned, 0 findings |
| `10-post-evidence-diff-check.txt` | post-evidence `git diff --check` | passed; no output |
| `11-post-evidence-privacy-scan.json` | post-evidence privacy scan | passed; 19 files scanned, 0 findings |

## Acceptance Mapping

- `ACC-001` remains supported: the local-model card-copy contract exposes fielded display copy for the full primary reading surface, and the adapter schema supports optional all-field returns without forcing `whatHappened`.
- `ACC-002` is strengthened: focused tests now cover cited-fact binding for new fields and expected-behavior support against expected facts only.
- `ACC-003` remains supported: no storage/routing/artifact/source/docs/Loom/rule/skill/prompt/classifier side-effect path was added.
- `ACC-004` remains supported: focused and full regression tests still pass for existing fallback/draft/accepted/validated semantics.
- `ACC-005` is supported pending follow-up audit: focused tests, typecheck, build, full tests, diff check, source side-effect scan, and privacy scan artifacts are recorded.

## Privacy And Boundary Notes

No real Bonsai, `llama-server`, hosted model, non-loopback endpoint, automatic download, or runtime install was used.

The tests use synthetic fixture paths and placeholder credential-like strings only to exercise redaction and hard-gate behavior. No raw private Pi sessions, real local paths, secrets, prompts, transcripts, or stack traces were added to Loom evidence.

## Non-Claims

This follow-up does not prove focused-card rendering, operator comprehension, real local-runtime usefulness, accepted narrative quality, release readiness, classifier readiness, or dogfood corpus quality.

This follow-up does not authorize model output to route, rank, store truth, create/apply artifacts, edit source/docs/Loom/rules/skills/prompts, or feed classifier labels.

## Recommended Next Move

Move `ticket:20260531-flight-learn-llm-card-copy-contract` back to review and run a follow-up audit over the source diff, tests, this follow-up evidence, and the original audit findings. If audit clears, unblock `ticket:20260531-flight-learn-llm-card-copy-rendering`.
