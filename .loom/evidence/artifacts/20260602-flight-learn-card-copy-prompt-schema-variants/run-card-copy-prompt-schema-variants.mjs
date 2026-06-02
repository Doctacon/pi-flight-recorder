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
  buildLocalDiagnosisFactPacket,
  validateLocalDiagnosisPolishResponse,
} from "../../../../src/flight-learn-local-diagnosis-model.ts";
import { buildFlightLearnDiagnosisView } from "../../../../src/flight-learn-diagnosis.ts";

const artifactDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = process.cwd();
const expectedModelSha256 = "4524b3f997f0f06444e568d1f26e2efd69effa3218c7ad3047432fb171e42168";
const runtimePath = "/opt/homebrew/bin/llama-server";
const modelPath = join(homedir(), ".cache", "pi-flight-recorder", "bonsai", "Bonsai-4B-Q1_0.gguf");
const sourcePaths = [
  "src/flight-learn-local-diagnosis-model.ts",
  "src/flight-learn-llama-cpp-adapter.ts",
  "src/flight-learn-inbox.ts",
];
const allFields = ["headline", "whatHappened", "whyItMatters", "expectedBehavior", "whyThisWasFlagged", "evidenceSummary"];
const productTopLevelKeys = new Set(["schemaVersion", ...allFields]);
const variantTimeoutMs = 5000;

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

function factCitedDisplayFieldSchema(maxTextLength = 280) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["text", "factIds"],
    properties: {
      text: { type: "string", minLength: 1, maxLength: maxTextLength },
      factIds: {
        type: "array",
        minItems: 1,
        maxItems: 6,
        items: { type: "string", pattern: "^F[0-9]+$" },
      },
    },
  };
}

function whatHappenedSchema(maxSentences = 3, maxTextLength = 180) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["sentences"],
    properties: {
      sentences: {
        type: "array",
        minItems: 1,
        maxItems: maxSentences,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["text", "factIds"],
          properties: {
            text: { type: "string", minLength: 1, maxLength: maxTextLength },
            factIds: {
              type: "array",
              minItems: 1,
              maxItems: 6,
              items: { type: "string", pattern: "^F[0-9]+$" },
            },
          },
        },
      },
    },
  };
}

function variantSchema(properties) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["schemaVersion"],
    properties: {
      schemaVersion: { type: "integer", enum: [2] },
      ...properties,
    },
  };
}

const variants = [
  {
    id: "short-all-fields",
    schemaName: "flight_learn_card_copy_short_all_fields_v1",
    maxOutputTokens: 384,
    fields: allFields,
    description: "Shorter instructions with the same six product field jobs, explicit omit-if-not-improving and exact fact-ID rules.",
    diagnosticJustification: ["timeout-resource-envelope", "all-field-burden", "citation-robustness", "low-information-whatHappened"],
    schema: variantSchema({
      headline: { type: "string", minLength: 1, maxLength: 120 },
      whatHappened: whatHappenedSchema(3, 180),
      whyItMatters: { type: "string", minLength: 1, maxLength: 260 },
      expectedBehavior: { type: ["string", "null"], maxLength: 260 },
      whyThisWasFlagged: factCitedDisplayFieldSchema(280),
      evidenceSummary: factCitedDisplayFieldSchema(280),
    }),
    buildPrompt: buildShortAllFieldsPrompt,
  },
  {
    id: "core-four-fields",
    schemaName: "flight_learn_card_copy_core_four_fields_v1",
    maxOutputTokens: 288,
    fields: ["headline", "whatHappened", "whyItMatters", "expectedBehavior"],
    description: "Lower output burden focused on Problem, What happened, Why it matters, and Expected; flag/evidence summary are omitted by design.",
    diagnosticJustification: ["timeout-resource-envelope", "all-field-burden", "low-information-whatHappened"],
    schema: variantSchema({
      headline: { type: "string", minLength: 1, maxLength: 120 },
      whatHappened: whatHappenedSchema(2, 180),
      whyItMatters: { type: "string", minLength: 1, maxLength: 260 },
      expectedBehavior: { type: ["string", "null"], maxLength: 260 },
    }),
    buildPrompt: buildCoreFourPrompt,
  },
  {
    id: "flag-evidence-lite",
    schemaName: "flight_learn_card_copy_flag_evidence_lite_v1",
    maxOutputTokens: 224,
    fields: ["whatHappened", "whyThisWasFlagged", "evidenceSummary"],
    description: "Citation-focused lower-burden probe for Why this was flagged and Evidence summary, with optional one-sentence whatHappened only when useful.",
    diagnosticJustification: ["citation-robustness", "unknown-fact-id", "generated-evidence-fail-closed", "timeout-resource-envelope"],
    schema: variantSchema({
      whatHappened: whatHappenedSchema(1, 180),
      whyThisWasFlagged: factCitedDisplayFieldSchema(280),
      evidenceSummary: factCitedDisplayFieldSchema(280),
    }),
    buildPrompt: buildFlagEvidencePrompt,
  },
];

function factsText(packet, options = {}) {
  const facts = packet.facts.filter((fact) => {
    if (options.evidenceOnly) return fact.kind === "evidence-summary";
    return true;
  });
  return facts.map((fact) => `${fact.id} [${fact.kind}] ${fact.text}`).join("\n");
}

function compactPacketSummary(packet) {
  return JSON.stringify({
    expectedKnown: packet.deterministic.expectedBehavior !== null,
    facts: packet.facts.length,
    evidenceFacts: packet.facts.filter((fact) => fact.kind === "evidence-summary").length,
    signalFacts: packet.facts.filter((fact) => fact.kind === "signal").length,
  });
}

function commonRules(packet) {
  return [
    "Return JSON only. Use schemaVersion 2.",
    "Use only listed FACTS. Use exact F ids. If a field is not clearly supported or not an improvement, omit it.",
    "No routes, actions, commands, code/file/source edits, storage, artifacts, rules, prompts, scores, detector names, cluster ids, or record ids.",
    "Do not create or imply new evidence. Evidence summary only summarizes existing evidence-summary facts.",
    packet.deterministic.expectedBehavior === null
      ? "Expected behavior is unknown: omit expectedBehavior or return null. Do not infer it from reality, impact, signals, or evidence."
      : "Expected behavior may be included only from expected-behavior or delta-expectation facts.",
  ].join("\n");
}

function buildShortAllFieldsPrompt(packet) {
  return [
    "Local display copy helper for a Flight Learn card.",
    commonRules(packet),
    "Fields: headline string; whatHappened {sentences:[{text,factIds}]} with 1-3 concise sentences distinct from headline; whyItMatters string; expectedBehavior string|null; whyThisWasFlagged {text,factIds}; evidenceSummary {text,factIds}.",
    "whyThisWasFlagged may cite deterministic, delta, occurrence, signal, or evidence facts. evidenceSummary may cite evidence-summary facts only.",
    `SUMMARY ${compactPacketSummary(packet)}`,
    "FACTS",
    factsText(packet),
  ].join("\n");
}

function buildCoreFourPrompt(packet) {
  return [
    "Local display copy helper for core Flight Learn fields.",
    commonRules(packet),
    "Return only core fields you can improve: headline string, whatHappened {sentences:[{text,factIds}]} with 1-2 concise sentences, whyItMatters string, expectedBehavior string|null. Do not include whyThisWasFlagged or evidenceSummary.",
    "whatHappened should explain observed pattern or uncertainty; omit it if it would repeat the headline.",
    `SUMMARY ${compactPacketSummary(packet)}`,
    "FACTS",
    factsText(packet),
  ].join("\n");
}

function buildFlagEvidencePrompt(packet) {
  return [
    "Local display copy helper for flag/evidence fields only.",
    "Return JSON only. Use schemaVersion 2. Use exact F ids. Omit unsupported fields.",
    "Allowed fields: whyThisWasFlagged {text,factIds}, evidenceSummary {text,factIds}, optional whatHappened {sentences:[{text,factIds}]} with one sentence if it improves the card.",
    "whyThisWasFlagged explains why existing local facts flagged the issue. evidenceSummary summarizes only evidence-summary facts. Do not invent evidence or cite unknown ids.",
    "No routes, actions, commands, source/storage/artifact/rule edits, scores, detector names, cluster ids, or record ids.",
    `SUMMARY ${compactPacketSummary(packet)}`,
    "FACTS",
    factsText(packet),
  ].join("\n");
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
  hash.update(await readFile(path));
  return hash.digest("hex");
}

async function commandOutput(command, args, options = {}) {
  return await new Promise((resolve) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"], ...options });
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
      matchesExpected: modelSha256 === expectedModelSha256,
    },
    runnable: runtimeAvailable && modelAvailable && modelSha256 === expectedModelSha256,
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

async function postChatCompletion(baseUrl, variant, prompt, signal) {
  const payload = {
    model: "Bonsai-4B-Q1_0",
    messages: [{ role: "user", content: prompt }],
    stream: false,
    temperature: 0.1,
    max_tokens: variant.maxOutputTokens,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: variant.schemaName,
        strict: true,
        schema: variant.schema,
      },
    },
  };
  const response = await fetch(`${baseUrl}v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("invalid transport content");
  if (content.length > 20_000) throw new Error("response too large");
  return content;
}

async function callVariant(baseUrl, variant, prompt) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), variantTimeoutMs);
  const started = Date.now();
  try {
    const raw = await postChatCompletion(baseUrl, variant, prompt, controller.signal);
    return { kind: "value", raw, latencyMs: Date.now() - started };
  } catch (error) {
    const message = String(error?.name ?? error?.message ?? error);
    const timeoutLike = message.includes("AbortError") || message.toLowerCase().includes("abort") || message.toLowerCase().includes("timeout");
    return { kind: timeoutLike ? "timeout" : "error", errorCategory: timeoutLike ? "timeout" : sanitizePreview(message), latencyMs: Date.now() - started };
  } finally {
    clearTimeout(timeout);
  }
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

function shapeOf(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
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
    if (/\b(?:route|routing|choose|select)\b[^.!?]{0,80}\b(?:artifact|candidate|rule|path|option)\b/i.test(text)) signals.add("route-authority-like");
    if (/\b(?:schemaVersion|factIds|JSON|delta|signals|bounds|confidence|cluster|detector|record ID)\b/i.test(text)) signals.add("internal-debug-like");
  }
  return Array.from(signals).sort();
}

function nonNegotiableSignals(signals) {
  const nonNegotiable = new Set([
    "privacy-path-like",
    "secret-like",
    "prompt-or-transcript-marker",
    "raw-command-like",
    "mutation-instruction-like",
    "imperative-action-like",
    "generated-evidence-claim-like",
    "route-authority-like",
  ]);
  return signals.filter((signal) => nonNegotiable.has(signal));
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
      acceptedFields: Object.keys(result.value).sort(),
    };
  }
  return {
    ok: false,
    reason: result.reason,
    issueCategory: safeIssueCategory(result.issue, result.reason),
    issue: result.issue,
    usefulFieldCount: 0,
    hasNarrativeCandidate: false,
    acceptedFields: [],
  };
}

function validateVariantShape(parsed, variant) {
  if (!isPlainObject(parsed)) return { ok: false, issueCategory: "schema-shape", issue: "response was not a JSON object" };
  if (parsed.schemaVersion !== 2) return { ok: false, issueCategory: "schema-shape", issue: "schemaVersion was not 2" };
  const allowed = new Set(["schemaVersion", ...variant.fields]);
  const extra = Object.keys(parsed).filter((key) => !allowed.has(key));
  if (extra.length > 0) return { ok: false, issueCategory: "schema-shape", issue: "response included unsupported top-level fields", extraTopLevelKeys: extra.map(safeKey) };
  for (const field of variant.fields) {
    if (!Object.prototype.hasOwnProperty.call(parsed, field)) continue;
    const value = parsed[field];
    if (field === "whatHappened") {
      if (!isPlainObject(value) || !Array.isArray(value.sentences)) return { ok: false, issueCategory: "schema-shape", issue: "whatHappened shape was invalid" };
    } else if (field === "whyThisWasFlagged" || field === "evidenceSummary") {
      if (!isPlainObject(value) || typeof value.text !== "string" || !Array.isArray(value.factIds)) return { ok: false, issueCategory: "schema-shape", issue: `${field} shape was invalid` };
    } else if (field === "expectedBehavior") {
      if (value !== null && typeof value !== "string") return { ok: false, issueCategory: "schema-shape", issue: "expectedBehavior shape was invalid" };
    } else if (typeof value !== "string") {
      return { ok: false, issueCategory: "schema-shape", issue: `${field} shape was invalid` };
    }
  }
  return { ok: true, issueCategory: null, issue: null };
}

function safeKey(key) {
  return /^[A-Za-z0-9._-]{1,64}$/.test(key) ? key : "<redacted-key>";
}

function diagnoseField(field, value, context) {
  const raw = JSON.stringify({ schemaVersion: 2, [field]: value });
  const validation = validateLocalDiagnosisPolishResponse(raw, context);
  const factIds = extractFactIds(value);
  const factById = new Map(context.factPacket.facts.map((fact) => [fact.id, fact]));
  const unknownFactIdCount = factIds.filter((id) => !factById.has(id)).length;
  const citedFactKinds = Array.from(new Set(factIds.map((id) => factById.get(id)?.kind).filter(Boolean))).sort();
  const textSignalCategories = classifyTextSignals(value);
  return {
    field,
    present: true,
    rawShape: shapeOf(value),
    textLengthTotal: collectTexts(value).reduce((sum, text) => sum + text.length, 0),
    factIdCount: factIds.length,
    unknownFactIdCount,
    citedFactKinds,
    textSignalCategories,
    nonNegotiableSignalCategories: nonNegotiableSignals(textSignalCategories),
    validation: validationSummary(validation),
  };
}

function productResponseFromParsed(parsed) {
  if (!isPlainObject(parsed)) return null;
  const product = { schemaVersion: 2 };
  for (const field of allFields) {
    if (Object.prototype.hasOwnProperty.call(parsed, field)) product[field] = parsed[field];
  }
  return product;
}

function diagnoseParsedResponse(raw, variant, context) {
  const parsed = jsonParse(raw);
  if (!parsed.ok) {
    return {
      parseValid: false,
      schemaValid: false,
      variantShape: { ok: false, issueCategory: "schema-shape", issue: "provider response was not valid JSON" },
      topLevelKeys: [],
      extraTopLevelKeys: [],
      fieldDiagnostics: allFields.map((field) => ({ field, present: false })),
      productValidation: { ok: false, reason: "malformed-json", issueCategory: "schema-shape", issue: "provider response was not valid JSON", usefulFieldCount: 0, acceptedFields: [] },
      productGateEquivalentPass: false,
      unsafeAccepted: false,
    };
  }
  const variantShape = validateVariantShape(parsed.value, variant);
  const productResponse = productResponseFromParsed(parsed.value);
  const productRaw = productResponse ? JSON.stringify(productResponse) : "{}";
  const productValidation = validateLocalDiagnosisPolishResponse(productRaw, context);
  const fieldDiagnostics = allFields.map((field) => Object.prototype.hasOwnProperty.call(parsed.value, field)
    ? diagnoseField(field, parsed.value[field], context)
    : { field, present: false });
  const nonNegotiableAcceptedSignals = fieldDiagnostics.flatMap((field) => field.present ? field.nonNegotiableSignalCategories ?? [] : []);
  const unknownFactIdCount = fieldDiagnostics.reduce((sum, field) => sum + (field.present ? field.unknownFactIdCount ?? 0 : 0), 0);
  const safetyClean = nonNegotiableAcceptedSignals.length === 0 && unknownFactIdCount === 0;
  const productValidationSummary = validationSummary(productValidation);
  const productGateEquivalentPass = productValidationSummary.ok && safetyClean;
  return {
    parseValid: true,
    schemaValid: variantShape.ok,
    variantShape,
    topLevelKeys: Object.keys(parsed.value).map(safeKey),
    extraTopLevelKeys: Object.keys(parsed.value).filter((key) => !productTopLevelKeys.has(key)).map(safeKey),
    fieldDiagnostics,
    productValidation: productValidationSummary,
    productGateEquivalentPass,
    unsafeAccepted: productValidationSummary.ok && !safetyClean,
    unsafeAcceptedSignals: Array.from(new Set(nonNegotiableAcceptedSignals)).sort(),
    unknownFactIdCount,
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

async function runVariants(baseUrl) {
  const results = [];
  for (const variant of variants) {
    for (const caseDef of cases) {
      const deterministicView = buildFlightLearnDiagnosisView({ delta: caseDef.delta, signals: caseDef.signals });
      const factPacket = buildLocalDiagnosisFactPacket({ delta: caseDef.delta, signals: caseDef.signals }, deterministicView);
      const context = { factPacket, deterministicView };
      const prompt = variant.buildPrompt(factPacket);
      const call = await callVariant(baseUrl, variant, prompt);
      const responseDiagnostics = call.kind === "value" ? diagnoseParsedResponse(call.raw, variant, context) : null;
      results.push({
        variantId: variant.id,
        caseId: caseDef.id,
        title: caseDef.title,
        coverage: caseDef.coverage,
        promptLength: prompt.length,
        maxOutputTokens: variant.maxOutputTokens,
        latencyMs: call.latencyMs,
        outcome: call.kind,
        providerErrorCategory: call.errorCategory ?? null,
        responseObserved: call.kind === "value",
        parseValid: responseDiagnostics?.parseValid ?? false,
        schemaValid: responseDiagnostics?.schemaValid ?? false,
        productValidationPass: responseDiagnostics?.productValidation?.ok ?? false,
        productGateEquivalentPass: responseDiagnostics?.productGateEquivalentPass ?? false,
        unsafeAccepted: responseDiagnostics?.unsafeAccepted ?? false,
        fallbackCategory: fallbackCategory(call, responseDiagnostics),
        fieldPresence: fieldPresence(responseDiagnostics),
        acceptedFields: responseDiagnostics?.productValidation?.acceptedFields ?? [],
        responseDiagnostics,
      });
    }
  }
  return results;
}

function fallbackCategory(call, diagnostics) {
  if (call.kind === "timeout") return "timeout-resource-envelope";
  if (call.kind === "error") return "provider-error";
  if (!diagnostics) return "no-response";
  if (!diagnostics.parseValid) return "malformed-json";
  if (!diagnostics.schemaValid) return diagnostics.variantShape?.issueCategory ?? "schema-shape";
  if (diagnostics.unsafeAccepted) return "unsafe-accepted-rejected-by-experiment";
  if (!diagnostics.productValidation.ok) return diagnostics.productValidation.issueCategory ?? diagnostics.productValidation.reason ?? "product-validation-failed";
  if (!diagnostics.productGateEquivalentPass) return "safety-clean-failed";
  return null;
}

function fieldPresence(diagnostics) {
  const presence = {};
  for (const field of allFields) presence[field] = false;
  if (!diagnostics) return presence;
  for (const field of diagnostics.fieldDiagnostics) {
    if (field.present) presence[field.field] = true;
  }
  return presence;
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

function aggregateVariant(results, variant) {
  const variantResults = results.filter((result) => result.variantId === variant.id);
  const responseObserved = variantResults.filter((result) => result.responseObserved);
  const fieldCoverage = {};
  const acceptedFieldCoverage = {};
  const fieldValidationCounts = {};
  const fieldSignalCounts = {};
  for (const field of allFields) {
    fieldCoverage[field] = variantResults.filter((result) => result.fieldPresence[field]).length;
    acceptedFieldCoverage[field] = variantResults.filter((result) => result.acceptedFields.includes(field)).length;
  }
  for (const result of responseObserved) {
    for (const field of result.responseDiagnostics?.fieldDiagnostics ?? []) {
      if (!field.present) continue;
      const key = field.validation?.ok ? "ok" : field.validation?.issueCategory ?? field.validation?.reason ?? "unknown";
      fieldValidationCounts[`${field.field}:${key}`] = (fieldValidationCounts[`${field.field}:${key}`] ?? 0) + 1;
      for (const signal of field.textSignalCategories ?? []) {
        fieldSignalCounts[signal] = (fieldSignalCounts[signal] ?? 0) + 1;
      }
    }
  }
  return {
    variantId: variant.id,
    description: variant.description,
    diagnosticJustification: variant.diagnosticJustification,
    fieldsRequested: variant.fields,
    maxOutputTokens: variant.maxOutputTokens,
    totalCases: variantResults.length,
    responseObservedCount: responseObserved.length,
    parseValidCount: variantResults.filter((result) => result.parseValid).length,
    schemaValidCount: variantResults.filter((result) => result.schemaValid).length,
    productValidationPassCount: variantResults.filter((result) => result.productValidationPass).length,
    productGateEquivalentPassCount: variantResults.filter((result) => result.productGateEquivalentPass).length,
    productFallbackCount: variantResults.filter((result) => !result.productGateEquivalentPass).length,
    unsafeAcceptedCount: variantResults.filter((result) => result.unsafeAccepted).length,
    timeoutCount: variantResults.filter((result) => result.outcome === "timeout").length,
    providerErrorCount: variantResults.filter((result) => result.outcome === "error").length,
    fallbackCategories: countBy(variantResults, (result) => result.fallbackCategory),
    fieldCoverage,
    acceptedFieldCoverage,
    fieldValidationCounts,
    fieldSignalCounts,
    latencyMs: latencySummary(variantResults.map((result) => result.latencyMs)),
    promptLengthChars: latencySummary(variantResults.map((result) => result.promptLength)),
    cases: variantResults.map(summarizeCaseResult),
  };
}

function summarizeCaseResult(result) {
  return {
    variantId: result.variantId,
    caseId: result.caseId,
    title: result.title,
    coverage: result.coverage,
    promptLength: result.promptLength,
    maxOutputTokens: result.maxOutputTokens,
    latencyMs: result.latencyMs,
    outcome: result.outcome,
    responseObserved: result.responseObserved,
    parseValid: result.parseValid,
    schemaValid: result.schemaValid,
    productValidationPass: result.productValidationPass,
    productGateEquivalentPass: result.productGateEquivalentPass,
    unsafeAccepted: result.unsafeAccepted,
    fallbackCategory: result.fallbackCategory,
    fieldPresence: result.fieldPresence,
    acceptedFields: result.acceptedFields,
    providerErrorCategory: result.providerErrorCategory,
    fieldFailures: (result.responseDiagnostics?.fieldDiagnostics ?? [])
      .filter((field) => field.present && field.validation && !field.validation.ok)
      .map((field) => ({
        field: field.field,
        issueCategory: field.validation.issueCategory,
        reason: field.validation.reason,
        textSignalCategories: field.textSignalCategories,
        unknownFactIdCount: field.unknownFactIdCount,
        citedFactKinds: field.citedFactKinds,
      })),
    unsafeAcceptedSignals: result.responseDiagnostics?.unsafeAcceptedSignals ?? [],
  };
}

function chooseRecommendation(summaries) {
  const ranked = [...summaries].sort((a, b) => {
    if (b.productGateEquivalentPassCount !== a.productGateEquivalentPassCount) return b.productGateEquivalentPassCount - a.productGateEquivalentPassCount;
    if (a.unsafeAcceptedCount !== b.unsafeAcceptedCount) return a.unsafeAcceptedCount - b.unsafeAcceptedCount;
    return a.timeoutCount - b.timeoutCount;
  });
  const best = ranked[0];
  const safeEnough = best && best.unsafeAcceptedCount === 0;
  if (best && safeEnough && best.productGateEquivalentPassCount >= 5) {
    return {
      recommendation: "integrate selected variant",
      selectedVariant: best.variantId,
      rationale: `${best.variantId} produced ${best.productGateEquivalentPassCount}/8 product-gate-equivalent passes with zero unsafe accepted outputs. It is strong enough to consider a narrow product repair ticket, followed by repaired runtime replay before comprehension validation.`,
      threshold: "Integrate only if >=5/8 product-gate-equivalent passes and unsafeAcceptedCount=0.",
    };
  }
  if (best && best.productGateEquivalentPassCount > 0 && safeEnough) {
    return {
      recommendation: "no-go same-model path for product repair from these variants",
      selectedVariant: best.variantId,
      rationale: `${best.variantId} improved on the 0/8 baseline with ${best.productGateEquivalentPassCount}/8 passes, but did not reach the >=5/8 threshold needed to justify product integration. Treat this as evidence for further operator decision or a narrower follow-up experiment, not source repair.`,
      threshold: "Below >=5/8 safe passes, do not integrate into product source.",
    };
  }
  return {
    recommendation: "no-go same-model path for current variants",
    selectedVariant: best?.variantId ?? null,
    rationale: best ? `Best variant ${best.variantId} produced ${best.productGateEquivalentPassCount}/8 product-gate-equivalent passes with ${best.unsafeAcceptedCount} unsafe accepted outputs.` : "No variant summary was available.",
    threshold: "No integration without safe product-gate-equivalent improvement.",
  };
}

function buildVariantMatrix() {
  return variants.map((variant) => ({
    variantId: variant.id,
    schemaName: variant.schemaName,
    description: variant.description,
    fieldsRequested: variant.fields,
    maxOutputTokens: variant.maxOutputTokens,
    diagnosticJustification: variant.diagnosticJustification,
    productCompatibleMapping: "Variant output maps to schemaVersion 2 product validator shape; omitted fields remain omitted.",
    nonGoals: ["no product source edits", "no gate relaxation", "no new model/runtime"],
  }));
}

function displayShapeLines(summary, caseResult) {
  const lines = [
    `Variant: ${summary.variantId}`,
    `Case: ${caseResult.caseId}`,
    `Product-gate-equivalent pass: ${caseResult.productGateEquivalentPass}`,
    `Fallback category: ${caseResult.fallbackCategory ?? "none"}`,
    "Display field shape (model text omitted; no raw model output persisted):",
  ];
  for (const field of allFields) {
    const present = caseResult.fieldPresence[field];
    const accepted = caseResult.acceptedFields.includes(field);
    lines.push(`- ${field}: ${present ? "present" : "omitted"}${accepted ? ", product-validated" : ""}`);
  }
  lines.push("Evidence remains deterministic and inspectable; this artifact records shape only.");
  return `${lines.join("\n")}\n`;
}

async function writeDisplayShapeArtifacts(summaries) {
  const written = [];
  for (const summary of summaries) {
    const passCase = summary.cases.find((item) => item.productGateEquivalentPass) ?? summary.cases[0];
    if (!passCase) continue;
    const fileName = `display-shape-${summary.variantId}-${passCase.caseId}.txt`;
    await writeFile(join(artifactDir, fileName), displayShapeLines(summary, passCase));
    written.push(fileName);
  }
  return written;
}

async function runRealVariantsIfAvailable() {
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
      results: [],
    };
  }

  port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}/`;
  const stdoutPath = join(tmpdir(), `pfr-card-copy-variants-${process.pid}-${port}.stdout.log`);
  const stderrPath = join(tmpdir(), `pfr-card-copy-variants-${process.pid}-${port}.stderr.log`);
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
        results: [],
      };
    }
    const results = await runVariants(baseUrl);
    serverLogSummary = await summarizeTempLogs(stdoutPath, stderrPath);
    return {
      status: "ran",
      reason: null,
      preflight,
      baseUrl,
      health,
      serverLogSummary,
      listener: null,
      results,
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

async function artifactPrivacyFiles(displayShapeFiles = []) {
  const names = [
    "00-artifact-index.json",
    "01-variant-matrix.json",
    "02-variant-summary.json",
    "03-variant-results.json",
    "04-runtime-provenance.json",
    "05-source-side-effect-scan.json",
    "06-post-run-listener-check.txt",
    "07-variant-run-output.json",
    ...displayShapeFiles,
  ];
  return names.map((name) => join(artifactDir, name));
}

async function main() {
  await mkdir(artifactDir, { recursive: true });
  const generatedAt = isoNow();
  const beforeFingerprints = await sourceFingerprints();
  const real = await runRealVariantsIfAvailable();
  const listener = real.listener ?? await listenerCheck(real.baseUrl ? Number(new URL(real.baseUrl).port) : null);
  real.listener = listener;
  const afterFingerprints = await sourceFingerprints();
  const changedSources = beforeFingerprints.filter((before) => afterFingerprints.find((after) => after.path === before.path)?.sha256 !== before.sha256).map((item) => item.path);

  const variantSummaries = variants.map((variant) => aggregateVariant(real.results, variant));
  const recommendation = chooseRecommendation(variantSummaries);
  const displayShapeFiles = await writeDisplayShapeArtifacts(variantSummaries);

  const variantMatrix = {
    generatedAt,
    diagnosticEvidence: "evidence:20260602-flight-learn-card-copy-failure-diagnostics",
    baseline: {
      productGatePassCount: 0,
      cases: 8,
      dominantFailures: ["timeout-resource-envelope", "unsafe-output", "citation robustness", "low-information whatHappened"],
    },
    variants: buildVariantMatrix(),
  };

  const summary = {
    kind: "real-bonsai-card-copy-prompt-schema-variants",
    generatedAt,
    totalVariants: variants.length,
    totalCasesPerVariant: cases.length,
    realRuntimeStatus: real.status,
    recommendation,
    aggregate: variantSummaries,
    nonClaims: [
      "Variant success is not operator comprehension.",
      "Artifact-local variant success is not product source repair.",
      "Schema validity alone is not product-gated usefulness.",
      "No dogfood corpus or classifier collection is authorized by this run.",
    ],
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
    telemetryUsed: false,
    customRuntimeForkUsed: false,
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
    recommendation: recommendation.recommendation,
    selectedVariant: recommendation.selectedVariant,
    variantPassCounts: Object.fromEntries(variantSummaries.map((summary) => [summary.variantId, summary.productGateEquivalentPassCount])),
    unsafeAcceptedCounts: Object.fromEntries(variantSummaries.map((summary) => [summary.variantId, summary.unsafeAcceptedCount])),
    privacyBoundary: "Raw prompts, raw model responses, and raw server logs were not persisted by this harness.",
  };

  const index = {
    generatedAt,
    ticket: "ticket:20260602-flight-learn-card-copy-prompt-schema-variants",
    corpus: {
      totalCases: cases.length,
      cases: cases.map((caseDef) => ({ caseId: caseDef.id, title: caseDef.title, coverage: caseDef.coverage, evidenceRefCount: caseDef.delta.evidenceRefs.length })),
    },
    artifacts: {
      variantMatrix: "01-variant-matrix.json",
      variantSummary: "02-variant-summary.json",
      variantResults: "03-variant-results.json",
      runtimeProvenance: "04-runtime-provenance.json",
      sourceSideEffectScan: "05-source-side-effect-scan.json",
      postRunListenerCheck: "06-post-run-listener-check.txt",
      runOutput: "07-variant-run-output.json",
      artifactPrivacyScan: "08-artifact-privacy-scan.json",
      harnessSyntaxCheck: "09-harness-syntax-check.txt",
      finalDiffCheck: "10-final-diff-check.txt",
      finalPrivacyScan: "11-final-privacy-scan.json",
      finalStatus: "12-final-status.txt",
      displayShapeFiles,
    },
    nonClaims: summary.nonClaims,
  };

  await writeFile(join(artifactDir, "00-artifact-index.json"), `${JSON.stringify(index, null, 2)}\n`);
  await writeFile(join(artifactDir, "01-variant-matrix.json"), `${JSON.stringify(variantMatrix, null, 2)}\n`);
  await writeFile(join(artifactDir, "02-variant-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  await writeFile(join(artifactDir, "03-variant-results.json"), `${JSON.stringify(real.results.map(summarizeCaseResult), null, 2)}\n`);
  await writeFile(join(artifactDir, "04-runtime-provenance.json"), `${JSON.stringify(runtimeProvenance, null, 2)}\n`);
  await writeFile(join(artifactDir, "05-source-side-effect-scan.json"), `${JSON.stringify(sourceSideEffect, null, 2)}\n`);
  await writeFile(join(artifactDir, "06-post-run-listener-check.txt"), `${listener.checked ? `checked tcp port ${listener.port}\n${listener.output}\n` : `${listener.output}\n`}`);
  await writeFile(join(artifactDir, "07-variant-run-output.json"), `${JSON.stringify(runOutput, null, 2)}\n`);

  const artifactPrivacy = await privacyScan(await artifactPrivacyFiles(displayShapeFiles));
  await writeFile(join(artifactDir, "08-artifact-privacy-scan.json"), `${JSON.stringify(artifactPrivacy, null, 2)}\n`);

  console.log(JSON.stringify(runOutput, null, 2));
}

main().catch((error) => {
  console.error(error?.stack ?? error);
  process.exitCode = 1;
});
