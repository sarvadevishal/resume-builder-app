import { docCompatibilityNote, resolveExportOptions } from "@/lib/services/export/config";
import { normalizeResumeForExport } from "@/lib/services/export/normalize";
import { getExportTemplate } from "@/lib/services/export/templates";

/**
 * Build a normalized export document plus warnings and resolved settings.
 * This is pure and can be reused by the client preview UI and server renderers.
 */
export function prepareResumeExport({ structuredResume, exportOptions, sessionContext = {} }) {
  const resolvedOptions = resolveExportOptions(exportOptions);
  const normalizedResume = normalizeResumeForExport({
    structuredResume,
    exportOptions: resolvedOptions,
    sessionContext
  });
  const template = getExportTemplate(resolvedOptions.templateId);

  return {
    exportDocument: normalizedResume,
    warnings: normalizedResume.warnings,
    options: resolvedOptions,
    template,
    compatibility: resolvedOptions.format === "doc" ? docCompatibilityNote : ""
  };
}

export function buildExportPreview({ structuredResume, exportOptions, sessionContext = {} }) {
  const prepared = prepareResumeExport({
    structuredResume,
    exportOptions,
    sessionContext
  });

  return {
    ...prepared,
    summary: {
      template: prepared.template.label,
      mode: prepared.options.resolvedEntities.mode.label,
      format: prepared.options.resolvedEntities.format.label,
      paperSize: prepared.options.resolvedEntities.paperSize.label,
      marginPreset: prepared.options.resolvedEntities.marginPreset.label,
      fontFamily: prepared.options.resolvedEntities.fontFamily.label,
      sectionCount: prepared.exportDocument.sections.length,
      estimatedPageCount: prepared.exportDocument.metadata.estimatedPageCount
    }
  };
}
