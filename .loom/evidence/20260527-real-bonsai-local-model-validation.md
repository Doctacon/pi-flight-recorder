# Real Bonsai Local Model Validation

ID: evidence:20260527-real-bonsai-local-model-validation
Type: Evidence Dossier
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Observed: 2026-05-27

## Summary

This dossier records the operator-authorized real local Bonsai validation that unblocked the prior `real-model proof blocked` state. It installed `llama.cpp` through Homebrew, downloaded PrismML Bonsai 1.7B GGUF Q1_0 from the official Hugging Face repository into the user's local cache, started `llama-server` on `127.0.0.1`, validated the real adapter path, and captured real Pi TUI evidence showing `/flight-learn --local-model-polish` using real local model phrasing while preserving candidate-only route safety.

Important nuance: the accepted Bonsai output was conservative and largely matched the deterministic diagnosis fields for the fixture. The evidence proves the real local model path runs and passes the validator; it does not prove broad phrasing quality.

Artifact directory:

```text
.loom/evidence/artifacts/20260527-real-bonsai-local-model-validation/
```

## Related Records

- `ticket:20260527-real-bonsai-local-model-validation`
- `research:20260527-local-diagnosis-model-runtime`
- `ticket:20260527-flight-learn-local-model-polish-validation`
- `evidence:20260527-flight-learn-local-model-polish-validation`
- `ticket:20260527-local-diagnosis-model-adapter`
- `spec:flight-learn-inbox-ux` REQ-024 through REQ-029 / SCN-008 and SCN-009
- `spec:visible-command-surface`

## Observations

### Runtime installation and provenance

Procedure:

```bash
brew info llama.cpp
brew install llama.cpp
llama-server --version
llama-cli --version
brew info llama.cpp
```

Artifacts:

- `01-runtime-brew-info-before.txt`
- `02-brew-install-llama-cpp.txt`
- `03-runtime-provenance.txt`

Observed result:

- `llama.cpp` was not installed before this ticket.
- Homebrew installed `llama.cpp 9360` with MIT license metadata.
- `llama-server` and `llama-cli` resolved to `/opt/homebrew/bin/...`.
- Initial version capture omitted stderr, leaving blank version fields in `03-runtime-provenance.txt`; follow-up artifact `49-runtime-version-recheck.txt` captured `version: 9360 (6b4e4bd58)` for both `llama-server` and `llama-cli`, built with AppleClang for Darwin arm64.

### Bonsai 1.7B GGUF Q1_0 download and provenance

Procedure:

```bash
curl -L https://huggingface.co/prism-ml/Bonsai-1.7B-gguf/resolve/main/Bonsai-1.7B-Q1_0.gguf -o ~/.cache/pi-flight-recorder/bonsai/Bonsai-1.7B-Q1_0.gguf
curl https://huggingface.co/api/models/prism-ml/Bonsai-1.7B-gguf
shasum -a 256 ~/.cache/pi-flight-recorder/bonsai/Bonsai-1.7B-Q1_0.gguf
```

Artifacts:

- `04-model-card-excerpt.txt`
- `05-model-download.txt`
- `06-model-provenance.txt`
- `hf-api-bonsai-1.7b-gguf.json`

Observed result:

```text
model_path=/Users/crlough/.cache/pi-flight-recorder/bonsai/Bonsai-1.7B-Q1_0.gguf
model_size_bytes=248302272
sha256=3d7c6c90dd98717a203adb22d5eacd2581850e40aa5327e144b97766cae5f7e3
id=prism-ml/Bonsai-1.7B-gguf
sha=210a9e99f79cb184909d49595906526eb2b3dd9a
library_name=llama.cpp
pipeline_tag=text-generation
license_tags=license:apache-2.0
format_tags=llama.cpp,gguf,1-bit,llama-cpp,cuda,metal
```

The model file was not copied into the repository or `.loom` artifacts because it is a large downloaded weight file. The artifact records its local cache path, size, and checksum.

### Loopback `llama-server`

Procedure:

```bash
llama-server -m ~/.cache/pi-flight-recorder/bonsai/Bonsai-1.7B-Q1_0.gguf --host 127.0.0.1 --port 18117 -c 2048 --no-webui --jinja
curl http://127.0.0.1:18117/health
```

Artifacts:

- `07-llama-server.log`
- `07-llama-server.pid`
- `08-server-health.json`
- `42-server-final-status.txt`
- `43-server-stop.txt`

Observed result:

- Health endpoint returned `{"status":"ok"}`.
- Server log shows model loaded from the local Bonsai GGUF path and `server is listening on http://127.0.0.1:18117`.
- Server command bound to `127.0.0.1`, not `0.0.0.0`.
- Final `ps` sample showed RSS about `645184` KiB during validation.
- Server was stopped after validation (`server_stopped=true`).

### Direct real adapter probe

Procedure:

```bash
node --import tsx probe-real-bonsai-adapter.mjs http://127.0.0.1:18117 5000
```

Artifact: `09-real-bonsai-adapter-probe.json`

Observed result:

- Elapsed time: `1463` ms.
- `usedLocalModel: true`.
- `fallbackReason: null`.
- `validationIssue: null`.
- View limits included `Optional local model phrasing was used for display-only wording; stored delta fields, routing, and artifacts were not changed.`

### Raw local server response and redaction check

Procedure:

```bash
node --import tsx probe-real-bonsai-raw.mjs http://127.0.0.1:18117
```

Artifact: `10-real-bonsai-raw-response.json`

Observed result:

```json
{
  "elapsedMs": 986,
  "requestSummary": {
    "endpoint": "http://127.0.0.1:18117/v1/chat/completions",
    "bodyBytes": 2426,
    "promptChars": 2135,
    "promptContainsRedactedUserPath": true,
    "promptContainsRawUserPath": false,
    "stream": false,
    "max_tokens": 192,
    "temperature": 0.1,
    "response_format": { "type": "json_object" }
  },
  "statusCode": 200,
  "content": "{\n  \"headline\": \"A validation command failed repeatedly in this project.\",\n  \"whatHappened\": \"Pi saw the same validation-failure pattern twice in recent sessions.\",\n  \"whyItMatters\": \"Repeated validation friction makes the result hard to trust.\",\n  \"expectedBehavior\": \"Validation should run from a fresh project shell after changes.\"\n}"
}
```

This supports that the prompt sent to the local server was bounded/redacted and did not include `/Users/alice`.

### Negative probe: unsupported expected behavior shape

Procedure:

```bash
node --import tsx probe-real-bonsai-adapter-noexpect.mjs http://127.0.0.1:18117
```

Artifact: `26-real-bonsai-adapter-noexpect-probe.json`

Observed result:

- Elapsed time: `807` ms.
- `usedLocalModel: false`.
- `fallbackReason: schema-invalid`.
- `validationIssue: provider response included non-display fields`.

A first real Pi run against the older no-expectation fixture also showed `Local model unavailable (timed out); deterministic wording shown.` (`17-real-pi-bonsai-card-pane.txt`). This is preserved as a useful limit: Bonsai 1.7B can pass on a supported fixture, but not every fixture/output shape currently passes the validator.

### Real Pi TUI success with real Bonsai

Procedure:

- Created disposable temp `HOME`, `PI_CODING_AGENT_DIR`, `PI_CODING_AGENT_SESSION_DIR`, workspace, data dir, and TUI log dir.
- Ran project-local install in the disposable workspace:

```bash
pi install /Users/crlough/Code/personal/pi-flight-recorder -l
```

- Seeded `delta_real_bonsai_valid_model` with bounded synthetic evidence and an expected behavior field.
- Launched Pi in tmux with `PI_OFFLINE=1`, `PI_TUI_WRITE_LOG`, `--offline`, `--no-skills`, `--no-prompt-templates`, `--no-context-files`, `--no-session`, and `--no-tools`.
- Ran:

```text
/flight-learn delta-review --data-dir <temp-data-dir> --local-model-polish --local-model-url http://127.0.0.1:18117 --local-model-timeout-ms 5000 --local-model-max-output-tokens 128
```

Artifacts:

- `27-real-pi-valid-run-env.txt`
- `28-real-pi-valid-install-output.txt`
- `29-real-pi-valid-project-settings.json`
- `30-real-pi-valid-seed-output.json`
- `31-real-pi-valid-startup-pane.txt`
- `32-real-pi-valid-command-palette-flight-pane.txt`
- `33-real-pi-valid-bonsai-card-pane.txt`
- `valid-tui-2026-05-27_11-33-52-76072.log`

Observed result: the real Pi card showed:

```text
Flight Learn — Issue 1 of 2
2 pending · 1 evidence ref · ↑/↓ changes issue
Local model phrasing; deterministic fallback available.

Problem
 A validation command failed repeatedly in this project.

What happened?
 Pi saw the same validation-failure pattern twice in recent sessions.

Why it matters
 Repeated validation friction makes the result hard to trust.

Expected
 Validation should run from a fresh project shell after changes.
```

The command palette artifact shows only `flight-status` and `flight-learn`.

### Real Pi candidate-only route safety after model use

Procedure: in the same real Pi run, selected Test/check, submitted a human reason, ran `/flight-status`, and inspected the SQLite database.

Artifacts:

- `34-real-pi-valid-bonsai-testcheck-selected-pane.txt`
- `35-real-pi-valid-bonsai-editor-pane.txt`
- `36-real-pi-valid-bonsai-editor-edited-pane.txt`
- `37-real-pi-valid-bonsai-after-submit-pane.txt`
- `38-real-pi-valid-bonsai-status-pane.txt`
- `41-real-pi-valid-bonsai-db-after-route.json`

Observed result:

- Notification: `Artifact candidate: artifact_cand_5b106784f063c162 [accepted; applied=false]` and `No artifact was created or applied.`
- DB counts: `candidates: 1`, `ruleCandidates: 0`, `flightRules: 0`.
- Candidate is `artifactType: test-check`, `status: accepted`, `applied: false`.
- Stored delta summary remains the stored raw clue text; model-polished wording was not written back to `ExpectationDelta.summary`.
- Follow-up full candidate inspections in `50-real-pi-valid-full-artifact-candidate.json` and `51-real-pi-valid-full-artifact-candidate-with-metadata.json` record `title`, `proposedDraft`, `nextStep`, `limits`, and metadata. `metadataJson` is `{}`, and `forbiddenModelTextMatches` is empty for the model disclosure/deterministic diagnosis phrases checked. The draft was built from stored delta fields and the human rationale, not from the local model display text.

### Standard project validation

Procedures:

```bash
npm run typecheck
npm run build
npm test
git diff --check
```

Artifacts:

- `44-typecheck.txt`
- `45-build.txt`
- `46-full-test.txt`
- `47-diff-check.txt`
- `49-runtime-version-recheck.txt`
- `50-real-pi-valid-full-artifact-candidate.json`
- `51-real-pi-valid-full-artifact-candidate-with-metadata.json`

Observed result:

```text
Test Files  21 passed (21)
Tests  126 passed (126)
```

`git diff --check` produced no output.

## What This Shows

- `ticket:20260527-real-bonsai-local-model-validation#ACC-001` is supported: a real `llama.cpp` runtime and Bonsai 1.7B Q1_0 GGUF model were installed/downloaded under operator approval with provenance, license tag, size, and checksum recorded.
- `ACC-002` is supported: `llama-server` listened on `127.0.0.1:18117`; adapter/raw probes used `POST /v1/chat/completions` locally with no API key/provider headers; the product adapter remained loopback-only.
- `ACC-003` is supported with nuance: real Bonsai output was accepted as display-only wording for the supported fixture, and a negative no-expectation fixture was rejected/fell back. The accepted wording was conservative and largely matched deterministic fields.
- `ACC-004` is supported: real Pi route flow after model use stored an accepted but unapplied artifact candidate, created no rules, and did not persist model wording into stored delta source-of-truth fields or inspected artifact draft fields.
- `ACC-005` is supported: typecheck, build, full tests, and diff check passed; no source code changes were required for the real Bonsai validation.

## What This Does Not Show

- It does not prove Bonsai 1.7B produces better wording across arbitrary deltas; the successful fixture's accepted wording was conservative and close to deterministic text.
- It does not prove every fixture passes. The no-expectation fixture produced a schema-invalid fallback in direct probing, and an earlier real Pi no-expectation run timed out/fell back.
- It does not prove Bonsai 4B/8B quality fallbacks; they were not downloaded or run because 1.7B produced at least one accepted real-model path.
- It does not prove global/package-registry install behavior; Pi validation used disposable project-local install.
- It does not prove OS-level no-network behavior with packet capture. Locality evidence rests on loopback config, offline Pi flags, adapter restrictions, server logs, and local URLs.
- It does not prove long-run corpus quality, latency distribution, or operator preference after continued use.
- It does not mean the app downloads or installs models automatically. The runtime/model setup here was operator-authorized validation setup outside the product adapter.
