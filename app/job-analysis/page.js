"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { SectionCard } from "@/components/ui/section-card";
import { useProofFitApp } from "@/components/providers/prooffit-provider";
import { createEmptyJobDescriptionAnalysis } from "@/lib/prooffit-state";

export default function JobAnalysisPage() {
  const router = useRouter();
  const { state, activity, analyzeJobDescription, generateTailoringSession } = useProofFitApp();
  const [jobDescriptionText, setJobDescriptionText] = useState(state.jobDescription.text);
  const [company, setCompany] = useState(state.jobDescription.company);
  const [role, setRole] = useState(state.jobDescription.role);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const analysis = state.jobDescription.analysis || createEmptyJobDescriptionAnalysis();
  const canAnalyze = Boolean(state.resumeUpload.structuredResume) && !activity.isGeneratingTailoringSession;
  const canGenerate = Boolean(state.resumeUpload.structuredResume && state.jobDescription.analysis) && !activity.isAnalyzingJobDescription;
  const hasReadySession = Boolean(state.tailoringSession);
  const sessionSummary = useMemo(() => {
    if (!state.tailoringSession) {
      return "";
    }

    return `${state.tailoringSession.suggestions.length} proof-backed suggestions ready for ${state.tailoringSession.role || "this role"}.`;
  }, [state.tailoringSession]);

  async function handleAnalyze() {
    setError("");
    setStatusMessage("");

    try {
      await analyzeJobDescription({
        text: jobDescriptionText,
        company,
        role
      });
      setStatusMessage("Job description analyzed successfully. Review the extracted requirements, then generate the tailoring session.");
    } catch (analysisError) {
      setError(analysisError.message);
    }
  }

  async function handleGenerateSession() {
    if (state.tailoringSession) {
      router.push("/workspace");
      return;
    }

    setError("");
    setStatusMessage("Generating a proof-backed tailoring session grounded in your resume evidence.");

    try {
      await generateTailoringSession();
      setStatusMessage("Tailoring session ready. Opening the workspace.");
      router.push("/workspace");
    } catch (generationError) {
      setError(generationError.message);
      setStatusMessage("");
    }
  }

  return (
    <AppShell title="Job description analysis" description="Break the target role into must-haves, preferred tools, responsibilities, seniority, and domain signals before rewriting anything.">
      <SectionCard title="Analyze target role" eyebrow="Step 2">
        {!state.resumeUpload.structuredResume ? (
          <p className="mt-6 rounded-2xl bg-[rgba(190,18,60,0.08)] px-4 py-3 text-sm font-semibold text-[var(--danger)]">
            Upload a resume first so the app can map real resume evidence to the job description.
          </p>
        ) : null}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block" htmlFor="company-name">
            <span className="mb-2 block text-sm font-semibold">Company</span>
            <input id="company-name" value={company} onChange={(event) => setCompany(event.target.value)} className="input-field" />
          </label>
          <label className="block" htmlFor="role-title">
            <span className="mb-2 block text-sm font-semibold">Role</span>
            <input id="role-title" value={role} onChange={(event) => setRole(event.target.value)} className="input-field" />
          </label>
        </div>

        <label className="mt-4 block" htmlFor="job-description">
          <span className="mb-2 block text-sm font-semibold">Job description</span>
          <textarea
            id="job-description"
            value={jobDescriptionText}
            onChange={(event) => setJobDescriptionText(event.target.value)}
            className="textarea-field min-h-56"
            placeholder="Paste the full job description here."
          />
        </label>

        {error ? <p className="mt-4 rounded-2xl bg-[rgba(190,18,60,0.08)] px-4 py-3 text-sm font-semibold text-[var(--danger)]">{error}</p> : null}
        {statusMessage ? <p className="mt-4 rounded-2xl bg-[rgba(15,118,110,0.08)] px-4 py-3 text-sm font-semibold text-[var(--success)]">{statusMessage}</p> : null}
        {hasReadySession && !activity.isGeneratingTailoringSession ? (
          <p className="mt-4 rounded-2xl bg-[rgba(37,99,235,0.08)] px-4 py-3 text-sm font-semibold text-[var(--accent)]">{sessionSummary}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className="button-primary" onClick={handleAnalyze} disabled={!canAnalyze || activity.isAnalyzingJobDescription}>
            {activity.isAnalyzingJobDescription ? "Analyzing JD..." : "Analyze JD"}
          </button>
          <button
            type="button"
            className={hasReadySession ? "button-primary" : "button-secondary"}
            onClick={handleGenerateSession}
            disabled={!canGenerate || activity.isGeneratingTailoringSession}
          >
            {activity.isGeneratingTailoringSession
              ? "Generating proof-backed suggestions..."
              : hasReadySession
                ? "Open ready workspace"
                : "Generate tailoring session"}
          </button>
          <Link href="/workspace" className={hasReadySession ? "button-secondary" : "button-secondary"}>
            {hasReadySession ? "Review workspace" : "Open workspace"}
          </Link>
        </div>
      </SectionCard>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <SectionCard title="Must-have skills" eyebrow="JD intelligence">
          {analysis.mustHaveSkills.length ? (
            <div className="mt-6 flex flex-wrap gap-3">
              {analysis.mustHaveSkills.map((item) => (
                <span key={item} className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <p className="muted mt-6 text-sm leading-7">Analyze the job description to populate required skills here.</p>
          )}
        </SectionCard>

        <SectionCard title="Preferred skills" eyebrow="Nice to have">
          {analysis.preferredSkills.length ? (
            <div className="mt-6 flex flex-wrap gap-3">
              {analysis.preferredSkills.map((item) => (
                <span key={item} className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <p className="muted mt-6 text-sm leading-7">Preferred skills will appear here after analysis.</p>
          )}
        </SectionCard>

        <SectionCard title="Role shape" eyebrow="Seniority">
          <div className="mt-6 space-y-3">
            <div className="stat-card">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Seniority</p>
              <p className="mt-3 text-2xl font-semibold">{analysis.seniority || "Not analyzed yet"}</p>
            </div>
            <div className="stat-card">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Domain fit</p>
              <p className="mt-3 text-2xl font-semibold">{analysis.primaryDomain || "Not analyzed yet"}</p>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <SectionCard title="Responsibilities" eyebrow="What matters most">
          {analysis.responsibilities.length ? (
            <div className="mt-6 space-y-3">
              {analysis.responsibilities.map((item) => (
                <div key={item} className="info-tile text-sm font-semibold">
                  {item}
                </div>
              ))}
            </div>
          ) : (
            <p className="muted mt-6 text-sm leading-7">Responsibilities will appear here after analysis.</p>
          )}
        </SectionCard>

        <SectionCard title="Requirements not supported by your resume" eyebrow="Gap analysis">
          {(state.tailoringSession?.gaps?.length ? state.tailoringSession.gaps : analysis.gaps || []).length ? (
            <div className="mt-6 space-y-3">
              {(state.tailoringSession?.gaps?.length ? state.tailoringSession.gaps : analysis.gaps || []).map((gap) => (
                <div key={gap.name} className="info-tile">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold">{gap.name} not found</p>
                    <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">{gap.severity}</span>
                  </div>
                  <p className="muted mt-2 text-sm">{gap.nextStep}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted mt-6 text-sm leading-7">Unsupported requirements will be listed here after analysis and tailoring.</p>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
