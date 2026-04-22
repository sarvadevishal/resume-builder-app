import Link from "next/link";
import { appNavigation } from "@/lib/constants/navigation";

export function AppShell({ children, title, description, fullWidth = false }) {
  return (
    <div className={`${fullWidth ? "shell-width max-w-none" : "shell-width"} py-10`}>
      <div className="grid gap-6 xl:grid-cols-[250px_1fr]">
        <aside className="surface hidden h-fit rounded-[2rem] p-5 xl:block">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">ProofFit workflow</p>
          <div className="mt-5 space-y-2">
            {appNavigation.map((item) => (
              <Link key={item.href} href={item.href} className="block rounded-2xl px-4 py-3 text-sm font-semibold transition hover:bg-white">
                <p>{item.label}</p>
                <p className="mt-1 text-xs font-medium text-[var(--ink-soft)]">{item.detail}</p>
              </Link>
            ))}
          </div>
        </aside>
        <div>
          <div className="mb-6 rounded-[2rem] border border-[var(--line)] bg-white/70 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">ProofFit AI</p>
            <h1 className="mt-3 text-3xl font-semibold">{title}</h1>
            <p className="muted mt-3 max-w-3xl text-sm leading-7">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
