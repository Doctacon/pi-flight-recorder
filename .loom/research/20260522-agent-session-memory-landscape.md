# Agent Session Memory Landscape For pi-flight-recorder

ID: research:20260522-agent-session-memory-landscape
Type: Research
Status: completed
Created: 2026-05-22
Updated: 2026-05-22

## Summary

Research compared Pi session search, operational continuity tools, code-context infrastructure, background review loops, and tmux/Ghostty agent workspaces. The conclusion is that `pi-flight-recorder` should not compete as another generic semantic memory tool; it should start with a Pi-native, outcome-aware failure-memory loop that turns prior failed commands and successful recoveries into evidence-backed suggestions.

## Question

Which architecture and MVP scope best differentiates a local-first Pi session flight recorder from existing session search, agent memory, code retrieval, background review, and terminal cockpit tools?

## Scope

Covered:

- Pi session JSONL format and extension/session affordances.
- Existing Pi-specific session history search.
- Local/cross-agent operational memory and failure-memory tools.
- Code context infrastructure tools that emphasize retrieval quality and observability.
- Background review and terminal agent-cockpit tools as adjacent inspiration.

Excluded for this record:

- Detailed API design for every command.
- Benchmarks of embedding providers.
- tmux/Ghostty UI implementation.
- Automated code-fix loops.
- Hosted/proprietary memory services.

Freshness: web/repository research was gathered on 2026-05-22. Recheck if cited repositories materially change, if Pi session format changes, or before copying implementation details from any external project.

## Method And Sources

- Pi session format documentation (`https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/session-format.md`) - primary source for JSONL entries, message roles, tree structure, compaction, branch summaries, custom entries, and `SessionManager` API.
- Local Pi docs previously read from `/Users/crlough/.bun/install/global/node_modules/@earendil-works/pi-coding-agent/docs/` - primary source for extensions, sessions, session format, skills, packages, and TUI affordances.
- `samfoy/pi-session-search` (`https://github.com/samfoy/pi-session-search`) - Pi-specific baseline for session parsing, FTS5 search, optional hybrid embeddings, project/date filters, session read/list commands, and startup sync.
- `oldskultxo/aictx` (`https://github.com/oldskultxo/aictx`) - closest adjacent open-source operational-continuity tool; repo-local memory captures active work, next actions, decisions, failures, validation evidence, and failure memory.
- `eanai-ro/ean-agentos` (`https://github.com/eanai-ro/ean-agentos`) - cross-agent memory showing explicit “never solve the same bug twice” positioning with error resolutions, solution index, and experience graph.
- `codefromkarl/ContextAtlas` (`https://github.com/codefromkarl/ContextAtlas`) - open-source code-context infrastructure with hybrid retrieval, project memory, token-aware packing, and retrieval observability.
- `syncable-dev/memtrace-public` (`https://github.com/syncable-dev/memtrace-public`) - structural code memory prior art; useful for seeing where code graph memory is heading, but the repository advertises a proprietary EULA and should not be a dependency.
- `roborev-dev/roborev` (`https://github.com/roborev-dev/roborev`) - local background review loop for coding agents; inspiration for event-triggered review and queue/status UX.
- `OndrejDrapalik/gmux` (`https://github.com/OndrejDrapalik/gmux`) and `jarredkenny/jmux` (`https://github.com/jarredkenny/jmux`) - tmux/Ghostty agent-workspace inspiration for status, attention flags, panes, and cockpit surfaces.
- 2026-05-22 web search for “local-first AI coding agent session memory failure history,” “AI coding agent terminal workflow tmux,” and “Pi coding agent extension session logs JSONL.” It surfaced `aictx`, `agentmemory`, `AgentOS`, `mneme`, `sia`, `AgentMux`, `tmux-agents`, `agtx`, `schmux`, `jmux`, Pi docs, and Pi extension collections.

## Findings

1. Pi stores sessions as JSONL files under `~/.pi/agent/sessions/--<path>--/<timestamp>_<uuid>.jsonl`. Entries form a tree through `id` and `parentId`, with session headers carrying `cwd`; message entries include roles such as `user`, `assistant`, `toolResult`, `bashExecution`, `custom`, `compactionSummary`, and branch/compaction records.
2. Pi session records already include strong signal for failure memory: `bashExecution` has `command`, `output`, `exitCode`, `cancelled`, `truncated`, and optional `fullOutputPath`; `toolResult` has `toolName`, `isError`, and content; compaction/branch summaries can preserve abandoned attempts.
3. `pi-session-search` already covers broad Pi history search with FTS5 and optional embeddings. Its gap for this project is outcome modeling: it indexes sessions and allows reading them, but it does not primarily extract failure signatures, attempted fixes, eventual resolutions, and “avoid this path” recovery advice.
4. `AICTX` is the closest conceptual neighbor. It explicitly stores repo-local operational continuity, including known failures and resolved failure patterns. Its presence validates the product direction, but its default shape is broader repo-local continuity across agents, while `pi-flight-recorder` can be narrower and Pi-session-native from the start.
5. `EAN AgentOS` validates the “never solve the same bug twice” framing. It stores error resolutions and an experience graph across agent CLIs. Its broader global memory/database/dashboard scope is larger than the desired first slice.
6. Context infrastructure tools such as ContextAtlas and Memtrace show that code search/context memory is crowded and increasingly sophisticated. Competing there directly would be lower leverage than specializing in session-outcome recovery.
7. Background review tools such as roborev show that developer value comes from timely interventions, not only recall. The analogous intervention for this project is detecting a current failure signature and suggesting prior evidence-backed recoveries.
8. tmux/Ghostty tools such as gmux and jmux show useful UI affordances: attention flags, sidebars, port/status indicators, and diff panels. These are good later surfaces after the core failure-memory model works.

## Tradeoffs

- **Use `pi-session-search` directly vs build own ingestion.** Reusing its parsing/indexing could speed up broad search, but the MVP needs entry-level outcome modeling and source references. Build a focused parser/index first, while leaving integration or import from `pi-session-search` as a later option.
- **SQLite FTS5 first vs vector database first.** FTS5 is inspectable, dependency-light, local, and excellent for stack traces, file paths, commands, and error tokens. Embeddings can help semantic clustering later, but they should not be required for the first recovery loop.
- **Global Pi history vs repo-local memory.** Global Pi history is better for personal repeated-friction discovery across projects. Repo filters are still needed to prevent noisy cross-project suggestions. Store global by default with project/cwd filters and evidence paths.
- **Automatic extraction vs manual recording.** Automatic extraction is necessary because the best data lives in raw sessions. Manual feedback is still needed to mark useful/not useful/already solved and to promote high-confidence insights.
- **CLI-first vs Pi-extension-first.** A CLI/library core is easier to test outside Pi; a Pi extension is the natural user surface. Build core first, then wrap it in Pi commands/tools.

## Rejected Paths And Null Results

- **Generic semantic session search as the main product** - rejected because `pi-session-search`, AgentOS-style memory, and many MCP memory tools already cover broad recall. It would not satisfy the user’s desire for non-generic, problem-grounded insight.
- **Socraticode as the primary substrate** - rejected as main architecture because it is codebase-focused rather than Pi-session-structure-aware. It may be useful later for code context around a recovered failure, but not for the raw session episode model.
- **Memtrace as a dependency** - rejected because the public repo advertises a proprietary EULA and project principles require open-source-first choices.
- **tmux/Ghostty cockpit first** - rejected for MVP because UI status is only valuable after the underlying episode extraction and retrieval loop exists.
- **Autonomous fix loop first** - rejected as too risky and broad. The first slice should recommend evidence-backed prior fixes, not apply them.

## Conclusions

The defensible MVP is a local-first Failure Memory system:

1. Parse Pi session JSONL structurally, preserving source refs.
2. Extract failure/fix episodes from `bashExecution`, errored tool results, adjacent user/assistant text, files touched, and later successful validation commands.
3. Store normalized episodes and raw source refs in SQLite with FTS5.
4. Query current failures or user descriptions against prior signatures.
5. Return short, evidence-backed suggestions: prior failure, what was tried, what worked, what to inspect, and what source entries support the answer.

Confidence is high for this direction because multiple adjacent tools validate the demand, while Pi-native outcome-aware recovery remains more specific than the crowded broad-memory/search space.

## Recommendations

- Use `spec:failure-memory-mvp` as the behavior contract for the first slice.
- Use a multi-ticket plan because ingestion, storage, extraction, query surfaces, and validation are independently reviewable.
- Start with TypeScript strict mode, CLI/library core, and SQLite/FTS5. Add the Pi extension wrapper after the core can be tested with fixtures.
- Keep optional embeddings, tmux/Ghostty status UI, idea mining, Loom promotion, and autonomous fixes out of the first plan unless a later ticket explicitly expands scope.

## Open Questions

- Should first-run indexing be global over all Pi sessions or require an explicit project/path filter? Recommended default: global with project/cwd filters and safe max limits.
- Which local SQLite package should the TypeScript implementation use on the user’s current Node runtime? Recommended: verify during scaffold ticket; prefer Node built-ins if available, otherwise an actively maintained open-source package.
- How aggressive should secret redaction be? Recommended: conservative redaction for obvious token/password/key patterns before indexing displayable snippets.

## Related Records

- `constitution:main` - records the local-first, Pi-session-aware, outcome-aware project identity this research supports.
- `spec:failure-memory-mvp` - consumes this research as the first behavior contract.
- `plan:20260522-pi-flight-recorder-mvp` - decomposes this research-backed direction into ticket-ready work.
