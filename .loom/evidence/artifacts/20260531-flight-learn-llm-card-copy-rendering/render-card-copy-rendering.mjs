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
    id: "delta-card-copy-render",
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
        sourceId: "evidence-redacted-1",
        sourceFile: null,
        sessionFile: null,
        cwd: null,
        entryId: null,
        timestamp: "2026-05-31T00:00:00.000Z",
        snippet: "Redacted note: the same validation pattern repeated after a package change.",
        note: "Redacted validation recurrence note",
      },
      {
        sourceType: "occurrence",
        sourceId: "evidence-redacted-2",
        sourceFile: null,
        sessionFile: null,
        cwd: null,
        entryId: "entry-redacted-2",
        timestamp: "2026-05-31T00:01:00.000Z",
        snippet: "Redacted note: validation was repeated from a stale pane.",
        note: "Redacted recurrence note",
      },
    ],
    activeArtifactCandidateId: null,
    statusReason: null,
    metadata: { count: 2 },
    createdAt: "2026-05-31T00:00:00.000Z",
    updatedAt: "2026-05-31T00:00:00.000Z",
    acceptedAt: null,
    routedAt: null,
    dismissedAt: null,
    resolvedAt: null,
    recurringAt: null,
  };
}

function signal() {
  return {
    id: "sig-card-copy-render",
    deltaId: "delta-card-copy-render",
    type: "failed-validation",
    explanation: "Validation recurrence was observed twice from the same stale-shell pattern.",
    confidence: 0.74,
    evidenceRefs: [],
    metadata: {},
    createdAt: "2026-05-31T00:00:00.000Z",
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

function modelResult(displayState = "validated") {
  return {
    view: {
      headline: "Validation kept running from a stale shell.",
      whatHappened: "The local card copy ties repeated validation failures to an old shell after the package changed.",
      whyItMatters: "This makes the result harder to trust without changing any route choice automatically.",
      expectedBehavior: "Validation should run from a fresh shell after package changes.",
      whyThisWasFlagged: "The local model says redacted recurrence evidence made this validation issue worth review.",
      evidenceSummary: "Existing evidence shows the same validation pattern repeated after a package change.",
      rawClue: "Redacted validation recurrence clue",
      confidence: "medium",
      limits: ["Local model wording is display-only; deterministic facts, routing, and artifacts remain authoritative."],
    },
    deterministicView,
    usedLocalModel: true,
    displayState,
    narrativeStatus: displayState === "draft" ? "draft" : "none",
    fallbackReason: null,
    validationIssue: displayState === "draft" ? "local narrative judge did not accept the draft" : null,
  };
}

function fallbackResult() {
  return {
    view: {
      ...deterministicView,
      limits: ["Local model phrasing was requested but rejected; deterministic display text is shown."],
    },
    deterministicView,
    usedLocalModel: false,
    displayState: "deterministic",
    narrativeStatus: "rejected",
    fallbackReason: "unsafe-output",
    validationIssue: "display field included unsafe or non-display content",
  };
}

function render(mode, width) {
  const result = mode === "fallback" ? fallbackResult() : modelResult(mode === "draft" ? "draft" : "validated");
  const input = {
    items: [{ delta: delta(), signals: [signal()], localDiagnosisPolish: result }],
    routeChoices: routeChoices(),
  };
  const component = createFlightLearnDeltaInboxComponent({ input, done: () => undefined, layout: "focused-card" });
  if (mode === "expanded") component.handleInput("v");
  return component.render(width).join("\n");
}

const mode = process.argv[2] ?? "model";
const width = Number.parseInt(process.argv[3] ?? "92", 10);
if (!["model", "draft", "fallback", "expanded"].includes(mode)) throw new Error(`unknown render mode: ${mode}`);
console.log(render(mode, width));
