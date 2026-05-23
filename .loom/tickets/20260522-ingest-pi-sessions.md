# Ingest Pi Sessions

ID: ticket:20260522-ingest-pi-sessions
Type: Ticket
Status: review
Created: 2026-05-22
Updated: 2026-05-22
Risk: medium - parser correctness affects all downstream episode evidence
Priority: high - storage and extraction depend on parsed session events
Depends On: ticket:20260522-bootstrap-project-scaffold

## Summary

Implement the Pi session reader/parser and normalized event model. The closure claim is that fixture Pi JSONL files can be parsed into provenance-rich events while preserving session header metadata, entry IDs, parent links, timestamps, entry types, and branch/compaction context needed by later extraction.

## Related Records

- `spec:failure-memory-mvp` - especially REQ-001 through REQ-004 and SCN-001/SCN-003.
- `research:20260522-agent-session-memory-landscape` - records Pi session-format findings and parsing prior art.
- `plan:20260522-pi-flight-recorder-mvp` - sequences ingestion before storage/extraction.

## Scope

May change:

- Parser/reader source files.
- Type definitions for session headers, entries, normalized events, source refs, parse warnings, and branch paths.
- Fixture JSONL files under a test fixture directory.
- Parser tests.

Must not change:

- No persistent SQLite schema yet except temporary test helpers if unavoidable.
- No failure/fix inference beyond marking raw candidate facts needed by tests.
- No Pi extension UI.

The parser should tolerate malformed lines by returning parse warnings while continuing with valid lines when safe. It should preserve enough raw fields for downstream extraction without storing unnecessary full transcript copies in normalized event objects.

Likely first Ralph run: implement fixture-driven parser and tests for session headers, message entries, bash executions, tool results, custom/compaction/branch entries, and parent/child path handling.

Stop if Pi session format docs conflict with observed fixture/source reality; route the discrepancy to research/spec update before continuing.

## Acceptance

- ACC-001: Parser reads a valid Pi v3 JSONL fixture and returns session metadata plus normalized events with source refs.
  - Evidence: Unit test over fixture asserts cwd/session id/file path/entry id/parent id/timestamp/type fields.
  - Audit: Review source refs are sufficient for evidence-backed answers.

- ACC-002: Parser identifies `bashExecution` and errored `toolResult` entries without losing command/output/tool metadata needed by extraction.
  - Evidence: Unit test asserts command, exit code, cancelled/truncated flags, tool name, `isError`, and content snippets.
  - Audit: Review that sensitive full outputs are not copied into unnecessary derived fields.

- ACC-003: Parser handles branch/parent relationships well enough to expose a path or ancestry representation to the extractor.
  - Evidence: Branching fixture test asserts unrelated sibling branches are distinguishable.
  - Audit: Review that downstream extraction will not be forced to treat the file as a flat transcript.

- ACC-004: Malformed or unsupported entries produce warnings rather than crashing the entire sync.
  - Evidence: Unit test with malformed line/unknown type asserts warning plus continued parsing.
  - Audit: Review warning messages are user-friendly and do not leak secrets.

## Current State

Implementation complete. `src/session-parser.ts` parses Pi JSONL fixtures, preserves source refs, warnings, bash/tool events, and branch ancestry. Parser tests pass. Evidence is recorded in `evidence:20260522-mvp-validation`. Ready for closure review; no independent Ralph audit has been performed.

## Journal

- 2026-05-22: Created ticket with Status `open`. Scope is parser/event model only; extraction and storage are separate tickets.

- 2026-05-22: Implemented the ticket scope and moved Status to `review`. Validation evidence: `evidence:20260522-mvp-validation`. Closure still needs review/audit disposition; residual live-Pi and heuristic-quality limits are explicit where applicable.
