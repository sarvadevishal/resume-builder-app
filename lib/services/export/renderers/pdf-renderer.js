import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getFontChoiceById, getMarginPresetById, getPaperSizeById } from "@/lib/services/export/config";

function splitJobHeader(text = "") {
  const match = text.match(
    /(?<date>(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4})\s*-\s*(?:Present|Current|(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4})))/i
  );

  if (!match?.groups?.date) {
    return {
      title: text,
      date: ""
    };
  }

  return {
    title: text.replace(match.groups.date, "").replace(/[-|–—]\s*$/, "").trim(),
    date: match.groups.date.trim()
  };
}

function buildPdfStyles(templateId, mode, includePageNumbers) {
  const isProfessional = templateId === "professional-modern";
  const isCompact = mode === "compact";
  const accent = isProfessional ? rgb(0.16, 0.3, 0.5) : rgb(0.1, 0.12, 0.16);

  return {
    title: {
      size: isProfessional ? 19 : 18,
      lineHeight: 23,
      color: rgb(0.08, 0.11, 0.16)
    },
    meta: {
      size: isCompact ? 8.9 : 9.2,
      lineHeight: 12.8,
      color: rgb(0.34, 0.39, 0.46)
    },
    heading: {
      size: 9.9,
      lineHeight: 13.5,
      color: accent
    },
    body: {
      size: isCompact ? 9.1 : 9.5,
      lineHeight: isCompact ? 12.2 : 13,
      color: rgb(0.16, 0.19, 0.25)
    },
    skills: {
      size: isCompact ? 8.7 : 9,
      lineHeight: isCompact ? 11.1 : 11.8,
      color: rgb(0.17, 0.21, 0.27)
    },
    pageFooter: includePageNumbers
      ? {
          size: 8.2,
          lineHeight: 10,
          color: rgb(0.48, 0.53, 0.59)
        }
      : null,
    sectionGap: isCompact ? 6 : 9,
    itemGap: isCompact ? 3 : 5,
    accent
  };
}

function wrapTextToWidth(text, { font, size, maxWidth }) {
  if (!text) {
    return [];
  }

  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (font.widthOfTextAtSize(nextLine, size) <= maxWidth) {
      currentLine = nextLine;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

export async function renderPdfResume({ exportDocument, options, template }) {
  const pdfDoc = await PDFDocument.create();
  const fontChoice = getFontChoiceById(options.fontFamily);
  const paperSize = getPaperSizeById(options.paperSize).pdf;
  const margin = getMarginPresetById(options.marginPreset).pdf;
  const pageWidth = paperSize.width;
  const pageHeight = paperSize.height;
  const contentWidth = pageWidth - margin * 2;
  const bodyFont = await pdfDoc.embedFont(fontChoice.id === "serif" ? StandardFonts.TimesRoman : StandardFonts.Helvetica);
  const headingFont = await pdfDoc.embedFont(fontChoice.id === "serif" ? StandardFonts.TimesRomanBold : StandardFonts.HelveticaBold);
  const styles = buildPdfStyles(template.id, options.mode, options.includePageNumbers);
  const bulletTextX = margin + 14;
  const bulletX = margin + 2.5;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let cursorY = pageHeight - margin;
  const pages = [page];

  function addPage() {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    pages.push(page);
    cursorY = pageHeight - margin;
  }

  function ensureSpace(requiredHeight) {
    if (cursorY - requiredHeight < margin) {
      addPage();
    }
  }

  function drawLines(lines, { x, style, font }) {
    ensureSpace(lines.length * style.lineHeight);

    for (const line of lines) {
      page.drawText(line, {
        x,
        y: cursorY,
        size: style.size,
        font,
        color: style.color
      });
      cursorY -= style.lineHeight;
    }
  }

  function drawParagraph(text, style, x = margin, width = contentWidth, font = bodyFont) {
    const lines = wrapTextToWidth(text, {
      font,
      size: style.size,
      maxWidth: width
    });

    drawLines(lines, {
      x,
      style,
      font
    });
  }

  function drawRule(yOffset = 3) {
    page.drawLine({
      start: { x: margin, y: cursorY - yOffset },
      end: { x: pageWidth - margin, y: cursorY - yOffset },
      thickness: template.id === "professional-modern" ? 1 : 0.8,
      color: template.id === "professional-modern" ? styles.accent : rgb(0.82, 0.86, 0.91)
    });
  }

  function drawSectionHeading(title) {
    ensureSpace(26);
    page.drawText(title.toUpperCase(), {
      x: margin,
      y: cursorY,
      size: styles.heading.size,
      font: headingFont,
      color: styles.heading.color
    });
    drawRule();
    cursorY -= 15;
  }

  function drawBullet(text) {
    const lines = wrapTextToWidth(text, {
      font: bodyFont,
      size: styles.body.size,
      maxWidth: contentWidth - (bulletTextX - margin)
    });

    ensureSpace(lines.length * styles.body.lineHeight + 2);
    page.drawCircle({
      x: bulletX,
      y: cursorY + 3,
      size: 1.55,
      color: rgb(0.18, 0.22, 0.3)
    });

    drawLines(lines, {
      x: bulletTextX,
      style: styles.body,
      font: bodyFont
    });
  }

  function drawJobHeader(text) {
    const { title, date } = splitJobHeader(text);
    const dateWidth = date ? headingFont.widthOfTextAtSize(date, styles.body.size) : 0;
    const titleWidth = contentWidth - (date ? dateWidth + 20 : 0);
    const titleLines = wrapTextToWidth(title, {
      font: headingFont,
      size: styles.body.size,
      maxWidth: titleWidth
    });

    ensureSpace(titleLines.length * styles.body.lineHeight + styles.body.lineHeight);

    drawLines(titleLines, {
      x: margin,
      style: styles.body,
      font: headingFont
    });

    if (date) {
      page.drawText(date, {
        x: pageWidth - margin - dateWidth,
        y: cursorY + styles.body.lineHeight,
        size: styles.body.size,
        font: bodyFont,
        color: styles.body.color
      });
    }
  }

  if (exportDocument.header.name) {
    drawParagraph(exportDocument.header.name, styles.title, margin, contentWidth, headingFont);

    if (exportDocument.header.contactLine) {
      drawParagraph(exportDocument.header.contactLine, styles.meta, margin, contentWidth, bodyFont);
    }

    cursorY -= styles.sectionGap;
  }

  for (const section of exportDocument.sections) {
    ensureSpace(40);
    drawSectionHeading(section.title);

    for (let index = 0; index < section.items.length; index += 1) {
      const item = section.items[index];
      const nextItem = section.items[index + 1];

      if (section.id === "experience" && /(?:Present|Current|\d{4})/i.test(item.text)) {
        drawJobHeader(item.text);
      } else if (["summary", "education", "certifications", "awards", "publications", "languages", "links"].includes(section.id)) {
        drawParagraph(item.text, styles.body);
      } else if (["skills", "technical-skills", "core-competencies"].includes(section.id)) {
        drawParagraph(item.text, styles.skills);
      } else {
        drawBullet(item.text);
      }

      cursorY -= nextItem ? styles.itemGap : styles.sectionGap;
    }
  }

  if (options.includePageNumbers && styles.pageFooter) {
    pages.forEach((currentPage, index) => {
      const label = `Page ${index + 1} of ${pages.length}`;
      const width = bodyFont.widthOfTextAtSize(label, styles.pageFooter.size);
      currentPage.drawText(label, {
        x: pageWidth - margin - width,
        y: margin - 20,
        size: styles.pageFooter.size,
        font: bodyFont,
        color: styles.pageFooter.color
      });
    });
  }

  return Buffer.from(await pdfDoc.save());
}
