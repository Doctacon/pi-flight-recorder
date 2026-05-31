# Local Narrative llama.cpp Judge Adapter Follow-up Review

ID: audit:20260528-local-narrative-llama-cpp-judge-adapter-followup-review
Type: Audit
Status: recorded
Created: 2026-05-28
Updated: 2026-05-28
Audited: 2026-05-28
Target: ticket:20260528-local-narrative-llama-cpp-judge-adapter

## Summary

Follow-up adversarial review of `audit:20260528-local-narrative-llama-cpp-judge-adapter-review#FIND-001` found the privacy gap fixed: prompt/transcript-looking generated narrative text now fails closed during candidate validation before any `LocalNarrativeJudgeProvider` request is built or sent. No material findings were identified within the fake-loopback adapter/config scope; `ACC-001` through `ACC-005` are supportable for that bounded claim.

This audit does not accept or prove real Bonsai 4B/model/runtime quality, latency, hardware fit, JSON reliability, release readiness, or production safety.

## Target

Reviewed the follow-up state of `ticket:20260528-local-narrative-llama-cpp-judge-adapter`, specifically:

- whether initial `FIND-001` is fixed;
- whether `ACC-001` through `ACC-005` close for the fake-loopback adapter/config scope;
- whether config remains explicit loopback-only with no hosted/key/proxy/model-path/download/default/runtime-lifecycle behavior;
- whether there is no implicit same-model self-judge without an explicit judge URL;
- whether privacy, side effects, and evidence non-claims remain honest.

Out of scope: source edits, real `llama.cpp`/Bonsai runtime validation, model downloads/builds, hosted inference, broader narrative-plan/spec review, release readiness, and any claim that a real model judge is good enough.

## Audit Scope And Lenses

Lenses used:

- FIND-001 closure: prompt/transcript-looking generated narrative text must fail closed before judge request construction/send.
- Acceptance: `ACC-001` through `ACC-005` closure posture for fake-loopback adapter/config scope.
- Local-first configuration: explicit config only, literal HTTP loopback only, no hosted/non-loopback/credential/path/query/provider-key/proxy/model-path/download/runtime lifecycle.
- CLI/defaults: visible command surface/default behavior unchanged; no implicit same-model self-judge unless explicit judge URL is present.
- Privacy: judge prompt/request/transport artifacts should not include raw local paths, secrets, raw prompts/transcripts, provider keys, or raw errors.
- Side effects: accepted narrative is display-only and not persisted into deltas, artifacts, rules, routes, classifier outputs, or source.
- Evidence honesty: fake-loopback proof only; no real Bonsai/model/runtime quality overclaim.

## Context And Evidence Reviewed

- Ralph review run: this bounded follow-up review subagent inspected the ticket, initial audit, predecessor contract audit, evidence dossier/artifacts, relevant source/tests, current git status/diff, and ran focused no-source-edit validation commands/probes.
- `.loom/tickets/20260528-local-narrative-llama-cpp-judge-adapter.md:35-58`, `:60-83`, `:87-89` - scope, stop conditions, `ACC-001` through `ACC-005`, current follow-up claim, and journal state.
- `.loom/audit/20260528-local-narrative-llama-cpp-judge-adapter-review.md:81-89`, `:100-124` - original `FIND-001`, required fix, and prior closure blocker.
- `.loom/audit/20260528-local-narrative-judge-provider-contract-followup-review.md` - predecessor fake-provider/provider-interface contract was clear only for its bounded scope.
- `.loom/evidence/20260528-local-narrative-llama-cpp-judge-adapter.md:35-63`, `:65-113`, `:115-131` - implementation/fix summary, recorded command results, acceptance support, follow-up fix claim, and explicit non-claims.
- `.loom/evidence/artifacts/20260528-local-narrative-llama-cpp-judge-adapter/focused-tests.txt`, `full-tests.txt`, `typecheck.txt`, `build.txt`, `diff-check.txt` - recorded post-fix evidence artifacts; `diff-check.txt` is zero bytes.
- `src/flight-learn-local-diagnosis-model.ts:313-320`, `:503-527`, `:688-697`, `:746-772`, `:822-860`, `:1040-1136`, `:1166-1172` - prompt/transcript detectors, source redaction, judge ordering, request construction, narrative candidate validation, and unsafe-output checks.
- `src/flight-learn-local-diagnosis-model.test.ts:226-258`, `:260-438`, `:621-698` - no-judge fallback, local judge fail-closed cases, deterministic-verification-before-judge tests, no-judge-call regression for transcript-looking generated narrative text, and source prompt/transcript redaction tests.
- `src/flight-learn-llama-cpp-adapter.ts:11-24`, `:53-56`, `:72-99`, `:101-118`, `:144-172`, `:175-197`, `:231-237`, `:240-255`, `:320-328`, `:337-383`, `:390-404` - config shape, no-proxy agent, explicit provider construction, loopback URL validation, judge adapter, direct chat-completions POST, endpoint validation, response extraction, request assertion, bounded model/token/timeout validation, and sanitized error messages.
- `src/flight-learn-llama-cpp-adapter.test.ts:364-500`, `:503-647`, `:649-760` - disabled-by-default behavior, generator/judge request shape/privacy, explicit fake loopback judge acceptance, unsafe judge config rejection before request, proxy bypass, literal loopback URL rejection, missing runtime/failure fallback, and malformed content tests.
- `src/pi-extension.ts:350-356`, `:462-470`, `:806-836`, `:1610-1618` - help/privacy wording, explicit judge flag parsing, no implicit judge without `--local-narrative-judge-url`, and unchanged normal command registration.
- `src/pi-extension.test.ts:76-103`, `:136-154`, `:653-735`, `:741-839`, `:918-962` - visible command surface, privacy wording, local polish no-persistence, explicit judge integration/no-persistence, and deterministic fallback UI tests.
- `src/flight-learn-inbox.ts:464-488`, `:676-688` - display path uses `diagnosis.whatHappened`; route completion returns edited expectation/reality/impact/rationale, not generated `whatHappened` wording.
- Focused source search for hosted/key/proxy/model-path/download/runtime-lifecycle terms in `src/flight-learn-llama-cpp-adapter.ts`, `src/pi-extension.ts`, and relevant tests - only bounded HTTP loopback transport, explicit flag/config strings, and rejection/proxy-bypass tests appeared in the audited source path.

Commands/probes run from `/Users/crlough/Code/personal/pi-flight-recorder`:

```bash
node --import tsx --input-type=module <<'EOF'
# no-write probe using buildFlightLearnDiagnosisViewWithLocalPolish, fake generator, and fake judge
# checked generated transcript-role text and generated prompt-looking text
EOF
```

Result: passed; both generated `user:` transcript-role text and generated `system prompt`-looking text returned `usedLocalModel: false`, `fallbackReason: "unsafe-output"`, and `judgeCalls: 0`.

```bash
npm test -- src/flight-learn-llama-cpp-adapter.test.ts src/pi-extension.test.ts src/flight-learn-local-diagnosis-model.test.ts
```

Result: passed, `3` test files / `67` tests.

```bash
npm run typecheck
```

Result: passed, `tsc --noEmit`.

```bash
git diff --check
```

Result: passed with no output.

I did not re-run `npm run build` or the full test suite during this follow-up because `build` cleans/writes `dist/` and the operator requested no source edits; I inspected the recorded post-fix build/full-test artifacts instead.

## Findings

None - no material findings within the audited fake-loopback adapter/config scope.

## Correct Observations

- `FIND-001` is fixed. The judge request still serializes `candidate.text` and sentence text when it is built (`src/flight-learn-local-diagnosis-model.ts:822-860`), but generated `whatHappened` sentence validation now calls `containsUnsafeOutput` before candidate assembly (`src/flight-learn-local-diagnosis-model.ts:1107-1116`), and `containsUnsafeOutput` now includes `looksLikePrompt` and `looksLikeTranscript` (`src/flight-learn-local-diagnosis-model.ts:1166-1172`). Judge request construction happens later only after `validation.narrativeCandidate` exists and a judge provider is configured (`src/flight-learn-local-diagnosis-model.ts:688-697`, `:746-761`). The regression test asserts transcript-looking generated narrative falls back with `judgeCalls === 0` (`src/flight-learn-local-diagnosis-model.test.ts:423-437`), and the no-write probe also covered prompt-looking generated narrative text.
- `ACC-001` is supportable. `createLlamaCppLocalNarrativeJudgeProvider` exists (`src/flight-learn-llama-cpp-adapter.ts:96-99`), the provider posts the existing judge request prompt to `/v1/chat/completions` through `postChatCompletion` (`src/flight-learn-llama-cpp-adapter.ts:144-172`), and it returns only extracted model message content to the existing judge validation path (`src/flight-learn-llama-cpp-adapter.ts:240-255`). Rewrite/route/store authority stays outside the adapter and remains in the existing veto-only judge contract.
- `ACC-002` is supportable. Config is disabled by default (`src/flight-learn-llama-cpp-adapter.ts:72-74`), nested judge config is used only when explicitly supplied (`src/flight-learn-llama-cpp-adapter.ts:80-86`), URL validation accepts only canonical literal `http://127.0.0.1` or `http://[::1]` authorities with no credentials/path/query/hash (`src/flight-learn-llama-cpp-adapter.ts:101-118`, `:337-342`), endpoint validation rechecks `/v1/chat/completions` (`src/flight-learn-llama-cpp-adapter.ts:231-237`), and transport uses a direct no-proxy HTTP agent (`src/flight-learn-llama-cpp-adapter.ts:53-56`, `:186-197`). Config keys, model labels, token bounds, and timeout bounds are constrained (`src/flight-learn-llama-cpp-adapter.ts:53-54`, `:345-383`), and tests reject hosted URLs, credentials, path/query URLs, provider keys/headers/proxy/providerUrl/model paths, and proxy use before target requests (`src/flight-learn-llama-cpp-adapter.test.ts:482-647`). Missing runtime/failure paths fall back with sanitized provider errors (`src/flight-learn-llama-cpp-adapter.test.ts:675-732`; `src/flight-learn-llama-cpp-adapter.ts:390-404`).
- `ACC-003` is supportable. `/flight-learn` creates judge config only when `--local-model-polish` is active and `--local-narrative-judge-url` is present (`src/pi-extension.ts:806-836`), so `--local-model-url` alone does not create an implicit same-model self-judge. Normal registered commands remain `flight-status` and `flight-learn` (`src/pi-extension.ts:1610-1618`; `src/pi-extension.test.ts:76-103`). Pi integration shows explicit fake loopback judge acceptance renders local narrative wording while stored delta summary/artifact draft/rules remain free of the generated phrase (`src/pi-extension.test.ts:741-839`).
- `ACC-004` is supportable for fake-loopback scope after the fix. Source fact packets omit prompt/transcript/path/secret-like source text (`src/flight-learn-local-diagnosis-model.ts:503-527`; `src/flight-learn-local-diagnosis-model.test.ts:621-698`), generated display fields now reject prompt/transcript-like text before judge (`src/flight-learn-local-diagnosis-model.ts:1040-1050`, `:1107-1111`, `:1166-1172`), captured judge request tests assert no raw `/Users/alice` paths or provider-key-like fields (`src/flight-learn-llama-cpp-adapter.test.ts:428-480`), and provider/judge raw errors are sanitized in fallback issues (`src/flight-learn-local-diagnosis-model.test.ts:381-405`; `src/flight-learn-llama-cpp-adapter.test.ts:675-732`).
- `ACC-005` is supportable. The evidence dossier records focused tests, typecheck, build, full tests, diff-check, and the follow-up fix (`.loom/evidence/20260528-local-narrative-llama-cpp-judge-adapter.md:65-123`); this audit re-ran focused tests, typecheck, diff-check, and an explicit prompt/transcript no-judge-call probe.
- Evidence and scope are honest. The ticket/evidence explicitly keep real Bonsai/runtime validation out of this adapter ticket (`.loom/tickets/20260528-local-narrative-llama-cpp-judge-adapter.md:47-58`, `:81-83`) and the evidence states it does not prove real Bonsai 4B quality, latency, memory/RSS, JSON reliability, runtime start, downloads, defaults, production judge safety, or release readiness (`.loom/evidence/20260528-local-narrative-llama-cpp-judge-adapter.md:125-131`).

## Verdict

`clear` within the audited fake-loopback adapter/config scope. `FIND-001` is resolved, and `ACC-001` through `ACC-005` are close-ready for this ticket's bounded claim: an explicitly configured local loopback `llama.cpp` judge adapter can feed the existing veto-only narrative judge contract without defaulting on, using hosted/key/proxy/model-path/download/runtime-lifecycle behavior, persisting generated narrative wording, or overclaiming real model quality.

This verdict is not ticket closure by itself and must not be read as real Bonsai 4B validation, real-server compatibility proof beyond fake loopback HTTP shape, self-judge safety, release readiness, or production safety.

## Required Follow-up

None required before closing `ticket:20260528-local-narrative-llama-cpp-judge-adapter` for the fake-loopback adapter/config scope, assuming the consuming ticket cites this follow-up audit and preserves the residual risks/non-claims.

The next substantive work remains `ticket:20260528-bonsai-4b-narrative-validation` for real local runtime/model validation.

## Residual Risk

- No real `llama.cpp` server or Bonsai 4B model was run in this audit or ticket; quality, latency, memory/RSS, JSON reliability, hardware fit, real endpoint quirks, and self-judge bias remain unproven.
- Tests use fake loopback servers and fake model responses; they prove adapter/config/request/fallback boundaries, not representative real local model behavior.
- The judge receives generated candidate text by design after deterministic and unsafe-output validation. Future real-output validation should repeat privacy probes because real local outputs can be unexpectedly prompt/transcript-like or adversarial.
- The working tree includes broader uncommitted narrative plan/spec/source/test records outside this ticket; this audit is bounded to the cited adapter/judge/CLI/integration paths.

## Closure Recommendation

Close `ticket:20260528-local-narrative-llama-cpp-judge-adapter` for the fake-loopback adapter/config closure claim. Do not claim real Bonsai/model/runtime quality, real-runtime success, release readiness, production safety, hosted-provider support, model download/install behavior, or broad narrative safety from this ticket.

## Related Records

- `ticket:20260528-local-narrative-llama-cpp-judge-adapter`
- `audit:20260528-local-narrative-llama-cpp-judge-adapter-review`
- `evidence:20260528-local-narrative-llama-cpp-judge-adapter`
- `audit:20260528-local-narrative-judge-provider-contract-followup-review`
- `ticket:20260528-bonsai-4b-narrative-validation`
