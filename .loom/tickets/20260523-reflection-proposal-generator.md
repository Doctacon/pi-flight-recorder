# Reflection Proposal Generator

ID: ticket:20260523-reflection-proposal-generator
Type: Ticket
Status: open
Created: 2026-05-23
Updated: 2026-05-23
Risk: high - proposal quality and privacy boundary determine whether reflection is trustworthy
Priority: high - this is the core “one solution for many failures” behavior
Depends On: ticket:20260523-reflection-trigger-scheduler

## Summary

Generate evidence-backed pattern-level reflection proposals from eligible clusters, using deterministic local summaries by default and optional model-assisted synthesis only with explicit user consent or manual invocation. The closure claim is that repeated failure clusters can produce one useful proposal with evidence, limits, and privacy-safe generation semantics.

## Related Records

- `spec:seamless-failure-memory-ux` - REQ-011 and REQ-012 define proposal shape and model privacy boundary.
- `constitution:main` - local-first and evidence-backed principles.
- `ticket:20260523-reflection-trigger-scheduler` - supplies eligible clusters/jobs.
- `plan:20260523-seamless-failure-memory-ux` - this ticket completes the reflection proposal core.

## Scope

May change:

- Proposal types/storage, local deterministic summarizer, optional model-call adapter boundary, redaction/context builder, tests, docs.

Must not change:

- No automatic background model calls by default.
- No raw session dumps in prompts.
- No autonomous fixes.
- No Loom promotion.

A local proposal should summarize pattern/evidence and suggest a likely durable fix only when prior resolutions or strong repeated evidence support it; otherwise it should propose a next investigation step. Model-assisted mode must be explicit, bounded, redacted, and labeled.

## Acceptance

- ACC-001: Local deterministic proposal includes pattern summary, affected commands/tools, representative evidence refs, likely fix or next investigation, confidence, and limits.
  - Evidence: Fixture cluster tests.
  - Audit: Review observed facts are separated from inferred advice.

- ACC-002: If no prior resolution or strong evidence exists, proposal recommends investigation rather than inventing a fix.
  - Evidence: Fixture tests for unresolved clusters.
  - Audit: Review no generic hallucinated advice.

- ACC-003: Model-assisted reflection is disabled by default and cannot run automatically without explicit setting or manual `--model` request.
  - Evidence: Tests with fake model provider asserting no call by default.
  - Audit: Review privacy text and settings.

- ACC-004: Model-assisted context builder sends only bounded redacted snippets/evidence and labels output as model-assisted.
  - Evidence: Fake provider test captures prompt/context; redaction assertions.
  - Audit: Review prompt excludes raw session dumps and secrets.

## Current State

Ready after trigger scheduler. Current implementation has no reflection proposal model or generator.

## Journal

- 2026-05-23: Created ticket for pattern-level proposal generation and privacy boundary.
