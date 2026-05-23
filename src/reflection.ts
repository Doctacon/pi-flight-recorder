import { createHash } from "node:crypto";
import { compactSnippet, redactLocalPaths, redactSecrets } from "./redact.js";
import { mineFailurePatternsWithStore, type PatternMiningResult } from "./pattern-miner.js";
import { defaultDatabasePath, FlightRecorderStore, getDefaultDataDir } from "./storage.js";
import type { ClusterEvidenceRef, FailureCluster, FeedbackAction, ReflectionMode, ReflectionProposal } from "./types.js";

export type ReflectionTrigger = "manual" | "threshold" | "session-end" | "daily";

export interface ReflectionSchedulerOptions {
  trigger?: ReflectionTrigger;
  minCount?: number;
  limit?: number;
  cooldownMs?: number;
  now?: string;
}

export interface ReflectionJobPlan {
  trigger: ReflectionTrigger;
  generatedAt: string;
  eligibleClusters: FailureCluster[];
  skipped: Array<{ clusterId: string; reason: string }>;
}

export interface ModelReflectionProvider {
  complete: (prompt: string) => Promise<string>;
}

export interface GenerateProposalOptions {
  mode?: ReflectionMode;
  modelProvider?: ModelReflectionProvider;
  now?: string;
}

export interface RunReflectionOptions extends ReflectionSchedulerOptions {
  dataDir?: string;
  useModel?: boolean;
  modelProvider?: ModelReflectionProvider;
}

export interface RunReflectionResult {
  dataDir: string;
  mining: PatternMiningResult;
  job: ReflectionJobPlan;
  proposals: ReflectionProposal[];
}

function hash(value: string, length = 16): string {
  return createHash("sha256").update(value).digest("hex").slice(0, length);
}

function parseTime(value: string | null): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function evidenceLabel(evidence: ClusterEvidenceRef): string {
  const session = evidence.sessionFile ? redactLocalPaths(evidence.sessionFile) : "session file unknown";
  const entry = evidence.entryId ? `entry ${evidence.entryId}` : "entry unknown";
  const cwd = evidence.cwd ? redactLocalPaths(evidence.cwd) : "cwd unknown";
  return `${evidence.occurrenceId}: ${entry}, ${cwd}, ${session}`;
}

function safeText(value: string): string {
  return redactLocalPaths(redactSecrets(value));
}

function summarizeAffected(cluster: FailureCluster): string[] {
  const affected: string[] = [];
  if (cluster.tools.length > 0) affected.push(`tools: ${cluster.tools.map(safeText).join(", ")}`);
  if (cluster.cwdSummary.length > 0) affected.push(`cwd: ${cluster.cwdSummary.map(safeText).join(", ")}`);
  affected.push(`occurrences: ${cluster.count}`);
  return affected;
}

function knownPatternFix(cluster: FailureCluster): string | null {
  const key = cluster.clusterKey.toLowerCase();
  if (key.includes("edit-oldtext-mismatch")) return "Before editing, re-read the target block and apply the smallest exact-text replacement; if the block changed, fall back to a narrower patch instead of retrying the stale oldText.";
  if (key.includes("cannot-find-module")) return "Check whether the missing module path exists in the current project, then fix the import/path alias or install/link the missing dependency before rerunning the same validation.";
  if (key.includes("file-not-found")) return "Resolve the path mismatch first: confirm the file exists from the active cwd, then re-run the failed command with the corrected relative or absolute path.";
  if (key.includes("permission-denied")) return "Confirm the command needs the touched path, then fix local file permissions or choose a writable output path before retrying.";
  if (key.includes("command-not-found")) return "Confirm the tool is installed and on PATH for this shell, or use the package-manager script that provides it.";
  return null;
}

function findPriorResolvedFix(store: FlightRecorderStore, evidence: ClusterEvidenceRef[]): string | null {
  for (const item of evidence) {
    const candidates = store.searchEpisodes(item.snippet, item.cwd ? { cwd: item.cwd, limit: 5 } : { limit: 5 });
    const resolved = candidates.find((candidate) => candidate.episode.status === "resolved" && candidate.episode.resolution);
    if (resolved?.episode.resolution) return safeText(resolved.episode.resolution.summary);
  }
  return null;
}

function localConfidence(cluster: FailureCluster, hasFix: boolean): number {
  const base = hasFix ? 0.62 : 0.42;
  const countBoost = Math.min(0.22, cluster.count * 0.04);
  const cwdBoost = cluster.cwdSummary.length === 1 ? 0.05 : 0;
  return Math.min(0.92, base + countBoost + cwdBoost);
}

export function buildModelReflectionPrompt(cluster: FailureCluster, evidence: ClusterEvidenceRef[]): string {
  const lines = [
    "You are summarizing a local developer failure-memory cluster.",
    "Use only the redacted evidence below. Do not invent facts. If no durable fix is supported, suggest the next investigation step.",
    `Cluster: ${safeText(cluster.title)}`,
    `Seen: ${cluster.count} occurrence(s)` ,
    `Tools: ${cluster.tools.map(safeText).join(", ") || "unknown"}`,
    `CWDs: ${cluster.cwdSummary.map(safeText).join(", ") || "unknown"}`,
    "Evidence:",
  ];
  for (const item of evidence.slice(0, 5)) {
    lines.push(`- ${evidenceLabel(item)} :: ${compactSnippet(safeText(item.snippet).replace(/\s+/g, " "), 420)}`);
  }
  lines.push("Return a concise durable fix or investigation step in one paragraph.");
  return lines.join("\n");
}

export function selectReflectionJobsWithStore(store: FlightRecorderStore, options: ReflectionSchedulerOptions = {}): ReflectionJobPlan {
  const trigger = options.trigger ?? "manual";
  const generatedAt = options.now ?? new Date().toISOString();
  const nowMs = Date.parse(generatedAt);
  const minCount = options.minCount ?? (trigger === "manual" ? 2 : 3);
  const cooldownMs = options.cooldownMs ?? 24 * 60 * 60 * 1000;
  const limit = Math.max(1, Math.min(options.limit ?? 5, 20));
  const candidates = store.listFailureClusters({ status: "active", minCount, limit: 100 });
  const eligibleClusters: FailureCluster[] = [];
  const skipped: Array<{ clusterId: string; reason: string }> = [];

  for (const cluster of candidates) {
    const activeSuppression = store.hasActiveSignatureSuppression(cluster.representativeSignature, generatedAt);
    if (activeSuppression) {
      skipped.push({ clusterId: cluster.id, reason: activeSuppression.action });
      continue;
    }
    const lastReflected = parseTime(cluster.lastReflectedAt);
    if (lastReflected !== null && Number.isFinite(nowMs) && nowMs - lastReflected < cooldownMs) {
      skipped.push({ clusterId: cluster.id, reason: "cooldown" });
      continue;
    }
    if (eligibleClusters.length < limit) eligibleClusters.push(cluster);
  }

  return { trigger, generatedAt, eligibleClusters, skipped };
}

export async function generateReflectionProposal(store: FlightRecorderStore, cluster: FailureCluster, options: GenerateProposalOptions = {}): Promise<ReflectionProposal> {
  const generatedAt = options.now ?? new Date().toISOString();
  const evidence = store.getClusterEvidence(cluster.id, 5);
  const priorFix = findPriorResolvedFix(store, evidence);
  const patternFix = knownPatternFix(cluster);
  const localFix = priorFix ? `Prior local resolution observed: ${priorFix}` : patternFix;
  let mode: ReflectionMode = "local";
  let likelyFix = localFix ?? "No prior resolution is strong enough to claim a fix. Next step: inspect the representative evidence, identify the common failing command/tool, and validate one narrow remediation before turning it into a rule.";
  const limits = [
    "Reflection is inferred from local failure occurrences; inspect evidence before changing code or workflow.",
  ];

  if (options.mode === "model-assisted" && options.modelProvider) {
    const prompt = buildModelReflectionPrompt(cluster, evidence);
    const modelText = compactSnippet(redactSecrets(await options.modelProvider.complete(prompt)).replace(/\s+/g, " "), 700);
    if (modelText) {
      mode = "model-assisted";
      likelyFix = modelText;
      limits.push("Model-assisted synthesis used bounded redacted evidence snippets through the active provider.");
    }
  } else if (options.mode === "model-assisted") {
    limits.push("Model-assisted reflection was requested, but no model provider was available; local deterministic summary was used.");
  } else {
    limits.push("No model call was made; this is a local deterministic summary.");
  }

  const hasFix = Boolean(localFix) || mode === "model-assisted";
  const actions: FeedbackAction[] = ["useful", "wrong-match", "snooze", "silence-pattern", "promote-later", "make-rule"];
  return {
    id: `refl_${hash(`${cluster.id}\u0000${generatedAt}\u0000${mode}`)}`,
    clusterId: cluster.id,
    generatedAt,
    mode,
    title: `Pattern: ${safeText(cluster.title)}`,
    summary: `Seen ${cluster.count} related failure${cluster.count === 1 ? "" : "s"}${cluster.cwdSummary.length > 0 ? ` in ${cluster.cwdSummary.map(safeText).join(", ")}` : ""}.`,
    affected: summarizeAffected(cluster),
    likelyFix,
    confidence: localConfidence(cluster, hasFix),
    evidence,
    limits,
    actions,
  };
}

export async function runReflection(options: RunReflectionOptions = {}): Promise<RunReflectionResult> {
  const dataDir = options.dataDir ?? getDefaultDataDir();
  const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
  try {
    const miningOptions: Parameters<typeof mineFailurePatternsWithStore>[1] = { dataDir, minOccurrences: 1 };
    if (options.now !== undefined) miningOptions.now = options.now;
    const mining = mineFailurePatternsWithStore(store, miningOptions);
    const job = selectReflectionJobsWithStore(store, options);
    const proposals: ReflectionProposal[] = [];
    for (const cluster of job.eligibleClusters) {
      const proposalOptions: GenerateProposalOptions = { mode: options.useModel ? "model-assisted" : "local", now: job.generatedAt };
      if (options.modelProvider !== undefined) proposalOptions.modelProvider = options.modelProvider;
      const proposal = await generateReflectionProposal(store, cluster, proposalOptions);
      proposals.push(store.recordReflectionProposal(proposal));
      store.markClusterReflected(cluster.id, job.generatedAt);
    }
    return { dataDir, mining, job, proposals };
  } finally {
    store.close();
  }
}

export function formatReflectionDigest(result: RunReflectionResult): string {
  if (result.proposals.length === 0) {
    return [
      "Flight Recorder reflection: no repeated failure patterns ready.",
      `Examined occurrences: ${result.mining.examined}`,
      "Low-confidence failures are still being retained locally for future clustering.",
    ].join("\n");
  }

  const lines = [`Flight Recorder reflection: ${result.proposals.length} pattern${result.proposals.length === 1 ? "" : "s"} ready.`];
  for (const proposal of result.proposals) {
    lines.push("");
    lines.push(proposal.title);
    lines.push(proposal.summary);
    lines.push(`Likely durable fix: ${proposal.likelyFix}`);
    lines.push(`Confidence: ${proposal.confidence.toFixed(2)} (${proposal.mode})`);
    lines.push("Evidence:");
    for (const item of proposal.evidence.slice(0, 3)) lines.push(`- ${evidenceLabel(item)}`);
    lines.push("Limits:");
    for (const limit of proposal.limits.slice(0, 3)) lines.push(`- ${limit}`);
    lines.push("Actions:");
    lines.push(`- review interactively: /flight-review`);
    lines.push(`- mark useful: /flight-feedback --action useful --proposal ${proposal.id}`);
    lines.push(`- draft rule: /flight-feedback --action make-rule --proposal ${proposal.id}`);
    lines.push(`- silence: /flight-feedback --action silence-pattern --proposal ${proposal.id}`);
    lines.push(`Proposal: ${proposal.id}`);
  }
  return lines.join("\n");
}
