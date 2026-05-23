import { describe, expect, it } from "vitest";
import { extractFailureEpisodes } from "./extractor.js";
import { parseSessionJsonl } from "./session-parser.js";

function line(value: unknown): string {
  return JSON.stringify(value);
}

const header = { type: "session", version: 3, id: "sess-extract", timestamp: "2026-05-22T01:00:00.000Z", cwd: "/repo" };

describe("failure episode extractor", () => {
  it("extracts observed failure, attempts, and likely resolution", () => {
    const parsed = parseSessionJsonl([
      line(header),
      line({ type: "message", id: "u0000001", parentId: null, timestamp: "2026-05-22T01:00:01.000Z", message: { role: "user", content: "tests are failing", timestamp: 1 } }),
      line({ type: "message", id: "fail0001", parentId: "u0000001", timestamp: "2026-05-22T01:00:02.000Z", message: { role: "bashExecution", command: "npm test", output: "Error: Cannot find module '../paths'\n    at src/config/app.ts:12:3", exitCode: 1, cancelled: false, truncated: false, timestamp: 2 } }),
      line({ type: "message", id: "a0000001", parentId: "fail0001", timestamp: "2026-05-22T01:00:03.000Z", message: { role: "assistant", content: [{ type: "text", text: "I'll update src/config/paths.ts and rerun the tests." }], stopReason: "stop", timestamp: 3 } }),
      line({ type: "message", id: "edit0001", parentId: "a0000001", timestamp: "2026-05-22T01:00:04.000Z", message: { role: "toolResult", toolName: "edit", isError: false, content: [{ type: "text", text: "Updated src/config/paths.ts" }], timestamp: 4 } }),
      line({ type: "message", id: "pass0001", parentId: "edit0001", timestamp: "2026-05-22T01:00:05.000Z", message: { role: "bashExecution", command: "npm test", output: "pass", exitCode: 0, cancelled: false, truncated: false, timestamp: 5 } }),
    ].join("\n"), "/tmp/session.jsonl");

    const episodes = extractFailureEpisodes(parsed);
    expect(episodes).toHaveLength(1);
    expect(episodes[0]?.status).toBe("resolved");
    expect(episodes[0]?.problemSummary).toContain("Cannot find module");
    expect(episodes[0]?.attempts.map((attempt) => attempt.summary).join("\n")).toContain("src/config/paths.ts");
    expect(episodes[0]?.resolution?.summary).toBe("Validation passed: npm test");
    expect(episodes[0]?.files).toContain("src/config/app.ts");
    expect(episodes[0]?.confidence).toBeGreaterThan(0.8);
  });

  it("does not link sibling-branch validation as a resolution", () => {
    const parsed = parseSessionJsonl([
      line(header),
      line({ type: "message", id: "root0001", parentId: null, timestamp: "2026-05-22T01:00:01.000Z", message: { role: "user", content: "try it", timestamp: 1 } }),
      line({ type: "message", id: "fail0001", parentId: "root0001", timestamp: "2026-05-22T01:00:02.000Z", message: { role: "bashExecution", command: "npm test", output: "fail in src/a.ts", exitCode: 1, cancelled: false, truncated: false, timestamp: 2 } }),
      line({ type: "branch_summary", id: "sum00001", parentId: "root0001", fromId: "fail0001", timestamp: "2026-05-22T01:00:03.000Z", summary: "abandoned failed path" }),
      line({ type: "message", id: "pass0001", parentId: "sum00001", timestamp: "2026-05-22T01:00:04.000Z", message: { role: "bashExecution", command: "npm test", output: "pass", exitCode: 0, cancelled: false, truncated: false, timestamp: 4 } }),
    ].join("\n"));

    const [episode] = extractFailureEpisodes(parsed);
    expect(episode?.status).toBe("unresolved");
    expect(episode?.resolution).toBeNull();
    expect(episode?.limits.join("\n")).toContain("No passing validation");
  });

  it("redacts secret-like values from derived snippets", () => {
    const parsed = parseSessionJsonl([
      line(header),
      line({ type: "message", id: "fail0001", parentId: null, timestamp: "2026-05-22T01:00:02.000Z", message: { role: "bashExecution", command: "npm test", output: "API_KEY=sk-live-secret token: abc123 Error in src/secret.ts", exitCode: 1, cancelled: false, truncated: false, timestamp: 2 } }),
    ].join("\n"));

    const [episode] = extractFailureEpisodes(parsed);
    expect(episode?.observed).toContain("API_KEY=[REDACTED]");
    expect(episode?.observed).toContain("token=[REDACTED]");
    expect(episode?.observed).not.toContain("sk-live-secret");
    expect(episode?.observed).not.toContain("abc123");
  });

  it("keeps unresolved failures searchable and honest", () => {
    const parsed = parseSessionJsonl([
      line(header),
      line({ type: "message", id: "tool0001", parentId: null, timestamp: "2026-05-22T01:00:02.000Z", message: { role: "toolResult", toolName: "read", isError: true, content: [{ type: "text", text: "ENOENT: missing file src/missing.ts" }], timestamp: 2 } }),
    ].join("\n"));

    const [episode] = extractFailureEpisodes(parsed);
    expect(episode?.status).toBe("unresolved");
    expect(episode?.problemSummary).toContain("read");
    expect(episode?.sourceRefs[0]?.entryId).toBe("tool0001");
  });
});
