import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const mammoth = require("mammoth");
const PDFParser = require("pdf2json");

const bulletPrefixPattern = /^\s*(?:Ã¢â‚¬Â¢|[\u2022\u25cf\u25e6\u25aa*\-])\s*/;

const sectionMatchers = {
  summary: /^(summary|profile|professional summary|professional profile|career summary)$/i,
  skills: /^(skills|technical skills|core skills|technical expertise|toolkit)$/i,
  experience: /^(experience|work experience|professional experience|employment history|career history|relevant experience|work history)$/i,
  education: /^(education|academic background)$/i,
  certifications: /^(certifications|licenses|certificates)$/i,
  projects: /^(projects|selected projects|project experience)$/i,
  awards: /^(achievements|awards|honors)$/i,
  publications: /^(publication|publications|research|papers)$/i,
  volunteer: /^(volunteer experience|volunteering)$/i,
  languages: /^(languages)$/i,
  links: /^(links|portfolio|profiles|online presence)$/i
};

function normalizeLines(text = "") {
  return text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) =>
      line
        .replace(/\u0000/g, "")
        .replace(/Ã¢â‚¬Â¢/g, "\u2022")
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

function finalizeExtractedText(text = "") {
  return text
    .replace(/\r/g, "")
    .replace(/----------------Page \(\d+\) Break----------------/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\t+/g, " ").replace(/[ ]{2,}/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

function isLegacyWordDocument(file, mimeType) {
  return mimeType === "application/msword" || file?.name?.toLowerCase().endsWith(".doc");
}

function buildLegacyWordUploadError() {
  return new Error("Legacy .doc resumes are not supported yet. Please upload a PDF or DOCX file instead.");
}

function shouldUseFileText(file) {
  return file?.name?.toLowerCase().endsWith(".txt") || file?.type?.startsWith("text/");
}

function isSupportedResumeUpload(file, mimeType) {
  return Boolean(
    shouldUseFileText(file) ||
      mimeType.includes("word") ||
      mimeType.includes("pdf") ||
      file?.name?.toLowerCase().endsWith(".docx") ||
      file?.name?.toLowerCase().endsWith(".pdf")
  );
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
    projects: [],
    awards: [],
    publications: [],
    volunteerExperience: [],
    languages: [],
    links: []
  };

  let currentSection = "contactInfo";

  for (const line of lines) {
    if (sectionMatchers.summary.test(line)) currentSection = "summary";
    else if (sectionMatchers.skills.test(line)) currentSection = "skills";
    else if (sectionMatchers.experience.test(line)) currentSection = "workExperience";
    else if (sectionMatchers.education.test(line)) currentSection = "education";
    else if (sectionMatchers.certifications.test(line)) currentSection = "certifications";
    else if (sectionMatchers.projects.test(line)) currentSection = "projects";
    else if (sectionMatchers.awards.test(line)) currentSection = "awards";
    else if (sectionMatchers.publications.test(line)) currentSection = "publications";
    else if (sectionMatchers.volunteer.test(line)) currentSection = "volunteerExperience";
    else if (sectionMatchers.languages.test(line)) currentSection = "languages";
    else if (sectionMatchers.links.test(line)) currentSection = "links";
    else {
      const startsWithBullet = bulletPrefixPattern.test(line);
      const shouldAppendToPrevious =
        !startsWithBullet &&
        ["summary", "skills", "workExperience", "projects", "awards", "publications", "volunteerExperience"].includes(currentSection) &&
        sections[currentSection].length > 0;

      appendSectionLine(sections[currentSection], line, {
        forceNewItem: !shouldAppendToPrevious
      });
    }
  }

  return sections;
}

async function extractPdfText(buffer) {
  return new Promise((resolve, reject) => {
    const parser = new PDFParser(null, true);

    parser.on("pdfParser_dataError", (error) => {
      reject(error?.parserError || error);
    });

    parser.on("pdfParser_dataReady", () => {
      resolve(finalizeExtractedText(parser.getRawTextContent()));
    });

    parser.parseBuffer(buffer);
  });
}

export async function extractResumeText(file) {
  if (!file) {
    return "";
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "";

  if (isLegacyWordDocument(file, mimeType)) {
    throw buildLegacyWordUploadError();
  }

  if (mimeType.includes("word") || file.name?.toLowerCase().endsWith(".docx")) {
    const { value } = await mammoth.extractRawText({ buffer });
    return finalizeExtractedText(value);
  }

  if (mimeType.includes("pdf") || file.name?.toLowerCase().endsWith(".pdf")) {
    return extractPdfText(buffer);
  }

  if (shouldUseFileText(file)) {
    return finalizeExtractedText(buffer.toString("utf-8"));
  }

  if (!isSupportedResumeUpload(file, mimeType)) {
    throw new Error("Unsupported file type. Please upload a PDF, DOCX, or plain-text resume.");
  }

  return finalizeExtractedText(buffer.toString("utf-8"));
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
      { name: "Projects", items: sections.projects },
      { name: "Awards", items: sections.awards },
      { name: "Publications", items: sections.publications },
      { name: "Volunteer Experience", items: sections.volunteerExperience },
      { name: "Languages", items: sections.languages },
      { name: "Links", items: sections.links }
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
