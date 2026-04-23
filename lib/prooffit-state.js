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

function buildSuggestionFallbackQueue(suggestions = []) {
  const queue = new Map();

  suggestions.forEach((suggestion) => {
    const key = suggestion.originalBullet?.trim();

    if (!key) {
      return;
    }

    if (!queue.has(key)) {
      queue.set(key, []);
    }

    queue.get(key).push(suggestion);
  });

  return queue;
}

export function buildFinalStructuredResume(session) {
  if (!session?.structuredResume) {
    return null;
  }

  const sectionSuggestionMap = new Map();
  const fallbackQueue = buildSuggestionFallbackQueue(session.suggestions);

  (session.suggestions || []).forEach((suggestion) => {
    const key =
      Number.isInteger(suggestion.sectionIndex) && Number.isInteger(suggestion.itemIndex)
        ? `${suggestion.sectionIndex}:${suggestion.itemIndex}`
        : null;

    if (key) {
      sectionSuggestionMap.set(key, suggestion);
    }
  });

  const nextSections = session.structuredResume.sections.map((section) => {
    const sectionIndex = session.structuredResume.sections.findIndex((candidate) => candidate === section);
    const items = section.items.map((item, itemIndex) => {
      const mappedSuggestion = sectionSuggestionMap.get(`${sectionIndex}:${itemIndex}`);

      if (mappedSuggestion) {
        return getEffectiveSuggestionBullet(mappedSuggestion);
      }

      const fallbackSuggestions = fallbackQueue.get(item?.trim());
      const fallbackSuggestion = fallbackSuggestions?.shift();
      return fallbackSuggestion ? getEffectiveSuggestionBullet(fallbackSuggestion) : item;
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

export function buildVersionFromSession({ session, resumeUpload, jobDescription, privacyPreferences }) {
  const canPersistSnapshot = Boolean(privacyPreferences?.saveStructuredResume);

  return {
    id: `version-${Date.now()}`,
    company: session.company,
    role: session.role,
    acceptedChanges: session.suggestions.filter((suggestion) => suggestion.decision === "accepted" || suggestion.decision === "manual").length,
    updatedAt: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }),
    snapshot: canPersistSnapshot
      ? {
          resumeUpload,
          jobDescription,
          tailoringSession: session
        }
      : null
  };
}

export function isConfiguredForStripe() {
  return Boolean(process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO && process.env.NEXT_PUBLIC_APP_URL);
}

export function getWorkflowStepState(state) {
  return {
    hasResume: Boolean(state.resumeUpload.structuredResume),
    hasJobDescriptionAnalysis: Boolean(state.jobDescription.analysis),
    hasTailoringSession: Boolean(state.tailoringSession),
    hasExport: Boolean(state.lastExport)
  };
}
