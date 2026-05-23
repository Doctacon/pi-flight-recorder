import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { listSessionFiles, parseSessionFile, parseSessionJsonl } from "./session-parser.js";

const header = { type: "session", version: 3, id: "sess-1", timestamp: "2026-05-22T01:00:00.000Z", cwd: "/repo" };

function line(value: unknown): string {
  return JSON.stringify(value);
}

describe("Pi session parser", () => {
  it("parses v3 JSONL into provenance-rich events", () => {
    const jsonl = [
      line(header),
      line({ type: "message", id: "u0000001", parentId: null, timestamp: "2026-05-22T01:00:01.000Z", message: { role: "user", content: "run tests", timestamp: 1 } }),
      line({ type: "message", id: "b0000001", parentId: "u0000001", timestamp: "2026-05-22T01:00:02.000Z", message: { role: "bashExecution", command: "npm test", output: "Error: Cannot find module '../paths'\n at src/config/app.ts:12", exitCode: 1, cancelled: false, truncated: false, timestamp: 2 } }),
    ].join("\n");

    const parsed = parseSessionJsonl(jsonl, "/tmp/session.jsonl");

    expect(parsed.header?.cwd).toBe("/repo");
    expect(parsed.events).toHaveLength(2);
    expect(parsed.events[1]?.kind).toBe("bash");
    expect(parsed.events[1]?.command).toBe("npm test");
    expect(parsed.events[1]?.exitCode).toBe(1);
    expect(parsed.events[1]?.source).toMatchObject({
      sourceFile: "/tmp/session.jsonl",
      sessionId: "sess-1",
      cwd: "/repo",
      entryId: "b0000001",
      parentId: "u0000001",
      entryType: "message",
      role: "bashExecution",
    });
    expect(parsed.events[1]?.source.ancestry).toEqual(["u0000001", "b0000001"]);
  });

  it("preserves errored tool results", () => {
    const jsonl = [
      line(header),
      line({ type: "message", id: "t0000001", parentId: null, timestamp: "2026-05-22T01:00:01.000Z", message: { role: "toolResult", toolName: "read", toolCallId: "call-1", isError: true, content: [{ type: "text", text: "ENOENT: missing file" }], timestamp: 1 } }),
    ].join("\n");

    const parsed = parseSessionJsonl(jsonl);
    expect(parsed.events[0]?.kind).toBe("toolResult");
    expect(parsed.events[0]?.toolName).toBe("read");
    expect(parsed.events[0]?.isError).toBe(true);
    expect(parsed.events[0]?.text).toContain("ENOENT");
  });

  it("keeps branch ancestry distinguishable", () => {
    const jsonl = [
      line(header),
      line({ type: "message", id: "root0001", parentId: null, timestamp: "2026-05-22T01:00:01.000Z", message: { role: "user", content: "try it", timestamp: 1 } }),
      line({ type: "message", id: "fail0001", parentId: "root0001", timestamp: "2026-05-22T01:00:02.000Z", message: { role: "bashExecution", command: "npm test", output: "fail", exitCode: 1, cancelled: false, truncated: false, timestamp: 2 } }),
      line({ type: "branch_summary", id: "sum00001", parentId: "root0001", fromId: "fail0001", timestamp: "2026-05-22T01:00:03.000Z", summary: "abandoned failing path" }),
      line({ type: "message", id: "pass0001", parentId: "sum00001", timestamp: "2026-05-22T01:00:04.000Z", message: { role: "bashExecution", command: "npm test", output: "pass", exitCode: 0, cancelled: false, truncated: false, timestamp: 4 } }),
    ].join("\n");

    const parsed = parseSessionJsonl(jsonl);
    const fail = parsed.events.find((event) => event.source.entryId === "fail0001");
    const pass = parsed.events.find((event) => event.source.entryId === "pass0001");

    expect(fail?.source.ancestry).toEqual(["root0001", "fail0001"]);
    expect(pass?.source.ancestry).toEqual(["root0001", "sum00001", "pass0001"]);
    expect(pass?.source.ancestry).not.toContain("fail0001");
  });

  it("warns on malformed lines and unknown entries without aborting", () => {
    const jsonl = [
      line(header),
      "{not json",
      line({ type: "unknown_kind", id: "x0000001", parentId: null, timestamp: "2026-05-22T01:00:01.000Z", data: true }),
    ].join("\n");

    const parsed = parseSessionJsonl(jsonl);
    expect(parsed.events).toHaveLength(1);
    expect(parsed.events[0]?.kind).toBe("unknown");
    expect(parsed.warnings.map((warning) => warning.message).join("\n")).toContain("Malformed JSONL line");
  });

  it("discovers and parses session files from directories", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "pfr-parser-"));
    const nested = path.join(dir, "--repo--");
    await writeFile(path.join(dir, "ignore.txt"), "nope");
    await import("node:fs/promises").then((fs) => fs.mkdir(nested));
    const sessionFile = path.join(nested, "session.jsonl");
    await writeFile(sessionFile, `${line(header)}\n`);

    await expect(listSessionFiles([dir])).resolves.toEqual([sessionFile]);
    await expect(parseSessionFile(sessionFile)).resolves.toMatchObject({ sourceFile: sessionFile });
  });
});
