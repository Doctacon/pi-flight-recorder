# Flight Learn Local Model Polish Integration Review

ID: audit:20260527-flight-learn-local-model-polish-integration-review
Type: Audit
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Audited: 2026-05-27
Target: ticket:20260527-flight-learn-local-model-polish-integration

## Summary

A Ralph reviewer audited the optional local-model polish integration. The review found two issues requiring follow-up before closure.

## Findings

### FIND-001: Stale model-call disclosure in `/flight-status`

Severity: medium.

`src/pi-extension.ts` still said: `no model calls unless /flight-learn reflect --model or model reflection is enabled`. That copy became incomplete because `/flight-learn --local-model-polish --local-model-url ...` can now also make an explicit local model call.

Required follow-up: update the status privacy line and add/adjust a command/status test so future model-call paths do not stale this wording again.

### FIND-002: Custom UI failure path can still make the local model call

Severity: medium.

`maybeHandleDeltaInbox()` checked for the presence of `ctx.ui.custom`, but local polish was built before `askFlightLearnDeltaInbox()` invoked/caught the custom UI. If `ctx.ui.custom` exists but throws/returns unavailable, the primitive fallback path can be used after an explicit local model call that produced no custom UI benefit.

Required follow-up: either defer local polish until the custom UI path is known usable, or explicitly document/test this as accepted behavior.

## Correctness Notes

- Default deterministic behavior is preserved: no flag means disabled.
- Local-only adapter constraints remain sound through the already reviewed loopback adapter.
- No runtime dependency was added.
- UI disclosure/fallback wording exists and avoids raw error leakage.
- Stale model wording after field edits is guarded and tested.
- Model output is display-only; route/storage writes use edited fields and human rationale, not model text.
- No route-ranking coupling was found.
- Evidence correctly avoids claiming real Bonsai/Pi validation.

## Verdict

`changes-needed`

## Required Follow-up

- Update `/flight-status` privacy copy and test it.
- Resolve FIND-002 by either deferring the model call or documenting/testing the explicit-flag custom-throw behavior as accepted.
- Refresh validation evidence and rerun review.

## Residual Risk

- Real Bonsai/`llama.cpp` latency, JSON reliability, and real Pi TUI behavior remain unvalidated.
- Operator-configured local model server remains a trust boundary.
- Only the initially selected delta is model-polished by design; other items remain deterministic unless future work changes that.

## Reviewed Context

Ticket, specs, prior adapter audit, evidence dossier/artifacts, requested source/test files, package metadata, focused tests, typecheck, build, diff check, and full-suite artifact.
