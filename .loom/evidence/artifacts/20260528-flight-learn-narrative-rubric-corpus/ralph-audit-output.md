# Ralph Adversarial Audit Output

Ticket: `ticket:20260528-flight-learn-narrative-rubric-corpus`  
Audit date: 2026-05-28  
Verdict: **clear**

No material `FIND-###` findings. The corpus/rubric is fit to support closure of this shaping/evaluation ticket, with residual risks called out below for the implementation and real-model validation tickets.

## Review

- **Correct:** Scope adherence is supported. The ticket states this slice is evaluation infrastructure only and must not edit product source or run Bonsai (`.loom/tickets/20260528-flight-learn-narrative-rubric-corpus.md:15`, `:38-42`). The worker output says no product source/prompts/validators/UI/adapters/docs/model files/Bonsai/llama-server were changed or run (`.loom/evidence/artifacts/20260528-flight-learn-narrative-rubric-corpus/ralph-worker-output.md:48`). My `git status --short -- ... src/...` check showed only the new Loom ticket/evidence/artifact paths, not source files.
- **Correct:** ACC-001 is supported and the corpus is not happy-path-only. The corpus has 15 cases (`narrative-what-happened-eval-corpus.v1.json:210`) with outcome distribution 5 `accepted-narrative-better`, 1 `accepted-equivalent`, 1 `accepted-narrative-worse`, and 8 `fallback-expected` (`:274-278`). It includes a screenshot-shaped repetitive-headline case (`:300-306`) and example accepted narrative that adds recurrence context rather than duplicating the headline (`:424`). Required coverage flags for repetitive, useful narrative, screenshot-shaped, adversarial, low-info, and quality cases are all true (`:281-295`).
- **Correct:** ACC-002 is supported. The rubric separates useful narrative from deterministic equivalence through explicit outcome categories, including `accepted-narrative-better`, `accepted-equivalent`, `accepted-narrative-worse`, `accepted-unsupported`, `accepted-unsafe`, `fallback-expected`, and `fallback-unexpected` (`narrative-what-happened-eval-corpus.v1.json:123-129`). It requires reviewer notes by outcome (`:177-206`) and has hard-fail rules that prevent pleasant prose from passing when unsupported, unsafe, or non-display (`:168-175`). This directly addresses the risk that attractive prose could mask unsupported facts.
- **Correct:** ACC-003 is supported. The required adversarial probes are present: unsupported production/database claim (`narrative-what-happened-eval-corpus.v1.json:1343-1347`), raw command echo (`:1499-1503`), redacted local/session path echo (`:1663-1667`), redaction-placeholder/secret-looking echo (`:1827-1831`), route/action advice (`:1983-1987`), mutation/classifier/ranking claim (`:2140-2144`), overlong wall-of-text (`:2298-2302`), low-information invented cause (`:2442-2446`), and safe-but-generic no-better-than-deterministic prose (`:2600-2604`). These align with REQ-032’s forbidden raw commands, paths, session paths, secrets, route advice, mutation, classifier/ranking, and unsupported facts (`.loom/specs/flight-learn-inbox-ux.md:112-114`).
- **Correct:** ACC-004 is supported. The artifact declares no raw private session content, real user paths, secrets, stack traces, or prompts persisted (`narrative-what-happened-eval-corpus.v1.json:24-34`). The privacy scan covers the corpus, summary, and worker-output artifacts (`privacy-scan.v1.json:6-9`), reports 15 expected/actual cases (`:28-29`), zero forbidden matches (`:40-41`), and `pass` (`:69`). I also ran an independent grep over the artifact directory for actual home paths, Pi session paths, private-key blocks, bearer tokens, credential assignments, stack-trace lines, and prompt markers; it found no matches.
- **Correct:** The evidence does not overclaim Bonsai/product behavior. The evidence dossier explicitly says this does not prove Bonsai 4B can produce safe useful narratives, does not validate product source/prompts/validators/UI/adapters/model runtime, does not weaken privacy/display-only boundaries, and does not certify future model outputs or edits (`.loom/evidence/20260528-flight-learn-narrative-rubric-corpus.md:111-117`). The parent plan also forbids release-readiness claims from synthetic/redacted corpus evidence (`.loom/plans/20260528-flight-learn-4b-narrative-what-happened.md:47-55`) and reserves real Bonsai validation for a later unit (`:106-111`).
- **Fixed:** N/A — audit was read-only except for writing this requested audit artifact.
- **Blocker:** None.
- **Note:** The corpus is broad but intentionally shallow: most adversarial categories have one synthetic probe. That is enough for this ticket’s acceptance, but the implementation ticket should turn these probes into executable validator tests and add more variants if real Bonsai output exposes new failure modes.
- **Note:** The reusable artifact shape includes a narrative `maxChars` of 520 (`narrative-what-happened-eval-corpus.v1.json:53-55`), while the current generic local diagnosis polish source still has `whatHappened: 360` (`src/flight-learn-local-diagnosis-model.ts:125-127`). This is not a current-ticket failure because the next ticket owns the field-specific contract, but it is a required implementation decision.
- **Note:** Candidate probes use `expectedValidatorOutcome: "fallback"` while their probe-level `expectedRubricOutcome` may be `accepted-unsafe`/`accepted-unsupported`; the per-case `fallbackSemantics` explains that those labels apply if the validator accepts the bad output (`narrative-what-happened-eval-corpus.v1.json:1325`, `:1481`, `:1645`, `:1809`, `:1965`, `:2122`). The next ticket should preserve that interpretation in tests so end-to-end expected outcome remains `fallback-expected` for rejected unsafe probes.

## Required follow-up

- No required follow-up before closing this ticket.
- For `ticket:20260528-flight-learn-narrative-local-model-contract`, consume the corpus by asserting both validator behavior and human/rubric outcome semantics, especially for unsafe probes where fallback is the desired validator result.
- For real Bonsai claims, wait for the planned Bonsai 4B narrative validation unit; do not infer model quality from this synthetic corpus.

## Residual risk

- Synthetic/redacted cases do not prove Bonsai 4B will produce safe or useful prose.
- The privacy scan is targeted, not a formal DLP proof; rerun it after any artifact changes.
- One-probe-per-category coverage may miss variants such as different command syntaxes, Windows paths, unusual secret formats, or subtle route/action phrasing.

## What I inspected

- `.loom/tickets/20260528-flight-learn-narrative-rubric-corpus.md`
- `.loom/evidence/20260528-flight-learn-narrative-rubric-corpus.md`
- `.loom/evidence/artifacts/20260528-flight-learn-narrative-rubric-corpus/narrative-what-happened-eval-corpus.v1.json`
- `.loom/evidence/artifacts/20260528-flight-learn-narrative-rubric-corpus/narrative-what-happened-eval-summary.v1.json`
- `.loom/evidence/artifacts/20260528-flight-learn-narrative-rubric-corpus/privacy-scan.v1.json`
- `.loom/evidence/artifacts/20260528-flight-learn-narrative-rubric-corpus/ralph-worker-output.md`
- `.loom/plans/20260528-flight-learn-4b-narrative-what-happened.md`
- `.loom/specs/flight-learn-inbox-ux.md` (`REQ-030`..`REQ-032`, `SCN-010` focus)
- `.loom/evidence/20260528-flight-learn-narrative-what-happened-feedback.md`
- `src/flight-learn-local-diagnosis-model.ts` for current fact-packet/limit alignment context
- Read-only checks: JSON parse/coverage consistency script, targeted privacy grep, and scoped `git status`.
