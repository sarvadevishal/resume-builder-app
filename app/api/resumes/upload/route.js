import { NextResponse } from "next/server";
import { parseResumeInput } from "@/lib/services/resume-parser";
import { analyzeAtsSafety } from "@/lib/services/ats-safety";
import { buildDeletionPlan, createAuditEvent } from "@/lib/services/privacy-service";

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const text = formData.get("text");
  const saveStructuredData = formData.get("saveStructuredData") === "true";
  const parsed = await parseResumeInput({ file, text });
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
}
