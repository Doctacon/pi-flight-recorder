# FIND-001 Through FIND-005 Fix Validation

ID: evidence:20260523-findings-fix-validation
Type: Evidence Dossier
Status: recorded
Created: 2026-05-23
Updated: 2026-05-23
Observed: 2026-05-23

## Related Records

- `audit:20260523-seamless-ux-review`
- `evidence:20260523-live-pi-tui-smoke`
- `plan:20260523-seamless-failure-memory-ux`
- `.loom/tickets/20260523-*.md`
- `audit:20260523-seamless-ux-followup-review`

## Validation Question

After the Ralph review returned `changes-needed`, what was changed and what evidence supports disposition of `FIND-001` through `FIND-005`?

## Observations

### OBS-001: Interactive Pi TUI smoke was performed by the operator

See `evidence:20260523-live-pi-tui-smoke`.

Observed in the real Pi TUI:

- `/flight-status` rendered and showed `suggest-on-failure (autostart on)`.
- A harmless failing bash tool call was captured; subsequent `/flight-status` showed `Failures captured: 1`, a concrete occurrence ID, and `last suppression=unresolved-match`.
- A second repeated harmless failure followed by `/flight-reflect --min-count 2` rendered one grouped local reflection proposal with evidence, limits, actions, and `No model call was made`.

Supports:

- `audit:20260523-seamless-ux-review#FIND-002` is materially addressed for status, live capture, and reflection TUI behavior.

Limits:

- The smoke did not exercise a high-confidence prior resolved suggestion notification.

### OBS-002: Automated validation passed after fixes

Procedure:

```sh
cd /Users/crlough/Code/personal/pi-flight-recorder
npm run typecheck
npm test
npm run build
npm pack --dry-run
```

Observed output summary:

```text
Typecheck: tsc --noEmit exited successfully.
Tests: 11 files, 51 tests passed.
Build: tsc -p tsconfig.build.json exited successfully.
npm pack --dry-run: package contained dist/pi-extension.js, docs, and expected package files; total files 56.
```

Supports:

- All finding fix code compiles.
- Regression tests cover redacted storage/model context including episode rows, feedback target validation/suppression semantics, snooze expiry, data-dir watcher switching, old DB migration, and prior seamless UX tests.

Limits:

- This is automated/fake-Pi evidence except for the separate live TUI smoke in OBS-001.

### OBS-003: FIND-001 privacy/redaction changes were implemented and tested

Observed source changes:

- `src/redact.ts` now includes CLI-option secret redaction, user-home/session-file/temp path redaction, and `sanitizeStoredText`.
- `src/storage.ts` uses sanitized text for live occurrence query/snippet/command and parsed session event search/data fields.
- `src/reflection.ts` redacts local paths in evidence labels used in reflection output/model context.
- Docs now state that derived snippets/live occurrence text redact obvious secrets and user-home/session-file paths; raw Pi sessions remain the source of truth.

Observed tests:

- `src/storage.test.ts` verifies secret-bearing live occurrence commands/snippets, parsed session event rows, and episode rows do not persist raw secret values or raw `/Users/alice` paths in derived fields.
- `src/reflection.test.ts` verifies model-assisted prompt context does not contain `abc123` or `/Users/alice`, does contain redacted `/Users/<user>` path labels, and redacts raw cluster title/cwd/evidence-snippet fields at the prompt sink.

Supports:

- `audit:20260523-seamless-ux-review#FIND-001` is addressed for newly persisted derived rows and model prompt context.

Limits:

- Existing derived DB rows created before this change are not rewritten by this validation.
- Raw Pi session JSONL files remain local source of truth and can still contain raw commands/output.

### OBS-004: FIND-003 feedback/reflection controls were strengthened and tested

Observed source changes:

- `src/pi-extension.ts` validates occurrence, episode, cluster, and proposal IDs before recording feedback.
- `src/cli.ts` applies similar target validation for debug CLI feedback.
- Reflection scheduler in `src/reflection.ts` consults active signature-level snooze/silence feedback before selecting clusters.
- Feedback on occurrence/proposal/signature now affects cluster eligibility by signature; direct cluster silence/dismiss/promote/make-rule feedback updates cluster status.
- Temporary `snooze` remains an expiring feedback action rather than a permanent cluster status change, so clusters become eligible again after expiry; both Pi TUI feedback and CLI debug-harness feedback assign snooze expiry.

Observed tests:

- `src/pi-extension.test.ts` checks missing occurrence feedback emits a friendly error and does not insert feedback state.
- `src/pi-extension.test.ts` checks `silence-pattern` feedback on an occurrence suppresses later `/flight-reflect --min-count 2` output.
- `src/reflection.test.ts` checks an expired snooze does not permanently suppress an existing cluster.

Supports:

- `audit:20260523-seamless-ux-review#FIND-003` is addressed for invalid IDs and snooze/silence propagation into reflection eligibility.

Limits:

- Long-running UX around undoing silence/snooze remains future polish.

### OBS-005: FIND-004 data-dir command isolation was centralized and tested

Observed source changes:

- `src/pi-extension.ts` now has `switchDataDir`, which stops the active watcher, clears watcher/engine state, updates data dir, and marks bootstrap stale whenever command handlers switch `--data-dir`.
- `/flight-mode`, `/flight-watch`, `/flight-status`, `/flight-feedback`, and `/flight-reflect` use that helper.

Observed tests:

- `src/pi-extension.test.ts` starts a watcher, then calls `/flight-status --data-dir <other-dir>` and verifies the status points to the new data dir and capture/index is `not watching`.

Supports:

- `audit:20260523-seamless-ux-review#FIND-004` is addressed by centralized watcher stop/rebind behavior.

### OBS-006: FIND-005 schema migration compatibility was added and tested

Observed source changes:

- `src/storage.ts` now runs `migrateSchema()` after base schema creation.
- Migration ensures required v2 columns exist and sets `PRAGMA user_version = 2` plus `meta.schemaVersion = 2`.

Observed tests:

- `src/storage.test.ts` creates a legacy DB with `schemaVersion = 1` and a partial `failure_occurrences` table, then opens it through `FlightRecorderStore`, records an occurrence, and verifies new v2 tables are available.

Supports:

- `audit:20260523-seamless-ux-review#FIND-005` is addressed for the old/partial schema path represented by the fixture.

Limits:

- This does not test every possible corrupt DB shape; it covers the intended legacy/partial-schema compatibility path.

## What This Shows

- `FIND-001` through `FIND-005` have concrete source/test/evidence dispositions.
- Follow-up audit `audit:20260523-seamless-ux-followup-review` returned `clear` in the inspected scope.
- The interactive Pi TUI evidence gap for `/flight-status`, live capture, and `/flight-reflect` is materially closed.
- Automated validation passed after changes.

## What This Does Not Show

- It does not exercise a high-confidence prior resolved live suggestion notification in the real TUI.
- It does not exercise real model-provider reflection.
- It does not tune clustering precision over a long-lived real occurrence corpus.
- Follow-up audit was read-only and scoped; residual risks remain in `audit:20260523-seamless-ux-followup-review`.
