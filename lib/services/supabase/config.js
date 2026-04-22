export function shouldForceDemoAuth() {
  return process.env.NEXT_PUBLIC_FORCE_DEMO_AUTH === "true";
}

export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || "";
}

export function getSupabasePublishableKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
}

export function isSupabaseConfigured() {
  if (shouldForceDemoAuth()) {
    return false;
  }

  return Boolean(getSupabaseUrl() && getSupabasePublishableKey());
}
