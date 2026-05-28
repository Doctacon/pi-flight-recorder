import { FlightRecorderStore, defaultDatabasePath } from '../../../../dist/storage.js';
const dataDir = process.argv[2];
const store = new FlightRecorderStore(defaultDatabasePath(dataDir));
try {
  const deltas = store.listExpectationDeltas({ limit: 10 }).map((delta) => ({
    id: delta.id,
    status: delta.status,
    summary: delta.summary,
    expectation: delta.expectation,
    reality: delta.reality,
    impact: delta.impact,
    activeArtifactCandidateId: delta.activeArtifactCandidateId,
    evidenceRefCount: delta.evidenceRefs.length,
  }));
  const candidates = store.listArtifactCandidates({ limit: 10 }).map((candidate) => ({
    id: candidate.id,
    deltaId: candidate.deltaId,
    artifactType: candidate.artifactType,
    status: candidate.status,
    applied: candidate.applied,
    rationale: candidate.rationale,
    evidenceRefCount: candidate.evidenceRefs.length,
    nextStep: candidate.nextStep,
  }));
  console.log(JSON.stringify({ dataDir, databasePath: defaultDatabasePath(dataDir), counts: { deltas: store.count('expectation_deltas'), candidates: store.count('artifact_candidates'), ruleCandidates: store.count('rule_candidates'), flightRules: store.count('flight_rules') }, deltas, candidates }, null, 2));
} finally {
  store.close();
}
