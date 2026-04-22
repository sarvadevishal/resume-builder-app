"use client";

import { AppShell } from "@/components/layout/app-shell";
import { SectionCard } from "@/components/ui/section-card";
import { useProofFitApp } from "@/components/providers/prooffit-provider";
import { buildFinalStructuredResume } from "@/lib/prooffit-state";

export default function AtsPreviewPage() {
  const { state } = useProofFitApp();
  const session = state.tailoringSession;
  const structuredResume = session ? buildFinalStructuredResume(session) : state.resumeUpload.structuredResume;
  const warnings = session?.atsWarnings || state.resumeUpload.atsWarnings;

  return (
    <AppShell title="What ATS sees" description="Simulate the parsed resume structure, check formatting risks, and keep exports in a safe single-column format.">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Parser warnings" eyebrow="ATS-safe mode">
          {(warnings || []).length ? (
            <div className="mt-6 space-y-3">
              {(warnings || []).map((warning) => (
                <div key={warning.title} className="info-tile">
                  <p className="font-semibold">{warning.title}</p>
                  <p className="muted mt-2 text-sm leading-7">{warning.detail}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-[var(--line)] bg-white/80 px-5 py-6 text-sm font-semibold text-[var(--ink-soft)]">
              Upload and tailor a resume to see ATS warnings and parser guidance here.
            </div>
          )}
        </SectionCard>

        <SectionCard title="Parsed section preview" eyebrow="What ATS sees">
          {(structuredResume?.sections || []).length ? (
            <div className="mt-6 space-y-5">
              {(structuredResume?.sections || []).map((section) => (
                <div key={section.name} className="rounded-[1.75rem] border border-[var(--line)] bg-white/90 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">{section.name}</p>
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
          ) : (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-[var(--line)] bg-white/80 px-5 py-6 text-sm font-semibold text-[var(--ink-soft)]">
              The parsed section preview will appear here after resume upload and tailoring.
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
