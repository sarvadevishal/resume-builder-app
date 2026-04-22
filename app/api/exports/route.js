import { createDocResume, createDocxResume, createPdfResume } from "@/lib/services/export-service";

export async function POST(request) {
  const body = await request.json();
  const format = body.format ?? "pdf";
  const structuredResume = body.structuredResume;
  const exportOptions = body.exportOptions ?? {};
  const sessionContext = body.sessionContext ?? {};

  if (!structuredResume?.sections?.length) {
    return Response.json(
      {
        error: "A structured resume is required before export."
      },
      {
        status: 400
      }
    );
  }

  if (format === "docx") {
    const buffer = await createDocxResume(structuredResume, exportOptions, sessionContext);
    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": 'attachment; filename="prooffit-resume.docx"'
      }
    });
  }

  if (format === "doc") {
    const buffer = await createDocResume(structuredResume, exportOptions, sessionContext);
    return new Response(buffer, {
      headers: {
        "Content-Type": "application/msword",
        "Content-Disposition": 'attachment; filename="prooffit-resume.doc"'
      }
    });
  }

  const buffer = await createPdfResume(structuredResume, exportOptions, sessionContext);
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="prooffit-resume.pdf"'
    }
  });
}
