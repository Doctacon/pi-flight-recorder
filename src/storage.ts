import { mkdir } from "node:fs/promises";
import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { DatabaseSync, type StatementSync } from "node:sqlite";
import { compactSnippet, redactLocalPaths, sanitizeStoredText } from "./redact.js";
import {
  cwdIsInsideProject,
  hash,
  json,
  rowToArtifactCandidate,
  rowToCluster,
  rowToDeltaDetectorSignal,
  rowToDeltaRecurrenceLink,
  rowToEpisode,
  rowToExpectationDelta,
  rowToFeedback,
  rowToFlightRule,
  rowToOccurrence,
  rowToProposal,
  rowToRuleCandidate,
  sanitizeDeltaEvidenceRefs,
  sanitizeEpisodeForStorage,
  sanitizeEvidenceRefs,
  sanitizeMetadata,
  type ArtifactCandidateRow,
  type DeltaDetectorSignalRow,
  type DeltaRecurrenceLinkRow,
  type EpisodeRow,
  type ExpectationDeltaRow,
  type FailureClusterRow,
  type FeedbackActionRow,
  type FlightRuleRow,
  type OccurrenceRow,
  type ReflectionProposalRow,
  type RuleCandidateRow,
} from "./storage-mappers.js";
import { normalizeFailureSignature } from "./signatures.js";
import type {
  ArtifactCandidate,
  ArtifactCandidateOutcome,
  ArtifactCandidateStatus,
  ClusterEvidenceRef,
  DeltaDetectorSignal,
  DeltaRecurrenceLink,
  ExpectationDelta,
  ExpectationDeltaSeverity,
  ExpectationDeltaStatus,
  FailureCluster,
  FailureClusterStatus,
  FailureEpisode,
  FeedbackAction,
  FeedbackActionRecord,
  FeedbackTargetType,
  FlightRule,
  FlightRuleCandidate,
  FlightRuleScope,
  FlightRuleStatus,
  LiveFailureOccurrence,
  NewArtifactCandidate,
  NewDeltaDetectorSignal,
  NewDeltaRecurrenceLink,
  NewExpectationDelta,
  NewFailureOccurrence,
  ParsedSession,
  ParseWarning,
  ReflectionProposal,
  RuleCandidateStatus,
  SessionEvent,
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

export interface DeltaListOptions {
  limit?: number;
  status?: ExpectationDeltaStatus;
  cwd?: string;
  since?: string;
}

export interface ArtifactCandidateListOptions {
  limit?: number;
  deltaId?: string;
  artifactType?: ArtifactCandidate["artifactType"];
  status?: ArtifactCandidateStatus;
  outcome?: ArtifactCandidateOutcome;
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

function clampConfidence(value: number | null | undefined): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return Math.max(0, Math.min(1, value));
}

function sanitizeOptionalText(value: string | null | undefined, maxLength: number): string | null {
  return value ? sanitizeStoredText(value, maxLength) : null;
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

      CREATE TABLE IF NOT EXISTS rule_candidates (
        id TEXT PRIMARY KEY,
        sourceType TEXT NOT NULL,
        sourceId TEXT NOT NULL,
        clusterId TEXT,
        status TEXT NOT NULL,
        draftText TEXT NOT NULL,
        proposedScope TEXT NOT NULL,
        projectRoot TEXT,
        projectRootDisplay TEXT,
        evidenceJson TEXT NOT NULL,
        evidenceCount INTEGER NOT NULL,
        ruleId TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        approvedAt TEXT,
        rejectedAt TEXT,
        UNIQUE(sourceType, sourceId)
      );

      CREATE INDEX IF NOT EXISTS idx_rule_candidates_status ON rule_candidates(status, updatedAt);
      CREATE INDEX IF NOT EXISTS idx_rule_candidates_source ON rule_candidates(sourceType, sourceId);

      CREATE TABLE IF NOT EXISTS flight_rules (
        id TEXT PRIMARY KEY,
        candidateId TEXT NOT NULL UNIQUE,
        sourceProposalId TEXT NOT NULL,
        clusterId TEXT,
        scope TEXT NOT NULL,
        projectRoot TEXT,
        projectRootDisplay TEXT,
        text TEXT NOT NULL,
        status TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        disabledAt TEXT,
        lastInjectedAt TEXT,
        injectionCount INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY(candidateId) REFERENCES rule_candidates(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_flight_rules_status_scope ON flight_rules(status, scope);

      CREATE TABLE IF NOT EXISTS expectation_deltas (
        id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        source TEXT NOT NULL,
        summary TEXT NOT NULL,
        expectation TEXT,
        reality TEXT,
        impact TEXT,
        severity TEXT NOT NULL,
        cwd TEXT,
        sourceSessionFile TEXT,
        sourceEntryId TEXT,
        evidenceJson TEXT NOT NULL,
        activeArtifactCandidateId TEXT,
        statusReason TEXT,
        metadataJson TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        acceptedAt TEXT,
        routedAt TEXT,
        dismissedAt TEXT,
        resolvedAt TEXT,
        recurringAt TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_expectation_deltas_status_updated ON expectation_deltas(status, updatedAt);
      CREATE INDEX IF NOT EXISTS idx_expectation_deltas_cwd ON expectation_deltas(cwd);
      CREATE INDEX IF NOT EXISTS idx_expectation_deltas_active_candidate ON expectation_deltas(activeArtifactCandidateId);

      CREATE TABLE IF NOT EXISTS delta_detector_signals (
        id TEXT PRIMARY KEY,
        deltaId TEXT NOT NULL,
        type TEXT NOT NULL,
        explanation TEXT NOT NULL,
        confidence REAL,
        evidenceJson TEXT NOT NULL,
        metadataJson TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY(deltaId) REFERENCES expectation_deltas(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_delta_detector_signals_delta ON delta_detector_signals(deltaId, createdAt);
      CREATE INDEX IF NOT EXISTS idx_delta_detector_signals_type ON delta_detector_signals(type);

      CREATE TABLE IF NOT EXISTS artifact_candidates (
        id TEXT PRIMARY KEY,
        deltaId TEXT NOT NULL,
        artifactType TEXT NOT NULL,
        status TEXT NOT NULL,
        title TEXT NOT NULL,
        rationale TEXT NOT NULL,
        proposedDraft TEXT,
        nextStep TEXT,
        confidence REAL,
        limitsJson TEXT NOT NULL,
        evidenceJson TEXT NOT NULL,
        applied INTEGER NOT NULL DEFAULT 0,
        appliedArtifactRef TEXT,
        outcome TEXT NOT NULL,
        outcomeSummary TEXT,
        supersedesCandidateId TEXT,
        metadataJson TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        acceptedAt TEXT,
        dismissedAt TEXT,
        appliedAt TEXT,
        resolvedAt TEXT,
        recurringAt TEXT,
        FOREIGN KEY(deltaId) REFERENCES expectation_deltas(id) ON DELETE CASCADE,
        FOREIGN KEY(supersedesCandidateId) REFERENCES artifact_candidates(id) ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS idx_artifact_candidates_delta ON artifact_candidates(deltaId, updatedAt);
      CREATE INDEX IF NOT EXISTS idx_artifact_candidates_type_status ON artifact_candidates(artifactType, status);
      CREATE INDEX IF NOT EXISTS idx_artifact_candidates_outcome ON artifact_candidates(outcome, updatedAt);

      CREATE TABLE IF NOT EXISTS delta_recurrence_links (
        id TEXT PRIMARY KEY,
        deltaId TEXT NOT NULL,
        priorArtifactCandidateId TEXT NOT NULL,
        reason TEXT NOT NULL,
        similarity REAL,
        evidenceJson TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY(deltaId) REFERENCES expectation_deltas(id) ON DELETE CASCADE,
        FOREIGN KEY(priorArtifactCandidateId) REFERENCES artifact_candidates(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_delta_recurrence_links_delta ON delta_recurrence_links(deltaId, createdAt);
      CREATE INDEX IF NOT EXISTS idx_delta_recurrence_links_candidate ON delta_recurrence_links(priorArtifactCandidateId, createdAt);

      INSERT OR REPLACE INTO meta(key, value) VALUES ('schemaVersion', '4');
    `);
    this.migrateSchema();
  }

  private tableColumns(table: string): Set<string> {
    const rows = this.db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
    return new Set(rows.map((row) => row.name));
  }

  private ensureColumn(table: string, column: string, definition: string): void {
    if (this.tableColumns(table).has(column)) return;
    this.db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }

  private migrateSchema(): void {
    this.ensureColumn("failure_occurrences", "suggestionJson", "TEXT");
    this.ensureColumn("failure_occurrences", "dataJson", "TEXT NOT NULL DEFAULT '{}'");
    this.ensureColumn("failure_occurrences", "repeatCount", "INTEGER NOT NULL DEFAULT 1");
    this.ensureColumn("feedback_actions", "expiresAt", "TEXT");
    this.ensureColumn("failure_clusters", "lastReflectedAt", "TEXT");
    this.ensureColumn("failure_clusters", "score", "REAL NOT NULL DEFAULT 0");
    this.ensureColumn("reflection_proposals", "actionsJson", "TEXT NOT NULL DEFAULT '[]'");
    this.ensureColumn("rule_candidates", "ruleId", "TEXT");
    this.ensureColumn("rule_candidates", "rejectedAt", "TEXT");
    this.ensureColumn("flight_rules", "lastInjectedAt", "TEXT");
    this.ensureColumn("flight_rules", "injectionCount", "INTEGER NOT NULL DEFAULT 0");
    this.ensureColumn("expectation_deltas", "activeArtifactCandidateId", "TEXT");
    this.ensureColumn("expectation_deltas", "statusReason", "TEXT");
    this.ensureColumn("artifact_candidates", "applied", "INTEGER NOT NULL DEFAULT 0");
    this.ensureColumn("artifact_candidates", "appliedArtifactRef", "TEXT");
    this.db.exec("PRAGMA user_version = 4");
    this.db.prepare("INSERT OR REPLACE INTO meta(key, value) VALUES ('schemaVersion', '4')").run();
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
      for (const rawEpisode of episodes) {
        const episode = sanitizeEpisodeForStorage(rawEpisode);
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

  count(table: "source_files" | "events" | "parse_warnings" | "episodes" | "failure_occurrences" | "feedback_actions" | "failure_clusters" | "reflection_proposals" | "rule_candidates" | "flight_rules" | "expectation_deltas" | "delta_detector_signals" | "artifact_candidates" | "delta_recurrence_links"): number {
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
    const queryCwd = options.cwd ? redactLocalPaths(options.cwd) : null;
    const rows = this.prepareSearch({ withCwd: Boolean(queryCwd), excludeCount: excludeEpisodeIds.length }).all(
      ...[
        ftsQuery,
        ...(queryCwd ? [queryCwd, options.cwd ?? queryCwd] : []),
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
    const redactedQuery = sanitizeStoredText(input.query, 1_500).trim();
    const signatureInput: { query: string; signature?: string | null; fallbackId?: string | null } = { query: redactedQuery, fallbackId: input.entryId ?? null };
    if (input.signature !== undefined) signatureInput.signature = input.signature;
    const signature = normalizeFailureSignature(signatureInput);
    const queryPreview = compactSnippet(redactedQuery.replace(/\s+/g, " "), 180);
    const snippet = compactSnippet(redactedQuery, 1_200);
    const storedCommand = input.command ? sanitizeStoredText(input.command, 500) : null;
    const storedCwd = input.cwd ? redactLocalPaths(input.cwd) : null;
    const storedSessionFile = input.sessionFile ? redactLocalPaths(input.sessionFile) : null;
    const dedupeKey = input.dedupeKey?.trim() || [input.source, storedCwd ?? "", storedSessionFile ?? "", input.entryId ?? "", signature, hash(redactedQuery, 12)].join("\u0000");
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
        storedCommand,
        storedCwd,
        storedSessionFile,
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

  createExpectationDelta(input: NewExpectationDelta): ExpectationDelta {
    const now = input.now ?? new Date().toISOString();
    const summary = sanitizeStoredText(input.summary, 300);
    const expectation = sanitizeOptionalText(input.expectation, 700);
    const reality = sanitizeOptionalText(input.reality, 700);
    const impact = sanitizeOptionalText(input.impact, 500);
    const cwd = input.cwd ? redactLocalPaths(input.cwd) : null;
    const sourceSessionFile = input.sourceSessionFile ? redactLocalPaths(input.sourceSessionFile) : null;
    const sourceEntryId = sanitizeOptionalText(input.sourceEntryId, 160);
    const evidence = sanitizeDeltaEvidenceRefs(input.evidenceRefs);
    const metadata = sanitizeMetadata(input.metadata);
    const id = input.id ?? `delta_${hash([input.source, summary, expectation ?? "", reality ?? "", sourceEntryId ?? "", now].join("\u0000"))}`;

    this.db.prepare(`
      INSERT INTO expectation_deltas(id, status, source, summary, expectation, reality, impact, severity, cwd, sourceSessionFile, sourceEntryId, evidenceJson, activeArtifactCandidateId, statusReason, metadataJson, createdAt, updatedAt, acceptedAt, routedAt, dismissedAt, resolvedAt, recurringAt)
      VALUES (?, 'candidate', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, NULL, NULL, NULL, NULL, NULL)
    `).run(id, input.source, summary, expectation, reality, impact, input.severity ?? "unknown", cwd, sourceSessionFile, sourceEntryId, json(evidence), json(metadata), now, now);

    const saved = this.getExpectationDelta(id);
    if (!saved) throw new Error(`Failed to create expectation delta ${id}`);
    return saved;
  }

  getExpectationDelta(id: string): ExpectationDelta | null {
    const row = this.db.prepare("SELECT * FROM expectation_deltas WHERE id = ?").get(id) as ExpectationDeltaRow | undefined;
    return row ? rowToExpectationDelta(row) : null;
  }

  listExpectationDeltas(options: DeltaListOptions = {}): ExpectationDelta[] {
    const clauses: string[] = [];
    const params: Array<string | number> = [];
    if (options.status) {
      clauses.push("status = ?");
      params.push(options.status);
    }
    if (options.cwd) {
      clauses.push("cwd = ?");
      params.push(redactLocalPaths(options.cwd));
    }
    if (options.since) {
      clauses.push("updatedAt >= ?");
      params.push(options.since);
    }
    const limit = Math.max(1, Math.min(options.limit ?? 100, 1_000));
    const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
    const rows = this.db.prepare(`SELECT * FROM expectation_deltas ${where} ORDER BY updatedAt DESC LIMIT ?`).all(...params, limit) as unknown as ExpectationDeltaRow[];
    return rows.map(rowToExpectationDelta);
  }

  acceptExpectationDelta(id: string, updates: { expectation?: string | null; reality?: string | null; impact?: string | null; severity?: ExpectationDeltaSeverity; now?: string } = {}): ExpectationDelta | null {
    const existing = this.getExpectationDelta(id);
    if (!existing) return null;
    const now = updates.now ?? new Date().toISOString();
    this.db.prepare(`
      UPDATE expectation_deltas
      SET status = 'accepted', expectation = ?, reality = ?, impact = ?, severity = ?, acceptedAt = COALESCE(acceptedAt, ?), updatedAt = ?
      WHERE id = ?
    `).run(
      updates.expectation !== undefined ? sanitizeOptionalText(updates.expectation, 700) : existing.expectation,
      updates.reality !== undefined ? sanitizeOptionalText(updates.reality, 700) : existing.reality,
      updates.impact !== undefined ? sanitizeOptionalText(updates.impact, 500) : existing.impact,
      updates.severity ?? existing.severity,
      now,
      now,
      id,
    );
    return this.getExpectationDelta(id);
  }

  dismissExpectationDelta(id: string, reason: string | null = null, now = new Date().toISOString()): ExpectationDelta | null {
    this.db.prepare("UPDATE expectation_deltas SET status = 'dismissed', statusReason = ?, dismissedAt = COALESCE(dismissedAt, ?), updatedAt = ? WHERE id = ?")
      .run(sanitizeOptionalText(reason, 500), now, now, id);
    return this.getExpectationDelta(id);
  }

  markExpectationDeltaResolved(id: string, reason: string | null = null, now = new Date().toISOString()): ExpectationDelta | null {
    this.db.prepare("UPDATE expectation_deltas SET status = 'resolved', statusReason = ?, resolvedAt = COALESCE(resolvedAt, ?), updatedAt = ? WHERE id = ?")
      .run(sanitizeOptionalText(reason, 500), now, now, id);
    return this.getExpectationDelta(id);
  }

  markExpectationDeltaRecurring(id: string, reason: string | null = null, now = new Date().toISOString()): ExpectationDelta | null {
    this.db.prepare("UPDATE expectation_deltas SET status = 'recurring', statusReason = ?, recurringAt = COALESCE(recurringAt, ?), updatedAt = ? WHERE id = ?")
      .run(sanitizeOptionalText(reason, 500), now, now, id);
    return this.getExpectationDelta(id);
  }

  rerouteExpectationDelta(deltaId: string, artifactCandidateId: string, reason: string | null = null, now = new Date().toISOString()): ExpectationDelta | null {
    const candidate = this.getArtifactCandidate(artifactCandidateId);
    if (!candidate || candidate.deltaId !== deltaId) return null;
    this.db.prepare("UPDATE expectation_deltas SET status = 'routed', activeArtifactCandidateId = ?, statusReason = ?, routedAt = COALESCE(routedAt, ?), updatedAt = ? WHERE id = ?")
      .run(artifactCandidateId, sanitizeOptionalText(reason, 500), now, now, deltaId);
    return this.getExpectationDelta(deltaId);
  }

  recordDeltaDetectorSignal(input: NewDeltaDetectorSignal): DeltaDetectorSignal {
    const now = input.now ?? new Date().toISOString();
    const explanation = sanitizeStoredText(input.explanation, 700);
    const id = input.id ?? `delta_sig_${hash([input.deltaId, input.type, explanation, now].join("\u0000"))}`;
    const evidence = sanitizeDeltaEvidenceRefs(input.evidenceRefs);
    const metadata = sanitizeMetadata(input.metadata);
    this.db.prepare("INSERT INTO delta_detector_signals(id, deltaId, type, explanation, confidence, evidenceJson, metadataJson, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(id, input.deltaId, input.type, explanation, clampConfidence(input.confidence), json(evidence), json(metadata), now);
    const saved = this.getDeltaDetectorSignal(id);
    if (!saved) throw new Error(`Failed to record delta detector signal ${id}`);
    return saved;
  }

  getDeltaDetectorSignal(id: string): DeltaDetectorSignal | null {
    const row = this.db.prepare("SELECT * FROM delta_detector_signals WHERE id = ?").get(id) as DeltaDetectorSignalRow | undefined;
    return row ? rowToDeltaDetectorSignal(row) : null;
  }

  listDeltaDetectorSignals(deltaId: string, limit = 50): DeltaDetectorSignal[] {
    const rows = this.db.prepare("SELECT * FROM delta_detector_signals WHERE deltaId = ? ORDER BY createdAt DESC LIMIT ?").all(deltaId, Math.max(1, Math.min(limit, 200))) as unknown as DeltaDetectorSignalRow[];
    return rows.map(rowToDeltaDetectorSignal);
  }

  createArtifactCandidate(input: NewArtifactCandidate): ArtifactCandidate {
    const sourceDelta = this.getExpectationDelta(input.deltaId);
    if (!sourceDelta) throw new Error(`Cannot create artifact candidate for missing delta ${input.deltaId}`);
    const now = input.now ?? new Date().toISOString();
    const title = sanitizeStoredText(input.title, 200);
    const rationale = sanitizeStoredText(input.rationale, 900);
    const proposedDraft = sanitizeOptionalText(input.proposedDraft, 2_000);
    const nextStep = sanitizeOptionalText(input.nextStep, 700);
    const limits = (input.limits ?? []).slice(0, 10).map((limit) => sanitizeStoredText(limit, 300));
    const evidence = sanitizeDeltaEvidenceRefs(input.evidenceRefs ?? sourceDelta.evidenceRefs);
    const metadata = sanitizeMetadata(input.metadata);
    const supersedesCandidateId = input.supersedesCandidateId ?? null;
    const id = input.id ?? `artifact_cand_${hash([input.deltaId, input.artifactType, title, rationale, supersedesCandidateId ?? "", now].join("\u0000"))}`;

    this.transaction(() => {
      this.db.prepare(`
        INSERT INTO artifact_candidates(id, deltaId, artifactType, status, title, rationale, proposedDraft, nextStep, confidence, limitsJson, evidenceJson, applied, appliedArtifactRef, outcome, outcomeSummary, supersedesCandidateId, metadataJson, createdAt, updatedAt, acceptedAt, dismissedAt, appliedAt, resolvedAt, recurringAt)
        VALUES (?, ?, ?, 'pending-review', ?, ?, ?, ?, ?, ?, ?, 0, NULL, 'unknown', NULL, ?, ?, ?, ?, NULL, NULL, NULL, NULL, NULL)
      `).run(id, input.deltaId, input.artifactType, title, rationale, proposedDraft, nextStep, clampConfidence(input.confidence), json(limits), json(evidence), supersedesCandidateId, json(metadata), now, now);
      if (input.routeDelta !== false) {
        this.db.prepare("UPDATE expectation_deltas SET status = 'routed', activeArtifactCandidateId = ?, statusReason = ?, routedAt = COALESCE(routedAt, ?), updatedAt = ? WHERE id = ?")
          .run(id, rationale, now, now, input.deltaId);
      }
    });

    const saved = this.getArtifactCandidate(id);
    if (!saved) throw new Error(`Failed to create artifact candidate ${id}`);
    return saved;
  }

  getArtifactCandidate(id: string): ArtifactCandidate | null {
    const row = this.db.prepare("SELECT * FROM artifact_candidates WHERE id = ?").get(id) as ArtifactCandidateRow | undefined;
    return row ? rowToArtifactCandidate(row) : null;
  }

  listArtifactCandidates(options: ArtifactCandidateListOptions = {}): ArtifactCandidate[] {
    const clauses: string[] = [];
    const params: Array<string | number> = [];
    if (options.deltaId) {
      clauses.push("deltaId = ?");
      params.push(options.deltaId);
    }
    if (options.artifactType) {
      clauses.push("artifactType = ?");
      params.push(options.artifactType);
    }
    if (options.status) {
      clauses.push("status = ?");
      params.push(options.status);
    }
    if (options.outcome) {
      clauses.push("outcome = ?");
      params.push(options.outcome);
    }
    const limit = Math.max(1, Math.min(options.limit ?? 100, 1_000));
    const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
    const rows = this.db.prepare(`SELECT * FROM artifact_candidates ${where} ORDER BY updatedAt DESC LIMIT ?`).all(...params, limit) as unknown as ArtifactCandidateRow[];
    return rows.map(rowToArtifactCandidate);
  }

  acceptArtifactCandidate(id: string, now = new Date().toISOString()): ArtifactCandidate | null {
    this.db.prepare("UPDATE artifact_candidates SET status = 'accepted', acceptedAt = COALESCE(acceptedAt, ?), updatedAt = ? WHERE id = ?").run(now, now, id);
    return this.getArtifactCandidate(id);
  }

  dismissArtifactCandidate(id: string, reason: string | null = null, now = new Date().toISOString()): ArtifactCandidate | null {
    const existing = this.getArtifactCandidate(id);
    if (!existing) return null;
    const metadata = reason ? sanitizeMetadata({ ...existing.metadata, dismissReason: reason }) : existing.metadata;
    this.db.prepare("UPDATE artifact_candidates SET status = 'dismissed', metadataJson = ?, dismissedAt = COALESCE(dismissedAt, ?), updatedAt = ? WHERE id = ?").run(json(metadata), now, now, id);
    return this.getArtifactCandidate(id);
  }

  markArtifactCandidateApplied(id: string, options: { appliedArtifactRef?: string | null; now?: string } = {}): ArtifactCandidate | null {
    const now = options.now ?? new Date().toISOString();
    this.db.prepare("UPDATE artifact_candidates SET status = 'applied', applied = 1, appliedArtifactRef = ?, appliedAt = COALESCE(appliedAt, ?), updatedAt = ? WHERE id = ?")
      .run(sanitizeOptionalText(options.appliedArtifactRef, 500), now, now, id);
    return this.getArtifactCandidate(id);
  }

  updateArtifactCandidateOutcome(id: string, input: { outcome: ArtifactCandidateOutcome; outcomeSummary?: string | null; status?: ArtifactCandidateStatus; now?: string }): ArtifactCandidate | null {
    const now = input.now ?? new Date().toISOString();
    const status = input.status ?? (input.outcome === "helped" ? "resolved" : input.outcome === "needs-reroute" || input.outcome === "no-change" ? "recurring" : null);
    const timestampUpdate = status === "resolved" ? ", resolvedAt = COALESCE(resolvedAt, ?)" : status === "recurring" ? ", recurringAt = COALESCE(recurringAt, ?)" : "";
    const params: Array<string | number | null> = [input.outcome, sanitizeOptionalText(input.outcomeSummary, 700)];
    if (status) params.push(status);
    if (timestampUpdate) params.push(now);
    params.push(now, id);
    const statusUpdate = status ? ", status = ?" : "";
    this.db.prepare(`UPDATE artifact_candidates SET outcome = ?, outcomeSummary = ?${statusUpdate}${timestampUpdate}, updatedAt = ? WHERE id = ?`).run(...params);
    return this.getArtifactCandidate(id);
  }

  linkDeltaRecurrence(input: NewDeltaRecurrenceLink): DeltaRecurrenceLink {
    const now = input.now ?? new Date().toISOString();
    const reason = sanitizeStoredText(input.reason, 700);
    const id = input.id ?? `delta_recur_${hash([input.deltaId, input.priorArtifactCandidateId, reason, now].join("\u0000"))}`;
    const evidence = sanitizeDeltaEvidenceRefs(input.evidenceRefs);
    this.db.prepare("INSERT INTO delta_recurrence_links(id, deltaId, priorArtifactCandidateId, reason, similarity, evidenceJson, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(id, input.deltaId, input.priorArtifactCandidateId, reason, clampConfidence(input.similarity), json(evidence), now);
    const saved = this.getDeltaRecurrenceLink(id);
    if (!saved) throw new Error(`Failed to create delta recurrence link ${id}`);
    return saved;
  }

  getDeltaRecurrenceLink(id: string): DeltaRecurrenceLink | null {
    const row = this.db.prepare("SELECT * FROM delta_recurrence_links WHERE id = ?").get(id) as DeltaRecurrenceLinkRow | undefined;
    return row ? rowToDeltaRecurrenceLink(row) : null;
  }

  listDeltaRecurrenceLinks(options: { deltaId?: string; priorArtifactCandidateId?: string; limit?: number } = {}): DeltaRecurrenceLink[] {
    const clauses: string[] = [];
    const params: Array<string | number> = [];
    if (options.deltaId) {
      clauses.push("deltaId = ?");
      params.push(options.deltaId);
    }
    if (options.priorArtifactCandidateId) {
      clauses.push("priorArtifactCandidateId = ?");
      params.push(options.priorArtifactCandidateId);
    }
    const limit = Math.max(1, Math.min(options.limit ?? 100, 1_000));
    const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
    const rows = this.db.prepare(`SELECT * FROM delta_recurrence_links ${where} ORDER BY createdAt DESC LIMIT ?`).all(...params, limit) as unknown as DeltaRecurrenceLinkRow[];
    return rows.map(rowToDeltaRecurrenceLink);
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

  updateClustersForSignature(signature: string, status: FailureClusterStatus): number {
    const result = this.db.prepare("UPDATE failure_clusters SET status = ?, updatedAt = ? WHERE representativeSignature = ?").run(status, new Date().toISOString(), signature);
    return Number(result.changes);
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

  createRuleCandidate(input: {
    sourceType?: "proposal";
    sourceId: string;
    clusterId?: string | null;
    draftText: string;
    proposedScope: FlightRuleScope;
    projectRoot?: string | null;
    evidence?: ClusterEvidenceRef[];
    now?: string;
  }): FlightRuleCandidate {
    const now = input.now ?? new Date().toISOString();
    const sourceType = input.sourceType ?? "proposal";
    const id = `rule_cand_${hash(`${sourceType}\u0000${input.sourceId}`)}`;
    const draftText = sanitizeStoredText(input.draftText, 700);
    const projectRoot = input.projectRoot ?? null;
    const projectRootDisplay = projectRoot ? redactLocalPaths(projectRoot) : null;
    const evidence = sanitizeEvidenceRefs(input.evidence ?? []);
    this.db.prepare(`
      INSERT INTO rule_candidates(id, sourceType, sourceId, clusterId, status, draftText, proposedScope, projectRoot, projectRootDisplay, evidenceJson, evidenceCount, ruleId, createdAt, updatedAt, approvedAt, rejectedAt)
      VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, NULL, ?, ?, NULL, NULL)
      ON CONFLICT(sourceType, sourceId) DO UPDATE SET
        draftText = CASE WHEN rule_candidates.status = 'draft' THEN excluded.draftText ELSE rule_candidates.draftText END,
        proposedScope = CASE WHEN rule_candidates.status = 'draft' THEN excluded.proposedScope ELSE rule_candidates.proposedScope END,
        projectRoot = CASE WHEN rule_candidates.status = 'draft' THEN excluded.projectRoot ELSE rule_candidates.projectRoot END,
        projectRootDisplay = CASE WHEN rule_candidates.status = 'draft' THEN excluded.projectRootDisplay ELSE rule_candidates.projectRootDisplay END,
        evidenceJson = CASE WHEN rule_candidates.status = 'draft' THEN excluded.evidenceJson ELSE rule_candidates.evidenceJson END,
        evidenceCount = CASE WHEN rule_candidates.status = 'draft' THEN excluded.evidenceCount ELSE rule_candidates.evidenceCount END,
        updatedAt = CASE WHEN rule_candidates.status = 'draft' THEN excluded.updatedAt ELSE rule_candidates.updatedAt END
    `).run(id, sourceType, input.sourceId, input.clusterId ?? null, draftText, input.proposedScope, projectRoot, projectRootDisplay, json(evidence), evidence.length, now, now);
    const saved = this.getRuleCandidate(id) ?? this.getRuleCandidateForSource(sourceType, input.sourceId);
    if (!saved) throw new Error(`Failed to create rule candidate ${id}`);
    return saved;
  }

  updateRuleCandidateDraft(candidateId: string, draftText: string, proposedScope?: FlightRuleScope, projectRoot?: string | null): FlightRuleCandidate | null {
    const existing = this.getRuleCandidate(candidateId);
    if (!existing || existing.status !== "draft") return existing;
    const updates: string[] = ["draftText = ?", "updatedAt = ?"];
    const params: Array<string | null> = [sanitizeStoredText(draftText, 700), new Date().toISOString()];
    if (proposedScope) {
      updates.push("proposedScope = ?");
      params.push(proposedScope);
    }
    if (projectRoot !== undefined) {
      updates.push("projectRoot = ?", "projectRootDisplay = ?");
      params.push(projectRoot, projectRoot ? redactLocalPaths(projectRoot) : null);
    }
    params.push(candidateId);
    this.db.prepare(`UPDATE rule_candidates SET ${updates.join(", ")} WHERE id = ?`).run(...params);
    return this.getRuleCandidate(candidateId);
  }

  getRuleCandidate(id: string): FlightRuleCandidate | null {
    const row = this.db.prepare("SELECT * FROM rule_candidates WHERE id = ?").get(id) as RuleCandidateRow | undefined;
    return row ? rowToRuleCandidate(row) : null;
  }

  getRuleCandidateForSource(sourceType: "proposal", sourceId: string): FlightRuleCandidate | null {
    const row = this.db.prepare("SELECT * FROM rule_candidates WHERE sourceType = ? AND sourceId = ?").get(sourceType, sourceId) as RuleCandidateRow | undefined;
    return row ? rowToRuleCandidate(row) : null;
  }

  listRuleCandidates(options: { status?: RuleCandidateStatus; limit?: number } = {}): FlightRuleCandidate[] {
    const limit = Math.max(1, Math.min(options.limit ?? 20, 200));
    const rows = options.status
      ? this.db.prepare("SELECT * FROM rule_candidates WHERE status = ? ORDER BY updatedAt DESC LIMIT ?").all(options.status, limit) as unknown as RuleCandidateRow[]
      : this.db.prepare("SELECT * FROM rule_candidates ORDER BY updatedAt DESC LIMIT ?").all(limit) as unknown as RuleCandidateRow[];
    return rows.map(rowToRuleCandidate);
  }

  approveRuleCandidate(candidateId: string, options: { scope?: FlightRuleScope; text?: string; projectRoot?: string | null; now?: string } = {}): FlightRule | null {
    const candidate = this.getRuleCandidate(candidateId);
    if (!candidate) return null;
    const now = options.now ?? new Date().toISOString();
    const scope = options.scope ?? candidate.proposedScope;
    const projectRoot = scope === "project" ? options.projectRoot ?? candidate.projectRoot : null;
    const projectRootDisplay = projectRoot ? redactLocalPaths(projectRoot) : null;
    const text = sanitizeStoredText(options.text ?? candidate.draftText, 700);
    const ruleId = candidate.ruleId ?? `rule_${hash(`${candidate.id}\u0000${scope}\u0000${text}`)}`;
    this.transaction(() => {
      this.db.prepare(`
        INSERT INTO flight_rules(id, candidateId, sourceProposalId, clusterId, scope, projectRoot, projectRootDisplay, text, status, createdAt, updatedAt, disabledAt, lastInjectedAt, injectionCount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, NULL, NULL, 0)
        ON CONFLICT(candidateId) DO UPDATE SET
          scope = excluded.scope,
          projectRoot = excluded.projectRoot,
          projectRootDisplay = excluded.projectRootDisplay,
          text = excluded.text,
          status = 'active',
          updatedAt = excluded.updatedAt,
          disabledAt = NULL
      `).run(ruleId, candidate.id, candidate.sourceId, candidate.clusterId, scope, projectRoot, projectRootDisplay, text, now, now);
      this.db.prepare("UPDATE rule_candidates SET status = 'approved', draftText = ?, proposedScope = ?, projectRoot = ?, projectRootDisplay = ?, ruleId = ?, approvedAt = COALESCE(approvedAt, ?), updatedAt = ? WHERE id = ?")
        .run(text, scope, projectRoot, projectRootDisplay, ruleId, now, now, candidate.id);
    });
    return this.getFlightRule(ruleId) ?? this.getFlightRuleByCandidate(candidate.id);
  }

  rejectRuleCandidate(candidateId: string, now = new Date().toISOString()): FlightRuleCandidate | null {
    const existing = this.getRuleCandidate(candidateId);
    if (!existing) return null;
    this.transaction(() => {
      this.db.prepare("UPDATE rule_candidates SET status = 'rejected', rejectedAt = COALESCE(rejectedAt, ?), updatedAt = ? WHERE id = ?").run(now, now, candidateId);
      this.db.prepare("UPDATE flight_rules SET status = 'disabled', disabledAt = COALESCE(disabledAt, ?), updatedAt = ? WHERE candidateId = ?").run(now, now, candidateId);
    });
    return this.getRuleCandidate(candidateId);
  }

  getFlightRule(id: string): FlightRule | null {
    const row = this.db.prepare("SELECT * FROM flight_rules WHERE id = ?").get(id) as FlightRuleRow | undefined;
    return row ? rowToFlightRule(row) : null;
  }

  getFlightRuleByCandidate(candidateId: string): FlightRule | null {
    const row = this.db.prepare("SELECT * FROM flight_rules WHERE candidateId = ?").get(candidateId) as FlightRuleRow | undefined;
    return row ? rowToFlightRule(row) : null;
  }

  listFlightRules(options: { status?: FlightRuleStatus; scope?: FlightRuleScope; cwd?: string; limit?: number } = {}): FlightRule[] {
    const clauses: string[] = [];
    const params: Array<string | number> = [];
    if (options.status) {
      clauses.push("status = ?");
      params.push(options.status);
    }
    if (options.scope) {
      clauses.push("scope = ?");
      params.push(options.scope);
    }
    const limit = Math.max(1, Math.min(options.limit ?? 20, 100));
    const sqlLimit = options.cwd ? 500 : limit;
    const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
    const rows = this.db.prepare(`SELECT * FROM flight_rules ${where} ORDER BY updatedAt DESC LIMIT ?`).all(...params, sqlLimit) as unknown as FlightRuleRow[];
    const rules = rows.map(rowToFlightRule);
    const filtered = options.cwd ? rules.filter((rule) => rule.scope === "global" || Boolean(rule.projectRoot && cwdIsInsideProject(options.cwd!, rule.projectRoot))) : rules;
    return filtered.slice(0, limit);
  }

  listActiveFlightRulesForCwd(cwd: string | null, limit = 5): FlightRule[] {
    if (!cwd) return this.listFlightRules({ status: "active", scope: "global", limit });
    return this.listFlightRules({ status: "active", cwd, limit });
  }

  disableFlightRule(ruleId: string, now = new Date().toISOString()): FlightRule | null {
    this.db.prepare("UPDATE flight_rules SET status = 'disabled', disabledAt = COALESCE(disabledAt, ?), updatedAt = ? WHERE id = ?").run(now, now, ruleId);
    return this.getFlightRule(ruleId);
  }

  markFlightRulesInjected(ruleIds: string[], at = new Date().toISOString()): void {
    if (ruleIds.length === 0) return;
    const update = this.db.prepare("UPDATE flight_rules SET lastInjectedAt = ?, injectionCount = injectionCount + 1, updatedAt = ? WHERE id = ?");
    this.transaction(() => {
      for (const id of ruleIds) update.run(at, at, id);
    });
  }

  private prepareSearch(options: { withCwd: boolean; excludeCount: number }): StatementSync {
    const base = `
      SELECT e.*, bm25(episode_fts) AS score
      FROM episode_fts
      JOIN episodes e ON e.id = episode_fts.id
      WHERE episode_fts MATCH ?
    `;
    const cwdClause = options.withCwd ? " AND (e.cwd = ? OR e.cwd = ? OR e.cwd IS NULL)" : "";
    const excludeClause = options.excludeCount > 0 ? ` AND e.id NOT IN (${Array.from({ length: options.excludeCount }, () => "?").join(", ")})` : "";
    return this.db.prepare(`${base}${cwdClause}${excludeClause} ORDER BY score ASC, e.confidence DESC LIMIT ?`);
  }

  private insertEvent(statement: StatementSync, event: SessionEvent): void {
    const source = event.source;
    const eventKey = `${source.sourceFile}:${source.entryId ?? source.lineNumber}`;
    const redactedText = sanitizeStoredText(event.text, 2_000);
    const redactedCommand = event.command ? sanitizeStoredText(event.command, 500) : null;
    const redactedOutput = event.output ? sanitizeStoredText(event.output, 2_000) : null;
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
      [redactedText, redactedCommand ?? "", redactedOutput ?? "", event.toolName ?? ""].join("\n"),
      json({
        text: redactedText,
        command: redactedCommand,
        output: redactedOutput,
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
