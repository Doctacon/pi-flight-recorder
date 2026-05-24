# Audit: Release Evidence Gap Smoke

ID: audit:20260523-release-evidence-gap-smoke-review
Type: Audit
Status: recorded
Created: 2026-05-23
Updated: 2026-05-23
Audited: 2026-05-23
Target: ticket:20260523-release-evidence-gap-smoke

## Summary

Ralph performed a bounded audit of the release evidence/defer pass. Verdict is `concerns`: the evidence posture is mostly honest, but one local-smoke claim overstated rule reversibility coverage because disable/no-injection is covered by broader fake-Pi tests, not the local smoke test itself.

## Target

Target was `ticket:20260523-release-evidence-gap-smoke` and `evidence:20260523-release-evidence-gap-smoke` after final-code-shape local smoke and explicit defer notes.

## Audit Scope And Lenses

Scope reviewed by Ralph:

- target ticket acceptance;
- release evidence gap dossier;
- blocked real TUI validation ticket;
- repeatable local smoke evidence;
- relevant prior evidence/audits named by the dossier;
- source smoke/tests for disputed claims;
- git status.

Lenses:

- claim/evidence precision;
- not substituting fake-Pi for real TUI;
- model/corpus honesty;
- source-change attribution;
- release-risk residuals.

Out of scope:

- gathering real Pi TUI evidence;
- invoking a real model provider;
- long-run corpus evaluation;
- source implementation changes.

## Context And Evidence Reviewed

- Ralph review run: `pi --no-extensions --no-skills --no-context-files --no-prompt-templates --no-themes --tools read,grep,find,ls,bash -p ...` from `/Users/crlough/Code/personal/pi-flight-recorder`; reviewer was instructed to inspect the target ticket, evidence, blocked TUI ticket, local smoke evidence, related evidence/audit records, and git status without editing files.
- `.loom/tickets/20260523-release-evidence-gap-smoke.md` - target ticket and acceptance.
- `.loom/evidence/20260523-release-evidence-gap-smoke.md` - release evidence/defer dossier.
- `.loom/tickets/20260523-interactive-rule-promotion-tui-validation.md` - still-blocked real TUI validation.
- `.loom/evidence/20260523-repeatable-local-smoke-harness-validation.md` - local smoke evidence.
- `src/local-smoke.test.ts` and `src/pi-extension.test.ts` - source of automated smoke/test coverage for rule injection and disable/no-injection.

## Findings

### FIND-001: Evidence overstates local-smoke coverage for rule reversibility

`evidence:20260523-release-evidence-gap-smoke` says approved-rule “injection/noise/reversibility” are exercised in local smoke. Ralph inspected `src/local-smoke.test.ts` and found that local smoke covers approval, injection, and `/flight-rules status`, but not a disable/no-injection step.

Why it matters: `ticket:20260523-release-evidence-gap-smoke#ACC-003` can still be supported by broader automated/fake-Pi evidence, but the evidence path must not claim local-smoke coverage that is not present.

Required disposition: Clarify that disable/no-injection is covered by `src/pi-extension.test.ts` and prior/final full-test evidence, not by local smoke; or extend local smoke. Do not present it as real TUI proof.

## Verdict

`concerns`.

The ticket should not be used to claim real TUI/model/corpus release readiness. With `FIND-001` clarified, it can support an honest “evidenced locally or explicitly deferred” release-risk posture and proceed to docs/package release-contract work while keeping the real TUI validation ticket blocked.

## Required Follow-up

- Clarify `evidence:20260523-release-evidence-gap-smoke` for ACC-003 so local smoke coverage and broader fake-Pi test coverage are not conflated.
- Keep `ticket:20260523-interactive-rule-promotion-tui-validation` blocked unless real TUI evidence is gathered.
- Carry real TUI suggestion, real model-provider, and long-run corpus tuning as release limits.

## Residual Risk

- Real guided rule-promotion TUI remains blocked.
- High-confidence live suggestion notification in real TUI remains unproven.
- Real model-provider reflection remains unproven.
- Long-run corpus precision/noise tuning remains unproven.
- Working tree is mixed/uncommitted, so source-change attribution depends on Loom records rather than commit boundaries.

## Related Records

- `ticket:20260523-release-evidence-gap-smoke` - consuming ticket.
- `evidence:20260523-release-evidence-gap-smoke` - evidence under review.
- `ticket:20260523-interactive-rule-promotion-tui-validation` - blocked real TUI ticket.
