# Pi Extension Wrapper

ID: ticket:20260522-pi-extension-wrapper
Type: Ticket
Status: closed
Created: 2026-05-22
Updated: 2026-05-23
Risk: medium - integration touches Pi extension APIs and user session context
Priority: medium - required for native Pi workflow after CLI proves the core
Depends On: ticket:20260522-query-cli

## Summary

Wrap the CLI/library core in a Pi extension that exposes failure-memory commands/tools inside Pi. The closure claim is that a Pi user can trigger sync/query behavior from a session and receive evidence-backed results without duplicating core logic.

## Related Records

- `spec:failure-memory-mvp` - especially REQ-012 and the interface contract.
- `research:20260522-agent-session-memory-landscape` - records Pi extension/session docs and prior Pi packages.
- `ticket:20260522-query-cli` - provides the core JSON/library behavior this wrapper must call.
- `plan:20260522-pi-flight-recorder-mvp` - sequences Pi integration after CLI.

## Scope

May change:

- Pi package/extension entry files, command registration, tool wrapper, package docs, and integration tests or manual verification docs.

Must not change:

- Do not reimplement parser/storage/extraction in the extension layer.
- Do not inject hidden context automatically unless explicitly scoped by a future ticket.
- Do not read/send raw session data to hosted services.
- Do not add tmux/Ghostty UI.

Potential commands/tools should stay small, for example `/flight-sync`, `/seen-this-before`, and a tool callable by the assistant. Exact names can change during implementation if Pi conventions suggest better names.

Likely first Ralph run: re-read current Pi extension/package docs and examples, implement the thinnest wrapper around the core query API, and verify it loads in Pi or through a harness-level smoke test.

Stop if Pi API details differ from prior docs; update research/spec before committing to an integration shape.

## Acceptance

- ACC-001: Extension registers at least one command or tool that runs a failure-memory query using the core library/API.
  - Evidence: Integration/smoke test or documented Pi manual check showing command/tool registration and output.
  - Audit: Review wrapper does not duplicate core behavior or bypass redaction.

- ACC-002: Query output inside Pi preserves evidence refs, confidence, and limits from the CLI/library result.
  - Evidence: Fixture-backed wrapper test or captured manual output.
  - Audit: Review Pi rendering does not hide uncertainty or source refs.

- ACC-003: Extension can use current session cwd/project context as an optional filter without requiring it.
  - Evidence: Test or manual check with and without cwd filter.
  - Audit: Review cross-project matches are labeled rather than silently excluded or mixed.

- ACC-004: Extension documentation explains install/config/sync/query behavior and local-first privacy posture.
  - Evidence: Docs inspection.
  - Audit: Review docs do not promise autonomous fixing or complete memory.

## Current State

Closed. The MVP implementation review state is reconciled. `evidence:20260522-mvp-validation` supports the scaffold/parser/storage/extractor/query/Pi-wrapper/docs acceptance at fixture/test/build/package level, and later release validation (`npm run typecheck`, `npm test`, `npm run test:smoke:local`, `npm run build`, and `npm pack --dry-run`) passed in the stabilized code shape. `audit:20260523-final-review-state-reconciliation-review` found no material issue with closing stale MVP review tickets while preserving broader limits.

Residual limits remain outside this ticket: full real-corpus precision tuning and hosted/model-provider behavior are not claimed by the MVP closure.

## Journal

- 2026-05-22: Created ticket with Status `open`. Scope is wrapper only; no automatic context injection in the MVP wrapper.

- 2026-05-22: Implemented the ticket scope and moved Status to `review`. Validation evidence: `evidence:20260522-mvp-validation`. Closure still needs review/audit disposition; residual live-Pi and heuristic-quality limits are explicit where applicable.
- 2026-05-23: Final review-state reconciliation closed this stale `review` ticket with supporting evidence/audit links; residual provider/corpus limits remain outside this ticket.
