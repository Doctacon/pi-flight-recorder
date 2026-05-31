# Flight Learn Narrative Local Model Contract Fifth Follow-up Review

ID: audit:20260528-flight-learn-narrative-local-model-contract-fifth-followup-review
Type: Audit
Status: recorded
Created: 2026-05-28
Updated: 2026-05-28
Audited: 2026-05-28
Target: ticket:20260528-flight-learn-narrative-local-model-contract

## Summary

Ralph performed a fifth follow-up review after fixes for `audit:20260528-flight-learn-narrative-local-model-contract-fourth-followup-review`.

Verdict: `changes-needed`.

The review confirmed fourth-follow-up examples were fixed, but found two remaining blocker classes:

- `FIND-5FU-001`: action advice bypasses after leading adverbs/prepositional or purpose phrases, such as `Now rerun...`, `For validation use...`, `During validation use...`, and `To validate ... use ...`.
- `FIND-5FU-002`: all-caps `PROBLEM(S)` meta echo bypass.

Ralph output is preserved at:

```text
.loom/evidence/artifacts/20260528-flight-learn-narrative-local-model-contract/ralph-fifth-followup-audit-output.md
```

## Target

Review target:

- `ticket:20260528-flight-learn-narrative-local-model-contract`
- fifth fix attempt after prior changes-needed audits
- source/test/harness/evidence state for narrative local-model contract

## Audit Scope And Lenses

Lenses:

- leading adverb/preposition/purpose action advice
- descriptive `Use of...` false-positive guard
- all-caps internal/display-field meta echo
- harness coverage and evidence overclaiming

## Context And Evidence Reviewed

Ralph reported inspecting active ticket, initial through fourth audits, evidence dossier, harness artifacts, narrative corpus, relevant spec requirements, source/tests, git status/diff, focused tests, typecheck, diff-check, and fake-provider probes.

## Findings

### FIND-5FU-001 — Blocker — action advice still bypasses after leading adverbs/prepositional or purpose phrases

Ralph reproduced accepted output such as:

```text
Now rerun validation from a fresh shell after reinstalling the package.
For validation use a fresh shell after reinstalling the package.
During validation use a fresh shell after reinstalling the package.
To validate the stale shell pattern use stored evidence.
```

Required follow-up: reject leading adverb/prepositional/purpose action-advice forms while preserving descriptive/passive text such as `Use of ... was expected`.

### FIND-5FU-002 — Blocker — all-caps `PROBLEM(S)` meta echo still bypasses

Ralph reproduced accepted output such as:

```text
The PROBLEM points to the same stale shell pattern.
The PROBLEMS point to the same stale shell pattern.
```

Required follow-up: reject all-caps display-label/meta echo without banning ordinary lower-case `problem` prose.

## Verdict

`changes-needed`: closure is not supported until these blockers are resolved.

## Required Follow-up

- Extend `whatHappened` action-advice detection for `now`, `for/during`, and `to ... use` variants.
- Preserve descriptive/passive and supported `expectedBehavior` cases.
- Reject all-caps `PROBLEM(S)` meta echo.
- Add focused tests and harness exercises, rerun checks, and update ticket/evidence.

## Residual Risk

- Regex/token grounding remains heuristic.
- Fake-provider evidence does not prove Bonsai 4B quality or runtime behavior.
- Safe but generic no-better prose remains accepted as a documented quality residual risk.

## Related Records

- `ticket:20260528-flight-learn-narrative-local-model-contract`
- `evidence:20260528-flight-learn-narrative-local-model-contract`
