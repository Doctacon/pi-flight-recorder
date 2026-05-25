# Outcome and Recurrence Metrics Review

ID: audit:20260523-outcome-recurrence-metrics-review
Type: Audit
Status: recorded
Created: 2026-05-23
Updated: 2026-05-23
Audited: 2026-05-23
Target: ticket:20260523-outcome-recurrence-metrics

## Summary

A bounded Ralph-style adversarial review inspected the outcome/recurrence implementation, tests, evidence, and acceptance claims. Verdict: `clear` within audited scope. The implementation adds local, deterministic outcome and recurrence tracking with cautious summary language; it does not implement a classifier, automatically reroute deltas, or mutate durable artifacts.

## Target

- `ticket:20260523-outcome-recurrence-metrics`
- Source diff for:
  - `src/delta-outcomes.ts`
  - `src/delta-outcomes.test.ts`
  - `src/cli.ts`
  - `src/cli.test.ts`
  - `src/pi-extension.ts`
  - `src/storage.ts`
  - `src/storage-mappers.ts`
  - `src/types.ts`
  - `src/index.ts`
- Evidence:
  - `evidence:20260523-outcome-recurrence-metrics-validation`

## Audit Scope And Lenses

Lenses:

- claim and evidence;
- acceptance coverage;
- recurrence-link correctness and over-linking risk;
- causal-language/metric overconfidence;
- route/outcome state separation and history preservation;
- reroute history preservation;
- scope boundary: no classifier, no automatic reroute, no artifact mutation;
- CLI/Pi fallback status language;
- regression risk to existing delta routing and storage behavior.

Out of scope:

- real interactive Pi TUI validation for the new fallback commands;
- long-run corpus effectiveness;
- classifier readiness or automated routing;
- actual artifact creation/application workflows;
- broad analytics/dashboard design.

## Context And Evidence Reviewed

Reviewed records:

- `ticket:20260523-outcome-recurrence-metrics`
- `plan:20260523-delta-artifact-learning-loop`
- `spec:delta-artifact-learning-loop#REQ-009`
- `ticket:20260523-artifact-candidate-drafts`
- `evidence:20260523-outcome-recurrence-metrics-validation`

Reviewed source paths:

- `src/delta-outcomes.ts`
- `src/delta-outcomes.test.ts`
- `src/cli.ts`
- `src/cli.test.ts`
- `src/pi-extension.ts`
- `src/storage.ts`
- `src/storage-mappers.ts`
- `src/types.ts`
- `src/index.ts`

Reviewed validation evidence:

```text
npm run typecheck                                              -> passed
npm test -- src/delta-outcomes.test.ts src/cli.test.ts src/pi-extension.test.ts src/storage.test.ts -> 4 files / 36 tests passed
npm test                                                       -> 17 files / 76 tests passed
npm run test:smoke:local                                       -> 1 file / 1 test passed
npm run build                                                  -> passed
npm pack --dry-run                                             -> 83 files
```

Reviewed additional checks:

- product-language scan for `fixed forever`, `caused improvement`, standalone `solved`, automatic reroute phrasing, and artifact-mutation phrasing;
- `git diff --check` over the touched source/record files.

## Findings

None - no material findings within audited scope.

## Verdict

`clear` within audited scope.

ACC-001 is supported: storage/API tests and helper tests mark candidates accepted/applied/rejected and record outcome notes while preserving original route rationale and evidence refs. Outcome state is stored on artifact candidates and does not delete or rewrite route history.

ACC-002 is supported: `recordDeltaRecurrenceWithStore` creates inspectable `delta_recurrence_links`, marks the later delta recurring, and marks a prior applied candidate as `needs-reroute` only when the recurrence link timestamp is after `appliedAt` and the candidate has not been rejected/dismissed.

ACC-003 is supported: summary surfaces report `unresolved`, `insufficient evidence`, `no recurrence observed`, and `recurring after applied` with explicit local-observation limits. Tests and scan challenge overconfident language; summaries use cautious terms rather than causal success claims.

ACC-004 is supported: fixture tests create a new candidate after recurrence, reroute the later delta, and assert previous candidate rationale and recurrence links remain queryable.

ACC-005 is supported by full validation.

## Required Follow-up

- Continue with `ticket:20260523-classifier-readiness-evaluation` only as a corpus/readiness decision, not classifier implementation by default.
- If the new `/flight-deltas summary|apply|outcome|recur|reject` UX becomes release-claimed, gather real interactive Pi TUI proof in a separate ticket.
- Keep outcome summary counts described as candidate-record plus unrouted-delta counts; do not present them as exact per-category causal analytics.

## Residual Risk

- Recurrence links remain manual/explicit; the implementation intentionally does not solve automatic similarity discovery.
- Counts are narrow local item counts, not a statistical dashboard or long-run evaluation.
- Redaction/secret coverage is inherited from existing storage sanitization and representative tests, not exhaustive secret discovery.
- No real corpus or model/provider evidence shows that these categories improve long-term product decisions yet.
- The new Pi command branches are covered by fake-Pi/unit tests and type/build validation, not real interactive TUI automation.

## Related Records

- `evidence:20260523-outcome-recurrence-metrics-validation`
- `plan:20260523-delta-artifact-learning-loop`
- `spec:delta-artifact-learning-loop#REQ-009`
- `ticket:20260523-classifier-readiness-evaluation`
