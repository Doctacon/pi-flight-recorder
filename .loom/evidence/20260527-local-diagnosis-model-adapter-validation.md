# Local Diagnosis Model Adapter Validation

ID: evidence:20260527-local-diagnosis-model-adapter-validation
Type: Evidence Dossier
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Observed: 2026-05-27

## Related Records

- `ticket:20260527-local-diagnosis-model-adapter`
- `ticket:20260527-local-diagnosis-model-contract-harness`
- `research:20260527-local-diagnosis-model-runtime`
- `audit:20260527-local-diagnosis-model-adapter-review`
- `spec:flight-learn-inbox-ux` REQ-024 through REQ-029
- `spec:visible-command-surface`

## Source State Observed

Validation was refreshed in `/Users/crlough/Code/personal/pi-flight-recorder` after the second FIND-001 follow-up changed the adapter transport from bare/default transport to direct `node:http` loopback requests with an explicit proxy-empty `Agent`.

Observed adapter files:

- `src/flight-learn-llama-cpp-adapter.ts`
- `src/flight-learn-llama-cpp-adapter.test.ts`

The run also relied on the already-present contract harness files:

- `src/flight-learn-local-diagnosis-model.ts`
- `src/flight-learn-local-diagnosis-model.test.ts`

Raw command artifacts are stored under `.loom/evidence/artifacts/20260527-local-diagnosis-model-adapter-validation/`.

## Observations

### Focused adapter tests

Procedure:

```bash
npx vitest run src/flight-learn-llama-cpp-adapter.test.ts
```

Artifact: `.loom/evidence/artifacts/20260527-local-diagnosis-model-adapter-validation/focused-adapter-tests.txt`

Observed result:

```text
Test Files  1 passed (1)
Tests  11 passed (11)
```

The focused tests cover disabled-by-default behavior, explicit IPv4/IPv6 loopback calls, request shape, strict URL rejection, provider/API-key/proxy-shaped config rejection, timeout/abort use, failed runtime/HTTP/transport/oversize fallback, malformed model output fallback through the contract harness, validation helper behavior, and two FIND-001 regressions.

The FIND-001 regressions:

- Start a real loopback target server and a separate real loopback proxy server, set `HTTP_PROXY`/`http_proxy`/`HTTPS_PROXY`/`https_proxy`/`ALL_PROXY`/`all_proxy` to the proxy and clear `NO_PROXY`/`no_proxy` in-process, then invoke the adapter. The observed result was the target server received the request and the proxy server received zero requests.
- Spawn a child Node process with `NODE_OPTIONS=--use-env-proxy` and proxy variables present at process startup, import the real TypeScript adapter through `tsx`, and invoke the adapter against the real target server. The observed result was child exit code `0`, the target server received `POST /v1/chat/completions`, and the proxy server received zero requests.

Additional focused procedure:

```bash
NODE_OPTIONS=--use-env-proxy npx vitest run src/flight-learn-llama-cpp-adapter.test.ts
```

Artifact: `.loom/evidence/artifacts/20260527-local-diagnosis-model-adapter-validation/focused-adapter-tests-use-env-proxy.txt`

Observed result:

```text
Test Files  1 passed (1)
Tests  11 passed (11)
```

This reran the same proxy-regression coverage with Node process env-proxy support enabled. The child-process regression also sets proxy variables at the child process startup boundary rather than only mutating them in-process.

### Adapter plus contract harness tests

Procedure:

```bash
npx vitest run src/flight-learn-llama-cpp-adapter.test.ts src/flight-learn-local-diagnosis-model.test.ts
```

Artifact: `.loom/evidence/artifacts/20260527-local-diagnosis-model-adapter-validation/adapter-contract-tests.txt`

Observed result:

```text
Test Files  2 passed (2)
Tests  23 passed (23)
```

This observed the adapter running through the model-agnostic local diagnosis polish contract and the existing fake-provider validation suite.

### Typecheck

Procedure:

```bash
npm run typecheck
```

Artifact: `.loom/evidence/artifacts/20260527-local-diagnosis-model-adapter-validation/typecheck.txt`

Observed result: command exited successfully with `tsc --noEmit`.

### Build

Procedure:

```bash
npm run build
```

Artifact: `.loom/evidence/artifacts/20260527-local-diagnosis-model-adapter-validation/build.txt`

Observed result: command exited successfully with `npm run clean && tsc -p tsconfig.build.json`.

### Full test suite

Procedure:

```bash
npm test
```

Artifact: `.loom/evidence/artifacts/20260527-local-diagnosis-model-adapter-validation/full-test.txt`

Observed result:

```text
Test Files  21 passed (21)
Tests  120 passed (120)
```

The run emitted Node experimental SQLite warnings already present in the suite output; no test failure was observed.

### Source and package inspection

Procedure:

```bash
node --input-type=module <policy scan>
git diff -- package.json
```

Artifact: `.loom/evidence/artifacts/20260527-local-diagnosis-model-adapter-validation/source-package-inspection.txt`

Observed result:

```text
package.json runtime dependency count: 0
adapter policy scan passed: explicit proxy-empty node:http Agent present; direct agent assigned; no fetch/proxy dispatcher/subprocess/download/hosted-provider tokens found
adapter endpoint path, content-length, and response-size policy markers present
--- git diff -- package.json ---
```

The package diff section was empty. The source scan was limited to the adapter source and checked for direct `node:http` transport with `new Agent({ keepAlive: false, proxyEnv: {} })`, explicit use of that agent on the request, absence of bare/global fetch transport, absence of proxy dispatcher/proxy-agent wiring, absence of subprocess/download/runtime-lifecycle/hosted-provider token patterns, and required endpoint/response-size markers.

### Diff whitespace check

Procedure:

```bash
git diff --check
# plus no-index whitespace checks for the untracked adapter/test/evidence/ticket files in this worktree
```

Artifact: `.loom/evidence/artifacts/20260527-local-diagnosis-model-adapter-validation/git-diff-check.txt`

Observed result: command exited successfully with no whitespace errors.

## What This Shows

- `ticket:20260527-local-diagnosis-model-adapter#ACC-001` is supported by focused tests showing no runtime request without explicit enabled config.
- `ticket:20260527-local-diagnosis-model-adapter#ACC-002` is supported by focused tests rejecting non-loopback, hosted, credentialed, obfuscated loopback, provider-header/API-key/proxy-shaped, and model-path configs before the local request path; by request-shape assertions for `POST /v1/chat/completions` on the configured loopback URL; by the direct `node:http` source inspection with explicit proxy-empty `Agent`; and by the proxy-regression tests showing both in-process proxy-like environment variables and child-process startup proxy variables under `NODE_OPTIONS=--use-env-proxy` did not intercept the adapter request.
- `ticket:20260527-local-diagnosis-model-adapter#ACC-003` is supported by tests showing missing runtime/connection failure, HTTP error, timeout/abort, invalid transport, oversized response, and malformed model output fall back to deterministic diagnosis without raw error details in the harness result.
- `ticket:20260527-local-diagnosis-model-adapter#ACC-004` is supported by source/package inspection showing no package dependency change, no runtime dependency, and no subprocess/download/runtime-lifecycle tokens in the adapter source.
- `ticket:20260527-local-diagnosis-model-adapter#ACC-005` is supported by the focused tests, adapter+contract tests, typecheck, build, full test suite, source/package inspection, and diff whitespace check listed above.
- `audit:20260527-local-diagnosis-model-adapter-review#FIND-001` and `audit:20260527-local-diagnosis-model-adapter-followup-review#FIND-001` are addressed by replacing bare/default transport with direct `node:http` loopback transport using an explicit proxy-empty `Agent`, plus in-process and startup-env proxy regressions.

## What This Does Not Show

- This does not prove real Bonsai model quality, JSON reliability, latency, or local `llama.cpp` runtime compatibility; no real runtime or model was started.
- This does not prove UI integration or disclosure behavior; the ticket scope intentionally excludes UI integration.
- This does not prove an operator-controlled local `llama.cpp` server is benign; the explicitly configured local server remains part of the operator-managed runtime trust boundary.
- This does not replace audit. The ticket is moved back to review so a separate pass can challenge the FIND-001 fix, SSRF/locality assumptions, fallback behavior, package footprint, and scope boundaries.
- The source scan is a targeted inspection, not a formal static-analysis proof over all possible future changes.
