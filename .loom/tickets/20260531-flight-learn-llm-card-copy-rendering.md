# Flight Learn LLM Card Copy Rendering

ID: ticket:20260531-flight-learn-llm-card-copy-rendering
Type: Ticket
Status: closed
Created: 2026-05-31
Updated: 2026-05-31
Risk: high - this changes the primary user-facing `/flight-learn` card and must preserve trust-boundary, width, and keyboard affordance behavior.
Priority: high - this is the visible UX repair after the card-copy contract exists.
Depends On: ticket:20260531-flight-learn-llm-card-copy-contract

## Summary

Update the focused `/flight-learn` card so gated local LLM card-copy fields become the primary reading surface when explicitly enabled and valid. The default card should no longer ask the user to decode `Raw clue`, detector names, confidence scores, cluster IDs, raw commands, raw paths, or provenance/debug strings as product explanation.

The closure claim is: the focused card renders authored explanation copy for the primary sections when available, keeps evidence collapsed and inspectable, demotes provenance/debug details behind expansion, preserves deterministic fallback and visible actions, and introduces no storage/routing/artifact side effects.

## Related Records

- `plan:20260531-flight-learn-llm-authored-card-copy` - parent plan.
- `ticket:20260531-flight-learn-llm-card-copy-contract` - required card-copy contract and validators.
- `spec:flight-learn-inbox-ux` REQ-042 through REQ-048 and SCN-013 through SCN-015 - intended rendering behavior.
- `evidence:20260531-flight-learn-llm-card-copy-operator-feedback` - screenshot feedback showing the current card still exposes detector/provenance language.
- `ticket:20260529-flight-learn-local-draft-comprehension-gate` - prior draft display label, source-facts, footer, and fail-closed semantics to preserve.
- `src/flight-learn-inbox.ts` - likely focused-card renderer.
- `src/pi-extension.ts` - likely local-model option wiring into inbox items.
- `src/flight-learn-inbox.test.ts`, `src/pi-extension.test.ts`, and existing render artifacts - likely focused tests and render harness examples.

## Scope

In scope:

- Render local LLM card-copy fields for `Problem`, `What happened?`, `Why it matters`, `Expected`, `Why this was flagged`, and collapsed `Evidence` summary when the local-model path is explicitly enabled and the contract returns valid/gated fields.
- Replace default `Raw clue` / `Why suggested` primary sections with user-facing `Why this was flagged` copy.
- Keep raw/redacted evidence refs hidden by default and available via explicit evidence expansion.
- Demote detector/provenance/debug details behind expansion/debug, not primary reading.
- Preserve labels that distinguish local LLM draft/accepted/validated/deterministic states without making model text authoritative.
- Preserve route/observe/dismiss/skip/edit/evidence/quit affordances and width safety at representative terminal widths.
- Preserve deterministic fallback as safe and non-dead-ending, while avoiding internal-debug default copy.
- Add render artifacts, focused tests, and side-effect tests.

Out of scope:

- Changing the local-model response contract or validators except tiny integration fixes routed back to the contract ticket.
- Real Bonsai/llama.cpp runtime replay or quality claims.
- Adding new slash commands, default model calls, hosted/non-loopback providers, automatic downloads, telemetry, or model-family changes.
- Route ranking, classifier automation, artifact application, source/docs/Loom/rule/skill/prompt mutation, or storing model text as delta truth.

Likely first Ralph run:

- Read this ticket, parent plan, amended spec, contract ticket/evidence after it closes, and the current focused-card renderer/tests.
- Implement renderer consumption of the new contract with fake inbox fixtures.
- Produce width-safe render artifacts for draft/model-enabled and fallback states.

Stop conditions:

- Stop if the contract ticket is not closed or its output shape cannot support this renderer without product inference.
- Stop if hiding provenance removes the only path to inspect evidence/provenance.
- Stop if fallback becomes a dead end or hides too much for safe review.
- Stop if product source changes beyond focused-card rendering/integration are required.
- Stop if route/storage/artifact side effects would be needed.

## Acceptance

- ACC-001: Model-enabled focused cards render authored primary explanation fields.
  - Evidence: focused tests and render artifacts show `Problem`, `What happened?`, `Why it matters`, `Expected`, `Why this was flagged`, and collapsed `Evidence` summary populated from gated local card-copy fields.
  - Audit: challenge whether the card still reads like detector output or repeats deterministic labels under a model veneer.

- ACC-002: Raw clue/provenance/debug details are hidden by default but inspectable.
  - Evidence: render artifacts show no default primary `Raw clue`, detector names, confidence scores, cluster IDs, raw commands, raw paths, or record IDs; expanded evidence/debug state still provides safe redacted inspection.
  - Audit: challenge whether important evidence became inaccessible or whether internal details still leak into the main view.

- ACC-003: Fallback remains safe, non-dead-ending, and less internal.
  - Evidence: fallback render artifacts for disabled/unavailable/unsafe model states show honest limitation copy, route/observe/dismiss/skip/edit/evidence/quit actions, and no internal-debug primary sections.
  - Audit: challenge whether fallback is too thin to support recovery or still forces detector decoding.

- ACC-004: Width/key/action behavior is preserved.
  - Evidence: render artifacts at 72 and 92 columns or equivalent representative widths, width checks, and focused tests proving dismiss/skip/evidence/edit/route/quit affordances remain visible.
  - Audit: challenge clipped actions, unreadable wrapping, and overly long model text.

- ACC-005: Rendering has no side effects beyond current card display.
  - Evidence: tests or source scans prove model display fields do not mutate delta storage, route ranking, artifact candidates, source/docs/Loom records, rules, skills, prompts, or classifier labels.
  - Audit: challenge accidental coupling between model wording and route/candidate logic.

## Current State

Closed. Ralph implementation completed the focused-card rendering slice and recorded evidence at `evidence:20260531-flight-learn-llm-card-copy-rendering` with artifacts under `.loom/evidence/artifacts/20260531-flight-learn-llm-card-copy-rendering/`. Audit `audit:20260531-flight-learn-llm-card-copy-rendering-review` returned `clear` with no material findings.

The focused card now consumes gated local card-copy fields for `Why this was flagged` and collapsed `Evidence` summaries, removes default primary `Raw clue` / `Why suggested` sections, keeps raw clue/provenance behind explicit evidence expansion, redacts expanded signal/evidence snippets, preserves draft/accepted/validated/fallback labels, and keeps route/edit/evidence/dismiss/skip/quit actions visible at 72 and 92 columns.

Validation passed: focused inbox tests, typecheck, build, full tests, scoped `git diff --check`, render width checks, default-hidden-internals render checks, source side-effect scan, privacy scan, and bounded audit. No real runtime replay or operator comprehension validation was performed; those remain downstream tickets.

## Journal

- 2026-05-31: Created as the second child ticket of `plan:20260531-flight-learn-llm-authored-card-copy`.
- 2026-05-31: Unblocked after `ticket:20260531-flight-learn-llm-card-copy-contract` closed with clear follow-up audit.
- 2026-05-31: Set status to active and launched bounded Ralph rendering implementation run. Workspace already contains unrelated dirty/untracked files; worker must preserve unrelated state.
- 2026-05-31: Implemented focused-card rendering changes in `src/flight-learn-inbox.ts` and focused tests in `src/flight-learn-inbox.test.ts`. Evidence recorded at `evidence:20260531-flight-learn-llm-card-copy-rendering`; focused tests, typecheck, build, full tests, diff check, render width checks, default-hidden-internals check, side-effect scan, and privacy scan passed. Moved ticket to review pending audit.
- 2026-05-31: Audit `audit:20260531-flight-learn-llm-card-copy-rendering-review` returned `clear` with no material findings. Closed ticket and unblocked runtime replay.
