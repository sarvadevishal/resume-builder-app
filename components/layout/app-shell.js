"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { appNavigation } from "@/lib/constants/navigation";
import { getWorkflowStepState } from "@/lib/prooffit-state";
import { useProofFitApp } from "@/components/providers/prooffit-provider";

const orderedSteps = [
  {
    key: "hasResume",
    label: "Resume loaded",
    detail: "Import a PDF, DOCX, or plain-text resume.",
    href: "/upload"
  },
  {
    key: "hasJobDescriptionAnalysis",
    label: "JD analyzed",
    detail: "Break the target role into evidence-ready requirements.",
    href: "/job-analysis"
  },
  {
    key: "hasTailoringSession",
    label: "Tailoring ready",
    detail: "Review supported rewrites and confidence notes.",
    href: "/workspace"
  },
  {
    key: "hasExport",
    label: "Final exported",
    detail: "Download the polished ATS-safe final version.",
    href: "/ats-preview"
  }
];

export function AppShell({ children, title, description, fullWidth = false }) {
  const pathname = usePathname();
  const { state, startNewWorkflow } = useProofFitApp();
  const workflowState = getWorkflowStepState(state);
  const completedStepCount = orderedSteps.filter((step) => workflowState[step.key]).length;
  const allStepsComplete = completedStepCount === orderedSteps.length;
  const activeStepIndex = allStepsComplete ? orderedSteps.length - 1 : completedStepCount;
  const progressPercent = Math.max(12, Math.round((completedStepCount / orderedSteps.length) * 100));
  const currentStep = orderedSteps[activeStepIndex];

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
                  className={clsx(
                    "block rounded-[1.5rem] px-4 py-4 transition",
                    isActive
                      ? "bg-[linear-gradient(135deg,var(--brand-deep),var(--brand-mid))] text-white shadow-[0_18px_36px_rgba(49,114,204,0.22)]"
                      : "bg-white/78 hover:bg-white"
                  )}
                >
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className={clsx("mt-1 text-xs font-medium", isActive ? "text-white/78" : "text-[var(--ink-soft)]")}>{item.detail}</p>
                </Link>
              );
            })}
          </div>

          <div className="mt-6 rounded-[1.9rem] border border-[rgba(49,114,204,0.12)] bg-[linear-gradient(180deg,rgba(238,245,255,0.96),rgba(255,255,255,0.92))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Guided progress</p>
                <p className="mt-2 text-sm font-semibold text-[var(--ink)]">
                  {allStepsComplete ? "Workflow completed" : `Step ${activeStepIndex + 1} of ${orderedSteps.length}`}
                </p>
              </div>
              <div className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--accent)] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                {progressPercent}%
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/80">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand-deep),var(--brand-soft))] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="mt-4 rounded-[1.35rem] border border-[rgba(49,114,204,0.08)] bg-white/76 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Now guiding</p>
              <p className="mt-2 text-sm font-semibold text-[var(--ink)]">{currentStep.label}</p>
              <p className="mt-1 text-sm leading-6 text-[var(--ink-soft)]">{currentStep.detail}</p>
            </div>

            <div className="mt-4 space-y-3">
              {orderedSteps.map((step, index) => {
                const status = allStepsComplete ? "complete" : index < activeStepIndex ? "complete" : index === activeStepIndex ? "active" : "upcoming";

                return (
                  <Link
                    key={step.key}
                    href={step.href}
                    className={clsx(
                      "group flex items-center gap-3 rounded-[1.25rem] border px-3 py-3 transition",
                      status === "active" && "border-[rgba(49,114,204,0.14)] bg-[linear-gradient(135deg,rgba(241,247,255,1),rgba(232,242,255,0.95))] shadow-[0_12px_28px_rgba(49,114,204,0.12)]",
                      status === "complete" && "border-[rgba(15,118,110,0.12)] bg-[rgba(245,251,250,0.98)]",
                      status === "upcoming" && "border-[var(--line)] bg-white/78 hover:bg-white"
                    )}
                  >
                    <span className="relative flex h-11 w-11 shrink-0 items-center justify-center">
                      {status === "active" ? <span className="absolute inset-0 rounded-full bg-[rgba(49,114,204,0.12)] animate-pulse" /> : null}
                      <span
                        className={clsx(
                          "relative flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition",
                          status === "active" && "bg-[linear-gradient(135deg,var(--brand-deep),var(--brand-mid))] text-white shadow-[0_10px_24px_rgba(49,114,204,0.22)]",
                          status === "complete" && "bg-[rgba(15,118,110,0.14)] text-[var(--success)]",
                          status === "upcoming" && "bg-[var(--surface-muted)] text-[var(--accent)]"
                        )}
                      >
                        {status === "complete" ? "✓" : index + 1}
                      </span>
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[var(--ink)]">{step.label}</p>
                        <span
                          className={clsx(
                            "rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                            status === "active" && "bg-[rgba(49,114,204,0.1)] text-[var(--accent)]",
                            status === "complete" && "bg-[rgba(15,118,110,0.1)] text-[var(--success)]",
                            status === "upcoming" && "bg-[rgba(24,50,75,0.06)] text-[var(--ink-soft)]"
                          )}
                        >
                          {status === "active" ? "Live" : status === "complete" ? "Done" : "Next"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-[var(--ink-soft)]">{step.detail}</p>
                    </div>
                  </Link>
                );
              })}
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
