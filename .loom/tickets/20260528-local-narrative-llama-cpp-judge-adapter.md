# Local Narrative llama.cpp Judge Adapter

ID: ticket:20260528-local-narrative-llama-cpp-judge-adapter
Type: Ticket
Status: closed
Created: 2026-05-28
Updated: 2026-05-28
Risk: high - this wires a real local model runtime into the narrative judge boundary and must preserve loopback-only, fail-closed, display-only behavior.
Priority: high - required before honest real Bonsai 4B narrative validation through the hybrid contract.
Depends On: ticket:20260528-local-narrative-judge-provider-contract

## Summary

Add a local-only `llama.cpp` server adapter for the narrative judge provider and explicit `/flight-learn` flags to configure it. The bounded closure claim is: a real loopback `llama.cpp` endpoint can be used as the optional local narrative judge provider through the existing veto-only contract, while remaining explicit, local-only, no-download, timeout/fallback-safe, and display-only.

Operator authorization captured 2026-05-28:

- Path: add judge adapter.
- Model authorization for later validation: use existing Bonsai 4B Q1_0 only; no new downloads.
- Runtime authorization: may start local `llama.cpp` servers on loopback only for authorized validation.

This ticket implements adapter/config plumbing and fake loopback tests. Real Bonsai 4B validation belongs to `ticket:20260528-bonsai-4b-narrative-validation` after this closes.

## Related Records

- `plan:20260528-flight-learn-4b-narrative-what-happened` - parent plan.
- `ticket:20260528-local-narrative-judge-provider-contract` - closed provider-interface/veto contract.
- `audit:20260528-local-narrative-judge-provider-contract-followup-review` - clear audit for fake-provider judge contract.
- `ticket:20260528-flight-learn-narrative-inbox-integration` - closed UI-consumption ticket.
- `ticket:20260528-bonsai-4b-narrative-validation` - blocked real 4B validation ticket this adapter should unblock.
- `src/flight-learn-llama-cpp-adapter.ts` - local loopback adapter source.
- `src/pi-extension.ts` - explicit `/flight-learn` flag plumbing.
- `src/flight-learn-llama-cpp-adapter.test.ts`, `src/pi-extension.test.ts` - likely tests.

## Scope

In scope:

- Add a `LocalNarrativeJudgeProvider` implementation backed by the existing local `llama.cpp` loopback HTTP transport.
- Add explicit config support for a judge URL/model/timeout/max-output-token shape without API keys, headers, hosted providers, model paths, proxies, automatic downloads, or runtime lifecycle management.
- Add explicit `/flight-learn` flags for judge configuration, leaving the visible command surface unchanged.
- Ensure narrative model output without judge config still fails closed, and configured judge acceptance can allow already fact-ID-verified narrative output.
- Preserve deterministic fallback, display-only semantics, proxy bypass, and loopback-only URL validation.
- Add fake loopback tests for accept/fallback, request shape/privacy, unsafe config rejection, proxy bypass where practical, and no persistence side effects.
- Record evidence and audit before closure.

Out of scope:

- Real Bonsai 4B runtime/corpus validation.
- Model downloads, installs, custom forks, hosted inference, non-loopback endpoints, telemetry, provider keys, or external APIs.
- Changing the judge verdict policy, deterministic verifier semantics, UI layout, visible top-level commands, storage/routing/artifact/rule/classifier behavior, or model output defaults.
- Claiming real judge/model quality, latency, JSON reliability, release readiness, or production safety.

Stop conditions:

- Stop if judge configuration requires secrets, provider keys, hosted URLs, model file paths in config, or non-loopback networking.
- Stop if the adapter would make same-model self-judge acceptance implicit/default instead of explicitly configured.
- Stop if real model validation becomes necessary to close this adapter ticket.

## Acceptance

- ACC-001: A local llama.cpp narrative judge adapter exists.
  - Evidence: source/tests show a `LocalNarrativeJudgeProvider` backed by `/v1/chat/completions`, using the bounded judge prompt/request and returning only model JSON for existing judge validation.
  - Audit: challenge whether the adapter can rewrite/route/store or bypass the judge contract.

- ACC-002: Config is explicit, local-only, and fail-closed.
  - Evidence: tests show disabled-by-default behavior, literal loopback-only HTTP URLs, no credentials/path/query/hosted/proxy/provider-key shapes, bounded model labels, timeout/max-token bounds, and deterministic fallback on missing runtime/provider errors.
  - Audit: challenge hidden hosted calls, proxy use, downloads, or implicit same-model judge behavior.

- ACC-003: `/flight-learn` flag plumbing is explicit and side-effect safe.
  - Evidence: tests show judge flags configure `judgeProvider` only when explicitly provided, accepted narrative can render through fake loopback judge, no-judge narrative still falls back, route/storage/artifact/rule/classifier behavior is unchanged.
  - Audit: challenge visible command surface, default changes, and persistence boundaries.

- ACC-004: Privacy and redaction boundaries are preserved.
  - Evidence: tests/source inspection show judge prompt/request sent to loopback includes redacted fact/candidate content only and no raw local paths, secrets, prompts, transcripts, provider keys, or raw error details.
  - Audit: challenge leakage through judge prompt, transport envelope, error messages, and artifacts.

- ACC-005: Validation/evidence/audit are recorded.
  - Evidence: focused tests, relevant integration tests, typecheck, build or justified omission, diff-check, evidence dossier, and audit; explicit statement that no real model quality is proven.

## Current State

Closed for fake-loopback adapter/config scope. Operator authorized adding the judge adapter, using only the existing Bonsai 4B for later real validation, and starting loopback-only `llama.cpp` servers for authorized validation. Source/test/evidence plumbing is complete: `src/flight-learn-llama-cpp-adapter.ts` now has a local loopback `LocalNarrativeJudgeProvider`, `src/pi-extension.ts` has explicit judge flags, and fake loopback tests prove accepted narrative display without persistence side effects. Initial audit `audit:20260528-local-narrative-llama-cpp-judge-adapter-review` returned `changes-needed` with `FIND-001`: prompt/transcript-looking generated text could reach the judge request. Follow-up fix rejects prompt/transcript-like generated display text before the judge is called and adds regression coverage. Evidence is recorded at `evidence:20260528-local-narrative-llama-cpp-judge-adapter`. Validation after fix passed: focused tests (3 files / 67 tests), `npm run typecheck`, `npm run build`, full tests (21 files / 142 tests), and `git diff --check`. Follow-up audit `audit:20260528-local-narrative-llama-cpp-judge-adapter-followup-review` returned `clear`. No real Bonsai/runtime validation was run in this ticket; that moves to `ticket:20260528-bonsai-4b-narrative-validation`.

## Journal

- 2026-05-28: Created after operator selected `Add judge adapter`, `Use existing 4B`, and `Yes, loopback only` in the unblock questionnaire. Starting bounded adapter/config implementation; no real model run in this ticket unless needed for local fake-loopback tests (not expected).
- 2026-05-28: Implemented explicit local narrative judge adapter/config flags and fake loopback coverage. Recorded `evidence:20260528-local-narrative-llama-cpp-judge-adapter`. Validation passed: focused tests (66), typecheck, build, full tests (141), and diff-check. Moved to review for audit.
- 2026-05-28: Initial audit `audit:20260528-local-narrative-llama-cpp-judge-adapter-review` returned `changes-needed` with `FIND-001`: prompt/transcript-like generated candidate text could be sent to the local judge request. Fixed by extending generated output unsafe checks to reject prompt/transcript-like text before judge invocation and adding a no-judge-call regression test. Re-ran focused tests (67), typecheck, build, full tests (142), and diff-check; all passed. Follow-up audit is next.
- 2026-05-28: Follow-up audit `audit:20260528-local-narrative-llama-cpp-judge-adapter-followup-review` returned `clear` for fake-loopback adapter/config scope. Closed ticket with explicit non-claims for real Bonsai/runtime/model quality, latency, JSON reliability, self-judge safety, and release readiness.
