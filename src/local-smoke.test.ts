import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { main } from "./cli.js";
import extension from "./pi-extension.js";
import { defaultDatabasePath, FlightRecorderStore, getDefaultDataDir } from "./storage.js";

function jsonl(value: unknown): string {
  return JSON.stringify(value);
}

async function makeFixtureSessionRoot(): Promise<{ sourceRoot: string; cwd: string }> {
  const sourceRoot = await mkdtemp(path.join(tmpdir(), "pfr-local-smoke-source-"));
  const cwd = "/fixture/repo";
  const nested = path.join(sourceRoot, "--fixture-repo--");
  await mkdir(nested, { recursive: true });
  await writeFile(
    path.join(nested, "session.jsonl"),
    [
      jsonl({ type: "session", version: 3, id: "smoke-session", timestamp: "2026-05-23T10:00:00.000Z", cwd }),
      jsonl({ type: "message", id: "smoke-fail", parentId: null, timestamp: "2026-05-23T10:00:01.000Z", message: { role: "bashExecution", command: "npm test", output: "Error: Cannot find module '../paths' at src/config/app.ts:12", exitCode: 1, cancelled: false, truncated: false, timestamp: 1 } }),
      jsonl({ type: "message", id: "smoke-fix", parentId: "smoke-fail", timestamp: "2026-05-23T10:00:03.000Z", message: { role: "assistant", content: "Re-read the current config path and fixed the import." } }),
      jsonl({ type: "message", id: "smoke-pass", parentId: "smoke-fix", timestamp: "2026-05-23T10:00:05.000Z", message: { role: "bashExecution", command: "npm test", output: "pass", exitCode: 0, cancelled: false, truncated: false, timestamp: 5 } }),
    ].join("\n"),
  );
  return { sourceRoot, cwd };
}

async function plantDefaultSessionSentinel(home: string): Promise<void> {
  const defaultSessionDir = path.join(home, ".pi", "agent", "sessions", "--default-sentinel--");
  await mkdir(defaultSessionDir, { recursive: true });
  await writeFile(
    path.join(defaultSessionDir, "session.jsonl"),
    [
      jsonl({ type: "session", version: 3, id: "default-sentinel-session", timestamp: "2026-05-23T09:00:00.000Z", cwd: "/default/sentinel" }),
      jsonl({ type: "message", id: "default-sentinel-fail", parentId: null, timestamp: "2026-05-23T09:00:01.000Z", message: { role: "bashExecution", command: "npm test", output: "DEFAULT_SENTINEL_SHOULD_NOT_INDEX", exitCode: 1, cancelled: false, truncated: false, timestamp: 1 } }),
    ].join("\n"),
  );
}

describe("local release smoke", () => {
  it("exercises extension and CLI-facing behavior with isolated fixture data", async () => {
    const originalHome = process.env.HOME;
    const tempHome = await mkdtemp(path.join(tmpdir(), "pfr-local-smoke-home-"));
    process.env.HOME = tempHome;
    try {
      await plantDefaultSessionSentinel(tempHome);
      const { sourceRoot, cwd } = await makeFixtureSessionRoot();
      const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-local-smoke-data-"));

      expect(sourceRoot).not.toContain(".pi/agent/sessions");
      expect(dataDir).not.toBe(getDefaultDataDir());
      expect(defaultDatabasePath(dataDir)).not.toBe(defaultDatabasePath());

      const commands = new Map<string, { handler: (args: string, ctx: any) => Promise<void> }>();
      const events = new Map<string, (event: unknown, ctx: any) => unknown>();
      extension({
        registerCommand: (name, command) => commands.set(name, command),
        on: (eventName, handler) => events.set(eventName, handler),
      });

      const notifications: string[] = [];
      const selectPrompts: string[] = [];
      const ctx = {
        cwd,
        ui: {
          notify: (message: string) => notifications.push(message),
          select: (message: string, choices: string[]) => {
            selectPrompts.push(message);
            if (message.includes("Choose")) return choices[0];
            if (message.includes("Action")) return choices.find((choice) => choice.startsWith("Make Rule"));
            if (message.includes("Approve")) return choices.find((choice) => choice.startsWith("Approve global"));
            return undefined;
          },
          editor: (_message: string, text: string) => `${text}\nAlways keep the replacement bounded.`,
        },
        sessionManager: { getCwd: () => cwd, getSessionFile: () => null },
      };

      await commands.get("flight-status")?.handler(`--data-dir ${dataDir}`, ctx);
      expect(notifications.join("\n")).toContain(`Data dir: ${dataDir}`);
      expect(notifications.join("\n")).toContain("Capture/index: not watching");

      notifications.length = 0;
      await commands.get("flight-mode")?.handler(`index-only --data-dir ${dataDir}`, ctx);
      let store = new FlightRecorderStore(defaultDatabasePath(dataDir));
      try {
        expect(store.count("episodes")).toBe(0);
        expect(store.searchEpisodes("DEFAULT_SENTINEL_SHOULD_NOT_INDEX", { limit: 1 })).toHaveLength(0);
      } finally {
        store.close();
      }

      notifications.length = 0;
      await commands.get("flight-sync")?.handler(`--source ${sourceRoot} --data-dir ${dataDir}`, ctx);
      expect(notifications.join("\n")).toContain("episodes 1");

      notifications.length = 0;
      await commands.get("seen-this-before")?.handler(`--data-dir ${dataDir} --cwd current Cannot find module`, ctx);
      expect(notifications.join("\n")).toContain("Seen before");
      expect(notifications.join("\n")).toContain("entry smoke-fail");

      const stdout: string[] = [];
      const stderr: string[] = [];
      const statusCode = await main(["status", "--data-dir", dataDir, "--json"], { stdout: (text) => stdout.push(text), stderr: (text) => stderr.push(text) });
      expect(statusCode).toBe(0);
      expect(stderr).toEqual([]);
      const cliStatus = JSON.parse(stdout.join("\n")) as { dataDir: string; counts: { episodes: number } };
      expect(cliStatus.dataDir).toBe(dataDir);
      expect(cliStatus.counts.episodes).toBe(1);

      notifications.length = 0;
      await commands.get("flight-mode")?.handler(`suggest-on-failure --data-dir ${dataDir} --cooldown-ms 0`, ctx);
      await events.get("tool_result")?.({ toolName: "edit", input: { command: "edit src/app.ts" }, isError: true, content: "Edit failed: oldText not found in src/app.ts", details: { exitCode: 1 }, id: "smoke-live-1" }, ctx);
      await events.get("tool_result")?.({ toolName: "edit", input: { command: "edit src/app.ts" }, isError: true, content: "Edit failed: oldText not found in src/app.ts", details: { exitCode: 1 }, id: "smoke-live-2" }, ctx);

      store = new FlightRecorderStore(defaultDatabasePath(dataDir));
      try {
        expect(store.count("failure_occurrences")).toBe(2);
        expect(store.searchEpisodes("DEFAULT_SENTINEL_SHOULD_NOT_INDEX", { limit: 1 })).toHaveLength(0);
      } finally {
        store.close();
      }

      notifications.length = 0;
      await commands.get("flight-reflect")?.handler(`--data-dir ${dataDir} --min-count 2`, ctx);
      expect(notifications.join("\n")).toContain("Flight Recorder reflection");
      expect(notifications.join("\n")).toContain("Pattern: exact-text edit mismatches");

      notifications.length = 0;
      await commands.get("flight-review")?.handler(`--data-dir ${dataDir} --min-count 2`, ctx);
      expect(selectPrompts.some((prompt) => prompt.includes("Action for Flight Recorder proposal"))).toBe(true);

      store = new FlightRecorderStore(defaultDatabasePath(dataDir));
      let ruleId = "";
      try {
        const rule = store.listFlightRules({ status: "active", limit: 1 })[0];
        expect(rule?.text).toContain("Always keep the replacement bounded");
        ruleId = rule!.id;
      } finally {
        store.close();
      }

      const injected = await events.get("before_agent_start")?.({ systemPrompt: "base prompt", systemPromptOptions: { cwd } }, ctx) as { systemPrompt?: string } | undefined;
      expect(injected?.systemPrompt).toContain("Flight Recorder approved rules");
      expect(injected?.systemPrompt).toContain(ruleId);

      notifications.length = 0;
      await commands.get("flight-rules")?.handler(`status --data-dir ${dataDir}`, ctx);
      expect(notifications.join("\n")).toContain(`[active; global; injected 1]`);
      expect(notifications.join("\n")).toContain(ruleId);
    } finally {
      if (originalHome === undefined) delete process.env.HOME;
      else process.env.HOME = originalHome;
    }
  });
});
