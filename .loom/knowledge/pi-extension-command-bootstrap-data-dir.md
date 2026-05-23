# Pi Extension Command Bootstrap Data Dir

ID: knowledge:pi-extension-command-bootstrap-data-dir
Type: Knowledge Troubleshooting
Status: active
Created: 2026-05-23
Updated: 2026-05-23
Triggers: pi extension, flight-mode, flight-status, --data-dir, autostart, watcher, default sessions, test pollution, bootstrap
Applies To: src/pi-extension.ts, Pi extension command handlers, pi-flight-recorder live watcher

## Lesson

Command handlers that accept `--data-dir` must apply that data-dir before bootstrapping extension state. Otherwise bootstrap can start a watcher against the default Pi session dirs/data dir before the command-specific data dir is applied.

This showed up during seamless UX validation: `/flight-mode index-only --data-dir <temp>` started default catch-up first, which indexed the operator's real sessions into the temp test database and made isolated tests observe many episodes instead of one fixture episode.

## Current Practice

In `src/pi-extension.ts`:

- parse `--data-dir` before `ensureBootstrapped` in command handlers that support it;
- if the data dir changes, stop the old watcher, update `state.dataDir`, and mark `state.bootstrapped = false`;
- use `ensureBootstrapped(..., false)` for `/flight-mode` so changing mode/settings does not implicitly run default watcher catch-up;
- let `session_start` own normal autostart watcher behavior;
- use `/flight-watch start` or `/flight-mode resume` for explicit command-triggered watcher start.

## Boundary

This is a command/bootstrap isolation rule, not a product requirement to disable session-start autostart. The normal no-CLI UX still starts quiet capture from Pi `session_start` when autostart is enabled.

## Related Records

- `plan:20260523-seamless-failure-memory-ux`
- `ticket:20260523-extension-auto-bootstrap`
- `evidence:20260523-seamless-ux-validation`
