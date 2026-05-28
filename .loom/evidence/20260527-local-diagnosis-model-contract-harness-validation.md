# Local Diagnosis Model Contract Harness Validation

ID: evidence:20260527-local-diagnosis-model-contract-harness-validation
Type: Evidence Dossier
Status: recorded
Created: 2026-05-27
Updated: 2026-05-27
Observed: 2026-05-27
Related Ticket: ticket:20260527-local-diagnosis-model-contract-harness

## Summary

Validation evidence for the model-agnostic local diagnosis polish contract/harness implementation. The original run covered fake-provider contract tests, typecheck, build, full test suite, and source inspection for the new module's import boundary.

Follow-up validation for `audit:20260527-local-diagnosis-model-contract-harness-review` covers FIND-001 and FIND-002 fixes: non-home absolute path redaction/omission, malformed evidence timestamp omission, generic unsupported factual-claim rejection, and unsupported display-action phrasing rejection.

Second follow-up validation for `audit:20260527-local-diagnosis-model-contract-harness-followup-review` covers the remaining blockers: file-URI local path redaction/rejection, spaced local path redaction/rejection without leaked tails, colon-prefixed path-like variant redaction/rejection, partial-redaction path-tail redaction/rejection, and modal action phrasing rejection before unsupported-fact validation.

Third follow-up validation for `audit:20260527-local-diagnosis-model-contract-harness-second-followup-review` covers the remaining blocker: `can` modal action phrasing is rejected before unsupported-fact validation, with regression coverage where the supporting fact packet includes `test`, `file`, and `update` tokens.

Fourth follow-up validation for `audit:20260527-local-diagnosis-model-contract-harness-third-followup-review` covers the remaining blocker: `need(s) to`, `has to`, and `have to` action phrasing is rejected before unsupported-fact validation in the same supported-token context.

Fifth follow-up validation for `audit:20260527-local-diagnosis-model-contract-harness-fourth-followup-review` covers the remaining blocker: objectless obligation/action phrases such as `We have to update.`, `The assistant has to update.`, and `The assistant needs to update.` are rejected before unsupported-fact validation.

Sixth follow-up validation for `audit:20260527-local-diagnosis-model-contract-harness-fifth-followup-review` covers the remaining blocker: actor+modal/obligation recommendation phrases are rejected even when the following verb is outside the earlier hard-coded action list, including `rerun`, `review`, and `reinstall` examples.

## Commands And Outcomes

Artifacts are under `.loom/evidence/artifacts/20260527-local-diagnosis-model-contract-harness-validation/`.

- `npx vitest run src/flight-learn-local-diagnosis-model.test.ts src/flight-learn-diagnosis.test.ts`
  - Outcome: pass; 2 test files, 14 tests.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/focused-tests.txt`
- `npm run typecheck`
  - Outcome: pass; `tsc --noEmit` completed with exit 0.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/typecheck.txt`
- `npm run build`
  - Outcome: pass; `npm run clean && tsc -p tsconfig.build.json` completed with exit 0.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/build.txt`
- `npm test`
  - Outcome: pass; 20 test files, 106 tests. Node emitted expected experimental SQLite warnings during the suite.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/full-test.txt`
- Source import inspection:
  - Outcome: `src/flight-learn-local-diagnosis-model.ts` imports only deterministic diagnosis, redaction, and type definitions; no storage/artifact/rule/source-doc mutation imports, filesystem/process runtime imports, fetch calls, or URL literals matched.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/source-inspection.txt`

Follow-up after audit findings:

- `npx vitest run src/flight-learn-local-diagnosis-model.test.ts src/flight-learn-diagnosis.test.ts`
  - Outcome: pass; 2 test files, 15 tests.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/follow-up-focused-tests.txt`
- `npm run typecheck`
  - Outcome: pass; `tsc --noEmit` completed with exit 0.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/follow-up-typecheck.txt`
- `npm run build`
  - Outcome: pass; `npm run clean && tsc -p tsconfig.build.json` completed with exit 0.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/follow-up-build.txt`
- `npm test`
  - Outcome: pass; 20 test files, 107 tests. Node emitted expected experimental SQLite warnings during the suite.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/follow-up-full-test.txt`
- Follow-up source inspection:
  - Outcome: targeted status/import/network/storage inspection found the touched source remains limited to the local diagnosis model module/tests and Loom ticket/evidence record, imports only deterministic diagnosis/redaction/types, and has no filesystem/process/network/fetch/url or mutation/storage API matches.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/follow-up-source-inspection.txt`

Second follow-up after follow-up audit findings:

- `npx vitest run src/flight-learn-local-diagnosis-model.test.ts src/flight-learn-diagnosis.test.ts`
  - Outcome: pass; 2 test files, 16 tests.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/second-follow-up-focused-tests.txt`
- `npm run typecheck`
  - Outcome: pass; `tsc --noEmit` completed with exit 0.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/second-follow-up-typecheck.txt`
- `npm run build`
  - Outcome: pass; `npm run clean && tsc -p tsconfig.build.json` completed with exit 0.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/second-follow-up-build.txt`
- `npm test`
  - Outcome: pass; 20 test files, 108 tests. Node emitted expected experimental SQLite warnings during the suite.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/second-follow-up-full-test.txt`
- Second follow-up source inspection:
  - Outcome: targeted status/import/network/storage inspection found the touched source remains limited to the local diagnosis model module/tests and Loom ticket/evidence artifacts, imports only deterministic diagnosis/redaction/types, and has no filesystem/process/network/fetch/http URL or mutation/storage API matches.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/second-follow-up-source-inspection.txt`

Third follow-up after second follow-up audit finding:

- `npx vitest run src/flight-learn-local-diagnosis-model.test.ts src/flight-learn-diagnosis.test.ts`
  - Outcome: pass; 2 test files, 17 tests.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/third-follow-up-focused-tests.txt`
- `npm run typecheck`
  - Outcome: pass; `tsc --noEmit` completed with exit 0.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/third-follow-up-typecheck.txt`
- `npm run build`
  - Outcome: pass; `npm run clean && tsc -p tsconfig.build.json` completed with exit 0.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/third-follow-up-build.txt`
- `npm test`
  - Outcome: pass; 20 test files, 109 tests. Node emitted expected experimental SQLite warnings during the suite.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/third-follow-up-full-test.txt`
- Third follow-up source inspection:
  - Outcome: targeted source/test/status inspection found the contract harness change is limited to adding `can` to the existing modal action rejection pattern plus regression tests for the four audited `can` phrases using supported `test`/`file`/`update` facts; implementation imports remain deterministic diagnosis/redaction/types only, with no filesystem/process/network/fetch/http URL or mutation API imports/calls added.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/third-follow-up-source-inspection.txt`

Fourth follow-up after third follow-up audit finding:

- `npx vitest run src/flight-learn-local-diagnosis-model.test.ts src/flight-learn-diagnosis.test.ts`
  - Outcome: pass; 2 test files, 17 tests.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/fourth-follow-up-focused-tests.txt`
- `npm run typecheck`
  - Outcome: pass; `tsc --noEmit` completed with exit 0.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/fourth-follow-up-typecheck.txt`
- `npm run build`
  - Outcome: pass; `npm run clean && tsc -p tsconfig.build.json` completed with exit 0.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/fourth-follow-up-build.txt`
- `npm test`
  - Outcome: pass; 20 test files, 109 tests. Node emitted expected experimental SQLite warnings during the suite.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/fourth-follow-up-full-test.txt`
- Fourth follow-up source inspection:
  - Outcome: targeted source/test/status inspection found the contract harness change is limited to broadening the modal action rejection pattern to `need(s) to`, `has to`, and `have to` forms plus regression tests in the existing supported-token test case; implementation imports remain deterministic diagnosis/redaction/types only, with no filesystem/process/network/fetch/http URL or mutation API imports/calls added.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/fourth-follow-up-source-inspection.txt`
- `git diff --check` on the touched contract/evidence files:
  - Outcome: pass; no whitespace errors.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/fourth-follow-up-diff-check.txt`

Fifth follow-up after fourth follow-up audit finding:

- `npx vitest run src/flight-learn-local-diagnosis-model.test.ts src/flight-learn-diagnosis.test.ts`
  - Outcome: pass; 2 test files, 17 tests.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/fifth-follow-up-focused-tests.txt`
- `npm run typecheck`
  - Outcome: pass; `tsc --noEmit` completed with exit 0.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/fifth-follow-up-typecheck.txt`
- `npm run build`
  - Outcome: pass; `npm run clean && tsc -p tsconfig.build.json` completed with exit 0.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/fifth-follow-up-build.txt`
- `npm test`
  - Outcome: pass; 20 test files, 109 tests. Node emitted expected experimental SQLite warnings during the suite.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/fifth-follow-up-full-test.txt`
- Fifth follow-up source inspection:
  - Outcome: targeted source/test/status inspection found the contract harness change is limited to making the modal action rejection pattern object-optional plus extending the existing supported-token test case; implementation imports remain deterministic diagnosis/redaction/types only, with no filesystem/process/network/fetch/http URL or mutation API imports/calls added.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/fifth-follow-up-source-inspection.txt`
- `git diff --check` on the touched contract/evidence files:
  - Outcome: pass; no whitespace errors.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/fifth-follow-up-diff-check.txt`

Sixth follow-up after fifth follow-up audit finding:

- `npx vitest run src/flight-learn-local-diagnosis-model.test.ts src/flight-learn-diagnosis.test.ts`
  - Outcome: pass; 2 test files, 17 tests.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/sixth-follow-up-focused-tests.txt`
- `npm run typecheck`
  - Outcome: pass; `tsc --noEmit` completed with exit 0.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/sixth-follow-up-typecheck.txt`
- `npm run build`
  - Outcome: pass; `npm run clean && tsc -p tsconfig.build.json` completed with exit 0.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/sixth-follow-up-build.txt`
- `npm test`
  - Outcome: pass; 20 test files, 109 tests. Node emitted expected experimental SQLite warnings during the suite.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/sixth-follow-up-full-test.txt`
- Sixth follow-up source inspection:
  - Outcome: targeted source/test/status inspection found the contract harness change is limited to changing modal actor/obligation action rejection from a hard-coded action-verb list to a broader actor+modal+verb fail-closed pattern plus extending the existing supported-token test case; implementation imports remain deterministic diagnosis/redaction/types only, with no filesystem/process/network/fetch/http URL or mutation API imports/calls added.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/sixth-follow-up-source-inspection.txt`
- `git diff --check` on the touched contract/evidence files:
  - Outcome: pass; no whitespace errors.
  - Artifact: `artifacts/20260527-local-diagnosis-model-contract-harness-validation/sixth-follow-up-diff-check.txt`

## Coverage Notes

- Focused tests prove deterministic default/fallback, valid fake-provider display-only replacement, bounded/redacted fact packet and prompt construction, malformed/empty/schema/overlong/secret/raw-path/raw-command/route-like/unsupported output rejection, provider error fallback, timeout fallback, non-mutation of the source delta object, and validation against the original fact packet even if a fake provider mutates its request copy.
- Follow-up regression tests prove non-home absolute paths such as `/workspace/...`, `/opt/...`, `/mnt/...`, and `/var/lib/...` do not survive in the fact packet or prompt; existing `/Users/<user>` redaction still survives; malformed/raw timestamp metadata is omitted while valid ISO UTC timestamps remain bounded; `/workspace/...` output is rejected; `The wrong file changed.` is rejected as unsupported facts; and `Add a test.` is rejected as unsafe display-action phrasing.
- Second follow-up regression tests prove file-URI local path variants, spaced local path variants, colon-prefixed path-like variants, and partial-redaction path tails do not survive fact-packet/prompt construction and are rejected from model output as unsafe. They also prove modal recommendation/action phrases using `could`, `might`, `may`, `would`, and `should` with route/mutation-adjacent verbs are rejected as unsafe output before unsupported-fact token validation.
- Third follow-up regression tests prove the audited `can` modal action phrases (`You can add a test.`, `We can add a test.`, `The assistant can add a test.`, and `You can update a file.`) fall back with `unsafe-output` even when the supporting fact packet includes `test`, `file`, and `update`, so unsupported-fact token validation cannot mask the action-phrasing check.
- Fourth follow-up regression tests extend the same supported-token case to `The assistant needs to update a file.`, `The assistant has to update a file.`, and `We have to add a test.`, proving those obligation/action forms also fall back with `unsafe-output` before unsupported-fact token validation.
- Fifth follow-up regression tests extend that same supported-token case to objectless obligation/action forms (`We have to update.`, `The assistant has to update.`, and `The assistant needs to update.`), proving those phrases also fall back with `unsafe-output` before unsupported-fact token validation.
- Sixth follow-up regression tests extend that same supported-token case to actor+modal/obligation recommendation forms using verbs outside the earlier hard-coded action list (`We have to rerun validation.`, `We should rerun validation.`, `The assistant should review the result.`, and `You should reinstall the package.`), proving those phrases also fall back with `unsafe-output` before unsupported-fact token validation.
- No real model runtime, network call, model download, UI integration, store mutation, artifact routing, rule mutation, Loom mutation, skill mutation, or prompt mutation was implemented or exercised.

## Limits

This evidence does not prove Bonsai, `llama.cpp`, Ollama, MLX, or any real local runtime behavior. It only proves the model-agnostic contract/harness with fake providers and deterministic fallback.
