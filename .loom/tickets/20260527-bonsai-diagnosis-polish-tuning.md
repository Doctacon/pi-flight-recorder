# Bonsai Diagnosis Polish Tuning

ID: ticket:20260527-bonsai-diagnosis-polish-tuning
Type: Ticket
Status: closed
Created: 2026-05-27
Updated: 2026-05-27
Risk: medium - tuning prompt/schema/timeout behavior affects a privacy-sensitive optional model path and could weaken validators if handled casually.
Priority: medium - recommended by the real Bonsai evaluation before making any release-quality claim.
Depends On: ticket:20260527-bonsai-diagnosis-model-evaluation

## Summary

Use the real Bonsai 1.7B corpus evaluation to decide and implement the smallest safe tuning change, if any, for optional `/flight-learn` diagnosis polish. The single closure claim should be one of: prompt/schema/timeout/docs tuning was implemented and re-evaluated with evidence, or tuning was explicitly rejected with evidence-backed rationale.

This ticket exists because the real Bonsai evaluation accepted only a minority of corpus cases and most fallbacks were schema-invalid due the model adding a non-display `confidence` field. It must not weaken display-only, local-only, redaction, or unsupported-fact safeguards just to improve acceptance rate.

## Related Records

- `ticket:20260527-bonsai-diagnosis-model-evaluation` - prerequisite real Bonsai 1.7B corpus evaluation.
- `evidence:20260527-bonsai-diagnosis-model-evaluation` - acceptance/fallback/latency/safety evidence that motivates this follow-up.
- `ticket:20260527-local-diagnosis-model-eval-harness` - repeatable harness for re-evaluation.
- `evidence:20260527-local-diagnosis-model-eval-harness` - harness contract and fake-provider safety proof.
- `spec:flight-learn-inbox-ux` REQ-024 through REQ-029 - opt-in, local-only, bounded, validated, display-only requirements.
- `src/flight-learn-local-diagnosis-model.ts` - likely prompt/schema/validator/timeout boundary.
- `src/pi-extension.ts` - command flag/default timeout boundary, if timeout guidance/defaults are considered.
- `evidence:20260527-bonsai-diagnosis-polish-tuning` - prompt-only tuning validation and real Bonsai before/after evidence.
- `audit:20260527-bonsai-diagnosis-polish-tuning-review` - final audit; verdict `concerns` with no closure blocker.

## Scope

In scope:

- Inspect real Bonsai evaluation artifacts and identify the smallest safe tuning candidate.
- Consider prompt-only changes first, especially discouraging extra non-display fields like `confidence`.
- Consider timeout guidance or default changes only if evidence justifies the UX tradeoff and deterministic fallback remains default/fallback.
- Consider validator/schema changes only if they preserve strict display-only safety; do not silently accept arbitrary extra fields.
- Re-run focused contract tests, typecheck, full tests, the fake-provider harness, and the real Bonsai corpus evaluation if source behavior changes.
- Record evidence and audit before closure.

Out of scope:

- Downloading Bonsai 4B/8B or trying other model families without separate operator authorization.
- Hosted providers, non-loopback endpoints, telemetry, provider keys, automatic model/runtime downloads, or runtime lifecycle management.
- Making local-model polish default or required.
- Allowing model output to affect route ranking, classifier behavior, storage, artifact candidates, source/docs/Loom records, rules, skills, prompts, or command visibility.
- Broad release claims from one synthetic/redacted corpus.

## Acceptance

- ACC-001: The tuning decision is evidence-backed and narrow.
  - Evidence: cites the real Bonsai evaluation counts and the exact failure pattern motivating the change, or explains why no change is safer.
  - Audit: review should challenge whether the ticket is tuning toward test artifacts rather than product safety.

- ACC-002: If source changes occur, safety contracts remain strict.
  - Evidence: focused tests show malformed JSON, extra route/action fields, unsafe output, unsupported facts, timeout, and provider-error paths still fall back correctly.
  - Audit: review should challenge any validator/schema weakening.

- ACC-003: The corpus/harness is rerun after any behavior change.
  - Evidence: updated fake-provider harness and real Bonsai evaluation artifacts compare before/after acceptance, fallback, safety, and latency.
  - Audit: review should challenge overclaiming from improved acceptance alone.

- ACC-004: Recommendation after tuning is explicit.
  - Evidence: ticket/evidence says whether to keep opt-in experimental, ship with docs/timeout guidance, evaluate a larger model with authorization, or avoid recommending Bonsai 1.7B.
  - Audit: review should challenge whether the recommendation follows from the measured data.

## Current State

Closed. Implemented the smallest safe tuning change: prompt-only tightening in `src/flight-learn-local-diagnosis-model.ts` to explicitly prohibit non-display metadata such as `confidence` and fact-packet echo/nested structures. Added focused prompt assertions in `src/flight-learn-local-diagnosis-model.test.ts`. Validators remain strict; no extra fields are accepted. No timeout default, route/storage behavior, runtime lifecycle, adapter locality, visible command surface, or docs changed.

Evidence is recorded in `evidence:20260527-bonsai-diagnosis-polish-tuning`. Final post-tuning real Bonsai fresh-server pass: 8/12 accepted, 4/12 fallback, 1 unexpected fallback, 0 hard-fail/unsafe accepted outputs, 0 output/prompt safety failures, and only 1/8 accepted outputs within current 750 ms default timeout. Recommendation: keep opt-in experimental with explicit timeout guidance; do not claim broad release-quality wording improvement.

Audit `audit:20260527-bonsai-diagnosis-polish-tuning-review` returned `concerns` with no closure blocker. Closure caveats: the prompt-only source claim is source-inspection/test/evidence-backed, not VCS-diff-proven, because the relevant source files are untracked from prior local-model work; and the pre-existing redaction-placeholder accepted-unsafe fake-provider exercise remains a rubric-vs-validator residual. This ticket must not be used as release-readiness evidence.

## Journal

- 2026-05-27: Created as a follow-up recommendation target while executing `ticket:20260527-bonsai-diagnosis-model-evaluation`; do not execute until that evaluation ticket closes.
- 2026-05-27: Dependency closed with `audit:20260527-bonsai-diagnosis-model-evaluation-followup-review` verdict `clear`; this ticket is now unblocked.
- 2026-05-27: Set status to active after preflight. Real evaluation showed 5/12 accepted, 7/12 fallback, 6 schema-invalid fallbacks mostly from extra `confidence`, and only 1/5 accepted within the current 750ms default timeout. Proceeding with prompt-only tuning first; no validator weakening or default/runtime behavior changes planned.
- 2026-05-27: Added prompt-only instructions against `confidence`/metadata and fact-packet echo/nested structures, plus focused prompt assertions. Ran focused tests, fake-provider harness, real Bonsai corpus evaluation, typecheck, full tests, diff-check, server/locality capture, and privacy scan. Evidence recorded in `evidence:20260527-bonsai-diagnosis-polish-tuning`; moved to review for audit.
- 2026-05-27: Recorded `audit:20260527-bonsai-diagnosis-polish-tuning-review` with verdict `concerns` and no blocker. Preserved required caveats about untracked-source diff limits and the pre-existing redaction-placeholder accepted-unsafe residual. Closed ticket with recommendation to keep opt-in experimental with timeout guidance and no release-readiness claim.
