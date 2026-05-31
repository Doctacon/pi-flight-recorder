# Narrative Fact-ID Contract Verifier Follow-up Review

ID: audit:20260528-narrative-fact-id-contract-verifier-followup-review
Type: Audit
Status: recorded
Created: 2026-05-28
Updated: 2026-05-28
Audited: 2026-05-28
Target: ticket:20260528-narrative-fact-id-contract-verifier
Follows: audit:20260528-narrative-fact-id-contract-verifier-review

## Summary

Follow-up adversarial review shows the implementation fixed important parts of the prior audit: the exact collapsed multi-role transcript case is now omitted, the prior passive/noun route examples now fail closed, duplicate/excessive fact IDs are rejected, and the specific non-npm command examples from the first audit now fail closed. However, closure is still not recommended because the source/prompt scrubber still lets a single role-labelled `user:` prompt/transcript line into `deterministic`, `facts[]`, and the model prompt, and the raw-command hard-safety check still accepts common command literals such as `ls -la` and `curl ...` in fact-cited narrative output.

Verdict: `changes-needed`.

## Scope And Lenses

Reviewed the ticket, prior audit, evidence dossier, harness source/summary, changed source/tests, relevant spec requirements, and follow-up claims for:

- ACC-001 through ACC-005 closure posture.
- Prior `FIND-001` through `FIND-003` dispositions.
- Fact ID duplicate/excessive handling.
- Claim honesty that fact IDs do not prove semantic entailment or usefulness until the judge-provider path exists.

No source files were edited. I did not re-run the sanitized harness because `.loom/evidence/artifacts/20260528-narrative-fact-id-contract-verifier/run-fact-id-contract-harness.mjs` writes artifact JSON files.

## Correct / Resolved

- Prior `FIND-002` is resolved for the challenged passive/noun route examples. `DISPLAY_ONLY_FORBIDDEN_PATTERNS` now rejects any `route|routes|routed|routing` token at `src/flight-learn-local-diagnosis-model.ts:207-214`, and the focused tests include `This should be routed...`, `belongs in the validation route`, and `deserves a ... route` at `src/flight-learn-local-diagnosis-model.test.ts:226-264`. Inline fake-provider probes for those examples returned `unsafe-output`.
- The exact prior multi-role transcript-after-whitespace-collapse case is resolved. `looksLikeTranscript` now counts inline role labels at `src/flight-learn-local-diagnosis-model.ts:433-437`, and the regression test asserts two role-labelled `delta.reality` content is replaced with `[raw session transcript omitted]` in deterministic fields, delta facts, `facts[]`, and prompt at `src/flight-learn-local-diagnosis-model.test.ts:376-394`.
- The specific prior raw command examples are resolved. `RAW_COMMAND_OUTPUT_PATTERNS` now includes common executable+argument forms for `git`, `python`, `node`, `make`, etc. at `src/flight-learn-local-diagnosis-model.ts:199-204`, and tests cover `git status`, `python manage.py test`, `make test`, and `node script.js` at `src/flight-learn-local-diagnosis-model.test.ts:207-223`. Inline probes for those examples returned `unsafe-output`.
- Duplicate and excessive fact IDs are handled. The verifier rejects duplicate IDs and more than eight IDs per sentence at `src/flight-learn-local-diagnosis-model.ts:776-790`, with tests at `src/flight-learn-local-diagnosis-model.test.ts:198-204`.
- ACC-004 remains well-supported in the reviewed scope: local-model polish applies only display wording at `src/flight-learn-local-diagnosis-model.ts:673-685`; source-delta mutation tests exist at `src/flight-learn-local-diagnosis-model.test.ts:102-130` and provider request-copy mutation is rejected at `src/flight-learn-local-diagnosis-model.test.ts:602-619`; the llama.cpp adapter remains literal-loopback-only at `src/flight-learn-llama-cpp-adapter.ts:79-103` with direct proxy-bypassing agent configuration at `src/flight-learn-llama-cpp-adapter.ts:47-49`.
- Claims honesty about semantic entailment/usefulness is good. The ticket says this slice must not claim semantic grounding proof at `.loom/tickets/20260528-narrative-fact-id-contract-verifier.md:13-15` and keeps semantic entailment out of scope at `.loom/tickets/20260528-narrative-fact-id-contract-verifier.md:48-55`; the prompt explicitly says fact IDs are support handles, not proof, at `src/flight-learn-local-diagnosis-model.ts:560-562`; the evidence records the non-claims at `.loom/evidence/20260528-narrative-fact-id-contract-verifier.md:145-151`.

## Findings

### FIND-001: Single-role prompt/transcript-like deterministic text still reaches `facts[]` and prompt

Severity: high
Confidence: high
Disposition: open

Observation:

The fix catches two-or-more role labels, including after whitespace collapse, but `looksLikeTranscript` still requires at least two role markers (`src/flight-learn-local-diagnosis-model.ts:433-437`). `buildLocalDiagnosisFactPacket` copies sanitized deterministic and delta text into fact packet fields at `src/flight-learn-local-diagnosis-model.ts:505-527`, support facts include deterministic `F2` and delta `F7` at `src/flight-learn-local-diagnosis-model.ts:477-502`, and the prompt serializes the packet at `src/flight-learn-local-diagnosis-model.ts:553-568`.

A no-write inline probe with synthetic `delta.reality` containing a single `user:` role-labelled prompt line produced:

- `packet.deterministic.whatHappened`: the synthetic role-labelled content, not `[raw session transcript omitted]`;
- `packet.delta.reality`: the same synthetic role-labelled content;
- `facts[]`: `F2` and `F7` containing that content;
- prompt/serialized packet: contained the role label and prompt body.

The existing regression only covers a two-role `user:`/`assistant:` case at `src/flight-learn-local-diagnosis-model.test.ts:376-394`, so this bypass remains untested.

Why it matters:

ACC-001 requires raw paths/secrets/prompts/transcripts to remain redacted or omitted (`.loom/tickets/20260528-narrative-fact-id-contract-verifier.md:68-70`), and the spec says optional local-model input must not send raw session files, full prompts, or unconstrained transcript text (`.loom/specs/flight-learn-inbox-ux.md:106-108`). A single role-labelled user prompt line is still prompt/transcript-like source text even when no assistant line is present.

Required follow-up:

Treat single exact role labels (`user:`, `assistant:`, `system:`, `developer:`, `tool:`, `bashExecution:`) as prompt/transcript source hazards when building model facts, or otherwise prove/document why one-role session text is safe. Add a regression for single-role deterministic/delta text not appearing in `deterministic`, `facts[]`, or prompt.

Challenges:

- ACC-001 closure claim in `.loom/evidence/20260528-narrative-fact-id-contract-verifier.md:120-123`.
- Prior `FIND-001` closure posture.

### FIND-002: Passive/noun route advice hard-safety bypass is resolved

Severity: high
Confidence: high
Disposition: resolved

Observation:

The prior examples now reject. Source uses a broad route/routed/routing guard at `src/flight-learn-local-diagnosis-model.ts:207-214`; tests cover the prior passive/noun route examples at `src/flight-learn-local-diagnosis-model.test.ts:226-264`; inline probes returned `unsafe-output` for all prior challenged route sentences.

Why it matters:

This satisfies the route/advice part of ACC-003 for the challenged cases.

Follow-up:

None required for the prior finding. The broad route token rule may over-reject benign wording, but that is safer than accepting route advice under this hard-safety contract.

Challenges:

None remaining for prior `FIND-002`.

### FIND-003: Raw command literal verifier still misses common command forms

Severity: high
Confidence: high
Disposition: open

Observation:

The exact prior examples (`git status`, `python manage.py test`, `make test`, `node script.js`) now fail closed, but the raw-command detector is still a narrow executable allow-list at `src/flight-learn-local-diagnosis-model.ts:199-204`. Inline fake-provider probes with known fact IDs returned `accepted` for common raw command literals including:

- `ls -la`
- `curl https://example.invalid`

Those strings passed through `validateWhatHappenedNarrative` because narrative output does not use the old semantic token support gate and relies on `containsUnsafeOutput` at `src/flight-learn-local-diagnosis-model.ts:793-812` and `src/flight-learn-local-diagnosis-model.ts:842-846`. The current tests cover npm/git/python/make/node examples at `src/flight-learn-local-diagnosis-model.test.ts:207-223`, but not these common shell/network command forms.

Why it matters:

ACC-003 requires hard raw-command safety (`.loom/tickets/20260528-narrative-fact-id-contract-verifier.md:76-78`), and REQ-032 says local-model `What happened?` narrative must not include raw commands (`.loom/specs/flight-learn-inbox-ux.md:113-114`). Evidence currently overstates this as covered for common raw command literals at `.loom/evidence/20260528-narrative-fact-id-contract-verifier.md:124` and `.loom/evidence/20260528-narrative-fact-id-contract-verifier.md:136-143`.

Required follow-up:

Either broaden hard raw-command detection to common shell/network/file-command forms (`ls`, `cat`, `grep`, `sed`, `curl`, `wget`, `rm`, `cp`, `mv`, etc. with arguments) or route model output through a stricter command-literal redaction/rejection helper. Add regression probes for at least `ls -la` and `curl ...` and any intentionally accepted boundary cases.

Challenges:

- ACC-003 closure claim in `.loom/evidence/20260528-narrative-fact-id-contract-verifier.md:124`.
- Prior `FIND-003` closure posture.

### FIND-004: Optional sentence `role` key weakens the claimed no-extra-keys schema contract

Severity: low
Confidence: high
Disposition: open

Observation:

The prompt tells the provider to return sentence objects with only `text` and `factIds` (`src/flight-learn-local-diagnosis-model.ts:560-562`), and the ticket scope calls for response schema shape and no extra keys (`.loom/tickets/20260528-narrative-fact-id-contract-verifier.md:33-37`). The verifier nevertheless allows an optional sentence-level `role` key via `WHAT_HAPPENED_SENTENCE_FIELDS` at `src/flight-learn-local-diagnosis-model.ts:168-170` and validates bounded role values at `src/flight-learn-local-diagnosis-model.ts:767-770`. A no-write inline probe with `role: "sequence"` was accepted and the role was ignored when applying display text.

Why it matters:

This is not an immediate privacy/safety issue because the key is bounded and ignored, but it makes ACC-002's "no extra keys" posture ambiguous and gives future agents two different schemas: prompt/ticket says `text + factIds`, verifier says `text + factIds + optional role`.

Required follow-up:

Before closure, either reject `role` as an extra key or update the prompt/ticket/tests/evidence to make optional `role` an intentional schema field.

Challenges:

- ACC-002 schema-ambiguity closure posture.

## ACC Closure Posture

- ACC-001: Not close-ready. Stable fact IDs and bounded facts are present, but single-role prompt/transcript-like deterministic text can still reach `deterministic`, `facts[]`, and prompt.
- ACC-002: Mostly implemented, but not fully clean because optional sentence `role` is accepted despite the prompt/ticket `text + factIds` shape. Duplicate/excessive fact-ID handling is good.
- ACC-003: Not close-ready. Prior route finding is fixed and many verifier failures are covered, but common raw command literals still pass.
- ACC-004: Close-ready within fake-provider/local-first scope; no hidden hosted/provider-key behavior or source-of-truth mutation was found in the reviewed code/tests.
- ACC-005: Validation is healthy, but evidence needs revision after the open findings. Current support claims for ACC-001 and ACC-003 are too broad.

## Validation Re-run During Follow-up Audit

Commands run from `/Users/crlough/Code/personal/pi-flight-recorder`:

```bash
npm test -- src/flight-learn-local-diagnosis-model.test.ts src/flight-learn-llama-cpp-adapter.test.ts src/pi-extension.test.ts
```

Result: passed, `3` test files / `60` tests.

```bash
npm run typecheck
```

Result: passed, `tsc --noEmit` completed with no errors.

```bash
git diff --check
```

Result: passed with no output.

Small inline fake-provider probes were run with `node --import tsx`; they did not write files. They support the observations above for single-role transcript leakage, resolved route examples, resolved prior command examples, and still-accepted `ls -la` / `curl ...` command literals.

## Residual Risk

- Fact IDs alone still do not prove semantic entailment, usefulness, or actionability. This is honestly documented and remains the dependent judge-provider ticket's job.
- Hard-safety regexes remain a bounded heuristic layer. Even after fixing `ls`/`curl`, do not claim broad command/action safety beyond tested hard literals.
- No real Bonsai/llama.cpp runtime, local judge, latency, JSON reliability, or UI screenshot validation is proven by this ticket.
- The broad route-token rejection may over-reject benign narrative wording, but that is an acceptable safety-biased residual risk for this ticket unless the operator wants a more nuanced route-language contract.

## Required Follow-up

1. Fix or explicitly risk-accept single-role prompt/transcript-like leakage into fact packets and prompts; add regression coverage.
2. Fix or explicitly bound raw-command detection for common command literals such as `ls -la` and `curl ...`; add regression coverage.
3. Resolve the optional `role` schema ambiguity by rejecting it or documenting/testing it as intentional.
4. Re-run focused tests, adapter/Pi tests, typecheck, diff-check, and the sanitized harness; refresh evidence and harness artifacts if the harness is re-run.
5. Update the evidence dossier so ACC-001/ACC-003 support claims match the fixed and tested scope.

## Acceptance Recommendation

Do not close `ticket:20260528-narrative-fact-id-contract-verifier` yet. Active follow-up is required for `FIND-001` and `FIND-003`; `FIND-004` should be cleaned up or explicitly accepted before closure. Closure can be reconsidered after fixes and refreshed evidence, while preserving the current honest non-claim that semantic entailment/usefulness require the dependent judge-provider path.
