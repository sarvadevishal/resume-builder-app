import { NextResponse } from "next/server";
import { buildDeletionPlan, createAuditEvent } from "@/lib/services/privacy-service";

export async function POST(request) {
  const body = await request.json();
  const deletionPlan = buildDeletionPlan({
    rawFileName: body.rawFileName,
    structuredResumeSaved: false
  });

  return NextResponse.json({
    deletionPlan,
    auditEvents: [
      createAuditEvent("raw_file_deleted", { rawFileName: body.rawFileName }),
      createAuditEvent("structured_resume_deleted", { sessionId: body.sessionId })
    ]
  });
}
