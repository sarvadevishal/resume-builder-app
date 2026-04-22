import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ExportPanel } from "@/components/export/export-panel";

const structuredResume = {
  sections: [
    { name: "Contact", items: ["Alex Candidate", "Seattle, WA", "alex@example.com"] },
    { name: "Summary", items: ["Data engineer with production ownership across SQL, Python, and orchestration."] },
    { name: "Experience", items: ["Senior Data Engineer | Example | Jan 2022 - Present", "Built reliable data products for finance."] }
  ]
};

describe("ExportPanel", () => {
  it("shows ATS-safe guidance and disables unsupported professional highlight combinations", () => {
    const onExport = vi.fn();

    render(<ExportPanel structuredResume={structuredResume} sessionContext={{}} onExport={onExport} isExporting={false} />);

    expect(screen.getByText("ATS-safe recommended")).toBeInTheDocument();
    expect(screen.getByText("ATS mode selected")).toBeInTheDocument();
    expect(screen.getByLabelText(/Subtle matched emphasis/i)).toBeDisabled();
  });

  it("passes resolved export settings to the export handler", () => {
    const onExport = vi.fn();

    const { container } = render(<ExportPanel structuredResume={structuredResume} sessionContext={{}} onExport={onExport} isExporting={false} />);

    fireEvent.click(container.querySelector("button.button-primary"));

    expect(onExport).toHaveBeenCalledWith(
      expect.objectContaining({
        format: "pdf",
        mode: "ats"
      })
    );
  });
});
