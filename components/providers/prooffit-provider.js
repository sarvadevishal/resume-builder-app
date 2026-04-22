"use client";

import { createContext, useContext, useState } from "react";
import {
  buildFinalStructuredResume,
  buildVersionFromSession,
  createDefaultState,
  isConfiguredForStripe
} from "@/lib/prooffit-state";

const ProofFitAppContext = createContext(null);

function appendAuditEvent(state, message) {
  return [
    {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      message,
      createdAt: new Date().toLocaleString("en-US")
    },
    ...state.auditEvents
  ].slice(0, 20);
}

function slugifyFragment(value, fallback) {
  const normalized = value?.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return normalized || fallback;
}

export function ProofFitProvider({ children }) {
  const [state, setState] = useState(createDefaultState);

  async function signIn({ email, password, mode = "sign-in", provider = "password" }) {
    if (!email?.trim()) {
      throw new Error("Enter an email address.");
    }

    if (provider === "password" && !password?.trim()) {
      throw new Error("Enter a password.");
    }

    const nextUser = {
      email: email.trim().toLowerCase(),
      name: email.trim().split("@")[0].replace(/[._-]/g, " "),
      signedInAt: new Date().toISOString()
    };

    document.cookie = `prooffit_demo_session=${encodeURIComponent(nextUser.email)}; path=/; max-age=604800; samesite=lax`;

    setState((current) => ({
      ...current,
      currentUser: nextUser,
      authProvider: provider,
      authMessage: mode === "sign-up" ? "Account created successfully." : "Signed in successfully.",
      auditEvents: appendAuditEvent(current, `${provider === "google" ? "Google" : "Password"} ${mode === "sign-up" ? "sign-up" : "sign-in"} completed for ${nextUser.email}.`)
    }));

    return nextUser;
  }

  function signOut() {
    document.cookie = "prooffit_demo_session=; path=/; max-age=0; samesite=lax";
    setState((current) => ({
      ...current,
      currentUser: null,
      authProvider: null,
      authMessage: "Signed out successfully.",
      auditEvents: appendAuditEvent(current, "Signed out of the local demo session.")
    }));
  }

  async function uploadResume({ file, text, saveStructuredData }) {
    const formData = new FormData();
    if (file) {
      formData.append("file", file);
    }
    formData.append("text", text || "");
    formData.append("saveStructuredData", String(saveStructuredData));

    const response = await fetch("/api/resumes/upload", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error("Resume upload failed.");
    }

    const result = await response.json();

    setState((current) => ({
      ...current,
      resumeUpload: {
        rawFileName: file?.name || "pasted-resume.txt",
        extractedText: result.extractedText,
        structuredResume: result.structuredResume,
        atsWarnings: result.atsWarnings,
        deletionPlan: result.deletionPlan,
        auditLogPreview: result.auditLogPreview
      },
      privacyPreferences: {
        ...current.privacyPreferences,
        saveStructuredResume: saveStructuredData
      },
      auditEvents: appendAuditEvent(current, `Resume processed from ${file?.name || "pasted text"} with ${result.structuredResume.sections.length} detected sections.`)
    }));

    return result;
  }

  async function analyzeJobDescription({ text, company, role }) {
    if (!text?.trim()) {
      throw new Error("Paste a job description first.");
    }

    const response = await fetch("/api/job-descriptions/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        jobDescriptionText: text
      })
    });

    if (!response.ok) {
      throw new Error("Job description analysis failed.");
    }

    const analysis = await response.json();

    setState((current) => ({
      ...current,
      jobDescription: {
        company: company?.trim() || current.jobDescription.company,
        role: role?.trim() || current.jobDescription.role,
        text,
        analysis
      },
      auditEvents: appendAuditEvent(current, `Analyzed a target job description for ${role || current.jobDescription.role}.`)
    }));

    return analysis;
  }

  async function generateTailoringSession() {
    if (!state.resumeUpload.structuredResume) {
      throw new Error("Upload or paste a resume before generating suggestions.");
    }

    if (!state.jobDescription.text?.trim()) {
      throw new Error("Analyze a job description before generating suggestions.");
    }

    const response = await fetch("/api/tailoring/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        structuredResume: state.resumeUpload.structuredResume,
        jobDescriptionText: state.jobDescription.text,
        company: state.jobDescription.company,
        role: state.jobDescription.role
      })
    });

    if (!response.ok) {
      throw new Error("Tailoring session generation failed.");
    }

    const session = await response.json();
    const normalizedSession = {
      ...session,
      suggestions: session.suggestions.map((suggestion) => ({
        ...suggestion,
        decision: suggestion.defaultDecision,
        manualBullet: suggestion.suggestedBullet
      }))
    };

    setState((current) => ({
      ...current,
      tailoringSession: normalizedSession,
      auditEvents: appendAuditEvent(current, `Generated proof-backed suggestions for ${session.role} at ${session.company}.`)
    }));

    return normalizedSession;
  }

  function updateSuggestionDecision(id, decision) {
    setState((current) => ({
      ...current,
      tailoringSession: {
        ...current.tailoringSession,
        suggestions: current.tailoringSession.suggestions.map((suggestion) =>
          suggestion.id === id
            ? {
                ...suggestion,
                decision
              }
            : suggestion
        )
      }
    }));
  }

  function updateManualBullet(id, manualBullet) {
    setState((current) => ({
      ...current,
      tailoringSession: {
        ...current.tailoringSession,
        suggestions: current.tailoringSession.suggestions.map((suggestion) =>
          suggestion.id === id
            ? {
                ...suggestion,
                manualBullet,
                decision: "manual"
              }
            : suggestion
        )
      }
    }));
  }

  async function exportResume(format) {
    const finalStructuredResume = buildFinalStructuredResume(state.tailoringSession);

    if (!finalStructuredResume) {
      throw new Error("There is no tailored resume ready to export.");
    }

    const response = await fetch("/api/exports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        format,
        structuredResume: finalStructuredResume
      })
    });

    if (!response.ok) {
      throw new Error("Export failed.");
    }

    const blob = await response.blob();
    const extension = format === "docx" ? "docx" : "pdf";
    const objectUrl = window.URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = objectUrl;
    downloadLink.download = `prooffit-${slugifyFragment(state.jobDescription.company, "target-company")}-${slugifyFragment(state.jobDescription.role, "target-role")}.${extension}`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    window.URL.revokeObjectURL(objectUrl);

    setState((current) => ({
      ...current,
      versionHistory: [buildVersionFromSession(current.tailoringSession), ...current.versionHistory].slice(0, 12),
      lastExport: {
        format,
        exportedAt: new Date().toLocaleString("en-US")
      },
      auditEvents: appendAuditEvent(current, `Exported the current resume as ${extension.toUpperCase()}.`)
    }));
  }

  async function copyCurrentResumeSection() {
    const finalStructuredResume = buildFinalStructuredResume(state.tailoringSession);
    const experienceSection = finalStructuredResume?.sections.find((section) => section.name.toLowerCase() === "experience");

    if (!experienceSection) {
      throw new Error("No tailored experience section is available to copy.");
    }

    const textToCopy = experienceSection.items.join("\n");

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(textToCopy);
    } else {
      const fallbackElement = document.createElement("textarea");
      fallbackElement.value = textToCopy;
      fallbackElement.setAttribute("readonly", "true");
      fallbackElement.style.position = "absolute";
      fallbackElement.style.left = "-9999px";
      document.body.appendChild(fallbackElement);
      fallbackElement.select();
      document.execCommand("copy");
      fallbackElement.remove();
    }

    setState((current) => ({
      ...current,
      auditEvents: appendAuditEvent(current, "Copied the tailored experience section to the clipboard.")
    }));
  }

  function updatePrivacyPreferences(nextPreferences) {
    setState((current) => ({
      ...current,
      privacyPreferences: {
        ...current.privacyPreferences,
        ...nextPreferences
      },
      auditEvents: appendAuditEvent(current, "Updated privacy preferences.")
    }));
  }

  async function clearResumeData() {
    const response = await fetch("/api/privacy/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        rawFileName: state.resumeUpload.rawFileName || "pasted-resume.txt",
        sessionId: state.tailoringSession?.id || "local-session"
      })
    });

    if (!response.ok) {
      throw new Error("Unable to clear stored resume data.");
    }

    const result = await response.json();

    setState((current) => ({
      ...current,
      resumeUpload: {
        rawFileName: "",
        extractedText: "",
        structuredResume: null,
        atsWarnings: [],
        deletionPlan: result.deletionPlan,
        auditLogPreview: result.auditEvents
      },
      tailoringSession: null,
      auditEvents: appendAuditEvent(current, "Cleared the current resume, extracted text, and tailoring session data.")
    }));
  }

  async function choosePlan(planName) {
    if (planName === "team") {
      window.location.href = "mailto:sales@prooffit.ai?subject=ProofFit%20AI%20Team%20Plan";
      return;
    }

    if (planName === "free" || !isConfiguredForStripe()) {
      setState((current) => ({
        ...current,
        currentPlan: planName,
        auditEvents: appendAuditEvent(current, `Selected the ${planName} plan in local mode.`)
      }));
      return;
    }

    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        customerEmail: state.currentUser?.email,
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO
      })
    });

    if (!response.ok) {
      throw new Error("Unable to start checkout.");
    }

    const result = await response.json();
    window.location.href = result.url;
  }

  function restoreVersion(versionId) {
    const restored = state.versionHistory.find((version) => version.id === versionId);

    if (!restored) {
      return;
    }

    setState((current) => ({
      ...current,
      jobDescription: {
        ...current.jobDescription,
        company: restored.company,
        role: restored.role
      },
      auditEvents: appendAuditEvent(current, `Restored the metadata for ${restored.role} at ${restored.company}.`)
    }));
  }

  const value = {
    state,
    signIn,
    signOut,
    uploadResume,
    analyzeJobDescription,
    generateTailoringSession,
    updateSuggestionDecision,
    updateManualBullet,
    exportResume,
    copyCurrentResumeSection,
    updatePrivacyPreferences,
    clearResumeData,
    choosePlan,
    restoreVersion
  };

  return <ProofFitAppContext.Provider value={value}>{children}</ProofFitAppContext.Provider>;
}

export function useProofFitApp() {
  const context = useContext(ProofFitAppContext);

  if (!context) {
    throw new Error("useProofFitApp must be used inside ProofFitProvider.");
  }

  return context;
}
