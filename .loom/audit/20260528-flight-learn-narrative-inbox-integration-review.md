# Flight Learn Narrative Inbox Integration Review

ID: audit:20260528-flight-learn-narrative-inbox-integration-review
Type: Audit
Status: recorded
Created: 2026-05-28
Updated: 2026-05-28
Audited: 2026-05-28
Target: ticket:20260528-flight-learn-narrative-inbox-integration

## Summary

Adversarial review found no material blockers for the bounded UI-consumption ticket. The focused card now has evidence that it can display an already accepted `LocalDiagnosisPolishResult` with a concise `Problem` and a distinct two-sentence `What happened?` narrative, while preserving fallback disclosure, route/storage safety, and honest non-claims about real Bonsai/judge/runtime quality.

## Target

Reviewed `ticket:20260528-flight-learn-narrative-inbox-integration`, its evidence dossier/artifacts, the focused-card renderer/tests, and predecessor closure audits for the fact-ID verifier and fake-provider local narrative judge contract.

This audit is limited to the integration ticket's declared scope: consuming an already accepted local narrative result in the `/flight-learn` focused card. It does not validate real Bonsai 4B output, real local judge quality, real runtime lifecycle, CLI judge configuration, release readiness, or production Pi TUI behavior.

## Audit Scope And Lenses

Lenses used:

- acceptance: ACC-001 through ACC-005 closure posture;
- product/UX: whether the screenshot feedback is actually addressed in the accepted-narrative path;
- fallback/disclosure: whether local-model fallback states remain safe and not misleading;
- scope: whether routing, storage, artifacts, rules, classifier behavior, commands, model defaults, and runtime lifecycle remain untouched by this ticket;
- evidence honesty: whether render/test/typecheck/diff evidence supports only the bounded UI-consumption claim.

Out of scope: implementing fixes, editing source, real model/judge runs, downloading models, changing CLI/runtime configuration, and proving the predecessor contracts beyond checking their final audits.

## Context And Evidence Reviewed

- Ralph review run: this bounded adversarial review subagent inspected records, artifacts, source/tests, diffs, and ran read-only validation commands.
- `.loom/tickets/20260528-flight-learn-narrative-inbox-integration.md:15` - single closure claim for concise `Problem`, distinct narrative `What happened?`, fallback/disclosure, and no route/storage/source behavior changes.
- `.loom/tickets/20260528-flight-learn-narrative-inbox-integration.md:31-47` - in-scope and out-of-scope boundaries.
- `.loom/tickets/20260528-flight-learn-narrative-inbox-integration.md:57-74` - ACC-001 through ACC-005.
- `.loom/evidence/20260528-flight-learn-narrative-inbox-integration.md:36-51` - narrow implementation procedure and accepted-result test intent.
- `.loom/evidence/20260528-flight-learn-narrative-inbox-integration.md:53-101` - recorded focused tests, render harness, typecheck, build, full tests, and diff-check.
- `.loom/evidence/20260528-flight-learn-narrative-inbox-integration.md:119-133` - ACC support claims and explicit non-claims.
- `.loom/evidence/artifacts/20260528-flight-learn-narrative-inbox-integration/render-output.txt:1-43` - width-88 focused-card render with line-length report.
- `.loom/specs/flight-learn-inbox-ux.md:106-114` and `.loom/specs/flight-learn-inbox-ux.md:209-220` - REQ-024 through REQ-032 and SCN-010.
- `src/flight-learn-inbox.ts:181-185` - disclosure/fallback status wording.
- `src/flight-learn-inbox.ts:464-511` - focused-card rendering, including `polishedResult?.view` consumption and separate `Problem` / `What happened?` sections.
- `src/flight-learn-inbox.ts:710-713` - route selection returns a human-selected route result without storing artifacts by itself.
- `src/flight-learn-inbox.test.ts:125-136` and `src/flight-learn-inbox.test.ts:304-332` - accepted narrative fixture and focused-card test for distinct sections, width, route result, and unchanged stored delta field.
- `src/flight-learn-inbox.test.ts:334-356` - focused-card fallback disclosure hides raw validation issue and shows deterministic wording.
- `src/pi-extension.ts:806-819` - local-model polish remains explicitly opt-in by args and does not configure a judge provider in this ticket.
- `src/pi-extension.ts:866-879` - custom inbox route-selected flow still asks for rationale before applying a route.
- `src/pi-extension.test.ts:653-740` - existing fake-Pi local-model display/no-persistence coverage.
- `src/pi-extension.test.ts:820-859` - existing fake-Pi unavailable-runtime fallback disclosure coverage.
- `src/flight-learn-local-diagnosis-model.ts:660-705` - upstream result only becomes `usedLocalModel: true` after provider response validation and, for narrative candidates, judge validation.
- `src/flight-learn-local-diagnosis-model.test.ts:126-138`, `:260-405`, `:444-491`, `:764-821`, `:909-942` - disabled/unavailable/judge/invalid/unsafe/error/timeout fallback coverage inherited from predecessor tickets.
- `.loom/audit/20260528-narrative-fact-id-contract-verifier-narrowed-scope-review.md:82-101` - predecessor fact-ID verifier final verdict, required follow-up, residual risk, and closure recommendation.
- `.loom/audit/20260528-local-narrative-judge-provider-contract-followup-review.md:88-109` - predecessor judge-provider final verdict, residual risk, and closure recommendation.

Commands run from `/Users/crlough/Code/personal/pi-flight-recorder`:

```bash
npm test -- src/flight-learn-inbox.test.ts
npm run typecheck
git diff --check
npm test
node --import tsx .loom/evidence/artifacts/20260528-flight-learn-narrative-inbox-integration/render-narrative-focused-card.mjs | tail -n 8
```

Results:

- Focused inbox tests passed: `1` file / `12` tests.
- `npm run typecheck` passed.
- `git diff --check` exited `0`.
- Full Vitest suite passed: `21` files / `138` tests. The run emitted Node experimental SQLite warnings but no test failures.
- Render harness reported `maxLineLength: 88`, `lineCount: 37`.

I did not rerun `npm run build` because it runs `npm run clean` and writes `dist/`; the recorded build evidence remains in `.loom/evidence/artifacts/20260528-flight-learn-narrative-inbox-integration/build.txt`.

## Findings

None - no material findings within the audited UI-consumption scope.

## ACC Closure Posture

- ACC-001: Close-ready for UI consumption. The render artifact shows concise `Problem` at `render-output.txt:6-7` and a longer distinct narrative `What happened?` at `render-output.txt:9-12`. The test fixture supplies the same accepted narrative shape at `src/flight-learn-inbox.test.ts:125-136`, and the assertion verifies the sections are not duplicated at `src/flight-learn-inbox.test.ts:315-320`.
- ACC-002: Close-ready in bounded scope. The renderer discloses accepted model phrasing or fallback state without showing raw validation details (`src/flight-learn-inbox.ts:181-185`). Focused UI fallback coverage checks timeout wording and hides the provider issue (`src/flight-learn-inbox.test.ts:334-356`), while predecessor/local tests cover disabled, unavailable, invalid, unsafe, malformed, provider-error, and timeout fallbacks to deterministic text.
- ACC-003: Close-ready for this ticket. The inbox consumes display wording through `polishedResult?.view` but route selection still only returns a selected route/result (`src/flight-learn-inbox.ts:474-488`, `src/flight-learn-inbox.ts:710-713`), and Pi integration still asks for a rationale before storing a candidate (`src/pi-extension.ts:866-879`). Existing tests verify accepted local wording is not persisted into stored delta summaries/artifact drafts and rules are not created (`src/pi-extension.test.ts:718-731`).
- ACC-004: Close-ready for bounded render evidence. Narrative render at width 88 remains scannable with evidence and route sections below it (`render-output.txt:24-38`) and reports max line length 88 (`render-output.txt:40-43`). The narrative test enforces line width at 88 (`src/flight-learn-inbox.test.ts:321-323`), and existing focused-card width tests cover 48/72/104 for the generic layout.
- ACC-005: Close-ready. Recorded evidence includes focused 4-file tests, typecheck, build, full tests, and diff-check (`.loom/evidence/20260528-flight-learn-narrative-inbox-integration.md:53-101`); this audit re-ran focused inbox tests, typecheck, diff-check, full tests, and render harness tail successfully.

## Correct Observations

- The implementation really addresses the screenshot feedback in the accepted-result path: `Problem` is a short headline and `What happened?` is a narrative paragraph, not a duplicate headline (`render-output.txt:6-12`).
- The ticket stayed narrow. `src/flight-learn-inbox.ts` already had the consumption seam: it uses `item.localDiagnosisPolish` only while editable fields still match the stored delta and otherwise rebuilds deterministic wording (`src/flight-learn-inbox.ts:474-475`). The direct new test exercises that seam without changing routing/storage code.
- The fallback disclosure is safe enough for this scope: it is unobtrusive, deterministic fallback wording remains visible, and raw provider/validation details are not rendered (`src/flight-learn-inbox.test.ts:354-356`, `src/pi-extension.test.ts:856-859`).
- The evidence is honest about scope. It explicitly says no real Bonsai model, real judge model, runtime start, download, hosted call, new command, storage/routing/classifier behavior change, artifact/rule/source mutation, or release-readiness claim was exercised or added (`.loom/evidence/20260528-flight-learn-narrative-inbox-integration.md:34`). It also states the evidence does not prove real Bonsai/judge/runtime/CLI judge configuration quality (`.loom/evidence/20260528-flight-learn-narrative-inbox-integration.md:127-133`).
- Predecessor closure posture is coherent for use as dependencies: the fact-ID verifier closed only under narrowed deterministic scope and not broad semantic safety (`.loom/audit/20260528-narrative-fact-id-contract-verifier-narrowed-scope-review.md:82-101`), while the judge-provider ticket closed only for fake-provider/provider-interface scope and not real judge/model/UI/release quality (`.loom/audit/20260528-local-narrative-judge-provider-contract-followup-review.md:88-109`).

## Verdict

`clear` for `ticket:20260528-flight-learn-narrative-inbox-integration` as a bounded UI-consumption ticket.

The focused card can now consume an already accepted local narrative result and render the intended concise `Problem` plus distinct longer `What happened?` narrative without changing route/storage/artifact/rule/classifier/command/runtime behavior. The evidence is appropriately narrow and does not overclaim real Bonsai, real judge, CLI judge configuration, or release readiness.

## Required Follow-up

No required follow-up before closing this ticket for the bounded UI-consumption scope.

Before making any stronger claim that `/flight-learn --local-model-polish` will produce accepted Bonsai 4B narratives end-to-end, complete the later real validation/configuration work in `ticket:20260528-bonsai-4b-narrative-validation` or a dedicated CLI judge-configuration ticket.

## Residual Risk

- The focused card trusts the `LocalDiagnosisPolishResult` it is handed; it does not re-validate narrative grounding or judge acceptance. That is consistent with this ticket but means predecessor/local-model boundaries must remain intact.
- There is still no real Bonsai 4B, real judge model, real Pi TUI screenshot, latency, JSON reliability, or CLI judge-provider configuration evidence.
- Narrative-specific visual artifact coverage is at width 88 only; generic focused-card tests cover other widths. This is sufficient for bounded closure but not for strong visual-release claims.
- Current CLI plumbing remains generator-polish only: `localDiagnosisPolishOptionsFromArgs` builds llama.cpp polish options from explicit args and does not configure a narrative judge provider (`src/pi-extension.ts:806-819`). Accepted narrative results are therefore proven as a consumption seam, not as a default runtime path.

## Closure Recommendation

Close `ticket:20260528-flight-learn-narrative-inbox-integration` for its declared UI-consumption scope. Do not use this closure to claim real model/judge/runtime quality, CLI judge configuration, full REQ-032 release readiness, or end-to-end Bonsai narrative availability.

## Related Records

- `ticket:20260528-flight-learn-narrative-inbox-integration`
- `evidence:20260528-flight-learn-narrative-inbox-integration`
- `plan:20260528-flight-learn-4b-narrative-what-happened`
- `spec:flight-learn-inbox-ux`
- `audit:20260528-narrative-fact-id-contract-verifier-narrowed-scope-review`
- `audit:20260528-local-narrative-judge-provider-contract-followup-review`
