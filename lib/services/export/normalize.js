const standardSections = [
  {
    id: "header",
    title: "Header",
    aliases: ["header", "contact", "contact info", "contact information"]
  },
  {
    id: "summary",
    title: "Summary",
    aliases: ["summary", "professional summary", "profile", "career summary", "executive summary"]
  },
  {
    id: "skills",
    title: "Skills",
    aliases: ["skills", "core skills"]
  },
  {
    id: "technical-skills",
    title: "Technical Skills",
    aliases: ["technical skills", "tools", "toolkit", "stack"]
  },
  {
    id: "core-competencies",
    title: "Core Competencies",
    aliases: ["core competencies", "competencies", "strengths"]
  },
  {
    id: "experience",
    title: "Experience",
    aliases: ["experience", "work experience", "professional experience", "employment history", "career history"]
  },
  {
    id: "projects",
    title: "Projects",
    aliases: ["projects", "project experience", "selected projects"]
  },
  {
    id: "education",
    title: "Education",
    aliases: ["education", "academic background"]
  },
  {
    id: "certifications",
    title: "Certifications",
    aliases: ["certifications", "licenses", "certificates"]
  },
  {
    id: "awards",
    title: "Awards",
    aliases: ["awards", "honors", "achievements"]
  },
  {
    id: "publications",
    title: "Publications",
    aliases: ["publications", "research", "papers"]
  },
  {
    id: "volunteer-experience",
    title: "Volunteer Experience",
    aliases: ["volunteer experience", "volunteering"]
  },
  {
    id: "languages",
    title: "Languages",
    aliases: ["languages"]
  },
  {
    id: "links",
    title: "Links",
    aliases: ["links", "portfolio", "online presence"]
  }
];

const sectionOrderByMode = {
  ats: ["summary", "skills", "experience", "projects", "education", "certifications", "awards", "publications", "volunteer-experience", "languages", "links"],
  professional: ["summary", "core-competencies", "technical-skills", "skills", "experience", "projects", "education", "certifications", "awards", "publications", "volunteer-experience", "languages", "links"],
  compact: ["summary", "technical-skills", "experience", "projects", "education", "certifications", "awards", "publications", "languages", "links"],
  executive: ["summary", "core-competencies", "experience", "technical-skills", "skills", "projects", "education", "certifications", "awards", "publications", "volunteer-experience", "languages", "links"]
};

const brokenWordSuffixes = [
  "able",
  "ably",
  "al",
  "ally",
  "ance",
  "ances",
  "ate",
  "ated",
  "ation",
  "ations",
  "ed",
  "ence",
  "ences",
  "ency",
  "ent",
  "er",
  "ers",
  "ful",
  "hood",
  "ible",
  "ing",
  "ion",
  "ions",
  "ious",
  "ism",
  "ist",
  "ists",
  "ity",
  "ization",
  "ize",
  "ized",
  "less",
  "ly",
  "ment",
  "ments",
  "ness",
  "or",
  "ors",
  "ous",
  "ship",
  "sion",
  "tion",
  "ure"
];

const monthMap = {
  january: "Jan",
  february: "Feb",
  march: "Mar",
  april: "Apr",
  may: "May",
  june: "Jun",
  july: "Jul",
  august: "Aug",
  september: "Sep",
  october: "Oct",
  november: "Nov",
  december: "Dec"
};

const genericBulletPhrases = ["responsible for", "worked on", "helped with", "involved in", "tasked with", "participated in"];

function repairBrokenWords(text = "") {
  let nextText = text;

  nextText = nextText.replace(/\b([A-Z])\s+([a-z]{3,})\b/g, "$1$2");

  for (const suffix of brokenWordSuffixes) {
    const pattern = new RegExp(`\\b([A-Za-z]{3,})\\s+(${suffix})\\b`, "g");
    nextText = nextText.replace(pattern, "$1$2");
  }

  nextText = nextText.replace(/\b([A-Za-z]{4,})\s+(s)\b/g, "$1$2");
  return nextText;
}

function getComparableText(item) {
  if (typeof item === "string") {
    return item;
  }

  if (item && typeof item === "object" && typeof item.text === "string") {
    return item.text;
  }

  return "";
}

function removeGenericRewriteArtifacts(text = "") {
  return text
    .replace(/,\s*with clearer emphasis on [^.]+\.?/gi, "")
    .replace(/\bwith clearer emphasis on [^.]+\.?/gi, "")
    .replace(/\bwith stronger emphasis on [^.]+\.?/gi, "")
    .replace(/\bwith improved emphasis on [^.]+\.?/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function sanitizeExportText(text = "") {
  return removeGenericRewriteArtifacts(
    repairBrokenWords(
    text
      .normalize("NFKC")
      .replace(/\r/g, "")
      .replace(/[\u0000-\u001f]/g, " ")
      .replace(/\u2022|\u25cf|\u25e6|\u25aa/g, "-")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[–—]/g, "-")
      .replace(/\s+([,.;:!?])/g, "$1")
      .replace(/\(\s+/g, "(")
      .replace(/\s+\)/g, ")")
      .replace(/\s*\/\s*/g, " / ")
      .replace(/\s*\|\s*/g, " | ")
      .replace(/[ \t]+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim()
    )
  );
}

export function normalizeDateText(text = "") {
  const sanitized = sanitizeExportText(text);

  return sanitized
    .replace(
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/gi,
      (month) => monthMap[month.toLowerCase()] || month
    )
    .replace(
      /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4})\s*-\s*((?:Present|Current|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4}))\b/gi,
      (_, start, end) => `${start} - ${end}`
    );
}

function normalizeHeadingName(name = "") {
  const normalized = sanitizeExportText(name).toLowerCase();
  const match = standardSections.find((section) => section.aliases.includes(normalized));

  if (match) {
    return match;
  }

  return {
    id: normalized.replace(/[^a-z0-9]+/g, "-"),
    title: normalized
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" "),
    aliases: [normalized]
  };
}

function normalizeBulletText(text = "") {
  const cleaned = normalizeDateText(text).replace(/^[-*]\s*/, "");

  if (!cleaned) {
    return "";
  }

  if (/[.!?]$/.test(cleaned)) {
    return cleaned;
  }

  return cleaned.split(" ").length >= 9 ? `${cleaned}.` : cleaned;
}

function dedupeList(items) {
  const seen = new Set();

  return items.filter((item) => {
    const key = getComparableText(item).toLowerCase();

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function parseDelimitedSkills(text) {
  return text
    .split(/[,|]/)
    .map((part) => sanitizeExportText(part))
    .filter(Boolean);
}

function isGroupedSkillLine(text = "") {
  return /:\s*/.test(text) || /\b(languages?\s*&\s*tools|frameworks?\s*&\s*libraries|gen ai\s*&\s*llms?|ml\s*&\s*statistical skills|core competencies)\b/i.test(text);
}

function normalizeSkillItems(items = []) {
  return items.flatMap((item) => {
    const cleaned = sanitizeExportText(item);

    if (!cleaned) {
      return [];
    }

    if (isGroupedSkillLine(cleaned)) {
      return [cleaned];
    }

    return parseDelimitedSkills(cleaned);
  });
}

function prioritizeSkills(skills, priorities) {
  if (!priorities.length) {
    return skills;
  }

  const normalizedPriorities = priorities.map((item) => item.toLowerCase());
  return skills
    .map((skill, index) => {
      const priorityIndex = normalizedPriorities.findIndex((item) => skill.toLowerCase().includes(item));
      return {
        skill,
        index,
        priority: priorityIndex === -1 ? Number.MAX_SAFE_INTEGER : priorityIndex
      };
    })
    .sort((left, right) => left.priority - right.priority || left.index - right.index)
    .map((item) => item.skill);
}

function condenseSkillItems(items, maxLineLength = 78) {
  const lines = [];
  let currentLine = "";

  for (const item of items) {
    if (isGroupedSkillLine(item)) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = "";
      }

      lines.push(item);
      continue;
    }

    const candidate = currentLine ? `${currentLine} | ${item}` : item;

    if (candidate.length <= maxLineLength) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    currentLine = item;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function estimatePageCount(sectionCount, bulletCount, totalCharacters, mode) {
  const densityDivisor = mode === "compact" ? 3900 : mode === "executive" ? 3300 : 3500;
  const weightedSize = totalCharacters + sectionCount * 160 + bulletCount * 80;
  return Math.max(1, Math.ceil(weightedSize / densityDivisor));
}

function buildHeaderSection(sections) {
  const header = sections.find((section) => section.id === "header");
  const links = sections.find((section) => section.id === "links");
  const headerItems = (header?.items || []).map((item) => getComparableText(item)).filter(Boolean);
  const linkItems = (links?.items || []).map((item) => getComparableText(item)).filter(Boolean);
  const [name = "", ...contactLines] = headerItems;
  const compactContactLine = dedupeList([...contactLines, ...linkItems]).map((item) => getComparableText(item)).join(" | ");

  return {
    name: sanitizeExportText(name),
    contactLine: sanitizeExportText(compactContactLine),
    lines: dedupeList([...contactLines, ...linkItems]).map((item) => sanitizeExportText(getComparableText(item))).filter(Boolean)
  };
}

function buildWarningsFromContent(summaryItems, sections, estimatedPageCount, mode, originalSectionNames) {
  const warnings = [];
  const summaryLength = summaryItems.join(" ").length;
  const allBullets = sections.flatMap((section) => section.items.map((item) => item.text));

  if (estimatedPageCount > (mode === "executive" || mode === "compact" ? 3 : 2)) {
    warnings.push({
      id: "length-threshold",
      tone: "warning",
      message: `The exported resume is estimated at ${estimatedPageCount} pages, which may be longer than recruiters expect for this mode.`
    });
  }

  if (summaryLength > 430) {
    warnings.push({
      id: "summary-too-long",
      tone: "warning",
      message: "The professional summary is long. Trim it if you want faster recruiter scanning."
    });
  }

  if (allBullets.some((bullet) => genericBulletPhrases.some((phrase) => bullet.toLowerCase().includes(phrase)))) {
    warnings.push({
      id: "generic-bullets",
      tone: "warning",
      message: "Some bullets still sound generic. Prefer specific ownership, systems, and outcomes."
    });
  }

  if (allBullets.some((bullet) => bullet.split(" ").length > 24)) {
    warnings.push({
      id: "dense-bullets",
      tone: "warning",
      message: "Some bullets are dense. Shorter bullets usually scan better for recruiters and ATS review."
    });
  }

  const nonStandardSections = originalSectionNames.filter((name) => !standardSections.some((section) => section.aliases.includes(name.toLowerCase())));

  if (nonStandardSections.length) {
    warnings.push({
      id: "non-standard-headings",
      tone: "neutral",
      message: `Non-standard section labels were normalized during export: ${nonStandardSections.join(", ")}.`
    });
  }

  return warnings;
}

export function normalizeResumeForExport({ structuredResume, exportOptions, sessionContext = {} }) {
  const sectionMap = new Map();
  const originalSectionNames = [];

  for (const section of structuredResume.sections || []) {
    const normalizedSection = normalizeHeadingName(section.name);
    originalSectionNames.push(sanitizeExportText(section.name));
    const currentItems = sectionMap.get(normalizedSection.id) || [];

    if (["skills", "technical-skills", "core-competencies"].includes(normalizedSection.id)) {
      const flattenedItems = normalizeSkillItems(section.items || []);
      sectionMap.set(normalizedSection.id, [...currentItems, ...flattenedItems]);
      continue;
    }

    const normalizedItems = (section.items || [])
      .map((item) => (["experience", "projects"].includes(normalizedSection.id) ? normalizeBulletText(item) : normalizeDateText(item)))
      .filter(Boolean);

    sectionMap.set(normalizedSection.id, [...currentItems, ...normalizedItems]);
  }

  const jdPriorities = dedupeList(
    [
      ...(sessionContext.jobDescriptionAnalysis?.mustHaveSkills || []),
      ...(sessionContext.jobDescriptionAnalysis?.toolsPlatforms || []),
      ...(sessionContext.jobDescriptionAnalysis?.domainKeywords || [])
    ]
      .map((item) => sanitizeExportText(item))
      .filter(Boolean)
  ).map((item) => getComparableText(item));

  const normalizedSections = [...sectionMap.entries()]
    .map(([id, items]) => {
      const sectionMeta = standardSections.find((section) => section.id === id) || normalizeHeadingName(id);
      const cleanedItems = dedupeList(items.map((item) => sanitizeExportText(item)).filter(Boolean)).map((item) => getComparableText(item));
      const prioritizedItems =
        exportOptions.prioritizeMatchedSkills && ["skills", "technical-skills", "core-competencies"].includes(id)
          ? prioritizeSkills(cleanedItems, jdPriorities)
          : cleanedItems;
      const finalItems =
        ["skills", "technical-skills", "core-competencies"].includes(id) ? condenseSkillItems(prioritizedItems) : prioritizedItems;

      return {
        id,
        title: sectionMeta.title,
        items: finalItems.map((item) => ({
          text: item
        }))
      };
    })
    .filter((section) => section.items.length);

  const header = buildHeaderSection(normalizedSections);
  const summarySection = normalizedSections.find((section) => section.id === "summary");
  const sectionsWithoutHeader = normalizedSections.filter((section) => section.id !== "header" && section.id !== "links");
  const orderedSections = sectionOrderByMode[exportOptions.mode]
    .map((sectionId) => sectionsWithoutHeader.find((section) => section.id === sectionId))
    .filter(Boolean);
  const remainingSections = sectionsWithoutHeader.filter((section) => !sectionOrderByMode[exportOptions.mode].includes(section.id));
  const finalSections = [...orderedSections, ...remainingSections].map((section) => ({
    ...section,
    items: section.items.map((item, index) => ({
      id: `${section.id}-${index}`,
      text: item.text
    }))
  }));

  const totalCharacters = finalSections.flatMap((section) => section.items).reduce((total, item) => total + item.text.length, header.contactLine.length + header.name.length);
  const bulletCount = finalSections.reduce((total, section) => total + section.items.length, 0);
  const estimatedPageCount = estimatePageCount(finalSections.length, bulletCount, totalCharacters, exportOptions.mode);
  const warnings = buildWarningsFromContent(summarySection?.items.map((item) => item.text) || [], finalSections, estimatedPageCount, exportOptions.mode, originalSectionNames);

  return {
    header,
    sections: finalSections,
    metadata: {
      estimatedPageCount,
      originalSectionNames,
      jdPriorities
    },
    warnings
  };
}
