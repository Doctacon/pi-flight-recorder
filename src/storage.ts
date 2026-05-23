import { createHash } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { DatabaseSync, type StatementSync } from "node:sqlite";
import { compactSnippet, redactSecrets } from "./redact.js";
import { normalizeFailureSignature } from "./signatures.js";
import type {
  ClusterEvidenceRef,
  FailureCluster,
  FailureClusterStatus,
  FailureEpisode,
  FeedbackAction,
  FeedbackActionRecord,
  FeedbackTargetType,
  LiveFailureOccurrence,
  NewFailureOccurrence,
  ParsedSession,
  ParseWarning,
  ReflectionProposal,
  SessionEvent,
  SourceRef,
  SuggestionOutcome,
} from "./types.js";

export interface SourceFileRecord {
  path: string;
  size: number;
  mtimeMs: number;
  sha256: string;
  sessionId: string | null;
  cwd: string | null;
  indexedAt: string;
}

export interface SearchOptions {
  limit?: number;
  cwd?: string;
  excludeEpisodeIds?: string[];
}

export interface EpisodeSearchResult {
  episode: FailureEpisode;
  score: number;
}

export interface OccurrenceListOptions {
  limit?: number;
  cwd?: string;
  signature?: string;
  suggestionKind?: SuggestionOutcome["kind"];
  since?: string;
}

export interface ClusterListOptions {
  limit?: number;
  status?: FailureClusterStatus;
  minCount?: number;
}

interface EpisodeRow {
  id: string;
  sourceFile: string;
  signature: string;
  problemSummary: string;
  status: string;
  confidence: number;
  cwd: string | null;
  sessionId: string | null;
  sourceRefsJson: string;
  observed: string;
  attemptsJson: string;
  resolutionJson: string | null;
  filesJson: string;
  limitsJson: string;
  searchText: string;
}

interface OccurrenceRow {
  id: string;
  dedupeKey: string;
  source: string;
  toolName: string | null;
  command: string | null;
  cwd: string | null;
  sessionFile: string | null;
  entryId: string | null;
  timestamp: string | null;
  signature: string;
  queryPreview: string;
  snippet: string;
  repeatCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  suggestionJson: string | null;
  dataJson: string;
}

interface FeedbackActionRow {
  id: number;
  targetType: string;
  targetId: string;
  action: string;
  signature: string | null;
  note: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface FailureClusterRow {
  id: string;
  clusterKey: string;
  title: string;
  representativeSignature: string;
  status: string;
  count: number;
  occurrenceIdsJson: string;
  cwdSummaryJson: string;
  toolsJson: string;
  firstSeenAt: string;
  lastSeenAt: string;
  lastReflectedAt: string | null;
  score: number;
}

interface ReflectionProposalRow {
  id: string;
  clusterId: string;
  generatedAt: string;
  mode: string;
  title: string;
  summary: string;
  affectedJson: string;
  likelyFix: string;
  confidence: number;
  evidenceJson: string;
  limitsJson: string;
  actionsJson: string;
}

function json(value: unknown): string {
  return JSON.stringify(value);
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function hash(value: string, length = 16): string {
  return createHash("sha256").update(value).digest("hex").slice(0, length);
}

function rowToEpisode(row: EpisodeRow): FailureEpisode {
  return {
    id: row.id,
    sourceFile: row.sourceFile,
    signature: row.signature,
    problemSummary: row.problemSummary,
    status: row.status === "resolved" ? "resolved" : "unresolved",
    confidence: row.confidence,
    cwd: row.cwd,
    sessionId: row.sessionId,
    sourceRefs: parseJson<SourceRef[]>(row.sourceRefsJson, []),
    observed: row.observed,
    attempts: parseJson(row.attemptsJson, []),
    resolution: row.resolutionJson ? parseJson(row.resolutionJson, null) : null,
    files: parseJson<string[]>(row.filesJson, []),
    limits: parseJson<string[]>(row.limitsJson, []),
    searchText: row.searchText,
  };
}

function rowToOccurrence(row: OccurrenceRow): LiveFailureOccurrence {
  return {
    id: row.id,
    dedupeKey: row.dedupeKey,
    source: row.source as LiveFailureOccurrence["source"],
    toolName: row.toolName,
    command: row.command,
    cwd: row.cwd,
    sessionFile: row.sessionFile,
    entryId: row.entryId,
    timestamp: row.timestamp,
    signature: row.signature,
    queryPreview: row.queryPreview,
    snippet: row.snippet,
    repeatCount: row.repeatCount,
    firstSeenAt: row.firstSeenAt,
    lastSeenAt: row.lastSeenAt,
    suggestion: row.suggestionJson ? parseJson<SuggestionOutcome | null>(row.suggestionJson, null) : null,
    data: parseJson<Record<string, unknown>>(row.dataJson, {}),
  };
}

function rowToFeedback(row: FeedbackActionRow): FeedbackActionRecord {
  return {
    id: row.id,
    targetType: row.targetType as FeedbackTargetType,
    targetId: row.targetId,
    action: row.action as FeedbackAction,
    signature: row.signature,
    note: row.note,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
  };
}

function rowToCluster(row: FailureClusterRow): FailureCluster {
  return {
    id: row.id,
    clusterKey: row.clusterKey,
    title: row.title,
    representativeSignature: row.representativeSignature,
    status: row.status as FailureClusterStatus,
    count: row.count,
    occurrenceIds: parseJson<string[]>(row.occurrenceIdsJson, []),
    cwdSummary: parseJson<string[]>(row.cwdSummaryJson, []),
    tools: parseJson<string[]>(row.toolsJson, []),
    firstSeenAt: row.firstSeenAt,
    lastSeenAt: row.lastSeenAt,
    lastReflectedAt: row.lastReflectedAt,
    score: row.score,
  };
}

function rowToProposal(row: ReflectionProposalRow): ReflectionProposal {
  return {
    id: row.id,
    clusterId: row.clusterId,
    generatedAt: row.generatedAt,
    mode: row.mode === "model-assisted" ? "model-assisted" : "local",
    title: row.title,
    summary: row.summary,
    affected: parseJson<string[]>(row.affectedJson, []),
    likelyFix: row.likelyFix,
    confidence: row.confidence,
    evidence: parseJson<ClusterEvidenceRef[]>(row.evidenceJson, []),
    limits: parseJson<string[]>(row.limitsJson, []),
    actions: parseJson<FeedbackAction[]>(row.actionsJson, []),
  };
}

export function getDefaultDataDir(): string {
  return path.join(homedir(), ".pi", "flight-recorder");
}

export async function ensureDataDir(dataDir: string): Promise<void> {
  await mkdir(dataDir, { recursive: true });
}

export function defaultDatabasePath(dataDir = getDefaultDataDir()): string {
  return path.join(dataDir, "flight-recorder.db");
}

export class FlightRecorderStore {
  private readonly db: DatabaseSync;

  constructor(readonly dbPath: string) {
    const dir = path.dirname(dbPath);
    if (dir !== "." && !existsSync(dir)) mkdirSync(dir, { recursive: true });
    this.db = new DatabaseSync(dbPath);
    this.initialize();
  }

  close(): void {
    this.db.close();
  }

  private initialize(): void {
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS source_files (
        path TEXT PRIMARY KEY,
        size INTEGER NOT NULL,
        mtimeMs REAL NOT NULL,
        sha256 TEXT NOT NULL,
        sessionId TEXT,
        cwd TEXT,
        indexedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS events (
        eventKey TEXT PRIMARY KEY,
        sourceFile TEXT NOT NULL,
        lineNumber INTEGER NOT NULL,
        sessionId TEXT,
        cwd TEXT,
        entryId TEXT,
        parentId TEXT,
        timestamp TEXT,
        entryType TEXT NOT NULL,
        role TEXT,
        kind TEXT NOT NULL,
        ancestryJson TEXT NOT NULL,
        searchText TEXT NOT NULL,
        dataJson TEXT NOT NULL,
        FOREIGN KEY(sourceFile) REFERENCES source_files(path) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS parse_warnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sourceFile TEXT NOT NULL,
        lineNumber INTEGER NOT NULL,
        message TEXT NOT NULL,
        FOREIGN KEY(sourceFile) REFERENCES source_files(path) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS episodes (
        id TEXT PRIMARY KEY,
        sourceFile TEXT NOT NULL,
        signature TEXT NOT NULL,
        problemSummary TEXT NOT NULL,
        status TEXT NOT NULL,
        confidence REAL NOT NULL,
        cwd TEXT,
        sessionId TEXT,
        sourceRefsJson TEXT NOT NULL,
        observed TEXT NOT NULL,
        attemptsJson TEXT NOT NULL,
        resolutionJson TEXT,
        filesJson TEXT NOT NULL,
        limitsJson TEXT NOT NULL,
        searchText TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY(sourceFile) REFERENCES source_files(path) ON DELETE CASCADE
      );

      CREATE VIRTUAL TABLE IF NOT EXISTS episode_fts USING fts5(
        id UNINDEXED,
        signature,
        problemSummary,
        searchText,
        tokenize = 'porter unicode61'
      );

      CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        episodeId TEXT NOT NULL,
        rating TEXT NOT NULL,
        note TEXT,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS failure_occurrences (
        id TEXT PRIMARY KEY,
        dedupeKey TEXT NOT NULL UNIQUE,
        source TEXT NOT NULL,
        toolName TEXT,
        command TEXT,
        cwd TEXT,
        sessionFile TEXT,
        entryId TEXT,
        timestamp TEXT,
        signature TEXT NOT NULL,
        queryPreview TEXT NOT NULL,
        snippet TEXT NOT NULL,
        repeatCount INTEGER NOT NULL,
        firstSeenAt TEXT NOT NULL,
        lastSeenAt TEXT NOT NULL,
        suggestionJson TEXT,
        dataJson TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_failure_occurrences_signature ON failure_occurrences(signature);
      CREATE INDEX IF NOT EXISTS idx_failure_occurrences_cwd ON failure_occurrences(cwd);
      CREATE INDEX IF NOT EXISTS idx_failure_occurrences_last_seen ON failure_occurrences(lastSeenAt);

      CREATE TABLE IF NOT EXISTS feedback_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        targetType TEXT NOT NULL,
        targetId TEXT NOT NULL,
        action TEXT NOT NULL,
        signature TEXT,
        note TEXT,
        expiresAt TEXT,
        createdAt TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_feedback_actions_target ON feedback_actions(targetType, targetId);
      CREATE INDEX IF NOT EXISTS idx_feedback_actions_signature ON feedback_actions(signature, action, expiresAt);

      CREATE TABLE IF NOT EXISTS failure_clusters (
        id TEXT PRIMARY KEY,
        clusterKey TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        representativeSignature TEXT NOT NULL,
        status TEXT NOT NULL,
        count INTEGER NOT NULL,
        occurrenceIdsJson TEXT NOT NULL,
        cwdSummaryJson TEXT NOT NULL,
        toolsJson TEXT NOT NULL,
        firstSeenAt TEXT NOT NULL,
        lastSeenAt TEXT NOT NULL,
        lastReflectedAt TEXT,
        score REAL NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS cluster_occurrences (
        clusterId TEXT NOT NULL,
        occurrenceId TEXT NOT NULL,
        PRIMARY KEY(clusterId, occurrenceId),
        FOREIGN KEY(clusterId) REFERENCES failure_clusters(id) ON DELETE CASCADE,
        FOREIGN KEY(occurrenceId) REFERENCES failure_occurrences(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS reflection_proposals (
        id TEXT PRIMARY KEY,
        clusterId TEXT NOT NULL,
        generatedAt TEXT NOT NULL,
        mode TEXT NOT NULL,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        affectedJson TEXT NOT NULL,
        likelyFix TEXT NOT NULL,
        confidence REAL NOT NULL,
        evidenceJson TEXT NOT NULL,
        limitsJson TEXT NOT NULL,
        actionsJson TEXT NOT NULL,
        FOREIGN KEY(clusterId) REFERENCES failure_clusters(id) ON DELETE CASCADE
      );

      INSERT OR REPLACE INTO meta(key, value) VALUES ('schemaVersion', '2');
    `);
  }

  getSource(pathValue: string): SourceFileRecord | null {
    const row = this.db.prepare("SELECT path, size, mtimeMs, sha256, sessionId, cwd, indexedAt FROM source_files WHERE path = ?").get(pathValue) as SourceFileRecord | undefined;
    return row ?? null;
  }

  isSourceCurrent(pathValue: string, size: number, mtimeMs: number, sha256: string): boolean {
    const existing = this.getSource(pathValue);
    return Boolean(existing && existing.size === size && existing.mtimeMs === mtimeMs && existing.sha256 === sha256);
  }

  replaceParsedSession(parsed: ParsedSession, fileMeta: { size: number; mtimeMs: number; sha256: string }): void {
    const indexedAt = new Date().toISOString();
    this.transaction(() => {
      this.deleteSourceData(parsed.sourceFile);
      this.db
        .prepare("INSERT INTO source_files(path, size, mtimeMs, sha256, sessionId, cwd, indexedAt) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .run(parsed.sourceFile, fileMeta.size, fileMeta.mtimeMs, fileMeta.sha256, parsed.header?.id ?? null, parsed.header?.cwd ?? null, indexedAt);

      const eventInsert = this.db.prepare(`
        INSERT INTO events(eventKey, sourceFile, lineNumber, sessionId, cwd, entryId, parentId, timestamp, entryType, role, kind, ancestryJson, searchText, dataJson)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const event of parsed.events) this.insertEvent(eventInsert, event);

      const warningInsert = this.db.prepare("INSERT INTO parse_warnings(sourceFile, lineNumber, message) VALUES (?, ?, ?)");
      for (const warning of parsed.warnings) this.insertWarning(warningInsert, warning);
    });
  }

  replaceEpisodes(sourceFile: string, episodes: FailureEpisode[]): void {
    this.transaction(() => {
      const ids = this.db.prepare("SELECT id FROM episodes WHERE sourceFile = ?").all(sourceFile) as Array<{ id: string }>;
      const deleteFts = this.db.prepare("DELETE FROM episode_fts WHERE id = ?");
      for (const row of ids) deleteFts.run(row.id);
      this.db.prepare("DELETE FROM episodes WHERE sourceFile = ?").run(sourceFile);

      const episodeInsert = this.db.prepare(`
        INSERT INTO episodes(id, sourceFile, signature, problemSummary, status, confidence, cwd, sessionId, sourceRefsJson, observed, attemptsJson, resolutionJson, filesJson, limitsJson, searchText, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const ftsInsert = this.db.prepare("INSERT INTO episode_fts(id, signature, problemSummary, searchText) VALUES (?, ?, ?, ?)");
      const createdAt = new Date().toISOString();
      for (const episode of episodes) {
        episodeInsert.run(
          episode.id,
          episode.sourceFile,
          episode.signature,
          episode.problemSummary,
          episode.status,
          episode.confidence,
          episode.cwd,
          episode.sessionId,
          json(episode.sourceRefs),
          episode.observed,
          json(episode.attempts),
          episode.resolution ? json(episode.resolution) : null,
          json(episode.files),
          json(episode.limits),
          episode.searchText,
          createdAt,
        );
        ftsInsert.run(episode.id, episode.signature, episode.problemSummary, episode.searchText);
      }
    });
  }

  count(table: "source_files" | "events" | "parse_warnings" | "episodes" | "failure_occurrences" | "feedback_actions" | "failure_clusters" | "reflection_proposals"): number {
    const row = this.db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count: number };
    return row.count;
  }

  getEpisodeIdsForSource(sourceFile: string): string[] {
    const rows = this.db.prepare("SELECT id FROM episodes WHERE sourceFile = ? ORDER BY id").all(sourceFile) as Array<{ id: string }>;
    return rows.map((row) => row.id);
  }

  getEpisode(id: string): FailureEpisode | null {
    const row = this.db.prepare("SELECT * FROM episodes WHERE id = ?").get(id) as EpisodeRow | undefined;
    return row ? rowToEpisode(row) : null;
  }

  getEpisodes(ids: string[]): FailureEpisode[] {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => "?").join(", ");
    const rows = this.db.prepare(`SELECT * FROM episodes WHERE id IN (${placeholders})`).all(...ids) as unknown as EpisodeRow[];
    const byId = new Map(rows.map((row) => [row.id, rowToEpisode(row)]));
    return ids.flatMap((id) => {
      const episode = byId.get(id);
      return episode ? [episode] : [];
    });
  }

  searchEpisodes(query: string, options: SearchOptions = {}): EpisodeSearchResult[] {
    const ftsQuery = buildFtsQuery(query);
    if (!ftsQuery) return [];
    const limit = Math.max(1, Math.min(options.limit ?? 5, 50));
    const excludeEpisodeIds = Array.from(new Set(options.excludeEpisodeIds ?? [])).filter(Boolean);
    const rows = this.prepareSearch({ withCwd: Boolean(options.cwd), excludeCount: excludeEpisodeIds.length }).all(
      ...[
        ftsQuery,
        ...(options.cwd ? [options.cwd] : []),
        ...excludeEpisodeIds,
        limit,
      ],
    ) as unknown as Array<EpisodeRow & { score: number }>;
    return rows.map((row) => ({ episode: rowToEpisode(row), score: row.score }));
  }

  recordFeedback(episodeId: string, rating: string, note: string | null = null): void {
    const createdAt = new Date().toISOString();
    this.transaction(() => {
      this.db.prepare("INSERT INTO feedback(episodeId, rating, note, createdAt) VALUES (?, ?, ?, ?)").run(episodeId, rating, note, createdAt);
      this.db.prepare("INSERT INTO feedback_actions(targetType, targetId, action, signature, note, expiresAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
        "episode",
        episodeId,
        rating,
        null,
        note,
        null,
        createdAt,
      );
    });
  }

  recordFailureOccurrence(input: NewFailureOccurrence): LiveFailureOccurrence {
    const now = input.now ?? new Date().toISOString();
    const redactedQuery = redactSecrets(input.query).trim();
    const signatureInput: { query: string; signature?: string | null; fallbackId?: string | null } = { query: redactedQuery, fallbackId: input.entryId ?? null };
    if (input.signature !== undefined) signatureInput.signature = input.signature;
    const signature = normalizeFailureSignature(signatureInput);
    const queryPreview = compactSnippet(redactedQuery.replace(/\s+/g, " "), 180);
    const snippet = compactSnippet(redactedQuery, 1_200);
    const dedupeKey = input.dedupeKey?.trim() || [input.source, input.cwd ?? "", input.sessionFile ?? "", input.entryId ?? "", signature, hash(redactedQuery, 12)].join("\u0000");
    const id = `occ_${hash(dedupeKey)}`;
    const data = input.data ?? {};

    this.transaction(() => {
      this.db.prepare(`
        INSERT INTO failure_occurrences(id, dedupeKey, source, toolName, command, cwd, sessionFile, entryId, timestamp, signature, queryPreview, snippet, repeatCount, firstSeenAt, lastSeenAt, suggestionJson, dataJson)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NULL, ?)
        ON CONFLICT(dedupeKey) DO UPDATE SET
          repeatCount = repeatCount + 1,
          lastSeenAt = excluded.lastSeenAt,
          queryPreview = excluded.queryPreview,
          snippet = excluded.snippet,
          dataJson = excluded.dataJson
      `).run(
        id,
        dedupeKey,
        input.source,
        input.toolName ?? null,
        input.command ?? null,
        input.cwd ?? null,
        input.sessionFile ?? null,
        input.entryId ?? null,
        input.timestamp ?? null,
        signature,
        queryPreview,
        snippet,
        now,
        now,
        json(data),
      );
    });

    const occurrence = this.getFailureOccurrence(id);
    if (!occurrence) throw new Error(`Failed to record occurrence ${id}`);
    return occurrence;
  }

  updateOccurrenceSuggestion(occurrenceId: string, suggestion: SuggestionOutcome): void {
    this.db.prepare("UPDATE failure_occurrences SET suggestionJson = ? WHERE id = ?").run(json(suggestion), occurrenceId);
  }

  getFailureOccurrence(id: string): LiveFailureOccurrence | null {
    const row = this.db.prepare("SELECT * FROM failure_occurrences WHERE id = ?").get(id) as OccurrenceRow | undefined;
    return row ? rowToOccurrence(row) : null;
  }

  listFailureOccurrences(options: OccurrenceListOptions = {}): LiveFailureOccurrence[] {
    const clauses: string[] = [];
    const params: Array<string | number> = [];
    if (options.cwd) {
      clauses.push("cwd = ?");
      params.push(options.cwd);
    }
    if (options.signature) {
      clauses.push("signature = ?");
      params.push(options.signature);
    }
    if (options.since) {
      clauses.push("lastSeenAt >= ?");
      params.push(options.since);
    }
    if (options.suggestionKind) {
      clauses.push("json_extract(suggestionJson, '$.kind') = ?");
      params.push(options.suggestionKind);
    }
    const limit = Math.max(1, Math.min(options.limit ?? 200, 2_000));
    const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
    const rows = this.db.prepare(`SELECT * FROM failure_occurrences ${where} ORDER BY lastSeenAt DESC LIMIT ?`).all(...params, limit) as unknown as OccurrenceRow[];
    return rows.map(rowToOccurrence);
  }

  recordFeedbackAction(input: {
    targetType: FeedbackTargetType;
    targetId: string;
    action: FeedbackAction;
    signature?: string | null;
    note?: string | null;
    expiresAt?: string | null;
    now?: string;
  }): FeedbackActionRecord {
    const createdAt = input.now ?? new Date().toISOString();
    const signature = input.signature ? normalizeFailureSignature({ query: input.signature, signature: input.signature }) : null;
    const result = this.db.prepare("INSERT INTO feedback_actions(targetType, targetId, action, signature, note, expiresAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      input.targetType,
      input.targetId,
      input.action,
      signature,
      input.note ?? null,
      input.expiresAt ?? null,
      createdAt,
    );
    const id = Number(result.lastInsertRowid);
    const row = this.db.prepare("SELECT * FROM feedback_actions WHERE id = ?").get(id) as FeedbackActionRow | undefined;
    if (!row) throw new Error(`Failed to record feedback action ${id}`);
    return rowToFeedback(row);
  }

  getFeedbackActions(options: {
    targetType?: FeedbackTargetType;
    targetId?: string;
    signature?: string;
    actions?: FeedbackAction[];
    activeAt?: string;
    limit?: number;
  } = {}): FeedbackActionRecord[] {
    const clauses: string[] = [];
    const params: Array<string | number> = [];
    if (options.targetType) {
      clauses.push("targetType = ?");
      params.push(options.targetType);
    }
    if (options.targetId) {
      clauses.push("targetId = ?");
      params.push(options.targetId);
    }
    if (options.signature) {
      clauses.push("signature = ?");
      params.push(options.signature);
    }
    if (options.actions && options.actions.length > 0) {
      clauses.push(`action IN (${options.actions.map(() => "?").join(", ")})`);
      params.push(...options.actions);
    }
    if (options.activeAt) {
      clauses.push("(expiresAt IS NULL OR expiresAt > ?)");
      params.push(options.activeAt);
    }
    const limit = Math.max(1, Math.min(options.limit ?? 20, 200));
    const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
    const rows = this.db.prepare(`SELECT * FROM feedback_actions ${where} ORDER BY createdAt DESC, id DESC LIMIT ?`).all(...params, limit) as unknown as FeedbackActionRow[];
    return rows.map(rowToFeedback);
  }

  hasActiveSignatureSuppression(signature: string, at = new Date().toISOString()): FeedbackActionRecord | null {
    const rows = this.getFeedbackActions({ signature, actions: ["snooze", "silence-pattern"], activeAt: at, limit: 1 });
    return rows[0] ?? null;
  }

  upsertFailureCluster(cluster: FailureCluster): FailureCluster {
    const now = new Date().toISOString();
    const existing = this.db.prepare("SELECT status, lastReflectedAt, createdAt FROM failure_clusters WHERE id = ?").get(cluster.id) as { status: string; lastReflectedAt: string | null; createdAt: string } | undefined;
    const status = existing && existing.status !== "active" ? existing.status : cluster.status;
    const lastReflectedAt = existing?.lastReflectedAt ?? cluster.lastReflectedAt;
    this.db.prepare(`
      INSERT INTO failure_clusters(id, clusterKey, title, representativeSignature, status, count, occurrenceIdsJson, cwdSummaryJson, toolsJson, firstSeenAt, lastSeenAt, lastReflectedAt, score, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        clusterKey = excluded.clusterKey,
        title = excluded.title,
        representativeSignature = excluded.representativeSignature,
        status = CASE WHEN failure_clusters.status = 'active' THEN excluded.status ELSE failure_clusters.status END,
        count = excluded.count,
        occurrenceIdsJson = excluded.occurrenceIdsJson,
        cwdSummaryJson = excluded.cwdSummaryJson,
        toolsJson = excluded.toolsJson,
        firstSeenAt = excluded.firstSeenAt,
        lastSeenAt = excluded.lastSeenAt,
        score = excluded.score,
        updatedAt = excluded.updatedAt
    `).run(
      cluster.id,
      cluster.clusterKey,
      cluster.title,
      cluster.representativeSignature,
      status,
      cluster.count,
      json(cluster.occurrenceIds),
      json(cluster.cwdSummary),
      json(cluster.tools),
      cluster.firstSeenAt,
      cluster.lastSeenAt,
      lastReflectedAt,
      cluster.score,
      existing?.createdAt ?? now,
      now,
    );
    this.replaceClusterMembers(cluster.id, cluster.occurrenceIds);
    const saved = this.getFailureCluster(cluster.id);
    if (!saved) throw new Error(`Failed to save cluster ${cluster.id}`);
    return saved;
  }

  replaceClusterMembers(clusterId: string, occurrenceIds: string[]): void {
    this.transaction(() => {
      this.db.prepare("DELETE FROM cluster_occurrences WHERE clusterId = ?").run(clusterId);
      const insert = this.db.prepare("INSERT OR IGNORE INTO cluster_occurrences(clusterId, occurrenceId) VALUES (?, ?)");
      for (const occurrenceId of Array.from(new Set(occurrenceIds))) insert.run(clusterId, occurrenceId);
    });
  }

  listFailureClusters(options: ClusterListOptions = {}): FailureCluster[] {
    const clauses: string[] = [];
    const params: Array<string | number> = [];
    if (options.status) {
      clauses.push("status = ?");
      params.push(options.status);
    }
    if (options.minCount !== undefined) {
      clauses.push("count >= ?");
      params.push(options.minCount);
    }
    const limit = Math.max(1, Math.min(options.limit ?? 50, 500));
    const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
    const rows = this.db.prepare(`SELECT * FROM failure_clusters ${where} ORDER BY score DESC, lastSeenAt DESC LIMIT ?`).all(...params, limit) as unknown as FailureClusterRow[];
    return rows.map(rowToCluster);
  }

  getFailureCluster(id: string): FailureCluster | null {
    const row = this.db.prepare("SELECT * FROM failure_clusters WHERE id = ?").get(id) as FailureClusterRow | undefined;
    return row ? rowToCluster(row) : null;
  }

  updateClusterStatus(clusterId: string, status: FailureClusterStatus): void {
    this.db.prepare("UPDATE failure_clusters SET status = ?, updatedAt = ? WHERE id = ?").run(status, new Date().toISOString(), clusterId);
  }

  markClusterReflected(clusterId: string, at = new Date().toISOString()): void {
    this.db.prepare("UPDATE failure_clusters SET lastReflectedAt = ?, updatedAt = ? WHERE id = ?").run(at, at, clusterId);
  }

  getClusterEvidence(clusterId: string, limit = 5): ClusterEvidenceRef[] {
    const rows = this.db.prepare(`
      SELECT o.*
      FROM cluster_occurrences co
      JOIN failure_occurrences o ON o.id = co.occurrenceId
      WHERE co.clusterId = ?
      ORDER BY o.repeatCount DESC, o.lastSeenAt DESC
      LIMIT ?
    `).all(clusterId, Math.max(1, Math.min(limit, 20))) as unknown as OccurrenceRow[];
    return rows.map((row) => ({
      occurrenceId: row.id,
      source: row.source as LiveFailureOccurrence["source"],
      cwd: row.cwd,
      sessionFile: row.sessionFile,
      entryId: row.entryId,
      snippet: row.snippet,
      seenAt: row.lastSeenAt,
    }));
  }

  recordReflectionProposal(proposal: ReflectionProposal): ReflectionProposal {
    this.db.prepare(`
      INSERT INTO reflection_proposals(id, clusterId, generatedAt, mode, title, summary, affectedJson, likelyFix, confidence, evidenceJson, limitsJson, actionsJson)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        generatedAt = excluded.generatedAt,
        mode = excluded.mode,
        title = excluded.title,
        summary = excluded.summary,
        affectedJson = excluded.affectedJson,
        likelyFix = excluded.likelyFix,
        confidence = excluded.confidence,
        evidenceJson = excluded.evidenceJson,
        limitsJson = excluded.limitsJson,
        actionsJson = excluded.actionsJson
    `).run(
      proposal.id,
      proposal.clusterId,
      proposal.generatedAt,
      proposal.mode,
      proposal.title,
      proposal.summary,
      json(proposal.affected),
      proposal.likelyFix,
      proposal.confidence,
      json(proposal.evidence),
      json(proposal.limits),
      json(proposal.actions),
    );
    const saved = this.getReflectionProposal(proposal.id);
    if (!saved) throw new Error(`Failed to save proposal ${proposal.id}`);
    return saved;
  }

  getReflectionProposal(id: string): ReflectionProposal | null {
    const row = this.db.prepare("SELECT * FROM reflection_proposals WHERE id = ?").get(id) as ReflectionProposalRow | undefined;
    return row ? rowToProposal(row) : null;
  }

  listReflectionProposals(options: { clusterId?: string; limit?: number } = {}): ReflectionProposal[] {
    const limit = Math.max(1, Math.min(options.limit ?? 20, 100));
    const rows = options.clusterId
      ? this.db.prepare("SELECT * FROM reflection_proposals WHERE clusterId = ? ORDER BY generatedAt DESC LIMIT ?").all(options.clusterId, limit) as unknown as ReflectionProposalRow[]
      : this.db.prepare("SELECT * FROM reflection_proposals ORDER BY generatedAt DESC LIMIT ?").all(limit) as unknown as ReflectionProposalRow[];
    return rows.map(rowToProposal);
  }

  private prepareSearch(options: { withCwd: boolean; excludeCount: number }): StatementSync {
    const base = `
      SELECT e.*, bm25(episode_fts) AS score
      FROM episode_fts
      JOIN episodes e ON e.id = episode_fts.id
      WHERE episode_fts MATCH ?
    `;
    const cwdClause = options.withCwd ? " AND (e.cwd = ? OR e.cwd IS NULL)" : "";
    const excludeClause = options.excludeCount > 0 ? ` AND e.id NOT IN (${Array.from({ length: options.excludeCount }, () => "?").join(", ")})` : "";
    return this.db.prepare(`${base}${cwdClause}${excludeClause} ORDER BY score ASC, e.confidence DESC LIMIT ?`);
  }

  private insertEvent(statement: StatementSync, event: SessionEvent): void {
    const source = event.source;
    const eventKey = `${source.sourceFile}:${source.entryId ?? source.lineNumber}`;
    statement.run(
      eventKey,
      source.sourceFile,
      source.lineNumber,
      source.sessionId,
      source.cwd,
      source.entryId,
      source.parentId,
      source.timestamp,
      source.entryType,
      source.role,
      event.kind,
      json(source.ancestry),
      [event.text, event.command ?? "", event.output ?? "", event.toolName ?? ""].join("\n"),
      json({
        text: event.text,
        command: event.command,
        output: event.output,
        exitCode: event.exitCode,
        cancelled: event.cancelled,
        truncated: event.truncated,
        toolName: event.toolName,
        isError: event.isError,
      }),
    );
  }

  private insertWarning(statement: StatementSync, warning: ParseWarning): void {
    statement.run(warning.sourceFile, warning.lineNumber, warning.message);
  }

  private deleteSourceData(sourceFile: string): void {
    const ids = this.db.prepare("SELECT id FROM episodes WHERE sourceFile = ?").all(sourceFile) as Array<{ id: string }>;
    const deleteFts = this.db.prepare("DELETE FROM episode_fts WHERE id = ?");
    for (const row of ids) deleteFts.run(row.id);
    this.db.prepare("DELETE FROM episodes WHERE sourceFile = ?").run(sourceFile);
    this.db.prepare("DELETE FROM events WHERE sourceFile = ?").run(sourceFile);
    this.db.prepare("DELETE FROM parse_warnings WHERE sourceFile = ?").run(sourceFile);
    this.db.prepare("DELETE FROM source_files WHERE path = ?").run(sourceFile);
  }

  private transaction<T>(fn: () => T): T {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const result = fn();
      this.db.exec("COMMIT");
      return result;
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
}

export function buildFtsQuery(input: string): string {
  const tokens = Array.from(new Set(input.match(/[\p{L}\p{N}_]+/gu) ?? []))
    .map((token) => token.toLowerCase())
    .filter((token) => token.length >= 2)
    .slice(0, 24);
  return tokens.map((token) => `"${token.replaceAll('"', '""')}"`).join(" OR ");
}
