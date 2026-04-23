import { getOpenAiClient } from "@/lib/openai/client";
import { buildSystemPrompt } from "@/lib/prompts/system";
import { buildResumeRewritePrompt } from "@/lib/prompts/rewrite-resume";
import { tailoringSuggestionsSchema } from "@/lib/schemas/ai";
import { mapEvidenceToJobRequirements } from "@/lib/services/evidence-mapper";
import { analyzeAtsSafety } from "@/lib/services/ats-safety";
import { scoreTailoringSession } from "@/lib/services/scoring-engine";
import { analyzeJobDescription } from "@/lib/services/job-description-analyzer";
import { normalizeConfidenceScore, validateSuggestionSafety } from "@/lib/validators/guardrails";

function buildCandidateBullets(structuredResume) {
  const sectionPriority = ["experience", "projects", "summary", "skills", "awards", "publications", "volunteer experience"];
  const rankedSections = [...(structuredResume.sections || [])].sort((left, right) => {
    const leftIndex = sectionPriority.indexOf(left.name.toLowerCase());
    const rightIndex = sectionPriority.indexOf(right.name.toLowerCase());
    const normalizedLeft = leftIndex === -1 ? sectionPriority.length : leftIndex;
    const normalizedRight = rightIndex === -1 ? sectionPriority.length : rightIndex;
    return normalizedLeft - normalizedRight;
  });

  return rankedSections.flatMap((section) =>
    (section.items || []).map((item, itemIndex) => ({
      text: item,
      itemIndex,
      sectionIndex: structuredResume.sections.findIndex((candidate) => candidate === section),
      sectionName: section.name
    }))
  );
}

function attachSuggestionLocations(rawSuggestions, candidateBullets) {
  const remainingCandidates = [...candidateBullets];

  return rawSuggestions.map((suggestion) => {
    const candidateIndex = remainingCandidates.findIndex((candidate) => candidate.text === suggestion.originalBullet);
    const matchedCandidate = candidateIndex >= 0 ? remainingCandidates.splice(candidateIndex, 1)[0] : null;

    return {
      ...suggestion,
      itemIndex: matchedCandidate?.itemIndex,
      sectionIndex: matchedCandidate?.sectionIndex,
      sectionName: matchedCandidate?.sectionName
    };
  });
}

function buildHeuristicSuggestions(candidateBullets, jobDescriptionAnalysis, evidenceMap) {
  return candidateBullets.slice(0, 6).map((candidate, index) => {
    const responsibilityMatch =
      evidenceMap.responsibilities.find((item) => item.evidence === candidate.text)?.requirement ??
      jobDescriptionAnalysis.responsibilities[index] ??
      "Align the bullet more clearly with the target role.";

    const suggestedBullet = /partnered/i.test(candidate.text)
      ? `${candidate.text.replace(/\.$/, "")}, making the cross-functional impact easier to scan.`
      : `${candidate.text.replace(/\.$/, "")}, with clearer emphasis on ownership and scope.`;

    return {
      id: `heuristic-${index + 1}`,
      label: `Suggested edit ${index + 1}`,
      originalBullet: candidate.text,
      suggestedBullet,
      sourceResumeSnippet: candidate.text,
      matchedJobDescriptionSnippet: responsibilityMatch,
      rewriteReason: "The bullet already contains supporting evidence and can be made more legible for the target role without adding new facts.",
      confidenceScore: 0.72,
      itemIndex: candidate.itemIndex,
      sectionIndex: candidate.sectionIndex,
      sectionName: candidate.sectionName
    };
  });
}

async function maybeGenerateAiSuggestions({ structuredResume, jobDescriptionAnalysis, evidenceMap }) {
  const client = getOpenAiClient();

  if (!client) {
    return null;
  }

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5",
      instructions: buildSystemPrompt(),
      input: buildResumeRewritePrompt({ structuredResume, jobDescriptionAnalysis, evidenceMap }),
      text: {
        format: {
          type: "json_schema",
          name: "tailoring_suggestions",
          strict: true,
          schema: tailoringSuggestionsSchema
        }
      }
    });

    const parsed = JSON.parse(response.output_text);
    return parsed.suggestions;
  } catch (error) {
    console.error("OpenAI tailoring fallback activated:", error);
    return null;
  }
}

function buildGaps(jobDescriptionAnalysis, evidenceMap) {
  return evidenceMap.unsupportedRequirements.map((requirement) => ({
    name: requirement,
    severity: "high",
    nextStep: `Keep ${requirement} as a gap unless the user confirms real evidence that belongs in the resume.`
  }));
}

export async function runTailoringSession({ structuredResume, jobDescriptionText, company = "Target company", role = "Target role" }) {
  if (!structuredResume?.sections?.length) {
    throw new Error("Upload a resume with readable sections before generating a tailoring session.");
  }

  if (!jobDescriptionText?.trim()) {
    throw new Error("Paste a job description before generating a tailoring session.");
  }

  const jobDescriptionAnalysis = analyzeJobDescription(jobDescriptionText);
  const evidenceMap = mapEvidenceToJobRequirements(structuredResume, jobDescriptionAnalysis);
  const candidateBullets = buildCandidateBullets(structuredResume);
  const aiSuggestions = await maybeGenerateAiSuggestions({ structuredResume, jobDescriptionAnalysis, evidenceMap });
  const rawSuggestions = attachSuggestionLocations(aiSuggestions ?? buildHeuristicSuggestions(candidateBullets, jobDescriptionAnalysis, evidenceMap), candidateBullets);
  const resumeText = structuredResume.sections?.flatMap((section) => section.items).join(" ") ?? "";

  const suggestions = rawSuggestions.map((suggestion, index) => {
    const safety = validateSuggestionSafety({
      originalBullet: suggestion.originalBullet,
      suggestedBullet: suggestion.suggestedBullet,
      sourceResumeSnippet: suggestion.sourceResumeSnippet,
      matchedJobDescriptionSnippet: suggestion.matchedJobDescriptionSnippet,
      resumeText
    });

    return {
      id: suggestion.id ?? `suggestion-${index + 1}`,
      label: suggestion.label ?? `Suggested edit ${index + 1}`,
      originalBullet: suggestion.originalBullet,
      suggestedBullet: suggestion.suggestedBullet,
      whyItChanged: suggestion.rewriteReason,
      sourceResumeSnippet: suggestion.sourceResumeSnippet,
      matchedJobDescriptionSnippet: suggestion.matchedJobDescriptionSnippet,
      confidenceScore: normalizeConfidenceScore(suggestion.confidenceScore, safety),
      supportLabel: safety.safe ? "Supported by resume" : `Needs manual confirmation: ${safety.reasons.join(", ")}`,
      safe: safety.safe,
      safetyReasons: safety.reasons,
      defaultDecision: safety.safe ? "accepted" : "manual"
    };
  });

  const atsResult = analyzeAtsSafety({ resumeText, structuredResume });
  const scores = scoreTailoringSession({
    structuredResume,
    jobDescriptionAnalysis,
    evidenceMap,
    suggestions,
    atsResult
  });

  return {
    company,
    role,
    structuredResume,
    originalBullets: candidateBullets.map((candidate) => candidate.text),
    jobDescriptionAnalysis,
    suggestions,
    gaps: buildGaps(jobDescriptionAnalysis, evidenceMap),
    atsWarnings: atsResult.warnings,
    scores
  };
}
