# Flight Learn Dogfood Corpus Outcomes

ID: ticket:20260529-flight-learn-dogfood-corpus-outcomes
Type: Ticket
Status: blocked
Created: 2026-05-29
Updated: 2026-05-29
Risk: medium - this uses the learning loop on real or representative data and can compromise future classifier readiness if labels are collected from misunderstood cards.
Priority: medium - important for the core product loop, but only after comprehension validation clears.
Depends On: ticket:20260529-flight-learn-comprehension-validation

## Summary

Seed the first privacy-safe dogfood corpus/outcome set from `/flight-learn` after comprehension validation passes. The single closure claim is: the project has a bounded initial batch of human-reviewed delta route/observe decisions, confidence notes, and outcome/recurrence follow-up readiness collected from cards the operator could understand, without persisting raw private content in Loom or starting classifier automation.

## Related Records

- `plan:20260529-flight-learn-comprehension-path` - parent plan and reason this ticket comes after comprehension validation.
- `ticket:20260529-flight-learn-comprehension-validation` - prerequisite gate; must explicitly recommend proceeding.
- `research:20260529-flight-recorder-core-loop-stocktake` - defines the core loop and warns that classifier automation needs manually routed outcome corpus.
- `spec:delta-artifact-learning-loop` - owns delta/artifact/outcome semantics and human-gated artifact routing.
- `spec:flight-learn-inbox-ux` REQ-036 - corpus/outcome collection should begin only after cards are understandable enough for confident human routing.
- `research:20260525-classifier-readiness-evaluation` - prior observation that available routed/outcome labels were insufficient for automation.
- `src/storage.ts`, `src/delta-outcomes.ts`, `src/artifact-drafts.ts`, and `src/pi-extension.ts` - likely relevant if the ticket performs local ledger inspection or CLI-driven route/outcome recording.

## Scope

In scope:

- Use `/flight-learn` on a bounded batch of safe representative deltas after comprehension validation clears.
- Prefer disposable, synthetic, or redacted/private-local-only data for Loom evidence. If real private local data is used in the actual local store, preserve only aggregate/redacted observations in Loom.
- Record for each reviewed item, without raw sensitive content:
  - card identity or redacted handle;
  - route/observe/dismiss decision;
  - rationale category or short redacted rationale;
  - operator confidence;
  - whether outcome follow-up is pending, helped/no-change/worse/needs-reroute, or not yet knowable;
  - any recurrence observation when available.
- Summarize route distribution, unclear cases, blocked cases, fallback/model-enabled mix, and outcome follow-up readiness.
- Identify whether the resulting corpus is sufficient for a future classifier-readiness recheck, or what additional volume/diversity is needed.

Out of scope:

- Starting classifier automation, route ranking, or model-suggested artifact routing.
- Automatically applying artifacts, rules, source edits, docs changes, Loom records, skills, prompts, or tests.
- Persisting raw Pi sessions, raw commands, unredacted paths, stack traces, secrets, prompts, or transcripts in Loom.
- Broad release-readiness claims.
- Fixing UX/model issues discovered during dogfood; create separate tickets instead.

Stop conditions:

- Stop if the comprehension validation ticket does not explicitly recommend proceeding.
- Stop if reviewed cards are not understandable enough to route confidently; route back to comprehension/UX/model work.
- Stop if evidence capture would require raw private content in Loom.
- Stop if the system attempts to auto-route, rank, or mutate artifacts beyond existing human-gated candidate behavior.

## Acceptance

- ACC-001: A bounded reviewed batch is recorded without raw private content.
  - Evidence: evidence dossier summarizes at least 10 reviewed cards, or all available safe cards if fewer exist, with redacted handles and per-card route/observe/dismiss decision plus confidence. Privacy scan passes.
  - Audit: challenge sample size, privacy posture, and whether records contain hidden raw content.

- ACC-002: Outcome/recurrence follow-up state is captured honestly.
  - Evidence: for each routed/observed item, evidence records whether outcome is pending, known, not yet knowable, or recurrence observed, using existing cautious outcome categories where applicable.
  - Audit: challenge overclaiming that an artifact helped before recurrence evidence exists.

- ACC-003: Labels come from understood cards.
  - Evidence: the batch cites the comprehension-validation gate and records confidence/unclear cases; unclear/misunderstood items are excluded from classifier-readiness counts or marked separately.
  - Audit: challenge whether the corpus is polluted by confused labels.

- ACC-004: Human gates and no-automation boundary hold.
  - Evidence: source/ledger inspection or command output shows route decisions create local artifact candidates/observations only under existing human action; no classifier automation, route ranking, or durable artifact application occurred from model text.
  - Audit: challenge hidden automation or artifact mutation.

- ACC-005: Next classifier-readiness question is explicit.
  - Evidence: closure states whether the corpus is still insufficient, ready for a fresh classifier-readiness evaluation ticket, or blocked by missing outcome/recurrence diversity. It must not implement the classifier.
  - Audit: challenge automation claims from a small dogfood batch.

## Current State

Blocked by dependency. Do not execute until `ticket:20260529-flight-learn-comprehension-validation` closes with an explicit recommendation to start corpus/outcome collection.

## Journal

- 2026-05-29: Created by Loom Weaver as the fifth child ticket of `plan:20260529-flight-learn-comprehension-path`. This ticket moves the project back to the core learning loop only after model-enabled comprehension is validated.
