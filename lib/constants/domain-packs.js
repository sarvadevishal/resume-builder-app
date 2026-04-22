export const domainPacks = {
  dataEngineering: {
    id: "data-engineering",
    label: "Data Engineering",
    coreTerms: [
      "sql",
      "python",
      "redshift",
      "snowflake",
      "bigquery",
      "dbt",
      "airflow",
      "spark",
      "etl",
      "elt",
      "data warehousing",
      "dimensional modeling",
      "orchestration",
      "s3",
      "aws glue",
      "lambda",
      "ci/cd",
      "observability",
      "performance optimization",
      "cost optimization"
    ]
  },
  analyticsEngineering: {
    id: "analytics-engineering",
    label: "Analytics Engineering",
    coreTerms: [
      "dbt",
      "sql",
      "semantic layer",
      "metrics",
      "testing",
      "documentation",
      "warehouse",
      "modeling",
      "transformation",
      "looker",
      "tableau"
    ]
  },
  businessIntelligence: {
    id: "business-intelligence",
    label: "Business Intelligence",
    coreTerms: [
      "tableau",
      "power bi",
      "looker",
      "dashboard",
      "reporting",
      "data visualization",
      "kpi",
      "stakeholder management",
      "ad hoc analysis"
    ]
  },
  cloudData: {
    id: "cloud-data",
    label: "Cloud Data / AWS",
    coreTerms: [
      "aws",
      "s3",
      "redshift",
      "glue",
      "lambda",
      "iam",
      "athena",
      "terraform",
      "cloudformation",
      "eventbridge"
    ]
  },
  platformInfrastructure: {
    id: "platform-infrastructure",
    label: "Platform / Data Infrastructure",
    coreTerms: [
      "kubernetes",
      "terraform",
      "observability",
      "ci/cd",
      "monitoring",
      "lineage",
      "data platform",
      "reliability",
      "governance",
      "incident response"
    ]
  }
};

export function getAllDomainTerms() {
  return Object.values(domainPacks).flatMap((pack) => pack.coreTerms);
}

export function findDomainMatches(text = "") {
  const normalized = text.toLowerCase();

  return Object.values(domainPacks).map((pack) => {
    const matches = pack.coreTerms.filter((term) => normalized.includes(term));
    return {
      ...pack,
      matches
    };
  });
}

export function inferPrimaryDomain(text = "") {
  const ranked = findDomainMatches(text)
    .map((pack) => ({ label: pack.label, count: pack.matches.length }))
    .sort((left, right) => right.count - left.count);

  return ranked[0]?.count ? ranked[0].label : "General data role";
}
