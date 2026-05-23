# Validation Docs And Feedback Hooks

ID: ticket:20260522-validation-docs-feedback
Type: Ticket
Status: review
Created: 2026-05-22
Updated: 2026-05-22
Risk: low - validation/docs layer should not change core behavior
Priority: medium - needed before calling the MVP trustworthy
Depends On: ticket:20260522-pi-extension-wrapper

## Summary

Create the MVP validation story, first-run docs, and minimal feedback hooks needed to evaluate whether failure-memory results are useful. The closure claim is that a future user/agent can run the MVP on fixtures or local sessions, understand its limits, and record basic result feedback without relying on chat history.

## Related Records

- `spec:failure-memory-mvp` - especially Evidence Plan and REQ-014.
- `plan:20260522-pi-flight-recorder-mvp` - final milestone for MVP trust and handoff.
- All prior child tickets - this ticket verifies their combined story rather than adding new core extraction behavior.

## Scope

May change:

- End-to-end fixture corpus, docs, examples, smoke scripts, feedback command/storage if not already implemented, and evidence records for final validation.

Must not change:

- No new parser/extractor/search features except tiny fixes required by validation and still inside prior specs.
- No tmux/Ghostty UI.
- No automatic Loom promotion.
- No autonomous fixing.

Feedback can be minimal: stable result IDs plus a local record of `useful`, `wrong-match`, `already-solved`, `not-my-taste`, or `promote-later` is enough. If implementing feedback would destabilize the MVP, record it as follow-up instead of blocking core failure-memory validation.

Likely first Ralph run: run end-to-end fixture sync/query through CLI and Pi wrapper, document first-run flow, create evidence for validation commands, and add minimal feedback persistence if it fits safely.

Stop if end-to-end validation reveals core behavior does not satisfy cited spec scenarios; route back to the relevant child ticket rather than documenting around the gap.

## Acceptance

- ACC-001: End-to-end smoke path covers fixture sync, query, result inspection, and friendly no-match behavior.
  - Evidence: Command outputs captured in an evidence record or test logs referenced from this ticket.
  - Audit: Review smoke path supports the exact MVP closure claim, not unrelated behavior.

- ACC-002: First-run documentation explains install, local data directory, indexing scope, query commands, Pi wrapper use, privacy/redaction limits, and troubleshooting.
  - Evidence: Docs inspection.
  - Audit: Review docs are honest about heuristics and known limits.

- ACC-003: Minimal local feedback hook exists or is explicitly deferred with rationale and follow-up ticket.
  - Evidence: Test/docs for feedback command/storage, or a created follow-up ticket if deferred.
  - Audit: Review feedback records do not store secrets and are tied to stable result/episode IDs.

- ACC-004: Final MVP evidence links back to the spec scenarios it supports.
  - Evidence: `.loom/evidence/` record(s) cite relevant `spec:failure-memory-mvp#SCN-*` and ticket `ACC-*` criteria.
  - Audit: Plan-level or ticket-level audit challenges whether evidence supports the MVP claim.

## Current State

Implementation complete at MVP validation level. README and `docs/first-run.md` document install, sync/query, Pi wrapper, feedback, privacy, redaction, and known limits. `npm run typecheck`, `npm test`, `npm run build`, and `npm pack --dry-run` passed. Evidence is recorded in `evidence:20260522-mvp-validation`. Ready for closure review; no independent Ralph audit has been performed.

## Journal

- 2026-05-22: Created ticket with Status `open`. Scope is final validation/docs/feedback posture, not new core product expansion.

- 2026-05-22: Implemented the ticket scope and moved Status to `review`. Validation evidence: `evidence:20260522-mvp-validation`. Closure still needs review/audit disposition; residual live-Pi and heuristic-quality limits are explicit where applicable.
