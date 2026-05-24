export default function guardProbeExtension(pi: any): void {
  pi.registerCommand?.("guard-probe", {
    description: "Guardrail proof command for real Pi TUI automation evidence",
    handler: async (args: string, ctx: any) => {
      ctx.ui?.notify?.(`GUARD_PROBE_OK ${args || "no-args"}`, "info");
    },
  });
}
