# Flight Learn Narrative Local Model Contract Third Follow-up Review

ID: audit:20260528-flight-learn-narrative-local-model-contract-third-followup-review
Type: Audit
Status: recorded
Created: 2026-05-28
Updated: 2026-05-28
Audited: 2026-05-28
Target: ticket:20260528-flight-learn-narrative-local-model-contract

## Summary

Ralph performed a third follow-up review after fixes for `audit:20260528-flight-learn-narrative-local-model-contract-second-followup-review`.

Verdict: `changes-needed`.

The review confirmed the previous exact examples were fixed, but two blocker classes remained:

- `FIND-TFU-001`: action advice still bypassed through article/adjective objects and `check` imperatives.
- `FIND-TFU-002`: bare `packet` / `bounded packet` / `redacted packet` and bare `Problem` meta-language could still be accepted.

Ralph output is preserved at:

```text
.loom/evidence/artifacts/20260528-flight-learn-narrative-local-model-contract/ralph-third-followup-audit-output.md
```

## Target

Review target:

- `ticket:20260528-flight-learn-narrative-local-model-contract`
- third fix attempt after prior changes-needed audits
- source/test/harness/evidence state for narrative local-model contract

## Audit Scope And Lenses

Lenses:

- action-advice bypasses including articles, adjectives, and alternate verbs
- false positives for descriptive nouns, passive validation wording, and supported `expectedBehavior`
- internal/meta echo via fact-packet/display-field terms
- intentional generic `stored evidence` allowance
- acceptance/evidence closure claims

## Context And Evidence Reviewed

Ralph reported inspecting the ticket, prior audits, local-model evidence dossier, harness summary/results/script, narrative corpus, relevant spec requirements, source, tests, git status/diff, focused tests, typecheck, diff-check, and non-writing fake-provider probes.

## Findings

### FIND-TFU-001 — Blocker — `whatHappened` still accepts action advice through article/adjective objects and `check` imperatives

Ralph reproduced accepted action advice such as:

```text
After reinstalling the package, run a validation from a fresh shell.
After reinstalling the package, run local validation from a fresh shell.
Check validation from a fresh shell after reinstalling the package.
After reinstalling the package, check validation from a fresh shell.
```

Required follow-up: extend action-advice detection for article/adjective objects and `check` imperatives, add tests and harness exercises, and preserve known false-positive guards.

### FIND-TFU-002 — Blocker — Internal/display-field echo boundary still has accepted `packet` and `Problem` meta-language

Ralph reproduced accepted internal/meta output such as:

```text
The packet points to the same stale shell pattern.
The bounded packet points to the same stale shell pattern.
The redacted packet points to the same stale shell pattern.
The Problem points to the same stale shell pattern.
```

Required follow-up: reject or explicitly disposition bare packet/Problem meta-language, add tests/harness probes, and keep the intentional `stored evidence` allowance.

## Verdict

`changes-needed`: closure is not supported until these remaining blockers are resolved.

## Required Follow-up

- Fix `FIND-TFU-001` and add focused tests plus harness exercises.
- Fix or disposition `FIND-TFU-002` and add focused tests plus harness exercises.
- Re-run focused tests, fake-provider narrative harness, typecheck, and `git diff --check`.
- Update ticket/evidence current state before another follow-up audit.

## Residual Risk

- Regex/token grounding remains heuristic.
- Fake-provider evidence does not prove Bonsai 4B quality, latency, or runtime behavior.
- Safe but generic low-quality prose remains accepted as `accepted-narrative-worse` residual risk.

## Related Records

- `ticket:20260528-flight-learn-narrative-local-model-contract`
- `audit:20260528-flight-learn-narrative-local-model-contract-review`
- `audit:20260528-flight-learn-narrative-local-model-contract-followup-review`
- `audit:20260528-flight-learn-narrative-local-model-contract-second-followup-review`
- `evidence:20260528-flight-learn-narrative-local-model-contract`
