# MVP Validation Command Results

ID: evidence:20260522-mvp-validation
Type: Evidence Dossier
Status: recorded
Created: 2026-05-22
Updated: 2026-05-22
Observed: 2026-05-22

## Observation

From `/Users/crlough/Code/personal/pi-flight-recorder`, the following validation commands were run after implementing the MVP scaffold, parser, storage, extractor, CLI, Pi wrapper, and docs:

```sh
npm run typecheck && npm test && npm run build
npm pack --dry-run
```

Observed output summary:

```text
> pi-flight-recorder@0.1.0 typecheck
> tsc --noEmit

> pi-flight-recorder@0.1.0 test
> vitest run

Test Files  6 passed (6)
Tests       20 passed (20)

> pi-flight-recorder@0.1.0 build
> npm run clean && tsc -p tsconfig.build.json

> pi-flight-recorder@0.1.0 clean
> rm -rf dist
```

`npm pack --dry-run` reported a package containing `dist/`, `docs/first-run.md`, `README.md`, `CLAUDE.md`, and `package.json` with 37 total files.

Node emitted `ExperimentalWarning: SQLite is an experimental feature and might change at any time` during tests that load `node:sqlite`. The warning is expected and is documented in README/first-run docs.

## What This Shows

- Supports `spec:failure-memory-mvp#REQ-001` through `REQ-004`: parser tests cover Pi session JSONL fixtures, provenance-rich source refs, bash executions, errored tool results, malformed lines, and branch ancestry.
- Supports `spec:failure-memory-mvp#REQ-005` through `REQ-006`: extractor tests cover failure signatures, observed failure evidence, attempts, likely resolution, unresolved episodes, branch-aware resolution limits, confidence, and source refs.
- Supports `spec:failure-memory-mvp#REQ-007` through `REQ-009`: storage tests cover local SQLite/FTS schema, idempotent parsed-session storage, and exact-token FTS query without embeddings.
- Supports `spec:failure-memory-mvp#REQ-010` through `REQ-012`: CLI tests cover sync/query output, JSON output, evidence-backed formatting, and no-match messages.
- Supports `spec:failure-memory-mvp#REQ-013`: extractor tests cover redaction of API key/token-looking values from derived snippets.
- Partially supports `spec:failure-memory-mvp#REQ-014`: CLI feedback command records local ratings; no higher-level feedback review workflow exists yet.
- Supports child ticket acceptance for scaffold, ingestion, storage, extraction, query CLI, Pi wrapper, and validation docs at fixture/test level.

## What This Does Not Show

- Does not prove behavior against the user’s full real Pi session corpus.
- Does not prove Pi extension loading inside a live Pi TUI; wrapper behavior is covered by fake-Pi unit tests.
- Does not prove extraction heuristics are high precision on noisy real sessions.
- Does not provide independent adversarial audit beyond automated tests and this evidence summary.
- Does not remove Node’s `node:sqlite` experimental warning.

## Related Records

- `spec:failure-memory-mvp` - behavior contract evaluated by these checks.
- `plan:20260522-pi-flight-recorder-mvp` - MVP plan consuming this evidence.
- `ticket:20260522-validation-docs-feedback` - final validation/docs/feedback ticket.
