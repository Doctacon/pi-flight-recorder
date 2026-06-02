# Flight Learn Card Copy Validator Diagnostics Evidence

ID: evidence:20260602-flight-learn-card-copy-validator-diagnostics
Type: Evidence Dossier
Status: recorded
Created: 2026-06-02
Updated: 2026-06-02
Observed: 2026-06-02 UTC

## Summary

Executed `ticket:20260602-flight-learn-card-copy-validator-diagnostics` as a bounded implementation/evidence run.

Implemented a privacy-safe diagnostic path for `/flight-learn` local model card-copy validation: `diagnoseLocalDiagnosisPolishResponse(...)`. The product path `buildFlightLearnDiagnosisViewWithLocalPolish(...)` is unchanged and does not call the diagnostic helper. Diagnostics report structured field/rule/category/count/length/hash metadata and product-equivalent first failure, without persisting raw prompts, raw model output, private paths, secrets, transcripts, stack traces, provider logs, or hosted outputs.

No hosted calls, local model calls, downloads, dependency changes, runtime installs, non-loopback endpoints, telemetry, or spec edits were performed.

Artifact directory:

```text
.loom/evidence/artifacts/20260602-flight-learn-card-copy-validator-diagnostics/
```

## Artifact Inventory

- `00-artifact-index.json` - artifact list and non-claims.
- `01-focused-tests.txt` - focused validator/diagnostic tests.
- `02-typecheck.txt` - TypeScript no-emit validation.
- `03-build.txt` - build validation.
- `04-full-tests.txt` - full Vitest suite.
- `05-diff-check.txt` - scoped `git diff --check`.
- `06-source-diff-summary.txt` - source diff summary.
- `07-diagnostic-taxonomy.json` - privacy-safe rejection taxonomy over synthetic fixtures.
- `08-privacy-scan.json` - privacy scan over dossier/artifacts/ticket.
- `09-final-status.txt` - scoped final status.

## Implementation Notes

Changed source seams:

- `src/flight-learn-local-diagnosis-model.ts`
  - Added exported diagnostic types and `diagnoseLocalDiagnosisPolishResponse(...)`.
  - Diagnostics include parse/object validity, allowed top-level key presence, extra key count and hashes, product-equivalent first failure, and per-field diagnostics.
  - Per-field diagnostics include field name, outcome, hard/soft/schema/omitted category, fallback reason, safe rule ID, lengths, hashes, cited fact counts, and unsupported token counts where useful.
  - Raw field text is never returned; only lengths and SHA-256 hashes are returned.
- `src/flight-learn-local-diagnosis-model.test.ts`
  - Added focused coverage proving diagnostics can continue scanning fields after product-equivalent first failure.
  - Added privacy assertions for path/secret/prompt/transcript-like output.
  - Added taxonomy coverage for known rejection/omission/acceptance categories.
  - Compared diagnostic product-equivalent result to `validateLocalDiagnosisPolishResponse(...)` and exercised unchanged fallback behavior through `buildFlightLearnDiagnosisViewWithLocalPolish(...)`.

## Diagnostic Taxonomy Coverage

From `07-diagnostic-taxonomy.json`, synthetic/redacted fixture categories cover:

- unsupported facts;
- route/action advice;
- mutation instructions;
- generated-evidence claims;
- expected behavior with known-but-unsupported wording;
- expected behavior when expected support is unknown/missing;
- duplicate/low-information narrative;
- empty/unknown display fields;
- raw-path-like output;
- secret-looking output;
- prompt-like output;
- transcript-like output;
- safe paraphrase acceptance;
- unsupported token novelty;
- multi-field diagnostics after a hard first failure.

The taxonomy artifact omits raw fixture text and raw model output.

## Validation Commands

| Artifact | Command | Result |
| --- | --- | --- |
| `01-focused-tests.txt` | `npm test -- src/flight-learn-local-diagnosis-model.test.ts` | passed; 1 file, 32 tests |
| `02-typecheck.txt` | `npm run typecheck` | passed |
| `03-build.txt` | `npm run build` | passed |
| `04-full-tests.txt` | `npm test` | passed; 21 files, 152 tests |
| `05-diff-check.txt` | scoped `git diff --check` over source/evidence/ticket paths | passed |
| `08-privacy-scan.json` | privacy scan over evidence dossier, artifacts, and ticket | passed; 0 findings |

## Product Behavior Check

Focused tests prove:

- The diagnostic product-equivalent decision matches `validateLocalDiagnosisPolishResponse(...)` for the exercised synthetic categories.
- The product builder still falls back deterministically for the same unsafe response, with `usedLocalModel: false` and fallback reason `unsafe-output`.
- `buildFlightLearnDiagnosisViewWithLocalPolish(...)` does not call the diagnostic helper.

This evidence does not claim product acceptance semantics were repaired. It only adds safe visibility into current validator behavior for the next contract-repair ticket.

## Privacy And Boundary Notes

- Diagnostics return safe categories/rule IDs, counts, lengths, and hashes only.
- Extra top-level keys are represented by count and key hashes, not raw key names.
- Field text is represented by length and SHA-256 hash only.
- The evidence artifacts do not persist raw prompts, raw model output, private Pi sessions, raw local paths, stack traces, provider logs, credentials, or private transcripts.
- No model output was used to route, classify, persist truth, create rules, edit source/docs/Loom, feed labels, or become evidence.

## Acceptance Mapping

- ACC-001: Satisfied by exported diagnostic structure, privacy tests, taxonomy artifact, and `08-privacy-scan.json`.
- ACC-002: Satisfied by product-equivalent validator comparisons and product fallback test coverage.
- ACC-003: Satisfied by focused taxonomy coverage in tests and `07-diagnostic-taxonomy.json`.
- ACC-004: Satisfied by focused tests, typecheck, build, full tests, diff check, privacy scan, source diff summary, and this dossier.

## Follow-Up

Ready for audit. If accepted, unblock `ticket:20260602-flight-learn-card-copy-validator-contract-repair` to use these safe diagnostics as the basis for product contract repair.
