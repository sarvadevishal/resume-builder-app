import { describe, expect, it } from "vitest";
import { analyzeAtsSafety } from "@/lib/services/ats-safety";

describe("ats safety", () => {
  it("flags tabs and mixed date styles", () => {
    const result = analyzeAtsSafety({
      resumeText: "Experience\nJan 2024 - 2025\tBuilt reporting pipelines",
      structuredResume: {
        sections: [{ name: "Experience", items: ["Built reporting pipelines"] }]
      }
    });

    expect(result.warnings.length).toBeGreaterThanOrEqual(2);
  });
});
