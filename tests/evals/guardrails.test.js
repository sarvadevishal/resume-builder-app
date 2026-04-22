import { describe, expect, it } from "vitest";
import { detectNewNumbers, validateSuggestionSafety } from "@/lib/validators/guardrails";

describe("guardrails", () => {
  it("detects unsupported numbers", () => {
    const unsupported = detectNewNumbers({
      originalBullet: "Improved pipeline quality for weekly reports.",
      sourceResumeSnippet: "Improved pipeline quality for weekly reports.",
      suggestedBullet: "Improved pipeline quality by 35% for weekly reports."
    });

    expect(unsupported).toEqual(["35%"]);
  });

  it("marks unsupported domain terms as unsafe", () => {
    const result = validateSuggestionSafety({
      originalBullet: "Built SQL pipelines for reporting.",
      suggestedBullet: "Built Snowflake SQL pipelines for reporting.",
      sourceResumeSnippet: "Built SQL pipelines for reporting.",
      matchedJobDescriptionSnippet: "Must have Snowflake and SQL.",
      resumeText: "Built SQL pipelines for reporting."
    });

    expect(result.safe).toBe(false);
    expect(result.reasons.some((reason) => reason.includes("unsupported_terms:snowflake"))).toBe(true);
  });
});
