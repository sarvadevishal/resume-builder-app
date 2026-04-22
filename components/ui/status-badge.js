import clsx from "clsx";

const toneClasses = {
  success: "bg-[rgba(45,106,79,0.12)] text-[var(--success)] border-[rgba(45,106,79,0.22)]",
  neutral: "bg-white text-[var(--ink)] border-[var(--line)]",
  accent: "bg-[rgba(155,106,53,0.12)] text-[var(--accent)] border-[rgba(155,106,53,0.22)]"
};

export function StatusBadge({ label, tone = "neutral" }) {
  return (
    <span className={clsx("rounded-full border px-4 py-2 text-sm font-semibold", toneClasses[tone])}>
      {label}
    </span>
  );
}
