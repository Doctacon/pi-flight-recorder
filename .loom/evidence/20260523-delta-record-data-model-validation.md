# Delta Record Data Model Validation

ID: evidence:20260523-delta-record-data-model-validation
Type: Evidence Dossier
Status: recorded
Created: 2026-05-23
Updated: 2026-05-23
Observed: 2026-05-23

## Validation Question

Does `ticket:20260523-delta-record-data-model` now have a local, redacted storage/type contract for expectation deltas, detector signals, artifact candidates, routing rationale, recurrence links, and outcome placeholders without implementing detector/UI/model/classifier behavior?

## Source State Observed

Relevant changed source files:

- `src/storage.ts`
- `src/storage.test.ts`

Related pre-existing type/mapper surfaces used by the implementation:

- `src/types.ts`
- `src/storage-mappers.ts`

The implementation adds storage APIs and schema wiring for expectation deltas and artifact candidates while reusing the existing local SQLite store and sanitization helpers.

## Observations

### Storage/schema observation

`src/storage.ts` now initializes local SQLite tables for:

```text
expectation_deltas
delta_detector_signals
artifact_candidates
delta_recurrence_links
```

It also bumps the schema/user version to `4` and exposes store APIs for:

```text
createExpectationDelta
getExpectationDelta
listExpectationDeltas
acceptExpectationDelta
dismissExpectationDelta
markExpectationDeltaResolved
markExpectationDeltaRecurring
rerouteExpectationDelta
recordDeltaDetectorSignal
listDeltaDetectorSignals
createArtifactCandidate
getArtifactCandidate
listArtifactCandidates
acceptArtifactCandidate
dismissArtifactCandidate
markArtifactCandidateApplied
updateArtifactCandidateOutcome
linkDeltaRecurrence
listDeltaRecurrenceLinks
```

### Focused test observation

`src/storage.test.ts` now includes a focused storage test that exercises:

- creating a detector-sourced expectation delta;
- persisting redacted evidence refs and metadata;
- recording an explainable detector signal;
- accepting a delta;
- creating a routed `code-legibility` artifact candidate;
- accepting, marking applied, and recording outcome for the candidate;
- creating a second candidate and rerouting the delta without overwriting the first candidate outcome;
- linking recurrence back to a prior artifact candidate;
- creating and dismissing a separate delta;
- inspecting raw SQLite rows to ensure fixture secret-like values and raw home paths are not persisted in derived delta/candidate rows.

The existing legacy migration test now also checks that a schema-v1 local database opens under the current store, has the new delta/artifact tables, reports `PRAGMA user_version = 4`, and can count the new tables without breaking existing occurrence behavior.

### Command observations

Commands run from `/Users/crlough/Code/personal/pi-flight-recorder` after implementation:

```text
npm run typecheck
# passed

npm test -- src/storage.test.ts
# Test Files 1 passed (1)
# Tests 9 passed (9)

npm run typecheck
# passed

npm test
# Test Files 14 passed (14)
# Tests 64 passed (64)

npm run test:smoke:local
# Test Files 1 passed (1)
# Tests 1 passed (1)

npm run build
# passed

npm pack --dry-run
# total files: 74
# package size: 92.9 kB
# unpacked size: 478.5 kB
```

Node printed the expected `node:sqlite` experimental warning during tests.

## What This Shows

- Supports `ticket:20260523-delta-record-data-model#ACC-001`: schema and APIs represent deltas, detector signals, artifact candidates, routing rationale/status, recurrence links, and outcome fields as separate local records.
- Supports `ticket:20260523-delta-record-data-model#ACC-002`: focused tests store secret-like/path-heavy fixture values and assert raw secret-looking values and raw `/Users/...` paths are absent from derived delta/candidate rows.
- Supports `ticket:20260523-delta-record-data-model#ACC-003`: full typecheck/test/build/smoke/pack validation passed, and the legacy database migration test opens a schema-v1 fixture under schema version 4 without breaking existing occurrence behavior.
- Supports `ticket:20260523-delta-record-data-model#ACC-004`: storage APIs and tests demonstrate create, accept, dismiss, route/reroute, create artifact candidate, accept/apply, outcome update, and recurrence-link flows without requiring detector/UI decisions.

## What This Does Not Show

- It does not implement or validate detector heuristics.
- It does not implement or validate Pi UI/review flows.
- It does not draft or apply real source/Loom/rule artifacts.
- It does not call or validate a model provider or classifier.
- It does not prove long-run corpus quality or classifier readiness.
- The migration evidence is a focused schema-v1 fixture, not every historical local database shape a user may have.

## Related Records

- `ticket:20260523-delta-record-data-model`
- `plan:20260523-delta-artifact-learning-loop`
- `spec:delta-artifact-learning-loop`
- `constitution:main`
