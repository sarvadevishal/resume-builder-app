import { NextResponse } from "next/server";
import { buildDeletionPlan, createAuditEvent } from "@/lib/services/privacy-service";

export async function POST(request) {
  let body = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const deletionPlan = buildDeletionPlan({
    rawFileName: body.rawFileName || "inline-text",
    structuredResumeSaved: false,
    deleteRawFile: body.deleteRawUploads !== false
  });

  return NextResponse.json({
    deletionPlan,
    auditEvents: [
      createAuditEvent("raw_file_deleted", { rawFileName: body.rawFileName || "inline-text" }),
      createAuditEvent("structured_resume_deleted", { sessionId: body.sessionId || "local-session" })
    ]
  });
}
