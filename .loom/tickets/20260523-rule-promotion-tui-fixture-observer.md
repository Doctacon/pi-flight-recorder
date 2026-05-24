# Rule Promotion TUI Fixture and Observer

ID: ticket:20260523-rule-promotion-tui-fixture-observer
Type: Ticket
Status: closed
Created: 2026-05-23
Updated: 2026-05-23
Risk: high - the observer intentionally inspects prompt-injection state, so the fixture must prove only bounded Flight Recorder rule content is captured and no raw system prompt or real session data leaks
Priority: high - the final real-TUI validation needs a deterministic proposal and injection/no-injection observer
Depends On: ticket:20260523-real-pi-tui-automation-guardrails

## Summary

Create the isolated proof substrate for the unattended real Pi TUI rule-promotion run: synthetic repeated-failure data that yields a deterministic reflection proposal, plus a temporary observer extension loaded after Flight Recorder that records only the bounded Flight Recorder approved-rule block or its absence during `before_agent_start`.

This ticket does not run the final guided TUI validation. Its closure claim is that the final validation ticket has a privacy-bounded fixture, observer artifact, and exact handoff instructions ready to consume.

## Related Records

- `plan:20260523-automated-real-pi-tui-rule-promotion-validation` - owns the overall strategy and non-goals.
- `ticket:20260523-real-pi-tui-automation-guardrails` - establishes the terminal automation and isolation route this fixture must follow.
- `ticket:20260523-interactive-rule-promotion-tui-validation` - final validation ticket that will consume this fixture and observer.
- `evidence:20260523-interactive-rule-promotion-validation` - existing fake-Pi/local evidence with the expected exact-text mismatch flow and injection behavior.
- `knowledge:pi-extension-command-bootstrap-data-dir` - constrains fixture setup so command-specific `--data-dir` does not accidentally bootstrap default session data.
- Pi docs `docs/extensions.md` - documents `before_agent_start` handler ordering and chained `event.systemPrompt` semantics needed by the observer.
- `src/pi-extension.ts` - source behavior for `/flight-review`, `/flight-rules`, and Flight Rule injection.
- `src/pi-extension.test.ts` and `src/local-smoke.test.ts` - existing synthetic exact-text rule-promotion examples that can inform fixture shape without becoming real-TUI proof.

## Scope

May change:

- Evidence and artifact files under `.loom/evidence/` and `.loom/evidence/artifacts/`.
- This ticket's Current State and Journal.
- Temporary directories outside the repository for fixture data, disposable Pi workspace, disposable recorder data-dir, and terminal logs.

May create as artifacts:

- A fixture setup script or notes under `.loom/evidence/artifacts/...`.
- A temporary observer extension under `.loom/evidence/artifacts/...`.
- Redacted observer output files proving the observer records only allowed Flight Recorder rule-block facts.

Must not change:

- No application source, package files, repository docs, tests, generated files, or persistent Pi settings outside disposable temp directories.
- No real Pi session logs or default recorder databases.
- No raw system prompt dumps, user prompt dumps, provider payload dumps, credentials, or real file paths unless a path is synthetic/temp and necessary for reproduction.
- No use of non-TUI/fake-Pi fixture checks as proof that the guided TUI flow works.

Fixture requirements:

- Use a disposable recorder `--data-dir` with synthetic failures, preferably the existing exact-text edit mismatch pattern because the current rule-draft logic has known deterministic behavior for it.
- Ensure `/flight-review --data-dir <fixture> --min-count 2` will have at least one proposal to select in the final run.
- Preserve whether the fixture was seeded through public CLI/session ingestion or through internal storage APIs; do not overclaim beyond the actual path.

Observer requirements:

- Load after the Flight Recorder extension so `before_agent_start` can inspect the chained system prompt after Flight Recorder's rule injection.
- Capture only an allowlisted summary: whether the `Flight Recorder approved rules` block is present, rule IDs in that block, line count/byte count of that block, a hash of the block if useful, and a redacted copy of the block only if it contains no raw evidence leakage.
- Capture absence after disable as a distinct observation.
- If a local-only stub provider is needed solely to trigger a turn without network, keep it inside the temporary observer/harness artifact and state clearly that real provider behavior remains unproven.

Stop conditions:

- Stop if observer proof would require logging the full system prompt or provider payload.
- Stop if the only available way to trigger `before_agent_start` requires a hosted provider call or credentials.
- Stop if the fixture setup starts indexing the operator's real Pi sessions or writes to default recorder locations.

## Acceptance

- ACC-001: A fixture setup path creates an isolated recorder data-dir with a deterministic reflection proposal suitable for `/flight-review --data-dir <fixture> --min-count 2`.
  - Evidence: `.loom/evidence/...` dossier or artifact notes with setup command/script, temp paths, proposal ID/pattern summary, and explicit statement that this setup evidence is not real-TUI proof.
  - Audit: Final validation audit should verify the final run consumed this fixture or explain any replacement fixture.

- ACC-002: A temporary observer extension artifact exists and is documented with its load order, output path, redaction/allowlist rules, and cleanup expectations.
  - Evidence: artifact path plus observer code/notes under `.loom/evidence/artifacts/...` and a brief explanation in the evidence dossier.
  - Audit: Final validation audit should challenge whether the observer could leak raw prompt, real session data, or credentials.

- ACC-003: The observer is proven, outside the final UX claim, to record only bounded Flight Recorder rule-block facts or absence markers.
  - Evidence: redacted sample observer output from a synthetic/temp run or a dry inspection that demonstrates allowed fields and excludes raw base prompts.
  - Audit: Final validation audit should treat this as harness validation, not proof of the guided flow itself.

- ACC-004: The final validation handoff is explicit: exact fixture data-dir, disposable workspace/HOME expectations, extension load order, observer output path, and the keyboard steps the final ticket should drive.
  - Evidence: handoff section in the evidence dossier or this ticket Current State.
  - Audit: Final validation audit should verify the final run followed or intentionally revised this handoff.

- ACC-005: If the fixture or observer cannot be made privacy-bounded, the ticket records the blocker and returns to the plan instead of weakening the final validation acceptance.
  - Evidence: blocker notes with supporting command output or source/doc inspection.
  - Audit: Closure with a blocker should not be treated as final validation readiness.

## Current State

Closed. Evidence `evidence:20260523-rule-promotion-tui-fixture-observer` records the deterministic fixture and observer proof substrate for the final real-TUI validation ticket. The fixture script `seed-rule-promotion-fixture.ts` creates two synthetic exact-text edit mismatch occurrences and a local reflection proposal; the observed fixture data dir `/tmp/pfr-rule-promotion-fixture-data-maS4qw` contains one proposal `refl_c70bb44179db5cd8` for `Pattern: exact-text edit mismatches` with confidence `0.75`.

The observer extension `rule-block-observer-extension.ts` records only allowlisted `before_agent_start` rule-block facts to `PFR_RULE_OBSERVER_LOG` and registers a no-network local stub provider `pfr-local/stub`. Real Pi TUI probe runs captured both absence and synthetic presence markers without logging raw user prompts, full system prompts, provider payloads, real sessions, or credentials. The final validation handoff is explicit: use isolated tmux, `--no-extensions -e <absolute dist/pi-extension.js> -e <absolute observer>`, `PFR_RULE_OBSERVER_LOG=<temp-log>`, `PFR_LOCAL_STUB_KEY=stub`, `--model pfr-local/stub`, and the fixture data dir unless regenerating from the artifact script.

No separate Ralph audit was recorded for this substrate ticket; the final validation audit must still challenge whether the actual Flight Recorder run consumed this fixture/observer correctly and preserved privacy boundaries.

## Journal

- 2026-05-23: Created as the second child ticket of `plan:20260523-automated-real-pi-tui-rule-promotion-validation` to separate deterministic fixture/observer setup from both terminal automation guardrails and the final real-TUI validation claim.
- 2026-05-23: Set Status to `active` after guardrail dependency closed. Beginning bounded manual-Ralph execution to create synthetic fixture data and privacy-bounded observer/local-provider artifacts for final real-TUI validation.
- 2026-05-23: Created fixture script and observed fixture data dir with two synthetic exact-text edit mismatch occurrences, one cluster, and one reflection proposal suitable for `/flight-review --data-dir <fixture> --min-count 2`.
- 2026-05-23: Created privacy-bounded observer extension with local stub provider plus synthetic injector probe; real Pi TUI runs recorded absence and presence NDJSON markers while avoiding raw prompt/full-system-prompt/provider-payload logging.
- 2026-05-23: Recorded `evidence:20260523-rule-promotion-tui-fixture-observer` and closed ticket. ACC-001 through ACC-004 are supported; ACC-005 is not applicable because fixture/observer setup was feasible.
