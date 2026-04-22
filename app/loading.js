export default function Loading() {
  return (
    <div className="shell-width py-16">
      <div className="animate-pulse space-y-6">
        <div className="h-10 w-56 rounded-full bg-[var(--surface-muted)]" />
        <div className="h-24 rounded-[2rem] bg-[var(--surface-muted)]" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-64 rounded-[2rem] bg-[var(--surface-muted)]" />
          <div className="h-64 rounded-[2rem] bg-[var(--surface-muted)]" />
          <div className="h-64 rounded-[2rem] bg-[var(--surface-muted)]" />
        </div>
      </div>
    </div>
  );
}
