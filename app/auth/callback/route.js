import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabasePublishableKey, getSupabaseUrl, isSupabaseConfigured } from "@/lib/services/supabase/config";

export const runtime = "nodejs";

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = requestUrl.searchParams.get("next") || "/dashboard";
  const safeNextPath = nextPath.startsWith("/") ? nextPath : "/dashboard";

  if (!code) {
    return NextResponse.redirect(new URL(`/auth?error=${encodeURIComponent("Missing OAuth code.")}`, request.url));
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL(`/auth?error=${encodeURIComponent("Supabase is not configured.")}`, request.url));
  }

  let response = NextResponse.redirect(new URL(safeNextPath, request.url));
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
        response = NextResponse.redirect(new URL(safeNextPath, request.url));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      }
    }
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(`/auth?error=${encodeURIComponent(error.message)}`, request.url));
  }

  const email = data.user?.email;

  if (email) {
    response.cookies.set("prooffit_demo_session", email, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax"
    });
  }

  return response;
}
