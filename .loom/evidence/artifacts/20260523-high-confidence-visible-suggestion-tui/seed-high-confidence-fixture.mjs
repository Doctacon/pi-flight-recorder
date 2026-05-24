import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const COMMAND = "npm test";
const FIX_COMMAND = COMMAND;

function line(value) {
  return JSON.stringify(value);
}

const workspace = process.env.PFR_WORKSPACE ?? (await mkdtemp(path.join(tmpdir(), "pfr-installed-smoke-workspace-")));
const dataDir = process.env.PFR_DATA_DIR ?? path.join(process.env.HOME ?? await mkdtemp(path.join(tmpdir(), "pfr-installed-smoke-home-")), ".pi", "flight-recorder");
const sourceDir = process.env.PFR_SOURCE_DIR ?? (await mkdtemp(path.join(tmpdir(), "pfr-installed-smoke-source-")));
const sessionPath = path.join(sourceDir, "prior-high-confidence.jsonl");

await writeFile(
  sessionPath,
  [
    line({ type: "session", version: 3, id: "prior-high-confidence", timestamp: "2026-05-23T01:00:00.000Z", cwd: workspace }),
    line({ type: "message", id: "prior-fail-0001", parentId: null, timestamp: "2026-05-23T01:00:02.000Z", message: { role: "bashExecution", command: COMMAND, output: "PFR_HIGHCONF_FAILURE\n", exitCode: 7, cancelled: false, truncated: false, timestamp: 2 } }),
    line({ type: "message", id: "prior-assistant-0001", parentId: "prior-fail-0001", timestamp: "2026-05-23T01:00:03.000Z", message: { role: "assistant", content: [{ type: "text", text: "Try the narrow smoke fix and rerun the same validation command." }], timestamp: 3 } }),
    line({ type: "message", id: "prior-pass-0001", parentId: "prior-assistant-0001", timestamp: "2026-05-23T01:00:04.000Z", message: { role: "bashExecution", command: FIX_COMMAND, output: "PFR_HIGHCONF_FIXED\n", exitCode: 0, cancelled: false, truncated: false, timestamp: 4 } }),
  ].join("\n") + "\n",
  "utf8",
);

const { syncSessionFile } = await import(pathToFileURL(path.resolve("dist/sync.js")).href);
const { defaultDatabasePath, FlightRecorderStore } = await import(pathToFileURL(path.resolve("dist/storage.js")).href);
const result = await syncSessionFile(sessionPath, { dataDir });
const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
const counts = {
  sourceFiles: store.count("source_files"),
  episodes: store.count("episodes"),
  occurrences: store.count("failure_occurrences"),
};
const episode = result.newEpisodeIds[0] ? store.getEpisode(result.newEpisodeIds[0]) : null;
store.close();

console.log(JSON.stringify({ workspace, dataDir, sourceDir, sessionPath, syncResult: result, counts, episode }, null, 2));
