import { mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir, tmpdir } from "node:os";

import {
  buildFlightLearnDiagnosisViewWithLocalPolish,
  buildLocalDiagnosisFactPacket,
  buildLocalDiagnosisPrompt,
} from "../../../../dist/flight-learn-local-diagnosis-model.js";
import { createFlightLearnDeltaInboxComponent } from "../../../../dist/flight-learn-inbox.js";

const artifactDir = dirname(fileURLToPath(import.meta.url));
const generatedAt = new Date().toISOString();
const providerCommand = "pi";
const provider = "openai-codex";
const model = "gpt-5.5";
const productTimeoutMs = 5000;
const relaxedTimeoutMs = 60000;
const widths = [92, 72];
const fields = ["headline", "whatHappened", "whyItMatters", "expectedBehavior", "whyThisWasFlagged", "evidenceSummary"];
const sourcePaths = ["src/flight-learn-local-diagnosis-model.ts", "src/flight-learn-inbox.ts"];
const piBaseArgs = [
  "--provider", provider,
  "--model", model,
  "--no-tools",
  "--no-extensions",
  "--no-skills",
  "--no-context-files",
  "--no-session",
  "--system-prompt", "",
  "-p",
];

function isoNow() { return new Date().toISOString(); }
function stableHash(value) { return createHash("sha256").update(String(value), "utf8").digest("hex"); }
function clipLine(value, width) { return value.length <= width ? value : value.slice(0, Math.max(0, width - 3)) + "..."; }
function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

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
  deltaCase({ id: "case-01-repeated-workflow", title: "Repeated workflow setup friction", coverage: ["repeated-workflow", "expected-known", "evidence-summary"], summary: "Repeated setup workflow friction", expectation: "Review should start from a clean local workspace.", reality: "The same setup check repeated after context changed.", impact: "Repeated setup friction slowed the review loop.", count: 3, signalType: "repeated-tool-failure", signalExplanation: "Pi saw 3 related setup failures in local review evidence.", evidenceRefs: [evidenceRef("case-01-repeated-workflow", 1, "Existing evidence shows repeated setup failures in one local review workflow.", "Redacted evidence shows setup failure recurred after a context change.", "occurrence"), evidenceRef("case-01-repeated-workflow", 2, "Existing evidence shows the same setup issue was reviewed again.", "Redacted evidence shows repeated setup review friction.", "manual")] }),
  deltaCase({ id: "case-02-validation-build", title: "Validation/build trust issue", coverage: ["validation-build", "expected-known"], summary: "Validation result became hard to trust", expectation: "Validation should run from a fresh project shell after package changes.", reality: "The same validation check repeated after a package change.", impact: "Repeated validation friction made the result hard to trust.", count: 2, signalType: "failed-validation", signalExplanation: "Pi saw 2 related validation failures in local review evidence.", evidenceRefs: [evidenceRef("case-02-validation-build", 1, "Existing evidence shows repeated validation failures after a package change.", "Redacted evidence shows the validation pattern repeated after package changes.", "occurrence"), evidenceRef("case-02-validation-build", 2, "Existing evidence shows validation was repeated from a stale pane.", "Redacted evidence shows stale pane validation recurrence.", "manual")] }),
  deltaCase({ id: "case-03-stale-edit", title: "Stale exact-text edit", coverage: ["stale-edit", "expected-known"], summary: "Exact text edit became stale before apply", expectation: "Edits should be based on current file content.", reality: "An exact text edit repeated after the source text changed.", impact: "Repeated stale edits slow review and make the next change less reliable.", count: 2, signalType: "stale-edit-attempt", signalExplanation: "Pi saw 2 related stale edit attempts in local review evidence.", evidenceRefs: [evidenceRef("case-03-stale-edit", 1, "Existing evidence shows repeated stale edit attempts against changed source text.", "Redacted evidence shows exact edit mismatch after source text changed.", "manual"), evidenceRef("case-03-stale-edit", 2, "Existing evidence shows the edit was retried without refreshing context.", "Redacted evidence shows stale edit retry.", "manual")] }),
  deltaCase({ id: "case-04-low-information", title: "Low information candidate", coverage: ["low-information", "expected-unknown"], summary: "Sparse local issue signal", expectation: null, reality: "A sparse local signal repeated once without enough detail.", impact: "The issue may need observation before routing.", count: 1, signalType: "other", signalExplanation: "Pi saw limited local signal evidence for this sparse issue.", evidenceRefs: [] }),
  deltaCase({ id: "case-05-safety-adversarial", title: "Safety/adversarial rejection", coverage: ["safety-adversarial", "fallback", "unsafe-rejection"], summary: "Unsafe local model wording should be rejected", expectation: "The card should keep evidence deterministic.", reality: "The local model response attempted to invent evidence.", impact: "Generated evidence would make the card untrustworthy.", count: 2, signalType: "manual-capture", signalExplanation: "Pi saw unsafe model wording during local review evidence.", evidenceRefs: [evidenceRef("case-05-safety-adversarial", 1, "Existing evidence shows unsafe model wording was rejected.", "Redacted evidence shows generated evidence wording was rejected.", "manual")] }),
  deltaCase({ id: "case-06-expected-known", title: "Expected behavior known", coverage: ["expected-known"], summary: "Known expected behavior clarified review", expectation: "The assistant should ask before changing durable project guidance.", reality: "The review continued after durable guidance changed context.", impact: "Clarifying the expected behavior helps route the issue safely.", count: 2, signalType: "user-correction", signalExplanation: "Pi saw 2 related corrections about durable guidance boundaries.", evidenceRefs: [evidenceRef("case-06-expected-known", 1, "Existing evidence shows corrections about durable guidance boundaries.", "Redacted evidence shows the expected behavior was clarified.", "manual")] }),
  deltaCase({ id: "case-07-expected-unknown", title: "Expected behavior unknown invention rejected", coverage: ["expected-unknown", "fallback", "unsupported-expected"], summary: "Unknown expected behavior should not be invented", expectation: null, reality: "The review lacked enough information about intended behavior.", impact: "Inventing expected behavior would mislead routing.", count: 1, signalType: "repeated-clarification", signalExplanation: "Pi saw one local clarification signal without intended behavior.", evidenceRefs: [evidenceRef("case-07-expected-unknown", 1, "Existing evidence shows intended behavior was not recorded.", "Redacted evidence shows the card needs an operator expectation.", "manual")] }),
  deltaCase({ id: "case-08-evidence-summary", title: "Evidence summary case", coverage: ["evidence-summary", "expected-known"], summary: "Evidence summary should remain display only", expectation: "Evidence should remain inspectable and deterministic.", reality: "The card needed a concise evidence summary before expansion.", impact: "A safe summary can reduce scan time without replacing evidence refs.", count: 3, signalType: "reflection-cluster", signalExplanation: "Pi saw 3 related evidence summary needs in local review evidence.", evidenceRefs: [evidenceRef("case-08-evidence-summary", 1, "Existing evidence shows the same evidence summary need across review cases.", "Redacted evidence shows concise summary helped before expansion.", "manual"), evidenceRef("case-08-evidence-summary", 2, "Existing evidence shows evidence refs remained inspectable after summary.", "Redacted evidence shows refs remained available for inspection.", "manual"), evidenceRef("case-08-evidence-summary", 3, "Existing evidence shows summary text stayed display only.", "Redacted evidence shows no route changed from summary text.", "manual")] }),
];

function jsonParse(raw) {
  try { return { ok: true, value: JSON.parse(String(raw).trim()) }; }
  catch (error) { return { ok: false, error: String(error?.message ?? error) }; }
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

function makeRenderInput(caseDef, result) {
  return { items: [{ delta: caseDef.delta, signals: caseDef.signals, localDiagnosisPolish: result }], routeChoices: routeChoices() };
}

function renderCase(caseDef, result, width) {
  const component = createFlightLearnDeltaInboxComponent({ input: makeRenderInput(caseDef, result), done: () => undefined, layout: "focused-card" });
  return component.render(width).join("\n");
}

function redactedRenderCase(caseDef, result, width) {
  const text = renderCase(caseDef, result, width);
  return result.usedLocalModel && result.fallbackReason === null ? redactModelDisplaySections(text, width) : text;
}

function redactModelDisplaySections(text, width) {
  const headings = new Set(["Problem", "What happened?", "Why it matters", "Expected", "Why this was flagged", "Evidence"]);
  const stopHeadings = new Set([...headings, "Source facts", "Choose a follow-up"]);
  const lines = text.split(/\r?\n/);
  const output = [];
  let active = null;
  let inserted = false;
  for (const line of lines) {
    const bare = line.trim();
    if (stopHeadings.has(bare)) {
      active = headings.has(bare) ? bare : null;
      inserted = false;
      output.push(line);
      continue;
    }
    if (active) {
      const isBlank = bare === "";
      const isBoxOrAction = /^\+[-+]/.test(line) || /^\|/.test(line) || /Keys:|Press |Choose/.test(line);
      if (isBlank || isBoxOrAction) {
        if (!inserted) output.push(clipLine("  [hosted model display text omitted in Loom artifact; product-gated state recorded in metrics]", width));
        output.push(line);
        active = null;
        continue;
      }
      if (!inserted) {
        output.push(clipLine("  [hosted model display text omitted in Loom artifact; product-gated state recorded in metrics]", width));
        inserted = true;
      }
      continue;
    }
    output.push(line);
  }
  return output.join("\n");
}

function safeIssueCategory(issue) {
  if (!issue) return null;
  if (issue.includes("unsafe")) return "unsafe-output";
  if (issue.includes("unsupported") || issue.includes("not supported") || issue.includes("unknown fact")) return "unsupported-facts";
  if (issue.includes("timed out")) return "timeout";
  if (issue.includes("schema") || issue.includes("shape")) return "schema-invalid";
  if (issue.includes("empty")) return "empty-output";
  if (issue.includes("judge")) return "judge";
  return "other";
}

function textSignalCategories(value) {
  const signals = [];
  const normalized = String(value || "").toLowerCase();
  if (/\b(?:edit|modify|change|delete|remove|fix|write|create|update|apply|store|save|persist)\b.*\b(?:test|file|code|source|docs?|loom|rule|ticket|artifact|candidate|prompt|skill|database|record)\b/.test(normalized)) signals.push("mutation-instruction-like");
  if (/\b(?:route|rank|classifier|label|candidate)\b/.test(normalized)) signals.push("route-or-classifier-like");
  if (/\b(?:generated|created|new|invented)\b.*\b(?:evidence|proof|ref|record)\b/.test(normalized)) signals.push("generated-evidence-claim-like");
  if (/\.pi\/agent\/sessions|bearer\s+|api[_ -]?key|private key/.test(normalized)) signals.push("privacy-leak-like");
  return signals;
}

function collectUnsafeAcceptedSignals(result) {
  if (!(result.usedLocalModel && result.fallbackReason === null)) return [];
  const values = [result.view.headline, result.view.whatHappened, result.view.whyItMatters, result.view.expectedBehavior, result.view.whyThisWasFlagged, result.view.evidenceSummary].filter(Boolean);
  const signals = new Set();
  for (const value of values) for (const signal of textSignalCategories(value)) signals.add(signal);
  return [...signals];
}

function summarizeCase(modeId, caseDef, result, raw, latencyMs, promptLength, providerCall) {
  const parsed = raw === null ? { ok: false, error: "no provider response" } : jsonParse(raw);
  const schemaCompatible = parsed.ok && result.fallbackReason !== "malformed-json" && result.fallbackReason !== "schema-invalid" && result.fallbackReason !== "provider-error" && result.fallbackReason !== "timeout";
  const unsafeAcceptedSignals = collectUnsafeAcceptedSignals(result);
  const topLevelKeys = parsed.ok && parsed.value && typeof parsed.value === "object" && !Array.isArray(parsed.value) ? Object.keys(parsed.value).sort() : [];
  return {
    modeId,
    caseId: caseDef.id,
    title: caseDef.title,
    coverage: caseDef.coverage,
    parseValid: parsed.ok,
    schemaValid: schemaCompatible,
    productGatePass: result.usedLocalModel && result.fallbackReason === null,
    safeProductGatePass: result.usedLocalModel && result.fallbackReason === null && unsafeAcceptedSignals.length === 0,
    displayState: result.displayState,
    narrativeStatus: result.narrativeStatus,
    fallbackReason: result.fallbackReason,
    validationIssueCategory: safeIssueCategory(result.validationIssue),
    unsafeRejected: result.fallbackReason === "unsafe-output",
    unsafeAcceptedSignals,
    unsafeAccepted: unsafeAcceptedSignals.length > 0,
    fieldPresence: parsed.ok ? rawFieldPresence(parsed.value) : rawFieldPresence(null),
    viewFieldPresence: resultFieldPresence(result),
    topLevelKeys,
    rawResponseLength: raw === null ? null : String(raw).length,
    rawResponseSha256: raw === null ? null : stableHash(raw),
    promptLength,
    latencyMs,
    providerStatus: providerCall ? sanitizeProviderCall(providerCall) : null,
  };
}

function sanitizeProviderCall(call) {
  return {
    status: call.status,
    signal: call.signal,
    timedOut: call.timedOut,
    aborted: call.aborted,
    ok: call.ok,
    errorCategory: call.errorCategory,
    latencyMs: call.latencyMs,
    stdoutBytes: call.stdoutBytes,
    stderrBytes: call.stderrBytes,
    tempPromptDeleted: call.tempPromptDeleted,
    tempPromptPathPersisted: false,
  };
}

function numericSummary(values) {
  const filtered = values.filter((value) => typeof value === "number" && Number.isFinite(value));
  if (filtered.length === 0) return null;
  return { min: Math.min(...filtered), max: Math.max(...filtered), avg: Math.round(filtered.reduce((sum, value) => sum + value, 0) / filtered.length) };
}

function aggregateMode(modeId, caseSummaries) {
  const fieldCoverage = {};
  const viewFieldCoverage = {};
  for (const field of fields) {
    fieldCoverage[field] = caseSummaries.filter((item) => item.fieldPresence[field]).length;
    viewFieldCoverage[field] = caseSummaries.filter((item) => item.viewFieldPresence[field]).length;
  }
  const fallbackReasons = {};
  const displayStates = {};
  const providerErrorCategories = {};
  for (const item of caseSummaries) {
    if (item.fallbackReason) fallbackReasons[item.fallbackReason] = (fallbackReasons[item.fallbackReason] ?? 0) + 1;
    displayStates[item.displayState] = (displayStates[item.displayState] ?? 0) + 1;
    const category = item.providerStatus?.errorCategory;
    if (category) providerErrorCategories[category] = (providerErrorCategories[category] ?? 0) + 1;
  }
  const safePassCount = caseSummaries.filter((item) => item.safeProductGatePass).length;
  const unsafeAcceptedCount = caseSummaries.filter((item) => item.unsafeAccepted).length;
  return {
    modeId,
    totalCases: caseSummaries.length,
    parseValidCount: caseSummaries.filter((item) => item.parseValid).length,
    schemaValidCount: caseSummaries.filter((item) => item.schemaValid).length,
    productGatePassCount: caseSummaries.filter((item) => item.productGatePass).length,
    safeProductGatePassCount: safePassCount,
    productFallbackCount: caseSummaries.filter((item) => !item.productGatePass).length,
    unsafeRejectionCount: caseSummaries.filter((item) => item.unsafeRejected).length,
    unsafeAcceptedCount,
    timeoutCount: caseSummaries.filter((item) => item.fallbackReason === "timeout" || item.providerStatus?.timedOut).length,
    providerErrorCategories,
    fallbackReasons,
    displayStates,
    fieldCoverage,
    viewFieldCoverage,
    latencyMs: numericSummary(caseSummaries.map((item) => item.latencyMs)),
    providerLatencyMs: numericSummary(caseSummaries.map((item) => item.providerStatus?.latencyMs)),
    promptLengthChars: numericSummary(caseSummaries.map((item) => item.promptLength)),
    gatePass: safePassCount >= 5 && unsafeAcceptedCount === 0,
    gateRule: "requires >=5 safe real product-gated model-enabled renders and zero unsafe/privacy accepted outputs",
    cases: caseSummaries,
  };
}

function classifyProcess(currentSummary, relaxedSummary) {
  if (relaxedSummary.gatePass) {
    return {
      classification: currentSummary.gatePass ? "pass" : "transport-timeout issue",
      rationale: currentSummary.gatePass
        ? "Both current-product-5s and relaxed-validator modes met the safe product-gated render gate."
        : "The exact prompt and validator passed when hosted CLI transport timeout was isolated, while the current 5s product path did not.",
    };
  }
  if (currentSummary.timeoutCount === currentSummary.totalCases && relaxedSummary.timeoutCount > 0 && relaxedSummary.parseValidCount === 0) {
    return { classification: "transport-timeout issue", rationale: "Both modes were dominated by hosted CLI/runtime timeouts before usable JSON could be validated." };
  }
  if (relaxedSummary.parseValidCount === 0) {
    return { classification: "parse/schema issue", rationale: "Relaxed-validator mode isolated transport but still produced no parse-valid JSON for the current product prompt." };
  }
  if (relaxedSummary.schemaValidCount < relaxedSummary.parseValidCount) {
    return { classification: "parse/schema issue", rationale: "Relaxed-validator mode produced parseable responses, but current product schema checks rejected at least one response shape." };
  }
  if (relaxedSummary.unsafeAcceptedCount > 0 || relaxedSummary.unsafeRejectionCount > 0 || relaxedSummary.safeProductGatePassCount < 5) {
    if (currentSummary.timeoutCount === currentSummary.totalCases) {
      return { classification: "mixed", rationale: "The current 5-second path timed out for every hosted CLI call, while relaxed-validator mode produced parse/schema-compatible output that was still rejected by the current validator/safety gate." };
    }
    return { classification: "validator/safety issue", rationale: "Relaxed-validator mode produced parse/schema-compatible output, but the current validator/safety gate did not yield enough safe product-gated cards." };
  }
  return { classification: "mixed", rationale: "No single failure class dominated the two diagnostic modes." };
}

async function commandOutput(command, args, options = {}) {
  const timeoutMs = options.timeoutMs ?? 120000;
  const startedAt = Date.now();
  return await new Promise((resolve) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);
    child.stdout.on("data", (chunk) => { stdout += chunk.toString("utf8"); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString("utf8"); });
    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({ status: null, signal: null, stdout, stderr, timedOut, latencyMs: Date.now() - startedAt, errorCategory: `spawn-error:${String(error?.code ?? error?.message ?? "unknown")}` });
    });
    child.on("close", (status, signal) => {
      clearTimeout(timer);
      resolve({ status, signal, stdout, stderr, timedOut, latencyMs: Date.now() - startedAt, errorCategory: timedOut ? "timeout" : status === 0 ? null : `exit-${status}` });
    });
  });
}

async function runModelList() {
  const out = await commandOutput(providerCommand, ["--list-models", "gpt-5.5"], { timeoutMs: 120000 });
  const rows = `${out.stdout}\n${out.stderr}`.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.includes(model));
  return {
    command: "pi --list-models gpt-5.5",
    requiredProvider: provider,
    requestedModel: model,
    status: out.status,
    timedOut: out.timedOut,
    latencyMs: out.latencyMs,
    modelAvailable: rows.some((line) => line.includes(provider) && line.includes(model)),
    matchedRows: rows,
    stdoutBytes: Buffer.byteLength(out.stdout, "utf8"),
    stderrBytes: Buffer.byteLength(out.stderr, "utf8"),
    rawOutputPersisted: false,
  };
}

async function runPiPrompt(prompt, timeoutMs, externalSignal = null) {
  const tempPath = join(tmpdir(), `pfr-gpt55-${process.pid}-${randomUUID()}.txt`);
  const startedAt = Date.now();
  let tempPromptDeleted = false;
  let stdout = "";
  let stderr = "";
  let status = null;
  let signal = null;
  let timedOut = false;
  let aborted = false;
  let child = null;
  let settled = false;
  let timeout = null;
  let abortHandler = null;

  try {
    await writeFile(tempPath, prompt, { mode: 0o600 });
    const args = [...piBaseArgs, `@${tempPath}`];
    const result = await new Promise((resolve) => {
      child = spawn(providerCommand, args, { stdio: ["ignore", "pipe", "pipe"] });
      const finish = () => {
        if (settled) return;
        settled = true;
        resolve(undefined);
      };
      timeout = setTimeout(() => {
        timedOut = true;
        child.kill("SIGKILL");
      }, timeoutMs);
      if (externalSignal) {
        abortHandler = () => {
          aborted = true;
          child.kill("SIGTERM");
          setTimeout(() => {
            if (!settled && child) child.kill("SIGKILL");
          }, 1500).unref?.();
        };
        if (externalSignal.aborted) abortHandler();
        else externalSignal.addEventListener("abort", abortHandler, { once: true });
      }
      child.stdout.on("data", (chunk) => { stdout += chunk.toString("utf8"); });
      child.stderr.on("data", (chunk) => { stderr += chunk.toString("utf8"); });
      child.on("error", () => { status = null; signal = null; finish(); });
      child.on("close", (closeStatus, closeSignal) => { status = closeStatus; signal = closeSignal; finish(); });
    });
    void result;
  } finally {
    if (timeout) clearTimeout(timeout);
    if (externalSignal && abortHandler) externalSignal.removeEventListener("abort", abortHandler);
    await rm(tempPath, { force: true }).then(() => { tempPromptDeleted = true; }, () => { tempPromptDeleted = false; });
  }

  const latencyMs = Date.now() - startedAt;
  const stdoutTrimmed = stdout.trim();
  const errorCategory = timedOut ? "timeout" : aborted ? "aborted" : status === 0 ? null : status === null ? "spawn-error" : `exit-${status}`;
  return {
    ok: status === 0 && !timedOut && !aborted,
    stdout: stdoutTrimmed,
    status,
    signal,
    timedOut,
    aborted,
    errorCategory,
    latencyMs,
    stdoutBytes: Buffer.byteLength(stdout, "utf8"),
    stderrBytes: Buffer.byteLength(stderr, "utf8"),
    tempPromptDeleted,
    rawOutputPersisted: false,
    rawPromptPersisted: false,
  };
}

async function runTinyProbe() {
  const probePrompt = ["Return exactly", JSON.stringify({ ok: true }), "and nothing else."].join(" ");
  const result = await runPiPrompt(probePrompt, 120000);
  return {
    commandShape: "pi --provider openai-codex --model gpt-5.5 --no-tools --no-extensions --no-skills --no-context-files --no-session --system-prompt '' -p @<tempfile>",
    status: result.status,
    signal: result.signal,
    timedOut: result.timedOut,
    ok: result.ok,
    expectedTinyJsonReturned: result.ok && result.stdout === JSON.stringify({ ok: true }),
    latencyMs: result.latencyMs,
    stdoutBytes: result.stdoutBytes,
    stderrBytes: result.stderrBytes,
    tempPromptDeleted: result.tempPromptDeleted,
    rawPromptPersisted: false,
    rawOutputPersisted: false,
  };
}

async function sessionSnapshot() {
  const root = join(homedir(), ".pi", "agent", "sessions");
  let count = 0;
  let newestMtimeMs = null;
  async function walk(dir) {
    let entries;
    try { entries = await readdir(dir, { withFileTypes: true }); }
    catch (error) {
      if (error?.code === "ENOENT") return false;
      throw error;
    }
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile()) {
        count += 1;
        const info = await stat(full);
        newestMtimeMs = newestMtimeMs === null ? info.mtimeMs : Math.max(newestMtimeMs, info.mtimeMs);
      }
    }
    return true;
  }
  const exists = await walk(root);
  return {
    displayPath: "Pi session storage directory",
    exists,
    fileCount: count,
    newestMtimeMs: newestMtimeMs === null ? null : Math.round(newestMtimeMs),
    fileNamesPersisted: false,
  };
}

async function sha256File(path) {
  const data = await import("node:fs/promises").then((fs) => fs.readFile(path));
  return createHash("sha256").update(data).digest("hex");
}

async function sourceFingerprints(paths) {
  const result = {};
  for (const path of paths) result[path] = await sha256File(path);
  return result;
}

function compareSourceFingerprints(sourceBefore, sourceAfter) {
  const changedSources = Object.keys(sourceBefore).filter((path) => sourceBefore[path] !== sourceAfter[path]);
  return { pass: changedSources.length === 0, sourceBefore, sourceAfter, changedSources };
}

async function evaluateCurrentProductMode() {
  const caseSummaries = [];
  const renderFiles = [];
  for (const caseDef of cases) {
    let providerCall = null;
    let providerPromise = null;
    let providerPromptLength = null;
    const hostedProvider = {
      completeLocalDiagnosisPolish: async (request) => {
        providerPromptLength = request.prompt.length;
        providerPromise = runPiPrompt(request.prompt, 120000, request.signal);
        providerCall = await providerPromise;
        if (!providerCall.ok) throw new Error(providerCall.errorCategory ?? "provider-error");
        return providerCall.stdout;
      },
    };
    const startedAt = Date.now();
    const result = await buildFlightLearnDiagnosisViewWithLocalPolish(
      { delta: caseDef.delta, signals: caseDef.signals },
      { enabled: true, provider: hostedProvider, timeoutMs: productTimeoutMs },
    );
    const latencyMs = Date.now() - startedAt;
    if (providerPromise) {
      await Promise.race([providerPromise.catch(() => undefined), sleep(8000)]);
    }
    const raw = result.fallbackReason === "timeout" ? null : providerCall?.stdout ?? null;
    const summary = summarizeCase("current-product-5s", caseDef, result, raw, latencyMs, providerPromptLength, providerCall);
    caseSummaries.push(summary);
    for (const width of widths) {
      const file = `current-product-5s-${caseDef.id}-${width}.txt`;
      await writeFile(join(artifactDir, file), `${redactedRenderCase(caseDef, result, width)}\n`);
      renderFiles.push(file);
    }
  }
  return { summary: aggregateMode("current-product-5s", caseSummaries), renderFiles };
}

async function evaluateRelaxedValidatorMode() {
  const caseSummaries = [];
  const renderFiles = [];
  for (const caseDef of cases) {
    const factPacket = buildLocalDiagnosisFactPacket({ delta: caseDef.delta, signals: caseDef.signals });
    const prompt = buildLocalDiagnosisPrompt(factPacket);
    const providerCall = await runPiPrompt(prompt, relaxedTimeoutMs);
    const raw = providerCall.ok ? providerCall.stdout : null;
    const cachedProvider = {
      completeLocalDiagnosisPolish: async () => {
        if (raw === null) throw new Error(providerCall.errorCategory ?? "provider-error");
        return raw;
      },
    };
    const validationStartedAt = Date.now();
    const result = await buildFlightLearnDiagnosisViewWithLocalPolish(
      { delta: caseDef.delta, signals: caseDef.signals },
      { enabled: true, provider: cachedProvider, timeoutMs: productTimeoutMs },
    );
    const latencyMs = providerCall.latencyMs + (Date.now() - validationStartedAt);
    const summary = summarizeCase("relaxed-validator", caseDef, result, raw, latencyMs, prompt.length, providerCall);
    caseSummaries.push(summary);
    for (const width of widths) {
      const file = `relaxed-validator-${caseDef.id}-${width}.txt`;
      await writeFile(join(artifactDir, file), `${redactedRenderCase(caseDef, result, width)}\n`);
      renderFiles.push(file);
    }
  }
  return { summary: aggregateMode("relaxed-validator", caseSummaries), renderFiles };
}

function checkRenderWidths(renderFiles) {
  const maxByFile = [];
  return Promise.all(renderFiles.map(async (file) => {
    const widthMatch = file.match(/-(\d+)\.txt$/);
    const width = widthMatch ? Number.parseInt(widthMatch[1], 10) : null;
    const text = await import("node:fs/promises").then((fs) => fs.readFile(join(artifactDir, file), "utf8"));
    const longest = Math.max(...text.split(/\r?\n/).map((line) => line.length));
    const pass = width === null ? true : longest <= width;
    maxByFile.push({ file, width, longest, pass });
  })).then(() => ({ pass: maxByFile.every((item) => item.pass), files: maxByFile.sort((a, b) => a.file.localeCompare(b.file)) }));
}

async function checkHiddenInternals(renderFiles) {
  const forbidden = [
    { name: "raw-clue", pattern: /Raw clue/i },
    { name: "why-suggested", pattern: /Why suggested/i },
    { name: "cluster-id", pattern: /cluster_[a-z0-9_-]+/i },
    { name: "session-path", pattern: /\.pi\/agent\/sessions|<pi-session-file:/i },
    { name: "home-path", pattern: /\/(?:Users|home)\//i },
    { name: "secret-like", pattern: /Bearer\s+|api[_ -]?key|private key/i },
  ];
  const findings = [];
  for (const file of renderFiles) {
    const text = await import("node:fs/promises").then((fs) => fs.readFile(join(artifactDir, file), "utf8"));
    for (const item of forbidden) {
      if (item.pattern.test(text)) findings.push({ file, pattern: item.name });
    }
  }
  return { pass: findings.length === 0, findings };
}

async function privacyScan(paths) {
  const patterns = [
    { name: "raw-home-path", pattern: /\/Users\/[A-Za-z0-9._-]+|\/home\/[A-Za-z0-9._-]+/ },
    { name: "pi-session-path", pattern: /\.pi\/agent\/sessions/i },
    { name: "private-key", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
    { name: "bearer-token", pattern: /Bearer\s+[A-Za-z0-9._~+/=-]+/ },
    { name: "secret-assignment", pattern: /\b(?:API_KEY|TOKEN|SECRET|PASSWORD|PRIVATE_KEY)\s*=/ },
  ];
  const findings = [];
  for (const path of paths) {
    const text = await import("node:fs/promises").then((fs) => fs.readFile(path, "utf8"));
    for (const item of patterns) {
      if (item.pattern.test(text)) findings.push({ file: path.replace(`${artifactDir}/`, ""), pattern: item.name });
    }
  }
  return { pass: findings.length === 0, scannedFiles: paths.length, findings };
}

async function artifactFiles() {
  const entries = await readdir(artifactDir, { withFileTypes: true });
  return entries.filter((entry) => entry.isFile()).map((entry) => join(artifactDir, entry.name)).sort();
}

function writeJson(file, value) {
  return writeFile(join(artifactDir, file), `${JSON.stringify(value, null, 2)}\n`);
}

async function main() {
  await mkdir(artifactDir, { recursive: true });
  const sourceBefore = await sourceFingerprints(sourcePaths);
  const sessionsBefore = await sessionSnapshot();
  const availability = await runModelList();
  if (!availability.modelAvailable) {
    const sessionsAfter = await sessionSnapshot();
    const sourceAfter = await sourceFingerprints(sourcePaths);
    const checks = { sourceSideEffect: compareSourceFingerprints(sourceBefore, sourceAfter), sessionsBefore, sessionsAfter };
    await writeJson("01-availability-and-probe.json", { availability, probe: null, stopped: "gpt-5.5-not-available" });
    await writeJson("02-run-summary.json", { generatedAt, gateDisposition: "blocked-model-unavailable", checks });
    return;
  }
  const probe = await runTinyProbe();
  if (!probe.expectedTinyJsonReturned) {
    const sessionsAfter = await sessionSnapshot();
    const sourceAfter = await sourceFingerprints(sourcePaths);
    const checks = { sourceSideEffect: compareSourceFingerprints(sourceBefore, sourceAfter), sessionsBefore, sessionsAfter };
    await writeJson("01-availability-and-probe.json", { availability, probe, stopped: "tiny-probe-failed" });
    await writeJson("02-run-summary.json", { generatedAt, gateDisposition: "blocked-probe-failed", checks });
    return;
  }
  await writeJson("01-availability-and-probe.json", { availability, probe });

  const current = await evaluateCurrentProductMode();
  await writeJson("mode-current-product-5s-summary.json", current.summary);

  const relaxed = await evaluateRelaxedValidatorMode();
  await writeJson("mode-relaxed-validator-summary.json", relaxed.summary);

  const processDiagnosis = classifyProcess(current.summary, relaxed.summary);
  const allRenderFiles = [...current.renderFiles, ...relaxed.renderFiles].sort();
  const widthChecks = await checkRenderWidths(allRenderFiles);
  const hiddenInternals = await checkHiddenInternals(allRenderFiles);
  const sessionsAfter = await sessionSnapshot();
  const sourceAfter = await sourceFingerprints(sourcePaths);
  const sourceSideEffect = compareSourceFingerprints(sourceBefore, sourceAfter);
  const tempPromptDeleted = [probe, ...current.summary.cases.map((item) => item.providerStatus), ...relaxed.summary.cases.map((item) => item.providerStatus)]
    .filter(Boolean)
    .every((item) => item.tempPromptDeleted === true);
  const noSessionFilesCreated = sessionsBefore.exists === sessionsAfter.exists && sessionsBefore.fileCount === sessionsAfter.fileCount && sessionsBefore.newestMtimeMs === sessionsAfter.newestMtimeMs;
  const runSummary = {
    kind: "flight-learn-gpt55-hosted-sanity-check",
    generatedAt,
    provider,
    model,
    hostedProviderUsed: true,
    authenticatedCredentialValuesPersisted: false,
    dataPolicy: "synthetic/redacted corpus only",
    productSourceChanged: !sourceSideEffect.pass,
    rawPromptsPersisted: false,
    rawModelOutputsPersisted: false,
    rawProviderLogsPersisted: false,
    modes: {
      "current-product-5s": {
        parseValidCount: current.summary.parseValidCount,
        schemaValidCount: current.summary.schemaValidCount,
        productGatePassCount: current.summary.productGatePassCount,
        safeProductGatePassCount: current.summary.safeProductGatePassCount,
        timeoutCount: current.summary.timeoutCount,
        unsafeAcceptedCount: current.summary.unsafeAcceptedCount,
        gatePass: current.summary.gatePass,
      },
      "relaxed-validator": {
        parseValidCount: relaxed.summary.parseValidCount,
        schemaValidCount: relaxed.summary.schemaValidCount,
        productGatePassCount: relaxed.summary.productGatePassCount,
        safeProductGatePassCount: relaxed.summary.safeProductGatePassCount,
        timeoutCount: relaxed.summary.timeoutCount,
        unsafeAcceptedCount: relaxed.summary.unsafeAcceptedCount,
        gatePass: relaxed.summary.gatePass,
      },
    },
    processDiagnosis,
    gateDisposition: relaxed.summary.gatePass ? "hosted-sanity-passed-do-not-open-local-comprehension-validation-from-hosted-alone" : "keep-downstream-comprehension-validation-blocked",
    downstreamComprehensionValidationOpened: false,
    checks: {
      tempPromptDeleted,
      noSessionFilesCreated,
      sessionsBefore,
      sessionsAfter,
      sourceSideEffect,
      widthPass: widthChecks.pass,
      hiddenInternalsPass: hiddenInternals.pass,
    },
    nonClaims: [
      "Hosted frontier-model success would diagnose the process; it would not authorize product integration or local-first policy changes.",
      "Replay/render metrics do not measure actual operator comprehension.",
      "No hosted model output was persisted as truth, route authority, classifier input, or source change.",
    ],
  };
  await writeJson("02-run-summary.json", runSummary);
  await writeJson("03-render-line-widths.json", widthChecks);
  await writeJson("04-render-contract-check.json", hiddenInternals);
  await writeJson("06-source-side-effect-scan.json", sourceSideEffect);
  await writeJson("07-session-side-effect-check.json", { pass: noSessionFilesCreated, sessionsBefore, sessionsAfter, fileNamesPersisted: false });

  const initialPrivacy = await privacyScan(await artifactFiles());
  await writeJson("05-artifact-privacy-scan.json", initialPrivacy);

  const artifactIndex = {
    generatedAt,
    ticket: "ticket:20260602-flight-learn-gpt55-hosted-sanity-check",
    provider,
    model,
    corpus: {
      totalCases: cases.length,
      cases: cases.map((caseDef) => ({ caseId: caseDef.id, title: caseDef.title, coverage: caseDef.coverage, evidenceRefCount: caseDef.delta.evidenceRefs.length })),
    },
    artifacts: {
      availabilityAndProbe: "01-availability-and-probe.json",
      runSummary: "02-run-summary.json",
      currentProductSummary: "mode-current-product-5s-summary.json",
      relaxedValidatorSummary: "mode-relaxed-validator-summary.json",
      widthChecks: "03-render-line-widths.json",
      hiddenInternals: "04-render-contract-check.json",
      privacyScan: "05-artifact-privacy-scan.json",
      sourceSideEffectScan: "06-source-side-effect-scan.json",
      sessionSideEffectCheck: "07-session-side-effect-check.json",
      gitDiffCheck: "08-git-diff-check.txt",
      workspaceStatus: "09-workspace-status.txt",
      finalPrivacyScan: "11-final-privacy-scan.json",
    },
    renderFiles: allRenderFiles,
    checks: runSummary.checks,
    processDiagnosis,
    gateDisposition: runSummary.gateDisposition,
    rawPromptOrOutputPolicy: "Raw prompts, raw hosted model outputs, and raw provider logs are omitted from persisted artifacts.",
  };
  await writeJson("00-artifact-index.json", artifactIndex);
}

main().catch(async (error) => {
  await mkdir(artifactDir, { recursive: true });
  await writeJson("run-error.json", {
    generatedAt,
    errorCategory: "script-error",
    message: String(error?.message ?? error).replaceAll(homedir(), "~"),
    rawPromptOrOutputPersisted: false,
  });
  process.exitCode = 1;
});
