import { afterEach, describe, expect, it, vi } from "vitest";
import { runTailoringSession } from "@/lib/services/tailoring-engine";
import * as openAiClientModule from "@/lib/openai/client";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("tailoring engine", () => {
  it("falls back to summary and project evidence when work experience bullets are missing", async () => {
    const structuredResume = {
      summary: ["Built production analytics workflows using SQL and Python for weekly business reporting."],
      projects: ["Created an orchestration layer that improved data pipeline visibility across teams."],
      workExperience: [],
      sections: [
        { name: "Summary", items: ["Built production analytics workflows using SQL and Python for weekly business reporting."] },
        { name: "Projects", items: ["Created an orchestration layer that improved data pipeline visibility across teams."] }
      ]
    };

    const session = await runTailoringSession({
      structuredResume,
      jobDescriptionText: [
        "Senior Analytics Engineer",
        "Must have SQL and Python",
        "Build reliable analytics workflows",
        "Partner with stakeholders to improve reporting"
      ].join("\n"),
      company: "Northwind",
      role: "Senior Analytics Engineer"
    });

    expect(session.suggestions.length).toBeGreaterThan(0);
    expect(session.suggestions[0].sourceResumeSnippet).toMatch(/SQL and Python|orchestration layer/i);
    expect(session.gaps).toBeDefined();
  });

  it("falls back to heuristic suggestions when the AI request times out", async () => {
    vi.spyOn(openAiClientModule, "getOpenAiClient").mockReturnValue({
      responses: {
        create: vi.fn().mockRejectedValue(new Error("Request timed out."))
      }
    });

    const structuredResume = {
      summary: ["Built SQL and Python pipelines for weekly reporting."],
      workExperience: ["Owned analytics workflow quality across cross-functional stakeholders."],
      projects: [],
      sections: [
        { name: "Summary", items: ["Built SQL and Python pipelines for weekly reporting."] },
        { name: "Experience", items: ["Owned analytics workflow quality across cross-functional stakeholders."] }
      ]
    };

    const session = await runTailoringSession({
      structuredResume,
      jobDescriptionText: [
        "Data Scientist",
        "Must have Python and SQL",
        "Drive evaluation quality",
        "Partner with subject matter experts"
      ].join("\n"),
      company: "Signal Works",
      role: "Data Scientist"
    });

    expect(session.suggestions.length).toBeGreaterThan(0);
    expect(session.suggestions[0].label).toMatch(/Suggested edit/i);
  });
});
