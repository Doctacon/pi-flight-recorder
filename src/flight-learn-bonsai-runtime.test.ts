import { chmod, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { startBonsaiLocalDiagnosisRuntime } from "./flight-learn-bonsai-runtime.js";
import { buildFlightLearnDiagnosisViewWithLocalPolish } from "./flight-learn-local-diagnosis-model.js";
import type { DeltaDetectorSignal, DeltaEvidenceRef, ExpectationDelta } from "./types.js";

interface FakeLlamaServer {
  binPath: string;
  logPath: string;
}

interface FakeLlamaEvent {
  event: string;
  argv?: string[];
  envKeys?: string[];
  hasProviderSecretEnv?: boolean;
  hasProxyEnv?: boolean;
  host?: string;
  port?: number;
  url?: string;
  body?: string;
}

function evidence(overrides: Partial<DeltaEvidenceRef> = {}): DeltaEvidenceRef {
  return {
    sourceType: "manual",
    sourceId: null,
    sourceFile: null,
    sessionFile: "/Users/alice/.pi/agent/sessions/private/session.jsonl",
    cwd: "/Users/alice/private/project",
    entryId: null,
    timestamp: "2026-06-02T01:00:00.000Z",
    snippet: "npm test failed twice from an old shell",
    note: "manual validation note",
    ...overrides,
  };
}

function delta(overrides: Partial<ExpectationDelta> = {}): ExpectationDelta {
  return {
    id: "delta-bonsai-runtime-test",
    status: "candidate",
    source: "detector",
    summary: "Repeated failure pattern: bash cd /Users/alice/private/project && npm test",
    expectation: "Run validation from a fresh project shell.",
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
    createdAt: "2026-06-02T01:00:00.000Z",
    updatedAt: "2026-06-02T01:00:00.000Z",
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
    id: "sig-bonsai-runtime-test",
    deltaId: "delta-bonsai-runtime-test",
    type: "failed-validation",
    explanation: "Validation failed twice from the same stale shell pattern.",
    confidence: 0.74,
    evidenceRefs: [],
    metadata: {},
    createdAt: "2026-06-02T01:00:00.000Z",
    ...overrides,
  };
}

function input() {
  return { delta: delta(), signals: [signal()] };
}

async function writeFakeLlamaServer(dir: string, content: string): Promise<FakeLlamaServer> {
  const binPath = path.join(dir, "fake-llama-server.mjs");
  const logPath = path.join(dir, "fake-llama-server.ndjson");
  await writeFile(binPath, `#!/usr/bin/env node
import { appendFileSync } from "node:fs";
import { createServer } from "node:http";
const logPath = ${JSON.stringify(logPath)};
function log(event) { appendFileSync(logPath, JSON.stringify(event) + "\\n"); }
const argv = process.argv.slice(2);
const port = Number(argv[argv.indexOf("--port") + 1]);
const host = argv[argv.indexOf("--host") + 1];
const envKeys = Object.keys(process.env).sort();
log({ event: "start", argv, envKeys, hasProviderSecretEnv: envKeys.some((key) => /(?:TOKEN|SECRET|PASSWORD|API_KEY|PRIVATE_KEY)/i.test(key)), hasProxyEnv: envKeys.some((key) => /proxy/i.test(key)) });
const server = createServer((request, response) => {
  if (request.url === "/health") {
    response.writeHead(200, { "content-type": "text/plain" });
    response.end("ok");
    return;
  }
  const chunks = [];
  request.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
  request.on("end", () => {
    const body = Buffer.concat(chunks).toString("utf8");
    log({ event: "request", url: request.url, body });
    const responseBody = JSON.stringify({ choices: [{ message: { content: ${JSON.stringify(content)} } }] });
    response.writeHead(200, { "content-type": "application/json", "content-length": Buffer.byteLength(responseBody).toString() });
    response.end(responseBody);
  });
});
function shutdown(signal) {
  log({ event: signal });
  server.close(() => {
    log({ event: "exit" });
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 500).unref();
}
process.on("SIGTERM", () => shutdown("sigterm"));
process.on("SIGINT", () => shutdown("sigint"));
server.listen(port, host, () => log({ event: "listening", host, port }));
`);
  await chmod(binPath, 0o755);
  return { binPath, logPath };
}

async function writeNeverHealthyLlamaServer(dir: string): Promise<FakeLlamaServer> {
  const binPath = path.join(dir, "never-healthy-llama-server.mjs");
  const logPath = path.join(dir, "never-healthy-llama-server.ndjson");
  await writeFile(binPath, `#!/usr/bin/env node
import { appendFileSync } from "node:fs";
const logPath = ${JSON.stringify(logPath)};
function log(event) { appendFileSync(logPath, JSON.stringify(event) + "\\n"); }
log({ event: "start", argv: process.argv.slice(2) });
function shutdown(signal) {
  log({ event: signal });
  log({ event: "exit" });
  process.exit(0);
}
process.on("SIGTERM", () => shutdown("sigterm"));
process.on("SIGINT", () => shutdown("sigint"));
setInterval(() => undefined, 1000);
`);
  await chmod(binPath, 0o755);
  return { binPath, logPath };
}

async function readFakeEvents(logPath: string): Promise<FakeLlamaEvent[]> {
  const text = await readFile(logPath, "utf8");
  return text.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line) as FakeLlamaEvent);
}

function setEnvForTest(name: string, value: string): () => void {
  const previous = process.env[name];
  process.env[name] = value;
  return () => {
    if (previous === undefined) delete process.env[name];
    else process.env[name] = previous;
  };
}

describe("practical Bonsai local runtime", () => {
  it("starts a local llama-server command with fixed loopback argv, uses it, and cleans it up", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "pfr-bonsai-runtime-"));
    const modelPath = path.join(dir, "Bonsai-1.7B-Q1_0.gguf");
    await writeFile(modelPath, "not a real model; fake server only checks argv");
    const fake = await writeFakeLlamaServer(dir, JSON.stringify({
      schemaVersion: 2,
      headline: "A validation check failed repeatedly in this project.",
      whatHappened: "The validation check was rerun from an old shell after the package changed.",
      whyItMatters: "That makes the validation result hard to trust.",
      expectedBehavior: "Run validation from a fresh project shell.",
    }));

    const restoreSecret = setEnvForTest("OPENAI_API_KEY", "not-persisted-by-test");
    const restoreProxy = setEnvForTest("HTTP_PROXY", "http://127.0.0.1:9");
    try {
      const lease = await startBonsaiLocalDiagnosisRuntime({
        enabled: true,
        modelPath,
        llamaServerPath: fake.binPath,
        startupTimeoutMs: 1_000,
        timeoutMs: 1_000,
        maxOutputTokens: 128,
        contextTokens: 1_024,
      });

      expect(lease.started).toBe(true);
      expect(lease.baseUrl).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);

      const result = await buildFlightLearnDiagnosisViewWithLocalPolish(input(), lease.options);
      expect(result.usedLocalModel).toBe(true);
      expect(result.displayState).toBe("validated");
      expect(result.fallbackReason).toBeNull();
      expect(result.view.headline).toBe("A validation check failed repeatedly in this project.");

      await lease.cleanup();
    } finally {
      restoreProxy();
      restoreSecret();
    }

    const events = await readFakeEvents(fake.logPath);
    const start = events.find((event) => event.event === "start");
    expect(start?.argv).toEqual(expect.arrayContaining(["-m", modelPath, "--host", "127.0.0.1", "--port", "-c", "1024"]));
    expect(start?.argv).not.toContain("0.0.0.0");
    expect(start?.argv).not.toContain("-hf");
    expect(start?.hasProviderSecretEnv).toBe(false);
    expect(start?.hasProxyEnv).toBe(false);
    expect(start?.envKeys).not.toContain("OPENAI_API_KEY");
    expect(start?.envKeys).not.toContain("HTTP_PROXY");
    expect(events.some((event) => event.event === "sigterm")).toBe(true);
    expect(events.some((event) => event.event === "exit")).toBe(true);

    const request = events.find((event) => event.event === "request" && event.url === "/v1/chat/completions");
    expect(request).toBeDefined();
    if (!request?.body) throw new Error("expected fake chat request body");
    const body = JSON.parse(request.body) as Record<string, unknown>;
    expect(body["stream"]).toBe(false);
    expect(body["max_tokens"]).toBe(128);
    expect(JSON.stringify(body)).toContain("Redacted facts JSON");
    expect(JSON.stringify(body)).toContain("/Users/<user>");
    expect(JSON.stringify(body)).not.toContain("/Users/alice");
    expect(JSON.stringify(body)).not.toContain("apiKey");
  });

  it("falls back deterministically when the Bonsai model file is missing", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "pfr-bonsai-runtime-missing-"));
    const fake = await writeFakeLlamaServer(dir, JSON.stringify({ schemaVersion: 2, headline: "Should not run." }));
    const lease = await startBonsaiLocalDiagnosisRuntime({
      enabled: true,
      modelPath: path.join(dir, "missing.gguf"),
      llamaServerPath: fake.binPath,
      startupTimeoutMs: 50,
      timeoutMs: 50,
    });

    expect(lease.started).toBe(false);
    const result = await buildFlightLearnDiagnosisViewWithLocalPolish(input(), lease.options);
    expect(result.usedLocalModel).toBe(false);
    expect(result.fallbackReason).toBe("provider-error");
    expect(result.view.headline).toBe(result.deterministicView.headline);

    await expect(readFile(fake.logPath, "utf8")).rejects.toThrow();
  });

  it("falls back deterministically when the llama-server command is missing", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "pfr-bonsai-runtime-no-command-"));
    const modelPath = path.join(dir, "Bonsai-1.7B-Q1_0.gguf");
    await writeFile(modelPath, "fake model file");

    const lease = await startBonsaiLocalDiagnosisRuntime({
      enabled: true,
      modelPath,
      llamaServerPath: path.join(dir, "missing-llama-server"),
      startupTimeoutMs: 50,
      timeoutMs: 50,
    });

    expect(lease.started).toBe(false);
    const result = await buildFlightLearnDiagnosisViewWithLocalPolish(input(), lease.options);
    expect(result.usedLocalModel).toBe(false);
    expect(result.fallbackReason).toBe("provider-error");
    expect(result.view.headline).toBe(result.deterministicView.headline);
  });

  it("stops a spawned runtime that never becomes healthy before falling back", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "pfr-bonsai-runtime-never-healthy-"));
    const modelPath = path.join(dir, "Bonsai-1.7B-Q1_0.gguf");
    await writeFile(modelPath, "fake model file");
    const fake = await writeNeverHealthyLlamaServer(dir);

    const lease = await startBonsaiLocalDiagnosisRuntime({
      enabled: true,
      modelPath,
      llamaServerPath: fake.binPath,
      startupTimeoutMs: 500,
      timeoutMs: 50,
    });

    expect(lease.started).toBe(false);
    const result = await buildFlightLearnDiagnosisViewWithLocalPolish(input(), lease.options);
    expect(result.usedLocalModel).toBe(false);
    expect(result.fallbackReason).toBe("provider-error");

    const events = await readFakeEvents(fake.logPath);
    expect(events.some((event) => event.event === "start")).toBe(true);
    expect(events.some((event) => event.event === "sigterm")).toBe(true);
    expect(events.some((event) => event.event === "exit")).toBe(true);
  });
});
