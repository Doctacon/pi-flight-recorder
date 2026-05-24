# Rule Promotion TUI Fixture/Observer Artifacts

These artifacts support `ticket:20260523-rule-promotion-tui-fixture-observer`.

## Fixture

Run from repository root:

```sh
npx tsx .loom/evidence/artifacts/20260523-rule-promotion-tui-fixture-observer/seed-rule-promotion-fixture.ts [data-dir] [cwd]
```

If `data-dir` is omitted, the script creates a temp dir under `/tmp`. It seeds two synthetic `edit` tool-result failures with exact-text mismatch text, then runs local reflection with `--min-count 2` semantics to produce a deterministic proposal suitable for `/flight-review --data-dir <data-dir> --min-count 2`.

## Observer

`rule-block-observer-extension.ts` is intended to be loaded after `dist/pi-extension.js` with `--no-extensions -e <flight-recorder> -e <observer>`.

It records only allowlisted rule-block facts to `PFR_RULE_OBSERVER_LOG`:

- prompt sequence number;
- whether the `Flight Recorder approved rules` block is present;
- rule IDs found in that block;
- byte and line counts;
- SHA-256 hash of the block;
- a bounded redacted block excerpt when present.

It also registers a local no-network stub provider `pfr-local/stub` so a later prompt can trigger `before_agent_start` without hosted provider credentials.
