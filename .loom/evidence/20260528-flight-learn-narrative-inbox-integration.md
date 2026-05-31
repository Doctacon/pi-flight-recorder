# Flight Learn Narrative Inbox Integration Evidence

ID: evidence:20260528-flight-learn-narrative-inbox-integration
Type: Evidence Dossier
Status: recorded
Created: 2026-05-28
Updated: 2026-05-28
Observed: 2026-05-28

## Summary

Recorded validation for `ticket:20260528-flight-learn-narrative-inbox-integration`.

Changed source/test targets:

- `src/flight-learn-inbox.test.ts`

Artifact directory:

```text
.loom/evidence/artifacts/20260528-flight-learn-narrative-inbox-integration/
```

Key artifacts:

- `render-narrative-focused-card.mjs` - sanitized render harness for an already accepted local narrative `LocalDiagnosisPolishResult`.
- `render-output.txt` - focused-card render at width 88.
- `focused-tests.txt` - focused source/integration test output.
- `full-tests.txt` - full Vitest suite output.
- `typecheck.txt` - TypeScript check output.
- `build.txt` - package build output.
- `diff-check.txt` - whitespace diff check output; empty file means `git diff --check` passed with no output.
- `audit:20260528-flight-learn-narrative-inbox-integration-review` - adversarial audit; verdict `clear` for bounded UI-consumption scope.

No real Bonsai model, real judge model, runtime start, model download, hosted call, new command, storage/routing/classifier behavior change, artifact/rule/source mutation, or release-readiness claim was exercised or added.

## Procedure

Implementation was intentionally narrow because the focused-card renderer already consumes `LocalDiagnosisPolishResult.view` when local polish has been accepted and the reviewed fields still match stored delta fields.

Follow-up changes:

- Added a focused test that injects an already accepted local-model narrative result into the focused card.
- The test verifies:
  - local model disclosure is visible;
  - `Problem` remains concise;
  - `What happened?` carries a longer two-sentence narrative;
  - deterministic fallback text is not shown in the accepted narrative path;
  - rendered lines stay within width bounds;
  - route selection still returns the same human-reviewed route result;
  - stored delta fields are not mutated by display wording.
- Added a sanitized render harness/artifact at width 88 showing the distinct Problem / What happened? sections.

## Command Results

Focused source/integration tests:

```bash
npm test -- src/flight-learn-inbox.test.ts src/pi-extension.test.ts src/flight-learn-local-diagnosis-model.test.ts src/flight-learn-llama-cpp-adapter.test.ts
```

Result: passed, `4` test files / `75` tests.

Render harness:

```bash
node --import tsx .loom/evidence/artifacts/20260528-flight-learn-narrative-inbox-integration/render-narrative-focused-card.mjs > .loom/evidence/artifacts/20260528-flight-learn-narrative-inbox-integration/render-output.txt
```

Result: `render-output.txt` shows `Problem` as `Validation kept running from a stale shell.` and `What happened?` as a wrapped two-sentence narrative. The script reports `maxLineLength: 88`.

Typecheck:

```bash
npm run typecheck
```

Result: passed, TypeScript `tsc --noEmit`.

Build:

```bash
npm run build
```

Result: passed (`npm run clean && tsc -p tsconfig.build.json`).

Full tests:

```bash
npm test
```

Result: passed, `21` test files / `138` tests.

Diff check:

```bash
git diff --check
```

Result: passed with no output.

## Render Excerpt

From `render-output.txt`:

```text
Problem
 Validation kept running from a stale shell.

What happened?
 The accepted local narrative ties together repeated validation failures from
 redacted facts. It explains that the same check was rerun after the package changed,
 so the card is about validation trust rather than a separate code failure.
```

The same render still shows `Choose a follow-up` and existing route choices below the diagnosis text.

## What This Shows

- `ACC-001` is supported in UI-consumption scope: focused-card render/test artifacts show concise `Problem` and a distinct longer narrative `What happened?` when an accepted local narrative result is present.
- `ACC-002` is supported by existing fallback tests plus the focused test suite: unavailable/timeout paths use deterministic text and show the existing fallback disclosure.
- `ACC-003` is supported by tests/inspection in this scope: route selection remains human-driven, route results are unchanged, and display wording does not mutate stored delta fields, artifact candidates, rules, or source-of-truth records.
- `ACC-004` is supported by render artifact and tests: narrative text wraps cleanly at representative width 88 and existing focused-card sections remain visible.
- `ACC-005` is supported by focused tests, full tests, typecheck, build, diff-check, render artifact, and this evidence dossier.

## Audit

`audit:20260528-flight-learn-narrative-inbox-integration-review` returned `clear` for the bounded UI-consumption scope. The audit explicitly preserves non-claims about real Bonsai 4B, real judge quality, CLI judge configuration, runtime quality, and release readiness.

## What This Does Not Show

- This does not prove real Bonsai 4B, real judge model, real local runtime, latency, JSON reliability, model quality, or hardware suitability.
- This does not add or validate a real judge adapter or CLI judge configuration.
- This does not run a disposable real Pi TUI session.
- This does not make local-model polish default or required.
- This does not change stored `ExpectationDelta` fields, route ranking, classifier behavior, artifact candidate semantics, rules, source docs, visible commands, or model runtime lifecycle.

## Freshness And Recheck Triggers

Re-run or supersede this evidence if focused-card rendering changes, `LocalDiagnosisPolishResult` shape changes, model disclosure/fallback wording changes, route-selection behavior changes, or a real judge adapter/CLI integration is added.
