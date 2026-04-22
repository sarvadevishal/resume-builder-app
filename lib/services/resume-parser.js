import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

const sectionMatchers = {
  summary: /^(summary|profile|professional summary)$/i,
  skills: /^(skills|technical skills|core skills)$/i,
  experience: /^(experience|work experience|professional experience|employment history|career history|relevant experience)$/i,
  education: /^(education)$/i,
  certifications: /^(certifications|licenses)$/i,
  projects: /^(projects)$/i
};

function normalizeLines(text = "") {
  return text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
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
    else sections[currentSection].push(line.replace(/^[•\-]\s*/, ""));
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
