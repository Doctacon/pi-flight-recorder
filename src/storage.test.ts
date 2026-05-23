import { mkdtemp, stat, writeFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseSessionFile, parseSessionJsonl } from "./session-parser.js";
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

  it("redacts secret-like event text before storing parsed session rows", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "pfr-event-redact-"));
    const sourceFile = path.join(dir, "session.jsonl");
    const parsed = parseSessionJsonl([
      line({ type: "session", version: 3, id: "sess-redact", timestamp: "2026-05-22T01:00:00.000Z", cwd: "/repo" }),
      line({ type: "message", id: "fail-secret", parentId: null, timestamp: "2026-05-22T01:00:02.000Z", message: { role: "bashExecution", command: "curl --token super-secret /Users/alice/private/file", output: "API_KEY=sk-live-secret failed in /Users/alice/private/file", exitCode: 1, cancelled: false, truncated: false, timestamp: 2 } }),
    ].join("\n"), sourceFile);
    const dbPath = path.join(dir, "flight.db");
    const store = new FlightRecorderStore(dbPath);
    store.replaceParsedSession(parsed, { size: 10, mtimeMs: 1, sha256: "hash-redact" });
    store.close();

    const db = new DatabaseSync(dbPath);
    const row = db.prepare("SELECT searchText, dataJson FROM events WHERE entryId = ?").get("fail-secret") as { searchText: string; dataJson: string };
    db.close();
    expect(row.searchText).not.toContain("super-secret");
    expect(row.searchText).not.toContain("sk-live-secret");
    expect(row.searchText).not.toContain("/Users/alice");
    expect(row.dataJson).toContain("[REDACTED]");
    expect(row.dataJson).toContain("/Users/<user>");
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

  it("redacts episode rows before storage and still searches with raw cwd", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "pfr-episode-redact-"));
    const sessionFile = await fixtureSession(dir);
    const parsed = await parseSessionFile(sessionFile);
    const event = parsed.events[0];
    if (!event) throw new Error("missing event");
    const store = new FlightRecorderStore(path.join(dir, "flight.db"));
    store.replaceParsedSession(parsed, { size: 10, mtimeMs: 1, sha256: "hash-episode-redact" });
    const secretRef = { ...event.source, sourceFile: "/Users/alice/.pi/agent/sessions/private/session.jsonl", cwd: "/Users/alice/private/project" };
    const episode: FailureEpisode = {
      id: "episode-secret",
      sourceFile: sessionFile,
      signature: "npm test API_KEY=secret-value /Users/alice/private/project/src/app.ts",
      problemSummary: "npm test failed with API_KEY=secret-value in /Users/alice/private/project/src/app.ts",
      status: "resolved",
      confidence: 0.9,
      cwd: "/Users/alice/private/project",
      sessionId: "sess-store",
      sourceRefs: [secretRef],
      observed: "API_KEY=secret-value failed at /Users/alice/private/project/src/app.ts",
      attempts: [{ summary: "Tried --token super-secret in /Users/alice/private/project", sourceRef: secretRef }],
      resolution: { summary: "Validation passed with --token super-secret in /Users/alice/private/project", sourceRef: secretRef },
      files: ["/Users/alice/private/project/src/app.ts"],
      limits: ["Secret path /Users/alice/private/project was local"],
      searchText: "API_KEY=secret-value token super-secret /Users/alice/private/project/src/app.ts",
    };

    store.replaceEpisodes(sessionFile, [episode]);
    const result = store.searchEpisodes("API_KEY src/app.ts", { cwd: "/Users/alice/private/project", limit: 1 })[0]?.episode;

    expect(result?.problemSummary).not.toContain("secret-value");
    expect(result?.observed).not.toContain("secret-value");
    expect(result?.resolution?.summary).not.toContain("super-secret");
    expect(result?.cwd).toContain("/Users/<user>");
    expect(result?.sourceRefs[0]?.sourceFile).toContain("<pi-session-file:");
    expect(result?.files[0]).toContain("/Users/<user>");
    store.close();
  });

  it("records live occurrences, feedback suppressions, clusters, evidence, and proposals", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "pfr-ledger-"));
    const store = new FlightRecorderStore(path.join(dir, "flight.db"));
    const first = store.recordFailureOccurrence({
      source: "tool_result",
      query: "edit oldText not found in src/app.ts API_KEY=secret-value",
      toolName: "edit",
      command: "node script.js --token super-secret --file /Users/alice/private/project/file.ts",
      cwd: "/Users/alice/private/project",
      sessionFile: "/Users/alice/.pi/agent/sessions/--private-project--/session.jsonl",
      entryId: "tool-1",
    });
    const repeated = store.recordFailureOccurrence({
      source: "tool_result",
      query: "edit oldText not found in src/app.ts API_KEY=secret-value",
      toolName: "edit",
      command: "node script.js --token super-secret --file /Users/alice/private/project/file.ts",
      cwd: "/Users/alice/private/project",
      sessionFile: "/Users/alice/.pi/agent/sessions/--private-project--/session.jsonl",
      entryId: "tool-1",
    });

    expect(repeated.id).toBe(first.id);
    expect(repeated.repeatCount).toBe(2);
    expect(repeated.snippet).not.toContain("secret-value");
    expect(repeated.command).not.toContain("super-secret");
    expect(repeated.cwd).toContain("/Users/<user>");
    expect(repeated.sessionFile).toContain("<pi-session-file:");
    store.updateOccurrenceSuggestion(first.id, { kind: "suppressed", reason: "no-match", episodeId: null, confidence: null, at: "2026-05-23T00:00:00.000Z" });
    expect(store.listFailureOccurrences({ cwd: "/Users/<user>/private/project", suggestionKind: "suppressed" })).toHaveLength(1);

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
      cwdSummary: ["/Users/<user>/private/project"],
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

  it("stores, dedupes, approves, and disables redacted Flight Rule candidates", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "pfr-rules-"));
    const store = new FlightRecorderStore(path.join(dir, "flight.db"));
    const first = store.recordFailureOccurrence({
      source: "tool_result",
      query: "Edit failed: oldText not found SECRET_TOKEN=abc123 in /Users/alice/private/project/src/app.ts",
      toolName: "edit",
      cwd: "/Users/alice/private/project",
      sessionFile: "/Users/alice/.pi/agent/sessions/private/session.jsonl",
      entryId: "rule-occ-1",
    });
    const cluster = store.upsertFailureCluster({
      id: "cluster-rules",
      clusterKey: "class:edit-oldtext-mismatch|tool:edit|cwd:/Users/alice/private/project",
      title: "exact-text edit mismatches",
      representativeSignature: first.signature,
      status: "active",
      count: 2,
      occurrenceIds: [first.id],
      cwdSummary: ["/Users/<user>/private/project"],
      tools: ["edit"],
      firstSeenAt: first.firstSeenAt,
      lastSeenAt: first.lastSeenAt,
      lastReflectedAt: null,
      score: 5,
    });
    const proposal: ReflectionProposal = {
      id: "refl-rules",
      clusterId: cluster.id,
      generatedAt: "2026-05-23T00:00:00.000Z",
      mode: "local",
      title: "Pattern: exact-text edit mismatches",
      summary: "Seen 2 related failures.",
      affected: ["tools: edit"],
      likelyFix: "Before editing, re-read /Users/alice/private/project/src/app.ts and use SECRET_TOKEN=abc123 carefully.",
      confidence: 0.75,
      evidence: store.getClusterEvidence(cluster.id, 3),
      limits: ["local only"],
      actions: ["make-rule"],
    };
    store.recordReflectionProposal(proposal);

    const candidate = store.createRuleCandidate({ sourceId: proposal.id, clusterId: cluster.id, draftText: proposal.likelyFix, proposedScope: "global", evidence: proposal.evidence });
    const duplicate = store.createRuleCandidate({ sourceId: proposal.id, clusterId: cluster.id, draftText: "different draft", proposedScope: "project", projectRoot: "/Users/alice/private/project", evidence: proposal.evidence });
    expect(duplicate.id).toBe(candidate.id);
    expect(store.count("rule_candidates")).toBe(1);
    expect(duplicate.draftText).not.toContain("abc123");
    expect(duplicate.draftText).not.toContain("/Users/alice");
    expect(duplicate.evidenceJson[0]?.sessionFile).toContain("<pi-session-file:");

    const rule = store.approveRuleCandidate(candidate.id, { scope: "global" });
    expect(rule?.status).toBe("active");
    expect(store.listActiveFlightRulesForCwd("/elsewhere")).toHaveLength(1);
    const projectCandidate = store.createRuleCandidate({ sourceId: "refl-project", clusterId: cluster.id, draftText: "Project only", proposedScope: "project", projectRoot: "/repo" });
    const projectRule = store.approveRuleCandidate(projectCandidate.id, { scope: "project", projectRoot: "/repo" });
    expect(store.listActiveFlightRulesForCwd("/repo/subdir").some((item) => item.id === projectRule?.id)).toBe(true);
    expect(store.listActiveFlightRulesForCwd("/repo2").some((item) => item.id === projectRule?.id)).toBe(false);
    store.rejectRuleCandidate(projectCandidate.id);
    expect(store.getFlightRule(projectRule!.id)?.status).toBe("disabled");
    expect(store.listActiveFlightRulesForCwd("/repo/subdir").some((item) => item.id === projectRule?.id)).toBe(false);
    store.markFlightRulesInjected([rule!.id], "2026-05-23T01:00:00.000Z");
    expect(store.getFlightRule(rule!.id)?.injectionCount).toBe(1);
    expect(store.disableFlightRule(rule!.id)?.status).toBe("disabled");
    expect(store.listActiveFlightRulesForCwd("/elsewhere")).toHaveLength(0);
    store.close();
  });

  it("migrates older local databases to current schema", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "pfr-migrate-"));
    const dbPath = path.join(dir, "flight.db");
    const legacy = new DatabaseSync(dbPath);
    legacy.exec(`
      CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      INSERT INTO meta(key, value) VALUES ('schemaVersion', '1');
      CREATE TABLE failure_occurrences (
        id TEXT PRIMARY KEY,
        dedupeKey TEXT NOT NULL UNIQUE,
        source TEXT NOT NULL,
        toolName TEXT,
        command TEXT,
        cwd TEXT,
        sessionFile TEXT,
        entryId TEXT,
        timestamp TEXT,
        signature TEXT NOT NULL,
        queryPreview TEXT NOT NULL,
        snippet TEXT NOT NULL,
        firstSeenAt TEXT NOT NULL,
        lastSeenAt TEXT NOT NULL
      );
    `);
    legacy.close();

    const store = new FlightRecorderStore(dbPath);
    const occurrence = store.recordFailureOccurrence({ source: "tool_result", query: "ENOENT missing", entryId: "legacy-1" });

    expect(occurrence.repeatCount).toBe(1);
    expect(store.count("feedback_actions")).toBe(0);
    expect(store.count("failure_clusters")).toBe(0);
    store.close();
  });

  it("builds safe FTS queries from path-like text", () => {
    expect(buildFtsQuery("src/config/paths.ts Error: E_NOENT")).toContain('"paths"');
    expect(buildFtsQuery("a")).toBe("");
  });
});
