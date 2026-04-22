"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { SectionCard } from "@/components/ui/section-card";
import { useProofFitApp } from "@/components/providers/prooffit-provider";

export default function UploadPage() {
  const { state, uploadResume, clearResumeData } = useProofFitApp();
  const [resumeText, setResumeText] = useState(state.resumeUpload.extractedText);
  const [selectedFile, setSelectedFile] = useState(null);
  const [saveStructuredData, setSaveStructuredData] = useState(state.privacyPreferences.saveStructuredResume);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  function resetLocalInputs() {
    setSelectedFile(null);
    setResumeText("");
    setError("");
    setStatusMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleUpload() {
    if (!selectedFile && !resumeText.trim()) {
      setError("Add a file or paste resume text before continuing.");
      return;
    }

    setError("");
    setIsUploading(true);

    try {
      const result = await uploadResume({
        file: selectedFile,
        text: resumeText,
        saveStructuredData
      });
      setStatusMessage(`Resume processed successfully with ${result.structuredResume.sections.length} detected sections.`);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleClearAll() {
    await clearResumeData();
    resetLocalInputs();
    setStatusMessage("Cleared the current upload and extracted resume data.");
  }

  return (
    <AppShell title="Resume upload" description="Import a PDF or DOCX, extract structured sections, and decide whether the original file should survive the session.">
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard title="Upload source resume" eyebrow="Step 1">
          <div className="mt-6 rounded-[2rem] border border-dashed border-[rgba(37,99,235,0.28)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(239,246,255,0.9))] p-8 text-center">
            <p className="text-lg font-semibold">Drop a PDF or DOCX file here</p>
            <p className="muted mt-3 text-sm">Raw files are deleted after extraction by default unless the user opts in to save them.</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            />
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button type="button" className="button-primary" onClick={() => fileInputRef.current?.click()}>
                Choose file
              </button>
              <button type="button" className="button-secondary" onClick={resetLocalInputs}>
                Clear fields
              </button>
            </div>
            {selectedFile ? <p className="mt-3 text-sm font-semibold">{selectedFile.name}</p> : null}
          </div>

          <label className="mt-6 block" htmlFor="resume-text">
            <span className="mb-2 block text-sm font-semibold">Or paste resume text</span>
            <textarea
              id="resume-text"
              value={resumeText}
              onChange={(event) => setResumeText(event.target.value)}
              className="textarea-field min-h-56"
              placeholder="Paste a plain-text resume here if you want to test the parser without a file upload."
            />
          </label>

          <label className="mt-4 flex items-center gap-3 rounded-[1.3rem] border border-[var(--line)] bg-white/90 px-4 py-3">
            <input type="checkbox" checked={saveStructuredData} onChange={(event) => setSaveStructuredData(event.target.checked)} />
            <span className="text-sm font-semibold">Keep structured resume data after this session</span>
          </label>

          {error ? <p className="mt-4 rounded-2xl bg-[rgba(190,18,60,0.08)] px-4 py-3 text-sm font-semibold text-[var(--danger)]">{error}</p> : null}
          {statusMessage ? <p className="mt-4 rounded-2xl bg-[rgba(15,118,110,0.08)] px-4 py-3 text-sm font-semibold text-[var(--success)]">{statusMessage}</p> : null}

          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" className="button-primary" onClick={handleUpload} disabled={isUploading}>
              {isUploading ? "Processing..." : "Process resume"}
            </button>
            <button type="button" className="button-secondary" onClick={handleClearAll}>
              Clear current upload
            </button>
            <Link
              href={state.resumeUpload.structuredResume ? "/job-analysis" : "#"}
              className={`button-secondary ${state.resumeUpload.structuredResume ? "" : "pointer-events-none opacity-60"}`}
              aria-disabled={!state.resumeUpload.structuredResume}
            >
              Continue to JD analysis
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="stat-card">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Consent controls</p>
              <p className="muted mt-3 text-sm leading-7">
                Users must explicitly opt in before structured resume data is stored beyond the current session.
              </p>
            </div>
            <div className="stat-card">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Audit trail</p>
              <p className="muted mt-3 text-sm leading-7">
                Every upload, extraction, deletion, and export event is written to the audit log.
              </p>
            </div>
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Extracted structure preview" eyebrow="Step 2">
            {(state.resumeUpload.structuredResume?.sections || []).length ? (
              <div className="mt-6 space-y-4">
                {(state.resumeUpload.structuredResume?.sections || []).map((section) => (
                  <div key={section.name} className="info-tile">
                    <p className="font-semibold">{section.name}</p>
                    <p className="muted mt-1 text-sm">{section.items.length} items detected</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-[1.5rem] border border-dashed border-[var(--line)] bg-white/80 px-5 py-6 text-sm font-semibold text-[var(--ink-soft)]">
                Upload a resume or paste text to see the structured preview here.
              </div>
            )}

            {state.resumeUpload.deletionPlan ? (
              <div className="mt-6 rounded-[1.5rem] bg-[var(--surface-muted)] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Deletion plan</p>
                <p className="mt-3 text-sm leading-7">{state.resumeUpload.deletionPlan.message}</p>
              </div>
            ) : null}
          </SectionCard>

          <div className="premium-panel-dark">
            <p className="text-sm uppercase tracking-[0.2em] text-white/60">Upload promise</p>
            <div className="mt-5 space-y-3">
              {[
                "No hidden paywall before a meaningful result",
                "Structured extraction stays reviewable",
                "Privacy choices stay visible during import"
              ].map((item) => (
                <div key={item} className="rounded-[1.25rem] border border-white/10 bg-white/8 px-4 py-3 text-sm font-semibold">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
