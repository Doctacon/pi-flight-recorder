# Flight Learn Narrative Inbox Integration

ID: ticket:20260528-flight-learn-narrative-inbox-integration
Type: Ticket
Status: closed
Created: 2026-05-28
Updated: 2026-05-28
Risk: high - this changes the visible `/flight-learn` focused-card review experience and must preserve route/storage safety.
Priority: medium - depends on a safe narrative local-model contract.
Depends On: ticket:20260528-narrative-fact-id-contract-verifier
Depends On: ticket:20260528-local-narrative-judge-provider-contract

## Summary

Integrate accepted local-model narrative `whatHappened` output into the `/flight-learn` focused card. The single closure claim is: when optional local narrative polish returns valid output, the focused card shows a concise `Problem` and a distinct narrative `What happened?` section, with fallback/disclosure and without changing routing, storage, artifact, rule, or source behavior.

## Related Records

- `plan:20260528-flight-learn-4b-narrative-what-happened` - parent plan.
- `ticket:20260528-flight-learn-narrative-local-model-contract` - blocked/superseded regex-semantic prerequisite path; do not resume.
- `ticket:20260528-narrative-fact-id-contract-verifier` - closed fact-ID/deterministic verifier prerequisite.
- `ticket:20260528-local-narrative-judge-provider-contract` - closed fake-provider local judge veto prerequisite.
- `spec:flight-learn-inbox-ux` REQ-030 through REQ-032 and SCN-010 - UI behavior contract.
- `evidence:20260528-flight-learn-narrative-what-happened-feedback` - operator screenshot/feedback.
- `src/flight-learn-inbox.ts` - focused-card renderer.
- `src/pi-extension.ts` - local-model flag/config plumbing if needed.
- `src/flight-learn-inbox.test.ts`, `src/pi-extension.test.ts` - likely tests.

## Scope

In scope:

- Render accepted narrative `whatHappened` text in the focused card when local narrative polish is explicitly enabled and valid.
- Ensure `Problem` and `What happened?` carry visibly distinct content in the accepted narrative path.
- Preserve deterministic text when local model is disabled, unavailable, slow, invalid, unsafe, or unsupported.
- Preserve unobtrusive model disclosure and fallback reason behavior.
- Ensure narrative paragraphs wrap to a readable measure and remain Pi TUI width-safe.
- Add render/component/fake-Pi tests showing narrative, fallback, and no side effects.
- Record render artifacts and evidence; audit before closure.

Out of scope:

- Changing the model prompt/validator contract beyond consuming the prior ticket's API.
- Running real Bonsai 4B or doing real Pi validation; that belongs to the next ticket.
- Adding new top-level commands.
- Changing default local-model enablement, timeout defaults, adapter locality, model downloads, or runtime lifecycle.
- Changing route ranking, route storage, artifact candidate semantics, rules, source/docs/Loom mutations, classifier behavior, or stored `ExpectationDelta` fields.

Stop conditions:

- Stop if the UI needs a new product decision such as making local-model narrative default.
- Stop if accepted narrative cannot be displayed without crowding route choices/evidence or violating width rules.
- Stop if integration would require storage schema changes.

## Acceptance

- ACC-001: Narrative rendering is visible and distinct.
  - Evidence: render tests/artifacts show `Problem` is concise and `What happened?` is a longer narrative, not a duplicate headline, when model output is accepted.
  - Audit: challenge whether the screenshot's actual UX problem is solved.

- ACC-002: Fallback rendering remains safe and usable.
  - Evidence: tests show disabled/unavailable/invalid/timeout/unsafe output uses deterministic `What happened?` and records the existing fallback disclosure/reason.
  - Audit: challenge hidden failure states or confusing disclosure.

- ACC-003: Route/storage side effects are unchanged.
  - Evidence: tests or inspection show routing still requires human selection/rationale, candidates remain unapplied, stored delta fields are not rewritten by narrative output, and no artifact/rule/source/Loom mutation occurs.
  - Audit: challenge side-effect boundaries.

- ACC-004: Width and visual hierarchy are preserved.
  - Evidence: render artifacts at representative widths show narrative wraps cleanly and evidence/route sections remain scannable.
  - Audit: challenge whether narrative length creates a new wall-of-text problem.

- ACC-005: Validation remains healthy.
  - Evidence: focused tests, `npm run typecheck`, relevant full tests or justified subset, `git diff --check`.

## Current State

Closed for bounded UI-consumption scope. The original `ticket:20260528-flight-learn-narrative-local-model-contract` dependency is blocked/superseded by the hybrid architecture. Its successors, `ticket:20260528-narrative-fact-id-contract-verifier` and `ticket:20260528-local-narrative-judge-provider-contract`, are both closed with clear audits in their bounded scopes. Focused-card integration evidence is recorded at `evidence:20260528-flight-learn-narrative-inbox-integration`. The source change is limited to `src/flight-learn-inbox.test.ts`: a focused test proves the card consumes an already accepted `LocalDiagnosisPolishResult` with a concise `Problem` and distinct two-sentence narrative `What happened?`, preserves disclosure/fallback behavior, keeps route selection human-driven, and does not mutate stored delta fields. Validation passed: focused tests (4 files / 75 tests), render artifact at width 88, `npm run typecheck`, `npm run build`, full tests (21 files / 138 tests), and `git diff --check`. Audit `audit:20260528-flight-learn-narrative-inbox-integration-review` returned `clear`. This ticket does not add a real judge adapter or prove real Bonsai/runtime quality, CLI judge configuration, or release readiness.

## Journal

- 2026-05-28: Created as third child ticket of `plan:20260528-flight-learn-4b-narrative-what-happened`. No implementation started.
- 2026-05-28: Unblocked after successor contract tickets `ticket:20260528-narrative-fact-id-contract-verifier` and `ticket:20260528-local-narrative-judge-provider-contract` closed with clear audits. Set active for focused-card render/test/evidence work only; no real model/runtime/adapter validation.
- 2026-05-28: Added focused-card accepted-narrative render test and sanitized render artifact. Recorded `evidence:20260528-flight-learn-narrative-inbox-integration`. Validation passed: focused tests (75), render harness, typecheck, build, full tests (138), and diff-check. Moved to review for audit.
- 2026-05-28: Audit `audit:20260528-flight-learn-narrative-inbox-integration-review` returned `clear` for bounded UI-consumption scope. Closed ticket with explicit non-claims for real Bonsai 4B, real judge/runtime quality, CLI judge configuration, and release readiness.
