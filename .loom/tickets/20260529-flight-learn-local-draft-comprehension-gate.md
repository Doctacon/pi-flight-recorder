# Flight Learn Local Draft Comprehension Gate

ID: ticket:20260529-flight-learn-local-draft-comprehension-gate
Type: Ticket
Status: closed
Created: 2026-05-29
Updated: 2026-05-29
Risk: high - this changes the primary `/flight-learn` reading-help behavior around non-authoritative local model text, so trust-boundary wording and side-effect isolation must be proven.
Priority: high - the operator cannot confidently route artifacts from opaque deterministic cards, and the strict accepted-narrative path closed negative for the current Bonsai 4B runtime.
Depends On: ticket:20260529-flight-learn-constrained-judge-replay

## Summary

Implement a local LLM **draft comprehension** tier for `/flight-learn`. The single closure claim is: when the operator explicitly enables the existing local-model path, `/flight-learn` can display a clearly labeled, display-only local LLM draft explanation after hard syntactic/privacy/safety gates pass, even if the draft has not been promoted to a judge-accepted narrative; deterministic facts remain source of truth and no routing/storage/artifact side effects are introduced.

This ticket is the recovery path after the constrained generator + judge replay showed JSON schema output works for shape but produced 0/15 accepted narratives under current verifier/judge gates. It does not weaken the accepted-narrative path; it separates human reading help from system acceptance.

## Related Records

- `plan:20260529-flight-learn-comprehension-path` - parent plan; now reshaped around draft comprehension before corpus/outcome collection.
- `research:20260529-flight-learn-comprehension-recovery-options` - explains why schema success is not semantic acceptance and recommends a two-tier draft/accepted contract.
- `spec:flight-learn-inbox-ux` REQ-037 through REQ-041 and SCN-012 - intended behavior for local LLM drafts.
- `ticket:20260529-flight-learn-constrained-judge-replay` - dependency and negative gate evidence: 0/15 accepted narratives for current Bonsai 4B verifier/judge path.
- `evidence:20260529-flight-learn-constrained-judge-replay` - replay metrics, failure shape, and non-claims.
- `evidence:20260529-flight-learn-local-draft-comprehension-gate` - implementation evidence for this ticket.
- `audit:20260529-flight-learn-local-draft-comprehension-gate-review` - initial Ralph audit; changes-needed findings dispositioned.
- `audit:20260529-flight-learn-local-draft-comprehension-gate-followup-review` - follow-up Ralph audit; clear for bounded closure.
- `src/flight-learn-local-diagnosis-model.ts` - likely result-shape, validation, hard-gate, and draft/accepted separation seam.
- `src/flight-learn-inbox.ts` - focused-card rendering seam for draft labels and deterministic facts.
- `src/pi-extension.ts` - existing `/flight-learn --local-model-polish --local-model-url ...` wiring; do not add a new top-level command.
- `src/flight-learn-local-diagnosis-model.test.ts`, `src/flight-learn-inbox.test.ts`, and `src/pi-extension.test.ts` - likely focused test surfaces.

## Scope

In scope:

- Reuse the existing explicit local model opt-in flags/config; do not require a new visible command or mandatory second opt-in for the first slice.
- Add a distinct local draft state/result path separate from a judge-accepted narrative.
- Render a local LLM draft explanation in the focused card only when hard display gates pass.
- Label draft text clearly, for example: `Local LLM draft — facts below are source of truth` and/or `Not judge-accepted; use only as reading help`.
- Keep deterministic facts, evidence access, route/observe/dismiss/skip affordances, and fallback state visible/non-dead-ending.
- Add tests for accepted narrative, draft explanation, and rejected draft states.
- Add tests proving draft display does not mutate stored delta fields, artifact candidates, route choices/ranking, rules, source/docs/Loom/skills/prompts, classifier state, or command defaults.
- Produce render artifacts for representative draft and fallback cards.
- Produce an evidence dossier and request Ralph audit before closure.

Hard draft display gates:

- output is parseable and compatible with the constrained local model schema;
- text is length-bounded and width-safe when rendered;
- no raw local paths, Pi session paths, secrets/tokens, stack traces, prompts, unredacted transcript content, or credential-looking values;
- no route/action advice, artifact/rule/ticket/source mutation instructions, classifier/ranking claims, or unsupported concrete mutation claims;
- fact references are known when fact IDs are present;
- hosted/non-loopback calls remain impossible through the existing adapter validation.

Out of scope:

- Making local model calls by default.
- Adding new model downloads, new quantizations, hosted providers, or non-loopback endpoints.
- Weakening the stricter accepted-narrative verifier/judge path.
- Persisting model draft text as stored delta truth.
- Ranking routes or automating artifact selection.
- Collecting dogfood corpus/outcome labels.
- Proving operator comprehension; that remains a later validation ticket after draft rendering exists.
- Fixing general Bonsai 4B quality or replacing the local judge.

Stop conditions:

- Stop if implementation would require treating draft text as truth, route advice, classifier input, or artifact mutation input.
- Stop if hard display gates cannot be implemented without broad verifier redesign beyond the local diagnosis/inbox seam.
- Stop if existing explicit local-model opt-in flags cannot safely distinguish draft display from default behavior; route back to the plan/operator before adding command complexity.
- Stop if render/focused tests show fallback cards become dead ends or hide deterministic evidence.
- Stop if product source changes grow beyond local diagnosis/inbox/extension seams; split or replan.

## Acceptance

- ACC-001: Draft and accepted narrative states are distinct.
  - Evidence: tests show a judge-accepted narrative renders as accepted wording, a hard-gated but not judge-accepted draft renders as draft reading help, and rejected/disabled/unavailable local output falls back deterministically.
  - Audit: challenge whether code/prose conflates draft display with accepted narrative or model truth.

- ACC-002: Existing explicit opt-in is reused without default model calls.
  - Evidence: command/extension tests prove `/flight-learn` default behavior remains deterministic, visible command surface remains `/flight-status` and `/flight-learn`, and draft display requires existing local-model flags/config with loopback-only adapter validation.
  - Audit: challenge accidental default enablement, hosted/non-loopback paths, or new command creep.

- ACC-003: Hard draft display gates block unsafe or authority-confusing content.
  - Evidence: focused tests reject draft output containing raw paths/session paths, secrets, stack traces, prompt/transcript markers, route/action advice, mutation instructions, classifier/ranking claims, overlong text, malformed/schema-incompatible output, or unknown fact references.
  - Audit: challenge whether regex-only semantic validation is being overclaimed; syntactic/privacy gates are acceptable, but claims about usefulness require render/operator validation later.

- ACC-004: Focused card rendering makes draft status and source-of-truth boundaries obvious.
  - Evidence: render artifacts at representative widths show draft label, deterministic facts/evidence access, route/observe/dismiss/skip actions, and fallback limitation text. Draft should help reading without appearing authoritative.
  - Audit: challenge UI trust-boundary language, width safety, and whether the card still supports human routing.

- ACC-005: Draft display has no storage/routing/artifact side effects.
  - Evidence: tests/source scan prove model draft text does not alter `ExpectationDelta` fields, route choices/ranking, artifact candidates, rules, source/docs/Loom/skills/prompts, classifier behavior, or any stored source-of-truth field.
  - Audit: challenge hidden persistence and accidental coupling between model text and routing state.

- ACC-006: Evidence and audit are complete before closure.
  - Evidence: focused tests, typecheck, build/full tests as practical, render artifacts, `git diff --check`, privacy scan over artifacts, evidence dossier, and Ralph audit are recorded.
  - Audit: challenge overclaiming, especially any claim that draft rendering proves operator comprehension, real-session usefulness, or release readiness.

## Current State

Closed. Implementation and follow-up evidence are recorded in `evidence:20260529-flight-learn-local-draft-comprehension-gate`. The slice adds distinct accepted/draft/validated/deterministic local-model display states and renders explicitly labeled local LLM draft reading help after hard display gates, using the existing local-model opt-in path. Deterministic facts remain source of truth, and tests/scans cover no routing/storage/artifact/source/Loom/classifier side effects. Initial audit `audit:20260529-flight-learn-local-draft-comprehension-gate-review` returned changes-needed; all findings were dispositioned in source/tests/artifacts/evidence. Follow-up audit `audit:20260529-flight-learn-local-draft-comprehension-gate-followup-review` returned clear for bounded closure.

This closure does not prove operator comprehension, real Bonsai quality, real-session usefulness, release readiness, or corpus/outcome readiness. The next plan ticket is `ticket:20260529-flight-learn-comprehension-validation`, now unblocked/open.

## Journal

- 2026-05-29: Created after `ticket:20260529-flight-learn-constrained-judge-replay` closed negative and the operator clarified that LLM help is still required to understand cards. Operator selected: draft layer, reuse existing flags, shape ticket before implementation.
- 2026-05-29: Driver set ticket active and prepared bounded Ralph worker run. Preflight `git status --short` showed substantial pre-existing dirty/untracked Loom records and local-model source files; run boundary is local diagnosis/inbox/extension seams, focused tests, evidence, and this ticket only.
- 2026-05-29: Implemented local draft display state and focused-card source-facts rendering. Focused tests passed (`3 files, 68 tests`), typecheck passed, build passed, full tests passed (`21 files, 144 tests`), `git diff --check` passed, render artifacts and privacy/side-effect scans recorded. Ticket moved to review pending audit.
- 2026-05-29: Initial Ralph audit `audit:20260529-flight-learn-local-draft-comprehension-gate-review` returned changes-needed with three findings: narrative unsupported/mutation hard-gate gap, unsafe judge precedence gap, and clipped dismiss/skip render affordances. Driver set ticket back to active for follow-up Ralph fixes.
- 2026-05-29: Follow-up Ralph implementation dispositioned all three findings: added narrative unsupported concrete/mutation claim gate with focused tests, made unsafe/action-advice judge verdicts/top-level reasons fail closed before draft recovery with focused tests, split focused-card footer hints so dismiss/skip remain visible at 72/92 widths, regenerated render artifacts, and updated evidence. Follow-up focused tests passed (`3 files, 69 tests`), typecheck passed, build passed, full tests passed (`21 files, 145 tests`), width check passed, privacy scan passed, and `git diff --check` passed. Moved ticket back to review for follow-up audit.
- 2026-05-29: Follow-up Ralph audit `audit:20260529-flight-learn-local-draft-comprehension-gate-followup-review` returned clear for bounded closure. Closed ticket and unblocked `ticket:20260529-flight-learn-comprehension-validation` as the next validation gate.
