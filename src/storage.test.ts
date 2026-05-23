import { mkdtemp, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseSessionFile } from "./session-parser.js";
import { buildFtsQuery, FlightRecorderStore } from "./storage.js";
import type { FailureEpisode, ReflectionProposal } from "./types.js";

function line(value: unknown): string {
  return JSON.stringify(value);
}

async function fixtureSession(dir: string): Promise<string> {
  const file = path.join(dir, "session.jsonl");
  await writeFile(
    file,
    [
      line({ type: "session", version: 3, id: "sess-store", timestamp: "2026-05-22T01:00:00.000Z", cwd: "/repo" }),
      line({ type: "message", id: "b0000001", parentId: null, timestamp: "2026-05-22T01:00:02.000Z", message: { role: "bashExecution", command: "npm test", output: "Error: Cannot find module '../paths'\n at src/config/app.ts:12", exitCode: 1, cancelled: false, truncated: false, timestamp: 2 } }),
    ].join("\n"),
  );
  return file;
}

describe("FlightRecorderStore", () => {
  it("stores parsed sessions idempotently", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "pfr-store-"));
    const sessionFile = await fixtureSession(dir);
    const parsed = await parseSessionFile(sessionFile);
    const fileStat = await stat(sessionFile);
    const meta = { size: fileStat.size, mtimeMs: fileStat.mtimeMs, sha256: "hash-1" };
    const store = new FlightRecorderStore(path.join(dir, "flight.db"));

    store.replaceParsedSession(parsed, meta);
    store.replaceParsedSession(parsed, meta);

    expect(store.count("source_files")).toBe(1);
    expect(store.count("events")).toBe(1);
    expect(store.isSourceCurrent(sessionFile, meta.size, meta.mtimeMs, meta.sha256)).toBe(true);
    store.close();
  });

  it("indexes and searches episodes with FTS", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "pfr-search-"));
    const sessionFile = await fixtureSession(dir);
    const parsed = await parseSessionFile(sessionFile);
    const event = parsed.events[0];
    if (!event) throw new Error("missing event");
    const fileStat = await stat(sessionFile);
    const store = new FlightRecorderStore(path.join(dir, "flight.db"));
    store.replaceParsedSession(parsed, { size: fileStat.size, mtimeMs: fileStat.mtimeMs, sha256: "hash-1" });

    const episode: FailureEpisode = {
      id: "episode-1",
      sourceFile: sessionFile,
      signature: "npm test cannot find module paths src config app",
      problemSummary: "npm test failed with Cannot find module '../paths'",
      status: "unresolved",
      confidence: 0.5,
      cwd: "/repo",
      sessionId: "sess-store",
      sourceRefs: [event.source],
      observed: event.text,
      attempts: [],
      resolution: null,
      files: ["src/config/app.ts"],
      limits: ["No passing validation detected"],
      searchText: `${event.text}\nsrc/config/app.ts\nCannot find module paths`,
    };

    store.replaceEpisodes(sessionFile, [episode]);
    const results = store.searchEpisodes("Cannot find module src/config/app.ts", { limit: 3 });

    expect(results).toHaveLength(1);
    expect(results[0]?.episode.id).toBe("episode-1");
    expect(results[0]?.episode.sourceRefs[0]?.entryId).toBe("b0000001");
    store.close();
  });

  it("records live occurrences, feedback suppressions, clusters, evidence, and proposals", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "pfr-ledger-"));
    const store = new FlightRecorderStore(path.join(dir, "flight.db"));
    const first = store.recordFailureOccurrence({
      source: "tool_result",
      query: "edit oldText not found in src/app.ts",
      toolName: "edit",
      cwd: "/repo",
      sessionFile: "/tmp/session.jsonl",
      entryId: "tool-1",
    });
    const repeated = store.recordFailureOccurrence({
      source: "tool_result",
      query: "edit oldText not found in src/app.ts",
      toolName: "edit",
      cwd: "/repo",
      sessionFile: "/tmp/session.jsonl",
      entryId: "tool-1",
    });

    expect(repeated.id).toBe(first.id);
    expect(repeated.repeatCount).toBe(2);
    store.updateOccurrenceSuggestion(first.id, { kind: "suppressed", reason: "no-match", episodeId: null, confidence: null, at: "2026-05-23T00:00:00.000Z" });
    expect(store.listFailureOccurrences({ cwd: "/repo", suggestionKind: "suppressed" })).toHaveLength(1);

    store.recordFeedbackAction({ targetType: "occurrence", targetId: first.id, action: "snooze", signature: first.signature, expiresAt: "2999-01-01T00:00:00.000Z" });
    expect(store.hasActiveSignatureSuppression(first.signature)?.action).toBe("snooze");

    const cluster = store.upsertFailureCluster({
      id: "cluster-test",
      clusterKey: "class:edit-oldtext-mismatch|tool:edit|cwd:/repo",
      title: "exact-text edit mismatches",
      representativeSignature: first.signature,
      status: "active",
      count: 2,
      occurrenceIds: [first.id],
      cwdSummary: ["/repo"],
      tools: ["edit"],
      firstSeenAt: first.firstSeenAt,
      lastSeenAt: repeated.lastSeenAt,
      lastReflectedAt: null,
      score: 5,
    });
    store.upsertFailureCluster(cluster);
    expect(store.getClusterEvidence(cluster.id, 3)[0]?.occurrenceId).toBe(first.id);
    store.updateClusterStatus(cluster.id, "silenced");
    expect(store.getFailureCluster(cluster.id)?.status).toBe("silenced");

    const proposal: ReflectionProposal = {
      id: "refl-test",
      clusterId: cluster.id,
      generatedAt: "2026-05-23T00:00:00.000Z",
      mode: "local",
      title: "Pattern: exact-text edit mismatches",
      summary: "Seen 2 related failures.",
      affected: ["tools: edit"],
      likelyFix: "Re-read the block before editing.",
      confidence: 0.7,
      evidence: store.getClusterEvidence(cluster.id, 3),
      limits: ["local only"],
      actions: ["useful", "wrong-match"],
    };
    store.recordReflectionProposal(proposal);
    expect(store.listReflectionProposals({ clusterId: cluster.id })[0]?.likelyFix).toContain("Re-read");
    store.close();
  });

  it("builds safe FTS queries from path-like text", () => {
    expect(buildFtsQuery("src/config/paths.ts Error: E_NOENT")).toContain('"paths"');
    expect(buildFtsQuery("a")).toBe("");
  });
});
