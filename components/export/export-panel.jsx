"use client";

import { useMemo, useState } from "react";
import { buildExportPreview } from "@/lib/services/export/pipeline";
import {
  defaultExportOptions,
  exportFormats,
  exportModes,
  exportTemplates,
  fontChoices,
  marginPresets,
  paperSizes,
  resolveExportOptions
} from "@/lib/services/export/config";

function SelectField({ label, value, onChange, options, disabled = false }) {
  const fieldId = `export-field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <label className="block" htmlFor={fieldId}>
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">{label}</span>
      <select id={fieldId} className="input-field mt-2" value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleField({ label, description, checked, onChange, disabled = false, recommended = false }) {
  return (
    <label className={`flex items-start gap-3 rounded-[1.2rem] border p-4 ${disabled ? "opacity-60" : ""}`}>
      <input className="mt-1 h-4 w-4" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} disabled={disabled} />
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-[var(--ink)]">{label}</p>
          {recommended ? (
            <span className="rounded-full bg-[rgba(15,118,110,0.1)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--success)]">
              ATS-safe recommended
            </span>
          ) : null}
        </div>
        <p className="muted mt-1 text-xs leading-6">{description}</p>
      </div>
    </label>
  );
}

export function ExportPanel({ structuredResume, sessionContext, onExport, isExporting }) {
  const [draftOptions, setDraftOptions] = useState(defaultExportOptions);

  const preview = useMemo(
    () =>
      buildExportPreview({
        structuredResume,
        exportOptions: draftOptions,
        sessionContext
      }),
    [structuredResume, draftOptions, sessionContext]
  );

  const resolvedOptions = preview.options;
  const availableTemplates = exportTemplates.filter((template) => template.allowedFormats.includes(resolveExportOptions({ ...draftOptions }).format));
  const disableProfessionalHighlight = resolvedOptions.templateId !== "professional-modern" || resolvedOptions.mode !== "professional";

  function updateOption(key, value) {
    setDraftOptions((current) => ({
      ...current,
      [key]: value
    }));
  }

  return (
    <div className="rounded-[1.85rem] border border-[var(--line)] bg-white/95 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Resume export</p>
          <h3 className="mt-2 text-lg font-semibold">ATS-safe export settings</h3>
          <p className="muted mt-2 max-w-2xl text-sm leading-7">
            Choose the format, template, and layout profile before generating the final resume package.
          </p>
        </div>
        <div className="rounded-[1.1rem] border border-[rgba(15,118,110,0.14)] bg-[rgba(15,118,110,0.06)] px-4 py-3 text-sm font-semibold text-[var(--success)]">
          {resolvedOptions.mode === "ats" ? "ATS mode selected" : "Recruiter-ready formatting"}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <SelectField label="Format" value={draftOptions.format} onChange={(value) => updateOption("format", value)} options={exportFormats} />
        <SelectField label="Template" value={resolvedOptions.templateId} onChange={(value) => updateOption("templateId", value)} options={availableTemplates} />
        <SelectField label="Resume mode" value={draftOptions.mode} onChange={(value) => updateOption("mode", value)} options={exportModes} />
        <SelectField label="Paper size" value={draftOptions.paperSize} onChange={(value) => updateOption("paperSize", value)} options={paperSizes} />
        <SelectField label="Margins" value={draftOptions.marginPreset} onChange={(value) => updateOption("marginPreset", value)} options={marginPresets} />
        <SelectField label="Font family" value={draftOptions.fontFamily} onChange={(value) => updateOption("fontFamily", value)} options={fontChoices} />
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <ToggleField
          label="Include page numbers"
          description="Useful for executive packets and longer resumes. Available only for PDF."
          checked={resolvedOptions.includePageNumbers}
          onChange={(value) => updateOption("includePageNumbers", value)}
          disabled={!exportFormats.find((format) => format.id === resolvedOptions.format)?.supportsPageNumbers}
        />
        <ToggleField
          label="Prioritize matched skills"
          description="Bring JD-relevant skills higher without inventing new content or stuffing keywords."
          checked={draftOptions.prioritizeMatchedSkills}
          onChange={(value) => updateOption("prioritizeMatchedSkills", value)}
          recommended
        />
        <ToggleField
          label="Subtle matched emphasis"
          description="Available only in Professional Modern plus Professional mode. Keeps layout tasteful and ATS-safe."
          checked={resolvedOptions.highlightMatchedCompetencies}
          onChange={(value) => updateOption("highlightMatchedCompetencies", value)}
          disabled={disableProfessionalHighlight}
        />
      </div>

      <div className="mt-5 grid gap-4 2xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.3rem] bg-[var(--surface-muted)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Export summary</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1rem] bg-white/90 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">Template</p>
              <p className="mt-2 text-sm font-semibold text-[var(--ink)]">{preview.summary.template}</p>
            </div>
            <div className="rounded-[1rem] bg-white/90 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">Estimated length</p>
              <p className="mt-2 text-sm font-semibold text-[var(--ink)]">{preview.summary.estimatedPageCount} page(s)</p>
            </div>
            <div className="rounded-[1rem] bg-white/90 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">Format</p>
              <p className="mt-2 text-sm font-semibold text-[var(--ink)]">{preview.summary.format}</p>
            </div>
            <div className="rounded-[1rem] bg-white/90 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-soft)]">Sections included</p>
              <p className="mt-2 text-sm font-semibold text-[var(--ink)]">{preview.summary.sectionCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.3rem] border border-[var(--line)] bg-white/95 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Warnings and notes</p>
          <div className="mt-3 space-y-3">
            {preview.warnings.length ? (
              preview.warnings.map((warning) => (
                <div key={warning.id} className="rounded-[1rem] bg-[var(--surface-muted)] px-4 py-3 text-sm leading-6 text-[var(--ink)]">
                  {warning.message}
                </div>
              ))
            ) : (
              <div className="rounded-[1rem] bg-[rgba(15,118,110,0.08)] px-4 py-3 text-sm font-semibold text-[var(--success)]">
                No export-time warnings. This configuration is clean and ATS-friendly.
              </div>
            )}
            {preview.compatibility ? (
              <div className="rounded-[1rem] bg-[rgba(39,76,127,0.08)] px-4 py-3 text-sm leading-6 text-[var(--ink)]">{preview.compatibility}</div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" className="button-primary" onClick={() => onExport(resolvedOptions)} disabled={isExporting}>
          {isExporting ? "Preparing export..." : `Export ${resolvedOptions.format.toUpperCase()}`}
        </button>
        <p className="muted text-sm leading-6">
          {resolvedOptions.templateId === "ats-classic"
            ? "Single-column, standard headings, and parser-safe structure."
            : "Subtle modern hierarchy with safe typography and recruiter-friendly spacing."}
        </p>
      </div>
    </div>
  );
}
