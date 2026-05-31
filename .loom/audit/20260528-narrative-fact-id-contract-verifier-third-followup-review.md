# Narrative Fact-ID Contract Verifier Third Follow-up Review

ID: audit:20260528-narrative-fact-id-contract-verifier-third-followup-review
Type: Audit
Status: recorded
Created: 2026-05-28
Updated: 2026-05-28
Audited: 2026-05-28
Target: ticket:20260528-narrative-fact-id-contract-verifier
Follows: audit:20260528-narrative-fact-id-contract-verifier-second-followup-review

## Summary

Third follow-up adversarial review confirms the exact project/common command literals called out by the second follow-up audit now fail closed, and the exact hyphenated/no-space non-route follow-up variants now fail closed. The fact-packet prompt/transcript redaction and sentence schema fixes from earlier rounds still hold in the probed scope.

Closure is still not recommended because ACC-003 and the evidence claim remain broader than the deterministic guard: small no-write fake-provider probes show spaced `follow up` action advice and classifier/bucket phrasing without `route` or `follow-up` still pass `whatHappened` validation. That keeps the display-only/classifier portion of ACC-003 not close-ready unless the ticket/evidence are explicitly narrowed with authority.

Verdict: `changes-needed`.

## Target

Reviewed `ticket:20260528-narrative-fact-id-contract-verifier` after fixes for `audit:20260528-narrative-fact-id-contract-verifier-second-followup-review`. The target remains the deterministic fact-ID verifier / fake-provider scope only: no real Bonsai/llama.cpp runtime, no local judge provider, no UI screenshot validation, no release readiness, and no source edits by this auditor.

## Audit Scope And Lenses

Lenses used:

- acceptance: ACC-001 through ACC-005
- follow-up disposition: second follow-up findings for `tsx`/`duckdb`/`vite`/`deno` command literals and `belongs`/`maps`/`fits`/`become ... follow-up` advice variants
- security and trust boundary: prompt/transcript leakage, raw-command hard safety, display-only route/action/classifier boundaries, local-first adapter behavior
- claim and evidence: whether evidence prose is honest about deterministic coverage and non-claims

Out of scope: implementing fixes, rerunning the artifact-writing harness, real model/runtime validation, and judge-provider quality.

## Context And Evidence Reviewed

- Ralph review run: this third follow-up adversarial review subagent, bounded to source/tests/records/probes and no source edits.
- `.loom/tickets/20260528-narrative-fact-id-contract-verifier.md` - acceptance criteria and current state, especially ACC-003 at lines 76-78 and current-state fix claims at line 90.
- `.loom/audit/20260528-narrative-fact-id-contract-verifier-second-followup-review.md` - prior findings under recheck.
- `.loom/evidence/20260528-narrative-fact-id-contract-verifier.md` - updated evidence and claims, especially ACC support at lines 124-128, third follow-up fix claims at lines 164-170, and non-claims at lines 172-178.
- `.loom/evidence/artifacts/20260528-narrative-fact-id-contract-verifier/harness-summary.json` - recorded `18/18` harness pass; not rerun because the harness writes artifact JSON files.
- `.loom/evidence/artifacts/20260528-narrative-fact-id-contract-verifier/run-fact-id-contract-harness.mjs` - harness source includes `tsx src/cli.ts` and `This belongs with validation follow-up` exercises at lines 119-122.
- `.loom/specs/flight-learn-inbox-ux.md` REQ-024 through REQ-032, especially REQ-026 through REQ-032 at lines 106-114.
- `src/flight-learn-local-diagnosis-model.ts` - fact packet, prompt, schema verifier, and hard safety patterns.
- `src/flight-learn-local-diagnosis-model.test.ts` - focused contract tests.
- `src/flight-learn-llama-cpp-adapter.ts` and `src/flight-learn-llama-cpp-adapter.test.ts` - loopback adapter and fake runtime tests.
- `src/pi-extension.test.ts` - explicit local-model polish integration/no-persistence fake test.
- Commands run:
  - `git status --short && git diff --name-only && git diff --check` - diff-check passed; working tree contains expected source/test/Loom changes plus the already-modified spec record.
  - `npm test -- src/flight-learn-local-diagnosis-model.test.ts src/flight-learn-llama-cpp-adapter.test.ts src/pi-extension.test.ts` - passed, `3` files / `60` tests.
  - `npm run typecheck` - passed, `tsc --noEmit` exited successfully.
  - `git diff --check` - passed with no output.
  - Small no-write fake-provider probes with `node --import tsx` - challenged exact second-follow-up cases plus nearby `follow up`/bucket classifier variants and role-labelled fact-packet redaction.

## Correct / Resolved

- The exact project/common command literals from the second follow-up audit are resolved. `RAW_COMMAND_OUTPUT_PATTERNS` includes `tsx`, `vite`, `deno`, `duckdb`, and related local tooling when followed by arguments at `src/flight-learn-local-diagnosis-model.ts:198-204`; tests cover `tsx src/cli.ts`, `duckdb local.db`, `vite build`, and `deno test` at `src/flight-learn-local-diagnosis-model.test.ts:211-223`; no-write probes for those four examples returned `unsafe-output`.
- The exact hyphenated/no-space non-route follow-up variants from the second follow-up audit are resolved. `DISPLAY_ONLY_FORBIDDEN_PATTERNS` rejects `follow-up` and `followup` at `src/flight-learn-local-diagnosis-model.ts:207-215`; tests cover `This belongs with validation follow-up`, `The issue maps to validation follow-up`, `The issue fits the validation follow-up bucket`, and `This should become a validation follow-up` at `src/flight-learn-local-diagnosis-model.test.ts:236-246`; no-write probes for those four examples returned `unsafe-output`.
- Fact-packet prompt/transcript redaction still holds for the probed role-labelled source inputs. `looksLikeTranscript` treats one line or inline role marker as transcript-like at `src/flight-learn-local-diagnosis-model.ts:434-438`, fact-packet deterministic/delta fields pass through `compactFactText` at `src/flight-learn-local-diagnosis-model.ts:509-523`, and tests cover multi-role plus single-role `user:` cases at `src/flight-learn-local-diagnosis-model.test.ts:390-422`. My probe across `user:`, `assistant:`, `system:`, `developer:`, `tool:`, and `bashExecution:` found no leak of the synthetic private marker into `packet.deterministic`, `packet.delta`, `facts[]`, or prompt.
- ACC-002 schema loopholes reviewed in prior passes remain fixed. Allowed sentence keys are only `text` and `factIds` at `src/flight-learn-local-diagnosis-model.ts:168-169`, sentence extra keys are rejected at `src/flight-learn-local-diagnosis-model.ts:763-766`, and the `role` regression is tested at `src/flight-learn-local-diagnosis-model.test.ts:198-200`.
- ACC-004 remains supported within fake/local scope. The llama.cpp adapter is disabled unless explicitly configured, only accepts literal loopback authorities, rejects credentials/path/query/hosted URLs, and uses a direct proxy-bypassing agent at `src/flight-learn-llama-cpp-adapter.ts:47-49` and `src/flight-learn-llama-cpp-adapter.ts:79-103`. Pi integration tests show explicit local-model wording is displayed without persisting model wording into stored delta fields/artifact drafts at `src/pi-extension.test.ts:653-740`.
- Claims honesty about semantic entailment remains good. The ticket says this slice must not claim real model quality or semantic grounding proof at `.loom/tickets/20260528-narrative-fact-id-contract-verifier.md:13-15`, the prompt states fact IDs are support handles rather than proof at `src/flight-learn-local-diagnosis-model.ts:561-562`, and evidence non-claims explicitly exclude semantic entailment, Bonsai quality, local runtime behavior, and judge-provider behavior at `.loom/evidence/20260528-narrative-fact-id-contract-verifier.md:172-178`.

## Findings

### FIND-001: ACC-003 still overclaims display-only/classifier safety because spaced `follow up` and bucket classifier advice pass validation

Severity: high  
Confidence: high

Observation:

The third follow-up fix rejects the exact `follow-up` and `followup` tokens, but the deterministic guard is still lexical and does not reject common spaced `follow up` action advice or classifier/bucket phrasing that omits both `route` and `follow-up`. The relevant source patterns reject route tokens, some modal action verbs, explicit classifier terms, and `follow-up|followup` at `src/flight-learn-local-diagnosis-model.ts:207-215`; `whatHappened` then accepts a normalized sentence if `containsUnsafeOutput` and the imperative-action helper do not match at `src/flight-learn-local-diagnosis-model.ts:789-808`.

No-write fake-provider probes with known fact IDs returned `usedLocalModel: true` / no fallback for examples including:

- `This belongs with validation follow up.`
- `The issue maps to validation follow up.`
- `The issue fits the validation follow up bucket.`
- `This should become validation follow up.`
- `We should follow up in validation.`
- `Follow up in validation after this repeats.`
- `The issue maps to a validation bucket.`
- `The issue fits the validation bucket.`
- `This should become a validation bucket.`

Why it matters:

The ticket scope requires deterministic verification for obvious display-only violations such as route/action/mutation/classifier/ranking language at `.loom/tickets/20260528-narrative-fact-id-contract-verifier.md:35-43`, and ACC-003 evidence expects route/action/mutation/classifier coverage at `.loom/tickets/20260528-narrative-fact-id-contract-verifier.md:76-78`. The evidence currently says ACC-003 is supported for “passive/active route/action/mutation/classifier language” at `.loom/evidence/20260528-narrative-fact-id-contract-verifier.md:126`. The exact second-follow-up examples are fixed, but these accepted variants are still action/follow-up/classifier advice rather than neutral display narrative.

This does not invalidate the raw-command fixes or the fact-ID contract. It does mean ACC-003 cannot honestly close under its current broad display-only/classifier wording.

Required follow-up:

Before closure, either:

1. broaden the hard-safety boundary and tests to reject spaced `follow up` action advice plus obvious `maps/fits/belongs/become ... bucket` classifier phrasing, then refresh evidence; or
2. explicitly narrow ACC-003/evidence with authority so the deterministic verifier only claims the exact tested hard-literal families and leaves remaining action/classifier semantics to the dependent local judge provider ticket.

Given repeated regex bypass rounds, the second option may be the more honest path if the project does not want another whack-a-mole lexical expansion.

## ACC Closure Posture

- ACC-001: Close-ready for the fact-packet/model-input scope reviewed. Stable fact slots are present (`F1`-`F9`, `F10+`, `F20/F21+`) at `src/flight-learn-local-diagnosis-model.ts:478-503`, inputs are bounded/sliced at `src/flight-learn-local-diagnosis-model.ts:506-551`, and role-labelled prompt/transcript source text did not leak in probes. Residual note: do not phrase closure as proving all deterministic UI display text is transcript-scrubbed; this audit only treats the fact packet and local-model prompt scope.
- ACC-002: Close-ready within this scope. The prompt/schema require `schemaVersion: 2` and `whatHappened.sentences[].text + factIds` at `src/flight-learn-local-diagnosis-model.ts:554-568`; arbitrary string narratives, unknown/missing IDs, duplicate/excessive IDs, and sentence extra keys are rejected in source/tests.
- ACC-003: Not close-ready. Raw command literals requested in this follow-up are fixed, but FIND-001 shows display-only/follow-up/classifier hard-safety claims still exceed the deterministic guard and evidence wording.
- ACC-004: Close-ready within fake-provider/local-first scope. No hosted/provider-key behavior, proxy use, or source-of-truth mutation was found in reviewed code/tests.
- ACC-005: Validation is healthy for the focused tests, typecheck, diff-check, and recorded 18/18 harness summary, but evidence cannot support closure until ACC-003 is fixed or explicitly narrowed.

## Validation Re-run During This Audit

Commands run from `/Users/crlough/Code/personal/pi-flight-recorder`:

```bash
git status --short && git diff --name-only && git diff --check
```

Result: diff-check passed with no output; working tree contains the expected source/test/Loom changes and the already-modified `.loom/specs/flight-learn-inbox-ux.md`.

```bash
npm test -- src/flight-learn-local-diagnosis-model.test.ts src/flight-learn-llama-cpp-adapter.test.ts src/pi-extension.test.ts
```

Result: passed, `3` test files / `60` tests.

```bash
npm run typecheck
```

Result: passed, `tsc --noEmit` exited successfully.

```bash
git diff --check
```

Result: passed with no output.

Small inline fake-provider probes were run with `node --import tsx` and did not write files. They support the resolved observations for `tsx src/cli.ts`, `duckdb local.db`, `vite build`, `deno test`, hyphenated/no-space follow-up advice, and role-labelled fact-packet/prompt redaction; they also support FIND-001 for spaced `follow up` and bucket classifier advice variants.

## Verdict

`changes-needed`. The specific project/common command literal fixes are resolved, and the specific hyphenated/no-space `follow-up` advice variants are resolved. However, ACC-003 and evidence still overclaim display-only/classifier safety because nearby action/follow-up/classifier phrasing still passes. Do not close `ticket:20260528-narrative-fact-id-contract-verifier` until FIND-001 is fixed or the deterministic-verifier claim is explicitly narrowed with authority.

## Required Follow-up

1. Decide whether ACC-003 must keep broad action/follow-up/classifier hard-safety coverage in this deterministic ticket.
2. If yes, add source/tests/harness coverage for spaced `follow up` action advice and obvious `maps/fits/belongs/become ... bucket` classifier phrasing; re-run focused tests, adapter/Pi tests, typecheck, diff-check, and the sanitized harness if updated.
3. If no, revise the ticket/evidence closure claim to name the exact hard-literal families covered and leave semantic action/classifier judgment to `ticket:20260528-local-narrative-judge-provider-contract` or its successor.
4. Refresh `.loom/evidence/20260528-narrative-fact-id-contract-verifier.md` so ACC-003 support matches the chosen boundary.

## Residual Risk

- Fact IDs alone still do not prove semantic entailment, usefulness, or actionability; this is honestly documented and remains the dependent local judge provider's job.
- Hard-safety regexes remain a bounded heuristic layer. Even after addressing FIND-001, closure should avoid claiming general semantic safety beyond tested hard literals.
- No real local model/runtime, Bonsai 4B behavior, JSON reliability under real generations, latency, judge-provider behavior, or UI screenshot validation was proven here.
- The working tree still includes a modified `.loom/specs/flight-learn-inbox-ux.md` outside the evidence dossier's changed source/test target list. I did not audit ownership of that spec change in this pass; the parent/consuming ticket should ensure it is intentionally owned by the right Loom surface.

## Closure Recommendation

Do not close `ticket:20260528-narrative-fact-id-contract-verifier` yet. ACC-001, ACC-002, and ACC-004 look close-ready within their scoped claims, and validation is healthy, but ACC-003 remains open due to FIND-001 and the evidence/closure claim must be corrected or narrowed before ACC-005 can honestly support closure.

## Related Records

- `ticket:20260528-narrative-fact-id-contract-verifier` - audit target and ACC-001 through ACC-005.
- `audit:20260528-narrative-fact-id-contract-verifier-second-followup-review` - prior findings under recheck.
- `evidence:20260528-narrative-fact-id-contract-verifier` - evidence claims under challenge.
- `research:20260528-local-narrative-judge-validation` - records why fact IDs are necessary but not semantic proof and why regex expansion should stay bounded.
