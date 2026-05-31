# Local Narrative Judge Validation Research Review

ID: audit:20260528-local-narrative-judge-validation-research-review
Type: Audit
Status: recorded
Created: 2026-05-28
Updated: 2026-05-28
Audited: 2026-05-28
Target: ticket:20260528-local-narrative-judge-validation-research

## Summary

Adversarial audit of the completed local narrative judge validation research. Verdict: clear within the research scope; the record satisfies ACC-001 through ACC-005 with no blocker findings, provided downstream work treats the recommendation as an architecture/ticket-shaping result rather than runtime judge quality, latency, or release-readiness proof.

## Target

Reviewed `ticket:20260528-local-narrative-judge-validation-research` and the completed `research:20260528-local-narrative-judge-validation`, including the research-worker artifact and the linked plan/spec/evidence/source seams. The ticket's closure claim is a documented, source-grounded recommendation for local/open-source narrative validation alternatives to regex-semantic allow-lists, including privacy boundaries, failure behavior, prototype scope, and downstream implementation shape.

## Audit Scope And Lenses

Scope:

- Acceptance review for ACC-001 through ACC-005.
- Source/claim grounding review for local project claims and external-source synthesis.
- Privacy/local-first/no-download/no-hosted/default-fallback/display-only review.
- Recommendation concreteness review for downstream tickets.
- Overclaim review for model quality, judge quality, latency, release readiness, and proprietary/hosted paths.

Out of scope:

- Product source edits, source fixes, real model/runtime runs, UI screenshots, or validating the actual performance of Bonsai, Prometheus, NLI, llama.cpp, ONNX, or Transformers.js.
- Independent reproduction of the external papers' results; this pass checked that the research cites plausible sources, preserves limits, and does not overclaim those sources beyond the record/artifact synthesis.

## Context And Evidence Reviewed

- `ticket:20260528-local-narrative-judge-validation-research` acceptance and scope: ACC-001..ACC-005 at `.loom/tickets/20260528-local-narrative-judge-validation-research.md:63-83`; current state at lines 85-87; journal at lines 91-93.
- `research:20260528-local-narrative-judge-validation` status/scope/method/source list: `.loom/research/20260528-local-narrative-judge-validation.md:3-76`.
- Research findings/tradeoffs/rejected paths/conclusions: `.loom/research/20260528-local-narrative-judge-validation.md:80-139`.
- Proposed contracts and acceptance rule: `.loom/research/20260528-local-narrative-judge-validation.md:141-261`.
- Downstream recommendations and open questions: `.loom/research/20260528-local-narrative-judge-validation.md:264-292`.
- Research-worker artifact summary/method/findings/options/recommendation/downstream shape/limits: `.loom/research/artifacts/20260528-local-narrative-judge-validation/researcher-output.md:7-17`, `:21-66`, `:126-251`, and `:281-290`.
- Parent plan constraints and blocked state: `.loom/plans/20260528-flight-learn-4b-narrative-what-happened.md:34-72`, `:86-117`, and `:145-154`.
- UX spec local-model requirements/scenarios/evidence posture: `.loom/specs/flight-learn-inbox-ux.md:106-114`, `:186-220`, and `:231-232`.
- Latest blocked-regex evidence: `.loom/evidence/artifacts/20260528-flight-learn-narrative-local-model-contract/ralph-sixth-followup-audit-output.md:14-16`, `:20-45`, `:47-67`.
- Current source seams inspected: `src/flight-learn-local-diagnosis-model.ts:48-80`, `:171-186`, `:572-617`, `:706-789`, `:863-903`; `src/flight-learn-llama-cpp-adapter.ts:57-99`, `:122-134`, `:193-199`, `:275-289`, `:292-323`.
- Command run: `git diff --check` passed with no output. `git status --short` was inspected only for context; the worktree contains broader narrative work from linked tickets, so status was not used as proof of this research ticket's touched-file scope.

## Findings

None - no material findings within audited scope.

Acceptance notes:

- ACC-001 is satisfied: the research record is `Status: completed` and includes method/source notes, findings, tradeoffs, rejected paths, conclusions, proposed contracts, recommendations, and open questions (`.loom/research/20260528-local-narrative-judge-validation.md:3-7`, `:45-76`, `:78-139`, `:141-292`).
- ACC-002 is satisfied: the required options are compared directly in the research scope and tradeoffs (`.loom/research/20260528-local-narrative-judge-validation.md:21-27`, `:98-116`) and in the artifact's option table (`.loom/research/artifacts/20260528-local-narrative-judge-validation/researcher-output.md:41-46`). No option is dismissed as product-ready or product-invalid without a stated limitation.
- ACC-003 is satisfied: the recommendation keeps deterministic fallback/default, bounded redacted inputs, judge-as-veto, local/loopback-only posture, no hosted/proprietary judge APIs, no automatic downloads, and no route/storage/classifier side effects (`.loom/research/20260528-local-narrative-judge-validation.md:31-43`, `:120-139`, `:252-283`). This matches REQ-024..REQ-032 and SCN-008..SCN-010 (`.loom/specs/flight-learn-inbox-ux.md:106-114`, `:186-220`).
- ACC-004 is satisfied: the hybrid recommendation is concrete enough for successor tickets, with source boundaries, no-goals, evidence, audit focus, and an explicit instruction to keep the old regex ticket blocked/superseded (`.loom/research/20260528-local-narrative-judge-validation.md:264-285`; artifact detail at `researcher-output.md:228-251`).
- ACC-005 is satisfied for research scope: the record and artifact explicitly say no real model/runtime/prototype was run and do not treat research-only evidence as quality/latency proof (`.loom/research/20260528-local-narrative-judge-validation.md:31-36`, `:51-52`, `:84-88`, `:115`, `:139`, `:277-283`; `researcher-output.md:11`, `:283-290`). This audit record supplies the final review/audit result.

## Verdict

`clear` within audited scope. The completed research can be cited as the replacement architecture recommendation for the blocked regex-semantic validator path. It does not claim model/judge quality, runtime latency, or release readiness, and it does not recommend any proprietary/hosted/default-download path.

This verdict does not close the parent plan or unblock UI/real-model validation by itself. It only supports closing this research ticket and using the recommendation to create/rewrite downstream execution tickets.

## Required Follow-up

1. Close or supersede `ticket:20260528-flight-learn-narrative-local-model-contract` rather than resuming regex bypass fixes, as recommended in the research record.
2. Create/update downstream executable tickets so the parent plan depends on both the fact-ID deterministic contract and the local judge provider contract before UI integration or real Bonsai validation proceeds.
3. In those tickets, preserve the research constraints explicitly: no hosted/non-loopback calls, no automatic downloads, bounded redacted fact packets only, deterministic fallback, display-only output, judge veto-only behavior, and no release/model-quality claims from fake-provider evidence.
4. Require a separate authorized validation ticket before any real Prometheus/Bonsai/NLI/runtime quality, latency, memory, or release-readiness claims.

## Residual Risk

- External-source claims were audited for grounding, cited limits, and overclaim risk, but the papers/models were not independently re-run or benchmarked.
- The hybrid architecture remains unimplemented; fake-provider tests will only validate contract behavior, not real judge accuracy.
- Self-approval remains a real risk if the same Bonsai model generates and judges; the research correctly limits that to experimental baseline evidence, but downstream tickets must enforce the caveat.
- Latency and hardware fit remain open questions for any second local model call (`.loom/research/20260528-local-narrative-judge-validation.md:287-292`).

## Related Records

- `research:20260528-local-narrative-judge-validation` - audited research record.
- `ticket:20260528-local-narrative-judge-validation-research` - audit target.
- `plan:20260528-flight-learn-4b-narrative-what-happened` - blocked parent plan to reshape after closure.
- `ticket:20260528-flight-learn-narrative-local-model-contract` - blocked regex-semantic path to supersede or rewrite.
- `spec:flight-learn-inbox-ux` - REQ-024..REQ-032 and SCN-008..SCN-010 safety/UX contract.
