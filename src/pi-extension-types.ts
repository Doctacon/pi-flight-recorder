import type { LiveMode, LiveSuggestionEngine } from "./live-suggestions.js";
import type { SessionWatchService } from "./watch-service.js";

export interface PiLike {
  registerCommand?: (name: string, command: { description: string; handler: (args: string, ctx: PiCommandContext) => Promise<void> }) => void;
  registerTool?: (tool: unknown) => void;
  on?: (eventName: string, handler: (event: unknown, ctx: PiCommandContext) => Promise<unknown> | unknown) => void;
}

export interface PiCommandContext {
  cwd?: string;
  ui?: {
    notify?: (message: string, level?: "info" | "error" | "success" | "warning") => void;
    setWidget?: (id: string, value: string[] | undefined, options?: { placement?: "aboveEditor" | "belowEditor" }) => void;
    select?: (message: string, choices: string[]) => Promise<string | undefined> | string | undefined;
    editor?: (message: string, prefilled?: string) => Promise<string | undefined> | string | undefined;
    confirm?: (title: string, message: string) => Promise<boolean> | boolean;
  };
  sessionManager?: {
    getCwd?: () => string;
    getSessionFile?: () => string | null;
  };
  model?: {
    complete?: (prompt: string) => Promise<string>;
  };
}

export interface LiveExtensionState {
  mode: LiveMode;
  dataDir?: string;
  sourceDirs: string[];
  minConfidence?: number;
  cooldownMs?: number;
  maxSuggestionsPerWindow?: number;
  watcher: SessionWatchService | null;
  engine: LiveSuggestionEngine | null;
  bootstrapped: boolean;
  bootstrapInFlight: Promise<void> | null;
  bootstrapGeneration: number;
  autoStart: boolean;
  modelReflection: boolean;
  reflectionOnSessionEnd: boolean;
  dailyDigest: boolean;
  lastBootstrapAt: string | null;
  lastBootstrapError: string | null;
  lastOccurrenceId: string | null;
  lastSuppressionReason: string | null;
  lastInjectedRuleIds: string[];
}
