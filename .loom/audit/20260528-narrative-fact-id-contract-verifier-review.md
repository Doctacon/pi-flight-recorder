# Narrative Fact-ID Contract Verifier Review

ID: audit:20260528-narrative-fact-id-contract-verifier-review
Type: Audit
Status: recorded
Created: 2026-05-28
Updated: 2026-05-28
Audited: 2026-05-28
Target: ticket:20260528-narrative-fact-id-contract-verifier

## Summary

Adversarial review found that the implementation is directionally aligned with the fact-ID contract and does reject arbitrary string `whatHappened`, missing/unknown fact IDs, extra schema keys, and many hard-safety cases. Closure is not recommended yet because the fact packet can still carry transcript-like deterministic text into `facts[]`/prompt, and hard safety still accepts some obvious route advice and raw command literals.

## Target

Reviewed `ticket:20260528-narrative-fact-id-contract-verifier` and its claimed implementation/evidence for ACC-001 through ACC-005. The audit target is the deterministic fact-ID verifier scope only: no local judge provider, no real model quality validation, no UI redesign, and no release readiness claim.

## Audit Scope And Lenses

Lenses used:

- acceptance: ACC-001 through ACC-005
- claim and evidence: whether ticket/evidence claims are supported by source/tests/harness outputs
- implementation: schema, fact-ID verifier, hard safety, and local-first adapter behavior
- security and trust boundary: raw paths/secrets/prompts/transcripts, raw commands, route/action side effects, hosted/network behavior
- follow-through: whether claims remain honest about lack of semantic entailment and real model validation

Out of scope: implementing fixes, real Bonsai/llama.cpp runtime validation, local judge design, UI layout quality, and broad project health outside the cited files.

## Context And Evidence Reviewed

- Ralph review run: this adversarial review subagent, bounded by the operator's ticket/evidence/code read list and no source edits.
- `.loom/tickets/20260528-narrative-fact-id-contract-verifier.md` - acceptance criteria and scope.
- `.loom/evidence/20260528-narrative-fact-id-contract-verifier.md` - implementation evidence and non-claims.
- `.loom/evidence/artifacts/20260528-narrative-fact-id-contract-verifier/ralph-worker-output.md` - worker claim summary.
- `.loom/evidence/artifacts/20260528-narrative-fact-id-contract-verifier/run-fact-id-contract-harness.mjs` - sanitized harness source; not re-run because it writes artifact files.
- `.loom/evidence/artifacts/20260528-narrative-fact-id-contract-verifier/harness-summary.json` - recorded `10/10` harness summary.
- `.loom/research/20260528-local-narrative-judge-validation.md` - hybrid fact-ID + deterministic verifier + future local judge recommendation and limits.
- `src/flight-learn-local-diagnosis-model.ts` - fact packet, prompt, verifier, safety checks.
- `src/flight-learn-local-diagnosis-model.test.ts` - focused contract tests.
- `src/flight-learn-llama-cpp-adapter.ts` and `src/flight-learn-llama-cpp-adapter.test.ts` - loopback adapter and fake-provider fixtures.
- `src/pi-extension.test.ts` relevant local-model fixture changes.
- Commands run:
  - `git status --short` - showed the expected source/test changes plus existing Loom record churn; noted `.loom/specs/flight-learn-inbox-ux.md` is modified outside this ticket's evidence changed-file list.
  - `git diff --check` - passed with no output.
  - `npm test -- src/flight-learn-local-diagnosis-model.test.ts src/flight-learn-llama-cpp-adapter.test.ts src/pi-extension.test.ts` - passed, `3` files / `59` tests.
  - `npm run typecheck` - passed.
  - Small inline fake-provider probes - no file writes; used to challenge semantic grounding removal, nested schema rejection, transcript fact-packet handling, passive route language, and non-npm raw command literals.

## Correct Observations

- ACC-002 is largely implemented for the response shape: top-level extra keys are rejected and `schemaVersion: 2` is required in `src/flight-learn-local-diagnosis-model.ts:694-697`; `whatHappened` must be an object, not a string, in `src/flight-learn-local-diagnosis-model.ts:739-750`; sentence extra keys and unknown/non-string/empty fact IDs are rejected in `src/flight-learn-local-diagnosis-model.ts:758-780`. Tests cover arbitrary string, empty fact IDs, and unknown fact IDs at `src/flight-learn-local-diagnosis-model.test.ts:184-197`.
- Fact IDs are stable by construction for the bounded packet: deterministic/delta IDs use fixed slots `F1` through `F9`, signal IDs use `F10+index`, and evidence IDs use `F20/F21+index` in `src/flight-learn-local-diagnosis-model.ts:473-498`; input signals/evidence are sliced to bounded counts and fact text is compacted at `src/flight-learn-local-diagnosis-model.ts:501-546`.
- The broad token allow-list is no longer the semantic gate for `whatHappened`: `validateResponseField` routes `whatHappened` to `validateWhatHappenedNarrative` before the non-narrative `hasUnsupportedFacts` check in `src/flight-learn-local-diagnosis-model.ts:719-736`. A probe with a semantically unsupported but safe sentence citing a known fact ID was accepted, confirming the code is no longer pretending token support proves narrative grounding. This is honest only because the ticket/evidence explicitly defer semantic entailment to the future judge path.
- Extra nested schema probes were rejected: a sentence-level `nested` key returned `schema-invalid`, and a `whatHappened.confidence` key returned `schema-invalid`, matching the verifier code at `src/flight-learn-local-diagnosis-model.ts:746-761`.
- ACC-004 local-first adapter behavior remains intact in the reviewed code: the llama.cpp adapter accepts only literal `http://127.0.0.1` or `http://[::1]` authorities and rejects credentials/path/query/hosted URLs in `src/flight-learn-llama-cpp-adapter.ts:79-103`; it uses a direct loopback HTTP agent with `proxyEnv: {}` at `src/flight-learn-llama-cpp-adapter.ts:47-49` and bounded transport/content sizes at `src/flight-learn-llama-cpp-adapter.ts:38-43`.
- The evidence is honest that real model quality, semantic entailment, usefulness, and judge-provider safety are not proven; the research and ticket both preserve that limit, and the prompt itself says fact IDs are support handles rather than proof at `src/flight-learn-local-diagnosis-model.ts:557`.

## Findings

### FIND-001: Deterministic fact text can leak transcript-like source content into `facts[]` and the local-model prompt

Severity: blocker for ACC-001. Confidence: high.

`buildLocalDiagnosisFactPacket` adds the deterministic `whatHappened` into the fact packet and support facts (`F2`) at `src/flight-learn-local-diagnosis-model.ts:501-507` and `src/flight-learn-local-diagnosis-model.ts:480-482`; the prompt serializes the whole packet at `src/flight-learn-local-diagnosis-model.ts:549-564`. The source scrubber can omit prompt/transcript/stack text when it sees the unsafe source directly (`src/flight-learn-local-diagnosis-model.ts:412-424`), but transcript detection only counts line-start role labels (`src/flight-learn-local-diagnosis-model.ts:229` and `src/flight-learn-local-diagnosis-model.ts:431-433`).

A synthetic probe with `delta.reality` shaped like a two-line role-labelled transcript showed the gap: `buildFlightLearnDiagnosisView` first sanitizes and collapses whitespace (`src/flight-learn-diagnosis.ts:52-53`), accepts `delta.reality` as human `whatHappened` (`src/flight-learn-diagnosis.ts:253-256`), and returns it as deterministic `whatHappened` (`src/flight-learn-diagnosis.ts:273-280`). By the time `compactFactText` receives that deterministic display text, the role labels are collapsed onto one line and `looksLikeTranscript` does not omit it. The resulting packet contained a collapsed role-labelled transcript-like `F2` fact (`user: ... assistant: ...`; synthetic values omitted here).

Why it matters: ACC-001 requires bounded redacted local facts without raw prompts/transcripts. The focused test at `src/flight-learn-local-diagnosis-model.test.ts:316-359` covers transcript text in evidence snippets and prompt text in impact, but not transcript-like `delta.reality` that first becomes deterministic display text.

Required follow-up: ensure deterministic fields copied into the fact packet are scrubbed against raw source hazards after whitespace collapse, or build deterministic support facts from the already-scrubbed source packet rather than the display view. Add a regression where transcript-like `delta.reality` does not appear in `deterministic.whatHappened`, `facts[]`, or the prompt.

### FIND-002: Passive route advice still passes the `whatHappened` hard-safety verifier

Severity: blocker for ACC-003 display-only safety. Confidence: high.

The hard-safety patterns catch examples such as `route this to ...`, explicit `Flight Rule`, and direct imperative actions (`src/flight-learn-local-diagnosis-model.ts:205-220`), and tests cover those at `src/flight-learn-local-diagnosis-model.test.ts:214-299`. They do not catch passive or noun-route advice such as `This should be routed to validation follow-up.`, `The issue belongs in the validation route.`, or `The pattern deserves a validation follow-up route.`

A fake-provider probe returned those strings as `whatHappened.sentences[].text` with a known non-empty fact ID; the verifier accepted them (`usedLocalModel: true`, no fallback). That violates the ACC-003 requirement to fail closed for route/action/classifier/ranking language and the ticket's display-only boundary.

Required follow-up: extend hard display-only safety and tests for passive `routed`, `belongs in ... route`, `route` noun/adjective uses that are route advice, and similar classifier/ranking phrasing. Keep this as hard safety language, not a restored semantic grounding allow-list.

### FIND-003: Raw command literals outside the narrow npm/vitest/tsc set still pass narrative verification

Severity: blocker for ACC-003 raw-command safety. Confidence: high.

`RAW_COMMAND_OUTPUT_PATTERNS` currently rejects shell invocations, npm/pnpm/yarn/bun scripts, vitest/tsc/eslint/prettier, and shell metacharacters (`src/flight-learn-local-diagnosis-model.ts:198-203`). A fake-provider probe showed `whatHappened` sentences containing raw command literals such as `git status`, `python manage.py test`, `make test`, and `node script.js` were accepted when paired with a known fact ID.

Why it matters: ACC-003 explicitly calls out raw command safety. The current tests cover `npm run test` (`src/flight-learn-local-diagnosis-model.test.ts:199-211`) but do not cover common non-npm command forms, so the hard raw-command guard is weaker than the evidence claims.

Required follow-up: add focused tests and a bounded raw-command detection/redaction rule for common command-like literals and executable + argument forms, or route command text through an existing source redaction layer before it can be accepted as display text. Do not use broad token support as a semantic grounding substitute.

## Verdict

`changes-needed`. The implementation satisfies important pieces of ACC-002, most of the deterministic schema/fact-ID mechanics, and the local-first adapter constraints, and the tests/typecheck/diff-check are healthy. However, ACC-001 and ACC-003 are not fully satisfied because unsafe transcript-like source text and hard safety bypasses remain. The ticket should not be closed until FIND-001 through FIND-003 are fixed or explicitly rescoped with operator approval.

## Required Follow-up

Before closure:

1. Fix transcript-like deterministic fact leakage and add tests for unsafe `delta.reality` / deterministic-field source text.
2. Fix passive route advice hard-safety bypasses and add tests for accepted/rejected route-language variants.
3. Fix or explicitly bound raw command literal detection beyond npm/vitest/tsc and add tests for common command forms.
4. Re-run focused tests, adapter/Pi tests, `npm run typecheck`, `git diff --check`, and the sanitized harness after the fixes. If the harness is re-run, record the new artifact outputs.
5. Update evidence to state the fixed scope and preserve the existing non-claim that fact IDs alone do not prove entailment or usefulness.

## Residual Risk

- Even after these fixes, fact-ID validation alone still does not prove semantic entailment, usefulness, or actionability. The inline probe confirming a semantically unsupported but safe sentence is accepted with a known fact ID is expected under this ticket and remains a residual risk for the future local judge provider ticket.
- Non-narrative `headline`, `whyItMatters`, and `expectedBehavior` still use token support checks (`src/flight-learn-local-diagnosis-model.ts:858-880`). This is outside the specific narrative grounding replacement but should not be cited as semantic proof.
- The validator does not impose a separate cardinality cap on `factIds[]`; the llama.cpp adapter bounds model content size, but future custom providers should keep response-size/cardinality limits explicit.
- The working tree includes a modified `.loom/specs/flight-learn-inbox-ux.md` that is not listed in the ticket evidence changed-targets. I did not attribute it to this ticket, but the parent/consuming ticket should ensure that spec diff is intentionally owned by the right surface.

## Closure Recommendation

Do not close `ticket:20260528-narrative-fact-id-contract-verifier` yet. Return to implementation for the three blockers, refresh evidence, and then run a follow-up audit focused on ACC-001/ACC-003 hard-safety regressions and claims honesty.

## Related Records

- `ticket:20260528-narrative-fact-id-contract-verifier` - audit target.
- `evidence:20260528-narrative-fact-id-contract-verifier` - implementation evidence under challenge.
- `research:20260528-local-narrative-judge-validation` - supports the residual-risk distinction between fact IDs and semantic entailment.
