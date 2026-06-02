# Flight Learn LLM Card Copy Runtime Replay Evidence

ID: evidence:20260531-flight-learn-llm-card-copy-runtime-replay
Type: Evidence Dossier
Status: recorded
Created: 2026-05-31
Updated: 2026-05-31
Observed: 2026-05-31 UTC

## Summary

Executed `ticket:20260531-flight-learn-llm-card-copy-runtime-replay` as a bounded evidence run over 8 synthetic/redacted representative `/flight-learn` card-copy cases.

This run produced:

- fake-provider replay metrics and render artifacts proving the repaired product card path can render gated all-field local LLM card copy and fallback states;
- real local Bonsai 4B Q1_0 / `llama-server` replay metrics through the product adapter path;
- representative 72- and 92-column render artifacts for fake-provider and real-runtime product results;
- width, hidden-internals, listener, diff, and privacy checks.

Real runtime result: Bonsai 4B Q1_0 ran locally on loopback, but produced **0/8 product gate passes** for the repaired all-field card-copy path. The real run had 5/8 parse/schema-valid responses, 5 unsafe-output fallbacks, 3 timeouts, and 8/8 deterministic product-level fallbacks. This is negative local-runtime usefulness evidence for the current Bonsai 4B path, not an operator-comprehension success.

Artifact directory:

```text
.loom/evidence/artifacts/20260531-flight-learn-llm-card-copy-runtime-replay/
```

## Artifact Inventory

Key artifacts:

- `run-card-copy-runtime-replay.mjs` - artifact-local replay/render harness using synthetic/redacted cases and current built product modules.
- `00-artifact-index.json` - corpus coverage, render files, runtime status, and check artifacts.
- `01-fake-replay-summary.json` - fake-provider replay metrics.
- `02-real-runtime-summary.json` - real Bonsai 4B replay metrics.
- `03-runtime-provenance.json` - local runtime/model provenance and temp-log handling summary.
- `04-real-runtime-status.json` - real runtime run status.
- `05-render-line-widths.json` - width check for all fake and real render artifacts.
- `06-render-contract-check.json` - default-hidden-internals check for all fake and real default renders.
- `07-artifact-privacy-scan.json` - privacy scan emitted by the harness before final ticket/evidence writes.
- `08-replay-run-output.json` - sanitized replay command summary.
- `09-post-run-listener-check.txt` - post-run check showing no listener remained on the run port.
- `fake-case-*-72.txt` / `fake-case-*-92.txt` - fake-provider product render pack for 8 cases.
- `real-case-*-72.txt` / `real-case-*-92.txt` - real-runtime product render pack for 8 cases.

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

## Fake-provider Replay Summary

From `01-fake-replay-summary.json`:

```json
{
  "totalCases": 8,
  "parseValidCount": 8,
  "schemaValidCount": 8,
  "productGatePassCount": 3,
  "productFallbackCount": 5,
  "unsafeRejectionCount": 4,
  "fallbackReasons": {
    "unsafe-output": 4,
    "unsupported-facts": 1
  },
  "displayStates": {
    "validated": 3,
    "deterministic": 5
  },
  "fieldCoverage": {
    "headline": 7,
    "whatHappened": 5,
    "whyItMatters": 6,
    "expectedBehavior": 6,
    "whyThisWasFlagged": 7,
    "evidenceSummary": 7
  },
  "viewFieldCoverage": {
    "headline": 8,
    "whatHappened": 8,
    "whyItMatters": 8,
    "expectedBehavior": 6,
    "whyThisWasFlagged": 3,
    "evidenceSummary": 3
  }
}
```

Interpretation:

- Fake-provider replay proves the product card path can render all-field local card-copy fields when hard gates pass.
- Fake-provider replay also exercised deterministic fallback for unsafe generated-evidence wording, unsupported invented expected behavior, and overly action/provenance-adjacent wording.
- Some intentionally/accidentally unsafe fake outputs were rejected by the hard gates, which is useful boundary evidence but not a fake-provider quality target.

Representative fake renders exist for every case at both 72 and 92 columns.

## Real Runtime Replay Summary

Real runtime ran locally.

Runtime/model provenance from `03-runtime-provenance.json`:

- Runtime path: `/opt/homebrew/bin/llama-server`.
- Runtime version: `9360 (6b4e4bd58)`.
- Model path: `~/.cache/pi-flight-recorder/bonsai/Bonsai-4B-Q1_0.gguf`.
- Model SHA256 matched the previously recorded Bonsai 4B Q1_0 checksum: `4524b3f997f0f06444e568d1f26e2efd69effa3218c7ad3047432fb171e42168`.
- Base URL was loopback-only.
- No hosted provider, non-loopback endpoint, download, install, telemetry, new model family, or custom runtime fork was used.
- Raw `llama-server` logs were temporary and deleted after byte-count summary; raw server logs were not persisted in Loom.

From `02-real-runtime-summary.json`:

```json
{
  "totalCases": 8,
  "parseValidCount": 5,
  "schemaValidCount": 5,
  "productGatePassCount": 0,
  "productFallbackCount": 8,
  "unsafeRejectionCount": 5,
  "fallbackReasons": {
    "timeout": 3,
    "unsafe-output": 5
  },
  "displayStates": {
    "deterministic": 8
  },
  "fieldCoverage": {
    "headline": 5,
    "whatHappened": 5,
    "whyItMatters": 5,
    "expectedBehavior": 5,
    "whyThisWasFlagged": 5,
    "evidenceSummary": 5
  },
  "viewFieldCoverage": {
    "headline": 8,
    "whatHappened": 8,
    "whyItMatters": 8,
    "expectedBehavior": 6,
    "whyThisWasFlagged": 0,
    "evidenceSummary": 0
  },
  "latencyMs": {
    "min": 3227,
    "max": 5006,
    "avg": 4472
  }
}
```

Interpretation:

- The real runtime could often satisfy JSON/schema shape under constrained decoding: 5/8 parse-valid and schema-valid responses.
- The product gates rejected every real response or timed out before a response, producing 8/8 deterministic product fallbacks.
- The real runtime did not produce usable all-field local LLM card copy under the current prompt/schema/gates.
- This is negative evidence for proceeding directly to operator comprehension validation with the current Bonsai 4B card-copy path.

Representative real product renders exist for every case at both 72 and 92 columns. Because every real case fell back, those real render artifacts show deterministic fallback cards, not successful real-model card-copy cards.

## Render Checks

`05-render-line-widths.json` reports:

```json
{ "pass": true }
```

All fake and real render artifacts stayed within their 72- or 92-column width limits.

`06-render-contract-check.json` reports:

```json
{ "pass": true, "forbiddenDefaultFindings": [] }
```

Default fake and real renders did not expose `Raw clue`, `Why suggested`, cluster IDs, raw home paths, or Pi session paths in the primary card. Evidence/provenance expansion was not the focus of this runtime replay; expanded behavior was covered by `evidence:20260531-flight-learn-llm-card-copy-rendering` and its audit.

## Runtime Cleanup

`09-post-run-listener-check.txt` shows no listener remained on the runtime replay port after the run. The harness stops the server in `finally`, and raw temp server logs were deleted after summarizing byte counts.

## Privacy And Boundary Notes

- Corpus cases were synthetic/redacted.
- No raw private Pi sessions, real local paths, secrets, prompts, transcripts, stack traces, raw server logs, or unredacted model output were persisted in Loom.
- Model inputs were bounded fact packets produced by the product path from synthetic deltas and signals.
- Real server was bound to loopback only.
- No model/runtime download or install was performed.
- No product source, tests, package files, docs, specs, or plans were edited by this evidence ticket.
- Model text did not route, rank, store truth, create/apply artifacts, edit source/docs/Loom/rules/skills/prompts, or feed classifier labels.

## Validation Commands

| Artifact | Command | Result |
| --- | --- | --- |
| `08-replay-run-output.json` | `node .loom/evidence/artifacts/20260531-flight-learn-llm-card-copy-runtime-replay/run-card-copy-runtime-replay.mjs` | completed; fake replay ran, real Bonsai runtime ran, width/hidden-internals/privacy checks passed |
| `09-post-run-listener-check.txt` | `lsof -nP -iTCP:<run-port> -sTCP:LISTEN` | no listener output |
| `10-diff-check.txt` | `git diff --check -- .loom/evidence/20260531-flight-learn-llm-card-copy-runtime-replay.md .loom/tickets/20260531-flight-learn-llm-card-copy-runtime-replay.md .loom/evidence/artifacts/20260531-flight-learn-llm-card-copy-runtime-replay` | passed; no output |
| `11-final-privacy-scan.json` | privacy scan over artifacts, evidence dossier, and ticket | passed; 47 files scanned, 0 findings |

## Acceptance Mapping

- `ACC-001` supported: `00-artifact-index.json` records 8 synthetic/redacted representative cases covering the requested shapes without raw private content.
- `ACC-002` supported: `01-fake-replay-summary.json` and `02-real-runtime-summary.json` record parse-valid, schema-valid, product-gate pass, field coverage, fallback reasons, unsafe rejections, and latency for real runtime.
- `ACC-003` supported: render artifacts include fake-provider model-enabled/fallback cards and real-runtime product cards at 72 and 92 columns using the repaired renderer.
- `ACC-004` supported: real runtime status is explicit and honest. Bonsai 4B Q1_0 ran locally with provenance and produced 0/8 product gate passes.
- `ACC-005` supported: this dossier states that replay does not advance dogfood/corpus collection or prove operator comprehension.

## What This Shows

- The repaired renderer and contract can produce privacy-safe synthetic all-field card renders when fake-provider output passes hard gates.
- The current Bonsai 4B Q1_0 local runtime did not produce usable all-field card-copy output under the current product adapter path and gates.
- Deterministic fallback remained safe and non-dead-ending for rejected/timeout real-runtime cases.

## What This Does Not Show

- This does not prove operator comprehension.
- This does not prove real-session usefulness, release readiness, classifier readiness, broad Bonsai/local-model quality, or accepted narrative quality.
- This does not authorize dogfood corpus/outcome collection.
- This does not authorize weakening privacy/safety gates to get more model passes.

## Recommendation

Move `ticket:20260531-flight-learn-llm-card-copy-runtime-replay` to review and request audit. The audit should challenge sample representativeness, privacy, metric interpretation, and whether the negative real-runtime result should trigger replanning before `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` starts.
