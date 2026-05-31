# Ralph Fourth Follow-up Audit Output

Target: `ticket:20260528-flight-learn-narrative-local-model-contract`
Date: 2026-05-28
Verdict: `changes-needed`

## Summary

The exact third-follow-up examples for `FIND-TFU-001` and `FIND-TFU-002` are now covered by source/tests/harness exercises, but the underlying classes are not fully resolved. New non-writing fake-provider probes still found accepted `whatHappened` action advice using common determiners/adjectives and `Use...` imperative phrasing, plus accepted plural internal/meta echo terms.

`ACC-001`, `ACC-003`, and the command-health portion of `ACC-005` have supporting evidence. `ACC-002` cannot close, and the ticket should not close while `ACC-002` remains blocked. `ACC-004` has existing corpus-consumption evidence but should be refreshed after adding the new adversarial exercises.

## Findings

### FIND-FFU-001 — Blocker — `whatHappened` still accepts common imperative action advice

`FIND-TFU-001` is only partially resolved. The exact third-follow-up examples (`run a validation`, `run local validation`, `check validation`) are now rejected by focused tests/harness exercises, but adjacent common imperative phrasing is still accepted as local-model output.

Evidence from a non-writing fake-provider probe against the current validator:

```text
accepted: After reinstalling the package, run the current validation from a fresh shell.
accepted: Rerun your validation from a fresh shell after reinstalling the package.
accepted: Check the current validation from a fresh shell after reinstalling the package.
accepted: Validate current result from a fresh shell after reinstalling the package.
accepted: Use a fresh shell for validation after reinstalling the package.
accepted: Use stored evidence to validate the stale shell pattern.
rejected: After reinstalling the package, run a local validation from a fresh shell. (unsafe-output)
```

Why this happens: `WHAT_HAPPENED_ACTION_OBJECT_PATTERN` only permits a small determiner/adjective set before action objects (`the|a|an|local|fresh|same|project`) and does not cover `current` or `your` (`src/flight-learn-local-diagnosis-model.ts:184`). The imperative verb pattern also does not include `use` (`src/flight-learn-local-diagnosis-model.ts:185-186`). Because `current` is a common diagnosis token and `your`/`use` do not trip unsupported-fact checks in these examples, the narratives pass validation.

This challenges `ACC-002` and the ticket/evidence claims that route/action advice now falls back (`.loom/tickets/20260528-flight-learn-narrative-local-model-contract.md:68-70`, `.loom/evidence/20260528-flight-learn-narrative-local-model-contract.md:105-106`).

False-positive guards still look good: descriptive `Review churn...`, passive `The validation was rerun...`, and supported imperative `expectedBehavior` remained accepted in tests/probes.

### FIND-FFU-002 — Blocker — Internal/meta echo still bypasses via plural display-field terms

`FIND-TFU-002` is only partially resolved. The exact singular examples (`packet`, `bounded packet`, `redacted packet`, singular capital `Problem`) are now rejected by tests/harness exercises, but plural variants are still accepted.

Evidence from the same non-writing fake-provider probe:

```text
accepted: The deltas point to the same stale shell pattern.
accepted: The packets point to the same stale shell pattern.
accepted: The headlines point to the same stale shell pattern.
accepted: The Problems point to the same stale shell pattern.
rejected: The JSON points to the same stale shell pattern. (unsupported-facts)
rejected: The signal points to the same stale shell pattern. (unsafe-output)
rejected: The bound points to the same stale shell pattern. (unsafe-output)
```

Why this happens: the unsafe-output regex rejects singular `delta\b`, `packet\b`, `headline\b`, and singular capital `Problem` (`src/flight-learn-local-diagnosis-model.ts:180-181`), while narrative token support still treats plural variants as allowed connective terms through `NARRATIVE_CONNECTIVE_TOKENS` and plural-to-singular variants (`src/flight-learn-local-diagnosis-model.ts:238-269`, `src/flight-learn-local-diagnosis-model.ts:820-824`, `src/flight-learn-local-diagnosis-model.ts:846-855`).

This contradicts the prompt/evidence boundary that internal field names/meta-language are forbidden while generic `stored evidence` is allowed (`src/flight-learn-local-diagnosis-model.ts:580`, `.loom/evidence/20260528-flight-learn-narrative-local-model-contract.md:101`). The intentional `stored evidence` allowance itself appears preserved.

## Correct / Supported

- The prompt is field-specific and tells the local model that `headline`/`Problem` is concise while `whatHappened` is the narrative field (`src/flight-learn-local-diagnosis-model.ts:571-582`; test assertions at `src/flight-learn-local-diagnosis-model.test.ts:123-129`).
- Exact duplicate `whatHappened` output falls back as empty output (`src/flight-learn-local-diagnosis-model.ts:771-773`; tests at `src/flight-learn-local-diagnosis-model.test.ts:148-166`).
- Exact third-follow-up harness exercises were added for article/adjective action objects, `check`, packet, and `Problem` (`.loom/evidence/artifacts/20260528-flight-learn-narrative-local-model-contract/run-narrative-local-model-contract-harness.mjs:251-259`). Existing harness summary reports zero mismatches and 16 unsafe-output exercises (`harness-summary.json:41-53`).
- Deterministic fallback/default behavior remains covered by focused tests, including disabled/unavailable provider fallback and source-delta non-mutation (`src/flight-learn-local-diagnosis-model.test.ts:69-90`, `src/flight-learn-local-diagnosis-model.test.ts:92-132`).
- Validation commands run during this audit passed: `npm test -- src/flight-learn-local-diagnosis-model.test.ts` (19 tests), `npm run typecheck`, and `git diff --check`.

## Acceptance Verdict

- `ACC-001`: Supported by prompt/source/tests, but do not close the ticket while safety validation remains blocked.
- `ACC-002`: Not satisfied. `FIND-FFU-001` and `FIND-FFU-002` show accepted unsafe action advice and internal/meta echo variants.
- `ACC-003`: Supported by existing focused tests and source inspection.
- `ACC-004`: Existing harness consumes all 15 corpus cases with zero mismatches, but it does not cover the new bypasses. Refresh after fixes.
- `ACC-005`: Command-health evidence is positive, but test coverage must be expanded for the new blockers before using it for closure.

## Required Follow-up

1. Extend `whatHappened` action-advice detection to reject common determiner/adjective and imperative forms such as `your/current validation`, `current result`, and `Use ... for/to validate ...`, without rejecting passive/descriptive narratives or supported `expectedBehavior`.
2. Reject or explicitly disposition plural internal/meta terms (`deltas`, `packets`, `headlines`, capital `Problems`) and add focused tests plus harness exercises.
3. Re-run focused tests, typecheck, `git diff --check`, and the fake-provider harness after fixes. The harness script writes result artifacts (`run-narrative-local-model-contract-harness.mjs:308-309`), so I did not rerun it during this no-edit audit.
4. Update ticket/evidence current-state wording that currently overclaims complete action-advice/internal-echo fallback coverage.

## Residual Risk

- The validator remains regex/token based; additional imperative phrasings may exist beyond the examples above.
- Existing fake-provider evidence does not prove Bonsai 4B output quality, latency, or runtime safety.
- Safe but generic low-quality prose remains intentionally accepted as a recorded quality residual risk, not a runtime safety fallback.

## Inspected Context

- Ticket: `.loom/tickets/20260528-flight-learn-narrative-local-model-contract.md`
- Prior audits: initial, first follow-up, second follow-up, and third follow-up audit records for this ticket
- Evidence dossier: `.loom/evidence/20260528-flight-learn-narrative-local-model-contract.md`
- Harness artifacts: `harness-summary.json`, `narrative-local-model-contract-harness-results.json`, `run-narrative-local-model-contract-harness.mjs`
- Narrative corpus: `.loom/evidence/artifacts/20260528-flight-learn-narrative-rubric-corpus/narrative-what-happened-eval-corpus.v1.json`
- Source/tests: `src/flight-learn-local-diagnosis-model.ts`, `src/flight-learn-local-diagnosis-model.test.ts`
- Relevant git diff/status for source, spec, ticket/evidence/audit artifacts
- Commands/probes: focused Vitest, typecheck, `git diff --check`, and non-writing fake-provider probes
