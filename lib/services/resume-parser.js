import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const mammoth = require("mammoth");

const bulletPrefixPattern = /^\s*(?:â€¢|[•●◦▪*\-])\s*/;

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
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const pdfjsPackagePath = require.resolve("pdfjs-dist/package.json");
  const standardFontDataUrl = `${pathToFileURL(path.join(path.dirname(pdfjsPackagePath), "standard_fonts")).href}/`;
  const document = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    disableFontFace: true,
    isEvalSupported: false,
    standardFontDataUrl
  }).promise;

  let extractedText = "";

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const lineBuckets = new Map();

    for (const item of content.items) {
      if (!("str" in item) || !item.str?.trim()) {
        continue;
      }

      const yPosition = Math.round(item.transform?.[5] ?? 0);
      const bucketKey = String(yPosition);
      const currentBucket = lineBuckets.get(bucketKey) ?? [];

      currentBucket.push({
        text: item.str,
        x: item.transform?.[4] ?? 0
      });

      lineBuckets.set(bucketKey, currentBucket);
    }

    const normalizedPageLines = [...lineBuckets.entries()]
      .sort((left, right) => Number(right[0]) - Number(left[0]))
      .map(([, items]) =>
        items
          .sort((left, right) => left.x - right.x)
          .map((item) => item.text)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim()
      )
      .filter(Boolean);

    extractedText += `${normalizedPageLines.join("\n")}\n`;
  }

  return extractedText.trim();
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
    return extractPdfText(buffer);
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
