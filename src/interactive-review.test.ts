import { describe, expect, it } from "vitest";
import { askReviewChoice, askReviewEditor } from "./interactive-review.js";

describe("interactive review helpers", () => {
  it("selects choices through a Pi-like UI and reports cancellation", async () => {
    const selected = await askReviewChoice({ ui: { select: () => "Make Rule — Draft guidance" } }, "Action?", [
      { value: "useful", label: "Useful" },
      { value: "make-rule", label: "Make Rule", description: "Draft guidance" },
    ]);
    expect(selected).toEqual({ kind: "selected", value: "make-rule", label: "Make Rule" });

    await expect(askReviewChoice({}, "Action?", [{ value: "x", label: "X" }])).resolves.toEqual({ kind: "cancelled", reason: "no-ui" });
  });

  it("edits draft text through a Pi-like editor", async () => {
    const edited = await askReviewEditor({ ui: { editor: (_title, text) => `${text} edited` } }, "Draft", "rule text");
    expect(edited).toEqual({ kind: "submitted", text: "rule text edited" });
  });
});
