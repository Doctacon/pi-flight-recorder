import { compactSnippet, sanitizeStoredText } from "./redact.js";
import type { ArtifactCandidateType, DeltaEvidenceRef, ExpectationDelta } from "./types.js";

export interface ArtifactDraftInput {
  delta: ExpectationDelta;
  artifactType: ArtifactCandidateType;
  rationale: string;
}

export interface ArtifactDraftResult {
  proposedDraft: string | null;
  nextStep: string;
  limits: string[];
  confidence: number | null;
}

function safe(value: string | null | undefined, maxLength = 600): string {
  const text = value && value.trim() ? value : "unknown";
  return sanitizeStoredText(text, maxLength);
}

function evidenceBullets(evidenceRefs: DeltaEvidenceRef[], max = 4): string[] {
  if (evidenceRefs.length === 0) return ["- no local evidence refs recorded; observe or add evidence before creating a durable artifact"];
  return evidenceRefs.slice(0, max).map((ref) => {
    const id = [ref.sourceType, ref.sourceId ?? ref.entryId].filter(Boolean).join("/") || ref.sourceType;
    const where = [ref.cwd, ref.sessionFile].filter(Boolean).join("; ") || "local source unknown";
    const snippet = ref.snippet ? ` :: ${compactSnippet(sanitizeStoredText(ref.snippet, 240).replace(/\s+/g, " "), 180)}` : "";
    return `- ${safe(id, 160)} (${safe(where, 220)})${snippet}`;
  });
}

function baseContext(delta: ExpectationDelta, rationale: string): string[] {
  return [
    `Delta: ${safe(delta.summary, 260)}`,
    `Expectation: ${safe(delta.expectation, 360)}`,
    `Reality: ${safe(delta.reality, 360)}`,
    `Impact: ${safe(delta.impact, 260)}`,
    `Why this follow-up: ${safe(rationale, 500)}`,
    "Evidence:",
    ...evidenceBullets(delta.evidenceRefs),
  ];
}

function boundedDraft(lines: string[]): string {
  return sanitizeStoredText(lines.join("\n"), 1_800);
}

function commonLimits(extra: string[] = []): string[] {
  return [
    "Candidate draft only; no source, docs, Loom records, skills, prompt files, or active rules were changed.",
    "Evidence snippets are local/redacted summaries; inspect the source refs before creating a durable artifact.",
    ...extra,
  ].map((limit) => sanitizeStoredText(limit, 300));
}

function ruleText(delta: ExpectationDelta): string {
  const expectation = safe(delta.expectation, 220);
  const reality = safe(delta.reality, 220);
  if (expectation !== "unknown") return `When a similar delta appears, prefer this behavior: ${expectation}`;
  return `When similar evidence appears (${compactSnippet(reality.replace(/\s+/g, " "), 160)}), pause and verify the assumption before repeating the failed path.`;
}

function flightRuleDraft(delta: ExpectationDelta, rationale: string): ArtifactDraftResult {
  return {
    proposedDraft: boundedDraft([
      "# Flight Rule handoff candidate (not active)",
      ...baseContext(delta, rationale),
      "",
      "Proposed rule text:",
      `- ${ruleText(delta)}`,
      "",
      "Approval boundary:",
      "- This is stored only as an artifact candidate draft.",
      "- Create/approve an active Flight Rule only through the existing explicit Flight Rule workflow.",
    ]),
    nextStep: "If this should become guidance, review the proposed rule text and create/approve a Flight Rule through `/flight-learn review` or `/flight-learn rules` approval workflow. Until then it is not injected.",
    limits: commonLimits(["This draft is not an approved Flight Rule and will not be injected into future turns."]),
    confidence: 0.55,
  };
}

function loomTicketDraft(delta: ExpectationDelta, rationale: string): ArtifactDraftResult {
  return {
    proposedDraft: boundedDraft([
      "# Loom ticket candidate (not written)",
      "",
      "## Summary",
      safe(delta.summary, 260),
      "",
      "## Problem / Delta",
      ...baseContext(delta, rationale),
      "",
      "## Scope candidate",
      "- Create one bounded ticket that addresses the repeated delta.",
      "- Preserve local evidence refs and avoid broad cleanup.",
      "",
      "## Acceptance candidate",
      "- The underlying expectation/reality gap is addressed by a testable change or documented decision.",
      "- Evidence shows the repeated confusion path is easier to avoid or detect.",
    ]),
    nextStep: "Review this handoff and, if still useful, create a Loom ticket manually in `.loom/tickets/` with operator-approved scope.",
    limits: commonLimits(["No `.loom/tickets` file was created."]),
    confidence: 0.62,
  };
}

function codeLegibilityDraft(delta: ExpectationDelta, rationale: string): ArtifactDraftResult {
  return {
    proposedDraft: boundedDraft([
      "# Code-legibility/refactor ticket candidate (not written)",
      "",
      "## Confusing seam",
      safe(delta.summary, 260),
      "",
      "## Desired shape",
      safe(delta.expectation, 420),
      "",
      "## Current confusion",
      safe(delta.reality, 420),
      "",
      "## Why code shape, not just a rule",
      safe(rationale, 500),
      "",
      "## Candidate acceptance",
      "- The confusing ownership/seam is made explicit in code, names, tests, or docs.",
      "- A future agent can identify the correct owner without relying on memory alone.",
      "- Existing behavior remains covered by tests or a clear validation command.",
      "",
      "## Evidence",
      ...evidenceBullets(delta.evidenceRefs),
    ]),
    nextStep: "Turn this into a scoped Loom ticket for a code-legibility/refactor pass; do not edit source until that ticket is approved and active.",
    limits: commonLimits(["No source files or Loom tickets were changed."]),
    confidence: 0.68,
  };
}

function testCheckDraft(delta: ExpectationDelta, rationale: string): ArtifactDraftResult {
  return {
    proposedDraft: boundedDraft([
      "# Test/check candidate (not written)",
      "",
      "Behavior or assumption to lock down:",
      safe(delta.expectation, 420),
      "",
      "Observed miss:",
      safe(delta.reality, 420),
      "",
      "Suggested check:",
      "- Add or update the smallest regression test, smoke check, fixture, or validation command that would have exposed this delta earlier.",
      "- Keep the check local/open-source and runnable without hosted services.",
      "",
      "Why this follow-up:",
      safe(rationale, 500),
      "",
      "Evidence:",
      ...evidenceBullets(delta.evidenceRefs),
    ]),
    nextStep: "Create the test/check in a separate implementation ticket; this candidate does not write tests or change validation behavior.",
    limits: commonLimits(["No test files or validation scripts were changed."]),
    confidence: 0.64,
  };
}

function observeDraft(delta: ExpectationDelta, rationale: string): ArtifactDraftResult {
  return {
    proposedDraft: boundedDraft([
      "# Observe/no-artifact decision",
      "",
      ...baseContext(delta, rationale),
      "",
      "Observation plan:",
      "- Keep the delta and evidence visible locally.",
      "- Watch whether similar deltas recur before creating a durable artifact.",
      "- Re-route later if recurrence or impact grows.",
    ]),
    nextStep: "No artifact should be created yet. Keep observing recurrence and reroute if the delta repeats or impact increases.",
    limits: commonLimits(["Observe/no-artifact is an intentional route, not a failed draft."]),
    confidence: 0.5,
  };
}

export function buildArtifactCandidateDraft(input: ArtifactDraftInput): ArtifactDraftResult {
  switch (input.artifactType) {
    case "flight-rule":
      return flightRuleDraft(input.delta, input.rationale);
    case "loom-ticket":
      return loomTicketDraft(input.delta, input.rationale);
    case "code-legibility":
      return codeLegibilityDraft(input.delta, input.rationale);
    case "test-check":
      return testCheckDraft(input.delta, input.rationale);
    case "observe":
      return observeDraft(input.delta, input.rationale);
    default:
      return {
        proposedDraft: boundedDraft([
          `# ${input.artifactType} artifact candidate handoff (not written)`,
          "",
          ...baseContext(input.delta, input.rationale),
          "",
          "Next artifact workflow:",
          "- Review this candidate manually before creating or modifying any durable artifact.",
        ]),
        nextStep: "Review this candidate manually; broad draft support for this artifact type is intentionally limited until the first set proves useful.",
        limits: commonLimits(["This artifact type has generic handoff text only in the first drafting slice."]),
        confidence: 0.45,
      };
  }
}
