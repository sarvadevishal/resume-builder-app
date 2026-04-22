function findDateWarnings(text = "") {
  const normalizedDates = text.match(/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{4}\b/gi) ?? [];
  const yearOnlyDates = text.match(/\b(19|20)\d{2}\b/g) ?? [];
  const rangeSeparators = text.match(/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{4}\s*(?:-|to|through)\s*(?:present|current|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{4})\b/gi) ?? [];
  const warnings = [];

  if (normalizedDates.length && yearOnlyDates.length) {
    warnings.push({
      title: "Mixed date formats detected",
      detail: "Use one date pattern across the document so ATS parsers do not split employment ranges inconsistently."
    });
  }

  if (rangeSeparators.some((range) => /\bto\b|\bthrough\b/i.test(range))) {
    warnings.push({
      title: "Date ranges are not normalized",
      detail: "Prefer a single date range style such as `Jan 2022 - Mar 2025` across every role."
    });
  }

  return warnings;
}

function findLayoutWarnings(text = "") {
  const warnings = [];
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  if (/\t/.test(text) || / {5,}\S+/.test(text)) {
    warnings.push({
      title: "Possible multi-column or table layout",
      detail: "Tabs or wide spacing can signal columns that some ATS parsers flatten incorrectly."
    });
  }

  if (/[|]{2,}/.test(text) || /(?:\+[-=+]+\+)|(?:[-=]{4,}\s+[-=]{4,})/.test(text)) {
    warnings.push({
      title: "Possible table borders or decorative separators",
      detail: "Heavy separators can be misread as layout structure rather than content."
    });
  }

  if (lines.some((line) => /^page \d+$/i.test(line) || /^confidential$/i.test(line))) {
    warnings.push({
      title: "Header or footer content detected",
      detail: "Critical resume information should not live in headers or footers because some parsers ignore them."
    });
  }

  if (lines.some((line) => /^[-•*]$/.test(line))) {
    warnings.push({
      title: "Orphan bullet markers detected",
      detail: "Standalone bullet characters can create malformed list items in parser output."
    });
  }

  return warnings;
}

function findSectionWarnings(structuredResume) {
  const warnings = [];
  const sectionNames = structuredResume.sections?.map((section) => section.name.toLowerCase()) ?? [];
  const standardSections = ["contact", "summary", "skills", "experience", "education", "certifications", "projects"];

  if (!sectionNames.includes("experience")) {
    warnings.push({
      title: "Standard experience section not found",
      detail: "Use a common section label such as Experience or Work Experience for better parser recognition."
    });
  }

  const customSections = sectionNames.filter((name) => !standardSections.includes(name));
  if (customSections.length) {
    warnings.push({
      title: "Non-standard section titles detected",
      detail: "Unusual section headers may reduce parser accuracy. Prefer standard labels when possible."
    });
  }

  return warnings;
}

export function analyzeAtsSafety({ resumeText = "", structuredResume }) {
  const warnings = [
    ...findLayoutWarnings(resumeText),
    ...findDateWarnings(resumeText),
    ...findSectionWarnings(structuredResume)
  ];

  const dedupedWarnings = warnings.filter(
    (warning, index) => warnings.findIndex((candidate) => candidate.title === warning.title) === index
  );

  const riskScore = Math.max(40, 100 - dedupedWarnings.length * 10);

  return {
    warnings: dedupedWarnings,
    riskScore
  };
}
