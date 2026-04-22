import { getFontChoiceById } from "@/lib/services/export/config";

function escapeRtf(text = "") {
  return text.replace(/\\/g, "\\\\").replace(/\{/g, "\\{").replace(/\}/g, "\\}").replace(/\n/g, " ").trim();
}

function buildRtfParagraph(text, { bold = false, bullet = false, fontSize = 22, spaceAfter = 120 } = {}) {
  const prefix = bullet ? "\\fi-240\\li360\\tx360\\bullet\\tab " : "";
  const boldOpen = bold ? "\\b " : "";
  const boldClose = bold ? "\\b0 " : "";
  return `\\pard\\fs${fontSize}\\sa${spaceAfter}${prefix}${boldOpen}${escapeRtf(text)}${boldClose}\\par`;
}

/**
 * Generate an RTF-based `.doc` compatibility export.
 * Older Word installs can open this through the `.doc` extension without relying on OOXML support.
 */
export async function renderDocResume({ exportDocument, options }) {
  const fontChoice = getFontChoiceById(options.fontFamily);
  const sections = [];

  if (exportDocument.header.name) {
    sections.push(buildRtfParagraph(exportDocument.header.name, { bold: true, fontSize: 34, spaceAfter: 80 }));
  }

  if (exportDocument.header.contactLine) {
    sections.push(buildRtfParagraph(exportDocument.header.contactLine, { fontSize: 20, spaceAfter: 160 }));
  }

  for (const section of exportDocument.sections) {
    sections.push(`\\pard\\sa100\\b ${escapeRtf(section.title.toUpperCase())}\\b0\\par`);

    for (const item of section.items) {
      const isParagraphSection = [
        "summary",
        "skills",
        "technical-skills",
        "core-competencies",
        "education",
        "certifications",
        "awards",
        "publications",
        "languages",
        "links"
      ].includes(section.id);
      const isExperienceHeader = section.id === "experience" && /(?:Present|Current|\d{4})/i.test(item.text);

      sections.push(
        buildRtfParagraph(item.text, {
          bold: isExperienceHeader,
          bullet: !isParagraphSection && !isExperienceHeader,
          fontSize: 22,
          spaceAfter: 100
        })
      );
    }
  }

  const rtf = `{\n\\rtf1\\ansi\\deff0\n{\\fonttbl{\\f0 ${fontChoice.docxBody};}}\n\\viewkind4\\uc1\\pard\\f0\n${sections.join("\n")}\n}`;
  return Buffer.from(rtf, "utf8");
}
