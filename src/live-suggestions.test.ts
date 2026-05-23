import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LiveSuggestionEngine, formatLiveSuggestion } from "./live-suggestions.js";
import { defaultDatabasePath, FlightRecorderStore } from "./storage.js";
import { syncSessionFile } from "./sync.js";

function line(value: unknown): string {
  return JSON.stringify(value);
}

async function writeResolvedSession(dir: string, id: string, cwd: string, failureId: string, command = "npm test"): Promise<string> {
  const file = path.join(dir, `${id}.jsonl`);
  await writeFile(
    file,
    [
      line({ type: "session", version: 3, id, timestamp: "2026-05-22T01:00:00.000Z", cwd }),
      line({ type: "message", id: failureId, parentId: null, timestamp: "2026-05-22T01:00:02.000Z", message: { role: "bashExecution", command, output: "Error: Cannot find module '../paths'\n at src/config/app.ts:12", exitCode: 1, cancelled: false, truncated: false, timestamp: 2 } }),
      line({ type: "message", id: `${failureId}-a`, parentId: failureId, timestamp: "2026-05-22T01:00:03.000Z", message: { role: "assistant", content: [{ type: "text", text: "Update src/config/paths.ts and rerun tests." }], timestamp: 3 } }),
      line({ type: "message", id: `${failureId}-p`, parentId: `${failureId}-a`, timestamp: "2026-05-22T01:00:04.000Z", message: { role: "bashExecution", command, output: "pass", exitCode: 0, cancelled: false, truncated: false, timestamp: 4 } }),
    ].join("\n"),
  );
  return file;
}

describe("LiveSuggestionEngine", () => {
  it("returns evidence-backed suggestions for similar prior resolved failures", async () => {
    const sourceDir = await mkdtemp(path.join(tmpdir(), "pfr-live-suggest-src-"));
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-live-suggest-data-"));
    await syncSessionFile(await writeResolvedSession(sourceDir, "prior", "/repo", "fail0001"), { dataDir });
    const engine = new LiveSuggestionEngine({ dataDir, mode: "suggest-on-failure", now: () => 1_000 });

    const decision = engine.evaluate({ query: "npm test Error Cannot find module src/config/app.ts", cwd: "/repo", source: "tool_result" });

    expect(decision.kind).toBe("suggestion");
    if (decision.kind !== "suggestion") throw new Error("expected suggestion");
    expect(decision.suggestion.priorFix).toBe("Validation passed: npm test");
    expect(decision.suggestion.evidence[0]?.entryId).toBe("fail0001");
    expect(formatLiveSuggestion(decision)).toContain("Prior fix: Validation passed: npm test");
  });

  it("excludes the current episode from its own live query", async () => {
    const sourceDir = await mkdtemp(path.join(tmpdir(), "pfr-live-exclude-src-"));
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-live-exclude-data-"));
    const syncResult = await syncSessionFile(await writeResolvedSession(sourceDir, "current", "/repo", "fail0001"), { dataDir });
    const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
    const episode = store.getEpisode(syncResult.newEpisodeIds[0] ?? "");
    store.close();
    if (!episode) throw new Error("missing episode");

    const engine = new LiveSuggestionEngine({ dataDir, mode: "suggest-on-failure", now: () => 1_000 });
    const decision = engine.evaluate(episode);

    expect(decision.kind).toBe("suppressed");
    expect(decision.kind === "suppressed" ? decision.reason : "").toBe("no-match");
  });

  it("prefers same-cwd matches and labels cross-project fallback", async () => {
    const sourceDir = await mkdtemp(path.join(tmpdir(), "pfr-live-cwd-src-"));
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-live-cwd-data-"));
    await syncSessionFile(await writeResolvedSession(sourceDir, "cross", "/other", "cross001"), { dataDir });
    await syncSessionFile(await writeResolvedSession(sourceDir, "same", "/repo", "same0001"), { dataDir });
    const engine = new LiveSuggestionEngine({ dataDir, mode: "suggest-on-failure", now: () => 1_000 });

    const sameDecision = engine.evaluate({ query: "Cannot find module paths app", cwd: "/repo" });
    expect(sameDecision.kind).toBe("suggestion");
    if (sameDecision.kind !== "suggestion") throw new Error("expected same-cwd suggestion");
    expect(sameDecision.suggestion.episode.cwd).toBe("/repo");
    expect(sameDecision.suggestion.crossProject).toBe(false);

    const crossEngine = new LiveSuggestionEngine({ dataDir, mode: "suggest-on-failure", now: () => 2_000 });
    const crossDecision = crossEngine.evaluate({ query: "Cannot find module paths app", cwd: "/missing" });
    expect(crossDecision.kind).toBe("suggestion");
    if (crossDecision.kind !== "suggestion") throw new Error("expected cross-cwd suggestion");
    expect(crossDecision.suggestion.crossProject).toBe(true);
    expect(crossDecision.suggestion.limits.join("\n")).toContain("different cwd");
  });

  it("suppresses by mode, low confidence, cooldown, and max window", async () => {
    const sourceDir = await mkdtemp(path.join(tmpdir(), "pfr-live-noise-src-"));
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-live-noise-data-"));
    await syncSessionFile(await writeResolvedSession(sourceDir, "prior", "/repo", "fail0001"), { dataDir });

    const off = new LiveSuggestionEngine({ dataDir, mode: "off" });
    expect(off.evaluate({ query: "Cannot find module", cwd: "/repo" }).kind).toBe("suppressed");

    const quiet = new LiveSuggestionEngine({ dataDir, mode: "index-only" });
    const quietDecision = quiet.evaluate({ query: "Cannot find module", cwd: "/repo" });
    expect(quietDecision.kind === "suppressed" ? quietDecision.reason : "").toBe("index-only");

    const strict = new LiveSuggestionEngine({ dataDir, mode: "suggest-on-failure", minConfidence: 0.99 });
    const strictDecision = strict.evaluate({ query: "Cannot find module", cwd: "/repo" });
    expect(strictDecision.kind === "suppressed" ? strictDecision.reason : "").toBe("low-confidence");

    let now = 1_000;
    const cooldown = new LiveSuggestionEngine({ dataDir, mode: "suggest-on-failure", cooldownMs: 60_000, now: () => now });
    expect(cooldown.evaluate({ query: "npm test Error Cannot find module ../paths src/config/app.ts", cwd: "/repo" }).kind).toBe("suggestion");
    now = 2_000;
    const cooled = cooldown.evaluate({ query: "npm test Error Cannot find module ../paths src/config/app.ts", cwd: "/repo" });
    expect(cooled.kind === "suppressed" ? cooled.reason : "").toBe("cooldown");
    expect(cooldown.status().suppressionCounts.cooldown).toBe(1);

    const maxed = new LiveSuggestionEngine({ dataDir, mode: "suggest-on-failure", cooldownMs: 0, maxSuggestionsPerWindow: 1, now: () => 10_000 });
    expect(maxed.evaluate({ query: "npm test Error Cannot find module ../paths src/config/app.ts one", cwd: "/repo" }).kind).toBe("suggestion");
    const maxedDecision = maxed.evaluate({ query: "npm test Error Cannot find module ../paths src/config/app.ts two", cwd: "/repo" });
    expect(maxedDecision.kind === "suppressed" ? maxedDecision.reason : "").toBe("max-suggestions");
  });

  it("keeps broad or silenced matches quiet for reflection", async () => {
    const sourceDir = await mkdtemp(path.join(tmpdir(), "pfr-live-broad-src-"));
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-live-broad-data-"));
    await syncSessionFile(await writeResolvedSession(sourceDir, "prior", "/repo", "fail0001"), { dataDir });

    const broad = new LiveSuggestionEngine({ dataDir, mode: "suggest-on-failure", now: () => 1_000 });
    const broadDecision = broad.evaluate({ query: "Cannot find module", cwd: "/repo" });
    expect(broadDecision.kind === "suppressed" ? broadDecision.reason : "").toBe("broad-match");

    const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
    const signature = "npm test error cannot find module ../paths src/config/app.ts";
    store.recordFeedbackAction({ targetType: "signature", targetId: signature, action: "silence-pattern", signature, expiresAt: "2999-01-01T00:00:00.000Z" });
    store.close();
    const silenced = new LiveSuggestionEngine({ dataDir, mode: "suggest-on-failure", now: () => 2_000 });
    const silencedDecision = silenced.evaluate({ query: "npm test Error Cannot find module ../paths src/config/app.ts", cwd: "/repo" });
    expect(silencedDecision.kind === "suppressed" ? silencedDecision.reason : "").toBe("silenced");
  });
});
