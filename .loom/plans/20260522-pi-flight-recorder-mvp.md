# pi-flight-recorder MVP Plan

ID: plan:20260522-pi-flight-recorder-mvp
Type: Plan
Status: completed
Created: 2026-05-22
Updated: 2026-05-23
Risk: medium - coordinates new local storage, session parsing, heuristic extraction, and Pi integration

## Summary

This plan decomposes the first `pi-flight-recorder` MVP: a local-first Failure Memory loop for Pi sessions. It needs multiple tickets because project scaffolding, Pi JSONL parsing, SQLite/FTS storage, outcome-aware extraction, CLI query UX, Pi extension wrapping, and final validation each have separate closure/evidence stories.

When complete, a user should be able to index local Pi sessions and ask “have I seen this failure before?” from a CLI and Pi wrapper, receiving evidence-backed prior failures/fixes instead of generic session search results.

## Related Records

- `constitution:main` - defines identity, principles, and explicit MVP boundaries.
- `research:20260522-agent-session-memory-landscape` - supports the architecture choice and rejected paths.
- `spec:failure-memory-mvp` - owns intended behavior, requirements, scenarios, evidence plan, and boundaries.
- `README.md` and `CLAUDE.md` - project-level orientation and working constraints.

## Strategy

Build a narrow vertical failure-memory path before expanding into richer dashboards or broad memory. The route is:

1. Establish a strict TypeScript scaffold so every later ticket has a runnable validation baseline.
2. Parse Pi sessions structurally before storage/extraction to preserve provenance and branch relationships.
3. Build local SQLite/FTS storage as an inspectable, embedding-free substrate.
4. Add deterministic outcome-aware extraction for failures, signatures, attempts, likely resolutions, confidence, limits, and redaction.
5. Expose the core through CLI/JSON first so it is testable outside Pi.
6. Wrap the core with a thin Pi extension after the API is stable enough.
7. Finish with end-to-end validation, docs, and minimal feedback posture.

The plan deliberately leaves out tmux/Ghostty UI, autonomous fixing, hosted embeddings, broad idea mining, and automatic Loom promotion. Those would require separate specs/plans after the failure-memory loop proves useful.

Validation posture: every child ticket should produce tests or documented checks that support its own acceptance criteria. Final MVP trust should come from fixture-driven unit/integration tests plus an end-to-end CLI/Pi smoke path. Query outputs must cite evidence and expose uncertainty; false negatives are preferable to confident false positives.

Replan triggers:

- Pi session format differs materially from docs or fixtures.
- Local Node runtime cannot support a viable open-source SQLite/FTS implementation.
- Extraction heuristics repeatedly infer false resolutions on fixtures.
- Pi extension APIs require a different package shape than the CLI/library core can support.
- Secret redaction conflicts with query usefulness in a way that needs product judgment.

## Execution Units

### Unit: Bootstrap runnable project

Ticket: `ticket:20260522-bootstrap-project-scaffold`

Create the strict TypeScript package scaffold, test/typecheck scripts, CLI placeholder, and dev docs. This must run before behavior tickets so parser/storage/extractor work has a common validation harness. Single closure claim: the project is ready for implementation tickets to add code with tests.

### Unit: Parse Pi session JSONL into provenance-rich events

Ticket: `ticket:20260522-ingest-pi-sessions`

Implement session discovery/reading/parsing and normalized event/source-ref types. This must preserve tree/branch provenance before extraction tries to infer episodes. Single closure claim: fixture sessions parse into source-ref-rich events and warnings without flattening meaningful branches.

### Unit: Store and search local derived state

Ticket: `ticket:20260522-store-and-index-episodes`

Create the SQLite/FTS persistence layer and idempotent sync substrate. It can proceed after scaffold, but should align with the parser event interface before final closure. Single closure claim: parsed/episode-like data can be stored, synced idempotently, and exact-token searched locally without embeddings.

### Unit: Extract outcome-aware failure/fix episodes

Ticket: `ticket:20260522-extract-failure-fix-episodes`

Implement deterministic heuristics for failure candidates, signatures, attempted fixes, likely resolutions, confidence, limits, and redaction. This is the core differentiator and depends on parsed event provenance. Single closure claim: fixture sessions produce honest structured failure/fix episodes.

### Unit: Expose query through CLI and JSON API

Ticket: `ticket:20260522-query-cli`

Implement sync/query CLI commands and library/JSON output over the local index. This creates the first usable surface and gives the Pi wrapper a stable core to call. Single closure claim: a user can query prior failure episodes from the CLI with evidence-backed output.

### Unit: Wrap core behavior as a Pi extension

Ticket: `ticket:20260522-pi-extension-wrapper`

Register Pi commands/tools that call the core library rather than duplicating logic. This integrates the failure-memory loop into the target workflow. Single closure claim: Pi can trigger query behavior and render the same evidence-backed results.

### Unit: Validate, document, and prepare feedback loop

Ticket: `ticket:20260522-validation-docs-feedback`

Create the end-to-end validation story, first-run docs, and minimal feedback hook or explicit follow-up. This is the trust/handoff unit for calling the MVP usable. Single closure claim: future users/agents can run, understand, and evaluate the MVP without chat history.

## Milestones

### Milestone: Foundation Ready

Child tickets: `ticket:20260522-bootstrap-project-scaffold`, `ticket:20260522-ingest-pi-sessions`, `ticket:20260522-store-and-index-episodes`

The project has a runnable TypeScript harness, Pi sessions parse into source-ref-rich events, and local storage/FTS can persist and search derived records.

### Milestone: Failure Memory Core Ready

Child tickets: `ticket:20260522-extract-failure-fix-episodes`, `ticket:20260522-query-cli`

The system can extract meaningful failure/fix episodes and answer CLI queries with evidence-backed results without embeddings.

### Milestone: Pi MVP Ready

Child tickets: `ticket:20260522-pi-extension-wrapper`, `ticket:20260522-validation-docs-feedback`

The core works inside Pi, has end-to-end validation evidence, has first-run docs, and either has minimal local feedback or an explicit follow-up ticket.

## Current State

Completed. All seven child tickets are closed after final review-state reconciliation. The MVP closure is supported by `evidence:20260522-mvp-validation` plus later stabilized-code validation (`npm run typecheck`, `npm test`, `npm run test:smoke:local`, `npm run build`, and `npm pack --dry-run`) and `audit:20260523-final-review-state-reconciliation-review`.

The completed MVP claim remains narrow: local-first parsing/storage/extraction/query/Pi-wrapper behavior is implemented and validated at fixture/test/build/package level. It does not claim long-run real-corpus precision tuning or hosted/model-provider behavior.

## Journal

- 2026-05-22: Created plan with Status `open`, based on completed landscape research and active Failure Memory MVP spec. Created seven child tickets and linked them from execution units.

- 2026-05-22: Ran the MVP plan through all child tickets. Implementation and validation evidence exist; moved plan Status to `review` pending audit/live-Pi disposition.
- 2026-05-23: Final review-state reconciliation closed all MVP child tickets and set plan status to `completed`; residual corpus/provider limits remain outside the MVP completion claim.
