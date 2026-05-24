# Delta Capture Signals

ID: ticket:20260523-delta-capture-signals
Type: Ticket
Status: open
Created: 2026-05-23
Updated: 2026-05-23
Risk: medium - detector suggestions can become noisy or misleading if signal reasons are weak, but pending-review status keeps the behavior reversible
Priority: medium - builds the corpus needed before artifact routing/classifier work has value
Depends On: ticket:20260523-delta-record-data-model

## Summary

Add explicit manual capture and low-risk detector suggestions for expectation-delta candidates. The closure claim is that `pi-flight-recorder` can create reviewable delta candidates with explainable signal reasons from local session/failure/reflection signals, without applying routes or creating artifacts.

## Related Records

- `plan:20260523-delta-artifact-learning-loop` - sequencing and non-goals.
- `spec:delta-artifact-learning-loop#REQ-003` and `#REQ-004` - explicit/manual capture plus explainable detector suggestions.
- `ticket:20260523-delta-record-data-model` - required storage/type substrate.
- `spec:seamless-failure-memory-ux` - current reflection clusters and feedback actions.
- `src/parser.ts`, `src/extractor.ts`, `src/pattern-miner.ts`, `src/reflection.ts`, `src/pi-extension.ts` - likely read/write seams for signals and commands.

## Scope

May change:

- Library functions that derive pending delta candidates from existing occurrences, reflection clusters, feedback/correction signals, and explicit manual capture inputs.
- Pi/CLI command surfaces only if needed for explicit manual capture or listing candidate deltas, kept minimal and scriptable.
- Tests and fixtures for signal extraction.

Must not change:

- No artifact routing UI.
- No artifact candidates or drafts beyond linking to existing delta records if the data model requires it.
- No classifier/model calls.
- No automatic source/doc/Loom/rule mutation.
- No interruption-heavy live notifications for every detector suggestion.

Detector signal constraints:

- Every suggested delta must store why it exists, such as repeated exact failure, user correction phrase, retry/reversal loop, validation failure after assistant changes, or reflection cluster promotion.
- Prefer false negatives over noisy captures.
- Explicit user capture should be available even when heuristics miss the delta.

## Acceptance

- ACC-001: Users or tests can explicitly create a delta candidate with expectation/reality/evidence text and local provenance.
  - Evidence: focused CLI/library or command test.
  - Audit: Later review should ensure explicit capture does not require raw session dumping.

- ACC-002: At least two low-risk detector signals create pending delta candidates with explainable signal reasons; recommended first signals are repeated reflection cluster and user correction language in fixture sessions.
  - Evidence: fixture tests showing signal type, explanation, evidence refs, and pending status.
  - Audit: Review should challenge false-positive risk and signal explainability.

- ACC-003: Detector suggestions remain pending/reviewable and do not automatically route, draft, apply, or notify noisily.
  - Evidence: tests asserting no artifact candidate creation or durable application side effects.
  - Audit: Review should reject hidden classifier or routing behavior.

- ACC-004: Existing reflection/failure behavior remains compatible.
  - Evidence: `npm run typecheck`, `npm test`, `npm run build`.
  - Audit: Regression review should inspect existing reflection proposal flow.

## Current State

Waiting on `ticket:20260523-delta-record-data-model`. Once the data contract exists, the first run should implement explicit capture and one or two conservative signal sources only.

## Journal

- 2026-05-23: Created as the corpus-capture child ticket for `plan:20260523-delta-artifact-learning-loop`.
