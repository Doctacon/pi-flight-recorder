# Local Narrative llama.cpp Judge Adapter Evidence

ID: evidence:20260528-local-narrative-llama-cpp-judge-adapter
Type: Evidence Dossier
Status: recorded
Created: 2026-05-28
Updated: 2026-05-28
Observed: 2026-05-28

## Summary

Implemented and validated the local-only `llama.cpp` narrative judge adapter/config seam for `ticket:20260528-local-narrative-llama-cpp-judge-adapter`.

Changed source/test targets:

- `src/flight-learn-llama-cpp-adapter.ts`
- `src/flight-learn-llama-cpp-adapter.test.ts`
- `src/pi-extension.ts`
- `src/pi-extension.test.ts`

Artifact directory:

```text
.loom/evidence/artifacts/20260528-local-narrative-llama-cpp-judge-adapter/
```

Key artifacts:

- `focused-tests.txt` - focused adapter/Pi/local-diagnosis tests.
- `full-tests.txt` - full Vitest suite.
- `typecheck.txt` - TypeScript check.
- `build.txt` - package build output.
- `diff-check.txt` - empty file means `git diff --check` passed with no output.
- `audit:20260528-local-narrative-llama-cpp-judge-adapter-review` - initial audit; verdict `changes-needed` with `FIND-001`.
- `audit:20260528-local-narrative-llama-cpp-judge-adapter-followup-review` - follow-up audit; verdict `clear` within fake-loopback adapter/config scope.

No real Bonsai model, real judge model, runtime start, model download, hosted call, non-loopback endpoint, storage/routing/classifier behavior change, artifact/rule/source mutation, or release-readiness claim was exercised by this ticket.

## Operator Authorization Context

The unblock questionnaire answer authorized:

- adding a local judge adapter;
- using only the already-downloaded Bonsai 4B Q1_0 for later validation;
- starting loopback-only local `llama.cpp` servers for authorized validation.

This ticket used that authorization only for adapter/config implementation. Real Bonsai 4B runtime validation remains a later ticket.

## Procedure

Implementation changes:

- Added `LlamaCppLocalNarrativeJudgeConfig` and `createLlamaCppLocalNarrativeJudgeProvider`.
- Extended `createLlamaCppLocalDiagnosisPolishOptions` to accept an explicit nested `judge` config and wire `judgeProvider`/`judgeTimeoutMs` into `LocalDiagnosisPolishOptions` only when configured.
- Reused the existing direct loopback HTTP transport, `/v1/chat/completions` endpoint, JSON response format, no-proxy `Agent({ proxyEnv: {} })`, response size limits, prompt length limits, model-label validation, timeout handling, and local URL validation.
- Added explicit `/flight-learn` flags:
  - `--local-narrative-judge-url`
  - `--local-narrative-judge-model-name`
  - `--local-narrative-judge-timeout-ms`
  - `--local-narrative-judge-max-output-tokens`
- Updated help/privacy wording to mention the optional judge URL while keeping the same visible commands.
- Added fake loopback tests showing a generator server plus separate judge server can accept fact-cited narrative output through the existing judge contract.
- Added tests that unsafe judge config shapes are rejected before any request.
- Added Pi integration test showing explicit judge URL enables accepted narrative display without persisting model wording into stored delta summary or artifact draft.
- After initial audit finding `FIND-001`, hardened generated output checks so prompt/transcript-looking candidate text is rejected before any local judge request is built.

## Command Results

Focused tests:

```bash
npm test -- src/flight-learn-llama-cpp-adapter.test.ts src/pi-extension.test.ts src/flight-learn-local-diagnosis-model.test.ts
```

Result after audit follow-up fix: passed, `3` test files / `67` tests.

Typecheck:

```bash
npm run typecheck
```

Result: passed, TypeScript `tsc --noEmit`.

Build:

```bash
npm run build
```

Result: passed (`npm run clean && tsc -p tsconfig.build.json`).

Full tests:

```bash
npm test
```

Result after audit follow-up fix: passed, `21` test files / `142` tests.

Diff check:

```bash
git diff --check
```

Result: passed with no output.

## What This Shows

- `ACC-001` is supported: source/tests show a `LocalNarrativeJudgeProvider` backed by the loopback `llama.cpp` chat-completions transport, returning model JSON into the existing judge validation path without rewriting display fields directly.
- `ACC-002` is supported: tests show disabled/default behavior remains unchanged, literal loopback-only URLs are required, unsafe hosted/provider-key/proxy/model-path config shapes fail before any judge request, and missing/invalid runtimes fail closed through existing provider-error paths.
- `ACC-003` is supported: `/flight-learn` judge flags are explicit; without a judge URL narrative candidates still fail closed through existing behavior, while a fake explicit judge URL allows accepted narrative display without storage/routing/artifact/rule/classifier side effects.
- `ACC-004` is supported in fake-loopback scope after audit follow-up fix: captured judge requests contain the bounded generated judge prompt/request JSON and redacted facts/candidate text, not raw `/Users/alice` paths or provider keys; prompt/transcript-looking generated candidate text now fails closed before the judge is called.
- `ACC-005` is supported by focused tests, full tests, typecheck, build, diff-check, this evidence dossier, and audit/follow-up audit.

## Audit Follow-up

Initial audit `audit:20260528-local-narrative-llama-cpp-judge-adapter-review` returned `changes-needed` with `FIND-001`: prompt/transcript-looking generated candidate text could reach the judge request before fail-closed fallback.

Follow-up fix:

- `containsUnsafeOutput` now rejects prompt-like and transcript-like generated display text using the existing prompt/transcript detectors.
- Added a focused regression test proving transcript-like generated narrative text fails closed as `unsafe-output` and does not call the judge provider.
- Re-ran focused tests (67), typecheck, build, full tests (142), and diff-check; all passed. Follow-up audit returned `clear` for fake-loopback adapter/config scope.

## What This Does Not Show

- This does not prove real Bonsai 4B judge quality, generator quality, latency, memory/RSS, JSON reliability, hardware fit, or self-judge safety.
- This does not run `llama-server`, start a real model runtime, or validate the existing Bonsai 4B file.
- This does not download, install, or build any runtime or model.
- This does not make local-model polish or local judge validation default or required.
- This does not claim release readiness, production judge safety, or broad REQ-032 compliance under real model outputs.

## Freshness And Recheck Triggers

Re-run or supersede this evidence if `LocalNarrativeJudgeProvider`, `LocalNarrativeJudgeRequest`, the llama.cpp adapter transport, local-model CLI flags, loopback URL validation, proxy behavior, or `/flight-learn` storage/routing behavior changes.
