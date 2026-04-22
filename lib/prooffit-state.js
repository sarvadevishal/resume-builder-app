export const storageKey = "prooffit-ai-state";

export function createEmptyJobDescriptionAnalysis() {
  return {
    mustHaveSkills: [],
    preferredSkills: [],
    toolsPlatforms: [],
    domainKeywords: [],
    responsibilities: [],
    certifications: [],
    softSkills: [],
    seniority: "",
    primaryDomain: ""
  };
}

export function createEmptyWorkflowState() {
  return {
    resumeUpload: {
      rawFileName: "",
      extractedText: "",
      structuredResume: null,
      atsWarnings: [],
      deletionPlan: null,
      auditLogPreview: []
    },
    jobDescription: {
      company: "",
      role: "",
      text: "",
      analysis: null
    },
    tailoringSession: null,
    versionHistory: [],
    lastExport: null
  };
}

export function createDefaultState() {
  return {
    currentUser: null,
    authProvider: null,
    currentPlan: "free",
    authMessage: "",
    ...createEmptyWorkflowState(),
    privacyPreferences: {
      deleteRawUploads: true,
      saveStructuredResume: false,
      allowProductAnalytics: true
    },
    auditEvents: []
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

export function getWorkflowStepState(state) {
  return {
    hasResume: Boolean(state.resumeUpload.structuredResume),
    hasJobDescriptionAnalysis: Boolean(state.jobDescription.analysis),
    hasTailoringSession: Boolean(state.tailoringSession),
    hasExport: Boolean(state.lastExport)
  };
}
