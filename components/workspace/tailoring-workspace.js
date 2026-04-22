"use client";

import { useMemo, useState } from "react";
import { useProofFitApp } from "@/components/providers/prooffit-provider";
import { buildFinalStructuredResume, getEffectiveSuggestionBullet } from "@/lib/prooffit-state";
import { MetricBar } from "@/components/ui/metric-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { ExportPanel } from "@/components/export/export-panel";

function getDecisionTone(decision) {
  if (decision === "accepted") {
    return "success";
  }

  if (decision === "manual") {
    return "accent";
  }

  if (decision === "rejected") {
    return "neutral";
  }

  return "neutral";
}

function getDecisionLabel(decision) {
  if (decision === "accepted") {
    return "Accepted";
  }

  if (decision === "manual") {
    return "Manual edit";
  }

  if (decision === "rejected") {
    return "Original kept";
  }

  return "Ready for review";
}

function getActionButtonClass(isActive, emphasis = "secondary") {
  const baseClass =
    "inline-flex w-full items-center justify-center rounded-[1.15rem] border px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(37,99,235,0.22)]";

  if (isActive) {
    return `${baseClass} border-[rgba(37,99,235,0.28)] bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-white shadow-[0_16px_34px_rgba(37,99,235,0.2)]`;
  }

  if (emphasis === "primary") {
    return `${baseClass} border-[rgba(37,99,235,0.14)] bg-[rgba(37,99,235,0.08)] text-[var(--accent)] hover:bg-[rgba(37,99,235,0.12)]`;
  }

  return `${baseClass} border-[var(--line-strong)] bg-white/90 text-[var(--ink)] hover:border-[rgba(37,99,235,0.24)] hover:bg-white`;
}

export function TailoringWorkspace({ session }) {
  const { updateSuggestionDecision, updateManualBullet, copyCurrentResumeSection, exportResume } = useProofFitApp();
  const [selectedSuggestionId, setSelectedSuggestionId] = useState(session.suggestions[0]?.id ?? null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [manualDrafts, setManualDrafts] = useState(
    Object.fromEntries(session.suggestions.map((suggestion) => [suggestion.id, suggestion.manualBullet ?? suggestion.suggestedBullet]))
  );

  const selectedSuggestion = session.suggestions.find((item) => item.id === selectedSuggestionId) ?? null;
  const finalStructuredResume = buildFinalStructuredResume(session);
  const finalSections = finalStructuredResume?.sections ?? session.structuredResume.sections;
  const tailoredBullets = finalStructuredResume?.sections.find((section) => section.name.toLowerCase() === "experience")?.items ?? session.originalBullets;
  const acceptedCount = session.suggestions.filter((suggestion) => suggestion.decision === "accepted" || suggestion.decision === "manual").length;
  const safeCount = session.suggestions.filter((suggestion) => suggestion.safe).length;
  const unsupportedGapCount = session.gaps.length;
  const selectedDraft = selectedSuggestion ? manualDrafts[selectedSuggestion.id] ?? "" : "";
  const highlightSections = useMemo(() => finalSections.slice(0, 3), [finalSections]);

  async function handleCopySection() {
    try {
      await copyCurrentResumeSection();
      setStatusMessage("Copied the tailored experience section.");
    } catch (error) {
      setStatusMessage(error.message);
    }
  }

  function handleSaveManualEdit() {
    if (!selectedSuggestion) {
      return;
    }

    updateManualBullet(selectedSuggestion.id, selectedDraft);
    updateSuggestionDecision(selectedSuggestion.id, "manual");
    setStatusMessage("Saved the manual edit into the tailored draft.");
  }

  function handleDecision(decision) {
    if (!selectedSuggestion) {
      return;
    }

    if (decision === "original") {
      setManualDrafts((current) => ({
        ...current,
        [selectedSuggestion.id]: selectedSuggestion.originalBullet
      }));
    }

    updateSuggestionDecision(selectedSuggestion.id, decision);
    setStatusMessage(
      decision === "accepted"
        ? "Accepted the selected change."
        : decision === "rejected"
          ? "Rejected the selected change and kept the original."
          : decision === "manual"
            ? "Manual edit mode is active for this suggestion."
            : "Restored the original bullet."
    );
  }

  async function handleExport(exportOptions) {
    setIsExporting(true);

    try {
      await exportResume(exportOptions);
      setStatusMessage(`Exported the tailored resume as ${exportOptions.format.toUpperCase()}.`);
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setIsExporting(false);
    }
  }

  if (!session.suggestions.length) {
    return (
      <div className="premium-panel">
        <p className="text-2xl font-semibold">No supported rewrites were generated</p>
        <p className="muted mt-4 text-sm leading-7">
          The resume may not contain enough evidence for the target role yet. Review the gap analysis and add real source-backed details before trying again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-4">
        {[
          { label: "Accepted or manual changes", value: acceptedCount.toString() },
          { label: "Supported suggestions", value: `${safeCount}/${session.suggestions.length}` },
          { label: "Requirements still unsupported", value: unsupportedGapCount.toString() },
          { label: "Primary target", value: session.role }
        ].map((item) => (
          <div key={item.label} className="stat-card">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">{item.label}</p>
            <p className="mt-3 text-2xl font-semibold leading-tight">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(290px,0.95fr)_minmax(460px,1.15fr)_minmax(300px,0.9fr)]">
        <section className="premium-panel">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Original resume</h2>
            <StatusBadge label="Source of truth" tone="neutral" />
          </div>
          <div className="mt-6 space-y-5">
            {session.structuredResume.sections.map((section) => (
              <div key={section.name} className="rounded-[1.75rem] border border-[var(--line)] bg-white/90 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">{section.name}</p>
                <div className="mt-3 space-y-2">
                  {section.items.map((item) => (
                    <p key={item} className="text-sm leading-7">
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="premium-panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Tailored draft</h2>
              <p className="muted mt-2 text-sm">Review the ATS-safe final structure before exporting.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="button-secondary" onClick={handleCopySection}>
                Copy section
              </button>
            </div>
          </div>

          {statusMessage ? (
            <p className="mt-4 rounded-2xl bg-[rgba(15,118,110,0.08)] px-4 py-3 text-sm font-semibold text-[var(--success)]">{statusMessage}</p>
          ) : null}

          <div className="mt-6 space-y-4">
            {highlightSections.map((section) => (
              <div key={section.name} className="rounded-[1.75rem] border border-[var(--line)] bg-white/95 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">{section.name}</p>
                <div className="mt-4 space-y-3">
                  {section.items.map((item) => (
                    <div key={item} className="rounded-[1.2rem] bg-[var(--surface-muted)] px-4 py-3 text-sm leading-7">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <ExportPanel
              structuredResume={finalStructuredResume}
              sessionContext={{
                company: session.company,
                role: session.role,
                jobDescriptionAnalysis: session.jobDescriptionAnalysis
              }}
              onExport={handleExport}
              isExporting={isExporting}
            />
          </div>

          <div className="mt-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Change queue</p>
            <div className="mt-3 space-y-3" role="tablist" aria-label="Tailoring suggestions">
              {session.suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  role="tab"
                  aria-selected={suggestion.id === selectedSuggestionId}
                  onClick={() => setSelectedSuggestionId(suggestion.id)}
                  className={`w-full rounded-[1.6rem] border p-4 text-left transition ${
                    suggestion.id === selectedSuggestionId
                      ? "border-[rgba(37,99,235,0.3)] bg-[var(--surface-muted)]"
                      : "border-[var(--line)] bg-white/90"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">{suggestion.label}</p>
                    <StatusBadge label={suggestion.safe ? "Supported" : "Needs review"} tone={suggestion.safe ? "success" : "accent"} />
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-7">{getEffectiveSuggestionBullet(suggestion)}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="premium-panel">
            <h2 className="text-xl font-semibold">Evidence and reasoning</h2>
            {selectedSuggestion ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-[1.75rem] border border-[var(--line)] bg-white/95 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">{selectedSuggestion.label}</p>
                      <p className="mt-2 text-sm leading-7">{selectedSuggestion.whyItChanged}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge label={getDecisionLabel(selectedSuggestion.decision)} tone={getDecisionTone(selectedSuggestion.decision)} />
                      <StatusBadge label={`Confidence ${selectedSuggestion.confidenceScore}`} tone="accent" />
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="rounded-[1.2rem] bg-[var(--surface-muted)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Source resume snippet</p>
                      <p className="mt-2 text-sm leading-7">{selectedSuggestion.sourceResumeSnippet}</p>
                    </div>
                    <div className="rounded-[1.2rem] bg-[var(--surface-muted)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Matched JD phrase</p>
                      <p className="mt-2 text-sm leading-7">{selectedSuggestion.matchedJobDescriptionSnippet}</p>
                    </div>
                    <div className="rounded-[1.2rem] bg-[rgba(15,118,110,0.08)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--success)]">Supported by resume</p>
                      <p className="mt-2 text-sm leading-7">{selectedSuggestion.supportLabel}</p>
                    </div>
                    <div className="rounded-[1.2rem] border border-[var(--line)] p-4">
                      <label className="block" htmlFor={`manual-edit-${selectedSuggestion.id}`}>
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Manual edit</span>
                      </label>
                      <textarea
                        id={`manual-edit-${selectedSuggestion.id}`}
                        value={selectedDraft}
                        onChange={(event) =>
                          setManualDrafts((current) => ({
                            ...current,
                            [selectedSuggestion.id]: event.target.value
                          }))
                        }
                        className="textarea-field mt-3 min-h-32"
                      />
                      <button type="button" className="button-secondary mt-3" onClick={handleSaveManualEdit}>
                        Save manual edit
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      className={getActionButtonClass(selectedSuggestion.decision === "accepted", "primary")}
                      aria-pressed={selectedSuggestion.decision === "accepted"}
                      onClick={() => handleDecision("accepted")}
                    >
                      Accept change
                    </button>
                    <button
                      type="button"
                      className={getActionButtonClass(selectedSuggestion.decision === "rejected")}
                      aria-pressed={selectedSuggestion.decision === "rejected"}
                      onClick={() => handleDecision("rejected")}
                    >
                      Reject change
                    </button>
                    <button
                      type="button"
                      className={getActionButtonClass(selectedSuggestion.decision === "manual")}
                      aria-pressed={selectedSuggestion.decision === "manual"}
                      onClick={() => handleDecision("manual")}
                    >
                      Edit manually
                    </button>
                    <button
                      type="button"
                      className={getActionButtonClass(selectedSuggestion.decision === "original")}
                      aria-pressed={selectedSuggestion.decision === "original"}
                      onClick={() => handleDecision("original")}
                    >
                      Restore original
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="premium-panel">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Score breakdown</p>
            <div className="mt-4 space-y-3">
              {session.scores.map((score) => (
                <MetricBar key={score.id} label={score.label} score={score.score} detail={score.detail} />
              ))}
            </div>
          </div>

          <div className="premium-panel">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Requirements not supported by your resume</p>
            <div className="mt-4 space-y-3">
              {session.gaps.map((gap) => (
                <div key={gap.name} className="rounded-[1.2rem] bg-[var(--surface-muted)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{gap.name} not found</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">{gap.severity}</span>
                  </div>
                  <p className="muted mt-2 text-sm leading-6">{gap.nextStep}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[1.4rem] border border-[var(--line)] bg-white/90 p-4">
              <p className="text-sm font-semibold">Final experience preview</p>
              <div className="mt-3 space-y-2">
                {tailoredBullets.map((bullet) => (
                  <p key={bullet} className="text-sm leading-7">
                    {bullet}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
