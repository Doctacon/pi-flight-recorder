# Local Diagnosis Model Adapter Second Follow-up Review

ID: audit:20260527-local-diagnosis-model-adapter-second-followup-review
Type: Audit
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Audited: 2026-05-27
Target: ticket:20260527-local-diagnosis-model-adapter

## Summary

A second follow-up Ralph review audited the explicit proxy-empty `node:http` Agent fix for FIND-001. The reviewer found no remaining findings and returned verdict `clear`.

## Findings

None.

## Correctness Notes

- `src/flight-learn-llama-cpp-adapter.ts` creates `new Agent({ keepAlive: false, proxyEnv: {} })` and passes that agent into every adapter `httpRequest`.
- Loopback validation remains strict: literal `127.0.0.1` / `[::1]`, HTTP-only, no credentials, no path/query/hash, plus endpoint revalidation for `/v1/chat/completions`.
- Startup proxy regression is present and meaningful: a child process starts with `NODE_OPTIONS=--use-env-proxy` plus proxy variables at process startup, then asserts the target receives one request while the proxy receives none.
- The reviewer reran `NODE_OPTIONS=--use-env-proxy npx vitest run src/flight-learn-llama-cpp-adapter.test.ts`, observing `11 passed`.
- The reviewer also ran an independent Node probe showing default `http.request` under startup env-proxy hit the proxy, while explicit `new Agent({ proxyEnv: {} })` hit the target directly.

## Acceptance Assessment

- ACC-001: supported by disabled-by-default tests.
- ACC-002: supported by strict URL/config rejection and proxy-bypass tests.
- ACC-003: supported by timeout/fallback/error handling tests.
- ACC-004: supported by no runtime dependency/package diff and no install/download/runtime lifecycle path.
- ACC-005: supported by focused tests, adapter+contract tests, typecheck, build, full suite, source/package scan, and diff check evidence.

## Verdict

`clear`

## Required Follow-up

None from this audit. Ticket closure remains a parent/orchestrator decision after reconciliation.

## Residual Risk

- Operator-configured local `llama.cpp` server remains trusted and could forward data elsewhere.
- Real Bonsai/`llama.cpp` model quality, latency, JSON reliability, and UI disclosure remain unvalidated by this ticket.

## Related Records

- `ticket:20260527-local-diagnosis-model-adapter`
- `audit:20260527-local-diagnosis-model-adapter-review`
- `audit:20260527-local-diagnosis-model-adapter-followup-review`
- `evidence:20260527-local-diagnosis-model-adapter-validation`
