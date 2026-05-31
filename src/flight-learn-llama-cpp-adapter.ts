import { Agent, request as httpRequest, type IncomingMessage } from "node:http";

import type {
  LocalDiagnosisPolishOptions,
  LocalDiagnosisPolishProvider,
  LocalDiagnosisPolishRequest,
  LocalNarrativeJudgeProvider,
  LocalNarrativeJudgeRequest,
} from "./flight-learn-local-diagnosis-model.js";

type LlamaCppEnabledServerConfig = {
  enabled: true;
  kind: "llama-cpp-server";
  baseUrl: string;
  model?: string;
  timeoutMs?: number;
  maxOutputTokens?: number;
};

export type LlamaCppLocalNarrativeJudgeConfig = { enabled?: false } | LlamaCppEnabledServerConfig;

export type LlamaCppLocalDiagnosisPolishConfig =
  | { enabled?: false }
  | (LlamaCppEnabledServerConfig & { judge?: LlamaCppLocalNarrativeJudgeConfig });

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
const MAX_MAX_OUTPUT_TOKENS = 512;
const MAX_RESPONSE_BYTES = 16 * 1024;
const MAX_MODEL_CONTENT_CHARS = 4 * 1024;
const MAX_PROMPT_CHARS = 16 * 1024;
const MAX_BASE_URL_CHARS = 512;
const MAX_MODEL_LABEL_CHARS = 80;

const ALLOWED_SERVER_CONFIG_KEYS = new Set(["enabled", "kind", "baseUrl", "model", "timeoutMs", "maxOutputTokens"]);
const ALLOWED_POLISH_CONFIG_KEYS = new Set([...ALLOWED_SERVER_CONFIG_KEYS, "judge"]);
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "[::1]"]);
const DIRECT_LOOPBACK_HTTP_AGENT = new Agent({ keepAlive: false, proxyEnv: {} });

interface ParsedLlamaCppConfig {
  endpoint: string;
  model: string | null;
  maxOutputTokens: number;
}

type JsonSchema = Record<string, unknown>;

type LlamaCppJsonSchemaResponseFormat = {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: true;
    schema: JsonSchema;
  };
};

const LOCAL_DIAGNOSIS_POLISH_RESPONSE_SCHEMA: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["schemaVersion", "whatHappened"],
  properties: {
    schemaVersion: { type: "integer", enum: [2] },
    headline: { type: "string", minLength: 1, maxLength: 120 },
    whatHappened: {
      type: "object",
      additionalProperties: false,
      required: ["sentences"],
      properties: {
        sentences: {
          type: "array",
          minItems: 1,
          maxItems: 4,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["text", "factIds"],
            properties: {
              text: { type: "string", minLength: 1, maxLength: 220 },
              factIds: {
                type: "array",
                minItems: 1,
                maxItems: 8,
                items: { type: "string", pattern: "^F[0-9]+$" },
              },
            },
          },
        },
      },
    },
    whyItMatters: { type: "string", minLength: 1, maxLength: 300 },
    expectedBehavior: { type: ["string", "null"], maxLength: 320 },
  },
};

const LOCAL_NARRATIVE_JUDGE_RESPONSE_SCHEMA: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["schemaVersion", "overallVerdict", "sentences"],
  properties: {
    schemaVersion: { type: "integer", enum: [1] },
    overallVerdict: { type: "string", enum: ["accept", "reject", "uncertain"] },
    failClosedReason: {
      type: "string",
      enum: ["unsupported-facts", "unsafe-output", "action-advice", "low-information", "not-useful", "schema-invalid", "judge-uncertain"],
    },
    sentences: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["index", "verdict", "supportedFactIds", "unsupportedClaims", "reason", "confidence"],
        properties: {
          index: { type: "integer", minimum: 0 },
          verdict: {
            type: "string",
            enum: ["supported", "supported-cautious-connection", "partially-supported", "unsupported", "unsafe", "action-advice", "not-useful", "uncertain"],
          },
          supportedFactIds: {
            type: "array",
            items: { type: "string", pattern: "^F[0-9]+$" },
          },
          unsupportedClaims: {
            type: "array",
            items: { type: "string", maxLength: 180 },
          },
          reason: { type: "string", minLength: 1, maxLength: 240 },
          confidence: { type: "string", enum: ["low", "medium", "high"] },
        },
      },
    },
  },
};

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

  const options: LocalDiagnosisPolishOptions = { enabled: true, provider };
  const timeoutMs = configuredTimeoutMs(config);
  if (timeoutMs !== undefined) options.timeoutMs = timeoutMs;

  const judgeConfig = isPlainObject(config) ? config["judge"] : undefined;
  const judgeProvider = createLlamaCppLocalNarrativeJudgeProvider(judgeConfig);
  if (judgeProvider) {
    options.judgeProvider = judgeProvider;
    const judgeTimeoutMs = configuredTimeoutMs(judgeConfig);
    if (judgeTimeoutMs !== undefined) options.judgeTimeoutMs = judgeTimeoutMs;
  }

  return options;
}

export function createLlamaCppLocalDiagnosisPolishProvider(config?: unknown): LocalDiagnosisPolishProvider | null {
  if (!isPlainObject(config) || config["enabled"] !== true) return null;
  return new LlamaCppLocalDiagnosisPolishProvider(config);
}

export function createLlamaCppLocalNarrativeJudgeProvider(config?: unknown): LocalNarrativeJudgeProvider | null {
  if (!isPlainObject(config) || config["enabled"] !== true) return null;
  return new LlamaCppLocalNarrativeJudgeProvider(config);
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
      const config = parseEnabledConfig(this.rawConfig, ALLOWED_POLISH_CONFIG_KEYS);
      const response = await postChatCompletion(config, request, localDiagnosisPolishResponseFormat());
      return extractChatCompletionContent(response);
    } catch (error) {
      if (error instanceof LlamaCppLocalDiagnosisAdapterError) throw error;
      throw new LlamaCppLocalDiagnosisAdapterError("transport-error");
    }
  }
}

class LlamaCppLocalNarrativeJudgeProvider implements LocalNarrativeJudgeProvider {
  constructor(private readonly rawConfig: Record<string, unknown>) {}

  async completeLocalNarrativeJudge(request: LocalNarrativeJudgeRequest): Promise<string> {
    try {
      assertLocalNarrativeJudgeRequest(request);
      const config = parseEnabledConfig(this.rawConfig, ALLOWED_SERVER_CONFIG_KEYS);
      const response = await postChatCompletion(config, request, localNarrativeJudgeResponseFormat());
      return extractChatCompletionContent(response);
    } catch (error) {
      if (error instanceof LlamaCppLocalDiagnosisAdapterError) throw error;
      throw new LlamaCppLocalDiagnosisAdapterError("transport-error");
    }
  }
}

async function postChatCompletion(config: ParsedLlamaCppConfig, request: { prompt: string; signal: AbortSignal }, responseFormat: LlamaCppJsonSchemaResponseFormat): Promise<string> {
  const body: Record<string, unknown> = {
    messages: [{ role: "user", content: request.prompt }],
    stream: false,
    max_tokens: config.maxOutputTokens,
    temperature: 0.1,
    top_p: 0.9,
    n: 1,
    response_format: responseFormat,
  };
  if (config.model !== null) body["model"] = config.model;

  return postLoopbackJson(config.endpoint, JSON.stringify(body), request.signal);
}

function localDiagnosisPolishResponseFormat(): LlamaCppJsonSchemaResponseFormat {
  return jsonSchemaResponseFormat("flight_learn_diagnosis_polish_v2", LOCAL_DIAGNOSIS_POLISH_RESPONSE_SCHEMA);
}

function localNarrativeJudgeResponseFormat(): LlamaCppJsonSchemaResponseFormat {
  return jsonSchemaResponseFormat("flight_learn_narrative_judge_v1", LOCAL_NARRATIVE_JUDGE_RESPONSE_SCHEMA);
}

function jsonSchemaResponseFormat(name: string, schema: JsonSchema): LlamaCppJsonSchemaResponseFormat {
  return {
    type: "json_schema",
    json_schema: {
      name,
      strict: true,
      schema,
    },
  };
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
  assertPromptRequest(request);
  if (!isPlainObject(request.factPacket) || request.factPacket["version"] !== 2) {
    throw new LlamaCppLocalDiagnosisAdapterError("invalid-config");
  }
}

function assertLocalNarrativeJudgeRequest(request: LocalNarrativeJudgeRequest): void {
  assertPromptRequest(request);
  if (request.schemaVersion !== 1 || !isPlainObject(request.policy) || request.policy["displayOnly"] !== true) {
    throw new LlamaCppLocalDiagnosisAdapterError("invalid-config");
  }
  if (!isPlainObject(request.candidate) || request.candidate["field"] !== "whatHappened" || !Array.isArray(request.candidate["sentences"])) {
    throw new LlamaCppLocalDiagnosisAdapterError("invalid-config");
  }
  if (!Array.isArray(request.facts)) throw new LlamaCppLocalDiagnosisAdapterError("invalid-config");
}

function assertPromptRequest(request: { prompt: string; signal: AbortSignal }): void {
  if (typeof request.prompt !== "string" || request.prompt.length === 0 || request.prompt.length > MAX_PROMPT_CHARS) {
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

function parseEnabledConfig(config: Record<string, unknown>, allowedKeys: Set<string>): ParsedLlamaCppConfig {
  for (const key of Object.keys(config)) {
    if (!allowedKeys.has(key)) throw new LlamaCppLocalDiagnosisAdapterError("invalid-config");
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
