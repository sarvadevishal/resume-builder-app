import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

function flattenResume(structuredResume) {
  return (
    structuredResume.sections?.flatMap((section) => [
      { type: "heading", text: section.name.toUpperCase() },
      ...section.items.map((item) => ({ type: "body", text: item }))
    ]) ?? []
  );
}

export async function createDocxResume(structuredResume) {
  const children = flattenResume(structuredResume).map((item) =>
    item.type === "heading"
      ? new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 280, after: 100 },
          children: [new TextRun({ text: item.text, bold: true })]
        })
      : new Paragraph({
          spacing: { after: 100 },
          bullet: { level: 0 },
          children: [new TextRun(item.text)]
        })
  );

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
  pdfDoc.addPage([612, 792]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  let y = 750;

  for (const item of flattenResume(structuredResume)) {
    if (y < 60) {
      y = 750;
      pdfDoc.addPage([612, 792]);
    }

    const activePage = pdfDoc.getPages()[pdfDoc.getPages().length - 1];

    if (item.type === "heading") {
      activePage.drawText(item.text, {
        x: 48,
        y,
        size: 12,
        font,
        color: rgb(0.12, 0.12, 0.12)
      });
      y -= 22;
    } else {
      activePage.drawText(`- ${item.text}`, {
        x: 60,
        y,
        size: 10,
        font,
        color: rgb(0.22, 0.22, 0.22),
        maxWidth: 500
      });
      y -= 16;
    }
  }

  return Buffer.from(await pdfDoc.save());
}
