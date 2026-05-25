# Manual Artifact Routing Review Validation

ID: evidence:20260523-manual-artifact-routing-review-validation
Type: Evidence Dossier
Status: recorded
Created: 2026-05-23
Updated: 2026-05-23
Observed: 2026-05-23

## Validation Question

Does `ticket:20260523-manual-artifact-routing-review` expose a Pi-native expectation-delta review flow that lets a user inspect a pending delta, refine expectation/reality/impact, choose an artifact route, record rationale, and store the route without applying or generating durable artifacts?

## Source State Observed

Relevant source changes:

- `src/pi-extension.ts`
  - adds guided `/flight-delta-review` flow;
  - adds scriptable fallback `/flight-deltas list|show|route|dismiss`;
  - registers both commands;
  - updates status output with pending delta/artifact-candidate counts.
- `src/pi-extension.test.ts`
  - adds fake-Pi guided routing test;
  - adds fallback/no-UI/observe/dismiss test;
  - extends command-registration assertions.

This builds on the delta storage and capture substrate from:

- `ticket:20260523-delta-record-data-model`
- `ticket:20260523-delta-capture-signals`

## Observations

### Guided review observation

The fake-Pi guided review test seeds a candidate delta with evidence refs and a `user-correction` signal, then invokes:

```text
/flight-delta-review --data-dir <temp>
```

The test observes:

- selection prompt includes the pending delta id/summary;
- review editor prefill includes `Expectation`, `Reality`, `Signals`, and `Evidence` sections;
- route prompt includes signal and evidence context;
- route choices include non-rule options: `Code legibility`, `Test/check`, `Loom ticket`, `Prompt/context`, `Skill/template`, `Observe/no artifact`, and `Flight Rule`;
- selecting `Code legibility` plus a rationale routes the delta;
- stored delta status becomes `routed`;
- an artifact candidate is stored with `artifactType = code-legibility`, `status = accepted`, `applied = false`, and the recorded rationale;
- no Flight Rule candidate or rule is created;
- notification explicitly says no artifact was created or applied.

### Fallback / observe / dismiss observation

The fallback test invokes `/flight-delta-review` with no interactive `select`/`editor` UI and observes explicit fallback guidance containing `/flight-deltas list` and route/dismiss commands. It then invokes:

```text
/flight-deltas route --delta <id> --type observe --rationale "Observe recurrence before creating an artifact"
/flight-deltas dismiss --delta <id> --reason "Not recurring"
```

The test observes:

- no-UI guided review leaves the delta in `candidate` status and creates no artifact candidates;
- the `observe` fallback route stores an accepted `observe` artifact candidate with `applied = false`;
- the original delta evidence refs remain present;
- dismiss changes the delta status to `dismissed` and preserves evidence refs;
- fallback route notification explicitly says no artifact was created or applied.

### Regression observation

Existing Flight Rule guided review tests still pass, including the flow that promotes a reflection proposal to an approved Flight Rule, injects it into `before_agent_start`, disables it, and verifies no injection after disable.

### Command observations

Commands run from `/Users/crlough/Code/personal/pi-flight-recorder` after implementation:

```text
npm run typecheck
# passed

npm test -- src/pi-extension.test.ts src/delta-capture.test.ts src/storage.test.ts
# Test Files 3 passed (3)
# Tests 29 passed (29)

npm run typecheck
# passed

npm test
# Test Files 15 passed (15)
# Tests 70 passed (70)

npm run test:smoke:local
# Test Files 1 passed (1)
# Tests 1 passed (1)

npm run build
# passed

npm pack --dry-run
# total files: 77
# package size: 103.0 kB
# unpacked size: 536.3 kB
```

Node printed the expected `node:sqlite` experimental warning during tests.

## What This Shows

- Supports `ticket:20260523-manual-artifact-routing-review#ACC-001`: fake-Pi guided review uses selection/editor prompts and exposes expectation, reality, signal reason, and evidence summary before routing.
- Supports `ticket:20260523-manual-artifact-routing-review#ACC-002`: selecting an artifact type records rationale, marks the delta routed, stores an accepted but unapplied artifact candidate, and creates no durable artifact or Flight Rule.
- Supports `ticket:20260523-manual-artifact-routing-review#ACC-003`: observe/no-artifact and dismiss paths preserve evidence refs and are tested separately.
- Supports `ticket:20260523-manual-artifact-routing-review#ACC-004`: no-UI fallback is explicit and scriptable through `/flight-deltas` commands.
- Supports `ticket:20260523-manual-artifact-routing-review#ACC-005`: full test/build validation passed, including existing guided Flight Rule review tests.

## What This Does Not Show

- It does not generate artifact drafts or handoff text beyond route/rationale/next-step storage.
- It does not create or mutate source code, docs, Loom records, rules, skills, or prompt templates.
- It does not implement classifier/model route selection.
- It does not prove real interactive TUI behavior for the new delta review flow; this ticket uses fake-Pi UI tests, consistent with its acceptance.
- It does not validate long-run route quality or classifier readiness.

## Related Records

- `ticket:20260523-manual-artifact-routing-review`
- `plan:20260523-delta-artifact-learning-loop`
- `spec:delta-artifact-learning-loop#REQ-005`
- `spec:delta-artifact-learning-loop#REQ-006`
- `spec:delta-artifact-learning-loop#REQ-007`
- `spec:delta-artifact-learning-loop#REQ-008`
