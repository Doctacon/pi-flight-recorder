# Bonsai 4B Narrative Validation Follow-up Review

ID: audit:20260528-bonsai-4b-narrative-validation-followup-review
Type: Audit
Status: recorded
Created: 2026-05-28
Updated: 2026-05-28
Audited: 2026-05-28/2026-05-29 UTC
Target: ticket:20260528-bonsai-4b-narrative-validation

## Summary

Follow-up audit of the Bonsai 4B narrative validation after the privacy-artifact blocker from `audit:20260528-bonsai-4b-narrative-validation-review`. The raw `/Users/.../pi-flight-recorder` repo path is no longer present in the Bonsai validation artifacts, the privacy scan now postdates the current artifact set and reports pass, and the ticket can close only as a negative validation result: 0 accepted / 15 fallback, no accepted visual narrative, deterministic fallback remains practical, and Bonsai 4B Q1_0 should not be used for accepted `/flight-learn` narrative wording under the current contract.

## Target

Reviewed `ticket:20260528-bonsai-4b-narrative-validation`, `evidence:20260528-bonsai-4b-narrative-validation`, prior audit `audit:20260528-bonsai-4b-narrative-validation-review`, and the current artifacts under `.loom/evidence/artifacts/20260528-bonsai-4b-narrative-validation/`.

This follow-up pass was limited to the operator's closure questions: privacy redaction, scan coverage/pass honesty, negative-result closure posture, local/loopback/no-download/no-source-default side effects, server stop status, and preservation of non-claims.

## Audit Scope And Lenses

Lenses used:

- privacy and artifact hygiene: raw local path redaction and whether the scan is stale or under-scoped;
- acceptance and evidence: whether ACC-001 through ACC-005 can close as a negative validation rather than a success visual claim;
- scope: hosted/non-loopback/download/source/default/runtime side-effect boundaries;
- claim discipline: preserving non-claims about broad Bonsai quality, judge quality, release readiness, and latency generalization.

Out of scope: editing artifacts, rerunning model validation, changing source, changing tickets/evidence, judging broad model quality, or accepting release readiness.

## Context And Evidence Reviewed

- Ralph review run: this bounded follow-up review subagent inspected the ticket, evidence, prior audit, current artifacts, source boundaries, git status, and ran read-only grep/JSON/process checks.
- `.loom/tickets/20260528-bonsai-4b-narrative-validation.md:16` - validation/evidence-only ticket; no source behavior change or new model download.
- `.loom/tickets/20260528-bonsai-4b-narrative-validation.md:41-45` - hosted/non-loopback/download/source/default/release-readiness exclusions.
- `.loom/tickets/20260528-bonsai-4b-narrative-validation.md:68-74` - ACC-004 privacy and ACC-005 conservative recommendation.
- `.loom/tickets/20260528-bonsai-4b-narrative-validation.md:78-86` - follow-up state records redaction, rerun scan, stopped server, 0 accepted / 15 fallback, and negative recommendation.
- `.loom/audit/20260528-bonsai-4b-narrative-validation-review.md:13` and `:29-41` - prior blocker was raw repo path in `post-validation-focused-tests.txt` plus stale/false-negative privacy scan.
- `.loom/evidence/20260528-bonsai-4b-narrative-validation.md:12-14` - real local Bonsai 4B run and 0/15 result under the current strict contract.
- `.loom/evidence/20260528-bonsai-4b-narrative-validation.md:37` - no hosted provider, non-loopback endpoint, new download, runtime install/build, source behavior, storage/routing/classifier, or release-readiness claim.
- `.loom/evidence/20260528-bonsai-4b-narrative-validation.md:111-127` - no accepted-narrative visual artifact; fallback render only.
- `.loom/evidence/20260528-bonsai-4b-narrative-validation.md:129-141` - privacy scan claim and redaction wording.
- `.loom/evidence/20260528-bonsai-4b-narrative-validation.md:169-177` - recorded follow-up redaction and privacy-scan rerun.
- `.loom/evidence/20260528-bonsai-4b-narrative-validation.md:179-185` - ACC support posture, including negative ACC-003 and conservative ACC-005.
- `.loom/evidence/20260528-bonsai-4b-narrative-validation.md:187-193` - preserved non-claims.
- `.loom/evidence/artifacts/20260528-bonsai-4b-narrative-validation/post-validation-focused-tests.txt:6` - Vitest output now uses `<repo>`, not the raw `/Users/...` path.
- `.loom/evidence/artifacts/20260528-bonsai-4b-narrative-validation/privacy-scan.json:2-5` - scan generated at `2026-05-29T00:34:10.565Z`, `pass: true`, zero forbidden patterns, no findings.
- `.loom/evidence/artifacts/20260528-bonsai-4b-narrative-validation/real-bonsai-4b-narrative-summary.json:3-15` - loopback base URL, hosted provider false, 0 accepted, 15 fallback, fallback reasons.
- `.loom/evidence/artifacts/20260528-bonsai-4b-narrative-validation/server-command.txt:1-7` and `runtime-provenance.txt:4-11` - redacted local model path, loopback server command, health.
- `.loom/evidence/artifacts/20260528-bonsai-4b-narrative-validation/server-final-status.txt:1-5` - recorded stop status.
- `.loom/evidence/artifacts/20260528-bonsai-4b-narrative-validation/real-4b-fallback-render.txt:1-10` - fallback-only focused-card render.
- `src/flight-learn-llama-cpp-adapter.ts:67-74`, `:101-125`, and `:337-342` - adapter remains explicit opt-in and canonical loopback-only for llama.cpp URLs.
- `src/pi-extension.ts:806-812` and `:820-836` - local model and optional narrative judge URLs are explicit CLI args; no default hosted/non-loopback model path is introduced.

Read-only checks run:

- `find .loom/evidence/artifacts/20260528-bonsai-4b-narrative-validation -type f` found 19 current artifact files.
- A mtime check showed all 18 non-scan artifact files were last modified around `2026-05-29T00:33:59Z`, before `privacy-scan.json` `generatedAt` at `2026-05-29T00:34:10.565Z`.
- `grep -RInE '/Users|/home/|/private/var|Code/personal' .loom/evidence/artifacts/20260528-bonsai-4b-narrative-validation` returned no matches.
- A wider local-marker grep only found the Unix owner name in `runtime-provenance.txt:5`; no raw absolute home/repo path remained.
- JSON coverage check found `corpusCount: 15`, `resultCount: 15`, `sameOrder: true`, no missing/extra IDs, no missing required fields, `acceptedByResults: 0`, `fallbackByResults: 15`, and no unsafe accepted IDs.
- URL/network grep over the validation artifacts found only loopback inference URLs plus static upstream GitHub informational URLs emitted by `llama-server`; no hosted model endpoint, provider key, curl/wget download command, or Hugging Face download command appeared.
- Live checks returned no process for PID `49092` and no listener on TCP port `18118`.
- `git status --short` still shows source/spec diffs from the broader narrative plan; this audit treats them as predecessor/integration context and does not convert them into a clean-tree claim for this validation ticket.

## Findings

None - no material blockers remain within the follow-up audit scope.

### Correct: raw repo path blocker is resolved

The prior blocker was the raw absolute repo path in `post-validation-focused-tests.txt`; the current artifact has `<repo>` at line 6 instead (`.loom/evidence/artifacts/20260528-bonsai-4b-narrative-validation/post-validation-focused-tests.txt:6`). Independent grep across all 19 current Bonsai validation artifact files found no `/Users`, `/home/`, `/private/var`, or `Code/personal` matches.

### Correct: privacy scan is no longer stale against the current artifact set

`privacy-scan.json` reports `pass: true`, `forbiddenPatternCount: 0`, and no findings (`.loom/evidence/artifacts/20260528-bonsai-4b-narrative-validation/privacy-scan.json:2-5`). Its `generatedAt` timestamp is after all current non-scan artifact mtimes in the directory, so the stale-scan failure mode from the prior audit is not reproduced. The scan artifact is minimal and does not list scanned files; the follow-up audit therefore independently verified the current 19-file artifact set.

### Correct: negative validation closure is supported

The structured summary records loopback `baseUrl`, `hostedProviderUsed: false`, 15 total cases, 0 accepted, 15 fallback, and fallback reasons of malformed JSON (12), schema-invalid (2), and timeout (1) (`.loom/evidence/artifacts/20260528-bonsai-4b-narrative-validation/real-bonsai-4b-narrative-summary.json:3-15`). The evidence states the result is under the current strict schema/verifier/local self-judge contract and recommends not treating Bonsai 4B Q1_0 as useful for accepted narrative wording today (`.loom/evidence/20260528-bonsai-4b-narrative-validation.md:12-14`, `:195-203`).

### Correct: no accepted visual narrative is claimed

The evidence explicitly says no real 4B narrative was accepted and that the fallback render does not prove the desired distinct narrative visual path (`.loom/evidence/20260528-bonsai-4b-narrative-validation.md:111-127`). The render itself discloses fallback and deterministic wording (`.loom/evidence/artifacts/20260528-bonsai-4b-narrative-validation/real-4b-fallback-render.txt:1-10`). This is the right closure posture for ACC-003: negatively answered, not success-proven.

### Correct: local/runtime boundaries are supported for this validation pass

The runtime command is loopback-only (`server-command.txt:1-7`), the summary says `hostedProviderUsed: false` and `baseUrl: http://127.0.0.1:18118` (`real-bonsai-4b-narrative-summary.json:3-5`), the adapter enforces explicit opt-in and canonical loopback HTTP (`src/flight-learn-llama-cpp-adapter.ts:67-74`, `:101-125`, `:337-342`), and the server-final artifact records `stopped` (`server-final-status.txt:1-5`). Live process/listener checks also found PID `49092` absent and no listener on port `18118`.

### Note: source/default side-effect claim remains bounded, not clean-tree

No validation artifact or reviewed source boundary shows a hosted/non-loopback/default model enablement or download change. However, current `git status --short` still shows source/spec diffs from the broader narrative plan. This is not a blocker for closing the validation ticket as a follow-up audit of the Bonsai evidence, but closure should phrase the side-effect claim as no validation-specific source/default/runtime mutation observed, not as a clean working tree or no source diffs in the repository.

### Note: minor privacy residue outside the original raw-path blocker

`runtime-provenance.txt:5` still includes the local Unix file owner name from `ls -l`. This is not the raw `/Users` repo path and did not trigger the current forbidden-pattern scan, so it is not a closure blocker for the requested follow-up. If the project later widens artifact privacy to remove local account names, redact that owner field too.

## Verdict

`clear` for follow-up closure, with bounded wording.

The privacy artifact blocker from the prior audit is resolved: the raw `/Users/.../pi-flight-recorder` path is gone, the scan no longer appears stale against the current artifact set, and independent grep/JSON/process checks support the ticket's negative validation story. The ticket can close as: real local Bonsai 4B Q1_0 under the current prompt/schema/verifier/5-second-timeout/local-self-judge contract produced 0 accepted narratives / 15 fallbacks; no accepted narrative visual path was proven; deterministic fallback remains the practical visible behavior; and Bonsai 4B Q1_0 should not be used for accepted `/flight-learn` narrative wording under the current contract.

Do not close it as a positive visual-narrative validation, a broad model-quality judgment, an independent judge-quality validation, a release-readiness claim, or generalized latency evidence.

## Required Follow-up

No required follow-up before closing this ticket as the bounded negative validation result.

Optional/non-blocking hygiene only: future privacy scans would be more self-evident if `privacy-scan.json` recorded scanned file count/list and if runtime provenance redacted local Unix owner names in addition to paths.

## Residual Risk

- The corpus is synthetic/redacted and small; it supports this contract-specific validation only.
- No accepted narrative reached display, so accepted-narrative UX quality is unproven by real Bonsai 4B.
- The same Bonsai endpoint was used as generator and judge, so judge quality and independent acceptance/rejection behavior remain unproven (`.loom/evidence/20260528-bonsai-4b-narrative-validation.md:63`, `:189-190`).
- Latency was one local run near a 5-second timeout and should not be generalized to other machines, timeouts, model modes, quantizations, or grammar-constrained decoding (`.loom/evidence/20260528-bonsai-4b-narrative-validation.md:84-97`, `:191`).
- Current repository working tree contains broader narrative-plan source/spec diffs; this audit does not prove a clean tree.

## Closure Recommendation

Close `ticket:20260528-bonsai-4b-narrative-validation` as a negative validation result only:

- accepted narratives: `0 / 15`;
- visible behavior: deterministic fallback with disclosure, not accepted Bonsai narrative UI;
- recommendation: do not use Bonsai 4B Q1_0 for accepted `/flight-learn` narrative wording under the current contract;
- follow-up, if desired: separate ticket for prompt/schema tuning, grammar-constrained JSON, alternate open-source local model, or independent local judge evaluation.

Preserve the non-claims already recorded in the evidence: no broad Bonsai inferiority, no independent judge quality proof, no release readiness, and no latency generalization.

## Related Records

- `ticket:20260528-bonsai-4b-narrative-validation`
- `evidence:20260528-bonsai-4b-narrative-validation`
- `audit:20260528-bonsai-4b-narrative-validation-review`
- `plan:20260528-flight-learn-4b-narrative-what-happened`
