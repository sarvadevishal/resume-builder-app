import { findDomainMatches, inferPrimaryDomain } from "@/lib/constants/domain-packs";

function extractBullets(text = "") {
  return text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[•\-]\s*/, ""));
}

function pickPhrases(lines, pattern) {
  return lines.filter((line) => pattern.test(line));
}

export function analyzeJobDescription(jobDescriptionText = "") {
  const lines = extractBullets(jobDescriptionText);
  const domainMatches = findDomainMatches(jobDescriptionText);
  const matchedTerms = [...new Set(domainMatches.flatMap((pack) => pack.matches))];
  const mustHaveSkills = pickPhrases(lines, /(must|required|strong|expert|experience with|proficiency in)/i)
    .flatMap((line) => matchedTerms.filter((term) => line.toLowerCase().includes(term)))
    .filter(Boolean);
  const preferredSkills = pickPhrases(lines, /(preferred|nice to have|bonus|plus)/i)
    .flatMap((line) => matchedTerms.filter((term) => line.toLowerCase().includes(term)))
    .filter(Boolean);
  const responsibilities = pickPhrases(lines, /(build|own|design|lead|partner|improve|maintain|deliver|optimize)/i).slice(0, 8);
  const certifications = lines.filter((line) => /certif/i.test(line));
  const softSkills = lines.filter((line) => /(communication|stakeholder|collaboration|leadership|ownership)/i.test(line));
  const seniority = /staff/i.test(jobDescriptionText)
    ? "Staff"
    : /senior/i.test(jobDescriptionText)
      ? "Senior"
      : /lead/i.test(jobDescriptionText)
        ? "Lead"
        : "Mid-level";

  return {
    mustHaveSkills: [...new Set(mustHaveSkills)],
    preferredSkills: [...new Set(preferredSkills)],
    toolsPlatforms: matchedTerms.filter((term) => /(aws|glue|lambda|redshift|snowflake|bigquery|dbt|airflow|spark|terraform|kubernetes)/i.test(term)),
    domainKeywords: matchedTerms,
    responsibilities,
    certifications,
    softSkills,
    seniority,
    primaryDomain: inferPrimaryDomain(jobDescriptionText)
  };
}
