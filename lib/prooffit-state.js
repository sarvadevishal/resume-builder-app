import { demoJobDescriptionAnalysis, demoSession, demoVersionHistory } from "@/lib/data/demo-session";

export const storageKey = "prooffit-ai-state";

export function createDefaultState() {
  return {
    currentUser: null,
    authProvider: null,
    currentPlan: "free",
    authMessage: "",
    resumeUpload: {
      rawFileName: "",
      extractedText: "",
      structuredResume: demoSession.structuredResume,
      atsWarnings: demoSession.atsWarnings,
      deletionPlan: null,
      auditLogPreview: []
    },
    jobDescription: {
      company: demoSession.company,
      role: demoSession.role,
      text: [
        "Senior Data Engineer needed.",
        "Must have SQL, Python, Airflow, dbt, and Snowflake.",
        "Own orchestration and warehouse reliability.",
        "Partner with analytics teams on trusted datasets."
      ].join("\n"),
      analysis: demoJobDescriptionAnalysis
    },
    tailoringSession: {
      ...demoSession,
      suggestions: demoSession.suggestions.map((suggestion) => ({
        ...suggestion,
        decision: suggestion.defaultDecision,
        manualBullet: suggestion.suggestedBullet
      }))
    },
    versionHistory: demoVersionHistory,
    privacyPreferences: {
      deleteRawUploads: true,
      saveStructuredResume: false,
      allowProductAnalytics: true
    },
    auditEvents: [],
    lastExport: null
  };
}

export function getExperienceSection(structuredResume) {
  return structuredResume.sections.find((section) => section.name.toLowerCase() === "experience");
}

export function getEffectiveSuggestionBullet(suggestion) {
  if (suggestion.decision === "accepted") {
    return suggestion.suggestedBullet;
  }

  if (suggestion.decision === "manual" && suggestion.manualBullet?.trim()) {
    return suggestion.manualBullet.trim();
  }

  return suggestion.originalBullet;
}

export function buildFinalStructuredResume(session) {
  if (!session?.structuredResume) {
    return null;
  }

  const nextSections = session.structuredResume.sections.map((section) => {
    if (section.name.toLowerCase() !== "experience") {
      return section;
    }

    const items = session.originalBullets.map((bullet) => {
      const suggestion = session.suggestions.find((item) => item.originalBullet === bullet);
      return suggestion ? getEffectiveSuggestionBullet(suggestion) : bullet;
    });

    return {
      ...section,
      items
    };
  });

  return {
    ...session.structuredResume,
    sections: nextSections
  };
}

export function buildVersionFromSession(session) {
  return {
    id: `version-${Date.now()}`,
    company: session.company,
    role: session.role,
    acceptedChanges: session.suggestions.filter((suggestion) => suggestion.decision === "accepted" || suggestion.decision === "manual").length,
    updatedAt: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  };
}

export function isConfiguredForStripe() {
  return Boolean(process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO);
}
