"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { TailoringWorkspace } from "@/components/workspace/tailoring-workspace";
import { useProofFitApp } from "@/components/providers/prooffit-provider";

export default function WorkspacePage() {
  const { state, activity, generateTailoringSession } = useProofFitApp();
  const [workspaceMessage, setWorkspaceMessage] = useState("");
  const missingSteps = useMemo(() => {
    const nextMissingSteps = [];

    if (!state.resumeUpload.structuredResume) {
      nextMissingSteps.push("Upload or paste a resume");
    }

    if (!state.jobDescription.analysis) {
      nextMissingSteps.push("Analyze the target job description");
    }

    return nextMissingSteps;
  }, [state.jobDescription.analysis, state.resumeUpload.structuredResume]);
  const canGenerateTailoringSession = missingSteps.length === 0;

  async function handleGenerateNow() {
    setWorkspaceMessage("");

    if (!canGenerateTailoringSession) {
      setWorkspaceMessage(`Complete these steps first: ${missingSteps.join(" and ")}.`);
      return;
    }

    try {
      await generateTailoringSession();
      setWorkspaceMessage("Tailoring session ready. Review the evidence-backed suggestions below.");
    } catch (error) {
      setWorkspaceMessage(error.message || "Unable to generate the tailoring session right now.");
    }
  }

  return (
    <AppShell
      title="Tailoring workspace"
      description="Review original experience, accept proof-backed rewrites, inspect evidence, and keep unsupported requirements visible as gaps."
      fullWidth
    >
      {state.tailoringSession ? (
        <TailoringWorkspace key={state.tailoringSession.id} session={state.tailoringSession} />
      ) : (
        <div className="premium-panel">
          <p className="text-2xl font-semibold">No tailoring session yet</p>
          <p className="muted mt-4 max-w-2xl text-sm leading-7">
            Upload a resume and analyze a job description first, then generate a tailoring session so the workspace has real suggestions to review.
          </p>
          {activity.isGeneratingTailoringSession ? (
            <div className="mt-4 rounded-[1.5rem] border border-[rgba(37,99,235,0.14)] bg-[rgba(37,99,235,0.08)] px-5 py-4">
              <p className="text-sm font-semibold text-[var(--accent)]">Generating proof-backed suggestions</p>
              <p className="muted mt-2 text-sm leading-6">
                We&apos;re mapping your verified resume evidence to the target role. This usually completes within a few seconds and times out safely if the request stalls.
              </p>
            </div>
          ) : null}
          {!activity.isGeneratingTailoringSession && workspaceMessage ? (
            <p
              className={`mt-4 rounded-2xl px-4 py-3 text-sm font-semibold ${
                canGenerateTailoringSession
                  ? "bg-[rgba(15,118,110,0.08)] text-[var(--success)]"
                  : "bg-[rgba(190,18,60,0.08)] text-[var(--danger)]"
              }`}
            >
              {workspaceMessage}
            </p>
          ) : null}
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-[1.4rem] border border-[var(--line)] bg-white/85 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Resume readiness</p>
              <p className="mt-2 text-sm font-semibold">
                {state.resumeUpload.structuredResume ? "Ready to tailor" : "Still needed"}
              </p>
              <p className="muted mt-2 text-sm leading-6">
                {state.resumeUpload.structuredResume
                  ? `${state.resumeUpload.structuredResume.sections.length} structured sections are available as source evidence.`
                  : "Upload a PDF, DOCX, or paste the resume text first."}
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-[var(--line)] bg-white/85 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">JD readiness</p>
              <p className="mt-2 text-sm font-semibold">{state.jobDescription.analysis ? "Analyzed and ready" : "Still needed"}</p>
              <p className="muted mt-2 text-sm leading-6">
                {state.jobDescription.analysis
                  ? `Target role: ${state.jobDescription.role || "Untitled role"} at ${state.jobDescription.company || "target company"}.`
                  : "Break the job description into requirements before generating the tailoring session."}
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/upload" className="button-secondary">
              Upload resume
            </Link>
            <Link href="/job-analysis" className="button-secondary">
              Analyze job description
            </Link>
            <button
              type="button"
              className="button-primary"
              onClick={handleGenerateNow}
              disabled={activity.isGeneratingTailoringSession || !canGenerateTailoringSession}
            >
              {activity.isGeneratingTailoringSession ? "Generating proof-backed suggestions..." : "Tailor resume"}
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
