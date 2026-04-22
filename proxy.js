import { NextResponse } from "next/server";

const protectedPaths = [
  "/dashboard",
  "/upload",
  "/job-analysis",
  "/workspace",
  "/ats-preview",
  "/history",
  "/settings",
  "/admin",
  "/api/resumes/upload",
  "/api/job-descriptions/analyze",
  "/api/tailoring/sessions",
  "/api/exports",
  "/api/privacy/delete"
];

export function proxy(request) {
  const isProtected = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));

  if (!isProtected) {
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get("prooffit_demo_session")?.value);

  if (hasSession) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      {
        error: "Authentication required."
      },
      { status: 401 }
    );
  }

  const redirectUrl = new URL("/auth", request.url);
  redirectUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/upload/:path*",
    "/job-analysis/:path*",
    "/workspace/:path*",
    "/ats-preview/:path*",
    "/history/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/api/resumes/upload",
    "/api/job-descriptions/analyze",
    "/api/tailoring/sessions",
    "/api/exports",
    "/api/privacy/delete"
  ]
};
