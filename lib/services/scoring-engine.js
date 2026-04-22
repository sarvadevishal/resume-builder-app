function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function scoreTailoringSession({
  structuredResume,
  jobDescriptionAnalysis,
  evidenceMap,
  suggestions,
  atsResult
}) {
  const totalRequirements = Math.max(1, jobDescriptionAnalysis.mustHaveSkills.length);
  const terminologyCoverage = clampScore(
    ((evidenceMap.supportedRequirements.length + jobDescriptionAnalysis.toolsPlatforms.length * 0.5) / totalRequirements) * 100
  );
  const evidenceCoverage = clampScore((suggestions.filter((item) => item.safe).length / Math.max(1, suggestions.length)) * 100);
  const atsFormattingRisk = clampScore(atsResult.riskScore);
  const readability = clampScore(
    78 +
      Math.max(0, suggestions.length - 1) * 4 -
      suggestions.filter((item) => item.confidenceScore < 0.5).length * 8
  );
  const domainFit = clampScore((jobDescriptionAnalysis.domainKeywords.filter((term) => evidenceMap.supportedRequirements.includes(term)).length / totalRequirements) * 100 + 55);
  const seniorityAlignment = clampScore(
    /senior|staff|lead/i.test(jobDescriptionAnalysis.seniority)
      ? 75 + Math.min(20, suggestions.length * 3)
      : 70 + Math.min(15, suggestions.length * 2)
  );

  return [
    {
      id: "terminology",
      label: "Terminology coverage",
      score: terminologyCoverage,
      detail: "Measures overlap between the job description vocabulary and supported resume terminology."
    },
    {
      id: "evidence",
      label: "Evidence coverage",
      score: evidenceCoverage,
      detail: "Measures how much of the suggestion set is backed by explicit resume evidence."
    },
    {
      id: "ats",
      label: "ATS formatting risk",
      score: atsFormattingRisk,
      detail: "Higher scores indicate fewer parser risks in layout, headers, and date formatting."
    },
    {
      id: "readability",
      label: "Readability",
      score: readability,
      detail: "Rewards concise, natural rewrites that preserve specificity."
    },
    {
      id: "domain",
      label: "Domain fit",
      score: domainFit,
      detail: "Reflects how well the resume lines up with the target role's technical domain."
    },
    {
      id: "seniority",
      label: "Seniority alignment",
      score: seniorityAlignment,
      detail: "Estimates how well the current resume language matches the role level."
    }
  ];
}
