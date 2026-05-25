# Delta Capture Signals Validation

ID: evidence:20260523-delta-capture-signals-validation
Type: Evidence Dossier
Status: recorded
Created: 2026-05-23
Updated: 2026-05-23
Observed: 2026-05-23

## Validation Question

Does `ticket:20260523-delta-capture-signals` add explicit manual delta capture and conservative, explainable detector suggestions while keeping suggestions pending/reviewable and avoiding artifact routing/application, model calls, classifier behavior, or noisy live notifications?

## Source State Observed

Relevant source changes for this ticket:

- `src/delta-capture.ts` - new library surface for manual capture, reflection-cluster delta suggestions, and user-correction delta suggestions.
- `src/delta-capture.test.ts` - focused tests for explicit capture and the two conservative signal sources.
- `src/cli.ts` and `src/cli.test.ts` - minimal scriptable debug/manual CLI for explicit `delta capture` and `delta list`.
- `src/index.ts` - exports the delta-capture library surface.

This ticket builds on the storage/schema substrate from `ticket:20260523-delta-record-data-model`.

## Observations

### Explicit capture observation

`captureManualDeltaWithStore` and CLI `delta capture` create a local `expectation_deltas` record with:

- `source = manual`;
- `status = candidate`;
- expectation/reality/impact/severity fields when supplied;
- local evidence/provenance refs;
- a `manual-capture` detector signal for review traceability.

Focused tests pass secret-like and path-heavy fixture text through the explicit capture path and assert derived delta/signal fields are redacted.

### Detector-signal observation

`src/delta-capture.ts` implements two low-risk suggestion sources:

1. `suggestDeltasFromReflectionClustersWithStore`:
   - reads existing active failure clusters;
   - requires a conservative count threshold (`minCount`, default 2);
   - creates a deterministic candidate delta per cluster;
   - records a `reflection-cluster` signal with explanation and occurrence evidence refs;
   - is idempotent on repeated runs.

2. `suggestDeltasFromUserCorrectionsWithStore`:
   - reads parsed local Pi session events;
   - only considers `user` events;
   - matches conservative correction phrases such as `no, actually`, `that's not correct`, `you misunderstood`, and `the API works differently`;
   - creates a deterministic candidate delta per matched entry;
   - records a `user-correction` signal with session-entry provenance;
   - is idempotent on repeated runs.

Focused tests assert both detector sources create `candidate` deltas and `delta_detector_signals` while `artifact_candidates` stays at zero.

### Scope observation

A source scan of `src/delta-capture.ts` found no model/classifier references and no calls to artifact-candidate application APIs. The implementation does not touch Pi live-notification code or artifact mutation flows.

### Command observations

Commands run from `/Users/crlough/Code/personal/pi-flight-recorder` after implementation:

```text
npm run typecheck
# passed

npm test -- src/delta-capture.test.ts src/storage.test.ts
# Test Files 2 passed (2)
# Tests 12 passed (12)

npm test -- src/delta-capture.test.ts src/cli.test.ts src/storage.test.ts
# Test Files 3 passed (3)
# Tests 18 passed (18)

npm run typecheck
# passed

npm test
# Test Files 15 passed (15)
# Tests 68 passed (68)

npm run test:smoke:local
# Test Files 1 passed (1)
# Tests 1 passed (1)

npm run build
# passed

npm pack --dry-run
# total files: 77
# package size: 98.0 kB
# unpacked size: 507.5 kB
```

Node printed the expected `node:sqlite` experimental warning during tests.

## What This Shows

- Supports `ticket:20260523-delta-capture-signals#ACC-001`: explicit manual capture is available via library and debug/manual CLI, and focused tests assert redacted expectation/reality/evidence/provenance storage.
- Supports `ticket:20260523-delta-capture-signals#ACC-002`: two conservative low-risk signal sources create candidates with explainable `reflection-cluster` and `user-correction` signal records and local evidence refs.
- Supports `ticket:20260523-delta-capture-signals#ACC-003`: detector suggestions remain `candidate` deltas, repeated detector runs are idempotent, and tests assert no artifact candidates are created.
- Supports `ticket:20260523-delta-capture-signals#ACC-004`: full typecheck/test/smoke/build/pack validation passed after the new capture surface was added.

## What This Does Not Show

- It does not implement Pi-native delta review UI.
- It does not route deltas to artifact types or create artifact drafts.
- It does not apply source/docs/Loom/rule changes.
- It does not perform model calls or classifier routing.
- It does not prove detector quality on a long-run real corpus; the detector tests are synthetic fixture coverage designed for conservative first signals.
- It does not automatically scan all historical sessions for correction phrases; the library accepts parsed sessions for later orchestration.

## Related Records

- `ticket:20260523-delta-capture-signals`
- `ticket:20260523-delta-record-data-model`
- `plan:20260523-delta-artifact-learning-loop`
- `spec:delta-artifact-learning-loop#REQ-003`
- `spec:delta-artifact-learning-loop#REQ-004`
