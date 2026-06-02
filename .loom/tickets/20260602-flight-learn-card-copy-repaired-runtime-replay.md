# Flight Learn Card Copy Repaired Runtime Replay

ID: ticket:20260602-flight-learn-card-copy-repaired-runtime-replay
Type: Ticket
Status: blocked
Created: 2026-06-02
Updated: 2026-06-02
Risk: medium - this is evidence work over synthetic/redacted data, but its gate determines whether model-enabled operator comprehension validation can proceed.
Priority: high - this is the gate before unblocking successor comprehension validation.
Depends On: ticket:20260602-flight-learn-card-copy-product-repair

## Summary

Replay the repaired product card-copy path against representative synthetic/redacted cases and the current local Bonsai 4B Q1_0 runtime. This ticket is the gate reconciliation step: it should determine whether the repair produced enough safe real model-enabled `/flight-learn` cards to unblock `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation`, or whether model-enabled comprehension remains blocked.

Single closure claim: the project has audited replay/render evidence showing whether the repaired Bonsai path is ready for operator comprehension validation, with explicit gate disposition for the existing blocked comprehension-validation ticket.

## Related Records

- `plan:20260602-flight-learn-model-enabled-comprehension-repair` - parent repair plan and gate rule.
- `ticket:20260602-flight-learn-card-copy-product-repair` - prerequisite product repair to replay.
- `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` - downstream validation ticket that may only be unblocked if this replay gate passes.
- `ticket:20260531-flight-learn-llm-card-copy-runtime-replay` - prior negative baseline, 0/8 real product gate passes.
- `audit:20260531-flight-learn-llm-card-copy-runtime-replay-review` - audit requiring repair or operator decision before model-enabled comprehension validation.
- `spec:flight-learn-inbox-ux` REQ-033 through REQ-048 and SCN-011 through SCN-015 - behavior and evidence expectations for card-copy runtime claims.
- `evidence:20260531-flight-learn-llm-card-copy-runtime-replay` - baseline replay packet and render-check patterns to reuse.

## Scope

In scope:

- Build or reuse a synthetic/redacted representative replay corpus covering repeated workflow, validation/build, stale edit, low-information, safety/adversarial rejection, expected-known, expected-unknown, evidence-summary, and fallback shapes where possible.
- Run fake-provider or fixture replay only as a sanity check; real gate status depends on local Bonsai runtime if explicitly authorized and available.
- When explicitly authorized for execution, run the already available Bonsai 4B Q1_0 local runtime via loopback-only `llama-server` with no downloads, installs, hosted calls, non-loopback endpoints, telemetry, or custom forks.
- Record parse-valid, schema-valid, product-gate pass, field coverage, fallback reasons, unsafe rejections, timeout/error counts, latency, and display states.
- Produce render artifacts at representative widths and default-hidden-internals checks.
- Update `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` only if this replay gate passes; otherwise keep it blocked with the negative reason.

Out of scope:

- Product source changes. If replay finds a product bug, stop and route a new implementation ticket.
- New model/runtime authorization, downloads, installs, hosted providers, or broader model comparison.
- Raw private Pi sessions, raw local paths, secrets, prompts, transcripts, stack traces, raw server logs, or unredacted model output in Loom.
- Operator comprehension validation. This ticket can only unblock the validation ticket; it must not fabricate operator notes or treat replay metrics as comprehension.
- Dogfood corpus/outcome collection, classifier readiness, route ranking, or release readiness claims.

Gate rule:

- `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` may be moved from blocked to open only if this replay produces at least five safe real product-gated model-enabled card renders across representative non-private cases, with zero unsafe/privacy accepted outputs and no evidence that source-of-truth, route/storage, expected-behavior, or evidence boundaries were weakened.
- The intentional safety/adversarial case may correctly fall back and still count as a safety success, but it does not count as one of the five model-enabled renders.
- If fewer than five safe real model-enabled renders exist, close or block this ticket honestly and keep comprehension validation blocked.

Likely first Ralph run:

- Read this ticket, parent plan, product repair evidence/audit, baseline replay evidence/audit, and downstream comprehension-validation ticket.
- Create replay artifacts under `.loom/evidence/artifacts/20260602-flight-learn-card-copy-repaired-runtime-replay/`.
- Run real Bonsai only when explicit runtime authorization is present for the run and local runtime/model availability/checksum/loopback safety are confirmed.
- Write `evidence:20260602-flight-learn-card-copy-repaired-runtime-replay`, update this ticket to review, and update downstream comprehension-validation ticket only if the gate rule is satisfied.

Stop conditions:

- Stop if product repair ticket is not closed with clear audit.
- Stop if real runtime would require a new download/install/provider or non-loopback endpoint.
- Stop if replay would require raw private sessions or unredacted local artifacts.
- Stop if unsafe/action-advice/privacy/mutation output appears to be accepted; record failure and do not unblock comprehension validation.
- Stop if server cleanup/listener checks fail.

## Acceptance

- ACC-001: Repaired replay corpus and runtime status are honest.
  - Evidence: artifact index lists case coverage, runtime/model status, loopback-only status, no-download/no-install status, or an explicit not-run blocker.
  - Audit: challenge runtime authorization, availability, checksum/provenance, and sample breadth.

- ACC-002: Product-gate metrics support the gate disposition.
  - Evidence: summary records parse/schema/product-gate pass, field coverage, fallback reasons, unsafe rejections, timeouts/errors, latency, and display states for fake sanity and real runtime where run.
  - Audit: challenge treating schema success as comprehension or counting fallback cards as model-enabled success.

- ACC-003: Representative render pack exists.
  - Evidence: render artifacts at representative widths for successful model-enabled cards and fallback/safety cards, plus width and default-hidden-internals checks.
  - Audit: challenge whether renders reflect product integration and hidden provenance requirements.

- ACC-004: Downstream comprehension gate is reconciled honestly.
  - Evidence: `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` remains blocked or is unblocked according to the gate rule, with journal entry and current-state explanation.
  - Audit: challenge premature unblocking or failure to route a negative replay result.

- ACC-005: Privacy/side-effect boundaries hold.
  - Evidence: privacy scan over artifacts/evidence/tickets, scoped `git diff --check`, post-run listener check, no raw logs/output/prompts persisted, and no product/source/storage/routing side effects.
  - Audit: challenge accidental leakage, stale runtime processes, or corpus/classifier claims.

## Current State

Blocked by upstream no-go. `ticket:20260602-flight-learn-card-copy-product-repair` remains blocked because `ticket:20260602-flight-learn-card-copy-prompt-schema-variants` closed as no-go same-model variant evidence and did not select a product repair. There is no repaired product path to replay.

Do not run repaired runtime replay until a concrete product repair closes with audit. Continuing requires operator/product direction: authorize a different local model/runtime path, shape another repair branch that selects an integration variant, or explicitly rescope away from all-field model-enabled comprehension. If the product repair ticket is cancelled, this ticket should be cancelled or remain blocked with the same no-go reason.

## Journal

- 2026-06-02: Created as the fourth child ticket of `plan:20260602-flight-learn-model-enabled-comprehension-repair`; blocked pending product repair closure.
- 2026-06-02: Remained blocked after same-model variant work closed as no-go and product repair stayed blocked. No repaired product path exists to replay.
