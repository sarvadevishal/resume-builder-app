import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  Packer,
  PageNumber,
  Paragraph,
  TabStopType,
  TextRun
} from "docx";
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
    title: text.replace(match.groups.date, "").replace(/[-|]\s*$/, "").trim(),
    date: match.groups.date.trim()
  };
}

function buildDocxTheme(templateId, mode) {
  const professional = templateId === "professional-modern";
  const compact = mode === "compact";

  return {
    headingColor: professional ? "274C7F" : "111827",
    bodyColor: "273243",
    metaColor: "5B6470",
    dividerColor: professional ? "BFD2E8" : "D7E2F0",
    titleSize: professional ? 34 : 32,
    headingSize: 18,
    bodySize: compact ? 19 : 20,
    skillsSize: compact ? 18 : 19,
    sectionBefore: compact ? 180 : 220,
    sectionAfter: compact ? 80 : 90,
    paragraphAfter: compact ? 70 : 90
  };
}

function createParagraphText(text, size, color, options = {}) {
  return new Paragraph({
    spacing: {
      after: options.after ?? 80,
      before: options.before ?? 0
    },
    alignment: options.alignment ?? AlignmentType.LEFT,
    children: [
      new TextRun({
        text,
        size,
        color,
        bold: Boolean(options.bold)
      })
    ]
  });
}

function createJobHeaderParagraph(text, theme, pageWidthTwips, marginTwips) {
  const { title, date } = splitJobHeader(text);
  const titleRuns = [
    new TextRun({
      text: title,
      bold: true,
      size: theme.bodySize,
      color: theme.bodyColor
    })
  ];

  if (date) {
    titleRuns.push(
      new TextRun({
        text: "\t",
        size: theme.bodySize
      }),
      new TextRun({
        text: date,
        size: theme.bodySize,
        color: theme.metaColor
      })
    );
  }

  return new Paragraph({
    spacing: {
      before: 100,
      after: 70
    },
    tabStops: date
      ? [
          {
            type: TabStopType.RIGHT,
            position: pageWidthTwips - marginTwips * 2
          }
        ]
      : [],
    children: titleRuns
  });
}

/**
 * Render a Word-compatible DOCX buffer for a normalized resume export document.
 */
export async function renderDocxResume({ exportDocument, options, template }) {
  const paperSize = getPaperSizeById(options.paperSize).docx;
  const marginTwips = getMarginPresetById(options.marginPreset).docx;
  const fontChoice = getFontChoiceById(options.fontFamily);
  const theme = buildDocxTheme(template.id, options.mode);
  const children = [];

  if (exportDocument.header.name) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.TITLE,
        spacing: {
          after: 80
        },
        children: [
          new TextRun({
            text: exportDocument.header.name,
            bold: true,
            size: theme.titleSize,
            font: fontChoice.docxHeading,
            color: "111827"
          })
        ]
      })
    );
  }

  if (exportDocument.header.contactLine) {
    children.push(
      createParagraphText(exportDocument.header.contactLine, 18, theme.metaColor, {
        after: 180
      })
    );
  }

  for (const section of exportDocument.sections) {
    children.push(
      new Paragraph({
        spacing: {
          before: theme.sectionBefore,
          after: theme.sectionAfter
        },
        border: {
          bottom: {
            color: theme.dividerColor,
            style: BorderStyle.SINGLE,
            size: 8
          }
        },
        children: [
          new TextRun({
            text: section.title.toUpperCase(),
            bold: true,
            size: theme.headingSize,
            font: fontChoice.docxHeading,
            color: theme.headingColor
          })
        ]
      })
    );

    for (const item of section.items) {
      if (section.id === "experience" && /(?:Present|Current|\d{4})/i.test(item.text)) {
        children.push(createJobHeaderParagraph(item.text, theme, paperSize.width, marginTwips));
        continue;
      }

      if (["summary", "education", "certifications", "awards", "publications", "languages", "links"].includes(section.id)) {
        children.push(
          createParagraphText(item.text, theme.bodySize, theme.bodyColor, {
            after: theme.paragraphAfter
          })
        );
        continue;
      }

      if (["skills", "technical-skills", "core-competencies"].includes(section.id)) {
        children.push(
          createParagraphText(item.text, theme.skillsSize, theme.bodyColor, {
            after: 65
          })
        );
        continue;
      }

      children.push(
        new Paragraph({
          spacing: {
            after: theme.paragraphAfter
          },
          bullet: {
            level: 0
          },
          children: [
            new TextRun({
              text: item.text,
              size: theme.bodySize,
              color: theme.bodyColor,
              font: fontChoice.docxBody
            })
          ]
        })
      );
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: fontChoice.docxBody,
            size: theme.bodySize
          }
        }
      }
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: marginTwips,
              right: marginTwips,
              bottom: marginTwips,
              left: marginTwips
            },
            size: paperSize
          }
        },
        footers: options.includePageNumbers
          ? {
              default: new Footer({
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                      new TextRun({
                        children: ["Page ", PageNumber.CURRENT]
                      })
                    ]
                  })
                ]
              })
            }
          : undefined,
        children
      }
    ]
  });

  return Packer.toBuffer(doc);
}
