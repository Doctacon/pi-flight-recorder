import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildFlightLearnDiagnosisView,
} from '../../../../src/flight-learn-diagnosis.ts';
import {
  buildLocalDiagnosisFactPacket,
  buildLocalDiagnosisPrompt,
} from '../../../../src/flight-learn-local-diagnosis-model.ts';
import { createLlamaCppLocalDiagnosisPolishProvider } from '../../../../src/flight-learn-llama-cpp-adapter.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const corpus = JSON.parse(readFileSync(resolve(__dirname, '../20260528-flight-learn-narrative-rubric-corpus/narrative-what-happened-eval-corpus.v1.json'), 'utf8'));
const baseUrl = process.argv[2] ?? 'http://127.0.0.1:18118';
const now = new Date().toISOString();

function inputFromCase(testCase) {
  const delta = testCase.storedInput.delta;
  const evidenceRefs = (testCase.storedInput.evidence ?? []).map((ref, index) => ({
    sourceType: ref.sourceType ?? 'manual', sourceId: ref.sourceId ?? `synthetic-${index}`, sourceFile: null, sessionFile: null, cwd: null, entryId: null, timestamp: ref.timestamp ?? null, snippet: ref.snippetSummary ?? ref.snippet ?? null, note: ref.noteSummary ?? ref.note ?? null,
  }));
  const fullDelta = {
    id: delta.id ?? testCase.id, status: delta.status ?? 'candidate', source: delta.source ?? 'detector', summary: delta.summary ?? testCase.title, expectation: delta.expectation ?? null, reality: delta.reality ?? null, impact: delta.impact ?? null, severity: delta.severity ?? 'medium', cwd: null, sourceSessionFile: null, sourceEntryId: null, evidenceRefs, activeArtifactCandidateId: null, statusReason: null, metadata: delta.occurrenceCount ? { count: delta.occurrenceCount } : {}, createdAt: now, updatedAt: now, acceptedAt: null, routedAt: null, dismissedAt: null, resolvedAt: null, recurringAt: null,
  };
  const signals = (testCase.storedInput.signals ?? []).map((signal, index) => ({ id: `signal-${testCase.id}-${index}`, deltaId: fullDelta.id, type: signal.type ?? 'other', explanation: signal.explanation ?? 'Synthetic redacted signal.', confidence: typeof signal.confidence === 'number' ? signal.confidence : null, evidenceRefs: [], metadata: {}, createdAt: now }));
  return { delta: fullDelta, signals };
}

const provider = createLlamaCppLocalDiagnosisPolishProvider({ enabled: true, kind: 'llama-cpp-server', baseUrl, timeoutMs: 5000, maxOutputTokens: 256 });
const samples = [];
for (const testCase of corpus.cases.slice(0, 3)) {
  const input = inputFromCase(testCase);
  const deterministic = buildFlightLearnDiagnosisView(input);
  const factPacket = buildLocalDiagnosisFactPacket(input, deterministic);
  const prompt = buildLocalDiagnosisPrompt(factPacket);
  const started = Date.now();
  let raw;
  try {
    raw = await provider.completeLocalDiagnosisPolish({ prompt, factPacket, signal: new AbortController().signal });
  } catch (error) {
    raw = `[provider-error:${error instanceof Error ? error.name : String(error)}]`;
  }
  samples.push({ id: testCase.id, elapsedMs: Date.now() - started, raw });
}
writeFileSync(resolve(__dirname, 'raw-bonsai-4b-samples.json'), `${JSON.stringify({ generatedAt: now, samples }, null, 2)}\n`);
console.log(JSON.stringify({ generatedAt: now, sampleCount: samples.length, elapsedMs: samples.map((s) => s.elapsedMs) }, null, 2));
