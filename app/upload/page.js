"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { SectionCard } from "@/components/ui/section-card";
import { useProofFitApp } from "@/components/providers/prooffit-provider";

export default function UploadPage() {
  const { state, uploadResume } = useProofFitApp();
  const [resumeText, setResumeText] = useState(state.resumeUpload.extractedText);
  const [selectedFile, setSelectedFile] = useState(null);
  const [saveStructuredData, setSaveStructuredData] = useState(state.privacyPreferences.saveStructuredResume);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  async function handleUpload() {
    if (!selectedFile && !resumeText.trim()) {
      setError("Add a file or paste resume text before continuing.");
      return;
    }

    setError("");
    setIsUploading(true);

    try {
      await uploadResume({
        file: selectedFile,
        text: resumeText,
        saveStructuredData
      });
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <AppShell title="Resume upload" description="Import PDF or DOCX, extract structured sections, and decide whether to keep the original file after processing.">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Upload source resume" eyebrow="Step 1">
          <div className="mt-6 rounded-[2rem] border border-dashed border-[var(--line-strong)] bg-white/90 p-8 text-center">
            <p className="text-lg font-semibold">Drop a PDF or DOCX file here</p>
            <p className="muted mt-3 text-sm">Raw files are deleted after extraction by default unless the user opts in to save them.</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            />
            <button type="button" className="button-primary mt-6" onClick={() => fileInputRef.current?.click()}>
              Choose file
            </button>
            {selectedFile ? <p className="mt-3 text-sm font-semibold">{selectedFile.name}</p> : null}
          </div>

          <label className="mt-6 block" htmlFor="resume-text">
            <span className="mb-2 block text-sm font-semibold">Or paste resume text</span>
            <textarea
              id="resume-text"
              value={resumeText}
              onChange={(event) => setResumeText(event.target.value)}
              className="min-h-56 w-full rounded-[1.5rem] border border-[var(--line)] bg-white px-4 py-4 outline-none"
              placeholder="Paste a plain-text resume here if you want to test the parser without a file upload."
            />
          </label>

          <label className="mt-4 flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3">
            <input
              type="checkbox"
              checked={saveStructuredData}
              onChange={(event) => setSaveStructuredData(event.target.checked)}
            />
            <span className="text-sm font-semibold">Keep structured resume data after this session</span>
          </label>

          {error ? <p className="mt-4 rounded-2xl bg-[rgba(182,59,47,0.08)] px-4 py-3 text-sm font-semibold text-[var(--danger)]">{error}</p> : null}

          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" className="button-primary" onClick={handleUpload} disabled={isUploading}>
              {isUploading ? "Processing..." : "Process resume"}
            </button>
            <Link href="/job-analysis" className="button-secondary">
              Continue to JD analysis
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-[var(--line)] bg-white p-5">
              <p className="text-sm font-semibold">Consent controls</p>
              <p className="muted mt-2 text-sm leading-7">
                Users must explicitly opt in before structured resume data is stored beyond the current session.
              </p>
            </div>
            <div className="rounded-3xl border border-[var(--line)] bg-white p-5">
              <p className="text-sm font-semibold">Audit trail</p>
              <p className="muted mt-2 text-sm leading-7">
                Every upload, extraction, deletion, and export event is written to the audit log.
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Extracted structure preview" eyebrow="Step 2">
          <div className="mt-6 space-y-4">
            {(state.resumeUpload.structuredResume?.sections || []).map((section) => (
              <div key={section.name} className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3">
                <p className="font-semibold">{section.name}</p>
                <p className="muted mt-1 text-sm">{section.items.length} items detected</p>
              </div>
            ))}
          </div>

          {state.resumeUpload.deletionPlan ? (
            <div className="mt-6 rounded-3xl bg-[var(--surface-muted)] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Deletion plan</p>
              <p className="mt-3 text-sm leading-7">{state.resumeUpload.deletionPlan.message}</p>
            </div>
          ) : null}
        </SectionCard>
      </div>
    </AppShell>
  );
}
