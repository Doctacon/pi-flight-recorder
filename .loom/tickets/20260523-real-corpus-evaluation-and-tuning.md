# Real Corpus Evaluation And Tuning

ID: ticket:20260523-real-corpus-evaluation-and-tuning
Type: Ticket
Status: blocked
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
- `plan:20260527-flight-learn-local-model-quality-evaluation` - narrower follow-up for optional `/flight-learn` diagnosis-polish model quality; does not by itself close this broader corpus/provider tuning ticket.
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

Blocked. This ticket is no longer allowed to sit in stale `review`: the current-flow release gaps (installed-package startup, real-TUI rule promotion, and visible high-confidence suggestion text) are now evidenced, but this ticket's own long-run corpus/provider acceptance is not satisfied.

Concrete blocker: a mature local occurrence corpus and/or explicit operator authorization for real hosted/model-provider reflection evaluation is needed before this ticket can honestly claim real-corpus precision/noise tuning or real-provider behavior. Existing evidence supports smoke-level status/capture/reflection and fixture/fake-provider behavior only.

Do not close this ticket until the corpus/provider evaluation acceptance is either performed with redacted evidence and audit or explicitly re-scoped/cancelled by the operator.

## Journal

- 2026-05-23: Created ticket to prevent fixture-only closure of the seamless UX plan.
- 2026-05-23: Implemented seamless UX slice for this ticket and moved to review with validation evidence in `evidence:20260523-seamless-ux-validation`.
- 2026-05-23: Review run recorded `audit:20260523-seamless-ux-review` with verdict `changes-needed`; pending disposition: FIND-002 plus real occurrence/model/provider evidence gaps.
- 2026-05-23: Dispositioned review finding(s) for this ticket with `evidence:20260523-live-pi-tui-smoke` and/or `evidence:20260523-findings-fix-validation`; follow-up audit `audit:20260523-seamless-ux-followup-review` returned `clear` in the inspected scope; residual high-confidence notification/model-provider/long-run tuning gaps remain as follow-up where applicable.
- 2026-05-23: Final review-state reconciliation moved this ticket from stale `review` to `blocked`; current-flow smoke gaps are resolved, but long-run corpus/provider evaluation remains unsatisfied.
- 2026-05-27: Added related `plan:20260527-flight-learn-local-model-quality-evaluation` as a narrower diagnosis-polish model-quality effort. This ticket remains blocked for broader real-corpus precision/noise and seamless UX claims.
