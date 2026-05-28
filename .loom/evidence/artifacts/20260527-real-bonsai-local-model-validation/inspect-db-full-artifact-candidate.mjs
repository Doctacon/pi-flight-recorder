import { FlightRecorderStore, defaultDatabasePath } from '../../../../dist/storage.js';
const dataDir = process.argv[2];
const forbidden = [
  'Local model phrasing',
  'deterministic fallback available',
  'A validation command failed repeatedly in this project.',
  'Pi saw the same validation-failure pattern twice in recent sessions.',
];
const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
try {
  const deltas = store.listExpectationDeltas({ limit: 10 });
  const candidates = store.listArtifactCandidates({ limit: 10 });
  const inspected = candidates.map((candidate) => {
    const metadataJson = JSON.stringify(candidate.metadata);
    const haystack = [candidate.title, candidate.rationale, candidate.proposedDraft, candidate.nextStep, ...candidate.limits, metadataJson].join('\n');
    return {
      id: candidate.id,
      deltaId: candidate.deltaId,
      artifactType: candidate.artifactType,
      status: candidate.status,
      applied: candidate.applied,
      title: candidate.title,
      rationale: candidate.rationale,
      proposedDraft: candidate.proposedDraft,
      nextStep: candidate.nextStep,
      limits: candidate.limits,
      metadata: candidate.metadata,
      metadataJson,
      evidenceRefCount: candidate.evidenceRefs.length,
      forbiddenModelTextMatches: forbidden.filter((text) => haystack.includes(text)),
    };
  });
  console.log(JSON.stringify({
    dataDir,
    databasePath: defaultDatabasePath(dataDir),
    deltas: deltas.map((delta) => ({ id: delta.id, status: delta.status, summary: delta.summary, expectation: delta.expectation, reality: delta.reality, impact: delta.impact })),
    candidates: inspected,
    counts: { deltas: store.count('expectation_deltas'), candidates: store.count('artifact_candidates'), ruleCandidates: store.count('rule_candidates'), flightRules: store.count('flight_rules') },
  }, null, 2));
} finally {
  store.close();
}
