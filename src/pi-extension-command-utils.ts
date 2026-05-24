import type { FeedbackAction } from "./types.js";
import type { LiveMode } from "./live-suggestions.js";
import type { SessionWatchStatus } from "./watch-service.js";
import type { PiCommandContext } from "./pi-extension-types.js";

export function splitArgs(input: string): string[] {
  const result: string[] = [];
  const pattern = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(input)) !== null) {
    result.push(match[1] ?? match[2] ?? match[3] ?? "");
  }
  return result;
}

export function readOption(args: string[], name: string): string | null {
  const index = args.indexOf(name);
  if (index === -1) return null;
  return args[index + 1] ?? null;
}

export function readRepeatedOption(args: string[], name: string): string[] {
  const values: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index + 1];
    if (args[index] === name && value) values.push(value);
  }
  return values;
}

export function parseLimit(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function parseNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export function parseMode(value: string | null): LiveMode | null {
  if (value === "off" || value === "index-only" || value === "suggest-on-failure") return value;
  return null;
}

export function parseFeedbackAction(value: string | null): FeedbackAction | null {
  const allowed = new Set<FeedbackAction>(["useful", "wrong-match", "already-solved", "not-useful", "snooze", "silence-pattern", "promote-later", "make-rule", "dismiss"]);
  return value && allowed.has(value as FeedbackAction) ? value as FeedbackAction : null;
}

export function notify(ctx: PiCommandContext, message: string, level: "info" | "error" | "success" | "warning" = "info"): void {
  ctx.ui?.notify?.(message, level);
}

export function showLiveSuggestion(ctx: PiCommandContext, message: string): void {
  notify(ctx, message, "warning");
  ctx.ui?.setWidget?.("pi-flight-recorder-live-suggestion", message.split(/\r?\n/), { placement: "aboveEditor" });
}

export function currentCwd(ctx: PiCommandContext): string | undefined {
  return ctx.cwd ?? ctx.sessionManager?.getCwd?.();
}

export function formatCaptureStatus(watchStatus: SessionWatchStatus | undefined): string {
  if (!watchStatus) return "not watching";
  if (watchStatus.state === "watched-by-another-process") {
    return `shared watcher; another Pi session is indexing these sources; watched ${watchStatus.watchedPaths.length}; last sync ${watchStatus.lastSyncAt ?? "never"}`;
  }
  return `${watchStatus.state}; watched ${watchStatus.watchedPaths.length}; last sync ${watchStatus.lastSyncAt ?? "never"}`;
}

export function resolveCwd(value: string | null, ctx: PiCommandContext): string | undefined {
  if (!value) return undefined;
  if (value === "current") return currentCwd(ctx);
  return value;
}

export function optionlessText(args: string[], optionNames: string[]): string {
  return args.filter((arg, index) => {
    const previous = args[index - 1];
    return !optionNames.includes(arg) && !optionNames.includes(previous ?? "");
  }).join(" ").trim();
}
