import { createRequire } from "node:module";
import { getOpenAiClient } from "../openai/client.js";

const require = createRequire(import.meta.url);
const mammoth = require("mammoth");
const PDFParser = require("pdf2json");

const bulletPrefixPattern = /^\s*(?:ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢|[\u2022\u25cf\u25e6\u25aa*\-])\s*/;
const experienceDatePattern =
  /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\s*[-–]\s*(?:Present|Current|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+\d{4})|\b\d{4}\s*[-–]\s*(?:Present|Current|\d{4})/i;
const technologyKeywordPattern =
  /\b(sql|python|r|spark|airflow|dbt|snowflake|redshift|bigquery|tableau|powerbi|tensorflow|pytorch|docker|kubernetes|aws|azure|gcp|databricks|numpy|pandas|scikit|keras|fastapi|svelte|langchain|nlp|ml|ai|etl|elt)\b/i;

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

const sectionNameMap = {
  contactInfo: "Contact",
  summary: "Summary",
  skills: "Skills",
  workExperience: "Experience",
  education: "Education",
  certifications: "Certifications",
  projects: "Projects",
  awards: "Awards",
  publications: "Publications",
  volunteerExperience: "Volunteer Experience",
  languages: "Languages",
  links: "Links"
};

const sectionKeyMap = {
  contact: "contactInfo",
  summary: "summary",
  skills: "skills",
  experience: "workExperience",
  education: "education",
  certifications: "certifications",
  projects: "projects",
  awards: "awards",
  publications: "publications",
  volunteer: "volunteerExperience",
  languages: "languages",
  links: "links"
};

const pdfStructuredResumeSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    contactInfo: { type: "array", items: { type: "string" } },
    summary: { type: "array", items: { type: "string" } },
    skills: { type: "array", items: { type: "string" } },
    workExperience: { type: "array", items: { type: "string" } },
    education: { type: "array", items: { type: "string" } },
    certifications: { type: "array", items: { type: "string" } },
    projects: { type: "array", items: { type: "string" } },
    awards: { type: "array", items: { type: "string" } },
    publications: { type: "array", items: { type: "string" } },
    volunteerExperience: { type: "array", items: { type: "string" } },
    languages: { type: "array", items: { type: "string" } },
    links: { type: "array", items: { type: "string" } }
  },
  required: [
    "contactInfo",
    "summary",
    "skills",
    "workExperience",
    "education",
    "certifications",
    "projects",
    "awards",
    "publications",
    "volunteerExperience",
    "languages",
    "links"
  ]
};

function createEmptySections() {
  return {
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
}

function safeDecodePdfText(value = "") {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeLines(text = "") {
  return text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) =>
      line
        .replace(/\u0000/g, "")
        .replace(/ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢/g, "\u2022")
        .replace(/[ \t]+/g, " ")
        .trim()
    )
    .filter(Boolean);
}

function cleanItemText(line = "") {
  return line
    .replace(bulletPrefixPattern, "")
    .replace(/\s+[-–]\s+/g, " - ")
    .replace(/(\d)\s*[-–]\s*(\d)/g, "$1 - $2")
    .replace(/\s+/g, " ")
    .trim();
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
  const sections = createEmptySections();
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

function normalizePdfBlockText(text = "") {
  return cleanItemText(
    text
      .replace(/\+/g, " ")
      .replace(/\s{2,}/g, " ")
      .replace(/\s*([,.;:!?])/g, "$1")
      .replace(/\(\s+/g, "(")
      .replace(/\s+\)/g, ")")
      .trim()
  );
}

function flattenPdfBlocks(pdfData) {
  return (pdfData?.Pages || [])
    .flatMap((page, pageIndex) =>
      (page?.Texts || []).map((block) => ({
        page: pageIndex + 1,
        x: block.x ?? 0,
        y: block.y ?? 0,
        size: Number(block.R?.[0]?.TS?.[1] || 0),
        bold: Boolean(block.R?.[0]?.TS?.[2]),
        text: normalizePdfBlockText((block.R || []).map((run) => safeDecodePdfText(run.T)).join(" "))
      }))
    )
    .filter((block) => block.text)
    .sort((left, right) => left.page - right.page || left.y - right.y || left.x - right.x);
}

function mergePdfBlocksIntoLines(blocks) {
  const lines = [];

  for (const block of blocks) {
    const previous = lines[lines.length - 1];
    const isSameLine =
      previous &&
      previous.page === block.page &&
      Math.abs(previous.y - block.y) <= 0.35 &&
      Math.abs(previous.x - block.x) <= 4;

    if (!isSameLine) {
      lines.push({
        page: block.page,
        x: block.x,
        y: block.y,
        size: block.size,
        bold: block.bold,
        text: block.text
      });
      continue;
    }

    previous.text = normalizePdfBlockText(`${previous.text} ${block.text}`);
    previous.size = Math.max(previous.size, block.size);
    previous.bold = previous.bold || block.bold;
  }

  return lines;
}

function isLikelyHeading(line = "", size = 0) {
  if (Object.values(sectionMatchers).some((matcher) => matcher.test(line))) {
    return true;
  }

  return size >= 13.5 && /^[A-Z][A-Z\s/&-]{2,}$/.test(line);
}

function mapHeadingToSection(line = "") {
  if (sectionMatchers.summary.test(line)) return "summary";
  if (sectionMatchers.skills.test(line)) return "skills";
  if (sectionMatchers.experience.test(line)) return "experience";
  if (sectionMatchers.education.test(line)) return "education";
  if (sectionMatchers.certifications.test(line)) return "certifications";
  if (sectionMatchers.projects.test(line)) return "projects";
  if (sectionMatchers.awards.test(line)) return "awards";
  if (sectionMatchers.publications.test(line)) return "publications";
  if (sectionMatchers.volunteer.test(line)) return "volunteer";
  if (sectionMatchers.languages.test(line)) return "languages";
  if (sectionMatchers.links.test(line)) return "links";
  return "";
}

function looksLikeNameLine(line = "") {
  return /^[A-Z][A-Za-z'.-]+(?:\s+[A-Z][A-Za-z'.-]+){1,3}$/.test(line.trim());
}

function looksLikeContact(line = "") {
  return /@|linkedin|github|portfolio|hugging face|www\.|https?:\/\/|\+\d|\(\d{3}\)|\b[A-Z][a-z]+,\s*[A-Z]{2}\b|remote/i.test(line);
}

function looksLikeEducation(line = "") {
  return /\b(university|college|bachelor|master|m\.s\.|ms\b|b\.s\.|bs\b|phd|gpa|school)\b/i.test(line);
}

function looksLikeSkills(line = "") {
  const tokenMatches = line.match(/[|,/]/g)?.length || 0;
  return (
    /skills?:|languages?\s*&\s*tools|frameworks?\s*&\s*libraries|gen ai|llms?|ml\s*&\s*statistical/i.test(line) ||
    (tokenMatches >= 3 && technologyKeywordPattern.test(line) && line.split(" ").length <= 18 && !/[.!?]$/.test(line))
  );
}

function looksLikeAward(line = "") {
  return /\b(award|honor|achievement|winner|won|quarter|recognition)\b/i.test(line);
}

function looksLikePublication(line = "") {
  return /\b(publication|paper|research|journal|object detection|doi|conference)\b/i.test(line);
}

function looksLikeCertification(line = "") {
  return /\b(certified|certification|certificate|license)\b/i.test(line);
}

function looksLikeProject(line = "") {
  return /\b(project|built|developed|shipped|launched)\b/i.test(line) && /\b(github|demo|prototype|case study)\b/i.test(line);
}

function looksLikeLanguage(line = "") {
  return /^languages?\s*:/i.test(line) || /\b(english|hindi|spanish|french|german|mandarin)\b/i.test(line);
}

function looksLikeLinkLine(line = "") {
  return /https?:\/\/|www\.|linkedin|github|portfolio|hugging face/i.test(line);
}

function looksLikeExperienceHeader(line = "") {
  return experienceDatePattern.test(line) || /\b(?:present|current)\b/i.test(line) && /\b(engineer|scientist|analyst|architect|manager|consultant|lead)\b/i.test(line);
}

function looksLikeExperienceDetail(line = "") {
  if (!line) {
    return false;
  }

  return (
    bulletPrefixPattern.test(line) ||
    /^(built|building|developed|developing|engineered|engineering|created|creating|designed|designing|led|leading|owned|owning|analyzed|analyzing|forecasted|forecasting|partnered|partnering|performed|performing|applied|applying|defined|defining|containerized|containerizing|leveraged|leveraging|implemented|implementing)\b/i.test(line)
  );
}

function looksLikeSummary(line = "") {
  return /\b(years? of experience|data scientist|data engineer|analytics engineer|machine learning engineer|delivered|expertise|currently)\b/i.test(line);
}

function splitLabeledSegments(line = "") {
  return line
    .replace(
      /\b(Publication:|Publications:|Achievements?:|Awards?:|Star of the Quarter:|Languages?\s*&\s*Tools:|Frameworks?\s*&\s*Libraries:|ML\s*&\s*Statistical Skills:|Gen AI\s*&\s*LLMs?:|Languages?:|Links?:)\b/gi,
      "|||$1"
    )
    .split("|||")
    .map((part) => normalizePdfBlockText(part))
    .filter(Boolean);
}

function addUniqueItem(sectionItems, item) {
  const cleaned = cleanItemText(item);

  if (!cleaned) {
    return;
  }

  if (!sectionItems.some((candidate) => candidate.toLowerCase() === cleaned.toLowerCase())) {
    sectionItems.push(cleaned);
  }
}

function buildStructuredResumeObject(sections) {
  return {
    ...sections,
    sections: Object.entries(sectionNameMap)
      .map(([key, name]) => ({
        name,
        items: sections[key]
      }))
      .filter((section) => section.items.length)
  };
}

function inferTopName(lines) {
  const candidate = lines.slice(0, 8).find((line) => looksLikeNameLine(line.text));
  return candidate?.text || "";
}

function deriveContactLines(lines, name) {
  const topLines = lines.slice(0, 12).map((line) => line.text);
  const contacts = [];

  if (name) {
    contacts.push(name);
  }

  for (const line of topLines) {
    if (!looksLikeContact(line) || line === name) {
      continue;
    }

    const compact = line
      .replace(new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"), "")
      .replace(/\s{2,}/g, " ")
      .trim();

    if (compact) {
      addUniqueItem(contacts, compact);
    }
  }

  return contacts;
}

async function maybeRepairPdfStructureWithAi({ extractedText, structuredResume }) {
  const client = getOpenAiClient();

  if (!client) {
    return structuredResume;
  }

  try {
    const response = await client.responses.create(
      {
        model: process.env.OPENAI_MODEL || "gpt-5",
        instructions:
          "You are restructuring an extracted resume into standard ATS-safe sections. Use only the provided text. Do not invent, summarize, improve, or rewrite facts. Keep each line in the best-fit section. Preserve strong original wording. Contact info belongs in contactInfo. Narrative belongs in summary. Role headers and bullets belong in workExperience. Labeled skill groups must stay in skills.",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Extracted resume text:\n${extractedText}\n\nCurrent heuristic structure:\n${JSON.stringify(structuredResume, null, 2)}`
              }
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "structured_resume",
            strict: true,
            schema: pdfStructuredResumeSchema
          }
        }
      },
      {
        timeout: Number(process.env.OPENAI_RESUME_PARSE_TIMEOUT_MS) || 4500
      }
    );

    return normalizeStructuredResumePayload(JSON.parse(response.output_text));
  } catch (error) {
    console.error("Resume parser AI repair fallback skipped:", error);
    return structuredResume;
  }
}

function normalizeStructuredResumePayload(payload = {}) {
  const sections = createEmptySections();

  for (const key of Object.keys(sections)) {
    sections[key] = (payload[key] || []).map((item) => cleanItemText(item)).filter(Boolean);
  }

  return buildStructuredResumeObject(sections);
}

function assignPdfLineToSection(line, context) {
  const sentenceLike = line.split(" ").length >= 9 && !looksLikeContact(line) && !looksLikeSkills(line) && !looksLikeEducation(line);

  if (context.pendingHeading === "summary" && sentenceLike && !looksLikeExperienceHeader(line) && !looksLikeAward(line) && !looksLikePublication(line)) {
    return "summary";
  }

  const scores = new Map();
  const increment = (section, amount) => scores.set(section, (scores.get(section) || 0) + amount);

  if (looksLikeContact(line) || (context.index <= 4 && looksLikeNameLine(line))) increment("contact", 4);
  if (looksLikeLinkLine(line)) increment("links", 3);
  if (looksLikeEducation(line)) increment("education", 5);
  if (looksLikeSkills(line)) increment("skills", 5);
  if (looksLikeAward(line)) increment("awards", 4);
  if (looksLikePublication(line)) increment("publications", 4);
  if (looksLikeCertification(line)) increment("certifications", 4);
  if (looksLikeLanguage(line)) increment("languages", 3);
  if (looksLikeProject(line)) increment("projects", 2);
  if (looksLikeExperienceHeader(line)) increment("experience", 6);
  if (looksLikeExperienceDetail(line) && ["experience", "summary", "projects"].includes(context.currentSection)) increment("experience", 3);
  if (looksLikeSummary(line) || (context.index <= 18 && sentenceLike)) increment("summary", 3);

  if (context.pendingHeading) {
    increment(context.pendingHeading, 2);
  }

  if (context.currentSection) {
    increment(context.currentSection, 1);
  }

  const ranked = [...scores.entries()].sort((left, right) => right[1] - left[1]);
  const [section = context.pendingHeading || context.currentSection || "summary"] = ranked[0] || [];
  return section;
}

export function buildStructuredResumeFromPdfLines(lines = []) {
  const sections = createEmptySections();
  const inferredName = inferTopName(lines);
  const derivedContactLines = deriveContactLines(lines, inferredName);

  for (const contactLine of derivedContactLines) {
    addUniqueItem(sections.contactInfo, contactLine);
  }

  let currentSection = sections.contactInfo.length ? "contact" : "summary";
  let pendingHeading = "";

  for (const [index, line] of lines.entries()) {
    if (!line.text || derivedContactLines.includes(line.text)) {
      continue;
    }

    if (isLikelyHeading(line.text, line.size)) {
      pendingHeading = mapHeadingToSection(line.text);
      continue;
    }

    const segments = splitLabeledSegments(line.text);

    for (const segment of segments) {
      const section = assignPdfLineToSection(segment, {
        currentSection,
        pendingHeading,
        index
      });
      const targetKey = sectionKeyMap[section] || "summary";

      addUniqueItem(sections[targetKey], segment);
      currentSection = section;
    }
  }

  if (!sections.contactInfo.length && inferredName) {
    addUniqueItem(sections.contactInfo, inferredName);
  }

  return buildStructuredResumeObject(sections);
}

async function extractPdfDocument(buffer) {
  const parser = new PDFParser(null, true);
  const pdfData = await new Promise((resolve, reject) => {
    parser.on("pdfParser_dataError", (error) => {
      reject(error?.parserError || error);
    });

    parser.on("pdfParser_dataReady", () => {
      resolve(parser.getMergedTextBlocksIfNeeded?.() || parser.getRawTextContent());
    });

    parser.parseBuffer(buffer);
  });

  if (typeof pdfData === "string") {
    const extractedText = finalizeExtractedText(pdfData);
    return {
      extractedText,
      structuredResume: buildStructuredResume(extractedText)
    };
  }

  const lines = mergePdfBlocksIntoLines(flattenPdfBlocks(pdfData));
  const structuredResume = await maybeRepairPdfStructureWithAi({
    extractedText: finalizeExtractedText(lines.map((line) => line.text).join("\n")),
    structuredResume: buildStructuredResumeFromPdfLines(lines)
  });
  const extractedText = finalizeExtractedText(
    structuredResume.sections.flatMap((section) => [section.name.toUpperCase(), ...section.items]).join("\n")
  );

  return {
    extractedText,
    structuredResume
  };
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
    const parsed = await extractPdfDocument(buffer);
    return parsed.extractedText;
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
  return buildStructuredResumeObject(splitIntoSections(text));
}

export async function parseResumeInput({ file, text }) {
  if (text) {
    const extractedText = finalizeExtractedText(text);
    return {
      extractedText,
      structuredResume: buildStructuredResume(extractedText)
    };
  }

  if (file?.type?.includes("pdf") || file?.name?.toLowerCase().endsWith(".pdf")) {
    const buffer = Buffer.from(await file.arrayBuffer());
    return extractPdfDocument(buffer);
  }

  const extractedText = await extractResumeText(file);

  return {
    extractedText,
    structuredResume: buildStructuredResume(extractedText)
  };
}
