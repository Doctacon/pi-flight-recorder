# Release Evidence Gap Smoke

ID: ticket:20260523-release-evidence-gap-smoke
Type: Ticket
Status: closed
Created: 2026-05-23
Updated: 2026-05-23
Risk: high - release claims depend on real Pi behavior, prompt-injection boundaries, and privacy-sensitive local evidence
Depends On: ticket:20260523-pi-extension-boundary-refactor, ticket:20260523-storage-schema-boundary-refactor

## Summary

Gather or explicitly defer the remaining release-risk evidence gaps after the smoke harness and behavior-preserving refactors. Existing records show automated validation is broad, but real Pi evidence is still partial: guided rule promotion remains blocked, high-confidence live suggestion notification was not exercised in real TUI smoke, model-assisted reflection was tested with a fake provider only, and long-run corpus tuning is limited.

Single closure claim: the final code shape has release-risk behaviors either evidenced with real/local smoke or explicitly documented as unproven/deferred limits in the Loom graph.

## Related Records

- `plan:20260523-codebase-stabilization-release-readiness` - parent plan and evidence gate ordering.
- `ticket:20260523-repeatable-local-smoke-harness` - local smoke proof path this ticket should use where real TUI is not required.
- `ticket:20260523-interactive-rule-promotion-tui-validation` - existing blocked real TUI validation ticket for guided rule promotion.
- `plan:20260523-seamless-failure-memory-ux` - records residual evidence gaps for high-confidence live suggestion, model-assisted reflection, and long-run tuning.
- `plan:20260523-reflection-rule-promotion-ux` - records the real TUI blocker for Flight Rule promotion.
- `.loom/evidence/20260523-live-pi-tui-smoke.md` - prior real Pi TUI smoke evidence.
- `.loom/evidence/20260523-shared-watcher-validation.md` - prior shared watcher validation evidence.
- `.loom/evidence/20260523-interactive-rule-promotion-validation.md` - automated/fake-Pi rule promotion evidence.

## Scope

May change:

- Evidence records under `.loom/evidence/` and non-sensitive evidence artifacts.
- Current State and Journal sections in existing relevant tickets/plans when evidence changes their state.
- Tiny docs corrections only if an observed smoke result reveals misleading wording and the correction is tightly scoped.
- Follow-up tickets if a real smoke exposes a concrete implementation bug; do not fix it in this ticket unless it is a trivial evidence-harness correction.

Must not change:

- Product implementation, command semantics, storage schema, or refactor code.
- Evidence records to claim observations that were not actually gathered.
- Raw session logs, secrets, private file paths, or unredacted prompts in Loom evidence.
- The blocked state of real TUI validation unless actual real TUI evidence satisfies its acceptance.

Evidence scenarios to attempt after prerequisites:

- real Pi TUI guided proposal review and Make Rule draft/edit/scope approval, ideally satisfying or updating `ticket:20260523-interactive-rule-promotion-tui-validation`;
- later prompt/turn with bounded approved-rule injection visible, then disable/no-injection behavior;
- real Pi high-confidence prior resolved suggestion notification, or explicit deferral if no safe deterministic setup exists;
- model-assisted reflection with a real provider only if available and explicitly enabled; otherwise record it as not validated rather than faking it;
- long-run corpus tuning status: either run against a sufficient local occurrence corpus or record why tuning remains limited.

Stop conditions:

- If real TUI interaction cannot be captured safely in this environment, mark the exact blocker and do not substitute fake-Pi evidence.
- If smoke exposes a product bug, create/update a focused implementation ticket and leave this ticket in review/blocked as appropriate.

## Acceptance

- ACC-001: A new evidence record summarizes which release-risk scenarios were attempted, which passed, which were not attempted, and why.
  - Evidence: `.loom/evidence/YYYYMMDD-...md` with command/session refs and redacted observations.
  - Audit: Review should challenge overbroad claims and check that each scenario maps to actual observation.

- ACC-002: Real interactive rule-promotion state is reconciled with `ticket:20260523-interactive-rule-promotion-tui-validation`.
  - Evidence: That existing ticket is either advanced with real TUI evidence or remains blocked with a precise current blocker.
  - Audit: Review should verify fake-Pi tests were not used as a substitute for ACC-001 through ACC-004 of that ticket.

- ACC-003: High-confidence live suggestion and approved-rule disable/no-injection behavior are either evidenced in the final code shape or explicitly deferred as release limits.
  - Evidence: Real/local smoke transcript, status output, or explicit defer note in the relevant plan/ticket Current State.
  - Audit: Review should inspect prompt noise/privacy boundaries and reversibility claims.

- ACC-004: Model-assisted reflection and long-run corpus tuning claims are honest.
  - Evidence: Real-provider evidence if available; otherwise docs/Loom state saying fake-provider/local-only validation is the current limit.
  - Audit: Review should verify no docs imply model or tuning proof that was not gathered.

- ACC-005: No implementation files are changed except tiny evidence-harness/docs corrections explicitly journaled.
  - Evidence: `git status --short` or diff summary.
  - Audit: Separate audit is required before this ticket can support release readiness claims.

## Current State

Closed as an honest release evidence/defer pass. Evidence is recorded in `evidence:20260523-release-evidence-gap-smoke`: final-code-shape local smoke passed; built CLI status ran against an explicit isolated data dir; real guided rule-promotion TUI, high-confidence real TUI suggestion notification, real model-provider reflection, and long-run corpus tuning remain explicitly unproven/deferred. The existing `ticket:20260523-interactive-rule-promotion-tui-validation` remains blocked; fake-Pi evidence was not substituted for it.

Audit `audit:20260523-release-evidence-gap-smoke-review` returned `concerns` for one overbroad local-smoke reversibility claim; the evidence was clarified, and follow-up audit `audit:20260523-release-evidence-gap-smoke-followup` returned `clear`. This ticket does not claim real TUI/model/corpus readiness and did not implement product changes.

## Journal

- 2026-05-23: Created ticket under `plan:20260523-codebase-stabilization-release-readiness` to make remaining release-risk evidence gaps explicit instead of burying them under broad implementation-complete claims.
- 2026-05-23: Set Status to `active` after refactor prerequisites closed. Starting evidence/defer pass; write scope is evidence and relevant ticket state only.
- 2026-05-23: Ran final-code-shape `npm run test:smoke:local` and built CLI `node dist/cli.js status --data-dir /tmp/pi-flight-recorder-release-gap-smoke --json`; recorded `evidence:20260523-release-evidence-gap-smoke` with explicit defer notes for real TUI/model/corpus gaps.
- 2026-05-23: Ran Ralph audit `audit:20260523-release-evidence-gap-smoke-review`; verdict `concerns` for overbroad wording that attributed disable/no-injection reversibility to local smoke.
- 2026-05-23: Clarified evidence so local smoke covers approval/injection/rules status while disable/no-injection is attributed to broader fake-Pi tests and full-test evidence; ran follow-up audit `audit:20260523-release-evidence-gap-smoke-followup`, verdict `clear`.
- 2026-05-23: Closed ticket as an evidence/defer pass with real TUI/model/corpus gaps explicitly preserved.
