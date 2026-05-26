import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildModelReflectionPrompt, formatReflectionDigest, runReflection } from "./reflection.js";
import { defaultDatabasePath, FlightRecorderStore } from "./storage.js";
import { syncSessionFile } from "./sync.js";

function line(value: unknown): string {
  return JSON.stringify(value);
}

async function writeResolvedSession(dir: string): Promise<string> {
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, "resolved.jsonl");
  await writeFile(
    file,
    [
      line({ type: "session", version: 3, id: "sess-reflect", timestamp: "2026-05-22T01:00:00.000Z", cwd: "/repo" }),
      line({ type: "message", id: "fail-reflect", parentId: null, timestamp: "2026-05-22T01:00:02.000Z", message: { role: "bashExecution", command: "npm test", output: "Error: Cannot find module '../paths' at src/config/app.ts:12", exitCode: 1, cancelled: false, truncated: false, timestamp: 2 } }),
      line({ type: "message", id: "pass-reflect", parentId: "fail-reflect", timestamp: "2026-05-22T01:00:04.000Z", message: { role: "bashExecution", command: "npm test", output: "pass", exitCode: 0, cancelled: false, truncated: false, timestamp: 4 } }),
    ].join("\n"),
  );
  return file;
}

describe("reflection", () => {
  it("generates local pattern proposals without model calls", async () => {
    const sourceDir = await mkdtemp(path.join(tmpdir(), "pfr-reflect-src-"));
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-reflect-data-"));
    await syncSessionFile(await writeResolvedSession(sourceDir), { dataDir });
    const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
    store.recordFailureOccurrence({ source: "tool_result", query: "npm test Error Cannot find module '../paths' at src/config/app.ts:12", toolName: "bash", command: "npm test", cwd: "/repo", entryId: "occ-1" });
    store.recordFailureOccurrence({ source: "tool_result", query: "npm test Error Cannot find module '../paths' at src/config/app.ts:22", toolName: "bash", command: "npm test", cwd: "/repo", entryId: "occ-2" });
    store.close();

    const result = await runReflection({ dataDir, trigger: "manual", minCount: 2, now: "2026-05-23T00:00:00.000Z" });

    expect(result.proposals).toHaveLength(1);
    expect(result.proposals[0]?.mode).toBe("local");
    expect(result.proposals[0]?.likelyFix).toContain("Prior local resolution observed");
    expect(formatReflectionDigest(result)).toContain("review interactively: /flight-learn review");
  });

  it("allows expired snooze feedback to become eligible again", async () => {
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-reflect-expired-snooze-"));
    const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
    const occurrence = store.recordFailureOccurrence({ source: "tool_result", query: "Edit failed: oldText not found", toolName: "edit", cwd: "/repo", entryId: "s1" });
    store.recordFailureOccurrence({ source: "tool_result", query: "Edit failed: oldText not found", toolName: "edit", cwd: "/repo", entryId: "s2" });
    store.recordFeedbackAction({ targetType: "occurrence", targetId: occurrence.id, action: "snooze", signature: occurrence.signature, expiresAt: "2026-05-22T00:00:00.000Z" });
    store.close();

    const result = await runReflection({ dataDir, trigger: "manual", minCount: 2, now: "2026-05-23T00:00:00.000Z" });

    expect(result.proposals).toHaveLength(1);
  });

  it("uses bounded redacted model context only when explicitly requested", async () => {
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-reflect-model-"));
    const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
    store.recordFailureOccurrence({ source: "tool_result", query: "Edit failed: oldText not found SECRET_TOKEN=abc123 at /Users/alice/private/project/src/app.ts", toolName: "edit", cwd: "/Users/alice/private/project", sessionFile: "/Users/alice/.pi/agent/sessions/--private-project--/session.jsonl", entryId: "m1" });
    store.recordFailureOccurrence({ source: "tool_result", query: "Edit failed: oldText not found SECRET_TOKEN=def456 at /Users/alice/private/project/src/app.ts", toolName: "edit", cwd: "/Users/alice/private/project", sessionFile: "/Users/alice/.pi/agent/sessions/--private-project--/session.jsonl", entryId: "m2" });
    store.close();

    let capturedPrompt = "";
    const result = await runReflection({
      dataDir,
      trigger: "manual",
      minCount: 2,
      useModel: true,
      now: "2026-05-23T00:00:00.000Z",
      modelProvider: {
        complete: async (prompt) => {
          capturedPrompt = prompt;
          return "Always read the current file block before issuing exact text edits.";
        },
      },
    });

    expect(result.proposals[0]?.mode).toBe("model-assisted");
    expect(result.proposals[0]?.likelyFix).toContain("Always read");
    expect(capturedPrompt).not.toContain("abc123");
    expect(capturedPrompt).not.toContain("/Users/alice");
    expect(capturedPrompt).toContain("/Users/<user>");
    const rawPrompt = buildModelReflectionPrompt({
      ...result.mining.clusters[0]!,
      title: "raw /Users/alice/private cluster",
      cwdSummary: ["/Users/alice/private/project"],
    }, result.proposals[0]!.evidence);
    expect(rawPrompt).not.toContain("/Users/alice");
    expect(rawPrompt).toContain("/Users/<user>");
    expect(buildModelReflectionPrompt(result.mining.clusters[0]!, result.proposals[0]!.evidence)).toContain("redacted evidence");
  });
});
