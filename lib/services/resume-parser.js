import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

const bulletPrefixPattern = /^\s*(?:â€¢|[•●◦▪*\-])\s*/;

const sectionMatchers = {
  summary: /^(summary|profile|professional summary|professional profile|career summary)$/i,
  skills: /^(skills|technical skills|core skills|technical expertise|toolkit)$/i,
  experience: /^(experience|work experience|professional experience|employment history|career history|relevant experience|work history)$/i,
  education: /^(education|academic background)$/i,
  certifications: /^(certifications|licenses|certificates)$/i,
  projects: /^(projects|selected projects|project experience)$/i
};

function normalizeLines(text = "") {
  return text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) =>
      line
        .replace(/\u0000/g, "")
        .replace(/â€¢/g, "•")
        .replace(/[ \t]+/g, " ")
        .trim()
    )
    .filter(Boolean);
}

function cleanItemText(line = "") {
  return line.replace(bulletPrefixPattern, "").replace(/\s+/g, " ").trim();
}

function appendSectionLine(sectionItems, line, { forceNewItem = false } = {}) {
  const cleanedLine = cleanItemText(line);

  if (!cleanedLine) {
    return;
  }

  if (!sectionItems.length || forceNewItem) {
    sectionItems.push(cleanedLine);
    return;
  }

  sectionItems[sectionItems.length - 1] = `${sectionItems[sectionItems.length - 1]} ${cleanedLine}`.replace(/\s+/g, " ").trim();
}

function splitIntoSections(text = "") {
  const lines = normalizeLines(text);
  const sections = {
    contactInfo: [],
    summary: [],
    skills: [],
    workExperience: [],
    education: [],
    certifications: [],
    projects: []
  };

  let currentSection = "contactInfo";

  for (const line of lines) {
    if (sectionMatchers.summary.test(line)) currentSection = "summary";
    else if (sectionMatchers.skills.test(line)) currentSection = "skills";
    else if (sectionMatchers.experience.test(line)) currentSection = "workExperience";
    else if (sectionMatchers.education.test(line)) currentSection = "education";
    else if (sectionMatchers.certifications.test(line)) currentSection = "certifications";
    else if (sectionMatchers.projects.test(line)) currentSection = "projects";
    else {
      const startsWithBullet = bulletPrefixPattern.test(line);
      const shouldAppendToPrevious =
        !startsWithBullet &&
        ["summary", "skills", "workExperience", "projects"].includes(currentSection) &&
        sections[currentSection].length > 0;

      appendSectionLine(sections[currentSection], line, {
        forceNewItem: !shouldAppendToPrevious
      });
    }
  }

  return sections;
}

export async function extractResumeText(file) {
  if (!file) {
    return "";
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "";

  if (mimeType.includes("word") || file.name?.toLowerCase().endsWith(".docx")) {
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  }

  if (mimeType.includes("pdf") || file.name?.toLowerCase().endsWith(".pdf")) {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    return result.text;
  }

  return buffer.toString("utf-8");
}

export function buildStructuredResume(text = "") {
  const sections = splitIntoSections(text);

  return {
    ...sections,
    sections: [
      { name: "Contact", items: sections.contactInfo },
      { name: "Summary", items: sections.summary },
      { name: "Skills", items: sections.skills },
      { name: "Experience", items: sections.workExperience },
      { name: "Education", items: sections.education },
      { name: "Certifications", items: sections.certifications },
      { name: "Projects", items: sections.projects }
    ].filter((section) => section.items.length)
  };
}

export async function parseResumeInput({ file, text }) {
  const extractedText = text || (await extractResumeText(file));

  return {
    extractedText,
    structuredResume: buildStructuredResume(extractedText)
  };
}
