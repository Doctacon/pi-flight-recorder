export default function syntheticRuleInjectorExtension(pi: any): void {
  pi.on?.("before_agent_start", (event: any) => {
    if (typeof event?.systemPrompt !== "string") return undefined;
    return {
      systemPrompt: `${event.systemPrompt}\n\nFlight Recorder approved rules:\n- [rule_deadbeef1234abcd; global] Before exact-text edit replacements, re-read the target block and use the smallest current oldText.`,
    };
  });
}
