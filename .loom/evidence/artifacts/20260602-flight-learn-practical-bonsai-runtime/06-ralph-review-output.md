## Reviewed Context

- Ticket/evidence: `.loom/tickets/20260602-flight-learn-practical-bonsai-runtime.md`, `.loom/evidence/20260602-flight-learn-practical-bonsai-runtime.md`, `04-validation-summary.json`, `01-real-bonsai-command-runtime-smoke.json`.
- Spec: `spec:flight-learn-inbox-ux` REQ-057/REQ-058 and SCN-020 (`.loom/specs/flight-learn-inbox-ux.md:139-140`, `:352-362`).
- Source/tests/diff: `src/flight-learn-bonsai-runtime.ts`, `src/flight-learn-bonsai-runtime.test.ts`, `src/pi-extension.ts`, `src/pi-extension.test.ts`, and scoped git diff.

## Findings

### FIND-001: `--local-model-bonsai` is implemented but not documented as acceptance claims

`ticket:20260602-flight-learn-practical-bonsai-runtime#ACC-001` requires both `/flight-learn --bonsai` and `/flight-learn --local-model-bonsai` to be documented (`.loom/tickets/20260602-flight-learn-practical-bonsai-runtime.md:53-55`), and the evidence claims support for both (`.loom/evidence/20260602-flight-learn-practical-bonsai-runtime.md:61`). The alias is implemented in argument parsing (`src/pi-extension.ts:814-815`), but the Pi help only documents `--bonsai` (`src/pi-extension.ts:351-357`), and grep across docs/source found no user-facing `--local-model-bonsai` mention outside spec/ticket/evidence/source parsing. Acceptance/evidence are overstated unless the alias is documented or ACC-001 is narrowed.

### FIND-002: Spawned runtime inherits the full parent environment

`startBonsaiLocalDiagnosisRuntime` spawns the operator-provided `llama-server` with fixed argv and `shell: false`, which is good, but it does not set `env`, so Node will inherit the full Pi/agent process environment by default (`src/flight-learn-bonsai-runtime.ts:73-77`). That can expose unrelated provider keys, tokens, proxy settings, or other secrets to the local model subprocess, even though the runtime does not need them. This weakens the local-first/privacy boundary and the evidence claim that there is no provider-key/proxy path (`.loom/evidence/20260602-flight-learn-practical-bonsai-runtime.md:62`).

### FIND-003: Missing-runtime/startup-failure evidence is thinner than ACC-003 states

ACC-003 explicitly covers missing runtime and startup failure fallback (`.loom/tickets/20260602-flight-learn-practical-bonsai-runtime.md:61-63`). The new runtime test covers a missing model file (`src/flight-learn-bonsai-runtime.test.ts:188-205`) and the source has a startup catch/fallback path (`src/flight-learn-bonsai-runtime.ts:83-87`), but there is no direct test for command-not-found, a `llama-server` process that never becomes healthy, or cleanup after that startup-timeout path. The implementation appears intended to handle this, but evidence should not claim full missing-runtime/startup coverage yet.

## Verdict

changes-needed

The implementation is directionally aligned with the ticket: explicit opt-in, local file path, fixed no-shell argv, literal loopback, existing hard-safety gate, deterministic fallback path, and command-scoped cleanup are all present. However, closure would overstate acceptance until the alias documentation mismatch is fixed or scoped down, the subprocess environment privacy risk is addressed or explicitly accepted, and missing-runtime/startup-failure evidence is tightened.

## Required Follow-up

1. Either document `/flight-learn --local-model-bonsai` in the help/docs or revise ACC-001/evidence to claim only `--bonsai` as documented.
2. Spawn `llama-server` with a minimal/sanitized environment, or explicitly record that the operator-installed runtime is trusted with the parent environment and accept that privacy risk with authority.
3. Add focused fake-runtime coverage for command-not-found and/or never-healthy startup timeout cleanup, or narrow ACC-003/evidence to the fallback cases actually observed.

## Residual Risk

- Real Bonsai smoke is one synthetic case; it does not prove operator comprehension or broad model quality.
- The command-scoped port is reserved then released before child bind; a local port race could still route a request to the wrong loopback process, though the risk is local-only and likely low.
- Using bare `llama-server` remains PATH-trust of an operator-installed executable; fixed argv/no-shell reduces injection risk but does not verify binary identity.
