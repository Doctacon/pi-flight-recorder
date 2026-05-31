# Flight Learn Constrained JSON Adapter Follow-up Review

ID: audit:20260529-flight-learn-constrained-json-adapter-followup-review
Type: Audit
Status: recorded
Created: 2026-05-29
Updated: 2026-05-29
Audited: 2026-05-29 UTC
Target: ticket:20260529-flight-learn-constrained-json-adapter

## Summary

Ralph reviewed the follow-up disposition for `audit:20260529-flight-learn-constrained-json-adapter-review#FIND-001` and `#FIND-002`. Verdict: clear for closure of the bounded adapter ticket. The max-output-token residual diff is now documented honestly, and the generator fixture now matches the schema-shaped `whatHappened.sentences[].text + factIds` contract without overclaiming accepted narrative behavior.

## Target

Follow-up audit target: `ticket:20260529-flight-learn-constrained-json-adapter`, after initial audit concerns were dispositioned in source tests and evidence.

Reviewed findings:

- `audit:20260529-flight-learn-constrained-json-adapter-review#FIND-001` - request limit evidence wording versus visible `MAX_MAX_OUTPUT_TOKENS` diff.
- `audit:20260529-flight-learn-constrained-json-adapter-review#FIND-002` - fake generator fixture omitted schema-required `whatHappened`.

## Audit Scope And Lenses

Scope:

- Confirm whether `FIND-001` and `FIND-002` were honestly dispositioned.
- Recheck whether any closure-blocking concerns remain for `ACC-001` through `ACC-005`.
- Recheck focused adapter tests and `git diff --check`.

Lenses:

- claim and evidence
- scope and acceptance
- implementation/test consistency
- follow-through

Out of scope:

- Real `llama-server` replay.
- Judge/latency acceptance evidence.
- Operator comprehension validation.
- Broad whole-workspace cleanliness.

## Context And Evidence Reviewed

Ralph review run: bounded reviewer subagent launched for follow-up audit. Reviewer was instructed not to edit files.

Context inspected:

- `.loom/tickets/20260529-flight-learn-constrained-json-adapter.md` - current state and finding disposition.
- `.loom/evidence/20260529-flight-learn-constrained-json-adapter.md` - updated evidence wording and audit follow-up section.
- `.loom/audit/20260529-flight-learn-constrained-json-adapter-review.md` - initial concerns.
- `src/flight-learn-llama-cpp-adapter.ts` - current adapter implementation.
- `src/flight-learn-llama-cpp-adapter.test.ts` - updated fixture and request-body tests.
- Relevant validator seams in `src/flight-learn-local-diagnosis-model.ts`.
- `.loom/evidence/artifacts/20260529-flight-learn-constrained-json-adapter/08-followup-focused-tests.txt` - follow-up focused test artifact.
- `.loom/evidence/artifacts/20260529-flight-learn-constrained-json-adapter/09-followup-diff-check.txt` - follow-up diff-check artifact.
- `.loom/evidence/artifacts/20260529-flight-learn-constrained-json-adapter/privacy-scan.json` - updated privacy scan.
- Current adapter/test/evidence/ticket diff and workspace status.

Reviewer-ran checks:

```text
npm test -- src/flight-learn-llama-cpp-adapter.test.ts
```

Result: 13 passed.

```text
git diff --check
```

Result: no output.

## Findings

None - no material findings within audited follow-up scope.

The reviewer specifically found:

- `FIND-001` disposition is honest: `MAX_MAX_OUTPUT_TOKENS` still differs from repository `HEAD` (`512` current, `256` in `HEAD`), but the evidence now documents the residual diff rather than claiming unchanged request limits.
- `FIND-002` disposition is honest: `validPolishJson()` now includes schema-shaped `whatHappened.sentences[].text + factIds`, and evidence avoids treating the no-judge fixture as accepted narrative proof.
- No new closure-blocking concerns remain for `ACC-001` through `ACC-005` in this bounded adapter/test slice.

## Verdict

Clear for closure of the bounded adapter ticket, with residual risks preserved below.

This audit does not validate real runtime replay, judge acceptance, or operator comprehension. It only clears the adapter implementation/evidence slice for ticket closure.

## Required Follow-up

No code or evidence changes required before closing `ticket:20260529-flight-learn-constrained-json-adapter`.

After closure, unblock and execute `ticket:20260529-flight-learn-constrained-judge-replay` if the parent plan remains active.

## Residual Risk

- `MAX_MAX_OUTPUT_TOKENS` still differs from repository `HEAD`; the residual diff is now documented and is not part of this ticket's closure claim.
- Current workspace is broadly dirty, so `ACC-004` is supported only for this bounded adapter/test slice, not as a clean whole-workspace claim.
- Real `llama-server` replay remains deferred to `ticket:20260529-flight-learn-constrained-judge-replay`.
- Accepted narrative wording, judge/latency behavior, operator comprehension, and release readiness remain unproven.

## Related Records

- `ticket:20260529-flight-learn-constrained-json-adapter` - consuming ticket.
- `evidence:20260529-flight-learn-constrained-json-adapter` - evidence dossier reviewed.
- `audit:20260529-flight-learn-constrained-json-adapter-review` - initial audit with concerns.
- `plan:20260529-flight-learn-comprehension-path` - parent plan.
