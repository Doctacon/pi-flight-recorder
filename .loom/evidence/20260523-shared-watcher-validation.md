# Shared Watcher Validation

ID: evidence:20260523-shared-watcher-validation
Type: Evidence Dossier
Status: recorded
Created: 2026-05-23
Observed: 2026-05-23

## Validation Question

Can multiple Pi sessions in the same project/source set start without a degraded autostart warning when one session already owns the watcher lock?

## Observations

### OBS-001: Shared watcher behavior implemented

Changed behavior:

- `SessionWatchService.start()` treats a busy watcher lock as `watched-by-another-process` without setting `lastError`.
- A follower/shared watcher no longer writes `live-status.json` on start and does not overwrite the owner's status on stop.
- Stop requests are cleared only after a process owns the watcher lock, so follower startup does not clear another session's stop request.
- Follower status hydrates from the owner's persisted status when available.
- Stale lock files whose recorded PID is no longer alive are removed and reacquired instead of silently entering shared mode.
- Pi extension autostart treats `watched-by-another-process` as normal shared indexing, not degraded startup.
- `/flight-status` reports `shared watcher; another Pi session is indexing these sources` and keeps live occurrence capture enabled.

### OBS-002: Regression tests cover duplicate sessions

Added/updated tests:

- `src/watch-service.test.ts`: duplicate watcher start returns `watched-by-another-process`, has `lastError = null`, hydrates watched paths, and does not overwrite owner persisted status after follower stop.
- `src/pi-extension.test.ts`: a second extension/session with an existing owner watcher shows no `autostart degraded` warning, reports `shared watcher`, reports `Errors: none`, and still records its own failed `tool_result` occurrence.

### OBS-003: Validation commands passed

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
Tests: 11 files, 52 tests passed.
Build: tsc -p tsconfig.build.json exited successfully.
npm pack --dry-run: package contained dist/pi-extension.js, docs, and expected package files; total files 56.
```

## Limits

- This validates same data-dir/source-set shared watcher behavior in automated/fake-Pi tests.
- It does not yet include a real two-terminal TUI smoke after reinstall/reload.
- Only one process still owns polling/indexing for a source set; other sessions share that index and independently record live failures.
