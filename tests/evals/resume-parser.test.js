import { describe, expect, it } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { buildStructuredResume, buildStructuredResumeFromPdfLines, extractResumeText } from "@/lib/services/resume-parser";

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

  it("reconstructs sidebar-style PDF lines into the right sections", () => {
    const structuredResume = buildStructuredResumeFromPdfLines([
      { text: "Jayesh Bhadane", size: 12.5, page: 1, x: 3.125, y: 2 },
      { text: "Palo Alto, CA | +1 (860) 934-8059 | jayesh281998@gmail.com | LinkedIn | GitHub | Portfolio", size: 12.5, page: 1, x: 3.125, y: 3 },
      { text: "Bachelor of Engineering, Computer Engineering | University of Mumbai, India | GPA: 3.0 / 4.0", size: 22, page: 1, x: 3.125, y: 4 },
      { text: "MS, Data Science | University of Connecticut, Storrs, USA | GPA: 3.78 / 4.0", size: 12.2, page: 1, x: 3.125, y: 5 },
      { text: "SUMMARY", size: 13.9, page: 1, x: 3.125, y: 6 },
      { text: "Data Scientist with ~5 years of experience spanning enterprise data science consulting, applied ML research, and AI engineering.", size: 12.5, page: 1, x: 3.125, y: 7 },
      { text: "SKILLS", size: 13.9, page: 1, x: 3.125, y: 8 },
      { text: "Languages & Tools: Python, SQL, Spark, Docker, AWS, GCP", size: 12.5, page: 1, x: 3.125, y: 9 },
      { text: "Frameworks & Libraries: Pandas, NumPy, Scikit-Learn, PyTorch", size: 12.5, page: 1, x: 3.125, y: 10 },
      { text: "EXPERIENCE", size: 13.9, page: 1, x: 3.125, y: 11 },
      { text: "Skan AI - Machine Learning Engineer Dec 2025 - Present", size: 12.5, page: 1, x: 3.125, y: 12 },
      { text: "Engineering an Agentic AI platform for an insurance client that automates 15+ manual workflow steps.", size: 12.5, page: 1, x: 3.125, y: 13 },
      { text: "Aurora Engineering - Data Scientist Aug 2024 - Dec 2025", size: 12.5, page: 1, x: 3.125, y: 14 },
      { text: "Built deep learning models to recover missing values in NASA MMS flight data.", size: 12.5, page: 1, x: 3.125, y: 15 },
      { text: "AWARDS", size: 13.9, page: 1, x: 3.125, y: 16 },
      { text: "Star of the Quarter: Awarded Star of the Quarter twice at C5i for exceeding role expectations.", size: 12.5, page: 1, x: 3.125, y: 17 },
      { text: "Publication: Object Detection using Hausdorff distance [ link ].", size: 12.5, page: 1, x: 3.125, y: 18 }
    ]);

    expect(structuredResume.contactInfo[0]).toBe("Jayesh Bhadane");
    expect(structuredResume.education).toEqual([
      "Bachelor of Engineering, Computer Engineering | University of Mumbai, India | GPA: 3.0 / 4.0",
      "MS, Data Science | University of Connecticut, Storrs, USA | GPA: 3.78 / 4.0"
    ]);
    expect(structuredResume.summary).toEqual([
      "Data Scientist with ~5 years of experience spanning enterprise data science consulting, applied ML research, and AI engineering."
    ]);
    expect(structuredResume.skills).toEqual([
      "Languages & Tools: Python, SQL, Spark, Docker, AWS, GCP",
      "Frameworks & Libraries: Pandas, NumPy, Scikit-Learn, PyTorch"
    ]);
    expect(structuredResume.workExperience).toContain("Skan AI - Machine Learning Engineer Dec 2025 - Present");
    expect(structuredResume.awards).toEqual(["Star of the Quarter: Awarded Star of the Quarter twice at C5i for exceeding role expectations."]);
    expect(structuredResume.publications).toEqual(["Publication: Object Detection using Hausdorff distance [ link ]."]);
  });
});
