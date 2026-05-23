import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { mineFailurePatternsWithStore } from "./pattern-miner.js";
import { FlightRecorderStore } from "./storage.js";

function makeStore(dir: string): FlightRecorderStore {
  return new FlightRecorderStore(path.join(dir, "flight.db"));
}

describe("local pattern miner", () => {
  it("groups identical normalized failures and rebuilds idempotently", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "pfr-miner-exact-"));
    const store = makeStore(dir);
    store.recordFailureOccurrence({ source: "tool_result", query: "Error: ENOENT no such file or directory src/missing.ts:12", toolName: "bash", cwd: "/repo", entryId: "a" });
    store.recordFailureOccurrence({ source: "tool_result", query: "Error: ENOENT no such file or directory src/missing.ts:99", toolName: "bash", cwd: "/repo", entryId: "b" });

    const first = mineFailurePatternsWithStore(store, { dataDir: dir, minOccurrences: 1, now: "2026-05-23T00:00:00.000Z" });
    const second = mineFailurePatternsWithStore(store, { dataDir: dir, minOccurrences: 1, now: "2026-05-23T00:00:00.000Z" });

    expect(first.clusters[0]?.count).toBe(2);
    expect(second.clusters[0]?.occurrenceIds).toHaveLength(2);
    expect(store.count("failure_clusters")).toBe(1);
    store.close();
  });

  it("groups conservative similar classes without merging false friends", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "pfr-miner-class-"));
    const store = makeStore(dir);
    store.recordFailureOccurrence({ source: "tool_result", query: "Edit failed: oldText not found near function alpha", toolName: "edit", cwd: "/repo", entryId: "edit-1" });
    store.recordFailureOccurrence({ source: "tool_result", query: "Edit failed: old text did not match near function beta", toolName: "edit", cwd: "/repo", entryId: "edit-2" });
    store.recordFailureOccurrence({ source: "tool_result", query: "Edit failed: oldText not found near function gamma", toolName: "edit", cwd: "/other", entryId: "edit-3" });

    const result = mineFailurePatternsWithStore(store, { dataDir: dir, minOccurrences: 1, now: "2026-05-23T00:00:00.000Z" });
    const repoCluster = result.clusters.find((cluster) => cluster.title === "exact-text edit mismatches" && cluster.cwdSummary.includes("/repo"));
    const otherCluster = result.clusters.find((cluster) => cluster.title === "exact-text edit mismatches" && cluster.cwdSummary.includes("/other"));

    expect(repoCluster?.count).toBe(2);
    expect(otherCluster?.count).toBe(1);
    expect(repoCluster?.score ?? 0).toBeGreaterThan(otherCluster?.score ?? 0);
    store.close();
  });
});
