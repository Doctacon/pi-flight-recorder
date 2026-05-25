import { compactSnippet, sanitizeStoredText } from "./redact.js";
import type { ArtifactCandidate, ArtifactCandidateOutcome, DeltaEvidenceRef, DeltaRecurrenceLink, ExpectationDelta } from "./types.js";
import type { FlightRecorderStore } from "./storage.js";

export type DeltaOutcomeCategory = "unresolved" | "insufficient-evidence" | "no-recurrence-observed" | "recurring-after-applied";

export interface DeltaOutcomeSummaryItem {
  category: DeltaOutcomeCategory;
  deltaId: string;
  candidateId: string | null;
  artifactType: ArtifactCandidate["artifactType"] | null;
  title: string;
  status: ExpectationDelta["status"] | ArtifactCandidate["status"];
  outcome: ArtifactCandidateOutcome | null;
  applied: boolean;
  appliedAt: string | null;
  recurrenceCount: number;
  recurrenceAfterAppliedCount: number;
  lastRecurrenceAt: string | null;
  label: string;
  limits: string[];
}

export interface DeltaOutcomeSummary {
  generatedAt: string;
  counts: Record<DeltaOutcomeCategory, number>;
  items: DeltaOutcomeSummaryItem[];
  limits: string[];
}

export interface RecordArtifactOutcomeInput {
  candidateId: string;
  outcome: ArtifactCandidateOutcome;
  outcomeSummary?: string | null;
  appliedArtifactRef?: string | null;
  now?: string;
}

export interface RecordArtifactOutcomeResult {
  candidate: ArtifactCandidate;
  delta: ExpectationDelta | null;
}

export interface RecordDeltaRecurrenceInput {
  deltaId: string;
  priorArtifactCandidateId: string;
  reason: string;
  similarity?: number | null;
  evidenceRefs?: DeltaEvidenceRef[];
  now?: string;
}

export interface RecordDeltaRecurrenceResult {
  link: DeltaRecurrenceLink;
  priorArtifactCandidate: ArtifactCandidate;
  recurringDelta: ExpectationDelta;
}

const SUMMARY_LIMITS = [
  "Outcome categories are local observations, not proof that an artifact caused or prevented future behavior.",
  "No recurrence observed means no linked local recurrence has been recorded since application; it is not proof of permanent improvement.",
  "Recurrence links are manual/inspectable evidence and can be corrected or rerouted later.",
];

function safe(value: string | null | undefined, maxLength = 240): string {
  return sanitizeStoredText(value && value.trim() ? value : "unknown", maxLength);
}

function afterApplied(candidate: ArtifactCandidate, link: DeltaRecurrenceLink): boolean {
  if (!candidate.appliedAt) return false;
  return link.createdAt >= candidate.appliedAt;
}

function latestLinkAt(links: DeltaRecurrenceLink[]): string | null {
  return links.map((link) => link.createdAt).sort().at(-1) ?? null;
}

function categoryForCandidate(candidate: ArtifactCandidate, links: DeltaRecurrenceLink[]): DeltaOutcomeCategory {
  const afterCount = links.filter((link) => afterApplied(candidate, link)).length;
  if (candidate.status === "dismissed" || candidate.status === "rejected") return "unresolved";
  if (candidate.applied && candidate.appliedAt && afterCount > 0) return "recurring-after-applied";
  if (candidate.status === "recurring" || candidate.outcome === "needs-reroute" || candidate.outcome === "no-change" || candidate.outcome === "worse") return "unresolved";
  if (candidate.applied && candidate.appliedAt) return "no-recurrence-observed";
  return "insufficient-evidence";
}

function labelForCandidate(candidate: ArtifactCandidate, category: DeltaOutcomeCategory, recurrenceAfterAppliedCount: number): string {
  switch (category) {
    case "recurring-after-applied":
      return `Recurring after applied: ${recurrenceAfterAppliedCount} linked later delta${recurrenceAfterAppliedCount === 1 ? "" : "s"} after ${candidate.appliedAt ?? "application"}.`;
    case "no-recurrence-observed":
      return `No recurrence observed since applied at ${candidate.appliedAt}.`;
    case "insufficient-evidence":
      return candidate.applied ? "Insufficient evidence: candidate is marked applied but has no application timestamp." : "Insufficient evidence: candidate has not been marked applied yet.";
    case "unresolved":
      return candidate.status === "dismissed" || candidate.status === "rejected" ? "Unresolved: candidate was rejected/dismissed without being applied." : "Unresolved: outcome indicates the route still needs attention.";
  }
}

function limitsForCandidate(category: DeltaOutcomeCategory): string[] {
  if (category === "no-recurrence-observed") {
    return [
      "No linked recurrence has been recorded since application in this local database.",
      "This is absence-of-observed-recurrence, not a causal success claim.",
    ];
  }
  if (category === "recurring-after-applied") {
    return [
      "A later similar delta was linked after application, but the link alone does not prove the artifact caused or failed to cause the recurrence.",
      "Review recurrence evidence and reroute manually if a different artifact is needed.",
    ];
  }
  if (category === "insufficient-evidence") {
    return ["The route exists, but application/outcome evidence is not yet strong enough to categorize recurrence."];
  }
  return ["This category needs more manual review or rerouting before it should be treated as bridged."];
}

function itemForCandidate(candidate: ArtifactCandidate, links: DeltaRecurrenceLink[]): DeltaOutcomeSummaryItem {
  const recurrenceAfterAppliedCount = links.filter((link) => afterApplied(candidate, link)).length;
  const category = categoryForCandidate(candidate, links);
  return {
    category,
    deltaId: candidate.deltaId,
    candidateId: candidate.id,
    artifactType: candidate.artifactType,
    title: candidate.title,
    status: candidate.status,
    outcome: candidate.outcome,
    applied: candidate.applied,
    appliedAt: candidate.appliedAt,
    recurrenceCount: links.length,
    recurrenceAfterAppliedCount,
    lastRecurrenceAt: latestLinkAt(links),
    label: labelForCandidate(candidate, category, recurrenceAfterAppliedCount),
    limits: limitsForCandidate(category),
  };
}

function unresolvedDeltaItem(delta: ExpectationDelta): DeltaOutcomeSummaryItem {
  return {
    category: "unresolved",
    deltaId: delta.id,
    candidateId: null,
    artifactType: null,
    title: delta.summary,
    status: delta.status,
    outcome: null,
    applied: false,
    appliedAt: null,
    recurrenceCount: 0,
    recurrenceAfterAppliedCount: 0,
    lastRecurrenceAt: null,
    label: delta.status === "recurring" ? "Unresolved: delta is marked recurring and needs review." : "Unresolved: delta has no active artifact candidate yet.",
    limits: ["No active artifact candidate is available for outcome assessment."],
  };
}

function itemSortKey(item: DeltaOutcomeSummaryItem): string {
  return [item.lastRecurrenceAt ?? item.appliedAt ?? "", item.deltaId, item.candidateId ?? ""].join("\u0000");
}

export function summarizeDeltaOutcomes(store: FlightRecorderStore, options: { limit?: number } = {}): DeltaOutcomeSummary {
  const limit = Math.max(1, Math.min(options.limit ?? 50, 500));
  const candidates = store.listArtifactCandidates({ limit: 1_000 });
  const candidateItems = candidates.map((candidate) => itemForCandidate(candidate, store.listDeltaRecurrenceLinks({ priorArtifactCandidateId: candidate.id, limit: 1_000 })));
  const candidateDeltaIds = new Set(candidates.map((candidate) => candidate.deltaId));
  const unresolvedDeltas = store
    .listExpectationDeltas({ limit: 1_000 })
    .filter((delta) => !candidateDeltaIds.has(delta.id) && delta.status !== "dismissed" && delta.status !== "resolved")
    .map(unresolvedDeltaItem);
  const items = [...candidateItems, ...unresolvedDeltas]
    .sort((left, right) => itemSortKey(right).localeCompare(itemSortKey(left)))
    .slice(0, limit);
  const counts: Record<DeltaOutcomeCategory, number> = {
    "unresolved": 0,
    "insufficient-evidence": 0,
    "no-recurrence-observed": 0,
    "recurring-after-applied": 0,
  };
  for (const item of [...candidateItems, ...unresolvedDeltas]) counts[item.category] += 1;
  return { generatedAt: new Date().toISOString(), counts, items, limits: SUMMARY_LIMITS };
}

export function formatDeltaOutcomeSummary(summary: DeltaOutcomeSummary): string {
  const lines = [
    "Delta outcome summary (local observations only)",
    `Counts (candidate records plus unrouted deltas): unresolved=${summary.counts.unresolved}, insufficient evidence=${summary.counts["insufficient-evidence"]}, no recurrence observed=${summary.counts["no-recurrence-observed"]}, recurring after applied=${summary.counts["recurring-after-applied"]}`,
    "Limits:",
    ...summary.limits.map((limit) => `- ${limit}`),
  ];
  if (summary.items.length === 0) {
    lines.push("Items: none");
    return lines.join("\n");
  }
  lines.push("Items:");
  for (const item of summary.items) {
    const target = item.candidateId ? `${item.candidateId} (${item.artifactType})` : "no candidate";
    lines.push(`- [${item.category}] delta=${item.deltaId}; candidate=${target}; ${compactSnippet(item.title.replace(/\s+/g, " "), 120)}`);
    lines.push(`  ${item.label}`);
    if (item.outcome) lines.push(`  Outcome: ${item.outcome}`);
    if (item.recurrenceCount > 0) lines.push(`  Recurrence links: ${item.recurrenceCount} total; ${item.recurrenceAfterAppliedCount} after applied; last=${item.lastRecurrenceAt ?? "unknown"}`);
    lines.push(`  Limit: ${item.limits[0] ?? "Inspect evidence before relying on this category."}`);
  }
  return lines.join("\n");
}

function statusForOutcome(outcome: ArtifactCandidateOutcome): ArtifactCandidate["status"] | undefined {
  if (outcome === "helped") return "resolved";
  if (outcome === "needs-reroute" || outcome === "no-change" || outcome === "worse") return "recurring";
  return undefined;
}

export function recordArtifactCandidateOutcomeWithStore(store: FlightRecorderStore, input: RecordArtifactOutcomeInput): RecordArtifactOutcomeResult | null {
  let candidate = store.getArtifactCandidate(input.candidateId);
  if (!candidate) return null;
  const now = input.now ?? new Date().toISOString();
  if (input.appliedArtifactRef !== undefined && !candidate.applied) {
    candidate = store.markArtifactCandidateApplied(candidate.id, { appliedArtifactRef: input.appliedArtifactRef, now }) ?? candidate;
  }
  const outcomeUpdate: Parameters<typeof store.updateArtifactCandidateOutcome>[1] = {
    outcome: input.outcome,
    outcomeSummary: input.outcomeSummary ?? null,
    now,
  };
  const outcomeStatus = statusForOutcome(input.outcome);
  if (outcomeStatus) outcomeUpdate.status = outcomeStatus;
  candidate = store.updateArtifactCandidateOutcome(candidate.id, outcomeUpdate) ?? candidate;
  const delta = store.getExpectationDelta(candidate.deltaId);
  if (delta?.activeArtifactCandidateId === candidate.id) {
    if (input.outcome === "helped") store.markExpectationDeltaResolved(delta.id, safe(input.outcomeSummary, 500), now);
    if (input.outcome === "needs-reroute" || input.outcome === "no-change" || input.outcome === "worse") store.markExpectationDeltaRecurring(delta.id, safe(input.outcomeSummary, 500), now);
  }
  return { candidate: store.getArtifactCandidate(candidate.id) ?? candidate, delta: store.getExpectationDelta(candidate.deltaId) };
}

export function recordDeltaRecurrenceWithStore(store: FlightRecorderStore, input: RecordDeltaRecurrenceInput): RecordDeltaRecurrenceResult | null {
  const prior = store.getArtifactCandidate(input.priorArtifactCandidateId);
  const recurringDelta = store.getExpectationDelta(input.deltaId);
  if (!prior || !recurringDelta) return null;
  const now = input.now ?? new Date().toISOString();
  const reason = sanitizeStoredText(input.reason, 700);
  const linkInput: Parameters<typeof store.linkDeltaRecurrence>[0] = {
    deltaId: recurringDelta.id,
    priorArtifactCandidateId: prior.id,
    reason,
    evidenceRefs: input.evidenceRefs ?? recurringDelta.evidenceRefs,
    now,
  };
  if (input.similarity !== undefined) linkInput.similarity = input.similarity;
  const link = store.linkDeltaRecurrence(linkInput);
  const after = afterApplied(prior, link);
  store.markExpectationDeltaRecurring(recurringDelta.id, after ? `Linked recurrence after applied candidate ${prior.id}: ${reason}` : `Linked recurrence for prior candidate ${prior.id}: ${reason}`, now);
  if (after && prior.status !== "rejected" && prior.status !== "dismissed") {
    store.updateArtifactCandidateOutcome(prior.id, {
      outcome: "needs-reroute",
      outcomeSummary: `Recurring after applied: ${reason}`,
      status: "recurring",
      now,
    });
  }
  return {
    link,
    priorArtifactCandidate: store.getArtifactCandidate(prior.id) ?? prior,
    recurringDelta: store.getExpectationDelta(recurringDelta.id) ?? recurringDelta,
  };
}
