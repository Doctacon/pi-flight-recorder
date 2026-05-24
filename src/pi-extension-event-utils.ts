import { contentToText } from "./session-parser.js";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}

function nestedExitCode(value: unknown): number | null {
  if (!isRecord(value)) return null;
  const direct = value.exitCode;
  if (typeof direct === "number") return direct;
  for (const nested of Object.values(value)) {
    if (isRecord(nested)) {
      const found = nestedExitCode(nested);
      if (found !== null) return found;
    }
  }
  return null;
}

export function toolResultFailed(event: unknown): boolean {
  if (!isRecord(event)) return false;
  if (event.isError === true) return true;
  const exitCode = nestedExitCode(event.details);
  return exitCode !== null && exitCode !== 0;
}

export function toolResultQuery(event: unknown): string {
  if (!isRecord(event)) return "";
  const input = isRecord(event.input) ? event.input : {};
  const command = typeof input.command === "string" ? input.command : "";
  const content = contentToText(event.content);
  const details = event.details ? contentToText(event.details) : "";
  const toolName = typeof event.toolName === "string" ? event.toolName : "";
  return [toolName, command, content, details].filter(Boolean).join("\n");
}

function stringField(value: Record<string, unknown>, name: string): string | null {
  const field = value[name];
  return typeof field === "string" ? field : null;
}

export function eventMetadata(event: unknown): { toolName: string | null; command: string | null; entryId: string | null; timestamp: string | null } {
  if (!isRecord(event)) return { toolName: null, command: null, entryId: null, timestamp: null };
  const input = isRecord(event.input) ? event.input : {};
  return {
    toolName: stringField(event, "toolName"),
    command: stringField(input, "command"),
    entryId: stringField(event, "id") ?? stringField(event, "toolCallId") ?? stringField(event, "entryId"),
    timestamp: stringField(event, "timestamp"),
  };
}
