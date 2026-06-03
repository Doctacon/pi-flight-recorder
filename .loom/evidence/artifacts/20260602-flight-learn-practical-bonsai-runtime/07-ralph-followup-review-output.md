## Reviewed Context

- Reviewed prior audit artifact `06-ralph-review-output.md`, including prior FIND-001 alias docs gap, FIND-002 inherited environment risk, and FIND-003 missing-runtime/startup evidence gap (`06-ralph-review-output.md:9-31`).
- Reviewed implementation and tests: `src/flight-learn-bonsai-runtime.ts`, `src/flight-learn-bonsai-runtime.test.ts`, and `src/pi-extension.ts`.
- Reviewed user-facing docs: `README.md`, `docs/first-run.md`, and `docs/live-monitoring.md`.
- Reviewed ticket/evidence and artifacts: `.loom/tickets/20260602-flight-learn-practical-bonsai-runtime.md`, `.loom/evidence/20260602-flight-learn-practical-bonsai-runtime.md`, artifacts `01`, `02`, `04`, `05`, and `06` under `.loom/evidence/artifacts/20260602-flight-learn-practical-bonsai-runtime/`.
- Reviewed scoped git diff for the requested paths.

## Findings

None — no material remaining findings within this follow-up scope.

Prior finding disposition:

- Prior FIND-001 appears resolved: `--local-model-bonsai` is now parsed (`src/pi-extension.ts:814-815`) and documented in Pi help (`src/pi-extension.ts:351-356`), README (`README.md:128-136`), first-run docs (`docs/first-run.md:122-130`), and live-monitoring docs (`docs/live-monitoring.md:113-115`). The evidence claim for ACC-001 is now consistent with docs/help (`.loom/evidence/20260602-flight-learn-practical-bonsai-runtime.md:61`).
- Prior FIND-002 appears resolved: `spawn()` now passes `env: sanitizedLlamaServerEnv()` (`src/flight-learn-bonsai-runtime.ts:73-78`), and the allowlist excludes provider/proxy variables (`src/flight-learn-bonsai-runtime.ts:161-168`). Tests inject `OPENAI_API_KEY` and `HTTP_PROXY` and assert they are absent from the child (`src/flight-learn-bonsai-runtime.test.ts:181-217`).
- Prior FIND-003 appears resolved: tests now cover missing model fallback (`src/flight-learn-bonsai-runtime.test.ts:233-250`), missing `llama-server` command fallback (`src/flight-learn-bonsai-runtime.test.ts:253-270`), and never-healthy startup timeout with SIGTERM/exit cleanup (`src/flight-learn-bonsai-runtime.test.ts:273-295`). The implementation falls back and stops the child on readiness failure (`src/flight-learn-bonsai-runtime.ts:83-88`, `src/flight-learn-bonsai-runtime.ts:254-267`).

Additional checks:

- Command startup remains local-only and no-shell: fixed argv uses local model path, `--host 127.0.0.1`, dynamic port, and context tokens (`src/flight-learn-bonsai-runtime.ts:148-158`); `spawn` uses `shell: false` (`src/flight-learn-bonsai-runtime.ts:73-78`).
- Command-scoped cleanup is wired through `/flight-learn` custom inbox path with `finally { await localDiagnosisPolish.cleanup(); }` (`src/pi-extension.ts:959-964`).
- Evidence artifacts support the updated claims: focused tests 36/36, full tests 137/137, typecheck/build passed (`04-validation-summary.json:1-8`); real Bonsai smoke passed without downloads/hosted use and records sanitized child environment (`01-real-bonsai-command-runtime-smoke.json:6-23`); listener cleanup passed (`02-listener-cleanup.txt:1`); privacy scan passed with zero findings (`05-privacy-scan.json:1-4`).

## Verdict

clear

The prior three findings are addressed by code, tests, documentation, and updated evidence. I did not identify new local-first, privacy, subprocess, cleanup, scope, or evidence blockers in the reviewed context.

## Required Follow-up

- No implementation follow-up required for the prior FIND-001/FIND-002/FIND-003 fixes.
- Before ticket closure, parent/orchestrator should reconcile the ticket state/journal/current-state from `Status: active` to the appropriate review/closed state if accepting this audit; I did not edit the ticket per the review-only instruction.

## Residual Risk

- Real Bonsai evidence remains a one-case synthetic smoke; it does not prove operator comprehension or broad model quality.
- The command-scoped port is reserved then released before child bind, so a local-only port race remains theoretically possible.
- Bare `llama-server` still trusts the operator's `PATH`/chosen binary unless `--llama-server-bin` or the environment override points at a specific executable; fixed argv/no-shell and sanitized environment reduce but do not eliminate binary-trust risk.
