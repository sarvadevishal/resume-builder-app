import { describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { buildExportSections, sanitizeText, wrapTextToWidth } from "@/lib/services/export-service";

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
});
