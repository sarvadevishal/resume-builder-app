"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useProofFitApp } from "@/components/providers/prooffit-provider";

const navItems = [
  { href: "/workspace", label: "Workspace" },
  { href: "/ats-preview", label: "ATS Preview" },
  { href: "/pricing", label: "Pricing" },
  { href: "/settings", label: "Privacy" }
];

export function SiteHeader() {
  const pathname = usePathname();
  const { state, signOut } = useProofFitApp();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-[rgba(244,247,251,0.74)] backdrop-blur-xl">
      <div className="shell-width py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.35rem] bg-[linear-gradient(135deg,var(--accent),#0f172a)] text-sm font-bold uppercase tracking-[0.18em] text-white shadow-[0_16px_34px_rgba(37,99,235,0.3)]">
              PF
            </div>
            <div>
              <p className="text-lg font-semibold">ProofFit AI</p>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--ink-soft)]">Truthful tailoring for data roles</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 lg:flex">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive ? "bg-[var(--ink)] text-white" : "text-[var(--ink-soft)] hover:bg-white hover:text-[var(--ink)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
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
                <span className="hidden rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-sm font-semibold sm:inline-flex">
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
          <nav id="mobile-site-nav" className="premium-panel mt-4 grid gap-2 lg:hidden">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-[1.25rem] px-4 py-3 text-sm font-semibold transition ${
                  pathname === item.href ? "bg-[var(--ink)] text-white" : "text-[var(--ink-soft)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]"
                }`}
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
