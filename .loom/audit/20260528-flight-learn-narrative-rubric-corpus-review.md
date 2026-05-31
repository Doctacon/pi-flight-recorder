# Flight Learn Narrative Rubric Corpus Review

ID: audit:20260528-flight-learn-narrative-rubric-corpus-review
Type: Audit
Status: recorded
Created: 2026-05-28
Updated: 2026-05-28
Audited: 2026-05-28
Target: ticket:20260528-flight-learn-narrative-rubric-corpus

## Summary

Ralph performed an adversarial read-only review of the narrative `What happened?` corpus/rubric ticket, evidence dossier, artifacts, parent plan, relevant spec requirements, and motivating feedback evidence.

Verdict: `clear`. No material `FIND-*` findings were reported. The review concluded that the corpus/rubric is fit to support closure of this shaping/evaluation ticket, with residual risks carried forward to the implementation and real-model validation tickets.

Ralph audit output is preserved at:

```text
.loom/evidence/artifacts/20260528-flight-learn-narrative-rubric-corpus/ralph-audit-output.md
```

## Target

Review target:

- `ticket:20260528-flight-learn-narrative-rubric-corpus`
- closure claim: future implementation can judge whether model-generated `What happened?` prose is useful narrative, grounded, privacy-safe, and distinct from the `Problem` headline without using deterministic equivalence as the only quality target.

## Audit Scope And Lenses

Lenses:

- claim and evidence
- acceptance coverage for `ACC-001` through `ACC-004`
- corpus coverage and happy-path bias
- rubric quality and unsupported-fact discipline
- privacy and display-only safety
- reusable shape for next ticket
- scope adherence and overclaim prevention

The review specifically challenged whether:

- the corpus only has happy paths;
- pleasant prose could pass despite unsupported facts;
- adversarial cases cover raw commands, paths, session paths, secrets, redaction placeholders, route/action advice, mutation instructions, classifier/ranking claims, overlong output, and low-information cases;
- artifacts contain raw private data;
- evidence overclaims Bonsai or product behavior.

## Context And Evidence Reviewed

Ralph reported inspecting:

- `.loom/tickets/20260528-flight-learn-narrative-rubric-corpus.md`
- `.loom/evidence/20260528-flight-learn-narrative-rubric-corpus.md`
- `.loom/evidence/artifacts/20260528-flight-learn-narrative-rubric-corpus/narrative-what-happened-eval-corpus.v1.json`
- `.loom/evidence/artifacts/20260528-flight-learn-narrative-rubric-corpus/narrative-what-happened-eval-summary.v1.json`
- `.loom/evidence/artifacts/20260528-flight-learn-narrative-rubric-corpus/privacy-scan.v1.json`
- `.loom/evidence/artifacts/20260528-flight-learn-narrative-rubric-corpus/ralph-worker-output.md`
- `.loom/plans/20260528-flight-learn-4b-narrative-what-happened.md`
- `.loom/specs/flight-learn-inbox-ux.md` with `REQ-030` through `REQ-032` and `SCN-010` focus
- `.loom/evidence/20260528-flight-learn-narrative-what-happened-feedback.md`
- `src/flight-learn-local-diagnosis-model.ts` for current fact-packet/limit alignment context

Ralph also reported read-only JSON parse/coverage consistency checks, targeted privacy grep, and scoped `git status`.

## Findings

No material findings.

Notes from the review:

- The corpus is broad enough for this ticket, but intentionally shallow; most adversarial categories have one synthetic probe. The implementation ticket should turn these probes into executable validator tests and add variants if real Bonsai output exposes new failure modes.
- The corpus narrative `maxChars` is `520`, while current generic source uses `whatHappened: 360`. This is not a failure of this ticket because the next ticket owns the field-specific contract, but it is a required implementation decision.
- Probe-level `expectedRubricOutcome` values such as `accepted-unsafe` / `accepted-unsupported` mean “if the validator accepts this bad output, classify it as a hard-fail”; the desired end-to-end validator outcome for those probes remains fallback.

## Verdict

`clear`: within the audited scope, Ralph found no material blockers to closing `ticket:20260528-flight-learn-narrative-rubric-corpus`.

The audit does not prove Bonsai 4B can generate safe useful prose and does not validate product prompts, validators, UI rendering, adapters, or runtime behavior.

## Required Follow-up

No required follow-up before closing this ticket.

Required follow-through for later tickets:

- `ticket:20260528-flight-learn-narrative-local-model-contract` should consume the corpus by asserting both validator behavior and human/rubric outcome semantics, especially unsafe probes where fallback is the desired validator result.
- Real Bonsai claims must wait for `ticket:20260528-bonsai-4b-narrative-validation`.

## Residual Risk

- Synthetic/redacted cases do not prove Bonsai 4B quality or safety.
- The privacy scan is targeted, not a formal DLP proof; rerun it after artifact changes.
- One-probe-per-category coverage may miss variants such as different command syntaxes, Windows paths, unusual secret formats, or subtle route/action phrasing.

## Related Records

- `ticket:20260528-flight-learn-narrative-rubric-corpus`
- `evidence:20260528-flight-learn-narrative-rubric-corpus`
- `plan:20260528-flight-learn-4b-narrative-what-happened`
- `spec:flight-learn-inbox-ux#REQ-030`
- `spec:flight-learn-inbox-ux#REQ-031`
- `spec:flight-learn-inbox-ux#REQ-032`
- `spec:flight-learn-inbox-ux#SCN-010`
