import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import type { EventKind, ParsedSession, ParseWarning, SessionEvent, SessionHeader, SourceRef } from "./types.js";

interface RawEntry {
  type?: unknown;
  id?: unknown;
  parentId?: unknown;
  timestamp?: unknown;
  [key: string]: unknown;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function stableJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function contentToText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return content == null ? "" : stableJson(content);

  const parts: string[] = [];
  for (const block of content) {
    if (!block || typeof block !== "object") continue;
    const typed = block as Record<string, unknown>;
    switch (typed.type) {
      case "text":
        if (typeof typed.text === "string") parts.push(typed.text);
        break;
      case "thinking":
        if (typeof typed.thinking === "string") parts.push(typed.thinking);
        break;
      case "image":
        parts.push(`[image ${typeof typed.mimeType === "string" ? typed.mimeType : "unknown"}]`);
        break;
      case "toolCall": {
        const name = typeof typed.name === "string" ? typed.name : "unknown";
        parts.push(`[tool call ${name} ${stableJson(typed.arguments ?? {})}]`);
        break;
      }
      default:
        parts.push(stableJson(block));
        break;
    }
  }
  return parts.join("\n").trim();
}

function headerFrom(entry: RawEntry): SessionHeader {
  return {
    type: "session",
    version: asNumber(entry.version),
    id: asString(entry.id),
    timestamp: asString(entry.timestamp),
    cwd: asString(entry.cwd),
    parentSession: asString(entry.parentSession),
  };
}

function messageRole(entry: RawEntry): string | null {
  const message = entry.message;
  if (!message || typeof message !== "object") return null;
  const role = (message as Record<string, unknown>).role;
  return typeof role === "string" ? role : null;
}

function kindFor(entryType: string, role: string | null): EventKind {
  if (entryType === "message") {
    switch (role) {
      case "user":
        return "user";
      case "assistant":
        return "assistant";
      case "bashExecution":
        return "bash";
      case "toolResult":
        return "toolResult";
      case "compactionSummary":
        return "compaction";
      case "custom":
        return "custom";
      default:
        return "unknown";
    }
  }
  switch (entryType) {
    case "compaction":
      return "compaction";
    case "branch_summary":
      return "branchSummary";
    case "custom":
    case "custom_message":
      return "custom";
    case "model_change":
    case "thinking_level_change":
    case "label":
    case "session_info":
      return "metadata";
    default:
      return "unknown";
  }
}

function eventText(entry: RawEntry, kind: EventKind): string {
  if (entry.type === "message" && entry.message && typeof entry.message === "object") {
    const msg = entry.message as Record<string, unknown>;
    if (kind === "bash") {
      const command = asString(msg.command);
      const output = asString(msg.output);
      return [command ? `$ ${command}` : "", output ?? ""].filter(Boolean).join("\n").trim();
    }
    if (kind === "toolResult") return contentToText(msg.content);
    return contentToText(msg.content);
  }

  if (entry.type === "compaction") return asString(entry.summary) ?? "";
  if (entry.type === "branch_summary") return asString(entry.summary) ?? "";
  if (entry.type === "custom_message") return contentToText(entry.content);
  if (entry.type === "session_info") return asString(entry.name) ?? "";
  if (entry.type === "model_change") return [asString(entry.provider), asString(entry.modelId)].filter(Boolean).join("/");
  if (entry.type === "thinking_level_change") return asString(entry.thinkingLevel) ?? "";
  if (entry.type === "custom") return stableJson(entry.data ?? {});
  return stableJson(entry);
}

function eventFromEntry(params: {
  entry: RawEntry;
  sourceFile: string;
  lineNumber: number;
  header: SessionHeader | null;
  ancestry: string[];
}): SessionEvent {
  const { entry, sourceFile, lineNumber, header, ancestry } = params;
  const entryType = asString(entry.type) ?? "unknown";
  const role = messageRole(entry);
  const kind = kindFor(entryType, role);
  const message = entry.message && typeof entry.message === "object" ? (entry.message as Record<string, unknown>) : null;
  const source: SourceRef = {
    sourceFile,
    lineNumber,
    sessionId: header?.id ?? null,
    cwd: header?.cwd ?? null,
    entryId: asString(entry.id),
    parentId: asString(entry.parentId),
    timestamp: asString(entry.timestamp),
    entryType,
    role,
    ancestry,
  };

  return {
    kind,
    source,
    text: eventText(entry, kind),
    command: message ? asString(message.command) : null,
    output: message ? asString(message.output) : null,
    exitCode: message ? asNumber(message.exitCode) : null,
    cancelled: message ? asBoolean(message.cancelled) : false,
    truncated: message ? asBoolean(message.truncated) : false,
    toolName: message ? asString(message.toolName) : null,
    isError: message ? asBoolean(message.isError) : false,
    raw: entry,
  };
}

function buildAncestry(entries: RawEntry[], warnings: ParseWarning[], sourceFile: string): Map<string, string[]> {
  const byId = new Map<string, RawEntry>();
  for (const entry of entries) {
    const id = asString(entry.id);
    if (id) byId.set(id, entry);
  }

  const cache = new Map<string, string[]>();
  const visiting = new Set<string>();

  function ancestryFor(id: string): string[] {
    const cached = cache.get(id);
    if (cached) return cached;
    if (visiting.has(id)) {
      warnings.push({ sourceFile, lineNumber: 0, message: `Cycle detected in session ancestry at ${id}` });
      return [id];
    }

    const entry = byId.get(id);
    if (!entry) return [id];
    visiting.add(id);
    const parentId = asString(entry.parentId);
    const ancestry = parentId ? [...ancestryFor(parentId), id] : [id];
    visiting.delete(id);
    cache.set(id, ancestry);
    return ancestry;
  }

  for (const id of byId.keys()) ancestryFor(id);
  return cache;
}

export function parseSessionJsonl(content: string, sourceFile = "<memory>"): ParsedSession {
  const warnings: ParseWarning[] = [];
  const entries: Array<{ entry: RawEntry; lineNumber: number }> = [];
  let header: SessionHeader | null = null;

  const lines = content.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1;
    const line = lines[index]?.trim();
    if (!line) continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch (error) {
      warnings.push({
        sourceFile,
        lineNumber,
        message: `Malformed JSONL line: ${error instanceof Error ? error.message : String(error)}`,
      });
      continue;
    }

    if (!parsed || typeof parsed !== "object") {
      warnings.push({ sourceFile, lineNumber, message: "JSONL line is not an object" });
      continue;
    }

    const entry = parsed as RawEntry;
    const entryType = asString(entry.type);
    if (entryType === "session") {
      if (header) warnings.push({ sourceFile, lineNumber, message: "Additional session header ignored" });
      else header = headerFrom(entry);
      continue;
    }

    if (!entryType) warnings.push({ sourceFile, lineNumber, message: "Entry missing string type" });
    if (!asString(entry.id)) warnings.push({ sourceFile, lineNumber, message: `Entry ${entryType ?? "unknown"} missing string id` });
    entries.push({ entry, lineNumber });
  }

  const ancestryMap = buildAncestry(entries.map((item) => item.entry), warnings, sourceFile);
  const events = entries.map(({ entry, lineNumber }) => {
    const id = asString(entry.id);
    const ancestry = id ? ancestryMap.get(id) ?? [id] : [];
    return eventFromEntry({ entry, sourceFile, lineNumber, header, ancestry });
  });

  return { sourceFile, header, events, warnings };
}

export async function parseSessionFile(filePath: string): Promise<ParsedSession> {
  const content = await readFile(filePath, "utf8");
  return parseSessionJsonl(content, filePath);
}

export async function listSessionFiles(sourceDirs = getDefaultSessionDirs()): Promise<string[]> {
  const files: string[] = [];

  async function walk(target: string): Promise<void> {
    let targetStat;
    try {
      targetStat = await stat(target);
    } catch {
      return;
    }

    if (targetStat.isFile()) {
      if (target.endsWith(".jsonl")) files.push(target);
      return;
    }

    if (!targetStat.isDirectory()) return;
    const entries = await readdir(target, { withFileTypes: true });
    await Promise.all(entries.map((entry) => walk(path.join(target, entry.name))));
  }

  await Promise.all(sourceDirs.map((dir) => walk(dir)));
  return files.sort();
}

export function getDefaultSessionDirs(): string[] {
  return [
    path.join(homedir(), ".pi", "agent", "sessions"),
    path.join(homedir(), ".pi", "agent", "sessions-archive"),
  ];
}

export async function hashFile(filePath: string): Promise<string> {
  const content = await readFile(filePath);
  return createHash("sha256").update(content).digest("hex");
}
