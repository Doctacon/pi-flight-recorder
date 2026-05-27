# Flight Learn Diagnosis View Model

ID: ticket:20260527-flight-learn-diagnosis-view-model
Type: Ticket
Status: closed
Created: 2026-05-27
Updated: 2026-05-27
Risk: medium - this creates the semantic layer that decides what the operator sees as the plain-English diagnosis, but it should be pure/local and easy to test.
Priority: high - this is the prerequisite for making the focused-card UI understandable.

## Summary

Create a pure deterministic local helper that turns an `ExpectationDelta`, its `DeltaDetectorSignal[]`, and evidence refs into a display-only plain-English diagnosis object for `/flight-learn`.

Single closure claim: the codebase has a tested local diagnosis view model that can turn representative raw detector deltas into plain-English `headline`, `whatHappened`, `whyItMatters`, and optional `rawClue` text without model calls or storage mutation.

## Related Records

- `plan:20260527-flight-learn-plain-english-diagnosis-cards` - parent plan and strategy.
- `spec:flight-learn-inbox-ux` - owns REQ-019 through REQ-023 and SCN-007.
- `evidence:20260527-flight-learn-plain-english-feedback` - screenshot/feedback motivating the helper.
- `src/types.ts` - defines `ExpectationDelta`, `DeltaDetectorSignal`, and evidence ref shapes.
- `src/delta-capture.ts` - shows current detector-created delta text that often includes raw commands and reflection cluster IDs.
- `src/flight-learn-inbox.ts` - current component will later consume this helper but should not be integrated in this ticket unless the ticket is explicitly widened.

## Scope

In scope:

- Add a local deterministic diagnosis helper, likely in a new focused source file such as `src/flight-learn-diagnosis.ts` or a similarly named module.
- Define a small display-only result shape such as:

```ts
interface FlightLearnDiagnosisView {
  headline: string;
  whatHappened: string;
  whyItMatters: string;
  rawClue: string | null;
  confidence: "high" | "medium" | "low";
  limits: string[];
}
```

- Use existing `ExpectationDelta`, `DeltaDetectorSignal`, and `DeltaEvidenceRef` inputs.
- Prefer useful human-authored `expectation`, `reality`, and `impact` fields when they are already plain English.
- Add deterministic templates for signal types such as `reflection-cluster`, `failed-validation`, `repeated-tool-failure`, `stale-edit-attempt`, `reversal-retry-loop`, `user-correction`, `manual-capture`, and fallback/unknown cases.
- Extract coarse domains from local evidence snippets or commands, such as validation/test/build, edit/patch, package install, working-directory/setup context, missing file/module/path, and user correction.
- Keep raw commands, paths, cluster IDs, and detector IDs out of the primary headline when a clearer phrase can be derived; expose them only as `rawClue` or limits.
- Add focused unit tests for representative inputs, including the screenshot-shaped case.

Out of scope:

- Integrating the helper into `src/flight-learn-inbox.ts` rendering; that belongs to `ticket:20260527-flight-learn-diagnosis-card-integration`.
- Changing storage schema, persisted delta fields, artifact candidate semantics, CLI output, visible commands, or Pi extension registration.
- Hosted/model/provider calls, network access, classifier automation, or optional model-assisted phrasing.
- Writing Loom/source/docs/rules/skills/prompts from the generated diagnosis.

Constraints:

- The helper must be pure/deterministic and suitable for unit tests.
- The helper must use existing redaction/sanitization utilities where needed and avoid persisting secrets in tests/fixtures.
- If a good diagnosis cannot be derived, return an honest low-confidence fallback such as `A repeated issue was detected, but the plain-English cause is unclear.` rather than pretending certainty.
- Do not silently mutate `ExpectationDelta` fields. This is a display view model, not the source of truth.

First likely Ralph run:

- Read this ticket, the parent plan, `spec:flight-learn-inbox-ux`, `src/types.ts`, `src/delta-capture.ts`, `src/flight-learn-inbox.ts`, and existing tests.
- Implement the helper and colocated tests.
- Stop if implementation reveals the helper would need a stored data migration, model call, or broader detector redesign to satisfy acceptance.

## Acceptance

- ACC-001: A pure local diagnosis helper exists and returns a structured display object with at least `headline`, `whatHappened`, `whyItMatters`, `rawClue`, confidence, and limits or equivalent metadata.
  - Evidence: source inspection plus focused tests importing the helper directly.
  - Audit: closure audit should challenge purity, local-first behavior, and whether the result shape is display-only.

- ACC-002: Representative reflection-cluster/raw-command input produces a plain-English primary headline and what-happened text without requiring the operator to decode raw shell commands, local paths, cluster IDs, or detector IDs.
  - Evidence: unit test fixture shaped like the operator screenshot, asserting primary fields exclude raw command/path/cluster ID while `rawClue` or limits preserve inspectable details.
  - Audit: closure audit should challenge whether the generated phrase is actually understandable rather than just less raw.

- ACC-003: Signal-type and evidence-domain templates cover at least reflection clusters, validation/test/build failures, stale edit attempts, user corrections, and an unknown fallback.
  - Evidence: focused unit tests for each covered case.
  - Audit: closure audit should challenge template overclaiming and ensure low-confidence fallback remains honest.

- ACC-004: Human-authored useful delta fields are respected without being overwritten by generic detector templates.
  - Evidence: unit tests where manual/plain fields win over raw detector fallback.
  - Audit: closure audit should challenge whether the helper demotes useful user-authored context.

- ACC-005: The helper introduces no hosted/model/provider calls, network access, storage writes, schema changes, command registration, or source-of-truth mutation.
  - Evidence: source inspection and test/build/typecheck output.
  - Audit: closure audit should search for forbidden side effects and package/dependency changes.

## Current State

Closed. The helper-only closure claim is satisfied: `src/flight-learn-diagnosis.ts` now exports a pure deterministic local display helper that turns `ExpectationDelta` + signals into plain-English diagnosis fields, and `src/flight-learn-diagnosis.test.ts` covers representative raw detector, validation/build, stale-edit, user-correction, useful human-authored field, and low-confidence fallback cases.

Final implementation shape:

- `buildFlightLearnDiagnosisView(...)` returns display-only `headline`, `whatHappened`, `whyItMatters`, `expectedBehavior`, `rawClue`, `confidence`, and `limits`.
- Useful human-authored summary/reality/impact/expectation fields are respected independently when they are plain English.
- Raw commands, local paths, cluster IDs, and detector details are excluded from primary fields when a deterministic phrase can be derived and retained as `rawClue` when useful.
- No storage schema, command registration, package dependency, model/provider, network, or UI integration changes were made in this ticket.

Evidence:

- `evidence:20260527-flight-learn-diagnosis-view-model-validation`
  - focused tests passed: 1 file / 5 tests;
  - typecheck passed;
  - build passed;
  - full tests passed: 19 files / 96 tests;
  - targeted diff check passed;
  - targeted side-effect scan found no forbidden hooks.

Audit:

- `audit:20260527-flight-learn-diagnosis-view-model-review` first returned `changes-needed` with `FIND-001` against ACC-004.
- Follow-up implementation resolved `FIND-001`.
- `audit:20260527-flight-learn-diagnosis-view-model-followup-review` returned `clear` / ready-to-close for this helper-only scope.

Residual risk:

- The helper is not yet integrated into `/flight-learn`; that is owned by `ticket:20260527-flight-learn-diagnosis-card-integration`.
- Real Pi TUI behavior is not proven here; that is owned by `ticket:20260527-flight-learn-diagnosis-real-pi-validation`.
- Some auxiliary domains are source-covered but not individually tested; the follow-up audit did not consider this blocking for current acceptance.

## Journal

- 2026-05-27: Created ticket from Loom Weaver shaping after operator asked how plain-English headlines should be generated. The chosen route is deterministic display-time generation, not stored-data mutation or model-assisted phrasing.
- 2026-05-27: Set status to `active`; launching bounded Ralph implementation run for helper + tests only.
- 2026-05-27: Ralph implementation returned with helper/test files changed. Coordinator reran focused tests, typecheck, build, full tests, diff check, and targeted side-effect scan; recorded `evidence:20260527-flight-learn-diagnosis-view-model-validation`.
- 2026-05-27: Set status to `review`; launching bounded Ralph audit before closure.
- 2026-05-27: Audit `audit:20260527-flight-learn-diagnosis-view-model-review` returned `changes-needed` with `FIND-001` against ACC-004. Set status back to `active` for a bounded fix run.
- 2026-05-27: Follow-up implementation run resolved the summary-gated human-field behavior, added `expectedBehavior`, added a raw-summary/useful-fields test, and reran focused tests/typecheck/build/full tests/diff check/side-effect scan. Updated evidence dossier and set status back to `review` for follow-up audit.
- 2026-05-27: Follow-up audit `audit:20260527-flight-learn-diagnosis-view-model-followup-review` returned `clear` / ready-to-close. Closed ticket with UI integration and real Pi validation explicitly deferred to dependent tickets.
