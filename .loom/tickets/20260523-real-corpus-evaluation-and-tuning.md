# Real Corpus Evaluation And Tuning

ID: ticket:20260523-real-corpus-evaluation-and-tuning
Type: Ticket
Status: open
Created: 2026-05-23
Updated: 2026-05-23
Risk: high - production usefulness depends on precision/noise over real sessions, not only fixtures
Priority: high - gates completion of seamless UX plan
Depends On: ticket:20260523-reflection-ui-actions

## Summary

Run the seamless capture/suggestion/reflection flow against the user's real Pi session corpus, measure precision/noise, tune thresholds, and record evidence/audit. The closure claim is that the optimal flow is validated against actual usage patterns enough to trust or identify follow-up work.

## Related Records

- `spec:seamless-failure-memory-ux` - quality bar and all scenarios.
- `plan:20260523-seamless-failure-memory-ux` - final validation milestone.
- `evidence:20260522-live-monitoring-validation` - previous fixture/fake-Pi validation baseline.
- `constitution:main` - evidence-backed and human-feedback principles.

## Scope

May change:

- Thresholds/default settings, fixture additions based on redacted real patterns, docs, evidence, audit records, small fixes discovered during evaluation.

Must not change:

- No broad rewrites.
- No new major product behavior beyond tuning/fixes needed to satisfy the spec.
- No storing secrets/raw session excerpts in Loom evidence.

Evaluation should produce metrics or structured observations such as number of captured failures, number of immediate suggestions, suppressions by reason, clusters found, reflections generated, user-rated usefulness, false positives, and missed obvious matches.

## Acceptance

- ACC-001: Real-corpus dry run reports capture/suggestion/reflection metrics without exposing secrets in evidence.
  - Evidence: `.loom/evidence/` dossier with redacted summaries.
  - Audit: Review redaction and metric meaning.

- ACC-002: At least one live Pi no-CLI workflow is smoke-tested end to end or the ticket remains blocked/review with explicit reason.
  - Evidence: Manual evidence record.
  - Audit: Review it exercises install/session-start behavior.

- ACC-003: Thresholds/defaults are tuned or explicitly left unchanged with evidence-backed rationale.
  - Evidence: Before/after metrics or rationale in ticket/evidence.
  - Audit: Review no overfitting to one query.

- ACC-004: A Ralph-backed audit or equivalent adversarial review challenges whether the plan/spec/tickets overclaim the seamless UX.
  - Evidence: Audit record or explicit reason audit could not be run.
  - Audit: Review findings are dispositioned before plan completion.

- ACC-005: Docs describe the normal no-CLI path, debug CLI path, privacy/model settings, and known limits after tuning.
  - Evidence: Docs inspection.
  - Audit: Review docs match actual implementation and evidence.

## Current State

Blocked until reflection UI/actions exists. This ticket is the plan-level validation and tuning gate.

## Journal

- 2026-05-23: Created ticket to prevent fixture-only closure of the seamless UX plan.
