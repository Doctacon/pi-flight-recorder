import { Agent, request as httpRequest, type IncomingMessage } from "node:http";

import type {
  LocalDiagnosisPolishOptions,
  LocalDiagnosisPolishProvider,
  LocalDiagnosisPolishRequest,
} from "./flight-learn-local-diagnosis-model.js";

export type LlamaCppLocalDiagnosisPolishConfig =
  | { enabled?: false }
  | {
      enabled: true;
      kind: "llama-cpp-server";
      baseUrl: string;
      model?: string;
      timeoutMs?: number;
      maxOutputTokens?: number;
    };

export type LlamaCppLocalDiagnosisAdapterErrorCode =
  | "invalid-config"
  | "invalid-url"
  | "http-error"
  | "invalid-transport"
  | "response-too-large"
  | "transport-error";

export class LlamaCppLocalDiagnosisAdapterError extends Error {
  readonly code: LlamaCppLocalDiagnosisAdapterErrorCode;

  constructor(code: LlamaCppLocalDiagnosisAdapterErrorCode) {
    super(llamaCppAdapterErrorMessage(code));
    this.name = "LlamaCppLocalDiagnosisAdapterError";
    this.code = code;
  }
}

const DEFAULT_MAX_OUTPUT_TOKENS = 192;
const MIN_MAX_OUTPUT_TOKENS = 16;
const MAX_MAX_OUTPUT_TOKENS = 256;
const MAX_RESPONSE_BYTES = 16 * 1024;
const MAX_MODEL_CONTENT_CHARS = 4 * 1024;
const MAX_PROMPT_CHARS = 16 * 1024;
const MAX_BASE_URL_CHARS = 512;
const MAX_MODEL_LABEL_CHARS = 80;

const ALLOWED_CONFIG_KEYS = new Set(["enabled", "kind", "baseUrl", "model", "timeoutMs", "maxOutputTokens"]);
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "[::1]"]);
const DIRECT_LOOPBACK_HTTP_AGENT = new Agent({ keepAlive: false, proxyEnv: {} });

interface ParsedLlamaCppConfig {
  endpoint: string;
  model: string | null;
  maxOutputTokens: number;
}

/**
 * Builds model-polish options for the model-agnostic diagnosis harness.
 *
 * The adapter is disabled unless the caller supplies an explicit
 * `{ enabled: true, kind: "llama-cpp-server", baseUrl }` config. Invalid enabled
 * configs fail closed inside the provider call so the harness can return the
 * deterministic diagnosis fallback without making a network request.
 */
export function createLlamaCppLocalDiagnosisPolishOptions(config?: unknown): LocalDiagnosisPolishOptions {
  const provider = createLlamaCppLocalDiagnosisPolishProvider(config);
  if (!provider) return { enabled: false };

  const timeoutMs = configuredTimeoutMs(config);
  if (timeoutMs === undefined) return { enabled: true, provider };
  return { enabled: true, provider, timeoutMs };
}

export function createLlamaCppLocalDiagnosisPolishProvider(config?: unknown): LocalDiagnosisPolishProvider | null {
  if (!isPlainObject(config) || config["enabled"] !== true) return null;
  return new LlamaCppLocalDiagnosisPolishProvider(config);
}

export function validateLlamaCppServerBaseUrl(baseUrl: string): URL {
  if (typeof baseUrl !== "string" || baseUrl.length === 0 || baseUrl.length > MAX_BASE_URL_CHARS || baseUrl.trim() !== baseUrl) {
    throw new LlamaCppLocalDiagnosisAdapterError("invalid-url");
  }

  if (!hasCanonicalLoopbackAuthority(baseUrl)) throw new LlamaCppLocalDiagnosisAdapterError("invalid-url");

  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new LlamaCppLocalDiagnosisAdapterError("invalid-url");
  }

  if (parsed.protocol !== "http:") throw new LlamaCppLocalDiagnosisAdapterError("invalid-url");
  if (parsed.username || parsed.password) throw new LlamaCppLocalDiagnosisAdapterError("invalid-url");
  if (!LOOPBACK_HOSTS.has(parsed.hostname)) throw new LlamaCppLocalDiagnosisAdapterError("invalid-url");
  if (parsed.pathname !== "/" || parsed.search || parsed.hash) throw new LlamaCppLocalDiagnosisAdapterError("invalid-url");

  return parsed;
}

export function llamaCppChatCompletionsEndpoint(baseUrl: string): string {
  const parsed = validateLlamaCppServerBaseUrl(baseUrl);
  return `${parsed.origin}/v1/chat/completions`;
}

class LlamaCppLocalDiagnosisPolishProvider implements LocalDiagnosisPolishProvider {
  constructor(private readonly rawConfig: Record<string, unknown>) {}

  async completeLocalDiagnosisPolish(request: LocalDiagnosisPolishRequest): Promise<string> {
    try {
      assertLocalDiagnosisRequest(request);
      const config = parseEnabledConfig(this.rawConfig);
      const response = await postChatCompletion(config, request);
      return extractChatCompletionContent(response);
    } catch (error) {
      if (error instanceof LlamaCppLocalDiagnosisAdapterError) throw error;
      throw new LlamaCppLocalDiagnosisAdapterError("transport-error");
    }
  }
}

async function postChatCompletion(config: ParsedLlamaCppConfig, request: LocalDiagnosisPolishRequest): Promise<string> {
  const body: Record<string, unknown> = {
    messages: [{ role: "user", content: request.prompt }],
    stream: false,
    max_tokens: config.maxOutputTokens,
    temperature: 0.1,
    top_p: 0.9,
    n: 1,
    response_format: { type: "json_object" },
  };
  if (config.model !== null) body["model"] = config.model;

  return postLoopbackJson(config.endpoint, JSON.stringify(body), request.signal);
}

function postLoopbackJson(endpoint: string, body: string, signal: AbortSignal): Promise<string> {
  const parsedEndpoint = validateLlamaCppChatCompletionsEndpoint(endpoint);

  return new Promise((resolve, reject) => {
    let settled = false;
    const fail = (error: LlamaCppLocalDiagnosisAdapterError) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    const clientRequest = httpRequest(
      parsedEndpoint,
      {
        method: "POST",
        agent: DIRECT_LOOPBACK_HTTP_AGENT,
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "content-length": Buffer.byteLength(body, "utf8"),
        },
        signal,
      },
      (response) => {
        if (settled) {
          response.resume();
          return;
        }

        const statusCode = response.statusCode ?? 0;
        if (statusCode < 200 || statusCode >= 300) {
          response.resume();
          fail(new LlamaCppLocalDiagnosisAdapterError("http-error"));
          return;
        }

        readLimitedResponseText(response, MAX_RESPONSE_BYTES).then(
          (responseText) => {
            if (settled) return;
            settled = true;
            resolve(responseText);
          },
          (error: unknown) => {
            if (settled) return;
            settled = true;
            reject(error instanceof LlamaCppLocalDiagnosisAdapterError ? error : new LlamaCppLocalDiagnosisAdapterError("transport-error"));
          },
        );
      },
    );

    clientRequest.on("error", () => fail(new LlamaCppLocalDiagnosisAdapterError("transport-error")));
    clientRequest.end(body);
  });
}

function validateLlamaCppChatCompletionsEndpoint(endpoint: string): URL {
  const parsed = new URL(endpoint);
  if (parsed.protocol !== "http:") throw new LlamaCppLocalDiagnosisAdapterError("invalid-url");
  if (parsed.username || parsed.password) throw new LlamaCppLocalDiagnosisAdapterError("invalid-url");
  if (!LOOPBACK_HOSTS.has(parsed.hostname)) throw new LlamaCppLocalDiagnosisAdapterError("invalid-url");
  if (parsed.pathname !== "/v1/chat/completions" || parsed.search || parsed.hash) throw new LlamaCppLocalDiagnosisAdapterError("invalid-url");
  return parsed;
}

function extractChatCompletionContent(responseText: string): string {
  const envelope = parseTransportJsonObject(responseText);
  const choices = envelope["choices"];
  if (!Array.isArray(choices) || choices.length === 0) throw new LlamaCppLocalDiagnosisAdapterError("invalid-transport");

  const firstChoice = choices[0];
  if (!isPlainObject(firstChoice)) throw new LlamaCppLocalDiagnosisAdapterError("invalid-transport");

  const message = firstChoice["message"];
  if (!isPlainObject(message)) throw new LlamaCppLocalDiagnosisAdapterError("invalid-transport");

  const content = message["content"];
  if (typeof content !== "string") throw new LlamaCppLocalDiagnosisAdapterError("invalid-transport");
  if (content.length > MAX_MODEL_CONTENT_CHARS) throw new LlamaCppLocalDiagnosisAdapterError("response-too-large");

  return content;
}

function readLimitedResponseText(response: IncomingMessage, maxBytes: number): Promise<string> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const chunks: Buffer[] = [];
    let totalBytes = 0;

    const fail = (error: LlamaCppLocalDiagnosisAdapterError) => {
      if (settled) return;
      settled = true;
      response.destroy();
      reject(error);
    };

    response.on("error", () => fail(new LlamaCppLocalDiagnosisAdapterError("transport-error")));

    const contentLength = response.headers["content-length"];
    const firstContentLength = Array.isArray(contentLength) ? contentLength[0] : contentLength;
    if (firstContentLength !== undefined) {
      const parsedLength = Number(firstContentLength);
      if (Number.isFinite(parsedLength) && parsedLength > maxBytes) {
        fail(new LlamaCppLocalDiagnosisAdapterError("response-too-large"));
        return;
      }
    }

    response.on("data", (chunk: Buffer | string) => {
      if (settled) return;
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      totalBytes += buffer.byteLength;
      if (totalBytes > maxBytes) {
        fail(new LlamaCppLocalDiagnosisAdapterError("response-too-large"));
        return;
      }
      chunks.push(buffer);
    });

    response.on("end", () => {
      if (settled) return;
      settled = true;
      resolve(Buffer.concat(chunks, totalBytes).toString("utf8"));
    });
  });
}

function parseTransportJsonObject(value: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new LlamaCppLocalDiagnosisAdapterError("invalid-transport");
  }
  if (!isPlainObject(parsed)) throw new LlamaCppLocalDiagnosisAdapterError("invalid-transport");
  return parsed;
}

function assertLocalDiagnosisRequest(request: LocalDiagnosisPolishRequest): void {
  if (typeof request.prompt !== "string" || request.prompt.length === 0 || request.prompt.length > MAX_PROMPT_CHARS) {
    throw new LlamaCppLocalDiagnosisAdapterError("invalid-config");
  }
  if (!isPlainObject(request.factPacket) || request.factPacket["version"] !== 1) {
    throw new LlamaCppLocalDiagnosisAdapterError("invalid-config");
  }
}

function hasCanonicalLoopbackAuthority(baseUrl: string): boolean {
  if (!baseUrl.startsWith("http://")) return false;
  const rest = baseUrl.slice("http://".length);
  const authorityEnd = rest.search(/[/?#]/);
  const authority = authorityEnd === -1 ? rest : rest.slice(0, authorityEnd);
  return /^127\.0\.0\.1(?::\d{1,5})?$/.test(authority) || /^\[::1\](?::\d{1,5})?$/.test(authority);
}

function parseEnabledConfig(config: Record<string, unknown>): ParsedLlamaCppConfig {
  for (const key of Object.keys(config)) {
    if (!ALLOWED_CONFIG_KEYS.has(key)) throw new LlamaCppLocalDiagnosisAdapterError("invalid-config");
  }

  if (config["enabled"] !== true || config["kind"] !== "llama-cpp-server") {
    throw new LlamaCppLocalDiagnosisAdapterError("invalid-config");
  }

  const baseUrl = config["baseUrl"];
  if (typeof baseUrl !== "string") throw new LlamaCppLocalDiagnosisAdapterError("invalid-config");

  return {
    endpoint: llamaCppChatCompletionsEndpoint(baseUrl),
    model: normalizeModelLabel(config["model"]),
    maxOutputTokens: normalizeMaxOutputTokens(config["maxOutputTokens"]),
  };
}

function normalizeModelLabel(value: unknown): string | null {
  if (value === undefined) return null;
  if (typeof value !== "string") throw new LlamaCppLocalDiagnosisAdapterError("invalid-config");
  const normalized = value.trim();
  if (normalized.length === 0 || normalized.length > MAX_MODEL_LABEL_CHARS) throw new LlamaCppLocalDiagnosisAdapterError("invalid-config");
  if (!/^[A-Za-z0-9._-]+$/.test(normalized)) throw new LlamaCppLocalDiagnosisAdapterError("invalid-config");
  return normalized;
}

function normalizeMaxOutputTokens(value: unknown): number {
  if (value === undefined) return DEFAULT_MAX_OUTPUT_TOKENS;
  if (typeof value !== "number" || !Number.isFinite(value)) throw new LlamaCppLocalDiagnosisAdapterError("invalid-config");
  return Math.max(MIN_MAX_OUTPUT_TOKENS, Math.min(MAX_MAX_OUTPUT_TOKENS, Math.floor(value)));
}

function configuredTimeoutMs(config: unknown): number | undefined {
  if (!isPlainObject(config)) return undefined;
  const value = config["timeoutMs"];
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return Math.max(1, Math.min(5_000, Math.floor(value)));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function llamaCppAdapterErrorMessage(code: LlamaCppLocalDiagnosisAdapterErrorCode): string {
  switch (code) {
    case "invalid-config":
      return "llama.cpp local diagnosis adapter rejected the explicit runtime configuration";
    case "invalid-url":
      return "llama.cpp local diagnosis adapter rejected the runtime URL";
    case "http-error":
      return "llama.cpp local diagnosis adapter received an unsuccessful local HTTP response";
    case "invalid-transport":
      return "llama.cpp local diagnosis adapter received an invalid transport response";
    case "response-too-large":
      return "llama.cpp local diagnosis adapter received an oversized response";
    case "transport-error":
      return "llama.cpp local diagnosis adapter could not reach the configured local runtime";
  }
}
