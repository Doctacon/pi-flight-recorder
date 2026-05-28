# Flight Learn Local Model Quality Evaluation

ID: plan:20260527-flight-learn-local-model-quality-evaluation
Type: Plan
Status: review
Created: 2026-05-27
Updated: 2026-05-27
Risk: high - this evaluates privacy-sensitive local model output and could mislead release posture if usefulness, latency, or safety evidence is overclaimed.

## Summary

This plan decomposes evaluation of optional `/flight-learn` local-model diagnosis polish after the real Bonsai path was proven on one supported synthetic fixture. The next question is not whether the loopback adapter can call Bonsai; that is proven. The question is whether Bonsai 1.7B produces useful, safe, fast-enough display-only diagnosis wording across a representative privacy-bounded corpus, and what release/tuning decision follows.

This needs more than one ticket because the work has three separate closure stories: first define what will be judged, then make evaluation repeatable with a deterministic baseline, then run real Bonsai and record an evidence-backed decision. Product tuning or larger-model exploration should not begin until the evaluation identifies a concrete reason.

## Related Records

- `spec:flight-learn-inbox-ux` - owns REQ-024 through REQ-029 and SCN-008/SCN-009 for optional local-model polish, fallback, display-only output, and disclosure.
- `plan:20260527-flight-learn-local-model-diagnosis-polish` - implemented the optional model-polish path and records the already accepted safety boundaries.
- `ticket:20260527-real-bonsai-local-model-validation` - proved real Bonsai 1.7B Q1_0 through `llama.cpp` on one supported fixture, with final audit `clear` and explicit quality limits.
- `evidence:20260527-real-bonsai-local-model-validation` - runtime/model provenance, direct probes, Pi TUI proof, route safety, validation commands, and residual limits.
- `research:20260527-local-diagnosis-model-runtime` - selected Bonsai GGUF through explicit loopback `llama.cpp`, with 1.7B first and 4B/8B only as quality fallbacks.
- `ticket:20260523-real-corpus-evaluation-and-tuning` - broader blocked real-corpus tuning ticket; this plan is narrower and should not claim to close that broader seamless UX corpus/provider gap.
- `src/flight-learn-diagnosis.ts` - deterministic diagnosis baseline and fallback behavior.
- `src/flight-learn-local-diagnosis-model.ts` - fact packet, prompt, schema validation, timeout, fallback, and display-only local model contract.
- `src/flight-learn-llama-cpp-adapter.ts` - loopback `llama.cpp` adapter boundary.
- `src/flight-learn-inbox.ts` and `src/pi-extension.ts` - integration points whose visible behavior and storage safety must not be silently changed by evaluation work.

## Strategy

Use an evidence-first route. The dangerous ambiguity is conflating "real Bonsai can be called" with "Bonsai improves `/flight-learn`." The former has evidence; the latter does not. Evaluation must therefore define a corpus and rubric before tuning, then create a repeatable harness, then run real Bonsai against the same cases.

The deterministic diagnosis remains the oracle, default, and fallback. Model output may be judged useful only when it is accurate to stored facts, shorter or clearer for the operator, does not add unsupported facts, does not leak raw paths/secrets as primary wording, and remains display-only. If Bonsai mostly mirrors deterministic text, that is not failure, but it means the release claim should stay narrow.

This plan is intentionally not a tuning implementation plan. It may produce a recommendation to adjust prompt wording, timeout defaults, max tokens, docs, or model tier, but those changes need a concrete follow-up ticket after evidence identifies the change. Creating a generic "tune it" ticket now would hide the real decision inside implementation.

Scope boundaries:

- Keep `/flight-status` and `/flight-learn` as the normal visible command surface.
- Do not introduce hosted providers, non-loopback endpoints, telemetry, provider keys, or automatic model/runtime downloads.
- Do not persist raw Pi sessions, unredacted paths, stack traces, prompts, secrets, or private transcripts in Loom, fixtures, docs, or repository files.
- Do not change route ranking, classifier behavior, artifact routing semantics, delta status, stored `ExpectationDelta` fields, artifact candidates, rules, source files, Loom records, skills, or prompts based on model output.
- Do not try Bonsai 4B/8B or other model downloads without explicit operator authorization. If 1.7B is insufficient, record that conclusion and ask/shape the next move.
- Do not change product defaults or UI copy as part of evaluation unless a child ticket explicitly creates a bounded follow-up after the evaluation decision.

Validation posture inherited by all child tickets:

- All evidence must be local-first and redacted.
- Metrics must separate deterministic output, accepted model output, rejected/fallback output, invalid schema, unsafe content, hallucinated/unsupported facts, and timeout/runtime failures.
- Latency evidence must report enough distribution to avoid one-run overclaiming.
- Qualitative examples may be included only when sanitized and should preserve enough context to audit the rating.
- Audit should challenge overclaiming, corpus representativeness, safety boundaries, and whether evidence supports the exact release/tuning recommendation.

Replan triggers:

- The corpus cannot be made representative without preserving private/raw session contents.
- The harness would need hosted inference, automatic downloads, or non-loopback services to run.
- Bonsai 1.7B output repeatedly fails schema/safety validation and the proposed fix would weaken validators or make deterministic fallback less authoritative.
- Evaluation indicates the real product issue is route classification, artifact quality, or broader corpus mining rather than diagnosis wording.
- The desired next move becomes implementation tuning rather than evaluation; create a new implementation ticket with concrete findings instead of expanding this plan silently.

## Execution Units

### Unit: Evaluation corpus and rubric

Ticket: `ticket:20260527-local-diagnosis-model-eval-corpus-rubric`

Create a privacy-bounded evaluation corpus and scoring rubric for diagnosis wording. The ticket should identify representative cases from existing fixtures/evidence and synthetic redacted variants, including success, fallback, and unsafe-output scenarios. It must define what counts as useful, safe, invalid, overclaimed, and no-better-than-deterministic before any real model run is judged.

Scope boundary: Loom evidence/artifacts and optional generated non-sensitive fixture data only. Do not run real Bonsai, tune prompts, edit product code, or ingest/persist raw real Pi sessions.

Order reason: every later metric depends on a stable corpus and rubric; otherwise tuning will chase anecdotes.

### Unit: Repeatable evaluation harness and deterministic baseline

Ticket: `ticket:20260527-local-diagnosis-model-eval-harness`
Depends On: `ticket:20260527-local-diagnosis-model-eval-corpus-rubric`

Build or assemble a repeatable local harness that runs the corpus through the deterministic diagnosis path and the local-model contract with fake/provider substitutes before any real Bonsai run. It should emit structured per-case metrics, redaction summaries, fallback reasons, latency fields, and deterministic baseline outputs.

Scope boundary: dev/test harness, fixtures, and Loom evidence. Do not change `/flight-learn` product behavior, command visibility, route/storage semantics, or runtime/model lifecycle.

Order reason: the real-model run must be replayable and comparable to deterministic output, not a one-off probe.

### Unit: Bonsai 1.7B quality evaluation and decision

Ticket: `ticket:20260527-bonsai-diagnosis-model-evaluation`
Depends On: `ticket:20260527-local-diagnosis-model-eval-harness`

Run Bonsai 1.7B Q1_0 through the harness using explicit loopback `llama.cpp`, record safety/usefulness/latency/fallback metrics, compare against the deterministic baseline, and make a narrow release/tuning recommendation. This ticket should decide whether to keep the feature opt-in experimental as-is, recommend a concrete follow-up tuning ticket, request authorization for a larger Bonsai model, or state that 1.7B is not useful enough to recommend beyond fallback-safe experimentation.

Scope boundary: evaluation and recommendation. Do not edit product behavior as part of this ticket, do not download larger models without new authorization, and do not claim broad quality from synthetic-only evidence.

Order reason: this is the first point where real Bonsai quality evidence exists across more than one supported fixture.

## Milestones

### Milestone: Evaluation substrate exists

Child tickets: `ticket:20260527-local-diagnosis-model-eval-corpus-rubric`, `ticket:20260527-local-diagnosis-model-eval-harness`

A future agent can run a repeatable local evaluation over a privacy-bounded corpus and compare deterministic diagnosis output to model output without relying on chat history.

### Milestone: Real Bonsai quality is measured

Child tickets: `ticket:20260527-bonsai-diagnosis-model-evaluation`

Bonsai 1.7B has been evaluated across the corpus with recorded safety, fallback, latency, and qualitative usefulness evidence.

### Milestone: Release/tuning posture is honest

Child tickets: `ticket:20260527-bonsai-diagnosis-model-evaluation`

The project has a citable decision about what the local-model polish path is safe to claim, and any next implementation move is concrete enough for a separate ticket.

## Current State

Review. The three planned execution units are closed. `ticket:20260527-local-diagnosis-model-eval-corpus-rubric` produced the 12-case privacy-bounded corpus and rubric. `ticket:20260527-local-diagnosis-model-eval-harness` produced the repeatable fake-provider/deterministic baseline harness. `ticket:20260527-bonsai-diagnosis-model-evaluation` ran real Bonsai 1.7B Q1_0 through the corpus on loopback `llama.cpp` and closed with final audit `clear`.

Plan-level outcome so far: real Bonsai quality is measured but not strong enough for a release-quality improvement claim. Final fresh-server pass accepted 5/12 cases, fell back on 7/12, accepted outputs were equivalent to deterministic text, and recommendation is to keep opt-in experimental and execute follow-up `ticket:20260527-bonsai-diagnosis-polish-tuning` before any stronger claim. Next honest move is plan-level review/completion reconciliation.

## Journal

- 2026-05-27: Created plan after the operator selected model evaluation as the next shaping target. The plan keeps tuning and larger-model exploration out of scope until corpus/harness evidence identifies a concrete need.
- 2026-05-27: Set plan active when `ticket:20260527-local-diagnosis-model-eval-corpus-rubric` began execution.
- 2026-05-27: Closed `ticket:20260527-local-diagnosis-model-eval-corpus-rubric` after evidence and follow-up audit `clear`. The corpus/rubric milestone substrate is ready for the harness ticket.
- 2026-05-27: Closed `ticket:20260527-local-diagnosis-model-eval-harness` after evidence and follow-up audit `clear`. The evaluation substrate milestone is satisfied; real Bonsai quality measurement is the next unit.
- 2026-05-27: Closed `ticket:20260527-bonsai-diagnosis-model-evaluation` after real Bonsai corpus evidence and follow-up audit `clear`. Moved plan to review for completion reconciliation; recommended follow-up tuning ticket exists.
