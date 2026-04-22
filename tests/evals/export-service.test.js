import { describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { buildExportSections, createDocResume, createDocxResume, createPdfResume, sanitizeText, wrapTextToWidth } from "@/lib/services/export-service";
import { buildExportPreview, prepareResumeExport } from "@/lib/services/export/pipeline";

const structuredResume = {
  sections: [
    { name: "Contact", items: ["Alex Candidate", "Seattle, WA", "alex@example.com", "linkedin.com/in/alexcandidate"] },
    {
      name: "Professional Summary",
      items: ["Data engineer responsible for warehouse orchestration, platform reliability, and stakeholder reporting alignment across finance teams"]
    },
    { name: "Technical Skills", items: ["Python, SQL, dbt, Snowflake, Python, Airflow"] },
    {
      name: "Experience",
      items: [
        "Senior Data Engineer | Example Corp | Jan 2022 - Present",
        "worked on finance pipelines for executive reporting and warehouse support",
        "Built long-running ELT orchestration for board, finance, product, and revenue reporting with detailed stakeholder communication and platform rollout alignment across multiple functional teams and regional planning groups",
        "Data Engineer | Prior Co | 2020 - 2022",
        "helped with warehouse maintenance and alerts"
      ]
    },
    { name: "Education", items: ["B.S. Computer Science, University of Washington, 2020"] },
    { name: "Custom Wins", items: ["Won quarterly engineering excellence award"] },
    { name: "Empty Section", items: ["", "   "] }
  ]
};

const sessionContext = {
  jobDescriptionAnalysis: {
    mustHaveSkills: ["Snowflake", "dbt"],
    preferredSkills: [],
    toolsPlatforms: ["Airflow"],
    domainKeywords: ["data warehousing"],
    responsibilities: [],
    certifications: [],
    softSkills: [],
    seniority: "Senior",
    primaryDomain: "Data Engineering"
  }
};

describe("export service", () => {
  it("maps contact and summary sections to paragraph-style export variants", () => {
    const sections = buildExportSections({
      sections: [
        { name: "Contact", items: ["Alex Candidate", "Seattle, WA | alex@example.com"] },
        { name: "Summary", items: ["Data engineer with ownership of orchestration and warehouse reliability."] },
        { name: "Experience", items: ["Built SQL and Python ELT pipelines."] }
      ]
    });

    expect(sections).toEqual([
      {
        name: "Contact",
        variant: "contact",
        items: ["Alex Candidate", "Seattle, WA | alex@example.com"]
      },
      {
        name: "Summary",
        variant: "paragraph",
        items: ["Data engineer with ownership of orchestration and warehouse reliability."]
      },
      {
        name: "Experience",
        variant: "bullet",
        items: ["Built SQL and Python ELT pipelines."]
      }
    ]);
  });

  it("wraps long text into multiple lines before drawing to PDF", async () => {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const lines = wrapTextToWidth(
      "Built Python and SQL ELT pipelines for finance reporting workloads with stronger warehouse reliability language.",
      {
        font,
        size: 10.5,
        maxWidth: 180
      }
    );

    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(" ")).toContain("warehouse reliability");
  });

  it("sanitizes parser artifacts before export formatting", () => {
    expect(sanitizeText("E ngineered develop ing consumer s insights with odd  spacing .")).toBe(
      "Engineered developing consumers insights with odd spacing."
    );
  });

  it("preserves compound wording in exported text", () => {
    expect(sanitizeText("Built a production-grade full-stack interface with real-time alerts.")).toBe(
      "Built a production-grade full-stack interface with real-time alerts."
    );
  });

  it("removes generic rewrite filler from exported text", () => {
    expect(sanitizeText("Aurora Engineering - Data Scientist, with clearer emphasis on ownership and scope.")).toBe(
      "Aurora Engineering - Data Scientist"
    );
  });

  it("suppresses empty sections and applies standard ordering", () => {
    const prepared = prepareResumeExport({
      structuredResume,
      exportOptions: {
        mode: "professional"
      },
      sessionContext
    });

    expect(prepared.exportDocument.sections.map((section) => section.id)).toEqual([
      "summary",
      "technical-skills",
      "experience",
      "education",
      "custom-wins"
    ]);
  });

  it("deduplicates and JD-prioritizes skills", () => {
    const prepared = prepareResumeExport({
      structuredResume,
      exportOptions: {
        mode: "professional",
        prioritizeMatchedSkills: true
      },
      sessionContext
    });

    const technicalSkills = prepared.exportDocument.sections.find((section) => section.id === "technical-skills");
    expect(technicalSkills.items.map((item) => item.text).join(" | ")).toContain("Snowflake");
    expect(technicalSkills.items.map((item) => item.text).join(" | ")).toContain("dbt");
    expect(technicalSkills.items.length).toBeLessThanOrEqual(2);
  });

  it("normalizes month names and enforces ATS-safe template in ATS mode", () => {
    const prepared = prepareResumeExport({
      structuredResume,
      exportOptions: {
        mode: "ats",
        templateId: "professional-modern"
      },
      sessionContext
    });

    expect(prepared.options.templateId).toBe("ats-classic");
    const experience = prepared.exportDocument.sections.find((section) => section.id === "experience");
    expect(experience.items[0].text).toContain("Jan 2022 - Present");
  });

  it("generates warnings for generic and dense content", () => {
    const preview = buildExportPreview({
      structuredResume,
      exportOptions: {
        mode: "professional"
      },
      sessionContext
    });

    expect(preview.warnings.some((warning) => warning.id === "generic-bullets")).toBe(true);
    expect(preview.warnings.some((warning) => warning.id === "dense-bullets")).toBe(true);
  });

  it("renders deterministic binary outputs for PDF, DOCX, and DOC fallback", async () => {
    const pdfBuffer = await createPdfResume(structuredResume, { format: "pdf", mode: "ats" }, sessionContext);
    const docxBuffer = await createDocxResume(structuredResume, { format: "docx", mode: "professional" }, sessionContext);
    const docBuffer = await createDocResume(structuredResume, { format: "doc", mode: "ats" }, sessionContext);

    expect(pdfBuffer.length).toBeGreaterThan(1000);
    expect(docxBuffer.length).toBeGreaterThan(1000);
    expect(docBuffer.toString("utf8", 0, 10)).toContain("{");
  });

  it("keeps template selection behavior safe for unsupported DOC combinations", () => {
    const preview = buildExportPreview({
      structuredResume,
      exportOptions: {
        format: "doc",
        templateId: "professional-modern",
        mode: "professional"
      },
      sessionContext
    });

    expect(preview.options.templateId).toBe("ats-classic");
    expect(preview.compatibility).toContain("RTF-based compatibility fallback");
  });
});
