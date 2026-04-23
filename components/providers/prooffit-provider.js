"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  buildFinalStructuredResume,
  buildVersionFromSession,
  createDefaultState,
  createEmptyWorkflowState,
  isConfiguredForStripe,
  storageKey
} from "@/lib/prooffit-state";
import { buildDeletionPlan, createAuditEvent } from "@/lib/services/privacy-service";
import { createSupabaseBrowserClient } from "@/lib/services/supabase/browser";

const ProofFitAppContext = createContext(null);
const persistenceVersion = 1;
const defaultActivityState = {
  isUploadingResume: false,
  isAnalyzingJobDescription: false,
  isGeneratingTailoringSession: false,
  isExportingResume: false
};

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

function normalizeCurrentUser(user) {
  if (!user?.email) {
    return null;
  }

  return {
    email: user.email.trim().toLowerCase(),
    name:
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email.trim().split("@")[0].replace(/[._-]/g, " "),
    signedInAt: user.last_sign_in_at || new Date().toISOString()
  };
}

async function readErrorMessage(response, fallbackMessage) {
  try {
    const payload = await response.json();
    return payload.error || payload.message || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

function delay(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

async function fetchWithRetry(
  input,
  init,
  { retryStatuses = [404, 502, 503, 504], retries = 1, retryDelayMs = 350, timeoutMs = 20000 } = {}
) {
  let lastResponse = null;
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeoutHandle = window.setTimeout(() => controller.abort(new Error("Request timed out.")), timeoutMs);

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal
      });
      lastResponse = response;

      if (!retryStatuses.includes(response.status) || attempt === retries) {
        window.clearTimeout(timeoutHandle);
        return response;
      }
    } catch (error) {
      lastError = error;
      window.clearTimeout(timeoutHandle);

      if (attempt === retries) {
        if (error?.name === "AbortError") {
          throw new Error("The request took too long. Please try again.");
        }

        throw error;
      }
    }

    window.clearTimeout(timeoutHandle);

    await delay(retryDelayMs);
  }

  if (lastResponse) {
    return lastResponse;
  }

  throw lastError || new Error("Network request failed.");
}

function getPersistenceKey(email) {
  return `${storageKey}:${email.trim().toLowerCase()}`;
}

function getSessionPersistenceKey(email) {
  return `${storageKey}:session:${email.trim().toLowerCase()}`;
}

function readBrowserCookie(name) {
  if (typeof document === "undefined") {
    return "";
  }

  const encodedName = `${name}=`;
  const cookieValue = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(encodedName));

  if (!cookieValue) {
    return "";
  }

  return decodeURIComponent(cookieValue.slice(encodedName.length));
}

function buildPersistedSnapshot(state) {
  return {
    currentPlan: state.currentPlan,
    authProvider: state.authProvider,
    currentUser: state.currentUser,
    privacyPreferences: state.privacyPreferences,
    resumeUpload: state.resumeUpload,
    jobDescription: state.jobDescription,
    tailoringSession: state.tailoringSession,
    versionHistory: state.versionHistory,
    lastExport: state.lastExport,
    auditEvents: state.auditEvents
  };
}

function clearPersistedState(email) {
  if (typeof window === "undefined" || !email?.trim()) {
    return;
  }

  try {
    window.localStorage.removeItem(getPersistenceKey(email));
    window.sessionStorage.removeItem(getSessionPersistenceKey(email));
  } catch {
    // Ignore storage cleanup failures.
  }
}

function sanitizeStructuredSection(section) {
  if (!section?.name || !Array.isArray(section.items)) {
    return null;
  }

  return {
    name: String(section.name),
    items: section.items.filter((item) => typeof item === "string" && item.trim())
  };
}

function sanitizeStructuredResume(structuredResume) {
  if (!structuredResume || !Array.isArray(structuredResume.sections)) {
    return null;
  }

  const sections = structuredResume.sections.map(sanitizeStructuredSection).filter(Boolean);

  if (!sections.length) {
    return null;
  }

  return {
    ...structuredResume,
    sections
  };
}

function sanitizeTailoringSession(tailoringSession) {
  if (!tailoringSession || !Array.isArray(tailoringSession.suggestions) || !sanitizeStructuredResume(tailoringSession.structuredResume)) {
    return null;
  }

  return {
    ...tailoringSession,
    structuredResume: sanitizeStructuredResume(tailoringSession.structuredResume),
    suggestions: tailoringSession.suggestions
      .filter((suggestion) => typeof suggestion?.originalBullet === "string" && typeof suggestion?.suggestedBullet === "string")
      .map((suggestion, index) => ({
        ...suggestion,
        id: suggestion.id || `persisted-suggestion-${index + 1}`,
        decision: suggestion.decision || suggestion.defaultDecision || "accepted",
        manualBullet: suggestion.manualBullet || suggestion.suggestedBullet
      }))
  };
}

function sanitizePersistedSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") {
    return null;
  }

  const resumeUpload = snapshot.resumeUpload || {};
  const jobDescription = snapshot.jobDescription || {};

  return {
    ...snapshot,
    resumeUpload: {
      rawFileName: typeof resumeUpload.rawFileName === "string" ? resumeUpload.rawFileName : "",
      extractedText: typeof resumeUpload.extractedText === "string" ? resumeUpload.extractedText : "",
      structuredResume: sanitizeStructuredResume(resumeUpload.structuredResume),
      atsWarnings: Array.isArray(resumeUpload.atsWarnings) ? resumeUpload.atsWarnings : [],
      deletionPlan: resumeUpload.deletionPlan || null,
      auditLogPreview: Array.isArray(resumeUpload.auditLogPreview) ? resumeUpload.auditLogPreview : []
    },
    jobDescription: {
      company: typeof jobDescription.company === "string" ? jobDescription.company : "",
      role: typeof jobDescription.role === "string" ? jobDescription.role : "",
      text: typeof jobDescription.text === "string" ? jobDescription.text : "",
      analysis: jobDescription.analysis || null
    },
    tailoringSession: sanitizeTailoringSession(snapshot.tailoringSession),
    versionHistory: Array.isArray(snapshot.versionHistory)
      ? snapshot.versionHistory.filter((version) => version?.id && version?.company && version?.role)
      : [],
    auditEvents: Array.isArray(snapshot.auditEvents) ? snapshot.auditEvents : []
  };
}

function readPersistedSnapshot(email) {
  if (typeof window === "undefined" || !email?.trim()) {
    return null;
  }

  try {
    const rawValue = window.sessionStorage.getItem(getSessionPersistenceKey(email)) || window.localStorage.getItem(getPersistenceKey(email));

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue);
    const snapshot = parsedValue?.version === persistenceVersion ? parsedValue.state : parsedValue;
    return sanitizePersistedSnapshot(snapshot);
  } catch {
    return null;
  }
}

function buildStateForUser(user, persistedSnapshot, fallbackAuthProvider) {
  const baseState = createDefaultState();

  return {
    ...baseState,
    currentPlan: persistedSnapshot?.currentPlan || baseState.currentPlan,
    authProvider: persistedSnapshot?.authProvider || fallbackAuthProvider || baseState.authProvider,
    currentUser: {
      ...persistedSnapshot?.currentUser,
      ...user,
      email: user.email
    },
    privacyPreferences: {
      ...baseState.privacyPreferences,
      ...persistedSnapshot?.privacyPreferences
    },
    resumeUpload: {
      ...baseState.resumeUpload,
      ...persistedSnapshot?.resumeUpload
    },
    jobDescription: {
      ...baseState.jobDescription,
      ...persistedSnapshot?.jobDescription
    },
    tailoringSession: persistedSnapshot?.tailoringSession || null,
    versionHistory: Array.isArray(persistedSnapshot?.versionHistory) ? persistedSnapshot.versionHistory : [],
    lastExport: persistedSnapshot?.lastExport || null,
    auditEvents: Array.isArray(persistedSnapshot?.auditEvents) ? persistedSnapshot.auditEvents : []
  };
}

export function ProofFitProvider({ children }) {
  const [state, setState] = useState(createDefaultState);
  const [isHydratingAuth, setIsHydratingAuth] = useState(true);
  const [activity, setActivity] = useState(defaultActivityState);
  const generationRequestRef = useRef(null);
  const supabaseClient = useMemo(() => createSupabaseBrowserClient(), []);
  const supportsSupabaseAuth = Boolean(supabaseClient);

  function resetActivityState() {
    generationRequestRef.current = null;
    setActivity(defaultActivityState);
  }

  useEffect(() => {
    let isMounted = true;

    async function hydrateAuth() {
      if (!supabaseClient) {
        const demoEmail = readBrowserCookie("prooffit_demo_session");

        if (demoEmail && isMounted) {
          const demoUser = {
            email: demoEmail.trim().toLowerCase(),
            name: demoEmail.trim().split("@")[0].replace(/[._-]/g, " "),
            signedInAt: new Date().toISOString()
          };

          setState((current) => ({
            ...buildStateForUser(demoUser, readPersistedSnapshot(demoUser.email), current.authProvider || "password"),
            authMessage: current.authMessage
          }));
        }

        setIsHydratingAuth(false);
        return;
      }

      try {
        const {
          data: { user }
        } = await supabaseClient.auth.getUser();

        if (!isMounted) {
          return;
        }

        if (user?.email) {
          const nextUser = normalizeCurrentUser(user);
          document.cookie = `prooffit_demo_session=${encodeURIComponent(nextUser.email)}; path=/; max-age=604800; samesite=lax`;
          setState((current) => ({
            ...buildStateForUser(nextUser, readPersistedSnapshot(nextUser.email), current.authProvider || "supabase"),
            authMessage: current.authMessage
          }));
        }
      } catch {
        if (isMounted) {
          setState((current) => ({
            ...current,
            authMessage: current.authMessage || "We could not refresh the current session. Please sign in again."
          }));
        }
      } finally {
        if (isMounted) {
          setIsHydratingAuth(false);
        }
      }
    }

    hydrateAuth();

    const authSubscription = supabaseClient?.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      const nextUser = normalizeCurrentUser(session?.user || null);

      if (nextUser?.email) {
        document.cookie = `prooffit_demo_session=${encodeURIComponent(nextUser.email)}; path=/; max-age=604800; samesite=lax`;
        setState((current) => ({
          ...buildStateForUser(nextUser, readPersistedSnapshot(nextUser.email), current.authProvider || "supabase"),
          authMessage: current.authMessage
        }));
      } else {
        clearPersistedState(state.currentUser?.email);
        document.cookie = "prooffit_demo_session=; path=/; max-age=0; samesite=lax";
        setState((current) => ({
          ...createDefaultState(),
          authMessage: current.authMessage
        }));
      }
    });

    return () => {
      isMounted = false;
      authSubscription?.data.subscription.unsubscribe();
    };
  }, [state.currentUser?.email, supabaseClient]);

  useEffect(() => {
    if (typeof window === "undefined" || isHydratingAuth || !state.currentUser?.email) {
      return;
    }

    try {
      const persistedValue = JSON.stringify({
        version: persistenceVersion,
        state: buildPersistedSnapshot(state)
      });

      window.sessionStorage.setItem(getSessionPersistenceKey(state.currentUser.email), persistedValue);

      if (state.privacyPreferences.saveStructuredResume) {
        window.localStorage.setItem(getPersistenceKey(state.currentUser.email), persistedValue);
      } else {
        window.localStorage.removeItem(getPersistenceKey(state.currentUser.email));
      }
    } catch {
      // Ignore client persistence failures and keep the in-memory workflow usable.
    }
  }, [state, isHydratingAuth]);

  function resetWorkflowState(message, { preserveHistory = true } = {}) {
    resetActivityState();
    setState((current) => ({
      ...current,
      ...createEmptyWorkflowState(),
      versionHistory: preserveHistory ? current.versionHistory : [],
      authMessage: message || current.authMessage,
      auditEvents: appendAuditEvent(current, message || "Started a new tailoring workflow.")
    }));
  }

  async function signIn({ email, password, mode = "sign-in", provider = "password", nextPath = "/dashboard" }) {
    if (provider === "google") {
      if (!supabaseClient) {
        throw new Error("Google sign-in requires Supabase configuration and a Google provider setup.");
      }

      const origin = window.location.origin;
      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      return { redirecting: true };
    }

    if (!email?.trim()) {
      throw new Error("Enter an email address.");
    }

    if (!password?.trim()) {
      throw new Error("Enter a password.");
    }

    if (supabaseClient) {
      const credentials = {
        email: email.trim().toLowerCase(),
        password
      };

      const result =
        mode === "sign-up"
          ? await supabaseClient.auth.signUp(credentials)
          : await supabaseClient.auth.signInWithPassword(credentials);

      if (result.error) {
        throw new Error(result.error.message);
      }

      const nextUser = normalizeCurrentUser(result.data.user);
      if (!nextUser) {
        throw new Error(mode === "sign-up" ? "Check your email to confirm the account before signing in." : "Unable to complete sign-in.");
      }

      document.cookie = `prooffit_demo_session=${encodeURIComponent(nextUser.email)}; path=/; max-age=604800; samesite=lax`;

      setState((current) => {
        const nextState = buildStateForUser(nextUser, readPersistedSnapshot(nextUser.email), provider);
        return {
          ...nextState,
          authMessage: mode === "sign-up" ? "Account created successfully." : "Signed in successfully.",
          auditEvents: appendAuditEvent(nextState, `${mode === "sign-up" ? "Password sign-up" : "Password sign-in"} completed for ${nextUser.email}.`)
        };
      });

      return nextUser;
    }

    const nextUser = {
      email: email.trim().toLowerCase(),
      name: email.trim().split("@")[0].replace(/[._-]/g, " "),
      signedInAt: new Date().toISOString()
    };

    document.cookie = `prooffit_demo_session=${encodeURIComponent(nextUser.email)}; path=/; max-age=604800; samesite=lax`;

    setState(() => {
      const nextState = buildStateForUser(nextUser, readPersistedSnapshot(nextUser.email), provider);
      return {
        ...nextState,
        authMessage: mode === "sign-up" ? "Account created successfully." : "Signed in successfully.",
        auditEvents: appendAuditEvent(nextState, `Local ${mode === "sign-up" ? "sign-up" : "sign-in"} completed for ${nextUser.email}.`)
      };
    });

    return nextUser;
  }

  async function signOut() {
    const currentEmail = state.currentUser?.email;
    let signOutWarning = "";

    if (supabaseClient) {
      try {
        await supabaseClient.auth.signOut();
      } catch {
        signOutWarning = "Signed out locally. Refresh the page if your hosted session still appears active.";
      }
    }

    document.cookie = "prooffit_demo_session=; path=/; max-age=0; samesite=lax";
    clearPersistedState(currentEmail);
    resetActivityState();
    setState((current) => ({
      ...createDefaultState(),
      authMessage: signOutWarning || "Signed out successfully.",
      auditEvents: appendAuditEvent(current, "Signed out successfully.")
    }));
  }

  async function uploadResume({ file, text, saveStructuredData }) {
    setActivity((current) => ({
      ...current,
      isUploadingResume: true
    }));

    const formData = new FormData();
    if (file) {
      formData.append("file", file);
    }
    formData.append("text", text || "");
    formData.append("saveStructuredData", String(saveStructuredData));
    formData.append("deleteRawUploads", String(state.privacyPreferences.deleteRawUploads));

    try {
      const response = await fetchWithRetry(
        "/api/resumes/upload",
        {
          method: "POST",
          body: formData
        },
        {
          timeoutMs: 30000
        }
      );

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Resume upload failed."));
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
        tailoringSession: null,
        lastExport: null,
        privacyPreferences: {
          ...current.privacyPreferences,
          saveStructuredResume: saveStructuredData
        },
        auditEvents: appendAuditEvent(current, `Resume processed from ${file?.name || "pasted text"} with ${result.structuredResume.sections.length} detected sections.`)
      }));

      return result;
    } finally {
      setActivity((current) => ({
        ...current,
        isUploadingResume: false
      }));
    }
  }

  async function analyzeJobDescription({ text, company, role }) {
    if (!text?.trim()) {
      throw new Error("Paste a job description first.");
    }

    setActivity((current) => ({
      ...current,
      isAnalyzingJobDescription: true
    }));

    try {
      const response = await fetchWithRetry(
        "/api/job-descriptions/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            jobDescriptionText: text
          })
        },
        {
          timeoutMs: 15000
        }
      );

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Job description analysis failed."));
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
        tailoringSession: null,
        lastExport: null,
        auditEvents: appendAuditEvent(current, `Analyzed a target job description for ${role || current.jobDescription.role || "the selected role"}.`)
      }));

      return analysis;
    } finally {
      setActivity((current) => ({
        ...current,
        isAnalyzingJobDescription: false
      }));
    }
  }

  async function generateTailoringSession() {
    if (!state.resumeUpload.structuredResume) {
      throw new Error("Upload or paste a resume before generating suggestions.");
    }

    if (!state.jobDescription.text?.trim()) {
      throw new Error("Paste and analyze a job description before generating suggestions.");
    }

    if (!state.jobDescription.analysis) {
      throw new Error("Analyze the job description before generating a tailoring session.");
    }

    if (generationRequestRef.current) {
      return generationRequestRef.current;
    }

    setActivity((current) => ({
      ...current,
      isGeneratingTailoringSession: true
    }));

    generationRequestRef.current = (async () => {
      try {
        const response = await fetchWithRetry(
          "/api/tailoring/sessions",
          {
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
          },
          {
            timeoutMs: 45000
          }
        );

        if (!response.ok) {
          throw new Error(await readErrorMessage(response, "Tailoring session generation failed."));
        }

        const session = await response.json();
        const normalizedSession = {
          ...session,
          suggestions: (session.suggestions || []).map((suggestion) => ({
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
      } finally {
        generationRequestRef.current = null;
        setActivity((current) => ({
          ...current,
          isGeneratingTailoringSession: false
        }));
      }
    })();

    return generationRequestRef.current;
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

  async function exportResume(input) {
    const finalStructuredResume = buildFinalStructuredResume(state.tailoringSession);

    if (!finalStructuredResume) {
      throw new Error("There is no tailored resume ready to export.");
    }

    setActivity((current) => ({
      ...current,
      isExportingResume: true
    }));

    const exportOptions = typeof input === "string" ? { format: input } : input || {};
    const format = exportOptions.format || "pdf";

    try {
      const response = await fetchWithRetry(
        "/api/exports",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            format,
            exportOptions,
            structuredResume: finalStructuredResume,
            sessionContext: {
              company: state.jobDescription.company,
              role: state.jobDescription.role,
              jobDescriptionAnalysis: state.jobDescription.analysis
            }
          })
        },
        {
          timeoutMs: 30000
        }
      );

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Export failed."));
      }

      const blob = await response.blob();
      const extension = format === "docx" ? "docx" : format === "doc" ? "doc" : "pdf";
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
        versionHistory: [
          buildVersionFromSession({
            session: current.tailoringSession,
            resumeUpload: current.resumeUpload,
            jobDescription: current.jobDescription,
            privacyPreferences: current.privacyPreferences
          }),
          ...current.versionHistory
        ].slice(0, 12),
        lastExport: {
          format,
          mode: exportOptions.mode || "ats",
          exportedAt: new Date().toLocaleString("en-US")
        },
        auditEvents: appendAuditEvent(current, `Exported the current resume as ${extension.toUpperCase()}.`)
      }));
    } finally {
      setActivity((current) => ({
        ...current,
        isExportingResume: false
      }));
    }
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
    resetActivityState();
    const response = await fetchWithRetry("/api/privacy/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        rawFileName: state.resumeUpload.rawFileName || "pasted-resume.txt",
        sessionId: state.tailoringSession?.id || "local-session"
      })
    });

    let result = null;

    if (response.ok) {
      result = await response.json();
    } else {
      result = {
        deletionPlan: buildDeletionPlan({
          rawFileName: state.resumeUpload.rawFileName || "pasted-resume.txt",
          structuredResumeSaved: false,
          deleteRawFile: state.privacyPreferences.deleteRawUploads
        }),
        auditEvents: [
          createAuditEvent("raw_file_deleted", { rawFileName: state.resumeUpload.rawFileName || "pasted-resume.txt" }),
          createAuditEvent("structured_resume_deleted", { sessionId: state.tailoringSession?.id || "local-session" })
        ]
      };
    }

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
      jobDescription: {
        company: "",
        role: "",
        text: "",
        analysis: null
      },
      tailoringSession: null,
      lastExport: null,
      auditEvents: appendAuditEvent(
        current,
        response.ok
          ? "Cleared the current resume, extracted text, and tailoring session data."
          : "Cleared the local resume state after the deletion endpoint was unavailable."
      )
    }));
  }

  function startNewWorkflow() {
    resetWorkflowState("Started a new tailoring workflow.");
  }

  function clearSavedHistory() {
    setState((current) => ({
      ...current,
      versionHistory: [],
      auditEvents: appendAuditEvent(current, "Cleared saved version history for the current user.")
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

    if (!state.currentUser?.email) {
      throw new Error("Sign in before starting checkout.");
    }

    const response = await fetchWithRetry("/api/stripe/checkout", {
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
      throw new Error(await readErrorMessage(response, "Unable to start checkout."));
    }

    const result = await response.json();
    window.location.href = result.url;
  }

  function restoreVersion(versionId) {
    const restored = state.versionHistory.find((version) => version.id === versionId);

    if (!restored) {
      return;
    }

    setState((current) => {
      if (!restored.snapshot) {
        return {
          ...current,
          jobDescription: {
            ...current.jobDescription,
            company: restored.company,
            role: restored.role
          },
          auditEvents: appendAuditEvent(current, `Restored the metadata for ${restored.role} at ${restored.company}.`)
        };
      }

      return {
        ...current,
        resumeUpload: restored.snapshot.resumeUpload,
        jobDescription: restored.snapshot.jobDescription,
        tailoringSession: restored.snapshot.tailoringSession,
        lastExport: current.lastExport,
        auditEvents: appendAuditEvent(current, `Restored the saved workspace for ${restored.role} at ${restored.company}.`)
      };
    });
  }

  const value = {
    state,
    activity,
    isHydratingAuth,
    supportsSupabaseAuth,
    isDemoMode: !supportsSupabaseAuth,
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
    startNewWorkflow,
    clearSavedHistory,
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
