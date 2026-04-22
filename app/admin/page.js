import { AppShell } from "@/components/layout/app-shell";
import { SectionCard } from "@/components/ui/section-card";

const metrics = [
  { label: "Hallucination-free sessions", value: "99.2%" },
  { label: "Evidence-linked suggestions", value: "96.8%" },
  { label: "First meaningful result", value: "43 sec" },
  { label: "Export completion rate", value: "71%" }
];

export default function AdminPage() {
  return (
    <AppShell title="Admin analytics" description="Track trust, quality, and monetization signals with product-specific metrics instead of vanity dashboards.">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <SectionCard key={metric.label} title={metric.value} eyebrow={metric.label} />
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <SectionCard title="User trust metrics" eyebrow="Quality">
          <div className="mt-6 space-y-3">
            {[
              "Suggestion rejection rate by confidence bucket",
              "User-reported unsupported edit rate",
              "Average gap-analysis usefulness score"
            ].map((item) => (
              <div key={item} className="info-tile text-sm font-semibold">
                {item}
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Revenue and plan health" eyebrow="Billing">
          <div className="mt-6 space-y-3">
            {[
              "Free-to-Pro conversion after first completed export",
              "Active users with version history enabled",
              "Team tier placeholder and waitlist count"
            ].map((item) => (
              <div key={item} className="info-tile text-sm font-semibold">
                {item}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
