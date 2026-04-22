"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { SectionCard } from "@/components/ui/section-card";
import { useProofFitApp } from "@/components/providers/prooffit-provider";

export default function DashboardPage() {
  const { state } = useProofFitApp();
  const activeSession = state.tailoringSession;

  return (
    <AppShell title="Dashboard" description="Pick up where you left off, compare versions, and keep each target role grounded in evidence.">
      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard title="Recent tailoring session" eyebrow="In progress" className="xl:col-span-2">
          <div className="mt-6 rounded-3xl border border-[var(--line)] bg-white p-5">
            <p className="text-sm text-[var(--ink-soft)]">Signed in as</p>
            <p className="mt-2 text-2xl font-semibold">{state.currentUser?.email}</p>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-[var(--line)] bg-white p-5">
              <p className="text-sm text-[var(--ink-soft)]">Company</p>
              <p className="mt-2 text-2xl font-semibold">{activeSession?.company || state.jobDescription.company}</p>
            </div>
            <div className="rounded-3xl border border-[var(--line)] bg-white p-5">
              <p className="text-sm text-[var(--ink-soft)]">Role</p>
              <p className="mt-2 text-2xl font-semibold">{activeSession?.role || state.jobDescription.role}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {(activeSession?.scores || []).map((score) => (
              <div key={score.id} className="rounded-3xl bg-[var(--surface-muted)] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">{score.label}</p>
                <p className="mt-3 text-3xl font-semibold">{score.score}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Plan snapshot" eyebrow="Current plan">
          <div className="mt-6 space-y-3">
            {[
              `Current plan: ${state.currentPlan}`,
              "Free tier: 3 tailoring sessions",
              "Meaningful preview unlocked before checkout",
              "Pro unlocks exports, history, and unlimited sessions"
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold">
                {item}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <SectionCard title="Workflow status" eyebrow="Readiness">
          <div className="mt-6 space-y-3">
            {[
              state.resumeUpload.structuredResume ? "Resume uploaded or pasted" : "Resume still needed",
              state.jobDescription.analysis ? "Job description analyzed" : "Job description still needed",
              activeSession ? "Tailoring session ready" : "Tailoring session not generated yet"
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold">
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
              <div key={item.id} className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3">
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
