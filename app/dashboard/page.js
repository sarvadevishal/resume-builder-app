"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { SectionCard } from "@/components/ui/section-card";
import { useProofFitApp } from "@/components/providers/prooffit-provider";

export default function DashboardPage() {
  const { state } = useProofFitApp();
  const activeSession = state.tailoringSession;

  return (
    <AppShell title="Dashboard" description="Pick up where you left off, compare versions, and keep every target role grounded in evidence instead of guesswork.">
      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard title="Recent tailoring session" eyebrow="In progress" className="xl:col-span-2">
          <div className="mt-6 rounded-[1.75rem] border border-[var(--line)] bg-white/90 p-5">
            <p className="text-sm text-[var(--ink-soft)]">Signed in as</p>
            <p className="mt-2 text-2xl font-semibold">{state.currentUser?.email}</p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="stat-card">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Company</p>
              <p className="mt-3 text-2xl font-semibold">{activeSession?.company || state.jobDescription.company || "Start with a target company"}</p>
            </div>
            <div className="stat-card">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Role</p>
              <p className="mt-3 text-2xl font-semibold">{activeSession?.role || state.jobDescription.role || "Choose a target role"}</p>
            </div>
          </div>

          {(activeSession?.scores || []).length ? (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {(activeSession?.scores || []).slice(0, 3).map((score) => (
                <div key={score.id} className="stat-card">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">{score.label}</p>
                  <p className="mt-3 text-3xl font-semibold">{score.score}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-[var(--line)] bg-white/80 px-5 py-6 text-sm font-semibold text-[var(--ink-soft)]">
              Upload a resume and analyze a real job description to generate the first proof-backed score breakdown.
            </div>
          )}
        </SectionCard>

        <div className="space-y-6">
          <div className="premium-panel-dark">
            <p className="text-sm uppercase tracking-[0.2em] text-white/60">Current plan</p>
            <p className="mt-3 text-3xl font-semibold capitalize">{state.currentPlan}</p>
            <div className="mt-6 space-y-3">
              {[
                "Free tier includes 3 tailoring sessions",
                "Meaningful preview unlocked before checkout",
                "Pro unlocks exports, history, and unlimited sessions"
              ].map((item) => (
                <div key={item} className="rounded-[1.3rem] border border-white/10 bg-white/8 px-4 py-3 text-sm font-semibold">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <SectionCard title="Workflow status" eyebrow="Readiness">
          <div className="mt-6 space-y-3">
            {[
              state.resumeUpload.structuredResume ? "Resume uploaded or pasted" : "Resume still needed",
              state.jobDescription.analysis ? "Job description analyzed" : "Job description still needed",
              activeSession ? "Tailoring session ready" : "Tailoring session not generated yet"
            ].map((item) => (
              <div key={item} className="info-tile text-sm font-semibold">
                {item}
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/upload" className="button-secondary">
              Upload resume
            </Link>
            <Link href="/job-analysis" className="button-secondary">
              Analyze JD
            </Link>
            <Link href="/workspace" className="button-primary">
              Open workspace
            </Link>
          </div>
        </SectionCard>

        <SectionCard title="Recent audit events" eyebrow="Traceability">
          <div className="mt-6 space-y-3">
            {(state.auditEvents.length ? state.auditEvents : [{ id: "empty", message: "No local audit events yet.", createdAt: "Just now" }]).map((item) => (
              <div key={item.id} className="info-tile">
                <p className="text-sm font-semibold">{item.message}</p>
                <p className="muted mt-1 text-xs">{item.createdAt}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
