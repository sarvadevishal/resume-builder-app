"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { SectionCard } from "@/components/ui/section-card";
import { useProofFitApp } from "@/components/providers/prooffit-provider";

export default function SettingsPage() {
  const { state, updatePrivacyPreferences, clearResumeData, clearSavedHistory } = useProofFitApp();
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const preferenceItems = [
    {
      key: "deleteRawUploads",
      label: "Delete raw uploads after extraction"
    },
    {
      key: "saveStructuredResume",
      label: "Keep structured resume data after the session"
    },
    {
      key: "allowProductAnalytics",
      label: "Allow product analytics events tied to resume activity"
    }
  ];

  async function handleClearData() {
    setErrorMessage("");
    setStatusMessage("");

    try {
      await clearResumeData();
      setStatusMessage("Cleared the stored resume and tailoring session data.");
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  function handleClearHistory() {
    setErrorMessage("");
    clearSavedHistory();
    setStatusMessage("Cleared saved version history for this user.");
  }

  return (
    <AppShell title="Settings and privacy" description="Control structured data retention, delete uploads, and review audit events without hunting through hidden menus.">
      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Privacy preferences" eyebrow="Trust controls">
          <div className="mt-6 space-y-4">
            {preferenceItems.map((item) => (
              <label key={item.key} className="flex items-center justify-between gap-4 rounded-[1.35rem] border border-[var(--line)] bg-white/90 px-4 py-4">
                <span className="max-w-md text-sm font-semibold">{item.label}</span>
                <input
                  type="checkbox"
                  checked={state.privacyPreferences[item.key]}
                  onChange={(event) => updatePrivacyPreferences({ [item.key]: event.target.checked })}
                />
              </label>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" className="button-secondary" onClick={handleClearData}>
              Clear stored resume data
            </button>
            <button type="button" className="button-secondary" onClick={handleClearHistory}>
              Clear saved versions
            </button>
            {errorMessage ? (
              <span className="rounded-2xl bg-[rgba(190,18,60,0.08)] px-4 py-3 text-sm font-semibold text-[var(--danger)]">{errorMessage}</span>
            ) : null}
            {statusMessage ? (
              <span className="rounded-2xl bg-[rgba(15,118,110,0.08)] px-4 py-3 text-sm font-semibold text-[var(--success)]">
                {statusMessage}
              </span>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard title="Audit log snapshot" eyebrow="Recent events">
          <div className="mt-6 space-y-3">
            {(state.auditEvents.length
              ? state.auditEvents
              : state.resumeUpload.auditLogPreview.map((event, index) => ({
                  id: `preview-${index}`,
                  message: event.action,
                  createdAt: event.createdAt
                }))
            ).map((event) => (
              <div key={event.id} className="info-tile text-sm">
                <p className="font-semibold">{event.message}</p>
                <p className="muted mt-1 text-xs">{event.createdAt}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
