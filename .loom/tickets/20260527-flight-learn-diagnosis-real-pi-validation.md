# Flight Learn Diagnosis Real Pi Validation

ID: ticket:20260527-flight-learn-diagnosis-real-pi-validation
Type: Ticket
Status: open
Created: 2026-05-27
Updated: 2026-05-27
Risk: medium - this validates user-facing Pi TUI behavior and must avoid overclaiming beyond the observed terminal/install route.
Priority: medium - required before strong UX claims, after render/test integration passes.
Depends On: ticket:20260527-flight-learn-diagnosis-card-integration

## Summary

Run a real installed Pi validation for the plain-English diagnosis focused-card UI. Use disposable Pi home/session/data dirs, project-local package install, offline/no-provider settings, representative fixture data shaped like the operator screenshot, pane captures, raw TUI logs, and local DB inspection.

Single closure claim: real interactive Pi shows the `/flight-learn` focused card with plain-English primary diagnosis text, secondary raw clues/evidence, readable wrapping, unchanged two-command palette, and candidate-only route/storage safety.

## Related Records

- `plan:20260527-flight-learn-plain-english-diagnosis-cards` - parent plan and strategy.
- `ticket:20260527-flight-learn-diagnosis-card-integration` - hard prerequisite that should produce the integrated UI.
- `spec:flight-learn-inbox-ux` - owns the UX requirements being validated.
- `evidence:20260527-flight-learn-plain-english-feedback` - provides the failure screenshot this validation should improve upon.
- `evidence:20260527-flight-learn-focused-card-real-pi-validation` - prior real Pi validation pattern and guardrails to reuse.
- `spec:visible-command-surface` - command palette must still show only `/flight-status` and `/flight-learn`.
- `spec:delta-artifact-learning-loop` - route selection must still create accepted but unapplied candidates only.

## Scope

In scope:

- Build the current package.
- Install it project-locally into a disposable Pi workspace with `pi install <repo> -l`.
- Launch real Pi in tmux with disposable `HOME`, `PI_CODING_AGENT_DIR`, `PI_CODING_AGENT_SESSION_DIR`, local data dir, `PI_TUI_WRITE_LOG`, offline/no-provider settings, no skills/templates/context/session/tools unless a prerequisite changes the known guardrails.
- Seed local Flight Recorder data with at least one pending delta matching the operator screenshot shape: raw command-like summary, reflection-cluster reality text, raw command/evidence refs, and enough route choices to test vertical follow-up rows.
- Capture startup, `/flight` command palette, default `/flight-learn` focused card, evidence expansion, route selection/editor handoff if feasible, post-route status/DB state, build/package provenance, and TUI log artifacts.
- Record evidence and audit before closure.

Out of scope:

- Hosted/real model-provider behavior.
- Global/user-scope package install.
- Long-run corpus precision/noise tuning.
- Artifact outcome follow-up custom UI.
- All terminal/theme/key-protocol variants.
- Changing implementation while validating, except to stop and route a failed validation back to the owning implementation ticket.

Constraints:

- Do not use real user Pi settings/session logs/provider credentials.
- Do not persist secrets in evidence.
- Preserve local-first/offline validation unless the operator explicitly authorizes otherwise.
- If the UI still reads as code-heavy/internal, record that failure honestly and do not close the ticket as success.

First likely Ralph run:

- Read this ticket, dependency ticket/evidence/audit, the parent plan, prior real Pi validation evidence, and guardrail records.
- Run disposable installed-package real Pi validation.
- Record evidence dossier and run/record audit.
- Close only if acceptance is supported.

## Acceptance

- ACC-001: Real Pi startup evidence identifies the package build/install path and shows `pi-extension.js` loaded from the disposable project-local install.
  - Evidence: build output, `pi install -l` output, startup pane, package/dist provenance, run env.
  - Audit: closure audit should challenge stale package/path risk.

- ACC-002: The `/flight` command palette in the real TUI still shows only `flight-status` and `flight-learn` as the Flight Recorder visible commands.
  - Evidence: pane capture after typing `/flight`.
  - Audit: closure audit should challenge accidental visible-command expansion.

- ACC-003: `/flight-learn` default focused-card pane in real Pi shows a plain-English primary diagnosis for the screenshot-shaped fixture, not a raw command/path/cluster ID as the primary headline.
  - Evidence: pane capture and/or screenshot plus TUI log excerpt.
  - Audit: closure audit should compare against `evidence:20260527-flight-learn-plain-english-feedback`.

- ACC-004: Raw command/path/cluster/provenance details remain available but secondary, and evidence expansion works.
  - Evidence: default and expanded evidence pane captures.
  - Audit: closure audit should challenge both hidden-provenance and primary-card clutter risk.

- ACC-005: Primary explanatory text wraps readably in the observed terminal and does not appear as a single forced/truncated line wall.
  - Evidence: pane capture/screenshot and raw TUI output.
  - Audit: closure audit should challenge whether the visual proof is strong enough or only render-level.

- ACC-006: Route/editor/storage safety still holds in real Pi when feasible: selecting a route opens `Why this follow-up?`, submitting stores an accepted artifact candidate with `applied=false`, and no rule/source/Loom artifact is created or applied.
  - Evidence: editor/submit/status captures and DB inspection. If route submission is not feasible in the validation session, record the limitation and do not claim this criterion satisfied.
  - Audit: closure audit should challenge side effects and DB evidence.

## Current State

Open. Do not start until `ticket:20260527-flight-learn-diagnosis-card-integration` is closed with evidence. The validation should reuse the disposable real Pi guardrails from prior real TUI evidence.

## Journal

- 2026-05-27: Created ticket as the third child of `plan:20260527-flight-learn-plain-english-diagnosis-cards`. It intentionally separates real Pi proof from render/test integration so UX claims stay honest.
