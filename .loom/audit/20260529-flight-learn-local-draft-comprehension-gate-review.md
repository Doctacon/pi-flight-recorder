# Flight Learn Local Draft Comprehension Gate Review

ID: audit:20260529-flight-learn-local-draft-comprehension-gate-review
Type: Audit
Status: recorded
Created: 2026-05-29
Updated: 2026-05-29
Audited: 2026-05-29 UTC
Target: ticket:20260529-flight-learn-local-draft-comprehension-gate

## Summary

Ralph audited the local LLM draft comprehension gate implementation and evidence. Verdict: changes-needed. The implementation mostly establishes distinct local-model display states, preserves explicit opt-in/default behavior, and has useful focused tests/artifacts, but the audit found two hard-gate blockers and one rendering concern before closure is honest.

## Target

Audit target: `ticket:20260529-flight-learn-local-draft-comprehension-gate` in review state, including source/test changes and evidence under:

```text
.loom/evidence/20260529-flight-learn-local-draft-comprehension-gate.md
.loom/evidence/artifacts/20260529-flight-learn-local-draft-comprehension-gate/
```

The closure claim under review was whether `/flight-learn` can display an explicitly opted-in, clearly labeled, display-only local LLM draft explanation after hard syntactic/privacy/safety gates pass, without weakening accepted narrative gates or introducing routing/storage/artifact side effects.

## Audit Scope And Lenses

Scope:

- Challenge `ACC-001` through `ACC-006`.
- Check distinct display states: accepted narrative, draft, validated non-narrative, deterministic fallback.
- Check existing explicit opt-in and default behavior.
- Check hard draft display gates for unsafe/authority-confusing content.
- Check render artifacts for trust-boundary language, width safety, and visible safe actions.
- Check side-effect boundaries and evidence overclaiming.

Lenses:

- claim and evidence
- acceptance
- implementation
- safety/privacy/trust boundary
- product/UX
- follow-through

Out of scope:

- Real Bonsai or `llama-server` replay.
- Operator comprehension validation.
- Release readiness.
- New model/runtime recommendations.

## Context And Evidence Reviewed

Ralph review run inspected:

- `.loom/tickets/20260529-flight-learn-local-draft-comprehension-gate.md`
- `.loom/evidence/20260529-flight-learn-local-draft-comprehension-gate.md`
- `.loom/plans/20260529-flight-learn-comprehension-path.md`
- `.loom/research/20260529-flight-learn-comprehension-recovery-options.md`
- `.loom/specs/flight-learn-inbox-ux.md` REQ-037 through REQ-041 and SCN-012
- `.loom/evidence/20260529-flight-learn-constrained-judge-replay.md`
- `src/flight-learn-local-diagnosis-model.ts`
- `src/flight-learn-local-diagnosis-model.test.ts`
- `src/flight-learn-inbox.ts`
- `src/flight-learn-inbox.test.ts`
- `src/pi-extension.ts`
- `src/pi-extension.test.ts`
- artifacts under `.loom/evidence/artifacts/20260529-flight-learn-local-draft-comprehension-gate/`
- current git diff/status for ticket paths

Reviewer-ran checks:

```text
npm test -- src/flight-learn-local-diagnosis-model.test.ts src/flight-learn-inbox.test.ts src/pi-extension.test.ts
```

Result: 68 passed.

```text
git diff --check
```

Result: passed.

## Findings

### FIND-001: Narrative draft hard gates do not block unsupported concrete or mutation claims when the model cites any known fact ID

The ticket hard gate forbids unsupported concrete mutation claims. Non-narrative fields run token support checks, but narrative `whatHappened` only checked that `factIds` exist plus regex unsafe checks before returning a candidate. When no judge is configured, that candidate becomes `displayState: "draft"`.

The reviewer verified with fake providers that unsupported sentences such as `The source file was changed before the validation failed.` and `A database migration corrupted production data.`, when cited to a known fact ID, could render as `displayState: "draft"` with no fallback reason.

Why it matters: known fact IDs must not act as semantic proof for unsupported or authority-confusing draft text. This blocks `ACC-003`.

Required follow-up: add narrative-level unsupported-fact/mutation validation before draft display, or otherwise prevent known fact IDs from acting as semantic proof. Add focused tests for unsupported passive mutation claims in `whatHappened`.

### FIND-002: Unsafe judge outcomes can be downgraded to draft when the judge response also has unsupported claims or inconsistent top-level fail-closed reason

Sentence validation returns before top-level `failClosedReason` is checked, and unsupported claims can be returned before unsafe/action-advice verdict handling. The caller only deterministic-fallbacks on `reason === "unsafe-output"`; other judge failures become draft.

The reviewer verified a fake judge response with `verdict: "action-advice"` and `unsupportedClaims` returned `displayState: "draft"`, contrary to evidence wording that unsafe judge outcomes fail closed.

Why it matters: unsafe/action-advice judge signals must have precedence over draft recovery. This blocks `ACC-003`.

Required follow-up: make any unsafe/action-advice verdict or unsafe/action-advice top-level fail-closed reason take precedence and force deterministic fallback. Add tests for unsafe/action-advice with `unsupportedClaims` and top-level unsafe fail-closed reason.

### FIND-003: Render artifacts do not keep dismiss/skip affordances visible at representative widths

Ticket `ACC-004` claims render artifacts show route/observe/dismiss/skip actions. The focused-card key help is a single clipped line. Existing render artifacts clip before the full dismiss/skip text at width 92 and width 72.

Why it matters: deterministic fallback and draft cards must remain non-dead-ending. If key safe actions are clipped, evidence does not support the full render/UX claim.

Required follow-up: wrap/split key hints or show dismiss/skip elsewhere, then regenerate render artifacts and update tests if needed.

## Verdict

Changes-needed. Do not close until the three findings are dispositioned and evidence is updated.

## Required Follow-up

1. Fix narrative semantic/mutation gate gap and add focused tests.
2. Fix unsafe judge precedence and add focused tests.
3. Make dismiss/skip affordances visible at 72/92 widths and regenerate render artifacts.
4. Rerun focused tests and `git diff --check`.
5. Update evidence without overclaiming semantic usefulness.
6. Request follow-up Ralph audit before closure.

## Residual Risk

Even after fixes, regex/fact-ID gates cannot prove draft usefulness or full semantic correctness. Real Bonsai quality, operator comprehension, and release readiness remain unproven and belong to later validation.

## Related Records

- `ticket:20260529-flight-learn-local-draft-comprehension-gate`
- `evidence:20260529-flight-learn-local-draft-comprehension-gate`
- `plan:20260529-flight-learn-comprehension-path`
- `spec:flight-learn-inbox-ux`
