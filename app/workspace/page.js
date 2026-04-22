"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { TailoringWorkspace } from "@/components/workspace/tailoring-workspace";
import { useProofFitApp } from "@/components/providers/prooffit-provider";

export default function WorkspacePage() {
  const { state, generateTailoringSession } = useProofFitApp();

  return (
    <AppShell
      title="Tailoring workspace"
      description="Review original experience, accept proof-backed rewrites, inspect evidence, and keep unsupported requirements visible as gaps."
      fullWidth
    >
      {state.tailoringSession ? (
        <TailoringWorkspace key={state.tailoringSession.id} session={state.tailoringSession} />
      ) : (
        <div className="surface rounded-[2rem] p-8">
          <p className="text-2xl font-semibold">No tailoring session yet</p>
          <p className="muted mt-4 max-w-2xl text-sm leading-7">
            Upload a resume and analyze a job description first, then generate a tailoring session so the workspace has real suggestions to review.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/upload" className="button-secondary">
              Upload resume
            </Link>
            <Link href="/job-analysis" className="button-secondary">
              Analyze job description
            </Link>
            <button type="button" className="button-primary" onClick={generateTailoringSession}>
              Generate now
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
