const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/e2e",
  timeout: 60000,
  use: {
    baseURL: "http://localhost:3001",
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
    command: "powershell -Command \"$env:NEXT_PUBLIC_FORCE_DEMO_AUTH='true'; npm.cmd run dev -- --port 3001\"",
    url: "http://localhost:3001",
    reuseExistingServer: false,
    timeout: 120000
  }
});
