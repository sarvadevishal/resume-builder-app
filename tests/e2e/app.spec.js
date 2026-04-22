const { test, expect } = require("@playwright/test");
const path = require("node:path");

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

test("google continue signs the user in", async ({ page }) => {
  await signIn(page, { provider: "google" });
  await expect(page.getByRole("main").getByText("google-user@prooffit.ai", { exact: true })).toBeVisible();
});

test("resume upload, JD analysis, workspace, export, settings, and history work together", async ({ page }) => {
  await signIn(page);

  await page.getByRole("link", { name: /Resume upload/i }).click();
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Choose file" }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(path.join(process.cwd(), "tests", "fixtures", "sample-resume.txt"));
  await page.getByRole("button", { name: "Process resume" }).click();
  await expect(page.getByText(/Deletion plan/i)).toBeVisible();
  await expect(page.getByText(/Experience/i)).toBeVisible();

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
  await expect(page.getByText("Snowflake", { exact: true }).first()).toBeVisible();
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

  await page.getByRole("link", { name: /History/i }).first().click();
  await expect(page.getByRole("button", { name: "Restore" }).first()).toBeVisible();
});
