# Local Narrative llama.cpp Judge Adapter Review

ID: audit:20260528-local-narrative-llama-cpp-judge-adapter-review
Type: Audit
Status: recorded
Created: 2026-05-28
Updated: 2026-05-28
Audited: 2026-05-28
Target: ticket:20260528-local-narrative-llama-cpp-judge-adapter

## Summary

Adversarial review of the local `llama.cpp` narrative judge adapter found the adapter/config/CLI plumbing mostly aligned with the existing veto-only judge contract, loopback-only transport, explicit flags, fake-loopback evidence, and display-only integration boundary. One material privacy finding blocks closure: prompt/transcript-looking narrative candidate text can be forwarded to the judge request before being rejected, so `ACC-004` is not closed.

## Target

Reviewed `ticket:20260528-local-narrative-llama-cpp-judge-adapter`, its evidence dossier, the predecessor judge-provider contract/follow-up audit, and the relevant adapter/CLI/judge-flow files:

- `.loom/tickets/20260528-local-narrative-llama-cpp-judge-adapter.md`
- `.loom/evidence/20260528-local-narrative-llama-cpp-judge-adapter.md`
- `.loom/tickets/20260528-local-narrative-judge-provider-contract.md`
- `.loom/audit/20260528-local-narrative-judge-provider-contract-followup-review.md`
- `src/flight-learn-llama-cpp-adapter.ts`
- `src/flight-learn-llama-cpp-adapter.test.ts`
- `src/pi-extension.ts`
- `src/pi-extension.test.ts`
- `src/flight-learn-local-diagnosis-model.ts` relevant judge flow
- `src/flight-learn-local-diagnosis-model.test.ts` relevant judge/privacy/fallback tests

Out of scope: source edits, real Bonsai/llama.cpp runtime validation, model quality/latency assessment, downloads/building runtimes, hosted endpoints, release readiness, and broad review of unrelated modified plan/spec/inbox work outside this ticket.

## Audit Scope And Lenses

Lenses used:

- Acceptance: `ACC-001` through `ACC-005` closure posture.
- Contract boundary: adapter must use the existing `LocalNarrativeJudgeProvider` veto-only contract and must not rewrite, route, store, or create facts.
- Local-first configuration: explicit config only, literal loopback HTTP only, fail-closed, no hosted/non-loopback/credential/path/query/provider-key/proxy/model-path/download/runtime lifecycle.
- CLI/defaults: no new visible command surface/default behavior; no implicit same-model self-judge unless an explicit judge URL is provided.
- Privacy: judge prompt/request/transport artifacts should not include raw local paths, secrets, raw prompts/transcripts, provider keys, or raw errors.
- Integration side effects: accepted narrative display must not persist model wording into deltas, artifacts, rules, or source.
- Evidence honesty: fake-loopback adapter proof only; no real Bonsai/model quality/latency/release claims.

## Context And Evidence Reviewed

- Ralph review run: this bounded review subagent inspected the ticket/evidence/predecessor records, source/tests, git diff/status, evidence artifacts, and ran focused no-source-edit validation commands.
- `ticket:20260528-local-narrative-llama-cpp-judge-adapter` - scope, stop conditions, and `ACC-001` through `ACC-005`.
- `evidence:20260528-local-narrative-llama-cpp-judge-adapter` and `.loom/evidence/artifacts/20260528-local-narrative-llama-cpp-judge-adapter/` - recorded focused tests, full tests, typecheck, build, diff-check, and explicit non-claims.
- `audit:20260528-local-narrative-judge-provider-contract-followup-review` - predecessor contract was clear only for fake-provider/provider-interface scope.
- `src/flight-learn-llama-cpp-adapter.ts:11-24`, `:53-56`, `:72-88`, `:96-172`, `:231-237`, `:345-383`, `:390-404` - adapter config shape, explicit judge provider creation, no-proxy loopback transport, response extraction, URL/model/token validation, timeout bounds, and sanitized error messages.
- `src/flight-learn-local-diagnosis-model.ts:124-198`, `:688-705`, `:746-772`, `:801-860`, `:863-998`, `:1001-1136`, `:1166-1174` - judge contract, ordering, display-only apply path, judge request construction, strict judge response validation, narrative candidate validation, and unsafe-output checks.
- `src/pi-extension.ts:350-355`, `:462-470`, `:806-836`, `:1105-1147`, `:1610-1617` - help/privacy wording, explicit judge flag parsing, disabled-by-default behavior, subcommand routing, and unchanged normal command registration.
- `src/flight-learn-llama-cpp-adapter.test.ts:364-500`, `:503-647`, `:649-760` - default-disabled, request shape/privacy, explicit judge, unsafe config, proxy bypass, loopback URL, failure/fallback, and malformed-content tests.
- `src/pi-extension.test.ts:76-100`, `:136-154`, `:653-735`, `:741-839`, `:918-962` - visible command surface, privacy wording, no-persistence for local polish, explicit judge integration/no-persistence, and deterministic fallback UI tests.
- `src/flight-learn-inbox.ts:464-488`, `:676-688` - inspected as integration context: local model wording is rendered from `diagnosis`, while route completion returns edited delta fields/rationale rather than `whatHappened` model wording.

Commands/probes run from `/Users/crlough/Code/personal/pi-flight-recorder`:

```bash
npm test -- src/flight-learn-llama-cpp-adapter.test.ts src/pi-extension.test.ts src/flight-learn-local-diagnosis-model.test.ts
```

Result: passed, `3` files / `66` tests.

```bash
npm run typecheck && git diff --check
```

Result: typecheck passed; `git diff --check` passed with no output.

No-write privacy probe:

- A fake local-model provider returned a fact-cited `whatHappened` sentence with a transcript-role marker (`user:` fixture text).
- Observed result: the local judge was called once; the captured judge request candidate text contained the transcript-role-marked sentence; the final result fell back only after the judge rejected it.
- This proves the privacy issue is pre-judge-request, not final-display persistence.

I did not run `npm run build` or full tests during audit because the operator permitted focused read-only tests/typecheck/diff-check. I inspected the recorded artifact files that claim build and full test results.

## Findings

### FIND-001: Prompt/transcript-looking candidate text can reach the judge request before fail-closed fallback

Severity: blocker for `ACC-004`; confidence: high.

`buildLocalNarrativeJudgeRequest` serializes `candidate.text` and each candidate sentence into the judge request and prompt (`src/flight-learn-local-diagnosis-model.ts:822-860`). Before that happens, `validateWhatHappenedNarrative` checks each generated sentence for raw paths/secrets/commands/display-only advice via `containsUnsafeOutput` plus imperative advice patterns (`src/flight-learn-local-diagnosis-model.ts:1058-1136`, especially `:1107-1110`). However, `containsUnsafeOutput` does not apply the existing prompt/transcript detectors; it only checks secret/path/command/display-forbidden patterns (`src/flight-learn-local-diagnosis-model.ts:1166-1170`). The prompt/transcript detectors exist for source-fact redaction (`FULL_PROMPT_PATTERNS` and `TRANSCRIPT_LINE_PATTERN` at `src/flight-learn-local-diagnosis-model.ts:313-320`, used by `omitUnsafeSourceText` at `:503-527`), but they are not used on generated candidate display text before the judge request is built.

The no-write probe confirmed this gap: a fake generator response with a fact-cited transcript-role-prefixed narrative sentence caused `completeLocalNarrativeJudge` to be invoked once, and the captured request contained that candidate sentence. The final result did fail closed after judge rejection, but the privacy requirement is stricter: judge prompt/request/transport artifacts should not include raw prompts/transcripts in the first place.

Required fix direction: reject prompt/transcript-looking local-model candidate text before `buildLocalNarrativeJudgeRequest` is called, likely by extending output unsafe checks to include `looksLikePrompt`/`looksLikeTranscript`-equivalent detection for generated display fields and adding regression coverage that the judge is not called for such candidates.

## Correct Observations

- `ACC-001` is mostly supportable. A `LocalNarrativeJudgeProvider` adapter exists and posts to `/v1/chat/completions` using the existing request/prompt/response contract (`src/flight-learn-llama-cpp-adapter.ts:96-172`). The adapter returns only extracted model message content to the existing judge validation path; rewrite/store/route behavior is handled by the existing contract, not the adapter.
- The veto-only contract remains in force. The judge runs only after deterministic candidate validation (`src/flight-learn-local-diagnosis-model.ts:688-697`), accepted output applies the original candidate display fields rather than judge wording (`src/flight-learn-local-diagnosis-model.ts:699-705`, `:801-813`), and judge responses reject unsupported top-level/sentence fields, missing coverage, bad fact IDs, unsupported claims, low confidence, unsafe/action-advice, uncertainty, and malformed JSON (`src/flight-learn-local-diagnosis-model.ts:863-998`).
- `ACC-002` is mostly supportable. Config is explicit/disabled by default (`src/flight-learn-llama-cpp-adapter.ts:72-88`), URL validation requires canonical literal HTTP loopback with no credentials/path/query/hash (`src/flight-learn-llama-cpp-adapter.ts:101-118`, `:337-342`), transport uses a direct no-proxy agent (`src/flight-learn-llama-cpp-adapter.ts:53-56`, `:186-197`), and config keys/model labels/max tokens are bounded (`src/flight-learn-llama-cpp-adapter.ts:345-376`). Tests cover unsafe URL/config rejection before requests and proxy bypass (`src/flight-learn-llama-cpp-adapter.test.ts:482-647`).
- `ACC-003` is supportable in the audited integration path. `/flight-learn` still registers only `flight-status` and `flight-learn` by default (`src/pi-extension.ts:1610-1617`; `src/pi-extension.test.ts:76-100`). Judge config is nested only when `--local-model-polish` is enabled and `--local-narrative-judge-url` is explicitly present (`src/pi-extension.ts:806-836`), so there is no implicit same-model self-judge from `--local-model-url` alone.
- Integration display-only boundaries look correct within tested paths. The custom inbox renders `diagnosis.whatHappened` for display (`src/flight-learn-inbox.ts:464-488`), but route completion returns edited expectation/reality/impact/rationale, not model narrative wording (`src/flight-learn-inbox.ts:676-688`). Pi tests verify accepted local narrative display does not persist the model phrase into the stored delta summary or artifact draft and does not create rules (`src/pi-extension.test.ts:741-839`).
- Evidence honesty is mostly good. The ticket/evidence explicitly say this is fake-loopback adapter proof only and do not claim real Bonsai/model quality, latency, runtime lifecycle, downloads, hosted calls, or release readiness. Recorded artifacts show focused tests, full tests, typecheck, build, and diff-check; this audit re-ran focused tests/typecheck/diff-check.

## Verdict

`changes-needed`. `ACC-001`, `ACC-002`, `ACC-003`, and the non-privacy parts of `ACC-005` are close to supportable for the fake-loopback adapter scope, and the integration side-effect boundary looks sound. `ACC-004` is not closed because prompt/transcript-looking generated narrative text can be sent inside the judge request before fallback.

This verdict does not reject the adapter architecture; it requires a targeted privacy hardening fix and regression evidence before ticket closure.

## Required Follow-up

Before closure:

1. Reject raw prompt/transcript-looking generated display text before any local judge request is built or sent.
2. Add tests proving such candidates fail closed and do not call `LocalNarrativeJudgeProvider`.
3. Re-run focused adapter/local-diagnosis/Pi tests, typecheck, and `git diff --check`; update the evidence dossier with the new results.
4. Run a follow-up audit for `FIND-001`.

## Residual Risk

- No real `llama.cpp`/Bonsai runtime was exercised; model quality, latency, malformed-output rate, hardware fit, self-judge bias, and real-server compatibility remain for the later Bonsai validation ticket.
- The reviewed tests use fake loopback servers, not real model behavior under representative local runtime outputs.
- The working tree contains broader uncommitted plan/spec/source/test changes from the parent narrative work; this audit is bounded to the listed adapter/judge/CLI/integration paths.
- Even after `FIND-001` is fixed, representative real-output privacy probes should be repeated during real Bonsai validation because local model outputs can be adversarial or unexpectedly transcript-like.

## Closure Recommendation

Do not close `ticket:20260528-local-narrative-llama-cpp-judge-adapter` yet. Close only after `FIND-001` is fixed, regression-tested, evidence is updated, and follow-up audit confirms `ACC-004` closure within the fake-loopback adapter scope.

## Related Records

- `ticket:20260528-local-narrative-llama-cpp-judge-adapter`
- `evidence:20260528-local-narrative-llama-cpp-judge-adapter`
- `ticket:20260528-local-narrative-judge-provider-contract`
- `audit:20260528-local-narrative-judge-provider-contract-followup-review`
- `ticket:20260528-bonsai-4b-narrative-validation`
