# Flight Learn LLM Card Copy Contract Review

ID: audit:20260531-flight-learn-llm-card-copy-contract-review
Type: Audit
Status: recorded
Created: 2026-05-31
Updated: 2026-05-31
Audited: 2026-05-31 UTC
Target: ticket:20260531-flight-learn-llm-card-copy-contract

## Summary

Audited the implementation and evidence for `ticket:20260531-flight-learn-llm-card-copy-contract`. The change stays within the intended source boundary and adds the requested new schema fields, but the review found material validation gaps before the ticket should close: fact IDs for the new fields are not actually tied to the field text, `expectedBehavior` still has weak support semantics when an expected fact exists, and the llama.cpp schema still requires `whatHappened` despite the broader optional-field contract.

## Target

Target under review:

- `ticket:20260531-flight-learn-llm-card-copy-contract`
- Source diff for:
  - `src/flight-learn-local-diagnosis-model.ts`
  - `src/flight-learn-local-diagnosis-model.test.ts`
  - `src/flight-learn-llama-cpp-adapter.ts`
  - `src/flight-learn-llama-cpp-adapter.test.ts`
- Evidence dossier `evidence:20260531-flight-learn-llm-card-copy-contract`

The ticket is in `review` and asks whether ACC-001 through ACC-005 are sufficiently supported before unblocking the rendering ticket.

## Audit Scope And Lenses

Lenses used:

- acceptance and scope: whether ACC-001 through ACC-005 are satisfied and the change stayed out of rendering/runtime/dogfood work;
- trust boundary: whether local-model text remains display-only, fact-bounded, privacy-safe, and unable to route/rank/persist truth/mutate artifacts/source/Loom/classifier state;
- field-specific validation: `expectedBehavior`, `whyThisWasFlagged`, and `evidenceSummary`, especially invented expected behavior, generated evidence, internal provenance/debug leakage, unknown or irrelevant fact IDs, and over-broad support;
- adapter schema: whether constrained JSON schema matches validator expectations;
- evidence sufficiency: whether tests/scans support the exact claims without overclaiming real runtime/rendering/operator comprehension.

Out of scope:

- focused-card rendering behavior;
- real Bonsai/llama.cpp quality;
- operator comprehension;
- dogfood corpus/outcome readiness;
- broad release readiness.

## Context And Evidence Reviewed

- `.loom/tickets/20260531-flight-learn-llm-card-copy-contract.md` - ticket scope, acceptance criteria, and current review claim.
- `.loom/plans/20260531-flight-learn-llm-authored-card-copy.md` - parent strategy and sequencing boundaries.
- `.loom/specs/flight-learn-inbox-ux.md` REQ-042 through REQ-048 and SCN-013 through SCN-015 - behavior contract for local LLM card-copy fields, generated-evidence boundary, hidden provenance, and expected behavior truthfulness.
- `.loom/evidence/20260531-flight-learn-llm-card-copy-contract.md` - implementation/evidence claims and non-claims.
- `.loom/evidence/artifacts/20260531-flight-learn-llm-card-copy-contract/01-focused-tests.txt` - focused tests passed, 2 files and 41 tests.
- `.loom/evidence/artifacts/20260531-flight-learn-llm-card-copy-contract/02-typecheck.txt` - typecheck passed.
- `.loom/evidence/artifacts/20260531-flight-learn-llm-card-copy-contract/03-build.txt` - build passed.
- `.loom/evidence/artifacts/20260531-flight-learn-llm-card-copy-contract/04-full-tests.txt` - full test suite passed, 21 files and 148 tests.
- `.loom/evidence/artifacts/20260531-flight-learn-llm-card-copy-contract/06-source-side-effect-scan.txt` - targeted scan found no added storage/fs/artifact/classifier imports or write APIs; matches were guardrail/provider text.
- `.loom/evidence/artifacts/20260531-flight-learn-llm-card-copy-contract/07-privacy-scan.json` - privacy scan passed, 13 scanned files, 0 findings.
- `git diff` for the four source/test files - inspected schema, validator, prompt, application of display fields, and added tests.
- Source lines inspected include `src/flight-learn-local-diagnosis-model.ts:263-267`, `src/flight-learn-local-diagnosis-model.ts:1153-1216`, `src/flight-learn-llama-cpp-adapter.ts:75-112`, and `src/flight-learn-local-diagnosis-model.test.ts:1015-1072`.
- Two read-only synthetic `tsx` probes were run during audit to challenge field-specific support. Both used synthetic, redacted objects only. They showed the current validator accepts `evidenceSummary` text drawn from an expected-behavior fact while citing an evidence-summary fact, and accepts `whyThisWasFlagged` text drawn from an expected-behavior fact while citing an occurrence-count fact.

## Findings

### FIND-001: Fact IDs for new card-copy fields are not bound to the field text

`validateFactCitedDisplayField` collects cited facts and validates unknown/duplicate fact IDs (`src/flight-learn-local-diagnosis-model.ts:1194-1204`), but the semantic support check at `src/flight-learn-local-diagnosis-model.ts:1215` calls `hasUnsupportedFacts(normalized, support)` where `support` was built from the entire fact packet, not from the cited facts. Field-specific checks are type-only: `evidenceSummary` requires cited facts to be `evidence-summary` (`src/flight-learn-local-diagnosis-model.ts:1209-1211`), and `whyThisWasFlagged` requires at least one cited fact from a broad allowed-kind set (`src/flight-learn-local-diagnosis-model.ts:1212-1214`).

A read-only synthetic probe confirmed this gap: an `evidenceSummary` saying `Run validation from a fresh project shell.` was accepted while citing an evidence-summary fact whose own text was only about a stale-pane validation failure, because the words came from a separate expected-behavior fact in the same packet. A second probe confirmed `whyThisWasFlagged` accepted the same expected-behavior text while citing only an occurrence-count fact.

Why it matters: ACC-002 asks the new fields to reject generated evidence, irrelevant facts, and over-broad support. REQ-043 and REQ-044 require evidence to remain source-of-truth and generated fields to carry support references. With global-token support, the new `{ text, factIds }` shape can look fact-cited while the displayed text is actually supported by unrelated packet fields. This is especially risky for `evidenceSummary`, because it may summarize expectation or reality text as if it were evidence.

Required follow-up: validate each fact-cited display field against the cited facts' text, not the whole packet, or otherwise make the support relationship explicit and testable. Add tests where `evidenceSummary` cites an evidence fact but uses tokens only present in expectation/reality/signal facts, and where `whyThisWasFlagged` cites an occurrence/signal fact but uses expected-behavior wording. These should fail closed.

### FIND-002: `expectedBehavior` can still be rewritten from broad packet support once any expected fact exists

For `expectedBehavior`, validation remains a plain string path (`src/flight-learn-local-diagnosis-model.ts:1163-1173`). It only rejects expected behavior when both `factPacket.delta.expectation` and `deterministicView.expectedBehavior` are absent (`src/flight-learn-local-diagnosis-model.ts:1169-1171`). When either expected fact exists, the field is accepted if its tokens exist anywhere in the global support set (`src/flight-learn-local-diagnosis-model.ts:1172`).

The added test covers the no-expectation case (`src/flight-learn-local-diagnosis-model.test.ts:1015-1040`), which is useful, but it does not cover an invented, inverted, or cross-field rewrite when an expectation exists. For example, token-based support cannot distinguish a faithful expected behavior from a polarity-changing paraphrase that reuses the same words.

Why it matters: REQ-047 says `Expected` copy must not invent intended behavior. The ticket acceptance also calls out invented expected behavior in ACC-002. Because this field has no fact IDs and no field-specific support check against expected-behavior facts, the current implementation supports only the weaker claim “expectedBehavior is rejected when no expected fact exists,” not the stronger claim “invented expected behavior is rejected.”

Required follow-up: either make `expectedBehavior` fact-cited like the new display fields and restrict support to expected-behavior/delta-expectation facts, or constrain it to a conservative extractive/near-extractive rewrite of known expected behavior. Add tests for contradictory or cross-field expected wording when an expected fact exists.

### FIND-003: Adapter schema still requires `whatHappened`, conflicting with the optional all-field contract

The prompt says to omit display keys the model cannot improve, and the validator accepts any useful display field from `RESPONSE_FIELDS` before rejecting empty output (`src/flight-learn-local-diagnosis-model.ts:1136-1148`). However, the llama.cpp generator schema still requires `whatHappened` at `src/flight-learn-llama-cpp-adapter.ts:75-79`, and the adapter test asserts that requirement at `src/flight-learn-llama-cpp-adapter.test.ts:344-346`.

Why it matters: ACC-001 and the parent plan describe a whole-card copy contract, including fields such as `whyThisWasFlagged` and `evidenceSummary`. If the real constrained adapter always requires `whatHappened`, then the runtime cannot validly return only a safer `whyThisWasFlagged` or `evidenceSummary` improvement even though the validator and prompt allow it. That mismatch can push the local model to fabricate or duplicate narrative text just to satisfy schema, or make adapter-level behavior diverge from fake-provider validation.

Required follow-up: align schema, prompt, and validator. Either make `whatHappened` optional in the generator schema and rely on validator `empty-output`, or explicitly decide the contract requires narrative every time and update prompt/validator/tests/ticket language accordingly. The first option better matches the current “omit any display key you cannot improve” contract.

## Verdict

Verdict: `changes-needed`.

The implementation is directionally correct and stays within the declared code boundary: it adds `whyThisWasFlagged` and `evidenceSummary`, keeps output in `LocalDiagnosisPolishResult.view`, updates the constrained schema, avoids source/storage/routing imports, and records passing focused/full/type/build/privacy evidence. It also avoids overclaiming rendering, real runtime, and operator comprehension.

However, ACC-002 is not yet adequately satisfied for field-specific support. The new fact-cited fields can cite one fact while drawing support from unrelated packet fields, and `expectedBehavior` still has a broad string-only support path. The adapter schema also remains inconsistent with the broader optional-field validator contract. The ticket should not close as-is.

## Required Follow-up

Before closing `ticket:20260531-flight-learn-llm-card-copy-contract` or unblocking the rendering ticket:

1. Fix fact-cited display field validation so `whyThisWasFlagged` and `evidenceSummary` are supported by their cited facts, not by the whole fact packet.
2. Strengthen `expectedBehavior` support semantics or narrow the acceptance claim to the no-expectation case. Prefer field-specific expected-fact support plus tests.
3. Align the llama.cpp generator schema with validator/prompt expectations around optional `whatHappened`.
4. Add focused tests for the three finding classes and rerun focused tests, typecheck/build as appropriate, full tests, diff check, source side-effect scan, and privacy scan.
5. Record follow-up evidence and run a follow-up audit pass.

## Residual Risk

- This audit did not evaluate focused-card rendering, real local runtime behavior, latency, operator comprehension, or corpus/dogfood readiness.
- The remaining support model is still token/regex based for non-judged fields. Even after the specific fixes above, later runtime replay and operator validation may still show local model text that is hard to understand or too conservative.
- Passing fake-provider tests will not prove Bonsai/llama.cpp can produce useful all-field card copy.
- The source-side-effect scan is targeted and supports the no-obvious-side-effects claim; it is not a whole-program proof that later rendering cannot misuse the new fields.

## Related Records

- `ticket:20260531-flight-learn-llm-card-copy-contract` - consuming ticket that owns finding disposition.
- `plan:20260531-flight-learn-llm-authored-card-copy` - parent repair plan.
- `spec:flight-learn-inbox-ux` - intended behavior for local LLM card-copy fields and evidence boundaries.
- `evidence:20260531-flight-learn-llm-card-copy-contract` - implementation evidence reviewed.
