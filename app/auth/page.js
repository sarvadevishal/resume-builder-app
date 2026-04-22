"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SectionCard } from "@/components/ui/section-card";
import { useProofFitApp } from "@/components/providers/prooffit-provider";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, state, supportsSupabaseAuth, isHydratingAuth, isDemoMode } = useProofFitApp();
  const [mode, setMode] = useState("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(searchParams.get("error") || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nextPath = searchParams.get("next") || "/dashboard";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = await signIn({ email, password, mode, nextPath });
      if (!result?.redirecting) {
        router.push(nextPath);
      }
    } catch (submissionError) {
      setError(submissionError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleContinue() {
    setError("");
    setIsSubmitting(true);

    try {
      const result = await signIn({
        email,
        password,
        mode: "sign-in",
        provider: "google",
        nextPath
      });

      if (!result?.redirecting) {
        router.push(nextPath);
      }
    } catch (submissionError) {
      setError(submissionError.message);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="shell-width py-16">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <SectionCard eyebrow="Secure access" title={mode === "sign-in" ? "Sign in to continue tailoring" : "Create your ProofFit account"}>
          <div className="mt-6 inline-flex rounded-full border border-[var(--line)] bg-white p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <button
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === "sign-in" ? "bg-[var(--ink)] text-white" : "text-[var(--ink-soft)]"}`}
              onClick={() => setMode("sign-in")}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === "sign-up" ? "bg-[var(--ink)] text-white" : "text-[var(--ink-soft)]"}`}
              onClick={() => setMode("sign-up")}
            >
              Sign up
            </button>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block" htmlFor="auth-email">
              <span className="mb-2 block text-sm font-semibold">Work email</span>
              <input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="input-field"
                placeholder="you@company.com"
              />
            </label>

            <label className="block" htmlFor="auth-password">
              <span className="mb-2 block text-sm font-semibold">Password</span>
              <input
                id="auth-password"
                name="password"
                type="password"
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="input-field"
                placeholder="Enter your password"
              />
            </label>

            {error ? <p className="rounded-2xl bg-[rgba(190,18,60,0.08)] px-4 py-3 text-sm font-semibold text-[var(--danger)]">{error}</p> : null}
            {state.authMessage ? <p className="rounded-2xl bg-[rgba(15,118,110,0.08)] px-4 py-3 text-sm font-semibold text-[var(--success)]">{state.authMessage}</p> : null}
            {isDemoMode ? (
              <p className="rounded-2xl bg-[rgba(37,99,235,0.08)] px-4 py-3 text-sm font-semibold text-[var(--accent)]">
                Demo mode is active. Configure Supabase to enable real multi-user password auth and personal Google sign-in.
              </p>
            ) : null}

            <div className="grid gap-3">
              <button type="submit" className="button-primary w-full" disabled={isSubmitting || isHydratingAuth}>
                {isSubmitting ? "Working..." : mode === "sign-in" ? "Sign in" : "Create account"}
              </button>

              <button
                type="button"
                className="button-secondary w-full"
                onClick={handleGoogleContinue}
                disabled={isSubmitting || isHydratingAuth || !supportsSupabaseAuth}
                title={!supportsSupabaseAuth ? "Configure Supabase and Google auth to enable this." : "Continue with Google"}
              >
                Continue with Google
              </button>
            </div>
          </form>
        </SectionCard>

        <div className="space-y-6">
          <div className="premium-panel-dark">
            <p className="text-sm uppercase tracking-[0.22em] text-white/60">Why users trust it</p>
            <div className="mt-6 space-y-4">
              {[
                "No fake claims or inflated metrics",
                "Meaningful result before any paywall",
                "Privacy settings and deletion controls built in",
                "Version history by company and role"
              ].map((item) => (
                <div key={item} className="rounded-[1.4rem] border border-white/10 bg-white/8 p-4 text-sm font-semibold">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <SectionCard eyebrow="Built for trust" title="A premium workflow that keeps proof visible">
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                { label: "Evidence coverage", value: "Visible" },
                { label: "Raw file deletion", value: "Default on" },
                { label: "Unsupported gaps", value: "Never inserted" },
                { label: "Export quality", value: "ATS-safe" }
              ].map((item) => (
                <div key={item.label} className="stat-card">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">{item.label}</p>
                  <p className="mt-3 text-2xl font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
