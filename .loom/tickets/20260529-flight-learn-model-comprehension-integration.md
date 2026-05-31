# Flight Learn Model Comprehension Integration

ID: ticket:20260529-flight-learn-model-comprehension-integration
Type: Ticket
Status: blocked
Created: 2026-05-29
Updated: 2026-05-29
Risk: high - this changes the primary operator-facing comprehension path for `/flight-learn` while preserving strict model/source-of-truth boundaries.
Priority: medium - important for the plan, but it must wait for accepted constrained narrative evidence.
Depends On: ticket:20260529-flight-learn-constrained-judge-replay

## Summary

Integrate accepted constrained local narratives into the `/flight-learn` focused card as the explicitly enabled rich comprehension path. The single closure claim is: when local model phrasing is explicitly enabled and verifier/judge acceptance succeeds, `/flight-learn` renders the accepted `What happened?` narrative clearly with disclosure; when disabled or rejected, it renders a safe non-dead-ending deterministic fallback without route/storage/artifact side effects.

## Related Records

- `plan:20260529-flight-learn-comprehension-path` - parent plan and sequencing rationale; now reshaped so local draft comprehension is the next executable path while accepted-narrative integration remains blocked.
- `ticket:20260529-flight-learn-constrained-judge-replay` - prerequisite evidence; this ticket should proceed only if replay supports accepted narratives under current gates.
- `spec:flight-learn-inbox-ux` REQ-024 through REQ-036 and SCN-008 through SCN-011 - intended behavior for model-enabled comprehension and deterministic fallback.
- `src/flight-learn-inbox.ts` - focused-card rendering, model status line, and fallback display surface.
- `src/pi-extension.ts` - `/flight-learn` argument parsing and local-model flag wiring.
- `src/flight-learn-local-diagnosis-model.ts` - accepted/fallback local diagnosis result shape.
- `src/flight-learn-inbox.test.ts`, `src/pi-extension.test.ts`, and local diagnosis tests - likely focused test surfaces.

## Scope

In scope:

- Ensure `/flight-learn --local-model-polish --local-model-url ...` can display accepted constrained local `What happened?` narrative in the focused card when verifier and judge accept it.
- Preserve or improve the existing unobtrusive disclosure line, e.g. `Local model phrasing; deterministic fallback available.`
- Preserve or improve fallback disclosure for rejected/timeout/unavailable model output, e.g. `Local model unavailable (invalid JSON); deterministic wording shown.`
- Ensure deterministic fallback remains non-dead-ending: route/observe/dismiss/skip actions and redacted evidence inspection remain usable even when wording is less rich.
- Add render fixtures/artifacts for accepted model narrative and deterministic fallback states at representative widths.
- Add tests proving model wording does not mutate stored delta fields, route choices, route ranking, artifact candidates, source files, Loom records, rules, skills, prompts, or classifier behavior.

Out of scope:

- Adding model calls by default or adding a new top-level command.
- Changing the artifact route set, applying artifacts, creating rules/tickets/docs/source edits, or ranking routes.
- Collecting dogfood corpus/outcomes.
- Weakening verifier/judge/privacy checks to get UI output.
- Changing the accepted narrative contract except through a separate spec/ticket.
- Real operator comprehension validation; that is the next ticket.

Stop conditions:

- Stop if the dependency closes with zero accepted narratives or an explicit recommendation not to proceed to UI integration.
- Stop if integration would require treating model text as stored truth, route advice, classifier output, or artifact mutation input.
- Stop if fallback cards become dead ends or hide why the model was rejected.
- Stop if source changes grow beyond the inbox/extension/local diagnosis seam; route broader design work back to the plan.

## Acceptance

- ACC-001: Accepted model narrative renders as the rich comprehension path only when explicitly enabled.
  - Evidence: focused tests and render artifacts show a card with distinct `Problem` and accepted `What happened?` narrative after local model success, plus visible local-model disclosure.
  - Audit: challenge whether the UI makes model wording look authoritative or default-enabled.

- ACC-002: Deterministic fallback remains safe and non-dead-ending.
  - Evidence: tests/render artifacts cover disabled model, timeout, malformed/schema-invalid, unsafe, unsupported, and judge-failed states; fallback cards still expose route/observe/dismiss/skip/evidence actions and honest fallback reason.
  - Audit: challenge whether fallback is too opaque to use or whether errors interrupt review.

- ACC-003: Display-only and human-gated boundaries hold.
  - Evidence: tests/source inspection prove accepted model wording does not alter `ExpectationDelta` fields, route ranking, artifact candidates, rules, source/docs/Loom/skills/prompts, classifier behavior, or any stored source-of-truth field.
  - Audit: challenge hidden persistence or side effects.

- ACC-004: Command surface and opt-in behavior remain unchanged.
  - Evidence: `/flight-learn` and `/flight-status` remain the visible/default commands; local model use still requires explicit local flags/config; no hosted/non-loopback route is added.
  - Audit: challenge accidental default enablement or new visible command creep.

- ACC-005: Validation evidence is sufficient for a user-facing integration.
  - Evidence: focused tests, typecheck/build/full tests as practical, render artifacts, `git diff --check`, evidence dossier, and Ralph audit before closure.
  - Audit: challenge visual evidence, width safety, and trust-boundary wording.

## Current State

Blocked by negative dependency result. `ticket:20260529-flight-learn-constrained-judge-replay` closed as a negative gate: 0/15 accepted narratives, 15/15 narrative non-acceptances, 10/15 product-level fallback-reason cases, 5/15 partial local-model display cases without accepted narrative, and a stop/replan recommendation for the current Bonsai 4B runtime. The parent plan has been reshaped around `ticket:20260529-flight-learn-local-draft-comprehension-gate` as the next executable path. Do not execute this accepted-narrative integration ticket unless new verifier/judge/model evidence or explicit authorization supports accepted narratives; do not weaken verifier/judge/privacy gates to make integration proceed.

## Journal

- 2026-05-29: Created by Loom Weaver as the third child ticket of `plan:20260529-flight-learn-comprehension-path`. This ticket intentionally treats local narrative as the enabled comprehension layer while preserving deterministic fallback as safe but less rich.
- 2026-05-29: Dependency `ticket:20260529-flight-learn-constrained-judge-replay` closed as a negative gate with 0/15 accepted narratives and a stop/replan recommendation. This ticket remains blocked pending parent-plan reshaping or fresh authorization/evidence.
- 2026-05-29: Parent plan reshaped around `ticket:20260529-flight-learn-local-draft-comprehension-gate` for non-authoritative draft reading help. This accepted-narrative ticket remains blocked; it is not the next executable path.
