# Flight Learn LLM Card Copy Runtime Replay

ID: ticket:20260531-flight-learn-llm-card-copy-runtime-replay
Type: Ticket
Status: closed
Created: 2026-05-31
Updated: 2026-05-31
Risk: medium - this is evidence work over synthetic/redacted data, but it gates whether model-enabled card-copy claims can be trusted.
Priority: medium - run after rendering so the replay can preserve representative product-card artifacts.
Depends On: ticket:20260531-flight-learn-llm-card-copy-rendering

## Summary

Exercise the repaired product card-copy path over representative synthetic/redacted cases and record whether the configured local runtime can produce usable all-field card copy. Fake providers may prove deterministic behavior and rendering; real Bonsai 4B/llama.cpp runtime evidence should be gathered only with explicit runtime authorization during execution.

The closure claim is: the project has a privacy-safe replay/render evidence packet showing parse/schema/gate pass rates, field coverage, fallback reasons, unsafe rejections, and representative rendered cards for the all-field local LLM card-copy path, or an honest blocker explaining why real-runtime usefulness remains unproven.

## Related Records

- `plan:20260531-flight-learn-llm-authored-card-copy` - parent plan.
- `ticket:20260531-flight-learn-llm-card-copy-contract` - contract this replay exercises.
- `ticket:20260531-flight-learn-llm-card-copy-rendering` - renderer this replay should use for product-card artifacts.
- `spec:flight-learn-inbox-ux` REQ-042 through REQ-048 and SCN-013 through SCN-015 - behavior the replay should probe.
- `evidence:20260531-flight-learn-llm-card-copy-operator-feedback` - reason this replay exists.
- `evidence:20260529-flight-learn-constrained-judge-replay` - prior negative accepted-narrative gate; do not overread schema validity as comprehension.
- `evidence:20260529-llama-cpp-constrained-json-probe` - prior evidence that request-level JSON schema can enforce generator shape on the local runtime route.
- Existing redacted corpus/render artifacts under `.loom/evidence/artifacts/20260529-*` - useful harness examples.

## Scope

In scope:

- Build or reuse a synthetic/redacted replay corpus covering repeated workflow, validation/build, stale edit, low-information, safety/adversarial, expected-known, expected-unknown, and evidence-summary cases.
- Run fake-provider replay/render checks to prove the product card path can render all-field copy deterministically.
- If explicitly authorized during execution, run the existing Bonsai 4B/llama.cpp local runtime through the product adapter path for the same or comparable synthetic/redacted cases.
- Record parse-valid, schema-valid, gate-pass, field coverage, fallback reason, unsafe rejection, and latency metrics where applicable.
- Produce redacted render artifacts for representative model-enabled and fallback cards.
- Preserve privacy scans and evidence dossier.

Out of scope:

- Product source changes. If replay finds source bugs, stop and route a new implementation ticket unless the bug is a tiny artifact-local harness issue.
- Raw private Pi sessions, raw local paths, secrets, prompts, transcripts, stack traces, or unredacted command text in Loom.
- New model downloads, hosted calls, non-loopback endpoints, telemetry, custom llama.cpp forks, new model families, or automatic runtime installs.
- Treating replay success as operator comprehension or classifier readiness.
- Starting dogfood corpus/outcome collection.

Runtime authorization boundary:

- Bonsai 4B Q1_0 was previously authorized/available, but this ticket should still make real `llama-server` invocation explicit at execution time. If authorization or runtime availability is absent, record `real-runtime-not-run` and keep real-runtime usefulness unproven.

Likely first Ralph run:

- Read this ticket, parent plan, completed contract/rendering evidence, and prior replay/probe artifacts.
- Create an artifact-local replay harness if one does not already exist.
- Prefer synthetic/redacted cases and fake providers first.
- Run real local runtime only when explicitly authorized and safe.

Stop conditions:

- Stop if source changes seem necessary; create/route a new ticket.
- Stop if replay would require raw private sessions or unredacted local artifacts.
- Stop if real runtime would require a new model download, install, hosted call, or non-loopback endpoint.
- Stop if unsafe/action-advice/model-generated evidence appears; preserve only redacted summaries and fail closed.

## Acceptance

- ACC-001: Replay corpus is representative and privacy-safe.
  - Evidence: artifact inventory lists synthetic/redacted cases and coverage without raw sessions, raw local paths, secrets, prompts, transcripts, or stack traces.
  - Audit: challenge cherry-picking and privacy leakage.

- ACC-002: Product card-copy path metrics are recorded.
  - Evidence: replay summary includes parse-valid, schema-valid, gate-pass, field coverage, fallback reasons, unsafe rejections, and latency where runtime was exercised.
  - Audit: challenge overclaiming field coverage or treating schema success as comprehension.

- ACC-003: Representative render pack exists.
  - Evidence: artifacts include model-enabled and fallback card renders at representative widths using the repaired focused-card renderer.
  - Audit: challenge whether renders actually reflect product integration and hidden-provenance requirements.

- ACC-004: Real runtime status is honest.
  - Evidence: dossier states whether real Bonsai/llama.cpp was run, under what explicit authorization, with runtime/model provenance when run, or why not run.
  - Audit: challenge any claim of real local-model usefulness when only fake providers ran.

- ACC-005: Replay does not advance corpus collection.
  - Evidence: dossier and ticket state that operator comprehension remains a separate downstream gate.
  - Audit: challenge premature dogfood/classifier claims.

## Current State

Closed as negative real-runtime evidence. Ralph evidence run completed and recorded `evidence:20260531-flight-learn-llm-card-copy-runtime-replay` with artifacts under `.loom/evidence/artifacts/20260531-flight-learn-llm-card-copy-runtime-replay/`. Audit `audit:20260531-flight-learn-llm-card-copy-runtime-replay-review` returned `clear` as a bounded evidence audit and confirmed the ticket can close as negative evidence.

Fake-provider replay covered 8 synthetic/redacted cases and produced model-enabled/fallback render artifacts at 72 and 92 columns. Fake-provider metrics: 8/8 parse-valid, 8/8 schema-valid, 3/8 product gate pass, 5/8 deterministic fallback, with unsafe/unsupported cases proving hard-gate fallback behavior.

Real Bonsai 4B Q1_0 ran locally via loopback `llama-server` with the previously recorded checksum and no downloads/installs/network-hosted calls. Real metrics: 8 cases, 5/8 parse-valid, 5/8 schema-valid, 0/8 product gate pass, 8/8 deterministic fallback, 5 unsafe-output rejections, 3 timeouts, average latency 4472ms. Raw server logs were temporary and deleted after byte-count summary; no raw model output was persisted.

Width checks, default-hidden-internals checks, post-run listener check, scoped diff check, privacy scan, and audit passed. The negative real-runtime result means successor operator comprehension validation must remain blocked for the current Bonsai 4B all-field card-copy path until an operator decision, prompt/model repair, or deliberately scoped fallback-only validation change.

## Journal

- 2026-05-31: Created as the third child ticket of `plan:20260531-flight-learn-llm-authored-card-copy`.
- 2026-05-31: Unblocked after `ticket:20260531-flight-learn-llm-card-copy-rendering` closed with clear audit.
- 2026-05-31: Set status to active and launched bounded Ralph runtime replay run. Bonsai 4B Q1_0 is the only authorized real model; no downloads or installs are permitted.
- 2026-05-31: Completed fake-provider and real Bonsai 4B runtime replay over 8 synthetic/redacted cases. Evidence recorded at `evidence:20260531-flight-learn-llm-card-copy-runtime-replay`. Real runtime ran locally but produced 0/8 product gate passes; ticket moved to review pending audit.
- 2026-05-31: Audit `audit:20260531-flight-learn-llm-card-copy-runtime-replay-review` returned clear as a bounded evidence audit and confirmed this should close as negative real-runtime evidence. Closed ticket; kept successor comprehension validation blocked for current Bonsai 4B all-field card-copy path.
