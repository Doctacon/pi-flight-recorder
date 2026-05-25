# Artifact Candidate Drafts Validation

ID: evidence:20260523-artifact-candidate-drafts-validation
Type: Evidence Dossier
Status: recorded
Created: 2026-05-23
Updated: 2026-05-23
Observed: 2026-05-23

## Validation Question

Does `ticket:20260523-artifact-candidate-drafts` generate and store safe, bounded, redacted candidate-only draft/handoff text for the first artifact set without mutating source code, docs, Loom records, skills, prompt files, active Flight Rules, or other durable artifacts?

## Source State Observed

Relevant source changes:

- `src/artifact-drafts.ts` - new candidate-only draft builder for first-set artifact types.
- `src/artifact-drafts.test.ts` - focused draft/redaction/no-mutation/Flight Rule handoff tests.
- `src/pi-extension.ts` - routes now call `buildArtifactCandidateDraft`, store `proposedDraft`, `nextStep`, `limits`, and `confidence`, and `/flight-deltas show` displays active candidate drafts.
- `src/pi-extension.test.ts` - asserts guided/fallback routes store draft/handoff text and remain unapplied.
- `src/index.ts` - exports draft builder surface.

First-set artifact types covered:

```text
flight-rule
loom-ticket
code-legibility
test-check
observe
```

## Observations

### Draft generation observation

`buildArtifactCandidateDraft` returns candidate-only draft fields:

- `proposedDraft`
- `nextStep`
- `limits`
- `confidence`

The generated drafts include redacted delta context, routing rationale, and evidence bullets. Drafts are bounded to 1,800 characters before storage.

Focused tests create candidates for each first-set artifact type and assert:

- `status = accepted` after route acceptance;
- `applied = false`;
- draft/next-step/limits/evidence/rationale are populated;
- draft text length is bounded;
- fixture secret-like values and raw `/Users/alice/...` paths are absent from serialized candidates.

### Mutation-boundary observation

The focused test creates a temp project with `.loom/tickets/` and `README.md`, snapshots directory listings, generates/stores all first-set candidates, and asserts the project and `.loom/tickets/` listings are unchanged afterward. Only the local SQLite data dir is written.

### Flight Rule handoff observation

The Flight Rule handoff test stores a `flight-rule` artifact candidate whose draft explicitly says it is not active and whose next step points to the existing `/flight-review` or `/flight-rules` approval workflow. The test asserts:

- candidate `artifactType = flight-rule`;
- candidate `applied = false`;
- no active Flight Rules exist for the cwd;
- `rule_candidates` count remains `0`;
- `flight_rules` count remains `0`.

### Pi routing/display observation

Existing `/flight-delta-review` and `/flight-deltas route` paths now store draft/handoff text on artifact candidates. `/flight-deltas show` displays active candidate draft, next step, and limits. Fake-Pi tests assert code-legibility and observe routes store draft text and still report that no artifact was created or applied.

### Command observations

Commands run from `/Users/crlough/Code/personal/pi-flight-recorder` after implementation:

```text
npm run typecheck
# passed

npm test -- src/artifact-drafts.test.ts src/pi-extension.test.ts src/storage.test.ts
# Test Files 3 passed (3)
# Tests 28 passed (28)

npm run typecheck
# passed

npm test
# Test Files 16 passed (16)
# Tests 72 passed (72)

npm run test:smoke:local
# Test Files 1 passed (1)
# Tests 1 passed (1)

npm run build
# passed

npm pack --dry-run
# total files: 80
# package size: 106.7 kB
# unpacked size: 552.6 kB
```

Node printed the expected `node:sqlite` experimental warning during tests.

## What This Shows

- Supports `ticket:20260523-artifact-candidate-drafts#ACC-001`: first-set routes produce artifact candidates with draft/next-step text, evidence refs, rationale, status, and limits.
- Supports `ticket:20260523-artifact-candidate-drafts#ACC-002`: tests assert no writes outside the local data dir/project directory snapshot and no durable artifact mutation; candidates remain `applied = false`.
- Supports `ticket:20260523-artifact-candidate-drafts#ACC-003`: Flight Rule handoff stores a draft candidate but does not create/approve/inject a Flight Rule or rule candidate; next step points to existing approval workflow.
- Supports `ticket:20260523-artifact-candidate-drafts#ACC-004`: draft text is bounded and redaction tests cover secret-like/path-heavy fixture data.
- Supports `ticket:20260523-artifact-candidate-drafts#ACC-005`: full validation passed.

## What This Does Not Show

- It does not write actual Loom tickets/specs/research/knowledge records.
- It does not write source files, docs, tests, skills, prompt templates, or CLAUDE/AGENTS files.
- It does not create active Flight Rules or bypass existing approval/injection controls.
- It does not implement broad polished drafting for every artifact taxonomy value beyond the first set.
- It does not evaluate outcome/recurrence or classifier readiness.
- It does not use a real model/provider; drafts are deterministic local handoffs.

## Related Records

- `ticket:20260523-artifact-candidate-drafts`
- `plan:20260523-delta-artifact-learning-loop`
- `spec:delta-artifact-learning-loop#REQ-006`
- `spec:delta-artifact-learning-loop#REQ-007`
- `spec:delta-artifact-learning-loop#REQ-008`
- `ticket:20260523-manual-artifact-routing-review`
