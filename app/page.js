import Link from "next/link";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";

const trustPoints = [
  "Every rewrite shows the source resume snippet, matched JD phrase, reason, and confidence.",
  "Unsupported requirements become gaps instead of hallucinated edits.",
  "ATS-safe mode keeps exports single-column, clean, and parser-friendly.",
  "Built for data roles, not generic resumes that flatten technical nuance."
];

const workflow = [
  "Upload a PDF or DOCX resume",
  "Paste a target job description",
  "Review proof-backed, truthful edits",
  "Accept changes and export an ATS-safe final version"
];

const scoreCards = [
  "Terminology coverage",
  "Evidence coverage",
  "ATS formatting risk",
  "Readability",
  "Domain fit",
  "Seniority alignment"
];

export default function HomePage() {
  return (
    <div className="pb-20">
      <section className="shell-width pt-10 sm:pt-16">
        <div className="grid-12 items-center gap-y-10">
          <div className="lg:col-span-7">
            <span className="eyebrow">Proof-backed resume tailoring</span>
            <h1 className="page-title mt-6 max-w-3xl text-balance">
              The fastest way for data professionals to create truthful, ATS-safe, job-specific resumes.
            </h1>
            <p className="muted mt-6 max-w-2xl text-lg leading-8">
              ProofFit AI tailors your resume without inventing experience, stuffing keywords, or hiding behind fake ATS scores. Every important suggestion is grounded in evidence from your actual resume.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/workspace" className="button-primary">
                Open the workspace
              </Link>
              <Link href="/pricing" className="button-secondary">
                See pricing
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <StatusBadge label="No fabricated metrics" tone="success" />
              <StatusBadge label="ATS-safe exports" tone="neutral" />
              <StatusBadge label="Built for data roles" tone="accent" />
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="surface rounded-[2rem] p-6 sm:p-8">
              <div className="rounded-[1.5rem] bg-[var(--ink)] p-6 text-white">
                <p className="text-sm uppercase tracking-[0.2em] text-white/60">What users see</p>
                <div className="mt-5 space-y-4">
                  <div className="rounded-3xl bg-white/8 p-4">
                    <p className="text-sm text-white/70">Supported by resume</p>
                    <p className="mt-2 font-semibold">&quot;Built Airflow-managed ELT pipelines for Redshift&quot;</p>
                  </div>
                  <div className="rounded-3xl bg-white/8 p-4">
                    <p className="text-sm text-white/70">Matched JD phrase</p>
                    <p className="mt-2 font-semibold">&quot;Own orchestration and warehouse performance&quot;</p>
                  </div>
                  <div className="rounded-3xl bg-[var(--accent)]/90 p-4 text-[var(--ink)]">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em]">Confidence 0.89</p>
                    <p className="mt-2 text-sm leading-7">
                      Rewrite keeps Airflow, Redshift, and performance tuning because they are explicitly supported in the source resume.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="shell-width mt-20">
        <div className="grid gap-6 lg:grid-cols-4">
          {trustPoints.map((point) => (
            <SectionCard key={point} title={point.split(",")[0]}>
              <p className="muted text-sm leading-7">{point}</p>
            </SectionCard>
          ))}
        </div>
      </section>

      <section className="shell-width mt-24 grid-12">
        <SectionCard className="lg:col-span-7" eyebrow="Workflow" title="A premium flow built around trust, not generic AI output">
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {workflow.map((step, index) => (
              <div key={step} className="rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Step {index + 1}</p>
                <p className="mt-3 text-lg font-semibold">{step}</p>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard className="lg:col-span-5" eyebrow="Scoring" title="No single opaque match number">
          <div className="mt-6 space-y-3">
            {scoreCards.map((item) => (
              <div key={item} className="flex items-center justify-between rounded-2xl border border-[var(--line)] bg-white/80 px-4 py-3">
                <span className="font-semibold">{item}</span>
                <span className="text-sm text-[var(--ink-soft)]">Explained</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="shell-width mt-24">
        <SectionCard eyebrow="Built for data professionals" title="Domain packs tuned for the vocabulary real hiring teams look for">
          <div className="mt-6 flex flex-wrap gap-3">
            {[
              "SQL",
              "Python",
              "Snowflake",
              "BigQuery",
              "Redshift",
              "dbt",
              "Airflow",
              "Spark",
              "AWS Glue",
              "Lambda",
              "Dimensional modeling",
              "Cost optimization"
            ].map((term) => (
              <span key={term} className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold">
                {term}
              </span>
            ))}
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
