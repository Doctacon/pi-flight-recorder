import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import extension from "./pi-extension.js";
import { defaultDatabasePath, FlightRecorderStore, getDefaultDataDir } from "./storage.js";

function line(value: unknown): string {
  return JSON.stringify(value);
}

async function makeSessionSource(): Promise<{ root: string; dataDir: string }> {
  const root = await mkdtemp(path.join(tmpdir(), "pfr-pi-source-"));
  const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-pi-data-"));
  const nested = path.join(root, "--repo--");
  await mkdir(nested);
  await writeFile(
    path.join(nested, "session.jsonl"),
    [
      line({ type: "session", version: 3, id: "sess-pi", timestamp: "2026-05-22T01:00:00.000Z", cwd: "/repo" }),
      line({ type: "message", id: "fail0001", parentId: null, timestamp: "2026-05-22T01:00:02.000Z", message: { role: "bashExecution", command: "npm test", output: "Error: Cannot find module '../paths' at src/config/app.ts:12", exitCode: 1, cancelled: false, truncated: false, timestamp: 2 } }),
      line({ type: "message", id: "pass0001", parentId: "fail0001", timestamp: "2026-05-22T01:00:04.000Z", message: { role: "bashExecution", command: "npm test", output: "pass", exitCode: 0, cancelled: false, truncated: false, timestamp: 4 } }),
    ].join("\n"),
  );
  return { root, dataDir };
}

describe("Pi extension wrapper", () => {
  it("registers commands, live hooks, and a query tool", () => {
    const commands = new Map<string, unknown>();
    const events = new Map<string, unknown>();
    const tools: unknown[] = [];
    extension({
      registerCommand: (name, command) => commands.set(name, command),
      registerTool: (tool) => tools.push(tool),
      on: (eventName, handler) => events.set(eventName, handler),
    });

    expect(commands.has("flight-sync")).toBe(true);
    expect(commands.has("seen-this-before")).toBe(true);
    expect(commands.has("flight-mode")).toBe(true);
    expect(commands.has("flight-watch")).toBe(true);
    expect(commands.has("flight-status")).toBe(true);
    expect(commands.has("flight-feedback")).toBe(true);
    expect(commands.has("flight-reflect")).toBe(true);
    expect(events.has("session_start")).toBe(true);
    expect(events.has("tool_result")).toBe(true);
    expect(events.has("user_bash")).toBe(true);
    expect(tools).toHaveLength(1);
  });

  it("autostarts quiet local capture on session_start and reports status without CLI", async () => {
    const originalHome = process.env.HOME;
    const tempHome = await mkdtemp(path.join(tmpdir(), "pfr-home-"));
    process.env.HOME = tempHome;
    try {
      const sessionRoot = path.join(tempHome, ".pi", "agent", "sessions", "--repo--");
      await mkdir(sessionRoot, { recursive: true });
      await writeFile(
        path.join(sessionRoot, "session.jsonl"),
        [
          line({ type: "session", version: 3, id: "sess-auto", timestamp: "2026-05-22T01:00:00.000Z", cwd: "/repo" }),
          line({ type: "message", id: "fail-auto", parentId: null, timestamp: "2026-05-22T01:00:02.000Z", message: { role: "bashExecution", command: "npm test", output: "Error: Cannot find module '../paths'", exitCode: 1, cancelled: false, truncated: false, timestamp: 2 } }),
        ].join("\n"),
      );
      const commands = new Map<string, { handler: (args: string, ctx: any) => Promise<void> }>();
      const events = new Map<string, (event: unknown, ctx: any) => Promise<void> | void>();
      extension({
        registerCommand: (name, command) => commands.set(name, command),
        on: (eventName, handler) => events.set(eventName, handler),
      });
      const notifications: string[] = [];
      const ctx = { cwd: "/repo", ui: { notify: (message: string) => notifications.push(message) }, sessionManager: { getCwd: () => "/repo", getSessionFile: () => null } };
      events.get("session_start")?.({}, ctx);
      await new Promise((resolve) => setTimeout(resolve, 800));
      await commands.get("flight-status")?.handler("", ctx);

      const output = notifications.join("\n");
      expect(output).toContain("Flight recorder: suggest-on-failure");
      expect(output).toContain("User-bash capture: disabled");
      const store = new FlightRecorderStore(defaultDatabasePath(getDefaultDataDir()));
      try {
        expect(store.count("episodes")).toBe(1);
      } finally {
        store.close();
      }
    } finally {
      if (originalHome === undefined) delete process.env.HOME;
      else process.env.HOME = originalHome;
    }
  });

  it("syncs and queries through registered commands", async () => {
    const { root, dataDir } = await makeSessionSource();
    const commands = new Map<string, { handler: (args: string, ctx: any) => Promise<void> }>();
    extension({ registerCommand: (name, command) => commands.set(name, command) });
    const notifications: string[] = [];
    const ctx = { ui: { notify: (message: string) => notifications.push(message) }, sessionManager: { getCwd: () => "/repo" } };

    await commands.get("flight-sync")?.handler(`--source ${root} --data-dir ${dataDir}`, ctx);
    expect(notifications.join("\n")).toContain("episodes 1");

    notifications.length = 0;
    await commands.get("seen-this-before")?.handler(`--data-dir ${dataDir} --cwd current Cannot find module`, ctx);
    const output = notifications.join("\n");
    expect(output).toContain("Seen before");
    expect(output).toContain("entry fail0001");
  });

  it("queries through the registered tool", async () => {
    const { root, dataDir } = await makeSessionSource();
    const commands = new Map<string, { handler: (args: string, ctx: any) => Promise<void> }>();
    const tools: Array<{ execute: (id: string, params: any) => Promise<{ content: Array<{ text: string }>; details: { resultCount: number } }> }> = [];
    extension({
      registerCommand: (name, command) => commands.set(name, command),
      registerTool: (tool) => tools.push(tool as (typeof tools)[number]),
    });
    await commands.get("flight-sync")?.handler(`--source ${root} --data-dir ${dataDir}`, { ui: { notify: () => undefined } });

    const response = await tools[0]?.execute("call-1", { query: "Cannot find module", dataDir });
    expect(response?.details.resultCount).toBe(1);
    expect(response?.content[0]?.text).toContain("Seen before");
  });

  it("suggests on failed tool_result without mutating the event", async () => {
    const { root, dataDir } = await makeSessionSource();
    const commands = new Map<string, { handler: (args: string, ctx: any) => Promise<void> }>();
    const events = new Map<string, (event: unknown, ctx: any) => Promise<void> | void>();
    extension({
      registerCommand: (name, command) => commands.set(name, command),
      on: (eventName, handler) => events.set(eventName, handler),
    });
    const notifications: string[] = [];
    const ctx = { cwd: "/repo", ui: { notify: (message: string) => notifications.push(message) }, sessionManager: { getCwd: () => "/repo", getSessionFile: () => null } };
    await commands.get("flight-sync")?.handler(`--source ${root} --data-dir ${dataDir}`, ctx);
    await commands.get("flight-mode")?.handler(`suggest-on-failure --data-dir ${dataDir}`, ctx);
    notifications.length = 0;
    const event = { toolName: "bash", input: { command: "npm test" }, isError: true, content: [{ type: "text", text: "Error: Cannot find module '../paths' at src/config/app.ts:12" }], details: { exitCode: 1 } };
    const before = JSON.stringify(event);

    await events.get("tool_result")?.(event, ctx);

    expect(JSON.stringify(event)).toBe(before);
    expect(notifications.join("\n")).toContain("Seen before");
    expect(notifications.join("\n")).toContain("Prior fix: Validation passed: npm test");

    notifications.length = 0;
    await events.get("tool_result")?.(event, ctx);
    expect(notifications).toEqual([]);
  });

  it("schedules delayed current-session sync for live failures", async () => {
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-pi-live-data-"));
    const sessionDir = await mkdtemp(path.join(tmpdir(), "pfr-pi-live-session-"));
    const sessionFile = path.join(sessionDir, "current.jsonl");
    await writeFile(
      sessionFile,
      [
        line({ type: "session", version: 3, id: "sess-live", timestamp: "2026-05-22T01:00:00.000Z", cwd: "/repo" }),
        line({ type: "message", id: "fail0001", parentId: null, timestamp: "2026-05-22T01:00:02.000Z", message: { role: "bashExecution", command: "npm test", output: "Error: Cannot find module '../paths'", exitCode: 1, cancelled: false, truncated: false, timestamp: 2 } }),
      ].join("\n"),
    );
    const commands = new Map<string, { handler: (args: string, ctx: any) => Promise<void> }>();
    const events = new Map<string, (event: unknown, ctx: any) => Promise<void> | void>();
    extension({
      registerCommand: (name, command) => commands.set(name, command),
      on: (eventName, handler) => events.set(eventName, handler),
    });
    const ctx = { cwd: "/repo", ui: { notify: () => undefined }, sessionManager: { getCwd: () => "/repo", getSessionFile: () => sessionFile } };
    await commands.get("flight-mode")?.handler(`index-only --data-dir ${dataDir}`, ctx);

    await events.get("tool_result")?.({ toolName: "bash", input: { command: "npm test" }, isError: true, content: "Error: Cannot find module", details: { exitCode: 1 } }, ctx);
    await new Promise((resolve) => setTimeout(resolve, 650));

    const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
    try {
      expect(store.count("episodes")).toBe(1);
    } finally {
      store.close();
    }
  });

  it("buffers no-match live failures as occurrences and accepts feedback", async () => {
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-pi-ledger-data-"));
    const commands = new Map<string, { handler: (args: string, ctx: any) => Promise<void> }>();
    const events = new Map<string, (event: unknown, ctx: any) => Promise<void> | void>();
    extension({
      registerCommand: (name, command) => commands.set(name, command),
      on: (eventName, handler) => events.set(eventName, handler),
    });
    const notifications: string[] = [];
    const ctx = { cwd: "/repo", ui: { notify: (message: string) => notifications.push(message) }, sessionManager: { getCwd: () => "/repo", getSessionFile: () => null } };
    await commands.get("flight-mode")?.handler(`suggest-on-failure --data-dir ${dataDir} --cooldown-ms 0`, ctx);
    notifications.length = 0;

    await events.get("tool_result")?.({ toolName: "bash", input: { command: "npm test" }, isError: true, content: "Novel Error: frobnicator exploded", details: { exitCode: 1 }, id: "tool-live-1" }, ctx);
    expect(notifications).toEqual([]);

    const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
    try {
      const occurrence = store.listFailureOccurrences({ limit: 1 })[0];
      expect(occurrence?.suggestion?.kind).toBe("suppressed");
      expect(occurrence?.suggestion?.reason).toBe("no-match");
      if (!occurrence) throw new Error("missing occurrence");
      await commands.get("flight-feedback")?.handler(`--action snooze --occurrence ${occurrence.id}`, ctx);
      expect(store.hasActiveSignatureSuppression(occurrence.signature)?.action).toBe("snooze");
    } finally {
      store.close();
    }
  });

  it("renders reflection digests from repeated buffered failures", async () => {
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-pi-reflect-data-"));
    const commands = new Map<string, { handler: (args: string, ctx: any) => Promise<void> }>();
    extension({ registerCommand: (name, command) => commands.set(name, command) });
    const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
    try {
      store.recordFailureOccurrence({ source: "tool_result", query: "Edit failed: oldText not found in src/app.ts", toolName: "edit", cwd: "/repo", entryId: "r1" });
      store.recordFailureOccurrence({ source: "tool_result", query: "Edit failed: oldText not found in src/app.ts", toolName: "edit", cwd: "/repo", entryId: "r2" });
    } finally {
      store.close();
    }
    const notifications: string[] = [];
    const ctx = { cwd: "/repo", ui: { notify: (message: string) => notifications.push(message) }, sessionManager: { getCwd: () => "/repo", getSessionFile: () => null } };

    await commands.get("flight-reflect")?.handler(`--data-dir ${dataDir} --min-count 2`, ctx);

    const output = notifications.join("\n");
    expect(output).toContain("Pattern: exact-text edit mismatches");
    expect(output).toContain("Actions: useful | wrong-match | snooze | silence-pattern | promote-later | make-rule");
  });
});
