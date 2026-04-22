export function MetricBar({ label, score, detail }) {
  return (
    <div className="rounded-3xl border border-[var(--line)] bg-white p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="font-semibold">{label}</p>
        <p className="text-sm font-semibold text-[var(--accent)]">{score}</p>
      </div>
      <div className="mt-3 h-2 rounded-full bg-[var(--surface-muted)]">
        <div className="h-full rounded-full bg-[var(--ink)]" style={{ width: `${Math.min(score, 100)}%` }} />
      </div>
      {detail ? <p className="muted mt-3 text-sm leading-6">{detail}</p> : null}
    </div>
  );
}
