import { defaultDatabasePath, FlightRecorderStore, getDefaultDataDir, type EpisodeSearchResult, type SearchOptions } from "./storage.js";
import type { FailureEpisode, SourceRef } from "./types.js";

export interface QueryOptions {
  dataDir?: string;
  limit?: number;
  cwd?: string;
}

export interface SeenBeforeResult {
  query: string;
  dataDir: string;
  results: EpisodeSearchResult[];
}

export function queryFailureMemory(query: string, options: QueryOptions = {}): SeenBeforeResult {
  const dataDir = options.dataDir ?? getDefaultDataDir();
  const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
  try {
    const searchOptions: SearchOptions = {};
    if (options.limit !== undefined) searchOptions.limit = options.limit;
    if (options.cwd) searchOptions.cwd = options.cwd;
    return {
      query,
      dataDir,
      results: store.searchEpisodes(query, searchOptions),
    };
  } finally {
    store.close();
  }
}

function refLabel(ref: SourceRef): string {
  const session = ref.sessionId ? `session ${ref.sessionId}` : "unknown session";
  const entry = ref.entryId ? `entry ${ref.entryId}` : `line ${ref.lineNumber}`;
  const cwd = ref.cwd ? `cwd ${ref.cwd}` : "cwd unknown";
  return `${session}, ${entry}, ${cwd}, ${ref.sourceFile}`;
}

function confidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return "likely";
  if (confidence >= 0.6) return "possible";
  return "low-confidence";
}

function formatEpisode(episode: FailureEpisode, index: number): string {
  const lines: string[] = [];
  lines.push(`${index + 1}. Seen before: ${confidenceLabel(episode.confidence)} match (${episode.confidence.toFixed(2)})`);
  lines.push(`   Episode: ${episode.id}`);
  lines.push(`   Failure: ${episode.problemSummary}`);
  if (episode.resolution) lines.push(`   Prior fix: ${episode.resolution.summary}`);
  else lines.push("   Prior fix: none detected");
  if (episode.attempts.length > 0) {
    lines.push("   Attempts / avoid-or-inspect:");
    for (const attempt of episode.attempts.slice(0, 3)) lines.push(`   - ${attempt.summary}`);
  }
  if (episode.files.length > 0) lines.push(`   Files: ${episode.files.slice(0, 6).join(", ")}`);
  lines.push("   Evidence:");
  for (const ref of episode.sourceRefs.slice(0, 4)) lines.push(`   - ${refLabel(ref)}`);
  if (episode.limits.length > 0) {
    lines.push("   Limits:");
    for (const limit of episode.limits) lines.push(`   - ${limit}`);
  }
  return lines.join("\n");
}

export function formatSeenBefore(result: SeenBeforeResult): string {
  if (result.results.length === 0) {
    return [
      "No prior failure-memory match found.",
      `Query: ${result.query}`,
      `Index: ${result.dataDir}`,
      "Try syncing sessions first with `pi-flight-recorder sync`, or query with exact error/file/command tokens.",
    ].join("\n");
  }

  return [
    `Found ${result.results.length} prior failure-memory match${result.results.length === 1 ? "" : "es"}.`,
    "",
    ...result.results.map((item, index) => formatEpisode(item.episode, index)),
  ].join("\n\n");
}
