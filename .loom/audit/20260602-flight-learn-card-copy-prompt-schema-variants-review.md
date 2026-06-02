# Flight Learn Card Copy Prompt Schema Variants Review

ID: audit:20260602-flight-learn-card-copy-prompt-schema-variants-review
Type: Audit
Status: recorded
Created: 2026-06-02
Updated: 2026-06-02
Audited: 2026-06-02 UTC
Target: ticket:20260602-flight-learn-card-copy-prompt-schema-variants

## Summary

Audited `ticket:20260602-flight-learn-card-copy-prompt-schema-variants` and its evidence packet. The ticket can close as **no-go same-model variant evidence**: the variants were grounded in the prerequisite diagnostics and proved shorter prompts remove the timeout symptom, but no tested Bonsai 4B variant produced a safe model-enabled comprehension path worth integrating.

## Target

Target under review:

- `ticket:20260602-flight-learn-card-copy-prompt-schema-variants`
- Evidence dossier `evidence:20260602-flight-learn-card-copy-prompt-schema-variants`
- Variant artifacts under `.loom/evidence/artifacts/20260602-flight-learn-card-copy-prompt-schema-variants/`

The ticket is in `review` and asks whether ACC-001 through ACC-005 are supported, including the negative/no-go outcome, and whether `ticket:20260602-flight-learn-card-copy-product-repair` should remain blocked.

## Audit Scope And Lenses

Lenses used:

- acceptance and evidence: whether ACC-001 through ACC-005 are supported by the variant matrix, metrics, runtime provenance, source side-effect scan, privacy scan, and rendered/display-shape artifacts;
- diagnostic grounding: whether the variants were chosen from the prerequisite failure taxonomy rather than speculative prompt churn;
- metric interpretation: whether parse/schema validity, product-validation pass, product-gate-equivalent pass, field coverage, unsafe accepted count, and no-go recommendation are interpreted honestly;
- safety and trust boundary: whether generated-evidence, expected-behavior, action/mutation, privacy, source-of-truth, route/storage, and unknown-fact boundaries remained non-negotiable;
- integration recommendation: whether same-model product repair should remain blocked or be cancelled, and whether the mutation-like accepted-output safety-gap candidate needs separate follow-up;
- runtime/privacy/scope: whether real Bonsai use was local/loopback-only/no-download/no-install, cleaned up, privacy-safe, and source-read-only.

Out of scope:

- choosing a new prompt variant;
- implementing product source repair;
- changing validators, prompts, specs, plans, research, or tickets;
- re-running Bonsai;
- operator comprehension validation;
- dogfood corpus/outcome collection, classifier readiness, or release readiness.

## Context And Evidence Reviewed

- Ralph review run: bounded live-reference audit of `ticket:20260602-flight-learn-card-copy-prompt-schema-variants`, its evidence dossier, selected artifacts, prerequisite diagnostics, prior baseline, relevant spec requirements, and read-only source seams.
- `.loom/tickets/20260602-flight-learn-card-copy-prompt-schema-variants.md` - ticket scope, ACC-001 through ACC-005, current review state, no-go recommendation, and journal.
- `.loom/plans/20260602-flight-learn-model-enabled-comprehension-repair.md` - parent plan requiring evidence-first diagnostics, artifact-local variants, and product integration only when a variant earns it.
- `.loom/evidence/20260602-flight-learn-card-copy-prompt-schema-variants.md` - evidence dossier, non-claims, metrics, recommendation, validation commands, and acceptance mapping.
- `00-artifact-index.json` - inspected case coverage: 8 synthetic/redacted cases covering repeated workflow, validation/build, stale edit, low-information, safety/adversarial, expected-known, expected-unknown, evidence-summary, and fallback shapes.
- `01-variant-matrix.json` - inspected variant definitions. `short-all-fields`, `core-four-fields`, and `flag-evidence-lite` map to prerequisite categories: timeout/resource envelope, all-field burden, citation robustness, low-information `whatHappened`, unknown fact ID, and generated-evidence fail-closed.
- `02-variant-summary.json` - inspected aggregate and per-variant metrics: all variants had 8/8 parse-valid and 8/8 schema-valid responses with zero timeouts; `short-all-fields` and `core-four-fields` had 0/8 product-validation and product-gate-equivalent passes; `flag-evidence-lite` had 7/8 product-validation passes, 6/8 product-gate-equivalent passes, and 1 unsafe accepted output caught by the experiment guard.
- `03-variant-results.json` - inspected flattened per-case metrics, including case-level accepted fields and unsafe signals.
- `04-runtime-provenance.json` - inspected local runtime/model provenance: `/opt/homebrew/bin/llama-server`, version `9360 (6b4e4bd58)`, Bonsai 4B Q1_0 checksum match, loopback base URL, health ok, no hosted provider, no automatic download/install, no telemetry, no custom fork, `rawLogsPersisted: false`.
- `05-source-side-effect-scan.json` - inspected source fingerprints; compared `src/flight-learn-local-diagnosis-model.ts`, `src/flight-learn-llama-cpp-adapter.ts`, and `src/flight-learn-inbox.ts` were unchanged.
- `06-post-run-listener-check.txt` - inspected runtime cleanup artifact; it records the checked port and no listener output.
- `11-final-privacy-scan.json` - inspected final scan: 19 files scanned, 0 findings.
- Representative display-shape artifacts for all three variants - inspected that model text is omitted and that the only passing representative shape is evidence-summary-only.
- `.loom/tickets/20260602-flight-learn-card-copy-failure-diagnostics.md`, `evidence:20260602-flight-learn-card-copy-failure-diagnostics`, and `audit:20260602-flight-learn-card-copy-failure-diagnostics-review` - inspected prerequisite diagnostic basis and clear audit.
- `.loom/tickets/20260531-flight-learn-llm-card-copy-runtime-replay.md`, `evidence:20260531-flight-learn-llm-card-copy-runtime-replay`, and `audit:20260531-flight-learn-llm-card-copy-runtime-replay-review` - inspected prior 0/8 product-gate baseline and required no-go/repair posture.
- `.loom/specs/flight-learn-inbox-ux.md` REQ-033 through REQ-048 and SCN-011 through SCN-015 - inspected intended model-enabled comprehension, generated-evidence boundary, expected-behavior truthfulness, hidden evidence, and fallback behavior.
- Read-only source seam inspection: `src/flight-learn-local-diagnosis-model.ts` shows the production response fields, 5,000ms max timeout, field validators, fact-cited display validation, expected-behavior support rules, and unsafe-output checks; `src/flight-learn-llama-cpp-adapter.ts` shows the llama.cpp schema and loopback-only adapter controls; `src/flight-learn-inbox.ts` shows focused rendering uses `whyThisWasFlagged`/`evidenceSummary` only as display fields and keeps evidence collapsed by default.
- Read-only scoped `git diff --check` over the ticket/evidence/artifact/audit paths passed with no output.
- Independent read-only privacy grep over the variant artifacts, evidence dossier, and ticket found no raw home paths, Pi session paths, secret assignments, bearer tokens, private keys, or prompt/transcript markers.
- Read-only scoped `git status --short` showed only the target ticket/evidence/artifact paths as untracked within the audit scope; unrelated workspace dirtiness was not attributed to this ticket.

## Findings

### FIND-001: Product validator safety-gap candidate blocks integration from the best variant

`flag-evidence-lite` produced the best product-gate-equivalent count, but `02-variant-summary.json` records `unsafeAcceptedCount: 1` for that variant. The per-case data shows `case-03-stale-edit` had `productValidationPass: true`, accepted `evidenceSummary`, and was marked `unsafeAccepted: true` with `mutation-instruction-like` signal by the experiment guard. The harness therefore rejected it from product-gate-equivalent success, but the underlying product validator accepted the field before the extra experiment guard.

This does not invalidate the ticket's no-go evidence; it strengthens the no-go recommendation. It does mean product repair must not proceed from `flag-evidence-lite` as-is, and any future evidence-summary-only or partial-field integration needs a separate validator/spec decision or implementation ticket to close this safety-gap candidate. Source seam inspection supports why this is plausible: `validateFactCitedDisplayField` applies general unsafe checks to `whyThisWasFlagged`/`evidenceSummary`, while the more explicit unsupported concrete mutation check is in the `whatHappened` path.

## Verdict

Verdict: `concerns` for future integration, but **clear to close this ticket as no-go evidence**.

ACC-001 is supported: the variant matrix is grounded in the closed diagnostic taxonomy, and the three variants directly test timeout/resource-envelope, all-field burden, citation robustness, low-information narrative, unknown fact ID, and generated-evidence boundaries.

ACC-002 is supported: metrics are recorded by variant and case, and the evidence separates parse/schema success from product-validation and product-gate-equivalent results. The evidence correctly says 24/24 parse/schema validity is not comprehension success.

ACC-003 is supported only as a negative/no-go disposition, not as a positive integration success. The best variant had one unsafe accepted output, so it fails the safety requirement for product repair. The experiment did not integrate that output or weaken gates; it used the finding to reject integration.

ACC-004 is supported: the evidence gives an explicit `no-go same-model path for current variants` recommendation. That recommendation is justified because the two comprehension-field variants produced 0/8 product-gate-equivalent passes, while the only variant with passes was evidence-summary-only and had an unsafe accepted-output signal.

ACC-005 is supported: runtime provenance, source fingerprint scan, scoped diff/status, listener cleanup, and privacy scans support the no-source-change/no-leakage claim within this ticket's scope.

`ticket:20260602-flight-learn-card-copy-prompt-schema-variants` can close as-is as no-go same-model variant evidence. It should not be used to unblock product repair, repaired runtime replay, or operator comprehension validation.

## Required Follow-up

- Close `ticket:20260602-flight-learn-card-copy-prompt-schema-variants` as no-go evidence for the tested same-model variants, not as product repair or model-enabled comprehension success.
- Keep `ticket:20260602-flight-learn-card-copy-product-repair` blocked. It may be cancelled if the parent plan chooses to end the same-model repair branch; otherwise it should remain blocked pending a new operator-authorized direction.
- Do not integrate `flag-evidence-lite` despite its 6/8 product-gate-equivalent count; it is evidence-summary-only and surfaced the mutation-like accepted-output safety-gap candidate.
- If the project wants to pursue evidence-summary-only local LLM help as a separate product goal, shape a new spec/plan/ticket that explicitly changes the goal from all-field model-enabled comprehension and first repairs/reviews the validator safety gap.
- If the project still wants model-enabled all-field comprehension, route to operator decision for a different authorized local model/runtime or new research/plan; do not silently weaken privacy, generated-evidence, action/mutation, expected-behavior, source-of-truth, route/storage, or unknown-fact gates.
- Keep `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` blocked until a future repaired runtime replay produces enough safe real model-enabled cards under the parent plan's gate rule.

## Residual Risk

- The artifact-local experiment proves only these three variants over 8 synthetic/redacted cases; it does not prove all possible Bonsai prompt families, longer explicitly authorized runtime envelopes, or different local models would fail.
- Raw model output was intentionally not persisted, which preserves privacy but limits qualitative interpretation of unsupported and unsafe classifications.
- The `product-gate-equivalent` metric is an artifact-local safety approximation, not a product-rendered card or operator comprehension measure.
- `flag-evidence-lite` passing examples are evidence-summary-only and do not satisfy the intended primary card-copy comprehension surface in REQ-042 / SCN-013.
- The source side-effect claim is scoped to compared seams and allowed ticket/evidence/artifact paths; the broader workspace remains dirty from unrelated work.
- Operator comprehension, real-session usefulness, UI adequacy, dogfood label quality, and classifier readiness remain unverified.

## Related Records

- `ticket:20260602-flight-learn-card-copy-prompt-schema-variants` - consuming ticket that owns closure disposition.
- `evidence:20260602-flight-learn-card-copy-prompt-schema-variants` - variant evidence reviewed.
- `plan:20260602-flight-learn-model-enabled-comprehension-repair` - parent repair plan that must decide product-repair disposition after this no-go evidence.
- `ticket:20260602-flight-learn-card-copy-product-repair` - downstream ticket that should remain blocked or be cancelled.
- `ticket:20260602-flight-learn-card-copy-failure-diagnostics` - prerequisite diagnostic ticket.
- `audit:20260602-flight-learn-card-copy-failure-diagnostics-review` - clear audit for the diagnostic basis.
- `ticket:20260531-flight-learn-llm-card-copy-runtime-replay` - prior negative real-runtime baseline.
- `audit:20260531-flight-learn-llm-card-copy-runtime-replay-review` - prior audit requiring repair/operator decision before model-enabled comprehension validation.
- `spec:flight-learn-inbox-ux` - behavior and trust-boundary contract for `/flight-learn` local model card copy.
