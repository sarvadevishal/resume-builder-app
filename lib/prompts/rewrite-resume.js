export function buildResumeRewritePrompt({ structuredResume, jobDescriptionAnalysis, evidenceMap }) {
  return `
Suggest truthful, ATS-safe resume rewrites for this user.

Requirements:
- Rewrite only bullets that have direct source evidence.
- For each suggestion, include the source resume snippet and matched job description snippet.
- Never invent metrics, tools, certifications, employers, dates, or outcomes.
- Keep writing concise, natural, and professional.
- Do not copy the job description verbatim into the resume.

Structured resume:
${JSON.stringify(structuredResume, null, 2)}

Job description analysis:
${JSON.stringify(jobDescriptionAnalysis, null, 2)}

Evidence map:
${JSON.stringify(evidenceMap, null, 2)}
  `.trim();
}
