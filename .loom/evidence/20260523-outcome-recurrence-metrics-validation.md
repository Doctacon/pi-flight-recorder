# Outcome and Recurrence Metrics Validation

ID: evidence:20260523-outcome-recurrence-metrics-validation
Type: Evidence Dossier
Status: recorded
Created: 2026-05-23
Updated: 2026-05-23
Observed: 2026-05-23

## Validation Question

Does `ticket:20260523-outcome-recurrence-metrics` let local artifact candidates record accepted/applied/rejected outcome state, link later similar deltas as recurrence evidence, report cautious outcome categories, and preserve reroute history without implementing classifiers or mutating durable artifacts?

## Source State Observed

Relevant implementation changes:

- `src/delta-outcomes.ts` - new deterministic local outcome/recurrence helpers and summary formatting.
- `src/delta-outcomes.test.ts` - fixture timeline tests for no-recurrence/recurrence categories, history preservation, rejection, and reroute preservation.
- `src/storage.ts` - added `rejectArtifactCandidate`; existing accepted/applied/outcome/recurrence APIs remain route/evidence/rationale preserving.
- `src/storage-mappers.ts` and `src/types.ts` - artifact candidate status accepts `rejected`.
- `src/cli.ts` and `src/cli.test.ts` - debug/recovery CLI supports `delta summary`, `delta outcome`, and `delta recur` with cautious language checks.
- `src/pi-extension.ts` - Pi fallback command surface supports `/flight-deltas summary|apply|outcome|recur|reject`; `/flight-status` includes cautious delta outcome counts; `/flight-deltas show` includes outcome/application/recurrence details.
- `src/index.ts` - exports outcome helpers.

## Observations

### Outcome state observation

Focused tests create local artifact candidates, accept them, mark them applied, record outcome notes, and reject candidates. Observed assertions include:

- accepted/applied state is stored;
- outcome notes are stored;
- rejected status is stored;
- original `rationale` and `evidenceRefs` remain equal after outcome/rejection updates;
- active delta status is updated to `resolved` for a recorded `helped` outcome;
- secret-like fixture values are not persisted in rejection outcome text.

### Recurrence-link observation

Focused tests create an original routed/applied candidate, then create a later similar delta and call `recordDeltaRecurrenceWithStore`. Observed assertions include:

- a `delta_recurrence_links` record is created and remains inspectable by prior candidate;
- the later delta is marked `recurring`;
- when recurrence is linked after the prior candidate's `appliedAt`, the prior candidate becomes `status=recurring` with `outcome=needs-reroute`;
- rejected/dismissed candidates are protected from recurrence helper overwriting their rejection/dismissal state.

### Summary language observation

`formatDeltaOutcomeSummary(summarizeDeltaOutcomes(...))` and CLI output were checked for cautious categories:

- `unresolved`
- `insufficient evidence`
- `no recurrence observed`
- `recurring after applied`

Tests assert the summary says `No recurrence observed since applied`, includes `not proof`, and avoids standalone overconfident wording such as `fixed forever` or `solved`.

### Reroute-history observation

Fixture tests link a recurrence to a prior candidate, create a new `loom-ticket` candidate with `supersedesCandidateId`, reroute the later delta to that candidate, and assert:

- the later delta's `activeArtifactCandidateId` changes to the new candidate;
- the old candidate's rationale remains preserved;
- the old recurrence link remains queryable;
- the old candidate is not deleted.

### Command observations

Commands run from `/Users/crlough/Code/personal/pi-flight-recorder` after implementation:

```text
npm run typecheck
# passed

npm test -- src/delta-outcomes.test.ts src/cli.test.ts src/pi-extension.test.ts src/storage.test.ts
# Test Files 4 passed (4)
# Tests 36 passed (36)

npm run typecheck
# passed

npm test
# Test Files 17 passed (17)
# Tests 76 passed (76)

npm run test:smoke:local
# Test Files 1 passed (1)
# Tests 1 passed (1)

npm run build
# passed

npm pack --dry-run
# total files: 83
# package size: 113.8 kB
# unpacked size: 594.9 kB
```

Node printed the expected `node:sqlite` experimental warning during tests.

Additional scan:

```text
rg -n "fixed forever|caused improvement|\\bsolved\\b|automatic rerout|auto-route|mutat(e|ion).*artifact" \
  src/delta-outcomes.ts src/cli.ts src/pi-extension.ts src/delta-outcomes.test.ts src/cli.test.ts \
  .loom/evidence/20260523-outcome-recurrence-metrics-validation.md .loom/tickets/20260523-outcome-recurrence-metrics.md
```

Observed matches were test assertions, existing unrelated CLI feedback action text (`already-solved`), and ticket/evidence limitation prose. No product outcome-summary language used `fixed forever` or a standalone `solved` success claim. `git diff --check` over the touched source/record files produced no output.

## What This Shows

- Supports `ticket:20260523-outcome-recurrence-metrics#ACC-001`: accepted/applied/rejected/outcome note state is stored without losing original route/evidence/rationale.
- Supports `ticket:20260523-outcome-recurrence-metrics#ACC-002`: later similar deltas can be linked to prior artifact candidates as recurrence evidence, and recurrence after applied is represented explicitly.
- Supports `ticket:20260523-outcome-recurrence-metrics#ACC-003`: CLI and fake-Pi summary/status surfaces report cautious categories and limits without overconfident success language.
- Supports `ticket:20260523-outcome-recurrence-metrics#ACC-004`: rerouting after recurrence can create/link a new candidate without deleting prior outcome or recurrence history.
- Supports `ticket:20260523-outcome-recurrence-metrics#ACC-005`: full validation passed.

## What This Does Not Show

- It does not prove any artifact caused improvement.
- It does not prove long-run recurrence reduction on a mature real corpus.
- It does not implement a classifier or automated route selection.
- It does not automatically create, apply, or mutate source/docs/Loom/rules/skills/prompt artifacts.
- It does not provide a broad analytics dashboard; only narrow local status/summary surfaces were added.
- It does not include real interactive Pi TUI proof for the new `/flight-deltas summary|apply|outcome|recur|reject` commands.

## Related Records

- `ticket:20260523-outcome-recurrence-metrics`
- `plan:20260523-delta-artifact-learning-loop`
- `spec:delta-artifact-learning-loop#REQ-009`
- `ticket:20260523-artifact-candidate-drafts`
