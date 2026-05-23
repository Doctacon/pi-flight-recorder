# pi-flight-recorder Constitution

ID: constitution:main
Type: Constitution Core
Status: active
Created: 2026-05-22
Updated: 2026-05-22

## Identity

`pi-flight-recorder` is a local-first developer-memory tool for Pi coding sessions. It exists to turn real session history into outcome-aware help: especially recognizing repeated failures, showing what was tried before, and surfacing the prior fix with inspectable evidence.

The project is not a generic memory database, a hosted analytics product, a multi-agent orchestrator, or another semantic-search wrapper. Search is a substrate; the product is the structured recovery loop around developer episodes.

## Durable Principles

1. **Pi-session-aware before generic transcript search.** The tool must understand Pi JSONL session structure, entry IDs, branches, compactions, bash executions, tool results, custom messages, cwd, and timestamps before relying on broad embeddings.
2. **Outcome-aware episodes over raw recall.** The useful unit is a failure/fix episode, decision, correction, or recurring friction pattern with evidence, not merely a chunk of similar text.
3. **Local-first and open source.** Raw sessions, indexes, extracted observations, and feedback stay local by default. Prefer SQLite/FTS5, local files, and optional local/open-source embedding providers before hosted APIs.
4. **Evidence-backed responses.** Any “seen this before” answer must cite source sessions, entries, commands, files, and timestamps well enough for a human or agent to inspect the basis.
5. **Human feedback gates promotion.** Noisy extracted observations should not become durable Loom knowledge or project guidance without explicit review, acceptance, or repeated evidence.
6. **Small vertical slices.** Build the first useful failure-memory loop before expanding into tmux dashboards, Ghostty UI, broad idea mining, multi-agent orchestration, or autonomous fixing.

## Current Product Direction

The first shipped slice should answer:

> “Have I seen this failure before, what did I try, what worked, and what should I avoid?”

The MVP should ingest Pi session logs, extract failed commands/tool errors and likely resolutions, store them in a local inspectable index, and expose a CLI/Pi command that returns evidence-backed prior episodes.

## Boundaries

The MVP does not need to:

- replace `pi-session-search` for broad history search;
- implement a full vector database or knowledge graph;
- orchestrate multiple agents;
- build tmux/Ghostty dashboards;
- auto-modify code based on prior fixes;
- promote findings into Loom automatically.

Those may become later roadmap directions after the failure-memory loop proves value.
