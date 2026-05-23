import { createHash } from "node:crypto";
import { compactSnippet, redactSecrets } from "./redact.js";
import type { FailureEpisode, ParsedSession, SessionEvent } from "./types.js";

export interface ExtractOptions {
  lookaheadEvents?: number;
}

const DEFAULT_LOOKAHEAD = 40;

function firstMeaningfulLine(text: string): string {
  const lines = redactSecrets(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.find((line) => !line.startsWith("$ ")) ?? lines[0] ?? "";
}

function isFailureEvent(event: SessionEvent): boolean {
  if (event.kind === "bash") return event.cancelled || (event.exitCode !== null && event.exitCode !== 0);
  return event.kind === "toolResult" && event.isError;
}

function isValidationCommand(command: string): boolean {
  return /\b(test|typecheck|tsc|lint|build|pytest|vitest|jest|mocha|check)\b/i.test(command);
}

function isSuccessfulValidation(event: SessionEvent): boolean {
  return event.kind === "bash" && event.exitCode === 0 && Boolean(event.command && isValidationCommand(event.command));
}

function isDescendantOf(event: SessionEvent, ancestor: SessionEvent): boolean {
  const ancestorId = ancestor.source.entryId;
  if (!ancestorId) return event.source.lineNumber > ancestor.source.lineNumber;
  return event.source.ancestry.includes(ancestorId);
}

function shortSummary(text: string, maxLength = 180): string {
  const compact = compactSnippet(text.replace(/\s+/g, " "), maxLength);
  return compact.length > maxLength ? `${compact.slice(0, maxLength - 1)}…` : compact;
}

const FILE_PATH_PATTERN = /(?:[.~]?\/?[\w@.-]+\/)+(?:[\w@.-]+)(?:\.[A-Za-z0-9]+)(?::\d+(?::\d+)?)?/g;

export function extractFilePaths(text: string): string[] {
  const matches = text.match(FILE_PATH_PATTERN) ?? [];
  return Array.from(
    new Set(
      matches.map((match) => match.replace(/:\d+(?::\d+)?$/, "")).filter((match) => !match.includes("node_modules/.cache")),
    ),
  ).slice(0, 20);
}

function normalizeForSignature(text: string): string {
  return redactSecrets(text)
    .toLowerCase()
    .replace(/\/users\/[^\s/]+/g, "/users/<user>")
    .replace(/[0-9a-f]{8,}/g, "<hex>")
    .replace(/\b\d+\b/g, "<num>")
    .replace(/[^\p{L}\p{N}_./:-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

function stableId(parts: string[]): string {
  return `ep_${createHash("sha256").update(parts.join("\u0000")).digest("hex").slice(0, 16)}`;
}

function candidateSearchText(event: SessionEvent): string {
  return [event.command ?? "", event.output ?? "", event.text, event.toolName ?? ""].filter(Boolean).join("\n");
}

function isAttemptEvent(event: SessionEvent): boolean {
  if (event.kind === "assistant" || event.kind === "user") return /\b(fix|try|update|change|edit|patch|resolve|adjust|modify|rerun)\b/i.test(event.text);
  if (event.kind === "toolResult" && !event.isError) return /^(edit|write|bash|apply_patch|multi_edit)$/i.test(event.toolName ?? "");
  if (event.kind === "bash" && event.exitCode === 0 && event.command) return !isValidationCommand(event.command);
  return false;
}

function eventAttemptSummary(event: SessionEvent): string {
  if (event.kind === "bash" && event.command) return `Ran: ${event.command}`;
  if (event.kind === "toolResult" && event.toolName) return `Tool succeeded: ${event.toolName} ${shortSummary(event.text, 140)}`.trim();
  return shortSummary(event.text, 180);
}

function problemSummary(event: SessionEvent): string {
  if (event.kind === "bash") {
    const command = event.command ? `\`${event.command}\`` : "Command";
    const exit = event.cancelled ? "was cancelled" : `exited ${event.exitCode ?? "unknown"}`;
    const line = firstMeaningfulLine(event.output ?? event.text);
    return line ? `${command} ${exit}: ${shortSummary(line, 140)}` : `${command} ${exit}`;
  }
  const tool = event.toolName ? `Tool \`${event.toolName}\`` : "Tool";
  return `${tool} errored: ${shortSummary(firstMeaningfulLine(event.text), 160)}`;
}

function confidenceFor(status: "resolved" | "unresolved", attempts: number, failure: SessionEvent, resolution: SessionEvent | null): number {
  if (status === "unresolved") return 0.45;
  let confidence = 0.72;
  if (attempts > 0) confidence += 0.08;
  if (failure.command && resolution?.command && failure.command === resolution.command) confidence += 0.1;
  return Math.min(0.93, confidence);
}

export function extractFailureEpisodes(parsed: ParsedSession, options: ExtractOptions = {}): FailureEpisode[] {
  const lookahead = options.lookaheadEvents ?? DEFAULT_LOOKAHEAD;
  const episodes: FailureEpisode[] = [];

  for (let index = 0; index < parsed.events.length; index += 1) {
    const failure = parsed.events[index];
    if (!failure || !isFailureEvent(failure)) continue;

    const candidates = parsed.events.slice(index + 1, index + 1 + lookahead).filter((event) => isDescendantOf(event, failure));
    const resolutionEvent = candidates.find(isSuccessfulValidation) ?? null;
    const attemptWindow = resolutionEvent
      ? candidates.slice(0, Math.max(0, candidates.findIndex((event) => event === resolutionEvent)))
      : candidates;
    const attempts = attemptWindow.filter(isAttemptEvent).slice(0, 5).map((event) => ({
      summary: eventAttemptSummary(event),
      sourceRef: event.source,
    }));

    const rawObserved = candidateSearchText(failure);
    const files = Array.from(new Set(extractFilePaths([rawObserved, ...attempts.map((attempt) => attempt.summary)].join("\n"))));
    const status = resolutionEvent ? "resolved" : "unresolved";
    const resolution = resolutionEvent
      ? { summary: `Validation passed: ${resolutionEvent.command ?? shortSummary(resolutionEvent.text, 120)}`, sourceRef: resolutionEvent.source }
      : null;
    const signature = normalizeForSignature([
      failure.command ?? failure.toolName ?? failure.kind,
      failure.exitCode === null ? "" : `exit ${failure.exitCode}`,
      firstMeaningfulLine(rawObserved),
      files.join(" "),
    ].join("\n"));
    const sourceRefs = [failure.source, ...attempts.map((attempt) => attempt.sourceRef), ...(resolution ? [resolution.sourceRef] : [])];
    const limits = status === "resolved"
      ? ["Likely fix is inferred from later session events; inspect evidence before applying."]
      : ["No passing validation command was detected after this failure on the same branch path."];
    if (!failure.source.cwd) limits.push("Failure source has no cwd metadata.");

    const observed = compactSnippet(rawObserved, 1_200);
    const episode: FailureEpisode = {
      id: stableId([parsed.sourceFile, failure.source.entryId ?? String(failure.source.lineNumber), signature]),
      sourceFile: parsed.sourceFile,
      signature,
      problemSummary: problemSummary(failure),
      status,
      confidence: confidenceFor(status, attempts.length, failure, resolutionEvent),
      cwd: failure.source.cwd,
      sessionId: failure.source.sessionId,
      sourceRefs,
      observed,
      attempts,
      resolution,
      files,
      limits,
      searchText: [signature, problemSummary(failure), observed, attempts.map((attempt) => attempt.summary).join("\n"), resolution?.summary ?? "", files.join(" ")].join("\n"),
    };
    episodes.push(episode);
  }

  return episodes;
}
