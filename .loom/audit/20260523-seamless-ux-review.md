# Seamless Failure Memory UX Review

ID: audit:20260523-seamless-ux-review
Type: Audit
Status: recorded
Created: 2026-05-23
Updated: 2026-05-23
Audited: 2026-05-23
Target: plan:20260523-seamless-failure-memory-ux

## Summary

Ralph performed an adversarial review of the seamless failure-memory UX implementation, its tickets, docs, and validation evidence. Verdict is `changes-needed`: the implementation has meaningful progress, but several acceptance and evidence claims should not close until privacy, feedback semantics, data-dir isolation, migration compatibility, and real Pi smoke gaps are resolved or explicitly dispositioned.

## Target

Review target was the implementation and record set for `plan:20260523-seamless-failure-memory-ux`, especially whether its child tickets can move from `review` to closure after the seamless UX work.

## Audit Scope And Lenses

Scope reviewed by Ralph:

- seamless UX spec/plan/tickets;
- validation evidence dossier;
- extension lifecycle, storage, suggestion, feedback, pattern mining, reflection, CLI, docs, and tests.

Lenses:

- claim and evidence;
- acceptance;
- implementation correctness and maintainability;
- data/migration/idempotency;
- product and UX;
- security/privacy/model boundary;
- follow-through.

Out of scope:

- full interactive Pi TUI reproduction;
- running a real model provider;
- long-running real-world precision tuning after live occurrence accumulation.

## Context And Evidence Reviewed

- Ralph review run: `pi --no-extensions --no-skills --no-context-files --no-prompt-templates --no-themes --tools read,grep,find,ls -p ...` from `/Users/crlough/Code/personal/pi-flight-recorder`; reviewer was instructed to read `.loom/audit/20260523-seamless-review-request.md` first and inspect only named records/files.
- `.loom/specs/seamless-failure-memory-ux.md` - intended behavior and privacy/model constraints.
- `.loom/plans/20260523-seamless-failure-memory-ux.md` - strategy, milestones, and current review state.
- `.loom/tickets/20260523-*.md` - child ticket acceptance and current state.
- `.loom/evidence/20260523-seamless-ux-validation.md` - validation dossier.
- Source/docs named in the review request: `src/pi-extension.ts`, `src/storage.ts`, `src/live-suggestions.ts`, `src/pattern-miner.ts`, `src/reflection.ts`, `src/settings.ts`, `src/signatures.ts`, `src/cli.ts`, `src/*.test.ts`, `README.md`, `docs/first-run.md`, `docs/live-monitoring.md`.

## Findings

### FIND-001: Privacy boundary is overclaimed

Ralph observed that live occurrence query/snippet/signature paths are redacted, but some persisted fields and model-prompt metadata may remain raw. Specifically, `failure_occurrences.command` can persist raw `input.command`; historical `events.searchText/dataJson` store raw parsed session text/command/output; reflection model prompts include cwd/session-file paths.

Why it matters: this weakens claims such as “no secrets in records” and “bounded redacted evidence.” Local-only storage is still sensitive local state, and shell commands/paths can include secrets or private identifiers.

Required follow-up: redact/bound command/output/path fields before persistence/model prompts, or explicitly document that the local DB contains raw indexed session text. Add tests with secret-bearing commands and model-prompt path redaction.

### FIND-002: No-CLI seamless UX is not proven by live Pi evidence

Ralph observed that validation evidence includes fake-Pi tests, package dry-run, and `pi install . -l`, while explicitly noting no interactive Pi TUI smoke was performed. Docs already present extension autostart and no separate CLI watcher as normal usage.

Why it matters: the plan says real Pi smoke gates CLI demotion/docs. Current evidence does not prove live TUI command rendering, autostart, notification behavior, or live capture.

Required follow-up: keep seamless install, high-confidence UX, CLI demotion, and real-corpus tickets open/review until interactive Pi smoke is recorded, or mark docs/status as preview/unverified.

### FIND-003: Feedback/reflection controls do not fully satisfy claimed action semantics

Ralph observed that `/flight-feedback` can accept missing occurrence/cluster/proposal IDs and record success. Snooze/silence feedback on occurrence/proposal/signature records feedback actions, but reflection scheduling primarily filters `failure_clusters.status`; only direct `--cluster` feedback updates cluster status.

Why it matters: users may believe they silenced or snoozed a reflection pattern while future digests still include it. Invalid IDs can pollute feedback state.

Required follow-up: validate target IDs with friendly errors; propagate proposal/occurrence/signature feedback to affected clusters or make scheduler consult feedback actions. Add regression tests.

### FIND-004: Data-dir command isolation is incomplete

Ralph observed that data-dir switching was documented as needing watcher stop/rebind behavior, but some handlers can change `state.dataDir`/`bootstrapped` without stopping an active watcher.

Why it matters: status and subsequent events can mix a watcher on one DB/source set with extension state pointing at another DB, risking confusing or wrong capture.

Required follow-up: centralize data-dir switching; stop/rebind watcher consistently or make one-shot commands avoid mutating global state. Add active-watcher plus `--data-dir` tests.

Note: after the review request was written, `src/pi-extension.ts` received additional data-dir isolation hardening. This audit finding should still be dispositioned against the latest source before closure.

### FIND-005: Schema migration compatibility is unproven

Ralph observed that `src/storage.ts` uses `CREATE TABLE IF NOT EXISTS` and writes `schemaVersion = 2`, but no versioned ALTER migration or old-DB fixture test was identified.

Why it matters: existing installs with partial/older schemas may not acquire needed columns/tables correctly, while metadata claims schema v2.

Required follow-up: add versioned migrations and compatibility tests, or document a safe rebuild/reset path that preserves user-authored feedback.

## Evidence Gaps

- No interactive Pi TUI smoke for `/flight-status`, live failed `tool_result` capture, or live notification rendering.
- Real corpus has zero occurrence-ledger records, so reflection precision/noise tuning is not supported yet.
- Model-assisted reflection was tested with a fake provider only.
- Reflection scheduler evidence does not cover real threshold/session-end/daily behavior.
- Proposal generator evidence should more directly cover unresolved clusters avoiding invented fixes.

## Verdict

`changes-needed`.

The review found material issues and evidence gaps that should prevent closing the plan or its child tickets as fully accepted. Several findings may be fixable within existing tickets, but ticket closure should wait until findings are dispositioned with code/docs/tests/evidence or accepted as explicit residual risk by the operator.

## Required Follow-up

Before claiming completion or closing the plan:

1. Disposition `FIND-001` through `FIND-005` in the owning tickets.
2. Re-run automated validation after fixes.
3. Perform or explicitly defer an interactive Pi TUI smoke with authority.
4. Keep real-corpus tuning in review until live occurrences exist, or revise acceptance to make that an explicit follow-up.
5. Run a follow-up audit or narrow review after fixes.

## Follow-up Disposition Notes

2026-05-23: After this audit was recorded, follow-up evidence was added in `evidence:20260523-live-pi-tui-smoke` and `evidence:20260523-findings-fix-validation`. Those records claim implementation/test dispositions for `FIND-001` through `FIND-005`. This audit's original verdict remains `changes-needed`; use a follow-up review before treating the findings as independently cleared.

## Residual Risk

- Heuristic clustering may remain noisy until real occurrence data accumulates.
- `user_bash` capture remains correctly disabled but must stay documented.
- Local SQLite contains sensitive local state even when no network is used.
- The review did not run an interactive Pi TUI or real model provider.

## Related Records

- `plan:20260523-seamless-failure-memory-ux`
- `spec:seamless-failure-memory-ux`
- `evidence:20260523-seamless-ux-validation`
- `.loom/tickets/20260523-*.md`
