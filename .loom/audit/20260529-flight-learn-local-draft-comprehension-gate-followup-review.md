# Flight Learn Local Draft Comprehension Gate Follow-up Review

ID: audit:20260529-flight-learn-local-draft-comprehension-gate-followup-review
Type: Audit
Status: recorded
Created: 2026-05-29
Updated: 2026-05-29
Audited: 2026-05-29 UTC
Target: ticket:20260529-flight-learn-local-draft-comprehension-gate

## Summary

Ralph audited the follow-up disposition for `audit:20260529-flight-learn-local-draft-comprehension-gate-review#FIND-001`, `#FIND-002`, and `#FIND-003`. Verdict: clear for bounded closure. The hard draft gate now rejects unsupported concrete/mutation narrative claims even with known fact IDs, unsafe/action-advice judge signals now take precedence and fail closed, and render artifacts keep dismiss/skip actions visible at representative widths.

## Target

Follow-up audit target: `ticket:20260529-flight-learn-local-draft-comprehension-gate`, after initial audit returned `changes-needed`.

Reviewed findings:

- `audit:20260529-flight-learn-local-draft-comprehension-gate-review#FIND-001` - narrative draft hard gates allowed unsupported concrete/mutation claims when known fact IDs were cited.
- `audit:20260529-flight-learn-local-draft-comprehension-gate-review#FIND-002` - unsafe/action-advice judge outcomes could be downgraded to draft in mixed invalid judge responses.
- `audit:20260529-flight-learn-local-draft-comprehension-gate-review#FIND-003` - render artifacts clipped dismiss/skip affordances at representative widths.

## Audit Scope And Lenses

Scope:

- Confirm whether initial findings were honestly dispositioned.
- Recheck whether `ACC-001` through `ACC-006` have enough support for bounded closure.
- Check no new privacy, source-boundary, default-enable, command-surface, or overclaiming concerns were introduced.

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
- `.loom/audit/20260529-flight-learn-local-draft-comprehension-gate-review.md`
- `.loom/specs/flight-learn-inbox-ux.md` REQ-037 through REQ-041 and SCN-012
- `src/flight-learn-local-diagnosis-model.ts`
- `src/flight-learn-local-diagnosis-model.test.ts`
- `src/flight-learn-inbox.ts`
- `src/flight-learn-inbox.test.ts`
- `src/pi-extension.test.ts`
- `.loom/evidence/artifacts/20260529-flight-learn-local-draft-comprehension-gate/15-followup-focused-tests.txt`
- `.loom/evidence/artifacts/20260529-flight-learn-local-draft-comprehension-gate/16-followup-typecheck.txt`
- `.loom/evidence/artifacts/20260529-flight-learn-local-draft-comprehension-gate/17-followup-build.txt`
- `.loom/evidence/artifacts/20260529-flight-learn-local-draft-comprehension-gate/18-followup-full-tests.txt`
- `.loom/evidence/artifacts/20260529-flight-learn-local-draft-comprehension-gate/19-followup-diff-check.txt`
- render artifacts `06` through `09` and `10-render-line-widths.txt`
- privacy/side-effect scans `11`, `12`, and `13`
- current scoped git status/diff for ticket paths

Reviewer-ran checks:

```text
npm test -- src/flight-learn-local-diagnosis-model.test.ts src/flight-learn-inbox.test.ts src/pi-extension.test.ts
```

Result: 3 files passed, 69 tests passed.

```text
git diff --check
```

Result: passed.

The reviewer did not run real Bonsai or `llama-server`.

## Findings

None.

Specific follow-up conclusions:

- `FIND-001` cleared. Response validation happens before draft display, narrative sentences now reject unsupported concrete mutation claims, and focused tests cover the audit examples with deterministic fallback.
- `FIND-002` cleared. Top-level unsafe/action-advice fail-closed reasons are prioritized, unsafe/action-advice sentence verdicts are handled before unsupported-claims downgrade, and focused tests cover mixed unsupported claims plus top-level unsafe/action-advice reasons.
- `FIND-003` cleared. Focused footer hints are split into `Keys:` and `Actions:`, tests assert `d dismiss` and `s skip` at 92 and 72 widths, and regenerated artifacts show those affordances with width checks passing.
- `ACC-001` through `ACC-006` are supported for bounded closure as long as closure stays limited to draft display after hard gates with no side effects and does not claim operator comprehension, real Bonsai quality, or release readiness.

## Verdict

Clear for bounded closure.

## Required Follow-up

None blocking before closure.

If closing, keep closure language bounded to this ticket's claim and preserve non-claims: draft gates do not prove semantic correctness/usefulness, no real Bonsai validation was run, and operator comprehension remains a later validation ticket.

## Residual Risk

Regex/token/fact-ID gates reduce unsafe draft display but do not prove semantic correctness or usefulness. No real Bonsai/`llama-server` validation was run. Operator comprehension remains unproven and belongs to `ticket:20260529-flight-learn-comprehension-validation`.

## Related Records

- `ticket:20260529-flight-learn-local-draft-comprehension-gate`
- `evidence:20260529-flight-learn-local-draft-comprehension-gate`
- `audit:20260529-flight-learn-local-draft-comprehension-gate-review`
- `plan:20260529-flight-learn-comprehension-path`
- `spec:flight-learn-inbox-ux`
