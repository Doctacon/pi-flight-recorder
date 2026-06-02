# Flight Learn Card Copy Validator Contract Repair Review

ID: audit:20260602-flight-learn-card-copy-validator-contract-repair-review
Type: Audit
Status: recorded
Created: 2026-06-02
Updated: 2026-06-02
Audited: 2026-06-02 UTC
Target: ticket:20260602-flight-learn-card-copy-validator-contract-repair

## Summary

Audited `ticket:20260602-flight-learn-card-copy-validator-contract-repair`, its evidence dossier/artifacts, and the scoped source changes in `src/flight-learn-local-diagnosis-model.ts` and `src/flight-learn-local-diagnosis-model.test.ts`.

Verdict: `clear`.

The ticket is supported for closure as a bounded prompt/schema/validator contract repair. The source now permits safe model-authored core display copy to render when at least one core field passes, while preserving deterministic fallback for hard unsafe/schema/source-of-truth failures. The evidence correctly does not claim local/open runtime replay, hosted product integration, operator comprehension validation, downloads, dependency changes, renderer redesign, storage changes, or classifier/routing automation.

This audit supports unblocking `ticket:20260602-flight-learn-card-copy-repaired-local-replay` only. It does **not** unblock operator comprehension validation or corpus/outcome collection.

## Target

Target under review:

- `ticket:20260602-flight-learn-card-copy-validator-contract-repair`
- `evidence:20260602-flight-learn-card-copy-validator-contract-repair`
- Artifacts under `.loom/evidence/artifacts/20260602-flight-learn-card-copy-validator-contract-repair/`
- Source files:
  - `src/flight-learn-local-diagnosis-model.ts`
  - `src/flight-learn-local-diagnosis-model.test.ts`

The ticket is in `review` and claims a narrow product validator/prompt repair: hard card-level safety/source-of-truth gates remain fail-closed; non-safety optional/field support failures can be omitted when safe core copy remains; support validation rejects concrete unsupported facts without brittle token-whitelist behavior.

## Audit Scope And Lenses

Lenses used:

- ACC-001 through ACC-005 support;
- spec alignment with `REQ-049` through `REQ-054` and `SCN-016` through `SCN-018`;
- hard safety/source-of-truth gate preservation;
- field-local omission semantics and partial-display clarity;
- safe paraphrase vs concrete unsupported-fact behavior;
- expected-behavior source-of-truth handling;
- evidence/source-of-truth boundary: model text must not replace refs, route, classify, store, create artifacts, or mutate source/Loom/rules/prompts;
- local-first/product-scope boundary: no hosted product support, downloads, dependency/runtime/provider changes, non-loopback endpoints, renderer redesign, storage migration, or comprehension-validation unblock;
- evidence quality: tests, typecheck/build/full tests, diff check, privacy scan, and non-claims.

Out of scope:

- rerunning hosted/local model evaluations;
- validating operator comprehension;
- closing/editing the ticket/plan/source after audit;
- judging any future real local model output quality.

## Context And Evidence Reviewed

- `.loom/tickets/20260602-flight-learn-card-copy-validator-contract-repair.md` defines the closure claim and scope: hard safety/source-of-truth gates must not be weakened, local/open boundaries and raw-output persistence are out of scope, and audit is required before closure (`.loom/tickets/20260602-flight-learn-card-copy-validator-contract-repair.md:14-16`, `:34-48`, `:67-87`, `:89-98`).
- `.loom/evidence/20260602-flight-learn-card-copy-validator-contract-repair.md` records the implementation summary, changed source seams, validation commands, and explicit non-claims. It states no hosted/local model calls, downloads, dependency/runtime/provider changes, renderer/storage/classifier changes, or operator-validation changes were performed (`.loom/evidence/20260602-flight-learn-card-copy-validator-contract-repair.md:12-16`, `:41-53`, `:70-86`).
- `07-contract-taxonomy.json` records privacy-safe validator semantics: hard card-level failures, field-local omissions, minimum accepted core field, and unsafe precedence without raw model/prompt/private text (`.loom/evidence/artifacts/20260602-flight-learn-card-copy-validator-contract-repair/07-contract-taxonomy.json:4-10`, `:11-44`, `:45-60`).
- `00-artifact-index.json` explicitly records non-claims: no hosted provider call, no local runtime replay, no downloads/dependency/runtime installs/non-loopback endpoint, and no operator-comprehension unblock (`.loom/evidence/artifacts/20260602-flight-learn-card-copy-validator-contract-repair/00-artifact-index.json:15-20`).
- Validation artifacts record focused tests, typecheck, build, full tests, diff check, and privacy scan as passed (`.loom/evidence/20260602-flight-learn-card-copy-validator-contract-repair.md:70-79`). I reran the focused test read-only during audit: `npm test -- src/flight-learn-local-diagnosis-model.test.ts` passed 36/36.
- `plan:20260602-flight-learn-prompt-validator-contract-repair` requires this repair to be followed by local/open replay before comprehension validation can reopen. The gate requires at least five safe real product-gated model-enabled card renders and zero unsafe/privacy accepted outputs (`.loom/plans/20260602-flight-learn-prompt-validator-contract-repair.md:92-105`, `:107-114`, `:124-140`).
- `src/flight-learn-llama-cpp-adapter.ts` already has a constrained schema with only top-level `schemaVersion` required and optional display fields, so the no-adapter-change claim is plausible (`src/flight-learn-llama-cpp-adapter.ts:75-113`).
- Read-only grep found `diagnoseLocalDiagnosisPolishResponse` only in `src/flight-learn-local-diagnosis-model.ts` and its tests, not in adapter/renderer paths.
- Read-only scoped diff-name check showed only `src/flight-learn-local-diagnosis-model.ts` and `src/flight-learn-local-diagnosis-model.test.ts` changed among the relevant product files.

## Source Verification

### Prompt/schema contract

- The prompt now explicitly says the model may return one useful core field, names the core fields, and tells it to omit optional flag/evidence fields unless safely improved (`src/flight-learn-local-diagnosis-model.ts:787-804`).
- The adapter response schema remains compatible with omitted display fields because only `schemaVersion` is required at the top level (`src/flight-learn-llama-cpp-adapter.ts:75-113`). No adapter churn was needed for this repair.

### Product validator flow

- Product validation still parses strict JSON, rejects non-object/extra-key/schema-version failures, scans all allowed display fields, and requires at least one accepted core field before returning model-enabled display copy (`src/flight-learn-local-diagnosis-model.ts:1628-1675`).
- Hard failures are tracked separately from field-local failures. Unsafe failures take precedence after the scan; card-level failures still reject the whole card; field-local failures only permit success when useful core fields remain (`src/flight-learn-local-diagnosis-model.ts:1643-1675`, `:1678-1688`).
- Display integration remains display-only and falls back to deterministic fields for missing/omitted model fields; model text is added only through display-field application with explicit limits text (`src/flight-learn-local-diagnosis-model.ts:998-1039`).

### Safety and source-of-truth gates

- Privacy/prompt/transcript/secret/raw-path/raw-command/non-display detection remains centralized in `containsUnsafeOutput(...)` and related helpers (`src/flight-learn-local-diagnosis-model.ts:1892-1903`).
- Diagnostics classify route/action, mutation, generated-evidence, internal-provenance, prompt/transcript, raw-path, secret, and raw-command failures without exposing raw text (`src/flight-learn-local-diagnosis-model.ts:1580-1594`).
- Unknown fact IDs remain card-level source-of-truth violations for both optional fact-cited fields and `whatHappened` sentence citations (`src/flight-learn-local-diagnosis-model.ts:1751-1760`, `:1814-1823`). Diagnostics mirror that via `isSourceOfTruthRule(...)` (`src/flight-learn-local-diagnosis-model.ts:1307-1315`, `:1412-1416`).
- Generated-evidence/unsafe optional fields still fail closed because fact-cited display validation checks unsafe output before field-local support omission (`src/flight-learn-local-diagnosis-model.ts:1763-1773`).
- Expected behavior remains fact-bound. Unsupported/missing/negation-mismatched expected behavior returns a field-local failure, so it can be omitted only when safe core copy remains; if no useful core remains, validation still fails (`src/flight-learn-local-diagnosis-model.ts:1700-1708`, `:1711-1725`, `:1670-1675`).

### Support validation and partial display

- Support validation now allows limited safe paraphrase while rejecting unsupported numbers, concrete unsupported tokens, and unsupported concrete mutation claims (`src/flight-learn-local-diagnosis-model.ts:1920-1964`).
- Tests cover safe core rendering while unsupported optional fields are omitted (`src/flight-learn-local-diagnosis-model.test.ts:368-395`), optional hard-unsafe fallback (`src/flight-learn-local-diagnosis-model.test.ts:397-408`), unknown fact-ID fail-closed behavior (`src/flight-learn-local-diagnosis-model.test.ts:410-420`), safe paraphrase vs concrete unsupported fact (`src/flight-learn-local-diagnosis-model.test.ts:422-438`), expected-behavior omission when unsupported but safe core remains (`src/flight-learn-local-diagnosis-model.test.ts:1211-1237`), strict expected-behavior support when no safe core remains (`src/flight-learn-local-diagnosis-model.test.ts:1239-1264`), optional evidence/flag support claims (`src/flight-learn-local-diagnosis-model.test.ts:1266-1308`), and modal action phrasing rejection (`src/flight-learn-local-diagnosis-model.test.ts:1309-1341`).
- Tests also cover diagnostic privacy and product-equivalent behavior (`src/flight-learn-local-diagnosis-model.test.ts:147-242`).

## Findings

None - no material findings within audited scope.

## ACC Support

- ACC-001 is supported. The product validator distinguishes card-level failures from field-local omissions and requires accepted core copy before rendering (`src/flight-learn-local-diagnosis-model.ts:1628-1675`). Tests prove safe core copy can render while unsupported optional fields are omitted, and unsafe optional content still falls back (`src/flight-learn-local-diagnosis-model.test.ts:368-408`).
- ACC-002 is supported. `hasUnsupportedConcreteFacts(...)` rejects unsupported numbers/concrete tokens/mutation claims while allowing limited paraphrase (`src/flight-learn-local-diagnosis-model.ts:1956-1964`). Tests cover safe paraphrase and concrete unsupported hallucination (`src/flight-learn-local-diagnosis-model.test.ts:422-438`).
- ACC-003 is supported. The prompt allows one useful core field and says optional flag/evidence fields should be omitted unless safely improved, while preserving expected-behavior and evidence boundaries (`src/flight-learn-local-diagnosis-model.ts:790-801`). Adapter schema compatibility supports the no-adapter-change claim (`src/flight-learn-llama-cpp-adapter.ts:75-113`).
- ACC-004 is supported. Evidence records focused tests, typecheck, build, full tests, scoped diff check, and privacy scan as passed (`.loom/evidence/20260602-flight-learn-card-copy-validator-contract-repair.md:70-79`). Audit reran the focused tests successfully.
- ACC-005 is supported by the evidence dossier, artifacts, and this audit.

## Safety / Source-Of-Truth Gate Support

Supported.

- Hard unsafe categories remain card-level fail-closed: unsafe detection is still applied before rendering accepted field values, unsafe failures take precedence, and tests include route/action/mutation/privacy/generated-evidence cases (`src/flight-learn-local-diagnosis-model.ts:1651-1675`, `:1763-1773`, `:1892-1903`; `src/flight-learn-local-diagnosis-model.test.ts:147-184`, `:397-408`, `:817-940`, `:1140-1209`, `:1266-1341`).
- Source-of-truth fact IDs remain hard gates: unknown fact IDs fail closed even when core copy is otherwise safe (`src/flight-learn-local-diagnosis-model.ts:1751-1760`, `:1814-1823`; `src/flight-learn-local-diagnosis-model.test.ts:410-420`).
- Expected behavior remains fact-bound and does not invent intended behavior: unsupported expected copy is omitted only when another safe core field passes, and expected-only unsupported output still falls back (`src/flight-learn-local-diagnosis-model.ts:1711-1725`, `:1670-1675`; `src/flight-learn-local-diagnosis-model.test.ts:1211-1264`).
- Evidence remains deterministic/source material: prompt and validation keep `evidenceSummary` display-only and reject generated-evidence claims (`src/flight-learn-local-diagnosis-model.ts:795-801`, `:1763-1773`; `src/flight-learn-local-diagnosis-model.test.ts:397-408`, `:1266-1308`).

## Replay Unblocking

Supported for the next replay ticket only.

- This audit supports closing `ticket:20260602-flight-learn-card-copy-validator-contract-repair` and unblocking `ticket:20260602-flight-learn-card-copy-repaired-local-replay`.
- This audit does not support opening/closing operator comprehension validation. The governing plan requires repaired local/open replay evidence before comprehension validation can resume (`.loom/plans/20260602-flight-learn-prompt-validator-contract-repair.md:92-114`).
- The next replay should remain local/open, explicitly authorized, loopback-only, and use no new downloads/runtime changes without fresh operator authorization.

## Verdict

Verdict: `clear`.

Closure recommendation:

1. Close `ticket:20260602-flight-learn-card-copy-validator-contract-repair` after recording this audit in the ticket journal/current state.
2. Unblock `ticket:20260602-flight-learn-card-copy-repaired-local-replay` to exercise the repaired product path with explicitly authorized local/open runtime(s).
3. Keep `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation`, dogfood corpus/outcome collection, and classifier automation blocked until the replay gate passes.

No corrective source changes are required by this audit.

## Residual Risk

- The concrete-fact support check is heuristic. It is materially better than the prior token-whitelist behavior for this scope, but local replay must watch for both false accepts and false rejects.
- The minimum acceptance threshold is one core field. That is aligned with the ticket/prompt repair, but real replay should inspect whether one-field model-enabled cards are actually useful enough for comprehension work.
- Evidence is fake-provider/unit contract evidence. It does not prove real local model behavior, latency, unsafe-output distribution, or operator comprehension.
- Diagnostics use hashes and lengths. That is privacy-safe under the spec, but future replay evidence must continue to avoid raw model output, raw prompts, private paths, transcripts, secrets, stack traces, and provider logs.
- Current tests cover representative hard unsafe/source-of-truth classes, but no finite fixture suite can exhaustively prove semantic grounding. The planned local/open replay and later operator notes remain necessary.

## Next Move

Run `ticket:20260602-flight-learn-card-copy-repaired-local-replay` next, starting with already authorized/cached local/open candidates if available, especially the prior SmolLM2 1.7B Q4_K_M lead. Do not add new model downloads, hosted calls, dependency/runtime installs, telemetry, non-loopback endpoints, or product defaults without fresh operator authorization.

## Related Records

- `ticket:20260602-flight-learn-card-copy-validator-contract-repair`
- `evidence:20260602-flight-learn-card-copy-validator-contract-repair`
- `plan:20260602-flight-learn-prompt-validator-contract-repair`
- `spec:flight-learn-inbox-ux`
- `ticket:20260602-flight-learn-card-copy-repaired-local-replay`
- `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation`
