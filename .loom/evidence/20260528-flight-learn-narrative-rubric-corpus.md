# Flight Learn Narrative Rubric Corpus Evidence

ID: evidence:20260528-flight-learn-narrative-rubric-corpus
Type: Evidence Dossier
Status: recorded
Created: 2026-05-28
Updated: 2026-05-28
Observed: 2026-05-28

## Summary

A narrative-specific `/flight-learn` `What happened?` corpus/rubric artifact was created for `ticket:20260528-flight-learn-narrative-rubric-corpus`.

The artifacts are synthetic/redacted and do not require Bonsai, `llama-server`, hosted providers, source changes, prompt changes, validator changes, UI changes, or raw private session data.

Artifact directory:

```text
.loom/evidence/artifacts/20260528-flight-learn-narrative-rubric-corpus/
```

Key artifacts:

- `narrative-what-happened-eval-corpus.v1.json` - 15-case narrative corpus with schema, rubric, outcome enums, reviewer note slots, redacted fact packets, positive narrative cases, and adversarial probes. Clarification on 2026-05-28: during the local-model contract audit follow-up, the accepted narrative text for `NARR-EVAL-005` was adjusted from internal wording `stored delta` to operator-facing `stored facts`; case IDs, coverage, and counts did not change.
- `narrative-what-happened-eval-summary.v1.json` - compact inventory and ACC support summary.
- `privacy-scan.v1.json` - targeted scan over the corpus and summary artifacts.

## Related Records

- `ticket:20260528-flight-learn-narrative-rubric-corpus`
- `plan:20260528-flight-learn-4b-narrative-what-happened`
- `spec:flight-learn-inbox-ux#REQ-030`
- `spec:flight-learn-inbox-ux#REQ-031`
- `spec:flight-learn-inbox-ux#REQ-032`
- `spec:flight-learn-inbox-ux#SCN-010`
- `evidence:20260528-flight-learn-narrative-what-happened-feedback`
- `evidence:20260527-prism-ml-small-model-comparison`

## Procedure

Source records and current source contracts were inspected first:

- `.loom/tickets/20260528-flight-learn-narrative-rubric-corpus.md`
- `.loom/plans/20260528-flight-learn-4b-narrative-what-happened.md`
- `.loom/specs/flight-learn-inbox-ux.md` with focus on `REQ-030` through `REQ-032` and `SCN-010`
- `.loom/evidence/20260528-flight-learn-narrative-what-happened-feedback.md`
- `.loom/evidence/20260527-prism-ml-small-model-comparison.md`
- `.loom/evidence/artifacts/20260527-local-diagnosis-model-eval-corpus-rubric/diagnosis-polish-eval-corpus.v1.json`
- `src/flight-learn-local-diagnosis-model.ts`
- `src/flight-learn-diagnosis.ts`

Artifacts were then generated under the ticket artifact directory, and JSON validity/privacy checks were run.

Commands run:

```bash
git status --short
node <<'NODE'
# generated narrative corpus, summary, and privacy scan artifacts
NODE
node -e "const fs=require('fs'); for (const f of ['.loom/evidence/artifacts/20260528-flight-learn-narrative-rubric-corpus/narrative-what-happened-eval-corpus.v1.json','.loom/evidence/artifacts/20260528-flight-learn-narrative-rubric-corpus/narrative-what-happened-eval-summary.v1.json','.loom/evidence/artifacts/20260528-flight-learn-narrative-rubric-corpus/privacy-scan.v1.json']) { JSON.parse(fs.readFileSync(f,'utf8')); console.log('valid json', f); }"
node <<'NODE'
# regenerated privacy scan after the worker-output artifact was written
NODE
node <<'NODE'
# checked JSON validity, 15 cases, required coverage booleans, ACC support booleans, and privacy scan pass state
NODE
```

The JSON parse check printed `valid json` for all three artifact JSON files. The structured validation check reported valid JSON artifacts, 15 cases, all required coverage booleans true, all ACC support booleans true, privacy scan `pass`, three scanned artifacts, and zero forbidden matches.

## Observations

`narrative-what-happened-eval-summary.v1.json` records:

```json
{
  "caseCount": 15,
  "primaryExpectedRubricOutcomeCounts": {
    "accepted-equivalent": 1,
    "accepted-narrative-better": 5,
    "accepted-narrative-worse": 1,
    "fallback-expected": 8
  }
}
```

Required coverage booleans are all `true`, including repetitive-headline cases, useful narrative cases, screenshot-shaped case, unsupported fact, raw command, raw path/session path, secret, redaction-placeholder, route/action, mutation, classifier/ranking, overlong, low-information, accepted-equivalent, and accepted-narrative-worse coverage.

`privacy-scan.v1.json` records:

```json
{
  "expectedCaseCount": 15,
  "actualCaseCount": 15,
  "forbiddenPatternCount": 0,
  "matches": [],
  "result": "pass"
}
```

The scan covers the corpus, summary, and worker-output artifacts. It also records allowed redacted synthetic sentinel counts for required adversarial probes, including redacted home-path placeholders, redacted Pi session file placeholders, redacted credential placeholders, and synthetic command probes. These are recorded as redacted test sentinels, not raw private session data.

## What This Shows

- `ticket:20260528-flight-learn-narrative-rubric-corpus#ACC-001` is supported by the artifact inventory: the corpus includes screenshot-shaped and other repetitive `Problem` / `What happened?` cases plus expected useful narrative behavior.
- `ticket:20260528-flight-learn-narrative-rubric-corpus#ACC-002` is supported by the rubric: it separates `accepted-narrative-better`, `accepted-equivalent`, `accepted-narrative-worse`, `accepted-unsupported`, `accepted-unsafe`, `fallback-expected`, and `fallback-unexpected`, and it includes qualitative reviewer note slots.
- `ticket:20260528-flight-learn-narrative-rubric-corpus#ACC-003` is supported by adversarial synthetic probes for unsupported facts, raw command/path/session details, secret/redaction-placeholder echo, route/action advice, mutation/classifier claims, overlong output, and low-information fallback.
- `ticket:20260528-flight-learn-narrative-rubric-corpus#ACC-004` is supported by the redacted reusable artifact shape, complete case IDs, and privacy scan with zero forbidden matches over corpus, summary, and worker-output artifacts.

## What This Does Not Show

- This does not prove Bonsai 4B can produce safe useful narratives.
- This does not validate product source, prompts, validators, UI rendering, adapters, CLI flags, or model runtime behavior.
- This does not authorize weakening privacy, raw-detail, route/action, mutation, classifier/ranking, or display-only boundaries.
- This does not replace the required adversarial audit before ticket closure.
- The privacy scan covers the created corpus, summary, and worker-output artifacts; it does not certify future model outputs or future edits.

## Freshness And Recheck Triggers

Re-run or supersede this evidence if the corpus, summary, privacy scan, narrative schema/rubric, fact-packet shape, local-model validator, or `REQ-030` through `REQ-032` / `SCN-010` behavior changes. The 2026-05-28 `NARR-EVAL-005` wording clarification should be re-audited if any future claim depends on exact historical corpus text rather than case shape/coverage.
