import { request } from 'node:http';
import { buildFlightLearnDiagnosisView } from '../../../../src/flight-learn-diagnosis.ts';
import { buildLocalDiagnosisFactPacket, buildLocalDiagnosisPrompt } from '../../../../src/flight-learn-local-diagnosis-model.ts';

const baseUrl = process.argv[2];
if (!baseUrl) throw new Error('usage: node --import tsx probe-real-bonsai-raw.mjs <baseUrl>');
const evidenceRefs = [
  {
    sourceType: 'occurrence',
    sourceId: 'occ-real-bonsai-raw',
    sourceFile: null,
    sessionFile: 'session.jsonl',
    cwd: '/Users/alice/Code/personal/pi-flight-recorder',
    entryId: 'entry-real-bonsai-raw',
    timestamp: '2026-05-27T18:35:00.000Z',
    snippet: 'bash cd /Users/alice/Code/personal/pi-flight-recorder && npm test failed twice from a stale shell',
    note: 'Synthetic real Bonsai raw probe fixture',
  },
];
const delta = {
  id: 'delta-real-bonsai-raw',
  status: 'candidate',
  source: 'detector',
  summary: 'Repeated failure pattern: bash cd /Users/alice/Code/personal/pi-flight-recorder && npm test',
  expectation: 'Validation should run from a fresh project shell after changes.',
  reality: 'Observed 2 related failure occurrences in reflection cluster cluster_real_bonsai_raw.',
  impact: 'Repeated validation friction makes the result hard to trust.',
  severity: 'medium',
  cwd: '/Users/alice/Code/personal/pi-flight-recorder',
  sourceSessionFile: 'session.jsonl',
  sourceEntryId: 'entry-real-bonsai-raw',
  evidenceRefs,
  activeArtifactCandidateId: null,
  statusReason: null,
  metadata: { count: 2 },
  createdAt: '2026-05-27T18:35:00.000Z',
  updatedAt: '2026-05-27T18:35:00.000Z',
  acceptedAt: null,
  routedAt: null,
  dismissedAt: null,
  resolvedAt: null,
  recurringAt: null,
};
const signals = [
  {
    id: 'sig-real-bonsai-raw',
    deltaId: delta.id,
    type: 'failed-validation',
    explanation: 'Validation failed twice from the same stale shell pattern.',
    confidence: 0.74,
    evidenceRefs,
    metadata: {},
    createdAt: '2026-05-27T18:35:00.000Z',
  },
];
const input = { delta, signals };
const deterministicView = buildFlightLearnDiagnosisView(input);
const factPacket = buildLocalDiagnosisFactPacket(input, deterministicView);
const prompt = buildLocalDiagnosisPrompt(factPacket);
const body = JSON.stringify({
  messages: [{ role: 'user', content: prompt }],
  stream: false,
  max_tokens: 192,
  temperature: 0.1,
  top_p: 0.9,
  n: 1,
  response_format: { type: 'json_object' },
  model: 'Bonsai-1.7B-Q1_0',
});
const url = new URL('/v1/chat/completions', baseUrl);
const started = Date.now();
const raw = await new Promise((resolve, reject) => {
  const req = request(url, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) },
  }, (res) => {
    let text = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => { text += chunk; });
    res.on('end', () => resolve({ statusCode: res.statusCode, text }));
  });
  req.on('error', reject);
  req.end(body);
});
let parsed = null;
try { parsed = JSON.parse(raw.text); } catch {}
const content = parsed?.choices?.[0]?.message?.content ?? null;
console.log(JSON.stringify({
  elapsedMs: Date.now() - started,
  requestSummary: {
    endpoint: url.toString(),
    bodyBytes: Buffer.byteLength(body),
    promptChars: prompt.length,
    promptContainsRedactedUserPath: prompt.includes('/Users/<user>'),
    promptContainsRawUserPath: prompt.includes('/Users/alice'),
    stream: false,
    max_tokens: 192,
    temperature: 0.1,
    response_format: { type: 'json_object' },
  },
  statusCode: raw.statusCode,
  content,
  rawEnvelopeKeys: parsed && typeof parsed === 'object' ? Object.keys(parsed) : null,
}, null, 2));
