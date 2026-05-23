import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { open, readFile, stat, unlink, writeFile } from "node:fs/promises";
import type { FileHandle } from "node:fs/promises";
import path from "node:path";
import { getDefaultSessionDirs, listSessionFiles } from "./session-parser.js";
import { ensureDataDir, getDefaultDataDir } from "./storage.js";
import { syncSessionFile, syncSessions, type SyncSessionFileResult } from "./sync.js";
import type { LiveMode } from "./live-suggestions.js";

export type WatchState = "stopped" | "catching-up" | "active" | "watched-by-another-process" | "errored";
export type WatchSyncOrigin = "catch-up" | "change";

export interface WatchFileSyncedEvent {
  origin: WatchSyncOrigin;
  result: SyncSessionFileResult;
}

export interface SessionWatchServiceOptions {
  sourceDirs?: string[];
  dataDir?: string;
  mode?: LiveMode;
  debounceMs?: number;
  pollIntervalMs?: number;
  forceCatchUp?: boolean;
  onFileSynced?: (event: WatchFileSyncedEvent) => void | Promise<void>;
  onStatus?: (status: SessionWatchStatus) => void | Promise<void>;
}

export interface SessionWatchStatus {
  state: WatchState;
  mode: LiveMode;
  dataDir: string;
  sourceDirs: string[];
  watchedPaths: string[];
  debounceMs: number;
  pollIntervalMs: number;
  lastSyncAt: string | null;
  lastFailure: { at: string; sourceFile: string; newEpisodeIds: string[] } | null;
  lastSuggestion: null;
  warningCount: number;
  errorCount: number;
  lastError: string | null;
  pendingFiles: string[];
  lockPath: string;
}

interface FileSnapshot {
  size: number;
  mtimeMs: number;
}

interface WatchLock {
  path: string;
  handle: FileHandle;
}

const DEFAULT_DEBOUNCE_MS = 2_000;
const DEFAULT_POLL_INTERVAL_MS = 1_000;

function sourceKey(sourceDirs: string[]): string {
  return createHash("sha256").update(sourceDirs.map((dir) => path.resolve(dir)).sort().join("\n")).digest("hex").slice(0, 16);
}

export function watchLockPath(dataDir: string, sourceDirs: string[]): string {
  return path.join(dataDir, `watch-${sourceKey(sourceDirs)}.lock`);
}

export function watchStatusPath(dataDir: string): string {
  return path.join(dataDir, "live-status.json");
}

export function watchStopRequestPath(dataDir: string): string {
  return path.join(dataDir, "watch-stop.json");
}

async function acquireLock(dataDir: string, sourceDirs: string[]): Promise<WatchLock | null> {
  await ensureDataDir(dataDir);
  const lockPath = watchLockPath(dataDir, sourceDirs);
  try {
    const handle = await open(lockPath, "wx");
    await handle.writeFile(JSON.stringify({ pid: process.pid, sourceDirs, createdAt: new Date().toISOString() }, null, 2));
    return { path: lockPath, handle };
  } catch (error) {
    if (error instanceof Error && "code" in error && (error as NodeJS.ErrnoException).code === "EEXIST") return null;
    throw error;
  }
}

async function releaseLock(lock: WatchLock | null): Promise<void> {
  if (!lock) return;
  await lock.handle.close().catch(() => undefined);
  await unlink(lock.path).catch(() => undefined);
}

async function fileSnapshot(file: string): Promise<FileSnapshot | null> {
  try {
    const fileStat = await stat(file);
    if (!fileStat.isFile()) return null;
    return { size: fileStat.size, mtimeMs: fileStat.mtimeMs };
  } catch {
    return null;
  }
}

export async function requestWatchStop(dataDir = getDefaultDataDir()): Promise<string> {
  await ensureDataDir(dataDir);
  const stopPath = watchStopRequestPath(dataDir);
  await writeFile(stopPath, JSON.stringify({ requestedAt: new Date().toISOString(), pid: process.pid }, null, 2));
  return stopPath;
}

export async function clearWatchStopRequest(dataDir = getDefaultDataDir()): Promise<void> {
  await unlink(watchStopRequestPath(dataDir)).catch(() => undefined);
}

export async function readPersistedWatchStatus(dataDir = getDefaultDataDir()): Promise<SessionWatchStatus | null> {
  try {
    return JSON.parse(await readFile(watchStatusPath(dataDir), "utf8")) as SessionWatchStatus;
  } catch {
    return null;
  }
}

export class SessionWatchService {
  private readonly sourceDirs: string[];
  private readonly dataDir: string;
  private readonly mode: LiveMode;
  private readonly debounceMs: number;
  private readonly pollIntervalMs: number;
  private readonly forceCatchUp: boolean;
  private readonly onFileSynced: ((event: WatchFileSyncedEvent) => void | Promise<void>) | undefined;
  private readonly onStatus: ((status: SessionWatchStatus) => void | Promise<void>) | undefined;
  private state: WatchState = "stopped";
  private lock: WatchLock | null = null;
  private pollTimer: NodeJS.Timeout | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;
  private pendingFiles = new Set<string>();
  private watchedPaths = new Map<string, FileSnapshot>();
  private lastSyncAt: string | null = null;
  private lastFailure: SessionWatchStatus["lastFailure"] = null;
  private warningCount = 0;
  private errorCount = 0;
  private lastError: string | null = null;
  private readonly stoppedPromise: Promise<void>;
  private resolveStopped: (() => void) | null = null;

  constructor(options: SessionWatchServiceOptions = {}) {
    this.sourceDirs = options.sourceDirs && options.sourceDirs.length > 0 ? options.sourceDirs : getDefaultSessionDirs();
    this.dataDir = options.dataDir ?? getDefaultDataDir();
    this.mode = options.mode ?? "index-only";
    this.debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;
    this.pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    this.forceCatchUp = options.forceCatchUp ?? false;
    this.onFileSynced = options.onFileSynced;
    this.onStatus = options.onStatus;
    this.stoppedPromise = new Promise((resolve) => {
      this.resolveStopped = resolve;
    });
  }

  async start(): Promise<SessionWatchStatus> {
    if (this.state === "active" || this.state === "catching-up") return this.status();
    await ensureDataDir(this.dataDir);
    await clearWatchStopRequest(this.dataDir);
    this.lock = await acquireLock(this.dataDir, this.sourceDirs);
    if (!this.lock) {
      this.state = "watched-by-another-process";
      this.lastError = "Another pi-flight-recorder watcher owns the lock for these source directories.";
      await this.emitStatus();
      return this.status();
    }

    this.state = "catching-up";
    await this.emitStatus();
    try {
      const catchUp = await syncSessions({ sourceDirs: this.sourceDirs, dataDir: this.dataDir, force: this.forceCatchUp });
      for (const result of catchUp.files) await this.recordSyncResult({ origin: "catch-up", result });
      await this.refreshSnapshot();
      this.state = "active";
      this.pollTimer = setInterval(() => {
        void this.poll();
      }, this.pollIntervalMs);
      await this.emitStatus();
      return this.status();
    } catch (error) {
      this.recordError(error);
      this.state = "errored";
      await releaseLock(this.lock);
      this.lock = null;
      await this.emitStatus();
      return this.status();
    }
  }

  async stop(): Promise<SessionWatchStatus> {
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.pollTimer = null;
    this.debounceTimer = null;
    this.pendingFiles.clear();
    await releaseLock(this.lock);
    this.lock = null;
    this.state = "stopped";
    await clearWatchStopRequest(this.dataDir);
    await this.emitStatus();
    this.resolveStopped?.();
    return this.status();
  }

  status(): SessionWatchStatus {
    return {
      state: this.state,
      mode: this.mode,
      dataDir: this.dataDir,
      sourceDirs: [...this.sourceDirs],
      watchedPaths: Array.from(this.watchedPaths.keys()).sort(),
      debounceMs: this.debounceMs,
      pollIntervalMs: this.pollIntervalMs,
      lastSyncAt: this.lastSyncAt,
      lastFailure: this.lastFailure,
      lastSuggestion: null,
      warningCount: this.warningCount,
      errorCount: this.errorCount,
      lastError: this.lastError,
      pendingFiles: Array.from(this.pendingFiles).sort(),
      lockPath: watchLockPath(this.dataDir, this.sourceDirs),
    };
  }

  async waitUntilStopped(): Promise<void> {
    await this.stoppedPromise;
  }

  notifyFileChanged(file: string): void {
    if (!file.endsWith(".jsonl")) return;
    this.pendingFiles.add(file);
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      void this.flushPending();
    }, this.debounceMs);
  }

  private async poll(): Promise<void> {
    if (this.state !== "active") return;
    if (existsSync(watchStopRequestPath(this.dataDir))) {
      await this.stop();
      return;
    }

    try {
      const files = await listSessionFiles(this.sourceDirs);
      const seen = new Set(files);
      for (const file of files) {
        const snapshot = await fileSnapshot(file);
        if (!snapshot) continue;
        const previous = this.watchedPaths.get(file);
        if (!previous || previous.size !== snapshot.size || previous.mtimeMs !== snapshot.mtimeMs) this.notifyFileChanged(file);
        this.watchedPaths.set(file, snapshot);
      }
      for (const file of Array.from(this.watchedPaths.keys())) {
        if (!seen.has(file)) this.watchedPaths.delete(file);
      }
    } catch (error) {
      this.recordError(error);
      await this.emitStatus();
    }
  }

  private async flushPending(): Promise<void> {
    const files = Array.from(this.pendingFiles).sort();
    this.pendingFiles.clear();
    for (const file of files) {
      try {
        const result = await syncSessionFile(file, { dataDir: this.dataDir });
        const snapshot = await fileSnapshot(file);
        if (snapshot) this.watchedPaths.set(file, snapshot);
        await this.recordSyncResult({ origin: "change", result });
      } catch (error) {
        this.recordError(error);
      }
    }
    await this.emitStatus();
  }

  private async refreshSnapshot(): Promise<void> {
    this.watchedPaths.clear();
    const files = await listSessionFiles(this.sourceDirs);
    for (const file of files) {
      const snapshot = await fileSnapshot(file);
      if (snapshot) this.watchedPaths.set(file, snapshot);
    }
  }

  private async recordSyncResult(event: WatchFileSyncedEvent): Promise<void> {
    this.lastSyncAt = new Date().toISOString();
    this.warningCount += event.result.warnings;
    if (event.result.newEpisodeIds.length > 0) {
      this.lastFailure = {
        at: this.lastSyncAt,
        sourceFile: event.result.sourceFile,
        newEpisodeIds: event.result.newEpisodeIds,
      };
    }
    if (this.onFileSynced) await this.onFileSynced(event);
  }

  private recordError(error: unknown): void {
    this.errorCount += 1;
    this.lastError = error instanceof Error ? error.message : String(error);
  }

  private async emitStatus(): Promise<void> {
    const status = this.status();
    await writeFile(watchStatusPath(this.dataDir), JSON.stringify(status, null, 2)).catch(() => undefined);
    if (this.onStatus) await this.onStatus(status);
  }
}
