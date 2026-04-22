# ProofFit AI Prompt Design

## Goals

- Produce truthful rewrites only when evidence exists
- Preserve technical specificity for data roles
- Avoid copying the job description into the resume
- Label low-confidence suggestions clearly
- Make structured outputs easy to validate

## Prompt layers

1. Resume extraction prompt
   Converts uploaded text into structured resume JSON with evidence snippets.
2. Job description analysis prompt
   Extracts must-have skills, preferred skills, responsibilities, domain vocabulary, and seniority.
3. Evidence mapping prompt
   Maps resume snippets to job requirements without fabricating links.
4. Rewrite prompt
   Suggests bullet rewrites with proof, rationale, and confidence.
5. Scoring prompt
   Produces sub-scores plus explanations for terminology, evidence, ATS safety, readability, and domain fit.

## Guardrails

- The model must not invent metrics, technologies, or achievements
- Any unsupported requirement must be labeled as a gap
- If a rewrite introduces new facts or numbers, validation rejects it
- Resume output must remain ATS-safe and single-column
- Confidence is capped when support is partial or ambiguous

## Validation strategy

- Structured JSON schema response format
- Evidence coverage checks before saving a suggestion
- Numeric claim diffing between source and suggestion
- Unsupported term detection using domain packs and resume evidence
- ATS warning checks before export
