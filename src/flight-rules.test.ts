import { describe, expect, it } from "vitest";
import { draftRuleFromProposal, formatRuleInjectionBlock } from "./flight-rules.js";
import type { FlightRule, ReflectionProposal } from "./types.js";

function proposal(overrides: Partial<ReflectionProposal> = {}): ReflectionProposal {
  return {
    id: "refl-test",
    clusterId: "cluster-test",
    generatedAt: "2026-05-23T00:00:00.000Z",
    mode: "local",
    title: "Pattern: exact-text edit mismatches",
    summary: "Seen repeated failures.",
    affected: ["tools: edit"],
    likelyFix: "Before editing, re-read the block before retrying oldText.",
    confidence: 0.75,
    evidence: [{ occurrenceId: "occ", source: "tool_result", cwd: "/repo", sessionFile: null, entryId: "e1", snippet: "edit oldText not found", seenAt: "2026-05-23T00:00:00.000Z" }],
    limits: [],
    actions: ["make-rule"],
    ...overrides,
  };
}

describe("flight rules", () => {
  it("drafts exact edit mismatch rules as global workflow guidance", () => {
    const draft = draftRuleFromProposal(proposal());
    expect(draft.proposedScope).toBe("global");
    expect(draft.text).toContain("re-read the target block");
  });

  it("does not overclaim low-confidence unresolved proposals", () => {
    const draft = draftRuleFromProposal(proposal({ confidence: 0.55, likelyFix: "No prior resolution is strong enough to claim a fix.", title: "Pattern: npm test failed" }));
    expect(draft.text).toContain("validate one narrow remediation");
  });

  it("formats bounded injection blocks without evidence", () => {
    const rules: FlightRule[] = [{ id: "rule_1", candidateId: "cand", sourceProposalId: "refl", clusterId: "cluster", scope: "global", projectRoot: null, projectRootDisplay: null, text: "Do the thing", status: "active", createdAt: "now", updatedAt: "now", disabledAt: null, lastInjectedAt: null, injectionCount: 0 }];
    expect(formatRuleInjectionBlock(rules)).toContain("[rule_1; global] Do the thing");
  });
});
