import { describe, expect, it } from "vitest";
import { createFlightLearnDeltaInboxComponent, type FlightLearnDeltaInboxInput, type FlightLearnDeltaInboxResult } from "./flight-learn-inbox.js";
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
    expect(output).toContain("Raw clue");
    expect(output).toContain("exact-text edit mismatches");
    expect(output).toContain("Why suggested");
    expect(output).toContain("Evidence");
    expect(output).toContain("3 refs hidden by default — press v to view concise refs.");
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

  it("renders raw detector text as a plain-English focused-card diagnosis with secondary raw clue", () => {
    const results: FlightLearnDeltaInboxResult[] = [];
    const component = createFlightLearnDeltaInboxComponent({
      input: rawCommandInput(),
      done: (result) => results.push(result),
      layout: "focused-card",
    });

    const lines = component.render(132).map(stripAnsi);
    const output = lines.join("\n");
    const primaryBlock = sectionBetween(lines, "Problem", "Raw clue").join("\n");
    const primaryContent = primaryBlock
      .split("\n")
      .filter((line) => line.trim() && !["Problem", "What happened?", "Why it matters", "Expected"].includes(line));

    expect(output).toContain("Problem");
    expect(output).toContain("A validation command failed repeatedly in this project.");
    expect(output).toContain("Pi saw the same validation-failure pattern twice in recent sessions.");
    expect(output).toContain("Repeated validation friction makes it harder to trust whether the latest code");
    expect(output).toContain("actually passed.");
    expect(output).toContain("Raw clue");
    expect(output).toContain("npm test");
    expect(output).toContain("Why suggested");
    expect(output).toContain("Reflection cluster cluster_73111b7e16551a58");
    expect(output).not.toContain("Issue\nbash cd");
    expect(primaryBlock).not.toContain("bash cd");
    expect(primaryBlock).not.toContain("cluster_73111b7e16551a58");
    expect(primaryBlock).not.toContain("/Users/alice");
    for (const line of primaryContent) expect(line.length).toBeLessThanOrEqual(86);
    for (const line of lines) expect(line.length).toBeLessThanOrEqual(132);
    expect(results).toEqual([]);
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
