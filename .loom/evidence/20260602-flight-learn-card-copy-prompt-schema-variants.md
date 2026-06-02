# Flight Learn Card Copy Prompt Schema Variants Evidence

ID: evidence:20260602-flight-learn-card-copy-prompt-schema-variants
Type: Evidence Dossier
Status: recorded
Created: 2026-06-02
Updated: 2026-06-02
Observed: 2026-06-02 UTC

## Summary

Executed `ticket:20260602-flight-learn-card-copy-prompt-schema-variants` as a bounded artifact-local same-model experiment over 3 prompt/schema variants and 8 synthetic/redacted representative `/flight-learn` card-copy cases.

Real local Bonsai 4B Q1_0 ran on loopback-only `llama-server` with the expected checksum. No downloads, installs, hosted calls, non-loopback endpoints, telemetry, custom forks, raw private sessions, raw local paths, secrets, raw prompts, raw model responses, or raw server logs were persisted.

Main result: the shorter/lower-burden variants fixed the timeout symptom but did **not** produce an integration-worthy model-enabled comprehension path.

- `short-all-fields`: 8/8 parse-valid, 8/8 schema-valid, 0/8 product-validation pass, 0/8 product-gate-equivalent pass.
- `core-four-fields`: 8/8 parse-valid, 8/8 schema-valid, 0/8 product-validation pass, 0/8 product-gate-equivalent pass.
- `flag-evidence-lite`: 8/8 parse-valid, 8/8 schema-valid, 7/8 product-validation pass, 6/8 product-gate-equivalent pass, but only `evidenceSummary` was product-validated and 1 case had a non-negotiable mutation-like accepted-output signal caught by the experiment guard.

Recommendation: **no-go same-model path for current variants**. Do not move to product repair from this evidence. The best variant is too narrow for model-enabled comprehension and exposed a safety-gap candidate that would require a separate validator/spec decision before product integration.

Artifact directory:

```text
.loom/evidence/artifacts/20260602-flight-learn-card-copy-prompt-schema-variants/
```

## Artifact Inventory

Key artifacts:

- `run-card-copy-prompt-schema-variants.mjs` - artifact-local variant harness using synthetic/redacted cases, current source imports, custom artifact-local prompts/schemas, and current product validation paths.
- `00-artifact-index.json` - case inventory, artifact names, and non-claims.
- `01-variant-matrix.json` - variant definitions and diagnostic justifications.
- `02-variant-summary.json` - aggregate metrics, recommendation, and per-variant case summaries.
- `03-variant-results.json` - flattened per-variant/per-case metrics without raw model text.
- `04-runtime-provenance.json` - runtime/model provenance and temp-log handling.
- `05-source-side-effect-scan.json` - source fingerprint before/after scan for read-only source seams.
- `06-post-run-listener-check.txt` - post-run listener check.
- `07-variant-run-output.json` - sanitized run summary.
- `08-artifact-privacy-scan.json` - artifact-local privacy scan emitted by the harness.
- `09-harness-syntax-check.txt` - `node --check` output for the harness.
- `display-shape-*.txt` - sanitized display-field shape summaries with model text omitted.

Coverage from `00-artifact-index.json`:

- repeated workflow;
- validation/build;
- stale edit;
- low-information;
- safety/adversarial rejection;
- expected-known;
- expected-unknown;
- evidence-summary;
- fallback.

## Variant Matrix

From `01-variant-matrix.json`:

1. `short-all-fields`
   - Same six product field jobs.
   - Shorter instructions than the product prompt.
   - Explicit omit-if-not-improving and exact fact-ID rules.
   - Max output tokens: 384.

2. `core-four-fields`
   - Lower output burden focused on `headline`, `whatHappened`, `whyItMatters`, and `expectedBehavior`.
   - Omits `whyThisWasFlagged` and `evidenceSummary` by design.
   - Max output tokens: 288.

3. `flag-evidence-lite`
   - Citation-focused probe for `whyThisWasFlagged` and `evidenceSummary` with optional one-sentence `whatHappened`.
   - Max output tokens: 224.

All variants were chosen from the prior diagnostic taxonomy: timeout/resource envelope, all-field burden, citation robustness, low-information `whatHappened`, unknown-fact rejection, and generated-evidence fail-closed boundaries.

## Runtime And Model Provenance

From `04-runtime-provenance.json`:

- Runtime path: `/opt/homebrew/bin/llama-server`.
- Runtime version: `9360 (6b4e4bd58)`.
- Model path: `~/.cache/pi-flight-recorder/bonsai/Bonsai-4B-Q1_0.gguf`.
- Model SHA256 matched expected Bonsai 4B Q1_0 checksum: `4524b3f997f0f06444e568d1f26e2efd69effa3218c7ad3047432fb171e42168`.
- Base URL was loopback-only.
- No hosted provider, non-loopback endpoint, automatic download/install, telemetry, custom runtime fork, or new model family was used.
- Raw `llama-server` logs were temporary and deleted after byte-count summary; raw logs were not persisted in Loom.

`06-post-run-listener-check.txt` records:

```text
checked tcp port 52757
no listener output
```

## Aggregate Metrics

From `02-variant-summary.json`:

```json
{
  "short-all-fields": {
    "parseValidCount": 8,
    "schemaValidCount": 8,
    "productValidationPassCount": 0,
    "productGateEquivalentPassCount": 0,
    "unsafeAcceptedCount": 0,
    "timeoutCount": 0,
    "fallbackCategories": {
      "unsupported-facts": 6,
      "unsafe-output": 2
    },
    "avgLatencyMs": 3824,
    "avgPromptLengthChars": 1978
  },
  "core-four-fields": {
    "parseValidCount": 8,
    "schemaValidCount": 8,
    "productValidationPassCount": 0,
    "productGateEquivalentPassCount": 0,
    "unsafeAcceptedCount": 0,
    "timeoutCount": 0,
    "fallbackCategories": {
      "unsupported-facts": 4,
      "unsafe-output": 4
    },
    "avgLatencyMs": 2402,
    "avgPromptLengthChars": 1940
  },
  "flag-evidence-lite": {
    "parseValidCount": 8,
    "schemaValidCount": 8,
    "productValidationPassCount": 7,
    "productGateEquivalentPassCount": 6,
    "unsafeAcceptedCount": 1,
    "timeoutCount": 0,
    "fallbackCategories": {
      "unsafe-accepted-rejected-by-experiment": 1,
      "unsafe-output": 1
    },
    "avgLatencyMs": 1444,
    "avgPromptLengthChars": 1661
  }
}
```

Interpretation:

- Shorter prompts removed the dominant 5s timeout failure seen in diagnostics.
- Schema-constrained shape succeeded for all variants: 24/24 parse-valid and schema-valid responses.
- The two variants that attempted primary comprehension fields still produced 0/8 product-validation passes.
- The only variant with product-gate-equivalent passes mostly produced `evidenceSummary` only; it did not produce the all-field or core-field comprehension surface that `/flight-learn` needs.
- The `flag-evidence-lite` variant also surfaced one product-validator accepted output with a non-negotiable mutation-like signal caught by the experiment guard. This must not be integrated without a separate validator repair and review.

## Display Shape Summaries

The display-shape artifacts intentionally omit model text. They show field presence and product-validation status only.

Representative `flag-evidence-lite` shape:

```text
Variant: flag-evidence-lite
Case: case-01-repeated-workflow
Product-gate-equivalent pass: true
Fallback category: none
Display field shape (model text omitted; no raw model output persisted):
- headline: omitted
- whatHappened: omitted
- whyItMatters: omitted
- expectedBehavior: omitted
- whyThisWasFlagged: omitted
- evidenceSummary: present, product-validated
Evidence remains deterministic and inspectable; this artifact records shape only.
```

This confirms why the best pass count is not enough: it is evidence-summary-only, not model-enabled card comprehension.

## Privacy And Boundary Notes

- Corpus cases were synthetic/redacted.
- Product source was read-only; source fingerprints for `src/flight-learn-local-diagnosis-model.ts`, `src/flight-learn-llama-cpp-adapter.ts`, and `src/flight-learn-inbox.ts` were unchanged before/after the harness.
- The harness used current product validation paths but did not modify product source, tests, docs, package files, config, specs, plans, research, audit, or other tickets.
- Raw prompts, raw model responses, raw server logs, raw private sessions, local paths, secrets, transcripts, and stack traces were not persisted.
- Display-shape artifacts omit model text and record only field presence/status.
- Model output did not route, rank, store truth, create/apply artifacts, edit source/docs/Loom/rules/skills/prompts, or feed classifier labels.
- This evidence does not authorize dogfood corpus/outcome collection or operator comprehension validation.

## Validation Commands

| Artifact | Command | Result |
| --- | --- | --- |
| `09-harness-syntax-check.txt` | `node --check .loom/evidence/artifacts/20260602-flight-learn-card-copy-prompt-schema-variants/run-card-copy-prompt-schema-variants.mjs` | passed; no output |
| `07-variant-run-output.json` | `node --import tsx .loom/evidence/artifacts/20260602-flight-learn-card-copy-prompt-schema-variants/run-card-copy-prompt-schema-variants.mjs` | completed; real Bonsai runtime ran, variant metrics recorded, source side-effect scan passed, listener check passed, artifact privacy scan passed |
| `05-source-side-effect-scan.json` | source fingerprint before/after comparison for `src/flight-learn-local-diagnosis-model.ts`, `src/flight-learn-llama-cpp-adapter.ts`, and `src/flight-learn-inbox.ts` | passed; no source changes |
| `06-post-run-listener-check.txt` | `lsof -nP -iTCP:<run-port> -sTCP:LISTEN` | no listener output |
| `08-artifact-privacy-scan.json` | privacy scan over artifacts present at harness completion | passed; 11 files scanned, 0 findings |
| `10-final-diff-check.txt` | `git diff --check -- .loom/evidence/20260602-flight-learn-card-copy-prompt-schema-variants.md .loom/tickets/20260602-flight-learn-card-copy-prompt-schema-variants.md .loom/evidence/artifacts/20260602-flight-learn-card-copy-prompt-schema-variants` | passed; no output |
| `11-final-privacy-scan.json` | privacy scan over artifacts, evidence dossier, and ticket | passed; 19 files scanned, 0 findings |
| `12-final-status.txt` | scoped status for this ticket's evidence/ticket/artifact paths | recorded only allowed ticket/evidence/artifact paths |

## Acceptance Mapping

- `ticket:20260602-flight-learn-card-copy-prompt-schema-variants#ACC-001` supported: `01-variant-matrix.json` records 3 variants and maps each to diagnostic categories from `evidence:20260602-flight-learn-card-copy-failure-diagnostics`.
- `ticket:20260602-flight-learn-card-copy-prompt-schema-variants#ACC-002` supported: `02-variant-summary.json` and `03-variant-results.json` record parse/schema validity, product-validation pass, product-gate-equivalent pass, field coverage, fallback categories, unsafe accepted counts, timeouts, latency, and prompt lengths by variant and case.
- `ticket:20260602-flight-learn-card-copy-prompt-schema-variants#ACC-003` supported with a negative result: unsafe accepted count was not zero for the best variant, so the evidence rejects product integration. Generated evidence/action/mutation/privacy/source-of-truth boundaries were not relaxed.
- `ticket:20260602-flight-learn-card-copy-prompt-schema-variants#ACC-004` supported: `02-variant-summary.json` recommends no-go for same-model product repair from these variants and explains the threshold failure.
- `ticket:20260602-flight-learn-card-copy-prompt-schema-variants#ACC-005` supported by `05-source-side-effect-scan.json`, `10-final-diff-check.txt`, and `12-final-status.txt`; product source fingerprints were unchanged during the run, scoped diff check passed, and writes are limited to allowed ticket/evidence/artifact paths. The broader workspace remains dirty from unrelated prior work.

## What This Shows

- The current timeout problem can be reduced by shortening prompts and lowering output burden.
- Bonsai 4B can produce constrained JSON quickly under shorter schemas, but schema success still does not imply useful card copy.
- Same-model variants that ask for primary comprehension fields still fail current product validation.
- A narrow evidence-summary-only variant can pass many product-equivalent checks, but it is not sufficient for model-enabled comprehension and surfaced one safety-gap candidate.
- The current same-model prompt/schema variants should not proceed to product repair.

## What This Does Not Show

- This does not prove operator comprehension.
- This does not prove release readiness, real-session usefulness, broad Bonsai quality, or classifier readiness.
- This does not prove that a different prompt family, longer runtime envelope, or different local model would fail.
- This does not authorize product source repair, longer timeout defaults, gate relaxation, new downloads, new runtimes, hosted calls, or dogfood corpus/outcome collection.

## Recommendation

Move `ticket:20260602-flight-learn-card-copy-prompt-schema-variants` to review as no-go evidence for the tested same-model variants. Do not unblock `ticket:20260602-flight-learn-card-copy-product-repair` for implementation from this packet. The parent plan should either route back to operator decision for a different authorized local model/runtime or shape a narrower follow-up if evidence-summary-only display help is now considered a separate product goal.
