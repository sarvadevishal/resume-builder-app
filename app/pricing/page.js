"use client";

import { useState } from "react";
import { SectionCard } from "@/components/ui/section-card";
import { useProofFitApp } from "@/components/providers/prooffit-provider";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Try ProofFit AI without getting trapped after upload.",
    features: ["3 tailoring sessions", "Meaningful preview before paywall", "ATS warnings and gap analysis"]
  },
  {
    name: "Pro",
    price: "$29",
    description: "Unlimited tailoring for serious job searches.",
    features: ["Unlimited sessions", "PDF and DOCX exports", "Version history", "All domain packs"]
  },
  {
    name: "Team",
    price: "Contact us",
    description: "Placeholder plan for coaches and agencies.",
    features: ["Shared libraries", "Coach review workflows", "Team billing and seats"]
  }
];

export default function PricingPage() {
  const { choosePlan, state } = useProofFitApp();
  const [statusMessage, setStatusMessage] = useState("");

  async function handleChoosePlan(planName) {
    setStatusMessage("");

    try {
      await choosePlan(planName.toLowerCase());
      if (planName !== "Team") {
        setStatusMessage(`${planName} plan selected successfully.`);
      }
    } catch (error) {
      setStatusMessage(error.message);
    }
  }

  return (
    <div className="shell-width py-16">
      <div className="mx-auto max-w-3xl text-center">
        <span className="eyebrow">Pricing</span>
        <h1 className="page-title mt-6">Pay for trustworthy output, not upload bait.</h1>
        <p className="muted mt-5 text-lg leading-8">
          ProofFit AI shows users meaningful tailoring results before asking them to pay. The Pro tier unlocks unlimited tailoring, export-ready output, and version history.
        </p>
        <p className="mt-4 text-sm font-semibold text-[var(--accent)]">Current plan: {state.currentPlan}</p>
        {statusMessage ? <p className="mt-4 rounded-2xl bg-[rgba(45,106,79,0.08)] px-4 py-3 text-sm font-semibold text-[var(--success)]">{statusMessage}</p> : null}
      </div>
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <SectionCard key={plan.name} title={plan.name} eyebrow={plan.price}>
            <p className="muted mt-4 text-sm leading-7">{plan.description}</p>
            <div className="mt-6 space-y-3">
              {plan.features.map((feature) => (
                <div key={feature} className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold">
                  {feature}
                </div>
              ))}
            </div>
            <button type="button" className="button-primary mt-6 w-full" onClick={() => handleChoosePlan(plan.name)}>
              {plan.name === "Team" ? "Talk to sales" : `Choose ${plan.name}`}
            </button>
          </SectionCard>
        ))}
      </div>
    </div>
  );
}
