import { NextResponse } from "next/server";
import { runTailoringSession } from "@/lib/services/tailoring-engine";

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body?.structuredResume?.sections?.length) {
      return NextResponse.json(
        {
          error: "Upload a resume before generating a tailoring session."
        },
        { status: 400 }
      );
    }

    if (!body?.jobDescriptionText?.trim()) {
      return NextResponse.json(
        {
          error: "Analyze a target job description before generating a tailoring session."
        },
        { status: 400 }
      );
    }

    const session = await runTailoringSession({
      structuredResume: body.structuredResume,
      jobDescriptionText: body.jobDescriptionText,
      company: body.company,
      role: body.role
    });

    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json(
      {
        error: error.message || "Tailoring session generation failed."
      },
      { status: 500 }
    );
  }
}
