export function buildScorePrompt({ structuredResume, jobDescriptionAnalysis, suggestions, atsWarnings }) {
  return `
Score this tailored resume workflow across six dimensions:
- terminologyCoverage
- evidenceCoverage
- atsFormattingRisk
- readability
- domainFit
- seniorityAlignment

Requirements:
- Use the evidence map, suggestions, and ATS warnings.
- Scores should be transparent and grounded in the available information.
- Avoid producing a single magic score.

Structured resume:
${JSON.stringify(structuredResume, null, 2)}

Job description analysis:
${JSON.stringify(jobDescriptionAnalysis, null, 2)}

Suggestions:
${JSON.stringify(suggestions, null, 2)}

ATS warnings:
${JSON.stringify(atsWarnings, null, 2)}
  `.trim();
}
