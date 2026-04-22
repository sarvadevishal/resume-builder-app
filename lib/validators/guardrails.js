import { getAllDomainTerms } from "@/lib/constants/domain-packs";

function extractNumbers(text = "") {
  return text.match(/\d[\d,.%+]*/g) ?? [];
}

function normalizeText(text = "") {
  return text.toLowerCase().replace(/[^a-z0-9+/.\s-]/g, " ");
}

function unique(values) {
  return [...new Set(values)];
}

export function detectNewNumbers({ originalBullet, suggestedBullet, sourceResumeSnippet }) {
  const supported = unique([
    ...extractNumbers(originalBullet),
    ...extractNumbers(sourceResumeSnippet)
  ]);
  const proposed = unique(extractNumbers(suggestedBullet));

  return proposed.filter((value) => !supported.includes(value));
}

export function detectUnsupportedTerms({
  suggestedBullet,
  resumeText,
  sourceResumeSnippet
}) {
  const normalizedSupport = normalizeText([resumeText, sourceResumeSnippet].join(" "));
  const domainTerms = unique(getAllDomainTerms()).filter((term) => normalizeText(suggestedBullet).includes(term));

  return domainTerms.filter((term) => !normalizedSupport.includes(term));
}

export function validateSuggestionSafety({
  originalBullet,
  suggestedBullet,
  sourceResumeSnippet,
  matchedJobDescriptionSnippet,
  resumeText
}) {
  const reasons = [];

  if (!sourceResumeSnippet?.trim()) {
    reasons.push("missing_source_resume_snippet");
  }

  if (!matchedJobDescriptionSnippet?.trim()) {
    reasons.push("missing_jd_match");
  }

  const unsupportedNumbers = detectNewNumbers({
    originalBullet,
    suggestedBullet,
    sourceResumeSnippet
  });

  if (unsupportedNumbers.length) {
    reasons.push(`unsupported_numbers:${unsupportedNumbers.join(",")}`);
  }

  const unsupportedTerms = detectUnsupportedTerms({
    suggestedBullet,
    resumeText,
    sourceResumeSnippet
  });

  if (unsupportedTerms.length) {
    reasons.push(`unsupported_terms:${unsupportedTerms.join(",")}`);
  }

  return {
    safe: reasons.length === 0,
    reasons
  };
}

export function normalizeConfidenceScore(value, { safe, reasons }) {
  const bounded = Math.max(0.1, Math.min(0.99, Number(value) || 0.5));

  if (!safe) {
    return Math.min(bounded, 0.39);
  }

  if (reasons.length) {
    return Math.min(bounded, 0.59);
  }

  return bounded;
}
