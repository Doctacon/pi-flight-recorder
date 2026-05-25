# Classifier Readiness Corpus Counts

ID: evidence:20260525-classifier-readiness-corpus-counts
Type: Evidence Observation
Status: recorded
Created: 2026-05-25
Updated: 2026-05-25
Observed: 2026-05-25 23:03 UTC

## Observation Question

How much manually routed expectation-delta / artifact-candidate / outcome data exists in the default local `pi-flight-recorder` SQLite database, and is it enough to evaluate automated artifact classification?

## Source State And Procedure

Source observed:

- Default local database: `~/.pi/flight-recorder/flight-recorder.db`.
- Aggregate-only SQL queries over `expectation_deltas`, `delta_detector_signals`, `artifact_candidates`, and `delta_recurrence_links`.
- Artifact: `.loom/evidence/artifacts/20260525-classifier-readiness-evaluation/aggregate-counts.json`.

Privacy boundary:

- No raw prompts, snippets, session paths, commands, rationale text, drafts, evidence refs, or user message content were exported.
- The artifact stores aggregate counts and distributions only.

Procedure:

```text
node <<'NODE'
# read-only aggregate query using node:sqlite
# write aggregate JSON to .loom/evidence/artifacts/20260525-classifier-readiness-evaluation/aggregate-counts.json
NODE
```

Node printed the expected `node:sqlite` experimental warning.

## Observed Counts

From `aggregate-counts.json`, the delta/artifact tables were not present in the default local database at observation time:

```json
{
  "expectation_deltas": false,
  "delta_detector_signals": false,
  "artifact_candidates": false,
  "delta_recurrence_links": false
}
```

Because the read-only aggregate query does not initialize or migrate the database, missing tables are treated as zero available classifier corpus for this evaluation.

Aggregate counts:

```json
{
  "expectationDeltas": 0,
  "detectorSignals": 0,
  "artifactCandidates": 0,
  "distinctDeltasWithArtifactCandidates": 0,
  "acceptedOrLaterArtifactCandidates": 0,
  "appliedArtifactCandidates": 0,
  "outcomeLabeledArtifactCandidates": 0,
  "appliedWithOutcomeArtifactCandidates": 0,
  "recurrenceLinks": 0
}
```

Observed distributions:

```json
{
  "deltaStatus": [],
  "deltaSource": [],
  "artifactType": [],
  "artifactStatus": [],
  "artifactOutcome": [],
  "artifactApplied": []
}
```

Threshold check recorded in the artifact:

```json
{
  "recommendedMinimumRoutedDeltas": "30-50 manually routed deltas with some outcome labels",
  "routedDeltaCount": 0,
  "outcomeLabeledArtifactCandidates": 0,
  "appliedWithOutcomeArtifactCandidates": 0,
  "recurrenceLinks": 0,
  "meetsMinimumRoutedDeltas": false,
  "hasOutcomeCoverage": false,
  "hasAppliedOutcomeCoverage": false,
  "hasRecurrenceEvidence": false
}
```

## What This Shows

- Supports `ticket:20260523-classifier-readiness-evaluation#ACC-001`: aggregate-only corpus counts and label/outcome coverage were gathered with no raw session or prompt content.
- Supports `ticket:20260523-classifier-readiness-evaluation#ACC-004`: the local corpus is far below the recommended 30-50 manually routed deltas and has no outcome/recurrence labels. The default database does not yet contain the delta/artifact tables, so classifier readiness thresholds are not met.

## What This Does Not Show

- It does not inspect raw session contents or diagnose why the default database has not accumulated or initialized delta/artifact tables yet.
- It does not evaluate classifier accuracy, agreement, precision, recall, or usefulness.
- It does not prove future corpora will remain too small; it is a point-in-time aggregate observation.
- It does not use hosted or local model calls.
- It does not establish product policy; research/ticket/audit records consume this observation.

## Related Records

- `ticket:20260523-classifier-readiness-evaluation`
- `research:20260525-classifier-readiness-evaluation`
- `spec:delta-artifact-learning-loop#REQ-010`
- `plan:20260523-delta-artifact-learning-loop`
