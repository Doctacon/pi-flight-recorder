import { spawn } from "node:child_process";
import { createServer, type IncomingHttpHeaders, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo, Socket } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { afterEach, describe, expect, it } from "vitest";
import { buildFlightLearnDiagnosisViewWithLocalPolish } from "./flight-learn-local-diagnosis-model.js";
import {
  createLlamaCppLocalDiagnosisPolishOptions,
  createLlamaCppLocalDiagnosisPolishProvider,
  llamaCppChatCompletionsEndpoint,
  validateLlamaCppServerBaseUrl,
  type LlamaCppLocalDiagnosisPolishConfig,
} from "./flight-learn-llama-cpp-adapter.js";
import type { DeltaDetectorSignal, DeltaEvidenceRef, ExpectationDelta } from "./types.js";

interface CapturedHttpRequest {
  method: string | undefined;
  url: string | undefined;
  headers: IncomingHttpHeaders;
  body: string;
}

interface TestHttpServer {
  baseUrl: string;
  requests: CapturedHttpRequest[];
  close: () => Promise<void>;
}

const openServers: TestHttpServer[] = [];

function evidence(overrides: Partial<DeltaEvidenceRef> = {}): DeltaEvidenceRef {
  return {
    sourceType: "occurrence",
    sourceId: "occ-llama-1",
    sourceFile: null,
    sessionFile: "/Users/alice/.pi/agent/sessions/private/session.jsonl",
    cwd: "/Users/alice/private/project",
    entryId: "entry-1",
    timestamp: "2026-05-27T01:00:00.000Z",
    snippet: "bash cd /Users/alice/private/project && npm test failed from a stale pane",
    note: null,
    ...overrides,
  };
}

function delta(overrides: Partial<ExpectationDelta> = {}): ExpectationDelta {
  return {
    id: "delta-llama-adapter-test",
    status: "candidate",
    source: "detector",
    summary: "Repeated failure pattern: bash cd /Users/alice/private/project && npm test",
    expectation: "Run validation from a fresh project shell after reinstalling the package.",
    reality: "The validation command was rerun from an old shell after the package changed.",
    impact: "That can make the pass or fail result untrustworthy.",
    severity: "medium",
    cwd: "/Users/alice/private/project",
    sourceSessionFile: "/Users/alice/.pi/agent/sessions/private/session.jsonl",
    sourceEntryId: "entry-1",
    evidenceRefs: [evidence()],
    activeArtifactCandidateId: null,
    statusReason: null,
    metadata: { count: 2 },
    createdAt: "2026-05-27T01:00:00.000Z",
    updatedAt: "2026-05-27T01:00:00.000Z",
    acceptedAt: null,
    routedAt: null,
    dismissedAt: null,
    resolvedAt: null,
    recurringAt: null,
    ...overrides,
  };
}

function signal(overrides: Partial<DeltaDetectorSignal> = {}): DeltaDetectorSignal {
  return {
    id: "sig-llama-adapter-test",
    deltaId: "delta-llama-adapter-test",
    type: "reflection-cluster",
    explanation: "Reflection cluster saw 2 related validation failures from the same stale shell pattern.",
    confidence: 0.74,
    evidenceRefs: [],
    metadata: {},
    createdAt: "2026-05-27T01:00:00.000Z",
    ...overrides,
  };
}

function input() {
  return { delta: delta(), signals: [signal()] };
}

function polishedEnvelope(content = validPolishJson()): Record<string, unknown> {
  return {
    id: "chatcmpl-local-fixture",
    object: "chat.completion",
    choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
  };
}

function validPolishJson(): string {
  return JSON.stringify({
    headline: "Validation was rerun from an old shell after the package changed.",
    whatHappened: "The same local validation check failed after a stale shell reran it.",
    whyItMatters: "That makes the validation result hard to trust.",
    expectedBehavior: "Run validation from a fresh project shell.",
  });
}

function writeJson(response: ServerResponse, value: unknown, init: { status?: number; headers?: Record<string, string> } = {}): void {
  const body = JSON.stringify(value);
  response.writeHead(init.status ?? 200, {
    "content-type": "application/json",
    "content-length": Buffer.byteLength(body, "utf8").toString(),
    ...init.headers,
  });
  response.end(body);
}

async function readRequestBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function startLoopbackHttpServer(
  handler: (request: CapturedHttpRequest, response: ServerResponse) => void | Promise<void>,
  host = "127.0.0.1",
): Promise<TestHttpServer> {
  const requests: CapturedHttpRequest[] = [];
  const sockets = new Set<Socket>();
  const server = createServer(async (request, response) => {
    try {
      const body = await readRequestBody(request);
      const captured = { method: request.method, url: request.url, headers: request.headers, body };
      requests.push(captured);
      await handler(captured, response);
    } catch {
      if (!response.headersSent) response.writeHead(500, { "content-type": "text/plain" });
      response.end("test server failure");
    }
  });

  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
  });

  await listen(server, host);

  let closed = false;
  const close = async () => {
    if (closed) return;
    closed = true;
    for (const socket of sockets) socket.destroy();
    await closeServer(server);
  };

  const address = server.address();
  if (!address || typeof address === "string") throw new Error("expected test HTTP server to listen on a TCP port");

  const baseHost = host === "::1" ? "[::1]" : host;
  const testServer = { baseUrl: `http://${baseHost}:${address.port}`, requests, close };
  openServers.push(testServer);
  return testServer;
}

function listen(server: Server, host: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const onError = (error: Error) => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.off("error", onError);
      resolve();
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(0, host);
  });
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

async function unusedLoopbackBaseUrl(): Promise<string> {
  const server = createServer();
  await listen(server, "127.0.0.1");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("expected temporary HTTP server to listen on a TCP port");
  await closeServer(server);
  return `http://127.0.0.1:${(address as AddressInfo).port}`;
}

async function waitFor(predicate: () => boolean, timeoutMs = 250): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await delay(5);
  }
  expect(predicate()).toBe(true);
}

const PROXY_ENV_KEYS = ["HTTP_PROXY", "http_proxy", "HTTPS_PROXY", "https_proxy", "ALL_PROXY", "all_proxy", "NO_PROXY", "no_proxy"] as const;

type ProxyEnvKey = (typeof PROXY_ENV_KEYS)[number];

function snapshotProxyEnv(): Partial<Record<ProxyEnvKey, string>> {
  const snapshot: Partial<Record<ProxyEnvKey, string>> = {};
  for (const key of PROXY_ENV_KEYS) {
    const value = process.env[key];
    if (value !== undefined) snapshot[key] = value;
  }
  return snapshot;
}

function restoreProxyEnv(snapshot: Partial<Record<ProxyEnvKey, string>>): void {
  for (const key of PROXY_ENV_KEYS) {
    const value = snapshot[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

async function runAdapterChildProcessWithStartupProxyEnv(baseUrl: string, proxyBaseUrl: string): Promise<{ exitCode: number | null; stdout: string; stderr: string }> {
  const childCode = `
    import { createLlamaCppLocalDiagnosisPolishProvider } from "./src/flight-learn-llama-cpp-adapter.ts";

    const provider = createLlamaCppLocalDiagnosisPolishProvider({
      enabled: true,
      kind: "llama-cpp-server",
      baseUrl: ${JSON.stringify(baseUrl)},
      timeoutMs: 500,
    });
    if (!provider) throw new Error("expected provider");

    const response = await provider.completeLocalDiagnosisPolish({
      prompt: "Return JSON.",
      factPacket: { version: 1 },
      signal: new AbortController().signal,
    });
    console.log(JSON.stringify({ response }));
  `;

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["--import", "tsx", "--input-type=module", "--eval", childCode], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_OPTIONS: "--use-env-proxy",
        HTTP_PROXY: proxyBaseUrl,
        http_proxy: proxyBaseUrl,
        HTTPS_PROXY: proxyBaseUrl,
        https_proxy: proxyBaseUrl,
        ALL_PROXY: proxyBaseUrl,
        all_proxy: proxyBaseUrl,
        NO_PROXY: "",
        no_proxy: "",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error("child process timed out"));
    }, 5_000);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("close", (exitCode) => {
      clearTimeout(timeout);
      resolve({ exitCode, stdout, stderr });
    });
  });
}

afterEach(async () => {
  const servers = openServers.splice(0);
  await Promise.all(servers.map((server) => server.close()));
});

describe("llama.cpp local diagnosis polish adapter", () => {
  it("is disabled by default and makes no runtime request without explicit config", async () => {
    const result = await buildFlightLearnDiagnosisViewWithLocalPolish(input(), createLlamaCppLocalDiagnosisPolishOptions());

    expect(result.usedLocalModel).toBe(false);
    expect(result.fallbackReason).toBe("disabled");
    expect(result.view).toEqual(result.deterministicView);
    expect(createLlamaCppLocalDiagnosisPolishProvider({ enabled: false })).toBeNull();
  });

  it("calls only the configured IPv4 loopback chat completions endpoint with conservative JSON parameters", async () => {
    const server = await startLoopbackHttpServer((_request, response) => writeJson(response, polishedEnvelope()));

    const result = await buildFlightLearnDiagnosisViewWithLocalPolish(
      input(),
      createLlamaCppLocalDiagnosisPolishOptions({
        enabled: true,
        kind: "llama-cpp-server",
        baseUrl: server.baseUrl,
        model: "bonsai-1.7b-q1_0",
        timeoutMs: 100,
        maxOutputTokens: 96,
      } satisfies LlamaCppLocalDiagnosisPolishConfig),
    );

    expect(result.usedLocalModel).toBe(true);
    expect(result.fallbackReason).toBeNull();
    expect(result.view.headline).toBe("Validation was rerun from an old shell after the package changed.");
    expect(server.requests).toHaveLength(1);

    const [call] = server.requests;
    expect(call).toBeDefined();
    if (!call) throw new Error("expected HTTP request");
    expect(call.method).toBe("POST");
    expect(call.url).toBe("/v1/chat/completions");
    expect(call.headers["accept"]).toBe("application/json");
    expect(call.headers["content-type"]).toBe("application/json");

    const body = JSON.parse(call.body) as Record<string, unknown>;
    expect(body["stream"]).toBe(false);
    expect(body["max_tokens"]).toBe(96);
    expect(body["temperature"]).toBe(0.1);
    expect(body["top_p"]).toBe(0.9);
    expect(body["n"]).toBe(1);
    expect(body["model"]).toBe("bonsai-1.7b-q1_0");
    expect(body["response_format"]).toEqual({ type: "json_object" });
    expect(body).not.toHaveProperty("headers");
    expect(body).not.toHaveProperty("apiKey");
    expect(body).not.toHaveProperty("authorization");

    const messages = body["messages"];
    expect(Array.isArray(messages)).toBe(true);
    if (!Array.isArray(messages)) throw new Error("expected messages array");
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({ role: "user" });
    const content = (messages[0] as { content?: unknown }).content;
    expect(typeof content).toBe("string");
    expect(content).toContain("Fact packet JSON");
    expect(content).toContain("Return only a JSON object");
    expect(content).toContain("/Users/<user>");
    expect(content).not.toContain("/Users/alice");
    expect(content).not.toContain("API_KEY");
  });

  it("bypasses proxy-like environment variables and posts directly to the configured loopback server", async () => {
    const target = await startLoopbackHttpServer((_request, response) => writeJson(response, polishedEnvelope()));
    const proxy = await startLoopbackHttpServer((_request, response) => {
      response.writeHead(502, { "content-type": "text/plain" });
      response.end("proxy should not be used by the adapter");
    });
    const previousProxyEnv = snapshotProxyEnv();

    try {
      process.env.HTTP_PROXY = proxy.baseUrl;
      process.env.http_proxy = proxy.baseUrl;
      process.env.HTTPS_PROXY = proxy.baseUrl;
      process.env.https_proxy = proxy.baseUrl;
      process.env.ALL_PROXY = proxy.baseUrl;
      process.env.all_proxy = proxy.baseUrl;
      process.env.NO_PROXY = "";
      process.env.no_proxy = "";

      const result = await buildFlightLearnDiagnosisViewWithLocalPolish(
        input(),
        createLlamaCppLocalDiagnosisPolishOptions({
          enabled: true,
          kind: "llama-cpp-server",
          baseUrl: target.baseUrl,
          timeoutMs: 100,
        } satisfies LlamaCppLocalDiagnosisPolishConfig),
      );

      expect(result.usedLocalModel).toBe(true);
      expect(result.fallbackReason).toBeNull();
      expect(target.requests).toHaveLength(1);
      expect(proxy.requests).toHaveLength(0);
    } finally {
      restoreProxyEnv(previousProxyEnv);
    }
  });

  it("bypasses proxy variables present at process startup under Node env-proxy mode", async () => {
    const target = await startLoopbackHttpServer((_request, response) => writeJson(response, polishedEnvelope("{}")));
    const proxy = await startLoopbackHttpServer((_request, response) => {
      response.writeHead(502, { "content-type": "text/plain" });
      response.end("startup proxy should not be used by the adapter");
    });

    const child = await runAdapterChildProcessWithStartupProxyEnv(target.baseUrl, proxy.baseUrl);

    expect(child.exitCode, child.stderr).toBe(0);
    expect(child.stdout).toContain('"response":"{}"');
    expect(target.requests).toHaveLength(1);
    expect(target.requests[0]?.url).toBe("/v1/chat/completions");
    expect(proxy.requests).toHaveLength(0);
  });

  it("also accepts the IPv6 loopback literal", async () => {
    let server: TestHttpServer;
    try {
      server = await startLoopbackHttpServer((_request, response) => writeJson(response, polishedEnvelope()), "::1");
    } catch {
      expect(validateLlamaCppServerBaseUrl("http://[::1]:8080").origin).toBe("http://[::1]:8080");
      return;
    }

    const result = await buildFlightLearnDiagnosisViewWithLocalPolish(
      input(),
      createLlamaCppLocalDiagnosisPolishOptions({
        enabled: true,
        kind: "llama-cpp-server",
        baseUrl: server.baseUrl,
        timeoutMs: 100,
      } satisfies LlamaCppLocalDiagnosisPolishConfig),
    );

    expect(result.usedLocalModel).toBe(true);
    expect(server.requests).toHaveLength(1);
    expect(server.requests[0]?.url).toBe("/v1/chat/completions");
  });

  it("rejects non-literal-loopback, credentialed, non-http, hosted, and path/query URLs before any request", async () => {
    const target = await startLoopbackHttpServer((_request, response) => writeJson(response, polishedEnvelope()));
    const targetPort = new URL(target.baseUrl).port;
    const portSuffix = `:${targetPort}`;

    for (const baseUrl of [
      `http://localhost${portSuffix}`,
      `http://0.0.0.0${portSuffix}`,
      `http://192.168.1.20${portSuffix}`,
      `http://10.0.0.5${portSuffix}`,
      `http://172.16.0.2${portSuffix}`,
      `http://8.8.8.8${portSuffix}`,
      `http://example.com${portSuffix}`,
      `http://127.0.0.1.evil.example${portSuffix}`,
      `https://127.0.0.1${portSuffix}`,
      `http://user:pass@127.0.0.1${portSuffix}`,
      `http://[::ffff:127.0.0.1]${portSuffix}`,
      `http://[0:0:0:0:0:0:0:1]${portSuffix}`,
      `http://127.000.000.001${portSuffix}`,
      `http://2130706433${portSuffix}`,
      `http://0x7f000001${portSuffix}`,
      `http://0177.0.0.1${portSuffix}`,
      `${target.baseUrl}/v1`,
      `${target.baseUrl}?provider=openai`,
      "https://api.openai.com/v1",
    ]) {
      const result = await buildFlightLearnDiagnosisViewWithLocalPolish(
        input(),
        createLlamaCppLocalDiagnosisPolishOptions({
          enabled: true,
          kind: "llama-cpp-server",
          baseUrl,
          timeoutMs: 100,
        }),
      );
      expect(result.usedLocalModel, baseUrl).toBe(false);
      expect(result.fallbackReason, baseUrl).toBe("provider-error");
      expect(result.view.headline, baseUrl).toBe(result.deterministicView.headline);
    }

    expect(target.requests).toHaveLength(0);
  });

  it("rejects provider-header, API-key, proxy, hosted-provider, and model-path config shapes before any request", async () => {
    const target = await startLoopbackHttpServer((_request, response) => writeJson(response, polishedEnvelope()));

    const unsafeConfigs: unknown[] = [
      { enabled: true, kind: "openai", baseUrl: target.baseUrl },
      { enabled: true, kind: "llama-cpp-server", baseUrl: target.baseUrl, headers: { authorization: "Bearer redacted" } },
      { enabled: true, kind: "llama-cpp-server", baseUrl: target.baseUrl, apiKey: "redacted" },
      { enabled: true, kind: "llama-cpp-server", baseUrl: target.baseUrl, proxy: "http://127.0.0.1:9999" },
      { enabled: true, kind: "llama-cpp-server", baseUrl: target.baseUrl, providerUrl: "https://api.openai.com/v1" },
      { enabled: true, kind: "llama-cpp-server", baseUrl: target.baseUrl, model: "/Users/alice/models/bonsai.gguf" },
      { enabled: true, kind: "llama-cpp-server", baseUrl: target.baseUrl, model: "prism-ml/Bonsai-1.7B-gguf" },
    ];

    for (const config of unsafeConfigs) {
      const result = await buildFlightLearnDiagnosisViewWithLocalPolish(
        input(),
        createLlamaCppLocalDiagnosisPolishOptions(config),
      );
      expect(result.usedLocalModel).toBe(false);
      expect(result.fallbackReason).toBe("provider-error");
      expect(result.validationIssue).toBe("provider failed before returning JSON");
    }

    expect(target.requests).toHaveLength(0);
  });

  it("uses the supplied AbortSignal so harness timeouts abort the local request", async () => {
    let responseClosed = false;
    const server = await startLoopbackHttpServer((_request, response) => {
      response.on("close", () => {
        responseClosed = true;
      });
    });

    const result = await buildFlightLearnDiagnosisViewWithLocalPolish(
      input(),
      createLlamaCppLocalDiagnosisPolishOptions({
        enabled: true,
        kind: "llama-cpp-server",
        baseUrl: server.baseUrl,
        timeoutMs: 75,
      } satisfies LlamaCppLocalDiagnosisPolishConfig),
    );

    expect(server.requests).toHaveLength(1);
    expect(result.usedLocalModel).toBe(false);
    expect(result.fallbackReason).toBe("timeout");
    expect(result.validationIssue).not.toContain("raw abort detail");
    expect(result.view.headline).toBe(result.deterministicView.headline);
    await waitFor(() => responseClosed);
  });

  it("falls back cleanly on missing runtime, HTTP errors, invalid transport shape, and oversized responses", async () => {
    const missingRuntimeResult = await buildFlightLearnDiagnosisViewWithLocalPolish(
      input(),
      createLlamaCppLocalDiagnosisPolishOptions({
        enabled: true,
        kind: "llama-cpp-server",
        baseUrl: await unusedLoopbackBaseUrl(),
        timeoutMs: 100,
      } satisfies LlamaCppLocalDiagnosisPolishConfig),
    );

    expect(missingRuntimeResult.usedLocalModel).toBe(false);
    expect(missingRuntimeResult.fallbackReason).toBe("provider-error");
    expect(missingRuntimeResult.validationIssue).toBe("provider failed before returning JSON");

    const failingServers: Array<{ name: string; server: TestHttpServer }> = [
      {
        name: "HTTP error",
        server: await startLoopbackHttpServer((_request, response) => writeJson(response, { error: { message: "raw server detail" } }, { status: 500 })),
      },
      {
        name: "invalid transport",
        server: await startLoopbackHttpServer((_request, response) => writeJson(response, { choices: [{ message: { content: ["not a string"] } }] })),
      },
      {
        name: "oversized content-length",
        server: await startLoopbackHttpServer((_request, response) => {
          response.writeHead(200, { "content-type": "application/json", "content-length": "20000" });
          response.end("{}");
        }),
      },
      {
        name: "oversized body",
        server: await startLoopbackHttpServer((_request, response) => {
          response.writeHead(200, { "content-type": "application/json" });
          response.end("x".repeat(20_000));
        }),
      },
    ];

    for (const failingCase of failingServers) {
      const result = await buildFlightLearnDiagnosisViewWithLocalPolish(
        input(),
        createLlamaCppLocalDiagnosisPolishOptions({
          enabled: true,
          kind: "llama-cpp-server",
          baseUrl: failingCase.server.baseUrl,
          timeoutMs: 100,
        } satisfies LlamaCppLocalDiagnosisPolishConfig),
      );

      expect(failingCase.server.requests, failingCase.name).toHaveLength(1);
      expect(result.usedLocalModel, failingCase.name).toBe(false);
      expect(result.fallbackReason, failingCase.name).toBe("provider-error");
      expect(result.validationIssue, failingCase.name).toBe("provider failed before returning JSON");
      expect(result.validationIssue, failingCase.name).not.toContain("/Users/alice");
      expect(result.validationIssue, failingCase.name).not.toContain("raw server detail");
    }
  });

  it("returns malformed model content to the contract harness for deterministic malformed-json fallback", async () => {
    const server = await startLoopbackHttpServer((_request, response) => writeJson(response, polishedEnvelope("not json")));

    const result = await buildFlightLearnDiagnosisViewWithLocalPolish(
      input(),
      createLlamaCppLocalDiagnosisPolishOptions({
        enabled: true,
        kind: "llama-cpp-server",
        baseUrl: server.baseUrl,
        timeoutMs: 100,
      } satisfies LlamaCppLocalDiagnosisPolishConfig),
    );

    expect(server.requests).toHaveLength(1);
    expect(result.usedLocalModel).toBe(false);
    expect(result.fallbackReason).toBe("malformed-json");
    expect(result.view.headline).toBe(result.deterministicView.headline);
  });

  it("exposes literal loopback URL validation helpers without allowing generic provider URLs", () => {
    expect(validateLlamaCppServerBaseUrl("http://127.0.0.1:8080").origin).toBe("http://127.0.0.1:8080");
    expect(validateLlamaCppServerBaseUrl("http://[::1]:8080").origin).toBe("http://[::1]:8080");
    expect(llamaCppChatCompletionsEndpoint("http://127.0.0.1:8080/")).toBe("http://127.0.0.1:8080/v1/chat/completions");
    expect(() => validateLlamaCppServerBaseUrl("http://localhost:8080")).toThrow("runtime URL");
    expect(() => validateLlamaCppServerBaseUrl("https://api.openai.com/v1")).toThrow("runtime URL");
  });
});
