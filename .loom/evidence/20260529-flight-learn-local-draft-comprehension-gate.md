# Flight Learn Local Draft Comprehension Gate Evidence

ID: evidence:20260529-flight-learn-local-draft-comprehension-gate
Type: Evidence Dossier
Status: recorded
Created: 2026-05-29
Updated: 2026-05-29
Observed: 2026-05-29 UTC

## Summary

Implemented `ticket:20260529-flight-learn-local-draft-comprehension-gate` as a bounded local diagnosis/inbox slice. Explicitly enabled local-model output now has distinct display states:

- `accepted-narrative` when the strict local narrative judge accepts the fact-cited narrative;
- `draft` when the generator output passes hard display gates but is not judge-accepted;
- `validated` for non-narrative model phrasing that passes hard gates;
- `deterministic` for disabled, unavailable, invalid, unsafe, or otherwise rejected output.

The draft state is display-only reading help. The focused card labels it as `Local LLM draft — facts below are source of truth; not judge-accepted` and shows deterministic source facts below the draft. Draft text does not route, rank, persist, create artifacts/rules, mutate source/docs/Loom, or feed classifier state.

No real Bonsai or `llama-server` calls were made for this ticket; tests and render artifacts use fake/local harness data only.

Artifact directory:

```text
.loom/evidence/artifacts/20260529-flight-learn-local-draft-comprehension-gate/
```

Key artifacts:

- `01-focused-tests.txt` - focused local diagnosis, inbox, and Pi extension tests.
- `02-typecheck.txt` - `npm run typecheck`.
- `03-build.txt` - `npm run build`.
- `04-full-tests.txt` - full `npm test`.
- `05-diff-check.txt` - `git diff --check`.
- `06-render-draft-card-92.txt` - representative draft focused-card render at width 92.
- `07-render-fallback-card-92.txt` - representative deterministic fallback render at width 92.
- `08-render-draft-card-72.txt` - narrow draft focused-card render at width 72.
- `09-render-fallback-card-72.txt` - narrow fallback focused-card render at width 72.
- `10-render-line-widths.txt` - JS-length width check for render artifacts.
- `11-privacy-scan.json` - privacy scan over this ticket's evidence artifacts.
- `12-side-effect-scan.txt` - targeted source/side-effect scan notes.
- `13-record-privacy-scan.txt` - privacy scan over this evidence dossier and ticket record.
- `14-final-diff-check.txt` - final `git diff --check` after initial evidence/ticket updates.
- `15-followup-focused-tests.txt` - focused tests after audit follow-up fixes.
- `16-followup-typecheck.txt` - `npm run typecheck` after audit follow-up fixes.
- `17-followup-build.txt` - `npm run build` after audit follow-up fixes.
- `18-followup-full-tests.txt` - full `npm test` after audit follow-up fixes.
- `19-followup-diff-check.txt` - `git diff --check` after audit follow-up fixes.
- `20-final-diff-check.txt` - final `git diff --check` after closure/plan updates.
- `21-final-privacy-scan.json` - final privacy scan after closure/plan updates.
- `22-final-ticket-plan-status.txt` - final selected ticket/plan status summary.
- `render-local-draft-card.mjs` - fake-data render harness.

## Source Changes Observed

Changed implementation seams:

- `src/flight-learn-local-diagnosis-model.ts`
  - Added `displayState` and `narrativeStatus` to separate accepted narrative, draft, validated phrasing, and deterministic fallback states.
  - Kept the existing hard generator gates before any draft display: JSON/schema shape, length bounds, known fact IDs for narrative sentences, privacy/safety checks, route/action/mutation/classifier guardrails, duplicate filtering, and deterministic fallback on invalid output.
  - Added follow-up narrative hard gates for unsupported concrete/mutation claims so citing a known fact ID is not enough to display source/database/production mutation claims as draft reading help.
  - Preserved strict accepted-narrative promotion: only the local judge can produce `displayState: "accepted-narrative"` / `narrativeStatus: "accepted"`.
  - Added draft display when hard-gated narrative output is not judge-accepted because the judge is missing, uncertain, rejects unsupported facts, errors, times out, or returns malformed/schema-invalid JSON.
  - Kept unsafe/action-advice judge outcomes fail-closed to deterministic fallback rather than draft display, including mixed responses where unsafe/action-advice appears alongside unsupported claims or top-level fail-closed reasons.
- `src/flight-learn-inbox.ts`
  - Added draft-specific status copy and deterministic `Source facts` section for the focused card.
  - Split focused-card footer hints into `Keys:` and `Actions:` lines so `d dismiss` and `s skip` remain visible at width 72 and 92.
  - Kept existing route/observe/dismiss/skip affordances visible and human-controlled.
- `src/flight-learn-local-diagnosis-model.test.ts`
  - Added/updated coverage for accepted narrative vs draft vs deterministic fallback states, missing judge draft display, non-unsafe judge failures as draft, unsafe judge veto fallback, hard-gate rejections, and no source delta mutation.
- `src/flight-learn-inbox.test.ts`
  - Added focused-card render coverage for draft status labeling, deterministic source facts, hidden validation issue text, width safety, and unchanged route-selected output.
- `src/pi-extension.test.ts`
  - Added fake local-server integration coverage showing `/flight-learn --local-model-polish --local-model-url ...` can display a draft without judge acceptance and still stores only the human-selected route/candidate using deterministic source fields.

The existing explicit local-model flag/config path is reused. No new visible command or default model call was added.

## Validation Commands

| Artifact | Command | Result |
| --- | --- | --- |
| `01-focused-tests.txt` | `npm test -- src/flight-learn-local-diagnosis-model.test.ts src/flight-learn-inbox.test.ts src/pi-extension.test.ts` | 3 files passed, 68 tests passed |
| `02-typecheck.txt` | `npm run typecheck` | passed |
| `03-build.txt` | `npm run build` | passed |
| `04-full-tests.txt` | `npm test` | 21 files passed, 144 tests passed |
| `05-diff-check.txt` | `git diff --check` | no output, passed |
| `14-final-diff-check.txt` | final `git diff --check` after initial evidence/ticket updates | no output, passed |
| `15-followup-focused-tests.txt` | `npm test -- src/flight-learn-local-diagnosis-model.test.ts src/flight-learn-inbox.test.ts src/pi-extension.test.ts` after audit follow-up | 3 files passed, 69 tests passed |
| `16-followup-typecheck.txt` | `npm run typecheck` after audit follow-up | passed |
| `17-followup-build.txt` | `npm run build` after audit follow-up | passed |
| `18-followup-full-tests.txt` | `npm test` after audit follow-up | 21 files passed, 145 tests passed |
| `19-followup-diff-check.txt` | `git diff --check` after audit follow-up | no output, passed |
| `20-final-diff-check.txt` | final `git diff --check` after closure/plan updates | no output, passed |
| `21-final-privacy-scan.json` | final privacy scan after closure/plan updates | passed; 27 files scanned, 0 forbidden findings |
| `22-final-ticket-plan-status.txt` | selected ticket/plan status summary | local draft gate closed; comprehension validation open |

Render artifacts show both draft and fallback cards at width 92 and width 72. `10-render-line-widths.txt` records all rendered lines at or under the requested JS string-width limits. After audit follow-up, the render artifacts show both `d dismiss` and `s skip` on a separate `Actions:` line at width 92 and 72.

## Privacy And Boundary Scan

`11-privacy-scan.json` reports:

```json
{
  "checkedFiles": 27,
  "findings": []
}
```

Command artifacts were redacted to replace the local repository path with `<repo>` before scanning. The scan checked this ticket's artifacts for raw home paths, Pi session paths, credential-looking assignments, bearer tokens, and private keys. `13-record-privacy-scan.txt` separately reports no findings for this evidence dossier and the ticket record.

`12-side-effect-scan.txt` records a targeted seam scan. Write-like source hits in the local diagnosis/inbox seams are guardrail/status/render strings or keyboard key names, not runtime writes. Classifier/route-authority hits are display-copy/guardrail strings and pre-existing human route selection output types, not model-driven route selection or classifier APIs.

## What This Shows

- `ACC-001` is supported: tests distinguish accepted narrative, hard-gated draft, validated non-narrative phrasing, and deterministic fallback states.
- `ACC-002` is supported: Pi extension tests reuse `--local-model-polish --local-model-url ...`; default `/flight-learn` remains deterministic and visible command surface tests still pass.
- `ACC-003` is supported within hard-gate scope after audit follow-up: focused tests reject malformed/schema-invalid output, unknown fact IDs, known-fact-ID unsupported concrete/mutation claims, raw paths/session markers, secrets, stack traces, prompt/transcript markers, route/action advice, mutation instructions, classifier/ranking claims, overlong text, unsafe/action-advice judge verdicts mixed with unsupported claims, and top-level unsafe/action-advice judge fail-closed reasons.
- `ACC-004` is supported by render artifacts and inbox tests after audit follow-up: draft cards show a clear non-authoritative label, deterministic source facts, evidence access, human-controlled follow-up actions, and visible `d dismiss` / `s skip` affordances at width 92 and 72; fallback cards disclose rejected/unavailable local model state without dead-ending review.
- `ACC-005` is supported by tests and scan: model/draft text does not mutate stored delta fields, route choices/ranking, artifact candidates, rules, source/docs/Loom/skills/prompts, or classifier state. Pi extension tests verify routed summaries and proposed drafts omit draft/accepted narrative text and no rule records are created.
- `ACC-006` is ready for audit handoff: focused tests, typecheck, build, full tests, diff-check, render artifacts, privacy scan, side-effect scan, evidence dossier, and ticket update are recorded.

## What This Does Not Show

- This does not prove operator comprehension, real-session usefulness, release readiness, or corpus/outcome collection readiness.
- This does not prove Bonsai 4B quality or run a real local model.
- This does not relax the accepted-narrative verifier/judge contract; draft display remains non-authoritative.
- This does not authorize hosted inference, non-loopback endpoints, model downloads, new model families, automatic route selection, classifier automation, or source/docs/Loom mutation.

## Audit Follow-up

Initial audit `audit:20260529-flight-learn-local-draft-comprehension-gate-review` returned `changes-needed`:

- `FIND-001`: narrative draft hard gates allowed unsupported concrete/mutation claims when any known fact ID was cited. Disposition: added a narrative-level unsupported concrete/mutation gate and focused tests proving `source file was changed` and `database migration corrupted production data` are rejected/fallback even when citing known fact IDs.
- `FIND-002`: unsafe/action-advice judge signals could be downgraded to draft when mixed with unsupported claims or inconsistent top-level reasons. Disposition: unsafe/action-advice sentence verdicts and top-level fail-closed reasons now take precedence and force deterministic fallback; focused tests cover mixed `unsupportedClaims` and top-level unsafe/action-advice reasons.
- `FIND-003`: focused-card render artifacts clipped dismiss/skip affordances. Disposition: split the footer into `Keys:` and `Actions:` lines, regenerated 72/92 width render artifacts, and updated tests/width checks.

Follow-up audit `audit:20260529-flight-learn-local-draft-comprehension-gate-followup-review` returned clear for bounded closure.

## Next Move

`ticket:20260529-flight-learn-local-draft-comprehension-gate` is closed. Next: execute `ticket:20260529-flight-learn-comprehension-validation` to evaluate whether draft-enabled cards are understandable enough for human routing.
