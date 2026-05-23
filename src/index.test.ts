import { describe, expect, it } from "vitest";
import { getVersion } from "./index.js";
import { helpText } from "./cli.js";

describe("project scaffold", () => {
  it("exports a version", () => {
    expect(getVersion()).toBe("0.1.0");
  });

  it("renders local-first help", () => {
    expect(helpText()).toContain("seen-this-before");
    expect(helpText()).toContain("Everything is local");
  });
});
