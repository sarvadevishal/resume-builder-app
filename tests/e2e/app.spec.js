const { test, expect } = require("@playwright/test");
const path = require("node:path");
const { Document, Packer, Paragraph, TextRun } = require("docx");

async function buildDocxResumeBuffer() {
  const document = new Document({
    sections: [
      {
        children: [
          new Paragraph({ children: [new TextRun("Taylor Analyst")] }),
          new Paragraph({ children: [new TextRun("SUMMARY")] }),
          new Paragraph({ children: [new TextRun("Analytics engineer with SQL, dbt, and warehouse modeling experience.")] }),
          new Paragraph({ children: [new TextRun("EXPERIENCE")] }),
          new Paragraph({ children: [new TextRun("- Built dbt models and maintained Snowflake reporting layers.")] }),
          new Paragraph({ children: [new TextRun("- Partnered with BI teams to improve metric reliability.")] })
        ]
      }
    ]
  });

  return Packer.toBuffer(document);
}

async function signIn(page, options = {}) {
  await page.goto("/auth");

  if (options.mode === "sign-up") {
    await page.getByRole("button", { name: "Sign up" }).click();
  }

  if (options.provider === "google") {
    await page.locator("form").getByRole("button", { name: "Continue with Google" }).click();
  } else {
    await page.getByLabel("Work email").fill(options.email || "qa-user@prooffit.ai");
    await page.getByLabel("Password").fill(options.password || "super-secret");
    await page.locator("form").getByRole("button", { name: options.mode === "sign-up" ? "Create account" : "Sign in" }).click();
  }

  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByText(/Signed in as/i)).toBeVisible();
}

test("protected routes redirect anonymous users to auth", async ({ page }) => {
  await page.goto("/workspace");
  await expect(page).toHaveURL(/auth\?next=%2Fworkspace/);
});

test("email sign-in and dashboard navigation work", async ({ page }) => {
  await signIn(page);
  await page.getByRole("link", { name: "Open workspace" }).click();
  await expect(page).toHaveURL(/workspace/);
  await expect(page.getByRole("heading", { name: "Tailoring workspace" })).toBeVisible();
});

test("sign-up mode works and pricing CTAs are actionable", async ({ page }) => {
  await signIn(page, { mode: "sign-up", email: "new-user@prooffit.ai" });
  await page.goto("/pricing");
  await page.getByRole("button", { name: "Choose Free" }).click();
  await expect(page.getByText(/Free plan selected successfully/i)).toBeVisible();
});

test("google auth explains configuration requirements when Supabase is not configured", async ({ page }) => {
  await page.goto("/auth");
  await expect(page.getByText(/Demo mode is active/i)).toBeVisible();
  await expect(page.locator("form").getByRole("button", { name: "Continue with Google" })).toBeDisabled();
});

test("resume upload, JD analysis, workspace, export, settings, and history work together", async ({ page }) => {
  await signIn(page);

  await page.getByRole("link", { name: /Resume upload/i }).click();
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Choose file" }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(path.join(process.cwd(), "tests", "fixtures", "sample-resume.pdf"));
  await page.getByRole("button", { name: "Process resume" }).click();
  await expect(page.getByText(/Deletion plan/i)).toBeVisible();
  await expect(page.getByText("Experience", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Continue to JD analysis" }).click();
  await page.getByLabel("Company").fill("QA Data Corp");
  await page.getByLabel("Role").fill("Lead Data Engineer");
  await page.getByLabel("Job description").fill([
    "Lead Data Engineer role",
    "Must have SQL, Python, Airflow, dbt, Snowflake",
    "Own orchestration and warehouse reliability",
    "Partner with analytics and BI teams"
  ].join("\n"));
  await page.getByRole("button", { name: "Analyze JD" }).click();
  await expect(page.getByText(/snowflake/i).first()).toBeVisible();
  await page.getByRole("button", { name: "Generate tailoring session" }).click();
  await expect(page.getByRole("heading", { name: "Tailoring workspace" })).toBeVisible();
  await page.getByRole("button", { name: "Accept change" }).click();
  await page.getByRole("button", { name: "Edit manually" }).click();
  await page.getByLabel("Manual edit").fill("Built Python and SQL ELT pipelines for finance reporting workloads with clear data-platform ownership.");
  await page.getByRole("button", { name: "Save manual edit" }).click();
  await page.getByRole("button", { name: "Copy section" }).click();
  await expect(page.getByText(/Copied the tailored experience section/i)).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export PDF" }).click();
  const download = await downloadPromise;
  expect(await download.suggestedFilename()).toMatch(/\.pdf$/);

  await page.getByRole("link", { name: /Privacy/i }).first().click();
  await page.getByRole("button", { name: "Clear stored resume data" }).click();
  await expect(page.getByText(/Cleared the stored resume and tailoring session data/i)).toBeVisible();

  await page.getByRole("button", { name: "Start new" }).click();
  await page.goto("/workspace");
  await expect(page.getByText(/No tailoring session yet/i)).toBeVisible();

  await page.getByRole("link", { name: /History/i }).first().click();
  await expect(page.getByRole("button", { name: "Restore" }).first()).toBeVisible();
});

test("DOCX upload processes successfully", async ({ page }) => {
  await signIn(page, { email: "docx-user@prooffit.ai" });
  await page.goto("/upload");

  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Choose file" }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    name: "resume.docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    buffer: await buildDocxResumeBuffer()
  });

  await page.getByRole("button", { name: "Process resume" }).click();
  await expect(page.getByText(/Deletion plan/i)).toBeVisible();
  await expect(page.getByText(/Summary/i).first()).toBeVisible();
  await expect(page.getByText(/Experience/i).first()).toBeVisible();
});

test("pasted resume text can be processed and cleared", async ({ page }) => {
  await signIn(page, { email: "text-user@prooffit.ai" });
  await page.goto("/upload");

  await page.getByLabel("Or paste resume text").fill([
    "Morgan Builder",
    "SUMMARY",
    "Data engineer focused on SQL, Python, and warehouse reliability.",
    "EXPERIENCE",
    "- Built Python and SQL ELT pipelines for weekly finance reporting."
  ].join("\n"));

  await page.getByRole("button", { name: "Process resume" }).click();
  await expect(page.getByText(/Deletion plan/i)).toBeVisible();
  await expect(page.getByText(/Morgan Builder/i)).toBeVisible();

  await page.getByRole("button", { name: "Clear current upload" }).click();
  await expect(page.getByText(/Upload a resume or paste text to see the structured preview here/i)).toBeVisible();
});
