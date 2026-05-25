# Delta Record Data Model Review

ID: audit:20260523-delta-record-data-model-review
Type: Audit
Status: recorded
Created: 2026-05-23
Updated: 2026-05-23
Audited: 2026-05-23
Target: ticket:20260523-delta-record-data-model

## Summary

A bounded Ralph-style adversarial review pass inspected the delta data-model implementation, focused tests, migration behavior, evidence, and ticket acceptance claims. Verdict: `clear` within audited scope. The implementation adds the local storage substrate for expectation deltas and artifact candidates without implementing detector heuristics, Pi UI, artifact mutation, model calls, or classifier behavior.

## Target

- `ticket:20260523-delta-record-data-model`
- Source diff for:
  - `src/storage.ts`
  - `src/storage.test.ts`
- Existing type/mapper contracts used by the implementation:
  - `src/types.ts`
  - `src/storage-mappers.ts`
- Evidence:
  - `evidence:20260523-delta-record-data-model-validation`

## Audit Scope And Lenses

Lenses:

- claim and evidence;
- acceptance coverage;
- data model separability and rerouting support;
- storage migration compatibility;
- redaction/privacy boundary;
- scope containment: no detector, UI, artifact creation, model, or classifier behavior;
- follow-through for residual risks.

Out of scope:

- detector heuristics or signal quality beyond the storage shape;
- Pi review UI;
- real artifact drafting/application;
- hosted/model-provider behavior;
- classifier readiness;
- long-run corpus quality.

## Context And Evidence Reviewed

Reviewed records:

- `ticket:20260523-delta-record-data-model`
- `plan:20260523-delta-artifact-learning-loop`
- `spec:delta-artifact-learning-loop`
- `constitution:main`
- `evidence:20260523-delta-record-data-model-validation`

Reviewed source paths:

- `src/storage.ts`
- `src/storage.test.ts`
- `src/types.ts`
- `src/storage-mappers.ts`

Reviewed validation evidence:

```text
npm run typecheck                              -> passed
npm test -- src/storage.test.ts               -> 1 file / 9 tests passed
npm test                                      -> 14 files / 64 tests passed
npm run test:smoke:local                      -> 1 file / 1 test passed
npm run build                                 -> passed
npm pack --dry-run                            -> 74 files
```

A scope scan found no detector/UI/model/classifier source changes in this ticket slice; the implementation change is confined to storage and storage tests.

## Findings

None - no material findings within audited scope.

## Verdict

`clear` within audited scope.

ACC-001 is supported: `expectation_deltas`, `delta_detector_signals`, `artifact_candidates`, and `delta_recurrence_links` are separate local tables, with storage APIs that keep delta state, signal evidence, artifact-candidate state, recurrence links, and candidate outcomes independently addressable.

ACC-002 is supported: the focused storage test pushes secret-like and path-heavy fixture values through delta/candidate/signal/metadata/evidence fields and inspects raw SQLite rows for absence of the fixture secret values and raw `/Users/...` paths.

ACC-003 is supported: the full test suite/build/smoke/pack checks passed, and the legacy schema-v1 fixture migrates to schema/user version 4 with the new tables present while existing occurrence behavior still works.

ACC-004 is supported: tests exercise create, accept, dismiss, route/reroute, artifact candidate creation, accepted/applied status, outcome update, and recurrence linking. The APIs do not apply artifacts or imply automatic mutation.

## Required Follow-up

- Continue with `ticket:20260523-delta-capture-signals` for explicit/manual capture and low-risk detector suggestions.
- Keep classifier automation deferred until the manual corpus/outcome tickets create enough labeled examples.
- Future migration work should add real historical DB fixtures if user environments expose older shapes beyond the focused schema-v1 compatibility fixture.

## Residual Risk

- The schema/API substrate is intentionally broader than current UI, so unused paths may need adjustment when later tickets exercise them.
- Redaction is pattern-based and tested against representative fixture secrets/paths, not every possible sensitive value.
- Outcome and recurrence APIs are placeholders for later product loops; this ticket proves storage shape, not recurrence-quality heuristics.
- No real detector, UI, artifact application, model call, or classifier behavior was verified.

## Related Records

- `evidence:20260523-delta-record-data-model-validation`
- `plan:20260523-delta-artifact-learning-loop`
- `spec:delta-artifact-learning-loop`
- `ticket:20260523-delta-capture-signals`
