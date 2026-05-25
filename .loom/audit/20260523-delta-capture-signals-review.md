# Delta Capture Signals Review

ID: audit:20260523-delta-capture-signals-review
Type: Audit
Status: recorded
Created: 2026-05-23
Updated: 2026-05-23
Audited: 2026-05-23
Target: ticket:20260523-delta-capture-signals

## Summary

A bounded Ralph-style adversarial review inspected the delta-capture implementation, tests, evidence, and acceptance claims. Verdict: `clear` within audited scope. The implementation adds explicit/manual capture plus two conservative detector suggestion sources and keeps all output as reviewable candidate deltas with explainable signals.

## Target

- `ticket:20260523-delta-capture-signals`
- Source diff for:
  - `src/delta-capture.ts`
  - `src/delta-capture.test.ts`
  - `src/cli.ts`
  - `src/cli.test.ts`
  - `src/index.ts`
- Evidence:
  - `evidence:20260523-delta-capture-signals-validation`

## Audit Scope And Lenses

Lenses:

- claim and evidence;
- acceptance coverage;
- signal explainability and false-positive risk;
- pending/reviewable state and no artifact side effects;
- privacy/redaction boundary;
- regression risk to existing failure/reflection behavior;
- scope containment: no routing UI, artifact drafts/application, model calls, classifier behavior, or noisy live notifications.

Out of scope:

- real Pi review UI;
- artifact routing or draft generation;
- long-run detector precision/recall;
- model/provider/classifier behavior;
- automatic historical-session scanning orchestration.

## Context And Evidence Reviewed

Reviewed records:

- `ticket:20260523-delta-capture-signals`
- `ticket:20260523-delta-record-data-model`
- `plan:20260523-delta-artifact-learning-loop`
- `spec:delta-artifact-learning-loop`
- `evidence:20260523-delta-capture-signals-validation`

Reviewed source paths:

- `src/delta-capture.ts`
- `src/delta-capture.test.ts`
- `src/cli.ts`
- `src/cli.test.ts`
- `src/index.ts`
- Storage APIs exercised from `src/storage.ts`

Reviewed validation evidence:

```text
npm run typecheck                                            -> passed
npm test -- src/delta-capture.test.ts src/storage.test.ts    -> 2 files / 12 tests passed
npm test -- src/delta-capture.test.ts src/cli.test.ts src/storage.test.ts -> 3 files / 18 tests passed
npm test                                                     -> 15 files / 68 tests passed
npm run test:smoke:local                                     -> 1 file / 1 test passed
npm run build                                                -> passed
npm pack --dry-run                                           -> 77 files
```

A scope scan found no model/classifier references in `src/delta-capture.ts`, no calls to artifact-candidate application APIs, and no live notification integration.

## Findings

None - no material findings within audited scope.

## Verdict

`clear` within audited scope.

ACC-001 is supported: explicit/manual capture is available through the library and the debug/manual CLI (`delta capture` / `delta list`), with tests covering redacted expectation/reality/evidence/provenance storage and a `manual-capture` signal.

ACC-002 is supported: two low-risk detector sources are implemented and tested. Reflection-cluster suggestions require an occurrence threshold and carry cluster/occurrence evidence; user-correction suggestions only inspect `user` events and require conservative correction phrases. Both write explainable signal records.

ACC-003 is supported: detector output remains `expectation_deltas.status = candidate`, repeated detector runs are idempotent, and tests assert `artifact_candidates` remains zero. No route, draft, apply, model, classifier, or noisy notification behavior is introduced.

ACC-004 is supported: full validation passed, including existing reflection/failure tests and local smoke.

## Required Follow-up

- Continue with `ticket:20260523-manual-artifact-routing-review` to expose review/routing UX over these candidate deltas.
- Keep detector expansion conservative; add new signal types only with fixture evidence and explainable reasons.
- Long-run precision/noise tuning remains future corpus work and should not be inferred from these synthetic tests.

## Residual Risk

- The user-correction detector is intentionally conservative but still phrase-based; real corpus tuning may reveal false positives/negatives.
- Historical session scanning/orchestration is not implemented here; the library accepts parsed sessions for later flows.
- The CLI is a debug/manual harness, not the final Pi-native review UX.
- Artifact routing and outcome learning are still unimplemented child tickets.

## Related Records

- `evidence:20260523-delta-capture-signals-validation`
- `plan:20260523-delta-artifact-learning-loop`
- `spec:delta-artifact-learning-loop#REQ-003`
- `spec:delta-artifact-learning-loop#REQ-004`
- `ticket:20260523-manual-artifact-routing-review`
