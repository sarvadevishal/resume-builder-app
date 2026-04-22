"use client";

import Link from "next/link";
import { useState } from "react";
import { useProofFitApp } from "@/components/providers/prooffit-provider";

const navItems = [
  { href: "/workspace", label: "Workspace" },
  { href: "/ats-preview", label: "ATS Preview" },
  { href: "/pricing", label: "Pricing" },
  { href: "/settings", label: "Privacy" }
];

export function SiteHeader() {
  const { state, signOut } = useProofFitApp();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[rgba(247,244,238,0.78)] backdrop-blur-xl">
      <div className="shell-width py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--ink)] text-sm font-bold uppercase tracking-[0.18em] text-white">
              PF
            </div>
            <div>
              <p className="text-lg font-semibold">ProofFit AI</p>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-soft)]">Truthful tailoring for data roles</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm font-semibold text-[var(--ink-soft)] transition hover:text-[var(--ink)]">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="button-secondary lg:hidden"
              aria-expanded={isMobileNavOpen}
              aria-controls="mobile-site-nav"
              onClick={() => setIsMobileNavOpen((current) => !current)}
            >
              Menu
            </button>
            {state.currentUser ? (
              <>
                <span className="hidden rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold sm:inline-flex">
                  {state.currentUser.email}
                </span>
                <button type="button" onClick={signOut} className="button-secondary">
                  Sign out
                </button>
              </>
            ) : (
              <Link href="/auth" className="button-secondary hidden sm:inline-flex">
                Sign in
              </Link>
            )}
            <Link href="/dashboard" className="button-primary">
              Open app
            </Link>
          </div>
        </div>

        {isMobileNavOpen ? (
          <nav id="mobile-site-nav" className="mt-4 grid gap-2 rounded-[1.5rem] border border-[var(--line)] bg-white p-3 lg:hidden">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl px-4 py-3 text-sm font-semibold text-[var(--ink-soft)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]"
                onClick={() => setIsMobileNavOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
    </header>
  );
}
