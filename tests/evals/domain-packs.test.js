import { describe, expect, it } from "vitest";
import { findDomainMatches, inferPrimaryDomain } from "@/lib/constants/domain-packs";

describe("domain packs", () => {
  it("infers data engineering when data terms dominate", () => {
    expect(inferPrimaryDomain("SQL Python Airflow dbt Redshift warehouse")).toBe("Data Engineering");
  });

  it("finds analytics engineering terms", () => {
    const results = findDomainMatches("dbt semantic layer metrics modeling");
    const analytics = results.find((item) => item.id === "analytics-engineering");
    expect(analytics.matches).toContain("dbt");
  });
});
