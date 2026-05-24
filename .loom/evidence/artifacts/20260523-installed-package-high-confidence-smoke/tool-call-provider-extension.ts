import { createAssistantMessageEventStream } from "@earendil-works/pi-ai";

const COMMAND = "npm test";
const TOOL_CALL_ID = "pfr_highconf_tool_1";

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

function baseMessage(model: any, stopReason: "stop" | "toolUse", content: any[]) {
  return {
    role: "assistant",
    content,
    api: "pfr-local-tool-call",
    provider: "pfr-local",
    model: model.id,
    usage: usage(),
    stopReason,
    timestamp: Date.now(),
  };
}

function contextHasToolResult(context: any): boolean {
  return Array.isArray(context?.messages) && context.messages.some((message: any) => message?.role === "toolResult" && message?.toolCallId === TOOL_CALL_ID);
}

function emitText(model: any, text: string) {
  const stream = createAssistantMessageEventStream();
  queueMicrotask(() => {
    const started: any = baseMessage(model, "stop", []);
    const done: any = baseMessage(model, "stop", [{ type: "text", text }]);
    stream.push({ type: "start", partial: started });
    stream.push({ type: "text_start", contentIndex: 0, partial: done });
    stream.push({ type: "text_delta", contentIndex: 0, delta: text, partial: done });
    stream.push({ type: "text_end", contentIndex: 0, content: text, partial: done });
    stream.push({ type: "done", reason: "stop", message: done });
    stream.end(done);
  });
  return stream;
}

function emitBashToolCall(model: any) {
  const stream = createAssistantMessageEventStream();
  queueMicrotask(() => {
    const toolCall = { type: "toolCall", id: TOOL_CALL_ID, name: "bash", arguments: { command: COMMAND } };
    const started: any = baseMessage(model, "toolUse", []);
    const done: any = baseMessage(model, "toolUse", [toolCall]);
    stream.push({ type: "start", partial: started });
    stream.push({ type: "toolcall_start", contentIndex: 0, partial: started });
    stream.push({ type: "toolcall_delta", contentIndex: 0, delta: JSON.stringify(toolCall.arguments), partial: done });
    stream.push({ type: "toolcall_end", contentIndex: 0, toolCall, partial: done });
    stream.push({ type: "done", reason: "toolUse", message: done });
    stream.end(done);
  });
  return stream;
}

export default function pfrToolCallProviderExtension(pi: any): void {
  pi.registerProvider?.("pfr-local", {
    name: "PFR Local Tool Call",
    baseUrl: "http://127.0.0.1/pfr-local-tool-call",
    apiKey: "PFR_LOCAL_STUB_KEY",
    api: "pfr-local-tool-call",
    models: [
      {
        id: "bash-fail",
        name: "PFR Local Bash Failure",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 4096,
        maxTokens: 64,
      },
    ],
    streamSimple(model: any, context: any) {
      if (contextHasToolResult(context)) return emitText(model, "PFR_LOCAL_TOOLCALL_DONE");
      return emitBashToolCall(model);
    },
  });
}
