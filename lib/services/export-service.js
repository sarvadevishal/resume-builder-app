import { AlignmentType, BorderStyle, Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const pdfPage = {
  width: 612,
  height: 792,
  marginX: 54,
  marginTop: 56,
  marginBottom: 54
};

const textStyles = {
  title: {
    size: 20,
    lineHeight: 24,
    color: rgb(0.06, 0.11, 0.18)
  },
  meta: {
    size: 9.25,
    lineHeight: 13,
    color: rgb(0.35, 0.41, 0.48)
  },
  sectionHeading: {
    size: 10,
    lineHeight: 14,
    color: rgb(0.08, 0.12, 0.19)
  },
  jobHeader: {
    size: 10.4,
    lineHeight: 14.5,
    color: rgb(0.1, 0.14, 0.2)
  },
  body: {
    size: 9.6,
    lineHeight: 13.4,
    color: rgb(0.17, 0.21, 0.28)
  },
  compactBody: {
    size: 9.4,
    lineHeight: 12.8,
    color: rgb(0.17, 0.21, 0.28)
  }
};

const brokenWordSuffixes = [
  "able",
  "ably",
  "age",
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
  "est",
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
  "izations",
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
  "ships",
  "sion",
  "sions",
  "tion",
  "tions",
  "ure",
  "ures",
  "ward",
  "wards"
];

const dateRangePattern =
  /(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{4})\s*[-–]\s*(?:present|current|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{4})/i;

function repairBrokenWords(text = "") {
  let nextText = text;

  nextText = nextText.replace(/\b([A-Z])\s+([a-z]{3,})\b/g, "$1$2");

  for (const suffix of brokenWordSuffixes) {
    const pattern = new RegExp(`\\b([A-Za-z]{3,})\\s+(${suffix})\\b`, "g");
    nextText = nextText.replace(pattern, "$1$2");
  }

  nextText = nextText.replace(/\b([A-Za-z]{4,})\s+(s)\b/g, "$1$2");
  nextText = nextText.replace(/\b([A-Za-z]{2,})\s+(&)\s+([A-Za-z]{2,})\b/g, "$1 $2 $3");

  return nextText;
}

export function sanitizeText(text = "") {
  return repairBrokenWords(
    text
      .normalize("NFKC")
      .replace(/\r/g, "")
      .replace(/[\u0000-\u001f]/g, " ")
      .replace(/Ã¢â‚¬Â¢/g, "•")
      .replace(/[â€¢â—â—¦â–ª]/g, "•")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[–—]/g, "-")
      .replace(/\s+([,.;:!?])/g, "$1")
      .replace(/\(\s+/g, "(")
      .replace(/\s+\)/g, ")")
      .replace(/\s*\/\s*/g, " / ")
      .replace(/\s*-\s*/g, " - ")
      .replace(/[ \t]+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim()
  );
}

function getSectionVariant(sectionName = "") {
  const normalizedName = sectionName.toLowerCase();

  if (normalizedName === "contact") {
    return "contact";
  }

  if (normalizedName === "summary" || normalizedName === "skills") {
    return "paragraph";
  }

  if (normalizedName === "education") {
    return "entry";
  }

  return "bullet";
}

function classifySectionItem(sectionName, item) {
  const normalizedName = sectionName.toLowerCase();
  const sanitizedItem = sanitizeText(item);

  if (!sanitizedItem) {
    return "paragraph";
  }

  if (normalizedName === "experience" && dateRangePattern.test(sanitizedItem)) {
    return "job-header";
  }

  if (normalizedName === "education") {
    return "entry";
  }

  if (normalizedName === "summary" || normalizedName === "skills" || normalizedName === "contact") {
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

function buildExportBlocks(structuredResume) {
  return (
    structuredResume.sections?.map((section) => ({
      name: section.name,
      variant: getSectionVariant(section.name),
      items: (section.items || [])
        .map((item) => sanitizeText(item))
        .filter(Boolean)
        .map((item) => ({
          kind: classifySectionItem(section.name, item),
          text: item
        }))
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

function getDocxRuns(text, { boldLead = false } = {}) {
  if (!boldLead || !text.includes(":")) {
    return [new TextRun({ text, size: 20 })];
  }

  const separatorIndex = text.indexOf(":");
  const lead = text.slice(0, separatorIndex + 1);
  const remainder = text.slice(separatorIndex + 1).trimStart();

  return [
    new TextRun({ text: lead, bold: true, size: 20 }),
    new TextRun({ text: ` ${remainder}`, size: 20 })
  ];
}

export async function createDocxResume(structuredResume) {
  const sections = buildExportBlocks(structuredResume);
  const children = [];
  const contactSection = sections.find((section) => section.name.toLowerCase() === "contact");
  const remainingSections = sections.filter((section) => section.name.toLowerCase() !== "contact");

  if (contactSection?.items.length) {
    const [nameItem, ...detailItems] = contactSection.items;
    const name = nameItem.text;
    const details = detailItems.map((item) => item.text);

    children.push(
      new Paragraph({
        spacing: { after: 80 },
        alignment: AlignmentType.LEFT,
        children: [new TextRun({ text: name, bold: true, size: 32 })]
      })
    );

    if (details.length) {
      children.push(
        new Paragraph({
          spacing: { after: 220 },
          alignment: AlignmentType.LEFT,
          children: [new TextRun({ text: details.join("  |  "), size: 18, color: "556274" })]
        })
      );
    }
  }

  for (const section of remainingSections) {
    children.push(
      new Paragraph({
        spacing: { before: 220, after: 80 },
        border: {
          bottom: {
            color: "D7E2F0",
            size: 8,
            style: BorderStyle.SINGLE
          }
        },
        children: [new TextRun({ text: section.name.toUpperCase(), bold: true, size: 18, color: "111827" })]
      })
    );

    for (const item of section.items) {
      if (item.kind === "job-header") {
        children.push(
          new Paragraph({
            spacing: { before: 120, after: 70 },
            children: [new TextRun({ text: item.text, bold: true, size: 21, color: "182235" })]
          })
        );
        continue;
      }

      if (item.kind === "entry" || section.name.toLowerCase() === "summary") {
        children.push(
          new Paragraph({
            spacing: { after: 90 },
            children: [new TextRun({ text: item.text, size: 20, color: "2B3647" })]
          })
        );
        continue;
      }

      if (section.name.toLowerCase() === "skills") {
        children.push(
          new Paragraph({
            spacing: { after: 90 },
            children: getDocxRuns(item.text, { boldLead: item.text.includes(":") })
          })
        );
        continue;
      }

      children.push(
        new Paragraph({
          spacing: { after: 80 },
          bullet: { level: 0 },
          children: [new TextRun({ text: item.text, size: 20, color: "2B3647" })]
        })
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
  const sections = buildExportBlocks(structuredResume);
  const contactSection = sections.find((section) => section.name.toLowerCase() === "contact");
  const remainingSections = sections.filter((section) => section.name.toLowerCase() !== "contact");
  const contentWidth = pdfPage.width - pdfPage.marginX * 2;
  const bulletX = pdfPage.marginX + 3;
  const bulletTextX = pdfPage.marginX + 16;
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

  function drawWrappedText(text, style, { x = pdfPage.marginX, maxWidth = contentWidth, font = bodyFont } = {}) {
    const lines = wrapTextToWidth(text, {
      font,
      size: style.size,
      maxWidth
    });

    drawLines(lines, {
      x,
      size: style.size,
      lineHeight: style.lineHeight,
      font,
      color: style.color
    });
  }

  function drawSectionHeading(name) {
    ensureSpace(30);
    activePage.drawText(name.toUpperCase(), {
      x: pdfPage.marginX,
      y: cursorY,
      size: textStyles.sectionHeading.size,
      font: headingFont,
      color: textStyles.sectionHeading.color
    });
    activePage.drawLine({
      start: { x: pdfPage.marginX, y: cursorY - 4 },
      end: { x: pdfPage.width - pdfPage.marginX, y: cursorY - 4 },
      thickness: 0.8,
      color: rgb(0.84, 0.89, 0.95)
    });
    cursorY -= 18;
  }

  function drawBullet(text) {
    const lines = wrapTextToWidth(text, {
      font: bodyFont,
      size: textStyles.body.size,
      maxWidth: contentWidth - (bulletTextX - pdfPage.marginX)
    });

    ensureSpace(lines.length * textStyles.body.lineHeight + 2);

    activePage.drawCircle({
      x: bulletX,
      y: cursorY + 3,
      size: 1.8,
      color: rgb(0.19, 0.26, 0.37)
    });

    drawLines(lines, {
      x: bulletTextX,
      size: textStyles.body.size,
      lineHeight: textStyles.body.lineHeight,
      font: bodyFont,
      color: textStyles.body.color
    });
  }

  if (contactSection?.items.length) {
    const [nameItem, ...detailItems] = contactSection.items;
    const name = nameItem.text;
    const details = detailItems.map((item) => item.text);

    drawWrappedText(name, textStyles.title, {
      font: headingFont
    });

    if (details.length) {
      drawWrappedText(details.join("  |  "), textStyles.meta, {
        font: bodyFont
      });
    }

    cursorY -= 10;
  }

  for (const section of remainingSections) {
    drawSectionHeading(section.name);

    for (const item of section.items) {
      if (item.kind === "job-header") {
        drawWrappedText(item.text, textStyles.jobHeader, {
          font: headingFont
        });
        cursorY -= 4;
        continue;
      }

      if (item.kind === "entry") {
        drawWrappedText(item.text, textStyles.body);
        cursorY -= 5;
        continue;
      }

      if (section.name.toLowerCase() === "summary") {
        drawWrappedText(item.text, textStyles.body);
        cursorY -= 6;
        continue;
      }

      if (section.name.toLowerCase() === "skills") {
        drawWrappedText(item.text, textStyles.compactBody);
        cursorY -= 4;
        continue;
      }

      drawBullet(item.text);
      cursorY -= 4;
    }

    cursorY -= 8;
  }

  return Buffer.from(await pdfDoc.save());
}
