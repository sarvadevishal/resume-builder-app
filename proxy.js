import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabasePublishableKey, getSupabaseUrl, isSupabaseConfigured } from "@/lib/services/supabase/config";

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

async function getAuthenticatedUser(request) {
  if (!isSupabaseConfigured()) {
    const marker = request.cookies.get("prooffit_demo_session")?.value;
    return marker ? { email: marker } : null;
  }

  let response = NextResponse.next({
    request
  });

  const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll().map((cookie) => ({
          name: cookie.name,
          value: cookie.value
        }));
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  return {
    user,
    response
  };
}

export async function proxy(request) {
  const isProtected = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));

  if (!isProtected) {
    return NextResponse.next();
  }

  const authResult = await getAuthenticatedUser(request);
  const hasSession = isSupabaseConfigured() ? Boolean(authResult.user) : Boolean(authResult?.email);

  if (hasSession) {
    return isSupabaseConfigured() ? authResult.response : NextResponse.next();
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
