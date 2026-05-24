import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runReflection } from "../../../../src/reflection.ts";
import { defaultDatabasePath, FlightRecorderStore } from "../../../../src/storage.ts";

const dataDir = process.argv[2] ?? mkdtempSync(join(tmpdir(), "pfr-rule-promotion-fixture-"));
const cwd = process.argv[3] ?? "/tmp/pfr-rule-promotion-workspace";
const now = "2026-05-23T19:00:00.000Z";

const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
try {
  store.recordFailureOccurrence({
    source: "tool_result",
    query: "Edit failed: oldText not found in src/app.ts. The requested oldText did not match current file contents.",
    toolName: "edit",
    cwd,
    entryId: "fixture-edit-r1",
    timestamp: "2026-05-23T18:58:00.000Z",
  });
  store.recordFailureOccurrence({
    source: "tool_result",
    query: "Edit failed: oldText not found in src/app.ts. The requested oldText did not match current file contents.",
    toolName: "edit",
    cwd,
    entryId: "fixture-edit-r2",
    timestamp: "2026-05-23T18:59:00.000Z",
  });
} finally {
  store.close();
}

const result = await runReflection({ dataDir, trigger: "manual", minCount: 2, limit: 1, now });
const summary = {
  dataDir,
  databasePath: defaultDatabasePath(dataDir),
  cwd,
  proposals: result.proposals.map((proposal) => ({
    id: proposal.id,
    clusterId: proposal.clusterId,
    title: proposal.title,
    likelyFix: proposal.likelyFix,
    confidence: proposal.confidence,
    evidenceCount: proposal.evidence.length,
  })),
  mining: { examined: result.mining.examined, clustersCreated: result.mining.clustersCreated },
};
console.log(JSON.stringify(summary, null, 2));
