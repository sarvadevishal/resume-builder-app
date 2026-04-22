function findDateWarnings(text = "") {
  const normalizedDates = text.match(/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}\b/gi) ?? [];
  const yearOnlyDates = text.match(/\b(19|20)\d{2}\b/g) ?? [];
  const warnings = [];

  if (normalizedDates.length && yearOnlyDates.length) {
    warnings.push({
      title: "Mixed date formats detected",
      detail: "Use one date pattern across the document so ATS parsers do not split employment ranges inconsistently."
    });
  }

  return warnings;
}

export function analyzeAtsSafety({ resumeText = "", structuredResume }) {
  const warnings = [];

  if (/\t/.test(resumeText)) {
    warnings.push({
      title: "Possible table or multi-column layout",
      detail: "Tab characters can indicate column-like formatting that some ATS parsers mishandle."
    });
  }

  if (/[|]{2,}/.test(resumeText)) {
    warnings.push({
      title: "Potential broken section layout",
      detail: "Repeated separators can look like visual columns or ornamental dividers to parsers."
    });
  }

  warnings.push(...findDateWarnings(resumeText));

  const sectionNames = structuredResume.sections?.map((section) => section.name.toLowerCase()) ?? [];
  if (!sectionNames.includes("experience")) {
    warnings.push({
      title: "Standard experience section not found",
      detail: "Use a common section label such as Experience or Work Experience for better parser recognition."
    });
  }

  const riskScore = Math.max(40, 100 - warnings.length * 12);

  return {
    warnings,
    riskScore
  };
}
