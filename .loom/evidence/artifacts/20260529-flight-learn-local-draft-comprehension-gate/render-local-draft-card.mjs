import { createFlightLearnDeltaInboxComponent } from "../../../../dist/flight-learn-inbox.js";

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

function delta() {
  return {
    id: "delta-render-draft",
    status: "candidate",
    source: "detector",
    summary: "Repeated validation result became hard to trust",
    expectation: "Validation should run from a fresh shell after package changes.",
    reality: "A validation check was repeated from an old shell after the package changed.",
    impact: "Repeated validation friction makes the result hard to trust.",
    severity: "medium",
    cwd: null,
    sourceSessionFile: null,
    sourceEntryId: "entry-redacted",
    evidenceRefs: [
      {
        sourceType: "manual",
        sourceId: "evidence-redacted",
        sourceFile: null,
        sessionFile: null,
        cwd: null,
        entryId: null,
        timestamp: "2026-05-29T00:00:00.000Z",
        snippet: "Redacted note: the same validation pattern repeated after a package change.",
        note: "Redacted validation recurrence note",
      },
    ],
    activeArtifactCandidateId: null,
    statusReason: null,
    metadata: { count: 2 },
    createdAt: "2026-05-29T00:00:00.000Z",
    updatedAt: "2026-05-29T00:00:00.000Z",
    acceptedAt: null,
    routedAt: null,
    dismissedAt: null,
    resolvedAt: null,
    recurringAt: null,
  };
}

function signal() {
  return {
    id: "sig-render-draft",
    deltaId: "delta-render-draft",
    type: "failed-validation",
    explanation: "Validation recurrence was observed twice from the same stale-shell pattern.",
    confidence: 0.74,
    evidenceRefs: [],
    metadata: {},
    createdAt: "2026-05-29T00:00:00.000Z",
  };
}

const deterministicView = {
  headline: "A validation command failed repeatedly in this project.",
  whatHappened: "Pi saw the same validation-failure pattern twice in recent sessions.",
  whyItMatters: "Repeated validation friction makes it harder to trust whether the latest code actually passed.",
  expectedBehavior: "Validation should run from a fresh shell after package changes.",
  rawClue: "Redacted validation recurrence clue",
  confidence: "medium",
  limits: [],
};

function localDraftResult() {
  return {
    view: {
      headline: "A draft says validation kept running from a stale shell.",
      whatHappened: "The draft ties repeated validation failures to an old shell after the package changed. It is reading help only and has not been accepted by the local judge.",
      whyItMatters: "The draft helps the reviewer read the card while deterministic facts remain authoritative.",
      expectedBehavior: "Validation should run from a fresh shell after package changes.",
      rawClue: "Redacted validation recurrence clue",
      confidence: "medium",
      limits: ["Local LLM draft was shown as non-authoritative reading help; deterministic facts, storage, routing, and artifacts remain the source of truth."],
    },
    deterministicView,
    usedLocalModel: true,
    displayState: "draft",
    narrativeStatus: "draft",
    fallbackReason: null,
    validationIssue: "local narrative judge rejected the narrative",
  };
}

function localFallbackResult() {
  return {
    view: {
      ...deterministicView,
      limits: ["Local model phrasing was requested but rejected (unsafe-output); deterministic display text is shown."],
    },
    deterministicView,
    usedLocalModel: false,
    displayState: "deterministic",
    narrativeStatus: "rejected",
    fallbackReason: "unsafe-output",
    validationIssue: "display field included unsafe or non-display content",
  };
}

function render(result, width) {
  const itemDelta = delta();
  const input = {
    items: [{ delta: itemDelta, signals: [signal()], localDiagnosisPolish: result }],
    routeChoices: routeChoices(),
  };
  const component = createFlightLearnDeltaInboxComponent({ input, done: () => undefined, layout: "focused-card" });
  return component.render(width).join("\n");
}

const width = Number.parseInt(process.argv[3] ?? "92", 10);
const mode = process.argv[2] ?? "draft";
if (mode === "draft") {
  console.log(render(localDraftResult(), width));
} else if (mode === "fallback") {
  console.log(render(localFallbackResult(), width));
} else {
  throw new Error(`unknown render mode: ${mode}`);
}
