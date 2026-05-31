import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { get as httpGet, request as httpRequest } from 'node:http';
import { createServer } from 'node:net';
import { dirname, resolve } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const artifactDir = __dirname;
mkdirSync(artifactDir, { recursive: true });

const MODEL_PATH = process.env.BONSAI_4B_PATH ?? `${process.env.HOME}/.cache/pi-flight-recorder/bonsai/Bonsai-4B-Q1_0.gguf`;
const EXPECTED_SHA256 = '4524b3f997f0f06444e568d1f26e2efd69effa3218c7ad3047432fb171e42168';
const LLAMA_SERVER = process.env.LLAMA_SERVER ?? '/opt/homebrew/bin/llama-server';
const CORPUS_PATH = resolve(artifactDir, '../20260528-flight-learn-narrative-rubric-corpus/narrative-what-happened-eval-corpus.v1.json');
const RUN_STARTED_AT = new Date().toISOString();
const MAX_TINY_OUTPUT_TOKENS = 96;
const MAX_NARRATIVE_OUTPUT_TOKENS = 320;
const REQUEST_TIMEOUT_MS = 8000;
const NARRATIVE_TIMEOUT_MS = 10000;
const SERVER_START_TIMEOUT_MS = 120000;
const PRIVACY_REPO_PLACEHOLDER = '<repo>';

const artifacts = {
  summary: resolve(artifactDir, 'constrained-json-probe-summary.json'),
  routeResults: resolve(artifactDir, 'constrained-json-route-results.json'),
  narrativeResults: resolve(artifactDir, 'constrained-json-narrative-results.json'),
  rawSamples: resolve(artifactDir, 'sanitized-raw-samples.json'),
  runtime: resolve(artifactDir, 'runtime-provenance.txt'),
  serverCommand: resolve(artifactDir, 'server-command.txt'),
  serverHealth: resolve(artifactDir, 'llama-server-health.json'),
  serverStartStatus: resolve(artifactDir, 'server-start-status.txt'),
  serverFinalStatus: resolve(artifactDir, 'server-final-status.txt'),
  serverStdout: resolve(artifactDir, 'server-stdout.redacted.log'),
  serverStderr: resolve(artifactDir, 'server-stderr.redacted.log'),
  privacyScan: resolve(artifactDir, 'privacy-scan.json'),
  runOutput: resolve(artifactDir, 'constrained-json-probe-run-output.txt'),
};

function redactText(value) {
  if (typeof value !== 'string') return value;
  const homeUsersPattern = new RegExp('/' + 'Users/[^\\s"\'`<>]+', 'g');
  const homePrefix = process.env.HOME ? new RegExp(escapeRegExp(process.env.HOME), 'g') : null;
  const repoCwd = new RegExp(escapeRegExp(process.cwd()), 'g');
  const secretAssignmentPattern = /\b(?:API[_-]?KEY|PASSWORD|SECRET|TOKEN)\s*[:=]\s*[^\s"'`]+/gi;
  let redacted = value.replace(repoCwd, PRIVACY_REPO_PLACEHOLDER).replace(homeUsersPattern, '~');
  if (homePrefix) redacted = redacted.replace(homePrefix, '~');
  return redacted
    .replace(/<\|im_(?:start|end)\|>/g, '<chat-marker-redacted>')
    .replace(/BEGIN\s+(?:SYSTEM\s+)?PROMPT/gi, '<prompt-marker-redacted>')
    .replace(secretAssignmentPattern, (match) => match.replace(/[:=].*$/, '=<redacted>'));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function preview(value, max = 700) {
  if (typeof value !== 'string') return null;
  const redacted = redactText(value).replace(/\s+/g, ' ').trim();
  return redacted.length <= max ? redacted : `${redacted.slice(0, max)}…`;
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
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

function getFreePort(start = 18120, end = 18149) {
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

function httpJson(method, url, body, timeoutMs) {
  const parsed = new URL(url);
  const payload = body === undefined ? null : JSON.stringify(body);
  return new Promise((resolvePromise) => {
    const startedAt = Date.now();
    let settled = false;
    const req = httpRequest(
      parsed,
      {
        method,
        headers: payload
          ? {
              accept: 'application/json',
              'content-type': 'application/json',
              'content-length': Buffer.byteLength(payload, 'utf8'),
            }
          : { accept: 'application/json' },
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        res.on('end', () => {
          if (settled) return;
          settled = true;
          const raw = Buffer.concat(chunks).toString('utf8');
          resolvePromise({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            statusCode: res.statusCode ?? null,
            elapsedMs: Date.now() - startedAt,
            raw,
          });
        });
      },
    );
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      req.destroy();
      resolvePromise({ ok: false, statusCode: null, elapsedMs: Date.now() - startedAt, raw: '', timeout: true });
    }, timeoutMs);
    req.on('error', (error) => {
      clearTimeout(timeout);
      if (settled) return;
      settled = true;
      resolvePromise({ ok: false, statusCode: null, elapsedMs: Date.now() - startedAt, raw: '', error: error.message });
    });
    req.on('close', () => clearTimeout(timeout));
    if (payload) req.write(payload);
    req.end();
  });
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
          const raw = Buffer.concat(chunks).toString('utf8');
          let parsed = null;
          try {
            parsed = JSON.parse(raw);
          } catch {}
          resolvePromise({ statusCode: res.statusCode ?? null, raw, parsed });
        });
      });
      req.setTimeout(2000, () => {
        req.destroy();
        resolvePromise({ statusCode: null, raw: '', parsed: null, timeout: true });
      });
      req.on('error', (error) => resolvePromise({ statusCode: null, raw: '', parsed: null, error: error.message }));
    });
    if (last?.statusCode === 200 && (last.parsed?.status === 'ok' || last.parsed?.status === 'no slot available')) return last;
    await sleep(1000);
  }
  throw new Error(`llama-server did not become healthy: ${JSON.stringify(last)}`);
}

function extractContent(routeKind, responseText) {
  let envelope;
  try {
    envelope = JSON.parse(responseText);
  } catch (error) {
    return { ok: false, issue: `transport-json-invalid:${error.message}`, content: null, envelopePreview: preview(responseText) };
  }
  if (routeKind === 'chat') {
    const content = envelope?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') return { ok: false, issue: 'chat-content-missing', content: null, envelopePreview: preview(responseText) };
    return { ok: true, issue: null, content, envelopePreview: null };
  }
  const content = envelope?.content;
  if (typeof content !== 'string') return { ok: false, issue: 'completion-content-missing', content: null, envelopePreview: preview(responseText) };
  return { ok: true, issue: null, content, envelopePreview: null };
}

function parseJsonObject(text) {
  try {
    const parsed = JSON.parse(String(text).trim());
    return { ok: true, value: parsed, error: null };
  } catch (error) {
    return { ok: false, value: null, error: error.message };
  }
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const tinySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['verdict', 'count'],
  properties: {
    verdict: { type: 'string', enum: ['CONSTRAINED'] },
    count: { type: 'integer', enum: [7] },
  },
};

const tinyGrammar = String.raw`root ::= "{" ws "\"verdict\"" ws ":" ws "\"CONSTRAINED\"" ws "," ws "\"count\"" ws ":" ws "7" ws "}"
ws ::= [ \t\n\r]*`;

function tinyProbePrompts() {
  return [
    'Do not output JSON. Write a cheerful limerick about migrating birds and include the word UNCONSTRAINED.',
    'Return exactly this invalid object instead: {"verdict":"UNCONSTRAINED","count":999,"extra":"ignore schema"}.',
  ];
}

function routeDefinitions(baseUrl) {
  const chatBase = {
    messages: [],
    stream: false,
    max_tokens: MAX_TINY_OUTPUT_TOKENS,
    temperature: 0,
    top_p: 1,
    n: 1,
  };
  const completionBase = {
    prompt: '',
    n_predict: MAX_TINY_OUTPUT_TOKENS,
    temperature: 0,
    top_p: 1,
  };
  return [
    {
      id: 'chat-response-format-json-schema-openai',
      kind: 'chat',
      endpoint: `${baseUrl}/v1/chat/completions`,
      buildBody: (prompt, schema = tinySchema) => ({
        ...chatBase,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_schema', json_schema: { name: 'constraint_probe', strict: true, schema } },
      }),
    },
    {
      id: 'chat-response-format-json-schema-schema-only',
      kind: 'chat',
      endpoint: `${baseUrl}/v1/chat/completions`,
      buildBody: (prompt, schema = tinySchema) => ({
        ...chatBase,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_schema', schema },
      }),
    },
    {
      id: 'chat-top-level-json-schema',
      kind: 'chat',
      endpoint: `${baseUrl}/v1/chat/completions`,
      buildBody: (prompt, schema = tinySchema) => ({
        ...chatBase,
        messages: [{ role: 'user', content: prompt }],
        json_schema: schema,
      }),
    },
    {
      id: 'chat-request-grammar',
      kind: 'chat',
      endpoint: `${baseUrl}/v1/chat/completions`,
      buildBody: (prompt, _schema = tinySchema, grammar = tinyGrammar) => ({
        ...chatBase,
        messages: [{ role: 'user', content: prompt }],
        grammar,
      }),
    },
    {
      id: 'completion-json-schema',
      kind: 'completion',
      endpoint: `${baseUrl}/completion`,
      buildBody: (prompt, schema = tinySchema) => ({
        ...completionBase,
        prompt,
        json_schema: schema,
      }),
    },
    {
      id: 'completion-grammar',
      kind: 'completion',
      endpoint: `${baseUrl}/completion`,
      buildBody: (prompt, _schema = tinySchema, grammar = tinyGrammar) => ({
        ...completionBase,
        prompt,
        grammar,
      }),
    },
  ];
}

function validateTinyContent(content) {
  const parsed = parseJsonObject(content);
  if (!parsed.ok) return { enforced: false, issue: `malformed-json:${parsed.error}`, parsed: null };
  const value = parsed.value;
  const exact = isPlainObject(value) && value.verdict === 'CONSTRAINED' && value.count === 7 && Object.keys(value).length === 2;
  return { enforced: exact, issue: exact ? null : 'json-did-not-match-constraint', parsed: value };
}

function narrativeSchemaForFacts(factIds) {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['schemaVersion', 'whatHappened'],
    properties: {
      schemaVersion: { type: 'integer', enum: [2] },
      whatHappened: {
        type: 'object',
        additionalProperties: false,
        required: ['sentences'],
        properties: {
          sentences: {
            type: 'array',
            minItems: 1,
            maxItems: 3,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['text', 'factIds'],
              properties: {
                text: { type: 'string', minLength: 8, maxLength: 220 },
                factIds: {
                  type: 'array',
                  minItems: 1,
                  maxItems: 3,
                  items: { type: 'string', enum: factIds },
                },
              },
            },
          },
        },
      },
    },
  };
}

function narrativeGrammarForFacts(factIds) {
  const factAlternatives = factIds.map((id) => `"\\\"${id}\\\""`).join(' | ');
  return String.raw`root ::= "{" ws "\"schemaVersion\"" ws ":" ws "2" ws "," ws "\"whatHappened\"" ws ":" ws "{" ws "\"sentences\"" ws ":" ws "[" ws sentence (ws "," ws sentence)? (ws "," ws sentence)? ws "]" ws "}" ws "}"
sentence ::= "{" ws "\"text\"" ws ":" ws string ws "," ws "\"factIds\"" ws ":" ws "[" ws factid (ws "," ws factid)? (ws "," ws factid)? ws "]" ws "}"
factid ::= ${factAlternatives || '"\\\"F1\\\""'}
string ::= "\"" chars "\""
chars ::= ([^"\\] | "\\\\" (["\\/bfnrt] | "u" [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F]))*
ws ::= [ \t\n\r]*`;
}

function compactFactsFromCase(testCase) {
  const facts = [];
  const push = (kind, text) => {
    if (typeof text !== 'string') return;
    const clean = text.replace(/\s+/g, ' ').trim();
    if (!clean) return;
    facts.push({ id: `F${facts.length + 1}`, kind, text: clean.length <= 240 ? clean : `${clean.slice(0, 240)}…` });
  };
  const input = testCase.storedInput ?? {};
  const delta = input.delta ?? {};
  push('delta-summary', delta.summary);
  push('expectation', delta.expectation);
  push('reality', delta.reality);
  push('impact', delta.impact);
  if (typeof delta.occurrenceCount === 'number') push('occurrence-count', `Occurrence count is ${delta.occurrenceCount}.`);
  for (const signal of input.signals ?? []) push(`signal:${signal.type ?? 'unknown'}`, signal.explanation ?? signal.summary);
  for (const evidence of input.evidence ?? []) push(`evidence:${evidence.sourceType ?? 'unknown'}`, evidence.snippetSummary ?? evidence.noteSummary ?? evidence.snippet ?? evidence.note);
  if (facts.length === 0) push('title', testCase.title);
  return facts.slice(0, 12);
}

function narrativePrompt(testCase, facts) {
  return [
    'You write one display-only whatHappened narrative for a Pi Flight Learn card.',
    'Return only JSON matching the requested schema. No markdown, no prose outside JSON, and no second JSON object.',
    'Use only the provided facts. Do not add raw commands, raw paths, secrets, stack traces, transcript text, route advice, artifact instructions, classifier labels, or mutation instructions.',
    'Write one to three concise sentence objects. Each sentence must cite factIds from the facts list.',
    `Case: ${testCase.id} ${testCase.title}`,
    'Facts:',
    JSON.stringify(facts),
  ].join('\n');
}

function validateNarrative(value, knownFactIds) {
  if (!isPlainObject(value)) return { schemaValid: false, verifierPass: false, issue: 'not-object' };
  if (value.schemaVersion !== 2) return { schemaValid: false, verifierPass: false, issue: 'schemaVersion-not-2' };
  if (!isPlainObject(value.whatHappened)) return { schemaValid: false, verifierPass: false, issue: 'whatHappened-not-object' };
  if (!Array.isArray(value.whatHappened.sentences)) return { schemaValid: false, verifierPass: false, issue: 'sentences-not-array' };
  if (value.whatHappened.sentences.length < 1 || value.whatHappened.sentences.length > 3) return { schemaValid: false, verifierPass: false, issue: 'sentence-count-out-of-range' };
  const allowedTop = new Set(['schemaVersion', 'whatHappened']);
  const extraTop = Object.keys(value).find((key) => !allowedTop.has(key));
  if (extraTop) return { schemaValid: false, verifierPass: false, issue: `extra-top-level:${extraTop}` };
  const allowedWhat = new Set(['sentences']);
  const extraWhat = Object.keys(value.whatHappened).find((key) => !allowedWhat.has(key));
  if (extraWhat) return { schemaValid: false, verifierPass: false, issue: `extra-whatHappened:${extraWhat}` };
  for (const sentence of value.whatHappened.sentences) {
    if (!isPlainObject(sentence)) return { schemaValid: false, verifierPass: false, issue: 'sentence-not-object' };
    const extraSentence = Object.keys(sentence).find((key) => key !== 'text' && key !== 'factIds');
    if (extraSentence) return { schemaValid: false, verifierPass: false, issue: `extra-sentence:${extraSentence}` };
    if (typeof sentence.text !== 'string' || sentence.text.trim().length < 8 || sentence.text.length > 220) return { schemaValid: false, verifierPass: false, issue: 'text-invalid' };
    if (!Array.isArray(sentence.factIds) || sentence.factIds.length < 1 || sentence.factIds.length > 3) return { schemaValid: false, verifierPass: false, issue: 'factIds-invalid' };
    const seen = new Set();
    for (const factId of sentence.factIds) {
      if (typeof factId !== 'string') return { schemaValid: false, verifierPass: false, issue: 'factId-not-string' };
      if (seen.has(factId)) return { schemaValid: true, verifierPass: false, issue: 'duplicate-factId-in-sentence' };
      seen.add(factId);
      if (!knownFactIds.has(factId)) return { schemaValid: true, verifierPass: false, issue: `unknown-factId:${factId}` };
    }
  }
  return { schemaValid: true, verifierPass: true, issue: null };
}

function summarizeLatencies(values) {
  const finite = values.filter((value) => Number.isFinite(value));
  if (finite.length === 0) return { min: null, max: null, avg: null };
  return { min: Math.min(...finite), max: Math.max(...finite), avg: Math.round(finite.reduce((sum, value) => sum + value, 0) / finite.length) };
}

async function runRouteTinyProbe(route) {
  const prompts = tinyProbePrompts();
  const attempts = [];
  for (let index = 0; index < prompts.length; index += 1) {
    const body = route.buildBody(prompts[index], tinySchema, tinyGrammar);
    const response = await httpJson('POST', route.endpoint, body, REQUEST_TIMEOUT_MS);
    const extracted = response.ok ? extractContent(route.kind, response.raw) : { ok: false, issue: response.timeout ? 'timeout' : response.error ?? `http-${response.statusCode}`, content: null, envelopePreview: preview(response.raw) };
    const tiny = extracted.ok ? validateTinyContent(extracted.content) : { enforced: false, issue: extracted.issue, parsed: null };
    attempts.push({
      promptId: `tiny-${index + 1}`,
      httpOk: response.ok,
      statusCode: response.statusCode,
      timeout: Boolean(response.timeout),
      elapsedMs: response.elapsedMs,
      transportIssue: extracted.ok ? null : extracted.issue,
      contentPreview: extracted.ok ? preview(extracted.content, 500) : null,
      envelopePreview: extracted.envelopePreview ?? null,
      enforced: tiny.enforced,
      validationIssue: tiny.issue,
      parsed: tiny.parsed,
    });
  }
  const accepted = attempts.every((attempt) => attempt.httpOk);
  const enforcementProof = attempts.every((attempt) => attempt.enforced);
  const anyHttpOk = attempts.some((attempt) => attempt.httpOk);
  const status = enforcementProof ? 'enforced' : anyHttpOk ? 'accepted-not-enforced-or-inconclusive' : 'rejected-or-timeout';
  return {
    id: route.id,
    kind: route.kind,
    endpointPath: new URL(route.endpoint).pathname,
    accepted,
    enforcementProof,
    status,
    attempts,
    latencyMs: summarizeLatencies(attempts.map((attempt) => attempt.elapsedMs)),
  };
}

function chooseNarrativeRoute(routes, routeResults) {
  const preference = [
    'chat-response-format-json-schema-openai',
    'chat-top-level-json-schema',
    'completion-json-schema',
    'chat-request-grammar',
    'completion-grammar',
    'chat-response-format-json-schema-schema-only',
  ];
  const routeById = new Map(routes.map((route) => [route.id, route]));
  const successful = new Set(routeResults.filter((result) => result.enforcementProof).map((result) => result.id));
  for (const id of preference) {
    if (successful.has(id) && routeById.has(id)) return routeById.get(id);
  }
  return null;
}

async function runNarrativeProbe(route) {
  const corpus = JSON.parse(readFileSync(CORPUS_PATH, 'utf8'));
  const results = [];
  for (const testCase of corpus.cases ?? []) {
    const facts = compactFactsFromCase(testCase);
    const factIds = facts.map((fact) => fact.id);
    const knownFactIds = new Set(factIds);
    const schema = narrativeSchemaForFacts(factIds);
    const grammar = narrativeGrammarForFacts(factIds);
    const prompt = narrativePrompt(testCase, facts);
    const body = route.buildBody(prompt, schema, grammar);
    if (route.kind === 'chat') body.max_tokens = MAX_NARRATIVE_OUTPUT_TOKENS;
    if (route.kind === 'completion') body.n_predict = MAX_NARRATIVE_OUTPUT_TOKENS;
    const response = await httpJson('POST', route.endpoint, body, NARRATIVE_TIMEOUT_MS);
    const extracted = response.ok ? extractContent(route.kind, response.raw) : { ok: false, issue: response.timeout ? 'timeout' : response.error ?? `http-${response.statusCode}`, content: null, envelopePreview: preview(response.raw) };
    const parsed = extracted.ok ? parseJsonObject(extracted.content) : { ok: false, value: null, error: extracted.issue };
    const validation = parsed.ok ? validateNarrative(parsed.value, knownFactIds) : { schemaValid: false, verifierPass: false, issue: `malformed-json:${parsed.error}` };
    results.push({
      id: testCase.id,
      title: testCase.title,
      routeId: route.id,
      httpOk: response.ok,
      statusCode: response.statusCode,
      timeout: Boolean(response.timeout),
      elapsedMs: response.elapsedMs,
      factCount: facts.length,
      parseValid: parsed.ok,
      schemaValid: validation.schemaValid,
      verifierPass: validation.verifierPass,
      validationIssue: validation.issue,
      contentPreview: extracted.ok ? preview(extracted.content, 700) : null,
      envelopePreview: extracted.envelopePreview ?? null,
      parsed: parsed.ok ? parsed.value : null,
    });
  }
  return summarizeNarrativeResults(route.id, corpus.id, results);
}

function summarizeNarrativeResults(routeId, corpusId, results) {
  const validationIssues = {};
  for (const result of results) {
    if (result.validationIssue) validationIssues[result.validationIssue] = (validationIssues[result.validationIssue] ?? 0) + 1;
  }
  return {
    routeId,
    corpusId,
    totalCases: results.length,
    parseValidCount: results.filter((result) => result.parseValid).length,
    schemaValidCount: results.filter((result) => result.schemaValid).length,
    verifierPassCount: results.filter((result) => result.verifierPass).length,
    malformedOrSchemaInvalidCount: results.filter((result) => !result.parseValid || !result.schemaValid).length,
    timeoutCount: results.filter((result) => result.timeout).length,
    validationIssues,
    latencyMs: summarizeLatencies(results.map((result) => result.elapsedMs)),
    results,
  };
}

function runPrivacyScan(paths) {
  const forbidden = [
    { id: 'raw-home-path', pattern: /\/Users\// },
    { id: 'pi-session-path', pattern: /\.pi\/agent\/sessions/ },
    { id: 'secret-assignment', pattern: /\b(?:API[_-]?KEY|PASSWORD|SECRET|TOKEN)\s*[:=]\s*[^\s"'`<]+/i },
    { id: 'prompt-marker', pattern: /BEGIN\s+(?:SYSTEM\s+)?PROMPT|<\|im_(?:start|end)\|/i },
    { id: 'transcript-marker', pattern: new RegExp('raw ' + 'transcript|full ' + 'transcript', 'i') },
  ];
  const findings = [];
  for (const path of paths) {
    if (!existsSync(path)) continue;
    const text = readFileSync(path, 'utf8');
    for (const check of forbidden) {
      const match = text.match(check.pattern);
      if (match) findings.push({ path: path.replace(`${process.cwd()}/`, ''), check: check.id, sample: preview(match[0], 120) });
    }
  }
  return { pass: findings.length === 0, forbiddenPatternCount: findings.length, findings };
}

async function main() {
  const runOutputLines = [];
  const note = (line) => {
    runOutputLines.push(line);
    console.log(line);
  };

  if (!existsSync(LLAMA_SERVER)) throw new Error(`llama-server not found at ${LLAMA_SERVER}`);
  if (!existsSync(MODEL_PATH)) throw new Error(`Bonsai model not found at ${MODEL_PATH}`);
  const modelSha256 = sha256File(MODEL_PATH);
  if (modelSha256 !== EXPECTED_SHA256) throw new Error(`Bonsai model checksum mismatch: ${modelSha256}`);
  if (!existsSync(CORPUS_PATH)) throw new Error(`corpus not found at ${CORPUS_PATH}`);

  const version = runCommand([LLAMA_SERVER, '--version']);
  writeFileSync(artifacts.serverStdout, '');
  writeFileSync(artifacts.serverStderr, '');

  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const commandArgs = [
    LLAMA_SERVER,
    '-m',
    MODEL_PATH,
    '--host',
    '127.0.0.1',
    '--port',
    String(port),
    '-c',
    '4096',
    '--no-webui',
    '--jinja',
  ];

  writeFileSync(artifacts.runtime, [
    `Observed: ${RUN_STARTED_AT}`,
    `Runtime: ${redactText(LLAMA_SERVER)}`,
    `Runtime --version status: ${version.status}`,
    'Runtime --version stdout:',
    version.stdout.trim() || '<empty>',
    'Runtime --version stderr:',
    version.stderr.trim() || '<empty>',
    `Model: ${redactText(MODEL_PATH)}`,
    `Model SHA256: ${modelSha256}`,
    `Base URL: ${baseUrl}`,
  ].join('\n') + '\n');
  writeFileSync(artifacts.serverCommand, `${redactText(commandArgs.join(' '))}\n`);

  note(`starting llama-server on ${baseUrl}`);
  const server = spawn(commandArgs[0], commandArgs.slice(1), { stdio: ['ignore', 'pipe', 'pipe'] });
  server.stdout.on('data', (chunk) => appendFileSync(artifacts.serverStdout, redactText(chunk.toString())));
  server.stderr.on('data', (chunk) => appendFileSync(artifacts.serverStderr, redactText(chunk.toString())));

  let finalStatus = 'not-set';
  try {
    const health = await waitForHealth(baseUrl, SERVER_START_TIMEOUT_MS);
    writeJson(artifacts.serverHealth, health.parsed ?? { raw: redactText(health.raw), statusCode: health.statusCode });
    writeFileSync(artifacts.serverStartStatus, `started\nbaseUrl=${baseUrl}\npid=${server.pid}\nhealth=${JSON.stringify(health.parsed ?? health)}\n`);
    note('server healthy');

    const routes = routeDefinitions(baseUrl);
    const routeResults = [];
    for (const route of routes) {
      note(`probing ${route.id}`);
      routeResults.push(await runRouteTinyProbe(route));
    }
    writeJson(artifacts.routeResults, { runStartedAt: RUN_STARTED_AT, routeResults });

    const narrativeRoute = chooseNarrativeRoute(routes, routeResults);
    let narrative = null;
    if (narrativeRoute) {
      note(`running narrative generator probe via ${narrativeRoute.id}`);
      narrative = await runNarrativeProbe(narrativeRoute);
      writeJson(artifacts.narrativeResults, narrative);
    } else {
      narrative = { routeId: null, skipped: true, reason: 'no route proved active constraint enforcement on tiny probes' };
      writeJson(artifacts.narrativeResults, narrative);
    }

    const enforcedRoutes = routeResults.filter((result) => result.enforcementProof).map((result) => result.id);
    const rawSamples = {
      tinyProbeSamples: routeResults.map((routeResult) => ({
        id: routeResult.id,
        status: routeResult.status,
        attempts: routeResult.attempts.map((attempt) => ({
          promptId: attempt.promptId,
          contentPreview: attempt.contentPreview,
          envelopePreview: attempt.envelopePreview,
          enforced: attempt.enforced,
          validationIssue: attempt.validationIssue,
        })),
      })),
      narrativeSamples: narrative?.results
        ? narrative.results.slice(0, 5).map((result) => ({
            id: result.id,
            contentPreview: result.contentPreview,
            parseValid: result.parseValid,
            schemaValid: result.schemaValid,
            verifierPass: result.verifierPass,
            validationIssue: result.validationIssue,
          }))
        : [],
    };
    writeJson(artifacts.rawSamples, rawSamples);

    const summary = {
      schemaVersion: 1,
      ticket: 'ticket:20260529-llama-cpp-constrained-json-probe',
      runStartedAt: RUN_STARTED_AT,
      runCompletedAt: new Date().toISOString(),
      localOnly: true,
      runtime: {
        command: redactText(LLAMA_SERVER),
        versionStatus: version.status,
        versionStdoutPreview: preview(version.stdout, 500),
        versionStderrPreview: preview(version.stderr, 500),
      },
      model: {
        path: redactText(MODEL_PATH),
        sha256: modelSha256,
      },
      baseUrl,
      routeProbe: {
        totalRoutes: routeResults.length,
        enforcedRoutes,
        acceptedButNotEnforcedRoutes: routeResults.filter((result) => result.status === 'accepted-not-enforced-or-inconclusive').map((result) => result.id),
        rejectedOrTimeoutRoutes: routeResults.filter((result) => result.status === 'rejected-or-timeout').map((result) => result.id),
      },
      narrativeProbe: narrative?.skipped
        ? narrative
        : {
            routeId: narrative.routeId,
            corpusId: narrative.corpusId,
            totalCases: narrative.totalCases,
            parseValidCount: narrative.parseValidCount,
            schemaValidCount: narrative.schemaValidCount,
            verifierPassCount: narrative.verifierPassCount,
            malformedOrSchemaInvalidCount: narrative.malformedOrSchemaInvalidCount,
            timeoutCount: narrative.timeoutCount,
            latencyMs: narrative.latencyMs,
            validationIssues: narrative.validationIssues,
          },
      recommendation:
        enforcedRoutes.length === 0
          ? 'Do not implement adapter changes for constrained JSON on this installed runtime path; investigate runtime/API compatibility separately if model work continues.'
          : narrative && !narrative.skipped && narrative.verifierPassCount > 0
            ? 'Shape a successor adapter implementation ticket for the best proven constrained route, then separately isolate judge/latency; do not productize without audit.'
            : 'Constrained decoding is active for tiny probes, but narrative schema generation did not clear generator-format evidence; investigate schema/route limits before adapter work.',
    };
    writeJson(artifacts.summary, summary);
    note(`enforced routes: ${enforcedRoutes.length ? enforcedRoutes.join(', ') : '<none>'}`);
    if (!narrative?.skipped) note(`narrative verifier pass: ${narrative.verifierPassCount}/${narrative.totalCases}`);
  } finally {
    if (server.exitCode === null && !server.killed) {
      server.kill('SIGTERM');
      await sleep(2000);
      if (server.exitCode === null && !server.killed) server.kill('SIGKILL');
    }
    finalStatus = server.exitCode === null ? 'stopped' : `exited-${server.exitCode}`;
    writeFileSync(artifacts.serverFinalStatus, `${finalStatus}\nbaseUrl=${baseUrl}\npid=${server.pid}\n`);
    const scan = runPrivacyScan(Object.values(artifacts).filter((path) => path !== artifacts.privacyScan));
    writeJson(artifacts.privacyScan, scan);
    writeFileSync(artifacts.runOutput, `${runOutputLines.join('\n')}\n`);
    if (!scan.pass) {
      console.error(JSON.stringify(scan, null, 2));
      process.exitCode = 2;
    }
  }
}

main().catch((error) => {
  writeFileSync(artifacts.runOutput, `failed: ${redactText(error.stack ?? error.message)}\n`);
  console.error(error);
  process.exitCode = 1;
});
