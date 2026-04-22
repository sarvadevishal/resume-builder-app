import { createDocxResume, createPdfResume } from "@/lib/services/export-service";

export async function POST(request) {
  const body = await request.json();
  const format = body.format ?? "pdf";
  const structuredResume = body.structuredResume;

  if (format === "docx") {
    const buffer = await createDocxResume(structuredResume);
    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": 'attachment; filename="prooffit-resume.docx"'
      }
    });
  }

  const buffer = await createPdfResume(structuredResume);
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="prooffit-resume.pdf"'
    }
  });
}
