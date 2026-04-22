export function buildResumeExtractionPrompt(resumeText) {
  return `
Extract the following source resume into structured JSON:
- contactInfo
- summary
- skills
- workExperience
- education
- certifications
- projects

Requirements:
- Keep each extracted value grounded in the provided resume text.
- Do not infer missing details.
- Return empty arrays for missing sections.

Resume text:
${resumeText}
  `.trim();
}
