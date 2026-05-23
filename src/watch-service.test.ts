import { appendFile, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FlightRecorderStore, defaultDatabasePath } from "./storage.js";
import { requestWatchStop, SessionWatchService } from "./watch-service.js";

function line(value: unknown): string {
  return JSON.stringify(value);
}

async function writeSession(file: string, entries: unknown[] = []): Promise<void> {
  await writeFile(
    file,
    [line({ type: "session", version: 3, id: "sess-watch", timestamp: "2026-05-22T01:00:00.000Z", cwd: "/repo" }), ...entries.map(line)].join("\n"),
  );
}

function failure(id: string, parentId: string | null = null): unknown {
  return { type: "message", id, parentId, timestamp: "2026-05-22T01:00:02.000Z", message: { role: "bashExecution", command: "npm test", output: "Error: Cannot find module '../paths'", exitCode: 1, cancelled: false, truncated: false, timestamp: 2 } };
}

async function waitFor(assertion: () => boolean, timeoutMs = 1_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (assertion()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error("condition not met before timeout");
}

describe("SessionWatchService", () => {
  it("runs catch-up sync before reporting active", async () => {
    const sourceDir = await mkdtemp(path.join(tmpdir(), "pfr-watch-src-"));
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-watch-data-"));
    const file = path.join(sourceDir, "session.jsonl");
    await writeSession(file, [failure("fail0001")]);
    const events: string[] = [];
    const service = new SessionWatchService({
      sourceDirs: [sourceDir],
      dataDir,
      pollIntervalMs: 25,
      debounceMs: 10,
      onFileSynced: (event) => {
        events.push(`${event.origin}:${event.result.newEpisodeIds.length}`);
      },
    });

    const status = await service.start();

    expect(status.state).toBe("active");
    expect(status.watchedPaths).toEqual([file]);
    expect(events).toContain("catch-up:1");
    await service.stop();
  });

  it("detects appended JSONL failures, debounces, and indexes only new episodes", async () => {
    const sourceDir = await mkdtemp(path.join(tmpdir(), "pfr-watch-append-src-"));
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-watch-append-data-"));
    const file = path.join(sourceDir, "session.jsonl");
    await writeSession(file);
    const changeEvents: number[] = [];
    const service = new SessionWatchService({
      sourceDirs: [sourceDir],
      dataDir,
      pollIntervalMs: 20,
      debounceMs: 20,
      onFileSynced: (event) => {
        if (event.origin === "change") changeEvents.push(event.result.newEpisodeIds.length);
      },
    });
    await service.start();

    await appendFile(file, `\n${line(failure("fail0001"))}`);
    await appendFile(file, "\n{not json yet");
    await waitFor(() => service.status().lastFailure?.newEpisodeIds.length === 1);

    const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
    try {
      expect(store.count("episodes")).toBe(1);
    } finally {
      store.close();
    }
    expect(changeEvents).toContain(1);
    expect(service.status().warningCount).toBeGreaterThanOrEqual(1);
    await service.stop();
  });

  it("reports duplicate watcher starts through the local lock", async () => {
    const sourceDir = await mkdtemp(path.join(tmpdir(), "pfr-watch-lock-src-"));
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-watch-lock-data-"));
    await writeSession(path.join(sourceDir, "session.jsonl"));
    const first = new SessionWatchService({ sourceDirs: [sourceDir], dataDir, pollIntervalMs: 25, debounceMs: 10 });
    const second = new SessionWatchService({ sourceDirs: [sourceDir], dataDir, pollIntervalMs: 25, debounceMs: 10 });

    expect((await first.start()).state).toBe("active");
    expect((await second.start()).state).toBe("watched-by-another-process");

    await first.stop();
    await second.stop();
  });

  it("stops on request and reports stopped status", async () => {
    const sourceDir = await mkdtemp(path.join(tmpdir(), "pfr-watch-stop-src-"));
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-watch-stop-data-"));
    await writeSession(path.join(sourceDir, "session.jsonl"));
    const service = new SessionWatchService({ sourceDirs: [sourceDir], dataDir, pollIntervalMs: 20, debounceMs: 10 });
    await service.start();

    await requestWatchStop(dataDir);
    await service.waitUntilStopped();

    expect(service.status().state).toBe("stopped");
  });
});
