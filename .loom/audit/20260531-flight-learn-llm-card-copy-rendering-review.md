# Flight Learn LLM Card Copy Rendering Review

ID: audit:20260531-flight-learn-llm-card-copy-rendering-review
Type: Audit
Status: recorded
Created: 2026-05-31
Updated: 2026-05-31
Audited: 2026-05-31 UTC
Target: ticket:20260531-flight-learn-llm-card-copy-rendering

## Summary

Audited the implementation and evidence for `ticket:20260531-flight-learn-llm-card-copy-rendering`. Within the bounded rendering slice, no material findings were identified: the focused card consumes the new authored card-copy fields, hides detector/provenance internals by default, preserves expansion and safe actions, and the evidence supports closure without claiming real-runtime quality or operator comprehension.

## Target

Target under review:

- `ticket:20260531-flight-learn-llm-card-copy-rendering`
- Source diff for:
  - `src/flight-learn-inbox.ts`
  - `src/flight-learn-inbox.test.ts`
- Evidence dossier `evidence:20260531-flight-learn-llm-card-copy-rendering`
- Render artifacts under `.loom/evidence/artifacts/20260531-flight-learn-llm-card-copy-rendering/`

The ticket is in `review` and asks whether ACC-001 through ACC-005 are sufficiently supported before closure and before unblocking `ticket:20260531-flight-learn-llm-card-copy-runtime-replay`.

## Audit Scope And Lenses

Lenses used:

- acceptance and scope: whether ACC-001 through ACC-005 are satisfied and whether the implementation stayed out of contract/runtime/dogfood scope;
- product/UX: whether the focused card uses authored card-copy fields and no longer reads like detector output by default;
- evidence/provenance boundary: whether `Raw clue`, detector names, confidence, cluster IDs, raw commands/paths, and record IDs are hidden by default but inspectable after expansion;
- fallback/action behavior: whether fallback remains honest, non-dead-ending, and shows edit/evidence/dismiss/skip/route/quit hints at narrow and wide widths;
- trust and side effects: whether model text only changes current display and cannot route, rank, mutate storage/artifacts/source/docs/Loom/rules/skills/prompts, or feed classifier labels;
- evidence sufficiency/privacy: whether tests, render artifacts, scans, and non-claims support the exact rendering claim without overclaiming real runtime or operator comprehension.

Out of scope:

- local-model contract correctness beyond consuming the closed contract ticket;
- real Bonsai/llama.cpp runtime output quality or latency;
- operator comprehension validation;
- dogfood corpus/outcome readiness;
- broad release readiness.

## Context And Evidence Reviewed

- `.loom/tickets/20260531-flight-learn-llm-card-copy-rendering.md` - ticket scope, acceptance criteria, and review-state claims.
- `.loom/plans/20260531-flight-learn-llm-authored-card-copy.md` - parent strategy and sequencing boundaries.
- `.loom/tickets/20260531-flight-learn-llm-card-copy-contract.md` - closed prerequisite contract ticket.
- `.loom/audit/20260531-flight-learn-llm-card-copy-contract-followup-review.md` - clear audit confirming the renderer may consume the new field contract.
- `.loom/specs/flight-learn-inbox-ux.md` REQ-042 through REQ-048 and SCN-013 through SCN-015 - intended behavior for local LLM card copy, hidden provenance, collapsed evidence, truthful expected behavior, and fallback.
- `.loom/evidence/20260531-flight-learn-llm-card-copy-rendering.md` - implementation evidence and non-claims.
- `.loom/evidence/artifacts/20260531-flight-learn-llm-card-copy-rendering/render-model-72.txt` and `render-model-92.txt` - model-enabled render artifacts with authored `Why this was flagged` and evidence summary.
- `.loom/evidence/artifacts/20260531-flight-learn-llm-card-copy-rendering/render-draft-72.txt` and `render-draft-92.txt` - draft render artifacts preserving non-authoritative label and source facts.
- `.loom/evidence/artifacts/20260531-flight-learn-llm-card-copy-rendering/render-fallback-72.txt` and `render-fallback-92.txt` - deterministic fallback artifacts with local-model rejection/unavailable disclosure and visible actions.
- `.loom/evidence/artifacts/20260531-flight-learn-llm-card-copy-rendering/render-expanded-72.txt` and `render-expanded-92.txt` - expanded evidence/provenance artifacts showing explicit provenance and concise refs behind expansion.
- `.loom/evidence/artifacts/20260531-flight-learn-llm-card-copy-rendering/05-render-line-widths.json` - all render artifacts within 72/92-column limits.
- `.loom/evidence/artifacts/20260531-flight-learn-llm-card-copy-rendering/08-render-contract-check.json` - default render checks passed and expanded provenance checks passed.
- `.loom/evidence/artifacts/20260531-flight-learn-llm-card-copy-rendering/11-final-privacy-scan.json` - privacy scan passed, 24 scanned files, 0 forbidden findings; synthetic fake-user paths are limited to test fixtures.
- `.loom/evidence/artifacts/20260531-flight-learn-llm-card-copy-rendering/01-focused-tests.txt` - focused inbox tests passed, 1 file and 13 tests.
- `.loom/evidence/artifacts/20260531-flight-learn-llm-card-copy-rendering/04-full-tests.txt` - full test suite passed, 21 files and 149 tests.
- `.loom/evidence/artifacts/20260531-flight-learn-llm-card-copy-rendering/07-source-side-effect-scan.txt` - targeted scan found no storage/routing/artifact/classifier imports or write APIs added; matches were existing UI/key/guardrail text.
- Source diff for `src/flight-learn-inbox.ts` and `src/flight-learn-inbox.test.ts` - inspected renderer changes, tests, and side-effect boundaries.
- Source lines inspected include `src/flight-learn-inbox.ts:203-238`, `src/flight-learn-inbox.ts:498-530`, `src/flight-learn-inbox.ts:557-588`, `src/flight-learn-inbox.ts:692-748`, `src/flight-learn-inbox.test.ts:271-312`, `src/flight-learn-inbox.test.ts:314-333`, `src/flight-learn-inbox.test.ts:377-417`, `src/flight-learn-inbox.test.ts:419-453`, and `src/flight-learn-inbox.test.ts:488-568`.
- Read-only grep over render artifacts confirmed restricted internals appear only in expanded renders, not in default model/draft/fallback artifacts.

## Findings

None - no material findings within this bounded audit scope.

Supporting observations:

- ACC-001 is supported: the focused renderer uses `diagnosis.whyThisWasFlagged` and `diagnosis.evidenceSummary` in the primary focused card (`src/flight-learn-inbox.ts:498-525`), and render artifacts show model-enabled `Why this was flagged` plus collapsed evidence summary in both 72- and 92-column outputs.
- ACC-002 is supported: default rendering removes `Raw clue` / `Why suggested` from the primary focused card and moves provenance into expansion (`src/flight-learn-inbox.ts:520-588`). The default render artifacts omit raw clue/provenance internals, while expanded artifacts show `Expanded provenance`, a redacted raw clue, and concise evidence refs.
- ACC-003 is supported: fallback renders disclose rejected/unsafe local model wording, show deterministic wording, include conservative `Why this was flagged`, keep evidence expansion available, and preserve route/edit/evidence/dismiss/skip/quit actions.
- ACC-004 is supported: source wraps model status and key/action hints (`src/flight-learn-inbox.ts:506-541`), render artifacts preserve action hints at 72/92 columns, and `05-render-line-widths.json` reports no over-limit lines.
- ACC-005 is supported for this renderer slice: source changes are display/rendering helpers and event handlers remain explicit human actions (`src/flight-learn-inbox.ts:692-748`); tests cover route/dismiss/skip outputs and no mutation of source delta fields by model display text (`src/flight-learn-inbox.test.ts:488-568`).

## Verdict

Verdict: `clear`.

The rendering ticket can close as-is within its stated scope. The implementation matches the amended spec and ticket acceptance: model-enabled cards consume authored card-copy fields, raw clue/provenance internals are hidden by default but inspectable after expansion, fallback remains non-dead-ending, width/action affordances are preserved, and evidence/scans support the display-only/no-obvious-side-effects claim.

This verdict does not prove real local-runtime usefulness, operator comprehension, dogfood corpus readiness, or release readiness.

## Required Follow-up

No follow-up is required before closing `ticket:20260531-flight-learn-llm-card-copy-rendering`, provided the parent consumes this audit and records the disposition in the ticket.

After closure, the next scoped execution unit should be `ticket:20260531-flight-learn-llm-card-copy-runtime-replay`. That ticket should preserve the non-claims from this audit: render success and fake fixtures do not prove Bonsai/llama.cpp can produce useful all-field card copy.

## Residual Risk

- The renderer trusts the closed local card-copy contract to gate unsafe model fields; this audit did not re-audit the model validator beyond confirming the prerequisite contract ticket is closed with clear follow-up audit.
- Expanded evidence/provenance intentionally shows redacted detector/provenance details, signal confidence, and concise evidence refs. This is consistent with the spec, but operator comprehension validation still needs to verify that expansion is useful rather than overwhelming.
- Render artifacts are synthetic/redacted and do not prove real Pi TUI screenshots, real local-runtime output, or real-session usefulness.
- Passing tests and side-effect scans support the current display-only claim, but they are not whole-program proof that later command wiring or runtime replay cannot misuse the new display fields.
- The deterministic fallback is safer and less internal, but it remains less rich than model-enabled cards by design; downstream validation should still test whether it is adequate for recovery.

## Related Records

- `ticket:20260531-flight-learn-llm-card-copy-rendering` - consuming ticket that owns closure.
- `evidence:20260531-flight-learn-llm-card-copy-rendering` - implementation evidence reviewed.
- `plan:20260531-flight-learn-llm-authored-card-copy` - parent repair plan.
- `ticket:20260531-flight-learn-llm-card-copy-contract` - closed prerequisite contract ticket.
- `audit:20260531-flight-learn-llm-card-copy-contract-followup-review` - prerequisite clear audit.
- `spec:flight-learn-inbox-ux` - behavior contract for local LLM card-copy rendering and evidence boundaries.
