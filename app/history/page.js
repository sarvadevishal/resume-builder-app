"use client";

import { AppShell } from "@/components/layout/app-shell";
import { SectionCard } from "@/components/ui/section-card";
import { useProofFitApp } from "@/components/providers/prooffit-provider";

export default function HistoryPage() {
  const { state, restoreVersion } = useProofFitApp();

  return (
    <AppShell title="Version history" description="Track tailored resumes by company and role, compare exports, and restore earlier versions without losing provenance.">
      <SectionCard title="Saved resume versions" eyebrow="History">
        <div className="mt-6 space-y-4">
          {state.versionHistory.map((version) => (
            <div key={version.id} className="grid gap-4 rounded-[1.75rem] border border-[var(--line)] bg-white/90 p-5 md:grid-cols-[1.2fr_0.8fr_0.6fr]">
              <div>
                <p className="text-lg font-semibold">{version.company}</p>
                <p className="muted mt-1 text-sm">{version.role}</p>
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Accepted changes</p>
                <p className="muted mt-2 text-sm">{version.acceptedChanges} accepted edits</p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Updated</p>
                <p className="muted mt-2 text-sm">{version.updatedAt}</p>
                <button type="button" className="button-secondary mt-3" onClick={() => restoreVersion(version.id)}>
                  Restore
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}
