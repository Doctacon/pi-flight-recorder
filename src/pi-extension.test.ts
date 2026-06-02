import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import extension from "./pi-extension.js";
import { updateSettings } from "./settings.js";
import { defaultDatabasePath, FlightRecorderStore, getDefaultDataDir } from "./storage.js";
import { SessionWatchService } from "./watch-service.js";

function line(value: unknown): string {
  return JSON.stringify(value);
}

interface TestChatServer {
  baseUrl: string;
  requests: string[];
  close: () => Promise<void>;
}

async function readBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
  return Buffer.concat(chunks).toString("utf8");
}

function writeJson(response: ServerResponse, value: unknown): void {
  const body = JSON.stringify(value);
  response.writeHead(200, { "content-type": "application/json", "content-length": Buffer.byteLength(body, "utf8").toString() });
  response.end(body);
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

async function startLocalChatServer(content: string): Promise<TestChatServer> {
  const requests: string[] = [];
  const server = createServer(async (request, response) => {
    requests.push(await readBody(request));
    writeJson(response, { choices: [{ message: { content } }] });
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("expected local chat server port");
  return { baseUrl: `http://127.0.0.1:${address.port}`, requests, close: () => closeServer(server) };
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
  it("registers only the two normal visible commands, live hooks, and a query tool by default", () => {
    const commands = new Map<string, unknown>();
    const events = new Map<string, unknown>();
    const tools: unknown[] = [];
    extension({
      registerCommand: (name, command) => commands.set(name, command),
      registerTool: (tool) => tools.push(tool),
      on: (eventName, handler) => events.set(eventName, handler),
    });

    expect([...commands.keys()].sort()).toEqual(["flight-learn", "flight-status"]);
    expect(commands.has("flight-sync")).toBe(false);
    expect(commands.has("seen-this-before")).toBe(false);
    expect(commands.has("flight-mode")).toBe(false);
    expect(commands.has("flight-watch")).toBe(false);
    expect(commands.has("flight-feedback")).toBe(false);
    expect(commands.has("flight-reflect")).toBe(false);
    expect(commands.has("flight-review")).toBe(false);
    expect(commands.has("flight-rules")).toBe(false);
    expect(commands.has("flight-delta-review")).toBe(false);
    expect(commands.has("flight-deltas")).toBe(false);
    expect(events.has("session_start")).toBe(true);
    expect(events.has("tool_result")).toBe(true);
    expect(events.has("user_bash")).toBe(true);
    expect(events.has("before_agent_start")).toBe(true);
    expect(tools).toHaveLength(1);
  });

  it("registers legacy slash aliases only when explicitly opted in", () => {
    const commands = new Map<string, unknown>();
    const flags = new Map<string, unknown>();
    extension({
      registerCommand: (name, command) => commands.set(name, command),
      registerFlag: (name, options) => flags.set(name, options),
      getFlag: (name) => (name === "flight-recorder-legacy-commands" ? true : undefined),
    });

    expect(flags.has("flight-recorder-legacy-commands")).toBe(true);
    expect(commands.has("flight-status")).toBe(true);
    expect(commands.has("flight-learn")).toBe(true);
    expect(commands.has("flight-sync")).toBe(true);
    expect(commands.has("seen-this-before")).toBe(true);
    expect(commands.has("flight-deltas")).toBe(true);
    expect(commands.has("flight-rules")).toBe(true);
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
      const events = new Map<string, (event: unknown, ctx: any) => unknown>();
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
      expect(output).toContain("Privacy: local SQLite only by default; no model calls unless explicitly enabled");
      expect(output).toContain("/flight-learn --local-model-polish --local-model-url ...");
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

  it("shares an existing watcher across multiple Pi sessions without warning", async () => {
    const originalHome = process.env.HOME;
    const tempHome = await mkdtemp(path.join(tmpdir(), "pfr-shared-home-"));
    process.env.HOME = tempHome;
    const sourceDir = await mkdtemp(path.join(tmpdir(), "pfr-shared-source-"));
    await writeFile(path.join(sourceDir, "session.jsonl"), line({ type: "session", version: 3, id: "sess-shared", timestamp: "2026-05-22T01:00:00.000Z", cwd: "/repo" }));
    const dataDir = getDefaultDataDir();
    let owner: SessionWatchService | null = null;
    try {
      await updateSettings(dataDir, { sourceDirs: [sourceDir], autoStart: true, mode: "suggest-on-failure" });
      owner = new SessionWatchService({ sourceDirs: [sourceDir], dataDir, pollIntervalMs: 25, debounceMs: 10 });
      expect((await owner.start()).state).toBe("active");

      const commands = new Map<string, { handler: (args: string, ctx: any) => Promise<void> }>();
      const events = new Map<string, (event: unknown, ctx: any) => unknown>();
      extension({
        registerCommand: (name, command) => commands.set(name, command),
        on: (eventName, handler) => events.set(eventName, handler),
      });
      const notifications: string[] = [];
      const ctx = { cwd: "/repo", ui: { notify: (message: string) => notifications.push(message) }, sessionManager: { getCwd: () => "/repo", getSessionFile: () => null } };

      events.get("session_start")?.({}, ctx);
      await new Promise((resolve) => setTimeout(resolve, 100));
      await commands.get("flight-status")?.handler("", ctx);

      const output = notifications.join("\n");
      expect(output).not.toContain("autostart degraded");
      expect(output).toContain("shared watcher; another Pi session is indexing");
      expect(output).toContain("Errors: none");

      await events.get("tool_result")?.({ toolName: "bash", input: { command: "npm test" }, isError: true, content: "Novel shared session failure", details: { exitCode: 1 }, id: "shared-tool-1" }, ctx);
      const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
      try {
        expect(store.count("failure_occurrences")).toBe(1);
      } finally {
        store.close();
      }
    } finally {
      await owner?.stop();
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

    await commands.get("flight-status")?.handler(`sync --source ${root} --data-dir ${dataDir}`, ctx);
    expect(notifications.join("\n")).toContain("episodes 1");

    notifications.length = 0;
    await commands.get("flight-learn")?.handler(`seen --data-dir ${dataDir} --cwd current Cannot find module`, ctx);
    const output = notifications.join("\n");
    expect(output).toContain("Seen before");
    expect(output).toContain("entry fail0001");
  });

  it("routes watcher status through flight-status subcommands", async () => {
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-pi-watch-status-data-"));
    const commands = new Map<string, { handler: (args: string, ctx: any) => Promise<void> }>();
    extension({ registerCommand: (name, command) => commands.set(name, command) });
    const notifications: string[] = [];
    const ctx = { ui: { notify: (message: string) => notifications.push(message) }, sessionManager: { getCwd: () => "/repo" } };

    await commands.get("flight-status")?.handler(`watch status --data-dir ${dataDir}`, ctx);

    expect(notifications.join("\n")).toContain("Capture/index: not watching");
  });

  it("queries through the registered tool", async () => {
    const { root, dataDir } = await makeSessionSource();
    const commands = new Map<string, { handler: (args: string, ctx: any) => Promise<void> }>();
    const tools: Array<{ execute: (id: string, params: any) => Promise<{ content: Array<{ text: string }>; details: { resultCount: number } }> }> = [];
    extension({
      registerCommand: (name, command) => commands.set(name, command),
      registerTool: (tool) => tools.push(tool as (typeof tools)[number]),
    });
    await commands.get("flight-status")?.handler(`sync --source ${root} --data-dir ${dataDir}`, { ui: { notify: () => undefined } });

    const response = await tools[0]?.execute("call-1", { query: "Cannot find module", dataDir });
    expect(response?.details.resultCount).toBe(1);
    expect(response?.content[0]?.text).toContain("Seen before");
  });

  it("suggests on failed tool_result without mutating the event", async () => {
    const { root, dataDir } = await makeSessionSource();
    const commands = new Map<string, { handler: (args: string, ctx: any) => Promise<void> }>();
    const events = new Map<string, (event: unknown, ctx: any) => unknown>();
    extension({
      registerCommand: (name, command) => commands.set(name, command),
      on: (eventName, handler) => events.set(eventName, handler),
    });
    const notifications: string[] = [];
    const widgets = new Map<string, string[]>();
    const ctx = {
      cwd: "/repo",
      ui: {
        notify: (message: string) => notifications.push(message),
        setWidget: (id: string, value: string[] | undefined) => {
          if (value) widgets.set(id, value);
          else widgets.delete(id);
        },
      },
      sessionManager: { getCwd: () => "/repo", getSessionFile: () => null },
    };
    await commands.get("flight-status")?.handler(`sync --source ${root} --data-dir ${dataDir}`, ctx);
    await commands.get("flight-status")?.handler(`mode suggest-on-failure --data-dir ${dataDir}`, ctx);
    notifications.length = 0;
    const event = { toolName: "bash", input: { command: "npm test" }, isError: true, content: [{ type: "text", text: "Error: Cannot find module '../paths' at src/config/app.ts:12" }], details: { exitCode: 1 } };
    const before = JSON.stringify(event);

    await events.get("tool_result")?.(event, ctx);

    expect(JSON.stringify(event)).toBe(before);
    expect(notifications.join("\n")).toContain("Seen before");
    expect(notifications.join("\n")).toContain("Prior fix: Validation passed: npm test");
    expect(widgets.get("pi-flight-recorder-live-suggestion")?.join("\n")).toContain("Seen before");
    expect(widgets.get("pi-flight-recorder-live-suggestion")?.join("\n")).toContain("Prior fix: Validation passed: npm test");

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
    const events = new Map<string, (event: unknown, ctx: any) => unknown>();
    extension({
      registerCommand: (name, command) => commands.set(name, command),
      on: (eventName, handler) => events.set(eventName, handler),
    });
    const ctx = { cwd: "/repo", ui: { notify: () => undefined }, sessionManager: { getCwd: () => "/repo", getSessionFile: () => sessionFile } };
    await commands.get("flight-status")?.handler(`mode index-only --data-dir ${dataDir}`, ctx);

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
    const events = new Map<string, (event: unknown, ctx: any) => unknown>();
    extension({
      registerCommand: (name, command) => commands.set(name, command),
      on: (eventName, handler) => events.set(eventName, handler),
    });
    const notifications: string[] = [];
    const ctx = { cwd: "/repo", ui: { notify: (message: string) => notifications.push(message) }, sessionManager: { getCwd: () => "/repo", getSessionFile: () => null } };
    await commands.get("flight-status")?.handler(`mode suggest-on-failure --data-dir ${dataDir} --cooldown-ms 0`, ctx);
    notifications.length = 0;

    await events.get("tool_result")?.({ toolName: "bash", input: { command: "npm test" }, isError: true, content: "Novel Error: frobnicator exploded", details: { exitCode: 1 }, id: "tool-live-1" }, ctx);
    expect(notifications).toEqual([]);

    const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
    try {
      const occurrence = store.listFailureOccurrences({ limit: 1 })[0];
      expect(occurrence?.suggestion?.kind).toBe("suppressed");
      expect(occurrence?.suggestion?.reason).toBe("no-match");
      if (!occurrence) throw new Error("missing occurrence");
      await commands.get("flight-learn")?.handler(`feedback --action snooze --occurrence ${occurrence.id}`, ctx);
      expect(store.hasActiveSignatureSuppression(occurrence.signature)?.action).toBe("snooze");
      const feedbackCount = store.count("feedback_actions");
      notifications.length = 0;
      await commands.get("flight-learn")?.handler("feedback --action snooze --occurrence occ_missing", ctx);
      expect(notifications.join("\n")).toContain("No failure occurrence found");
      expect(store.count("feedback_actions")).toBe(feedbackCount);
      notifications.length = 0;
      await commands.get("flight-learn")?.handler(`feedback --action snooze --occurrence ${occurrence.id} --signature ${occurrence.signature}`, ctx);
      expect(notifications.join("\n")).toContain("requires exactly one target");
      expect(store.count("feedback_actions")).toBe(feedbackCount);
    } finally {
      store.close();
    }
  });

  it("suppresses reflection digests after occurrence feedback", async () => {
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-pi-reflect-silence-data-"));
    const commands = new Map<string, { handler: (args: string, ctx: any) => Promise<void> }>();
    extension({ registerCommand: (name, command) => commands.set(name, command) });
    const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
    let occurrenceId = "";
    try {
      const occurrence = store.recordFailureOccurrence({ source: "tool_result", query: "Edit failed: oldText not found in src/app.ts", toolName: "edit", cwd: "/repo", entryId: "silence-1" });
      occurrenceId = occurrence.id;
      store.recordFailureOccurrence({ source: "tool_result", query: "Edit failed: oldText not found in src/app.ts", toolName: "edit", cwd: "/repo", entryId: "silence-2" });
    } finally {
      store.close();
    }
    const notifications: string[] = [];
    const ctx = { cwd: "/repo", ui: { notify: (message: string) => notifications.push(message) }, sessionManager: { getCwd: () => "/repo", getSessionFile: () => null } };

    await commands.get("flight-learn")?.handler(`feedback --data-dir ${dataDir} --action silence-pattern --occurrence ${occurrenceId}`, ctx);
    notifications.length = 0;
    await commands.get("flight-learn")?.handler(`reflect --data-dir ${dataDir} --min-count 2`, ctx);

    expect(notifications.join("\n")).toContain("no repeated failure patterns ready");
  });

  it("creates a rule candidate from cluster make-rule fallback", async () => {
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-pi-cluster-rule-data-"));
    const commands = new Map<string, { handler: (args: string, ctx: any) => Promise<void> }>();
    extension({ registerCommand: (name, command) => commands.set(name, command) });
    const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
    try {
      const occurrence = store.recordFailureOccurrence({ source: "tool_result", query: "Edit failed: oldText not found in src/app.ts", toolName: "edit", cwd: "/repo", entryId: "cluster-rule-1" });
      store.upsertFailureCluster({ id: "cluster-cluster-rule", clusterKey: "class:edit-oldtext-mismatch|tool:edit|cwd:/repo", title: "exact-text edit mismatches", representativeSignature: occurrence.signature, status: "active", count: 2, occurrenceIds: [occurrence.id], cwdSummary: ["/repo"], tools: ["edit"], firstSeenAt: occurrence.firstSeenAt, lastSeenAt: occurrence.lastSeenAt, lastReflectedAt: null, score: 5 });
    } finally {
      store.close();
    }
    const notifications: string[] = [];
    const ctx = { cwd: "/repo", ui: { notify: (message: string) => notifications.push(message) }, sessionManager: { getCwd: () => "/repo", getSessionFile: () => null } };

    await commands.get("flight-learn")?.handler(`feedback --data-dir ${dataDir} --action make-rule --cluster cluster-cluster-rule`, ctx);

    const check = new FlightRecorderStore(defaultDatabasePath(dataDir));
    try {
      expect(check.count("rule_candidates")).toBe(1);
    } finally {
      check.close();
    }
    expect(notifications.join("\n")).toContain("Flight rule candidate created");
  });

  it("stops an active watcher before switching command data dirs", async () => {
    const { root, dataDir } = await makeSessionSource();
    const otherDataDir = await mkdtemp(path.join(tmpdir(), "pfr-pi-other-data-"));
    const commands = new Map<string, { handler: (args: string, ctx: any) => Promise<void> }>();
    extension({ registerCommand: (name, command) => commands.set(name, command) });
    const notifications: string[] = [];
    const ctx = { cwd: "/repo", ui: { notify: (message: string) => notifications.push(message) }, sessionManager: { getCwd: () => "/repo", getSessionFile: () => null } };

    await commands.get("flight-status")?.handler(`watch start --source ${root} --data-dir ${dataDir} --mode index-only --debounce-ms 10`, ctx);
    expect(notifications.join("\n")).toContain("watcher active");
    notifications.length = 0;
    await commands.get("flight-status")?.handler(`--data-dir ${otherDataDir}`, ctx);

    const output = notifications.join("\n");
    expect(output).toContain(`Data dir: ${otherDataDir}`);
    expect(output).toContain("Capture/index: not watching");
    expect(output).toContain("last occurrence: none");
  });

  it("records non-rule guided proposal actions and cancels make-rule without durable state", async () => {
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-pi-review-actions-data-"));
    const commands = new Map<string, { handler: (args: string, ctx: any) => Promise<void> }>();
    extension({ registerCommand: (name, command) => commands.set(name, command) });
    const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
    try {
      store.recordFailureOccurrence({ source: "tool_result", query: "Edit failed: oldText not found in src/app.ts", toolName: "edit", cwd: "/repo", entryId: "action-r1" });
      store.recordFailureOccurrence({ source: "tool_result", query: "Edit failed: oldText not found in src/app.ts", toolName: "edit", cwd: "/repo", entryId: "action-r2" });
    } finally {
      store.close();
    }
    const notifications: string[] = [];
    let selectedAction = "Useful";
    const ctx = {
      cwd: "/repo",
      ui: {
        notify: (message: string) => notifications.push(message),
        select: (message: string, choices: string[]) => {
          if (message.includes("Choose")) return choices[0];
          if (message.includes("Action")) return choices.find((choice) => choice.startsWith(selectedAction));
          if (message.includes("Approve")) return choices.find((choice) => choice.startsWith("Cancel"));
          return undefined;
        },
        editor: () => undefined,
      },
      sessionManager: { getCwd: () => "/repo", getSessionFile: () => null },
    };

    await commands.get("flight-learn")?.handler(`review --data-dir ${dataDir} --min-count 2`, ctx);
    const afterUseful = new FlightRecorderStore(defaultDatabasePath(dataDir));
    try {
      expect(afterUseful.getFeedbackActions({ actions: ["useful"], limit: 1 })).toHaveLength(1);
    } finally {
      afterUseful.close();
    }

    selectedAction = "Make Rule";
    notifications.length = 0;
    await commands.get("flight-learn")?.handler(`review --data-dir ${dataDir} --min-count 2`, ctx);
    const afterCancel = new FlightRecorderStore(defaultDatabasePath(dataDir));
    try {
      expect(afterCancel.count("rule_candidates")).toBe(0);
      expect(afterCancel.getFeedbackActions({ actions: ["make-rule"], limit: 1 })).toHaveLength(0);
    } finally {
      afterCancel.close();
    }
    expect(notifications.join("\n")).toContain("cancelled");
  });

  it("routes an expectation delta through guided review without applying artifacts", async () => {
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-pi-delta-review-data-"));
    const commands = new Map<string, { handler: (args: string, ctx: any) => Promise<void> }>();
    extension({ registerCommand: (name, command) => commands.set(name, command) });
    const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
    let deltaId = "";
    try {
      const delta = store.createExpectationDelta({
        source: "detector",
        summary: "Assistant repeatedly treats storage as mapper owner",
        expectation: "Mapper/sanitization seams should stay separate from repository storage behavior.",
        reality: "Assistant edited storage directly and missed the mapper seam twice.",
        impact: "Repeated review churn before implementation.",
        severity: "medium",
        cwd: "/repo",
        evidenceRefs: [{ sourceType: "session-entry", sourceId: "u-correct", sourceFile: "session.jsonl", sessionFile: "session.jsonl", cwd: "/repo", entryId: "u-correct", timestamp: "2026-05-23T01:00:00.000Z", snippet: "No, actually the mapper owns that behavior", note: "User correction" }],
      });
      deltaId = delta.id;
      store.recordDeltaDetectorSignal({ deltaId, type: "user-correction", explanation: "User correction language matched a conservative phrase.", confidence: 0.68, evidenceRefs: delta.evidenceRefs });
    } finally {
      store.close();
    }

    const notifications: string[] = [];
    const selectPrompts: string[] = [];
    const selectChoices: string[][] = [];
    const editorPrompts: string[] = [];
    const editorPrefills: string[] = [];
    const ctx = {
      cwd: "/repo",
      ui: {
        notify: (message: string) => notifications.push(message),
        select: (message: string, choices: string[]) => {
          selectPrompts.push(message);
          selectChoices.push(choices);
          if (message.includes("Choose an expectation delta")) return choices[0];
          if (message.includes("Route expectation delta")) return choices.find((choice) => choice.startsWith("Code legibility"));
          return undefined;
        },
        editor: (message: string, prefilled: string) => {
          editorPrompts.push(message);
          editorPrefills.push(prefilled);
          if (message.includes("Review expectation delta")) return prefilled.replace("Repeated review churn before implementation.", "Repeated review churn and stale route choices.");
          if (message.includes("Why this follow-up?")) return "The code seam is the repeated confusion source; draft a refactor ticket later.";
          return undefined;
        },
      },
      sessionManager: { getCwd: () => "/repo", getSessionFile: () => null },
    };

    await commands.get("flight-learn")?.handler(`delta-review --data-dir ${dataDir}`, ctx);

    expect(selectChoices[0]?.[0]).toContain(deltaId);
    expect(selectPrompts.find((prompt) => prompt.includes("Route expectation delta"))).toContain("Signals:");
    expect(selectPrompts.find((prompt) => prompt.includes("Route expectation delta"))).toContain("Evidence:");
    expect(selectChoices[1]?.some((choice) => choice.startsWith("Code legibility"))).toBe(true);
    expect(selectChoices[1]?.some((choice) => choice.startsWith("Flight Rule"))).toBe(true);
    expect(selectChoices[1]?.some((choice) => choice.startsWith("Test/check"))).toBe(true);
    expect(selectChoices[1]?.some((choice) => choice.startsWith("Observe/no artifact"))).toBe(true);
    expect(editorPrompts).toContain("Review expectation delta");
    expect(editorPrefills[0]).toContain("Expectation:");
    expect(editorPrefills[0]).toContain("Reality:");
    expect(editorPrefills[0]).toContain("Signals:");
    expect(editorPrefills[0]).toContain("Evidence:");

    const check = new FlightRecorderStore(defaultDatabasePath(dataDir));
    try {
      const routed = check.getExpectationDelta(deltaId);
      expect(routed?.status).toBe("routed");
      expect(routed?.impact).toContain("stale route choices");
      const candidate = check.listArtifactCandidates({ deltaId })[0];
      expect(candidate?.artifactType).toBe("code-legibility");
      expect(candidate?.status).toBe("accepted");
      expect(candidate?.applied).toBe(false);
      expect(candidate?.rationale).toContain("code seam");
      expect(candidate?.proposedDraft).toContain("Code-legibility/refactor ticket candidate");
      expect(candidate?.nextStep).toContain("Loom ticket");
      expect(check.count("rule_candidates")).toBe(0);
      expect(check.count("flight_rules")).toBe(0);
    } finally {
      check.close();
    }
    expect(notifications.join("\n")).toContain("Draft/handoff text was stored locally");
    expect(notifications.join("\n")).toContain("No artifact was created or applied");
  });

  it("routes a pending expectation delta through the custom flight-learn inbox when available", async () => {
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-pi-learn-custom-delta-data-"));
    const commands = new Map<string, { handler: (args: string, ctx: any) => Promise<void> }>();
    extension({ registerCommand: (name, command) => commands.set(name, command) });
    const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
    let deltaId = "";
    try {
      const delta = store.createExpectationDelta({
        source: "detector",
        summary: "Assistant keeps missing the validation seam",
        expectation: "Validation ownership should be obvious before edits.",
        reality: "The assistant chose the wrong seam twice.",
        impact: "Review churn before any useful fix.",
        severity: "medium",
        cwd: "/repo",
        evidenceRefs: [{ sourceType: "manual", sourceId: null, sourceFile: null, sessionFile: null, cwd: "/repo", entryId: null, timestamp: null, snippet: "wrong seam twice", note: "manual" }],
      });
      deltaId = delta.id;
      store.recordDeltaDetectorSignal({ deltaId, type: "failed-validation", explanation: "Validation failed again after assistant edits.", confidence: 0.72, evidenceRefs: delta.evidenceRefs });
    } finally {
      store.close();
    }

    const notifications: string[] = [];
    const rendered: string[][] = [];
    let customCalls = 0;
    const ctx = {
      cwd: "/repo",
      ui: {
        notify: (message: string) => notifications.push(message),
        custom: async (factory: any) => {
          customCalls += 1;
          let result: unknown;
          const component = factory({ requestRender: () => undefined }, { fg: (_color: string, value: string) => value, bold: (value: string) => value }, {}, (value: unknown) => {
            result = value;
          });
          rendered.push(component.render(104));
          component.handleInput?.("e");
          component.handleInput?.("\u0015");
          component.handleInput?.("Edited validation expectation");
          component.handleInput?.("\r");
          component.handleInput?.("2");
          component.handleInput?.("\r");
          return result;
        },
        select: () => {
          throw new Error("primitive select should not run when custom UI is available");
        },
        editor: (message: string) => {
          if (message.includes("Why this follow-up?")) return "A missing validation check let the seam confusion recur.";
          throw new Error("only follow-up reason editor should run after custom route selection");
        },
      },
      sessionManager: { getCwd: () => "/repo", getSessionFile: () => null },
    };

    await commands.get("flight-learn")?.handler(`--data-dir ${dataDir}`, ctx);

    const check = new FlightRecorderStore(defaultDatabasePath(dataDir));
    try {
      const routed = check.getExpectationDelta(deltaId);
      const candidate = check.listArtifactCandidates({ deltaId })[0];
      expect(routed?.status).toBe("routed");
      expect(routed?.expectation).toBe("Edited validation expectation");
      expect(routed?.evidenceRefs[0]?.snippet).toContain("wrong seam twice");
      expect(candidate?.artifactType).toBe("test-check");
      expect(candidate?.status).toBe("accepted");
      expect(candidate?.applied).toBe(false);
      expect(candidate?.rationale).toContain("missing validation check");
      expect(candidate?.evidenceRefs[0]?.snippet).toContain("wrong seam twice");
      expect(check.count("rule_candidates")).toBe(0);
      expect(check.count("flight_rules")).toBe(0);
    } finally {
      check.close();
    }
    expect(customCalls).toBe(1);
    expect(rendered[0]?.join("\n")).toContain("Flight Learn — Issue 1 of 1");
    expect(rendered[0]?.join("\n")).toContain("Problem");
    expect(rendered[0]?.join("\n")).toContain("Assistant keeps missing the validation seam");
    expect(rendered[0]?.join("\n")).toContain("What happened?");
    expect(rendered[0]?.join("\n")).toContain("Choose a follow-up");
    expect(rendered[0]?.join("\n")).toContain("▶ [1] Code legibility");
    expect(rendered[0]?.join("\n")).not.toContain("Pending deltas");
    expect(notifications.join("\n")).toContain("Flight Learn: reviewing the next pending delta");
    expect(notifications.join("\n")).toContain("No artifact was created or applied");
  });

  it("shows explicitly enabled local-model diagnosis polish without persisting model wording", async () => {
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-pi-learn-local-polish-data-"));
    const commands = new Map<string, { handler: (args: string, ctx: any) => Promise<void> }>();
    extension({ registerCommand: (name, command) => commands.set(name, command) });
    const chatServer = await startLocalChatServer(JSON.stringify({
      schemaVersion: 2,
      headline: "A validation check failed repeatedly in this project.",
      whyItMatters: "Repeated validation friction makes the result hard to trust.",
      expectedBehavior: "Validation should run from a fresh shell.",
    }));
    let deltaId = "";
    try {
      const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
      try {
        const delta = store.createExpectationDelta({
          source: "detector",
          summary: "Repeated failure pattern: bash cd /Users/alice/project && npm test",
          expectation: "Validation should run from a fresh shell.",
          reality: "Observed 2 related failure occurrences in reflection cluster cluster_local_polish.",
          impact: "Repeated validation friction makes the result hard to trust.",
          severity: "medium",
          cwd: "/Users/alice/project",
          evidenceRefs: [{ sourceType: "manual", sourceId: null, sourceFile: null, sessionFile: null, cwd: "/Users/alice/project", entryId: null, timestamp: null, snippet: "bash cd /Users/alice/project && npm test failed twice", note: "manual" }],
        });
        deltaId = delta.id;
        store.recordDeltaDetectorSignal({ deltaId, type: "failed-validation", explanation: "Validation failed twice from the same stale shell pattern.", confidence: 0.74, evidenceRefs: delta.evidenceRefs });
      } finally {
        store.close();
      }

      const notifications: string[] = [];
      const rendered: string[][] = [];
      const ctx = {
        cwd: "/repo",
        ui: {
          notify: (message: string) => notifications.push(message),
          custom: async (factory: any) => {
            let result: unknown;
            const component = factory({ requestRender: () => undefined }, { fg: (_color: string, value: string) => value, bold: (value: string) => value }, {}, (value: unknown) => {
              result = value;
            });
            rendered.push(component.render(112));
            component.handleInput?.("2");
            component.handleInput?.("\r");
            return result;
          },
          editor: (message: string) => {
            if (message.includes("Why this follow-up?")) return "A validation check follow-up should preserve the local evidence.";
            throw new Error("only follow-up reason editor should run after custom route selection");
          },
        },
        sessionManager: { getCwd: () => "/repo", getSessionFile: () => null },
      };

      await commands.get("flight-learn")?.handler(`--data-dir ${dataDir} --local-model-polish --local-model-url ${chatServer.baseUrl}`, ctx);

      const output = rendered[0]?.join("\n") ?? "";
      expect(output).toContain("Local model phrasing; deterministic fallback available.");
      expect(output).toContain("A validation check failed repeatedly in this project.");
      expect(output).toContain("Pi saw the same validation-failure pattern twice in recent sessions.");
      expect(chatServer.requests).toHaveLength(1);
      expect(chatServer.requests[0]).toContain("Redacted facts JSON");
      expect(chatServer.requests[0]).toContain("/Users/<user>");
      expect(chatServer.requests[0]).not.toContain("/Users/alice");

      const check = new FlightRecorderStore(defaultDatabasePath(dataDir));
      try {
        const routed = check.getExpectationDelta(deltaId);
        const candidate = check.listArtifactCandidates({ deltaId })[0];
        expect(routed?.status).toBe("routed");
        expect(routed?.summary).toContain("Repeated failure pattern: bash cd");
        expect(routed?.summary).not.toContain("validation check failed repeatedly");
        expect(candidate?.artifactType).toBe("test-check");
        expect(candidate?.status).toBe("accepted");
        expect(candidate?.applied).toBe(false);
        expect(candidate?.rationale).toContain("validation check follow-up");
        expect(candidate?.proposedDraft).not.toContain("validation check failed repeatedly");
        expect(check.count("rule_candidates")).toBe(0);
        expect(check.count("flight_rules")).toBe(0);
      } finally {
        check.close();
      }
      expect(notifications.join("\n")).toContain("No artifact was created or applied");
    } finally {
      await chatServer.close();
    }
  });

  it("ignores the legacy local narrative judge while showing hard-safety-validated card copy without persisting it", async () => {
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-pi-learn-local-judge-data-"));
    const commands = new Map<string, { handler: (args: string, ctx: any) => Promise<void> }>();
    extension({ registerCommand: (name, command) => commands.set(name, command) });
    const generatorServer = await startLocalChatServer(JSON.stringify({
      schemaVersion: 2,
      whatHappened: {
        sentences: [
          { text: "The accepted local narrative ties the repeated validation check to an old shell after the package changed.", factIds: ["F7", "F10"] },
        ],
      },
    }));
    const judgeServer = await startLocalChatServer(JSON.stringify({
      schemaVersion: 1,
      overallVerdict: "accept",
      sentences: [
        {
          index: 0,
          verdict: "supported",
          supportedFactIds: ["F7", "F10"],
          unsupportedClaims: [],
          reason: "Supported by cited redacted facts.",
          confidence: "high",
        },
      ],
    }));
    let deltaId = "";
    try {
      const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
      try {
        const delta = store.createExpectationDelta({
          source: "detector",
          summary: "Repeated failure pattern: bash cd /Users/alice/project && npm test",
          expectation: "Validation should run from a fresh shell.",
          reality: "The validation check was rerun from an old shell after the package changed.",
          impact: "That makes the validation result hard to trust.",
          severity: "medium",
          cwd: "/Users/alice/project",
          evidenceRefs: [{ sourceType: "manual", sourceId: null, sourceFile: null, sessionFile: null, cwd: "/Users/alice/project", entryId: null, timestamp: null, snippet: "npm test failed twice", note: "manual" }],
        });
        deltaId = delta.id;
        store.recordDeltaDetectorSignal({ deltaId, type: "failed-validation", explanation: "Validation failed twice from the same stale shell pattern.", confidence: 0.74, evidenceRefs: delta.evidenceRefs });
      } finally {
        store.close();
      }

      const rendered: string[][] = [];
      const ctx = {
        cwd: "/repo",
        ui: {
          notify: () => undefined,
          custom: async (factory: any) => {
            let result: unknown;
            const component = factory({ requestRender: () => undefined }, { fg: (_color: string, value: string) => value, bold: (value: string) => value }, {}, (value: unknown) => {
              result = value;
            });
            rendered.push(component.render(112));
            component.handleInput?.("2");
            component.handleInput?.("\r");
            return result;
          },
          editor: (message: string) => {
            if (message.includes("Why this follow-up?")) return "A validation check follow-up should preserve the local evidence.";
            throw new Error("only follow-up reason editor should run after custom route selection");
          },
        },
        sessionManager: { getCwd: () => "/repo", getSessionFile: () => null },
      };

      await commands.get("flight-learn")?.handler(`--data-dir ${dataDir} --local-model-polish --local-model-url ${generatorServer.baseUrl} --local-narrative-judge-url ${judgeServer.baseUrl} --local-narrative-judge-max-output-tokens 256`, ctx);

      const output = rendered[0]?.join("\n") ?? "";
      expect(output).toContain("Local model phrasing; deterministic fallback available.");
      expect(output).toContain("A validation command failed repeatedly in this project.");
      expect(output).toContain("The accepted local narrative ties the repeated validation check to an old shell");
      expect(generatorServer.requests).toHaveLength(1);
      expect(judgeServer.requests).toHaveLength(0);

      const check = new FlightRecorderStore(defaultDatabasePath(dataDir));
      try {
        const routed = check.getExpectationDelta(deltaId);
        const candidate = check.listArtifactCandidates({ deltaId })[0];
        expect(routed?.status).toBe("routed");
        expect(routed?.summary).toContain("Repeated failure pattern: bash cd");
        expect(routed?.summary).not.toContain("accepted local narrative");
        expect(candidate?.artifactType).toBe("test-check");
        expect(candidate?.status).toBe("accepted");
        expect(candidate?.applied).toBe(false);
        expect(candidate?.proposedDraft).not.toContain("accepted local narrative");
        expect(check.count("rule_candidates")).toBe(0);
        expect(check.count("flight_rules")).toBe(0);
      } finally {
        check.close();
      }
    } finally {
      await generatorServer.close();
      await judgeServer.close();
    }
  });

  it("shows explicitly enabled local LLM draft comprehension without judge acceptance or persistence", async () => {
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-pi-learn-local-draft-data-"));
    const commands = new Map<string, { handler: (args: string, ctx: any) => Promise<void> }>();
    extension({ registerCommand: (name, command) => commands.set(name, command) });
    const generatorServer = await startLocalChatServer(JSON.stringify({
      schemaVersion: 2,
      whatHappened: {
        sentences: [
          { text: "The validation check was rerun from an old shell after the package changed.", factIds: ["F7", "F10"] },
          { text: "The old shell recurrence made the validation result hard to trust.", factIds: ["F3", "F8", "F10"] },
        ],
      },
    }));
    let deltaId = "";
    try {
      const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
      try {
        const delta = store.createExpectationDelta({
          source: "detector",
          summary: "Repeated failure pattern: bash cd /Users/alice/project && npm test",
          expectation: "Validation should run from a fresh shell.",
          reality: "The validation check was rerun from an old shell after the package changed.",
          impact: "That makes the validation result hard to trust.",
          severity: "medium",
          cwd: "/Users/alice/project",
          evidenceRefs: [{ sourceType: "manual", sourceId: null, sourceFile: null, sessionFile: null, cwd: "/Users/alice/project", entryId: null, timestamp: null, snippet: "npm test failed twice", note: "manual" }],
        });
        deltaId = delta.id;
        store.recordDeltaDetectorSignal({ deltaId, type: "failed-validation", explanation: "Validation failed twice from the same stale shell pattern.", confidence: 0.74, evidenceRefs: delta.evidenceRefs });
      } finally {
        store.close();
      }

      const rendered: string[][] = [];
      const ctx = {
        cwd: "/repo",
        ui: {
          notify: () => undefined,
          custom: async (factory: any) => {
            let result: unknown;
            const component = factory({ requestRender: () => undefined }, { fg: (_color: string, value: string) => value, bold: (value: string) => value }, {}, (value: unknown) => {
              result = value;
            });
            rendered.push(component.render(112));
            component.handleInput?.("2");
            component.handleInput?.("\r");
            return result;
          },
          editor: (message: string) => {
            if (message.includes("Why this follow-up?")) return "A validation check follow-up should preserve deterministic facts.";
            throw new Error("only follow-up reason editor should run after custom route selection");
          },
        },
        sessionManager: { getCwd: () => "/repo", getSessionFile: () => null },
      };

      await commands.get("flight-learn")?.handler(`--data-dir ${dataDir} --local-model-polish --local-model-url ${generatorServer.baseUrl}`, ctx);

      const output = rendered[0]?.join("\n") ?? "";
      expect(output).toContain("Local model phrasing; deterministic fallback available.");
      expect(output).toContain("The validation check was rerun from an old shell after the package changed.");
      expect(output).toContain("Problem");
      expect(output).toContain("A validation command failed repeatedly in this project.");
      expect(output).not.toContain("accepted by local judge");
      expect(generatorServer.requests).toHaveLength(1);

      const check = new FlightRecorderStore(defaultDatabasePath(dataDir));
      try {
        const routed = check.getExpectationDelta(deltaId);
        const candidate = check.listArtifactCandidates({ deltaId })[0];
        expect(routed?.status).toBe("routed");
        expect(routed?.summary).toContain("Repeated failure pattern: bash cd");
        expect(routed?.summary).not.toContain("old shell recurrence");
        expect(candidate?.artifactType).toBe("test-check");
        expect(candidate?.status).toBe("accepted");
        expect(candidate?.applied).toBe(false);
        expect(candidate?.proposedDraft).not.toContain("old shell recurrence");
        expect(check.count("rule_candidates")).toBe(0);
        expect(check.count("flight_rules")).toBe(0);
      } finally {
        check.close();
      }
    } finally {
      await generatorServer.close();
    }
  });

  it("documents explicit local-model call behavior when custom inbox throws before primitive fallback", async () => {
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-pi-learn-local-polish-custom-throw-data-"));
    const commands = new Map<string, { handler: (args: string, ctx: any) => Promise<void> }>();
    extension({ registerCommand: (name, command) => commands.set(name, command) });
    const chatServer = await startLocalChatServer(JSON.stringify({
      schemaVersion: 2,
      headline: "A validation check failed repeatedly in this project.",
      whatHappened: {
        sentences: [
          { text: "Pi saw the same validation check failed twice in recent sessions.", factIds: ["F7", "F10"] },
        ],
      },
      whyItMatters: "Repeated validation friction makes the result hard to trust.",
      expectedBehavior: "Validation should run from a fresh shell.",
    }));
    let deltaId = "";
    try {
      const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
      try {
        const delta = store.createExpectationDelta({
          source: "detector",
          summary: "Repeated failure pattern: bash cd /Users/alice/project && npm test",
          expectation: "Validation should run from a fresh shell.",
          reality: "Observed 2 related failure occurrences in reflection cluster cluster_custom_throw.",
          impact: "Repeated validation friction makes the result hard to trust.",
          severity: "medium",
          cwd: "/Users/alice/project",
          evidenceRefs: [{ sourceType: "manual", sourceId: null, sourceFile: null, sessionFile: null, cwd: "/Users/alice/project", entryId: null, timestamp: null, snippet: "npm test failed twice", note: "manual" }],
        });
        deltaId = delta.id;
        store.recordDeltaDetectorSignal({ deltaId, type: "failed-validation", explanation: "Validation failed twice from the same stale shell pattern.", confidence: 0.74, evidenceRefs: delta.evidenceRefs });
      } finally {
        store.close();
      }

      const ctx = {
        cwd: "/repo",
        ui: {
          notify: () => undefined,
          custom: () => {
            throw new Error("custom UI unavailable after entry");
          },
          select: (message: string, choices: string[]) => {
            if (message.includes("Choose an expectation delta")) return choices[0];
            if (message.includes("Route expectation delta")) return choices.find((choice) => choice.startsWith("Test/check"));
            return undefined;
          },
          editor: (message: string, prefilled: string) => {
            if (message.includes("Review expectation delta")) return prefilled;
            if (message.includes("Why this follow-up?")) return "Primitive fallback still requires a human reason.";
            return undefined;
          },
        },
        sessionManager: { getCwd: () => "/repo", getSessionFile: () => null },
      };

      await commands.get("flight-learn")?.handler(`delta-review --data-dir ${dataDir} --local-model-polish --local-model-url ${chatServer.baseUrl}`, ctx);

      expect(chatServer.requests).toHaveLength(1);
      const check = new FlightRecorderStore(defaultDatabasePath(dataDir));
      try {
        const candidate = check.listArtifactCandidates({ deltaId })[0];
        expect(check.getExpectationDelta(deltaId)?.status).toBe("routed");
        expect(candidate?.artifactType).toBe("test-check");
        expect(candidate?.applied).toBe(false);
        expect(candidate?.rationale).toContain("Primitive fallback");
      } finally {
        check.close();
      }
    } finally {
      await chatServer.close();
    }
  });

  it("falls back to deterministic diagnosis when enabled local-model config is unavailable", async () => {
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-pi-learn-local-polish-fallback-data-"));
    const commands = new Map<string, { handler: (args: string, ctx: any) => Promise<void> }>();
    extension({ registerCommand: (name, command) => commands.set(name, command) });
    const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
    try {
      const delta = store.createExpectationDelta({
        source: "detector",
        summary: "Repeated failure pattern: bash cd /Users/alice/project && npm test",
        expectation: null,
        reality: "Observed 2 related failure occurrences in reflection cluster cluster_local_fallback.",
        impact: "Repeated local friction across tools/cwds: bash.",
        severity: "medium",
        cwd: "/Users/alice/project",
        evidenceRefs: [{ sourceType: "manual", sourceId: null, sourceFile: null, sessionFile: null, cwd: "/Users/alice/project", entryId: null, timestamp: null, snippet: "npm test failed twice", note: "manual" }],
      });
      store.recordDeltaDetectorSignal({ deltaId: delta.id, type: "failed-validation", explanation: "Validation failed twice from the same stale shell pattern.", confidence: 0.74, evidenceRefs: delta.evidenceRefs });
    } finally {
      store.close();
    }

    const rendered: string[][] = [];
    const ctx = {
      cwd: "/repo",
      ui: {
        notify: () => undefined,
        custom: async (factory: any) => {
          let result: unknown;
          const component = factory({ requestRender: () => undefined }, {}, {}, (value: unknown) => {
            result = value;
          });
          rendered.push(component.render(112));
          component.handleInput?.("q");
          return result;
        },
      },
      sessionManager: { getCwd: () => "/repo", getSessionFile: () => null },
    };

    await commands.get("flight-learn")?.handler(`delta-review --data-dir ${dataDir} --local-model-polish`, ctx);

    const output = rendered[0]?.join("\n") ?? "";
    expect(output).toContain("Local model unavailable (runtime unavailable); deterministic wording shown.");
    expect(output).toContain("A validation command failed repeatedly in this project.");
    expect(output).not.toContain("provider failed before returning JSON");
  });

  it("cancels after custom route selection without storing a candidate when rationale editor is dismissed", async () => {
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-pi-learn-custom-rationale-cancel-data-"));
    const commands = new Map<string, { handler: (args: string, ctx: any) => Promise<void> }>();
    extension({ registerCommand: (name, command) => commands.set(name, command) });
    const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
    let deltaId = "";
    try {
      deltaId = store.createExpectationDelta({ source: "manual", summary: "One delta route then cancel rationale", evidenceRefs: [{ sourceType: "manual", sourceId: null, sourceFile: null, sessionFile: null, cwd: "/repo", entryId: null, timestamp: null, snippet: "preserve after cancel", note: "manual" }] }).id;
    } finally {
      store.close();
    }

    const notifications: string[] = [];
    const ctx = {
      cwd: "/repo",
      ui: {
        notify: (message: string) => notifications.push(message),
        custom: async (factory: any) => {
          let result: unknown;
          const component = factory({ requestRender: () => undefined }, {}, {}, (value: unknown) => {
            result = value;
          });
          component.handleInput?.("2");
          component.handleInput?.("\r");
          return result;
        },
        editor: () => undefined,
      },
      sessionManager: { getCwd: () => "/repo", getSessionFile: () => null },
    };

    await commands.get("flight-learn")?.handler(`--data-dir ${dataDir}`, ctx);

    const check = new FlightRecorderStore(defaultDatabasePath(dataDir));
    try {
      expect(check.getExpectationDelta(deltaId)?.status).toBe("candidate");
      expect(check.count("artifact_candidates")).toBe(0);
    } finally {
      check.close();
    }
    expect(notifications.join("\n")).toContain("Interactive review cancelled; no changes were applied.");
  });

  it("dismisses a pending expectation delta through the custom flight-learn inbox without artifacts", async () => {
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-pi-learn-custom-dismiss-data-"));
    const commands = new Map<string, { handler: (args: string, ctx: any) => Promise<void> }>();
    extension({ registerCommand: (name, command) => commands.set(name, command) });
    const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
    let deltaId = "";
    try {
      deltaId = store.createExpectationDelta({ source: "manual", summary: "One delta to dismiss", evidenceRefs: [{ sourceType: "manual", sourceId: null, sourceFile: null, sessionFile: null, cwd: "/repo", entryId: null, timestamp: null, snippet: "dismiss but preserve", note: "manual" }] }).id;
    } finally {
      store.close();
    }

    const notifications: string[] = [];
    const ctx = {
      cwd: "/repo",
      ui: {
        notify: (message: string) => notifications.push(message),
        custom: async (factory: any) => {
          let result: unknown;
          const component = factory({ requestRender: () => undefined }, {}, {}, (value: unknown) => {
            result = value;
          });
          component.handleInput?.("d");
          return result;
        },
      },
      sessionManager: { getCwd: () => "/repo", getSessionFile: () => null },
    };

    await commands.get("flight-learn")?.handler(`--data-dir ${dataDir}`, ctx);

    const check = new FlightRecorderStore(defaultDatabasePath(dataDir));
    try {
      const dismissed = check.getExpectationDelta(deltaId);
      expect(dismissed?.status).toBe("dismissed");
      expect(dismissed?.statusReason).toContain("Flight Learn inbox");
      expect(dismissed?.evidenceRefs[0]?.snippet).toContain("dismiss but preserve");
      expect(check.count("artifact_candidates")).toBe(0);
    } finally {
      check.close();
    }
    expect(notifications.join("\n")).toContain("Dismissed expectation delta");
  });

  it("routes a pending expectation delta through one-command flight-learn", async () => {
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-pi-learn-delta-data-"));
    const commands = new Map<string, { handler: (args: string, ctx: any) => Promise<void> }>();
    extension({ registerCommand: (name, command) => commands.set(name, command) });
    const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
    let deltaId = "";
    try {
      deltaId = store.createExpectationDelta({
        source: "manual",
        summary: "Assistant keeps missing the validation seam",
        expectation: "Validation ownership should be obvious before edits.",
        reality: "The assistant chose the wrong seam twice.",
        impact: "Review churn before any useful fix.",
        severity: "medium",
        cwd: "/repo",
        evidenceRefs: [{ sourceType: "manual", sourceId: null, sourceFile: null, sessionFile: null, cwd: "/repo", entryId: null, timestamp: null, snippet: "wrong seam twice", note: "manual" }],
      }).id;
    } finally {
      store.close();
    }

    const notifications: string[] = [];
    const ctx = {
      cwd: "/repo",
      ui: {
        notify: (message: string) => notifications.push(message),
        select: (message: string, choices: string[]) => {
          if (message.includes("Choose an expectation delta")) return choices[0];
          if (message.includes("Route expectation delta")) return choices.find((choice) => choice.startsWith("Test/check"));
          return undefined;
        },
        editor: (message: string, prefilled: string) => {
          if (message.includes("Review expectation delta")) return prefilled;
          if (message.includes("Why this follow-up?")) return "A missing validation check let the seam confusion recur.";
          return undefined;
        },
      },
      sessionManager: { getCwd: () => "/repo", getSessionFile: () => null },
    };

    await commands.get("flight-learn")?.handler(`--data-dir ${dataDir}`, ctx);

    const check = new FlightRecorderStore(defaultDatabasePath(dataDir));
    try {
      const candidate = check.listArtifactCandidates({ deltaId })[0];
      expect(candidate?.artifactType).toBe("test-check");
      expect(candidate?.status).toBe("accepted");
      expect(candidate?.applied).toBe(false);
      expect(check.getExpectationDelta(deltaId)?.status).toBe("routed");
    } finally {
      check.close();
    }
    expect(notifications.join("\n")).toContain("Flight Learn: reviewing the next pending delta");
    expect(notifications.join("\n")).toContain("No artifact was created or applied");
  });

  it("records artifact outcome follow-up through one-command flight-learn", async () => {
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-pi-learn-outcome-data-"));
    const commands = new Map<string, { handler: (args: string, ctx: any) => Promise<void> }>();
    extension({ registerCommand: (name, command) => commands.set(name, command) });
    const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
    let candidateId = "";
    try {
      const delta = store.createExpectationDelta({ source: "manual", summary: "Repeated stale route choice", evidenceRefs: [{ sourceType: "manual", sourceId: null, sourceFile: null, sessionFile: null, cwd: "/repo", entryId: null, timestamp: null, snippet: "stale route", note: "manual" }] });
      const candidate = store.createArtifactCandidate({
        deltaId: delta.id,
        artifactType: "code-legibility",
        title: "Code legibility: repeated stale route choice",
        rationale: "The code shape is causing repeated route mistakes.",
        proposedDraft: "Draft a small refactor ticket.",
        nextStep: "Create Loom ticket if accepted.",
        evidenceRefs: delta.evidenceRefs,
      });
      candidateId = store.acceptArtifactCandidate(candidate.id)!.id;
    } finally {
      store.close();
    }

    const notifications: string[] = [];
    const selectPrompts: string[] = [];
    const ctx = {
      cwd: "/repo",
      ui: {
        notify: (message: string) => notifications.push(message),
        select: (message: string, choices: string[]) => {
          selectPrompts.push(message);
          if (message.includes("Choose an artifact candidate")) return choices[0];
          if (message.includes("Follow up artifact candidate")) return choices.find((choice) => choice.startsWith("Helped"));
          return undefined;
        },
        editor: (message: string) => {
          if (message.includes("Outcome note")) return "No recurrence observed in later similar work yet.";
          return undefined;
        },
      },
      sessionManager: { getCwd: () => "/repo", getSessionFile: () => null },
    };

    await commands.get("flight-learn")?.handler(`--data-dir ${dataDir}`, ctx);

    const check = new FlightRecorderStore(defaultDatabasePath(dataDir));
    try {
      const candidate = check.getArtifactCandidate(candidateId);
      expect(candidate?.outcome).toBe("helped");
      expect(candidate?.status).toBe("resolved");
      expect(candidate?.applied).toBe(true);
      expect(candidate?.outcomeSummary).toContain("No recurrence observed");
    } finally {
      check.close();
    }
    expect(selectPrompts.find((prompt) => prompt.includes("Follow up artifact candidate"))).toContain("Draft:");
    expect(notifications.join("\n")).toContain(`Recorded outcome for ${candidateId}: helped`);
  });

  it("keeps flight-learn concise when no learning items are ready", async () => {
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-pi-learn-empty-data-"));
    const commands = new Map<string, { handler: (args: string, ctx: any) => Promise<void> }>();
    extension({ registerCommand: (name, command) => commands.set(name, command) });
    const notifications: string[] = [];
    const ctx = { cwd: "/repo", ui: { notify: (message: string) => notifications.push(message) }, sessionManager: { getCwd: () => "/repo", getSessionFile: () => null } };

    await commands.get("flight-learn")?.handler(`--data-dir ${dataDir}`, ctx);

    const output = notifications.join("\n");
    expect(output).toContain("Flight Learn: nothing needs review right now");
    expect(output).toContain("/flight-learn to review the next item, /flight-status to check state");
  });

  it("supports explicit fallback delta routing, observe, no-ui guidance, and dismiss", async () => {
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-pi-delta-fallback-data-"));
    const commands = new Map<string, { handler: (args: string, ctx: any) => Promise<void> }>();
    extension({ registerCommand: (name, command) => commands.set(name, command) });
    const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
    let observeDeltaId = "";
    let dismissDeltaId = "";
    try {
      observeDeltaId = store.createExpectationDelta({ source: "manual", summary: "One route to observe", evidenceRefs: [{ sourceType: "manual", sourceId: null, sourceFile: null, sessionFile: null, cwd: "/repo", entryId: null, timestamp: null, snippet: "keep this evidence", note: "manual" }] }).id;
      dismissDeltaId = store.createExpectationDelta({ source: "manual", summary: "One route to dismiss", evidenceRefs: [{ sourceType: "manual", sourceId: null, sourceFile: null, sessionFile: null, cwd: "/repo", entryId: null, timestamp: null, snippet: "dismiss evidence", note: "manual" }] }).id;
    } finally {
      store.close();
    }

    const notifications: string[] = [];
    const ctx = { cwd: "/repo", ui: { notify: (message: string) => notifications.push(message) }, sessionManager: { getCwd: () => "/repo", getSessionFile: () => null } };

    await commands.get("flight-learn")?.handler(`delta-review --data-dir ${dataDir}`, ctx);
    expect(notifications.join("\n")).toContain("/flight-learn deltas list");
    let check = new FlightRecorderStore(defaultDatabasePath(dataDir));
    try {
      expect(check.getExpectationDelta(observeDeltaId)?.status).toBe("candidate");
      expect(check.count("artifact_candidates")).toBe(0);
    } finally {
      check.close();
    }

    notifications.length = 0;
    await commands.get("flight-learn")?.handler(`deltas route --data-dir ${dataDir} --delta ${observeDeltaId} --type observe --rationale "Observe recurrence before creating an artifact"`, ctx);
    check = new FlightRecorderStore(defaultDatabasePath(dataDir));
    try {
      const candidate = check.listArtifactCandidates({ deltaId: observeDeltaId })[0];
      expect(candidate?.artifactType).toBe("observe");
      expect(candidate?.status).toBe("accepted");
      expect(candidate?.applied).toBe(false);
      expect(candidate?.proposedDraft).toContain("Observe/no-artifact decision");
      expect(check.getExpectationDelta(observeDeltaId)?.evidenceRefs[0]?.snippet).toContain("keep this evidence");
    } finally {
      check.close();
    }
    expect(notifications.join("\n")).toContain("No artifact was created or applied");

    notifications.length = 0;
    await commands.get("flight-learn")?.handler(`deltas show --data-dir ${dataDir} --delta ${observeDeltaId}`, ctx);
    expect(notifications.join("\n")).toContain("Draft:");
    expect(notifications.join("\n")).toContain("Observe/no-artifact decision");

    notifications.length = 0;
    await commands.get("flight-learn")?.handler(`deltas dismiss --data-dir ${dataDir} --delta ${dismissDeltaId} --reason "Not recurring"`, ctx);
    check = new FlightRecorderStore(defaultDatabasePath(dataDir));
    try {
      const dismissed = check.getExpectationDelta(dismissDeltaId);
      expect(dismissed?.status).toBe("dismissed");
      expect(dismissed?.evidenceRefs[0]?.snippet).toContain("dismiss evidence");
    } finally {
      check.close();
    }
    expect(notifications.join("\n")).toContain("Dismissed expectation delta");
  });

  it("records delta outcomes and recurrence through fallback commands", async () => {
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-pi-delta-outcome-data-"));
    const commands = new Map<string, { handler: (args: string, ctx: any) => Promise<void> }>();
    extension({ registerCommand: (name, command) => commands.set(name, command) });
    const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
    let candidateId = "";
    let laterDeltaId = "";
    try {
      const delta = store.createExpectationDelta({ source: "manual", summary: "Assistant misses the validation check" });
      const candidate = store.acceptArtifactCandidate(store.createArtifactCandidate({
        deltaId: delta.id,
        artifactType: "test-check",
        title: "Add validation check",
        rationale: "A test/check route should catch this expectation delta.",
      }).id)!;
      candidateId = candidate.id;
    } finally {
      store.close();
    }

    const notifications: string[] = [];
    const ctx = { cwd: "/repo", ui: { notify: (message: string) => notifications.push(message) }, sessionManager: { getCwd: () => "/repo", getSessionFile: () => null } };

    await commands.get("flight-learn")?.handler(`deltas apply --data-dir ${dataDir} --candidate ${candidateId} --ref tests/validation.test.ts`, ctx);
    expect(notifications.join("\n")).toContain("Marked artifact candidate");

    notifications.length = 0;
    await commands.get("flight-learn")?.handler(`deltas outcome --data-dir ${dataDir} --candidate ${candidateId} --outcome helped --note "No linked recurrence observed yet"`, ctx);
    expect(notifications.join("\n")).toContain("Recorded outcome");

    notifications.length = 0;
    await commands.get("flight-learn")?.handler(`deltas summary --data-dir ${dataDir}`, ctx);
    expect(notifications.join("\n")).toContain("No recurrence observed since applied");
    expect(notifications.join("\n")).toContain("not proof");

    const laterStore = new FlightRecorderStore(defaultDatabasePath(dataDir));
    try {
      laterDeltaId = laterStore.createExpectationDelta({ source: "manual", summary: "Assistant misses the validation check again" }).id;
    } finally {
      laterStore.close();
    }

    notifications.length = 0;
    await commands.get("flight-learn")?.handler(`deltas recur --data-dir ${dataDir} --delta ${laterDeltaId} --candidate ${candidateId} --reason "Similar delta recurred after application" --similarity 0.9`, ctx);
    expect(notifications.join("\n")).toContain("Linked recurrence");
    const check = new FlightRecorderStore(defaultDatabasePath(dataDir));
    try {
      expect(check.getArtifactCandidate(candidateId)?.outcome).toBe("needs-reroute");
      expect(check.getExpectationDelta(laterDeltaId)?.status).toBe("recurring");
    } finally {
      check.close();
    }

    notifications.length = 0;
    await commands.get("flight-learn")?.handler(`deltas summary --data-dir ${dataDir}`, ctx);
    expect(notifications.join("\n")).toContain("Recurring after applied");
  });

  it("guides proposal review into an approved Flight Rule and injects then disables it", async () => {
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-pi-rules-data-"));
    const commands = new Map<string, { handler: (args: string, ctx: any) => Promise<void> }>();
    const events = new Map<string, (event: unknown, ctx: any) => unknown>();
    extension({
      registerCommand: (name, command) => commands.set(name, command),
      on: (eventName, handler) => events.set(eventName, handler),
    });
    const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
    try {
      store.recordFailureOccurrence({ source: "tool_result", query: "Edit failed: oldText not found in src/app.ts", toolName: "edit", cwd: "/repo", entryId: "rule-r1" });
      store.recordFailureOccurrence({ source: "tool_result", query: "Edit failed: oldText not found in src/app.ts", toolName: "edit", cwd: "/repo", entryId: "rule-r2" });
    } finally {
      store.close();
    }
    const notifications: string[] = [];
    const selectPrompts: string[] = [];
    const selectChoices: string[][] = [];
    const ctx = {
      cwd: "/repo",
      ui: {
        notify: (message: string) => notifications.push(message),
        select: (message: string, choices: string[]) => {
          selectPrompts.push(message);
          selectChoices.push(choices);
          if (message.includes("Choose")) return choices[0];
          if (message.includes("Action")) return choices.find((choice) => choice.startsWith("Make Rule"));
          if (message.includes("Approve")) return choices.find((choice) => choice.startsWith("Approve global"));
          return undefined;
        },
        editor: (_message: string, text: string) => `${text} Keep this concise.`,
      },
      sessionManager: { getCwd: () => "/repo", getSessionFile: () => null },
    };

    await commands.get("flight-learn")?.handler(`review --data-dir ${dataDir} --min-count 2`, ctx);

    expect(selectChoices[0]?.[0]).toContain("exact-text edit mismatches");
    expect(selectChoices[0]?.[0]).toContain("refl_");
    expect(selectPrompts.find((prompt) => prompt.includes("Action for Flight Recorder proposal"))).toContain("Likely fix/next step");

    const ruleStore = new FlightRecorderStore(defaultDatabasePath(dataDir));
    let ruleId = "";
    try {
      const rule = ruleStore.listFlightRules({ status: "active", limit: 1 })[0];
      expect(rule?.text).toContain("Keep this concise");
      ruleId = rule!.id;
    } finally {
      ruleStore.close();
    }
    const injected = await events.get("before_agent_start")?.({ systemPrompt: "base prompt", systemPromptOptions: { cwd: "/repo" } }, ctx) as { systemPrompt?: string } | undefined;
    expect(injected?.systemPrompt).toContain("Flight Recorder approved rules");
    expect(injected?.systemPrompt).toContain(ruleId);

    notifications.length = 0;
    await commands.get("flight-status")?.handler(`--data-dir ${dataDir}`, ctx);
    expect(notifications.join("\n")).toContain(`last injected=${ruleId}`);

    await commands.get("flight-learn")?.handler(`rules disable ${ruleId} --data-dir ${dataDir}`, ctx);
    const afterDisable = await events.get("before_agent_start")?.({ systemPrompt: "base prompt", systemPromptOptions: { cwd: "/repo" } }, ctx) as { systemPrompt?: string } | undefined;
    expect(afterDisable).toBeUndefined();
  });

  it("lists, shows, rejects, and exports Flight Rules through fallback commands", async () => {
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-pi-rules-command-data-"));
    const commands = new Map<string, { handler: (args: string, ctx: any) => Promise<void> }>();
    extension({ registerCommand: (name, command) => commands.set(name, command) });
    const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
    let candidateId = "";
    let ruleId = "";
    try {
      const candidate = store.createRuleCandidate({ sourceId: "refl-command", clusterId: "cluster-command", draftText: "Always re-read before edit", proposedScope: "global" });
      candidateId = candidate.id;
      ruleId = store.approveRuleCandidate(candidate.id, { scope: "global" })!.id;
      store.createRuleCandidate({ sourceId: "refl-pending", clusterId: "cluster-pending", draftText: "Pending draft", proposedScope: "project", projectRoot: "/repo" });
    } finally {
      store.close();
    }
    const notifications: string[] = [];
    const ctx = { cwd: "/repo", ui: { notify: (message: string) => notifications.push(message) }, sessionManager: { getCwd: () => "/repo", getSessionFile: () => null } };

    await commands.get("flight-learn")?.handler(`rules pending --data-dir ${dataDir}`, ctx);
    expect(notifications.join("\n")).toContain("Pending draft");
    notifications.length = 0;
    await commands.get("flight-learn")?.handler(`rules show ${ruleId} --data-dir ${dataDir}`, ctx);
    expect(notifications.join("\n")).toContain("Flight rule");
    notifications.length = 0;
    await commands.get("flight-learn")?.handler(`rules export --data-dir ${dataDir}`, ctx);
    expect(notifications.join("\n")).toContain("# Flight Recorder Rules");
    notifications.length = 0;
    await commands.get("flight-learn")?.handler(`rules reject --candidate ${candidateId} --data-dir ${dataDir}`, ctx);
    expect(notifications.join("\n")).toContain("Rejected rule candidate");
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

    await commands.get("flight-learn")?.handler(`reflect --data-dir ${dataDir} --min-count 2`, ctx);

    const output = notifications.join("\n");
    expect(output).toContain("Pattern: exact-text edit mismatches");
    expect(output).toContain("review interactively: /flight-learn review");
  });
});
