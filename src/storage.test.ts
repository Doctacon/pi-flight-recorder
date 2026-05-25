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

  it("stores redacted expectation deltas, detector signals, artifact candidates, outcomes, and reroutes separately", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "pfr-deltas-"));
    const dbPath = path.join(dir, "flight.db");
    const store = new FlightRecorderStore(dbPath);
    const evidence = [
      {
        sourceType: "session-entry" as const,
        sourceId: "entry-1",
        sourceFile: "/Users/alice/.pi/agent/sessions/private/session.jsonl",
        sessionFile: "/Users/alice/.pi/agent/sessions/private/session.jsonl",
        cwd: "/Users/alice/private/project",
        entryId: "entry-1",
        timestamp: "2026-05-23T00:00:00.000Z",
        snippet: "User correction said API_KEY=secret-value was wrong in /Users/alice/private/project/src/storage.ts",
        note: "Observed in local session TOKEN=abc123",
      },
    ];

    const delta = store.createExpectationDelta({
      source: "detector",
      summary: "Assistant misunderstood storage boundary with API_KEY=secret-value in /Users/alice/private/project/src/storage.ts",
      expectation: "Storage owns repository behavior; mapper code belongs elsewhere. TOKEN=abc123",
      reality: "Assistant edited /Users/alice/private/project/src/storage.ts directly and leaked password=hunter2 in notes.",
      impact: "Repeated review churn in /Users/alice/private/project",
      severity: "medium",
      cwd: "/Users/alice/private/project",
      sourceSessionFile: "/Users/alice/.pi/agent/sessions/private/session.jsonl",
      sourceEntryId: "entry-1",
      evidenceRefs: evidence,
      metadata: { rawPrompt: "please inspect /Users/alice/private/project with API_KEY=secret-value" },
      now: "2026-05-23T00:00:00.000Z",
    });

    expect(delta.status).toBe("candidate");
    expect(delta.summary).not.toContain("secret-value");
    expect(delta.expectation).not.toContain("abc123");
    expect(delta.reality).not.toContain("hunter2");
    expect(delta.cwd).toContain("/Users/<user>");
    expect(delta.sourceSessionFile).toContain("<pi-session-file:");
    expect(delta.evidenceRefs[0]?.snippet).not.toContain("secret-value");
    expect(JSON.stringify(delta.metadata)).not.toContain("secret-value");

    const signal = store.recordDeltaDetectorSignal({
      deltaId: delta.id,
      type: "user-correction",
      explanation: "User said no, storage mapping lives elsewhere; AUTH_TOKEN=raw-token",
      confidence: 0.72,
      evidenceRefs: evidence,
      metadata: { path: "/Users/alice/private/project/src/storage.ts", token: "TOKEN=abc123" },
      now: "2026-05-23T00:01:00.000Z",
    });
    expect(signal.explanation).not.toContain("raw-token");
    expect(store.listDeltaDetectorSignals(delta.id)).toHaveLength(1);

    const accepted = store.acceptExpectationDelta(delta.id, {
      expectation: "Keep storage and mappers separate.",
      reality: "Assistant crossed the seam twice.",
      severity: "high",
      now: "2026-05-23T00:02:00.000Z",
    });
    expect(accepted?.status).toBe("accepted");
    expect(accepted?.severity).toBe("high");

    const candidate = store.createArtifactCandidate({
      deltaId: delta.id,
      artifactType: "code-legibility",
      title: "Refactor storage mapper seam TOKEN=abc123",
      rationale: "A rule would remind the assistant, but code shape caused repeated confusion in /Users/alice/private/project.",
      proposedDraft: "Create a refactor ticket; do not edit /Users/alice/private/project/src/storage.ts automatically. API_KEY=secret-value",
      nextStep: "Open Loom ticket candidate for mapper seam.",
      confidence: 0.8,
      limits: ["Only two examples from /Users/alice/private/project"],
      evidenceRefs: evidence,
      now: "2026-05-23T00:03:00.000Z",
    });

    expect(candidate.status).toBe("pending-review");
    expect(candidate.artifactType).toBe("code-legibility");
    expect(candidate.title).not.toContain("abc123");
    expect(candidate.proposedDraft).not.toContain("secret-value");
    expect(candidate.evidenceRefs[0]?.sessionFile).toContain("<pi-session-file:");
    expect(store.getExpectationDelta(delta.id)?.status).toBe("routed");
    expect(store.getExpectationDelta(delta.id)?.activeArtifactCandidateId).toBe(candidate.id);

    expect(store.acceptArtifactCandidate(candidate.id, "2026-05-23T00:04:00.000Z")?.status).toBe("accepted");
    const applied = store.markArtifactCandidateApplied(candidate.id, { appliedArtifactRef: "/Users/alice/private/project/.loom/tickets/refactor.md TOKEN=abc123", now: "2026-05-23T00:05:00.000Z" });
    expect(applied?.applied).toBe(true);
    expect(applied?.appliedArtifactRef).not.toContain("abc123");
    const resolved = store.updateArtifactCandidateOutcome(candidate.id, { outcome: "helped", outcomeSummary: "No recurrence after refactor ticket was applied.", now: "2026-05-23T00:06:00.000Z" });
    expect(resolved?.status).toBe("resolved");
    expect(resolved?.outcome).toBe("helped");

    const rerouteCandidate = store.createArtifactCandidate({
      deltaId: delta.id,
      artifactType: "loom-ticket",
      title: "Alternative route",
      rationale: "Reroute to a narrower Loom ticket.",
      supersedesCandidateId: candidate.id,
      routeDelta: false,
      now: "2026-05-23T00:07:00.000Z",
    });
    const rerouted = store.rerouteExpectationDelta(delta.id, rerouteCandidate.id, "Manual reroute after outcome review", "2026-05-23T00:08:00.000Z");
    expect(rerouted?.activeArtifactCandidateId).toBe(rerouteCandidate.id);
    expect(store.getArtifactCandidate(candidate.id)?.outcome).toBe("helped");

    const recurrence = store.linkDeltaRecurrence({
      deltaId: delta.id,
      priorArtifactCandidateId: candidate.id,
      reason: "Similar delta recurred after artifact application in /Users/alice/private/project",
      similarity: 0.91,
      evidenceRefs: evidence,
      now: "2026-05-23T00:09:00.000Z",
    });
    expect(recurrence.similarity).toBe(0.91);
    expect(store.listDeltaRecurrenceLinks({ priorArtifactCandidateId: candidate.id })).toHaveLength(1);
    expect(store.listArtifactCandidates({ deltaId: delta.id })).toHaveLength(2);
    expect(store.listExpectationDeltas({ status: "routed" })[0]?.id).toBe(delta.id);

    const dismissedDelta = store.createExpectationDelta({
      source: "manual",
      summary: "One-off confusion to dismiss",
      now: "2026-05-23T00:10:00.000Z",
    });
    expect(store.dismissExpectationDelta(dismissedDelta.id, "Not recurring", "2026-05-23T00:11:00.000Z")?.status).toBe("dismissed");
    expect(store.listExpectationDeltas({ status: "dismissed" })[0]?.id).toBe(dismissedDelta.id);

    expect(store.count("expectation_deltas")).toBe(2);
    expect(store.count("delta_detector_signals")).toBe(1);
    expect(store.count("artifact_candidates")).toBe(2);
    expect(store.count("delta_recurrence_links")).toBe(1);
    store.close();

    const db = new DatabaseSync(dbPath);
    const rawDelta = db.prepare("SELECT summary, expectation, reality, cwd, sourceSessionFile, evidenceJson, metadataJson FROM expectation_deltas WHERE id = ?").get(delta.id) as Record<string, string>;
    const rawCandidate = db.prepare("SELECT title, proposedDraft, appliedArtifactRef, evidenceJson FROM artifact_candidates WHERE id = ?").get(candidate.id) as Record<string, string>;
    db.close();
    expect(JSON.stringify(rawDelta)).not.toContain("secret-value");
    expect(JSON.stringify(rawDelta)).not.toContain("/Users/alice");
    expect(JSON.stringify(rawCandidate)).not.toContain("abc123");
    expect(JSON.stringify(rawCandidate)).not.toContain("/Users/alice");
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
    expect(store.count("expectation_deltas")).toBe(0);
    expect(store.count("delta_detector_signals")).toBe(0);
    expect(store.count("artifact_candidates")).toBe(0);
    expect(store.count("delta_recurrence_links")).toBe(0);
    store.close();

    const migrated = new DatabaseSync(dbPath);
    expect((migrated.prepare("PRAGMA user_version").get() as { user_version: number }).user_version).toBe(4);
    const tables = migrated.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('expectation_deltas', 'delta_detector_signals', 'artifact_candidates', 'delta_recurrence_links') ORDER BY name").all() as Array<{ name: string }>;
    migrated.close();
    expect(tables.map((row) => row.name)).toEqual(["artifact_candidates", "delta_detector_signals", "delta_recurrence_links", "expectation_deltas"]);
  });

  it("builds safe FTS queries from path-like text", () => {
    expect(buildFtsQuery("src/config/paths.ts Error: E_NOENT")).toContain('"paths"');
    expect(buildFtsQuery("a")).toBe("");
  });
});
