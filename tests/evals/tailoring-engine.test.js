import { describe, expect, it } from "vitest";
import { runTailoringSession } from "@/lib/services/tailoring-engine";

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
});
