import { describe, expect, it } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { buildStructuredResume, extractResumeText } from "@/lib/services/resume-parser";

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

  it("extracts readable text from PDF uploads", async () => {
    const fixturePath = path.join(process.cwd(), "tests", "fixtures", "sample-resume.pdf");
    const bytes = await fs.readFile(fixturePath);
    const file = new File([bytes], "resume.pdf", { type: "application/pdf" });

    const extractedText = await extractResumeText(file);

    expect(extractedText).toContain("JANE DOE");
    expect(extractedText).toContain("Built Python and SQL ELT pipelines");
  });

  it("extracts readable text from DOCX uploads", async () => {
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [new TextRun("Jordan Engineer")]
            }),
            new Paragraph({
              children: [new TextRun("Built dbt models for finance reporting")]
            })
          ]
        }
      ]
    });

    const buffer = await Packer.toBuffer(doc);
    const file = new File([buffer], "resume.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    });

    const extractedText = await extractResumeText(file);

    expect(extractedText).toContain("Jordan Engineer");
    expect(extractedText).toContain("Built dbt models for finance reporting");
  });

  it("rejects unsupported resume file types with a clear message", async () => {
    const file = new File([Buffer.from("not a resume")], "resume.png", { type: "image/png" });

    await expect(extractResumeText(file)).rejects.toThrow("Unsupported file type. Please upload a PDF, DOCX, or plain-text resume.");
  });

  it("separates awards and publications instead of merging them into skills", () => {
    const structuredResume = buildStructuredResume([
      "Alex Candidate",
      "Skills",
      "Python, SQL, dbt, Snowflake",
      "Achievements",
      "Won quarterly engineering excellence award",
      "Publication",
      "Object detection using Hausdorff distance"
    ].join("\n"));

    expect(structuredResume.sections.map((section) => section.name)).toEqual(["Contact", "Skills", "Awards", "Publications"]);
    expect(structuredResume.sections.find((section) => section.name === "Skills").items).toEqual(["Python, SQL, dbt, Snowflake"]);
    expect(structuredResume.sections.find((section) => section.name === "Awards").items).toEqual(["Won quarterly engineering excellence award"]);
    expect(structuredResume.sections.find((section) => section.name === "Publications").items).toEqual(["Object detection using Hausdorff distance"]);
  });
});
