import { NextResponse } from "next/server";
import { runTailoringSession } from "@/lib/services/tailoring-engine";

export async function POST(request) {
  const body = await request.json();
  const session = await runTailoringSession({
    structuredResume: body.structuredResume,
    jobDescriptionText: body.jobDescriptionText,
    company: body.company,
    role: body.role
  });

  return NextResponse.json(session);
}
