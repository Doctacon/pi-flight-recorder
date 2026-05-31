# Narrative Fact-ID Contract Verifier Second Follow-up Review

ID: audit:20260528-narrative-fact-id-contract-verifier-second-followup-review
Type: Audit
Status: recorded
Created: 2026-05-28
Updated: 2026-05-28
Audited: 2026-05-28
Target: ticket:20260528-narrative-fact-id-contract-verifier
Follows: audit:20260528-narrative-fact-id-contract-verifier-followup-review

## Summary

Second follow-up adversarial review confirms the three specifically challenged fixes are present for the tested cases: single exact role-labelled source text is omitted from the fact packet and prompt, `ls -la`/`curl ...` narrative literals now fail closed, and sentence-level `role` is rejected as an extra key. Closure is still not recommended because ACC-003 and the evidence claim remain broader than the implementation: small fake-provider probes found project/common command literals and follow-up/classifier advice variants that still pass the deterministic `whatHappened` verifier.

Verdict: `changes-needed`.

## Target

Reviewed `ticket:20260528-narrative-fact-id-contract-verifier` after fixes for `audit:20260528-narrative-fact-id-contract-verifier-followup-review`. The target remains the deterministic fact-ID verifier / fake-provider scope only: no real Bonsai/llama.cpp runtime, no local judge provider, no UI screenshot validation, no release readiness, no source edits by this auditor.

## Audit Scope And Lenses

Lenses used:

- acceptance: ACC-001 through ACC-005
- follow-up disposition: the first follow-up findings for single-role prompt/transcript-like leakage, `ls`/`curl` command literals, and optional sentence `role` ambiguity
- security and trust boundary: prompt/transcript leakage, hard raw-command safety, route/action/classifier display-only boundaries, local-first adapter behavior
- claim and evidence: whether evidence prose is honest about deterministic coverage and non-claims

Out of scope: implementing fixes, rerunning the artifact-writing harness, real model/runtime validation, and judge-provider quality.

## Context And Evidence Reviewed

- Ralph review run: this second follow-up adversarial review subagent, bounded to source/tests/records/probes and no source edits.
- `.loom/tickets/20260528-narrative-fact-id-contract-verifier.md` - acceptance criteria and current state.
- `.loom/audit/20260528-narrative-fact-id-contract-verifier-review.md` - initial findings.
- `.loom/audit/20260528-narrative-fact-id-contract-verifier-followup-review.md` - first follow-up findings under recheck.
- `.loom/evidence/20260528-narrative-fact-id-contract-verifier.md` - updated evidence and claims; especially ACC support at lines 123-127, second follow-up fix claims at lines 154-159, and non-claims at lines 163-165.
- `.loom/evidence/artifacts/20260528-narrative-fact-id-contract-verifier/harness-summary.json` and `fact-id-contract-harness-results.json` - recorded `16/16` harness pass; not rerun because the harness writes artifact JSON files and this audit was no-source-edit/no-extra-artifact except this audit record.
- `src/flight-learn-local-diagnosis-model.ts` - fact packet, prompt, schema verifier, hard safety patterns.
- `src/flight-learn-local-diagnosis-model.test.ts` - focused contract tests.
- `src/flight-learn-llama-cpp-adapter.ts` and `src/flight-learn-llama-cpp-adapter.test.ts` - local loopback adapter and fake runtime tests.
- `src/pi-extension.ts` / `src/pi-extension.test.ts` - display-only integration path and fake Pi fixture updates.
- Commands run:
  - `git status --short` - working tree contains expected source/test/Loom changes plus the already-modified spec record and many untracked Loom records/artifacts from this work stream.
  - `git diff --name-only` - tracked modified files: `.loom/specs/flight-learn-inbox-ux.md`, `src/flight-learn-llama-cpp-adapter.test.ts`, `src/flight-learn-llama-cpp-adapter.ts`, `src/flight-learn-local-diagnosis-model.test.ts`, `src/flight-learn-local-diagnosis-model.ts`, `src/pi-extension.test.ts`.
  - `git diff --check` - passed with no output.
  - `npm test -- src/flight-learn-local-diagnosis-model.test.ts src/flight-learn-llama-cpp-adapter.test.ts src/pi-extension.test.ts` - passed, `3` files / `60` tests.
  - `npm run typecheck` - passed, `tsc --noEmit` exited successfully.
  - Small no-write fake-provider probes with `node --import tsx` - challenged role-labelled source text, sentence `role`, raw command variants, and follow-up/classifier advice variants.

## Correct / Resolved

- The single-role fact-packet/prompt leak from the first follow-up audit is resolved within the fact-packet scope. `looksLikeTranscript` now treats one line or inline role marker as transcript-like at `src/flight-learn-local-diagnosis-model.ts:433-437`, and both deterministic and delta fact-packet fields pass through `compactFactText` before `facts[]` / prompt serialization at `src/flight-learn-local-diagnosis-model.ts:508-527` and `src/flight-learn-local-diagnosis-model.ts:566-567`. Tests cover single-role `user:` input at `src/flight-learn-local-diagnosis-model.test.ts:382-413`. My probe across `user:`, `assistant:`, `system:`, `developer:`, `tool:`, and `bashExecution:` found no leak of the synthetic private text into `packet.deterministic`, `packet.delta`, `facts[]`, or prompt.
- The exact `ls -la` and `curl https://example.invalid` regressions are resolved. The raw-command pattern includes the shell/network/file-command group at `src/flight-learn-local-diagnosis-model.ts:198-204`, tests include `ls -la` and `curl ...` at `src/flight-learn-local-diagnosis-model.test.ts:211-219`, the harness has matching exercises, and no-write fake-provider probes returned `unsafe-output` for both.
- The optional sentence `role` ambiguity is resolved in source and tests. The allowed sentence keys are now only `text` and `factIds` at `src/flight-learn-local-diagnosis-model.ts:169`, sentence extra keys are rejected at `src/flight-learn-local-diagnosis-model.ts:764-765`, and the regression is tested at `src/flight-learn-local-diagnosis-model.test.ts:198-200`. My fake-provider probe with `role: "sequence"` returned `schema-invalid`.
- ACC-002 is otherwise well supported in the deterministic scope: top-level extra keys and missing `schemaVersion: 2` are rejected at `src/flight-learn-local-diagnosis-model.ts:699-701`; string `whatHappened`, missing/empty fact IDs, unknown fact IDs, duplicate IDs, and excessive IDs are rejected at `src/flight-learn-local-diagnosis-model.ts:743-785`.
- ACC-004 remains supported within fake/local scope. The adapter is disabled unless explicitly configured, only accepts literal IPv4/IPv6 loopback hosts, rejects credentials/path/query/hosted URLs, and bypasses proxy env through a direct agent at `src/flight-learn-llama-cpp-adapter.ts:48-49` and `src/flight-learn-llama-cpp-adapter.ts:79-96`. It also requires fact packet version `2` at `src/flight-learn-llama-cpp-adapter.ts:275-279`. Display-only application preserves stored delta fields in tests at `src/flight-learn-local-diagnosis-model.test.ts:102-129`.
- Claims honesty about semantic entailment is good. The evidence explicitly says this does not prove semantic entailment, Bonsai quality, or local judge behavior at `.loom/evidence/20260528-narrative-fact-id-contract-verifier.md:161-165`, and the prompt says fact IDs are support handles, not proof, at `src/flight-learn-local-diagnosis-model.ts:560-561`.

## Findings

### FIND-001: Raw-command hard safety still accepts project/common command literals beyond the tested list

Severity: high  
Confidence: high

Observation:

The verifier's raw-command guard remains an enumerated regex list at `src/flight-learn-local-diagnosis-model.ts:198-204`. It now covers the previous `ls -la` and `curl ...` cases, but no-write fake-provider probes with known fact IDs were accepted for other raw command literals, including:

- `Pi saw tsx src/cli.ts fail twice from the stale shell.`
- `Pi saw duckdb local.db fail twice from the stale shell.`
- `Pi saw vite build fail twice from the stale shell.`
- `Pi saw deno test fail twice from the stale shell.`

`tsx` is not hypothetical for this repository: `package.json:27` defines the CLI script as `tsx src/cli.ts`, and `package.json:43` lists `tsx` as a dev dependency. The accepted result was `usedLocalModel: true` with no fallback, because narrative `whatHappened` intentionally no longer runs the token-support gate and relies on `containsUnsafeOutput` / hard safety at `src/flight-learn-local-diagnosis-model.ts:790-791` and `src/flight-learn-local-diagnosis-model.ts:837-841`.

Why it matters:

ACC-003 requires fail-closed behavior for raw-command cases, and the evidence claims common raw command literals are covered at `.loom/evidence/20260528-narrative-fact-id-contract-verifier.md:125`. The current tests prove several representative commands, including `ls`/`curl`, but the broader ACC/evidence wording remains stronger than the actual guard.

Required follow-up:

Either broaden the hard raw-command detector/test matrix to cover project/common command forms such as `tsx src/cli.ts` (and decide how broad this hard layer is meant to be), or narrow the evidence/closure claim to the exact enumerated command families and explicitly accept the residual risk. If ACC-003 keeps saying raw commands fail closed, this needs a fix before closure.

### FIND-002: Follow-up/classifier advice without the word `route` still passes `whatHappened` validation

Severity: high  
Confidence: medium-high

Observation:

The prior passive/noun route examples with `route`, `routed`, or `routing` are fixed, but the hard display-only guard is mostly keyed to route tokens, explicit modal actors, mutation nouns, and imperative clauses at `src/flight-learn-local-diagnosis-model.ts:207-222`. No-write fake-provider probes with known fact IDs were accepted for route/classifier-adjacent advice that omits the word `route`, including:

- `This belongs with validation follow-up.`
- `The issue maps to validation follow-up.`
- `The issue fits the validation follow-up bucket.`
- `This should become a validation follow-up.`

These passed through the same narrative verifier path at `src/flight-learn-local-diagnosis-model.ts:790-791`.

Why it matters:

The ticket scope calls for hard rejection of obvious display-only violations such as route/action/mutation/classifier/ranking language at `.loom/tickets/20260528-narrative-fact-id-contract-verifier.md:39-40`, ACC-003 requires route/action/mutation/classifier language coverage at `.loom/tickets/20260528-narrative-fact-id-contract-verifier.md:76-78`, and the evidence claims passive/active route/action/mutation/classifier language is covered at `.loom/evidence/20260528-narrative-fact-id-contract-verifier.md:125`. The current code resolves the exact prior route-token examples, but these accepted variants are still classifier/follow-up advice rather than neutral display narrative.

Required follow-up:

Decide whether the deterministic hard-safety layer must reject `belongs/maps/fits/become ... follow-up/bucket` phrasing before the judge ticket exists. If yes, add focused tests and hard patterns. If no, narrow ACC/evidence wording so it does not claim broad route/classifier advice rejection beyond explicit route/action/mutation literals.

## ACC Closure Posture

- ACC-001: Close-ready for the fact-packet/prompt scope I reviewed. Stable fact slots are present (`F1`-`F9`, `F10+`, `F20/F21+`) at `src/flight-learn-local-diagnosis-model.ts:484-500`, inputs are bounded/sliced at `src/flight-learn-local-diagnosis-model.ts:505-546`, and single-role transcript-like facts no longer leak into `packet.deterministic`, `packet.delta`, `facts[]`, or prompt. Residual note: `buildFlightLearnDiagnosisView` itself can still display human `delta.reality` verbatim when local polish is disabled/unavailable; I did not count that against ACC-001 because this ticket's acceptance is fact-packet/model-input scoped, but closure prose should avoid saying all deterministic UI display text is transcript-scrubbed.
- ACC-002: Close-ready within this scope. The `role` ambiguity is resolved by rejection, arbitrary string narrative is rejected, and every useful narrative sentence must cite known non-duplicate fact IDs.
- ACC-003: Not close-ready. FIND-001 and FIND-002 show hard raw-command and display-only/classifier claims still exceed the deterministic guard.
- ACC-004: Close-ready within fake-provider/local-first scope. No hosted/provider-key behavior, proxy use, or source-of-truth mutation was found in reviewed code/tests.
- ACC-005: Validation is healthy for the tested suite and recorded harness, but evidence needs revision or further fixes before closure because ACC-003 support is overstated.

## Validation Re-run During This Audit

Commands run from `/Users/crlough/Code/personal/pi-flight-recorder`:

```bash
git diff --check
```

Result: passed with no output.

```bash
npm test -- src/flight-learn-local-diagnosis-model.test.ts src/flight-learn-llama-cpp-adapter.test.ts src/pi-extension.test.ts
```

Result: passed, `3` test files / `60` tests.

```bash
npm run typecheck
```

Result: passed, `tsc --noEmit` exited successfully.

Small inline fake-provider probes were run with `node --import tsx` and did not write files. They support the resolved observations for role-labelled fact-packet/prompt redaction, `ls`/`curl` rejection, and sentence `role` rejection, and the open findings for `tsx`/other command literals plus follow-up/classifier advice variants.

## Verdict

`changes-needed`. The requested follow-up fixes for single-role fact-packet/prompt leakage, the specific `ls`/`curl` command literals, and sentence-level `role` schema ambiguity are resolved for the tested cases. However, ACC-003 and the evidence claim still overstate hard-safety coverage: the deterministic verifier accepts other project/common command literals and route/classifier-adjacent follow-up advice. The consuming ticket should not close until those are fixed or the acceptance/evidence wording is explicitly narrowed with authority.

## Required Follow-up

1. Fix or explicitly rescope raw-command hard-safety coverage for project/common command literals such as `tsx src/cli.ts`; add focused tests/probes for the chosen boundary.
2. Fix or explicitly rescope route/follow-up/classifier advice rejection for non-`route` wording such as `belongs/maps/fits/become ... follow-up`.
3. Re-run focused tests, adapter/Pi tests, typecheck, diff-check, and the sanitized harness if it is updated; refresh evidence artifacts if the harness is rerun.
4. Update `.loom/evidence/20260528-narrative-fact-id-contract-verifier.md` so ACC-003 support claims match the exact fixed/tested boundary.

## Residual Risk

- Fact IDs alone still do not prove semantic entailment, usefulness, or actionability; the evidence states this honestly and the dependent local judge provider ticket remains necessary.
- Hard-safety regexes remain a bounded heuristic layer. Even after fixing the findings above, avoid claiming general semantic safety beyond tested hard literals.
- No real local model/runtime, Bonsai 4B behavior, JSON reliability under real generations, latency, judge-provider behavior, or UI screenshot validation was proven here.
- The working tree still includes a modified `.loom/specs/flight-learn-inbox-ux.md` outside the evidence dossier's changed source/test target list. I did not audit ownership of that spec change in this pass; the parent/consuming ticket should ensure it is intentionally owned by the right Loom surface.

## Closure Recommendation

Do not close `ticket:20260528-narrative-fact-id-contract-verifier` yet. Return to implementation or scope clarification for ACC-003, refresh evidence, and run another narrow follow-up audit focused on the raw-command and route/classifier boundary plus claims honesty. ACC-001, ACC-002, and ACC-004 look close-ready within their current scoped claims.

## Related Records

- `ticket:20260528-narrative-fact-id-contract-verifier` - audit target and ACC-001 through ACC-005.
- `audit:20260528-narrative-fact-id-contract-verifier-followup-review` - prior findings under recheck.
- `evidence:20260528-narrative-fact-id-contract-verifier` - evidence claims under challenge.
- `research:20260528-local-narrative-judge-validation` - records why fact IDs are necessary but not semantic proof.
