import { sanitizeExportText } from "@/lib/services/export/normalize";
import { buildExportPreview, prepareResumeExport } from "@/lib/services/export/pipeline";
import { renderDocResume } from "@/lib/services/export/renderers/doc-renderer";
import { renderDocxResume } from "@/lib/services/export/renderers/docx-renderer";
import { renderPdfResume } from "@/lib/services/export/renderers/pdf-renderer";

/**
 * Backward-compatible text sanitizer used by tests and export helpers.
 */
export function sanitizeText(text = "") {
  return sanitizeExportText(text);
}

export function buildExportSections(structuredResume) {
  return (structuredResume.sections || [])
    .map((section) => {
      const normalizedItems = (section.items || []).map((item) => sanitizeText(item)).filter(Boolean);
      let variant = "bullet";

      if (section.name.toLowerCase() === "contact") {
        variant = "contact";
      } else if (["summary", "skills", "technical skills", "core competencies", "education", "certifications"].includes(section.name.toLowerCase())) {
        variant = "paragraph";
      }

      return {
        name: section.name,
        variant,
        items: normalizedItems
      };
    })
    .filter((section) => section.items.length);
}

export function wrapTextToWidth(text, { font, size, maxWidth }) {
  const normalizedText = sanitizeText(text);

  if (!normalizedText) {
    return [];
  }

  const words = normalizedText.split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (font.widthOfTextAtSize(nextLine, size) <= maxWidth) {
      currentLine = nextLine;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Build client-safe export preview metadata and warnings.
 */
export function buildResumeExportPreview(structuredResume, exportOptions = {}, sessionContext = {}) {
  return buildExportPreview({
    structuredResume,
    exportOptions,
    sessionContext
  });
}

/**
 * Prepare a normalized export payload for downstream renderers.
 */
export function prepareResumeExportPayload(structuredResume, exportOptions = {}, sessionContext = {}) {
  return prepareResumeExport({
    structuredResume,
    exportOptions,
    sessionContext
  });
}

export async function createPdfResume(structuredResume, exportOptions = {}, sessionContext = {}) {
  const prepared = prepareResumeExportPayload(structuredResume, exportOptions, sessionContext);
  return renderPdfResume(prepared);
}

export async function createDocxResume(structuredResume, exportOptions = {}, sessionContext = {}) {
  const prepared = prepareResumeExportPayload(structuredResume, exportOptions, sessionContext);
  return renderDocxResume(prepared);
}

export async function createDocResume(structuredResume, exportOptions = {}, sessionContext = {}) {
  const prepared = prepareResumeExportPayload(structuredResume, exportOptions, sessionContext);
  return renderDocResume(prepared);
}
