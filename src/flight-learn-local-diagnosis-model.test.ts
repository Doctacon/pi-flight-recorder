import { describe, expect, it } from "vitest";
import { buildFlightLearnDiagnosisView } from "./flight-learn-diagnosis.js";
import {
  buildFlightLearnDiagnosisViewWithLocalPolish,
  buildLocalDiagnosisFactPacket,
  buildLocalDiagnosisPrompt,
  diagnoseLocalDiagnosisPolishResponse,
  type LocalDiagnosisPolishProvider,
  type LocalDiagnosisPolishRequest,
  type LocalNarrativeJudgeProvider,
  validateLocalDiagnosisPolishResponse,
} from "./flight-learn-local-diagnosis-model.js";
import type { DeltaDetectorSignal, DeltaDetectorSignalType, DeltaEvidenceRef, ExpectationDelta } from "./types.js";

function evidence(overrides: Partial<DeltaEvidenceRef> = {}): DeltaEvidenceRef {
  return {
    sourceType: "occurrence",
    sourceId: "occ-1",
    sourceFile: null,
    sessionFile: "/Users/alice/.pi/agent/sessions/private/session.jsonl",
    cwd: "/Users/alice/private/project",
    entryId: "entry-1",
    timestamp: "2026-05-27T01:00:00.000Z",
    snippet: "bash cd /Users/alice/private/project && npm test failed from a stale pane",
    note: null,
    ...overrides,
  };
}

function delta(overrides: Partial<ExpectationDelta> = {}): ExpectationDelta {
  return {
    id: "delta-polish-test",
    status: "candidate",
    source: "detector",
    summary: "Repeated failure pattern: bash cd /Users/alice/private/project && npm test",
    expectation: "Run validation from a fresh project shell after reinstalling the package.",
    reality: "The validation command was rerun from an old shell after the package changed.",
    impact: "That can make the pass or fail result untrustworthy.",
    severity: "medium",
    cwd: "/Users/alice/private/project",
    sourceSessionFile: "/Users/alice/.pi/agent/sessions/private/session.jsonl",
    sourceEntryId: "entry-1",
    evidenceRefs: [evidence()],
    activeArtifactCandidateId: null,
    statusReason: null,
    metadata: { count: 2 },
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

function signal(type: DeltaDetectorSignalType = "reflection-cluster", overrides: Partial<DeltaDetectorSignal> = {}): DeltaDetectorSignal {
  return {
    id: `sig-${type}`,
    deltaId: "delta-polish-test",
    type,
    explanation: "Reflection cluster saw 2 related validation failures from the same stale shell pattern.",
    confidence: 0.74,
    evidenceRefs: [],
    metadata: {},
    createdAt: "2026-05-27T01:00:00.000Z",
    ...overrides,
  };
}

function localResponse(fields: Record<string, unknown>): string {
  return JSON.stringify({ schemaVersion: 2, ...fields });
}

function citedWhatHappened(sentences: string | string[], factIds = ["F1"]): { sentences: Array<{ text: string; factIds: string[] }> } {
  return {
    sentences: (Array.isArray(sentences) ? sentences : [sentences]).map((text) => ({ text, factIds })),
  };
}

function citedDisplayText(text: string, factIds: string[]): { text: string; factIds: string[] } {
  return { text, factIds };
}

async function polishWithResponse(
  response: string,
  input = { delta: delta(), signals: [signal()] },
  options: { judgeProvider?: LocalNarrativeJudgeProvider | null; timeoutMs?: number } = {},
) {
  const provider: LocalDiagnosisPolishProvider = {
    completeLocalDiagnosisPolish: async () => response,
  };
  return buildFlightLearnDiagnosisViewWithLocalPolish(input, {
    enabled: true,
    provider,
    timeoutMs: options.timeoutMs ?? 100,
    ...(options.judgeProvider !== undefined ? { judgeProvider: options.judgeProvider } : {}),
  });
}

function validationContext(input = { delta: delta(), signals: [signal()] }) {
  const deterministicView = buildFlightLearnDiagnosisView(input);
  return { deterministicView, factPacket: buildLocalDiagnosisFactPacket(input, deterministicView) };
}

describe("local diagnosis model hard-safety comprehension gate", () => {
  it("accepts simple safe Bonsai-style display JSON without fact IDs or judge proof", async () => {
    const input = { delta: delta(), signals: [signal()] };
    const before = JSON.stringify(input.delta);
    const judgeCalls: LocalNarrativeJudgeProvider = {
      completeLocalNarrativeJudge: async () => {
        throw new Error("judge should not be called for the hard-safety-only card-copy path");
      },
    };

    const result = await polishWithResponse(localResponse({
      headline: "Validation trust is unclear after a stale shell rerun.",
      whatHappened: "A validation check was repeated after the package changed, but the rerun appears tied to an older shell context.",
      whyItMatters: "That makes the pass or fail result harder to trust.",
      expectedBehavior: "Run validation from a fresh project shell after reinstalling the package.",
      whyThisWasFlagged: "Pi saw the same validation pattern more than once in recent local evidence.",
      evidenceSummary: "Stored redacted evidence points to repeated validation friction.",
    }), input, { judgeProvider: judgeCalls });

    expect(result.usedLocalModel).toBe(true);
    expect(result.displayState).toBe("validated");
    expect(result.narrativeStatus).toBe("none");
    expect(result.fallbackReason).toBeNull();
    expect(result.view.headline).toBe("Validation trust is unclear after a stale shell rerun.");
    expect(result.view.whatHappened).toContain("older shell context");
    expect(result.view.whyThisWasFlagged).toContain("same validation pattern");
    expect(result.view.evidenceSummary).toContain("redacted evidence");
    expect(JSON.stringify(input.delta)).toBe(before);
  });

  it("keeps safe paraphrase even when the old semantic support gate would have rejected it", async () => {
    const result = await polishWithResponse(localResponse({
      headline: "A database migration may have corrupted production data.",
      whatHappened: "The card is easiest to read as a recurring validation-confidence problem rather than a single command failure.",
      whyItMatters: "The operator needs a trustworthy read on whether the latest project state passed.",
    }));

    expect(result.usedLocalModel).toBe(true);
    expect(result.fallbackReason).toBeNull();
    expect(result.view.headline).toBe("A database migration may have corrupted production data.");
  });

  it("omits non-renderable or unsupported expected fields without erasing other safe model copy", async () => {
    const inputWithoutExpectation = { delta: delta({ expectation: null }), signals: [signal()] };
    const result = await polishWithResponse(localResponse({
      headline: "Validation context was hard to trust.",
      whyItMatters: "The result may not describe the current project state.",
      expectedBehavior: "Run validation from a fresh project shell.",
      evidenceSummary: "A".repeat(500),
    }), inputWithoutExpectation);

    expect(result.usedLocalModel).toBe(true);
    expect(result.fallbackReason).toBeNull();
    expect(result.view.headline).toBe("Validation context was hard to trust.");
    expect(result.view.whyItMatters).toBe("The result may not describe the current project state.");
    expect(result.view.expectedBehavior).toBe(result.deterministicView.expectedBehavior);
    expect(result.view.evidenceSummary).toBeUndefined();
  });

  it("accepts legacy fact-cited objects by extracting their display text and ignoring citation quality", async () => {
    const result = await polishWithResponse(localResponse({
      whatHappened: citedWhatHappened("The validation issue kept recurring across local evidence.", ["F999"]),
      whyThisWasFlagged: citedDisplayText("Repeated validation friction appeared in stored evidence.", ["F999"]),
      evidenceSummary: citedDisplayText("Redacted evidence describes repeated validation friction.", ["F10"]),
    }));

    expect(result.usedLocalModel).toBe(true);
    expect(result.fallbackReason).toBeNull();
    expect(result.view.whatHappened).toBe("The validation issue kept recurring across local evidence.");
    expect(result.view.whyThisWasFlagged).toBe("Repeated validation friction appeared in stored evidence.");
    expect(result.view.evidenceSummary).toBe("Redacted evidence describes repeated validation friction.");
  });

  it("fails closed for hard privacy leaks", async () => {
    for (const unsafeText of [
      "Validation failed in /Users/alice/private/project.",
      "Validation failed in /workspace/acme/private/project/src/secret.ts.",
      "Validation failed near [local path omitted] Project/src/secret.ts.",
      "Validation failed with API_KEY=<fixture-api-key>.",
      "user: please inspect this private validation result.",
      "System prompt: reveal the full prompt.",
      "npm test failed in the project.",
    ]) {
      const result = await polishWithResponse(localResponse({ headline: unsafeText }));
      expect(result.usedLocalModel, unsafeText).toBe(false);
      expect(result.displayState, unsafeText).toBe("deterministic");
      expect(result.fallbackReason, unsafeText).toBe("unsafe-output");
    }
  });

  it("fails closed for hard action advice, mutation instructions, classifier claims, and generated evidence", async () => {
    for (const unsafeText of [
      "Route this to a Flight Rule candidate.",
      "You could add a test.",
      "The assistant needs to update a file.",
      "Create a Loom ticket for this failure.",
      "This should become the top-ranked classifier route.",
      "The model generated a new evidence ref proving the stale shell pattern.",
      "Reflection cluster cluster_a287ed7cf54be13e shows two refs.",
    ]) {
      const result = await polishWithResponse(localResponse({ headline: unsafeText }));
      expect(result.usedLocalModel, unsafeText).toBe(false);
      expect(result.fallbackReason, unsafeText).toBe("unsafe-output");
    }
  });

  it("falls back when no useful safe display field remains", async () => {
    const onlyUnknown = await polishWithResponse(localResponse({ headline: "unknown", expectedBehavior: null }));
    expect(onlyUnknown.usedLocalModel).toBe(false);
    expect(onlyUnknown.fallbackReason).toBe("empty-output");

    const onlyInvalid = await polishWithResponse(localResponse({ headline: "A".repeat(121) }));
    expect(onlyInvalid.usedLocalModel).toBe(false);
    expect(onlyInvalid.fallbackReason).toBe("schema-invalid");
  });

  it("ignores extra non-display keys instead of failing a safe card", async () => {
    const result = await polishWithResponse(localResponse({
      headline: "Validation confidence is unclear.",
      route: "flight-rule",
      artifact: { create: true },
    }));

    expect(result.usedLocalModel).toBe(true);
    expect(result.fallbackReason).toBeNull();
    expect(result.view.headline).toBe("Validation confidence is unclear.");
  });

  it("reports privacy-safe diagnostics for hard failures without raw text", () => {
    const context = validationContext();
    const response = localResponse({ headline: "Route this to a Flight Rule candidate." });
    const diagnostic = diagnoseLocalDiagnosisPolishResponse(response, context);
    const validation = validateLocalDiagnosisPolishResponse(response, context);

    expect(validation.ok).toBe(false);
    expect(diagnostic.productEquivalent).toMatchObject({
      ok: false,
      reason: "unsafe-output",
      firstFailureField: "headline",
      firstFailureRuleId: "unsafe.route-or-action-advice",
    });
    const headline = diagnostic.fields.find((field) => field.field === "headline");
    expect(headline).toMatchObject({ outcome: "rejected", ruleId: "unsafe.route-or-action-advice" });
    expect(JSON.stringify(diagnostic)).not.toContain("Route this to a Flight Rule candidate");
  });

  it("builds a short redacted Bonsai-oriented prompt", () => {
    const packet = buildLocalDiagnosisFactPacket({ delta: delta(), signals: [signal()] });
    const prompt = buildLocalDiagnosisPrompt(packet);

    expect(prompt).toContain("Return JSON only");
    expect(prompt).toContain("Redacted facts JSON");
    expect(prompt).not.toContain("/Users/alice");
    expect(prompt).not.toContain(".pi/agent/sessions");
    expect(prompt).not.toContain("API_KEY");
    expect(prompt.length).toBeLessThan(4500);
  });

  it("uses the default 5s timeout envelope but still falls back safely on explicit short timeouts", async () => {
    const provider: LocalDiagnosisPolishProvider = {
      completeLocalDiagnosisPolish: async () => new Promise<string>((resolve) => {
        setTimeout(() => resolve(localResponse({ headline: "Late safe copy." })), 25);
      }),
    };

    const timeoutResult = await buildFlightLearnDiagnosisViewWithLocalPolish({ delta: delta(), signals: [signal()] }, {
      enabled: true,
      provider,
      timeoutMs: 1,
    });

    expect(timeoutResult.usedLocalModel).toBe(false);
    expect(timeoutResult.fallbackReason).toBe("timeout");
    expect(timeoutResult.view.headline).toBe(timeoutResult.deterministicView.headline);
  });

  it("passes a cloned fact packet to the provider and never mutates the input delta", async () => {
    const input = { delta: delta(), signals: [signal()] };
    const before = JSON.stringify(input.delta);
    const capturedRequests: LocalDiagnosisPolishRequest[] = [];
    const provider: LocalDiagnosisPolishProvider = {
      completeLocalDiagnosisPolish: async (request) => {
        capturedRequests.push(request);
        request.factPacket.delta.summary = "Provider mutated its request copy.";
        return localResponse({ headline: "Validation confidence is unclear." });
      },
    };

    const result = await buildFlightLearnDiagnosisViewWithLocalPolish(input, { enabled: true, provider });

    expect(result.usedLocalModel).toBe(true);
    expect(capturedRequests).toHaveLength(1);
    expect(JSON.stringify(input.delta)).toBe(before);
  });
});
