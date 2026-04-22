import { NextResponse } from "next/server";
import { parseResumeInput } from "@/lib/services/resume-parser";
import { analyzeAtsSafety } from "@/lib/services/ats-safety";
import { buildDeletionPlan, createAuditEvent } from "@/lib/services/privacy-service";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const text = formData.get("text");
    const saveStructuredData = formData.get("saveStructuredData") === "true";
    const parsed = await parseResumeInput({ file, text });

    if (!parsed.extractedText?.trim()) {
      return NextResponse.json(
        {
          error: "We could not extract readable text from that file. Try a different PDF/DOCX or paste the resume text directly."
        },
        { status: 400 }
      );
    }

    const atsResult = analyzeAtsSafety({
      resumeText: parsed.extractedText,
      structuredResume: parsed.structuredResume
    });

    return NextResponse.json({
      structuredResume: parsed.structuredResume,
      extractedText: parsed.extractedText,
      atsWarnings: atsResult.warnings,
      deletionPlan: buildDeletionPlan({
        rawFileName: file?.name ?? "inline-text",
        structuredResumeSaved: saveStructuredData
      }),
      auditLogPreview: [
        createAuditEvent("resume_uploaded", { fileName: file?.name ?? "inline-text" }),
        createAuditEvent("resume_extracted", { sectionCount: parsed.structuredResume.sections.length })
      ]
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error.message || "Resume upload failed."
      },
      { status: 500 }
    );
  }
}
