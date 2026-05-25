import { mkdir, mkdtemp, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildArtifactCandidateDraft } from "./artifact-drafts.js";
import { defaultDatabasePath, FlightRecorderStore } from "./storage.js";
import type { ArtifactCandidateType, ExpectationDelta } from "./types.js";

function fixtureDelta(store: FlightRecorderStore): ExpectationDelta {
  return store.createExpectationDelta({
    source: "detector",
    summary: "Assistant repeatedly treated /Users/alice/private/project/src/storage.ts as the mapper owner with API_KEY=secret-value",
    expectation: "Storage owns repository behavior; mapping and sanitization should stay in separate seams.",
    reality: "Assistant edited /Users/alice/private/project/src/storage.ts directly and missed the mapper seam twice. TOKEN=abc123",
    impact: "Repeated review churn and failed validation after assistant changes.",
    severity: "high",
    cwd: "/Users/alice/private/project",
    sourceSessionFile: "/Users/alice/.pi/agent/sessions/private/session.jsonl",
    sourceEntryId: "u-correct",
    evidenceRefs: [
      {
        sourceType: "session-entry",
        sourceId: "u-correct",
        sourceFile: "/Users/alice/.pi/agent/sessions/private/session.jsonl",
        sessionFile: "/Users/alice/.pi/agent/sessions/private/session.jsonl",
        cwd: "/Users/alice/private/project",
        entryId: "u-correct",
        timestamp: "2026-05-23T01:00:00.000Z",
        snippet: "No, actually storage is not the mapper owner; password=hunter2",
        note: "User correction with SECRET_TOKEN=raw-secret",
      },
    ],
    metadata: { rawPrompt: "Use /Users/alice/private/project and API_KEY=secret-value" },
  });
}

describe("artifact candidate drafts", () => {
  it("builds bounded redacted candidate-only drafts for the first artifact set", async () => {
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-artifact-drafts-data-"));
    const projectRoot = await mkdtemp(path.join(tmpdir(), "pfr-artifact-drafts-project-"));
    await mkdir(path.join(projectRoot, ".loom", "tickets"), { recursive: true });
    await writeFile(path.join(projectRoot, "README.md"), "unchanged\n");
    const beforeTickets = await readdir(path.join(projectRoot, ".loom", "tickets"));
    const beforeRoot = await readdir(projectRoot);

    const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
    try {
      const delta = fixtureDelta(store);
      const firstSet: ArtifactCandidateType[] = ["flight-rule", "loom-ticket", "code-legibility", "test-check", "observe"];
      for (const artifactType of firstSet) {
        const rationale = `Route to ${artifactType} because the evidence points there.`;
        const draft = buildArtifactCandidateDraft({ delta, artifactType, rationale });
        const candidate = store.acceptArtifactCandidate(store.createArtifactCandidate({
          deltaId: delta.id,
          artifactType,
          title: `${artifactType} candidate`,
          rationale,
          proposedDraft: draft.proposedDraft,
          nextStep: draft.nextStep,
          confidence: draft.confidence,
          limits: draft.limits,
          evidenceRefs: delta.evidenceRefs,
          routeDelta: false,
        }).id);

        expect(candidate?.status).toBe("accepted");
        expect(candidate?.applied).toBe(false);
        expect(candidate?.proposedDraft).toBeTruthy();
        expect(candidate?.nextStep).toBeTruthy();
        expect(candidate?.limits.length).toBeGreaterThan(0);
        expect(candidate?.evidenceRefs.length).toBeGreaterThan(0);
        expect(candidate?.rationale).toContain("evidence");
        expect(candidate?.proposedDraft!.length).toBeLessThanOrEqual(1_800);
        expect(JSON.stringify(candidate)).not.toContain("secret-value");
        expect(JSON.stringify(candidate)).not.toContain("abc123");
        expect(JSON.stringify(candidate)).not.toContain("hunter2");
        expect(JSON.stringify(candidate)).not.toContain("/Users/alice");
      }
      expect(store.count("artifact_candidates")).toBe(firstSet.length);
      expect(store.count("rule_candidates")).toBe(0);
      expect(store.count("flight_rules")).toBe(0);
    } finally {
      store.close();
    }

    expect(await readdir(path.join(projectRoot, ".loom", "tickets"))).toEqual(beforeTickets);
    expect(await readdir(projectRoot)).toEqual(beforeRoot);
  });

  it("keeps Flight Rule handoff pending until the existing approval path is used", async () => {
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-artifact-rule-handoff-"));
    const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
    try {
      const delta = fixtureDelta(store);
      const draft = buildArtifactCandidateDraft({ delta, artifactType: "flight-rule", rationale: "A reusable behavior reminder may help." });
      const candidate = store.acceptArtifactCandidate(store.createArtifactCandidate({
        deltaId: delta.id,
        artifactType: "flight-rule",
        title: "Flight Rule handoff",
        rationale: "A reusable behavior reminder may help.",
        proposedDraft: draft.proposedDraft,
        nextStep: draft.nextStep,
        limits: draft.limits,
        evidenceRefs: delta.evidenceRefs,
      }).id);

      expect(candidate?.artifactType).toBe("flight-rule");
      expect(candidate?.proposedDraft).toContain("Flight Rule handoff candidate");
      expect(candidate?.nextStep).toContain("/flight-review");
      expect(candidate?.limits.join("\n")).toContain("not an approved Flight Rule");
      expect(candidate?.applied).toBe(false);
      expect(store.listActiveFlightRulesForCwd("/Users/alice/private/project")).toHaveLength(0);
      expect(store.count("rule_candidates")).toBe(0);
      expect(store.count("flight_rules")).toBe(0);
    } finally {
      store.close();
    }
  });
});
