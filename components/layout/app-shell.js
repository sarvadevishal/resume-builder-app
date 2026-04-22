"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appNavigation } from "@/lib/constants/navigation";
import { getWorkflowStepState } from "@/lib/prooffit-state";
import { useProofFitApp } from "@/components/providers/prooffit-provider";

const orderedSteps = [
  { key: "hasResume", label: "Resume loaded" },
  { key: "hasJobDescriptionAnalysis", label: "JD analyzed" },
  { key: "hasTailoringSession", label: "Tailoring ready" },
  { key: "hasExport", label: "Final exported" }
];

export function AppShell({ children, title, description, fullWidth = false }) {
  const pathname = usePathname();
  const { state, startNewWorkflow } = useProofFitApp();
  const workflowState = getWorkflowStepState(state);

  return (
    <div className={`${fullWidth ? "shell-width max-w-none" : "shell-width"} py-10`}>
      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <aside className="premium-panel hidden h-fit xl:block">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">ProofFit workflow</p>
          <div className="mt-5 space-y-2">
            {appNavigation.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-[1.5rem] px-4 py-4 transition ${
                    isActive ? "bg-[var(--ink)] text-white shadow-[0_18px_36px_rgba(15,23,42,0.16)]" : "bg-white/70 hover:bg-white"
                  }`}
                >
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className={`mt-1 text-xs font-medium ${isActive ? "text-white/70" : "text-[var(--ink-soft)]"}`}>{item.detail}</p>
                </Link>
              );
            })}
          </div>

          <div className="mt-6 rounded-[1.75rem] bg-[var(--surface-muted)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Guided progress</p>
            <div className="mt-3 space-y-2">
              {orderedSteps.map((step, index) => (
                <div key={step.key} className="flex items-center gap-3 rounded-[1rem] bg-white/70 px-3 py-3 text-sm font-semibold text-[var(--ink-soft)]">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                      workflowState[step.key] ? "bg-[var(--accent)] text-white" : "bg-[var(--surface-muted)] text-[var(--accent)]"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span>{step.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-[1.75rem] bg-[var(--surface-muted)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Operating principles</p>
            <div className="mt-3 space-y-2 text-sm font-medium text-[var(--ink-soft)]">
              <p>Only rewrite what the source resume supports.</p>
              <p>Flag gaps instead of inventing claims.</p>
              <p>Keep exports ATS-safe and human-readable.</p>
            </div>
          </div>
        </aside>

        <div>
          <div className="premium-panel">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">ProofFit AI</p>
                <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{title}</h1>
                <p className="muted mt-3 max-w-3xl text-sm leading-7 sm:text-base">{description}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" className="button-secondary" onClick={startNewWorkflow}>
                  Start new
                </button>
                <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/80 px-4 py-3 text-sm font-semibold text-[var(--ink-soft)]">
                  Premium workflow
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
