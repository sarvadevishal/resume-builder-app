export const demoJobDescriptionAnalysis = {
  primaryDomain: "Data Engineering",
  seniority: "Senior individual contributor",
  mustHaveSkills: ["SQL", "Python", "Airflow", "dbt", "Snowflake", "Data warehousing"],
  preferredSkills: ["Kubernetes", "Terraform", "Cost optimization", "Observability"],
  responsibilities: [
    "Own orchestration and warehouse reliability for analytics pipelines.",
    "Improve transformation quality and performance across the data platform.",
    "Partner with analytics and BI teams to ship trusted datasets."
  ],
  gaps: [
    {
      name: "Kubernetes",
      severity: "medium",
      nextStep: "If you have used Kubernetes for orchestration or platform work, add it in the most relevant experience bullet or project entry."
    },
    {
      name: "Snowflake",
      severity: "high",
      nextStep: "Do not insert Snowflake automatically. Only add it if it is truly present in prior work, otherwise keep it flagged as a gap."
    }
  ]
};

export const demoSession = {
  id: "session-demo-001",
  company: "Northbeam Data",
  role: "Senior Data Engineer",
  originalBullets: [
    "Built ELT pipelines in Python and SQL for finance reporting workloads.",
    "Maintained Redshift tables and improved data quality for executive dashboards.",
    "Partnered with analysts to define reusable transformation logic."
  ],
  structuredResume: {
    sections: [
      {
        name: "Summary",
        items: [
          "Data engineer with 6+ years building analytics pipelines, warehouse models, and reliable reporting layers."
        ]
      },
      {
        name: "Skills",
        items: [
          "SQL, Python, Redshift, Airflow, dbt, GitHub Actions, dimensional modeling"
        ]
      },
      {
        name: "Experience",
        items: [
          "Built ELT pipelines in Python and SQL for finance reporting workloads.",
          "Maintained Redshift tables and improved data quality for executive dashboards.",
          "Partnered with analysts to define reusable transformation logic."
        ]
      },
      {
        name: "Education",
        items: ["B.S. in Information Systems"]
      }
    ]
  },
  suggestions: [
    {
      id: "suggestion-1",
      label: "Pipeline ownership",
      originalBullet: "Built ELT pipelines in Python and SQL for finance reporting workloads.",
      suggestedBullet: "Built Python and SQL ELT pipelines for finance reporting workloads, improving alignment with orchestration and warehouse ownership requirements.",
      whyItChanged: "The rewrite preserves the original tools and workload while making ownership and pipeline scope clearer for the target role.",
      sourceResumeSnippet: "Built ELT pipelines in Python and SQL for finance reporting workloads.",
      matchedJobDescriptionSnippet: "Own orchestration and warehouse reliability for analytics pipelines.",
      confidenceScore: 0.92,
      supportLabel: "Supported by explicit pipeline and language evidence in the source resume.",
      defaultDecision: "accepted"
    },
    {
      id: "suggestion-2",
      label: "Warehouse performance",
      originalBullet: "Maintained Redshift tables and improved data quality for executive dashboards.",
      suggestedBullet: "Maintained Redshift tables for executive dashboards while improving data quality and surfacing stronger warehouse stewardship.",
      whyItChanged: "The suggestion keeps Redshift and data quality intact while emphasizing ownership language that maps to the job description without inventing results.",
      sourceResumeSnippet: "Maintained Redshift tables and improved data quality for executive dashboards.",
      matchedJobDescriptionSnippet: "Improve transformation quality and performance across the data platform.",
      confidenceScore: 0.89,
      supportLabel: "Supported by direct Redshift and data-quality evidence in the source resume.",
      defaultDecision: "accepted"
    },
    {
      id: "suggestion-3",
      label: "Cross-functional delivery",
      originalBullet: "Partnered with analysts to define reusable transformation logic.",
      suggestedBullet: "Partnered with analysts to define reusable transformation logic that supported trusted downstream datasets.",
      whyItChanged: "The rewrite keeps collaboration and transformation logic while clarifying the business impact in a truthful way.",
      sourceResumeSnippet: "Partnered with analysts to define reusable transformation logic.",
      matchedJobDescriptionSnippet: "Partner with analytics and BI teams to ship trusted datasets.",
      confidenceScore: 0.84,
      supportLabel: "Supported by the original collaboration and transformation statement.",
      defaultDecision: "accepted"
    }
  ],
  scores: [
    {
      id: "terminology",
      label: "Terminology coverage",
      score: 81,
      detail: "Strong overlap on SQL, Python, ELT, Redshift, and transformation language. Snowflake remains a gap."
    },
    {
      id: "evidence",
      label: "Evidence coverage",
      score: 93,
      detail: "Every suggested edit is grounded in a source resume snippet and matched JD phrase."
    },
    {
      id: "ats",
      label: "ATS formatting risk",
      score: 92,
      detail: "Single-column layout and standard headers are safe. One date normalization warning remains."
    },
    {
      id: "readability",
      label: "Readability",
      score: 87,
      detail: "Bullets are more concise and more specific without drifting into robotic phrasing."
    },
    {
      id: "domain",
      label: "Domain fit",
      score: 84,
      detail: "Good alignment for analytics engineering and warehouse work. Kubernetes and Snowflake are not supported."
    },
    {
      id: "seniority",
      label: "Seniority alignment",
      score: 80,
      detail: "The resume shows ownership signals but could use more scoped leadership evidence if it exists."
    }
  ],
  gaps: [
    {
      name: "Snowflake",
      severity: "high",
      nextStep: "If Snowflake is real experience, add it to the skills section or a job bullet with a source-backed example."
    },
    {
      name: "Kubernetes",
      severity: "medium",
      nextStep: "Only add Kubernetes if it appears in a real project or platform responsibility. Otherwise keep it flagged."
    }
  ],
  atsWarnings: [
    {
      title: "Normalize date formatting",
      detail: "Use one date style across all roles, such as `Jan 2022 - Mar 2025`, to reduce parser ambiguity."
    },
    {
      title: "Avoid mixed heading formats",
      detail: "Keep section titles consistent and standard, such as Summary, Skills, Experience, Education, and Projects."
    }
  ]
};

export const demoVersionHistory = [
  {
    id: "version-1",
    company: "Northbeam Data",
    role: "Senior Data Engineer",
    acceptedChanges: 7,
    updatedAt: "Apr 21, 2026"
  },
  {
    id: "version-2",
    company: "Lighthouse BI",
    role: "Analytics Engineer",
    acceptedChanges: 5,
    updatedAt: "Apr 20, 2026"
  },
  {
    id: "version-3",
    company: "Astra Cloud",
    role: "Cloud Data Architect",
    acceptedChanges: 6,
    updatedAt: "Apr 14, 2026"
  }
];
