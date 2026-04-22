import { describe, expect, it } from "vitest";
import { buildStructuredResume } from "@/lib/services/resume-parser";

describe("resume parser", () => {
  it("merges wrapped lines inside summary and experience sections", () => {
    const structuredResume = buildStructuredResume([
      "SUMMARY",
      "Built SQL and Python pipelines for finance reporting",
      "across weekly and monthly executive dashboards.",
      "EXPERIENCE",
      "- Maintained Redshift warehouse tables",
      "and improved downstream data quality."
    ].join("\n"));

    expect(structuredResume.summary).toEqual([
      "Built SQL and Python pipelines for finance reporting across weekly and monthly executive dashboards."
    ]);
    expect(structuredResume.workExperience).toEqual([
      "Maintained Redshift warehouse tables and improved downstream data quality."
    ]);
  });

  it("strips bullet markers and recognizes broader section heading aliases", () => {
    const structuredResume = buildStructuredResume([
      "TECHNICAL EXPERTISE",
      "• SQL, Python, dbt",
      "WORK HISTORY",
      "• Built orchestration for analytics pipelines"
    ].join("\n"));

    expect(structuredResume.skills).toEqual(["SQL, Python, dbt"]);
    expect(structuredResume.workExperience).toEqual(["Built orchestration for analytics pipelines"]);
  });
});
