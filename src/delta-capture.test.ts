import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  captureManualDeltaWithStore,
  suggestDeltasFromReflectionClustersWithStore,
  suggestDeltasFromUserCorrectionsWithStore,
} from "./delta-capture.js";
import { parseSessionJsonl } from "./session-parser.js";
import { FlightRecorderStore } from "./storage.js";

function line(value: unknown): string {
  return JSON.stringify(value);
}

describe("delta capture", () => {
  it("explicitly captures a redacted manual delta with provenance and a manual signal", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "pfr-delta-manual-"));
    const store = new FlightRecorderStore(path.join(dir, "flight.db"));
    const result = captureManualDeltaWithStore(store, {
      summary: "Assistant used the wrong API with API_KEY=secret-value in /Users/alice/private/project/src/api.ts",
      expectation: "Use the v2 client, not TOKEN=abc123 examples.",
      reality: "Assistant suggested the old client from /Users/alice/private/project/docs/old.md",
      impact: "User had to correct the plan.",
      severity: "medium",
      cwd: "/Users/alice/private/project",
      sessionFile: "/Users/alice/.pi/agent/sessions/private/session.jsonl",
      entryId: "u1",
      evidenceText: "no, actually the API works differently: password=hunter2",
      evidenceNote: "manual note with /Users/alice/private/project",
      metadata: { rawPrompt: "API_KEY=secret-value /Users/alice/private/project" },
      now: "2026-05-23T01:00:00.000Z",
    });

    expect(result.created).toBe(true);
    expect(result.delta.status).toBe("candidate");
    expect(result.delta.source).toBe("manual");
    expect(result.delta.summary).not.toContain("secret-value");
    expect(result.delta.cwd).toContain("/Users/<user>");
    expect(result.delta.sourceSessionFile).toContain("<pi-session-file:");
    expect(JSON.stringify(result.delta.metadata)).not.toContain("secret-value");
    expect(result.signals[0]?.type).toBe("manual-capture");
    expect(result.signals[0]?.explanation).toContain("Explicit manual delta capture");
    expect(store.count("artifact_candidates")).toBe(0);
    store.close();
  });

  it("suggests reviewable deltas from repeated reflection clusters without artifact side effects", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "pfr-delta-cluster-"));
    const store = new FlightRecorderStore(path.join(dir, "flight.db"));
    const first = store.recordFailureOccurrence({
      source: "tool_result",
      query: "edit oldText not found in /Users/alice/private/project/src/app.ts TOKEN=abc123",
      toolName: "edit",
      cwd: "/Users/alice/private/project",
      sessionFile: "/Users/alice/.pi/agent/sessions/private/session.jsonl",
      entryId: "tool-1",
      now: "2026-05-23T01:00:00.000Z",
    });
    const second = store.recordFailureOccurrence({
      source: "tool_result",
      query: "edit oldText not found in /Users/alice/private/project/src/app.ts TOKEN=abc123",
      toolName: "edit",
      cwd: "/Users/alice/private/project",
      sessionFile: "/Users/alice/.pi/agent/sessions/private/session.jsonl",
      entryId: "tool-2",
      now: "2026-05-23T01:01:00.000Z",
    });
    const cluster = store.upsertFailureCluster({
      id: "cluster-delta",
      clusterKey: "class:edit-oldtext-mismatch|tool:edit|cwd:/Users/alice/private/project",
      title: "exact-text edit mismatches",
      representativeSignature: first.signature,
      status: "active",
      count: 2,
      occurrenceIds: [first.id, second.id],
      cwdSummary: ["/Users/<user>/private/project"],
      tools: ["edit"],
      firstSeenAt: first.firstSeenAt,
      lastSeenAt: second.lastSeenAt,
      lastReflectedAt: null,
      score: 5,
    });

    const results = suggestDeltasFromReflectionClustersWithStore(store, { minCount: 2, now: "2026-05-23T01:02:00.000Z" });
    const repeated = suggestDeltasFromReflectionClustersWithStore(store, { minCount: 2, now: "2026-05-23T01:03:00.000Z" });

    expect(results).toHaveLength(1);
    expect(repeated).toHaveLength(1);
    expect(repeated[0]?.created).toBe(false);
    expect(results[0]?.delta.status).toBe("candidate");
    expect(results[0]?.delta.activeArtifactCandidateId).toBeNull();
    expect(results[0]?.delta.summary).toContain(cluster.title);
    expect(results[0]?.signals[0]?.type).toBe("reflection-cluster");
    expect(results[0]?.signals[0]?.explanation).toContain("conservative threshold 2");
    expect(results[0]?.delta.evidenceRefs[0]?.sourceType).toBe("occurrence");
    expect(results[0]?.delta.evidenceRefs[0]?.snippet).not.toContain("abc123");
    expect(store.count("expectation_deltas")).toBe(1);
    expect(store.count("delta_detector_signals")).toBe(1);
    expect(store.count("artifact_candidates")).toBe(0);
    store.close();
  });

  it("suggests reviewable deltas from conservative user correction language in parsed sessions", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "pfr-delta-correction-"));
    const store = new FlightRecorderStore(path.join(dir, "flight.db"));
    const parsed = parseSessionJsonl([
      line({ type: "session", version: 3, id: "sess-delta", timestamp: "2026-05-23T01:00:00.000Z", cwd: "/Users/alice/private/project" }),
      line({ type: "message", id: "u-normal", parentId: null, timestamp: "2026-05-23T01:00:01.000Z", message: { role: "user", content: "please keep going with the plan" } }),
      line({ type: "message", id: "u-correct", parentId: "u-normal", timestamp: "2026-05-23T01:00:02.000Z", message: { role: "user", content: "No, actually the API works differently and TOKEN=abc123 should not be used from /Users/alice/private/project/docs.md" } }),
    ].join("\n"), "/Users/alice/.pi/agent/sessions/private/session.jsonl");

    const results = suggestDeltasFromUserCorrectionsWithStore(store, parsed, { now: "2026-05-23T01:04:00.000Z" });
    const repeated = suggestDeltasFromUserCorrectionsWithStore(store, parsed, { now: "2026-05-23T01:05:00.000Z" });

    expect(results).toHaveLength(1);
    expect(repeated[0]?.created).toBe(false);
    expect(results[0]?.delta.status).toBe("candidate");
    expect(results[0]?.delta.summary).toContain("User correction");
    expect(results[0]?.delta.summary).not.toContain("abc123");
    expect(results[0]?.delta.sourceEntryId).toBe("u-correct");
    expect(results[0]?.signals[0]?.type).toBe("user-correction");
    expect(results[0]?.signals[0]?.explanation).toContain("conservative phrase");
    expect(results[0]?.delta.evidenceRefs[0]?.sourceType).toBe("session-entry");
    expect(results[0]?.delta.evidenceRefs[0]?.sessionFile).toContain("<pi-session-file:");
    expect(store.count("expectation_deltas")).toBe(1);
    expect(store.count("delta_detector_signals")).toBe(1);
    expect(store.count("artifact_candidates")).toBe(0);
    store.close();
  });
});
