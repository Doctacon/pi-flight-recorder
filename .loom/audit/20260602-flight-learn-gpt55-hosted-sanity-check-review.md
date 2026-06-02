# Flight Learn GPT-5.5 Hosted Sanity Check Review

ID: audit:20260602-flight-learn-gpt55-hosted-sanity-check-review
Type: Audit
Status: recorded
Created: 2026-06-02
Updated: 2026-06-02
Audited: 2026-06-02 UTC
Target: ticket:20260602-flight-learn-gpt55-hosted-sanity-check

## Summary

Audited `ticket:20260602-flight-learn-gpt55-hosted-sanity-check`, its evidence dossier, and the hosted sanity-check artifacts under `.loom/evidence/artifacts/20260602-flight-learn-gpt55-hosted-sanity-check/`.

Verdict: `clear` for closing the ticket as **diagnostic mixed-failure evidence**. The artifacts support that `openai-codex/gpt-5.5` was available through the already-authenticated Pi provider path, current-product 5-second mode timed out 8/8, relaxed-validator mode produced 8/8 parse/schema-compatible responses, and the current product validator rejected all 8 relaxed outputs. The evidence is strong enough to conclude the current prompt/validator/gate process is implicated; it is not strong enough to identify exact offending model text or exact validator regex/token failure per rejected field because raw hosted text was intentionally omitted.

No material corrective findings were found. Downstream `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` correctly remains blocked.

## Target

Target under review:

- `ticket:20260602-flight-learn-gpt55-hosted-sanity-check`
- `evidence:20260602-flight-learn-gpt55-hosted-sanity-check`
- Artifacts under `.loom/evidence/artifacts/20260602-flight-learn-gpt55-hosted-sanity-check/`

The ticket is in `review` and asks whether hosted frontier-model evidence can diagnose whether the current `/flight-learn` model-gating process is itself broken or misaligned, without changing local-first product posture or unblocking local model comprehension validation solely from a hosted result.

## Audit Scope And Lenses

Lenses used:

- `ACC-001` through `ACC-005` support;
- hosted authorization and scope: whether `gpt-5.5` was actually available through `openai-codex`, no credential values were exposed, and no auth/install changes were required;
- metric honesty: whether current-product 5-second transport timeouts are separated from relaxed-validator semantic/validator failures;
- process diagnosis: whether the evidence supports a current prompt/validator/gate issue without overclaiming that GPT-5.5 is bad or local models are impossible;
- privacy: whether raw prompts, raw hosted outputs, provider logs, private sessions, local paths, stack traces, secrets, or credentials were persisted;
- side effects: whether product source changed, Pi session files were created, or downstream validation was incorrectly unblocked;
- evidence quality: whether omitting raw model text is acceptable for this diagnostic closure and what it prevents future claims from saying.

Out of scope:

- rerunning hosted calls;
- inspecting raw hosted model text or raw prompt files, because the ticket intentionally omits them;
- product source changes, validator fixes, prompt/schema repair, or hosted-provider product integration;
- operator comprehension validation, dogfood corpus collection, classifier readiness, or release-readiness claims;
- deciding whether OpenAI-hosted inference should ever be product-supported.

## Context And Evidence Reviewed

- `.loom/tickets/20260602-flight-learn-gpt55-hosted-sanity-check.md` - scope, stop conditions, acceptance, current state, and journal. The ticket explicitly authorizes the hosted sanity check while limiting data to synthetic/redacted cases, disabling tools/extensions/skills/context/session for Pi calls, excluding product integration/source changes, and forbidding raw prompt/output/credential/private-data persistence (`.loom/tickets/20260602-flight-learn-gpt55-hosted-sanity-check.md:34-50`). Acceptance requires separate current-product 5-second and relaxed-validator measurements, bounded process diagnosis, and privacy/side-effect checks (`.loom/tickets/20260602-flight-learn-gpt55-hosted-sanity-check.md:63-81`).
- `.loom/evidence/20260602-flight-learn-gpt55-hosted-sanity-check.md` - evidence dossier. It records the key claim, setup, two-mode metrics, process diagnosis, checks, non-claims, and recommended follow-up (`.loom/evidence/20260602-flight-learn-gpt55-hosted-sanity-check.md:15-25`, `:29-58`, `:62-71`, `:96-106`).
- `00-artifact-index.json` - inspected corpus coverage, provider/model, artifact map, render list, checks, process diagnosis, gate disposition, and raw prompt/output omission policy. It records the same 8 synthetic/redacted cases and the `openai-codex` / `gpt-5.5` provider/model pair.
- `01-availability-and-probe.json` - inspected availability/probe evidence. It records `requiredProvider: "openai-codex"`, `requestedModel: "gpt-5.5"`, `modelAvailable: true`, matched row `openai-codex  gpt-5.5`, a successful no-sensitive-data probe, no timeout, temp prompt deletion, and no raw prompt/output persistence (`.loom/evidence/artifacts/20260602-flight-learn-gpt55-hosted-sanity-check/01-availability-and-probe.json:3-29`).
- `02-run-summary.json` - inspected aggregate run facts. It records hosted provider use, no credential value persistence, synthetic/redacted data policy, no product source change, no raw prompts/model outputs/provider logs persisted, current-product 5-second timeout metrics, relaxed-validator parse/schema/fallback metrics, mixed process diagnosis, downstream blocked disposition, session/source/width/hidden-internals checks, and non-claims (`.loom/evidence/artifacts/20260602-flight-learn-gpt55-hosted-sanity-check/02-run-summary.json:4-38`, `:39-75`).
- `mode-current-product-5s-summary.json` - inspected current-product 5-second metrics. It records 8 total cases, 0 parse/schema/product-gate/safe-product-gate passes, 8 timeouts, 8 deterministic fallbacks, avg latency 5003ms, and a gate rule requiring at least 5 safe product-gated renders with zero unsafe accepted outputs (`.loom/evidence/artifacts/20260602-flight-learn-gpt55-hosted-sanity-check/mode-current-product-5s-summary.json:3-53`). Per-case entries show timeout fallback and aborted provider status rather than semantic output failures (`mode-current-product-5s-summary.json:64-90`).
- `mode-relaxed-validator-summary.json` - inspected relaxed-validator metrics. It records 8/8 parse-valid, 8/8 schema-compatible, 0/8 product-gated, 0/8 safe product-gated, 5 unsafe rejections, 0 unsafe accepted, 0 timeouts, fallback reasons `unsupported-facts: 3` and `unsafe-output: 5`, and full field presence for the main card-copy fields except expected/evidence on some cases (`.loom/evidence/artifacts/20260602-flight-learn-gpt55-hosted-sanity-check/mode-relaxed-validator-summary.json:3-52`). Per-case entries record top-level keys, raw response length/hash only, provider success, stdout/stderr byte counts, temp prompt deletion, and no temp prompt path persistence (`mode-relaxed-validator-summary.json:63-110`).
- `03-render-line-widths.json` and representative renders (`current-product-5s-case-01-repeated-workflow-72.txt`, `relaxed-validator-case-03-stale-edit-72.txt`) - inspected width-safe deterministic fallback rendering and visible route/evidence actions. Representative fallback cards disclose timeout or unsafe wording and keep `Problem`, `What happened?`, `Why it matters`, `Expected`, collapsed `Evidence`, and follow-up choices visible.
- `04-render-contract-check.json` - inspected default hidden-internals check; pass with no findings (`.loom/evidence/artifacts/20260602-flight-learn-gpt55-hosted-sanity-check/04-render-contract-check.json:1-4`).
- `05-artifact-privacy-scan.json` and `11-final-privacy-scan.json` - inspected privacy scans; both pass with zero findings (`.loom/evidence/artifacts/20260602-flight-learn-gpt55-hosted-sanity-check/05-artifact-privacy-scan.json:1-6`, `.loom/evidence/artifacts/20260602-flight-learn-gpt55-hosted-sanity-check/11-final-privacy-scan.json:1-6`). A separate read-only grep-style scan over the ticket/evidence/artifacts found no private home path, Pi session-storage path, private key, bearer token, secret assignment, or full-prompt marker outside allowed harness/policy-label contexts.
- `06-source-side-effect-scan.json` - inspected source fingerprints; pass with unchanged `src/flight-learn-local-diagnosis-model.ts` and `src/flight-learn-inbox.ts` hashes and no changed sources (`.loom/evidence/artifacts/20260602-flight-learn-gpt55-hosted-sanity-check/06-source-side-effect-scan.json:1-12`).
- `07-session-side-effect-check.json` - inspected Pi session side-effect check; pass with same file count and newest mtime before/after and no file names persisted (`.loom/evidence/artifacts/20260602-flight-learn-gpt55-hosted-sanity-check/07-session-side-effect-check.json:1-18`).
- `08-git-diff-check.txt` - inspected as an empty file, consistent with `git diff --check` having no output.
- `run-gpt55-hosted-sanity-check.mjs` - inspected harness shape. It sets provider/model to `openai-codex` / `gpt-5.5`, product timeout to 5000ms, relaxed timeout to 60000ms, and Pi call arguments with `--no-tools`, `--no-extensions`, `--no-skills`, `--no-context-files`, `--no-session`, and empty system prompt (`.loom/evidence/artifacts/20260602-flight-learn-gpt55-hosted-sanity-check/run-gpt55-hosted-sanity-check.mjs:18-35`). It writes temporary prompt files with mode `0600`, deletes them in `finally`, and records only sanitized provider status plus bytes/lengths/hashes (`run-gpt55-hosted-sanity-check.mjs:380-449`). It implements current-product mode via `buildFlightLearnDiagnosisViewWithLocalPolish` using the 5000ms product timeout and relaxed-validator mode by calling `buildLocalDiagnosisPrompt` then re-validating the returned JSON through a cached provider (`run-gpt55-hosted-sanity-check.mjs:520-585`).
- `src/flight-learn-local-diagnosis-model.ts` - inspected source seams. Product timeout is capped at 5000ms (`src/flight-learn-local-diagnosis-model.ts:231-232`, `:375-377`). The current validator checks top-level response keys/schema, field string/object shapes, expected-behavior support, fact-cited display fields, unsafe/non-display content, what-happened citations, unsupported concrete mutation claims, and unsupported token facts (`src/flight-learn-local-diagnosis-model.ts:1118-1150`, `:1161-1173`, `:1176-1238`, `:1241-1323`, `:1357-1363`, `:1411-1418`). The forbidden display patterns are intentionally broad and include route/action/mutation/provenance/internal-field/generated-evidence terms (`src/flight-learn-local-diagnosis-model.ts:318-332`), which supports treating 8/8 relaxed rejections as a prompt/validator alignment signal rather than pure hosted-model incapability.
- `src/flight-learn-inbox.ts` - inspected focused-card status and evidence rendering seams. Fallback status copy distinguishes rejected/unavailable local model states and deterministic wording (`src/flight-learn-inbox.ts:181-190`), and collapsed evidence remains hidden by default with inspect affordance (`src/flight-learn-inbox.ts:576-588`).
- `.loom/specs/flight-learn-inbox-ux.md` - inspected REQ-033 through REQ-048 and SCN-011 through SCN-015. The spec requires local model hard display gates, no hosted/non-loopback calls for local drafts, display-only model text, no storage/routing/classifier side effects, hidden evidence by default, non-invented expected behavior, and fallback usability (`.loom/specs/flight-learn-inbox-ux.md:115-130`, `:238-297`).
- `.loom/tickets/20260531-flight-learn-llm-card-copy-comprehension-validation.md` - inspected downstream state. It remains `Status: blocked`, says actual operator notes are required for comprehension, identifies hosted GPT-5.5 evidence as diagnostic only, and states hosted evidence is not a local-first safe model-enabled render pack (`.loom/tickets/20260531-flight-learn-llm-card-copy-comprehension-validation.md:3-16`, `:27-28`, `:88-100`, `:110`).
- `.loom/tickets/20260602-flight-learn-small-model-batch-eval.md`, `.loom/evidence/20260602-flight-learn-small-model-batch-eval.md`, and `.loom/audit/20260602-flight-learn-small-model-batch-eval-review.md` - inspected prior local batch context. The small-model branch closed negative with no candidate meeting the gate and SmolLM2 treated as a safety/validator repair lead, not as comprehension validation input.

## Findings

None - no material findings within audited scope.

### Non-finding: raw hosted text omission limits exact defect diagnosis but is acceptable for this ticket

The ticket's closure claim is diagnostic: determine whether the current process looks suspect if a frontier model fails the same prompt/schema/validator path. For that claim, the recorded metrics are sufficient: current-product mode timed out 8/8, while relaxed-validator mode got 8/8 parse/schema-compatible outputs and 0/8 product-gated outputs with fallback reasons split between unsupported facts and unsafe output.

The intentional omission of raw hosted prompts/model output is acceptable for this ticket because the ticket explicitly prioritizes privacy and non-persistence of hosted prompt/output material (`.loom/tickets/20260602-flight-learn-gpt55-hosted-sanity-check.md:50-59`), and the evidence records lengths, keys, hashes, categories, and validator outcomes instead (`.loom/evidence/20260602-flight-learn-gpt55-hosted-sanity-check.md:25`, `:96-102`). However, that omission prevents stronger claims such as “these exact validator regexes are false positives” or “GPT-5.5 output was semantically correct.” A follow-up repair ticket should add a safe ephemeral or redacted rejection-reason inspection path before changing validator logic.

## Verdict

Verdict: `clear`.

The ticket can close as-is as **hosted diagnostic evidence**. `ACC-001` through `ACC-005` are supported by the inspected artifacts:

- `ACC-001` is supported by the model-list/probe artifact: `gpt-5.5` is recorded as available through `openai-codex`, the tiny probe succeeded, and no raw prompt/output or credential values were persisted (`01-availability-and-probe.json:3-29`).
- `ACC-002` is supported by current-product metrics: 8/8 timeouts, 0/8 product-gated, 8 deterministic fallbacks, and latency clustered around the 5000ms product path (`mode-current-product-5s-summary.json:3-53`).
- `ACC-003` is supported by relaxed-validator metrics: 8/8 parse-valid and schema-compatible, 0/8 product-gated, 5 unsafe rejections, 3 unsupported-facts rejections, 0 unsafe accepted, 0 timeouts, field/key presence, and provider success metadata (`mode-relaxed-validator-summary.json:3-52`, `:63-110`).
- `ACC-004` is supported as a bounded mixed diagnosis. The evidence properly separates 5-second hosted transport timeouts from relaxed-validator prompt/validator failures and avoids claiming GPT-5.5 is globally bad or that local models are impossible (`.loom/evidence/20260602-flight-learn-gpt55-hosted-sanity-check.md:52-58`, `:96-102`). The “too brittle or misaligned” diagnosis is strongly supported at the process-class level, but exact defect attribution remains intentionally unproven because raw text was not persisted.
- `ACC-005` is supported by privacy, source-side-effect, session-side-effect, render-contract, and final privacy checks (`05-artifact-privacy-scan.json:1-6`, `06-source-side-effect-scan.json:1-12`, `07-session-side-effect-check.json:1-18`, `11-final-privacy-scan.json:1-6`).

This audit does **not** recommend starting operator comprehension validation. Downstream `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` remains correctly blocked because it requires local-first safe product-gated model-enabled renders and actual operator notes, while this hosted run produced 0/8 product-gated cards and is diagnostic only (`.loom/tickets/20260531-flight-learn-llm-card-copy-comprehension-validation.md:72-86`, `:98-100`).

## Required Follow-up

Before closing this ticket:

1. Close it only as diagnostic mixed-failure evidence, not as model integration, local-runtime validation, or operator comprehension validation.
2. Preserve the current downstream blocked disposition for `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation`.

Recommended next work:

1. Shape a local-first prompt/schema/validator repair ticket.
2. In that repair, reduce all-field burden and split or clarify the unsafe/non-display and unsupported-fact validators, especially around broad display-only forbidden patterns and token-support checks (`src/flight-learn-local-diagnosis-model.ts:318-332`, `:1357-1363`, `:1411-1418`).
3. Add a privacy-safe rejection-inspection mechanism, such as ephemeral local-only raw inspection or redacted per-field rejection category artifacts, so future repair can distinguish genuine unsafe output from validator false positives without persisting hosted/private raw text.
4. Re-run a local/open model product-path replay after repair before restarting comprehension validation.

## Residual Risk

- Raw hosted model text was intentionally omitted, so this audit cannot judge actual GPT-5.5 wording quality or exact validator-triggering substrings.
- The result is based on 8 synthetic/redacted cases. It is enough for this diagnostic gate, not proof of real-session/operator comprehension.
- Hosted CLI transport is not equivalent to product local-runtime transport. The current-product 5-second timeout result proves the hosted Pi CLI path is too slow for that envelope, not that a direct hosted API or local model with different runtime would behave identically.
- The validator may be correctly rejecting genuinely unsafe/non-display output in some cases. The current evidence supports process/prompt/validator misalignment as a class-level diagnosis but not a specific false-positive fix.
- The harness artifact contains code that can reconstruct synthetic prompts at runtime; it does not persist real prompt instances or hosted output, but future reviewers should continue to treat prompt/output persistence as sensitive.
- This hosted test does not change the project's open-source/local-first posture. Product integration remains blocked unless separately authorized and shaped.

## Related Records

- `ticket:20260602-flight-learn-gpt55-hosted-sanity-check` - ticket under review.
- `evidence:20260602-flight-learn-gpt55-hosted-sanity-check` - evidence dossier under review.
- `ticket:20260531-flight-learn-llm-card-copy-comprehension-validation` - downstream validation ticket that remains blocked.
- `ticket:20260602-flight-learn-small-model-batch-eval`, `evidence:20260602-flight-learn-small-model-batch-eval`, and `audit:20260602-flight-learn-small-model-batch-eval-review` - prior local small-model context and safety/validator repair signal.
- `spec:flight-learn-inbox-ux` - current card-copy, fallback, hidden evidence, and source-of-truth requirements.
- `src/flight-learn-local-diagnosis-model.ts` and `src/flight-learn-inbox.ts` - product prompt/validator and focused-card seams inspected read-only.
