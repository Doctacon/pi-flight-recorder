# Llama.cpp Constrained JSON Probe Review

ID: audit:20260529-llama-cpp-constrained-json-probe-review
Type: Audit
Status: recorded
Created: 2026-05-29
Updated: 2026-05-29
Audited: 2026-05-29 UTC
Target: ticket:20260529-llama-cpp-constrained-json-probe

## Summary

Ralph reviewed the constrained JSON probe ticket, evidence dossier, and artifacts for acceptance support, privacy/source-boundary risk, and overclaiming. Verdict: clear within the bounded scope. The evidence supports installed-runtime/API schema enforcement for Bonsai 4B generator-format output; it does not support semantic acceptance, judge quality, UI/product readiness, or broad Bonsai claims.

## Target

Audit target: `ticket:20260529-llama-cpp-constrained-json-probe` in review state, with evidence at `evidence:20260529-llama-cpp-constrained-json-probe` and artifacts under:

```text
.loom/evidence/artifacts/20260529-llama-cpp-constrained-json-probe/
```

The closure claim under review was whether the installed local `llama-server`/Bonsai 4B route can enforce schema-valid JSON for generator output, while keeping narrative acceptance and productization out of scope.

## Audit Scope And Lenses

Scope:

- Challenge `ACC-001` through `ACC-005` in the ticket.
- Challenge overclaiming from generator-format results.
- Challenge privacy, local-only, and source-boundary claims.
- Challenge whether the recommendation is routed correctly.

Lenses:

- claim and evidence
- scope and acceptance
- security/privacy/trust boundary
- dependency/runtime specificity
- follow-through

Out of scope:

- Semantic grading of generated prose.
- Product implementation review.
- Real-user usefulness.
- Classifier or artifact-routing readiness.

## Context And Evidence Reviewed

Ralph review run: bounded reviewer subagent launched from `ticket:20260529-llama-cpp-constrained-json-probe` and `evidence:20260529-llama-cpp-constrained-json-probe`; reviewer was instructed not to edit files and to return findings/verdict only.

Records/artifacts inspected by the reviewer:

- `.loom/tickets/20260529-llama-cpp-constrained-json-probe.md` - ticket scope, acceptance, current state, non-goals.
- `.loom/evidence/20260529-llama-cpp-constrained-json-probe.md` - evidence interpretation and non-claims.
- `.loom/research/20260529-llama-cpp-constrained-json.md` - shaping context and upstream caveats.
- `.loom/evidence/artifacts/20260529-llama-cpp-constrained-json-probe/constrained-json-probe-summary.json` - aggregate route and narrative metrics.
- `.loom/evidence/artifacts/20260529-llama-cpp-constrained-json-probe/constrained-json-route-results.json` - tiny enforcement probes.
- `.loom/evidence/artifacts/20260529-llama-cpp-constrained-json-probe/constrained-json-narrative-results.json` - generator-only corpus results.
- `.loom/evidence/artifacts/20260529-llama-cpp-constrained-json-probe/privacy-scan.json` - artifact privacy scan.
- `.loom/evidence/artifacts/20260529-llama-cpp-constrained-json-probe/server-final-status.txt` - server lifecycle check.
- `.loom/evidence/artifacts/20260529-llama-cpp-constrained-json-probe/post-run-listener-check.txt` - post-run port listener check.
- `.loom/evidence/artifacts/20260529-llama-cpp-constrained-json-probe/post-run-diff-check.txt` - whitespace/diff check.
- `.loom/evidence/artifacts/20260529-llama-cpp-constrained-json-probe/workspace-status-after.txt` - workspace dirty-state caveat.
- `.loom/evidence/artifacts/20260529-llama-cpp-constrained-json-probe/run-constrained-json-probe.mjs` - harness logic spot-check.
- Runtime provenance/server command/health/sanitized samples - provenance and privacy context.
- `src/flight-learn-llama-cpp-adapter.ts` - spot-check that product adapter still uses `response_format: { type: "json_object" }` and was not productized.
- Relevant `spec:flight-learn-inbox-ux` requirements - optional local narrative boundary.

## Findings

None - no material findings within audited scope.

The reviewer specifically found:

- `ACC-001` supported: local runtime/version, Bonsai checksum, loopback URL, server final status, and no hosted/provider route are recorded.
- `ACC-002` supported: tiny contradictory probes distinguish enforced routes from accepted-but-not-enforced routes.
- `ACC-003` supported for generator-format only: 15/15 parse-valid, 15/15 schema-valid, 15/15 harness-verifier pass, and 0 timeouts; no judge/semantic acceptance was claimed.
- `ACC-004` supported within scope: privacy scan passed, server stopped/no listener artifact exists, and source adapter was not changed to productize JSON schema.
- `ACC-005` supported: recommendation is routed to a successor adapter ticket plus separate judge/latency work before product claims.

## Verdict

Clear. The evidence supports the ticket's bounded claim that this installed local runtime/API path can enforce schema-valid JSON for Bonsai 4B generator output. The records preserve the necessary non-claims about semantic acceptance, judge behavior, product readiness, release readiness, and broad Bonsai suitability.

This audit is not ticket acceptance or closure by itself; the ticket owns closure.

## Required Follow-up

No closure-blocking follow-up from this audit.

If the ticket closes, closure wording must stay narrow: installed-runtime/API schema enforcement for generator-format output only. Any successor adapter ticket must remain opt-in/local, preserve fail-closed verifier/judge gates, and separately test semantic safety/judge latency before product claims.

## Residual Risk

- Evidence is specific to `llama-server` version `9360`, the Bonsai 4B Q1_0 GGUF, and the observed chat-template/runtime setup.
- The narrative corpus is synthetic/redacted and only 15 cases.
- Generated narrative prose may still be semantically weak, unsupported, or unsafe; this pass did not judge acceptability.
- Workspace status contains pre-existing modified source files, so no closure prose should imply a clean repository.

## Related Records

- `ticket:20260529-llama-cpp-constrained-json-probe` - ticket under review.
- `evidence:20260529-llama-cpp-constrained-json-probe` - evidence dossier reviewed.
- `research:20260529-llama-cpp-constrained-json` - shaping research behind the probe.
- `evidence:20260529-bonsai-4b-schema-prompt-tuning` - prior prompt/schema tuning baseline.
