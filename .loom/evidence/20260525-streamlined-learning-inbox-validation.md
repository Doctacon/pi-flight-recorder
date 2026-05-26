# Streamlined Learning Inbox Validation

ID: evidence:20260525-streamlined-learning-inbox-validation
Type: Evidence Dossier
Status: recorded
Created: 2026-05-25
Updated: 2026-05-25
Observed: 2026-05-25

## Validation Question

Does the streamlined learning-inbox slice provide a tested one-command Pi path for delta routing and artifact outcome follow-up while preserving manual gates and existing validation health?

## Source State And Procedure

Source and records observed:

- `src/pi-extension.ts`
- `src/pi-extension.test.ts`
- `README.md`
- `docs/first-run.md`
- `docs/live-monitoring.md`
- `.loom/specs/delta-artifact-learning-loop.md`
- `ticket:20260525-streamlined-learning-inbox-command`

Commands run from `/Users/crlough/Code/personal/pi-flight-recorder`:

```text
npm run typecheck
npm test -- src/pi-extension.test.ts
npm test
npm run build
```

Node printed the known `node:sqlite` `ExperimentalWarning` during tests.

## Observations

### Typecheck

```text
> pi-flight-recorder@0.1.0 typecheck
> tsc --noEmit
```

Result: exit code 0.

### Focused Pi Extension Tests

```text
> pi-flight-recorder@0.1.0 test
> vitest run src/pi-extension.test.ts

 Test Files  1 passed (1)
      Tests  21 passed (21)
```

Observed focused coverage includes:

- command registration includes `flight-learn`;
- `/flight-learn` routes a pending expectation delta through the guided route flow and stores an accepted artifact candidate without applying artifacts;
- `/flight-learn` records artifact candidate outcome follow-up without typing a candidate ID;
- `/flight-learn` reports a concise no-ready-items message naming only `/flight-learn` and `/flight-status` as normal commands to remember.

### Full Test Suite

```text
> pi-flight-recorder@0.1.0 test
> vitest run

 Test Files  17 passed (17)
      Tests  79 passed (79)
```

Result: exit code 0.

### Build

```text
> pi-flight-recorder@0.1.0 build
> npm run clean && tsc -p tsconfig.build.json

> pi-flight-recorder@0.1.0 clean
> rm -rf dist
```

Result: exit code 0.

## What This Shows

- Supports `ticket:20260525-streamlined-learning-inbox-command#ACC-001`: focused tests observed the new command registration and docs name `/flight-learn` as the primary learning-loop command.
- Supports `ticket:20260525-streamlined-learning-inbox-command#ACC-002`: the tested flow records human-selected route/outcome choices; no tested path applies source/docs/Loom/rules/skills/prompts or classifier labels automatically.
- Supports `ticket:20260525-streamlined-learning-inbox-command#ACC-003`: focused tests observed `/flight-learn` routing a pending expectation delta to an accepted artifact candidate with `applied=false`.
- Supports `ticket:20260525-streamlined-learning-inbox-command#ACC-004`: focused tests observed `/flight-learn` recording a human-selected `helped` outcome for an artifact candidate without the user typing the candidate ID.
- Supports `ticket:20260525-streamlined-learning-inbox-command#ACC-005`: focused tests observed the no-ready-items message naming `/flight-learn` and `/flight-status` as the normal commands to remember.
- Supports `ticket:20260525-streamlined-learning-inbox-command#ACC-006`: focused and full tests passed after the new command tests were added.
- Supports `ticket:20260525-streamlined-learning-inbox-command#ACC-007`: docs and the delta spec were updated to explain the simplified command model and keep advanced fallback commands available.
- Supports the validation portion of `ticket:20260525-streamlined-learning-inbox-command#ACC-008`: typecheck, focused tests, full tests, and build passed. Audit is recorded separately as `audit:20260525-streamlined-learning-inbox-review`.

## What This Does Not Show

- Does not prove real interactive Pi TUI behavior for `/flight-learn`; tests use the existing fake Pi command/UI harness.
- Does not prove long-run corpus quality, classifier readiness, or outcome accuracy.
- Does not validate model-assisted reflection or any hosted provider path; no model/provider calls were made.
- Does not prove recurrence detection/linking automation; the implemented simplification records human-selected outcome/reroute decisions, while advanced recurrence linking remains available through fallback commands.
- Does not prove installed-package behavior after this change; build succeeded, but installed Pi package smoke was not rerun for this ticket.

## Related Records

- `ticket:20260525-streamlined-learning-inbox-command`
- `spec:delta-artifact-learning-loop#REQ-012`
- `ticket:20260523-classifier-readiness-evaluation`
