import { createWriteStream } from "node:fs";
import { access, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { createServer } from "node:net";
import { request as httpRequest } from "node:http";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir, tmpdir } from "node:os";

import {
  buildFlightLearnDiagnosisViewWithLocalPolish,
  buildLocalDiagnosisFactPacket,
  validateLocalDiagnosisPolishResponse,
} from "../../../../src/flight-learn-local-diagnosis-model.ts";
import { buildFlightLearnDiagnosisView } from "../../../../src/flight-learn-diagnosis.ts";
import { createLlamaCppLocalDiagnosisPolishProvider } from "../../../../src/flight-learn-llama-cpp-adapter.ts";

const artifactDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = process.cwd();
const fields = ["headline", "whatHappened", "whyItMatters", "expectedBehavior", "whyThisWasFlagged", "evidenceSummary"];
const expectedModelSha256 = "4524b3f997f0f06444e568d1f26e2efd69effa3218c7ad3047432fb171e42168";
const runtimePath = "/opt/homebrew/bin/llama-server";
const modelPath = join(homedir(), ".cache", "pi-flight-recorder", "bonsai", "Bonsai-4B-Q1_0.gguf");
const sourcePaths = [
  "src/flight-learn-local-diagnosis-model.ts",
  "src/flight-learn-llama-cpp-adapter.ts",
];

function isoNow() {
  return new Date().toISOString();
}

function evidenceRef(caseId, index, note, snippet, sourceType = "manual") {
  return {
    sourceType,
    sourceId: `${caseId}-evidence-${index}`,
    sourceFile: null,
    sessionFile: null,
    cwd: null,
    entryId: `${caseId}-entry-${index}`,
    timestamp: `2026-06-02T00:0${Math.min(index, 9)}:00.000Z`,
    snippet,
    note,
  };
}

function deltaCase(def) {
  const createdAt = "2026-06-02T00:00:00.000Z";
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
    coverage: ["repeated-workflow", "expected-known", "evidence-summary"],
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
    coverage: ["validation-build", "expected-known"],
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
    coverage: ["stale-edit", "expected-known"],
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
    coverage: ["low-information", "expected-unknown"],
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
    coverage: ["expected-known"],
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
    coverage: ["evidence-summary", "expected-known"],
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

function sanitizePreview(value) {
  return String(value ?? "").replaceAll(homedir(), "<home>").replace(/\s+/g, " ").trim().slice(0, 240);
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
    req.on("timeout", () => req.destroy(new Error("timeout")));
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

async function listenerCheck(port) {
  if (port === null) return { checked: false, port: null, output: "runtime not started" };
  const result = await commandOutput("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN"]);
  const output = `${result.stdout}${result.stderr}`.trim();
  return {
    checked: true,
    port,
    status: result.status,
    output: output ? output.replaceAll(homedir(), "<home>").slice(0, 800) : "no listener output",
  };
}

function jsonParse(raw) {
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch (error) {
    return { ok: false, error: String(error?.message ?? error) };
  }
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeIssueCategory(issue, reason = null) {
  const text = String(issue ?? "").toLowerCase();
  if (reason === "timeout" || text.includes("timed out")) return "timeout-resource-envelope";
  if (text.includes("unsafe") || text.includes("non-display")) return "unsafe-output";
  if (text.includes("unknown factid") || text.includes("cited an unknown")) return "unknown-fact-id";
  if (text.includes("expected behavior") && (text.includes("not supported") || text.includes("contradicted") || text.includes("unsupported"))) return "expected-behavior-unsupported-or-invented";
  if (text.includes("unsupported") || text.includes("not supported")) return "unsupported-facts";
  if (text.includes("schema") || text.includes("json object") || text.includes("must be") || text.includes("unsupported fields") || text.includes("exceeded")) return "schema-shape";
  if (text.includes("empty") || text.includes("useful")) return "low-information-or-empty";
  if (text.includes("provider failed")) return "provider-error";
  if (!issue) return null;
  return "other";
}

function validationSummary(result) {
  if (result.ok) {
    return {
      ok: true,
      reason: null,
      issueCategory: null,
      issue: null,
      usefulFieldCount: Object.keys(result.value).length,
      hasNarrativeCandidate: Boolean(result.narrativeCandidate),
    };
  }
  return {
    ok: false,
    reason: result.reason,
    issueCategory: safeIssueCategory(result.issue, result.reason),
    issue: result.issue,
    usefulFieldCount: 0,
    hasNarrativeCandidate: false,
  };
}

function safeKey(key) {
  return /^[A-Za-z0-9._-]{1,64}$/.test(key) ? key : "<redacted-key>";
}

function collectTexts(value) {
  const texts = [];
  if (typeof value === "string") texts.push(value);
  else if (isPlainObject(value)) {
    if (typeof value.text === "string") texts.push(value.text);
    if (Array.isArray(value.sentences)) {
      for (const sentence of value.sentences) {
        if (isPlainObject(sentence) && typeof sentence.text === "string") texts.push(sentence.text);
      }
    }
  }
  return texts;
}

function classifyTextSignals(value) {
  const signals = new Set();
  for (const text of collectTexts(value)) {
    if (/\/Users\/|\/home\/|\.pi\/agent\/sessions|\bfile:\/\//i.test(text)) signals.add("privacy-path-like");
    if (/Bearer\s+[A-Za-z0-9._~+/=-]+|-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:API_KEY|TOKEN|SECRET|PASSWORD|PRIVATE_KEY)\s*=/i.test(text)) signals.add("secret-like");
    if (/\b(?:system|developer|assistant|user|tool)\s*:|<\|im_start\||\bfull\s+prompt\b/i.test(text)) signals.add("prompt-or-transcript-marker");
    if (/\b(?:npm|node|bash|git|python|tsx|tsc|vitest|curl|rm)\b[^.!?]{0,80}(?:&&|--|\brun\b|\btest\b|\bbuild\b)/i.test(text)) signals.add("raw-command-like");
    if (/\b(?:create|apply|store|save|persist|write|update|edit|delete|remove|modify)\b[^.!?]{0,80}\b(?:artifact|candidate|rule|ticket|loom|file|source|code|database|record|route|prompt|skill)\b/i.test(text)) signals.add("mutation-instruction-like");
    if (/^\s*(?:run|fix|edit|change|create|apply|route|choose|select|use|update)\b/i.test(text)) signals.add("imperative-action-like");
    if (/\b(?:generated|new|created|invented)\b[^.!?]{0,60}\b(?:evidence|ref|proof)\b/i.test(text)) signals.add("generated-evidence-claim-like");
    if (/\b(?:schemaVersion|factIds|JSON|delta|signals|bounds|confidence|cluster|detector|record ID)\b/i.test(text)) signals.add("internal-debug-like");
  }
  return Array.from(signals).sort();
}

function fieldShape(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function extractFactIds(value) {
  const ids = [];
  if (isPlainObject(value)) {
    if (Array.isArray(value.factIds)) ids.push(...value.factIds.filter((item) => typeof item === "string"));
    if (Array.isArray(value.sentences)) {
      for (const sentence of value.sentences) {
        if (isPlainObject(sentence) && Array.isArray(sentence.factIds)) ids.push(...sentence.factIds.filter((item) => typeof item === "string"));
      }
    }
  }
  return Array.from(new Set(ids));
}

function diagnoseField(field, value, context) {
  const raw = JSON.stringify({ schemaVersion: 2, [field]: value });
  const validation = validateLocalDiagnosisPolishResponse(raw, context);
  const factIds = extractFactIds(value);
  const factById = new Map(context.factPacket.facts.map((fact) => [fact.id, fact]));
  const unknownFactIdCount = factIds.filter((id) => !factById.has(id)).length;
  const factKinds = Array.from(new Set(factIds.map((id) => factById.get(id)?.kind).filter(Boolean))).sort();
  return {
    field,
    present: true,
    rawShape: fieldShape(value),
    factIdCount: factIds.length,
    unknownFactIdCount,
    citedFactKinds: factKinds,
    textSignalCategories: classifyTextSignals(value),
    validation: validationSummary(validation),
  };
}

function diagnoseParsedResponse(raw, context) {
  const parsed = jsonParse(raw);
  if (!parsed.ok) {
    return {
      parseValid: false,
      topLevelKeys: [],
      extraTopLevelKeys: [],
      fieldDiagnostics: fields.map((field) => ({ field, present: false })),
      fullValidation: { ok: false, reason: "malformed-json", issueCategory: "schema-shape", issue: "provider response was not valid JSON" },
    };
  }
  if (!isPlainObject(parsed.value)) {
    return {
      parseValid: true,
      topLevelKeys: [],
      extraTopLevelKeys: [],
      fieldDiagnostics: fields.map((field) => ({ field, present: false })),
      fullValidation: { ok: false, reason: "schema-invalid", issueCategory: "schema-shape", issue: "provider response must be a JSON object" },
    };
  }
  const fullValidation = validateLocalDiagnosisPolishResponse(raw, context);
  const allowedTopLevel = new Set(["schemaVersion", ...fields]);
  return {
    parseValid: true,
    topLevelKeys: Object.keys(parsed.value).map(safeKey),
    extraTopLevelKeys: Object.keys(parsed.value).filter((key) => !allowedTopLevel.has(key)).map(safeKey),
    fieldDiagnostics: fields.map((field) => Object.prototype.hasOwnProperty.call(parsed.value, field)
      ? diagnoseField(field, parsed.value[field], context)
      : { field, present: false }),
    fullValidation: validationSummary(fullValidation),
  };
}

async function sourceFingerprints() {
  const entries = [];
  for (const sourcePath of sourcePaths) {
    const data = await readFile(join(repoRoot, sourcePath));
    entries.push({ path: sourcePath, sha256: createHash("sha256").update(data).digest("hex") });
  }
  return entries;
}

async function diagnoseCases(baseUrl) {
  const baseProvider = createLlamaCppLocalDiagnosisPolishProvider({
    enabled: true,
    kind: "llama-cpp-server",
    baseUrl,
    model: "Bonsai-4B-Q1_0",
    timeoutMs: 5000,
    maxOutputTokens: 512,
  });
  if (!baseProvider) throw new Error("failed to create local provider");

  const caseDiagnostics = [];
  for (const caseDef of cases) {
    let raw = null;
    let providerErrorCategory = null;
    let promptLength = null;
    let factPacketSummary = null;
    const provider = {
      completeLocalDiagnosisPolish: async (request) => {
        promptLength = request.prompt.length;
        factPacketSummary = {
          factCount: request.factPacket.facts.length,
          evidenceCount: request.factPacket.evidence.length,
          signalCount: request.factPacket.signals.length,
          expectedKnown: request.factPacket.deterministic.expectedBehavior !== null,
          bounds: request.factPacket.bounds,
        };
        try {
          raw = await baseProvider.completeLocalDiagnosisPolish(request);
          return raw;
        } catch (error) {
          providerErrorCategory = String(error?.name ?? error?.message ?? error).slice(0, 80);
          throw error;
        }
      },
    };
    const deterministicView = buildFlightLearnDiagnosisView({ delta: caseDef.delta, signals: caseDef.signals });
    const factPacket = buildLocalDiagnosisFactPacket({ delta: caseDef.delta, signals: caseDef.signals }, deterministicView);
    const started = Date.now();
    const result = await buildFlightLearnDiagnosisViewWithLocalPolish(
      { delta: caseDef.delta, signals: caseDef.signals },
      { enabled: true, provider, timeoutMs: 5000 },
    );
    const latencyMs = Date.now() - started;
    const context = { factPacket, deterministicView };
    const responseDiagnostics = raw === null ? null : diagnoseParsedResponse(raw, context);
    caseDiagnostics.push({
      caseId: caseDef.id,
      title: caseDef.title,
      coverage: caseDef.coverage,
      promptLength,
      latencyMs,
      factPacketSummary,
      product: {
        usedLocalModel: result.usedLocalModel,
        productGatePass: result.usedLocalModel && result.fallbackReason === null,
        displayState: result.displayState,
        narrativeStatus: result.narrativeStatus,
        fallbackReason: result.fallbackReason,
        validationIssueCategory: safeIssueCategory(result.validationIssue, result.fallbackReason),
        validationIssue: result.validationIssue,
      },
      providerErrorCategory,
      responseObserved: raw !== null,
      responseDiagnostics,
    });
  }
  return caseDiagnostics;
}

function countBy(items, getKey) {
  const counts = {};
  for (const item of items) {
    const key = getKey(item);
    if (key === null || key === undefined) continue;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function latencySummary(values) {
  const clean = values.filter((value) => typeof value === "number" && Number.isFinite(value));
  if (clean.length === 0) return null;
  return {
    min: Math.min(...clean),
    max: Math.max(...clean),
    avg: Math.round(clean.reduce((sum, value) => sum + value, 0) / clean.length),
  };
}

function aggregateDiagnostics(caseDiagnostics, generatedAt) {
  const observed = caseDiagnostics.filter((item) => item.responseObserved && item.responseDiagnostics);
  const fieldFailures = [];
  const fieldSignalCounts = {};
  const fieldValidationCounts = {};
  for (const item of observed) {
    for (const field of item.responseDiagnostics.fieldDiagnostics) {
      if (!field.present) continue;
      for (const signal of field.textSignalCategories ?? []) {
        fieldSignalCounts[signal] = (fieldSignalCounts[signal] ?? 0) + 1;
      }
      const key = field.validation?.ok ? "ok" : field.validation?.issueCategory ?? field.validation?.reason ?? "unknown";
      fieldValidationCounts[`${field.field}:${key}`] = (fieldValidationCounts[`${field.field}:${key}`] ?? 0) + 1;
      if (field.validation && !field.validation.ok) {
        fieldFailures.push({
          caseId: item.caseId,
          field: field.field,
          issueCategory: field.validation.issueCategory,
          reason: field.validation.reason,
          textSignalCategories: field.textSignalCategories,
          unknownFactIdCount: field.unknownFactIdCount,
          citedFactKinds: field.citedFactKinds,
        });
      }
    }
  }
  const repairable = [];
  const nonNegotiable = [];
  for (const item of caseDiagnostics) {
    if (item.product.fallbackReason === "timeout") {
      repairable.push({ caseId: item.caseId, category: "timeout-resource-envelope", target: "shorter prompt, smaller output burden, or longer explicitly-authorized timeout envelope" });
    }
    if (item.responseDiagnostics?.fullValidation?.issueCategory === "schema-shape") {
      repairable.push({ caseId: item.caseId, category: "schema-shape", target: "schema/prompt shape compatibility" });
    }
    if (item.responseDiagnostics?.fullValidation?.issueCategory === "expected-behavior-unsupported-or-invented") {
      nonNegotiable.push({ caseId: item.caseId, category: "expected-behavior-invention", boundary: "expected behavior must remain fact-bound and unknown must stay unknown" });
    }
    const unsafeSignals = (item.responseDiagnostics?.fieldDiagnostics ?? [])
      .filter((field) => field.present && field.validation && !field.validation.ok && field.validation.issueCategory === "unsafe-output")
      .flatMap((field) => field.textSignalCategories ?? []);
    if (unsafeSignals.includes("mutation-instruction-like") || unsafeSignals.includes("imperative-action-like")) {
      nonNegotiable.push({ caseId: item.caseId, category: "action-or-mutation-advice", boundary: "route/action/mutation guidance must remain fail-closed" });
    } else if (item.product.fallbackReason === "unsafe-output") {
      repairable.push({ caseId: item.caseId, category: "unsafe-output-needs-closer-diagnosis", target: "distinguish true unsafe action advice from over-broad non-display wording" });
    }
  }
  return {
    kind: "real-bonsai-card-copy-failure-diagnostics",
    generatedAt,
    totalCases: caseDiagnostics.length,
    responseObservedCount: observed.length,
    parseValidCount: observed.filter((item) => item.responseDiagnostics.parseValid).length,
    fullValidationPassCount: observed.filter((item) => item.responseDiagnostics.fullValidation.ok).length,
    productGatePassCount: caseDiagnostics.filter((item) => item.product.productGatePass).length,
    productFallbackCount: caseDiagnostics.filter((item) => !item.product.productGatePass).length,
    fallbackReasons: countBy(caseDiagnostics, (item) => item.product.fallbackReason),
    validationIssueCategories: countBy(caseDiagnostics, (item) => item.product.validationIssueCategory),
    displayStates: countBy(caseDiagnostics, (item) => item.product.displayState),
    fieldSignalCounts,
    fieldValidationCounts,
    fieldFailures,
    latencyMs: latencySummary(caseDiagnostics.map((item) => item.latencyMs)),
    promptLengthChars: latencySummary(caseDiagnostics.map((item) => item.promptLength)),
    repairableCategories: repairable,
    nonNegotiableSafetyCategories: nonNegotiable,
    cases: caseDiagnostics,
    limitations: [
      "Raw model responses were inspected only in memory and were not persisted.",
      "Text signal categories are conservative pattern categories, not persisted excerpts.",
      "A raw-output-free taxonomy cannot prove every semantic reason behind the model wording.",
    ],
  };
}

async function runRealDiagnosticsIfAvailable() {
  const preflight = await preflightRuntime();
  let port = null;
  if (!preflight.runnable) {
    return {
      status: "real-runtime-not-run",
      reason: !preflight.runtime.available ? "llama-server-unavailable" : !preflight.model.available ? "model-unavailable" : "model-checksum-mismatch",
      preflight,
      baseUrl: null,
      health: null,
      serverLogSummary: null,
      listener: await listenerCheck(null),
      taxonomy: null,
    };
  }

  port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}/`;
  const stdoutPath = join(tmpdir(), `pfr-card-copy-diagnostics-${process.pid}-${port}.stdout.log`);
  const stderrPath = join(tmpdir(), `pfr-card-copy-diagnostics-${process.pid}-${port}.stderr.log`);
  const stdoutStream = createWriteStream(stdoutPath, { flags: "w" });
  const stderrStream = createWriteStream(stderrPath, { flags: "w" });
  const args = ["-m", modelPath, "--host", "127.0.0.1", "--port", String(port), "-c", "4096", "--no-webui", "--jinja"];
  const child = spawn(runtimePath, args, { stdio: ["ignore", "pipe", "pipe"] });
  child.stdout.pipe(stdoutStream);
  child.stderr.pipe(stderrStream);
  let serverLogSummary = null;
  let health = null;
  try {
    health = await waitForHealth(baseUrl, 90000);
    if (!health.ok) {
      return {
        status: "real-runtime-not-run",
        reason: `server-health-failed:${health.error}`,
        preflight,
        baseUrl,
        health,
        serverLogSummary: null,
        listener: null,
        taxonomy: null,
      };
    }
    const caseDiagnostics = await diagnoseCases(baseUrl);
    const taxonomy = aggregateDiagnostics(caseDiagnostics, isoNow());
    serverLogSummary = await summarizeTempLogs(stdoutPath, stderrPath);
    return {
      status: "ran",
      reason: null,
      preflight,
      baseUrl,
      health,
      serverLogSummary,
      listener: null,
      taxonomy,
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

async function privacyScan(paths) {
  const patterns = [
    ["raw_home_path", /\/Users\/[A-Za-z0-9._-]+|\/home\/[A-Za-z0-9._-]+/i],
    ["pi_session_path", /\.pi\/agent\/sessions/i],
    ["private_key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/i],
    ["bearer", /Bearer\s+[A-Za-z0-9._~+/=-]+/i],
    ["secret_assignment", /\b(?:API_KEY|TOKEN|SECRET|PASSWORD|PRIVATE_KEY)\s*=/i],
    ["chat_marker", new RegExp("<\\|im_start\\||raw session " + "transcript|prompt " + "text", "i")],
  ];
  const findings = [];
  for (const path of paths) {
    const text = await readFile(path, "utf8");
    for (const [name, pattern] of patterns) {
      const match = text.match(pattern);
      if (match) findings.push({ file: relative(repoRoot, path), pattern: name, match: match[0].slice(0, 80) });
    }
  }
  return { pass: findings.length === 0, scannedFiles: paths.length, forbiddenPatternCount: findings.length, findings };
}

async function artifactFiles() {
  const names = [
    "00-artifact-index.json",
    "01-failure-taxonomy.json",
    "02-runtime-provenance.json",
    "03-diagnostic-run-output.json",
    "04-source-side-effect-scan.json",
    "05-post-run-listener-check.txt",
  ];
  return names.map((name) => join(artifactDir, name));
}

async function main() {
  await mkdir(artifactDir, { recursive: true });
  const generatedAt = isoNow();
  const beforeFingerprints = await sourceFingerprints();
  const real = await runRealDiagnosticsIfAvailable();
  const listener = real.listener ?? await listenerCheck(real.baseUrl ? Number(new URL(real.baseUrl).port) : null);
  real.listener = listener;
  const afterFingerprints = await sourceFingerprints();
  const changedSources = beforeFingerprints.filter((before) => afterFingerprints.find((after) => after.path === before.path)?.sha256 !== before.sha256).map((item) => item.path);

  const taxonomy = real.taxonomy ?? {
    kind: "real-runtime-not-run",
    generatedAt,
    totalCases: cases.length,
    responseObservedCount: 0,
    productGatePassCount: 0,
    limitations: ["Real local runtime was not run, so field-level runtime diagnostics were not gathered."],
  };

  const runtimeProvenance = {
    status: real.status,
    reason: real.reason,
    runtime: real.preflight.runtime,
    model: real.preflight.model,
    baseUrl: real.baseUrl,
    loopbackOnly: real.baseUrl === null ? null : new URL(real.baseUrl).hostname === "127.0.0.1",
    hostedProviderUsed: false,
    automaticDownloadOrInstall: false,
    health: real.health,
    serverLogSummary: real.serverLogSummary,
  };

  const sourceSideEffect = {
    pass: changedSources.length === 0,
    checkedAt: isoNow(),
    changedSources,
    before: beforeFingerprints,
    after: afterFingerprints,
  };

  const runOutput = {
    generatedAt,
    realRuntimeStatus: { status: real.status, reason: real.reason },
    modelChecksumMatched: real.preflight.model.matchesExpected,
    productGatePassCount: taxonomy.productGatePassCount,
    responseObservedCount: taxonomy.responseObservedCount,
    fallbackReasons: taxonomy.fallbackReasons ?? {},
    topRepairTargets: summarizeTopRepairTargets(taxonomy),
    privacyBoundary: "Raw prompts, raw model responses, and raw server logs were not persisted by this harness.",
  };

  await writeFile(join(artifactDir, "01-failure-taxonomy.json"), `${JSON.stringify(taxonomy, null, 2)}\n`);
  await writeFile(join(artifactDir, "02-runtime-provenance.json"), `${JSON.stringify(runtimeProvenance, null, 2)}\n`);
  await writeFile(join(artifactDir, "03-diagnostic-run-output.json"), `${JSON.stringify(runOutput, null, 2)}\n`);
  await writeFile(join(artifactDir, "04-source-side-effect-scan.json"), `${JSON.stringify(sourceSideEffect, null, 2)}\n`);
  await writeFile(join(artifactDir, "05-post-run-listener-check.txt"), `${listener.checked ? `checked tcp port ${listener.port}\n${listener.output}\n` : `${listener.output}\n`}`);

  const index = {
    generatedAt,
    ticket: "ticket:20260602-flight-learn-card-copy-failure-diagnostics",
    corpus: {
      totalCases: cases.length,
      cases: cases.map((caseDef) => ({ caseId: caseDef.id, title: caseDef.title, coverage: caseDef.coverage, evidenceRefCount: caseDef.delta.evidenceRefs.length })),
    },
    artifacts: {
      failureTaxonomy: "01-failure-taxonomy.json",
      runtimeProvenance: "02-runtime-provenance.json",
      runOutput: "03-diagnostic-run-output.json",
      sourceSideEffectScan: "04-source-side-effect-scan.json",
      postRunListenerCheck: "05-post-run-listener-check.txt",
      artifactPrivacyScan: "06-artifact-privacy-scan.json",
      finalDiffCheck: "07-final-diff-check.txt",
      finalPrivacyScan: "08-final-privacy-scan.json",
      finalStatus: "09-final-status.txt",
    },
    nonClaims: [
      "Failure diagnostics do not prove operator comprehension.",
      "Failure diagnostics do not authorize weakening privacy, route/action, mutation, expected-behavior, evidence, or source-of-truth gates.",
      "Failure diagnostics do not start dogfood corpus/outcome collection.",
    ],
  };
  await writeFile(join(artifactDir, "00-artifact-index.json"), `${JSON.stringify(index, null, 2)}\n`);

  const artifactPrivacy = await privacyScan(await artifactFiles());
  await writeFile(join(artifactDir, "06-artifact-privacy-scan.json"), `${JSON.stringify(artifactPrivacy, null, 2)}\n`);

  console.log(JSON.stringify(runOutput, null, 2));
}

function summarizeTopRepairTargets(taxonomy) {
  if (!taxonomy || taxonomy.kind === "real-runtime-not-run") return ["real-runtime-not-run"];
  const targets = [];
  if ((taxonomy.fallbackReasons?.timeout ?? 0) > 0) targets.push("timeout-resource-envelope: shorten prompt or lower output burden before changing gates");
  if ((taxonomy.fieldSignalCounts?.["mutation-instruction-like"] ?? 0) > 0 || (taxonomy.fieldSignalCounts?.["imperative-action-like"] ?? 0) > 0) {
    targets.push("true action/mutation advice: keep fail-closed, improve prompt to avoid advice wording");
  }
  if ((taxonomy.fieldSignalCounts?.["internal-debug-like"] ?? 0) > 0) targets.push("internal-debug wording: improve prompt field language");
  if (taxonomy.fieldFailures?.some((item) => item.issueCategory === "expected-behavior-unsupported-or-invented")) targets.push("expected behavior invention: keep gate, add clearer omission rule");
  if (targets.length === 0) targets.push("inspect field taxonomy for schema/support repair target");
  return targets;
}

main().catch((error) => {
  console.error(error?.stack ?? error);
  process.exitCode = 1;
});
