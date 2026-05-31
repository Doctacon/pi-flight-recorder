# Flight Learn Narrative Local Model Contract Fourth Follow-up Review

ID: audit:20260528-flight-learn-narrative-local-model-contract-fourth-followup-review
Type: Audit
Status: recorded
Created: 2026-05-28
Updated: 2026-05-28
Audited: 2026-05-28
Target: ticket:20260528-flight-learn-narrative-local-model-contract

## Summary

Ralph performed a fourth follow-up review after fixes for `audit:20260528-flight-learn-narrative-local-model-contract-third-followup-review`.

Verdict: `changes-needed`.

The review found that exact third-follow-up examples were covered, but adjacent action-advice and plural internal/meta echo variants still bypassed validation:

- `FIND-FFU-001`: `run the current validation`, `rerun your validation`, `check the current validation`, `validate current result`, and `Use ...` imperative phrasing were accepted.
- `FIND-FFU-002`: plural `deltas`, `packets`, `headlines`, and capitalized `Problems` meta-language were accepted.

Ralph output is preserved at:

```text
.loom/evidence/artifacts/20260528-flight-learn-narrative-local-model-contract/ralph-fourth-followup-audit-output.md
```

## Target

Review target:

- `ticket:20260528-flight-learn-narrative-local-model-contract`
- fourth fix attempt after prior changes-needed audits
- source/test/harness/evidence state for narrative local-model contract

## Audit Scope And Lenses

Lenses:

- common imperative/action-advice phrasing
- descriptive/passive false-positive guards
- internal/meta echo singular and plural variants
- intentional generic `stored evidence` allowance
- harness/corpus/evidence consistency
- acceptance closure support

## Context And Evidence Reviewed

Ralph reported inspecting ticket records, prior audits, evidence dossier, harness artifacts, narrative corpus, source/tests, relevant spec context, git diff/status, focused tests, typecheck, diff-check, and non-writing fake-provider probes.

## Findings

### FIND-FFU-001 — Blocker — `whatHappened` still accepts common imperative action advice

Accepted examples included:

```text
After reinstalling the package, run the current validation from a fresh shell.
Rerun your validation from a fresh shell after reinstalling the package.
Check the current validation from a fresh shell after reinstalling the package.
Validate current result from a fresh shell after reinstalling the package.
Use a fresh shell for validation after reinstalling the package.
Use stored evidence to validate the stale shell pattern.
```

Required follow-up: broaden action-advice detection for common determiners/adjectives and `use` while preserving descriptive/passive and supported `expectedBehavior` cases.

### FIND-FFU-002 — Blocker — Internal/meta echo still bypasses via plural display-field terms

Accepted examples included:

```text
The deltas point to the same stale shell pattern.
The packets point to the same stale shell pattern.
The headlines point to the same stale shell pattern.
The Problems point to the same stale shell pattern.
```

Required follow-up: reject plural internal/meta terms or explicitly disposition them, add tests/harness probes, and preserve the `stored evidence` allowance.

## Verdict

`changes-needed`: closure is not supported until these remaining blockers are resolved.

## Required Follow-up

- Fix common imperative/action-advice bypasses and add tests/harness exercises.
- Fix plural internal/meta echo bypasses and add tests/harness exercises.
- Re-run focused tests, fake-provider harness, typecheck, and `git diff --check`.
- Update ticket/evidence current-state wording before another audit.

## Residual Risk

- Regex/token grounding remains heuristic and may need continued adversarial probes.
- Fake-provider evidence does not prove Bonsai 4B quality or runtime behavior.
- Safe generic low-quality prose remains a recorded quality residual risk.

## Related Records

- `ticket:20260528-flight-learn-narrative-local-model-contract`
- `evidence:20260528-flight-learn-narrative-local-model-contract`
