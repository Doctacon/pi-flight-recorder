# Narrative Fact-ID Contract Verifier Narrowed-Scope Review

ID: audit:20260528-narrative-fact-id-contract-verifier-narrowed-scope-review
Type: Audit
Status: recorded
Created: 2026-05-28
Updated: 2026-05-28
Audited: 2026-05-28
Target: ticket:20260528-narrative-fact-id-contract-verifier
Follows: audit:20260528-narrative-fact-id-contract-verifier-third-followup-review

## Summary

Narrowed-scope closure audit found no material blockers within the explicitly narrowed deterministic hard-literal scope. The ticket and evidence now visibly stop claiming broad semantic action/classifier safety, route the remaining spaced `follow up` and bucket/classifier paraphrases to the dependent local judge provider ticket, and preserve the non-claim that real model/judge quality and full hybrid safety are unproven.

## Target

Reviewed `ticket:20260528-narrative-fact-id-contract-verifier` after the coordinator narrowed ACC-003 and evidence following `audit:20260528-narrative-fact-id-contract-verifier-third-followup-review`. The target is the fact-ID packet, generator prompt/schema, deterministic verifier, local-first adapter/fake-provider integration, evidence dossier, and closure posture for ACC-001 through ACC-005.

This audit does not review or implement the dependent local judge provider, real Bonsai/llama.cpp behavior, model quality, UI release readiness, or full spec-level narrative safety after judge integration.

## Audit Scope And Lenses

Lenses used:

- acceptance: whether ACC-001 through ACC-005 close under the narrowed ACC-003 wording;
- claim and evidence: whether ticket/evidence overclaim broad semantic safety, real model quality, or judge quality;
- research/spec compatibility: whether the narrowing matches the researched hybrid architecture and remains honest against `spec:flight-learn-inbox-ux` constraints;
- security and trust boundary: bounded redacted facts, raw path/secret/prompt/transcript/command hard-literal checks, local-first behavior, and display-only/no-mutation behavior;
- follow-through: whether spaced `follow up` and bucket/classifier paraphrases are documented residual risk rather than hidden failures.

Out of scope: source edits, regex expansion, local judge implementation, artifact-writing harness reruns, real local model runs, and UI screenshot validation.

## Context And Evidence Reviewed

- Ralph review run: this narrowed-scope adversarial review subagent, bounded to source/tests/records/probes and no source edits.
- `.loom/tickets/20260528-narrative-fact-id-contract-verifier.md` - narrowed scope, ACC-001 through ACC-005, current state, and journal.
- `.loom/evidence/20260528-narrative-fact-id-contract-verifier.md` - command evidence, narrowed claims, audit follow-up, and non-claims.
- `.loom/audit/20260528-narrative-fact-id-contract-verifier-review.md` through `.loom/audit/20260528-narrative-fact-id-contract-verifier-third-followup-review.md` - prior findings and narrowed-scope recommendation.
- `.loom/research/20260528-local-narrative-judge-validation.md` - hybrid architecture, rejected regex-whack-a-mole path, fact-ID-only limits, and dependent judge recommendation.
- `.loom/specs/flight-learn-inbox-ux.md` REQ-024 through REQ-032 - optional local-model privacy, local-first, structured validation, display-only, and fallback requirements.
- `.loom/tickets/20260528-local-narrative-judge-provider-contract.md` - dependent residual-risk owner for sentence support, unsafe/action-advice, uncertainty, and veto-only behavior.
- `.loom/evidence/artifacts/20260528-narrative-fact-id-contract-verifier/run-fact-id-contract-harness.mjs`, `harness-summary.json`, and `fact-id-contract-harness-results.json` - recorded 18/18 sanitized fake-provider harness results; not rerun because the harness writes artifact JSON.
- `src/flight-learn-local-diagnosis-model.ts` - fact packet, prompt, schema verifier, hard-safety literals, fallback/no-mutation behavior.
- `src/flight-learn-local-diagnosis-model.test.ts` - focused fact-ID, privacy, hard-safety, fallback, timeout/error, and no-mutation tests.
- `src/flight-learn-llama-cpp-adapter.ts` and `src/flight-learn-llama-cpp-adapter.test.ts` - literal-loopback adapter behavior and fake local runtime tests.
- `src/pi-extension.test.ts` - fake Pi local-model display/no-persistence integration.

Commands run from `/Users/crlough/Code/personal/pi-flight-recorder`:

```bash
git status --short && git diff --name-only && git diff --stat && git diff --check
```

Result: `git diff --check` passed with no output. Tracked source/test/spec diffs remain present, and the Loom records/artifacts for this work stream are untracked.

```bash
npm test -- src/flight-learn-local-diagnosis-model.test.ts src/flight-learn-llama-cpp-adapter.test.ts src/pi-extension.test.ts
npm run typecheck
```

Result: Vitest passed, `3` files / `60` tests; `tsc --noEmit` passed.

Small no-write fake-provider probes with `node --import tsx` confirmed the residual boundary: `This belongs with validation follow up.` and `The issue maps to a validation bucket.` are still accepted, while `This should be routed to validation follow-up.` and `Pi saw tsx src/cli.ts fail twice from the stale shell.` fail closed as `unsafe-output`.

## Findings

None - no material findings within the narrowed deterministic hard-literal scope.

Correct observations supporting closure:

- The narrowing is visible and honest. The ticket now says this is only the generator/fact-ID and deterministic-verifier half of the hybrid architecture and must not claim real model quality or semantic grounding proof (`.loom/tickets/20260528-narrative-fact-id-contract-verifier.md:13-15`). ACC-003 explicitly narrows to deterministic malformed/uncited/unknown/overlong/duplicate/hard-unsafe/explicit display-only/timeout/provider-error cases, and states that spaced `follow up`, bucket-fit semantics, and other route/classifier-adjacent paraphrases are not claimed here (`.loom/tickets/20260528-narrative-fact-id-contract-verifier.md:76-78`). The current state and journal repeat that the remaining variants are semantic and owned by the dependent judge provider (`.loom/tickets/20260528-narrative-fact-id-contract-verifier.md:90`, `.loom/tickets/20260528-narrative-fact-id-contract-verifier.md:100`).
- The narrowing is compatible with the research direction. The research rejects continued regex/token semantic expansion as the primary validator and keeps regex only for hard raw-detail/schema/literal safety (`.loom/research/20260528-local-narrative-judge-validation.md:80`, `.loom/research/20260528-local-narrative-judge-validation.md:120`). It also says fact IDs are a strong deterministic handle but insufficient by themselves because a sentence can cite a real fact while adding unsupported bridges or action advice (`.loom/research/20260528-local-narrative-judge-validation.md:90`, `.loom/research/20260528-local-narrative-judge-validation.md:124`), then recommends deterministic fact-ID verification followed by a local judge veto (`.loom/research/20260528-local-narrative-judge-validation.md:130-139`, `.loom/research/20260528-local-narrative-judge-validation.md:268-278`).
- ACC-001 closes in the reviewed fact-packet/model-input scope. Source exposes versioned support facts with stable IDs (`F1`-`F9`, `F10+`, `F20/F21+`) and bounded counts/chars (`src/flight-learn-local-diagnosis-model.ts:70-92`, `src/flight-learn-local-diagnosis-model.ts:478-551`). Tests assert bounded packet version/counts, fact IDs, max fact chars, redaction/omission for paths/secrets/prompts/transcripts/stack traces, and omitted full snippets (`src/flight-learn-local-diagnosis-model.test.ts:345-388`, `src/flight-learn-local-diagnosis-model.test.ts:390-422`).
- ACC-002 closes. The prompt requires `schemaVersion: 2` and `whatHappened.sentences[].text + factIds`, while stating fact IDs are support handles and not entailment proof (`src/flight-learn-local-diagnosis-model.ts:554-566`). The verifier rejects top-level extra keys, missing schema version, string `whatHappened`, extra `whatHappened`/sentence fields, empty/unknown/duplicate/excessive fact IDs, and multi-sentence objects (`src/flight-learn-local-diagnosis-model.ts:689-718`, `src/flight-learn-local-diagnosis-model.ts:744-808`). Tests cover accepted fact-cited narrative plus string/uncited/unknown/extra-role/duplicate/excessive IDs (`src/flight-learn-local-diagnosis-model.test.ts:145-208`).
- ACC-003 closes under the narrowed hard-literal scope. Source has deterministic privacy/path/command/display-only patterns (`src/flight-learn-local-diagnosis-model.ts:179-218`), narrative length/sentence/fact-ID validation (`src/flight-learn-local-diagnosis-model.ts:744-808`), malformed/empty fallback (`src/flight-learn-local-diagnosis-model.ts:689-718`), provider timeout/error fallback (`src/flight-learn-local-diagnosis-model.ts:572-601`, `src/flight-learn-local-diagnosis-model.ts:621-645`), and display-only no-mutation application (`src/flight-learn-local-diagnosis-model.ts:674-685`). Tests cover raw command families including `npm`, `git`, `python`, `make`, `node`, `ls`, `curl`, `tsx`, `duckdb`, `vite`, and `deno`; raw path/secret/redaction placeholders; explicit route/routed/routing/follow-up/action/mutation/classifier/ranking literals; fact-packet echo; overlong narratives; provider errors/timeouts; request-copy mutation; and deterministic fallback (`src/flight-learn-local-diagnosis-model.test.ts:211-278`, `src/flight-learn-local-diagnosis-model.test.ts:299-340`, `src/flight-learn-local-diagnosis-model.test.ts:504-648`, `src/flight-learn-local-diagnosis-model.test.ts:650-682`). The recorded harness has 18/18 passing exercises and includes accepted narrative, schema/fact-ID failures, unsafe literal families, duplicate deterministic output, provider error, and timeout (`.loom/evidence/artifacts/20260528-narrative-fact-id-contract-verifier/fact-id-contract-harness-results.json`).
- ACC-004 closes in fake-provider/local-first scope. The adapter is disabled unless explicitly configured, only allows literal IPv4/IPv6 loopback HTTP authorities, rejects credentials/path/query/hosted URLs, uses a direct proxy-bypassing HTTP agent, and requires fact packet version `2` (`src/flight-learn-llama-cpp-adapter.ts:47-103`, `src/flight-learn-llama-cpp-adapter.ts:275-281`). Adapter tests cover loopback JSON calls, proxy bypass, hosted/non-loopback/credential/path/query rejection, unsafe config shapes, and validation helpers (`src/flight-learn-llama-cpp-adapter.test.ts:317-366`, `src/flight-learn-llama-cpp-adapter.test.ts:371-421`, `src/flight-learn-llama-cpp-adapter.test.ts:448-516`, `src/flight-learn-llama-cpp-adapter.test.ts:622-628`). Pi integration tests show accepted local-model wording is displayed with disclosure and not persisted into stored delta summaries or artifact drafts (`src/pi-extension.test.ts:653-740`).
- ACC-005 closes. The evidence records focused tests, adapter/Pi tests, harness, typecheck, and diff-check (`.loom/evidence/20260528-narrative-fact-id-contract-verifier.md:54-95`, `.loom/evidence/20260528-narrative-fact-id-contract-verifier.md:171`). This audit re-ran the focused Vitest suite, `npm run typecheck`, and `git diff --check` successfully.
- Evidence does not overclaim real model or judge quality. It explicitly says no real model/runtime/download/hosted call/UI integration/storage/routing/classifier behavior was exercised (`.loom/evidence/20260528-narrative-fact-id-contract-verifier.md:35-39`), narrows ACC-003 to hard-literal verifier scope (`.loom/evidence/20260528-narrative-fact-id-contract-verifier.md:127`), and states it does not prove semantic entailment, Bonsai quality, local runtime behavior, or judge-provider behavior (`.loom/evidence/20260528-narrative-fact-id-contract-verifier.md:175-181`).
- The residual spaced `follow up`/bucket risk is documented rather than hidden. Evidence records that those paraphrases still pass and that the ticket now routes broader semantic action/classifier judgment to the dependent judge provider (`.loom/evidence/20260528-narrative-fact-id-contract-verifier.md:173-179`). The dependent ticket explicitly owns a local judge over fact-ID-verified candidate sentences, unsafe/action-advice/unsupported/uncertain failure modes, veto-only behavior, and compatibility with deterministic-verifier ordering (`.loom/tickets/20260528-local-narrative-judge-provider-contract.md:14-16`, `.loom/tickets/20260528-local-narrative-judge-provider-contract.md:32-37`, `.loom/tickets/20260528-local-narrative-judge-provider-contract.md:58-68`, `.loom/tickets/20260528-local-narrative-judge-provider-contract.md:74-80`).

## Verdict

`clear` for the narrowed ticket scope. ACC-001 through ACC-005 are close-ready when ACC-003 is read as deterministic schema/fact-ID/privacy/local-first/display-only hard-literal verification only, not broad semantic safety. The evidence and ticket are honest that full `spec:flight-learn-inbox-ux` REQ-032 narrative safety remains dependent on the local judge provider and later real-model validation.

## Required Follow-up

No required follow-up before closing `ticket:20260528-narrative-fact-id-contract-verifier` under the narrowed acceptance.

Before any claim of full hybrid narrative safety, full REQ-032 compliance for semantic route/action/classifier paraphrases, UI integration readiness, or real Bonsai/local-runtime behavior, the consuming plan must complete and audit `ticket:20260528-local-narrative-judge-provider-contract` and any later authorized real-model validation ticket.

## Residual Risk

- The current deterministic verifier still accepts spaced `follow up` and bucket/classifier paraphrases when they cite valid fact IDs; this audit's no-write probes confirmed that behavior. This is now an explicit residual risk and dependency, not a hidden ACC-003 failure.
- `spec:flight-learn-inbox-ux` still requires local-model `What happened?` narratives to avoid route advice, classifier/ranking claims, and unsupported concrete facts (`.loom/specs/flight-learn-inbox-ux.md:106-114`). The narrowed ticket may close as a prerequisite slice, but it must not be cited as full spec closure until the judge-provider path closes.
- The harness was not rerun in this audit because it writes artifact JSON; the recorded harness summary remains 18/18 (`.loom/evidence/artifacts/20260528-narrative-fact-id-contract-verifier/harness-summary.json`) and this audit re-ran the non-artifact focused tests/typecheck/diff-check.
- No real local model, real judge, latency, JSON reliability under real generations, or visual/UI quality was proven.

## Closure Recommendation

Close `ticket:20260528-narrative-fact-id-contract-verifier` as the narrowed deterministic fact-ID verifier prerequisite. Carry the residual semantic paraphrase risk into `ticket:20260528-local-narrative-judge-provider-contract`; do not claim full hybrid safety, release readiness, or broad REQ-032 semantic compliance from this ticket alone.

## Related Records

- `ticket:20260528-narrative-fact-id-contract-verifier` - audit target and narrowed ACC-001 through ACC-005.
- `evidence:20260528-narrative-fact-id-contract-verifier` - evidence dossier and harness artifacts.
- `audit:20260528-narrative-fact-id-contract-verifier-third-followup-review` - prior finding that led to the narrowing.
- `research:20260528-local-narrative-judge-validation` - source of the hybrid fact-ID + deterministic verifier + local judge architecture.
- `ticket:20260528-local-narrative-judge-provider-contract` - dependent owner of semantic action/classifier/judge-provider residual risk.
- `spec:flight-learn-inbox-ux` - full optional local-model narrative behavior contract.
