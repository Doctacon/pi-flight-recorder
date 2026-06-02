# Flight Learn LLM Card Copy Runtime Replay Review

ID: audit:20260531-flight-learn-llm-card-copy-runtime-replay-review
Type: Audit
Status: recorded
Created: 2026-05-31
Updated: 2026-05-31
Audited: 2026-05-31 UTC
Target: ticket:20260531-flight-learn-llm-card-copy-runtime-replay

## Summary

Audited the evidence and claims for `ticket:20260531-flight-learn-llm-card-copy-runtime-replay`. The replay packet supports the ticket's evidence-collection acceptance criteria and can close as **negative real-runtime evidence**: fake-provider renders prove the repaired path can display gated card copy, but real Bonsai 4B produced 0/8 product gate passes, so successor operator comprehension validation should remain blocked for the current real local-model path until an operator decision, prompt/model repair, or scoped fallback-only validation change.

## Target

Target under review:

- `ticket:20260531-flight-learn-llm-card-copy-runtime-replay`
- Evidence dossier `evidence:20260531-flight-learn-llm-card-copy-runtime-replay`
- Runtime replay artifacts under `.loom/evidence/artifacts/20260531-flight-learn-llm-card-copy-runtime-replay/`

The ticket is in `review` and asks whether ACC-001 through ACC-005 are supported, whether the real runtime status and privacy posture are honest, and how to interpret the 0/8 real product gate result before any successor comprehension validation.

## Audit Scope And Lenses

Lenses used:

- acceptance and evidence: whether ACC-001 through ACC-005 are supported by artifact index, summaries, render pack, checks, and privacy scan;
- metric interpretation: whether fake-provider success and real parse/schema success are kept separate from operator comprehension and real local-model usefulness;
- real runtime status: whether Bonsai/llama.cpp use was local, loopback-only, authorized by existing Bonsai 4B context, no-download/no-install, and cleaned up;
- privacy: whether artifacts avoid raw private sessions, real local paths, secrets, prompts, transcripts, stack traces, raw server logs, or unredacted model output;
- product gate: whether 0/8 real product gate passes should block successor comprehension validation or trigger model/prompt repair;
- scope: whether the evidence run avoided product source changes, dogfood/corpus collection, classifier claims, and route/storage side effects.

Out of scope:

- re-auditing the closed local card-copy contract or renderer implementation beyond consuming their clear audit state;
- debugging Bonsai output quality or changing prompts/gates;
- operator comprehension validation;
- dogfood corpus/outcome readiness;
- release readiness.

## Context And Evidence Reviewed

- `.loom/tickets/20260531-flight-learn-llm-card-copy-runtime-replay.md` - ticket scope, ACC-001 through ACC-005, current review claim, and negative real-runtime interpretation.
- `.loom/plans/20260531-flight-learn-llm-authored-card-copy.md` - parent sequencing, especially the strategy that real local-runtime usefulness is a separate claim from fake-provider rendering.
- `.loom/tickets/20260531-flight-learn-llm-card-copy-contract.md` - closed prerequisite contract ticket.
- `.loom/tickets/20260531-flight-learn-llm-card-copy-rendering.md` - closed prerequisite rendering ticket.
- `.loom/audit/20260531-flight-learn-llm-card-copy-rendering-review.md` - clear audit for the renderer that this replay exercises.
- `.loom/specs/flight-learn-inbox-ux.md` REQ-042 through REQ-048 and SCN-013 through SCN-015 - intended behavior for local LLM card copy, generated-evidence boundary, hidden provenance, truthful expected behavior, and fallback.
- `.loom/evidence/20260531-flight-learn-llm-card-copy-runtime-replay.md` - evidence dossier and non-claims.
- `00-artifact-index.json` - inspected corpus coverage and fake/real render artifact inventory; it records 8 synthetic/redacted cases covering repeated workflow, validation/build, stale edit, low-information, safety/adversarial, expected-known, expected-unknown, evidence-summary, and fallback shapes.
- `01-fake-replay-summary.json` - inspected fake-provider metrics: 8/8 parse/schema valid, 3/8 product gate pass, 5/8 fallback, 4 unsafe rejections, 1 unsupported-facts fallback.
- `02-real-runtime-summary.json` - inspected real Bonsai metrics: 8 cases, 5/8 parse/schema valid, 0/8 product gate pass, 8/8 product fallback, 5 unsafe-output rejections, 3 timeouts, average latency 4472ms.
- `03-runtime-provenance.json` and `04-real-runtime-status.json` - inspected local runtime/model provenance: `/opt/homebrew/bin/llama-server`, version `9360 (6b4e4bd58)`, Bonsai 4B Q1_0 checksum match, loopback base URL, health ok, `rawLogsPersisted: false`, status `ran`.
- `05-render-line-widths.json` - inspected width checks; all fake and real renders passed 72/92-column limits.
- `06-render-contract-check.json` - inspected default-hidden-internals check; all fake and real default render files passed with no forbidden default findings.
- `09-post-run-listener-check.txt` - inspected post-run listener check artifact; it records the checked runtime port and no listener output was persisted.
- `11-final-privacy-scan.json` - inspected final privacy scan: 47 files scanned, 0 findings.
- Representative renders: `fake-case-01-repeated-workflow-72.txt`, `fake-case-05-safety-adversarial-72.txt`, `real-case-01-repeated-workflow-72.txt`, and `real-case-03-stale-edit-72.txt` - inspected model-enabled fake success, fake unsafe fallback, real timeout fallback, and real unsafe fallback cards.
- Read-only grep over `*.txt` render artifacts for raw home paths, private Pi session path markers, `Raw clue`, `Why suggested`, and `cluster_` - no matches found.
- Read-only grep over the artifact harness confirmed raw real provider responses are summarized into metrics and rendered product cards, while raw llama-server logs are byte-counted then deleted in `finally`; the persisted summary artifacts do not include raw model output text.
- `git status --short` - workspace is dirty from previous Loom/source work, as expected; this audit did not attribute unrelated dirty source state to the runtime replay ticket.

## Findings

None - no material findings within this bounded audit scope.

Supporting observations:

- ACC-001 is supported: `00-artifact-index.json` lists 8 synthetic/redacted cases with the requested coverage and no raw private content in the inspected artifacts.
- ACC-002 is supported: `01-fake-replay-summary.json` and `02-real-runtime-summary.json` record parse/schema validity, product gate pass/fallback, field coverage, fallback reasons, unsafe rejections, and real latency. The evidence correctly distinguishes fake-provider rendering from real-runtime usefulness.
- ACC-003 is supported: fake and real render packs exist at 72 and 92 columns using the repaired renderer; inspected fake renders include successful model-enabled and fallback cards, while inspected real renders show deterministic fallback cards because every real runtime case failed the product gates or timed out.
- ACC-004 is supported: real runtime status is explicit and honest. Bonsai 4B Q1_0 ran locally on loopback with checksum match, no download/install/hosted provider, and temp server logs were not persisted.
- ACC-005 is supported: the dossier and artifacts preserve non-claims and do not advance dogfood/corpus collection, classifier readiness, route ranking, or operator comprehension.

## Verdict

Verdict: `clear` as a bounded evidence audit, with a negative product-gate outcome.

The runtime replay ticket can close as-is, but only as **negative real-runtime evidence** for the current Bonsai 4B all-field card-copy path. The evidence supports the exact ticket claim: a privacy-safe replay/render packet exists, metrics are recorded, real runtime status is honest, and the result does not claim operator comprehension or corpus readiness.

The same evidence should not be used to proceed directly to model-enabled successor comprehension validation. Real Bonsai 4B produced 0/8 product gate passes and 8/8 deterministic fallbacks, so there are no successful real-runtime all-field card-copy cards to validate as the intended local-model comprehension path.

## Required Follow-up

Before any successor comprehension validation claims the model-enabled path is ready:

1. Keep `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` blocked for the current Bonsai 4B all-field card-copy path.
2. Route the negative real-runtime result to an operator decision or a new repair/research ticket, such as prompt/schema tuning, a different authorized local model, or a deliberately scoped fallback-only comprehension validation. Do not silently weaken privacy/safety gates to increase pass rate.
3. If the parent closes `ticket:20260531-flight-learn-llm-card-copy-runtime-replay`, record it as closed negative evidence, not as proof of local-model usefulness.
4. Dogfood corpus/outcome collection and classifier-readiness work must remain blocked until a successor comprehension validation with actual operator notes passes.

## Residual Risk

- The replay corpus is representative for the named synthetic/redacted shapes, not real-session usefulness or broad model quality.
- Fake-provider success proves the product path can render gated all-field copy, but it does not prove Bonsai/llama.cpp can generate that copy.
- Real Bonsai produced some parse/schema-valid objects, but every real response either failed hard product gates or timed out; parse/schema validity remains insufficient for comprehension or usefulness.
- Raw real model output was not persisted, which is correct for privacy, but it limits later qualitative failure analysis to metrics and fallback categories.
- The post-run listener artifact is minimal; provenance and cleanup are nevertheless supported by runtime status, harness behavior, temp-log summary, and final checks.
- Operator comprehension, real Pi TUI behavior, fallback adequacy for real users, and dogfood label quality remain unverified.

## Related Records

- `ticket:20260531-flight-learn-llm-card-copy-runtime-replay` - consuming ticket that owns closure disposition.
- `evidence:20260531-flight-learn-llm-card-copy-runtime-replay` - replay evidence reviewed.
- `plan:20260531-flight-learn-llm-authored-card-copy` - parent plan; should consume the negative gate.
- `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` - downstream validation that should remain blocked pending operator decision or repair.
- `ticket:20260531-flight-learn-llm-card-copy-rendering` - closed prerequisite renderer.
- `audit:20260531-flight-learn-llm-card-copy-rendering-review` - clear renderer audit consumed by this replay audit.
- `spec:flight-learn-inbox-ux` - behavior contract for local LLM card-copy rendering and evidence boundaries.
