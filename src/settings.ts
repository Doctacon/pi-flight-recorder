import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { LiveMode } from "./live-suggestions.js";
import { ensureDataDir, getDefaultDataDir } from "./storage.js";

export interface FlightRecorderSettings {
  mode: LiveMode;
  autoStart: boolean;
  modelReflection: boolean;
  reflectionOnSessionEnd: boolean;
  dailyDigest: boolean;
  minConfidence: number;
  cooldownMs: number;
  maxSuggestionsPerWindow: number;
  sourceDirs: string[];
  disabledReason: string | null;
}

export const DEFAULT_SETTINGS: FlightRecorderSettings = {
  mode: "suggest-on-failure",
  autoStart: true,
  modelReflection: false,
  reflectionOnSessionEnd: true,
  dailyDigest: false,
  minConfidence: 0.78,
  cooldownMs: 5 * 60 * 1000,
  maxSuggestionsPerWindow: 2,
  sourceDirs: [],
  disabledReason: null,
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function parseMode(value: unknown): LiveMode {
  return value === "off" || value === "index-only" || value === "suggest-on-failure" ? value : DEFAULT_SETTINGS.mode;
}

function parseBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function parseNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function parseStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.length > 0) : [];
}

export function settingsPath(dataDir = getDefaultDataDir()): string {
  return path.join(dataDir, "flight-settings.json");
}

export async function readSettings(dataDir = getDefaultDataDir()): Promise<FlightRecorderSettings> {
  try {
    const parsed = JSON.parse(await readFile(settingsPath(dataDir), "utf8")) as unknown;
    if (!isObject(parsed)) return { ...DEFAULT_SETTINGS };
    return {
      mode: parseMode(parsed.mode),
      autoStart: parseBoolean(parsed.autoStart, DEFAULT_SETTINGS.autoStart),
      modelReflection: parseBoolean(parsed.modelReflection, DEFAULT_SETTINGS.modelReflection),
      reflectionOnSessionEnd: parseBoolean(parsed.reflectionOnSessionEnd, DEFAULT_SETTINGS.reflectionOnSessionEnd),
      dailyDigest: parseBoolean(parsed.dailyDigest, DEFAULT_SETTINGS.dailyDigest),
      minConfidence: parseNumber(parsed.minConfidence, DEFAULT_SETTINGS.minConfidence),
      cooldownMs: parseNumber(parsed.cooldownMs, DEFAULT_SETTINGS.cooldownMs),
      maxSuggestionsPerWindow: parseNumber(parsed.maxSuggestionsPerWindow, DEFAULT_SETTINGS.maxSuggestionsPerWindow),
      sourceDirs: parseStringArray(parsed.sourceDirs),
      disabledReason: typeof parsed.disabledReason === "string" ? parsed.disabledReason : null,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function writeSettings(settings: FlightRecorderSettings, dataDir = getDefaultDataDir()): Promise<void> {
  await ensureDataDir(dataDir);
  await writeFile(settingsPath(dataDir), `${JSON.stringify(settings, null, 2)}\n`);
}

export async function updateSettings(dataDir: string, patch: Partial<FlightRecorderSettings>): Promise<FlightRecorderSettings> {
  const current = await readSettings(dataDir);
  const next: FlightRecorderSettings = { ...current, ...patch };
  await writeSettings(next, dataDir);
  return next;
}
