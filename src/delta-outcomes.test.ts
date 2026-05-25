import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { formatDeltaOutcomeSummary, recordArtifactCandidateOutcomeWithStore, recordDeltaRecurrenceWithStore, summarizeDeltaOutcomes } from "./delta-outcomes.js";
import { defaultDatabasePath, FlightRecorderStore } from "./storage.js";
import type { DeltaEvidenceRef } from "./types.js";

function evidence(entryId: string, snippet = "User correction showed the same expectation delta"): DeltaEvidenceRef[] {
  return [
    {
      sourceType: "session-entry",
      sourceId: entryId,
      sourceFile: "/Users/alice/.pi/agent/sessions/private/session.jsonl",
      sessionFile: "/Users/alice/.pi/agent/sessions/private/session.jsonl",
      cwd: "/Users/alice/private/project",
      entryId,
      timestamp: "2026-05-23T00:00:00.000Z",
      snippet,
      note: "local fixture evidence TOKEN=abc123",
    },
  ];
}

describe("delta outcome and recurrence metrics", () => {
  it("reports cautious no-recurrence and recurring-after-applied categories from inspectable links", async () => {
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-delta-outcomes-"));
    const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
    try {
      const original = store.createExpectationDelta({
        source: "manual",
        summary: "Assistant repeatedly misses the storage/mapper seam",
        expectation: "Keep storage and mapper ownership distinct.",
        reality: "Assistant edited the storage repository when mapper tests were needed.",
        evidenceRefs: evidence("original"),
        now: "2026-05-23T00:00:00.000Z",
      });
      let candidate = store.createArtifactCandidate({
        deltaId: original.id,
        artifactType: "code-legibility",
        title: "Make the mapper seam easier to find",
        rationale: "The route is code legibility because the repeated confusion comes from ownership shape.",
        evidenceRefs: original.evidenceRefs,
        now: "2026-05-23T00:01:00.000Z",
      });
      candidate = store.acceptArtifactCandidate(candidate.id, "2026-05-23T00:01:30.000Z") ?? candidate;
      candidate = store.markArtifactCandidateApplied(candidate.id, { appliedArtifactRef: ".loom/tickets/mapper-seam.md", now: "2026-05-23T00:02:00.000Z" }) ?? candidate;

      const before = summarizeDeltaOutcomes(store);
      expect(before.counts["no-recurrence-observed"]).toBe(1);
      expect(before.items[0]?.category).toBe("no-recurrence-observed");
      const beforeText = formatDeltaOutcomeSummary(before);
      expect(beforeText).toContain("No recurrence observed since applied");
      expect(beforeText).toContain("not proof");
      expect(beforeText).not.toMatch(/fixed forever|\bsolved\b/i);

      const later = store.createExpectationDelta({
        source: "manual",
        summary: "Assistant again missed the storage/mapper seam",
        expectation: "Look for mapper ownership before editing storage.",
        reality: "Assistant repeated the storage-owner assumption after the artifact was applied.",
        evidenceRefs: evidence("later", "Later session showed the same storage mapper confusion"),
        now: "2026-05-23T00:03:00.000Z",
      });
      const recurrence = recordDeltaRecurrenceWithStore(store, {
        deltaId: later.id,
        priorArtifactCandidateId: candidate.id,
        reason: "Similar mapper/storage seam delta recurred after the code-legibility candidate was applied.",
        similarity: 0.88,
        now: "2026-05-23T00:04:00.000Z",
      });

      expect(recurrence?.link.priorArtifactCandidateId).toBe(candidate.id);
      expect(recurrence?.recurringDelta.status).toBe("recurring");
      expect(recurrence?.priorArtifactCandidate.status).toBe("recurring");
      expect(recurrence?.priorArtifactCandidate.outcome).toBe("needs-reroute");
      expect(store.listDeltaRecurrenceLinks({ priorArtifactCandidateId: candidate.id })).toHaveLength(1);

      const after = summarizeDeltaOutcomes(store);
      expect(after.counts["recurring-after-applied"]).toBe(1);
      const afterText = formatDeltaOutcomeSummary(after);
      expect(afterText).toContain("Recurring after applied");
      expect(afterText).toContain("does not prove");
      expect(afterText).not.toMatch(/caused improvement|fixed forever/i);
    } finally {
      store.close();
    }
  });

  it("preserves original route history while recording outcomes, rejection, recurrence, and reroutes", async () => {
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-delta-outcome-history-"));
    const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
    try {
      const delta = store.createExpectationDelta({ source: "manual", summary: "Validation habit was missing", evidenceRefs: evidence("route") });
      const candidate = store.acceptArtifactCandidate(store.createArtifactCandidate({
        deltaId: delta.id,
        artifactType: "test-check",
        title: "Add the missing validation check",
        rationale: "A small test/check would expose the missing behavior.",
        evidenceRefs: delta.evidenceRefs,
      }).id)!;

      const originalRationale = candidate.rationale;
      const originalEvidence = candidate.evidenceRefs;
      const outcome = recordArtifactCandidateOutcomeWithStore(store, {
        candidateId: candidate.id,
        appliedArtifactRef: "tests/validation-check.test.ts",
        outcome: "helped",
        outcomeSummary: "No linked recurrence observed after adding the check.",
      });
      expect(outcome?.candidate.status).toBe("resolved");
      expect(outcome?.candidate.applied).toBe(true);
      expect(outcome?.candidate.outcomeSummary).toContain("No linked recurrence");
      expect(outcome?.candidate.rationale).toBe(originalRationale);
      expect(outcome?.candidate.evidenceRefs).toEqual(originalEvidence);
      expect(outcome?.delta?.status).toBe("resolved");

      const rejected = store.rejectArtifactCandidate(candidate.id, "Rejected later as too broad after review TOKEN=abc123");
      expect(rejected?.status).toBe("rejected");
      expect(rejected?.outcomeSummary).not.toContain("abc123");
      expect(rejected?.rationale).toBe(originalRationale);
      expect(rejected?.evidenceRefs).toEqual(originalEvidence);
      expect(summarizeDeltaOutcomes(store).items.find((item) => item.candidateId === candidate.id)?.category).toBe("unresolved");

      const later = store.createExpectationDelta({ source: "manual", summary: "Validation habit recurred", evidenceRefs: evidence("reroute") });
      const recurrence = recordDeltaRecurrenceWithStore(store, {
        deltaId: later.id,
        priorArtifactCandidateId: candidate.id,
        reason: "A similar validation delta recurred; route should be narrower.",
      });
      expect(recurrence?.link.deltaId).toBe(later.id);

      const rerouteCandidate = store.createArtifactCandidate({
        deltaId: later.id,
        artifactType: "loom-ticket",
        title: "Narrow validation workflow ticket",
        rationale: "The recurrence shows this should be a smaller implementation ticket, not the previous check candidate.",
        supersedesCandidateId: candidate.id,
        routeDelta: false,
      });
      const rerouted = store.rerouteExpectationDelta(later.id, rerouteCandidate.id, "Manual reroute after recurrence evidence");
      expect(rerouted?.activeArtifactCandidateId).toBe(rerouteCandidate.id);
      expect(store.getArtifactCandidate(candidate.id)?.status).toBe("rejected");
      expect(store.getArtifactCandidate(candidate.id)?.rationale).toBe(originalRationale);
      expect(store.listDeltaRecurrenceLinks({ priorArtifactCandidateId: candidate.id })).toHaveLength(1);
      expect(store.listArtifactCandidates({ deltaId: later.id })).toHaveLength(1);
    } finally {
      store.close();
    }
  });
});
