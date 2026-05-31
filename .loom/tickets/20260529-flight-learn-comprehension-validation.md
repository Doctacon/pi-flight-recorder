# Flight Learn Comprehension Validation

ID: ticket:20260529-flight-learn-comprehension-validation
Type: Ticket
Status: blocked
Created: 2026-05-29
Updated: 2026-05-29
Risk: medium - this is evidence/validation work, but it gates whether later corpus labels are trustworthy.
Priority: medium - this must happen before dogfood corpus/outcome collection.
Depends On: ticket:20260529-flight-learn-local-draft-comprehension-gate

## Summary

Validate whether draft-enabled `/flight-learn` focused cards are understandable enough for human artifact routing. The single closure claim is: a representative redacted render pack plus operator review notes show whether the operator can explain what happened, why it matters, and which route or observe/no-artifact decision fits, without treating schema validity, draft display, or judge acceptance as comprehension success.

## Related Records

- `plan:20260529-flight-learn-comprehension-path` - parent plan and gate before corpus collection.
- `ticket:20260529-flight-learn-local-draft-comprehension-gate` - prerequisite draft UI/model integration to validate.
- `ticket:20260529-flight-learn-model-comprehension-integration` - stricter accepted-narrative integration remains blocked unless new evidence supports it.
- `spec:flight-learn-inbox-ux` REQ-033 through REQ-041 and SCN-011 through SCN-012 - model-enabled card is the comprehension bar, local draft is non-authoritative reading help, fallback remains safe and non-dead-ending, corpus waits until cards are understandable.
- `evidence:20260529-llama-cpp-constrained-json-probe` - generator-format success that must not be overread as comprehension.
- Prior render artifacts under `.loom/evidence/artifacts/20260527-*flight-learn*` and `.loom/evidence/artifacts/20260528-flight-learn-narrative-inbox-integration/` - useful examples for render harness shape.
- `src/flight-learn-inbox.ts` - render surface likely used to produce validation artifacts.

## Scope

In scope:

- Produce a redacted render pack of representative `/flight-learn` focused cards after draft comprehension integration. Include local LLM draft cards, deterministic fallback cards, and accepted narrative cards only if such accepted examples exist.
- Use synthetic/redacted or disposable data. Do not persist raw private Pi sessions, unredacted local paths, secrets, stack traces, full prompts, or transcript text in Loom.
- Capture operator-facing comprehension notes for each card. Each note should answer:
  - What happened?
  - Why does it matter?
  - What route or observe/no-artifact decision fits?
  - Confidence: clear / mostly clear / unclear.
  - Any blocker, misleading wording, or missing evidence.
- Compare draft-enabled and fallback states without requiring fallback to be equally rich.
- Record whether comprehension is adequate to begin dogfood corpus/outcome collection.

Out of scope:

- Source implementation changes, except a tiny `.loom/evidence/artifacts/**` render harness if needed.
- Model/runtime downloads, hosted calls, or new provider authorization.
- Classifier automation, route ranking, or outcome modeling.
- Treating the operator's route answer as a durable artifact application; this is comprehension validation, not artifact mutation.
- Claiming release readiness or real-world precision.

Stop conditions:

- Stop if dependency evidence does not provide renderable draft/fallback card states to validate.
- Stop if validation would require raw private sessions or unredacted local artifacts in Loom.
- Stop if model-enabled cards remain too confusing to route; record blockers and route back to UX/model tickets rather than collecting corpus labels.
- Stop if fallback cards are dead ends with no safe route/observe/dismiss/skip/evidence path.

## Acceptance

- ACC-001: Render pack covers representative card states.
  - Evidence: artifacts include at least 8 representative cards, or all available safe cards if fewer exist, covering local LLM draft, deterministic fallback, accepted narrative if available, repeated workflow, validation/build, stale edit, low-information, and safety/adversarial shapes where available.
  - Audit: challenge whether the sample is cherry-picked or too narrow for the comprehension claim.

- ACC-002: Operator comprehension is measured explicitly.
  - Evidence: a structured evidence record or artifact includes per-card answers to what happened, why it matters, proposed route/observe decision, confidence, and blockers. A card is not counted as understood merely because JSON/schema/verifier passed.
  - Audit: challenge whether notes actually demonstrate understanding or only restate model text.

- ACC-003: A gate decision is made before corpus collection.
  - Evidence: ticket/evidence states one of: proceed to dogfood corpus/outcome seed, repair model narrative, repair fallback/inbox UX, or re-run validation with better sample. Proceeding should require the operator to mark at least 80% of representative cards as `clear` or `mostly clear`, with no safety/privacy blocker.
  - Audit: challenge threshold math, safety exceptions, and whether unclear cards were ignored.

- ACC-004: Privacy and product boundaries hold.
  - Evidence: privacy scan over artifacts, no raw private sessions/paths/secrets/prompts/transcripts, no source/storage/routing mutation, and no model output persisted as source-of-truth.
  - Audit: challenge artifact redaction and accidental route/storage side effects.

- ACC-005: Fallback is assessed honestly.
  - Evidence: validation distinguishes model-enabled richness from deterministic fallback safety; fallback need not match narrative richness, but it must preserve non-dead-ending actions and honest limitation disclosure.
  - Audit: challenge whether fallback is so weak that it blocks recovery despite satisfying safety.

## Current State

Blocked on actual operator review notes. Ralph produced a representative synthetic/redacted render pack and structured operator review packet at `evidence:20260529-flight-learn-comprehension-validation` with artifacts under `.loom/evidence/artifacts/20260529-flight-learn-comprehension-validation/`. The pack covers 8 cards across draft, fallback, repeated workflow, validation/build, stale edit, low-information, and safety/adversarial states at widths 92 and 72. Actual operator comprehension notes were not available in this worker run, so the gate status is `operator-review-pending`; dogfood corpus/outcome collection must not start. Next action: the operator should fill `17-operator-review-packet.json` or provide equivalent structured answers, then rerun gate calculation and audit before closure.

## Journal

- 2026-05-29: Created by Loom Weaver as the fourth child ticket of `plan:20260529-flight-learn-comprehension-path`. This ticket is the explicit product gate between model/UI implementation and corpus/outcome collection.
- 2026-05-29: Updated dependency after negative accepted-narrative replay and operator-approved draft recovery path. Validation now waits for `ticket:20260529-flight-learn-local-draft-comprehension-gate`, not blocked accepted-narrative integration.
- 2026-05-29: Dependency `ticket:20260529-flight-learn-local-draft-comprehension-gate` closed with `evidence:20260529-flight-learn-local-draft-comprehension-gate` and clear follow-up audit `audit:20260529-flight-learn-local-draft-comprehension-gate-followup-review`. Moved ticket to open for the next validation slice.
- 2026-05-29: Driver set ticket active and prepared bounded Ralph worker run. Scope is evidence/render-pack/operator-review preparation only; actual operator comprehension must not be fabricated by the worker.
- 2026-05-29: Ralph worker produced render pack and review packet. Artifacts include 8 synthetic/redacted cards at widths 92 and 72, `17-operator-review-packet.json` with blank operator notes, and `18-worker-precheck.json` explicitly marked not operator comprehension evidence. Width check passed, privacy scan passed, and `git diff --check` passed. No product source changed. Moved ticket to blocked on actual operator review notes.
