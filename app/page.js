import Link from "next/link";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";

const trustPoints = [
  {
    title: "Proof behind every edit",
    detail: "Every suggested rewrite is anchored to a source resume snippet, matched job phrase, and confidence label."
  },
  {
    title: "Hallucination-resistant by design",
    detail: "Unsupported requirements stay in gap analysis instead of appearing as fabricated skills, metrics, or tools."
  },
  {
    title: "ATS-safe output",
    detail: "Single-column exports, standard section headers, parser warnings, and clean document structure come first."
  },
  {
    title: "Built for data professionals",
    detail: "Domain packs and heuristics are tuned for data engineering, analytics engineering, BI, and cloud data roles."
  }
];

const workflow = [
  "Upload a source resume and keep privacy controls visible from the first step.",
  "Analyze the target job description into must-haves, responsibilities, and seniority signals.",
  "Review proof-backed edits, accept or reject changes, and inspect unsupported requirements.",
  "Export an ATS-safe PDF or DOCX and retain version history by company and role."
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
            <span className="eyebrow">Premium resume tailoring for data roles</span>
            <h1 className="page-title mt-6 max-w-4xl text-balance">
              Truthful, ATS-safe resume tailoring with proof behind every important change.
            </h1>
            <p className="muted mt-6 max-w-2xl text-lg leading-8">
              ProofFit AI helps data professionals tailor resumes for specific roles without keyword stuffing, fake claims, or opaque match scores. The workflow is built to earn trust first and still move fast.
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
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Proof-backed edits", value: "100%" },
                { label: "Meaningful result", value: "< 1 min" },
                { label: "Opaque magic score", value: "0" }
              ].map((item) => (
                <div key={item.label} className="stat-card">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">{item.label}</p>
                  <p className="mt-3 text-3xl font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="premium-panel-dark">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.22em] text-white/60">Premium workspace</p>
                  <p className="mt-2 text-2xl font-semibold">A fast review loop for serious job searches</p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white/80">Live proof</div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/8 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">Supported by resume</p>
                  <p className="mt-3 text-base font-semibold">Built Python and SQL ELT pipelines for finance reporting workloads.</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/8 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">Matched job phrase</p>
                  <p className="mt-3 text-base font-semibold">Own orchestration and warehouse reliability for analytics pipelines.</p>
                </div>
                <div className="rounded-[1.5rem] bg-white/95 p-5 text-[var(--ink)]">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Confidence 0.89</p>
                    <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">ATS-safe</span>
                  </div>
                  <p className="mt-3 text-sm leading-7">
                    Rewrite preserves the original tools and scope while improving clarity around ownership and reliability. Unsupported tools stay in gap analysis instead of being inserted automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="shell-width mt-20">
        <div className="grid gap-6 lg:grid-cols-4">
          {trustPoints.map((point) => (
            <SectionCard key={point.title} title={point.title}>
              <p className="muted mt-4 text-sm leading-7">{point.detail}</p>
            </SectionCard>
          ))}
        </div>
      </section>

      <section className="shell-width mt-24 grid-12">
        <SectionCard className="lg:col-span-7" eyebrow="Workflow" title="An enterprise-grade flow built around trust, evidence, and speed">
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {workflow.map((step, index) => (
              <div key={step} className="info-tile">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Step {index + 1}</p>
                <p className="mt-3 text-lg font-semibold leading-8">{step}</p>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard className="lg:col-span-5" eyebrow="Scoring" title="No single opaque match number">
          <div className="mt-6 space-y-3">
            {scoreCards.map((item) => (
              <div key={item} className="info-tile flex items-center justify-between gap-4">
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
              <span key={term} className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                {term}
              </span>
            ))}
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
