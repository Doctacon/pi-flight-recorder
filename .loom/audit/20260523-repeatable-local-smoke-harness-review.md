# Audit: Repeatable Local Smoke Harness

ID: audit:20260523-repeatable-local-smoke-harness-review
Type: Audit
Status: recorded
Created: 2026-05-23
Updated: 2026-05-23
Audited: 2026-05-23
Target: ticket:20260523-repeatable-local-smoke-harness

## Summary

Ralph performed a bounded follow-up audit after the local smoke harness was hardened for default-session isolation and direct CLI entrypoint coverage. Verdict is `clear`: no material findings were found within the audited scope, and `ACC-001` through `ACC-004` are supported.

## Target

Target was `ticket:20260523-repeatable-local-smoke-harness` and the implementation/evidence for `npm run test:smoke:local`.

## Audit Scope And Lenses

Scope reviewed by Ralph:

- ticket acceptance and current state;
- local smoke evidence dossier;
- `package.json` smoke script;
- README and first-run documentation;
- `src/local-smoke.test.ts` implementation;
- prior concerns about default session isolation and CLI entrypoint coverage.

Lenses:

- acceptance and evidence;
- data-dir/default-session isolation;
- CLI/extension smoke depth;
- privacy/local-first boundary;
- follow-through on prior audit concerns.

Out of scope:

- real interactive Pi TUI behavior;
- real model-provider reflection;
- installed package/bin execution;
- long-run corpus tuning.

## Context And Evidence Reviewed

- Ralph review run: `pi --no-extensions --no-skills --no-context-files --no-prompt-templates --no-themes --tools read,grep,find,ls,bash -p ...` from `/Users/crlough/Code/personal/pi-flight-recorder`; reviewer was instructed to inspect the target ticket, evidence, docs, package script, and smoke test, with permission to run `npm run test:smoke:local` and inspect status/diff but not edit files.
- `.loom/tickets/20260523-repeatable-local-smoke-harness.md` - target ticket and acceptance.
- `.loom/evidence/20260523-repeatable-local-smoke-harness-validation.md` - validation dossier.
- `package.json` - `test:smoke:local` script.
- `README.md` and `docs/first-run.md` - documented smoke command.
- `src/local-smoke.test.ts` - smoke harness implementation.

## Findings

None - no material findings within audited scope.

## Verdict

`clear`.

Ralph reported:

- `ACC-001` is met: `package.json` adds `npm run test:smoke:local`; README and `docs/first-run.md` document it; the target registers the Pi extension in a fake harness and calls CLI `main()` rather than being a shallow alias.
- `ACC-002` is met: the smoke uses `mkdtemp()` fixture source/data dirs, temporarily replaces `HOME`, plants a default-session sentinel under fake `~/.pi/agent/sessions`, and asserts the temp DB does not index the sentinel.
- `ACC-003` is met: coverage includes `/flight-status`, `/flight-mode index-only`, `/flight-sync --source`, `/seen-this-before`, direct CLI `status --json`, live failed `tool_result` occurrence capture, `/flight-reflect`, `/flight-review` rule approval, `before_agent_start` rule injection, and `/flight-rules status`.
- `ACC-004` is met based on recorded evidence; Ralph independently reran `npm run test:smoke:local`, which passed.

## Required Follow-up

No required follow-up before closing the ticket.

Carry the residual risks below into later release-evidence work; do not treat this smoke as real TUI or installed package proof.

## Residual Risk

- Smoke calls source CLI `main()` under Vitest, not built `dist/cli.js` or an installed package bin.
- Fake-Pi harness does not prove real interactive Pi TUI behavior.
- Temp directories are not explicitly cleaned up, but they are isolated and not real Pi state.

## Related Records

- `ticket:20260523-repeatable-local-smoke-harness` - consuming ticket.
- `evidence:20260523-repeatable-local-smoke-harness-validation` - validation evidence.
- `plan:20260523-codebase-stabilization-release-readiness` - parent plan.
