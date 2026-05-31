# Bonsai 4B Narrative Validation Review

ID: audit:20260528-bonsai-4b-narrative-validation-review
Type: Audit
Status: recorded
Created: 2026-05-28
Updated: 2026-05-28
Audited: 2026-05-28/2026-05-29 UTC
Target: ticket:20260528-bonsai-4b-narrative-validation

## Verdict

Blocked for closure on `ACC-004` until the evidence artifacts/privacy scan are corrected: `post-validation-focused-tests.txt` persists a raw absolute repo path, while `privacy-scan.json` reports no findings. Apart from that privacy false negative, the negative Bonsai 4B result is well supported and honestly interpreted: real local `llama.cpp`/Bonsai evidence exists, all 15 corpus cases are structured, the result is 0 accepted / 15 fallback, the visual artifact is correctly labeled as fallback-only, and the recommendation does not overclaim beyond the observed run.

## Review

- Correct: `ACC-001` is supported as real local Bonsai 4B evidence, not fake-provider proof. The runtime artifact identifies Homebrew `llama-server`, version `9360`, the Bonsai GGUF path, checksum, PID/RSS, loopback command, and health (`.loom/evidence/artifacts/20260528-bonsai-4b-narrative-validation/runtime-provenance.txt:1-11`). The checksum matches the predecessor model provenance (`.loom/evidence/artifacts/20260527-prism-ml-small-model-comparison/07-model-4b-provenance.txt:1-5`). The local server log shows the model loading and listening on `http://127.0.0.1:18118` (`.loom/evidence/artifacts/20260528-bonsai-4b-narrative-validation/llama-server-4b.log:13-14`, `:46-47`). The validation harness imports the real local diagnosis path and llama.cpp adapter, configures generator and judge with the loopback base URL, and writes results from `buildFlightLearnDiagnosisViewWithLocalPolish` (`.loom/evidence/artifacts/20260528-bonsai-4b-narrative-validation/run-real-bonsai-4b-narrative-validation.mjs:4-12`, `:81-94`, `:97-140`). The adapter path itself validates literal HTTP loopback and posts to `/v1/chat/completions` through a direct loopback HTTP agent (`src/flight-learn-llama-cpp-adapter.ts:53-56`, `:101-125`, `:160-172`, `:175-190`, `:231-237`).

- Correct: `ACC-002` is supported. The summary records 15 total cases, 0 accepted, 15 fallbacks, no runtime errors, fallback reasons, rubric outcomes, and latency metrics (`.loom/evidence/artifacts/20260528-bonsai-4b-narrative-validation/real-bonsai-4b-narrative-summary.json:1-25`). I also ran a read-only JSON parse check comparing the corpus and results; it found `corpusCount: 15`, `resultCount: 15`, no missing IDs, no extra IDs, same order, and no missing required per-case fields. The interpretation is honest that positive/narrative-better cases also fell back and that adversarial fallback success alone is insufficient (`.loom/evidence/20260528-bonsai-4b-narrative-validation.md:92-97`).

- Correct: The 0 accepted / 15 fallback result is not overclaimed. The evidence explicitly says the result is under the current strict schema/verifier/local self-judge path (`.loom/evidence/20260528-bonsai-4b-narrative-validation.md:12-14`) and lists non-claims for broad Bonsai quality, independent judge quality, longer timeouts, grammar-constrained JSON, other quantizations/models, real Pi TUI validation, and release readiness (`.loom/evidence/20260528-bonsai-4b-narrative-validation.md:177-183`).

- Correct: Visual evidence is honest for a negative result. The evidence states there is no accepted-narrative visual artifact because no real 4B narrative was accepted, and that the fallback render does not prove the desired distinct narrative UX (`.loom/evidence/20260528-bonsai-4b-narrative-validation.md:111-127`). The render itself clearly discloses `Local model unavailable (invalid JSON); deterministic wording shown` and displays deterministic `Problem`/`What happened?` text (`.loom/evidence/artifacts/20260528-bonsai-4b-narrative-validation/real-4b-fallback-render.txt:1-10`).

- Correct: Local-first runtime boundaries are mostly supported. The server command is loopback-only (`runtime-provenance.txt:9`; `.loom/evidence/artifacts/20260528-bonsai-4b-narrative-validation/server-command.txt:1-7`), the results summary marks `hostedProviderUsed: false` and uses `http://127.0.0.1:18118` (`real-bonsai-4b-narrative-summary.json:3-7`), and no download command appeared in the validation artifact grep. `server-final-status.txt` records `stopped` (`.loom/evidence/artifacts/20260528-bonsai-4b-narrative-validation/server-final-status.txt:1-5`); a live read-only `ps -p 49092` and `lsof -nP -iTCP:18118 -sTCP:LISTEN` check returned no process/listener output.

- Fixed: None. I did not edit source or evidence artifacts; this audit file is the only write requested by the operator.

- Blocker: `ACC-004` is not closed because the privacy scan has a false negative. `privacy-scan.json` says `pass: true`, `forbiddenPatternCount: 0`, and no findings (`.loom/evidence/artifacts/20260528-bonsai-4b-narrative-validation/privacy-scan.json:1-5`), but `post-validation-focused-tests.txt` persists the raw absolute repo path `/Users/crlough/Code/personal/pi-flight-recorder` (`.loom/evidence/artifacts/20260528-bonsai-4b-narrative-validation/post-validation-focused-tests.txt:1-12`, especially line 6). That conflicts with the ticket stop condition against evidence requiring unredacted paths (`.loom/tickets/20260528-bonsai-4b-narrative-validation.md:47-52`) and the `ACC-004` redaction/raw-path audit lens (`.loom/tickets/20260528-bonsai-4b-narrative-validation.md:68-70`). Required follow-up: redact or regenerate that artifact with the repo path replaced by a neutral placeholder, update/rerun the privacy scan so absolute home paths are caught, and adjust the evidence/ticket privacy claim accordingly.

- Note: `ACC-003` should not be treated as a success visual claim. The ticket acceptance text asks for a visual UX claim showing the narrative `What happened?` path (`.loom/tickets/20260528-bonsai-4b-narrative-validation.md:64-66`), but the actual evidence is a negative/fallback-only result. This should not require fabricating or forcing an accepted Bonsai render. Closure can be honest if it says `ACC-003` was negatively answered / not satisfied because no accepted narrative existed; it must not claim the operator's screenshot complaint was solved by real Bonsai 4B.

- Note: The same Bonsai endpoint was configured as generator and judge, and the evidence correctly calls this an experimental self-judge shape that does not prove independent judge quality (`.loom/evidence/20260528-bonsai-4b-narrative-validation.md:63`). Because every case failed before accepted display, this run is mainly evidence of generator/schema failure under the current contract, not evidence that the judge is good at accepting/rejecting borderline narratives.

- Note: The current git working tree contains broader narrative-plan source changes, so this audit does not independently prove a clean-tree “no source side effects” claim for the validation ticket. I treated those source changes as predecessor/integration context and audited this validation evidence for source-mutation overclaim only.

## Required Follow-up

1. Redact the raw `/Users/...` repo path from `post-validation-focused-tests.txt` or regenerate the artifact with sanitized Vitest output.
2. Rerun/update the privacy scan so it catches absolute home/repo paths, then update the evidence/ticket privacy wording if needed.
3. Preserve the `ACC-003` posture as negative/not-satisfied for accepted Bonsai narrative UX. Do not close it as a success visual claim.

## Residual Risk

- The corpus is synthetic/redacted and small; it supports this validation result only, not broad Bonsai inferiority or release readiness.
- No accepted narrative reached display, so accepted-narrative UX quality and self-judge quality remain unproven.
- Latency evidence is one local run on one machine/configuration with a 5-second timeout; it should not be generalized beyond this run.
- The raw samples are useful diagnostics but are only three synthetic cases and should remain redacted/synthetic.

## Closure Recommendation

Do not close yet because `ACC-004` privacy evidence is contradicted by a raw absolute path in an artifact. After redaction and privacy-scan repair, close the ticket only as a negative validation: Bonsai 4B Q1_0 should not be used for accepted `/flight-learn` narrative wording under the current prompt/schema/timeout/local-self-judge contract; deterministic fallback remains the practical visible behavior; any prompt/schema tuning, grammar-constrained JSON, alternate local model, or independent judge work needs a separate follow-up ticket.
