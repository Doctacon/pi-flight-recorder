import { describe, expect, it } from "vitest";
import { createFlightLearnDeltaInboxComponent, type FlightLearnDeltaInboxInput, type FlightLearnDeltaInboxResult } from "./flight-learn-inbox.js";
import type { LocalDiagnosisPolishResult } from "./flight-learn-local-diagnosis-model.js";
import type { DeltaDetectorSignal, ExpectationDelta } from "./types.js";

function stripAnsi(value: string): string {
  return value.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "");
}

function sectionBetween(lines: string[], start: string, end: string): string[] {
  const startIndex = lines.indexOf(start);
  const endIndex = lines.indexOf(end);
  if (startIndex === -1) return [];
  return lines.slice(startIndex, endIndex === -1 ? undefined : endIndex);
}

function kittyKey(codepoint: number, modifier = 1): string {
  return `\u001b[${codepoint};${modifier}u`;
}

function kittyText(value: string): string[] {
  return [...value].map((char) => kittyKey(char.codePointAt(0)!));
}

function fixtureDelta(id: string, summary: string): ExpectationDelta {
  return {
    id,
    status: "candidate",
    source: "detector",
    summary,
    expectation: "The assistant should identify the storage/mapper seam before editing.",
    reality: "The assistant edited repository storage and missed mapper sanitization twice.",
    impact: "Repeated review churn before any useful implementation.",
    severity: "medium",
    cwd: "/repo",
    sourceSessionFile: "session.jsonl",
    sourceEntryId: "entry-1",
    evidenceRefs: [
      { sourceType: "session-entry", sourceId: "entry-1", sourceFile: "session.jsonl", sessionFile: "session.jsonl", cwd: "/repo", entryId: "entry-1", timestamp: "2026-05-25T01:00:00.000Z", snippet: "No, actually the mapper owns this behavior and storage should not change.", note: "User correction" },
      { sourceType: "manual", sourceId: null, sourceFile: null, sessionFile: null, cwd: "/repo", entryId: null, timestamp: null, snippet: "The same seam confusion happened again in a later edit.", note: "Manual note" },
      { sourceType: "session-entry", sourceId: "entry-2", sourceFile: "session.jsonl", sessionFile: "session.jsonl", cwd: "/repo", entryId: "entry-2", timestamp: "2026-05-25T01:02:00.000Z", snippet: "The assistant retried the stale storage route.", note: "Retry" },
    ],
    activeArtifactCandidateId: null,
    statusReason: null,
    metadata: {},
    createdAt: "2026-05-25T01:00:00.000Z",
    updatedAt: "2026-05-25T01:00:00.000Z",
    acceptedAt: null,
    routedAt: null,
    dismissedAt: null,
    resolvedAt: null,
    recurringAt: null,
  };
}

function fixtureSignal(deltaId: string): DeltaDetectorSignal {
  return {
    id: `sig-${deltaId}`,
    deltaId,
    type: "user-correction",
    explanation: "User correction language matched a conservative expectation-delta phrase.",
    confidence: 0.68,
    evidenceRefs: [],
    metadata: {},
    createdAt: "2026-05-25T01:00:00.000Z",
  };
}

function routeChoices(): FlightLearnDeltaInboxInput["routeChoices"] {
  return [
    { value: "code-legibility", label: "Code legibility", description: "Create a refactor/readability route when code shape causes repeated confusion" },
    { value: "test-check", label: "Test/check", description: "Route to a missing or weak validation check" },
    { value: "loom-ticket", label: "Loom ticket", description: "Route to bounded implementation or cleanup work" },
    { value: "flight-rule", label: "Flight Rule", description: "Route to reusable assistant guidance, still requiring approval later" },
    { value: "loom-spec", label: "Loom spec", description: "Route to intended-behavior clarification" },
    { value: "loom-research", label: "Loom research", description: "Route to investigation before implementation" },
    { value: "loom-knowledge", label: "Loom knowledge", description: "Route to reusable project understanding" },
    { value: "prompt-context", label: "Prompt/context", description: "Route to project prompt or context documentation" },
    { value: "skill-or-template", label: "Skill/template", description: "Route to a reusable workflow or prompt template" },
    { value: "observe", label: "Observe/no artifact", description: "Keep evidence and watch recurrence without creating an artifact" },
    { value: "dismiss", label: "Dismiss", description: "Close this delta without routing" },
    { value: "cancel", label: "Cancel", description: "Leave unchanged" },
  ];
}

function fixtureInput(): FlightLearnDeltaInboxInput {
  const first = fixtureDelta("delta-one", "Repeated failure pattern: exact-text edit mismatches with a very long summary that must be clipped safely");
  const second = fixtureDelta("delta-two", "Validation seam missed after edits");
  return {
    items: [
      { delta: first, signals: [fixtureSignal(first.id)] },
      { delta: second, signals: [fixtureSignal(second.id)] },
    ],
    routeChoices: routeChoices(),
  };
}

function localPolishResult(overrides: Partial<LocalDiagnosisPolishResult> = {}): LocalDiagnosisPolishResult {
  return {
    view: {
      headline: "A local model rewrote this problem in plain language.",
      whatHappened: "The local model summarized the repeated failure from redacted facts.",
      whyItMatters: "The polished text is easier to scan, but it stays display-only.",
      expectedBehavior: "Use deterministic text if the model is unavailable.",
      whyThisWasFlagged: "The local model explains why redacted recurrence facts made this issue worth reviewing.",
      evidenceSummary: "Existing evidence shows repeated review churn around the same source seam.",
      rawClue: "deterministic raw clue remains secondary",
      confidence: "medium",
      limits: ["Optional local model phrasing was used for display-only wording; stored delta fields, routing, and artifacts were not changed."],
    },
    deterministicView: {
      headline: "Deterministic problem.",
      whatHappened: "Deterministic what happened.",
      whyItMatters: "Deterministic why it matters.",
      expectedBehavior: null,
      rawClue: "deterministic raw clue remains secondary",
      confidence: "medium",
      limits: [],
    },
    usedLocalModel: true,
    displayState: "validated",
    narrativeStatus: "none",
    fallbackReason: null,
    validationIssue: null,
    ...overrides,
  };
}

function narrativeLocalPolishResult(): LocalDiagnosisPolishResult {
  return localPolishResult({
    displayState: "accepted-narrative",
    narrativeStatus: "accepted",
    view: {
      headline: "Validation kept running from a stale shell.",
      whatHappened: "The accepted local narrative ties together repeated validation failures from redacted facts. It explains that the same check was rerun after the package changed, so the card is about validation trust rather than a separate code failure.",
      whyItMatters: "A fuller narrative helps the reviewer understand why this deserves attention without changing the review choices.",
      expectedBehavior: "Validation should run from a fresh project shell after package changes.",
      whyThisWasFlagged: "The accepted local copy says redacted recurrence evidence made this validation issue worth review.",
      evidenceSummary: "Existing evidence shows the same validation check recurring after package changes.",
      rawClue: "deterministic raw clue remains secondary",
      confidence: "medium",
      limits: ["Optional local model narrative was accepted by the local judge for display-only wording; stored delta fields, routing, and artifacts were not changed."],
    },
  });
}

function draftLocalPolishResult(): LocalDiagnosisPolishResult {
  return localPolishResult({
    displayState: "draft",
    narrativeStatus: "draft",
    validationIssue: "local narrative judge rejected the narrative",
    view: {
      headline: "A draft says validation kept running from a stale shell.",
      whatHappened: "The draft ties repeated validation failures to an old shell after the package changed. It is useful reading help, but it has not been accepted by the local judge.",
      whyItMatters: "The draft may help the reviewer understand the card while deterministic facts remain authoritative.",
      expectedBehavior: "Validation should run from a fresh project shell after package changes.",
      whyThisWasFlagged: "The draft says redacted recurrence evidence made this validation issue worth review.",
      evidenceSummary: "Existing evidence shows the validation check recurring after package changes.",
      rawClue: "deterministic raw clue remains secondary",
      confidence: "medium",
      limits: ["Local LLM draft was shown as non-authoritative reading help; deterministic facts, storage, routing, and artifacts remain the source of truth."],
    },
  });
}

function rawCommandInput(): FlightLearnDeltaInboxInput {
  const raw = fixtureDelta("delta-raw", "Repeated failure pattern: bash cd /Users/alice/Code/personal/pi-flight-recorder && npm test > pi-flight-recorder.log");
  raw.expectation = null;
  raw.reality = "Observed 2 related failure occurrences in reflection cluster cluster_73111b7e16551a58.";
  raw.impact = "Repeated local friction across tools/cwds: bash.";
  raw.evidenceRefs = [
    { sourceType: "occurrence", sourceId: "occ-1", sourceFile: null, sessionFile: "session.jsonl", cwd: "/Users/alice/Code/personal/pi-flight-recorder", entryId: "entry-1", timestamp: "2026-05-27T01:00:00.000Z", snippet: "bash cd /Users/alice/Code/personal/pi-flight-recorder && npm test > pi-flight-recorder.log failed from a stale pane", note: "Reflection cluster cluster_73111b7e16551a58" },
  ];
  raw.metadata = { count: 2, clusterId: "cluster_73111b7e16551a58" };
  return {
    items: [{
      delta: raw,
      signals: [{
        id: "sig-delta-raw",
        deltaId: raw.id,
        type: "reflection-cluster",
        explanation: "Reflection cluster cluster_73111b7e16551a58 has 2 related occurrence(s), meeting the conservative threshold 2.",
        confidence: 0.55,
        evidenceRefs: raw.evidenceRefs,
        metadata: {},
        createdAt: "2026-05-27T01:00:00.000Z",
      }],
    }],
    routeChoices: routeChoices(),
  };
}

describe("Flight Learn custom inbox component", () => {
  it("renders a compact split inbox with separated fields, signals, evidence, routes, and key hints", () => {
    const results: FlightLearnDeltaInboxResult[] = [];
    const component = createFlightLearnDeltaInboxComponent({
      input: fixtureInput(),
      done: (result) => results.push(result),
      theme: { fg: (_color, value) => `\u001b[36m${value}\u001b[0m`, bold: (value) => `\u001b[1m${value}\u001b[22m` },
    });

    const output = component.render(104).map(stripAnsi).join("\n");

    expect(output).toContain("Flight Learn - 2 pending deltas - selected 1/2");
    expect(output).toContain("Pending deltas");
    expect(output).toContain("Selected delta");
    expect(output).toContain("Issue:");
    expect(output).toContain("exact-text edit mismatches");
    expect(output).not.toContain("> Repeated failure pattern:");
    expect(output).toContain("What happened:");
    expect(output).toContain("Why it matters:");
    expect(output).toContain("Expected:");
    expect(output).toContain("Signal:");
    expect(output).toContain("Evidence preview");
    expect(output).toContain("Why suggested");
    expect(output).toContain("Follow-up choices:");
    expect(output).toContain("Code legibility");
    expect(output).toContain("Test/check");
    expect(output).toContain("Flight Rule");
    expect(output).toContain("Prompt/context");
    expect(output).toContain("Skill/template");
    expect(output).toContain("Observe");
    expect(output).toContain("Active follow-up:");
    expect(output).toContain("How to choose: Rule=behavior reminder");
    expect(output).toContain("Keys: up/down item");
    expect(results).toEqual([]);
  });

  it("renders a focused-card preview layout without the split-pane table", () => {
    const results: FlightLearnDeltaInboxResult[] = [];
    const component = createFlightLearnDeltaInboxComponent({
      input: fixtureInput(),
      done: (result) => results.push(result),
      layout: "focused-card",
      theme: { fg: (_color, value) => `\u001b[36m${value}\u001b[0m`, bold: (value) => `\u001b[1m${value}\u001b[22m` },
    });

    component.handleInput?.("2");
    const output = component.render(88).map(stripAnsi).join("\n");

    expect(output).toContain("Flight Learn — Issue 1 of 2");
    expect(output).toContain("2 pending · 3 evidence refs");
    expect(output).toContain("Problem");
    expect(output).toContain("The user had to correct an assistant assumption.");
    expect(output).toContain("What happened?");
    expect(output).toContain("The assistant edited repository storage and missed mapper sanitization twice.");
    expect(output).toContain("Why it matters");
    expect(output).toContain("Expected");
    expect(output).toContain("The assistant should identify the storage/mapper seam before editing.");
    expect(output).toContain("Why this was flagged");
    expect(output).toContain("Pi grouped this as a recurring local issue from 3 redacted evidence refs.");
    expect(output).not.toContain("Raw clue");
    expect(output).not.toContain("Why suggested");
    expect(output).toContain("Evidence");
    expect(output).toContain("3 refs hidden by default — press v to inspect concise refs.");
    expect(output).toContain("Choose a follow-up");
    expect(output).toContain("▶ [2] Test/check");
    expect(output).toContain("Route to a missing or weak validation check");
    expect(output).not.toContain("Pending deltas");
    expect(output).not.toContain("Selected delta");
    expect(output).not.toContain("Follow-up choices:");
    expect(output).not.toContain("session.jsonl");
    expect(results).toEqual([]);

    component.handleInput?.("v");
    const expanded = component.render(88).map(stripAnsi).join("\n");
    expect(expanded).toContain("session-entry/entry-1");
    expect(expanded).toContain("No, actually the mapper owns this behavior");
  });

  it("renders raw detector text as a plain-English focused-card diagnosis with internals hidden by default", () => {
    const results: FlightLearnDeltaInboxResult[] = [];
    const component = createFlightLearnDeltaInboxComponent({
      input: rawCommandInput(),
      done: (result) => results.push(result),
      layout: "focused-card",
    });

    const lines = component.render(132).map(stripAnsi);
    const output = lines.join("\n");
    const primaryBlock = sectionBetween(lines, "Problem", "Choose a follow-up").join("\n");
    const primaryContent = primaryBlock
      .split("\n")
      .filter((line) => line.trim() && !["Problem", "What happened?", "Why it matters", "Expected", "Why this was flagged", "Evidence"].includes(line));

    expect(output).toContain("Problem");
    expect(output).toContain("A validation command failed repeatedly in this project.");
    expect(output).toContain("Pi saw the same validation-failure pattern twice in recent sessions.");
    expect(output).toContain("Repeated validation friction makes it harder to trust whether the latest code");
    expect(output).toContain("actually passed.");
    expect(output).toContain("Pi does not know the intended behavior yet — press e to add it.");
    expect(output).toContain("Why this was flagged");
    expect(output).toContain("Pi grouped this as a recurring local issue from 1 redacted evidence ref.");
    expect(output).toContain("Evidence");
    expect(output).toContain("1 ref hidden by default — press v to inspect concise refs.");
    expect(output).not.toContain("Raw clue");
    expect(output).not.toContain("Why suggested");
    expect(output).not.toContain("npm test");
    expect(output).not.toContain("Reflection cluster cluster_73111b7e16551a58");
    expect(output).not.toContain("bash cd");
    expect(output).not.toContain("/Users/alice");
    for (const line of primaryContent) expect(line.length).toBeLessThanOrEqual(86);
    for (const line of lines) expect(line.length).toBeLessThanOrEqual(132);
    expect(results).toEqual([]);

    component.handleInput?.("v");
    const expanded = component.render(132).map(stripAnsi).join("\n");
    expect(expanded).toContain("Expanded provenance:");
    expect(expanded).toContain("reflection-cluster (0.55): Reflection cluster cluster_73111b7e16551a58");
    expect(expanded).toContain("occurrence/occ-1: bash cd /Users/<user>/Code/personal/pi-flight-recorder");
    expect(expanded).not.toContain("/Users/alice");
  });

  it("renders optional local-model-polished diagnosis as display-only wording with disclosure", () => {
    const input = fixtureInput();
    input.items[0]!.localDiagnosisPolish = localPolishResult();
    const results: FlightLearnDeltaInboxResult[] = [];
    const component = createFlightLearnDeltaInboxComponent({ input, done: (result) => results.push(result), layout: "focused-card" });

    const output = component.render(100).map(stripAnsi).join("\n");

    expect(output).toContain("Local model phrasing; deterministic fallback available.");
    expect(output).toContain("A local model rewrote this problem in plain language.");
    expect(output).toContain("The local model summarized the repeated failure from redacted facts.");
    expect(output).toContain("The polished text is easier to scan, but it stays display-only.");
    expect(output).toContain("Use deterministic text if the model is unavailable.");
    expect(output).toContain("Why this was flagged");
    expect(output).toContain("The local model explains why redacted recurrence facts made this issue worth");
    expect(output).toContain("Existing evidence shows repeated review churn around the same source seam.");
    expect(output).not.toContain("Raw clue");
    expect(output).not.toContain("Why suggested");

    component.handleInput?.("2");
    component.handleInput?.("\r");

    expect(results).toEqual([
      expect.objectContaining({
        kind: "route-selected",
        deltaId: "delta-one",
        artifactType: "test-check",
        expectation: "The assistant should identify the storage/mapper seam before editing.",
      }),
    ]);
    expect(input.items[0]!.delta.summary).toContain("Repeated failure pattern");
  });

  it("renders accepted narrative what-happened text as distinct from the concise problem", () => {
    const input = fixtureInput();
    input.items[0]!.localDiagnosisPolish = narrativeLocalPolishResult();
    const results: FlightLearnDeltaInboxResult[] = [];
    const component = createFlightLearnDeltaInboxComponent({ input, done: (result) => results.push(result), layout: "focused-card" });

    const lines = component.render(88).map(stripAnsi);
    const output = lines.join("\n");
    const problemBlock = sectionBetween(lines, "Problem", "What happened?").join("\n");
    const whatHappenedBlock = sectionBetween(lines, "What happened?", "Why it matters").join("\n");

    expect(output).toContain("Local model narrative accepted by local judge; deterministic fallback available.");
    expect(problemBlock).toContain("Validation kept running from a stale shell.");
    expect(problemBlock).not.toContain("accepted local narrative ties together");
    expect(whatHappenedBlock).toContain("The accepted local narrative ties together repeated validation failures");
    expect(whatHappenedBlock).toContain("the card is about validation trust rather than a separate code failure.");
    expect(whatHappenedBlock).not.toContain("Deterministic what happened.");
    expect(output).toContain("Choose a follow-up");
    for (const line of lines) expect(line.length).toBeLessThanOrEqual(88);
    for (const line of whatHappenedBlock.split("\n")) expect(line.length).toBeLessThanOrEqual(86);

    component.handleInput?.("2");
    component.handleInput?.("\r");

    expect(results).toEqual([
      expect.objectContaining({ kind: "route-selected", deltaId: "delta-one", artifactType: "test-check" }),
    ]);
    expect(input.items[0]!.delta.reality).toBe("The assistant edited repository storage and missed mapper sanitization twice.");
  });

  it("renders local LLM draft reading help as non-authoritative with deterministic source facts", () => {
    const input = fixtureInput();
    input.items[0]!.localDiagnosisPolish = draftLocalPolishResult();
    const results: FlightLearnDeltaInboxResult[] = [];
    const component = createFlightLearnDeltaInboxComponent({ input, done: (result) => results.push(result), layout: "focused-card" });

    const lines = component.render(92).map(stripAnsi);
    const output = lines.join("\n");
    const sourceFactsBlock = sectionBetween(lines, "Source facts", "Why this was flagged").join("\n");

    expect(output).toContain("Local LLM draft — facts below are source of truth; not judge-accepted.");
    expect(output).toContain("A draft says validation kept running from a stale shell.");
    expect(output).toContain("The draft ties repeated validation failures to an old shell after the package");
    expect(output).toContain("changed. It is useful reading help");
    expect(output).toContain("Source facts");
    expect(sourceFactsBlock).toContain("Problem: Deterministic problem.");
    expect(sourceFactsBlock).toContain("What happened: Deterministic what happened.");
    expect(output).toContain("Why this was flagged");
    expect(output).toContain("The draft says redacted recurrence evidence made this validation issue worth review.");
    expect(output).toContain("Existing evidence shows the validation check recurring after package changes.");
    expect(output).toContain("Choose a follow-up");
    expect(output).toContain("d dismiss");
    expect(output).toContain("s skip");
    expect(output).not.toContain("Raw clue");
    expect(output).not.toContain("Why suggested");
    expect(output).not.toContain("local narrative judge rejected the narrative");
    for (const line of lines) expect(line.length).toBeLessThanOrEqual(92);

    const narrowOutput = component.render(72).map(stripAnsi).join("\n");
    expect(narrowOutput).toContain("d dismiss");
    expect(narrowOutput).toContain("s skip");

    component.handleInput?.("2");
    component.handleInput?.("\r");

    expect(results).toEqual([
      expect.objectContaining({ kind: "route-selected", deltaId: "delta-one", artifactType: "test-check" }),
    ]);
    expect(input.items[0]!.delta.summary).toContain("Repeated failure pattern");
    expect(input.items[0]!.delta.reality).not.toContain("draft ties");
  });

  it("falls back to deterministic focused-card text when local model polish is unavailable", () => {
    const input = rawCommandInput();
    input.items[0]!.localDiagnosisPolish = localPolishResult({
      view: {
        headline: "A validation command failed repeatedly in this project.",
        whatHappened: "Pi saw the same validation-failure pattern twice in recent sessions.",
        whyItMatters: "Repeated validation friction makes it harder to trust whether the latest code actually passed.",
        expectedBehavior: null,
        rawClue: "bash cd /Users/<user>/Code/personal/pi-flight-recorder && npm test > pi-flight-recorder.log",
        confidence: "medium",
        limits: ["Local model phrasing was requested but rejected (timeout); deterministic display text is shown."],
      },
      usedLocalModel: false,
      displayState: "deterministic",
      narrativeStatus: "none",
      fallbackReason: "timeout",
      validationIssue: "provider timed out before returning JSON",
    });
    const component = createFlightLearnDeltaInboxComponent({ input, done: () => undefined, layout: "focused-card" });

    const output = component.render(100).map(stripAnsi).join("\n");

    expect(output).toContain("Local model unavailable (timed out); deterministic wording shown.");
    expect(output).toContain("A validation command failed repeatedly in this project.");
    expect(output).toContain("Pi does not know the intended behavior yet — press e to add it.");
    expect(output).toContain("Why this was flagged");
    expect(output).toContain("Pi grouped this as a recurring local issue from 1 redacted evidence ref.");
    expect(output).toContain("d dismiss");
    expect(output).toContain("s skip");
    expect(output).not.toContain("Raw clue");
    expect(output).not.toContain("Why suggested");
    expect(output).not.toContain("npm test");
    expect(output).not.toContain("cluster_73111b7e16551a58");
    expect(output).not.toContain("provider timed out before returning JSON");
  });

  it("does not keep stale model-polished wording after editable fields change", () => {
    const input = fixtureInput();
    input.items[0]!.localDiagnosisPolish = localPolishResult();
    const component = createFlightLearnDeltaInboxComponent({ input, done: () => undefined, layout: "focused-card" });

    expect(component.render(100).map(stripAnsi).join("\n")).toContain("A local model rewrote this problem");

    component.handleInput?.("e");
    component.handleInput?.("\u0015");
    component.handleInput?.("Fresh edited expectation");
    component.handleInput?.("\r");
    const output = component.render(100).map(stripAnsi).join("\n");

    expect(output).not.toContain("Local model phrasing; deterministic fallback available.");
    expect(output).not.toContain("A local model rewrote this problem");
    expect(output).toContain("Fresh edited expectation");
  });

  it("keeps rendered visible lines within narrow and wide terminal widths", () => {
    const components = [
      createFlightLearnDeltaInboxComponent({ input: fixtureInput(), done: () => undefined }),
      createFlightLearnDeltaInboxComponent({ input: fixtureInput(), done: () => undefined, layout: "focused-card" }),
    ];

    for (const component of components) {
      for (const width of [48, 72, 104]) {
        const lines = component.render(width);
        expect(lines.length).toBeGreaterThan(0);
        for (const line of lines) expect(stripAnsi(line).length).toBeLessThanOrEqual(width);
      }
    }
  });

  it("returns edited-field and route decisions without mutating evidence text", () => {
    const results: FlightLearnDeltaInboxResult[] = [];
    const component = createFlightLearnDeltaInboxComponent({ input: fixtureInput(), done: (result) => results.push(result), layout: "focused-card" });

    component.handleInput?.("e");
    component.handleInput?.("\u0015");
    component.handleInput?.("Edited expectation field");
    component.handleInput?.("\r");
    component.handleInput?.("2");
    component.handleInput?.("\r");

    expect(results).toEqual([
      {
        kind: "route-selected",
        deltaId: "delta-one",
        artifactType: "test-check",
        expectation: "Edited expectation field",
        reality: "The assistant edited repository storage and missed mapper sanitization twice.",
        impact: "Repeated review churn before any useful implementation.",
      },
    ]);
    expect(fixtureInput().items[0]?.delta.evidenceRefs[0]?.snippet).toContain("mapper owns this behavior");
  });

  it("discards edited fields when escape cancels the edit screen", () => {
    const results: FlightLearnDeltaInboxResult[] = [];
    const component = createFlightLearnDeltaInboxComponent({ input: fixtureInput(), done: (result) => results.push(result), layout: "focused-card" });

    component.handleInput?.("e");
    component.handleInput?.("\u0015");
    component.handleInput?.("Temporary expectation that should not persist");
    component.handleInput?.("\u001b");
    component.handleInput?.("2");
    component.handleInput?.("\r");

    expect(results).toEqual([
      expect.objectContaining({
        kind: "route-selected",
        deltaId: "delta-one",
        artifactType: "test-check",
        expectation: "The assistant should identify the storage/mapper seam before editing.",
      }),
    ]);
  });

  it("accepts Kitty CSI-u shortcut and printable input before route selection", () => {
    const results: FlightLearnDeltaInboxResult[] = [];
    const component = createFlightLearnDeltaInboxComponent({ input: fixtureInput(), done: (result) => results.push(result), layout: "focused-card" });

    component.handleInput?.(kittyKey("e".codePointAt(0)!));
    component.handleInput?.(kittyKey("u".codePointAt(0)!, 5));
    for (const key of kittyText("Kitty expectation")) component.handleInput?.(key);
    component.handleInput?.(kittyKey(13));
    component.handleInput?.(kittyKey("2".codePointAt(0)!));
    component.handleInput?.(kittyKey(13));

    expect(results).toEqual([
      expect.objectContaining({
        kind: "route-selected",
        deltaId: "delta-one",
        artifactType: "test-check",
        expectation: "Kitty expectation",
      }),
    ]);
  });

  it("supports dismiss and skip results as safe no-apply actions", () => {
    const dismissed: FlightLearnDeltaInboxResult[] = [];
    const dismissComponent = createFlightLearnDeltaInboxComponent({ input: fixtureInput(), done: (result) => dismissed.push(result), layout: "focused-card" });
    dismissComponent.handleInput?.("d");
    expect(dismissed).toEqual([{ kind: "dismissed", deltaId: "delta-one", reason: "Dismissed through Flight Learn inbox" }]);

    const skipped: FlightLearnDeltaInboxResult[] = [];
    const skipComponent = createFlightLearnDeltaInboxComponent({ input: fixtureInput(), done: (result) => skipped.push(result), layout: "focused-card" });
    skipComponent.handleInput?.("s");
    expect(skipped).toEqual([{ kind: "skipped", deltaId: "delta-one" }]);

    const cancelled: FlightLearnDeltaInboxResult[] = [];
    const cancelComponent = createFlightLearnDeltaInboxComponent({ input: fixtureInput(), done: (result) => cancelled.push(result), layout: "focused-card" });
    cancelComponent.handleInput?.("q");
    expect(cancelled).toEqual([{ kind: "cancelled" }]);
  });
});
