# Real Bonsai Local Model Validation

ID: ticket:20260527-real-bonsai-local-model-validation
Type: Ticket
Status: closed
Created: 2026-05-27
Updated: 2026-05-27
Risk: high - this performs an operator-authorized local runtime/model download/install and validates a privacy-sensitive model path that was previously blocked.
Priority: high - operator explicitly approved unblocking the real Bonsai proof after challenging fake-provider-only validation.
Depends On: ticket:20260527-flight-learn-local-model-polish-validation

## Summary

Run an explicitly authorized real local-model validation for `/flight-learn` diagnosis polish using PrismML Bonsai GGUF through `llama.cpp` on loopback. This ticket exists because the prior validation closed honestly with real Bonsai proof blocked; the operator has now approved downloading/installing what is needed to make the real path work.

Single closure claim: a real Bonsai GGUF model can be served by `llama.cpp` on `127.0.0.1` and used by `/flight-learn --local-model-polish` to produce validated display-only diagnosis wording, while deterministic fallback and candidate-only storage safety remain true.

## Related Records

- `plan:20260527-flight-learn-local-model-diagnosis-polish` - closed parent plan; real Bonsai behavior was explicitly left unproven.
- `research:20260527-local-diagnosis-model-runtime` - recommends Bonsai 1.7B GGUF Q1_0 first through explicit loopback `llama.cpp` server.
- `ticket:20260527-flight-learn-local-model-polish-validation` - prior validation ticket; closed with real-model proof blocked.
- `evidence:20260527-flight-learn-local-model-polish-validation` - prior evidence showing fake-provider proof and real Pi unavailable fallback.
- `ticket:20260527-local-diagnosis-model-adapter` - loopback adapter implementation and audits.
- `src/flight-learn-local-diagnosis-model.ts` - prompt/schema/validator/fallback harness.
- `src/flight-learn-llama-cpp-adapter.ts` - loopback `llama.cpp` adapter.
- `src/pi-extension.ts` and `src/flight-learn-inbox.ts` - `/flight-learn` integration and display.
- `evidence:20260527-real-bonsai-local-model-validation` - runtime/model setup, direct probes, real Pi TUI proof, route safety, and validation command artifacts.
- `audit:20260527-real-bonsai-local-model-validation-review` - first audit; verdict `concerns`.
- `audit:20260527-real-bonsai-local-model-validation-followup-review` - follow-up audit; verdict `concerns`.
- `audit:20260527-real-bonsai-local-model-validation-second-followup-review` - final audit; verdict `clear`.

## Scope

In scope:

- Install or build an open-source `llama.cpp` runtime if unavailable, recording provenance.
- Download PrismML Bonsai 1.7B GGUF Q1_0 from the official Hugging Face repository, recording URL, license/model-card provenance, file size, and checksum. If 1.7B cannot produce valid useful JSON after reasonable attempts, try Bonsai 4B GGUF Q1_0 as a quality fallback and record why.
- Start `llama-server` bound only to `127.0.0.1` on a disposable port.
- Probe `/v1/chat/completions` with a synthetic non-sensitive prompt and the same JSON-response shape expected by the adapter.
- Run the existing `/flight-learn --local-model-polish --local-model-url http://127.0.0.1:<port>` path against a disposable fixture and capture whether model wording is accepted, rejected, or falls back.
- Capture real Pi TUI evidence if the local server path is stable enough; at minimum run a direct local integration harness through the built adapter and record request/response/fallback details.
- Verify no model output is persisted into stored `ExpectationDelta` fields or artifact drafts, and route storage remains candidate-only/unapplied.
- Record an evidence dossier and audit review before closure.

Out of scope:

- Bundling model weights or runtime binaries into the package.
- Adding package runtime dependencies.
- Changing the adapter to manage runtime/model lifecycle automatically.
- Calling hosted inference APIs, non-loopback endpoints, telemetry, or provider keys.
- Using `llama.cpp -hf` or app-managed model download inside the product path.
- Broad prompt tuning, long-run corpus evaluation, or classifier automation.
- Claiming global/user-scope package install behavior beyond the disposable validation environment.

Likely write scope:

- `.loom/evidence/20260527-real-bonsai-local-model-validation.md`
- `.loom/evidence/artifacts/20260527-real-bonsai-local-model-validation/`
- this ticket's Current State and Journal
- source/tests only if real-model validation exposes a small bug required to make the existing accepted integration work; otherwise source should stay unchanged.

Stop conditions:

- Stop if the runtime/model download asks for credentials, a hosted inference endpoint, a non-open license, or a non-loopback service.
- Stop if only a non-loopback server binding works.
- Stop if real model output repeatedly fails validators and fixing it would require changing product behavior or weakening safety constraints; record the failed validation honestly and route a follow-up ticket.
- Stop if model/runtime setup requires broad system changes beyond operator-approved local open-source runtime/model installation.
- Stop if evidence would need to persist secrets, private prompts, raw sessions, or unredacted sensitive paths.

## Acceptance

- ACC-001: A real open-source runtime/model setup is observed.
  - Evidence: runtime install/build provenance, `llama-server` version/help or commit/package info, Bonsai model source URL, license/model-card excerpt, file size, checksum, and loopback server command are recorded.
  - Audit: review should challenge whether the setup is actually local/open-source and whether downloads/install behavior stayed outside the product path.

- ACC-002: The runtime is loopback-only and adapter-compatible.
  - Evidence: server is bound to `127.0.0.1`, `/v1/chat/completions` responds locally, request shape uses no API key/provider headers, and no non-loopback/hosted endpoint is configured.
  - Audit: review should challenge locality, proxy/env surprises, and accidental hosted behavior.

- ACC-003: Real Bonsai output is either accepted as display-only wording or rejected with deterministic fallback for a clear reason.
  - Evidence: captured prompt/fact packet redaction summary, raw model content (non-sensitive), validator outcome, `/flight-learn` display line (`Local model phrasing...` or fallback), and latency are recorded.
  - Audit: review should challenge hallucination, unsafe wording, raw path leakage, unsupported facts, and overclaiming.

- ACC-004: Candidate-only storage safety remains true after a route flow.
  - Evidence: DB/status artifact shows accepted artifact candidate with `applied=false`, no new flight rules/rule candidates, and stored delta/artifact draft source-of-truth fields do not contain model-polished wording.
  - Audit: review should challenge whether model output influenced route ranking or persisted fields.

- ACC-005: Existing standard validation remains healthy or any source changes are proven.
  - Evidence: if no source changes occur, record `git diff --check` and relevant smoke commands. If source changes are required, run focused tests, typecheck, build, full tests, and audit the diff.
  - Audit: review should challenge skipped tests or unreviewed source edits.

## Current State

Closed. Operator-approved real Bonsai validation is complete and recorded in `evidence:20260527-real-bonsai-local-model-validation`. Homebrew installed `llama.cpp 9360`; Bonsai 1.7B Q1_0 GGUF was downloaded from `prism-ml/Bonsai-1.7B-gguf` to local cache with checksum `3d7c6c90dd98717a203adb22d5eacd2581850e40aa5327e144b97766cae5f7e3`; `llama-server` ran on `127.0.0.1:18117`; direct adapter probe returned `usedLocalModel: true`; real Pi showed `Local model phrasing; deterministic fallback available.` and route submission stored an accepted `test-check` candidate with `applied=false` and zero rule records.

Nuance: Bonsai 1.7B's accepted wording was conservative and close to deterministic text. A no-expectation fixture was rejected/fell back (`schema-invalid`) in direct probe and timed out/fell back in an earlier real Pi run. This ticket proves the real local model path can work on a supported fixture; it does not prove broad model quality. First two audits returned `concerns` for evidence precision gaps; follow-up artifacts `49-runtime-version-recheck.txt`, `50-real-pi-valid-full-artifact-candidate.json`, and `51-real-pi-valid-full-artifact-candidate-with-metadata.json` addressed them. Final audit `audit:20260527-real-bonsai-local-model-validation-second-followup-review` returned `clear`.

## Journal

- 2026-05-27: Created after operator approved unblocking real Bonsai validation. The ticket is intentionally validation/setup focused and must not weaken the product adapter's no-download/no-runtime-lifecycle boundary.
- 2026-05-27: Set active and began operator-approved local setup/validation.
- 2026-05-27: Installed `llama.cpp`, downloaded Bonsai 1.7B Q1_0 GGUF, started `llama-server` on loopback, captured direct adapter/raw probes, real Pi successful model-phrasing pane, candidate-only route DB inspection, typecheck/build/full tests/diff check, and recorded `evidence:20260527-real-bonsai-local-model-validation`. Moved to review.
- 2026-05-27: First audit returned `concerns`: initial version artifact missed stderr output, and DB evidence omitted full artifact draft fields. Added `49-runtime-version-recheck.txt`, `50-real-pi-valid-full-artifact-candidate.json`, and updated evidence/ticket wording for follow-up review.
- 2026-05-27: Follow-up audit returned `concerns` because metadata was still omitted from durable full-candidate evidence. Added `51-real-pi-valid-full-artifact-candidate-with-metadata.json` showing `metadataJson: "{}"` and no forbidden model-text matches across title/draft/limits/metadata.
- 2026-05-27: Recorded `audit:20260527-real-bonsai-local-model-validation-second-followup-review` with verdict `clear`. Closed ticket with residual limits: one supported synthetic fixture, no packet capture, and no broad Bonsai quality claim.
