const { defineConfig, devices } = require("@playwright/test");

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3001";
const webServerCommand =
  process.env.PLAYWRIGHT_SERVER_COMMAND ||
  "powershell -Command \"$env:NEXT_PUBLIC_FORCE_DEMO_AUTH='true'; npm.cmd run build; npm.cmd run start -- --port 3001\"";
const reuseExistingServer = process.env.PLAYWRIGHT_REUSE_SERVER === "true";

module.exports = defineConfig({
  testDir: "./tests/e2e",
  timeout: 60000,
  use: {
    baseURL,
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    acceptDownloads: true,
    permissions: ["clipboard-read", "clipboard-write"]
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"]
      }
    }
  ],
  webServer: {
    command: webServerCommand,
    url: baseURL,
    reuseExistingServer,
    timeout: 120000
  }
});
