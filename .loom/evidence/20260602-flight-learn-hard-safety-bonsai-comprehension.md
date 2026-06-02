# Flight Learn Hard-Safety Bonsai Comprehension Evidence

ID: evidence:20260602-flight-learn-hard-safety-bonsai-comprehension
Type: Evidence Dossier
Status: recorded
Created: 2026-06-02
Updated: 2026-06-02
Observed: 2026-06-02
Target: ticket:20260602-flight-learn-hard-safety-bonsai-comprehension

## Summary

This dossier records the operator-directed pivot away from the overbuilt semantic/support validator and back to the PrismML Bonsai path. The implemented product gate now accepts parseable, bounded, display-only local model copy unless a displayed field contains hard privacy/safety/action-advice content.

The real local smoke used the cached PrismML Bonsai 1.7B GGUF Q1_0 model through loopback `llama.cpp` only. No hosted provider, model download, runtime install, or non-loopback endpoint was used.

Result: the one-case Bonsai smoke passed the new hard-safety-only path. It produced model-enabled `displayState: validated` with no fallback and a clean hard-safety display scan.

## Artifacts

Artifact directory:

```text
.loom/evidence/artifacts/20260602-flight-learn-hard-safety-bonsai-comprehension/
```

Key artifacts:

- `00-artifact-index.json` - artifact map and non-claims.
- `01-bonsai-1.7b-smoke-summary.json` - single cached Bonsai smoke summary.
- `02-listener-cleanup.txt` - confirms the smoke listener was not left running.
- `03-diff-check.txt` - scoped `git diff --check` output.
- `04-validation-summary.json` - command pass/fail summary for typecheck, focused tests, full tests, and build.
- `05-privacy-scan.json` - privacy scan over this ticket/spec/artifacts.

## Implementation Observations

Source changes were limited to the optional local-model card-copy path and tests:

- `src/flight-learn-local-diagnosis-model.ts`
  - shortened the local prompt to core comprehension fields;
  - changed default local-model timeout to 5000 ms and max timeout to 30000 ms;
  - changed validation to extract bounded display fields and fail the card only for hard unsafe/private/action content;
  - accepts simple string fields and legacy fact-cited objects by extracting display text;
  - ignores extra non-display keys rather than treating them as product gate failures;
  - tolerates model text wrapping around a JSON object;
  - omits low-information headlines and non-renderable fields without erasing other safe model copy.
- `src/flight-learn-llama-cpp-adapter.ts`
  - simplified the generator JSON schema to `schemaVersion`, `headline`, `whatHappened`, `whyItMatters`, and `expectedBehavior` string/null fields;
  - raised default output budget to 256 tokens to avoid Bonsai truncating short core copy.
- Tests were updated to reflect the hard-safety-only product gate instead of the old support-proof gate.

## Real Local Bonsai Smoke

`01-bonsai-1.7b-smoke-summary.json` records:

```json
{
  "pass": true,
  "model": "PrismML Bonsai 1.7B GGUF Q1_0",
  "modelSha256": "3d7c6c90dd98717a203adb22d5eacd2581850e40aa5327e144b97766cae5f7e3",
  "modelSizeBytes": 248302272,
  "runtime": "llama.cpp llama-server loopback",
  "loopbackOnly": true,
  "hostedProviderUsed": false,
  "modelDownloads": false,
  "runtimeInstallsOrUpgrades": false,
  "timeoutMs": 5000,
  "maxOutputTokens": 256,
  "usedLocalModel": true,
  "displayState": "validated",
  "fallbackReason": null,
  "validationIssue": null,
  "hardSafetyDisplayScanPass": true
}
```

The smoke intentionally persisted no raw prompt, raw model output, or raw server log.

## Validation Commands

`04-validation-summary.json` records these observed passes:

- `npm run typecheck` - pass.
- `npm test -- src/flight-learn-local-diagnosis-model.test.ts src/flight-learn-llama-cpp-adapter.test.ts` - pass, 2 files / 25 tests.
- `npm test` - pass, 21 files / 132 tests.
- `npm run build` - pass.
- Scoped `git diff --check` - pass.

This ticket deliberately did not run a broad model replay matrix.

## Privacy And Side Effects

- `05-privacy-scan.json` passes with zero findings over this ticket/spec/artifacts.
- `02-listener-cleanup.txt` records no remaining listener on the smoke port.
- The smoke summary records `hostedProviderUsed: false`, `modelDownloads: false`, and `runtimeInstallsOrUpgrades: false`.
- No raw private sessions, raw local paths, raw prompts, raw model output, raw server logs, secrets, stack traces, or transcripts were persisted.
- Model copy remains display-only; routing/storage/artifacts/source/Loom/rules/skills/prompts/classifier behavior are unchanged.

## Non-Claims

- This is not a broad model-quality claim.
- This is not operator comprehension validation.
- This does not start dogfood corpus/outcome collection.
- This does not make hosted models acceptable.
- This does not auto-start, auto-download, or auto-install local model infrastructure.
- This does not prove every Bonsai output is useful; it proves the previous blocker was removed and the hard-safety path can render model-enabled copy from cached Bonsai.
