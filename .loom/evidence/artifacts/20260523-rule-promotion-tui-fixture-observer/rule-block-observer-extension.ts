import { appendFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname } from "node:path";
import { createAssistantMessageEventStream } from "@earendil-works/pi-ai";

let sequence = 0;

function usage() {
  return {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 0,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
  };
}

function hash(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function redactForArtifact(text: string): string {
  return text
    .replace(/[A-Za-z0-9_=-]{24,}/g, "<redacted-token>")
    .replace(/\/tmp\/[^\s;)]+/g, "<temp-path>")
    .replace(/\/private\/tmp\/[^\s;)]+/g, "<temp-path>");
}

function extractFlightRecorderRuleBlock(systemPrompt: string | undefined): string | null {
  if (!systemPrompt) return null;
  const lines = systemPrompt.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === "Flight Recorder approved rules:");
  if (start < 0) return null;
  const block: string[] = [lines[start]];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith("- [")) {
      block.push(line);
      continue;
    }
    break;
  }
  return block.join("\n");
}

function ruleIdsFromBlock(block: string | null): string[] {
  if (!block) return [];
  return Array.from(block.matchAll(/\[(rule_[a-f0-9]+);/g)).map((match) => match[1]);
}

function appendObservation(observation: Record<string, unknown>): void {
  const logPath = process.env.PFR_RULE_OBSERVER_LOG;
  if (!logPath) return;
  mkdirSync(dirname(logPath), { recursive: true });
  appendFileSync(logPath, `${JSON.stringify(observation)}\n`, "utf8");
}

function registerLocalStubProvider(pi: any): void {
  pi.registerProvider?.("pfr-local", {
    name: "PFR Local Stub",
    baseUrl: "http://127.0.0.1/pfr-local-stub",
    apiKey: "PFR_LOCAL_STUB_KEY",
    api: "pfr-local-stub",
    models: [
      {
        id: "stub",
        name: "PFR Local Stub",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 4096,
        maxTokens: 64,
      },
    ],
    streamSimple(model: any) {
      const stream = createAssistantMessageEventStream();
      queueMicrotask(() => {
        const started: any = {
          role: "assistant",
          content: [],
          api: "pfr-local-stub",
          provider: "pfr-local",
          model: model.id,
          usage: usage(),
          stopReason: "stop",
          timestamp: Date.now(),
        };
        const done: any = { ...started, content: [{ type: "text", text: "PFR_LOCAL_STUB_RESPONSE" }] };
        stream.push({ type: "start", partial: started });
        stream.push({ type: "text_start", contentIndex: 0, partial: done });
        stream.push({ type: "text_delta", contentIndex: 0, delta: "PFR_LOCAL_STUB_RESPONSE", partial: done });
        stream.push({ type: "text_end", contentIndex: 0, content: "PFR_LOCAL_STUB_RESPONSE", partial: done });
        stream.push({ type: "done", reason: "stop", message: done });
        stream.end(done);
      });
      return stream;
    },
  });
}

export default function ruleBlockObserverExtension(pi: any): void {
  registerLocalStubProvider(pi);

  pi.on?.("before_agent_start", (event: any) => {
    const block = extractFlightRecorderRuleBlock(typeof event?.systemPrompt === "string" ? event.systemPrompt : undefined);
    const ids = ruleIdsFromBlock(block);
    const safeBlock = block ? redactForArtifact(block).slice(0, 1000) : null;
    appendObservation({
      type: "before_agent_start",
      sequence: ++sequence,
      hasFlightRecorderRuleBlock: Boolean(block),
      ruleIds: ids,
      blockLineCount: block ? block.split(/\r?\n/).length : 0,
      blockByteCount: block ? Buffer.byteLength(block, "utf8") : 0,
      blockSha256: block ? hash(block) : null,
      redactedBlockExcerpt: safeBlock,
    });
  });
}
