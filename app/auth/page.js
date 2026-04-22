"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SectionCard } from "@/components/ui/section-card";
import { useProofFitApp } from "@/components/providers/prooffit-provider";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, state } = useProofFitApp();
  const [mode, setMode] = useState("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await signIn({ email, password, mode });
      router.push(searchParams.get("next") || "/dashboard");
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
      await signIn({
        email: email || "google-user@prooffit.ai",
        password: "google-session",
        mode: "sign-in",
        provider: "google"
      });
      router.push(searchParams.get("next") || "/dashboard");
    } catch (submissionError) {
      setError(submissionError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="shell-width py-16">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
        <SectionCard eyebrow="Welcome back" title={mode === "sign-in" ? "Sign in to continue tailoring" : "Create your ProofFit account"}>
          <div className="mt-6 inline-flex rounded-full border border-[var(--line)] bg-white p-1">
            <button
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-semibold ${mode === "sign-in" ? "bg-[var(--ink)] text-white" : "text-[var(--ink-soft)]"}`}
              onClick={() => setMode("sign-in")}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-semibold ${mode === "sign-up" ? "bg-[var(--ink)] text-white" : "text-[var(--ink-soft)]"}`}
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
                className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none"
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
                className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none"
                placeholder="••••••••"
              />
            </label>

            {error ? <p className="rounded-2xl bg-[rgba(182,59,47,0.08)] px-4 py-3 text-sm font-semibold text-[var(--danger)]">{error}</p> : null}
            {state.authMessage ? <p className="rounded-2xl bg-[rgba(45,106,79,0.08)] px-4 py-3 text-sm font-semibold text-[var(--success)]">{state.authMessage}</p> : null}

            <button type="submit" className="button-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? "Working..." : mode === "sign-in" ? "Sign in" : "Create account"}
            </button>

            <button type="button" className="button-secondary w-full" onClick={handleGoogleContinue} disabled={isSubmitting}>
              Continue with Google
            </button>
          </form>
        </SectionCard>

        <SectionCard eyebrow="Why it matters" title="Trust is the feature">
          <div className="mt-6 space-y-4">
            {[
              "No fake claims or inflated metrics",
              "Meaningful result before any paywall",
              "Privacy settings and deletion controls built in",
              "Version history by company and role"
            ].map((item) => (
              <div key={item} className="rounded-3xl border border-[var(--line)] bg-white/80 p-5 text-sm font-semibold">
                {item}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
