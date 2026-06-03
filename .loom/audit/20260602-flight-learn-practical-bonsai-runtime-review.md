# Flight Learn Practical Bonsai Runtime Review

ID: audit:20260602-flight-learn-practical-bonsai-runtime-review
Type: Audit
Status: recorded
Created: 2026-06-02
Updated: 2026-06-02
Audited: 2026-06-02
Target: ticket:20260602-flight-learn-practical-bonsai-runtime

## Summary

Ralph reviewed the practical Bonsai runtime ticket, source diff, docs, and evidence for local-first/privacy, subprocess safety, deterministic fallback, cleanup, scope, and evidence fit. The first pass found three closure blockers; after fixes, the follow-up Ralph pass returned `clear` with no material remaining findings in scope.

## Target

The target is `ticket:20260602-flight-learn-practical-bonsai-runtime`, which adds explicit `/flight-learn --bonsai` / `--local-model-bonsai` command-scoped Bonsai local model startup through an operator-installed `llama-server` and local GGUF file.

Reviewed source and records include:

- `src/flight-learn-bonsai-runtime.ts`
- `src/flight-learn-bonsai-runtime.test.ts`
- `src/pi-extension.ts`
- `src/pi-extension.test.ts`
- `README.md`
- `docs/first-run.md`
- `docs/live-monitoring.md`
- `.loom/specs/flight-learn-inbox-ux.md`
- `.loom/evidence/20260602-flight-learn-practical-bonsai-runtime.md`
- `.loom/evidence/artifacts/20260602-flight-learn-practical-bonsai-runtime/`

## Audit Scope And Lenses

Scope:

- verify the ticket's acceptance and evidence story;
- challenge local-first/privacy boundaries;
- challenge command/subprocess safety;
- verify no downloads, installs, hosted calls, provider keys, or proxy paths are introduced;
- check deterministic fallback and cleanup behavior;
- check docs/help and scope consistency.

Out of scope:

- global Bonsai model quality;
- operator comprehension validation;
- release-readiness for all Flight Recorder behavior;
- long-running/shared daemon design.

## Context And Evidence Reviewed

- Ralph review run 1: `.loom/evidence/artifacts/20260602-flight-learn-practical-bonsai-runtime/06-ralph-review-output.md` - initial adversarial pass that found three issues.
- Ralph review run 2: `.loom/evidence/artifacts/20260602-flight-learn-practical-bonsai-runtime/07-ralph-followup-review-output.md` - follow-up pass over fixes and updated evidence.
- `evidence:20260602-flight-learn-practical-bonsai-runtime` - validation dossier for typecheck, focused/full tests, build, real Bonsai smoke, listener cleanup, diff check, and privacy scan.
- `01-real-bonsai-command-runtime-smoke.json` - real cached Bonsai 1.7B command-scoped smoke summary.
- `02-listener-cleanup.txt` - no remaining listener on the smoke port.
- `04-validation-summary.json` - typecheck/focused tests/full tests/build/diff-check/smoke summary.
- `05-privacy-scan.json` - privacy scan with zero findings.

## Findings

None - no material remaining findings within the final audited scope.

Initial Ralph findings and disposition:

- Prior FIND-001, alias documentation mismatch: resolved. `--local-model-bonsai` is implemented and documented in Pi help, README, first-run docs, and live-monitoring docs.
- Prior FIND-002, inherited environment privacy risk: resolved. The spawned `llama-server` now receives a sanitized environment allowlist, and tests verify provider-secret/proxy variables are not present in the child.
- Prior FIND-003, missing-runtime/startup evidence gap: resolved. Tests now cover missing model, missing runtime command, never-healthy startup timeout, and cleanup/fallback behavior.

## Verdict

`clear` within audited scope.

The follow-up Ralph review found the implementation aligned with the ticket: explicit opt-in only, local GGUF file, fixed no-shell argv, literal loopback host, sanitized child environment, deterministic fallback, command-scoped cleanup, existing hard-safety display gate, updated help/docs, and evidence proportional to the closure claim.

This verdict does not claim operator comprehension, broad Bonsai quality, or release readiness outside the scoped ticket.

## Required Follow-up

No implementation follow-up is required for the audited ticket before closure.

The ticket should still record closure state and residual risks, especially that real Bonsai evidence is one synthetic smoke and that binary/PATH trust remains operator-owned unless a specific `--llama-server-bin` path is supplied.

## Residual Risk

- Real Bonsai evidence is a one-case synthetic smoke, not operator comprehension validation or broad model-quality proof.
- The command-scoped port is reserved and then released before the child binds it; a local-only port race remains theoretically possible.
- Bare `llama-server` trusts the operator's PATH/chosen executable. Fixed argv, no shell interpolation, and sanitized environment reduce risk, but binary identity remains operator-owned.
- This audit does not inspect every unrelated dirty workspace file.

## Related Records

- `ticket:20260602-flight-learn-practical-bonsai-runtime` - consuming ticket.
- `evidence:20260602-flight-learn-practical-bonsai-runtime` - validation dossier.
- `spec:flight-learn-inbox-ux#REQ-057` and `spec:flight-learn-inbox-ux#REQ-058` - intended practical Bonsai behavior.
