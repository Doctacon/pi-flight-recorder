import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { main } from "./cli.js";
import { defaultDatabasePath, FlightRecorderStore } from "./storage.js";

function line(value: unknown): string {
  return JSON.stringify(value);
}

async function makeSessionSource(): Promise<{ root: string; dataDir: string }> {
  const root = await mkdtemp(path.join(tmpdir(), "pfr-cli-source-"));
  const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-cli-data-"));
  const nested = path.join(root, "--repo--");
  await mkdir(nested);
  await writeFile(
    path.join(nested, "session.jsonl"),
    [
      line({ type: "session", version: 3, id: "sess-cli", timestamp: "2026-05-22T01:00:00.000Z", cwd: "/repo" }),
      line({ type: "message", id: "u0000001", parentId: null, timestamp: "2026-05-22T01:00:01.000Z", message: { role: "user", content: "tests fail", timestamp: 1 } }),
      line({ type: "message", id: "fail0001", parentId: "u0000001", timestamp: "2026-05-22T01:00:02.000Z", message: { role: "bashExecution", command: "npm test", output: "Error: Cannot find module '../paths'\n at src/config/app.ts:12", exitCode: 1, cancelled: false, truncated: false, timestamp: 2 } }),
      line({ type: "message", id: "a0000001", parentId: "fail0001", timestamp: "2026-05-22T01:00:03.000Z", message: { role: "assistant", content: [{ type: "text", text: "Update src/config/paths.ts and rerun tests." }], stopReason: "stop", timestamp: 3 } }),
      line({ type: "message", id: "pass0001", parentId: "a0000001", timestamp: "2026-05-22T01:00:04.000Z", message: { role: "bashExecution", command: "npm test", output: "pass", exitCode: 0, cancelled: false, truncated: false, timestamp: 4 } }),
    ].join("\n"),
  );
  return { root, dataDir };
}

describe("CLI", () => {
  it("syncs fixtures and returns evidence-backed query results", async () => {
    const { root, dataDir } = await makeSessionSource();
    const stdout: string[] = [];
    const stderr: string[] = [];
    const io = { stdout: (text: string) => stdout.push(text), stderr: (text: string) => stderr.push(text) };

    await expect(main(["sync", "--source", root, "--data-dir", dataDir], io)).resolves.toBe(0);
    expect(stdout.join("\n")).toContain("Episodes extracted: 1");

    stdout.length = 0;
    await expect(main(["seen-this-before", "--data-dir", dataDir, "Cannot find module src/config/app.ts"], io)).resolves.toBe(0);
    const output = stdout.join("\n");
    expect(output).toContain("Seen before");
    expect(output).toContain("Prior fix: Validation passed: npm test");
    expect(output).toContain("entry fail0001");
    expect(stderr).toEqual([]);
  });

  it("supports JSON query output and feedback", async () => {
    const { root, dataDir } = await makeSessionSource();
    const stdout: string[] = [];
    const stderr: string[] = [];
    const io = { stdout: (text: string) => stdout.push(text), stderr: (text: string) => stderr.push(text) };

    await main(["sync", "--source", root, "--data-dir", dataDir], io);
    stdout.length = 0;
    await expect(main(["query", "--data-dir", dataDir, "--json", "Cannot find module"], io)).resolves.toBe(0);
    const parsed = JSON.parse(stdout.at(-1) ?? "{}");
    const episodeId = parsed.results[0].episode.id as string;
    expect(episodeId).toMatch(/^ep_/);

    stdout.length = 0;
    await expect(main(["feedback", "--data-dir", dataDir, "--episode", episodeId, "--rating", "useful"], io)).resolves.toBe(0);
    expect(stdout.join("\n")).toContain("Recorded feedback");
    stdout.length = 0;
    await expect(main(["feedback", "--data-dir", dataDir, "--episode", episodeId, "--action", "snooze", "--duration-ms", "60000"], io)).resolves.toBe(0);
    const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
    const actions = store.getFeedbackActions({ targetId: episodeId });
    store.close();
    expect(actions.some((action) => action.action === "snooze" && action.expiresAt)).toBe(true);
    expect(stderr).toEqual([]);
  });

  it("supports explicit manual delta capture and listing", async () => {
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-delta-cli-data-"));
    const stdout: string[] = [];
    const stderr: string[] = [];
    const io = { stdout: (text: string) => stdout.push(text), stderr: (text: string) => stderr.push(text) };

    await expect(main([
      "delta",
      "capture",
      "--data-dir",
      dataDir,
      "--summary",
      "Assistant used old API TOKEN=abc123 in /Users/alice/private/project/src/api.ts",
      "--expectation",
      "Use the new API",
      "--reality",
      "The old API was suggested",
      "--evidence",
      "No, actually the API works differently with API_KEY=secret-value",
      "--cwd",
      "/Users/alice/private/project",
      "--json",
    ], io)).resolves.toBe(0);
    const captured = JSON.parse(stdout.at(-1) ?? "{}");
    expect(captured.delta.id).toMatch(/^delta_/);
    expect(captured.delta.status).toBe("candidate");
    expect(captured.delta.summary).not.toContain("abc123");
    expect(captured.signals[0].type).toBe("manual-capture");

    stdout.length = 0;
    await expect(main(["delta", "list", "--data-dir", dataDir, "--status", "candidate", "--json"], io)).resolves.toBe(0);
    const listed = JSON.parse(stdout.at(-1) ?? "{}");
    expect(listed.deltas).toHaveLength(1);
    expect(listed.deltas[0].summary).not.toContain("abc123");
    expect(stderr).toEqual([]);
  });

  it("reports cautious delta outcome summaries and recurrence links", async () => {
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-delta-outcome-cli-data-"));
    const stdout: string[] = [];
    const stderr: string[] = [];
    const io = { stdout: (text: string) => stdout.push(text), stderr: (text: string) => stderr.push(text) };
    const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
    let candidateId = "";
    let laterDeltaId = "";
    try {
      const delta = store.createExpectationDelta({ source: "manual", summary: "Repeated validation expectation delta" });
      const candidate = store.acceptArtifactCandidate(store.createArtifactCandidate({
        deltaId: delta.id,
        artifactType: "test-check",
        title: "Add validation check",
        rationale: "A missing check allowed repeated validation misses.",
      }).id)!;
      candidateId = candidate.id;
    } finally {
      store.close();
    }

    await expect(main(["delta", "outcome", "--data-dir", dataDir, "--candidate", candidateId, "--outcome", "helped", "--note", "No linked recurrence observed yet", "--applied-ref", "tests/validation.test.ts", "--json"], io)).resolves.toBe(0);
    const outcome = JSON.parse(stdout.at(-1) ?? "{}");
    expect(outcome.candidate.applied).toBe(true);
    expect(outcome.candidate.status).toBe("resolved");

    stdout.length = 0;
    await expect(main(["delta", "summary", "--data-dir", dataDir], io)).resolves.toBe(0);
    expect(stdout.join("\n")).toContain("No recurrence observed since applied");
    expect(stdout.join("\n")).toContain("not proof");
    expect(stdout.join("\n")).not.toMatch(/fixed forever|\bsolved\b/i);

    const laterStore = new FlightRecorderStore(defaultDatabasePath(dataDir));
    try {
      laterDeltaId = laterStore.createExpectationDelta({ source: "manual", summary: "Repeated validation expectation delta happened again" }).id;
    } finally {
      laterStore.close();
    }

    stdout.length = 0;
    await expect(main(["delta", "recur", "--data-dir", dataDir, "--delta", laterDeltaId, "--candidate", candidateId, "--reason", "Similar validation delta recurred after the check was applied", "--similarity", "0.9", "--json"], io)).resolves.toBe(0);
    const recurrence = JSON.parse(stdout.at(-1) ?? "{}");
    expect(recurrence.link.similarity).toBe(0.9);
    expect(recurrence.priorArtifactCandidate.outcome).toBe("needs-reroute");

    stdout.length = 0;
    await expect(main(["delta", "summary", "--data-dir", dataDir, "--json"], io)).resolves.toBe(0);
    const summary = JSON.parse(stdout.at(-1) ?? "{}");
    expect(summary.counts["recurring-after-applied"]).toBe(1);
    expect(summary.limits.join("\n")).toContain("not proof");
    expect(stderr).toEqual([]);
  });

  it("prints friendly no-match output", async () => {
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-empty-data-"));
    const stdout: string[] = [];
    const io = { stdout: (text: string) => stdout.push(text), stderr: (_text: string) => undefined };

    await expect(main(["query", "--data-dir", dataDir, "gibberish nomatch"], io)).resolves.toBe(0);
    expect(stdout.join("\n")).toContain("No prior failure-memory match found");
  });

  it("labels CLI as debug harness and exposes machine-readable status", async () => {
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-status-cli-data-"));
    const stdout: string[] = [];
    const stderr: string[] = [];
    const io = { stdout: (text: string) => stdout.push(text), stderr: (text: string) => stderr.push(text) };

    await expect(main(["--help"], io)).resolves.toBe(0);
    expect(stdout.join("\n")).toContain("CLI is a debug/manual/recovery harness");

    stdout.length = 0;
    await expect(main(["status", "--data-dir", dataDir, "--json"], io)).resolves.toBe(0);
    const parsed = JSON.parse(stdout.at(-1) ?? "{}");
    expect(parsed.privacy.localOnlyByDefault).toBe(true);
    expect(parsed.counts.occurrences).toBe(0);
    expect(stderr).toEqual([]);
  });

  it("exposes watch status, stop, and conservative start errors", async () => {
    const dataDir = await mkdtemp(path.join(tmpdir(), "pfr-watch-cli-data-"));
    const stdout: string[] = [];
    const stderr: string[] = [];
    const io = { stdout: (text: string) => stdout.push(text), stderr: (text: string) => stderr.push(text) };

    await expect(main(["watch", "status", "--data-dir", dataDir], io)).resolves.toBe(0);
    expect(stdout.join("\n")).toContain("Watcher: stopped");

    stdout.length = 0;
    await expect(main(["watch", "stop", "--data-dir", dataDir], io)).resolves.toBe(0);
    expect(stdout.join("\n")).toContain("stop requested");
    await expect(readFile(path.join(dataDir, "watch-stop.json"), "utf8")).resolves.toContain("requestedAt");

    await expect(main(["watch", "start", "--data-dir", dataDir], io)).resolves.toBe(2);
    expect(stderr.join("\n")).toContain("requires --foreground");
  });
});
