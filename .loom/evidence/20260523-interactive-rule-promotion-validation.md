# Interactive Rule Promotion Validation

ID: evidence:20260523-interactive-rule-promotion-validation
Type: Evidence Dossier
Status: recorded
Created: 2026-05-23
Observed: 2026-05-23

## Related Records

- `plan:20260523-reflection-rule-promotion-ux`
- `ticket:20260523-rule-candidate-data-model`
- `ticket:20260523-interactive-review-ui-primitives`
- `ticket:20260523-guided-reflection-action-flow`
- `ticket:20260523-guided-rule-draft-approval-flow`
- `ticket:20260523-approved-flight-rule-injection`
- `ticket:20260523-flight-rules-management-export`
- `ticket:20260523-interactive-rule-promotion-tui-validation`
- `audit:20260523-interactive-rule-promotion-review`

## Validation Question

Did the implementation create an ask-user-question-style interactive path from reflection proposals to approved Flight Rules, with local storage, bounded injection, fallback commands, docs, and automated validation?

## Observations

### OBS-001: Rule candidate and rule state was implemented

Source changes:

- `src/types.ts` adds `FlightRuleCandidate`, `FlightRule`, `FlightRuleScope`, and status types.
- `src/storage.ts` adds `rule_candidates` and `flight_rules` tables, schema v3 migration, lifecycle APIs, dedupe by source proposal, approval, disable, active lookup by cwd, and injection counters.
- `src/flight-rules.ts` adds draft generation, candidate/rule formatting, prompt injection block formatting, and markdown export formatting.

Tests:

- `src/storage.test.ts` covers candidate creation, dedupe, redaction, approval, active lookup, project-scope path-boundary matching, reject disabling linked rules, injection count, disable, and old DB migration compatibility.

### OBS-002: Interactive review primitives were implemented

Source changes:

- `src/interactive-review.ts` provides reusable fake-testable wrappers around Pi-style `select` and `editor` interactions, with explicit cancellation/fallback results.

Tests:

- `src/interactive-review.test.ts` covers selection, cancellation/no-UI, and editor behavior.

### OBS-003: Guided reflection review and rule approval were implemented

Source changes:

- `src/pi-extension.ts` adds `/flight-review` and `/flight-reflect --interactive`.
- Guided flow selects a proposal, selects an action, records existing feedback actions, and routes `make-rule` through draft review/edit/scope approval.
- Direct `/flight-feedback --action make-rule --proposal ...` creates a draft candidate as command fallback.
- Reflection digest action text now points to `/flight-review` and concrete fallback commands.

Tests:

- `src/pi-extension.test.ts` covers guided proposal selection, proposal-choice context containing title/ID, action prompt context containing likely fix/next step, normal feedback action recording, Make Rule selection, cancellation without durable candidate/feedback state, draft editing, global approval, and rule creation.

### OBS-004: Approved rule injection and management were implemented

Source changes:

- `src/pi-extension.ts` registers `before_agent_start` and injects a bounded `Flight Recorder approved rules:` block for active relevant rules.
- Project/global scope filtering is handled through active-rule lookup.
- `/flight-status` shows active/pending/last-injected Flight Rule state.
- `/flight-rules pending|status|show|approve|reject|disable|export` provides command fallback and reversibility.

Tests:

- `src/pi-extension.test.ts` verifies an approved rule appears in `before_agent_start`, `/flight-status` reports the last injected ID, `/flight-rules disable` disables the rule, and later `before_agent_start` does not inject it.
- `src/pi-extension.test.ts` also covers fallback cluster-to-candidate make-rule, listing/show/export/reject commands.
- `src/flight-rules.test.ts` covers exact-edit rule drafting, low-confidence investigation wording, and bounded injection block formatting.

### OBS-005: Validation commands passed

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
Tests: 13 files, 62 tests passed.
Build: tsc -p tsconfig.build.json exited successfully.
npm pack --dry-run: package contained dist/flight-rules.js, dist/interactive-review.js, dist/pi-extension.js, docs, and expected package files; total files 62.

Additional UX fix after first real TUI attempt:

- `/flight-review` proposal choices now include pattern title, confidence, likely-fix/next-step preview, and proposal ID.
- The action-selection dialog title now includes the selected proposal title, summary, likely fix/next step, confidence, mode, and ID instead of only `Action for refl_...`.
- Validation re-run after this fix passed: `npm run typecheck`, `npm test`, `npm run build`, and `npm pack --dry-run`.
```

## Limits

- This evidence is automated/fake-Pi evidence, not a real interactive TUI smoke.
- `ticket:20260523-interactive-rule-promotion-tui-validation` remains blocked until the operator runs the guided flow in a real Pi TUI and captures evidence.
- The interactive helper uses Pi built-in dialogs, not `@juicesharp/rpiv-ask-user-question`; that package remains inspiration only.
- Rule injection is bounded and tested, but real prompt/UX ergonomics need TUI validation.
- Follow-up audit `audit:20260523-interactive-rule-promotion-review` returned `concerns` because real TUI evidence is still missing, with no material code blockers in the automated scope.
