# Flight Learn Card Copy Failure Diagnostics Evidence

ID: evidence:20260602-flight-learn-card-copy-failure-diagnostics
Type: Evidence Dossier
Status: recorded
Created: 2026-06-02
Updated: 2026-06-02
Observed: 2026-06-02 UTC

## Summary

Executed `ticket:20260602-flight-learn-card-copy-failure-diagnostics` as a bounded evidence/diagnostic run over 8 synthetic/redacted representative `/flight-learn` card-copy cases.

Real local Bonsai 4B Q1_0 ran on loopback-only `llama-server` with the expected checksum. No downloads, installs, hosted calls, non-loopback endpoints, telemetry, custom forks, raw private sessions, raw local paths, secrets, raw prompts, raw model responses, or raw server logs were persisted.

Main result: the current Bonsai all-field card-copy path still produced **0/8 product gate passes**. This diagnostic run observed 6/8 timeouts and 2/8 unsafe-output fallbacks. Only 2/8 responses completed within the current 5000ms product envelope, so field-level taxonomy is useful but incomplete by design.

Top repair targets from the privacy-safe taxonomy:

1. Timeout/resource envelope and all-field burden: 6/8 cases timed out; prompt lengths ranged from 4156 to 6031 chars.
2. Fact/citation robustness: observed output cited unsupported or unknown facts for `whyThisWasFlagged` and `evidenceSummary`.
3. Narrative burden: observed `whatHappened` fields became low-information/duplicate under product validation.
4. Non-negotiable safety: generated-evidence-like wording appeared in one observed unsafe field and must remain fail-closed.

Artifact directory:

```text
.loom/evidence/artifacts/20260602-flight-learn-card-copy-failure-diagnostics/
```

## Artifact Inventory

Key artifacts:

- `run-card-copy-failure-diagnostics.mjs` - artifact-local diagnostic harness using synthetic/redacted cases and current product validation paths from source imports.
- `00-artifact-index.json` - case inventory, artifact names, and non-claims.
- `01-failure-taxonomy.json` - aggregate and per-case/per-field failure taxonomy without raw model text.
- `02-runtime-provenance.json` - runtime/model provenance, checksum, loopback status, and temp-log handling summary.
- `03-diagnostic-run-output.json` - sanitized run summary and top repair targets.
- `04-source-side-effect-scan.json` - source fingerprint before/after scan for the read-only product seams.
- `05-post-run-listener-check.txt` - post-run check showing no listener remained on the run port.
- `06-artifact-privacy-scan.json` - artifact-local privacy scan emitted before the dossier/ticket update.
- `07-final-diff-check.txt` - final scoped `git diff --check` over allowed writes.
- `08-final-privacy-scan.json` - final privacy scan over artifacts, evidence dossier, and ticket.
- `09-final-status.txt` - final scoped status for allowed ticket/evidence/artifact paths.

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

## Runtime And Model Provenance

From `02-runtime-provenance.json`:

- Runtime path: `/opt/homebrew/bin/llama-server`.
- Runtime version: `9360 (6b4e4bd58)`.
- Model path: `~/.cache/pi-flight-recorder/bonsai/Bonsai-4B-Q1_0.gguf`.
- Model SHA256 matched expected Bonsai 4B Q1_0 checksum: `4524b3f997f0f06444e568d1f26e2efd69effa3218c7ad3047432fb171e42168`.
- Base URL was loopback-only.
- No hosted provider, non-loopback endpoint, automatic download/install, telemetry, custom runtime fork, or new model family was used.
- Raw `llama-server` logs were temporary and deleted after byte-count summary; raw logs were not persisted in Loom.

`05-post-run-listener-check.txt` records:

```text
checked tcp port 52618
no listener output
```

## Diagnostic Metrics

From `01-failure-taxonomy.json`:

```json
{
  "totalCases": 8,
  "responseObservedCount": 2,
  "parseValidCount": 2,
  "fullValidationPassCount": 0,
  "productGatePassCount": 0,
  "productFallbackCount": 8,
  "fallbackReasons": {
    "timeout": 6,
    "unsafe-output": 2
  },
  "validationIssueCategories": {
    "timeout-resource-envelope": 6,
    "unsafe-output": 2
  },
  "displayStates": {
    "deterministic": 8
  },
  "latencyMs": {
    "min": 4041,
    "max": 5009,
    "avg": 4799
  },
  "promptLengthChars": {
    "min": 4156,
    "max": 6031,
    "avg": 5207
  }
}
```

Field-level observations from the two completed responses:

- `headline` validated in both observed responses.
- `expectedBehavior` validated in both observed responses.
- `whatHappened` failed as `low-information-or-empty` in both observed responses; the diagnostic category indicates the field did not improve on deterministic text enough to be useful under current validation.
- `whyItMatters` failed as `unsafe-output` in both observed responses. One case carried a `generated-evidence-claim-like` signal; the other had product unsafe classification without a persisted text excerpt.
- `whyThisWasFlagged` validated in one observed response and failed as `unsupported-facts` in one observed response.
- `evidenceSummary` validated in one observed response and failed with an unknown fact ID in one observed response.

The taxonomy intentionally persists categories, counts, field names, fact-kind summaries, and validator issue categories only. Raw model responses were inspected only in memory and were not persisted.

## Repairable Versus Non-Negotiable Categories

Repairable or experiment-worthy categories:

- **Timeout/resource envelope**: 6/8 cases timed out at the current 5000ms product envelope. Prompt lengths averaged 5207 chars and the schema asks for all six card-copy fields. The next variant ticket should test shorter prompts and lower output burden before changing gates.
- **Citation robustness**: one observed `whyThisWasFlagged` cited a fact kind unsupported for that field, and one observed `evidenceSummary` cited an unknown fact ID. The next variant ticket should test clearer fact-ID/citation instructions and omission rules.
- **Narrative burden**: observed `whatHappened` outputs failed as low-information/empty. The next variant ticket should test whether fewer required narrative sentences, clearer distinctness instructions, or omission rules reduce fallback without weakening safety.
- **Possible validator-overreach candidate**: one unsafe-output classification lacked a persisted text signal category. Because raw output was intentionally not persisted, this remains a candidate for closer artifact-local diagnosis rather than a reason to weaken validators.

Non-negotiable categories:

- **Generated-evidence-like wording**: one observed unsafe field carried a generated-evidence signal. Model text must not create, imply, invent, or replace evidence refs. This must remain fail-closed.
- **Unknown fact IDs**: evidence summaries must cite known bounded facts or be omitted. Unknown fact IDs must remain rejected.
- **Unsafe/action/mutation/privacy boundaries**: no action/mutation/privacy accepted outputs were observed, and those gates remain non-negotiable if future variants encounter them.

## Privacy And Boundary Notes

- Corpus cases were synthetic/redacted.
- Product source was read-only; source fingerprints for `src/flight-learn-local-diagnosis-model.ts` and `src/flight-learn-llama-cpp-adapter.ts` were unchanged before/after the diagnostic harness.
- The harness used current product validation paths and did not modify product source, tests, docs, package files, config, specs, plans, research, audit, or unrelated tickets.
- Raw prompts, raw model responses, raw server logs, raw private sessions, local paths, secrets, transcripts, and stack traces were not persisted.
- Model output did not route, rank, store truth, create/apply artifacts, edit source/docs/Loom/rules/skills/prompts, or feed classifier labels.
- This evidence does not authorize dogfood corpus/outcome collection or operator comprehension validation.

## Validation Commands

| Artifact | Command | Result |
| --- | --- | --- |
| `run-card-copy-failure-diagnostics.mjs` syntax | `node --check .loom/evidence/artifacts/20260602-flight-learn-card-copy-failure-diagnostics/run-card-copy-failure-diagnostics.mjs` | passed; no output |
| `03-diagnostic-run-output.json` | `node --import tsx .loom/evidence/artifacts/20260602-flight-learn-card-copy-failure-diagnostics/run-card-copy-failure-diagnostics.mjs` | completed; real Bonsai runtime ran, source side-effect scan passed, listener check passed, artifact privacy scan passed |
| `04-source-side-effect-scan.json` | source fingerprint before/after comparison for `src/flight-learn-local-diagnosis-model.ts` and `src/flight-learn-llama-cpp-adapter.ts` | passed; no source changes |
| `05-post-run-listener-check.txt` | `lsof -nP -iTCP:<run-port> -sTCP:LISTEN` | no listener output |
| `07-final-diff-check.txt` | `git diff --check -- .loom/evidence/20260602-flight-learn-card-copy-failure-diagnostics.md .loom/tickets/20260602-flight-learn-card-copy-failure-diagnostics.md .loom/evidence/artifacts/20260602-flight-learn-card-copy-failure-diagnostics` | passed; no output |
| `08-final-privacy-scan.json` | privacy scan over artifacts, evidence dossier, and ticket | passed; 13 files scanned, 0 findings |

## Acceptance Mapping

- `ticket:20260602-flight-learn-card-copy-failure-diagnostics#ACC-001` supported: `00-artifact-index.json` records the synthetic/redacted case coverage; `02-runtime-provenance.json` records that real Bonsai 4B ran locally with checksum match and loopback-only server.
- `ticket:20260602-flight-learn-card-copy-failure-diagnostics#ACC-002` supported: `01-failure-taxonomy.json` records per-case and per-field categories without raw private data or unredacted model output.
- `ticket:20260602-flight-learn-card-copy-failure-diagnostics#ACC-003` supported: this dossier and `01-failure-taxonomy.json` separate repairable timeout/citation/narrative-burden categories from generated-evidence and unknown-fact boundaries that must remain fail-closed.
- `ticket:20260602-flight-learn-card-copy-failure-diagnostics#ACC-004` supported by `04-source-side-effect-scan.json` and `07-final-diff-check.txt`; product source fingerprints were unchanged and scoped diff check passed.
- `ticket:20260602-flight-learn-card-copy-failure-diagnostics#ACC-005` supported by `06-artifact-privacy-scan.json` and `08-final-privacy-scan.json`; final privacy scan covered artifacts, dossier, and ticket with 0 findings.

## What This Shows

- The current Bonsai 4B all-field card-copy path remains unsuitable for model-enabled comprehension validation: 0/8 product gate passes in this run.
- The dominant observed failure is timeout/resource envelope under the current prompt/schema burden.
- Completed responses can satisfy JSON shape but still fail product gates through unsafe/non-display wording, low-information narrative, unsupported fact citations, or unknown fact IDs.
- The next same-model variant work should test shorter/lower-burden prompt/schema approaches and clearer omission/citation instructions while keeping non-negotiable gates intact.

## What This Does Not Show

- This does not prove operator comprehension.
- This does not prove broad Bonsai model quality or real-session usefulness.
- This does not prove that a prompt/schema variant will pass.
- This does not authorize a longer timeout, different model, new runtime, download, install, hosted call, or gate relaxation.
- This does not authorize dogfood corpus/outcome collection or classifier-readiness work.

## Recommendation

Move `ticket:20260602-flight-learn-card-copy-failure-diagnostics` to review pending audit. The next child ticket, `ticket:20260602-flight-learn-card-copy-prompt-schema-variants`, can use this taxonomy to test same-model variants that reduce prompt/output burden and improve citation/omission instructions, while preserving generated-evidence, expected-behavior, privacy, action/mutation, source-of-truth, and route/storage gates.
