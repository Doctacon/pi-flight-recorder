# Flight Learn LLM Card Copy Contract Evidence

ID: evidence:20260531-flight-learn-llm-card-copy-contract
Type: Evidence Dossier
Status: recorded
Created: 2026-05-31
Updated: 2026-05-31
Observed: 2026-05-31 UTC

## Summary

Implemented the contract-first slice for `ticket:20260531-flight-learn-llm-card-copy-contract`. The explicitly enabled local-model diagnosis/card-copy response can now include fielded display copy for the whole primary `/flight-learn` reading surface:

- `headline` / Problem;
- `whatHappened` fact-cited narrative;
- `whyItMatters` impact;
- `expectedBehavior` wording when expected-behavior facts exist;
- `whyThisWasFlagged` fact-cited display object;
- `evidenceSummary` fact-cited display object.

This ticket did not change focused-card rendering. The new fields are exposed on the local diagnosis result view for the next rendering ticket to consume.

Artifact directory:

```text
.loom/evidence/artifacts/20260531-flight-learn-llm-card-copy-contract/
```

## Source Changes Observed

Changed files:

- `src/flight-learn-local-diagnosis-model.ts`
  - Added optional `whyThisWasFlagged` and `evidenceSummary` display fields to the local diagnosis result view type.
  - Added response-field limits and top-level validation for the two new fields.
  - Added fact-cited object validation for `whyThisWasFlagged` and `evidenceSummary` using `{ text, factIds }`.
  - Required `evidenceSummary` to cite `evidence-summary` facts only.
  - Required `whyThisWasFlagged` to cite flagging-support facts.
  - Added hard gates for generated/new evidence claims and internal provenance/debug terms such as detector/cluster/confidence/record/source/session/fact identifiers.
  - Preserved expected-behavior support checks so unsupported expected behavior still falls back.
  - Preserved existing accepted-narrative, draft, validated, and deterministic display-state semantics.
- `src/flight-learn-local-diagnosis-model.test.ts`
  - Added fake-provider coverage for accepted all-field card-copy response.
  - Added expected-behavior unsupported/invented rejection coverage.
  - Added `evidenceSummary` generated-evidence/internal-provenance/non-evidence-fact rejection coverage.
  - Added unknown fact ID and raw string rejection coverage for `whyThisWasFlagged`.
- `src/flight-learn-llama-cpp-adapter.ts`
  - Extended the generator JSON schema with optional fact-cited `whyThisWasFlagged` and `evidenceSummary` fields.
  - Kept the same loopback-only `/v1/chat/completions` constrained JSON route and did not change judge schema semantics.
- `src/flight-learn-llama-cpp-adapter.test.ts`
  - Updated fake generator fixtures and schema assertions for the new optional fields.

## Validation Commands

| Artifact | Command | Result |
| --- | --- | --- |
| `01-focused-tests.txt` | `npm test -- src/flight-learn-local-diagnosis-model.test.ts src/flight-learn-llama-cpp-adapter.test.ts` | passed; 2 files, 41 tests |
| `02-typecheck.txt` | `npm run typecheck` | passed |
| `03-build.txt` | `npm run build` | passed |
| `04-full-tests.txt` | `npm test` | passed; 21 files, 148 tests |
| `05-diff-check.txt` | `git diff --check` | passed; no output |
| `06-source-side-effect-scan.txt` | targeted source-boundary grep over changed implementation files | no storage/fs/artifact/classifier imports or write APIs added |
| `07-privacy-scan.json` | privacy scan over changed source, tests, ticket, evidence, and artifacts | passed; 13 files scanned, 0 findings |
| `08-final-diff-check.txt` | final `git diff --check` after evidence/ticket updates | passed; no output |

The first focused test run was performed before implementation after adding failing contract tests; it failed as expected on the missing all-field contract. Final command artifacts above are the persisted green evidence.

## Acceptance Mapping

- `ACC-001` supported: source and tests now define explicit contract fields for headline/problem, what happened, why it matters, expected behavior, why flagged, and evidence summary. Adapter schema tests assert both new object fields.
- `ACC-002` supported within hard-gate scope: focused tests reject unsupported expected behavior, generated/new evidence claims, internal provenance/debug terms, non-evidence facts for `evidenceSummary`, unknown fact IDs, raw string shape for fact-cited fields, and existing privacy/action/mutation/classifier cases continue to pass.
- `ACC-003` supported: model output remains display-only in `LocalDiagnosisPolishResult.view`; no storage/routing/artifact/source/docs/Loom/rule/skill/prompt/classifier side-effect path was added.
- `ACC-004` supported: existing regression tests for disabled/unavailable/provider error/timeout fallback, draft display, accepted narrative, and unsafe/action-advice precedence still pass in the focused test file.
- `ACC-005` supported pending audit: focused tests, typecheck, build, full tests, diff-check, source side-effect scan, and privacy scan are recorded. This ticket should move to review, not closed.

## Privacy And Boundary Notes

`07-privacy-scan.json` passed with 13 files scanned and 0 findings. Command artifacts were redacted to replace the local repository path with `<repo>` before scanning. Source tests continue to use synthetic fixture paths under a non-real user name and placeholder credential strings to exercise redaction gates; no raw private Pi session content or real secret value was added.

No real Bonsai, `llama-server`, hosted model, non-loopback endpoint, automatic download, or runtime install was used.

## Non-Claims

This does not prove focused-card rendering, operator comprehension, real local-runtime usefulness, accepted narrative quality, release readiness, classifier readiness, or dogfood corpus quality.

This does not authorize model output to route, rank, store truth, create/apply artifacts, edit source/docs/Loom/rules/skills/prompts, or feed classifier labels.

## Recommended Next Move

Move `ticket:20260531-flight-learn-llm-card-copy-contract` to review and run a bounded audit over the source diff, tests, evidence artifacts, and this dossier. If audit clears, unblock `ticket:20260531-flight-learn-llm-card-copy-rendering`.
