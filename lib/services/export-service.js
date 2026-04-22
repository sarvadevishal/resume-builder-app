import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const pdfPage = {
  width: 612,
  height: 792,
  marginX: 64,
  marginTop: 72,
  marginBottom: 64
};

const textStyles = {
  title: {
    size: 18,
    lineHeight: 24,
    color: rgb(0.08, 0.12, 0.2)
  },
  meta: {
    size: 10.5,
    lineHeight: 15,
    color: rgb(0.32, 0.38, 0.48)
  },
  heading: {
    size: 11.5,
    lineHeight: 18,
    color: rgb(0.11, 0.15, 0.23)
  },
  body: {
    size: 10.5,
    lineHeight: 15,
    color: rgb(0.18, 0.22, 0.3)
  }
};

function sanitizeText(text = "") {
  return text
    .replace(/\r/g, "")
    .replace(/â€¢/g, "•")
    .replace(/[•●◦▪]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function getSectionVariant(sectionName = "") {
  const normalizedName = sectionName.toLowerCase();

  if (normalizedName === "contact") {
    return "contact";
  }

  if (normalizedName === "summary" || normalizedName === "skills") {
    return "paragraph";
  }

  return "bullet";
}

export function buildExportSections(structuredResume) {
  return (
    structuredResume.sections?.map((section) => ({
      name: section.name,
      variant: getSectionVariant(section.name),
      items: (section.items || []).map((item) => sanitizeText(item)).filter(Boolean)
    })) ?? []
  ).filter((section) => section.items.length);
}

export function wrapTextToWidth(text, { font, size, maxWidth }) {
  const normalizedText = sanitizeText(text);

  if (!normalizedText) {
    return [];
  }

  const words = normalizedText.split(" ");
  const lines = [];
  let currentLine = "";

  function pushTokenWithFallback(token) {
    let chunk = "";

    for (const character of token) {
      const nextChunk = `${chunk}${character}`;
      if (font.widthOfTextAtSize(nextChunk, size) <= maxWidth) {
        chunk = nextChunk;
      } else {
        if (chunk) {
          lines.push(chunk);
        }
        chunk = character;
      }
    }

    currentLine = chunk;
  }

  for (const word of words) {
    const candidateLine = currentLine ? `${currentLine} ${word}` : word;

    if (font.widthOfTextAtSize(candidateLine, size) <= maxWidth) {
      currentLine = candidateLine;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    if (font.widthOfTextAtSize(word, size) <= maxWidth) {
      currentLine = word;
    } else {
      pushTokenWithFallback(word);
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

export async function createDocxResume(structuredResume) {
  const sections = buildExportSections(structuredResume);
  const children = [];

  const contactSection = sections.find((section) => section.name.toLowerCase() === "contact");
  const remainingSections = sections.filter((section) => section.name.toLowerCase() !== "contact");

  if (contactSection?.items.length) {
    const [name, ...details] = contactSection.items;

    children.push(
      new Paragraph({
        spacing: { after: 140 },
        children: [new TextRun({ text: name, bold: true, size: 30 })]
      })
    );

    if (details.length) {
      children.push(
        new Paragraph({
          spacing: { after: 220 },
          children: [new TextRun({ text: details.join(" | "), size: 20 })]
        })
      );
    }
  }

  for (const section of remainingSections) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 260, after: 120 },
        children: [new TextRun({ text: section.name.toUpperCase(), bold: true })]
      })
    );

    for (const item of section.items) {
      children.push(
        new Paragraph(
          section.variant === "bullet"
            ? {
                spacing: { after: 120 },
                bullet: { level: 0 },
                children: [new TextRun(item)]
              }
            : {
                spacing: { after: 120 },
                children: [new TextRun(item)]
              }
        )
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children
      }
    ]
  });

  return Packer.toBuffer(doc);
}

export async function createPdfResume(structuredResume) {
  const pdfDoc = await PDFDocument.create();
  const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const headingFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const sections = buildExportSections(structuredResume);
  const contactSection = sections.find((section) => section.name.toLowerCase() === "contact");
  const remainingSections = sections.filter((section) => section.name.toLowerCase() !== "contact");
  const contentWidth = pdfPage.width - pdfPage.marginX * 2;
  const bulletX = pdfPage.marginX;
  const bulletTextX = bulletX + 16;
  let activePage = pdfDoc.addPage([pdfPage.width, pdfPage.height]);
  let cursorY = pdfPage.height - pdfPage.marginTop;

  function addPage() {
    activePage = pdfDoc.addPage([pdfPage.width, pdfPage.height]);
    cursorY = pdfPage.height - pdfPage.marginTop;
  }

  function ensureSpace(requiredHeight) {
    if (cursorY - requiredHeight < pdfPage.marginBottom) {
      addPage();
    }
  }

  function drawLines(lines, { x, size, lineHeight, font, color }) {
    ensureSpace(lines.length * lineHeight);

    for (const line of lines) {
      activePage.drawText(line, {
        x,
        y: cursorY,
        size,
        font,
        color
      });
      cursorY -= lineHeight;
    }
  }

  function drawParagraph(text, style, x = pdfPage.marginX, maxWidth = contentWidth) {
    const lines = wrapTextToWidth(text, {
      font: bodyFont,
      size: style.size,
      maxWidth
    });

    drawLines(lines, {
      ...style,
      x,
      font: bodyFont
    });
  }

  function drawBullet(text) {
    const lines = wrapTextToWidth(text, {
      font: bodyFont,
      size: textStyles.body.size,
      maxWidth: contentWidth - (bulletTextX - pdfPage.marginX)
    });

    ensureSpace(lines.length * textStyles.body.lineHeight);

    activePage.drawText("-", {
      x: bulletX,
      y: cursorY,
      size: textStyles.body.size,
      font: headingFont,
      color: textStyles.body.color
    });

    drawLines(lines, {
      ...textStyles.body,
      x: bulletTextX,
      font: bodyFont
    });
  }

  if (contactSection?.items.length) {
    const [name, ...details] = contactSection.items;

    drawLines([name], {
      ...textStyles.title,
      x: pdfPage.marginX,
      font: headingFont
    });

    if (details.length) {
      const detailLines = wrapTextToWidth(details.join(" | "), {
        font: bodyFont,
        size: textStyles.meta.size,
        maxWidth: contentWidth
      });

      drawLines(detailLines, {
        ...textStyles.meta,
        x: pdfPage.marginX,
        font: bodyFont
      });
    }

    cursorY -= 12;
  }

  for (const section of remainingSections) {
    ensureSpace(44);

    activePage.drawText(section.name.toUpperCase(), {
      x: pdfPage.marginX,
      y: cursorY,
      size: textStyles.heading.size,
      font: headingFont,
      color: textStyles.heading.color
    });

    cursorY -= 22;

    for (const item of section.items) {
      if (section.variant === "bullet") {
        drawBullet(item);
      } else {
        drawParagraph(item, textStyles.body);
      }

      cursorY -= 6;
    }

    cursorY -= 10;
  }

  return Buffer.from(await pdfDoc.save());
}
