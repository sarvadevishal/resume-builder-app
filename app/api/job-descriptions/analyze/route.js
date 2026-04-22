import { NextResponse } from "next/server";
import { analyzeJobDescription } from "@/lib/services/job-description-analyzer";

export async function POST(request) {
  const body = await request.json();
  const analysis = analyzeJobDescription(body.jobDescriptionText ?? "");

  return NextResponse.json(analysis);
}
