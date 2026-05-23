# Failure Memory MVP

ID: spec:failure-memory-mvp
Type: Spec
Status: active
Created: 2026-05-22
Updated: 2026-05-22

## Summary

This spec defines the first `pi-flight-recorder` product slice: ingest Pi session logs, extract failure/fix episodes, and answer “have I seen this before?” with local, evidence-backed prior recoveries.

## Product Slice

This spec owns the MVP workflow from local Pi session files to evidence-backed failure-memory answers. It covers ingestion semantics, episode shape, retrieval behavior, feedback affordances needed for the MVP, and privacy constraints.

This slice stops before tmux/Ghostty UI, broad idea mining, Loom promotion, autonomous code fixing, multi-agent orchestration, hosted sync, and full codebase graph retrieval.

## Spec Set Coverage

This is the initial active behavior contract for the project. Future specs should split out separate product slices when work expands into Pi extension UI, tmux/Ghostty cockpit status, idea mining, feedback/promotion workflows, or embeddings/clustering.

## Problem

Raw Pi session history contains the most useful clues about recurring developer friction: failed commands, stack traces, tool errors, abandoned approaches, user corrections, and eventual fixes. Generic semantic search can find related chats, but it does not reliably answer what failed, what worked, and why the current failure looks familiar.

## Desired Behavior

Given local Pi session logs, the MVP builds a local failure-memory index. A user or agent can provide an error, command output, or natural-language description, and the tool returns prior matching episodes with source evidence, likely successful fixes, failed attempts to avoid, and confidence/limits.

The MVP should also support an incremental indexing path so new sessions can be added without rebuilding all history every time.

## Not Doing

- No hosted storage or hosted inference by default.
- No autonomous code modification.
- No promise that every failure has a detected fix.
- No broad replacement for `pi-session-search` session browsing.
- No tmux/Ghostty UI in the first slice.
- No automatic Loom knowledge promotion.
- No reliance on proprietary SDKs or services.

## Requirements

- REQ-001: The ingester MUST read Pi JSONL session files from configurable local source directories, including the default active and archived Pi session directories.
- REQ-002: The parser MUST preserve source provenance for every extracted event, including session file path, session id when present, cwd, entry id, parent id, timestamp, entry type, and relevant message/tool fields.
- REQ-003: The parser MUST understand Pi tree structure well enough to avoid treating unrelated branches as one linear episode when branch/parent relationships are material.
- REQ-004: The extractor MUST identify candidate failure events from non-zero `bashExecution.exitCode`, cancelled/truncated command context, errored `toolResult` entries, and adjacent text that clearly describes a failure.
- REQ-005: The extractor SHOULD compute stable failure signatures from command, exit code, normalized error text, stack trace fragments, file paths, tool name, and project/cwd context.
- REQ-006: The episode model MUST represent at minimum: problem summary, failure signature, observed command/tool/error evidence, attempted fixes when detectable, likely resolution when detectable, files mentioned/touched when detectable, source refs, confidence, and unresolved limits.
- REQ-007: The storage layer MUST be local, inspectable, and rebuildable from source sessions. SQLite with FTS5 is the preferred MVP index.
- REQ-008: The indexer MUST be idempotent for unchanged sessions and support incremental sync based on file identity, modification time, and/or content hash.
- REQ-009: The query behavior MUST support exact-token matching for stack traces, file paths, command names, package names, and error codes without requiring embeddings.
- REQ-010: Query results MUST cite source refs and distinguish observed facts from inferred resolution advice.
- REQ-011: User-facing answers MUST include limits when no clear resolution was found, when confidence is low, or when the match comes from another project/cwd.
- REQ-012: The MVP MUST provide a CLI/library core that can run outside Pi, plus a path to wrap the same behavior in Pi commands/tools.
- REQ-013: The system MUST redact or avoid display/index snippets for obvious secret patterns such as API keys, tokens, passwords, private keys, and credential assignments.
- REQ-014: The feedback model SHOULD allow a user to mark a result as useful, not useful, already solved, wrong match, or worth promoting later, without requiring that feedback loop to be complete before the first query works.

## Scenarios

### SCN-001: Repeated failing command is recognized

Exercises: REQ-001, REQ-002, REQ-004, REQ-005, REQ-009, REQ-010

GIVEN a prior Pi session contains a `bashExecution` entry for `npm test` with a non-zero exit code and a recognizable stack trace
AND a later query includes the same command or stack-trace fragment
WHEN the user runs the failure-memory query
THEN the result includes the prior failure episode
AND cites the session file and entry id for the failed command.

### SCN-002: Prior resolution is shown separately from evidence

Exercises: REQ-006, REQ-010, REQ-011

GIVEN a prior episode includes a failed command, subsequent file edits or assistant/user text describing a fix, and a later successful validation command
WHEN that episode appears in a query result
THEN the answer separates “observed failure,” “likely fix,” and “evidence”
AND states confidence or limits if the resolution is inferred rather than explicit.

### SCN-003: Branches are not merged into false history

Exercises: REQ-003, REQ-006, REQ-011

GIVEN one Pi session contains multiple branches from a shared parent
AND only one branch eventually reaches a passing validation command
WHEN extracting an episode
THEN the likely resolution is only linked to the branch path that actually contains the passing validation
AND alternate failed branches may be listed as attempted paths only when provenance supports that relationship.

### SCN-004: Query works without embeddings

Exercises: REQ-007, REQ-009, REQ-012

GIVEN no embedding provider is configured
WHEN the user queries with an error token, file path, or command name
THEN the tool searches the local FTS index and returns ranked results without requiring network access.

### SCN-005: Secret-looking values are not exposed

Exercises: REQ-013

GIVEN a session output includes text matching a credential-like pattern
WHEN the entry is indexed or shown in a query result
THEN the stored/displayed snippet redacts the sensitive-looking value
AND the source ref remains available for local inspection without copying the secret into derived records.

### SCN-006: Low-confidence matches remain useful but honest

Exercises: REQ-010, REQ-011, REQ-014

GIVEN a query matches a prior failure by general language but not exact error tokens
WHEN results are returned
THEN the answer labels the match as lower confidence
AND offers feedback actions such as useful, wrong match, or already solved.

## Evidence Plan

- REQ-001 through REQ-004 / SCN-001: Fixture Pi JSONL files with session headers, message entries, `bashExecution`, `toolResult`, compaction, and branch records; parser/extractor tests assert source refs and detected failures.
- REQ-005 through REQ-006 / SCN-002 and SCN-003: Unit tests over curated fixture sessions assert stable signatures, branch-aware episode boundaries, attempted fix extraction, and resolution confidence.
- REQ-007 through REQ-009 / SCN-004: Integration test creates a temporary SQLite/FTS index, syncs fixtures twice, and queries exact stack/file/command tokens without embeddings.
- REQ-010 through REQ-011 / SCN-006: Snapshot or structured-output tests assert answer shape separates observations, inferences, confidence, limits, and source refs.
- REQ-012: CLI smoke test runs ingest/query against fixture data outside Pi.
- REQ-013 / SCN-005: Redaction tests assert obvious secret patterns are redacted in snippets and derived fields.
- REQ-014: Feedback persistence test can be added once the first feedback command exists; until then the requirement is a SHOULD and can remain partially implemented.

## Open Questions

- Default scope: Should first-run indexing scan all Pi sessions or only sessions for the current cwd? Recommended for MVP: global scan with project/cwd filter options and safe max limits. This does not block the first scaffold.
- SQLite package: Which TypeScript SQLite binding should be used after checking local Node runtime and FTS5 support? This is a scaffold-ticket decision and does not change behavior.
- Resolution confidence: How conservative should automatic “likely fix” detection be? Recommended for MVP: prefer false negatives over false positives and surface “observed but unresolved” episodes honestly.

## Quality Bar

A good MVP answer is short, specific, and inspectable. It should feel more like:

> “This resembles session X, entry Y: `npm test` failed with the same stack frame. The successful path later changed `src/config/paths.ts` and the next `npm test` passed. Earlier attempt Z did not work.”

It should not feel like generic semantic recall:

> “Here are some related conversations about tests.”

## Interface Contract

Initial interfaces are expected to be a TypeScript library and CLI, later wrapped by a Pi extension.

- Inputs: session source directories, sync/query options, raw query text or current failure text, optional cwd/project filter, optional result limit.
- Outputs: structured episodes, ranked results, source refs, confidence, limits, feedback handles, and human-readable summaries.
- Side effects: local index writes under a configurable data directory; no network by default.
- Error semantics: missing source directories produce friendly “nothing indexed” results; malformed lines are recorded as parse warnings without aborting the whole sync; missing FTS support produces actionable setup guidance.
- Validation boundary: fixture/integration tests define correctness for parser, extractor, index, query, and redaction before real sessions are trusted.
- Compatibility: Pi session format v3 is the primary target; v1/v2 compatibility can be partial if provenance and parsing remain honest.

## Examples And Non-Examples

Example answer shape:

```text
Seen before: likely match (0.86)
Failure: npm test failed with "Cannot find module '../paths'"
Prior fix: src/config/paths.ts was updated; next npm test passed
Avoid: earlier attempt changed package.json alias only and failed again
Evidence: session abc, entries e12f, e145, e162
Limits: prior session was in a different cwd; inspect before applying
```

Non-example:

```text
I found 12 sessions about npm and tests.
```

## Constraints

- Local-first and open-source dependencies only.
- No proprietary/managed memory services.
- No secret values in derived records, Loom docs, or fixtures.
- Keep raw Pi sessions as source of truth; derived index must be rebuildable.
- Work from Loom plan/tickets before implementation.

## Related Records

- `constitution:main` - defines the project identity and local-first/outcome-aware principles.
- `research:20260522-agent-session-memory-landscape` - compares prior art and supports the MVP direction.
- `plan:20260522-pi-flight-recorder-mvp` - decomposes implementation of this spec into child tickets.
