"use client";

export default function GlobalError({ error, reset }) {
  return (
    <div className="shell-width py-16">
      <div className="premium-panel mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Something went wrong</p>
        <h1 className="mt-4 text-3xl font-semibold">The workflow hit an unexpected error.</h1>
        <p className="muted mt-4 text-sm leading-7">
          {error?.message || "Try again, and if the problem persists, inspect the API route and environment configuration."}
        </p>
        <button className="button-primary mt-6" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
