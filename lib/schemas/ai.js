export const structuredResumeSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    contactInfo: { type: "array", items: { type: "string" } },
    summary: { type: "array", items: { type: "string" } },
    skills: { type: "array", items: { type: "string" } },
    workExperience: { type: "array", items: { type: "string" } },
    education: { type: "array", items: { type: "string" } },
    certifications: { type: "array", items: { type: "string" } },
    projects: { type: "array", items: { type: "string" } }
  },
  required: ["contactInfo", "summary", "skills", "workExperience", "education", "certifications", "projects"]
};

export const jobDescriptionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    mustHaveSkills: { type: "array", items: { type: "string" } },
    preferredSkills: { type: "array", items: { type: "string" } },
    toolsPlatforms: { type: "array", items: { type: "string" } },
    domainKeywords: { type: "array", items: { type: "string" } },
    responsibilities: { type: "array", items: { type: "string" } },
    certifications: { type: "array", items: { type: "string" } },
    softSkills: { type: "array", items: { type: "string" } },
    seniority: { type: "string" }
  },
  required: [
    "mustHaveSkills",
    "preferredSkills",
    "toolsPlatforms",
    "domainKeywords",
    "responsibilities",
    "certifications",
    "softSkills",
    "seniority"
  ]
};

export const tailoringSuggestionsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    suggestions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          originalBullet: { type: "string" },
          suggestedBullet: { type: "string" },
          sourceResumeSnippet: { type: "string" },
          matchedJobDescriptionSnippet: { type: "string" },
          rewriteReason: { type: "string" },
          confidenceScore: { type: "number" }
        },
        required: [
          "originalBullet",
          "suggestedBullet",
          "sourceResumeSnippet",
          "matchedJobDescriptionSnippet",
          "rewriteReason",
          "confidenceScore"
        ]
      }
    }
  },
  required: ["suggestions"]
};

export const scoreSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    terminologyCoverage: { type: "number" },
    evidenceCoverage: { type: "number" },
    atsFormattingRisk: { type: "number" },
    readability: { type: "number" },
    domainFit: { type: "number" },
    seniorityAlignment: { type: "number" }
  },
  required: [
    "terminologyCoverage",
    "evidenceCoverage",
    "atsFormattingRisk",
    "readability",
    "domainFit",
    "seniorityAlignment"
  ]
};
