import { compactSnippet, redactLocalPaths, sanitizeStoredText } from "./redact.js";
import type { FlightRule, FlightRuleCandidate, FlightRuleScope, ReflectionProposal } from "./types.js";

export interface RuleDraft {
  text: string;
  proposedScope: FlightRuleScope;
  projectRoot: string | null;
  rationale: string;
}

export interface RuleInjectionOptions {
  maxRules?: number;
}

function firstProjectRoot(proposal: ReflectionProposal): string | null {
  const cwd = proposal.evidence.find((item) => item.cwd)?.cwd ?? null;
  if (!cwd) return null;
  return cwd;
}

function isGenericAgentWorkflow(proposal: ReflectionProposal): boolean {
  const text = [proposal.title, proposal.summary, proposal.likelyFix, proposal.affected.join(" ")].join(" ").toLowerCase();
  return text.includes("edit") || text.includes("oldtext") || text.includes("tool") || text.includes("exact-text");
}

function isUnresolved(proposal: ReflectionProposal): boolean {
  const text = proposal.likelyFix.toLowerCase();
  return proposal.confidence < 0.6 || text.includes("no prior resolution") || text.includes("next step: inspect");
}

export function draftRuleFromProposal(proposal: ReflectionProposal): RuleDraft {
  const projectRoot = firstProjectRoot(proposal);
  if (proposal.title.toLowerCase().includes("exact-text edit") || proposal.likelyFix.toLowerCase().includes("oldtext")) {
    return {
      text: "Before exact-text edit replacements, re-read the target block and use the smallest current oldText; if the block changed, narrow the patch instead of retrying stale text.",
      proposedScope: "global",
      projectRoot: null,
      rationale: "Generic agent/tool workflow pattern.",
    };
  }

  if (isUnresolved(proposal)) {
    return {
      text: `When this failure pattern recurs, inspect the representative evidence and validate one narrow remediation before treating it as a durable fix: ${compactSnippet(proposal.title.replace(/^Pattern:\s*/i, ""), 120)}.`,
      proposedScope: projectRoot ? "project" : "global",
      projectRoot,
      rationale: "Proposal is unresolved or low-confidence, so the draft is an investigation reminder rather than a claimed fix.",
    };
  }

  const scope: FlightRuleScope = isGenericAgentWorkflow(proposal) ? "global" : projectRoot ? "project" : "global";
  return {
    text: compactSnippet(proposal.likelyFix.replace(/^Prior local resolution observed:\s*/i, ""), 500),
    proposedScope: scope,
    projectRoot: scope === "project" ? projectRoot : null,
    rationale: scope === "global" ? "Generic workflow guidance." : `Project-scoped to ${projectRoot ? redactLocalPaths(projectRoot) : "current project"}.`,
  };
}

export function formatRuleCandidate(candidate: FlightRuleCandidate): string {
  const scope = candidate.proposedScope === "project" ? `project (${candidate.projectRootDisplay ?? "current project"})` : "global";
  return [
    `Rule candidate: ${candidate.id}`,
    `Status: ${candidate.status}`,
    `Scope: ${scope}`,
    `Draft: ${candidate.draftText}`,
    `Evidence refs: ${candidate.evidenceCount}`,
    candidate.ruleId ? `Rule: ${candidate.ruleId}` : "Rule: none yet",
  ].join("\n");
}

export function formatFlightRule(rule: FlightRule): string {
  const scope = rule.scope === "project" ? `project (${rule.projectRootDisplay ?? "current project"})` : "global";
  return [
    `Flight rule: ${rule.id}`,
    `Status: ${rule.status}`,
    `Scope: ${scope}`,
    `Text: ${rule.text}`,
    `Injected: ${rule.injectionCount}${rule.lastInjectedAt ? `; last ${rule.lastInjectedAt}` : ""}`,
  ].join("\n");
}

export function formatRuleInjectionBlock(rules: FlightRule[], options: RuleInjectionOptions = {}): string | null {
  const maxRules = Math.max(1, Math.min(options.maxRules ?? 5, 10));
  const active = rules.filter((rule) => rule.status === "active").slice(0, maxRules);
  if (active.length === 0) return null;
  return [
    "Flight Recorder approved rules:",
    ...active.map((rule) => `- [${rule.id}; ${rule.scope}] ${sanitizeStoredText(rule.text, 350)}`),
  ].join("\n");
}

export function formatRulesMarkdown(rules: FlightRule[]): string {
  const lines = ["# Flight Recorder Rules", ""];
  for (const rule of rules) {
    lines.push(`## ${rule.id}`, "", `- Status: ${rule.status}`, `- Scope: ${rule.scope}${rule.projectRootDisplay ? ` (${rule.projectRootDisplay})` : ""}`, `- Source proposal: ${rule.sourceProposalId}`, "", rule.text, "");
  }
  return lines.join("\n");
}
