import { stat } from "node:fs/promises";
import { extractFailureEpisodes } from "./extractor.js";
import { getDefaultSessionDirs, hashFile, listSessionFiles, parseSessionFile } from "./session-parser.js";
import { defaultDatabasePath, ensureDataDir, FlightRecorderStore, getDefaultDataDir } from "./storage.js";
import type { ParseWarning } from "./types.js";

export interface SyncOptions {
  sourceDirs?: string[];
  dataDir?: string;
  limit?: number;
  force?: boolean;
}

export interface SyncSessionFileOptions {
  dataDir?: string;
  force?: boolean;
}

export interface SyncSessionFileResult {
  dataDir: string;
  dbPath: string;
  sourceFile: string;
  indexed: boolean;
  skipped: boolean;
  episodesExtracted: number;
  newEpisodeIds: string[];
  warnings: number;
  parseWarnings: ParseWarning[];
}

export interface SyncResult {
  dataDir: string;
  dbPath: string;
  discovered: number;
  indexed: number;
  skipped: number;
  episodes: number;
  warnings: number;
  newEpisodes: number;
  newEpisodeIds: string[];
  files: SyncSessionFileResult[];
}

async function syncSessionFileWithStore(params: {
  store: FlightRecorderStore;
  dataDir: string;
  dbPath: string;
  file: string;
  force: boolean;
}): Promise<SyncSessionFileResult> {
  const fileStat = await stat(params.file);
  const sha256 = await hashFile(params.file);
  if (!params.force && params.store.isSourceCurrent(params.file, fileStat.size, fileStat.mtimeMs, sha256)) {
    return {
      dataDir: params.dataDir,
      dbPath: params.dbPath,
      sourceFile: params.file,
      indexed: false,
      skipped: true,
      episodesExtracted: 0,
      newEpisodeIds: [],
      warnings: 0,
      parseWarnings: [],
    };
  }

  const previousIds = new Set(params.store.getEpisodeIdsForSource(params.file));
  const parsed = await parseSessionFile(params.file);
  params.store.replaceParsedSession(parsed, { size: fileStat.size, mtimeMs: fileStat.mtimeMs, sha256 });
  const extracted = extractFailureEpisodes(parsed);
  params.store.replaceEpisodes(params.file, extracted);
  const newEpisodeIds = extracted.map((episode) => episode.id).filter((id) => !previousIds.has(id));

  return {
    dataDir: params.dataDir,
    dbPath: params.dbPath,
    sourceFile: params.file,
    indexed: true,
    skipped: false,
    episodesExtracted: extracted.length,
    newEpisodeIds,
    warnings: parsed.warnings.length,
    parseWarnings: parsed.warnings,
  };
}

export async function syncSessionFile(file: string, options: SyncSessionFileOptions = {}): Promise<SyncSessionFileResult> {
  const dataDir = options.dataDir ?? getDefaultDataDir();
  await ensureDataDir(dataDir);
  const dbPath = defaultDatabasePath(dataDir);
  const store = new FlightRecorderStore(dbPath);
  try {
    return await syncSessionFileWithStore({ store, dataDir, dbPath, file, force: options.force ?? false });
  } finally {
    store.close();
  }
}

export async function syncSessions(options: SyncOptions = {}): Promise<SyncResult> {
  const dataDir = options.dataDir ?? getDefaultDataDir();
  await ensureDataDir(dataDir);
  const dbPath = defaultDatabasePath(dataDir);
  const store = new FlightRecorderStore(dbPath);
  try {
    const sourceDirs = options.sourceDirs && options.sourceDirs.length > 0 ? options.sourceDirs : getDefaultSessionDirs();
    const discoveredFiles = await listSessionFiles(sourceDirs);
    const files = typeof options.limit === "number" ? discoveredFiles.slice(0, Math.max(0, options.limit)) : discoveredFiles;
    const fileResults: SyncSessionFileResult[] = [];

    for (const file of files) {
      fileResults.push(await syncSessionFileWithStore({ store, dataDir, dbPath, file, force: options.force ?? false }));
    }

    return {
      dataDir,
      dbPath,
      discovered: discoveredFiles.length,
      indexed: fileResults.filter((result) => result.indexed).length,
      skipped: fileResults.filter((result) => result.skipped).length,
      episodes: fileResults.reduce((total, result) => total + result.episodesExtracted, 0),
      warnings: fileResults.reduce((total, result) => total + result.warnings, 0),
      newEpisodes: fileResults.reduce((total, result) => total + result.newEpisodeIds.length, 0),
      newEpisodeIds: fileResults.flatMap((result) => result.newEpisodeIds),
      files: fileResults,
    };
  } finally {
    store.close();
  }
}
