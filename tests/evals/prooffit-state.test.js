import { describe, expect, it } from "vitest";
import { buildFinalStructuredResume, buildVersionFromSession } from "@/lib/prooffit-state";

describe("prooffit state helpers", () => {
  it("applies accepted suggestions across non-experience sections", () => {
    const finalResume = buildFinalStructuredResume({
      structuredResume: {
        sections: [
          { name: "Summary", items: ["Built data products for finance teams."] },
          { name: "Experience", items: ["Owned warehouse reliability for reporting."] }
        ]
      },
      suggestions: [
        {
          originalBullet: "Built data products for finance teams.",
          suggestedBullet: "Built data products for finance teams with clearer emphasis on stakeholder outcomes.",
          decision: "accepted",
          sectionIndex: 0,
          itemIndex: 0
        }
      ]
    });

    expect(finalResume.sections[0].items).toEqual([
      "Built data products for finance teams with clearer emphasis on stakeholder outcomes."
    ]);
    expect(finalResume.sections[1].items).toEqual(["Owned warehouse reliability for reporting."]);
  });

  it("keeps duplicate bullets mapped to the correct suggestion instance", () => {
    const finalResume = buildFinalStructuredResume({
      structuredResume: {
        sections: [
          {
            name: "Experience",
            items: ["Built SQL pipelines.", "Built SQL pipelines."]
          }
        ]
      },
      suggestions: [
        {
          originalBullet: "Built SQL pipelines.",
          suggestedBullet: "Built SQL pipelines for finance reporting.",
          decision: "accepted",
          sectionIndex: 0,
          itemIndex: 0
        },
        {
          originalBullet: "Built SQL pipelines.",
          suggestedBullet: "Built SQL pipelines for analytics enablement.",
          decision: "accepted",
          sectionIndex: 0,
          itemIndex: 1
        }
      ]
    });

    expect(finalResume.sections[0].items).toEqual([
      "Built SQL pipelines for finance reporting.",
      "Built SQL pipelines for analytics enablement."
    ]);
  });

  it("stores a restorable snapshot only when structured resume saving is enabled", () => {
    const session = {
      company: "Northstar",
      role: "Data Engineer",
      suggestions: [
        { decision: "accepted" },
        { decision: "manual" },
        { decision: "rejected" }
      ]
    };

    const withSnapshot = buildVersionFromSession({
      session,
      resumeUpload: { structuredResume: { sections: [{ name: "Experience", items: ["Built ELT pipelines."] }] } },
      jobDescription: { company: "Northstar", role: "Data Engineer", text: "Build ELT pipelines.", analysis: { mustHaveSkills: ["SQL"] } },
      privacyPreferences: { saveStructuredResume: true }
    });

    const withoutSnapshot = buildVersionFromSession({
      session,
      resumeUpload: { structuredResume: { sections: [{ name: "Experience", items: ["Built ELT pipelines."] }] } },
      jobDescription: { company: "Northstar", role: "Data Engineer", text: "Build ELT pipelines.", analysis: { mustHaveSkills: ["SQL"] } },
      privacyPreferences: { saveStructuredResume: false }
    });

    expect(withSnapshot.acceptedChanges).toBe(2);
    expect(withSnapshot.snapshot?.tailoringSession).toBeTruthy();
    expect(withoutSnapshot.snapshot).toBeNull();
  });
});
