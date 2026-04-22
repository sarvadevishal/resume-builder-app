import clsx from "clsx";

export function SectionCard({ eyebrow, title, children, className }) {
  return (
    <section className={clsx("surface rounded-[2rem] p-6 sm:p-8", className)}>
      {eyebrow ? <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">{eyebrow}</p> : null}
      {title ? <h2 className="mt-3 text-2xl font-semibold leading-tight">{title}</h2> : null}
      {children}
    </section>
  );
}
