# Flight Learn Practical Bonsai Runtime

ID: ticket:20260602-flight-learn-practical-bonsai-runtime
Type: Ticket
Status: closed
Created: 2026-06-02
Updated: 2026-06-02
Risk: medium - adds an explicit local subprocess lifecycle around optional model copy while preserving local-only and fallback safety boundaries
Priority: high - operator asked to make the Bonsai path usable in practice after the hard-safety gate worked

## Summary

Make the Bonsai local-model path usable from `/flight-learn` without requiring the operator to manually start a loopback `llama-server` each time. The bounded closure claim is: an explicit Bonsai flag can launch an operator-installed `llama-server` against a local PrismML Bonsai GGUF file on `127.0.0.1`, use the existing hard-safety local-model display gate for the first inbox card, then clean up the spawned process, while missing model/runtime/startup failures fall back to deterministic wording.

This ticket extends the closed hard-safety Bonsai ticket. It does not add downloads, installs, hosted calls, top-level commands, persistent model settings, or any model authority over routing/storage/artifacts/source/Loom/rules/skills/prompts/classifier behavior.

## Related Records

- `spec:flight-learn-inbox-ux` - owns `/flight-learn` model-copy UX, opt-in local-only behavior, and no-download/no-hosted safety boundaries.
- `ticket:20260602-flight-learn-hard-safety-bonsai-comprehension` - closed the hard-safety-only card-copy gate and proved one cached Bonsai 1.7B loopback smoke.
- `evidence:20260602-flight-learn-hard-safety-bonsai-comprehension` - records the cached Bonsai 1.7B smoke and non-claims this ticket now builds on.
- `research:20260527-local-diagnosis-model-runtime` - selected Bonsai GGUF through `llama.cpp`; its old no-lifecycle-management recommendation is superseded only for this explicit operator-requested Bonsai flag, not for downloads/installs or default behavior.

## Scope

In scope:

- Add an explicit recoverable `/flight-learn` option such as `--bonsai` / `--local-model-bonsai` that starts a local `llama-server` subprocess for the current command.
- Use only a local GGUF file, defaulting to the cached PrismML Bonsai 1.7B Q1_0 path under the user's cache directory when no `--bonsai-model-path` is supplied.
- Allow an operator-provided `llama-server` binary path/command name via CLI flag or environment variable; do not install, build, download, or update runtime binaries.
- Bind only to literal loopback `127.0.0.1` on an ephemeral port, then reuse the existing loopback HTTP adapter and hard-safety validator.
- Stop/kill the spawned server after the `/flight-learn` review command completes or falls back.
- Keep manual `--local-model-polish --local-model-url http://127.0.0.1:PORT` behavior working.
- Update help/status text, tests, and the inbox spec so future agents understand the practical Bonsai path.

Out of scope:

- No model or runtime download/install/upgrade/setup script invocation.
- No hosted providers, non-loopback URLs, LAN/public binding, provider headers, API keys, or proxy behavior.
- No automatic default model calls without an explicit flag.
- No broad replay matrix or model shopping.
- No persistent daemon, background model server shared across sessions, or settings migration in this slice.
- No storage/routing/artifact/source/Loom/rule/skill/prompt/classifier side effects from model output.

Stop conditions:

- If implementation requires installing/downloading a runtime/model or using hosted services, stop and block.
- If `llama-server` CLI flags needed for a real run cannot be used without unsafe shell/string interpolation, stop and simplify.
- If startup lifecycle cannot be tested without leaking raw paths/logs into evidence, record a narrower fake-runtime proof and leave real smoke unclaimed.

## Acceptance

- ACC-001: `/flight-learn --bonsai` and `/flight-learn --local-model-bonsai` are documented option paths that enable Bonsai local model phrasing without requiring `--local-model-url`; manual URL configuration remains supported.
  - Evidence: focused Pi extension tests and help/status text inspection.
  - Audit: closure should check the visible command surface remains `/flight-status` and `/flight-learn` only.

- ACC-002: The Bonsai path starts only an operator-installed local `llama-server` command against a local GGUF model file, with fixed argv arguments, no shell interpolation, literal `127.0.0.1`, and no downloads/installs/hosted calls.
  - Evidence: unit/fake-runtime tests inspect the spawned argv/request shape; source inspection covers no download/install paths.
  - Audit: challenge local-first/privacy and command-injection boundaries.

- ACC-003: Missing model file, missing runtime, startup failure, timeout, or invalid model output produce deterministic fallback wording and do not interrupt route/observe/dismiss/skip review.
  - Evidence: focused tests for missing model/runtime/startup fallback and existing local-model fallback tests.
  - Audit: challenge whether fallback hides raw process errors or leaks raw paths.

- ACC-004: The spawned Bonsai runtime is cleaned up when the command completes, including after custom UI cancellation/fallback paths.
  - Evidence: fake-runtime test observes process exit or cleanup hook; optional listener check if a real smoke is run.
  - Audit: challenge process leaks and hanging tests.

- ACC-005: The existing hard-safety display gate and no-side-effect guarantees still hold for model-rendered copy.
  - Evidence: focused tests for adapter/local diagnosis/extension plus typecheck/build/full tests as practical.
  - Audit: separate Ralph audit is preferred unless the operator keeps the prior instruction to avoid heavyweight review; if skipped, record why.

## Current State

Closed. `/flight-learn --bonsai` and alias `/flight-learn --local-model-bonsai` now start an operator-installed `llama-server` subprocess for the current command against a local PrismML Bonsai GGUF file, defaulting to `~/.cache/pi-flight-recorder/bonsai/Bonsai-1.7B-Q1_0.gguf`. The subprocess is launched with fixed argv, `shell: false`, literal `127.0.0.1`, a sanitized environment allowlist, and command-scoped cleanup. Missing model, missing runtime command, never-healthy startup, provider errors, timeouts, malformed/unsafe output, and other invalid local-model cases fall back to deterministic wording.

Manual `--local-model-polish --local-model-url http://127.0.0.1:PORT` remains supported. No model/runtime downloads, installs, hosted calls, non-loopback endpoints, provider keys, proxy paths, top-level commands, persistent daemon, storage/routing/artifact/source/Loom/rule/skill/prompt/classifier side effects, or default model calls were added.

Evidence `evidence:20260602-flight-learn-practical-bonsai-runtime` records typecheck, focused tests, full tests, build, scoped diff check, privacy scan, fake-runtime lifecycle coverage, real cached Bonsai 1.7B command-scoped smoke, and listener cleanup. Audit `audit:20260602-flight-learn-practical-bonsai-runtime-review` is clear after the initial findings were resolved. Residual risks remain explicit: real Bonsai proof is one synthetic smoke, command-scoped port reservation has a theoretical local race, and bare `llama-server` trusts the operator's PATH/chosen binary unless a specific `--llama-server-bin` is supplied.

## Journal

- 2026-06-02: Created ticket with Status `active` from the operator's request to make Bonsai practical. Scope is explicit command-time local `llama-server` startup only; no downloads, installs, hosted calls, or default model calls.
- 2026-06-02: Implemented `src/flight-learn-bonsai-runtime.ts`, added `/flight-learn --bonsai` / `--local-model-bonsai` integration, updated help/docs/spec/research freshness notes, and added fake-runtime plus Pi extension tests.
- 2026-06-02: Gathered evidence in `evidence:20260602-flight-learn-practical-bonsai-runtime`: typecheck, focused tests, full tests, build, scoped diff check, privacy scan, real cached Bonsai command-scoped smoke, and listener cleanup.
- 2026-06-02: Initial Ralph review found three issues: alias documentation mismatch, inherited child environment, and missing-runtime/startup evidence gap. Fixed all three by documenting the alias, sanitizing subprocess environment, and adding missing command / never-healthy startup tests.
- 2026-06-02: Follow-up Ralph audit `audit:20260602-flight-learn-practical-bonsai-runtime-review` returned clear. Closed ticket with residual risks documented.
