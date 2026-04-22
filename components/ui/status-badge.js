import clsx from "clsx";

const toneClasses = {
  success: "bg-[rgba(15,118,110,0.12)] text-[var(--success)] border-[rgba(15,118,110,0.18)]",
  neutral: "bg-white/90 text-[var(--ink)] border-[var(--line)]",
  accent: "bg-[rgba(37,99,235,0.12)] text-[var(--accent)] border-[rgba(37,99,235,0.18)]"
};

export function StatusBadge({ label, tone = "neutral" }) {
  return (
    <span className={clsx("rounded-full border px-4 py-2 text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]", toneClasses[tone])}>
      {label}
    </span>
  );
}
