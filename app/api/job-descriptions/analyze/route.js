import { NextResponse } from "next/server";
import { analyzeJobDescription } from "@/lib/services/job-description-analyzer";

export async function POST(request) {
  let body = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "The job description request body was invalid."
      },
      { status: 400 }
    );
  }

  if (typeof body.jobDescriptionText !== "string" || !body.jobDescriptionText.trim()) {
    return NextResponse.json(
      {
        error: "Paste a job description before analyzing it."
      },
      { status: 400 }
    );
  }

  const analysis = analyzeJobDescription(body.jobDescriptionText);

  return NextResponse.json(analysis);
}
