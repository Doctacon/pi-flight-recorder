# Local Diagnosis Model Adapter Follow-up Review

ID: audit:20260527-local-diagnosis-model-adapter-followup-review
Type: Audit
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Audited: 2026-05-27
Target: ticket:20260527-local-diagnosis-model-adapter

## Summary

A follow-up Ralph review challenged the FIND-001 fix that replaced bare `fetch` with direct `node:http`. The review found the blocker still unresolved: under Node 24 process-level proxy mode (`NODE_OPTIONS=--use-env-proxy`) with proxy variables present at process startup, `http.request` can also use the environment proxy unless explicitly bypassed.

## Findings

### FIND-001: Process-level proxy path still not fail-closed

Severity: blocker.

The adapter now calls `httpRequest(parsedEndpoint, { method, headers, signal })`, but it does not supply an explicit proxy-bypassing agent or otherwise fail closed. The reviewer reproduced that, when `HTTP_PROXY` and `NODE_OPTIONS=--use-env-proxy` are set at process startup, adapter-style `http.request` sends the POST to the proxy rather than the loopback target.

The current regression test sets proxy environment variables in-process, which does not reproduce the startup-env proxy mode that triggered the original finding. The evidence overclaims coverage by combining in-process env changes with a `NODE_OPTIONS=--use-env-proxy` test run.

## Verdict

`changes-needed` - ACC-002 and ACC-005 remain unsupported until the adapter explicitly bypasses or fail-closes process-level proxy behavior.

## Required Follow-up

- Explicitly bypass Node env proxy behavior for this adapter transport, or fail closed when process-level proxy configuration could affect the request.
- Add a regression that starts the test process or a child process with `NODE_OPTIONS=--use-env-proxy` and proxy environment variables already set, proving the target receives the request and proxy receives neither request nor CONNECT.
- Refresh evidence wording and validation after the fix.

## Residual Risk

- Even after proxy bypass, an explicitly configured local `llama.cpp` server remains operator-trusted and could itself forward data elsewhere.
- Real Bonsai/`llama.cpp` quality, latency, and JSON reliability remain unproven.

## Related Records

- `audit:20260527-local-diagnosis-model-adapter-review` - original proxy finding.
- `ticket:20260527-local-diagnosis-model-adapter` - consuming ticket.
- `evidence:20260527-local-diagnosis-model-adapter-validation` - needs another refresh after a real proxy bypass/fail-closed fix.
