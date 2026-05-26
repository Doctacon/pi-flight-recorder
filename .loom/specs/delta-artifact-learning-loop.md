# Delta Artifact Learning Loop

ID: spec:delta-artifact-learning-loop
Type: Spec
Status: active
Created: 2026-05-23
Updated: 2026-05-25

## Summary

This spec defines the next product slice for `pi-flight-recorder`: treating repeated LLM/developer friction as expectation deltas, reviewing those deltas, routing them to the artifact most likely to prevent recurrence, and tracking whether the chosen artifact actually moved the frontier.

Downstream work should cite this spec when adding issue/delta capture, artifact-routing, artifact candidate creation, outcome tracking, or classifier-readiness behavior.

## Product Slice

This spec owns the local, human-reviewed workflow from observed friction to an artifact candidate and later outcome assessment.

Covered:

- broadening “issue” from hard failures to expectation-vs-reality deltas;
- recording delta evidence with expectation, reality, impact, and provenance;
- low-friction detector suggestions plus explicit user capture;
- manual-first artifact routing and rationale capture;
- artifact candidate types that include rules, Loom records, tests/checks, prompt/context docs, skills, and code-legibility/refactor tickets;
- outcome/recurrence tracking so old categories can decay while new frontier problems emerge;
- corpus-building needed before any classifier is trusted.

Out of scope:

- autonomous code edits;
- automatic modification of `CLAUDE.md`, `AGENTS.md`, prompt templates, skills, or Loom records;
- automatic activation of rules without explicit human approval;
- hosted memory, hosted classifier services, or background model calls by default;
- team sharing, analytics dashboards, or organization-wide taxonomy management;
- proving that a classifier is good before enough labeled outcomes exist.

## Spec Set Coverage

Existing specs cover failure memory, live monitoring, and seamless reflection over repeated failures. This spec adds the behavior contract for the broader learning loop implied by code-legibility audits and frontier movement: not every recurring problem is solved by a Flight Rule. Some deltas should produce code changes, tests, docs, skills, prompt/context changes, Loom records, or simply continued observation.

Adjacent specs should continue to own live failure monitoring and approved Flight Rule injection. This spec owns the decision layer between “a delta happened” and “what artifact should bridge it?”

## Problem

The current system can capture failures, cluster repeated patterns, and promote a reflection proposal into a Flight Rule. That is powerful but too narrow for the product direction surfaced by use: LLM friction can reveal that the codebase is confusing, the task needed a plan, a test is missing, a project convention is unstated, or the user is asking the model to do work that should be decomposed differently.

A classifier that immediately chooses artifacts would be premature without ground truth. The load-bearing asset is the corpus of deltas, human routing decisions, generated/accepted artifacts, and later recurrence outcomes.

## Desired Behavior

`pi-flight-recorder` should help the user notice expectation deltas, review them without interrupting normal work, and decide which artifact would make the next similar session better. The system may suggest candidate artifact types and drafts, but early behavior is manual-first: the user owns the judgment, and the tool records enough rationale and outcome data to learn later.

A “problem” is an expectation delta: the difference between what the user wanted from the LLM/tool/session and what actually happened. A “solution” is not necessarily a prompt rule; it is the artifact or change that makes the same delta stop recurring, recur less severely, or become easier to detect and correct.

## Not Doing

- Do not frame all deltas as LLM mistakes; the codebase, task decomposition, docs, tests, prompts, and user workflow are all possible intervention points.
- Do not optimize for immediate automatic classification. Build the labeled corpus first.
- Do not create or apply durable artifacts silently. Store candidates, ask for approval, and preserve reversibility.
- Do not send raw sessions or prompts to hosted models by default.
- Do not require the user to annotate every turn in the moment; capture should be low-friction and reviewable later.

## Requirements

- REQ-001: The system MUST model an issue as an expectation delta, not only as a failed command/tool result.
- REQ-002: A delta record MUST preserve local evidence, source refs when available, expectation/reality text when known, impact/severity, status, timestamps, and redacted snippets/metadata.
- REQ-003: Delta capture MUST support explicit user capture and low-risk detector suggestions. Detector suggestions MUST remain reviewable candidates until the user accepts, edits, dismisses, or routes them.
- REQ-004: Detector signals SHOULD include repeated tool failures, failed validation after assistant changes, user correction language, reversal/retry loops, stale edit attempts, repeated clarification turns, and reflection clusters; signals MUST be explainable enough for review.
- REQ-005: Artifact routing MUST be manual-first. The user must be able to select or correct the artifact type and add rationale before durable creation or activation.
- REQ-006: Artifact candidate types MUST include at least: Flight Rule, Loom ticket, Loom spec/research/knowledge record, test/check, prompt/context-doc change, skill/prompt-template candidate, code-legibility/refactor ticket, and observe/no-artifact.
- REQ-007: Artifact candidates MUST carry evidence refs, target artifact type, rationale, proposed draft/next step, confidence/limits, status, and outcome fields without requiring immediate application.
- REQ-008: Durable artifact creation or activation MUST remain human-gated and reversible. No source code, docs, prompt files, skills, Loom records, or active rules may be modified/applied without explicit approval in the relevant workflow.
- REQ-009: The system MUST track whether a chosen artifact was accepted/applied and whether similar deltas recur afterward, so the user can distinguish solved old categories from emerging frontier categories.
- REQ-010: Automated artifact classification MUST NOT become the default until enough manually routed deltas with outcomes exist to evaluate it. A model may assist drafting or suggest a route only with bounded/redacted local evidence and explicit disclosure.
- REQ-011: All delta, routing, artifact-candidate, and outcome state MUST stay local by default and respect existing redaction/privacy constraints.
- REQ-012: The normal corpus-building UX MUST fit under a small command model. A user should be able to repeatedly run one primary learning command to prepare local candidates, review/route the next pending delta, and record artifact follow-up/outcome decisions without memorizing artifact candidate IDs or the advanced fallback command set.

## Scenarios

### SCN-001: Code confusion routes to a code-legibility ticket

Exercises: REQ-001, REQ-002, REQ-005, REQ-006, REQ-007

GIVEN several sessions show the assistant misunderstanding the same module boundary
AND the user repeatedly corrects the same assumption
WHEN the user reviews the delta cluster
THEN the system presents the expectation/reality gap with evidence
AND the user can route it to a code-legibility/refactor ticket candidate instead of a Flight Rule
AND the candidate records why a code artifact is the proposed bridge.

### SCN-002: Repeated exact edit mismatch routes to a Flight Rule candidate

Exercises: REQ-003, REQ-004, REQ-006, REQ-008

GIVEN repeated edit `oldText` mismatch failures appear in local sessions
WHEN the user reviews the delta
THEN the system may suggest a Flight Rule candidate
BUT the rule is not active until the user edits/approves scope through the existing rule workflow.

### SCN-003: User correction language becomes a reviewable delta

Exercises: REQ-001, REQ-003, REQ-004, REQ-005

GIVEN a user says “no, actually the API works differently” after an assistant response
WHEN detector suggestions are generated
THEN the system may create a reviewable delta candidate explaining that the signal was user correction language
AND the user can accept, edit, route, or dismiss it.

### SCN-004: Accepted artifact still does not solve recurrence

Exercises: REQ-007, REQ-009

GIVEN a delta was routed to a prompt/context-doc candidate and marked applied
WHEN similar deltas continue to occur after application
THEN the system keeps the delta category visible as unresolved or recurring
AND supports rerouting to a different artifact type.

### SCN-005: Classifier remains advisory until corpus exists

Exercises: REQ-010, REQ-011

GIVEN fewer than the configured minimum manually routed deltas with outcomes exist
WHEN a user asks the system to auto-route new deltas
THEN the system refuses or labels the route as experimental/advisory
AND explains that classifier trust requires a labeled outcome corpus.

### SCN-006: One-command learning inbox

Exercises: REQ-005, REQ-007, REQ-009, REQ-012

GIVEN local failure/reflection signals, pending delta candidates, or artifact candidates needing outcome follow-up
WHEN the user runs the primary learning command
THEN the system moves the next human-reviewed item forward
AND the user can route a delta or record applied/outcome/reject/skip feedback without typing candidate IDs
AND durable artifact creation, classifier labels, and recurrence/outcome claims remain human-gated.

## Evidence Plan

- REQ-001 through REQ-002 / SCN-001: storage/type tests over fixture deltas assert expectation/reality/evidence/provenance/redaction fields.
- REQ-003 through REQ-004 / SCN-003: detector fixture tests over synthetic Pi session events assert suggested deltas include explainable signal reasons and stay pending.
- REQ-005 through REQ-008 / SCN-001 and SCN-002: fake-Pi UI tests assert manual routing, candidate drafting, cancellation, approval handoff, and no durable artifact mutation without approval.
- REQ-009 / SCN-004: recurrence/outcome tests assert post-application similar deltas are linked back to prior artifact candidates and visible as recurring.
- REQ-010 / SCN-005: classifier-readiness tests or research evidence assert auto-routing remains disabled/advisory below the corpus threshold.
- REQ-011: privacy tests assert raw session text, secrets, full prompts, and unredacted paths are not persisted in derived delta/artifact records.
- REQ-012 / SCN-006: Pi extension tests assert the primary learning command registers, delegates to guided delta routing, records artifact outcome follow-up without candidate IDs, and gives a concise no-items message.

## Open Questions

- What minimum labeled corpus should unlock classifier evaluation? Recommended starting threshold: 30-50 manually routed deltas with at least some outcome labels. Blocks default auto-classification, not manual-first implementation.
- Which artifact candidates should be draftable in the first slice? Recommended first set: Flight Rule handoff, Loom ticket candidate, and observe/no-artifact. Blocks broad artifact drafting, not the base delta/routing model.
- Should “expectation” be required text or optional until review? Recommended: optional at detection time, required or explicitly “unknown” at accepted/routed time. Does not block implementation.

## Quality Bar

A good delta review feels like:

```text
Delta: Assistant repeatedly treats src/storage.ts as both schema and mapper owner.
Expectation: storage owns repository behavior; mapping/sanitization should be separate.
Reality: assistant edited storage directly and missed mapper seam twice.
Evidence: 3 local session refs, 2 correction turns, 1 reverted edit.
Suggested artifact: Loom ticket — code-legibility/refactor seam.
Rationale: A rule would remind the assistant, but the code shape is the repeated confusion source.
```

Bad behavior:

```text
The model probably made a mistake. Add a rule?
```

## Interface Contract

Expected local data surfaces:

- delta records with status `candidate | accepted | dismissed | routed | resolved | recurring`;
- detector-signal records with signal type and explanation;
- artifact-candidate records with target type, draft/next step, rationale, evidence refs, status, outcome, and applied marker;
- recurrence links from later deltas back to prior artifact candidates.

Expected Pi/user surfaces:

- primary learning-loop command (`/flight-learn`) that can be repeated to prepare local candidates, review/route the next delta, or record artifact follow-up/outcome feedback;
- command or guided UI for reviewing delta candidates;
- manual capture command/action for “record this as a delta”;
- routing choices that can store candidates without applying them;
- status/export surfaces that show unresolved, recurring, and solved categories;
- advanced fallback commands for listing/showing/routing/applying/outcome/rejecting records when UI review is unavailable.

Side effects:

- local SQLite/index writes only by default;
- no mutation of source docs, source code, Loom records, rules, or skills unless a separate approval workflow owns that artifact creation.

Error semantics:

- no detector confidence should block normal work;
- missing evidence should produce an honest “cannot route yet” or “observe” path;
- classifier unavailable/disabled should not block manual routing.

## Examples And Non-Examples

Examples of valid artifact routes:

- Flight Rule: “Before exact-text edits, re-read the target block.”
- Loom ticket: “Refactor storage mapping out of `src/storage.ts` because repeated agents confuse the seam.”
- Test/check: “Add a regression fixture for command data-dir switching before bootstrap.”
- Prompt/context doc: “Add a short project convention about source vs generated files.”
- Skill/prompt-template: “Create a reusable release-smoke procedure.”
- Observe/no artifact: “One-off provider outage; keep evidence but do not create a rule.”

Non-examples:

- Automatically editing `CLAUDE.md` from one failure.
- Treating every repeated failure as a Flight Rule.
- Claiming the classifier is reliable without comparing it to human-routed outcomes.

## Constraints

- Local-first, open-source, and no hosted model/classifier by default.
- Human feedback gates promotion and artifact application.
- Evidence-backed claims only; artifact candidates must cite the delta evidence they rely on.
- Prefer false negatives over noisy or overconfident routing.
- Build corpus and outcome tracking before classifier automation.

## Related Records

- `constitution:main` - local-first, outcome-aware, evidence-backed, and human-gated promotion principles.
- `spec:failure-memory-mvp` - original failure/fix episode model and evidence-backed answer shape.
- `spec:seamless-failure-memory-ux` - reflection proposals and feedback actions this spec generalizes.
- `plan:20260523-reflection-rule-promotion-ux` - existing Flight Rule artifact path this spec should not replace.
