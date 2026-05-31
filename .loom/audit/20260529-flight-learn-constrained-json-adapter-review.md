# Flight Learn Constrained JSON Adapter Review

ID: audit:20260529-flight-learn-constrained-json-adapter-review
Type: Audit
Status: recorded
Created: 2026-05-29
Updated: 2026-05-29
Audited: 2026-05-29 UTC
Target: ticket:20260529-flight-learn-constrained-json-adapter

## Summary

Ralph reviewed the constrained JSON adapter implementation, tests, ticket, and evidence. Verdict: concerns. The adapter largely satisfies the bounded behavior, but the review found two closure concerns around evidence consistency: request-token limit wording and one fixture that was called valid despite not matching the new generator schema.

## Target

Audit target: `ticket:20260529-flight-learn-constrained-json-adapter` in review state, with source changes in:

```text
src/flight-learn-llama-cpp-adapter.ts
src/flight-learn-llama-cpp-adapter.test.ts
```

Evidence target: `evidence:20260529-flight-learn-constrained-json-adapter` and artifacts under:

```text
.loom/evidence/artifacts/20260529-flight-learn-constrained-json-adapter/
```

The closure claim under review was whether the opt-in local llama.cpp adapter now sends distinct OpenAI-style JSON-schema constrained request bodies for generator and judge calls while preserving local-only, fail-closed, no-product-side-effect behavior.

## Audit Scope And Lenses

Scope:

- Challenge `ACC-001` through `ACC-005`.
- Review schema correctness and generator/judge schema distinctness.
- Review whether tests inspect actual adapter request bodies.
- Review whether implementation silently falls back to unconstrained generation.
- Review local-only, fail-closed, opt-in, and no-product-side-effect boundaries.
- Review evidence for overclaiming.

Lenses:

- claim and evidence
- scope and acceptance
- implementation
- security/privacy/trust boundary
- dependency/runtime specificity
- follow-through

Out of scope:

- Real `llama-server` replay.
- Judge/latency acceptance evidence.
- Operator comprehension validation.
- Product UI validation.

## Context And Evidence Reviewed

Ralph review run: bounded reviewer subagent launched from `ticket:20260529-flight-learn-constrained-json-adapter`, implementation diff, evidence, and linked records. Reviewer was instructed not to edit files and to return findings/verdict only.

Context inspected by reviewer:

- `.loom/tickets/20260529-flight-learn-constrained-json-adapter.md` - scope, acceptance, and current state.
- `.loom/evidence/20260529-flight-learn-constrained-json-adapter.md` - evidence claims and non-claims.
- `.loom/plans/20260529-flight-learn-comprehension-path.md` - parent plan and sequencing.
- `.loom/specs/flight-learn-inbox-ux.md` - local model/fallback behavior contract.
- `.loom/research/20260529-llama-cpp-constrained-json.md` - constrained decoding research.
- `.loom/evidence/20260529-llama-cpp-constrained-json-probe.md` - proven runtime route evidence.
- `.loom/audit/20260529-llama-cpp-constrained-json-probe-review.md` - prior route-proof audit.
- `src/flight-learn-llama-cpp-adapter.ts` - implementation.
- `src/flight-learn-llama-cpp-adapter.test.ts` - tests.
- Relevant validator code in `src/flight-learn-local-diagnosis-model.ts`.
- `/flight-learn` opt-in/display seams in `src/pi-extension.ts` and `src/flight-learn-inbox.ts`.
- Evidence artifacts under `.loom/evidence/artifacts/20260529-flight-learn-constrained-json-adapter/`.
- Current target diff/status.

Additional reviewer check:

```text
npm test -- src/flight-learn-llama-cpp-adapter.test.ts
```

Result: 13 tests passed.

## Findings

### FIND-001: Evidence says request limits were kept, but the adapter diff includes a higher max output-token clamp

The evidence dossier claims request/response limits were kept. The current diff against repository `HEAD` shows `MAX_MAX_OUTPUT_TOKENS` changed from `256` to `512` in `src/flight-learn-llama-cpp-adapter.ts`. Response byte/content caps remain intact, and this is not an unconstrained-generation fallback, but the request-budget change is visible in the target diff and not explained by the ticket evidence.

Follow-up requested before closure: either restore/document the max-token clamp change and adjust evidence wording accordingly.

### FIND-002: One “valid” generator fixture is not valid against the new generator schema

The new generator schema requires top-level `whatHappened.sentences[].text + factIds`, but the `validPolishJson()` fixture in `src/flight-learn-llama-cpp-adapter.test.ts` omits `whatHappened` while a related test still asserts local-model success. The test still inspects the actual adapter request body, so `ACC-001` remains supported; the concern is evidentiary because this fixture should not be read as proof of accepted schema-constrained generator output without narrative/judge behavior.

Follow-up requested before closure: avoid closure wording that treats this fixture as representative of real constrained-schema output; ideally rename/update the fixture in a follow-up.

## Verdict

Concerns. The adapter implementation appears to satisfy the core bounded behavior, but the ticket should not close until the two evidence/consistency concerns are dispositioned.

This audit does not reject the implementation. It requires follow-through before the ticket can honestly claim closure.

## Required Follow-up

- Disposition `FIND-001` by either restoring/documenting the max-token clamp change and adjusting evidence wording.
- Disposition `FIND-002` by making the fixture consistent with the constrained generator schema or narrowing evidence/closure wording so it cannot be mistaken for constrained-schema acceptance.
- After follow-up, run focused tests and a follow-up Ralph audit or review pass before closure.

## Residual Risk

- Exact adapter schemas were not replayed against real `llama-server`; the evidence correctly defers runtime replay to the next ticket.
- Current workspace has broader pre-existing dirty state, so `ACC-004` can only be supported for this bounded adapter/test slice, not as a clean whole-repo claim.

## Related Records

- `ticket:20260529-flight-learn-constrained-json-adapter` - consuming ticket.
- `evidence:20260529-flight-learn-constrained-json-adapter` - evidence under review.
- `plan:20260529-flight-learn-comprehension-path` - parent plan.
