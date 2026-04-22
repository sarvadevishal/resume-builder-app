export function mapEvidenceToJobRequirements(structuredResume, jobDescriptionAnalysis) {
  const resumeItems = structuredResume.sections?.flatMap((section) => section.items) ?? [];
  const resumeText = resumeItems.join(" ").toLowerCase();

  const skills = jobDescriptionAnalysis.mustHaveSkills.map((skill) => ({
    requirement: skill,
    matched: resumeText.includes(skill.toLowerCase()),
    evidence: resumeItems.find((item) => item.toLowerCase().includes(skill.toLowerCase())) ?? null
  }));

  const responsibilities = jobDescriptionAnalysis.responsibilities.map((responsibility) => ({
    requirement: responsibility,
    evidence:
      resumeItems.find((item) =>
        responsibility
          .toLowerCase()
          .split(" ")
          .filter((token) => token.length > 4)
          .some((token) => item.toLowerCase().includes(token))
      ) ?? null
  }));

  return {
    skills,
    responsibilities,
    supportedRequirements: skills.filter((item) => item.matched).map((item) => item.requirement),
    unsupportedRequirements: skills.filter((item) => !item.matched).map((item) => item.requirement)
  };
}
