import { describe, expect, it } from "vitest";
import { buildFlightLearnDiagnosisView } from "./flight-learn-diagnosis.js";
import type { DeltaDetectorSignal, DeltaDetectorSignalType, DeltaEvidenceRef, ExpectationDelta } from "./types.js";

function evidence(snippet: string | null, note: string | null = null): DeltaEvidenceRef {
  return {
    sourceType: "occurrence",
    sourceId: "occ-1",
    sourceFile: null,
    sessionFile: "/Users/alice/.pi/agent/sessions/private/session.jsonl",
    cwd: "/Users/alice/private/project",
    entryId: "entry-1",
    timestamp: "2026-05-27T01:00:00.000Z",
    snippet,
    note,
  };
}

function delta(overrides: Partial<ExpectationDelta>): ExpectationDelta {
  return {
    id: "delta-test",
    status: "candidate",
    source: "detector",
    summary: "Repeated failure pattern: unknown issue",
    expectation: null,
    reality: null,
    impact: null,
    severity: "medium",
    cwd: "/Users/alice/private/project",
    sourceSessionFile: "/Users/alice/.pi/agent/sessions/private/session.jsonl",
    sourceEntryId: "entry-1",
    evidenceRefs: [],
    activeArtifactCandidateId: null,
    statusReason: null,
    metadata: {},
    createdAt: "2026-05-27T01:00:00.000Z",
    updatedAt: "2026-05-27T01:00:00.000Z",
    acceptedAt: null,
    routedAt: null,
    dismissedAt: null,
    resolvedAt: null,
    recurringAt: null,
    ...overrides,
  };
}

function signal(type: DeltaDetectorSignalType, overrides: Partial<DeltaDetectorSignal> = {}): DeltaDetectorSignal {
  return {
    id: `sig-${type}`,
    deltaId: "delta-test",
    type,
    explanation: `${type} detector explanation`,
    confidence: 0.62,
    evidenceRefs: [],
    metadata: {},
    createdAt: "2026-05-27T01:00:00.000Z",
    ...overrides,
  };
}

describe("Flight Learn diagnosis view model", () => {
  it("turns a reflection-cluster raw command into a plain-English validation diagnosis", () => {
    const rawDelta = delta({
      summary: "Repeated failure pattern: bash cd /Users/alice/Code/personal/pi-flight-recorder && npm test > pi-flight-recorder.log",
      reality: "Observed 2 related failure occurrences in reflection cluster cluster_73111b7e16551a58.",
      impact: "Repeated local friction across tools/cwds: bash.",
      evidenceRefs: [evidence("bash cd /Users/alice/Code/personal/pi-flight-recorder && npm test > pi-flight-recorder.log failed from a stale pane")],
      metadata: { count: 2, clusterId: "cluster_73111b7e16551a58" },
    });

    const view = buildFlightLearnDiagnosisView({
      delta: rawDelta,
      signals: [signal("reflection-cluster", { explanation: "Reflection cluster cluster_73111b7e16551a58 has 2 related occurrence(s), meeting the conservative threshold 2." })],
    });

    expect(view.headline).toBe("A validation command failed repeatedly in this project.");
    expect(view.whatHappened).toBe("Pi saw the same validation-failure pattern twice in recent sessions.");
    expect(view.whyItMatters).toBe("Repeated validation friction makes it harder to trust whether the latest code actually passed.");
    expect(view.rawClue).toContain("npm test");
    expect(view.rawClue).toContain("/Users/<user>");
    expect(view.confidence).toBe("medium");
    expect(view.limits.join("\n")).toContain("No model call was made");
    expect(`${view.headline}\n${view.whatHappened}`).not.toContain("bash cd");
    expect(`${view.headline}\n${view.whatHappened}`).not.toContain("cluster_73111b7e16551a58");
    expect(`${view.headline}\n${view.whatHappened}`).not.toContain("/Users/alice");
  });

  it("detects validation, build, stale-edit, and user-correction domains from local signals and evidence", () => {
    expect(buildFlightLearnDiagnosisView({
      delta: delta({ summary: "Repeated failure pattern: npm run build failed", evidenceRefs: [evidence("tsc -p tsconfig.build.json failed after npm run build")] }),
      signals: [signal("failed-validation")],
    }).headline).toBe("A build check failed repeatedly in this project.");

    expect(buildFlightLearnDiagnosisView({
      delta: delta({ summary: "Repeated failure pattern: oldText not found while editing src/storage.ts", evidenceRefs: [evidence("edit oldText not found in src/storage.ts")] }),
      signals: [signal("stale-edit-attempt")],
    }).headline).toBe("A file edit failed because the target text no longer matched.");

    const correction = buildFlightLearnDiagnosisView({
      delta: delta({
        summary: "User correction: No, actually the API works differently than assumed.",
        expectation: "User indicated the assistant's prior assumption or response needed correction.",
        reality: "No, actually the API works differently than assumed.",
        impact: "User had to correct the assistant during the session.",
        evidenceRefs: [evidence("No, actually the API works differently than assumed.")],
      }),
      signals: [signal("user-correction")],
    });
    expect(correction.headline).toBe("The user had to correct an assistant assumption.");
    expect(correction.whatHappened).toBe("No, actually the API works differently than assumed.");
  });

  it("preserves useful human-authored fields even when the detector summary stays raw", () => {
    const rawSummaryWithEdits = delta({
      summary: "Repeated failure pattern: bash cd /Users/alice/Code/personal/pi-flight-recorder && npm test > pi-flight-recorder.log",
      expectation: "Run validation from a fresh project shell after reinstalling the package.",
      reality: "The validation command was rerun from an old shell after the package changed.",
      impact: "That can make the pass or fail result untrustworthy.",
      evidenceRefs: [evidence("bash cd /Users/alice/Code/personal/pi-flight-recorder && npm test > pi-flight-recorder.log failed from a stale pane")],
      metadata: { count: 2 },
    });
    const before = JSON.stringify(rawSummaryWithEdits);

    const view = buildFlightLearnDiagnosisView({
      delta: rawSummaryWithEdits,
      signals: [signal("reflection-cluster", { explanation: "Reflection cluster cluster_73111b7e16551a58 has 2 related occurrence(s)." })],
    });

    expect(view.headline).toBe("A validation command failed repeatedly in this project.");
    expect(view.whatHappened).toBe("The validation command was rerun from an old shell after the package changed.");
    expect(view.whyItMatters).toBe("That can make the pass or fail result untrustworthy.");
    expect(view.expectedBehavior).toBe("Run validation from a fresh project shell after reinstalling the package.");
    expect(view.rawClue).toContain("npm test");
    expect(view.confidence).toBe("high");
    expect(`${view.headline}\n${view.whatHappened}\n${view.whyItMatters}\n${view.expectedBehavior}`).not.toContain("cluster_73111b7e16551a58");
    expect(JSON.stringify(rawSummaryWithEdits)).toBe(before);
  });

  it("preserves useful human-authored fields without mutating the source delta", () => {
    const manualDelta = delta({
      source: "manual",
      summary: "Assistant repeatedly confused the storage mapper ownership boundary.",
      expectation: "Check the mapper before editing storage.",
      reality: "The assistant edited storage when mapper code owned the behavior.",
      impact: "Review churn increased before implementation could continue.",
      evidenceRefs: [evidence("Manual note: the mapper owned the behavior.")],
    });
    const before = JSON.stringify(manualDelta);

    const view = buildFlightLearnDiagnosisView({ delta: manualDelta, signals: [signal("manual-capture")] });

    expect(view.headline).toBe("Assistant repeatedly confused the storage mapper ownership boundary.");
    expect(view.whatHappened).toBe("The assistant edited storage when mapper code owned the behavior.");
    expect(view.whyItMatters).toBe("Review churn increased before implementation could continue.");
    expect(view.expectedBehavior).toBe("Check the mapper before editing storage.");
    expect(view.confidence).toBe("high");
    expect(JSON.stringify(manualDelta)).toBe(before);
  });

  it("returns an honest low-confidence fallback when no useful diagnosis can be derived", () => {
    const view = buildFlightLearnDiagnosisView({
      delta: delta({
        summary: "delta_misc_123",
        reality: "unknown",
        impact: "unknown",
        evidenceRefs: [],
      }),
      signals: [signal("other", { confidence: null, explanation: "other detector signal" })],
    });

    expect(view.headline).toBe("A repeated issue was detected, but the plain-English cause is unclear.");
    expect(view.whatHappened).toBe("Local evidence recorded an expectation gap that needs human review.");
    expect(view.whyItMatters).toBe("Keeping the evidence visible helps decide whether this needs a follow-up or more observation.");
    expect(view.expectedBehavior).toBeNull();
    expect(view.rawClue).toBeNull();
    expect(view.confidence).toBe("low");
    expect(view.limits.join("\n")).toContain("Plain-English cause could not be confidently derived");
  });
});
