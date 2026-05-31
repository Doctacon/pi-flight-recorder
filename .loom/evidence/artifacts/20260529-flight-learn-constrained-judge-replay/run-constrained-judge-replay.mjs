import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, openSync, closeSync, statSync, unlinkSync } from 'node:fs';
import { get as httpGet } from 'node:http';
import { createServer } from 'node:net';
import { dirname, resolve } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

import { buildFlightLearnDiagnosisView } from '../../../../src/flight-learn-diagnosis.ts';
import {
  buildFlightLearnDiagnosisViewWithLocalPolish,
  buildLocalDiagnosisFactPacket,
  validateLocalDiagnosisPolishResponse,
  validateLocalNarrativeJudgeResponse,
} from '../../../../src/flight-learn-local-diagnosis-model.ts';
import { createLlamaCppLocalDiagnosisPolishOptions } from '../../../../src/flight-learn-llama-cpp-adapter.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const artifactDir = __dirname;
mkdirSync(artifactDir, { recursive: true });

const MODEL_PATH = process.env.BONSAI_4B_PATH ?? `${process.env.HOME}/.cache/pi-flight-recorder/bonsai/Bonsai-4B-Q1_0.gguf`;
const EXPECTED_SHA256 = '4524b3f997f0f06444e568d1f26e2efd69effa3218c7ad3047432fb171e42168';
const LLAMA_SERVER = process.env.LLAMA_SERVER ?? '/opt/homebrew/bin/llama-server';
const CORPUS_PATH = resolve(artifactDir, '../20260528-flight-learn-narrative-rubric-corpus/narrative-what-happened-eval-corpus.v1.json');
const RUN_STARTED_AT = new Date().toISOString();
const GENERATOR_TIMEOUT_MS = 5000;
const JUDGE_TIMEOUT_MS = 5000;
const GENERATOR_MAX_OUTPUT_TOKENS = 320;
const JUDGE_MAX_OUTPUT_TOKENS = 512;
const SERVER_START_TIMEOUT_MS = 120000;
const REPO_PLACEHOLDER = '<repo>';
const SERVER_LOG_STDOUT_TMP = resolve(tmpdir(), `pfr-constrained-judge-${process.pid}.stdout.log`);
const SERVER_LOG_STDERR_TMP = resolve(tmpdir(), `pfr-constrained-judge-${process.pid}.stderr.log`);

const artifacts = {
  runtime: resolve(artifactDir, '03-runtime-provenance.txt'),
  serverCommand: resolve(artifactDir, '04-server-command.txt'),
  serverHealth: resolve(artifactDir, '05-llama-server-health.json'),
  serverStartStatus: resolve(artifactDir, '06-server-start-status.txt'),
  summary: resolve(artifactDir, '07-replay-summary.json'),
  results: resolve(artifactDir, '08-replay-results.json'),
  samples: resolve(artifactDir, '09-sanitized-output-samples.json'),
  failureNotes: resolve(artifactDir, '10-qualitative-failure-notes.md'),
  serverLogSummary: resolve(artifactDir, '11-server-log-summary.txt'),
  serverFinalStatus: resolve(artifactDir, '12-server-final-status.txt'),
  postRunListener: resolve(artifactDir, '13-post-run-listener-check.txt'),
  runOutput: resolve(artifactDir, 'run-output.txt'),
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function redactText(value) {
  if (typeof value !== 'string') return value;
  const repoCwd = new RegExp(escapeRegExp(process.cwd()), 'g');
  const homePrefix = process.env.HOME ? new RegExp(escapeRegExp(process.env.HOME), 'g') : null;
  const homeUsersPattern = new RegExp('/' + 'Users/[^/\\s"\'`<>]+', 'g');
  const secretAssignmentPattern = /\b(?:API[_-]?KEY|PASSWORD|SECRET|TOKEN)\s*[:=]\s*[^\s"'`]+/gi;
  let redacted = value.replace(repoCwd, REPO_PLACEHOLDER);
  if (homePrefix) redacted = redacted.replace(homePrefix, '~');
  redacted = redacted.replace(homeUsersPattern, '~');
  return redacted
    .replace(/<\|im_(?:start|end)\|>/g, '<chat-marker-redacted>')
    .replace(/BEGIN\s+(?:SYSTEM\s+)?PROMPT/gi, '<prompt-marker-redacted>')
    .replace(secretAssignmentPattern, (match) => match.replace(/[:=].*$/, '=<redacted>'));
}

function preview(value, max = 500) {
  if (typeof value !== 'string') return null;
  const redacted = redactText(value).replace(/\s+/g, ' ').trim();
  return redacted.length <= max ? redacted : `${redacted.slice(0, max)}…`;
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function unlinkIfExists(path) {
  if (!existsSync(path)) return false;
  unlinkSync(path);
  return true;
}

function sha256File(path) {
  const hash = createHash('sha256');
  hash.update(readFileSync(path));
  return hash.digest('hex');
}

function runCommand(args) {
  const result = spawnSync(args[0], args.slice(1), { encoding: 'utf8' });
  return {
    command: redactText(args.join(' ')),
    status: result.status,
    signal: result.signal,
    stdout: redactText(result.stdout ?? ''),
    stderr: redactText(result.stderr ?? ''),
  };
}

function getFreePort(start = 18130, end = 18169) {
  return new Promise((resolvePromise, reject) => {
    let port = start;
    const tryPort = () => {
      if (port > end) {
        reject(new Error(`no free loopback port in ${start}-${end}`));
        return;
      }
      const server = createServer();
      server.once('error', () => {
        port += 1;
        tryPort();
      });
      server.once('listening', () => {
        const selected = port;
        server.close(() => resolvePromise(selected));
      });
      server.listen(port, '127.0.0.1');
    };
    tryPort();
  });
}

function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

async function waitForHealth(baseUrl, timeoutMs) {
  const started = Date.now();
  let last = null;
  while (Date.now() - started < timeoutMs) {
    last = await new Promise((resolvePromise) => {
      const req = httpGet(`${baseUrl}/health`, { headers: { accept: 'application/json' } }, (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          resolvePromise({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode ?? null, body });
        });
      });
      req.on('error', (error) => resolvePromise({ ok: false, error: error.message }));
      req.setTimeout(1000, () => {
        req.destroy();
        resolvePromise({ ok: false, timeout: true });
      });
    });
    if (last.ok) return last;
    await sleep(500);
  }
  throw new Error(`llama-server did not become healthy: ${JSON.stringify(last)}`);
}

function sourceDelta(testCase) {
  const d = testCase.storedInput.delta;
  const now = '2026-05-28T12:00:00.000Z';
  return {
    id: d.id,
    status: d.status,
    source: d.source,
    summary: d.summary,
    expectation: d.expectation ?? null,
    reality: d.reality ?? null,
    impact: d.impact ?? null,
    severity: d.severity,
    cwd: null,
    sourceSessionFile: null,
    sourceEntryId: null,
    evidenceRefs: (testCase.storedInput.evidence ?? []).map((evidence, index) => ({
      sourceType: evidence.sourceType,
      sourceId: `${testCase.id.toLowerCase()}-evidence-${index + 1}`,
      sourceFile: null,
      sessionFile: null,
      cwd: null,
      entryId: null,
      timestamp: evidence.timestamp ?? null,
      snippet: evidence.snippetSummary ?? null,
      note: evidence.noteSummary ?? null,
    })),
    activeArtifactCandidateId: null,
    statusReason: null,
    metadata: typeof d.occurrenceCount === 'number' ? { count: d.occurrenceCount } : {},
    createdAt: now,
    updatedAt: now,
    acceptedAt: null,
    routedAt: null,
    dismissedAt: null,
    resolvedAt: null,
    recurringAt: null,
  };
}

function sourceSignals(testCase, deltaId) {
  return (testCase.storedInput.signals ?? []).map((signal, index) => ({
    id: `${testCase.id.toLowerCase()}-signal-${index + 1}`,
    deltaId,
    type: signal.type,
    explanation: signal.explanation,
    confidence: signal.confidence ?? null,
    evidenceRefs: [],
    metadata: {},
    createdAt: '2026-05-28T12:00:00.000Z',
  }));
}

function toInput(testCase) {
  const delta = sourceDelta(testCase);
  return { delta, signals: sourceSignals(testCase, delta.id) };
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function schemaCheckGenerator(raw) {
  let parsed;
  try {
    parsed = JSON.parse(String(raw).trim());
  } catch (error) {
    return { parseValid: false, schemaValid: false, schemaIssue: error instanceof Error ? error.message : 'not-json', parsed: null };
  }
  if (!isPlainObject(parsed)) return { parseValid: true, schemaValid: false, schemaIssue: 'top-level-not-object', parsed };
  const allowedTop = new Set(['schemaVersion', 'headline', 'whatHappened', 'whyItMatters', 'expectedBehavior']);
  const extraTop = Object.keys(parsed).find((key) => !allowedTop.has(key));
  if (extraTop) return { parseValid: true, schemaValid: false, schemaIssue: `extra-top-level:${extraTop}`, parsed };
  if (parsed.schemaVersion !== 2) return { parseValid: true, schemaValid: false, schemaIssue: 'schemaVersion-not-2', parsed };
  if (!isPlainObject(parsed.whatHappened)) return { parseValid: true, schemaValid: false, schemaIssue: 'whatHappened-not-object', parsed };
  const whatKeys = Object.keys(parsed.whatHappened);
  const extraWhat = whatKeys.find((key) => key !== 'sentences');
  if (extraWhat) return { parseValid: true, schemaValid: false, schemaIssue: `extra-whatHappened:${extraWhat}`, parsed };
  const sentences = parsed.whatHappened.sentences;
  if (!Array.isArray(sentences)) return { parseValid: true, schemaValid: false, schemaIssue: 'sentences-not-array', parsed };
  if (sentences.length < 1 || sentences.length > 4) return { parseValid: true, schemaValid: false, schemaIssue: 'sentences-count-out-of-range', parsed };
  for (const [index, sentence] of sentences.entries()) {
    if (!isPlainObject(sentence)) return { parseValid: true, schemaValid: false, schemaIssue: `sentence-${index}-not-object`, parsed };
    const allowedSentence = new Set(['text', 'factIds']);
    const extraSentence = Object.keys(sentence).find((key) => !allowedSentence.has(key));
    if (extraSentence) return { parseValid: true, schemaValid: false, schemaIssue: `extra-sentence-${index}:${extraSentence}`, parsed };
    if (typeof sentence.text !== 'string' || sentence.text.trim().length === 0 || sentence.text.length > 220) {
      return { parseValid: true, schemaValid: false, schemaIssue: `sentence-${index}-invalid-text`, parsed };
    }
    if (!Array.isArray(sentence.factIds) || sentence.factIds.length < 1 || sentence.factIds.length > 8) {
      return { parseValid: true, schemaValid: false, schemaIssue: `sentence-${index}-invalid-factIds`, parsed };
    }
    if (!sentence.factIds.every((factId) => typeof factId === 'string' && /^F[0-9]+$/.test(factId))) {
      return { parseValid: true, schemaValid: false, schemaIssue: `sentence-${index}-invalid-factId-format`, parsed };
    }
  }
  for (const key of ['headline', 'whyItMatters']) {
    if (parsed[key] !== undefined && (typeof parsed[key] !== 'string' || parsed[key].trim().length === 0)) {
      return { parseValid: true, schemaValid: false, schemaIssue: `${key}-invalid`, parsed };
    }
  }
  if (parsed.expectedBehavior !== undefined && parsed.expectedBehavior !== null && typeof parsed.expectedBehavior !== 'string') {
    return { parseValid: true, schemaValid: false, schemaIssue: 'expectedBehavior-invalid', parsed };
  }
  return { parseValid: true, schemaValid: true, schemaIssue: null, parsed };
}

function acceptedNarrativeUnsafe(value) {
  if (typeof value !== 'string' || value.length === 0) return false;
  const unsafePatterns = [
    /\/(?:Users|home)\//i,
    /\.pi\/agent\/sessions/i,
    /\b(?:API[_-]?KEY|PASSWORD|SECRET|TOKEN)\s*[:=]/i,
    /\bBearer\s+[A-Za-z0-9._~+/=-]+/i,
    /<\|im_(?:start|end)\|>/i,
    /BEGIN\s+(?:SYSTEM\s+)?PROMPT/i,
    /\b(?:bash|zsh|sh)\s+(?:-lc|cd)\b/i,
    /\b(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?[\w:-]+\b/i,
    /\b(?:route|routes|routed|routing|choose|select|press|click|artifact|candidate|flight\s*rule|classifier|ranking)\b/i,
  ];
  return unsafePatterns.some((pattern) => pattern.test(value));
}

function countMap(values) {
  const counts = {};
  for (const value of values) {
    if (!value) continue;
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

function summarizeLatencies(values) {
  const present = values.filter((value) => typeof value === 'number' && Number.isFinite(value));
  if (present.length === 0) return { min: null, max: null, avg: null };
  const min = Math.min(...present);
  const max = Math.max(...present);
  const avg = Math.round(present.reduce((sum, value) => sum + value, 0) / present.length);
  return { min, max, avg };
}

function narrativeFallbackReason({ accepted, productResult, productError, validation, narrativeCandidate, capture, judgeValidation }) {
  if (accepted) return null;
  if (productResult?.fallbackReason) return productResult.fallbackReason;
  if (productError) return 'provider-error';
  if (!capture.generatorRaw) return capture.generatorError ? 'provider-error' : 'timeout';
  if (validation && !validation.ok) return validation.reason;
  if (validation?.ok && !narrativeCandidate) return 'empty-output';
  if (judgeValidation && !judgeValidation.ok) return judgeValidation.reason;
  if (capture.judgeRequested && !capture.judgeRaw) return capture.judgeError ? 'provider-error' : 'timeout';
  return 'provider-error';
}

function qualitativeNotes(summary) {
  const lines = [];
  lines.push('# Qualitative Failure Notes');
  lines.push('');
  lines.push(`Accepted narratives: ${summary.acceptedCount}/${summary.totalCases}.`);
  lines.push(`Fallbacks: ${summary.fallbackCount}/${summary.totalCases}.`);
  lines.push(`Fallback reasons: ${JSON.stringify(summary.fallbackReasons)}.`);
  lines.push(`Generator parse/schema/verifier: ${summary.parseValidCount}/${summary.schemaValidCount}/${summary.verifierPassCount} of ${summary.totalCases}.`);
  lines.push(`Judge calls/pass: ${summary.judgeCallCount}/${summary.judgePassCount}.`);
  lines.push(`Latency ms total: ${JSON.stringify(summary.latencyMs)}; generator: ${JSON.stringify(summary.generatorLatencyMs)}; judge: ${JSON.stringify(summary.judgeLatencyMs)}.`);
  lines.push(`Unsafe accepted outputs: ${summary.unsafeAcceptedCount}.`);
  lines.push('');
  if (summary.acceptedCount === 0) {
    lines.push('No narrative passed all gates. Later model-enabled UI integration should stop/replan for this runtime rather than weakening verifier, judge, or privacy gates.');
  } else if (summary.unsafeAcceptedCount > 0) {
    lines.push('At least one unsafe output was accepted. This is a hard safety blocker.');
  } else {
    lines.push('Some narratives passed all gates, but this remains synthetic-corpus evidence only and does not establish operator comprehension.');
  }
  lines.push('');
  lines.push('Common validation issues:');
  for (const [issue, count] of Object.entries(summary.validationIssues).slice(0, 12)) lines.push(`- ${count} x ${issue}`);
  lines.push('');
  lines.push('Common judge issues:');
  for (const [issue, count] of Object.entries(summary.judgeIssues).slice(0, 12)) lines.push(`- ${count} x ${issue}`);
  lines.push('');
  lines.push('Artifacts intentionally include only sanitized model-output previews, not full prompts or private sessions.');
  return `${lines.join('\n')}\n`;
}

async function main() {
  if (!existsSync(LLAMA_SERVER)) throw new Error(`llama-server not found at ${LLAMA_SERVER}`);
  if (!existsSync(MODEL_PATH)) throw new Error(`Bonsai model not found at ${MODEL_PATH}`);
  if (!existsSync(CORPUS_PATH)) throw new Error(`corpus not found at ${CORPUS_PATH}`);
  const modelSha256 = sha256File(MODEL_PATH);
  if (modelSha256 !== EXPECTED_SHA256) throw new Error(`Bonsai model checksum mismatch: ${modelSha256}`);

  const corpus = JSON.parse(readFileSync(CORPUS_PATH, 'utf8'));
  if (!Array.isArray(corpus.cases) || corpus.cases.length !== 15) throw new Error(`unexpected corpus case count: ${corpus.cases?.length}`);

  const version = runCommand([LLAMA_SERVER, '--version']);
  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const generatorConfig = {
    enabled: true,
    kind: 'llama-cpp-server',
    baseUrl,
    timeoutMs: GENERATOR_TIMEOUT_MS,
    maxOutputTokens: GENERATOR_MAX_OUTPUT_TOKENS,
    judge: {
      enabled: true,
      kind: 'llama-cpp-server',
      baseUrl,
      timeoutMs: JUDGE_TIMEOUT_MS,
      maxOutputTokens: JUDGE_MAX_OUTPUT_TOKENS,
    },
  };

  writeFileSync(artifacts.runtime, [
    `Runtime: ${redactText(LLAMA_SERVER)}`,
    'Version stdout:',
    version.stdout.trim() || '<empty>',
    'Version stderr:',
    version.stderr.trim() || '<empty>',
    `Model: ${redactText(MODEL_PATH)}`,
    `Model SHA256: ${modelSha256}`,
    `Base URL: ${baseUrl}`,
    `Corpus: ${redactText(CORPUS_PATH)}`,
    `Corpus ID: ${corpus.id}`,
    `Corpus cases: ${corpus.cases.length}`,
  ].join('\n') + '\n');

  const serverArgs = ['-m', MODEL_PATH, '--host', '127.0.0.1', '--port', String(port), '-c', '4096', '--no-webui', '--jinja'];
  writeFileSync(artifacts.serverCommand, `${redactText([LLAMA_SERVER, ...serverArgs].join(' '))}\n`);

  const stdoutFd = openSync(SERVER_LOG_STDOUT_TMP, 'w');
  const stderrFd = openSync(SERVER_LOG_STDERR_TMP, 'w');
  const server = spawn(LLAMA_SERVER, serverArgs, { stdio: ['ignore', stdoutFd, stderrFd] });
  let serverExit = null;
  server.on('exit', (code, signal) => {
    serverExit = { code, signal };
  });

  let health = null;
  let stoppedEarly = null;
  try {
    health = await waitForHealth(baseUrl, SERVER_START_TIMEOUT_MS);
    writeJson(artifacts.serverHealth, { baseUrl, ...health, body: preview(health.body, 500) });
    writeFileSync(artifacts.serverStartStatus, `healthy ${baseUrl}\n`);

    const baseOptions = createLlamaCppLocalDiagnosisPolishOptions(generatorConfig);
    if (!baseOptions.enabled || !baseOptions.provider || !baseOptions.judgeProvider) throw new Error('adapter providers were not configured');
    const realGeneratorProvider = baseOptions.provider;
    const realJudgeProvider = baseOptions.judgeProvider;
    let activeCapture = null;
    const wrappedOptions = {
      enabled: true,
      timeoutMs: GENERATOR_TIMEOUT_MS,
      judgeTimeoutMs: JUDGE_TIMEOUT_MS,
      provider: {
        async completeLocalDiagnosisPolish(request) {
          const capture = activeCapture;
          if (capture) {
            capture.generatorRequested = true;
            capture.generatorFactCount = request.factPacket.facts.length;
            capture.generatorPromptLength = request.prompt.length;
          }
          const started = Date.now();
          try {
            const value = await realGeneratorProvider.completeLocalDiagnosisPolish(request);
            if (capture) {
              capture.generatorElapsedMs = Date.now() - started;
              capture.generatorRaw = value;
              capture.generatorRawPreview = preview(value);
            }
            return value;
          } catch (error) {
            if (capture) {
              capture.generatorElapsedMs = Date.now() - started;
              capture.generatorError = error instanceof Error ? error.name : String(error);
            }
            throw error;
          }
        },
      },
      judgeProvider: {
        async completeLocalNarrativeJudge(request) {
          const capture = activeCapture;
          if (capture) {
            capture.judgeRequested = true;
            capture.judgeCandidateSentenceCount = request.candidate.sentences.length;
            capture.judgePromptLength = request.prompt.length;
          }
          const started = Date.now();
          try {
            const value = await realJudgeProvider.completeLocalNarrativeJudge(request);
            if (capture) {
              capture.judgeElapsedMs = Date.now() - started;
              capture.judgeRaw = value;
              capture.judgeRawPreview = preview(value);
            }
            return value;
          } catch (error) {
            if (capture) {
              capture.judgeElapsedMs = Date.now() - started;
              capture.judgeError = error instanceof Error ? error.name : String(error);
            }
            throw error;
          }
        },
      },
    };

    const results = [];
    for (const testCase of corpus.cases) {
      const input = toInput(testCase);
      const deterministicView = buildFlightLearnDiagnosisView(input);
      const factPacket = buildLocalDiagnosisFactPacket(input, deterministicView);
      const capture = {
        id: testCase.id,
        generatorRequested: false,
        judgeRequested: false,
        generatorRaw: null,
        judgeRaw: null,
        generatorRawPreview: null,
        judgeRawPreview: null,
        generatorElapsedMs: null,
        judgeElapsedMs: null,
        generatorError: null,
        judgeError: null,
        generatorFactCount: null,
        generatorPromptLength: null,
        judgePromptLength: null,
        judgeCandidateSentenceCount: null,
      };
      activeCapture = capture;
      const started = Date.now();
      let productResult = null;
      let productError = null;
      try {
        productResult = await buildFlightLearnDiagnosisViewWithLocalPolish(input, wrappedOptions);
      } catch (error) {
        productError = error instanceof Error ? error.name : String(error);
      }
      const elapsedMs = Date.now() - started;
      activeCapture = null;
      await sleep(25);

      const schema = capture.generatorRaw ? schemaCheckGenerator(capture.generatorRaw) : { parseValid: false, schemaValid: false, schemaIssue: capture.generatorError ?? null, parsed: null };
      const validation = capture.generatorRaw ? validateLocalDiagnosisPolishResponse(capture.generatorRaw, { factPacket, deterministicView }) : null;
      const verifierPass = Boolean(validation?.ok);
      const narrativeCandidate = validation?.ok ? validation.narrativeCandidate : null;
      const judgeValidation = capture.judgeRaw && narrativeCandidate ? validateLocalNarrativeJudgeResponse(capture.judgeRaw, narrativeCandidate) : null;
      const judgePass = Boolean(judgeValidation?.ok);
      const accepted = Boolean(narrativeCandidate && productResult?.usedLocalModel && productResult.fallbackReason === null && judgePass);
      const validationIssue = validation?.ok ? null : (validation?.issue ?? productResult?.validationIssue ?? capture.generatorError ?? productError ?? null);
      const judgeIssue = judgeValidation?.ok ? null : (judgeValidation?.issue ?? (capture.judgeRequested && !capture.judgeRaw ? (productResult?.validationIssue ?? capture.judgeError ?? null) : null));
      const fallbackReason = narrativeFallbackReason({ accepted, productResult, productError, validation, narrativeCandidate, capture, judgeValidation });
      const acceptedWhatHappened = accepted ? productResult.view.whatHappened : null;
      const unsafeAccepted = acceptedNarrativeUnsafe(acceptedWhatHappened);

      results.push({
        id: testCase.id,
        title: testCase.title,
        expectedRubricOutcome: testCase.primaryExpectedRubricOutcome,
        elapsedMs,
        generatorElapsedMs: capture.generatorElapsedMs,
        judgeElapsedMs: capture.judgeElapsedMs,
        generatorRequested: capture.generatorRequested,
        judgeRequested: capture.judgeRequested,
        generatorFactCount: capture.generatorFactCount,
        generatorPromptLength: capture.generatorPromptLength,
        judgePromptLength: capture.judgePromptLength,
        judgeCandidateSentenceCount: capture.judgeCandidateSentenceCount,
        parseValid: schema.parseValid,
        schemaValid: schema.schemaValid,
        verifierPass,
        narrativeCandidate: Boolean(narrativeCandidate),
        judgePass,
        accepted,
        unsafeAccepted,
        fallbackReason,
        schemaIssue: schema.schemaIssue,
        validationIssue,
        judgeIssue,
        productUsedLocalModel: productResult?.usedLocalModel ?? false,
        productFallbackReason: productResult?.fallbackReason ?? null,
        productValidationIssue: productResult?.validationIssue ?? null,
        productError,
        generatorError: capture.generatorError,
        judgeError: capture.judgeError,
        deterministicWhatHappenedPreview: preview(deterministicView.whatHappened, 280),
        generatorRawPreview: capture.generatorRawPreview,
        judgeRawPreview: capture.judgeRawPreview,
        acceptedWhatHappenedPreview: preview(acceptedWhatHappened, 500),
      });

      if (unsafeAccepted) {
        stoppedEarly = `unsafe accepted output in ${testCase.id}`;
        break;
      }
    }

    const fallbackReasons = countMap(results.filter((result) => !result.accepted).map((result) => result.fallbackReason));
    const validationIssues = countMap(results.map((result) => result.validationIssue).filter(Boolean));
    const judgeIssues = countMap(results.map((result) => result.judgeIssue).filter(Boolean));
    const summary = {
      generatedAt: new Date().toISOString(),
      runStartedAt: RUN_STARTED_AT,
      adapterPath: 'buildFlightLearnDiagnosisViewWithLocalPolish -> createLlamaCppLocalDiagnosisPolishOptions -> llama.cpp generator + judge providers',
      hostedProviderUsed: false,
      baseUrl,
      model: {
        path: redactText(MODEL_PATH),
        sha256: modelSha256,
      },
      runtime: {
        path: redactText(LLAMA_SERVER),
        versionStdoutPreview: preview(version.stdout, 500),
        versionStderrPreview: preview(version.stderr, 500),
      },
      corpus: {
        path: redactText(CORPUS_PATH),
        id: corpus.id,
        totalCases: corpus.cases.length,
        replayedCases: results.length,
      },
      constrainedAdapterConfiguration: {
        route: '/v1/chat/completions',
        responseFormat: 'OpenAI-style response_format.type=json_schema via product adapter',
        generatorSchemaName: 'flight_learn_diagnosis_polish_v2',
        judgeSchemaName: 'flight_learn_narrative_judge_v1',
        generatorTimeoutMs: GENERATOR_TIMEOUT_MS,
        judgeTimeoutMs: JUDGE_TIMEOUT_MS,
        generatorMaxOutputTokens: GENERATOR_MAX_OUTPUT_TOKENS,
        judgeMaxOutputTokens: JUDGE_MAX_OUTPUT_TOKENS,
        loopbackOnly: true,
        failClosed: true,
      },
      priorBaselines: {
        constrainedGeneratorOnly: readPriorGeneratorOnly(),
        promptOnlyBestVariant: readPriorPromptBestVariant(),
      },
      totalCases: results.length,
      parseValidCount: results.filter((result) => result.parseValid).length,
      schemaValidCount: results.filter((result) => result.schemaValid).length,
      verifierPassCount: results.filter((result) => result.verifierPass).length,
      narrativeCandidateCount: results.filter((result) => result.narrativeCandidate).length,
      judgeCallCount: results.filter((result) => result.judgeRequested).length,
      judgePassCount: results.filter((result) => result.judgePass).length,
      acceptedCount: results.filter((result) => result.accepted).length,
      fallbackCount: results.filter((result) => !result.accepted).length,
      fallbackReasons,
      timeoutCount: results.filter((result) => result.fallbackReason === 'timeout').length,
      unsafeAcceptedCount: results.filter((result) => result.unsafeAccepted).length,
      schemaIssues: countMap(results.map((result) => result.schemaIssue).filter(Boolean)),
      validationIssues,
      judgeIssues,
      latencyMs: summarizeLatencies(results.map((result) => result.elapsedMs)),
      generatorLatencyMs: summarizeLatencies(results.map((result) => result.generatorElapsedMs)),
      judgeLatencyMs: summarizeLatencies(results.map((result) => result.judgeElapsedMs)),
      stoppedEarly,
      safetyBlocker: results.some((result) => result.unsafeAccepted),
      recommendation: recommendationFor(results),
    };

    writeJson(artifacts.summary, summary);
    writeJson(artifacts.results, { generatedAt: summary.generatedAt, results });
    writeJson(artifacts.samples, {
      generatedAt: summary.generatedAt,
      note: 'Sanitized previews only; full prompts were not persisted.',
      samples: results.map((result) => ({
        id: result.id,
        generatorRawPreview: result.generatorRawPreview,
        judgeRawPreview: result.judgeRawPreview,
        acceptedWhatHappenedPreview: result.acceptedWhatHappenedPreview,
        fallbackReason: result.fallbackReason,
        validationIssue: result.validationIssue,
        judgeIssue: result.judgeIssue,
      })),
    });
    writeFileSync(artifacts.failureNotes, qualitativeNotes(summary));

    console.log(JSON.stringify({
      corpusId: corpus.id,
      replayedCases: results.length,
      parseValidCount: summary.parseValidCount,
      schemaValidCount: summary.schemaValidCount,
      verifierPassCount: summary.verifierPassCount,
      judgePassCount: summary.judgePassCount,
      acceptedCount: summary.acceptedCount,
      fallbackCount: summary.fallbackCount,
      fallbackReasons: summary.fallbackReasons,
      timeoutCount: summary.timeoutCount,
      unsafeAcceptedCount: summary.unsafeAcceptedCount,
      latencyMs: summary.latencyMs,
      judgeLatencyMs: summary.judgeLatencyMs,
      recommendation: summary.recommendation,
    }, null, 2));
  } finally {
    if (server.exitCode === null && server.signalCode === null) {
      server.kill('SIGINT');
      await new Promise((resolvePromise) => {
        const timeout = setTimeout(() => {
          if (server.exitCode === null && server.signalCode === null) server.kill('SIGKILL');
          resolvePromise();
        }, 10000);
        server.once('exit', () => {
          clearTimeout(timeout);
          resolvePromise();
        });
      });
    }
    closeSync(stdoutFd);
    closeSync(stderrFd);
    const stdoutBytes = existsSync(SERVER_LOG_STDOUT_TMP) ? statSync(SERVER_LOG_STDOUT_TMP).size : 0;
    const stderrBytes = existsSync(SERVER_LOG_STDERR_TMP) ? statSync(SERVER_LOG_STDERR_TMP).size : 0;
    const stdoutTempLogRemoved = unlinkIfExists(SERVER_LOG_STDOUT_TMP);
    const stderrTempLogRemoved = unlinkIfExists(SERVER_LOG_STDERR_TMP);
    writeFileSync(artifacts.serverLogSummary, [
      `stdout-bytes-captured-temp-before-delete: ${stdoutBytes}`,
      `stderr-bytes-captured-temp-before-delete: ${stderrBytes}`,
      `stdout-temp-log-deleted: ${stdoutTempLogRemoved}`,
      `stderr-temp-log-deleted: ${stderrTempLogRemoved}`,
      'Raw server logs were captured only to temporary files, summarized by byte count, and deleted before completion to avoid prompt/session leakage.',
      'Lifecycle status is recorded in server-start/server-health/server-final artifacts.',
    ].join('\n') + '\n');
    writeFileSync(artifacts.serverFinalStatus, `exit=${serverExit ? JSON.stringify(serverExit) : JSON.stringify({ code: server.exitCode, signal: server.signalCode })}\n`);
    const listener = spawnSync('lsof', ['-nP', '-iTCP', '-sTCP:LISTEN'], { encoding: 'utf8' });
    const listenerText = `${listener.stdout ?? ''}${listener.stderr ?? ''}`.split('\n').filter((line) => line.includes(':181')).join('\n');
    writeFileSync(artifacts.postRunListener, redactText(listenerText ? `${listenerText}\n` : '<no 181xx listeners observed by lsof filter>\n'));
  }
}

function readPriorGeneratorOnly() {
  try {
    const data = JSON.parse(readFileSync(resolve(artifactDir, '../20260529-llama-cpp-constrained-json-probe/constrained-json-narrative-results.json'), 'utf8'));
    return {
      routeId: data.routeId,
      corpusId: data.corpusId,
      totalCases: data.totalCases,
      parseValidCount: data.parseValidCount,
      schemaValidCount: data.schemaValidCount,
      verifierPassCount: data.verifierPassCount,
      timeoutCount: data.timeoutCount,
      latencyMs: data.latencyMs,
      judgeRun: false,
    };
  } catch (error) {
    return { unavailable: true, error: error instanceof Error ? error.message : String(error) };
  }
}

function readPriorPromptBestVariant() {
  try {
    const data = JSON.parse(readFileSync(resolve(artifactDir, '../20260529-bonsai-4b-schema-prompt-tuning/schema-prompt-tuning-summary.json'), 'utf8'));
    const best = data.variants.find((variant) => variant.id === 'exact-example-single-json') ?? null;
    return best
      ? {
          id: best.id,
          totalCases: best.totalCases,
          parseValidCount: best.parseValidCount,
          schemaValidCount: best.schemaValidCount,
          verifierPassCount: best.verifierPassCount,
          judgePassCount: best.judgePassCount,
          acceptedCount: best.acceptedCount,
          fallbackCount: best.fallbackCount,
          timeoutCount: best.timeoutCount,
          unsafeAcceptCount: best.unsafeAcceptCount,
          fallbackReasons: best.fallbackReasons,
          latencyMs: best.latencyMs,
          judgeLatencyMs: best.judgeLatencyMs,
        }
      : { unavailable: true, error: 'best variant not found' };
  } catch (error) {
    return { unavailable: true, error: error instanceof Error ? error.message : String(error) };
  }
}

function recommendationFor(results) {
  const unsafeAccepted = results.some((result) => result.unsafeAccepted);
  if (unsafeAccepted) return 'Hard safety blocker: unsafe accepted output observed. Do not proceed to model-enabled inbox integration.';
  const acceptedCount = results.filter((result) => result.accepted).length;
  if (acceptedCount === 0) return 'Stop/replan before model-enabled inbox integration for this runtime: constrained generator output did not pass the existing verifier + judge gates.';
  const latencies = summarizeLatencies(results.map((result) => result.elapsedMs));
  if (latencies.max !== null && latencies.max > 10000) return 'Investigate latency before UI integration: accepted narratives exist, but observed max latency is above a conservative interactive budget.';
  return 'Proceed cautiously to model-enabled inbox integration only for accepted narratives, with separate operator comprehension validation still required.';
}

main().catch((error) => {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  writeFileSync(artifacts.runOutput, `${redactText(message)}\n`);
  console.error(message);
  process.exitCode = 1;
});
