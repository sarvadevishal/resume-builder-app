export const exportTemplateRegistry = {
  "ats-classic": {
    id: "ats-classic",
    label: "ATS Classic",
    sectionRule: "single-column",
    headingDecoration: "rule",
    accentColor: "#111827"
  },
  "professional-modern": {
    id: "professional-modern",
    label: "Professional Modern",
    sectionRule: "soft-rule",
    headingDecoration: "tone",
    accentColor: "#274c7f"
  }
};

export function getExportTemplate(templateId) {
  return exportTemplateRegistry[templateId] || exportTemplateRegistry["ats-classic"];
}
