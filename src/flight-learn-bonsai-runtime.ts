import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { constants } from "node:fs";
import { access, stat } from "node:fs/promises";
import { Agent, request as httpRequest } from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import { createLlamaCppLocalDiagnosisPolishOptions } from "./flight-learn-llama-cpp-adapter.js";
import type { LocalDiagnosisPolishOptions, LocalDiagnosisPolishProvider, LocalDiagnosisPolishRequest } from "./flight-learn-local-diagnosis-model.js";

export const DEFAULT_BONSAI_MODEL_FILENAME = "Bonsai-1.7B-Q1_0.gguf";
export const DEFAULT_BONSAI_MODEL_LABEL = "Bonsai-1.7B-Q1_0";
export const DEFAULT_BONSAI_MODEL_SHA256 = "3d7c6c90dd98717a203adb22d5eacd2581850e40aa5327e144b97766cae5f7e3";
export const BONSAI_MODEL_PATH_ENV = "PI_FLIGHT_RECORDER_BONSAI_MODEL_PATH";
export const LLAMA_SERVER_PATH_ENV = "PI_FLIGHT_RECORDER_LLAMA_SERVER";

const DEFAULT_LLAMA_SERVER_COMMAND = "llama-server";
const DEFAULT_STARTUP_TIMEOUT_MS = 15_000;
const MAX_STARTUP_TIMEOUT_MS = 60_000;
const DEFAULT_CONTEXT_TOKENS = 2_048;
const MIN_CONTEXT_TOKENS = 512;
const MAX_CONTEXT_TOKENS = 4_096;
const HEALTH_POLL_MS = 75;
const HEALTH_REQUEST_TIMEOUT_MS = 250;
const STOP_GRACE_MS = 750;
const LOOPBACK_HOST = "127.0.0.1";
const DIRECT_LOOPBACK_HTTP_AGENT = new Agent({ keepAlive: false, proxyEnv: {} });

export interface BonsaiLocalDiagnosisRuntimeConfig {
  enabled?: boolean;
  modelPath?: string;
  llamaServerPath?: string;
  timeoutMs?: number;
  maxOutputTokens?: number;
  startupTimeoutMs?: number;
  contextTokens?: number;
}

export interface BonsaiLocalDiagnosisRuntimeLease {
  options: LocalDiagnosisPolishOptions;
  started: boolean;
  baseUrl: string | null;
  modelPath: string | null;
  cleanup: () => Promise<void>;
}

class UnavailableBonsaiProvider implements LocalDiagnosisPolishProvider {
  async completeLocalDiagnosisPolish(_request: LocalDiagnosisPolishRequest): Promise<string> {
    throw new Error("local Bonsai runtime unavailable");
  }
}

export function defaultBonsaiModelPath(homeDir = os.homedir()): string {
  return path.join(homeDir, ".cache", "pi-flight-recorder", "bonsai", DEFAULT_BONSAI_MODEL_FILENAME);
}

export async function startBonsaiLocalDiagnosisRuntime(config: BonsaiLocalDiagnosisRuntimeConfig = {}): Promise<BonsaiLocalDiagnosisRuntimeLease> {
  if (config.enabled !== true) return disabledLease();

  const modelPath = normalizeLocalPath(config.modelPath ?? process.env[BONSAI_MODEL_PATH_ENV] ?? defaultBonsaiModelPath());
  if (modelPath === null || !(await fileExists(modelPath))) return unavailableLease(config, modelPath);

  const llamaServerPath = normalizeCommandPath(config.llamaServerPath ?? process.env[LLAMA_SERVER_PATH_ENV] ?? DEFAULT_LLAMA_SERVER_COMMAND);
  if (llamaServerPath === null) return unavailableLease(config, modelPath);

  let port: number;
  let child: ChildProcess;
  try {
    port = await reserveLoopbackPort();
    child = spawn(llamaServerPath, llamaServerArgs(modelPath, port, config), {
      shell: false,
      stdio: "ignore",
      windowsHide: true,
      env: sanitizedLlamaServerEnv(),
    });
  } catch {
    return unavailableLease(config, modelPath);
  }

  const baseUrl = `http://${LOOPBACK_HOST}:${port}`;
  try {
    await waitForLlamaServerReady(baseUrl, child, normalizeStartupTimeoutMs(config.startupTimeoutMs));
  } catch {
    await stopChildProcess(child);
    return unavailableLease(config, modelPath);
  }

  const adapterConfig: Record<string, unknown> = {
    enabled: true,
    kind: "llama-cpp-server",
    baseUrl,
    model: modelLabelFromPath(modelPath),
  };
  if (config.timeoutMs !== undefined) adapterConfig["timeoutMs"] = config.timeoutMs;
  if (config.maxOutputTokens !== undefined) adapterConfig["maxOutputTokens"] = config.maxOutputTokens;

  return {
    options: createLlamaCppLocalDiagnosisPolishOptions(adapterConfig),
    started: true,
    baseUrl,
    modelPath,
    cleanup: () => stopChildProcess(child),
  };
}

function disabledLease(): BonsaiLocalDiagnosisRuntimeLease {
  return { options: { enabled: false }, started: false, baseUrl: null, modelPath: null, cleanup: async () => undefined };
}

function unavailableLease(config: BonsaiLocalDiagnosisRuntimeConfig, modelPath: string | null): BonsaiLocalDiagnosisRuntimeLease {
  const options: LocalDiagnosisPolishOptions = { enabled: true, provider: new UnavailableBonsaiProvider() };
  if (config.timeoutMs !== undefined) options.timeoutMs = config.timeoutMs;
  return { options, started: false, baseUrl: null, modelPath, cleanup: async () => undefined };
}

function normalizeLocalPath(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 2_048) return null;
  if (/^(?:https?|hf|git|ssh|ftp):/i.test(trimmed)) return null;
  const expanded = trimmed === "~" ? os.homedir() : trimmed.startsWith(`~${path.sep}`) ? path.join(os.homedir(), trimmed.slice(2)) : trimmed;
  return path.resolve(expanded);
}

function normalizeCommandPath(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 1_024) return null;
  if (/^(?:https?|hf|git|ssh|ftp):/i.test(trimmed)) return null;
  if (/\r|\n|\0/.test(trimmed)) return null;
  if (trimmed === DEFAULT_LLAMA_SERVER_COMMAND) return trimmed;
  const expanded = trimmed === "~" ? os.homedir() : trimmed.startsWith(`~${path.sep}`) ? path.join(os.homedir(), trimmed.slice(2)) : trimmed;
  return path.resolve(expanded);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    const info = await stat(filePath);
    if (!info.isFile()) return false;
    await access(filePath, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function llamaServerArgs(modelPath: string, port: number, config: BonsaiLocalDiagnosisRuntimeConfig): string[] {
  return [
    "-m",
    modelPath,
    "--host",
    LOOPBACK_HOST,
    "--port",
    String(port),
    "-c",
    String(normalizeContextTokens(config.contextTokens)),
  ];
}

function sanitizedLlamaServerEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const key of ["PATH", "HOME", "TMPDIR", "TMP", "TEMP", "SystemRoot", "WINDIR"] as const) {
    const value = process.env[key];
    if (value !== undefined) env[key] = value;
  }
  return env;
}

function normalizeStartupTimeoutMs(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return DEFAULT_STARTUP_TIMEOUT_MS;
  return Math.max(1, Math.min(MAX_STARTUP_TIMEOUT_MS, Math.floor(value)));
}

function normalizeContextTokens(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return DEFAULT_CONTEXT_TOKENS;
  return Math.max(MIN_CONTEXT_TOKENS, Math.min(MAX_CONTEXT_TOKENS, Math.floor(value)));
}

function modelLabelFromPath(modelPath: string): string {
  const basename = path.basename(modelPath).replace(/\.gguf$/i, "");
  const normalized = basename.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 80);
  return normalized || DEFAULT_BONSAI_MODEL_LABEL;
}

function reserveLoopbackPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, LOOPBACK_HOST, () => {
      const address = server.address();
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        if (!address || typeof address === "string") {
          reject(new Error("could not reserve loopback port"));
          return;
        }
        resolve(address.port);
      });
    });
  });
}

async function waitForLlamaServerReady(baseUrl: string, child: ChildProcess, timeoutMs: number): Promise<void> {
  let spawnError = false;
  let exited = child.exitCode !== null || child.signalCode !== null;
  const onError = (): void => {
    spawnError = true;
  };
  const onExit = (): void => {
    exited = true;
  };
  child.once("error", onError);
  child.once("exit", onExit);
  const deadline = Date.now() + timeoutMs;
  try {
    while (Date.now() <= deadline) {
      if (spawnError || exited) throw new Error("llama-server failed before readiness");
      if (await healthEndpointReady(baseUrl)) return;
      await delay(HEALTH_POLL_MS);
    }
    throw new Error("llama-server readiness timed out");
  } finally {
    child.off("error", onError);
    child.off("exit", onExit);
  }
}

function healthEndpointReady(baseUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (ready: boolean): void => {
      if (settled) return;
      settled = true;
      resolve(ready);
    };
    const request = httpRequest(`${baseUrl}/health`, { method: "GET", agent: DIRECT_LOOPBACK_HTTP_AGENT }, (response) => {
      const statusCode = response.statusCode ?? 0;
      response.resume();
      response.on("end", () => finish(statusCode >= 200 && statusCode < 300));
    });
    request.setTimeout(HEALTH_REQUEST_TIMEOUT_MS, () => {
      request.destroy();
      finish(false);
    });
    request.on("error", () => finish(false));
    request.end();
  });
}

async function stopChildProcess(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const exited = childTermination(child);
  child.kill("SIGTERM");
  const stopped = await Promise.race([exited, delay(STOP_GRACE_MS).then(() => "timeout" as const)]);
  if (stopped === "timeout" && child.exitCode === null && child.signalCode === null) {
    child.kill("SIGKILL");
    await Promise.race([exited, delay(STOP_GRACE_MS).then(() => undefined)]);
  }
}

function childTermination(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve();
  return Promise.race([once(child, "exit"), once(child, "close")]).then(() => undefined);
}
