export function buildJobDescriptionPrompt(jobDescriptionText) {
  return `
Analyze this job description for a resume-tailoring system and return structured JSON with:
- mustHaveSkills
- preferredSkills
- toolsPlatforms
- domainKeywords
- responsibilities
- certifications
- softSkills
- seniority

Requirements:
- Keep terms close to the language in the job description.
- Separate hard requirements from nice-to-have items when possible.
- Avoid inventing requirements.

Job description:
${jobDescriptionText}
  `.trim();
}
