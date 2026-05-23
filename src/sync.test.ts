import { appendFile, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FlightRecorderStore, defaultDatabasePath } from "./storage.js";
import { syncSessionFile, syncSessions } from "./sync.js";

function line(value: unknown): string {
  return JSON.stringify(value);
}

async function writeFixtureSession(dir: string): Promise<string> {
  const file = path.join(dir, "session.jsonl");
  await writeFile(
    file,
    [
      line({ type: "session", version: 3, id: "sess-sync", timestamp: "2026-05-22T01:00:00.000Z", cwd: "/repo" }),
      line({ type: "message", id: "fail0001", parentId: null, timestamp: "2026-05-22T01:00:02.000Z", message: { role: "bashExecution", command: "npm test", output: "Error: Cannot find module '../paths'", exitCode: 1, cancelled: false, truncated: false, timestamp: 2 } }),
    ].join("\n"),
  );
  return file;
}

describe("incremental sync", () => {
  it("syncs one session file and returns new episode ids", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "pfr-sync-one-"));
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-sync-data-"));
    const file = await writeFixtureSession(dir);

    const result = await syncSessionFile(file, { dataDir });

    expect(result.indexed).toBe(true);
    expect(result.skipped).toBe(false);
    expect(result.episodesExtracted).toBe(1);
    expect(result.newEpisodeIds).toHaveLength(1);
    expect(result.warnings).toBe(0);
  });

  it("skips unchanged files without duplicating episodes", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "pfr-sync-skip-"));
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-sync-data-"));
    const file = await writeFixtureSession(dir);

    await syncSessionFile(file, { dataDir });
    const second = await syncSessionFile(file, { dataDir });
    const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
    try {
      expect(second.skipped).toBe(true);
      expect(second.newEpisodeIds).toEqual([]);
      expect(store.count("episodes")).toBe(1);
    } finally {
      store.close();
    }
  });

  it("returns only newly appended failure episodes as new ids", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "pfr-sync-append-"));
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-sync-data-"));
    const file = await writeFixtureSession(dir);
    const first = await syncSessionFile(file, { dataDir });

    await appendFile(
      file,
      `\n${line({ type: "message", id: "fail0002", parentId: "fail0001", timestamp: "2026-05-22T01:00:03.000Z", message: { role: "bashExecution", command: "npm run build", output: "TS2307: Cannot find module './missing'", exitCode: 2, cancelled: false, truncated: false, timestamp: 3 } })}`,
    );
    const second = await syncSessionFile(file, { dataDir });

    expect(second.indexed).toBe(true);
    expect(second.episodesExtracted).toBe(2);
    expect(second.newEpisodeIds).toHaveLength(1);
    expect(second.newEpisodeIds[0]).not.toBe(first.newEpisodeIds[0]);
  });

  it("preserves batch sync summary compatibility", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "pfr-sync-batch-"));
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-sync-data-"));
    await writeFixtureSession(dir);

    const result = await syncSessions({ sourceDirs: [dir], dataDir });

    expect(result.discovered).toBe(1);
    expect(result.indexed).toBe(1);
    expect(result.episodes).toBe(1);
    expect(result.newEpisodes).toBe(1);
    expect(result.files).toHaveLength(1);
  });
});
