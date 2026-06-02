# Flight Learn LLM Card Copy Rendering Evidence

ID: evidence:20260531-flight-learn-llm-card-copy-rendering
Type: Evidence Dossier
Status: recorded
Created: 2026-05-31
Updated: 2026-05-31
Observed: 2026-05-31 UTC

## Summary

Implemented the focused-card rendering slice for `ticket:20260531-flight-learn-llm-card-copy-rendering`. The focused `/flight-learn` card now consumes gated local LLM card-copy fields as the primary reading surface when present and no longer shows `Raw clue` or `Why suggested` as default primary sections.

The renderer now shows:

- `Problem` from the selected diagnosis view;
- `What happened?` from the selected diagnosis view;
- `Why it matters` from the selected diagnosis view;
- `Expected`, using local-model/deterministic text when known and a non-inventing edit prompt when unknown;
- `Why this was flagged`, using gated local card-copy when present or conservative deterministic fallback copy;
- collapsed `Evidence`, optionally with gated local evidence summary, while raw/redacted refs remain behind explicit expansion.

This ticket did not change the local-model contract, run a real model/runtime, add commands, alter route choices, mutate storage/artifacts/source/docs/Loom/rules/skills/prompts, start dogfood collection, or perform operator comprehension validation.

Artifact directory:

```text
.loom/evidence/artifacts/20260531-flight-learn-llm-card-copy-rendering/
```

## Source Changes Observed

Changed files in this ticket scope:

- `src/flight-learn-inbox.ts`
  - imports `LocalDiagnosisPolishedView` and `sanitizeStoredText` for field-aware, redacted rendering;
  - redacts expanded signal/evidence snippets before display;
  - replaces default focused-card `Raw clue` / `Why suggested` sections with `Why this was flagged`;
  - uses `diagnosis.whyThisWasFlagged` and `diagnosis.evidenceSummary` when available;
  - keeps evidence refs hidden by default and shows concise refs/provenance only after `v` expansion;
  - moves raw clue behind expanded provenance only;
  - updates unknown expected copy to `Pi does not know the intended behavior yet — press e to add it.`;
  - wraps local-model status lines instead of clipping them at narrow widths.
- `src/flight-learn-inbox.test.ts`
  - adds fixture card-copy fields for validated, accepted, and draft local-model states;
  - updates focused-card assertions to require `Why this was flagged`, collapsed evidence summaries, hidden default internals, expanded safe provenance, fallback non-dead-end actions, width safety, and no storage/routing side effects.

No `src/pi-extension.ts` or `src/pi-extension.test.ts` changes were needed.

## Render Artifacts

Representative renders were generated from an artifact-local harness using synthetic/redacted fixture data and the built renderer:

- `render-card-copy-rendering.mjs` - artifact-local renderer harness.
- `render-model-92.txt` / `render-model-72.txt` - validated local-model card-copy state.
- `render-draft-92.txt` / `render-draft-72.txt` - local LLM draft state with deterministic source facts.
- `render-fallback-92.txt` / `render-fallback-72.txt` - deterministic fallback after unsafe local-model wording rejection.
- `render-expanded-92.txt` / `render-expanded-72.txt` - expanded evidence/provenance state.
- `05-render-line-widths.json` - line width check for all render artifacts.
- `08-render-contract-check.json` - default-hidden-internals and expanded-provenance check.

`05-render-line-widths.json` reports all render lines within their 72- and 92-column limits. `08-render-contract-check.json` reports that default model/draft/fallback renders contain no default `Raw clue`, `Why suggested`, cluster IDs, raw home paths, or Pi session paths, and that expanded renders include explicit provenance and evidence refs.

## Validation Commands

| Artifact | Command | Result |
| --- | --- | --- |
| `01-focused-tests.txt` | `npm test -- src/flight-learn-inbox.test.ts` | passed; 1 file, 13 tests |
| `02-typecheck.txt` | `npm run typecheck` | passed |
| `03-build.txt` | `npm run build` | passed |
| `04-full-tests.txt` | `npm test` | passed; 21 files, 149 tests |
| `06-diff-check.txt` | `git diff --check -- src/flight-learn-inbox.ts src/flight-learn-inbox.test.ts .loom/evidence/artifacts/20260531-flight-learn-llm-card-copy-rendering` | passed; no output |
| `07-source-side-effect-scan.txt` | targeted side-effect grep over changed renderer files | no storage/routing/artifact/classifier imports or write APIs added; matches are existing key labels, timestamps, and guardrail text |
| `09-privacy-scan.json` | privacy scan over changed source/tests, ticket, evidence, and artifacts | passed; synthetic fake-user test fixtures treated as allowed non-private redaction tests; 0 forbidden findings |
| `10-final-diff-check.txt` | final scoped `git diff --check` after ticket/evidence updates | passed; no output |
| `11-final-privacy-scan.json` | final privacy scan after ticket/evidence updates | passed; 0 forbidden findings |

## Acceptance Mapping

- `ACC-001` supported: focused tests and render artifacts show model-enabled cards rendering `Problem`, `What happened?`, `Why it matters`, `Expected`, `Why this was flagged`, and collapsed `Evidence` with gated card-copy fields where available.
- `ACC-002` supported: focused tests and `08-render-contract-check.json` show default focused-card renders hide `Raw clue`, `Why suggested`, detector/provenance/debug details, raw home paths, and record-like internals; expanded renders still show safe concise provenance/evidence refs.
- `ACC-003` supported: fallback render artifacts disclose local-model rejection/unavailability when useful, preserve conservative deterministic explanation, keep evidence expansion, and keep route/edit/evidence/dismiss/skip/quit actions visible.
- `ACC-004` supported: render artifacts at 72 and 92 columns preserve visible key/action hints; `05-render-line-widths.json` reports all lines within width limits.
- `ACC-005` supported: renderer changes do not import storage/routing/artifact/classifier write APIs, focused tests still prove route-selected/dismiss/skip actions are explicit human actions, and source-side-effect scan found no new mutation path from model text.

## Privacy And Boundary Notes

No real Bonsai, `llama-server`, hosted model, non-loopback endpoint, automatic download, or runtime install was used.

Render artifacts use synthetic/redacted fixture data only. Expanded evidence/provenance artifacts contain redacted handles and no raw private session paths or real local paths.

The changed test file contains pre-existing synthetic fixture paths under a fake user name to exercise redaction behavior; the privacy scan treats those as allowed test fixtures and still reports zero forbidden private findings.

## Non-Claims

This evidence does not prove real local-runtime usefulness, local model quality, operator comprehension, accepted narrative quality, release readiness, classifier readiness, or dogfood corpus readiness.

This evidence does not authorize model output to route, rank, store truth, create/apply artifacts, edit source/docs/Loom/rules/skills/prompts, or feed classifier labels.

## Recommended Next Move

Move `ticket:20260531-flight-learn-llm-card-copy-rendering` to review and run bounded audit over the renderer diff, focused tests, render artifacts, and this evidence. If audit clears, unblock `ticket:20260531-flight-learn-llm-card-copy-runtime-replay`.
