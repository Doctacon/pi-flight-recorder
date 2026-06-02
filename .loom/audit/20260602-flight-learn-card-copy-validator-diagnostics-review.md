# Flight Learn Card Copy Validator Diagnostics Review

ID: audit:20260602-flight-learn-card-copy-validator-diagnostics-review
Type: Audit
Status: recorded
Created: 2026-06-02
Updated: 2026-06-02
Audited: 2026-06-02 UTC
Target: ticket:20260602-flight-learn-card-copy-validator-diagnostics

## Summary

Audited `ticket:20260602-flight-learn-card-copy-validator-diagnostics`, its evidence dossier, artifacts, and the source diff for `src/flight-learn-local-diagnosis-model.ts` and `src/flight-learn-local-diagnosis-model.test.ts`.

Verdict: `clear`.

The diagnostic ticket is supported for closure as a **diagnostic-only** implementation. The source adds `diagnoseLocalDiagnosisPolishResponse(...)`, which reports structured privacy-safe validator diagnostics, and the product path still uses `validateLocalDiagnosisPolishResponse(...)` directly. Tests and artifacts support ACC-001 through ACC-004. No material findings were found.

`ticket:20260602-flight-learn-card-copy-validator-contract-repair` can be unblocked, with the important constraint that this audit does not approve any semantic validator repair yet.

## Target

Target under review:

- `ticket:20260602-flight-learn-card-copy-validator-diagnostics`
- `evidence:20260602-flight-learn-card-copy-validator-diagnostics`
- Artifacts under `.loom/evidence/artifacts/20260602-flight-learn-card-copy-validator-diagnostics/`
- Source diff/source files:
  - `src/flight-learn-local-diagnosis-model.ts`
  - `src/flight-learn-local-diagnosis-model.test.ts`

The ticket is in `review` and asks whether maintainers can inspect current validator rejection behavior using safe categories/rule IDs without raw text leakage and without changing product acceptance behavior.

## Audit Scope And Lenses

Lenses used:

- ACC-001 through ACC-004 support;
- diagnostic-only scope: no prompt/schema/validator semantic repair yet;
- product behavior: `buildFlightLearnDiagnosisViewWithLocalPolish(...)` must not call the new diagnostic helper or change accept/reject/fallback behavior;
- privacy: diagnostics/evidence/artifacts must not persist raw prompts, raw model output, private sessions, raw local paths, secrets, transcripts, stack traces, or provider logs;
- source shape: exported helper is usable, source diff stays limited, no hosted/runtime/provider/dependency changes;
- taxonomy: known categories are represented well enough to drive the next repair ticket;
- evidence quality: validation commands and artifacts are sufficient for closure without overstating product repair.

Out of scope:

- implementing or approving the prompt/schema/validator contract repair;
- judging model output quality or operator comprehension;
- rerunning hosted/local model evaluations;
- closing or editing the ticket/evidence/source/spec/plan records.

## Context And Evidence Reviewed

- `.loom/tickets/20260602-flight-learn-card-copy-validator-diagnostics.md` - ticket scope, non-goals, acceptance, current review state, and journal. The ticket explicitly excludes product acceptance changes, hosted calls, runtime/download/provider changes, raw text persistence, downstream validation, dogfood collection, and product integration.
- `.loom/evidence/20260602-flight-learn-card-copy-validator-diagnostics.md` - evidence dossier. It records the diagnostic helper, unchanged product path claim, no hosted/local model/runtime calls, changed source seams, validation commands, product behavior check, privacy boundaries, and acceptance mapping (`.loom/evidence/20260602-flight-learn-card-copy-validator-diagnostics.md:12-16`, `:41-50`, `:74-93`, `:95-108`).
- `00-artifact-index.json` - inspected artifact inventory and non-claims. It records no hosted calls, no local runtime, no downloads/dependency/runtime installs/network calls, and no intentional product validation semantic changes.
- `01-focused-tests.txt` - focused tests passed: 1 file, 32 tests.
- `02-typecheck.txt` - `npm run typecheck` passed.
- `03-build.txt` - `npm run build` passed.
- `04-full-tests.txt` - full Vitest suite passed: 21 files, 152 tests.
- `05-diff-check.txt` - scoped `git diff --check` passed.
- `06-source-diff-summary.txt` - source diff summary shows only `src/flight-learn-local-diagnosis-model.ts` and `src/flight-learn-local-diagnosis-model.test.ts` changed, with `diagnoseLocalDiagnosisPolishResponse(...)` exported.
- `07-diagnostic-taxonomy.json` - inspected privacy-safe taxonomy. It records hard/soft/omitted/accepted categories, field names, rule IDs, and aggregate counts without raw fixture/model text (`.loom/evidence/artifacts/20260602-flight-learn-card-copy-validator-diagnostics/07-diagnostic-taxonomy.json:4-15`, `:18-50`).
- `08-privacy-scan.json` - privacy scan passed with zero findings over the evidence dossier, ticket, and artifact directory.
- `09-final-status.txt` - scoped final status shows the expected two modified source files plus the diagnostics evidence/ticket artifacts.
- `plan:20260602-flight-learn-prompt-validator-contract-repair` - parent plan requires diagnostics before semantic repair and explicitly says the trace must not become a raw-output logging path.
- `spec:flight-learn-inbox-ux` REQ-049 through REQ-054 and SCN-016 through SCN-018 - requires hard-vs-field-local distinction, non-brittle support repair, privacy-safe diagnostics, hosted diagnostic limits, and local/open replay before comprehension validation.
- `evidence:20260602-flight-learn-gpt55-hosted-sanity-check` and its audit - prior hosted diagnostic evidence supports prompt/validator process misalignment but not exact raw-text attribution, motivating this diagnostic path.
- `evidence:20260602-flight-learn-small-model-batch-eval` and its audit - local model evidence supports SmolLM2 as a repair lead but not comprehension validation; unsafe accepted signals remain a safety concern for later repair.
- `src/flight-learn-local-diagnosis-model.ts` - inspected product and diagnostic seams. Product builder still calls `validateLocalDiagnosisPolishResponse(...)` directly at `src/flight-learn-local-diagnosis-model.ts:829-830`, while `diagnoseLocalDiagnosisPolishResponse(...)` is a separate exported helper at `src/flight-learn-local-diagnosis-model.ts:1226-1268`.
- `src/flight-learn-local-diagnosis-model.test.ts` - inspected new focused tests. They compare product-equivalent diagnostics to `validateLocalDiagnosisPolishResponse(...)`, exercise deterministic fallback for an unsafe response, assert raw sensitive-looking fixture text is absent from diagnostic JSON, and cover taxonomy classes (`src/flight-learn-local-diagnosis-model.test.ts:147-242`).
- Read-only grep confirmed `diagnoseLocalDiagnosisPolishResponse` appears only in the source helper and tests, not inside `buildFlightLearnDiagnosisViewWithLocalPolish` or adapter/runtime paths.
- Additional read-only privacy scan over the ticket, evidence dossier, and diagnostics artifacts found no private home path, Pi session-storage path, private key, bearer token, secret assignment, or fixture-sensitive strings.

## Findings

None - no material findings within audited scope.

## ACC Support

- ACC-001 is supported. The diagnostic response records metadata only: raw/normalized lengths, SHA-256 hashes, parse/object state, allowed key presence, extra key count/hashes, per-field outcome, reason, issue category, rule ID, and counts (`src/flight-learn-local-diagnosis-model.ts:1226-1268`, `:1319-1382`, `:1577-1595`). Tests assert diagnostic JSON does not contain fixture raw path/secret/prompt/transcript text (`src/flight-learn-local-diagnosis-model.test.ts:186-203`), and `08-privacy-scan.json` passed with zero findings.
- ACC-002 is supported. The product path still validates through `validateLocalDiagnosisPolishResponse(...)` and falls back on failed validation (`src/flight-learn-local-diagnosis-model.ts:801-847`). The new helper separately calls the existing validator only to compute a product-equivalent diagnostic (`src/flight-learn-local-diagnosis-model.ts:1244-1265`). Tests compare diagnostic product-equivalent results to the validator and exercise unchanged deterministic fallback (`src/flight-learn-local-diagnosis-model.test.ts:158-172`, `:224-241`).
- ACC-003 is supported. The taxonomy artifact covers unsupported facts, route/action advice, mutation instruction, generated-evidence claim, expected known/unknown support failures, duplicate/empty omissions, raw path, secret-looking output, prompt/transcript-like output, safe paraphrase, unsupported token novelty, and multi-field diagnostics after hard failure (`07-diagnostic-taxonomy.json:18-50`). The source tests cover the same categories (`src/flight-learn-local-diagnosis-model.test.ts:206-242`).
- ACC-004 is supported. Evidence records focused tests, typecheck, build, full tests, diff check, privacy scan, source diff summary, and final status as passing or scoped (`.loom/evidence/20260602-flight-learn-card-copy-validator-diagnostics.md:74-83`; artifacts `01-focused-tests.txt` through `09-final-status.txt`).

## Verdict

Verdict: `clear`.

The diagnostic ticket can close after ticket-owner reconciliation. The implementation is bounded to diagnostics and tests, preserves product accept/reject behavior, and gives the successor repair ticket a safer basis than aggregate fallback categories.

Closure recommendation:

- Close `ticket:20260602-flight-learn-card-copy-validator-diagnostics` as diagnostic-only work.
- Unblock `ticket:20260602-flight-learn-card-copy-validator-contract-repair` so it can use these diagnostics for the actual semantic repair.
- Do not treat this ticket as product repair, operator comprehension validation, local runtime evidence, or proof that any model output should now be accepted.

## Required Follow-up

Before closing the ticket, the ticket owner should:

1. Record this audit in the ticket current state/journal.
2. Close the diagnostics ticket only as privacy-safe diagnostic visibility.
3. Move `ticket:20260602-flight-learn-card-copy-validator-contract-repair` from blocked to open/ready only if the parent plan is still current.

For the next repair ticket:

- Use the diagnostic rule IDs/categories to target semantic repair; do not broaden product acceptance from this ticket alone.
- Preserve hard card-level fail-closed behavior for privacy, raw paths/session paths, secrets, prompt/transcript text, route/action advice, mutation instructions, generated-evidence claims, classifier/ranking claims, and internal provenance leakage.
- Add repair tests that prove safe local model card-copy can pass after changing semantics, because this diagnostics ticket intentionally does not prove that.

## Residual Risk

- The diagnostic helper mirrors existing validator logic. Future semantic repair could make this helper stale unless the repair ticket updates both validation and diagnostics together.
- The taxonomy is synthetic/redacted and broad enough for the next repair, but it does not identify exact raw `gpt-5.5` or SmolLM2 wording defects because those outputs were intentionally not persisted.
- The diagnostic payload includes lengths and hashes. This is allowed by the spec and useful for correlation, but future evidence should still avoid treating hashes as permission to persist sensitive raw text elsewhere.
- Some sensitive-looking strings exist in source tests as synthetic fixtures so diagnostics can prove non-persistence. They do not appear in Loom diagnostics/evidence/artifacts, but future test additions should keep fixture values synthetic and clearly non-secret.
- This ticket does not prove operator comprehension, model usefulness, local runtime performance, or repaired product behavior.

## Related Records

- `ticket:20260602-flight-learn-card-copy-validator-diagnostics`
- `evidence:20260602-flight-learn-card-copy-validator-diagnostics`
- `plan:20260602-flight-learn-prompt-validator-contract-repair`
- `spec:flight-learn-inbox-ux`
- `evidence:20260602-flight-learn-gpt55-hosted-sanity-check`
- `audit:20260602-flight-learn-gpt55-hosted-sanity-check-review`
- `evidence:20260602-flight-learn-small-model-batch-eval`
- `audit:20260602-flight-learn-small-model-batch-eval-review`
- `ticket:20260602-flight-learn-card-copy-validator-contract-repair`
