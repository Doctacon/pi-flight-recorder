# Local Narrative Judge Validation Research

ID: ticket:20260528-local-narrative-judge-validation-research
Type: Ticket
Status: closed
Created: 2026-05-28
Updated: 2026-05-28
Risk: high - this shapes the safety architecture for optional local-model narrative text in a privacy-sensitive UI.
Priority: high - required to unblock the blocked Bonsai 4B narrative plan without returning to regex-semantic validation.

## Summary

Complete `research:20260528-local-narrative-judge-validation` with an evidence-backed recommendation for validating optional `/flight-learn` narrative `What happened?` text using local/open-source judge approaches instead of regex-semantic allow-lists.

The single closure claim is: the project has a documented, source-grounded recommendation for whether to pursue local LLM-as-judge, local NLI/entailment, citation/fact-ID constrained generation, or a hybrid approach, including privacy boundaries, failure behavior, prototype scope, and downstream implementation changes.

## Related Records

- `research:20260528-local-narrative-judge-validation` - primary research record this ticket must complete.
- `plan:20260528-flight-learn-4b-narrative-what-happened` - blocked parent plan that needs a replacement validation contract.
- `ticket:20260528-flight-learn-narrative-local-model-contract` - blocked regex-semantic implementation path; do not continue its regex bypass loop.
- `spec:flight-learn-inbox-ux` REQ-024 through REQ-032 and SCN-008 through SCN-010 - intended optional local-model safety and narrative behavior.
- `evidence:20260528-flight-learn-narrative-local-model-contract` - fake-provider evidence and limits of the current contract.
- `.loom/evidence/artifacts/20260528-flight-learn-narrative-local-model-contract/ralph-sixth-followup-audit-output.md` - latest audit output showing semantic-regex bypasses remain.
- `.loom/evidence/artifacts/20260528-flight-learn-narrative-rubric-corpus/narrative-what-happened-eval-corpus.v1.json` - synthetic/redacted cases for judging narrative behavior.
- `src/flight-learn-local-diagnosis-model.ts` - current generator/validator seam to inspect, not necessarily to edit.
- `src/flight-learn-llama-cpp-adapter.ts` - existing loopback adapter to consider for a local LLM judge.

## Scope

In scope:

- Complete the research record with current source/repo inspection and external source synthesis.
- Compare these options:
  - local LLM-as-judge;
  - local NLI/entailment model;
  - citation/fact-ID constrained generation;
  - hybrid generator + fact IDs + deterministic verification + local judge.
- Identify likely local/open-source model/runtime candidates and their operational implications, but do not download or install new models/runtimes without explicit operator authorization.
- Define candidate judge input/output contracts, including bounded redacted fact packet, candidate narrative, sentence-level verdicts, fallback reasons, and confidence/uncertainty handling.
- Evaluate privacy, latency, determinism, auditability, implementation complexity, self-approval risk, and how each option fails closed.
- Recommend the next executable ticket(s), including what source files they may edit and what evidence/audit should prove.

Out of scope:

- Editing product source or tests.
- Running real Bonsai 4B, starting `llama-server`, or validating UI screenshots.
- Downloading models, installing runtimes, or calling hosted/non-loopback services.
- Changing `/flight-learn` defaults, command visibility, storage semantics, route behavior, artifact generation, rules, source files, docs, Loom records outside this research/ticket update, skills, or prompts.
- Claiming release readiness or real-model quality.
- Continuing regex expansion as a semantic validator.

Stop conditions:

- Stop and mark blocked if a useful recommendation requires a new model/runtime download or hosted call before the operator authorizes it.
- Stop if available local/open-source judge options require unbounded raw session input or retention of private transcripts.
- Stop if the research cannot recommend a bounded implementation slice without changing product behavior beyond the current spec.

Expected first Ralph run:

- Research worker: inspect linked records/source, use web/code research for local judge/NLI/fact-citation options, then update `research:20260528-local-narrative-judge-validation` with findings, tradeoffs, rejected paths, recommendation, and downstream ticket shape. No source edits.

## Acceptance

- ACC-001: Research record is complete enough to cite.
  - Evidence: `research:20260528-local-narrative-judge-validation` has `Status: completed` or a clearly justified `active` state with findings, tradeoffs, conclusions, recommendations, open questions, and source/method notes.
  - Audit: challenge unsupported claims, missing options, stale/source-poor conclusions, and overclaiming model/judge reliability.

- ACC-002: Options comparison covers the required approaches.
  - Evidence: research compares local LLM-as-judge, local NLI/entailment, citation/fact-ID constrained generation, and hybrid approaches with privacy, latency, determinism, auditability, implementation complexity, and failure behavior.
  - Audit: challenge whether one option was dismissed without evidence or whether a proprietary/hosted option slipped in.

- ACC-003: Recommendation preserves project constraints.
  - Evidence: recommendation keeps deterministic fallback/default, loopback/local-only posture, no automatic downloads, bounded redacted inputs, display-only output, no route/storage/classifier side effects, and open-source preference.
  - Audit: challenge privacy leaks, hidden provider calls, model-as-source-of-truth behavior, and unsupported release claims.

- ACC-004: Downstream executable work is shaped.
  - Evidence: research recommends one or more next tickets or plan changes with likely source boundaries, acceptance/evidence posture, stop conditions, and whether the blocked regex-validator ticket should be superseded or rewritten.
  - Audit: challenge whether the next work is still too fuzzy to execute.

- ACC-005: Validation/evidence posture is proportional.
  - Evidence: ticket records any commands/sources used, sanitized artifacts if created, and a final review/audit result. If no prototype runs, the reason is explicit.
  - Audit: challenge whether research-only evidence is being mistaken for runtime/model quality proof.

## Current State

Closed. `research:20260528-local-narrative-judge-validation` is completed with a hybrid recommendation: fact-ID constrained generation, deterministic verification of IDs/schema/hard safety, and a local judge as veto/uncertainty gate. Research-worker output is saved at `.loom/research/artifacts/20260528-local-narrative-judge-validation/researcher-output.md`. Audit `audit:20260528-local-narrative-judge-validation-research-review` returned `clear`. No product source edits, model downloads, installs, runtime starts, hosted model calls with project data, UI changes, storage/routing changes, or real-model quality claims were made. `git diff --check` passed for the touched records. The next work is to create successor implementation tickets from the research recommendation; do not resume the blocked regex-validator ticket.

## Journal

- 2026-05-28: Created after operator rejected regex/token semantic validation as non-scalable and approved the judge/research direction. Initial research record created as `research:20260528-local-narrative-judge-validation`; first move is a bounded research worker, not product source edits.
- 2026-05-28: Set status to active and launching bounded research execution. Scope remains research/record updates only; no product source edits or new model/runtime downloads.
- 2026-05-28: Research worker completed and saved `.loom/research/artifacts/20260528-local-narrative-judge-validation/researcher-output.md`. Reconciled the findings into `research:20260528-local-narrative-judge-validation` and marked it `completed`. Recommendation is hybrid fact-ID constrained generation + deterministic verification + local judge veto, with NLI as future sidecar/comparison. Ran `git diff --check` on touched Loom records/artifact; passed. Moved ticket to review for adversarial audit.
- 2026-05-28: Audit `audit:20260528-local-narrative-judge-validation-research-review` returned `clear` within research scope and confirmed ACC-001 through ACC-005 are satisfied. Closed ticket. Follow-up is downstream executable ticket creation for fact-ID verifier and judge provider contract, not further regex bypass fixes.
