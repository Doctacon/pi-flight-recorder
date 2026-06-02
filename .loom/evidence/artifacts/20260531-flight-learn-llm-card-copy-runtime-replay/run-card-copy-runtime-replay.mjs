import { createWriteStream } from "node:fs";
import { access, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { createServer } from "node:net";
import { request as httpRequest } from "node:http";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir, tmpdir } from "node:os";

import {
  buildFlightLearnDiagnosisViewWithLocalPolish,
  buildLocalDiagnosisFactPacket,
  validateLocalDiagnosisPolishResponse,
} from "../../../../dist/flight-learn-local-diagnosis-model.js";
import {
  createLlamaCppLocalDiagnosisPolishProvider,
} from "../../../../dist/flight-learn-llama-cpp-adapter.js";
import { createFlightLearnDeltaInboxComponent } from "../../../../dist/flight-learn-inbox.js";
import { buildFlightLearnDiagnosisView } from "../../../../dist/flight-learn-diagnosis.js";

const artifactDir = dirname(fileURLToPath(import.meta.url));
const widths = [92, 72];
const fields = ["headline", "whatHappened", "whyItMatters", "expectedBehavior", "whyThisWasFlagged", "evidenceSummary"];
const expectedModelSha256 = "4524b3f997f0f06444e568d1f26e2efd69effa3218c7ad3047432fb171e42168";
const runtimePath = "/opt/homebrew/bin/llama-server";
const modelPath = join(homedir(), ".cache", "pi-flight-recorder", "bonsai", "Bonsai-4B-Q1_0.gguf");

function isoNow() {
  return new Date().toISOString();
}

function routeChoices() {
  return [
    { value: "code-legibility", label: "Code legibility", description: "Use when confusing source shape caused repeated mistakes" },
    { value: "test-check", label: "Test/check", description: "Use when a missing or weak validation check would have caught this" },
    { value: "flight-rule", label: "Flight Rule", description: "Use when Pi needs reusable guidance, still requiring approval later" },
    { value: "observe", label: "Observe/no artifact", description: "Keep evidence and watch recurrence without creating an artifact" },
    { value: "dismiss", label: "Dismiss", description: "Close this delta without routing" },
    { value: "cancel", label: "Cancel", description: "Leave unchanged" },
  ];
}

function evidenceRef(caseId, index, note, snippet, sourceType = "manual") {
  return {
    sourceType,
    sourceId: `${caseId}-evidence-${index}`,
    sourceFile: null,
    sessionFile: null,
    cwd: null,
    entryId: `${caseId}-entry-${index}`,
    timestamp: `2026-05-31T00:0${Math.min(index, 9)}:00.000Z`,
    snippet,
    note,
  };
}

function deltaCase(def) {
  const createdAt = "2026-05-31T00:00:00.000Z";
  const delta = {
    id: def.id,
    status: "candidate",
    source: "detector",
    summary: def.summary,
    expectation: def.expectation ?? null,
    reality: def.reality,
    impact: def.impact,
    severity: def.severity ?? "medium",
    cwd: null,
    sourceSessionFile: null,
    sourceEntryId: `${def.id}-entry`,
    evidenceRefs: def.evidenceRefs,
    activeArtifactCandidateId: null,
    statusReason: null,
    metadata: { count: def.count },
    createdAt,
    updatedAt: createdAt,
    acceptedAt: null,
    routedAt: null,
    dismissedAt: null,
    resolvedAt: null,
    recurringAt: null,
  };
  const signal = {
    id: `${def.id}-signal-1`,
    deltaId: def.id,
    type: def.signalType,
    explanation: def.signalExplanation,
    confidence: def.confidence ?? 0.72,
    evidenceRefs: [],
    metadata: {},
    createdAt,
  };
  return { ...def, delta, signals: [signal] };
}

const cases = [
  deltaCase({
    id: "case-01-repeated-workflow",
    title: "Repeated workflow setup friction",
    coverage: ["repeated-workflow", "expected-known", "evidence-summary", "fake-draft"],
    fakeMode: "valid-draft",
    summary: "Repeated setup workflow friction",
    expectation: "Review should start from a clean local workspace.",
    reality: "The same setup check repeated after context changed.",
    impact: "Repeated setup friction slowed the review loop.",
    count: 3,
    signalType: "repeated-tool-failure",
    signalExplanation: "Pi saw 3 related setup failures in local review evidence.",
    evidenceRefs: [
      evidenceRef("case-01-repeated-workflow", 1, "Existing evidence shows repeated setup failures in one local review workflow.", "Redacted evidence shows setup failure recurred after a context change.", "occurrence"),
      evidenceRef("case-01-repeated-workflow", 2, "Existing evidence shows the same setup issue was reviewed again.", "Redacted evidence shows repeated setup review friction.", "manual"),
    ],
  }),
  deltaCase({
    id: "case-02-validation-build",
    title: "Validation/build trust issue",
    coverage: ["validation-build", "expected-known", "fake-draft"],
    fakeMode: "valid-draft",
    summary: "Validation result became hard to trust",
    expectation: "Validation should run from a fresh project shell after package changes.",
    reality: "The same validation check repeated after a package change.",
    impact: "Repeated validation friction made the result hard to trust.",
    count: 2,
    signalType: "failed-validation",
    signalExplanation: "Pi saw 2 related validation failures in local review evidence.",
    evidenceRefs: [
      evidenceRef("case-02-validation-build", 1, "Existing evidence shows repeated validation failures after a package change.", "Redacted evidence shows the validation pattern repeated after package changes.", "occurrence"),
      evidenceRef("case-02-validation-build", 2, "Existing evidence shows validation was repeated from a stale pane.", "Redacted evidence shows stale pane validation recurrence.", "manual"),
    ],
  }),
  deltaCase({
    id: "case-03-stale-edit",
    title: "Stale exact-text edit",
    coverage: ["stale-edit", "expected-known", "fake-draft"],
    fakeMode: "valid-draft",
    summary: "Exact text edit became stale before apply",
    expectation: "Edits should be based on current file content.",
    reality: "An exact text edit repeated after the source text changed.",
    impact: "Repeated stale edits slow review and make the next change less reliable.",
    count: 2,
    signalType: "stale-edit-attempt",
    signalExplanation: "Pi saw 2 related stale edit attempts in local review evidence.",
    evidenceRefs: [
      evidenceRef("case-03-stale-edit", 1, "Existing evidence shows repeated stale edit attempts against changed source text.", "Redacted evidence shows exact edit mismatch after source text changed.", "manual"),
      evidenceRef("case-03-stale-edit", 2, "Existing evidence shows the edit was retried without refreshing context.", "Redacted evidence shows stale edit retry.", "manual"),
    ],
  }),
  deltaCase({
    id: "case-04-low-information",
    title: "Low information candidate",
    coverage: ["low-information", "expected-unknown", "fake-validated"],
    fakeMode: "valid-validated-low-info",
    summary: "Sparse local issue signal",
    expectation: null,
    reality: "A sparse local signal repeated once without enough detail.",
    impact: "The issue may need observation before routing.",
    count: 1,
    signalType: "other",
    signalExplanation: "Pi saw limited local signal evidence for this sparse issue.",
    evidenceRefs: [],
  }),
  deltaCase({
    id: "case-05-safety-adversarial",
    title: "Safety/adversarial rejection",
    coverage: ["safety-adversarial", "fallback", "unsafe-rejection"],
    fakeMode: "unsafe-generated-evidence",
    summary: "Unsafe local model wording should be rejected",
    expectation: "The card should keep evidence deterministic.",
    reality: "The local model response attempted to invent evidence.",
    impact: "Generated evidence would make the card untrustworthy.",
    count: 2,
    signalType: "manual-capture",
    signalExplanation: "Pi saw unsafe model wording during local review evidence.",
    evidenceRefs: [
      evidenceRef("case-05-safety-adversarial", 1, "Existing evidence shows unsafe model wording was rejected.", "Redacted evidence shows generated evidence wording was rejected.", "manual"),
    ],
  }),
  deltaCase({
    id: "case-06-expected-known",
    title: "Expected behavior known",
    coverage: ["expected-known", "fake-draft"],
    fakeMode: "valid-draft",
    summary: "Known expected behavior clarified review",
    expectation: "The assistant should ask before changing durable project guidance.",
    reality: "The review continued after durable guidance changed context.",
    impact: "Clarifying the expected behavior helps route the issue safely.",
    count: 2,
    signalType: "user-correction",
    signalExplanation: "Pi saw 2 related corrections about durable guidance boundaries.",
    evidenceRefs: [
      evidenceRef("case-06-expected-known", 1, "Existing evidence shows corrections about durable guidance boundaries.", "Redacted evidence shows the expected behavior was clarified.", "manual"),
    ],
  }),
  deltaCase({
    id: "case-07-expected-unknown",
    title: "Expected behavior unknown invention rejected",
    coverage: ["expected-unknown", "fallback", "unsupported-expected"],
    fakeMode: "invented-expected",
    summary: "Unknown expected behavior should not be invented",
    expectation: null,
    reality: "The review lacked enough information about intended behavior.",
    impact: "Inventing expected behavior would mislead routing.",
    count: 1,
    signalType: "repeated-clarification",
    signalExplanation: "Pi saw one local clarification signal without intended behavior.",
    evidenceRefs: [
      evidenceRef("case-07-expected-unknown", 1, "Existing evidence shows intended behavior was not recorded.", "Redacted evidence shows the card needs an operator expectation.", "manual"),
    ],
  }),
  deltaCase({
    id: "case-08-evidence-summary",
    title: "Evidence summary case",
    coverage: ["evidence-summary", "expected-known", "fake-draft"],
    fakeMode: "valid-draft",
    summary: "Evidence summary should remain display only",
    expectation: "Evidence should remain inspectable and deterministic.",
    reality: "The card needed a concise evidence summary before expansion.",
    impact: "A safe summary can reduce scan time without replacing evidence refs.",
    count: 3,
    signalType: "reflection-cluster",
    signalExplanation: "Pi saw 3 related evidence summary needs in local review evidence.",
    evidenceRefs: [
      evidenceRef("case-08-evidence-summary", 1, "Existing evidence shows the same evidence summary need across review cases.", "Redacted evidence shows concise summary helped before expansion.", "manual"),
      evidenceRef("case-08-evidence-summary", 2, "Existing evidence shows evidence refs remained inspectable after summary.", "Redacted evidence shows refs remained available for inspection.", "manual"),
      evidenceRef("case-08-evidence-summary", 3, "Existing evidence shows summary text stayed display only.", "Redacted evidence shows no route changed from summary text.", "manual"),
    ],
  }),
];

function byKind(factPacket, kind) {
  return factPacket.facts.filter((fact) => fact.kind === kind);
}

function firstFact(factPacket, kind) {
  const fact = byKind(factPacket, kind)[0];
  if (!fact) throw new Error(`missing fact kind ${kind}`);
  return fact;
}

function whatHappenedFrom(caseDef, factPacket) {
  const reality = firstFact(factPacket, "delta-reality");
  return { sentences: [{ text: reality.text, factIds: [reality.id] }] };
}

function safeExpected(factPacket) {
  const fact = byKind(factPacket, "expected-behavior")[0] ?? byKind(factPacket, "delta-expectation")[0];
  return fact?.text ?? null;
}

function safeWhyFlagged(factPacket) {
  const fact = byKind(factPacket, "signal")[0] ?? byKind(factPacket, "occurrence-count")[0];
  if (!fact) return undefined;
  return { text: fact.text, factIds: [fact.id] };
}

function safeEvidenceSummary(factPacket) {
  const fact = byKind(factPacket, "evidence-summary")[0];
  if (!fact) return undefined;
  return { text: fact.text, factIds: [fact.id] };
}

function fakeResponse(caseDef, factPacket) {
  if (caseDef.fakeMode === "unsafe-generated-evidence") {
    const evidence = firstFact(factPacket, "evidence-summary");
    return {
      schemaVersion: 2,
      evidenceSummary: {
        text: "The model generated a new evidence ref proving the stale shell pattern.",
        factIds: [evidence.id],
      },
    };
  }
  if (caseDef.fakeMode === "invented-expected") {
    return {
      schemaVersion: 2,
      headline: factPacket.deterministic.headline,
      expectedBehavior: "Run validation from a fresh project shell.",
      whyThisWasFlagged: safeWhyFlagged(factPacket),
      evidenceSummary: safeEvidenceSummary(factPacket),
    };
  }

  const response = {
    schemaVersion: 2,
    headline: factPacket.deterministic.headline,
    whyItMatters: firstFact(factPacket, "delta-impact").text,
    whyThisWasFlagged: safeWhyFlagged(factPacket),
    evidenceSummary: safeEvidenceSummary(factPacket),
  };
  const expected = safeExpected(factPacket);
  if (expected) response.expectedBehavior = expected;
  if (caseDef.fakeMode !== "valid-validated-low-info") response.whatHappened = whatHappenedFrom(caseDef, factPacket);
  for (const key of Object.keys(response)) if (response[key] === undefined) delete response[key];
  return response;
}

function jsonParse(raw) {
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch (error) {
    return { ok: false, error: String(error?.message ?? error) };
  }
}

function rawFieldPresence(parsed) {
  const presence = {};
  for (const field of fields) presence[field] = Boolean(parsed && Object.prototype.hasOwnProperty.call(parsed, field));
  return presence;
}

function resultFieldPresence(result) {
  const presence = {};
  for (const field of fields) presence[field] = Boolean(result.view?.[field]);
  return presence;
}

function makeProvider(caseDef, captures) {
  return {
    completeLocalDiagnosisPolish: async (request) => {
      const response = fakeResponse(caseDef, request.factPacket);
      const raw = JSON.stringify(response);
      captures.raw = raw;
      captures.factPacket = request.factPacket;
      captures.promptLength = request.prompt.length;
      return raw;
    },
  };
}

function makeRenderInput(caseDef, result) {
  return {
    items: [{ delta: caseDef.delta, signals: caseDef.signals, localDiagnosisPolish: result }],
    routeChoices: routeChoices(),
  };
}

function renderCase(caseDef, result, width, expand = false) {
  const component = createFlightLearnDeltaInboxComponent({ input: makeRenderInput(caseDef, result), done: () => undefined, layout: "focused-card" });
  if (expand) component.handleInput?.("v");
  return component.render(width).join("\n");
}

function summarizeResult(caseDef, result, raw, latencyMs) {
  const parsed = raw === null ? { ok: false, error: "no provider response" } : jsonParse(raw);
  const schemaCompatible = parsed.ok && result.fallbackReason !== "malformed-json" && result.fallbackReason !== "schema-invalid" && result.fallbackReason !== "provider-error" && result.fallbackReason !== "timeout";
  return {
    caseId: caseDef.id,
    title: caseDef.title,
    coverage: caseDef.coverage,
    parseValid: parsed.ok,
    schemaValid: schemaCompatible,
    productGatePass: result.usedLocalModel && result.fallbackReason === null,
    displayState: result.displayState,
    narrativeStatus: result.narrativeStatus,
    fallbackReason: result.fallbackReason,
    validationIssueCategory: safeIssueCategory(result.validationIssue),
    unsafeRejected: result.fallbackReason === "unsafe-output",
    fieldPresence: parsed.ok ? rawFieldPresence(parsed.value) : rawFieldPresence(null),
    viewFieldPresence: resultFieldPresence(result),
    latencyMs,
  };
}

function safeIssueCategory(issue) {
  if (!issue) return null;
  if (issue.includes("unsafe")) return "unsafe-output";
  if (issue.includes("unsupported") || issue.includes("not supported")) return "unsupported-facts";
  if (issue.includes("timed out")) return "timeout";
  if (issue.includes("schema") || issue.includes("shape")) return "schema-invalid";
  if (issue.includes("empty")) return "empty-output";
  return "other";
}

function aggregateReplay(kind, caseSummaries, generatedAt, extra = {}) {
  const fieldCoverage = {};
  const viewFieldCoverage = {};
  for (const field of fields) {
    fieldCoverage[field] = caseSummaries.filter((item) => item.fieldPresence[field]).length;
    viewFieldCoverage[field] = caseSummaries.filter((item) => item.viewFieldPresence[field]).length;
  }
  const fallbackReasons = {};
  const displayStates = {};
  for (const item of caseSummaries) {
    if (item.fallbackReason) fallbackReasons[item.fallbackReason] = (fallbackReasons[item.fallbackReason] ?? 0) + 1;
    displayStates[item.displayState] = (displayStates[item.displayState] ?? 0) + 1;
  }
  const latencies = caseSummaries.map((item) => item.latencyMs).filter((value) => typeof value === "number" && Number.isFinite(value));
  return {
    kind,
    generatedAt,
    totalCases: caseSummaries.length,
    parseValidCount: caseSummaries.filter((item) => item.parseValid).length,
    schemaValidCount: caseSummaries.filter((item) => item.schemaValid).length,
    productGatePassCount: caseSummaries.filter((item) => item.productGatePass).length,
    productFallbackCount: caseSummaries.filter((item) => !item.productGatePass).length,
    unsafeRejectionCount: caseSummaries.filter((item) => item.unsafeRejected).length,
    fallbackReasons,
    displayStates,
    fieldCoverage,
    viewFieldCoverage,
    latencyMs: latencySummary(latencies),
    cases: caseSummaries,
    ...extra,
  };
}

function latencySummary(values) {
  if (values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  return { min, max, avg };
}

async function runFakeReplay() {
  const generatedAt = isoNow();
  const summaries = [];
  const renderFiles = [];
  for (const caseDef of cases) {
    const captures = {};
    const started = Date.now();
    const result = await buildFlightLearnDiagnosisViewWithLocalPolish(
      { delta: caseDef.delta, signals: caseDef.signals },
      { enabled: true, provider: makeProvider(caseDef, captures), timeoutMs: 1000 },
    );
    const latencyMs = Date.now() - started;
    summaries.push(summarizeResult(caseDef, result, captures.raw ?? null, latencyMs));
    for (const width of widths) {
      const file = `fake-${caseDef.id}-${width}.txt`;
      await writeFile(join(artifactDir, file), renderCase(caseDef, result, width));
      renderFiles.push(file);
    }
  }
  return { summary: aggregateReplay("fake-provider", summaries, generatedAt), renderFiles };
}

async function fileExecutable(path) {
  try {
    await access(path, fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
}

async function fileExists(path) {
  try {
    await access(path, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function sha256File(path) {
  const hash = createHash("sha256");
  const data = await readFile(path);
  hash.update(data);
  return hash.digest("hex");
}

async function commandOutput(command, args) {
  return await new Promise((resolve) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk.toString("utf8"); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString("utf8"); });
    child.on("error", (error) => resolve({ status: null, stdout, stderr: String(error?.message ?? error) }));
    child.on("close", (status) => resolve({ status, stdout, stderr }));
  });
}

async function getFreePort() {
  return await new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : null;
      server.close(() => {
        if (port === null) reject(new Error("failed to allocate port"));
        else resolve(port);
      });
    });
    server.on("error", reject);
  });
}

async function httpGetJson(url, timeoutMs = 1000) {
  return await new Promise((resolve, reject) => {
    const req = httpRequest(url, { method: "GET", timeout: timeoutMs }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => {
        if ((res.statusCode ?? 500) >= 400) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve({ raw: body.slice(0, 80) });
        }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy(new Error("timeout"));
    });
    req.end();
  });
}

async function waitForHealth(baseUrl, timeoutMs) {
  const started = Date.now();
  let lastError = null;
  while (Date.now() - started < timeoutMs) {
    try {
      const health = await httpGetJson(`${baseUrl}health`, 1000);
      return { ok: true, health };
    } catch (error) {
      lastError = String(error?.message ?? error);
      await new Promise((resolve) => setTimeout(resolve, 750));
    }
  }
  return { ok: false, error: lastError ?? "health check timed out" };
}

async function stopServer(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => child.once("close", resolve)),
    new Promise((resolve) => setTimeout(resolve, 5000)),
  ]);
  if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
}

async function summarizeTempLogs(stdoutPath, stderrPath) {
  const stdoutStat = await stat(stdoutPath).catch(() => null);
  const stderrStat = await stat(stderrPath).catch(() => null);
  return {
    stdoutBytes: stdoutStat?.size ?? 0,
    stderrBytes: stderrStat?.size ?? 0,
    rawLogsPersisted: false,
    note: "Raw llama-server logs were temporary and deleted after byte-count summary without reading or persisting contents.",
  };
}

async function preflightRuntime() {
  const runtimeAvailable = await fileExecutable(runtimePath);
  const modelAvailable = await fileExists(modelPath);
  const version = runtimeAvailable ? await commandOutput(runtimePath, ["--version"]) : { status: null, stdout: "", stderr: "runtime unavailable" };
  const modelSha256 = modelAvailable ? await sha256File(modelPath) : null;
  const modelMatchesExpected = modelSha256 === expectedModelSha256;
  return {
    runtime: {
      path: runtimePath,
      available: runtimeAvailable,
      versionStatus: version.status,
      versionStdoutPreview: sanitizePreview(version.stdout),
      versionStderrPreview: sanitizePreview(version.stderr),
    },
    model: {
      path: "~/.cache/pi-flight-recorder/bonsai/Bonsai-4B-Q1_0.gguf",
      available: modelAvailable,
      sha256: modelSha256,
      expectedSha256: expectedModelSha256,
      matchesExpected: modelMatchesExpected,
    },
    runnable: runtimeAvailable && modelAvailable && modelMatchesExpected,
  };
}

function sanitizePreview(value) {
  return value.replaceAll(homedir(), "<home>").replace(/\s+/g, " ").trim().slice(0, 240);
}

async function runRealReplayIfAvailable() {
  const preflight = await preflightRuntime();
  if (!preflight.runnable) {
    return {
      status: "real-runtime-not-run",
      reason: !preflight.runtime.available ? "llama-server-unavailable" : !preflight.model.available ? "model-unavailable" : "model-checksum-mismatch",
      preflight,
      summary: null,
      renderFiles: [],
      runtimeProvenance: { ...preflight, baseUrl: null, serverLogSummary: null },
    };
  }

  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}/`;
  const stdoutPath = join(tmpdir(), `pfr-card-copy-runtime-${process.pid}-${port}.stdout.log`);
  const stderrPath = join(tmpdir(), `pfr-card-copy-runtime-${process.pid}-${port}.stderr.log`);
  const stdoutStream = createWriteStream(stdoutPath, { flags: "w" });
  const stderrStream = createWriteStream(stderrPath, { flags: "w" });
  const args = ["-m", modelPath, "--host", "127.0.0.1", "--port", String(port), "-c", "4096", "--no-webui", "--jinja"];
  const child = spawn(runtimePath, args, { stdio: ["ignore", "pipe", "pipe"] });
  child.stdout.pipe(stdoutStream);
  child.stderr.pipe(stderrStream);

  const renderFiles = [];
  let serverLogSummary = null;
  try {
    const health = await waitForHealth(baseUrl, 90000);
    if (!health.ok) {
      return {
        status: "real-runtime-not-run",
        reason: `server-health-failed:${health.error}`,
        preflight,
        summary: null,
        renderFiles,
        runtimeProvenance: { ...preflight, baseUrl, health, serverLogSummary: null },
      };
    }

    const caseSummaries = [];
    for (const caseDef of cases) {
      let raw = null;
      let providerError = null;
      const baseProvider = createLlamaCppLocalDiagnosisPolishProvider({
        enabled: true,
        kind: "llama-cpp-server",
        baseUrl,
        model: "Bonsai-4B-Q1_0",
        timeoutMs: 5000,
        maxOutputTokens: 512,
      });
      const provider = {
        completeLocalDiagnosisPolish: async (request) => {
          try {
            raw = await baseProvider.completeLocalDiagnosisPolish(request);
            return raw;
          } catch (error) {
            providerError = String(error?.name ?? error?.message ?? error);
            throw error;
          }
        },
      };
      const started = Date.now();
      const result = await buildFlightLearnDiagnosisViewWithLocalPolish(
        { delta: caseDef.delta, signals: caseDef.signals },
        { enabled: true, provider, timeoutMs: 5000 },
      );
      const latencyMs = Date.now() - started;
      const summary = summarizeResult(caseDef, result, raw, latencyMs);
      summary.providerErrorCategory = providerError;
      caseSummaries.push(summary);
      for (const width of widths) {
        const file = `real-${caseDef.id}-${width}.txt`;
        await writeFile(join(artifactDir, file), renderCase(caseDef, result, width));
        renderFiles.push(file);
      }
    }
    const summary = aggregateReplay("real-bonsai-4b", caseSummaries, isoNow(), {
      baseUrl,
      model: preflight.model,
      runtime: preflight.runtime,
      hostedProviderUsed: false,
      loopbackOnly: true,
      automaticDownloadOrInstall: false,
    });
    serverLogSummary = await summarizeTempLogs(stdoutPath, stderrPath);
    return {
      status: "ran",
      reason: null,
      preflight,
      summary,
      renderFiles,
      runtimeProvenance: { ...preflight, baseUrl, health, serverLogSummary },
    };
  } finally {
    await stopServer(child);
    stdoutStream.end();
    stderrStream.end();
    serverLogSummary = serverLogSummary ?? await summarizeTempLogs(stdoutPath, stderrPath).catch(() => null);
    await rm(stdoutPath, { force: true }).catch(() => undefined);
    await rm(stderrPath, { force: true }).catch(() => undefined);
  }
}

function checkWidths(files) {
  const results = [];
  for (const file of files) {
    const match = file.match(/-(72|92)\.txt$/);
    const width = match ? Number.parseInt(match[1], 10) : null;
    if (!width) continue;
    // filled by async caller
    results.push({ file, width });
  }
  return results;
}

async function computeWidthChecks(files) {
  const checks = [];
  for (const item of checkWidths(files)) {
    const text = await readFile(join(artifactDir, item.file), "utf8");
    const lines = text.split(/\r?\n/);
    const overLimit = lines
      .map((line, index) => ({ line: index + 1, length: line.length, preview: line.slice(0, 120) }))
      .filter((line) => line.length > item.width);
    checks.push({ ...item, lineCount: lines.length, maxLineLength: Math.max(...lines.map((line) => line.length), 0), overLimit });
  }
  return { pass: checks.every((check) => check.overLimit.length === 0), checks };
}

async function defaultHiddenInternalsCheck(files) {
  const defaultFiles = files.filter((file) => /^(fake|real)-/.test(file));
  const forbidden = [
    /Raw clue/i,
    /Why suggested/i,
    /cluster_[a-z0-9_-]+/i,
    /\/Users\//i,
    /\.pi\/agent\/sessions/i,
    /Bearer\s+[A-Za-z0-9._~+/=-]+/i,
    new RegExp("-----BEGIN " + "[A-Z ]*" + "PRIVATE KEY-----", "i"),
  ];
  const findings = [];
  for (const file of defaultFiles) {
    const text = await readFile(join(artifactDir, file), "utf8");
    for (const pattern of forbidden) {
      const match = text.match(pattern);
      if (match) findings.push({ file, pattern: String(pattern), match: match[0].slice(0, 80) });
    }
  }
  return { pass: findings.length === 0, defaultFilesChecked: defaultFiles, forbiddenDefaultFindings: findings };
}

async function artifactPrivacyScan(paths) {
  const patterns = [
    ["raw_home_path", /\/Users\/[A-Za-z0-9._-]+|\/home\/[A-Za-z0-9._-]+/i],
    ["pi_session_path", /\.pi\/agent\/sessions/i],
    ["private_key", new RegExp("-----BEGIN " + "[A-Z ]*" + "PRIVATE KEY-----", "i")],
    ["bearer", /Bearer\s+[A-Za-z0-9._~+/=-]+/i],
    ["secret_assignment", /\b(?:API_KEY|TOKEN|SECRET|PASSWORD|PRIVATE_KEY)\s*=/i],
    ["prompt_marker", new RegExp("<\\|im_start\\||raw session " + "transcript|prompt " + "text", "i")],
  ];
  const findings = [];
  for (const path of paths) {
    const text = await readFile(path, "utf8");
    for (const [name, pattern] of patterns) {
      const match = text.match(pattern);
      if (match) findings.push({ file: path.replace(`${process.cwd()}/`, ""), pattern: name, match: match[0].slice(0, 80) });
    }
  }
  return { pass: findings.length === 0, scannedFiles: paths.length, forbiddenPatternCount: findings.length, findings };
}

async function main() {
  await mkdir(artifactDir, { recursive: true });
  const generatedAt = isoNow();
  const fake = await runFakeReplay();
  const real = await runRealReplayIfAvailable();
  const renderFiles = [...fake.renderFiles, ...real.renderFiles];

  const widthChecks = await computeWidthChecks(renderFiles);
  const internalsCheck = await defaultHiddenInternalsCheck(renderFiles);

  await writeFile(join(artifactDir, "01-fake-replay-summary.json"), `${JSON.stringify(fake.summary, null, 2)}\n`);
  if (real.summary) await writeFile(join(artifactDir, "02-real-runtime-summary.json"), `${JSON.stringify(real.summary, null, 2)}\n`);
  await writeFile(join(artifactDir, "03-runtime-provenance.json"), `${JSON.stringify(real.runtimeProvenance, null, 2)}\n`);
  await writeFile(join(artifactDir, "04-real-runtime-status.json"), `${JSON.stringify({ status: real.status, reason: real.reason, ranAt: generatedAt }, null, 2)}\n`);
  await writeFile(join(artifactDir, "05-render-line-widths.json"), `${JSON.stringify(widthChecks, null, 2)}\n`);
  await writeFile(join(artifactDir, "06-render-contract-check.json"), `${JSON.stringify(internalsCheck, null, 2)}\n`);

  const index = {
    generatedAt,
    corpus: {
      totalCases: cases.length,
      cases: cases.map((caseDef) => ({ caseId: caseDef.id, title: caseDef.title, coverage: caseDef.coverage, fakeMode: caseDef.fakeMode, evidenceRefCount: caseDef.delta.evidenceRefs.length })),
    },
    fakeReplay: {
      summaryArtifact: "01-fake-replay-summary.json",
      renderFiles: fake.renderFiles,
    },
    realRuntime: {
      status: real.status,
      reason: real.reason,
      summaryArtifact: real.summary ? "02-real-runtime-summary.json" : null,
      provenanceArtifact: "03-runtime-provenance.json",
      statusArtifact: "04-real-runtime-status.json",
      renderFiles: real.renderFiles,
    },
    checks: {
      widthArtifact: "05-render-line-widths.json",
      hiddenInternalsArtifact: "06-render-contract-check.json",
    },
    nonClaims: [
      "Replay/render evidence does not prove operator comprehension.",
      "Fake-provider evidence does not prove real Bonsai/local-runtime quality.",
      "No dogfood corpus/outcome collection started.",
    ],
  };
  await writeFile(join(artifactDir, "00-artifact-index.json"), `${JSON.stringify(index, null, 2)}\n`);

  const artifactFilesForScan = [
    "00-artifact-index.json",
    "01-fake-replay-summary.json",
    ...(real.summary ? ["02-real-runtime-summary.json"] : []),
    "03-runtime-provenance.json",
    "04-real-runtime-status.json",
    "05-render-line-widths.json",
    "06-render-contract-check.json",
    ...renderFiles,
  ].map((file) => join(artifactDir, file));
  const privacy = await artifactPrivacyScan(artifactFilesForScan);
  await writeFile(join(artifactDir, "07-artifact-privacy-scan.json"), `${JSON.stringify(privacy, null, 2)}\n`);

  const output = {
    generatedAt,
    fakeSummary: fake.summary,
    realRuntimeStatus: { status: real.status, reason: real.reason },
    widthPass: widthChecks.pass,
    hiddenInternalsPass: internalsCheck.pass,
    privacyPass: privacy.pass,
    artifactDir: ".loom/evidence/artifacts/20260531-flight-learn-llm-card-copy-runtime-replay",
  };
  console.log(JSON.stringify(output, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
