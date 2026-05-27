# Flight Learn Focused Card Render Harness Review

ID: audit:20260527-flight-learn-focused-card-render-harness-review
Type: Audit
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Audited: 2026-05-27
Target: ticket:20260527-flight-learn-focused-card-render-harness

## Summary

A bounded Ralph review audited the focused-card render harness ticket, source diff, tests, evidence, and related UX records. The review found the focused-card harness claims mostly supported, but identified one material scope-boundary concern: the current git diff also contains default split-pane production-output changes from prior uncommitted work, which could be misread as part of this render-harness ticket.

Verdict: `changes-needed` until the consuming ticket explicitly dispositions that scope-boundary concern.

## Target

The audit targeted `ticket:20260527-flight-learn-focused-card-render-harness`, especially acceptance claims ACC-001 through ACC-005 and the implementation/evidence represented by:

- `src/flight-learn-inbox.ts`
- `src/flight-learn-inbox.test.ts`
- current source diffs involving the focused-card render harness
- `evidence:20260527-flight-learn-focused-card-render-harness-validation`

## Audit Scope And Lenses

Scope:

- verify whether the render harness ticket stayed inside its declared boundary;
- challenge whether focused-card render artifacts support ACC-001 through ACC-003;
- challenge whether validation evidence supports ACC-004;
- challenge whether ACC-005 honestly handles Pi TUI primitive use/non-use;
- check that the focused-card harness did not silently become production `/flight-learn` integration.

Lenses:

- claim and evidence;
- scope;
- acceptance;
- product/UX;
- visual hierarchy/accessibility;
- implementation quality;
- dependency/tooling boundary.

Out of scope:

- real interactive Pi validation;
- production focused-card integration acceptance;
- artifact outcome follow-up UI;
- long-run corpus/classifier/model-provider behavior.

## Context And Evidence Reviewed

- Ralph review run: reviewer subagent run `4362d227` - bounded audit request over the ticket, plan, spec, evidence, source files, diffs, Pi TUI docs, and package dependency boundary.
- `ticket:20260527-flight-learn-focused-card-render-harness` - ticket scope and ACC-001 through ACC-005.
- `plan:20260527-flight-learn-focused-card-redesign` - parent sequencing and harness-before-integration boundary.
- `spec:flight-learn-inbox-ux` - focused-card requirements and SCN-006.
- `evidence:20260527-flight-learn-focused-card-render-harness-validation` - validation dossier and artifacts.
- `evidence:20260527-flight-learn-split-pane-ux-feedback` - baseline operator screenshots/feedback.
- `.loom/evidence/artifacts/20260527-flight-learn-focused-card-render-harness/render-output.txt` - deterministic collapsed/expanded focused-card render artifact.
- `.loom/evidence/artifacts/20260527-flight-learn-focused-card-render-harness/focused-tests.txt` - focused test output.
- `.loom/evidence/artifacts/20260527-flight-learn-focused-card-render-harness/full-tests.txt` - full test output.
- `.loom/evidence/artifacts/20260527-flight-learn-focused-card-render-harness/typecheck.txt` - typecheck output.
- `src/flight-learn-inbox.ts` - focused-card layout option and default wrapper behavior.
- `src/flight-learn-inbox.test.ts` - focused-card render tests.
- `src/pi-extension.ts` and `src/pi-extension.test.ts` diff context - checked whether production `/flight-learn` was wired to focused-card mode.
- `package.json` and Pi TUI docs - dependency/tooling boundary for direct Pi TUI primitive use.

## Findings

### FIND-001: Current diff includes production split-pane output changes outside the render-harness boundary

The ticket and plan define this slice as a deterministic focused-card render/prototype harness before production wiring. Production command integration and real Pi package behavior are explicitly out of scope.

The review confirmed that focused-card mode is not wired into the production `/flight-learn` wrapper: `askFlightLearnDeltaInbox` still creates the component without `layout: "focused-card"`. However, the current git diff also contains default split-pane output changes in `src/flight-learn-inbox.ts` and corresponding production wrapper test expectation changes in `src/pi-extension.test.ts`.

Why it matters: those split-pane/default-output changes appear in the same uncommitted workspace diff and could be misattributed to this render-harness ticket, weakening the ticket's scope claim.

Follow-up required: before closure, the consuming ticket should either separate/revert those default split-pane changes or explicitly record that they are pre-existing/prior-ticket workspace state and are not part of this ticket's closure claim.

## Verdict

`changes-needed` within the audited scope. The focused-card harness itself is plausible and the deterministic render artifact supports the intended visual direction. ACC-001 through ACC-003 are mostly supported by the artifact and focused tests. ACC-004 validation outputs are present. ACC-005 is honestly represented as partial because direct Pi TUI primitives were inspected but not imported due to package dependency/scope limits.

The blocking issue is not the focused-card render idea; it is the risk that the current uncommitted diff blurs this ticket's boundary with prior production split-pane changes. The ticket can proceed only after that boundary is explicitly dispositioned.

## Required Follow-up

- Disposition `FIND-001` in `ticket:20260527-flight-learn-focused-card-render-harness` before closure.
- Ensure evidence and ticket prose do not claim this ticket as proof for default split-pane production-output changes.
- Keep production focused-card integration in `ticket:20260527-flight-learn-focused-card-integration`.

## Residual Risk

- The focused-card route list is vertical but still uses left/right keys for route movement; this may need UX review during integration.
- Render evidence is deterministic only; real Pi theme/focus/terminal behavior remains unproven and belongs to the real-Pi validation ticket.
- Direct Pi TUI primitive use remains unresolved for production integration; this harness records the dependency/scope limit rather than solving it.

## Related Records

- `ticket:20260527-flight-learn-focused-card-render-harness` - consuming ticket.
- `evidence:20260527-flight-learn-focused-card-render-harness-validation` - validation dossier audited.
- `plan:20260527-flight-learn-focused-card-redesign` - parent plan.
- `spec:flight-learn-inbox-ux` - intended behavior contract.
