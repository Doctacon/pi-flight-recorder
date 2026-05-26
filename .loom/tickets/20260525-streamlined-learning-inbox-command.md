# Streamlined Learning Inbox Command

ID: ticket:20260525-streamlined-learning-inbox-command
Type: Ticket
Status: closed
Created: 2026-05-25
Updated: 2026-05-25
Risk: medium - user-facing Pi command workflow, docs, and delta/outcome review sequencing change, but no storage migration or artifact auto-application is intended.

## Summary

Collapse the expectation-delta corpus-building workflow into a single memorable Pi command, tentatively `/flight-learn`, so users do not need to remember `/flight-reflect`, `/flight-delta-review`, `/flight-deltas outcome`, and `/flight-deltas recur` as the normal path. The command should act as a guided local learning inbox: prepare safe delta candidates from existing local signals, review/route one pending delta when present, otherwise review one artifact candidate needing application/outcome feedback, otherwise summarize that there is nothing ready yet.

Closure claim: the product has a documented, tested one-command guided learning path that preserves manual review gates and does not automate artifact mutation or classifier labels.

## Related Records

- `constitution:main` - local-first, evidence-backed, human-gated promotion principles.
- `spec:delta-artifact-learning-loop` - behavior contract for delta capture, manual routing, artifact candidates, outcomes, and classifier gating.
- `ticket:20260523-classifier-readiness-evaluation` - concluded classifier automation is not ready and manual routed/outcome corpus collection is next.
- `research:20260525-classifier-readiness-evaluation` - explains why the corpus should be built with human-reviewed labels rather than automated classifier labels.

## Scope

In scope:

- Add a primary Pi command, `/flight-learn`, that users can repeat to move the learning loop forward.
- The command may generate safe local delta candidates from already-stored reflection/failure signals before review.
- The command may delegate to the existing guided delta review/routing UI when pending delta candidates exist.
- Add a guided artifact candidate follow-up path so users can mark an accepted candidate as applied, record `helped` / `no-change` / `needs-reroute`, reject it, or skip without memorizing candidate IDs.
- Update docs and the active delta spec to make the primary learning-loop command surface explicit.
- Add/adjust tests for the new command.

Out of scope:

- No classifier implementation, prompt, model/provider call, default auto-routing, or hosted service.
- No automatic source/docs/Loom/rule/skill/prompt mutation.
- No automatic outcome claims or recurrence labels without human action.
- No removal of existing advanced fallback commands (`/flight-deltas`, `/flight-delta-review`, `/flight-reflect`, `/flight-review`).
- No storage schema migration unless strictly necessary; prefer using existing delta/artifact/outcome tables.

Likely read scope:

- `src/pi-extension.ts`
- `src/pi-extension.test.ts`
- `src/delta-capture.ts`
- `src/delta-outcomes.ts`
- `src/storage.ts`
- `README.md`, `docs/first-run.md`, `docs/live-monitoring.md`
- `.loom/specs/delta-artifact-learning-loop.md`

Likely write scope:

- `src/pi-extension.ts`
- `src/pi-extension.test.ts`
- docs above
- `.loom/specs/delta-artifact-learning-loop.md`
- evidence/audit records for this ticket
- this ticket

Stop conditions:

- If a design would require automatic artifact application or classifier labels, stop and return to shaping.
- If Pi UI APIs cannot support guided follow-up without candidate IDs, keep the fallback honest and document the limit instead of faking automation.
- If tests reveal unrelated breakage outside the command path, do not widen scope.

## Acceptance

- ACC-001: A user can run one Pi command, `/flight-learn`, as the primary repeated action for corpus building; the command is registered and documented as the recommended learning-loop entrypoint.
- ACC-002: `/flight-learn` keeps automation bounded: it may prepare local candidates from existing signals, but routing, application/outcome feedback, rejection, and recurrence/reroute judgments remain human-selected.
- ACC-003: When pending expectation-delta candidates exist, `/flight-learn` guides the user through reviewing/routing one delta and stores an artifact candidate without applying durable artifacts.
- ACC-004: When artifact candidates need follow-up and no pending deltas take priority, `/flight-learn` lets the user record applied/outcome/reject/skip decisions without typing candidate IDs.
- ACC-005: When nothing is ready, `/flight-learn` gives a concise next-step message that does not require the user to memorize more than `/flight-learn` and `/flight-status` for normal use.
- ACC-006: Tests cover the new command registration, guided delta path, guided outcome/follow-up path, and no-ready-items message. Existing tests continue to pass.
- ACC-007: Documentation and spec updates explain the simplified command model while preserving advanced fallback command references for debugging/recovery.
- ACC-008: Validation evidence records at least focused tests for the changed command path and typecheck or full test status. Audit/review challenges over-automation, command clarity, and unsupported classifier claims before closure.

## Current State

Closed. Implementation, validation evidence, and audit are complete.

Implemented:

- Added `/flight-learn` as a one-command Pi learning inbox.
- `/flight-learn` prepares local delta candidates from existing reflection/failure signals without model/provider calls.
- If pending deltas exist, it delegates to guided delta review/routing and stores candidate-only artifact drafts without applying durable artifacts.
- If no pending deltas exist but accepted/applied artifact candidates need follow-up, it guides applied/outcome/reject/skip decisions without requiring candidate IDs.
- If nothing is ready, it returns a concise message naming `/flight-learn` and `/flight-status` as the normal commands to remember.
- Updated `spec:delta-artifact-learning-loop#REQ-012`, README, first-run docs, and live-monitoring docs.

Evidence: `evidence:20260525-streamlined-learning-inbox-validation` records `npm run typecheck`, focused `src/pi-extension.test.ts` tests, full `npm test`, and `npm run build` passing.

Audit: `audit:20260525-streamlined-learning-inbox-review` verdict `clear` within audited scope.

Residual limit: this does not add full guided recurrence-link selection; it supports human-selected `needs-reroute` / outcome feedback and leaves advanced recurrence linking available through fallback commands.

## Journal

- 2026-05-25: Created ticket from operator feedback that the seven-step delta/outcome workflow is too much to remember and should fit under fewer than three commands.
- 2026-05-25: Set active for current-session bounded implementation slice.
- 2026-05-25: Added `/flight-learn`, guided follow-up helpers, status/docs/spec updates, and focused tests.
- 2026-05-25: Validation passed: `npm run typecheck`, `npm test -- src/pi-extension.test.ts` (21 tests), full `npm test` (17 files / 79 tests), and `npm run build`; recorded `evidence:20260525-streamlined-learning-inbox-validation`.
- 2026-05-25: Moved to review; audit should challenge command clarity, over-automation, classifier/recurrence overclaims, and evidence limits.
- 2026-05-25: Recorded `audit:20260525-streamlined-learning-inbox-review` with verdict `clear`; closed with residual real-TUI/install and guided recurrence-link limits stated.
