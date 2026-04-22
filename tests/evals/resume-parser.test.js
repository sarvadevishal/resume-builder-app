import { describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
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
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([300, 300]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    page.drawText("Jane Analyst", { x: 32, y: 240, size: 18, font });
    page.drawText("Built SQL dashboards", { x: 32, y: 210, size: 12, font });
    const bytes = await pdfDoc.save();
    const file = new File([bytes], "resume.pdf", { type: "application/pdf" });

    const extractedText = await extractResumeText(file);

    expect(extractedText).toContain("Jane Analyst");
    expect(extractedText).toContain("Built SQL dashboards");
  });
});
