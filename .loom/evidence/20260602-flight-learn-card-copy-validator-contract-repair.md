# Flight Learn Card Copy Validator Contract Repair Evidence

ID: evidence:20260602-flight-learn-card-copy-validator-contract-repair
Type: Evidence Dossier
Status: recorded
Created: 2026-06-02
Updated: 2026-06-02
Observed: 2026-06-02 UTC

## Summary

Executed `ticket:20260602-flight-learn-card-copy-validator-contract-repair` as a bounded implementation/evidence run.

Repaired the `/flight-learn` local card-copy prompt/validator contract so hard safety and source-of-truth failures still reject the whole card, while unsupported or low-value non-safety fields can be omitted when at least one safe core model-authored field remains. The deterministic diagnosis remains the fallback and source of truth.

No hosted calls, local model calls, downloads, dependency changes, runtime installs, telemetry, non-loopback endpoints, spec edits, renderer redesign, storage changes, classifier/routing automation, or operator-validation changes were performed.

Artifact directory:

```text
.loom/evidence/artifacts/20260602-flight-learn-card-copy-validator-contract-repair/
```

## Artifact Inventory

- `00-artifact-index.json` - artifact list and non-claims.
- `01-focused-tests.txt` - focused validator/prompt contract tests.
- `02-typecheck.txt` - TypeScript no-emit validation.
- `03-build.txt` - build validation.
- `04-full-tests.txt` - full Vitest suite.
- `05-diff-check.txt` - scoped `git diff --check`.
- `06-source-diff-summary.txt` - relative-path source diff summary.
- `07-contract-taxonomy.json` - privacy-safe taxonomy of repaired validator behavior.
- `08-privacy-scan.json` - privacy scan over dossier/artifacts/ticket.
- `09-final-status.txt` - scoped final status snapshot.

## Implementation Notes

Changed source seams:

- `src/flight-learn-local-diagnosis-model.ts`
  - Prompt now explicitly permits returning one useful core field instead of all fields.
  - Core fields are `headline`, `whatHappened`, `whyItMatters`, and `expectedBehavior`.
  - Product validation now scans all display fields, records field-local failures, and only renders model copy when at least one core field passes.
  - Unsafe/privacy/action/mutation/generated-evidence/internal-provenance/schema/source-of-truth failures remain card-level fail-closed.
  - Expected behavior remains fact-bound; unsupported expected copy is omitted when safe core copy remains, and still fails when nothing useful remains.
  - Optional `whyThisWasFlagged` and `evidenceSummary` support failures are field-local; generated-evidence or unsafe text still rejects the card.
  - Support checking is less token-brittle by allowing limited safe paraphrase/connective wording while rejecting unsupported counts, concrete infrastructure/file/actor/event tokens, and concrete mutation claims.
  - Diagnostics were kept in sync with the repaired product-equivalent semantics and remain privacy-safe.
- `src/flight-learn-local-diagnosis-model.test.ts`
  - Added focused coverage for field-local optional omission, optional unsafe fail-closed behavior, safe paraphrase acceptance, concrete unsupported fact rejection, normal reader-facing words, and expected-behavior omission.

No adapter or renderer changes were required because the existing response schema already allowed omitted display fields and rendering already falls back to deterministic wording for missing fields.

## Validator Behavior Proved

Focused tests prove:

- Safe core copy can render while unsupported optional fields are omitted or replaced by deterministic wording.
- Any unsafe optional field, such as a generated-evidence claim, still causes deterministic fallback.
- Safe paraphrase with limited new connective wording is accepted without requiring every token to appear verbatim in facts.
- Concrete unsupported facts such as unsupported container/rebuild events are rejected.
- Unknown fact IDs remain card-level source-of-truth failures even when other core copy is safe.
- Unsupported expected behavior does not invent intended behavior; it is omitted when safe core copy remains.
- Expected behavior alone still needs expected-behavior support before model copy can render.
- Normal reader-facing words such as problem, signal, and issue are not rejected by themselves.
- Internal fact-packet, JSON, delta, headline/provenance wording remains rejected.
- Privacy-safe diagnostics match product-equivalent validator decisions.

## Validation Commands

| Artifact | Command | Result |
| --- | --- | --- |
| `01-focused-tests.txt` | `npm test -- src/flight-learn-local-diagnosis-model.test.ts` | passed; 1 file, 36 tests |
| `02-typecheck.txt` | `npm run typecheck` | passed |
| `03-build.txt` | `npm run build` | passed |
| `04-full-tests.txt` | `npm test` | passed; 21 files, 156 tests |
| `05-diff-check.txt` | scoped `git diff --check` over source/evidence/ticket paths | passed |
| `08-privacy-scan.json` | privacy scan over evidence dossier, artifacts, and ticket | passed; 0 findings |

## Boundary Notes

- Model-authored text remains display-only and does not change stored delta fields, routing, artifacts, rules, source, Loom records, classifier labels, or expected behavior truth.
- Evidence refs remain deterministic; `evidenceSummary` may only summarize existing evidence and cannot create or replace evidence.
- Hard failure categories remain card-level fail-closed.
- This is fake-provider/unit contract evidence only. It does not claim a local/open real model replay passed and does not unblock operator comprehension validation.

## Acceptance Mapping

- ACC-001: Satisfied by hard-vs-field-local validator flow and focused tests for optional support omission vs hard unsafe fallback.
- ACC-002: Satisfied by safe paraphrase acceptance and concrete unsupported fact rejection tests.
- ACC-003: Satisfied by prompt assertions and source diff summary showing reduced all-field burden without trust-boundary changes.
- ACC-004: Satisfied by focused tests, typecheck, build, full tests, and scoped diff check.
- ACC-005: Satisfied by this dossier and artifacts; ready for audit.

## Follow-Up

Ready for audit. If accepted, unblock `ticket:20260602-flight-learn-card-copy-repaired-local-replay` to run the repaired product path with an explicitly authorized local/open model runtime.
