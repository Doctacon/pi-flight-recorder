# Docs Package Release Contract

ID: ticket:20260523-docs-package-release-contract
Type: Ticket
Status: closed
Created: 2026-05-23
Updated: 2026-05-23
Risk: medium - release-facing claims can overpromise privacy, TUI behavior, model support, or extension readiness if not aligned with evidence
Depends On: ticket:20260523-release-evidence-gap-smoke

## Summary

Align release-facing documentation and package metadata with the final evidenced behavior after stabilization. The README and docs already present an extension-first product story; this ticket makes sure that story matches what the graph and validation actually prove after refactors and evidence-gap smoke.

Single closure claim: docs and package contract accurately describe the supported release-candidate UX, commands, runtime requirements, privacy boundaries, validation limits, and debug CLI role.

## Related Records

- `plan:20260523-codebase-stabilization-release-readiness` - parent plan and final release-contract sequencing.
- `ticket:20260523-release-evidence-gap-smoke` - prerequisite evidence/defer record this ticket must reflect.
- `constitution:main` - local-first/open-source/evidence-backed product principles.
- `spec:seamless-failure-memory-ux` - extension-first behavior contract.
- `README.md`, `docs/first-run.md`, `docs/live-monitoring.md`, `package.json` - primary release-facing surfaces.

## Scope

May change:

- `README.md`, `docs/first-run.md`, `docs/live-monitoring.md`, and package metadata fields that describe commands, files, exports, scripts, requirements, and package contents.
- Small docs-only examples where command names/options changed during earlier tickets.
- Loom records for evidence and current state if docs alignment uncovers a mismatch.

Must not change:

- Runtime behavior, source implementation, database schema, tests, or product features.
- Package dependencies or Node engine requirements unless a prior ticket's evidence explicitly requires it.
- Claims about real TUI, model-assisted reflection, high-confidence suggestions, or tuning beyond what evidence supports.
- Local-first/privacy language in ways that imply hosted/managed behavior.

Docs contract to preserve:

- extension-first normal usage;
- CLI as debug/recovery harness;
- Node 24 and `node:sqlite` requirement plus experimental warning note if still true;
- no network/model calls by default;
- model-assisted reflection as explicit/optional and only validated if `ticket:20260523-release-evidence-gap-smoke` proves it;
- raw sessions remain local source of truth; derived snippets are redacted/bounded;
- no autonomous fixes and no mutation of Pi tool semantics.

## Acceptance

- ACC-001: README and docs describe the same normal usage path, command set, default modes, and limitations as the evidenced final code shape.
  - Evidence: Diff plus references to the release evidence record and passing docs-relevant tests/build.
  - Audit: Review should compare docs claims against evidence, not implementation intent.

- ACC-002: Package metadata accurately exposes only supported package entrypoints/files and does not imply unsupported services or integrations.
  - Evidence: `npm pack --dry-run` output and package metadata inspection.
  - Audit: Review should inspect whether generated `dist/`, docs, and exports line up.

- ACC-003: Privacy/model/evidence limitations are explicit and do not overclaim real TUI, model-provider, or long-run corpus proof.
  - Evidence: Docs text cites or mirrors the defer/proof state from `ticket:20260523-release-evidence-gap-smoke`.
  - Audit: Review should challenge phrases like “seamless”, “proven”, or “automatic” where evidence is partial.

- ACC-004: Full release validation passes: `npm run typecheck`, `npm test`, `npm run build`, local smoke harness, and `npm pack --dry-run`.
  - Evidence: Loom evidence record with command output.
  - Audit: Separate audit is useful before the parent plan moves to review/completed.

## Current State

Closed. README, `docs/first-run.md`, and `docs/live-monitoring.md` now align with the final evidence/defer posture: extension-first normal usage remains documented, CLI remains debug/recovery, local-first privacy and no-autonomous-fix boundaries remain explicit, and release validation limits are named for real TUI rule promotion, high-confidence real TUI suggestions, real-provider model reflection, and long-run corpus tuning. `package.json` exposes the existing supported entrypoints/files plus the source-checkout local smoke script.

Evidence is recorded in `evidence:20260523-docs-package-release-contract-validation`: typecheck, local smoke, full tests, build, and package dry-run passed. Audit `audit:20260523-docs-package-release-contract-review` returned `clear` with no material findings. Residual release limits remain documented; this ticket does not resolve real TUI/model/corpus validation gaps.

## Journal

- 2026-05-23: Created ticket under `plan:20260523-codebase-stabilization-release-readiness` as the final docs/package alignment slice after evidence rather than before it.
- 2026-05-23: Set Status to `active` after release evidence-gap ticket closed; starting docs/package alignment pass.
- 2026-05-23: Added explicit release validation limits to README, first-run docs, and live-monitoring docs; preserved extension-first usage and CLI debug positioning.
- 2026-05-23: Ran `npm run typecheck`, `npm run test:smoke:local`, `npm test`, `npm run build`, and `npm pack --dry-run`; all passed. Recorded `evidence:20260523-docs-package-release-contract-validation`.
- 2026-05-23: Ran Ralph audit and recorded `audit:20260523-docs-package-release-contract-review`; verdict `clear`.
- 2026-05-23: Closed ticket with real TUI/model/corpus limits explicit.
