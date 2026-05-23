import { createHash } from "node:crypto";
import { defaultDatabasePath, FlightRecorderStore, getDefaultDataDir } from "./storage.js";
import type { FailureCluster, LiveFailureOccurrence } from "./types.js";

export interface PatternMinerOptions {
  dataDir?: string;
  limit?: number;
  minOccurrences?: number;
  now?: string;
}

export interface PatternMiningResult {
  dataDir: string;
  examined: number;
  clusters: FailureCluster[];
}

interface ClusterBucket {
  key: string;
  title: string;
  occurrences: LiveFailureOccurrence[];
}

function hash(value: string, length = 16): string {
  return createHash("sha256").update(value).digest("hex").slice(0, length);
}

function compactTitle(value: string): string {
  return value.length > 80 ? `${value.slice(0, 79)}…` : value;
}

function lowerText(occurrence: LiveFailureOccurrence): string {
  return `${occurrence.signature}\n${occurrence.snippet}`.toLowerCase();
}

function firstPath(text: string): string | null {
  return text.match(/(?:[.~]?\/?[\w@.-]+\/)+(?:[\w@.-]+)(?:\.[A-Za-z0-9]+)?/)?.[0] ?? null;
}

function moduleAnchor(text: string): string | null {
  const quoted = text.match(/cannot find module ['"]([^'"]+)['"]/i)?.[1];
  if (quoted) return quoted.toLowerCase().replace(/\b\d+\b/g, "<num>");
  const pathLike = firstPath(text);
  return pathLike ? pathLike.toLowerCase().replace(/\b\d+\b/g, "<num>") : null;
}

function classify(occurrence: LiveFailureOccurrence): { key: string; title: string } {
  const text = lowerText(occurrence);
  const tool = occurrence.toolName ?? occurrence.source;
  const cwd = occurrence.cwd ?? "cwd-unknown";
  if ((text.includes("oldtext") || text.includes("old text")) && (text.includes("not found") || text.includes("match"))) {
    return { key: `class:edit-oldtext-mismatch|tool:${tool}|cwd:${cwd}`, title: "exact-text edit mismatches" };
  }
  if (text.includes("cannot find module")) {
    return { key: `class:cannot-find-module|tool:${tool}|cwd:${cwd}|anchor:${moduleAnchor(text) ?? "unknown"}`, title: "Cannot find module failures" };
  }
  if (text.includes("enoent") || text.includes("no such file or directory")) {
    return { key: `class:file-not-found|tool:${tool}|cwd:${cwd}|anchor:${firstPath(text) ?? "unknown"}`, title: "file-not-found failures" };
  }
  if (text.includes("permission denied") || text.includes("eacces")) {
    return { key: `class:permission-denied|tool:${tool}|cwd:${cwd}`, title: "permission denied failures" };
  }
  if (text.includes("command not found")) {
    return { key: `class:command-not-found|cwd:${cwd}`, title: "command not found failures" };
  }
  return { key: `exact:${occurrence.signature}`, title: compactTitle(occurrence.queryPreview || occurrence.signature) };
}

function scoreBucket(occurrences: LiveFailureOccurrence[], nowMs: number): number {
  const totalRepeats = occurrences.reduce((total, occurrence) => total + occurrence.repeatCount, 0);
  const cwdSet = new Set(occurrences.map((occurrence) => occurrence.cwd ?? "unknown"));
  const suppressed = occurrences.filter((occurrence) => occurrence.suggestion?.kind === "suppressed" || !occurrence.suggestion).length;
  const newest = Math.max(...occurrences.map((occurrence) => Date.parse(occurrence.lastSeenAt)).filter(Number.isFinite), 0);
  const ageHours = newest > 0 ? Math.max(0, (nowMs - newest) / 3_600_000) : 10_000;
  const recency = Math.max(0, 4 - ageHours / 24);
  const cwdConcentration = cwdSet.size === 1 ? 1.5 : 0;
  return totalRepeats * 2 + suppressed * 0.7 + cwdConcentration + recency;
}

function bucketToCluster(bucket: ClusterBucket, nowMs: number): FailureCluster {
  const occurrences = bucket.occurrences.sort((a, b) => a.firstSeenAt.localeCompare(b.firstSeenAt));
  const count = occurrences.reduce((total, occurrence) => total + occurrence.repeatCount, 0);
  const occurrenceIds = occurrences.map((occurrence) => occurrence.id);
  const cwdSummary = Array.from(new Set(occurrences.map((occurrence) => occurrence.cwd).filter((cwd): cwd is string => Boolean(cwd)))).slice(0, 8);
  const tools = Array.from(new Set(occurrences.map((occurrence) => occurrence.toolName ?? occurrence.source))).slice(0, 8);
  const firstSeenAt = occurrences[0]?.firstSeenAt ?? new Date(nowMs).toISOString();
  const lastSeenAt = occurrences.reduce((latest, occurrence) => occurrence.lastSeenAt > latest ? occurrence.lastSeenAt : latest, firstSeenAt);
  let representative = occurrences[0];
  for (const occurrence of occurrences) {
    if (!representative || occurrence.repeatCount > representative.repeatCount) representative = occurrence;
  }
  const cluster: FailureCluster = {
    id: `cluster_${hash(bucket.key)}`,
    clusterKey: bucket.key,
    title: bucket.title,
    representativeSignature: representative?.signature ?? bucket.key,
    status: "active",
    count,
    occurrenceIds,
    cwdSummary,
    tools,
    firstSeenAt,
    lastSeenAt,
    lastReflectedAt: null,
    score: scoreBucket(occurrences, nowMs),
  };
  return cluster;
}

export function mineFailurePatternsWithStore(store: FlightRecorderStore, options: PatternMinerOptions = {}): PatternMiningResult {
  const dataDir = options.dataDir ?? getDefaultDataDir();
  const occurrences = store.listFailureOccurrences({ limit: options.limit ?? 2_000 });
  const buckets = new Map<string, ClusterBucket>();
  for (const occurrence of occurrences) {
    const classified = classify(occurrence);
    const bucket = buckets.get(classified.key) ?? { key: classified.key, title: classified.title, occurrences: [] };
    bucket.occurrences.push(occurrence);
    buckets.set(classified.key, bucket);
  }

  const nowMs = Date.parse(options.now ?? new Date().toISOString());
  const minOccurrences = options.minOccurrences ?? 1;
  const clusters = Array.from(buckets.values())
    .map((bucket) => bucketToCluster(bucket, Number.isFinite(nowMs) ? nowMs : Date.now()))
    .filter((cluster) => cluster.count >= minOccurrences)
    .sort((a, b) => b.score - a.score || b.lastSeenAt.localeCompare(a.lastSeenAt));

  for (const cluster of clusters) store.upsertFailureCluster(cluster);

  return { dataDir, examined: occurrences.length, clusters };
}

export function mineFailurePatterns(options: PatternMinerOptions = {}): PatternMiningResult {
  const dataDir = options.dataDir ?? getDefaultDataDir();
  const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
  try {
    return mineFailurePatternsWithStore(store, { ...options, dataDir });
  } finally {
    store.close();
  }
}
