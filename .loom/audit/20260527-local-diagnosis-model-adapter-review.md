# Local Diagnosis Model Adapter Review

ID: audit:20260527-local-diagnosis-model-adapter-review
Type: Audit
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Audited: 2026-05-27
Target: ticket:20260527-local-diagnosis-model-adapter

## Summary

A Ralph reviewer audited the loopback `llama.cpp` adapter implementation and evidence. Most adapter constraints are supported, but the review found a blocker: the implementation uses bare `globalThis.fetch`, which can honor process-level proxy configuration under Node's `--use-env-proxy` mode and thereby tunnel a loopback request through a proxy.

## Target

- `ticket:20260527-local-diagnosis-model-adapter` ACC-001 through ACC-005.
- Source changes in `src/flight-learn-llama-cpp-adapter.ts` and tests.
- Evidence record `evidence:20260527-local-diagnosis-model-adapter-validation`.

## Audit Scope And Lenses

Lenses: security/trust boundary, SSRF/locality, dependency/tooling, acceptance, evidence sufficiency, fallback/error leakage.

In scope:

- Loopback-only URL validation and request path.
- Proxy/provider/API-key/header/download/runtime lifecycle holes.
- Fallback behavior and raw error leakage.
- Package/dependency footprint.
- Evidence support for acceptance claims.

Out of scope:

- Real Bonsai/`llama.cpp` runtime behavior, quality, latency, or JSON reliability.
- UI integration.

## Context And Evidence Reviewed

- Ralph review run: reviewer inspected the ticket, evidence record/artifacts, runtime research, contract harness ticket/audit, relevant specs, adapter source/test, harness source, `package.json`, source greps, and local proxy behavior probes.
- Focused tests and evidence artifacts were reviewed as acceptance support.

## Findings

### FIND-001: Process-level proxy path is not fail-closed

Severity: blocker.

The adapter validates literal loopback URLs and rejects proxy-shaped config keys, but it calls bare `globalThis.fetch(config.endpoint, ...)`. On Node 24, fetch can use process-level proxy configuration under `--use-env-proxy`; the reviewer reproduced `fetch("http://127.0.0.1:<port>/...")` tunneling through `HTTP_PROXY` when `NO_PROXY` is empty. This means a configured loopback URL can still send the bounded prompt/fact packet to a proxy process instead of directly to loopback.

Current tests only reject a `proxy` config key, not runtime/environment proxy behavior. This challenges ACC-002 and ACC-005 and overstates the evidence claim that proxy paths are rejected.

## Verdict

`changes-needed` - The adapter is close, but loopback-only execution cannot be trusted while bare fetch may honor process-level proxy settings.

## Required Follow-up

- Close the environment/process proxy hole before acceptance by either failing closed when Node/env proxy configuration could affect local model requests or using a transport/dispatcher that explicitly bypasses proxies for this adapter.
- Add regression test or evidence covering `HTTP_PROXY` / `--use-env-proxy` behavior or a direct-transport proxy-bypass equivalent.
- Narrow evidence wording so “proxy rejected” describes exactly what was tested.

## Residual Risk

- Even after direct proxy bypass, an operator-controlled local `llama.cpp` server can itself be malicious or proxy elsewhere; that remains operator-managed runtime trust.
- Real Bonsai/`llama.cpp` quality, latency, and JSON reliability remain unproven.

## Related Records

- `ticket:20260527-local-diagnosis-model-adapter` - consuming ticket.
- `evidence:20260527-local-diagnosis-model-adapter-validation` - validation evidence needing refresh after fix.
- `research:20260527-local-diagnosis-model-runtime` - runtime strategy and local-only constraints.
