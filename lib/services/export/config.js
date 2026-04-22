export const exportFormats = [
  {
    id: "pdf",
    label: "PDF",
    description: "Best for sharing and printing.",
    supportsPageNumbers: true
  },
  {
    id: "docx",
    label: "DOCX",
    description: "Editable in Microsoft Word and Google Docs.",
    supportsPageNumbers: false
  },
  {
    id: "doc",
    label: "DOC",
    description: "Compatibility fallback for older Word workflows.",
    supportsPageNumbers: false,
    fallback: true
  }
];

export const exportModes = [
  {
    id: "ats",
    label: "ATS mode",
    description: "Safest parsing and simplest structure.",
    recommended: true
  },
  {
    id: "professional",
    label: "Professional mode",
    description: "Polished and recruiter-friendly while staying ATS-safe."
  },
  {
    id: "compact",
    label: "Compact mode",
    description: "Space-optimized for experienced candidates."
  },
  {
    id: "executive",
    label: "Executive mode",
    description: "Stronger emphasis on leadership summary and impact."
  }
];

export const exportTemplates = [
  {
    id: "ats-classic",
    label: "ATS Classic",
    description: "Minimal, highly parseable, and conservative.",
    recommendedModes: ["ats", "professional", "compact", "executive"],
    atsSafe: true,
    allowedFormats: ["pdf", "docx", "doc"]
  },
  {
    id: "professional-modern",
    label: "Professional Modern",
    description: "Subtle hierarchy and polished spacing without gimmicks.",
    recommendedModes: ["professional", "compact", "executive"],
    atsSafe: true,
    allowedFormats: ["pdf", "docx"]
  }
];

export const paperSizes = [
  {
    id: "letter",
    label: "Letter",
    pdf: { width: 612, height: 792 },
    docx: { width: 12240, height: 15840 }
  },
  {
    id: "a4",
    label: "A4",
    pdf: { width: 595.28, height: 841.89 },
    docx: { width: 11906, height: 16838 }
  }
];

export const marginPresets = [
  {
    id: "narrow",
    label: "Narrow",
    pdf: 42,
    docx: 720
  },
  {
    id: "standard",
    label: "Standard",
    pdf: 54,
    docx: 1080
  },
  {
    id: "wide",
    label: "Wide",
    pdf: 64,
    docx: 1440
  }
];

export const fontChoices = [
  {
    id: "sans",
    label: "Aptos Sans",
    docxBody: "Aptos",
    docxHeading: "Aptos Display",
    pdf: "Helvetica"
  },
  {
    id: "serif",
    label: "Cambria Serif",
    docxBody: "Cambria",
    docxHeading: "Cambria",
    pdf: "Times Roman"
  }
];

export const docCompatibilityNote =
  "DOC export uses an RTF-based compatibility fallback so older Microsoft Word workflows can still open and edit the resume.";

export const defaultExportOptions = {
  format: "pdf",
  templateId: "ats-classic",
  mode: "ats",
  paperSize: "letter",
  marginPreset: "standard",
  fontFamily: "sans",
  includePageNumbers: false,
  prioritizeMatchedSkills: true,
  highlightMatchedCompetencies: false
};

function getById(collection, id, fallbackId) {
  return collection.find((item) => item.id === id) || collection.find((item) => item.id === fallbackId) || collection[0];
}

export function getFormatById(id) {
  return getById(exportFormats, id, defaultExportOptions.format);
}

export function getTemplateById(id) {
  return getById(exportTemplates, id, defaultExportOptions.templateId);
}

export function getPaperSizeById(id) {
  return getById(paperSizes, id, defaultExportOptions.paperSize);
}

export function getMarginPresetById(id) {
  return getById(marginPresets, id, defaultExportOptions.marginPreset);
}

export function getFontChoiceById(id) {
  return getById(fontChoices, id, defaultExportOptions.fontFamily);
}

export function getModeById(id) {
  return getById(exportModes, id, defaultExportOptions.mode);
}

export function isTemplateCompatible(templateId, formatId) {
  const template = getTemplateById(templateId);
  return template.allowedFormats.includes(formatId);
}

export function resolveExportOptions(input = {}) {
  const merged = {
    ...defaultExportOptions,
    ...input
  };

  let format = getFormatById(merged.format);
  let template = getTemplateById(merged.templateId);
  const mode = getModeById(merged.mode);
  const paperSize = getPaperSizeById(merged.paperSize);
  const marginPreset = getMarginPresetById(merged.marginPreset);
  const fontFamily = getFontChoiceById(merged.fontFamily);

  if (!template.allowedFormats.includes(format.id)) {
    template = getTemplateById("ats-classic");
  }

  if (mode.id === "ats") {
    template = getTemplateById("ats-classic");
  }

  if (format.id === "doc") {
    template = getTemplateById("ats-classic");
  }

  const includePageNumbers = Boolean(merged.includePageNumbers && format.supportsPageNumbers);
  const highlightMatchedCompetencies = Boolean(merged.highlightMatchedCompetencies && mode.id === "professional" && template.id === "professional-modern");

  return {
    format: format.id,
    templateId: template.id,
    mode: mode.id,
    paperSize: paperSize.id,
    marginPreset: marginPreset.id,
    fontFamily: fontFamily.id,
    includePageNumbers,
    prioritizeMatchedSkills: Boolean(merged.prioritizeMatchedSkills),
    highlightMatchedCompetencies,
    resolvedEntities: {
      format,
      template,
      mode,
      paperSize,
      marginPreset,
      fontFamily
    }
  };
}
