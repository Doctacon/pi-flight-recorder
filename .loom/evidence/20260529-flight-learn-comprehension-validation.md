# Flight Learn Comprehension Validation Evidence

ID: evidence:20260529-flight-learn-comprehension-validation
Type: Evidence Dossier
Status: recorded
Created: 2026-05-29
Updated: 2026-05-29
Observed: 2026-05-29 UTC

## Summary

Prepared the comprehension-validation packet for `ticket:20260529-flight-learn-comprehension-validation` without fabricating operator comprehension. This run produced a synthetic/redacted render pack of 8 representative `/flight-learn` focused cards across draft-enabled and deterministic fallback states, plus a structured operator review packet with blank operator-note fields.

No actual operator review notes were collected in this run. The gate status is therefore `operator-review-pending`, and dogfood corpus/outcome collection must not start from this evidence.

Artifact directory:

```text
.loom/evidence/artifacts/20260529-flight-learn-comprehension-validation/
```

## Artifact Inventory

Key artifacts:

- `render-comprehension-validation-pack.mjs` - artifact-only render harness using synthetic/redacted fixture data and current inbox renderer.
- `00-render-index.json` - render pack index, coverage, states, and artifact filenames.
- `card-01-draft-repeated-workflow-92.txt` / `card-01-draft-repeated-workflow-72.txt` - draft repeated-workflow card.
- `card-02-fallback-repeated-workflow-92.txt` / `card-02-fallback-repeated-workflow-72.txt` - fallback repeated-workflow card.
- `card-03-draft-validation-build-92.txt` / `card-03-draft-validation-build-72.txt` - draft validation/build card.
- `card-04-fallback-validation-build-92.txt` / `card-04-fallback-validation-build-72.txt` - fallback validation/build card.
- `card-05-draft-stale-edit-92.txt` / `card-05-draft-stale-edit-72.txt` - draft stale-edit card.
- `card-06-fallback-stale-edit-92.txt` / `card-06-fallback-stale-edit-72.txt` - fallback stale-edit card.
- `card-07-draft-low-information-92.txt` / `card-07-draft-low-information-72.txt` - draft low-information card.
- `card-08-fallback-safety-adversarial-92.txt` / `card-08-fallback-safety-adversarial-72.txt` - fallback safety/adversarial card.
- `17-operator-review-packet.json` - structured operator review packet with one entry per card and blank `operatorNotes` fields.
- `18-worker-precheck.json` - worker-only precheck observations, explicitly marked not operator comprehension evidence.
- `19-render-line-widths.json` - render width check for all 16 rendered card artifacts.
- `20-diff-check.txt` - `git diff --check` result.
- `21-privacy-scan.json` - privacy scan over artifacts, this evidence dossier, and the ticket record.
- `22-ticket-status.txt` - scoped status for this ticket/evidence/artifact set.

## Render Pack Coverage

From `00-render-index.json`:

- Total representative cards: 8.
- Widths rendered: 92 and 72.
- Draft-enabled cards: 4.
- Deterministic fallback cards: 4.
- Accepted narrative cards: 0.
  - Reason: no accepted real/runtime narrative evidence is available; accepted-narrative integration remains blocked.
- Coverage:
  - repeated workflow: draft and fallback;
  - validation/build: draft and fallback;
  - stale edit: draft and fallback;
  - low-information: draft;
  - safety/adversarial: fallback after unsafe local-model wording rejection.

`19-render-line-widths.json` reports all rendered lines within requested JS string-width limits for both 92- and 72-column artifacts.

## Operator Review Packet

`17-operator-review-packet.json` has `status: "operator-review-pending"`. Each card entry includes:

- `cardId`, `title`, `state`, `coverage`, and render artifact references;
- operator prompt fields for:
  - `What happened?`
  - `Why does it matter?`
  - `Route or observe/no-artifact decision?`
  - `Confidence: clear / mostly clear / unclear`
  - `Any blocker, misleading wording, or missing evidence?`
- blank `operatorNotes` fields.

No worker-filled notes were placed in `operatorNotes`.

## Worker Precheck

`18-worker-precheck.json` is explicitly marked `notOperatorComprehensionEvidence: true`. It records that the render pack appears ready for operator review and that:

- rendered cards expose route/observe/dismiss/skip affordances and redacted evidence access;
- draft cards are visibly labeled as non-authoritative local LLM drafts and include deterministic source facts;
- fallback cards are less rich but disclose local model rejection/unavailability and remain non-dead-ending;
- the low-information case is intentionally sparse and should receive close operator scrutiny.

This worker precheck does not count toward the 80% operator-comprehension threshold.

## Privacy And Boundary Scan

`21-privacy-scan.json` reports:

```json
{
  "pass": true,
  "scannedFiles": 25,
  "forbiddenPatternCount": 0,
  "findings": []
}
```

This count is updated by the final scan after evidence/ticket writes. The scan checks artifacts, this evidence dossier, and the ticket record for raw home paths, Pi session paths, credential-looking assignments, bearer tokens, private keys, prompt markers, and transcript markers.

No product source files were in this ticket's write scope or intentionally edited for this validation slice. The workspace still contains pre-existing modified product source from prior Loom work; this ticket added only Loom evidence/ticket records and an artifact-local render harness.

## Gate Status

Gate status: `operator-review-pending`.

Do not proceed to `ticket:20260529-flight-learn-dogfood-corpus-outcomes` from this evidence. The ticket should remain blocked until the operator fills `17-operator-review-packet.json` or equivalent structured notes and at least 80% of representative cards are marked `clear` or `mostly clear`, with no safety/privacy blocker.

## What This Shows

- `ticket:20260529-flight-learn-comprehension-validation#ACC-001` is supported: the render pack covers 8 representative synthetic/redacted cards across draft, fallback, repeated workflow, validation/build, stale edit, low-information, and safety/adversarial states.
- `ticket:20260529-flight-learn-comprehension-validation#ACC-002` is prepared but not satisfied: the operator review packet exists, but actual operator notes are not collected.
- `ticket:20260529-flight-learn-comprehension-validation#ACC-003` is satisfied only as a negative/pending gate: gate decision is `operator-review-pending`; corpus/outcome collection must not start.
- `ticket:20260529-flight-learn-comprehension-validation#ACC-004` is supported within this evidence slice: artifacts are synthetic/redacted, privacy scan passed, this validation ticket did not intentionally edit product source or perform storage/routing mutation, and model output was not persisted as source-of-truth. Pre-existing dirty product source state remains outside this ticket's write scope.
- `ticket:20260529-flight-learn-comprehension-validation#ACC-005` is partially supported by render artifacts and worker precheck: fallback cards disclose local-model rejection/unavailability and preserve safe actions, but operator assessment is still pending.

## What This Does Not Show

- This does not prove operator comprehension.
- This does not prove real-session usefulness, release readiness, classifier readiness, or broad Bonsai/local-model quality.
- This does not collect dogfood route/outcome labels.
- This does not validate private Pi sessions.
- This does not run Bonsai, `llama-server`, hosted inference, or any model runtime.
- This does not authorize source/storage/routing/classifier side effects from model text.

## Recommendation

Block `ticket:20260529-flight-learn-comprehension-validation` on actual operator review notes. The next action is for the operator to fill `17-operator-review-packet.json` or provide equivalent structured review answers for the 8 rendered cards. After notes are collected, rerun the gate calculation and then request audit before closure.
