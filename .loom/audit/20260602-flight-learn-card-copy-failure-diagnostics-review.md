# Flight Learn Card Copy Failure Diagnostics Review

ID: audit:20260602-flight-learn-card-copy-failure-diagnostics-review
Type: Audit
Status: recorded
Created: 2026-06-02
Updated: 2026-06-02
Audited: 2026-06-02 UTC
Target: ticket:20260602-flight-learn-card-copy-failure-diagnostics

## Summary

Audited `ticket:20260602-flight-learn-card-copy-failure-diagnostics` and its evidence packet. The ticket can close as a bounded diagnostic result: it supports the claimed privacy-safe failure taxonomy, keeps metric interpretation appropriately limited, and is actionable enough to unblock artifact-local prompt/schema variant work, but not product source repair or comprehension validation.

## Target

Target under review:

- `ticket:20260602-flight-learn-card-copy-failure-diagnostics`
- Evidence dossier `evidence:20260602-flight-learn-card-copy-failure-diagnostics`
- Diagnostic artifacts under `.loom/evidence/artifacts/20260602-flight-learn-card-copy-failure-diagnostics/`

The ticket is in `review` and asks whether ACC-001 through ACC-005 are supported after a real local Bonsai 4B diagnostic run over synthetic/redacted card-copy cases.

## Audit Scope And Lenses

Lenses used:

- acceptance and evidence: whether ACC-001 through ACC-005 are supported by the dossier and artifacts;
- diagnostic sufficiency: whether the taxonomy is actionable enough for the downstream prompt/schema variant ticket despite only 2/8 observed responses;
- metric interpretation: whether the record avoids overclaiming from timeouts, parse/schema validity, or partial field taxonomy;
- privacy and trust boundary: whether artifacts avoid raw prompts, raw model output, raw server logs, private sessions, raw local paths, secrets, transcripts, and stack traces;
- runtime boundary: whether the real Bonsai run was local, loopback-only, explicitly authorized by the repair-plan run context, no-download/no-install, and cleaned up;
- scope: whether product source remained read-only for the diagnostic slice and no corpus/classifier/comprehension claims were made;
- repair recommendation safety: whether recommendations preserve non-negotiable safety, expected-behavior, generated-evidence, source-of-truth, and route/storage gates.

Out of scope:

- choosing or implementing prompt/schema variants;
- re-running the local runtime;
- debugging Bonsai generation quality beyond the evidence packet;
- product source repair;
- operator comprehension validation;
- dogfood corpus/outcome collection or classifier readiness.

## Context And Evidence Reviewed

- `.loom/tickets/20260602-flight-learn-card-copy-failure-diagnostics.md` - ticket scope, ACC-001 through ACC-005, current review state, and journal.
- `.loom/plans/20260602-flight-learn-model-enabled-comprehension-repair.md` - parent repair plan; it requires evidence-first diagnostics before artifact-local variants, and preserves non-negotiable safety/source-of-truth gates.
- `.loom/evidence/20260602-flight-learn-card-copy-failure-diagnostics.md` - evidence dossier, metrics, limits, and recommendation.
- `00-artifact-index.json` - inspected 8 synthetic/redacted cases covering repeated workflow, validation/build, stale edit, low-information, safety/adversarial, expected-known, expected-unknown, evidence-summary, and fallback shapes.
- `01-failure-taxonomy.json` - inspected aggregate and per-case diagnostics: 8 cases, 2 observed responses, 2 parse-valid responses, 0 full validation/product gate passes, 6 timeouts, 2 unsafe-output fallbacks, field-level categories, repairable categories, non-negotiable categories, and explicit limitations.
- `02-runtime-provenance.json` - inspected runtime/model provenance: status `ran`, loopback base URL, checksum match, hosted provider false, automatic download/install false, server log byte-count summary with `rawLogsPersisted: false`.
- `03-diagnostic-run-output.json` - inspected sanitized run summary and top repair targets.
- `04-source-side-effect-scan.json` - inspected source fingerprint before/after comparison for `src/flight-learn-local-diagnosis-model.ts` and `src/flight-learn-llama-cpp-adapter.ts`; `pass: true`, `changedSources: []`.
- `05-post-run-listener-check.txt` - inspected cleanup artifact: checked the runtime port and recorded no listener output.
- `08-final-privacy-scan.json` - inspected final scan: 13 files scanned, 0 findings.
- `07-final-diff-check.txt` - inspected by command; it is an empty file, consistent with `git diff --check` producing no output.
- `09-final-status.txt` - inspected scoped status for diagnostic ticket/evidence/artifact paths.
- `ticket:20260531-flight-learn-llm-card-copy-runtime-replay`, `evidence:20260531-flight-learn-llm-card-copy-runtime-replay`, and `audit:20260531-flight-learn-llm-card-copy-runtime-replay-review` - inspected prior negative baseline and its audit disposition.
- `.loom/specs/flight-learn-inbox-ux.md` REQ-033 through REQ-048 and SCN-011 through SCN-015 - inspected behavior/trust-boundary contract for model-enabled comprehension, local LLM draft/card-copy display, expected-behavior truthfulness, hidden evidence, and fallback.
- Read-only source seam inspection: `src/flight-learn-local-diagnosis-model.ts` line-grep showed the current prompt asks for all six display fields, length limits, and a 5,000ms maximum timeout; `src/flight-learn-llama-cpp-adapter.ts` line-grep showed the schema includes all six fields under `flight_learn_diagnosis_polish_v2`.
- Read-only artifact grep/privacy check over the diagnostic artifacts, dossier, and ticket found no raw home paths, Pi session paths, secret assignments, bearer tokens, private keys, or chat/prompt markers outside the harness's own regex literals.
- Read-only scoped `git diff --check` over the ticket/evidence/artifact/audit paths passed with no output.
- Read-only scoped `git status --short` showed the workspace remains dirty from unrelated prior Loom/source work; this audit did not attribute unrelated dirty paths to the diagnostic ticket.

## Findings

None - no material findings within this bounded audit scope.

Supporting observations:

- ACC-001 is supported: `00-artifact-index.json` records the representative synthetic/redacted corpus, and `02-runtime-provenance.json` records that real Bonsai 4B ran locally, loopback-only, with checksum match, no hosted provider, and no automatic download/install.
- ACC-002 is supported: `01-failure-taxonomy.json` records per-case and per-field diagnostic categories without raw model text. The taxonomy is partial because only 2/8 responses completed, but it is explicit about that limitation.
- ACC-003 is supported: the dossier and taxonomy separate repairable timeout/resource-envelope, citation, and narrative-burden targets from generated-evidence-like wording and unknown fact IDs that must remain fail-closed.
- ACC-004 is supported within scoped evidence: `04-source-side-effect-scan.json` shows compared product source seams unchanged before/after the diagnostic harness, and scoped diff/status artifacts show only diagnostic ticket/evidence/artifact writes. The broader workspace is dirty, so this is a scoped no-side-effect claim, not a global clean-worktree claim.
- ACC-005 is supported: final privacy scan and independent grep found no forbidden private/session/secret/prompt/transcript patterns in persisted diagnostic artifacts, evidence, or ticket. Raw server logs were byte-counted and deleted; raw prompts and model responses were not persisted.

## Verdict

Verdict: `clear` for the bounded diagnostic ticket.

The ticket can close as-is as a privacy-safe diagnostic result. The evidence is strong enough for the next child ticket, `ticket:20260602-flight-learn-card-copy-prompt-schema-variants`, to proceed with artifact-local variant experiments. It is not strong enough to justify product source repair, gate relaxation, longer timeout defaults, or operator comprehension validation by itself.

The main actionable diagnosis is honestly narrow: the current all-field Bonsai path is still 0/8 product-gated, with 6/8 timeouts under the current 5s envelope and only 2 completed responses available for field-level taxonomy. That is sufficient to test shorter/lower-burden prompt/schema variants and clearer citation/omission instructions, while keeping unsafe/generated-evidence and unknown fact IDs fail-closed.

## Required Follow-up

- Close `ticket:20260602-flight-learn-card-copy-failure-diagnostics` as diagnostic evidence, not as model repair or comprehension success.
- Unblock `ticket:20260602-flight-learn-card-copy-prompt-schema-variants` only for artifact-local same-model experiments; that ticket must not edit product source.
- Downstream variant work must treat the 2/8 field taxonomy as partial and must measure product-gated renders, not parse/schema validity alone.
- Do not weaken generated-evidence, expected-behavior, privacy, action/mutation, source-of-truth, route/storage, or unknown-fact gates to improve pass rate.
- Keep `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` blocked until a repaired runtime replay produces enough safe real model-enabled cards under the parent plan's gate rule.

## Residual Risk

- Field-level taxonomy is incomplete because 6/8 cases timed out and raw output was intentionally not persisted. This is correct for privacy, but it limits semantic diagnosis of the two unsafe-output cases.
- The primary repair target may be prompt/output burden, model latency, or both; diagnostics do not prove that shorter prompts or schema variants will produce useful card copy.
- One unsafe-output case has no persisted text-signal category, so the next variant ticket may need closer artifact-local diagnosis while still avoiding raw output persistence.
- The source side-effect claim is scoped to compared product seams and allowed diagnostic paths. The broader workspace is dirty from unrelated prior work and should not be treated as clean evidence.
- Operator comprehension, real-session usefulness, UI adequacy, dogfood label quality, and classifier readiness remain unverified.

## Related Records

- `ticket:20260602-flight-learn-card-copy-failure-diagnostics` - consuming ticket that owns closure disposition.
- `evidence:20260602-flight-learn-card-copy-failure-diagnostics` - diagnostic evidence reviewed.
- `plan:20260602-flight-learn-model-enabled-comprehension-repair` - parent repair plan; should consume this audit to proceed to variants.
- `ticket:20260602-flight-learn-card-copy-prompt-schema-variants` - downstream artifact-local variant ticket that may proceed after this diagnostic ticket closes.
- `ticket:20260531-flight-learn-llm-card-copy-runtime-replay` - prior negative baseline that motivated diagnostics.
- `audit:20260531-flight-learn-llm-card-copy-runtime-replay-review` - prior audit requiring repair/operator decision before model-enabled comprehension validation.
- `spec:flight-learn-inbox-ux` - behavior and trust-boundary contract for `/flight-learn` local model card copy.
